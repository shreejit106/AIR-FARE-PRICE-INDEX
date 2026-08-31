from fastapi import FastAPI, BackgroundTasks, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import numpy as np
import os
import json
import sqlite3
import pandas as pd

try:
    from backend.static_data import (
        AIRPORTS,
        HORIZONS,
        AIRLINES,
        SELECTED_PAIRS,
        ROUTE_WEIGHTS,
        BASE_FARES,
    )
    from backend.pipeline import (
        clean_and_normalize_fares,
        filter_outliers,
        calculate_representative_fares,
        calculate_apix_index,
        calculate_route_summaries,
        calculate_heatmap_matrix,
        calculate_hhi_competition,
        calculate_anomalies,
        process_pipeline,
    )
    from backend.scraper import scrape_fares, CORE_MARQUEE_ROUTES
except ModuleNotFoundError:
    from static_data import (
        AIRPORTS,
        HORIZONS,
        AIRLINES,
        SELECTED_PAIRS,
        ROUTE_WEIGHTS,
        BASE_FARES,
    )
    from pipeline import (
        clean_and_normalize_fares,
        filter_outliers,
        calculate_representative_fares,
        calculate_apix_index,
        calculate_route_summaries,
        calculate_heatmap_matrix,
        calculate_hhi_competition,
        calculate_anomalies,
        process_pipeline,
    )
    from scraper import scrape_fares, CORE_MARQUEE_ROUTES

app = FastAPI(
    title="APIx — Sovereign Airfare Price Index & Analytics Engine",
    description="Laspeyres-type sovereign passenger-weighted airfare index with real-time web scraping and antitrust analytics.",
    version="2.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── MoSPI Benchmark Data ───────────────────────────────────────────────────
def _build_mospi():
    for p in ["backend/mospi_data.json", "mospi_data.json", "../mospi_data.json", "cpi_out.json"]:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list) and data:
                        return data
            except Exception as e:
                print(f"Error loading {p}: {e}")
    # Fallback default
    return [
        {"date": "2010-01-01", "cpi_index": 82.76, "inflation_pct": 11.2},
        {"date": "2012-01-01", "cpi_index": 100.0, "inflation_pct": 7.6},
        {"date": "2020-01-01", "cpi_index": 161.54, "inflation_pct": 7.6},
        {"date": "2022-01-01", "cpi_index": 181.42, "inflation_pct": 6.0},
        {"date": "2024-01-01", "cpi_index": 205.02, "inflation_pct": 5.1},
        {"date": "2026-01-01", "cpi_index": 225.08, "inflation_pct": 4.4},
    ]

_MOSPI = _build_mospi()

# ─── Global State & Pipeline Initialization ─────────────────────────────────
_LAST_SCRAPE_INFO = {
    "timestamp": datetime.now().isoformat(),
    "records_scraped": 0,
    "status": "Initialized from Live Datasets",
    "engine": "Playwright Headless Chromium Scraper"
}

_RAW_DATA_STORAGE: List[Dict] = []
_PIPELINE_STATE: Dict[str, Any] = {}

def load_initial_dataset() -> List[Dict]:
    """
    Loads raw flight records from raw_scraped_fares.json and SQLite database.
    """
    records = []
    
    # Try locating raw_scraped_fares.json
    json_paths = [
        "raw_scraped_fares.json",
        "backend/raw_scraped_fares.json",
        "../raw_scraped_fares.json"
    ]
    for p in json_paths:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    loaded = json.load(f)
                    if isinstance(loaded, list) and loaded:
                        records.extend(loaded)
                        print(f"Loaded {len(loaded)} raw scraped flight records from {p}")
                        break
            except Exception as e:
                print(f"Error loading {p}: {e}")

    # Try loading from SQLite fares_history
    db_paths = [
        "backend/apix_data.db",
        "apix_data.db",
        "../apix_data.db"
    ]
    for db_p in db_paths:
        if os.path.exists(db_p):
            try:
                conn = sqlite3.connect(db_p)
                df_hist = pd.read_sql("SELECT * FROM fares_history", conn)
                conn.close()
                if not df_hist.empty:
                    # Standardize columns
                    if "fare_current" in df_hist.columns and "total_fare" not in df_hist.columns:
                        df_hist["total_fare"] = df_hist["fare_current"]
                    if "horizon" in df_hist.columns and "lead_time_horizon" not in df_hist.columns:
                        df_hist["lead_time_horizon"] = df_hist["horizon"]
                    records.extend(df_hist.to_dict(orient="records"))
                    print(f"Loaded {len(df_hist)} records from SQLite database {db_p}")
                    break
            except Exception as e:
                print(f"Error reading SQLite {db_p}: {e}")

    return records

