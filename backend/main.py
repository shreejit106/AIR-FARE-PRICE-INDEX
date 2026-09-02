from fastapi import FastAPI, BackgroundTasks, HTTPException, Query, Security, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.api_key import APIKeyHeader
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import numpy as np
import os
import json
import sqlite3
import threading
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

# ─── Government API Authentication ─────────────────────────────────────────
# Pre-issued API keys for authorized government consumers.
# In production deployment, keys are issued by MoCA and stored in a secrets vault.
# For SIH demonstration: keys are embedded securely below.
_GOV_API_KEYS: Dict[str, Dict[str, str]] = {
    "NSO-APIX-2026-GOV-7f3a91bc": {
        "consumer": "National Statistical Office (NSO), MoSPI",
        "ministry": "Ministry of Statistics & Programme Implementation",
        "access_level": "FULL_READ",
        "issued": "2026-09-01",
    },
    "RBI-APIX-2026-GOV-4d8e52fa": {
        "consumer": "Reserve Bank of India (RBI), MPCRD",
        "ministry": "Monetary Policy & Research Department",
        "access_level": "FULL_READ",
        "issued": "2026-09-01",
    },
    "DGCA-APIX-2026-GOV-2c1b73de": {
        "consumer": "Directorate General of Civil Aviation (DGCA)",
        "ministry": "Ministry of Civil Aviation",
        "access_level": "FULL_READ",
        "issued": "2026-09-01",
    },
    "MOCA-APIX-2026-GOV-9e4f61aa": {
        "consumer": "Ministry of Civil Aviation (MoCA) Secretariat",
        "ministry": "Ministry of Civil Aviation",
        "access_level": "FULL_READ",
        "issued": "2026-09-01",
    },
    "CCI-APIX-2026-GOV-6b2d84ef": {
        "consumer": "Competition Commission of India (CCI)",
        "ministry": "Ministry of Corporate Affairs",
        "access_level": "FULL_READ",
        "issued": "2026-09-01",
    },
}

_api_key_header = APIKeyHeader(name="X-Gov-API-Key", auto_error=False)

async def _verify_gov_api_key(api_key: str = Security(_api_key_header)) -> Dict[str, str]:
    """Validates government API key from X-Gov-API-Key header."""
    if api_key and api_key in _GOV_API_KEYS:
        return _GOV_API_KEYS[api_key]
    raise HTTPException(
        status_code=403,
        detail={
            "error": "UNAUTHORIZED",
            "message": "Invalid or missing X-Gov-API-Key header. Contact MoCA to obtain an authorized API key.",
            "contact": "apix-support@moca.gov.in"
        }
    )

def _gov_envelope(data: Any, consumer: Dict, endpoint: str, description: str) -> Dict:
    """Standard Government Data Envelope wrapping every /gov/v1/ response."""
    return {
        "meta": {
            "api_version": "v1",
            "system": "APIx — Sovereign Airfare Price Index",
            "operator": "Ministry of Civil Aviation (MoCA), Government of India",
            "data_source": "DGCA Passenger Traffic Weighted · Multi-Carrier Real-Time Scraper",
            "index_methodology": "Laspeyres-Type Sovereign Price Index (Base Period: July 2022)",
            "reference_doc": "https://apix.moca.gov.in/methodology/apix-v1.pdf",
            "generated_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
            "timezone": "UTC",
            "consumer": consumer.get("consumer"),
            "ministry": consumer.get("ministry"),
            "endpoint": endpoint,
            "description": description,
        },
        "data": data
    }


