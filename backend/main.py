from fastapi import FastAPI, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from typing import Optional
import numpy as np
import random
import itertools
from datetime import datetime, timedelta

app = FastAPI(title="APIx Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "APIx National Airfare Price Index API",
        "version": "2.0",
        "documentation": "/docs",
        "endpoints": [
            "/api/heatmap",
            "/api/timeseries",
            "/api/routes",
            "/api/analysts/anomalies",
            "/api/analysts/competition",
            "/api/analysts/cpi-comparison"
        ]
    }

@app.get("/health")
def health():
    return {"status": "healthy"}

# ─── Serve airline logos from backend/LOGO/ at /logos/ ──────────────────────
_logo_dir = os.path.join(os.path.dirname(__file__), "LOGO")
if os.path.isdir(_logo_dir):
    app.mount("/logos", StaticFiles(directory=_logo_dir), name="logos")

# ─── Seed-stable mock data (generated once at startup) ───────────────────────
np.random.seed(42)
random.seed(42)

AIRPORTS = {
    "DEL": (28.5562, 77.1000), "BOM": (19.0896, 72.8656), "BLR": (13.1986, 77.7066),
    "HYD": (17.2403, 78.4294), "MAA": (12.9941, 80.1709), "CCU": (22.6547, 88.4467),
    "AMD": (23.0734, 72.6347), "COK": (10.1520, 76.4019), "PNQ": (18.5822, 73.9197),
    "GOI": (15.3808, 73.8314), "LKO": (26.7606, 80.8893), "JAI": (26.8242, 75.8122),
    "ATQ": (31.7096, 74.7973), "GAU": (26.1061, 91.5859), "BBI": (20.2444, 85.8178),
    "IXC": (30.6735, 76.7886), "IXB": (26.6812, 88.3286), "PAT": (25.5913, 85.0880),
    "TRV": (8.4821,  76.9201), "VTZ": (17.7211, 83.2245),
}
AIRLINES = ["IndiGo (6E)", "Air India (AI)", "SpiceJet (SG)", "Air India Express (IX)", "Akasa Air (QP)"]
HORIZONS = ["T+1", "T+7", "T+15", "T+30", "T+45"]

# ─── Full 80 Domestic Routes Basket (20 Indian Airports) ─────────────────────
all_pairs     = list(itertools.combinations(AIRPORTS.keys(), 2))
selected_pairs = random.sample(all_pairs, 80)
base_shares   = np.random.lognormal(mean=0, sigma=1, size=80)
base_shares   /= base_shares.sum()

DYNAMIC_ROUTE_WEIGHTS = {f"{orig}-{dest}": float(base_shares[i]) for i, (orig, dest) in enumerate(selected_pairs)}

try:
    from backend.scraper import scrape_fares
    from backend.static_data import ROUTE_WEIGHTS, BASE_FARES
except ModuleNotFoundError:
    from scraper import scrape_fares
    from static_data import ROUTE_WEIGHTS, BASE_FARES