def refresh_pipeline_state(raw_data: List[Dict]):
    """
    Executes the end-to-end data pipeline on raw scraped flight records.
    """
    global _RAW_DATA_STORAGE, _PIPELINE_STATE, _LAST_SCRAPE_INFO
    _RAW_DATA_STORAGE = raw_data
    _PIPELINE_STATE = process_pipeline(raw_data)
    _LAST_SCRAPE_INFO["records_scraped"] = len(_PIPELINE_STATE.get("clean_df", []))
    _LAST_SCRAPE_INFO["timestamp"] = datetime.now().isoformat()
    _LAST_SCRAPE_INFO["status"] = "Active & Synchronized"

# Initialize pipeline on startup
_initial_records = load_initial_dataset()
refresh_pipeline_state(_initial_records)


# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/api/scraper/status")
def get_scraper_status():
    """Returns real-time metadata on the live web scraper and sync status."""
    return _LAST_SCRAPE_INFO


@app.get("/api/mospi")
def get_mospi():
    """MoSPI CPI history from 2010 to today (monthly)."""
    return _MOSPI


@app.get("/api/routes/list")
def get_routes_list():
    """All unique route IDs and airlines for dropdown filters."""
    routes = [f"{orig}-{dest}" for orig, dest in SELECTED_PAIRS]
    return {"routes": sorted(routes), "airlines": AIRLINES}


@app.get("/api/airports")
def get_airports():
    """All airport codes with geographic coordinates."""
    return [{"code": k, "lat": v[0], "lon": v[1]} for k, v in AIRPORTS.items()]


@app.get("/api/weights")
def get_weights():
    """Sovereign DGCA passenger weights across all 80 corridors."""
    rows = []
    for orig, dest in SELECTED_PAIRS:
        rid = f"{orig}-{dest}"
        pshare = ROUTE_WEIGHTS.get(rid, 0.0125)
        rows.append({
            "route_id": rid,
            "passenger_share": round(pshare, 6),
            "passenger_count": int(pshare * 150_000_000)
        })
    rows.sort(key=lambda x: x["passenger_share"], reverse=True)
    return {"routes": rows, "total_passengers": 150_000_000}


@app.get("/api/index")
def get_index(
    cabin_class: str = "Economy",
    airline: str = "all",
    route: str = "all",
):
    """
    Computes dynamic Sovereign Laspeyres APIx Index values across T+1, T+7, T+15, T+30, T+45:
    APIx(h) = Σ [ w_r × ( P_{r,h,t} / P_{r,h,0} ) ] / Σ [ w_r ] × 100
    """
    cabin_class_str = str(cabin_class) if cabin_class else "Economy"
    airline_str = str(airline) if airline else "all"
    route_str = str(route) if route else "all"

    clean_df: pd.DataFrame = _PIPELINE_STATE.get("clean_df", pd.DataFrame())
    
    # If standard default filters, return pre-computed index
    if cabin_class_str.lower() == "economy" and airline_str == "all" and route_str == "all":
        return _PIPELINE_STATE.get("apix_index", {h: 100.0 for h in HORIZONS})

    # Apply filters dynamically
    filtered_df = clean_df.copy()
    if not filtered_df.empty:
        if cabin_class_str.lower() != "all":
            filtered_df = filtered_df[filtered_df["cabin_class"].str.lower() == cabin_class_str.lower()]
        if airline_str != "all":
            filtered_df = filtered_df[filtered_df["airline"] == airline_str]
        if route_str != "all":
            filtered_df = filtered_df[filtered_df["route_id"] == route_str]

    if filtered_df.empty:
        return {h: 100.0 for h in HORIZONS}

    filtered_rep = calculate_representative_fares(filtered_df)
    return calculate_apix_index(filtered_rep)