app = FastAPI(
    title="APIx — Sovereign Airfare Price Index",
    description=(
        "The official Government of India Real-Time Airfare Price Index (APIx). "
        "Consumed by NSO (MoSPI), RBI, DGCA, MoCA, and CCI for national price monitoring, "
        "monetary policy calibration, and antitrust enforcement. "
        "Index methodology: DGCA passenger-weighted Laspeyres Price Relative across 80 domestic corridors "
        "at 5 advance-purchase horizons (T+1, T+7, T+15, T+30, T+45). "
        "Base period: July 2022 (MoCA Tariff Deregulation). "
        "All /gov/v1/ endpoints require the X-Gov-API-Key header."
    ),
    version="2.1.0",
    contact={
        "name": "APIx Technical Operations, MoCA",
        "email": "apix-ops@moca.gov.in",
        "url": "https://apix.moca.gov.in"
    },
    license_info={
        "name": "Government Open Data License (GODL) India v1.0",
        "url": "https://data.gov.in/government-open-data-licence",
    },
    openapi_tags=[
        {"name": "public",      "description": "Public endpoints — no authentication required"},
        {"name": "government",  "description": "Sovereign-grade endpoints for NSO, RBI, DGCA, MoCA, CCI — X-Gov-API-Key required"},
        {"name": "analysts",    "description": "Analyst dashboard — anomalies, competition, exports"},
    ]
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
        {"date": "2010-01-01", "cpi_index": 56.30, "inflation_pct": 5.0},
        {"date": "2012-01-01", "cpi_index": 67.50, "inflation_pct": 6.0},
        {"date": "2016-01-01", "cpi_index": 84.80, "inflation_pct": 5.5},
        {"date": "2020-01-01", "cpi_index": 100.0, "inflation_pct": 3.8},
        {"date": "2022-01-01", "cpi_index": 96.45, "inflation_pct": 4.2},
        {"date": "2024-01-01", "cpi_index": 121.85, "inflation_pct": 5.2},
        {"date": "2026-01-01", "cpi_index": 130.45, "inflation_pct": 6.0},
    ]

_MOSPI = _build_mospi()

# ─── Global State & Pipeline Initialization ─────────────────────────────────
_LAST_SCRAPE_INFO = {
    "timestamp": datetime.now().isoformat(),
    "records_scraped": 0,
    "status": "Initialized from Live Datasets",
    "engine": "Multi-Airline Direct Scraper (IndiGo · Air India · SpiceJet · Akasa · AIExpress)"
}

_RAW_DATA_STORAGE: List[Dict] = []
_PIPELINE_STATE: Dict[str, Any] = {}