def fetch_and_process_live_data():
    print("Building full 80-route national basket...")
    np.random.seed(42)
    random.seed(42)

    records = []
    for i, (orig, dest) in enumerate(selected_pairs):
        pshare = float(base_shares[i])
        pcount = int(pshare * 150_000_000)
        route_airlines = random.sample(AIRLINES, random.randint(2, 5))
        for al in route_airlines:
            for cab in ["Economy", "Business"]:
                for h in HORIZONS:
                    base_fare = (np.random.randint(4000, 8000) if cab == "Economy"
                                 else np.random.randint(15000, 35000))
                    mult = {"T+1": np.random.uniform(1.35, 1.42),
                            "T+7": np.random.uniform(1.12, 1.16),
                            "T+15": np.random.uniform(1.04, 1.08),
                            "T+30": np.random.uniform(0.96, 1.01),
                            "T+45": np.random.uniform(0.84, 0.89)}[h]
                    if al == "IndiGo (6E)":           mult *= 0.95
                    elif al == "Air India (AI)":       mult *= 1.10
                    elif al == "SpiceJet (SG)":        mult *= 0.90
                    cur = base_fare * mult
                    records.append({
                        "route_id": f"{orig}-{dest}",
                        "origin": orig, "destination": dest,
                        "origin_lat": AIRPORTS[orig][0], "origin_lon": AIRPORTS[orig][1],
                        "dest_lat":   AIRPORTS[dest][0], "dest_lon":   AIRPORTS[dest][1],
                        "airline": al, "cabin_class": cab, "horizon": h,
                        "fare_base": int(base_fare), "fare_current": round(cur, 2),
                        "pct_change": round(((cur - base_fare) / base_fare) * 100, 4),
                        "passenger_share": pshare, "passenger_count": pcount,
                    })

    # Live Scraper Overlay for marquee routes
    try:
        df_scraped = scrape_fares()
        if not df_scraped.empty:
            al_map = {"6E": "IndiGo (6E)", "AI": "Air India (AI)", "SG": "SpiceJet (SG)", "IX": "Air India Express (IX)", "QP": "Akasa Air (QP)"}
            for _, row in df_scraped.iterrows():
                orig = row.get("origin")
                dest = row.get("destination")
                rid = f"{orig}-{dest}"
                h = row.get("lead_time_horizon")
                al_code = row.get("airline")
                al_name = al_map.get(al_code, f"{al_code} ({al_code})")
                cab = row.get("cabin_class", "Economy").capitalize()
                cur_fare = row.get("total_fare")

                if cur_fare:
                    for r in records:
                        if r["route_id"] == rid and r["horizon"] == h and r["airline"] == al_name and r["cabin_class"] == cab:
                            r["fare_current"] = round(cur_fare, 2)
                            r["pct_change"] = round(((cur_fare - r["fare_base"]) / r["fare_base"]) * 100, 4)
    except Exception as e:
        print(f"Scraper notice: {e}")

    # Export full 80-routes dataset to CSV and SQLite
    try:
        import pandas as pd
        import sqlite3
        import os

        os.makedirs("exports", exist_ok=True)
        records_df = pd.DataFrame(records)
        records_df.to_csv("exports/fares_latest.csv", index=False)

        weights_data = [{"route_id": f"{orig}-{dest}", "weight": round(float(base_shares[i]), 6), "passenger_count": int(float(base_shares[i]) * 150_000_000)} for i, (orig, dest) in enumerate(selected_pairs)]
        weights_df = pd.DataFrame(weights_data)
        weights_df.to_csv("exports/routes_weights.csv", index=False)

        conn = sqlite3.connect("apix_data.db")
        history_df = records_df.copy()
        history_df["scrape_timestamp"] = pd.Timestamp.now().isoformat()
        history_df.to_sql("fares_history", conn, if_exists="append", index=False)
        weights_df.to_sql("routes_weights", conn, if_exists="replace", index=False)
        conn.close()
        print(f"Exported {len(records)} fare records across 80 routes to SQLite and CSV.")
    except Exception as e:
        print(f"Failed to export data: {e}")

    return records


_RECORDS = fetch_and_process_live_data()

def _build_mospi():
    np.random.seed(42)
    dates = []
    d = datetime(2010, 1, 1)
    end = datetime.today().replace(day=1) - timedelta(days=1)
    while d <= end:
        dates.append(d)
        if d.month == 12:
            d = d.replace(year=d.year+1, month=1)
        else:
            d = d.replace(month=d.month+1)
    idx = []; cur = 95.0
    for d in dates:
        if d.year == 2012: cur = 100.0
        if d.year == 2020 and d.month in [4, 5, 6, 7]: cur -= np.random.uniform(2, 5)
        elif d.year in [2022, 2023]: cur += np.random.uniform(0.5, 2.5)
        else: cur += np.random.uniform(-0.5, 1.2)
        idx.append(round(cur, 3))
    result = []
    for i, (d, v) in enumerate(zip(dates, idx)):
        infl = round((v / idx[i-12] - 1) * 100, 3) if i >= 12 else 0.0
        result.append({"date": d.strftime("%Y-%m-%d"), "cpi_index": v, "inflation_pct": infl})
    return result

_MOSPI = _build_mospi()


# ─── Helpers ─────────────────────────────────────────────────────────────────
def _filter_records(cabin_class="Economy", airline="all", route="all"):
    out = [r for r in _RECORDS if r["cabin_class"] == cabin_class]
    if airline != "all":
        out = [r for r in out if r["airline"] == airline]
    if route != "all":
        out = [r for r in out if r["route_id"] == route]
    return out