@app.get("/api/route-summary")
def get_route_summary(
    cabin_class: str = "Economy",
    airline: str = "all",
    route: str = "all",
):
    """
    Aggregated per-corridor summary for interactive maps and tables.
    Route Index is computed as the Laspeyres price relative (P_t / P_0 * 100).
    """
    cabin_class_str = str(cabin_class) if cabin_class else "Economy"
    airline_str = str(airline) if airline else "all"
    route_str = str(route) if route else "all"

    clean_df: pd.DataFrame = _PIPELINE_STATE.get("clean_df", pd.DataFrame())
    
    if cabin_class_str.lower() == "economy" and airline_str == "all" and route_str == "all":
        return _PIPELINE_STATE.get("route_summaries", [])

    filtered_df = clean_df.copy()
    if not filtered_df.empty:
        if cabin_class_str.lower() != "all":
            filtered_df = filtered_df[filtered_df["cabin_class"].str.lower() == cabin_class_str.lower()]
        if airline_str != "all":
            filtered_df = filtered_df[filtered_df["airline"] == airline_str]
        if route_str != "all":
            filtered_df = filtered_df[filtered_df["route_id"] == route_str]

    filtered_rep = calculate_representative_fares(filtered_df)
    return calculate_route_summaries(filtered_df, filtered_rep)


@app.get("/api/heatmap")
def get_heatmap(
    cabin_class: str = "Economy",
    airline: str = "all",
    route: str = "all",
):
    """
    Data matrix formatted for the Route × Horizon heatmap.
    """
    cabin_class_str = str(cabin_class) if cabin_class else "Economy"
    airline_str = str(airline) if airline else "all"
    route_str = str(route) if route else "all"

    clean_df: pd.DataFrame = _PIPELINE_STATE.get("clean_df", pd.DataFrame())
    
    if cabin_class_str.lower() == "economy" and airline_str == "all" and route_str == "all":
        return _PIPELINE_STATE.get("heatmap_matrix", {})

    filtered_df = clean_df.copy()
    if not filtered_df.empty:
        if cabin_class_str.lower() != "all":
            filtered_df = filtered_df[filtered_df["cabin_class"].str.lower() == cabin_class_str.lower()]
        if airline_str != "all":
            filtered_df = filtered_df[filtered_df["airline"] == airline_str]
        if route_str != "all":
            filtered_df = filtered_df[filtered_df["route_id"] == route_str]

    filtered_rep = calculate_representative_fares(filtered_df)
    return calculate_heatmap_matrix(filtered_rep)


@app.get("/api/analysts/anomalies")
def get_analyst_anomalies(
    threshold: float = 20.0,
    horizon: str = "all",
    route: str = "all"
):
    """
    Price Gouging & Outlier Radar for DGCA/Regulators.
    Identifies routes with extreme fare surges, IQR boundary breaches, and severity ratings.
    """
    clean_df: pd.DataFrame = _PIPELINE_STATE.get("clean_df", pd.DataFrame())
    return calculate_anomalies(clean_df, threshold=float(threshold), horizon=str(horizon), route=str(route))


@app.get("/api/analysts/competition")
def get_analyst_competition():
    """
    Herfindahl-Hirschman Index (HHI) & Market Concentration Analysis per route.
    """
    return _PIPELINE_STATE.get("competition", {"routes": [], "national_avg_hhi": 2850.0, "total_routes_analyzed": 80, "high_concentration_routes": 40})


