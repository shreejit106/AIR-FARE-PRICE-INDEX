import React, { useState } from 'react';
import { API_BASE_URL } from '../config';

const B = API_BASE_URL;

/* =============================================================
   MINISTRY DATA
============================================================= */
const MINISTRIES: any[] = [
  /* ── NSO ─────────────────────────────────────────────────── */
  {
    id:'nso', badge:'NSO',
    name:'National Statistical Office',
    ministry:'Ministry of Statistics and Programme Implementation (MoSPI)',
    key:'NSO-APIX-2026-GOV-7f3a91bc',
    color:'#1e40af', grad:'linear-gradient(135deg,#1e3a8a,#1e40af)',
    lb:'#eff6ff', lbo:'#bfdbfe', lt:'#1e3a8a',
    tagline:'CPI Sub-Index Calibration', issued:'1 Sep 2026',
    overview:`NSO (MoSPI) integrates the APIx T+7 headline as the official CPI Air Transport sub-basket input, reviewed quarterly. Per-corridor Laspeyres price relatives enable state-level CPI disaggregation for high-traffic corridors. Nightly bulk CSV exports feed the MoSPI Data Integration Platform (MDIP). Divergence between APIx and MoSPI CPI-Transport flags sector-specific airfare pressures not captured in headline CPI — a critical input for the Annual Survey of Industries transport cost component.`,
    workflow:[
      {s:1,t:'Fetch Headline APIx',d:'Call /gov/v1/index daily at 06:30 IST. The T+7 figure is the CPI-Air quarterly basket input for MoSPI.'},
      {s:2,t:'Pull Corridor Breakdown',d:'Call /gov/v1/corridors for disaggregated regional inflation. Map each corridor to its state-level CPI weight.'},
      {s:3,t:'Export to MDIP',d:'Call /gov/v1/export/index_series for automated CSV ingestion into the MoSPI Data Integration Platform nightly pipeline.'},
      {s:4,t:'Reconcile with CPI-T',d:'Hit /gov/v1/inflation-timeseries to compare live APIx T+7 against MoSPI CPI-Transport. Drift > 2 pts triggers NSO sector review.'},
    ],
    eps:[
      {p:'/gov/v1/index',            w:'T+7 headline — CPI-Air quarterly basket input'},
      {p:'/gov/v1/corridors',        w:'Per-corridor price relatives for regional CPI disaggregation'},
      {p:'/gov/v1/inflation-timeseries', w:'APIx vs MoSPI CPI-Transport drift analysis'},
      {p:'/gov/v1/weights',          w:'DGCA passenger W_i for quarterly basket reweighting'},
      {p:'/gov/v1/export/index_series', w:'Automated CSV for MDIP nightly pipeline'},
    ],
    python:`import requests, csv, io

BASE    = "http://localhost:8000"
HEADERS = {"X-Gov-API-Key": "NSO-APIX-2026-GOV-7f3a91bc"}

# 1. CPI-Air headline input ──────────────────────────────────────────────────
resp   = requests.get(f"{BASE}/gov/v1/index", headers=HEADERS).json()
meta   = resp["meta"]
idx    = resp["data"]
print(f"Generated  : {meta['generated_at']}")
print(f"Methodology: {meta['index_methodology']}")
print(f"T+7 Index  : {idx['headline_index']}  (base 100 = July 2022)")
print(f"Inflation  : +{idx['headline_inflation_pct']}% vs base period")
for h, v in idx["index_by_horizon"].items():
    print(f"  {h:5s}  {v['index']:7.2f}  {v['interpretation']}")

# 2. Regional corridor disaggregation ────────────────────────────────────────
corridors = requests.get(f"{BASE}/gov/v1/corridors", headers=HEADERS).json()["data"]["corridors"]
top5 = sorted(corridors, key=lambda x: x["dgca_passenger_weight"], reverse=True)[:5]
print("\\nTop-5 corridors by DGCA traffic weight:")
for c in top5:
    print(f"  {c['corridor_id']:10s}  w={c['dgca_passenger_weight']:.4f}  T+7={c.get('corridor_index_t7',0):.2f}  delta={c.get('inflation_pct_t7',0):+.2f}%")

# 3. Bulk CSV export -> MDIP ─────────────────────────────────────────────────
csv_resp = requests.get(f"{BASE}/gov/v1/export/index_series", headers=HEADERS)
reader   = csv.DictReader(io.StringIO(csv_resp.text))
print("\\nBulk CSV (MDIP ingest):")
for row in reader:
    print(f"  {row['horizon']:5s}  index={row['index']:7s}  delta={row['inflation_pct']}%")

# 4. Drift analysis vs MoSPI CPI-T ───────────────────────────────────────────
ts    = requests.get(f"{BASE}/gov/v1/inflation-timeseries", headers=HEADERS).json()["data"]
apix  = ts["apix_live_t7"]["index"]
cpi_t = ts["mospi_cpi_transport_series"][-1]["cpi_transport_index"]
print(f"\\nAPIx T+7={apix:.2f}  CPI-T={cpi_t:.2f}  Drift={apix - cpi_t:+.2f} pts")
print(f"Note: {ts['divergence_note']}")`,
    curl:`# 1. CPI-Air headline
curl -s "http://localhost:8000/gov/v1/index?cabin_class=Economy" \\
  -H "X-Gov-API-Key: NSO-APIX-2026-GOV-7f3a91bc"

# 2. Corridor disaggregation
curl -s "http://localhost:8000/gov/v1/corridors" \\
  -H "X-Gov-API-Key: NSO-APIX-2026-GOV-7f3a91bc"

# 3. Export CSV for MDIP nightly pipeline
curl "http://localhost:8000/gov/v1/export/index_series" \\
  -H "X-Gov-API-Key: NSO-APIX-2026-GOV-7f3a91bc" \\
  -o "apix_nso_mdip_$(date +%Y%m%d).csv"

# 4. Drift check vs MoSPI CPI-T
curl -s "http://localhost:8000/gov/v1/inflation-timeseries" \\
  -H "X-Gov-API-Key: NSO-APIX-2026-GOV-7f3a91bc"`,
    js:`const H = {"X-Gov-API-Key":"NSO-APIX-2026-GOV-7f3a91bc"};
const api = p => fetch(B + p, {headers:H}).then(r => r.json());

// 1 — CPI-Air headline
const {meta, data:idx} = await api("/gov/v1/index?cabin_class=Economy");
console.log("Generated:", meta.generated_at);
console.log("T+7 Index:", idx.headline_index, "(+" + idx.headline_inflation_pct + "%)");
Object.entries(idx.index_by_horizon).forEach(([h, v]) =>
  console.log(h + ":", v.index.toFixed(2), "—", v.interpretation)
);

// 2 — Corridor breakdown
const {data:cd} = await api("/gov/v1/corridors");
cd.corridors.sort((a,b) => b.dgca_passenger_weight - a.dgca_passenger_weight).slice(0,5)
  .forEach(c => console.log(c.corridor_id, "w=" + c.dgca_passenger_weight.toFixed(4),
    "T+7=" + c.corridor_index_t7?.toFixed(2)));

// 3 — Drift
const {data:ts} = await api("/gov/v1/inflation-timeseries");
const drift = ts.apix_live_t7.index - ts.mospi_cpi_transport_series.at(-1).cpi_transport_index;
console.log("Drift:", drift.toFixed(2), "pts |", ts.divergence_note);`,
    schema:`{
  "meta": {
    "api_version": "v1",
    "consumer": "National Statistical Office (NSO), MoSPI",
    "ministry": "Ministry of Statistics and Programme Implementation",
    "generated_at": "2026-09-02T19:49:10Z",    // UTC timestamp — audit trail
    "operator": "Ministry of Civil Aviation (MoCA), Government of India",
    "index_methodology": "Laspeyres-Type Sovereign Price Index (Base: July 2022)"
  },
  "data": {
    "headline_horizon": "T+7",                  // NSO uses T+7 as CPI-Air basket input
    "headline_index": 125.31,                   // 25.31% above July 2022 sovereign base
    "headline_inflation_pct": 25.31,
    "base_period": "July 2022 (MoCA Tariff Deregulation)",
    "corridors_monitored": 80,                  // Full DGCA 80-corridor basket
    "passenger_coverage_pct": 76.4,             // % of domestic pax covered
    "index_by_horizon": {
      "T+1":  {"index": 148.72, "inflation_pct": 48.72}, // Last-minute premium
      "T+7":  {"index": 125.31, "inflation_pct": 25.31}, // CPI-Air quarterly input
      "T+15": {"index": 116.44, "inflation_pct": 16.44},
      "T+30": {"index": 109.83, "inflation_pct":  9.83},
      "T+45": {"index": 104.12, "inflation_pct":  4.12}  // Early-bird baseline
    }
  }
}`,
  },
  /* ── RBI ─────────────────────────────────────────────────── */
  {
    id:'rbi', badge:'RBI',
    name:'Reserve Bank of India',
    ministry:'Monetary Policy and Research Department (MPCRD)',
    key:'RBI-APIX-2026-GOV-4d8e52fa',
    color:'#166534', grad:'linear-gradient(135deg,#14532d,#166534)',
    lb:'#f0fdf4', lbo:'#bbf7d0', lt:'#14532d',
    tagline:'Monetary Policy & Inflation Monitoring', issued:'1 Sep 2026',
    overview:`The RBI Monetary Policy Committee (MPC) integrates APIx as a leading indicator of transport cost inflation. A sustained T+7 reading above 115 historically correlates with core CPI of 5.2-5.8% in the following quarter. The T+1 vs T+30 booking spread is monitored as a demand-supply imbalance proxy. Routes with high HHI and high fare inflation simultaneously indicate monopoly rent extraction amplifying cost-push inflation — these are escalated to CCI under the RBI-MCA Coordination Protocol.`,
    workflow:[
      {s:1,t:'Monitor Inflation Divergence',d:'Hit /gov/v1/inflation-timeseries. Divergence > 5 pts between APIx T+7 and MoSPI CPI-T triggers MPC review flag at bi-monthly meeting.'},
      {s:2,t:'Track Yield Curve Spread',d:'Compute T+1 minus T+30 from /gov/v1/index. Spread > 35 pts signals demand-supply imbalance and capacity constraints.'},
      {s:3,t:'Metro Corridor Heatmap',d:'/gov/v1/corridors: T+7 idx > 130 on metro corridors maps to corporate travel WPI second-round effects on services inflation.'},
      {s:4,t:'Antitrust-Monetary Linkage',d:'Cross-ref /gov/v1/market-concentration. HHI > 2500 AND fare inflation > 40% = monopoly rent feeding cost-push. Escalate to CCI.'},
    ],
    eps:[
      {p:'/gov/v1/inflation-timeseries', w:'APIx vs CPI-T divergence — primary MPC dashboard input'},
      {p:'/gov/v1/index',                w:'T+1/T+30 spread — demand-supply pressure proxy'},
      {p:'/gov/v1/corridors',            w:'Metro corridor inflation heatmap for WPI second-round effects'},
      {p:'/gov/v1/market-concentration', w:'HHI cross-check for monopoly-driven cost-push inflation'},
      {p:'/gov/v1/status',               w:'Pipeline health check for automated MPC dashboard'},
    ],
    python:`import requests

BASE    = "http://localhost:8000"
HEADERS = {"X-Gov-API-Key": "RBI-APIX-2026-GOV-4d8e52fa"}

# 1. MPC Inflation Dashboard ─────────────────────────────────────────────────
ts    = requests.get(f"{BASE}/gov/v1/inflation-timeseries", headers=HEADERS).json()["data"]
apix  = ts["apix_live_t7"]["index"]
cpi_t = ts["mospi_cpi_transport_series"][-1]["cpi_transport_index"]
drift = apix - cpi_t
print("MPC Transport Inflation Monitor")
print(f"APIx Live T+7    : {apix:.2f}")
print(f"MoSPI CPI-T      : {cpi_t:.2f}")
print(f"Divergence       : {drift:+.2f} pts  {'REVIEW' if drift > 5 else 'OK'}")
print(ts["divergence_note"])

# 2. Yield curve spread ──────────────────────────────────────────────────────
idx      = requests.get(f"{BASE}/gov/v1/index", headers=HEADERS).json()["data"]
horizons = idx["index_by_horizon"]
spread   = horizons["T+1"]["index"] - horizons["T+30"]["index"]
print(f"\\nT+1-T+30 Booking Spread: {spread:+.2f} pts  {'HIGH DEMAND PRESSURE' if spread > 35 else 'Normal'}")
for h in ["T+1","T+7","T+15","T+30","T+45"]:
    bar = chr(9608) * int(horizons[h]["index"] / 5)
    print(f"  {h:5s}  {horizons[h]['index']:7.2f}  {bar[:20]}")

# 3. High-inflation metro corridors ──────────────────────────────────────────
corridors = requests.get(f"{BASE}/gov/v1/corridors", headers=HEADERS).json()["data"]["corridors"]
hot = sorted([c for c in corridors if (c.get("corridor_index_t7") or 0) > 130],
             key=lambda x: x["corridor_index_t7"], reverse=True)[:8]
print(f"\\nHigh-inflation corridors (T+7 idx > 130): {len(hot)}")
for c in hot:
    print(f"  {c['corridor_id']:10s}  T+7={c['corridor_index_t7']:.2f}  delta={c.get('inflation_pct_t7',0):+.2f}%")`,
    curl:`# MPC drift check
curl -s "http://localhost:8000/gov/v1/inflation-timeseries" \\
  -H "X-Gov-API-Key: RBI-APIX-2026-GOV-4d8e52fa"

# Yield curve spread (T+1 vs T+30)
curl -s "http://localhost:8000/gov/v1/index" \\
  -H "X-Gov-API-Key: RBI-APIX-2026-GOV-4d8e52fa"

# Metro corridors with T+7 > 130
curl -s "http://localhost:8000/gov/v1/corridors" \\
  -H "X-Gov-API-Key: RBI-APIX-2026-GOV-4d8e52fa"

# HHI cross-check for monopoly rent inflation
curl -s "http://localhost:8000/gov/v1/market-concentration" \\
  -H "X-Gov-API-Key: RBI-APIX-2026-GOV-4d8e52fa"`,
    js:`const H = {"X-Gov-API-Key":"RBI-APIX-2026-GOV-4d8e52fa"};
const api = p => fetch(B + p, {headers:H}).then(r => r.json());

// 1 — MPC Dashboard
const {data:ts} = await api("/gov/v1/inflation-timeseries");
const apix  = ts.apix_live_t7.index;
const cpiT  = ts.mospi_cpi_transport_series.at(-1).cpi_transport_index;
const drift = apix - cpiT;
console.log("APIx T+7:", apix, "| CPI-T:", cpiT, "| Drift:", drift.toFixed(2));
console.log(drift > 5 ? "MPC FLAG: REVIEW WARRANTED" : "Within tolerance");

// 2 — Yield curve spread
const {data:idx} = await api("/gov/v1/index");
const h = idx.index_by_horizon;
const spread = h["T+1"].index - h["T+30"].index;
console.log("T+1-T+30 spread:", spread.toFixed(2), spread > 35 ? "HIGH" : "Normal");

// 3 — Metro corridors
const {data:cd} = await api("/gov/v1/corridors");
const hot = cd.corridors.filter(c => c.corridor_index_t7 > 130)
  .sort((a,b) => b.corridor_index_t7 - a.corridor_index_t7);
console.log("Hot corridors:", hot.length);
hot.slice(0,5).forEach(c =>
  console.log(c.corridor_id, "T+7=" + c.corridor_index_t7?.toFixed(2)));`,
    schema:`{
  "meta": {"consumer":"Reserve Bank of India (RBI), MPCRD", "endpoint":"/gov/v1/inflation-timeseries"},
  "data": {
    "apix_live_t7": {
      "index": 125.31,            // Live airfare index — MPC leading indicator
      "inflation_pct": 25.31,     // +25.31% above July 2022 sovereign base
      "as_of": "2026-09-02T19:49:12Z"
    },
    "mospi_cpi_transport_series": [
      {"date":"2020-01-01","cpi_transport_index":100.0,"cpi_inflation_yoy_pct":3.8},
      {"date":"2024-01-01","cpi_transport_index":121.85,"cpi_inflation_yoy_pct":5.2},
      {"date":"2026-01-01","cpi_transport_index":130.45,"cpi_inflation_yoy_pct":6.0}
    ],
    "divergence_note": "APIx T+7 (125.31) vs CPI-T (130.45): airfare running BELOW transport CPI — sector cooling"
  }
}`,
  },
  /* ── DGCA ────────────────────────────────────────────────── */
  {
    id:'dgca', badge:'DGCA',
    name:'Directorate General of Civil Aviation',
    ministry:'Ministry of Civil Aviation, Government of India',
    key:'DGCA-APIX-2026-GOV-2c1b73de',
    color:'#92400e', grad:'linear-gradient(135deg,#78350f,#92400e)',
    lb:'#fff7ed', lbo:'#fed7aa', lt:'#7c2d12',
    tagline:'Tariff Surveillance & Enforcement', issued:'1 Sep 2026',
    overview:`DGCA Tariff Surveillance Cell (TSC) uses the APIx anomaly engine as its real-time price gouging detection system. Under Aircraft Act 1934 and DGCA Circular 01/2022, carriers may not charge T+1 fares exceeding 150% of the T+7 median on the same route. APIx flags surges against the sovereign July 2022 base fares — legally defensible because they are not derived from current prices but from an independent sovereign benchmark. CRITICAL (>=60%) anomalies trigger automated Show Cause Notice templates within 48 hours. Routes with HHI >= 2500 AND CRITICAL surge are escalated to CCI under Section 4 of the Competition Act 2002.`,
    workflow:[
      {s:1,t:'Daily Surge Scan',d:'Hit /gov/v1/price-anomalies?threshold=60 each morning. CRITICAL severity (>=60%) auto-generates Show Cause Notice templates for TSC.'},
      {s:2,t:'T+1 Gouging Focus',d:'Filter ?horizon=T+1 — the most consumer-harmful window per DGCA Circular 01/2022. Surges here are actionable under tariff regulations.'},
      {s:3,t:'Carrier Attribution',d:'Each anomaly record carries airline, route, horizon, sovereign base fare, current fare, and surge %. Directly populates TSC carrier dossier.'},
      {s:4,t:'Monopoly-Rent CCI Escalation',d:'Cross-ref /gov/v1/market-concentration. HHI >= 2500 AND CRITICAL surge on same corridor = Section 4 monopoly rent. Escalate to CCI.'},
    ],
    eps:[
      {p:'/gov/v1/price-anomalies',      w:'Primary enforcement feed — daily T+1 gouging radar for TSC'},
      {p:'/gov/v1/market-concentration', w:'HHI cross-check for monopoly rent cases requiring CCI referral'},
      {p:'/gov/v1/base-fares',           w:'Sovereign July 2022 P_{i,0,h} — legally defensible benchmark'},
      {p:'/gov/v1/corridors',            w:'Route-level fare tracker for TSC enforcement dashboard'},
      {p:'/gov/v1/export/anomalies',     w:'CSV export for TSC carrier Show Cause dossiers'},
    ],
    python:`import requests
from collections import Counter

BASE    = "http://localhost:8000"
HEADERS = {"X-Gov-API-Key": "DGCA-APIX-2026-GOV-2c1b73de"}

# 1. CRITICAL daily scan (>= 60%) ────────────────────────────────────────────
result = requests.get(f"{BASE}/gov/v1/price-anomalies",
                      params={"threshold": 60}, headers=HEADERS).json()["data"]
print("=== DGCA TSC DAILY SCAN ===")
print(f"CRITICAL (>=60%): {result['severity_breakdown']['critical_gte60pct']}  <- Show Cause eligible")
print(f"HIGH    (35-60%): {result['severity_breakdown']['high_35_60pct']}")
print(f"MODERATE(20-35%): {result['severity_breakdown']['moderate_20_35pct']}")

# 2. T+1 last-minute gouging focus ───────────────────────────────────────────
t1 = requests.get(f"{BASE}/gov/v1/price-anomalies",
                  params={"threshold": 35, "horizon": "T+1"},
                  headers=HEADERS).json()["data"]
print("\\nTop T+1 Gouging Routes:")
for a in sorted(t1["anomalies"], key=lambda x: x["surge_pct"], reverse=True)[:8]:
    print(f"  {a['route_id']:10s}  {a.get('airline','N/A'):25s}  surge={a['surge_pct']:+.1f}%  [{a['severity']}]")

# 3. CCI Escalation: HHI >= 2500 + CRITICAL ──────────────────────────────────
hhi_data = requests.get(f"{BASE}/gov/v1/market-concentration", headers=HEADERS).json()["data"]
monopoly = {r["corridor_id"] for r in hhi_data["routes"] if r["hhi_score"] >= 2500}
critical = {a["route_id"] for a in result["anomalies"]}
escalate = monopoly & critical
print(f"\\nCCI Escalation candidates: {len(escalate)}")
for r in escalate:
    print(f"  {r} <- HHI monopoly + CRITICAL price surge -> Section 4")`,
    curl:`# Daily CRITICAL scan
curl -s "http://localhost:8000/gov/v1/price-anomalies?threshold=60" \\
  -H "X-Gov-API-Key: DGCA-APIX-2026-GOV-2c1b73de"

# T+1 gouging (35%+ threshold, last-minute window)
curl -s "http://localhost:8000/gov/v1/price-anomalies?threshold=35&horizon=T%2B1" \\
  -H "X-Gov-API-Key: DGCA-APIX-2026-GOV-2c1b73de"

# Sovereign base fares (legal benchmark)
curl -s "http://localhost:8000/gov/v1/base-fares" \\
  -H "X-Gov-API-Key: DGCA-APIX-2026-GOV-2c1b73de"

# Export Show Cause dossier CSV
curl "http://localhost:8000/gov/v1/export/anomalies" \\
  -H "X-Gov-API-Key: DGCA-APIX-2026-GOV-2c1b73de" \\
  -o "dgca_tsc_$(date +%Y%m%d).csv"`,
    js:`const H = {"X-Gov-API-Key":"DGCA-APIX-2026-GOV-2c1b73de"};
const api = (p,q="") => fetch(B + p + (q ? "?" + q : ""), {headers:H}).then(r => r.json());

// 1 — CRITICAL scan
const {data:scan} = await api("/gov/v1/price-anomalies","threshold=60");
console.log("CRITICAL:", scan.severity_breakdown.critical_gte60pct, "-> Show Cause eligible");
console.log("HIGH    :", scan.severity_breakdown.high_35_60pct);

// 2 — T+1 gouging focus
const {data:t1} = await api("/gov/v1/price-anomalies","threshold=35&horizon=T%2B1");
t1.anomalies.sort((a,b) => b.surge_pct - a.surge_pct).slice(0,5)
  .forEach(a => console.log(a.route_id, a.airline, "surge=" + a.surge_pct?.toFixed(1) + "%"));

// 3 — CCI Escalation
const {data:hhi} = await api("/gov/v1/market-concentration");
const mono = new Set(hhi.routes.filter(r => r.hhi_score >= 2500).map(r => r.corridor_id));
const crit = new Set(scan.anomalies.map(a => a.route_id));
const esc  = [...mono].filter(r => crit.has(r));
console.log("CCI Escalation:", esc.length, "routes:", esc.join(", "));`,
    schema:`{
  "meta": {"consumer":"Directorate General of Civil Aviation (DGCA)", "endpoint":"/gov/v1/price-anomalies"},
  "data": {
    "threshold_applied_pct": 60,
    "total_anomalies_detected": 161,
    "severity_breakdown": {
      "critical_gte60pct": 161,               // Show Cause Notice eligible
      "high_35_60pct": 89,
      "moderate_20_35pct": 62
    },
    "iqr_outlier_ceiling_inr": 14823.50,      // Statistical IQR upper fence
    "anomalies": [{
      "route_id": "DEL-BOM",
      "airline": "IndiGo (6E)",
      "horizon": "T+1",                       // Last-minute window
      "base_fare": 5600,                      // July 2022 sovereign benchmark
      "fare": 11200,                          // Current observed fare
      "surge_pct": 100.0,                     // 100% above base -> CRITICAL
      "severity": "CRITICAL",
      "iqr_breach": true                      // Statistical + legal breach
    }]
  }
}`,
  },
  /* ── MoCA ────────────────────────────────────────────────── */
  {
    id:'moca', badge:'MoCA',
    name:'Ministry of Civil Aviation',
    ministry:'Government of India, MoCA Secretariat',
    key:'MOCA-APIX-2026-GOV-9e4f61aa',
    color:'#7c3aed', grad:'linear-gradient(135deg,#5b21b6,#7c3aed)',
    lb:'#f5f3ff', lbo:'#ddd6fe', lt:'#4c1d95',
    tagline:'NCAP Policy & Connectivity Planning', issued:'1 Sep 2026',
    overview:`MoCA Secretariat uses APIx for sovereign policy intelligence under NCAP 2016. Key applications: (1) UDAN Scheme — corridors with T+7 idx > 140 are consumer-unaffordable and qualify for Viability Gap Funding; below 105 they are commercially self-sustaining and subsidy withdrawal is eligible. (2) RCS Tier-2 monitoring — Tier-2 airports (GOI, COK, JAI, IXC, PAT, GAU, BBI) tracked continuously; sustained high inflation signals market failure requiring RCS route licensing. (3) Weekly Ministerial Aviation Dashboard — /gov/v1/status and /gov/v1/index serve the headline figures briefed to the Hon'ble Minister for Civil Aviation each Monday.`,
    workflow:[
      {s:1,t:'UDAN Affordability Screen',d:'T+7 idx > 140 = UDAN subsidy candidate. Below 105 = commercially viable, subsidy withdrawal eligible. Run weekly.'},
      {s:2,t:'Tier-2 RCS Monitoring',d:'Filter /gov/v1/corridors for GOI, COK, JAI, IXC, PAT, GAU, BBI. Sustained high inflation triggers RCS intervention recommendation.'},
      {s:3,t:'Basket Reweighting',d:'Pull /gov/v1/weights quarterly. Compare against latest DGCA Annual Report data. Initiate reweighting if any corridor drifts > 15% from DGCA actuals.'},
      {s:4,t:'Ministerial Dashboard',d:'/gov/v1/status + /gov/v1/index generated fresh at 06:00 IST daily for the weekly Monday Aviation Sector briefing to the Minister.'},
    ],
    eps:[
      {p:'/gov/v1/corridors',            w:'UDAN affordability screening + Tier-2 RCS monitoring'},
      {p:'/gov/v1/weights',              w:'Quarterly basket composition verification and reweighting'},
      {p:'/gov/v1/index',                w:'Weekly ministerial aviation dashboard headline APIx'},
      {p:'/gov/v1/market-concentration', w:'Competitive market assessment for route licensing decisions'},
      {p:'/gov/v1/export/corridors',     w:'Quarterly CSV for NCAP compliance review and parliamentary questions'},
    ],
    python:`import requests

BASE    = "http://localhost:8000"
HEADERS = {"X-Gov-API-Key": "MOCA-APIX-2026-GOV-9e4f61aa"}
TIER2   = {"GOI","COK","JAI","IXC","PAT","GAU","BBI"}

corridors = requests.get(f"{BASE}/gov/v1/corridors", headers=HEADERS).json()["data"]["corridors"]

# 1. UDAN Affordability Screen ────────────────────────────────────────────────
udan    = [c for c in corridors if (c.get("corridor_index_t7") or 0) > 140]
viable  = [c for c in corridors if (c.get("corridor_index_t7") or 0) < 105]
print(f"UDAN Subsidy Candidates (T+7 > 140): {len(udan)}")
for c in sorted(udan, key=lambda x: x["corridor_index_t7"], reverse=True)[:6]:
    print(f"  {c['corridor_id']:10s}  T+7={c['corridor_index_t7']:.1f}  fare=INR{c.get('representative_fare_inr',0):,.0f}")
print(f"\\nSubsidy Withdrawal (T+7 < 105): {len(viable)}")

# 2. Tier-2 RCS Monitoring ────────────────────────────────────────────────────
tier2 = [c for c in corridors
         if c.get("origin_iata") in TIER2 or c.get("destination_iata") in TIER2]
print(f"\\nTier-2 RCS Corridors: {len(tier2)}")
for c in sorted(tier2, key=lambda x: x.get("corridor_index_t7") or 0, reverse=True)[:8]:
    print(f"  {c['corridor_id']:10s}  T+7={c.get('corridor_index_t7','N/A')}  delta={c.get('inflation_pct_t7',0):+.2f}%")

# 3. Ministerial Dashboard Snapshot ───────────────────────────────────────────
status = requests.get(f"{BASE}/gov/v1/status", headers=HEADERS).json()["data"]
print(f"\\nMinisterial Dashboard: {status['system_status']}  Headline APIx={status['current_headline_apix']}")
print(f"Data Currency: {status['data_currency']}")`,
    curl:`# UDAN screen (T+7 > 140)
curl -s "http://localhost:8000/gov/v1/corridors" \\
  -H "X-Gov-API-Key: MOCA-APIX-2026-GOV-9e4f61aa"

# Basket weights for quarterly reweighting
curl -s "http://localhost:8000/gov/v1/weights" \\
  -H "X-Gov-API-Key: MOCA-APIX-2026-GOV-9e4f61aa"

# Ministerial dashboard
curl -s "http://localhost:8000/gov/v1/status" \\
  -H "X-Gov-API-Key: MOCA-APIX-2026-GOV-9e4f61aa"

# Route licensing HHI check
curl -s "http://localhost:8000/gov/v1/market-concentration" \\
  -H "X-Gov-API-Key: MOCA-APIX-2026-GOV-9e4f61aa"`,
    js:`const H = {"X-Gov-API-Key":"MOCA-APIX-2026-GOV-9e4f61aa"};
const TIER2 = new Set(["GOI","COK","JAI","IXC","PAT","GAU","BBI"]);
const api = p => fetch(B + p, {headers:H}).then(r => r.json());

const {data:cd} = await api("/gov/v1/corridors");
const udan   = cd.corridors.filter(c => c.corridor_index_t7 > 140);
const viable = cd.corridors.filter(c => c.corridor_index_t7 < 105);
const tier2  = cd.corridors.filter(c => TIER2.has(c.origin_iata) || TIER2.has(c.destination_iata));
console.log("UDAN candidates:", udan.length, "| Viable:", viable.length, "| Tier-2:", tier2.length);
udan.sort((a,b) => b.corridor_index_t7 - a.corridor_index_t7).slice(0,5)
  .forEach(c => console.log(" " + c.corridor_id, "T+7=" + c.corridor_index_t7?.toFixed(1)));

const {data:s} = await api("/gov/v1/status");
console.log("Dashboard:", s.system_status, "| APIx:", s.current_headline_apix);`,
    schema:`{
  "meta": {"consumer":"Ministry of Civil Aviation (MoCA) Secretariat", "endpoint":"/gov/v1/corridors"},
  "data": {
    "total_corridors": 80,
    "corridors": [{
      "corridor_id": "DEL-BOM",
      "corridor_index_t7": 131.24,            // 31.24% above July 2022
      "price_relative_t7": 1.3124,            // Laspeyres P_t / P_0
      "inflation_pct_t7": 31.24,
      "representative_fare_inr": 7205,        // Current median economy fare
      "base_fare_inr_july2022": 5490,         // Sovereign July 2022 benchmark
      "dgca_passenger_weight": 0.04780,       // 4.78% of domestic traffic
      "annual_passenger_estimate": 7170000    // ~71.7 lakh pax per year
    }]
  }
}`,
  },
  /* ── CCI ─────────────────────────────────────────────────── */
  {
    id:'cci', badge:'CCI',
    name:'Competition Commission of India',
    ministry:'Ministry of Corporate Affairs, Government of India',
    key:'CCI-APIX-2026-GOV-6b2d84ef',
    color:'#be123c', grad:'linear-gradient(135deg,#9f1239,#be123c)',
    lb:'#fff1f2', lbo:'#fecdd3', lt:'#881337',
    tagline:'Antitrust Enforcement & Merger Review', issued:'1 Sep 2026',
    overview:`CCI uses the APIx HHI feed under Competition Act 2002 for three enforcement tracks. (1) Combination Regulations: any aviation merger on routes with HHI > 2500 post-merger triggers Phase-II scrutiny under Regulation 5(1). (2) Section 4 Abuse of Dominance: routes where the dominant airline holds > 70% market share AND fare inflation > 40% above sovereign base are prima facie Section 4 cases — no further justification required for investigation initiation. (3) Section 3 Cartelization: simultaneous fare spikes by >= 3 carriers on the same corridor in the same booking window are flagged as potential cartel coordination under Section 3(3). HHI is computed at route level — the relevant geographic market per COMPAT precedents (CCI Order 2022-12, IndiGo case).`,
    workflow:[
      {s:1,t:'Market Concentration Scan',d:'Run /gov/v1/market-concentration daily. Routes with HHI > 3500 auto-trigger CCI Case Registry entries per Standing Order 2024-07.'},
      {s:2,t:'Section 4 Dominance Screen',d:'dominant_share_pct > 70% AND fare_inflation_pct > 40% on same corridor = Abuse of Dominance prima facie. No further threshold required.'},
      {s:3,t:'Section 3 Cartel Detection',d:'Pull /gov/v1/price-anomalies: >= 3 carriers with simultaneous T+1 surge > 50% on same route = cartel coordination investigation trigger.'},
      {s:4,t:'Merger Pre-Screening',d:'Before approving aviation merger filings, pull route HHI and simulate post-merger concentration: HHI_post = sum((s_i + s_j)^2) across all carriers.'},
    ],
    eps:[
      {p:'/gov/v1/market-concentration', w:'HHI per corridor — primary antitrust surveillance feed, daily'},
      {p:'/gov/v1/price-anomalies',      w:'Section 3 cartel detection — correlated multi-carrier spikes'},
      {p:'/gov/v1/corridors',            w:'Combined fare inflation + market structure analysis'},
      {p:'/gov/v1/base-fares',           w:'Sovereign benchmark for Section 4 surcharge calculation'},
      {p:'/gov/v1/export/competition',   w:'CSV for CCI Case Registry and COMPAT tribunal submissions'},
    ],
    python:`import requests
from collections import Counter

BASE    = "http://localhost:8000"
HEADERS = {"X-Gov-API-Key": "CCI-APIX-2026-GOV-6b2d84ef"}

comp   = requests.get(f"{BASE}/gov/v1/market-concentration", headers=HEADERS).json()["data"]
routes = comp["routes"]

print("=== CCI ANTITRUST SURVEILLANCE REPORT ===")
print(f"National Avg HHI   : {comp['national_avg_hhi']:.0f} (threshold 2500)")
print(f"High Conc (>2500)  : {comp['summary']['high_concentration_gt2500']} ({comp['summary']['pct_high_concentration']}%)")
print(f"Moderate (1500-2500): {comp['summary']['moderate_1500_2500']}")

# Section 4: Abuse of Dominance ──────────────────────────────────────────────
sec4 = [r for r in routes
        if (r.get("dominant_share_pct") or 0) > 70
        and (r.get("fare_inflation_pct") or 0) > 40]
print(f"\\nSection 4 Candidates (share>70% + inflation>40%): {len(sec4)}")
for r in sorted(sec4, key=lambda x: x.get("hhi_score",0), reverse=True)[:6]:
    print(f"  {r['corridor_id']:10s}  {r['dominant_carrier']:25s}  share={r['dominant_share_pct']:.1f}%  HHI={r['hhi_score']}  [{r['cci_flag']}]")

# Section 3: Cartel Detection ────────────────────────────────────────────────
anom = requests.get(f"{BASE}/gov/v1/price-anomalies",
                    params={"threshold": 50, "horizon": "T+1"},
                    headers=HEADERS).json()["data"]["anomalies"]
route_counts = Counter(a["route_id"] for a in anom)
cartels = {r for r, cnt in route_counts.items() if cnt >= 3}
print(f"\\nSection 3 Cartel Candidates (>=3 carriers, T+1, >=50%): {len(cartels)}")
for r in cartels:
    carriers = {a.get("airline","?") for a in anom if a["route_id"] == r}
    print(f"  {r}: {', '.join(carriers)}")`,
    curl:`# Full HHI market concentration report
curl -s "http://localhost:8000/gov/v1/market-concentration" \\
  -H "X-Gov-API-Key: CCI-APIX-2026-GOV-6b2d84ef"

# Section 4: Abuse of Dominance candidates
# (dominant_share_pct > 70 AND fare_inflation_pct > 40)
curl -s "http://localhost:8000/gov/v1/market-concentration" \\
  -H "X-Gov-API-Key: CCI-APIX-2026-GOV-6b2d84ef"

# Section 3: Cartel detection (>=3 carriers, T+1, >=50% surge)
curl -s "http://localhost:8000/gov/v1/price-anomalies?threshold=50&horizon=T%2B1" \\
  -H "X-Gov-API-Key: CCI-APIX-2026-GOV-6b2d84ef"

# Export for COMPAT tribunal submission (GODL licensed)
curl "http://localhost:8000/gov/v1/export/competition" \\
  -H "X-Gov-API-Key: CCI-APIX-2026-GOV-6b2d84ef" \\
  -o "cci_competition_$(date +%Y%m%d).csv"`,
    js:`const H = {"X-Gov-API-Key":"CCI-APIX-2026-GOV-6b2d84ef"};
const api = (p,q="") => fetch(B + p + (q ? "?" + q : ""), {headers:H}).then(r => r.json());

const {data:comp} = await api("/gov/v1/market-concentration");
const routes = comp.routes;
console.log("National Avg HHI:", comp.national_avg_hhi);
console.log("High Conc:", comp.summary.high_concentration_gt2500, "routes");

// Section 4 — Abuse of Dominance
const sec4 = routes.filter(r => r.dominant_share_pct > 70 && r.fare_inflation_pct > 40);
console.log("\\nSection 4:", sec4.length, "candidates");
sec4.sort((a,b) => b.hhi_score - a.hhi_score).slice(0,5)
  .forEach(r => console.log(" " + r.corridor_id, r.dominant_carrier, "HHI=" + r.hhi_score));

// Section 3 — Cartel Detection
const {data:anom} = await api("/gov/v1/price-anomalies","threshold=50&horizon=T%2B1");
const routeMap: any = {};
anom.anomalies.forEach((a:any) => {
  if (!routeMap[a.route_id]) routeMap[a.route_id] = new Set();
  routeMap[a.route_id].add(a.airline);
});
const cartels = Object.entries(routeMap).filter(([,s]: any) => s.size >= 3);
console.log("\\nSection 3:", cartels.length, "cartel candidates");
cartels.forEach(([r,c]: any) => console.log(" " + r + ":", [...c].join(", ")));`,
    schema:`{
  "meta": {"consumer":"Competition Commission of India (CCI)", "endpoint":"/gov/v1/market-concentration"},
  "data": {
    "national_avg_hhi": 3883.5,                 // Well above 2500 — market is concentrated
    "cci_threshold_high_concentration": 2500,    // CCI Combination Reg trigger
    "summary": {
      "high_concentration_gt2500": 64,           // 80% of all monitored routes
      "pct_high_concentration": 80.0
    },
    "routes": [{
      "corridor_id": "DEL-BOM",
      "hhi_score": 4820,                         // Extremely concentrated
      "dominant_carrier": "IndiGo (6E)",
      "dominant_share_pct": 68.4,                // Near 70% Section 4 threshold
      "active_carriers": 3,
      "fare_inflation_pct": 31.24,
      "cci_flag": "HIGH CONCENTRATION — REVIEW WARRANTED"
    }]
  }
}`,
  },
];