def _route_summary(records):
    from collections import defaultdict
    agg = defaultdict(lambda: {"pct_changes": [], "passenger_share": 0, "passenger_count": 0,
                                "origin": "", "destination": "",
                                "origin_lat": 0, "origin_lon": 0,
                                "dest_lat": 0, "dest_lon": 0})
    for r in records:
        rid = r["route_id"]
        agg[rid]["pct_changes"].append(r["pct_change"])
        agg[rid]["passenger_share"] = r["passenger_share"]
        agg[rid]["passenger_count"] = r["passenger_count"]
        agg[rid]["origin"] = r["origin"]
        agg[rid]["destination"] = r["destination"]
        agg[rid]["origin_lat"] = r["origin_lat"]
        agg[rid]["origin_lon"] = r["origin_lon"]
        agg[rid]["dest_lat"] = r["dest_lat"]
        agg[rid]["dest_lon"] = r["dest_lon"]
    summary = []
    for rid, d in agg.items():
        avg = round(float(np.mean(d["pct_changes"])), 3)
        summary.append({
            "route_id": rid,
            "avg_pct_change": avg,
            "route_index": round(100 + avg, 3),
            "passenger_share": round(d["passenger_share"], 6),
            "passenger_count": d["passenger_count"],
            "origin": d["origin"], "destination": d["destination"],
            "origin_lat": d["origin_lat"], "origin_lon": d["origin_lon"],
            "dest_lat": d["dest_lat"],     "dest_lon": d["dest_lon"],
        })
    return summary


# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/api/mospi")
def get_mospi():
    """MoSPI CPI history from 2010 to today (monthly)."""
    return _MOSPI


@app.get("/api/routes/list")
def get_routes_list():
    """All unique route IDs for dropdown menus."""
    routes = sorted({r["route_id"] for r in _RECORDS})
    return {"routes": routes, "airlines": AIRLINES}


@app.get("/api/route-summary")
def get_route_summary(
    cabin_class: str = Query("Economy"),
    airline: str     = Query("all"),
    route: str       = Query("all"),
):
    """Aggregated per-route stats for the map + heatmap."""
    records = _filter_records(cabin_class, airline, route)
    return _route_summary(records)


@app.get("/api/heatmap")
def get_heatmap(
    cabin_class: str = Query("Economy"),
    airline: str     = Query("all"),
    route: str       = Query("all"),
):
    """Data formatted for the route × horizon heatmap."""
    records = _filter_records(cabin_class, airline, route)
    summary = _route_summary(records)
    summary_map = {s["route_id"]: s["passenger_share"] for s in summary}
    routes_sorted = sorted(summary, key=lambda x: x["passenger_share"], reverse=True)
    route_ids = [r["route_id"] for r in routes_sorted]

    from collections import defaultdict
    pivot = defaultdict(lambda: defaultdict(list))
    for rec in records:
        pivot[rec["route_id"]][rec["horizon"]].append(rec["pct_change"])

    z, text, hover = [], [], []
    for rid in route_ids:
        zr, tr, hr = [], [], []
        w = summary_map.get(rid, 0)
        for h in HORIZONS:
            vals = pivot[rid][h]
            if vals:
                val  = round(float(np.mean(vals)), 2)
                fare = round(float(np.mean([r["fare_current"] for r in records
                                            if r["route_id"] == rid and r["horizon"] == h])))
                base = round(float(np.mean([r["fare_base"] for r in records
                                            if r["route_id"] == rid and r["horizon"] == h])))
                zr.append(val)
                tr.append(f"₹{fare:,}")
                hr.append(f"{rid} | {h} | Base ₹{base:,} → ₹{fare:,} | {val:+.1f}% | Wt {w:.3f}")
            else:
                zr.append(None); tr.append(""); hr.append("")
        z.append(zr); text.append(tr); hover.append(hr)

    weights = [summary_map.get(rid, 0) for rid in route_ids]
    return {"routes": route_ids, "horizons": HORIZONS, "z": z,
            "text": text, "hover": hover, "weights": weights}


@app.get("/api/index")
def get_index(
    cabin_class: str = Query("Economy"),
    airline: str     = Query("all"),
    route: str       = Query("all"),
):
    """APIx index values for T+7, T+15, T+30, T+45."""
    records = _filter_records(cabin_class, airline, route)
    result = {}
    for h in HORIZONS:
        vals = [r["pct_change"] for r in records if r["horizon"] == h]
        result[h] = round(100 + float(np.mean(vals)), 2) if vals else 100.0
    return result


@app.get("/api/weights")
def get_weights():
    """DGCA passenger weight data for all routes."""
    seen = {}
    for r in _RECORDS:
        rid = r["route_id"]
        if rid not in seen:
            seen[rid] = {"route_id": rid,
                         "passenger_share": round(r["passenger_share"], 6),
                         "passenger_count": r["passenger_count"]}
    rows = sorted(seen.values(), key=lambda x: x["passenger_share"], reverse=True)
    total = sum(r["passenger_count"] for r in rows)
    return {"routes": rows, "total_passengers": total}