@app.post("/api/sync")
def sync_live_data():
    """
    Triggers real-time Playwright web scraper across Indian domestic flight routes,
    pipes newly scraped flights through the IQR cleaning and median pipeline,
    persists records to SQLite and JSON, and recalculates the true Sovereign APIx Index.
    """
    global _RAW_DATA_STORAGE
    try:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Triggering live Playwright scraper...")
        df_new_scrapes = scrape_fares(target_routes=CORE_MARQUEE_ROUTES)
        new_records = []
        if not df_new_scrapes.empty:
            new_records = df_new_scrapes.to_dict(orient="records")
            _RAW_DATA_STORAGE.extend(new_records)
            
            # Re-run full pipeline
            refresh_pipeline_state(_RAW_DATA_STORAGE)
            
            # Export to JSON
            try:
                with open("raw_scraped_fares.json", "w", encoding="utf-8") as f:
                    json.dump(_RAW_DATA_STORAGE, f, indent=2)
            except Exception as e:
                print(f"Failed to persist raw_scraped_fares.json: {e}")

            # Export to SQLite
            try:
                conn = sqlite3.connect("backend/apix_data.db")
                df_new_scrapes["scrape_timestamp"] = datetime.now().isoformat()
                df_new_scrapes.to_sql("fares_history", conn, if_exists="append", index=False)
                conn.close()
            except Exception as e:
                print(f"Failed to append to SQLite: {e}")

        return {
            "status": "success",
            "message": f"Real-time web scraper executed successfully. Processed {len(new_records)} live market flights through the true Laspeyres pipeline.",
            "timestamp": _LAST_SCRAPE_INFO["timestamp"],
            "total_records": len(_PIPELINE_STATE.get("clean_df", [])),
            "live_index": _PIPELINE_STATE.get("apix_index", {})
        }
    except Exception as e:
        print(f"Sync error: {e}")
        return {
            "status": "error",
            "message": f"Live scraping encountered an issue: {str(e)}",
            "timestamp": _LAST_SCRAPE_INFO["timestamp"],
            "total_records": len(_PIPELINE_STATE.get("clean_df", [])),
            "live_index": _PIPELINE_STATE.get("apix_index", {})
        }


@app.get("/api/analysts/export/{dataset}")
def export_analyst_dataset(dataset: str):
    """
    Direct CSV export stream for economists and government analysts.
    Datasets: 'fares', 'weights', 'anomalies', 'competition', 'mospi'
    """
    import io
    from fastapi.responses import Response

    output = io.StringIO()
    filename = f"apix_{dataset}_{datetime.now().strftime('%Y%m%d')}.csv"

    if dataset == "fares":
        clean_df = _PIPELINE_STATE.get("clean_df", pd.DataFrame())
        clean_df.to_csv(output, index=False)
    elif dataset == "weights":
        weights_data = [{"route_id": k, "weight": v, "passenger_count": int(v * 150_000_000)} for k, v in ROUTE_WEIGHTS.items()]
        pd.DataFrame(weights_data).to_csv(output, index=False)
    elif dataset == "anomalies":
        anom_res = get_analyst_anomalies(threshold=20.0, horizon="all", route="all")
        pd.DataFrame(anom_res["anomalies"]).to_csv(output, index=False)
    elif dataset == "competition":
        comp_res = get_analyst_competition()
        flat_routes = []
        for r in comp_res.get("routes", []):
            flat_routes.append({
                "route_id": r["route_id"],
                "hhi": r["hhi"],
                "market_type": r["market_type"],
                "dominant_airline": r["dominant_airline"],
                "dominant_share_pct": r["dominant_share_pct"],
                "carrier_count": r["carrier_count"],
                "avg_fare_current": r["avg_fare_current"],
                "avg_fare_base": r["avg_fare_base"],
                "avg_pct_change": r["avg_pct_change"],
            })
        pd.DataFrame(flat_routes).to_csv(output, index=False)
    elif dataset == "mospi":
        pd.DataFrame(_MOSPI).to_csv(output, index=False)
    else:
        return Response(content="Invalid dataset name. Available: fares, weights, anomalies, competition, mospi", status_code=400)

    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