/* =============================================================
   COMPONENT
============================================================= */
const GovAPI: React.FC = () => {
  const [activeId, setActiveId] = useState('nso');
  const [codeLang, setCodeLang] = useState<'python'|'curl'|'js'>('python');
  const [testEp,   setTestEp]   = useState('/gov/v1/status');
  const [testRes,  setTestRes]  = useState<string|null>(null);
  const [testing,  setTesting]  = useState(false);
  const [copied,   setCopied]   = useState(false);
  const [schema,   setSchema]   = useState(false);

  const m = MINISTRIES.find(x => x.id === activeId)!;

  const copyKey = () => {
    navigator.clipboard.writeText(m.key).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const runTest = async () => {
    setTesting(true); setTestRes(null);
    try {
      const r = await fetch(`${B}${testEp}`, { headers: { 'X-Gov-API-Key': m.key } });
      setTestRes(JSON.stringify(await r.json(), null, 2));
    } catch (e: any) { setTestRes(`Error: ${e.message}`); }
    setTesting(false);
  };

  const c = (v: string) => `var(--card-bg,${v})`;

  return (
    <div style={{minHeight:'100vh',background:'var(--bg,#f8fafc)',color:'var(--text,#0f172a)',fontFamily:"'Inter','Outfit',system-ui,sans-serif",boxSizing:'border-box'}}>

      {/* Hero */}
      <div style={{background:'linear-gradient(135deg,#0a0f1e,#0f2027 40%,#1a3a5c)',color:'#fff',padding:'2rem 2rem 1.75rem',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 75% 40%,rgba(99,179,237,0.1),transparent 55%)',pointerEvents:'none'}}/>
        <div style={{maxWidth:1200,margin:'0 auto',position:'relative'}}>
          <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
            {[['🔒 Restricted — Government of India','#93c5fd'],['GODL v1.0 Licensed','#a3e635'],['API v2.1.0','#fb923c']].map(([t,col],i)=>(
              <span key={i} style={{fontSize:10,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',borderRadius:20,padding:'3px 12px',border:`1px solid ${col}50`,color:col as string,background:`${col}18`}}>{t}</span>
            ))}
          </div>
          <h1 style={{fontSize:'clamp(1.5rem,4vw,2.3rem)',fontWeight:900,margin:'0 0 10px',letterSpacing:-1}}>APIx Sovereign Government API Portal</h1>
          <p style={{fontSize:13,opacity:0.65,maxWidth:680,lineHeight:1.7,margin:0}}>
            Official data gateway for NSO (MoSPI), RBI, DGCA, MoCA and CCI. Per-ministry authentication, policy-contextualised documentation, live test environment, and GODL-licensed bulk exports.
          </p>
        </div>
      </div>

      <div style={{maxWidth:1200,margin:'0 auto',display:'flex',minHeight:'calc(100vh - 180px)'}}>

        {/* Sidebar */}
        <div style={{width:215,flexShrink:0,borderRight:'1px solid rgba(0,0,0,0.08)',padding:'1.25rem 0',position:'sticky',top:56,alignSelf:'flex-start',maxHeight:'calc(100vh - 56px)',overflowY:'auto'}}>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase',opacity:0.35,padding:'0 1.1rem',marginBottom:8}}>Select Ministry</div>
          {MINISTRIES.map(mn=>(
            <button key={mn.id}
              onClick={()=>{setActiveId(mn.id);setTestRes(null);setSchema(false);setTestEp(mn.eps[0].p);}}
              style={{width:'100%',textAlign:'left',border:'none',cursor:'pointer',padding:'9px 1.1rem',display:'flex',alignItems:'center',gap:9,
                background:activeId===mn.id?mn.lb:'transparent',
                borderLeft:activeId===mn.id?`3px solid ${mn.color}`:'3px solid transparent',transition:'all 0.12s'}}>
              <div style={{width:26,height:26,borderRadius:5,background:mn.grad,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:8,fontWeight:800,letterSpacing:'0.05em',flexShrink:0}}>{mn.badge}</div>
              <div>
                <div style={{fontSize:11.5,fontWeight:700,color:activeId===mn.id?mn.color:'inherit',lineHeight:1.3}}>{mn.badge}</div>
                <div style={{fontSize:9.5,opacity:0.45,lineHeight:1.3}}>{mn.tagline}</div>
              </div>
            </button>
          ))}
          <div style={{height:1,background:'rgba(0,0,0,0.08)',margin:'1rem 1.1rem'}}/>
          <div style={{padding:'0 1.1rem'}}>
            <a href={`${B}/docs`} target="_blank" rel="noreferrer" style={{display:'block',fontSize:10.5,color:'#0ea5e9',textDecoration:'none',padding:'4px 0',fontWeight:600}}>↗ Swagger UI / OpenAPI</a>
            <div style={{fontSize:9.5,opacity:0.3,marginTop:3,wordBreak:'break-all'}}>{B}</div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{flex:1,padding:'1.75rem',overflowX:'hidden',minWidth:0}}>

          {/* Ministry header */}
          <div style={{background:`linear-gradient(135deg,${m.color}18,transparent 70%)`,border:`1px solid ${m.color}30`,borderRadius:14,padding:'1.4rem 1.6rem',marginBottom:22,position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,right:0,width:180,height:180,background:`radial-gradient(circle,${m.color}12,transparent 70%)`,pointerEvents:'none'}}/>
            <div style={{display:'flex',alignItems:'flex-start',gap:14,flexWrap:'wrap'}}>
              <div style={{width:50,height:50,borderRadius:12,background:m.grad,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:900,fontSize:12,letterSpacing:'0.06em',flexShrink:0,boxShadow:`0 4px 18px ${m.color}45`}}>{m.badge}</div>
              <div style={{flex:1}}>
                <h2 style={{fontSize:'clamp(1rem,3vw,1.4rem)',fontWeight:800,margin:'0 0 3px',color:m.color}}>{m.name}</h2>
                <div style={{fontSize:11.5,opacity:0.55,marginBottom:7}}>{m.ministry}</div>
                <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
                  <span style={{fontSize:9.5,fontWeight:700,padding:'2px 10px',borderRadius:20,border:`1px solid ${m.lbo}`,background:m.lb,color:m.lt,letterSpacing:'0.08em',textTransform:'uppercase'}}>FULL_READ</span>
                  <span style={{fontSize:9.5,fontWeight:700,padding:'2px 10px',borderRadius:20,border:'1px solid rgba(0,0,0,0.1)',background:'rgba(0,0,0,0.03)',letterSpacing:'0.08em',textTransform:'uppercase'}}>Issued {m.issued}</span>
                </div>
              </div>
              <div style={{background:'rgba(0,0,0,0.04)',borderRadius:9,padding:'9px 13px',maxWidth:330,minWidth:0}}>
                <div style={{fontSize:9.5,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',opacity:0.4,marginBottom:5}}>Your API Key</div>
                <div style={{display:'flex',alignItems:'center',gap:7}}>
                  <code style={{fontFamily:'monospace',fontSize:10.5,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.key}</code>
                  <button onClick={copyKey} style={{background:`${m.color}20`,border:`1px solid ${m.color}40`,borderRadius:6,cursor:'pointer',padding:'3px 9px',fontSize:10.5,fontWeight:700,color:m.color,whiteSpace:'nowrap',flexShrink:0}}>
                    {copied?'✓ Copied':'Copy'}
                  </button>
                </div>
                <div style={{fontSize:9,opacity:0.3,marginTop:4}}>Header: X-Gov-API-Key: {m.key}</div>
              </div>
            </div>
          </div>

          {/* Overview */}
          <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',opacity:0.35,marginBottom:8}}>Overview & Policy Context</div>
          <div style={{background:'var(--card-bg,#fff)',borderRadius:10,border:'1px solid rgba(0,0,0,0.07)',padding:'1.1rem 1.3rem',fontSize:12.5,lineHeight:1.85,opacity:0.82,marginBottom:22,whiteSpace:'pre-line'}}>{m.overview}</div>

          {/* Workflow */}
          <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',opacity:0.35,marginBottom:8}}>Recommended Integration Workflow</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:11,marginBottom:22}}>
            {m.workflow.map((w:any)=>(
              <div key={w.s} style={{background:'var(--card-bg,#fff)',borderRadius:10,border:`1px solid ${m.color}22`,padding:'13px 15px'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:7}}>
                  <div style={{width:22,height:22,borderRadius:5,background:m.grad,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10.5,fontWeight:800,flexShrink:0}}>{w.s}</div>
                  <div style={{fontSize:12,fontWeight:700}}>{w.t}</div>
                </div>
                <div style={{fontSize:11.5,opacity:0.6,lineHeight:1.6}}>{w.d}</div>
              </div>
            ))}
          </div>

          {/* Primary endpoints */}
          <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',opacity:0.35,marginBottom:8}}>Primary Endpoints for {m.badge}</div>
          <div style={{background:'var(--card-bg,#fff)',borderRadius:10,border:'1px solid rgba(0,0,0,0.07)',overflow:'hidden',marginBottom:22}}>
            {m.eps.map((ep:any,i:number)=>(
              <div key={ep.p} style={{display:'flex',alignItems:'center',gap:11,padding:'10px 15px',borderBottom:i<m.eps.length-1?'1px solid rgba(0,0,0,0.05)':'none'}}>
                <span style={{background:'#0ea5e9',color:'#fff',fontSize:9,fontWeight:800,padding:'2px 7px',borderRadius:4,letterSpacing:'0.08em',flexShrink:0}}>GET</span>
                <code style={{fontFamily:'monospace',fontSize:11.5,fontWeight:600,color:m.color,flexShrink:0}}>{ep.p}</code>
                <span style={{fontSize:11.5,opacity:0.6,flex:1}}>{ep.w}</span>
              </div>
            ))}
          </div>

          {/* Code samples */}
          <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',opacity:0.35,marginBottom:8}}>Integration Code — {m.badge} Workflow</div>
          <div style={{display:'flex',gap:6,marginBottom:9}}>
            {(['python','curl','js'] as const).map(l=>(
              <button key={l} onClick={()=>setCodeLang(l)}
                style={{padding:'4px 13px',borderRadius:6,border:'1px solid',fontSize:10.5,fontWeight:700,cursor:'pointer',transition:'all 0.12s',letterSpacing:'0.05em',
                  background:codeLang===l?m.grad:'transparent',
                  color:codeLang===l?'#fff':'inherit',
                  borderColor:codeLang===l?m.color:'rgba(0,0,0,0.12)'}}>
                {l==='js'?'JavaScript':l==='curl'?'cURL':'Python'}
              </button>
            ))}
          </div>
          <pre style={{background:'#0b1120',color:'#cbd5e1',borderRadius:12,padding:'1.3rem',fontFamily:'monospace',fontSize:11,lineHeight:1.75,overflow:'auto',margin:'0 0 22px',whiteSpace:'pre'}}>
            {m[codeLang]}
          </pre>

          {/* Schema */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',opacity:0.35}}>Annotated Response Schema</div>
            <button onClick={()=>setSchema(!schema)} style={{fontSize:10.5,fontWeight:700,padding:'3px 11px',borderRadius:6,border:'1px solid rgba(0,0,0,0.12)',background:'transparent',cursor:'pointer'}}>
              {schema?'▲ Hide':'▼ Show'}
            </button>
          </div>
          {schema && (
            <pre style={{background:'#0b1120',color:'#86efac',borderRadius:12,padding:'1.3rem',fontFamily:'monospace',fontSize:10.5,lineHeight:1.8,overflow:'auto',margin:'0 0 22px',whiteSpace:'pre'}}>
              {m.schema}
            </pre>
          )}

          {/* Live test */}
          <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',opacity:0.35,marginBottom:8}}>Live API Test — Authenticated as {m.badge}</div>
          <div style={{background:'var(--card-bg,#fff)',borderRadius:12,border:'1px solid rgba(0,0,0,0.07)',padding:'1.1rem',marginBottom:32}}>
            <div style={{display:'flex',gap:9,flexWrap:'wrap',marginBottom:7}}>
              <select value={testEp} onChange={e=>setTestEp(e.target.value)}
                style={{flex:1,minWidth:200,padding:'7px 11px',borderRadius:7,border:`1px solid ${m.color}40`,fontSize:11.5,background:'var(--bg,#f8fafc)',fontFamily:'monospace',outline:'none',cursor:'pointer',color:'inherit'}}>
                {m.eps.map((ep:any)=>(
                  <option key={ep.p} value={ep.p}>{ep.p}</option>
                ))}
              </select>
              <button onClick={runTest} disabled={testing}
                style={{padding:'7px 20px',borderRadius:7,border:'none',cursor:'pointer',background:m.grad,color:'#fff',fontWeight:700,fontSize:11.5,opacity:testing?0.6:1,flexShrink:0}}>
                {testing?'…':`▶ Run as ${m.badge}`}
              </button>
            </div>
            <div style={{fontSize:9.5,opacity:0.3,marginBottom:7}}>X-Gov-API-Key: {m.key} · {m.ministry}</div>
            {testRes && (
              <pre style={{background:'#0b1120',color:'#e2e8f0',borderRadius:8,padding:'0.9rem',fontSize:10.5,lineHeight:1.7,overflow:'auto',maxHeight:360,fontFamily:'monospace',whiteSpace:'pre',marginTop:9}}>
                {testRes}
              </pre>
            )}
          </div>

          {/* Footer */}
          <div style={{borderTop:'1px solid rgba(0,0,0,0.07)',paddingTop:14,fontSize:10.5,opacity:0.3,lineHeight:1.9}}>
            <strong>APIx Sovereign Airfare Price Index</strong> · MoCA, Government of India · v2.1.0 · Base July 2022 · GODL v1.0 · apix-ops@moca.gov.in ·{' '}
            <a href={`${B}/docs`} target="_blank" rel="noreferrer" style={{color:'inherit'}}>Swagger UI ↗</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GovAPI;