@app.get("/api/airports")
def get_airports():
    """All airport codes with lat/lon for the map."""
    return [{"code": k, "lat": v[0], "lon": v[1]} for k, v in AIRPORTS.items()]


@app.get("/api/apix")
def get_apix_data(
    base_date: Optional[str] = Query(None),
    aggregation: Optional[str] = Query("overall"),
    airline: Optional[str] = Query("all"),
    route: Optional[str] = Query("all"),
    cabin_class: Optional[str] = Query("economy"),
):
    """Legacy endpoint kept for backwards compatibility."""
    multiplier = 1.0
    if aggregation == "airline" and airline != "all":
        multiplier = 0.95 if airline == "6E" else 1.05
    elif aggregation == "route" and route != "all":
        multiplier = 1.1 if route == "DEL-BOM" else 0.9
    if cabin_class == "business":
        multiplier *= 3.5
    elif cabin_class == "first":
        multiplier *= 6.0
    return {
        "apix_index": [
            {"query_date": "2026-08-25", "lead_time": "T+7",  "APIx": round(105.4 * multiplier, 1)},
            {"query_date": "2026-08-25", "lead_time": "T+15", "APIx": round(110.2 * multiplier, 1)},
            {"query_date": "2026-08-25", "lead_time": "T+30", "APIx": round(125.8 * multiplier, 1)},
        ],
        "route_fares": [
            {"origin": "DEL", "destination": "BOM", "lead_time": "T+7",  "representative_fare": round(6200 * multiplier)},
            {"origin": "DEL", "destination": "BLR", "lead_time": "T+7",  "representative_fare": round(7100 * multiplier)},
            {"origin": "BOM", "destination": "BLR", "lead_time": "T+7",  "representative_fare": round(4300 * multiplier)},
            {"origin": "DEL", "destination": "BOM", "lead_time": "T+30", "representative_fare": round(5100 * multiplier)},
            {"origin": "DEL", "destination": "BLR", "lead_time": "T+30", "representative_fare": round(5800 * multiplier)},
        ]
    }


@app.post("/api/sync")
def sync_live_data():
    global _RECORDS
    _RECORDS = fetch_and_process_live_data()
    return {"status": "success", "message": "Live fares scraped and synced.", "total_records": len(_RECORDS)}


# ─── Policy & Analyst Endpoints ───────────────────────────────────────────────

@app.get("/api/analysts/anomalies")
def get_analyst_anomalies(
    threshold: float = Query(25.0, description="Minimum percentage surge to flag as anomaly"),
    horizon: str = Query("all"),
    route: str = Query("all")
):
    """
    Price Gouging & Outlier Radar for DGCA/Regulators.
    Identifies routes with extreme fare surges, IQR boundary breaches, and severity ratings.
    """
    records = _RECORDS.copy()
    if horizon != "all":
        records = [r for r in records if r["horizon"] == horizon]
    if route != "all":
        records = [r for r in records if r["route_id"] == route]

    anomalies = []
    for r in records:
        pct = r["pct_change"]
        if pct >= threshold:
            severity = "CRITICAL" if pct >= 80 else ("HIGH" if pct >= 40 else "MODERATE")
            anomalies.append({
                "route_id": r["route_id"],
                "origin": r["origin"],
                "destination": r["destination"],
                "airline": r["airline"],
                "horizon": r["horizon"],
                "cabin_class": r["cabin_class"],
                "fare_current": r["fare_current"],
                "fare_base": r["fare_base"],
                "pct_change": r["pct_change"],
                "surge_multiplier": round(r["fare_current"] / max(r["fare_base"], 1), 2),
                "severity": severity,
                "passenger_share": r["passenger_share"],
                "passenger_count": r["passenger_count"],
            })

    anomalies.sort(key=lambda x: x["pct_change"], reverse=True)
    
    # Calculate IQR for all current fares across records for outlier boundary chart
    all_fares = [r["fare_current"] for r in _RECORDS]
    q1 = float(np.percentile(all_fares, 25)) if all_fares else 0
    q3 = float(np.percentile(all_fares, 75)) if all_fares else 0
    iqr = q3 - q1
    iqr_upper_bound = q3 + 1.5 * iqr

    return {
        "total_anomalies": len(anomalies),
        "critical_count": sum(1 for a in anomalies if a["severity"] == "CRITICAL"),
        "high_count": sum(1 for a in anomalies if a["severity"] == "HIGH"),
        "moderate_count": sum(1 for a in anomalies if a["severity"] == "MODERATE"),
        "iqr_stats": {
            "q1": round(q1, 2),
            "q3": round(q3, 2),
            "iqr": round(iqr, 2),
            "upper_bound": round(iqr_upper_bound, 2)
        },
        "anomalies": anomalies
    }


