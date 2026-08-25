from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
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

all_pairs     = list(itertools.combinations(AIRPORTS.keys(), 2))
selected_pairs = random.sample(all_pairs, 80)
base_shares   = np.random.lognormal(mean=0, sigma=1, size=80)
base_shares   /= base_shares.sum()

def _build_records():
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
                    mult = {"T+1": np.random.uniform(1.3, 2.0), "T+7": np.random.uniform(1.1, 1.5),
                            "T+15": np.random.uniform(0.9, 1.3), "T+30": np.random.uniform(0.8, 1.1),
                            "T+45": np.random.uniform(0.7, 0.9)}[h]
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
    return records

_RECORDS = _build_records()


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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