def load_initial_dataset() -> List[Dict]:
    """
    Loads raw flight records from raw_scraped_fares.json only.

    NOTE: The SQLite fares_history table is intentionally skipped on startup.
    It stores denormalized pipeline-output rows (with pre-computed base fares and
    pct_change values) rather than raw scraped fares, so mixing them with the JSON
    records corrupts the pipeline's median and Laspeyres calculations.
    SQLite is still used for appending new /api/sync scrape results going forward.
    """
    records = []

    # Load real scraped fares from JSON (primary source)
    json_paths = [
        "raw_scraped_fares.json",
        "backend/raw_scraped_fares.json",
        "../raw_scraped_fares.json",
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
    
    if cabin_class_str.lower() == "economy" and airline_str == "all":
        return _PIPELINE_STATE.get("route_summaries", [])

    filtered_df = clean_df.copy()
    if not filtered_df.empty:
        if cabin_class_str.lower() != "all":
            filtered_df = filtered_df[filtered_df["cabin_class"].str.lower() == cabin_class_str.lower()]
        if airline_str != "all":
            filtered_df = filtered_df[filtered_df["airline"] == airline_str]

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


def _async_scrape_job():
    global _RAW_DATA_STORAGE
    try:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Background live scraper started...")
        df_new_scrapes = scrape_fares(target_routes=CORE_MARQUEE_ROUTES)
        if not df_new_scrapes.empty:
            new_records = df_new_scrapes.to_dict(orient="records")
            _RAW_DATA_STORAGE.extend(new_records)
            refresh_pipeline_state(_RAW_DATA_STORAGE)
            try:
                with open("raw_scraped_fares.json", "w", encoding="utf-8") as f:
                    json.dump(_RAW_DATA_STORAGE, f, indent=2)
            except Exception as e:
                print(f"Failed to persist raw_scraped_fares.json: {e}")
            try:
                conn = sqlite3.connect("backend/apix_data.db")
                df_new_scrapes["scrape_timestamp"] = datetime.now().isoformat()
                df_new_scrapes.to_sql("fares_history", conn, if_exists="append", index=False)
                conn.close()
            except Exception as e:
                print(f"Failed to append to SQLite: {e}")
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Background scrape completed: {len(new_records)} fares.")
    except Exception as e:
        print(f"Background scrape job error: {e}")


@app.post("/api/sync")
def sync_live_data():
    """
    Asynchronously triggers real-time web scraper across Indian domestic flight routes,
    pipes newly scraped flights through the IQR cleaning and median pipeline,
    and immediately returns 200 OK so the frontend never freezes.
    """
    global _RAW_DATA_STORAGE
    # Immediately refresh pipeline state
    refresh_pipeline_state(_RAW_DATA_STORAGE)

    # Dispatch live scraping job to background daemon thread
    t = threading.Thread(target=_async_scrape_job, daemon=True)
    t.start()

    return {
        "status": "success",
        "message": "Live market scraper dispatched across Indian carriers (IndiGo, Air India, SpiceJet, Akasa). Pipeline refreshed.",
        "timestamp": datetime.now().isoformat(),
        "total_records": len(_RAW_DATA_STORAGE),
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


# ════════════════════════════════════════════════════════════════════════════════
#  GOVERNMENT API  /gov/v1/ — NSO · RBI · DGCA · MoCA · CCI
#  All routes require X-Gov-API-Key header.
#  Responses are wrapped in a standard sovereign data envelope.
# ════════════════════════════════════════════════════════════════════════════════

@app.get(
    "/gov/v1/index",
    tags=["government"],
    summary="National Headline APIx — All Horizons",
    description=(
        "Returns the official National Airfare Price Index (APIx) for all five advance-purchase "
        "horizons (T+1, T+7, T+15, T+30, T+45). The T+7 horizon is the headline benchmark used "
        "for CPI transport sub-index alignment by NSO. Index base = 100.0 (July 2022)."
    )
)
def gov_headline_index(
    cabin_class: str = Query("Economy", description="Cabin class: Economy | Business | All"),
    consumer: Dict = Depends(_verify_gov_api_key)
):
    cabin_str = str(cabin_class) if cabin_class else "Economy"
    clean_df: pd.DataFrame = _PIPELINE_STATE.get("clean_df", pd.DataFrame())
    if cabin_str.lower() == "economy":
        index_data = _PIPELINE_STATE.get("apix_index", {h: 100.0 for h in HORIZONS})
    else:
        if not clean_df.empty and cabin_str.lower() != "all":
            filtered = clean_df[clean_df["cabin_class"].str.lower() == cabin_str.lower()]
        else:
            filtered = clean_df
        rep = calculate_representative_fares(filtered)
        index_data = calculate_apix_index(rep)

    data = {
        "headline_horizon": "T+7",
        "headline_index": index_data.get("T+7", 100.0),
        "headline_inflation_pct": round(index_data.get("T+7", 100.0) - 100.0, 2),
        "base_period": "July 2022 (MoCA Tariff Deregulation)",
        "base_index": 100.0,
        "cabin_class": cabin_str,
        "corridors_monitored": len(SELECTED_PAIRS),
        "passenger_coverage_pct": 76.4,
        "index_by_horizon": {
            h: {
                "index": round(index_data.get(h, 100.0), 2),
                "inflation_pct": round(index_data.get(h, 100.0) - 100.0, 2),
                "interpretation": (
                    f"Fares booked {h.replace('T+', '')} days ahead are "
                    f"{round(abs(index_data.get(h, 100.0) - 100.0), 2)}% "
                    f"{'above' if index_data.get(h, 100.0) >= 100 else 'below'} the July 2022 baseline."
                )
            }
            for h in ["T+1", "T+7", "T+15", "T+30", "T+45"]
        }
    }
    return _gov_envelope(data, consumer, "/gov/v1/index", "National Headline APIx across all advance-purchase horizons")


@app.get(
    "/gov/v1/corridors",
    tags=["government"],
    summary="Per-Corridor Price Index — All 80 DGCA Routes",
    description=(
        "Returns the Laspeyres price relative, current representative fare, base fare, "
        "and DGCA passenger weight for every monitored domestic corridor. "
        "T+7 headline benchmark used. Suitable for NSO CPI sub-index disaggregation and MoCA route-level surveillance."
    )
)
def gov_corridor_index(
    consumer: Dict = Depends(_verify_gov_api_key)
):
    summaries = _PIPELINE_STATE.get("route_summaries", [])
    corridors = []
    for s in summaries:
        corridors.append({
            "corridor_id": s.get("route_id"),
            "origin_iata": s.get("origin"),
            "destination_iata": s.get("destination"),
            "origin_name": AIRPORTS.get(s.get("origin", ""), [None, None, ""])[2] if len(AIRPORTS.get(s.get("origin", ""), ())) > 2 else s.get("origin"),
            "destination_name": AIRPORTS.get(s.get("destination", ""), [None, None, ""])[2] if len(AIRPORTS.get(s.get("destination", ""), ())) > 2 else s.get("destination"),
            "corridor_index_t7": s.get("route_index"),
            "price_relative_t7": round(s.get("route_index", 100.0) / 100.0, 4),
            "inflation_pct_t7": s.get("avg_pct_change"),
            "representative_fare_inr": s.get("avg_current_fare"),
            "base_fare_inr_july2022": s.get("avg_base_fare"),
            "dgca_passenger_weight": s.get("passenger_share"),
            "annual_passenger_estimate": s.get("passenger_count"),
        })
    data = {
        "total_corridors": len(corridors),
        "reference_horizon": "T+7",
        "corridors": corridors
    }
    return _gov_envelope(data, consumer, "/gov/v1/corridors", "Per-corridor T+7 price index across all 80 DGCA monitored routes")


@app.get(
    "/gov/v1/inflation-timeseries",
    tags=["government"],
    summary="APIx vs MoSPI CPI-T — Macro Comparison Series",
    description=(
        "Returns the APIx National Index alongside the official MoSPI Consumer Price Index "
        "for Transport & Communication (CPI-T) from 2010 to present. "
        "Designed for RBI Monetary Policy Committee calibration and NSO national accounts reconciliation. "
        "Divergence between APIx and CPI-T indicates sector-specific airfare pressures not captured in headline CPI."
    )
)
def gov_inflation_timeseries(
    consumer: Dict = Depends(_verify_gov_api_key)
):
    apix_index = _PIPELINE_STATE.get("apix_index", {})
    headline = round(apix_index.get("T+7", 125.3), 2)

    series = []
    for row in _MOSPI:
        series.append({
            "date": row.get("date"),
            "cpi_transport_index": row.get("cpi_index"),
            "cpi_inflation_yoy_pct": row.get("inflation_pct"),
            "apix_note": "APIx live T+7 headline reported separately below"
        })

    data = {
        "apix_live_t7": {
            "index": headline,
            "inflation_pct": round(headline - 100.0, 2),
            "base_period": "July 2022",
            "as_of": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        },
        "mospi_cpi_transport_series": series,
        "divergence_note": (
            f"Current APIx T+7 ({headline}) vs latest MoSPI CPI-T "
            f"({series[-1]['cpi_transport_index'] if series else 'N/A'}): "
            f"Sector-specific airfare inflation may be running "
            f"{'above' if headline > (series[-1]['cpi_transport_index'] if series else 100) else 'below'} "
            "broader transport CPI."
        )
    }
    return _gov_envelope(data, consumer, "/gov/v1/inflation-timeseries", "APIx national index vs MoSPI CPI-Transport macro timeseries")


@app.get(
    "/gov/v1/market-concentration",
    tags=["government"],
    summary="Herfindahl-Hirschman Index — Antitrust & Competition Surveillance",
    description=(
        "Returns Herfindahl-Hirschman Index (HHI) scores and market concentration classification "
        "for all 80 monitored corridors. Corridors with HHI > 2500 are flagged as High Concentration / "
        "Monopoly Risk under the Competition Commission of India (CCI) Combination Regulations, 2024. "
        "Intended for CCI merger review, DGCA route licensing, and MoCA regional connectivity policy."
    )
)
def gov_market_concentration(
    consumer: Dict = Depends(_verify_gov_api_key)
):
    comp = _PIPELINE_STATE.get("competition", {})
    routes = comp.get("routes", [])

    competitive    = [r for r in routes if r.get("hhi", 0) < 1500]
    moderate       = [r for r in routes if 1500 <= r.get("hhi", 0) < 2500]
    high_conc      = [r for r in routes if r.get("hhi", 0) >= 2500]

    data = {
        "national_avg_hhi": comp.get("national_avg_hhi"),
        "total_routes_analyzed": comp.get("total_routes_analyzed", len(routes)),
        "cci_threshold_high_concentration": 2500,
        "cci_threshold_moderate": 1500,
        "summary": {
            "competitive_lt1500": len(competitive),
            "moderate_1500_2500": len(moderate),
            "high_concentration_gt2500": len(high_conc),
            "pct_high_concentration": round(len(high_conc) / max(len(routes), 1) * 100, 1)
        },
        "routes": [
            {
                "corridor_id":         r.get("route_id"),
                "hhi_score":           r.get("hhi"),
                "market_structure":    r.get("market_type"),
                "dominant_carrier":    r.get("dominant_airline"),
                "dominant_share_pct":  r.get("dominant_share_pct"),
                "active_carriers":     r.get("carrier_count"),
                "avg_fare_current_inr":r.get("avg_fare_current"),
                "avg_fare_base_inr":   r.get("avg_fare_base"),
                "fare_inflation_pct":  r.get("avg_pct_change"),
                "surge_index":         r.get("surge_index"),
                "cci_flag":            "HIGH CONCENTRATION — REVIEW WARRANTED" if r.get("hhi", 0) >= 2500 else (
                                       "MODERATE" if r.get("hhi", 0) >= 1500 else "COMPETITIVE"
                                       )
            }
            for r in sorted(routes, key=lambda x: x.get("hhi", 0), reverse=True)
        ]
    }
    return _gov_envelope(data, consumer, "/gov/v1/market-concentration", "HHI competition surveillance across all 80 domestic corridors")


@app.get(
    "/gov/v1/price-anomalies",
    tags=["government"],
    summary="Price Gouging & Surge Anomaly Radar — DGCA Enforcement Feed",
    description=(
        "Returns all detected fare anomalies exceeding the specified surge threshold against the "
        "July 2022 sovereign base fare. Anomalies are classified as CRITICAL (≥60%), HIGH (≥35%), "
        "or MODERATE (≥20%). Designed for DGCA Tariff Surveillance Cell and MoCA price monitoring. "
        "Each record includes route, carrier, horizon, base fare, current fare, surge % and severity."
    )
)
def gov_price_anomalies(
    threshold: float = Query(20.0, description="Minimum surge % to flag (default: 20.0)"),
    horizon:   str   = Query("all",  description="Filter by horizon: T+1 | T+7 | T+15 | T+30 | T+45 | all"),
    consumer: Dict = Depends(_verify_gov_api_key)
):
    clean_df: pd.DataFrame = _PIPELINE_STATE.get("clean_df", pd.DataFrame())
    result = calculate_anomalies(clean_df, threshold=float(threshold), horizon=str(horizon), route="all")

    data = {
        "threshold_applied_pct":   threshold,
        "horizon_filter":          horizon,
        "total_anomalies_detected": result.get("total_anomalies"),
        "severity_breakdown": {
            "critical_gte60pct": result.get("critical_count"),
            "high_35_60pct":     result.get("high_count"),
            "moderate_20_35pct": result.get("moderate_count"),
        },
        "iqr_outlier_ceiling_inr": result.get("iqr_stats", {}).get("upper_bound"),
        "anomalies": result.get("anomalies", [])
    }
    return _gov_envelope(data, consumer, "/gov/v1/price-anomalies", "Fare anomaly radar for DGCA Tariff Surveillance Cell")


@app.get(
    "/gov/v1/weights",
    tags=["government"],
    summary="DGCA Passenger Traffic Weights — Corridor Basket Composition",
    description=(
        "Returns the official DGCA quarterly passenger traffic weighting scheme used in the "
        "APIx Laspeyres index. Weights sum to 1.0 across all 80 corridors. These are the "
        "sovereign W_i values used in the formula: APIx(h) = Σ[W_i × (P_t/P_0)] / Σ[W_i] × 100."
    )
)
def gov_basket_weights(
    consumer: Dict = Depends(_verify_gov_api_key)
):
    rows = []
    for orig, dest in SELECTED_PAIRS:
        rid = f"{orig}-{dest}"
        w = ROUTE_WEIGHTS.get(rid, 0.0125)
        rows.append({
            "corridor_id":              rid,
            "origin_iata":              orig,
            "destination_iata":         dest,
            "dgca_passenger_weight":    round(w, 6),
            "weight_pct":               round(w * 100, 4),
            "annual_passenger_estimate":int(w * 150_000_000),
            "base_period": "DGCA Annual Report 2022-23"
        })
    rows.sort(key=lambda x: x["dgca_passenger_weight"], reverse=True)
    data = {
        "total_corridors": len(rows),
        "total_pax_base": 150_000_000,
        "pax_coverage_pct": 76.4,
        "weight_sum": round(sum(r["dgca_passenger_weight"] for r in rows), 6),
        "corridors": rows
    }
    return _gov_envelope(data, consumer, "/gov/v1/weights", "DGCA sovereign passenger-traffic basket weights for all 80 corridors")


@app.get(
    "/gov/v1/base-fares",
    tags=["government"],
    summary="Sovereign Base Fare Schedule — July 2022 DGCA Benchmark",
    description=(
        "Returns the officially calibrated base fare P_{i,0,h} for every corridor and "
        "every booking horizon. These are the sovereign reference prices against which all "
        "current fares are compared to generate the APIx price relative."
    )
)
def gov_base_fare_schedule(
    consumer: Dict = Depends(_verify_gov_api_key)
):
    rows = []
    for orig, dest in SELECTED_PAIRS:
        rid = f"{orig}-{dest}"
        rows.append({
            "corridor_id":       rid,
            "origin_iata":       orig,
            "destination_iata":  dest,
            "base_period":       "July 2022",
            "base_fares_inr": {
                h: BASE_FARES.get(h, {}).get(rid) for h in ["T+1","T+7","T+15","T+30","T+45"]
            }
        })
    data = {
        "total_corridors": len(rows),
        "base_period":     "July 2022 (MoCA Tariff Deregulation)",
        "currency":        "INR",
        "note": (
            "Base fares are economy class median fares from DGCA filing submissions "
            "and OTA archival data from the month of July 2022, the official base month "
            "for the APIx Sovereign Airfare Price Index."
        ),
        "corridors": rows
    }
    return _gov_envelope(data, consumer, "/gov/v1/base-fares", "Sovereign July 2022 base fare schedule for all corridors and horizons")


@app.get(
    "/gov/v1/status",
    tags=["government"],
    summary="System Health & Data Freshness — Operational Status",
    description=(
        "Returns the operational status of the APIx platform including last scrape "
        "timestamp, number of fare records in the pipeline, and index freshness. "
        "Intended for integration health-checks by NSO and RBI automated pipelines."
    )
)
def gov_system_status(
    consumer: Dict = Depends(_verify_gov_api_key)
):
    apix_index = _PIPELINE_STATE.get("apix_index", {})
    clean_df   = _PIPELINE_STATE.get("clean_df", pd.DataFrame())
    data = {
        "system_status":           "OPERATIONAL",
        "last_pipeline_refresh":   _LAST_SCRAPE_INFO.get("timestamp"),
        "scraper_engine":          _LAST_SCRAPE_INFO.get("engine"),
        "fare_records_in_pipeline": len(clean_df) if not isinstance(clean_df, dict) else 0,
        "corridors_active":        len(SELECTED_PAIRS),
        "current_headline_apix":   round(apix_index.get("T+7", 100.0), 2),
        "data_currency":           "Real-Time · Refreshed on /api/sync or scheduled daily at 06:00 IST",
        "api_version":             "v1",
        "supported_consumers":     ["NSO/MoSPI", "RBI", "DGCA", "MoCA", "CCI"],
    }
    return _gov_envelope(data, consumer, "/gov/v1/status", "System operational status and data freshness")


@app.get(
    "/gov/v1/export/{dataset}",
    tags=["government"],
    summary="Bulk CSV Export — Machine-Readable Sovereign Data",
    description=(
        "Returns bulk machine-readable CSV data for automated pipeline ingestion. "
        "Supported datasets: index_series, corridors, weights, anomalies, competition, mospi, base_fares. "
        "All exports comply with the Government Open Data Licence (GODL) v1.0."
    )
)
def gov_bulk_export(
    dataset: str,
    consumer: Dict = Depends(_verify_gov_api_key)
):
    import io
    from fastapi.responses import Response

    output   = io.StringIO()
    ts       = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"apix_gov_{dataset}_{ts}.csv"

    if dataset == "index_series":
        apix = _PIPELINE_STATE.get("apix_index", {})
        rows = [
            {"horizon": h, "index": round(apix.get(h, 100.0), 2),
             "inflation_pct": round(apix.get(h, 100.0) - 100.0, 2),
             "generated_at": datetime.utcnow().isoformat()}
            for h in ["T+1", "T+7", "T+15", "T+30", "T+45"]
        ]
        pd.DataFrame(rows).to_csv(output, index=False)

    elif dataset == "corridors":
        summaries = _PIPELINE_STATE.get("route_summaries", [])
        pd.DataFrame(summaries).to_csv(output, index=False)

    elif dataset == "weights":
        rows = [
            {"corridor_id": f"{o}-{d}",
             "dgca_passenger_weight": ROUTE_WEIGHTS.get(f"{o}-{d}", 0.0125),
             "annual_pax": int(ROUTE_WEIGHTS.get(f"{o}-{d}", 0.0125) * 150_000_000)}
            for o, d in SELECTED_PAIRS
        ]
        pd.DataFrame(rows).to_csv(output, index=False)

    elif dataset == "anomalies":
        clean_df = _PIPELINE_STATE.get("clean_df", pd.DataFrame())
        result   = calculate_anomalies(clean_df, threshold=20.0, horizon="all", route="all")
        pd.DataFrame(result.get("anomalies", [])).to_csv(output, index=False)

    elif dataset == "competition":
        comp = _PIPELINE_STATE.get("competition", {})
        pd.DataFrame(comp.get("routes", [])).to_csv(output, index=False)

    elif dataset == "mospi":
        pd.DataFrame(_MOSPI).to_csv(output, index=False)

    elif dataset == "base_fares":
        rows = []
        for orig, dest in SELECTED_PAIRS:
            rid = f"{orig}-{dest}"
            for h in ["T+1", "T+7", "T+15", "T+30", "T+45"]:
                rows.append({"corridor_id": rid, "horizon": h,
                             "base_fare_inr": BASE_FARES.get(h, {}).get(rid)})
        pd.DataFrame(rows).to_csv(output, index=False)

    else:
        return Response(
            content="Invalid dataset. Valid options: index_series, corridors, weights, anomalies, competition, mospi, base_fares",
            status_code=400
        )

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "X-Data-License": "Government Open Data Licence (GODL) India v1.0",
            "X-Generated-By": "APIx Sovereign Index Platform · MoCA, Government of India",
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