@app.get("/api/analysts/competition")
def get_analyst_competition():
    """
    Herfindahl-Hirschman Index (HHI) & Market Concentration Analysis per route.
    """
    from collections import defaultdict
    route_airline_counts = defaultdict(lambda: defaultdict(int))
    route_fares = defaultdict(list)
    route_pct_changes = defaultdict(list)
    route_base_fares = defaultdict(list)

    for r in _RECORDS:
        rid = r["route_id"]
        al = r["airline"]
        route_airline_counts[rid][al] += 1
        route_fares[rid].append(r["fare_current"])
        route_pct_changes[rid].append(r["pct_change"])
        route_base_fares[rid].append(r["fare_base"])

    routes_data = []
    for rid, al_dict in route_airline_counts.items():
        total_flights = sum(al_dict.values())
        hhi = 0.0
        shares = []
        dominant_al = ""
        dominant_share = 0.0

        for al, count in al_dict.items():
            share_pct = (count / total_flights) * 100
            hhi += share_pct ** 2
            shares.append({"airline": al, "flights": count, "share_pct": round(share_pct, 1)})
            if share_pct > dominant_share:
                dominant_share = share_pct
                dominant_al = al

        hhi = round(hhi, 1)
        if hhi < 1500:
            market_type = "Competitive"
            badge_color = "emerald"
        elif hhi <= 2500:
            market_type = "Moderate Concentration"
            badge_color = "amber"
        else:
            market_type = "High Concentration (Monopoly Risk)"
            badge_color = "red"

        avg_pct = round(float(np.mean(route_pct_changes[rid])), 2) if route_pct_changes[rid] else 0.0
        avg_fare = round(float(np.mean(route_fares[rid])), 2) if route_fares[rid] else 0.0
        avg_base = round(float(np.mean(route_base_fares[rid])), 2) if route_base_fares[rid] else 0.0

        routes_data.append({
            "route_id": rid,
            "hhi": hhi,
            "market_type": market_type,
            "badge_color": badge_color,
            "dominant_airline": dominant_al,
            "dominant_share_pct": round(dominant_share, 1),
            "carrier_count": len(al_dict),
            "avg_fare_current": avg_fare,
            "avg_fare_base": avg_base,
            "avg_pct_change": avg_pct,
            "carriers": sorted(shares, key=lambda x: x["share_pct"], reverse=True)
        })

    routes_data.sort(key=lambda x: x["hhi"], reverse=True)
    avg_national_hhi = round(float(np.mean([r["hhi"] for r in routes_data])), 1) if routes_data else 0.0

    return {
        "national_avg_hhi": avg_national_hhi,
        "total_routes_analyzed": len(routes_data),
        "high_concentration_routes": sum(1 for r in routes_data if r["hhi"] > 2500),
        "routes": routes_data
    }


@app.get("/api/analysts/export/{dataset}")
def export_analyst_dataset(dataset: str):
    """
    Direct CSV export stream for economists and government analysts.
    Datasets: 'fares', 'weights', 'anomalies', 'competition', 'mospi'
    """
    import io
    import pandas as pd
    from fastapi.responses import Response

    output = io.StringIO()
    filename = f"apix_{dataset}_{datetime.now().strftime('%Y%m%d')}.csv"

    if dataset == "fares":
        df = pd.DataFrame(_RECORDS)
        df.to_csv(output, index=False)
    elif dataset == "weights":
        weights_data = [{"route_id": k, "weight": v, "passenger_count": int(v * 150_000_000)} for k, v in ROUTE_WEIGHTS.items()]
        pd.DataFrame(weights_data).to_csv(output, index=False)
    elif dataset == "anomalies":
        anom_res = get_analyst_anomalies(threshold=20.0, horizon="all", route="all")
        pd.DataFrame(anom_res["anomalies"]).to_csv(output, index=False)
    elif dataset == "competition":
        comp_res = get_analyst_competition()
        flat_routes = []
        for r in comp_res["routes"]:
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
    uvicorn.run(app, host="0.0.0.0", port=8001)
