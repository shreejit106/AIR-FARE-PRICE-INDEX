import React, { useState } from 'react';
import { API_BASE_URL } from '../config';

const B = API_BASE_URL;

/* ═══════════════════════════════════════════════════════════════════════════
   NATIONAL EMBLEM COMPONENT
═══════════════════════════════════════════════════════════════════════════ */

export const NationalEmblem: React.FC<{ height?: number; width?: number; style?: React.CSSProperties }> = ({
  height = 64,
  width,
  style = {}
}) => (
  <img
    src="/emblem.png"
    alt="State Emblem of India"
    style={{
      height: height,
      width: width ? width : 'auto',
      maxHeight: height,
      objectFit: 'contain',
      display: 'block',
      ...style
    }}
  />
);

/* ═══════════════════════════════════════════════════════════════════════════
   ORGANIZATIONS DATABASE
═══════════════════════════════════════════════════════════════════════════ */

interface OrgInfo {
  id: string;
  badge: string;
  name: string;
  ministry: string;
  department: string;
  key: string;
  tagline: string;
  overview: string;
  workflow: { step: number; title: string; desc: string }[];
  endpoints: { path: string; desc: string; freq: string }[];
  python: string;
  curl: string;
  js: string;
  schema: string;
}

const ORGANIZATIONS: OrgInfo[] = [
  /* ──────────────────────────────────────────────────────────
     1. NATIONAL STATISTICAL OFFICE (MoSPI)
  ────────────────────────────────────────────────────────── */
  {
    id: 'nso',
    badge: 'NSO',
    name: 'National Statistical Office',
    ministry: 'Ministry of Statistics & Programme Implementation',
    department: 'Government of India',
    key: 'NSO-APIX-2026-GOV-7f3a91bc',
    tagline: 'Consumer Price Index (CPI) Transport Calibration & National Accounts',
    overview: `This API integration provides the National Statistical Office (NSO) with high-frequency airfare index feeds for computing the Air Transport component of the official Consumer Price Index (CPI-Urban).

Integration Points:
• Advance Purchase Horizon: NSO consumes the T+7 economy fare index as the headline benchmark, aligning with consumer booking behavior.
• Regional Reconstruction: Per-corridor Laspeyres price relatives provide state-wise transportation cost trends across 80 monitored domestic routes.
• National Accounts: Automated daily data exports provide structured tabular feeds for the MoSPI Data Integration Platform (MDIP).`,
    workflow: [
      { step: 1, title: 'Headline Index Ingestion', desc: 'Query /gov/v1/index daily. Extracts the T+7 headline benchmark for monthly CPI transport sub-index compilation.' },
      { step: 2, title: 'Corridor-Level Regional Breakdown', desc: 'Fetch /gov/v1/corridors to obtain disaggregated Laspeyres price relatives for state-level inflation metrics.' },
      { step: 3, title: 'Automated CSV Ingestion', desc: 'Call /gov/v1/export/index_series to pull bulk CSV format for automated database ingestion.' },
      { step: 4, title: 'Transport CPI Drift Analysis', desc: 'Compare APIx trends against /gov/v1/inflation-timeseries to audit sector-specific airfare deviations from broader transport inflation.' },
    ],
    endpoints: [
      { path: '/gov/v1/index', desc: 'National Headline APIx across T+1, T+7, T+15, T+30, T+45 booking windows', freq: 'Daily' },
      { path: '/gov/v1/corridors', desc: 'Per-corridor price relatives, base fares, representative fares, and DGCA weights for 80 routes', freq: 'Daily / On-demand' },
      { path: '/gov/v1/inflation-timeseries', desc: 'APIx T+7 series reconciled with MoSPI CPI-Transport series', freq: 'Monthly' },
      { path: '/gov/v1/weights', desc: 'Official DGCA passenger-traffic weights W_i for basket reweighting', freq: 'Quarterly' },
      { path: '/gov/v1/export/index_series', desc: 'Bulk CSV dataset export for automated pipelines', freq: 'Automated Nightly' },
    ],
    python: `import requests, csv, io

BASE_URL = "${B}"
HEADERS  = {"X-Gov-API-Key": "NSO-APIX-2026-GOV-7f3a91bc"}

# 1. Fetch Headline APIx for CPI Transport Calibration
response = requests.get(f"{BASE_URL}/gov/v1/index", headers=HEADERS)
data = response.json()

headline = data["data"]["headline_index"]
inflation = data["data"]["headline_inflation_pct"]
print(f"APIx T+7 Headline: {headline:.2f} (+{inflation:.2f}% vs Base Period)")

# 2. Regional Breakdown across Corridors
corridors = requests.get(f"{BASE_URL}/gov/v1/corridors", headers=HEADERS).json()["data"]["corridors"]
print(f"Monitored Routes: {len(corridors)} corridors")
for c in corridors[:3]:
    print(f"  • {c['corridor_id']}: Index={c['corridor_index_t7']:.2f} | Weight={c['dgca_passenger_weight']:.4f}")

# 3. Download CSV for Database Pipeline
csv_res = requests.get(f"{BASE_URL}/gov/v1/export/index_series", headers=HEADERS)
reader = csv.DictReader(io.StringIO(csv_res.text))
for row in reader:
    print(f"  {row['horizon']}: {row['index']} ({row['inflation_pct']}%)")`,
    curl: `# 1. Fetch Headline APIx for CPI Transport Calibration
curl -X GET "${B}/gov/v1/index?cabin_class=Economy" \\
  -H "X-Gov-API-Key: NSO-APIX-2026-GOV-7f3a91bc"

# 2. Ingest Per-Corridor Laspeyres Relatives
curl -X GET "${B}/gov/v1/corridors" \\
  -H "X-Gov-API-Key: NSO-APIX-2026-GOV-7f3a91bc"

# 3. Bulk CSV Download
curl -X GET "${B}/gov/v1/export/index_series" \\
  -H "X-Gov-API-Key: NSO-APIX-2026-GOV-7f3a91bc" \\
  -o "nso_apix_$(date +%Y%m%d).csv"`,
    js: `// Production Node.js / Browser Script for NSO Data Ingestion
const BASE = "${B}";
const KEY  = "NSO-APIX-2026-GOV-7f3a91bc";

async function syncNsoPipeline() {
  const res = await fetch(\`\${BASE}/gov/v1/index\`, {
    headers: { "X-Gov-API-Key": KEY }
  });
  const { meta, data } = await res.json();
  
  console.log("Consumer:", meta.consumer);
  console.log("T+7 CPI-Air Benchmark:", data.headline_index);
  console.log("Horizons Breakdown:", data.index_by_horizon);
}

syncNsoPipeline();`,
    schema: `{
  "meta": {
    "api_version": "v1",
    "system": "APIx — Airfare Price Index Platform",
    "consumer": "National Statistical Office (NSO), MoSPI",
    "generated_at": "2026-09-02T19:49:10Z"
  },
  "data": {
    "headline_horizon": "T+7",
    "headline_index": 125.31,
    "headline_inflation_pct": 25.31,
    "base_period": "July 2022 Base",
    "corridors_monitored": 80,
    "passenger_coverage_pct": 76.4,
    "index_by_horizon": {
      "T+1":  { "index": 148.72, "inflation_pct": 48.72 },
      "T+7":  { "index": 125.31, "inflation_pct": 25.31 },
      "T+15": { "index": 116.44, "inflation_pct": 16.44 },
      "T+30": { "index": 109.83, "inflation_pct": 9.83 },
      "T+45": { "index": 104.12, "inflation_pct": 4.12 }
    }
  }
}`,
  },

  /* ──────────────────────────────────────────────────────────
     2. RESERVE BANK OF INDIA (MPCRD)
  ────────────────────────────────────────────────────────── */
  {
    id: 'rbi',
    badge: 'RBI',
    name: 'Reserve Bank of India',
    ministry: 'Monetary Policy & Research Department',
    department: 'Central Bank of India',
    key: 'RBI-APIX-2026-GOV-4d8e52fa',
    tagline: 'Monetary Policy Committee (MPC) Inflation Modeling & Leading Indicators',
    overview: `This API integration provides the Reserve Bank of India with real-time transportation cost indices to serve as empirical leading indicators for core services inflation.

Monetary Analysis Use-Cases:
• Advance Purchase Spread: Tracks the spread between T+1 (spot/emergency) and T+30 (advance) fares to evaluate route capacity pressures and corporate travel demand.
• Second-Round Pass-Through: Real-time airfare movements provide early insights into commercial overheads before lagged official CPI releases.
• Macro Timeseries Reconciliation: Tracks live index values alongside historical CPI-Transport benchmarks.`,
    workflow: [
      { step: 1, title: 'Monitor Macro Timeseries', desc: 'Pull /gov/v1/inflation-timeseries to evaluate divergence between airfare inflation and headline CPI-Transport.' },
      { step: 2, title: 'Assess Advance-Purchase Spread', desc: 'Calculate the T+1 vs T+30 booking yield spread from /gov/v1/index to evaluate capacity pressures.' },
      { step: 3, title: 'Metro Corridor Heatmap Analysis', desc: 'Identify high-inflation metro corridors driving business travel cost inflation across financial hubs.' },
      { step: 4, title: 'Market Concentration Oversight', desc: 'Cross-reference /gov/v1/market-concentration to evaluate route-level competition trends.' },
    ],
    endpoints: [
      { path: '/gov/v1/inflation-timeseries', desc: 'APIx live benchmark plotted against historical MoSPI CPI-T series', freq: 'Bi-Monthly / MPC Cycle' },
      { path: '/gov/v1/index', desc: 'Horizon breakdown for booking curve spread computations', freq: 'Daily' },
      { path: '/gov/v1/corridors', desc: 'High-density business route inflation monitoring', freq: 'Weekly' },
      { path: '/gov/v1/market-concentration', desc: 'Route-level HHI concentration indices for competition audits', freq: 'Monthly' },
      { path: '/gov/v1/status', desc: 'System operational status and data freshness health check', freq: 'Continuous' },
    ],
    python: `import requests

BASE_URL = "${B}"
HEADERS  = {"X-Gov-API-Key": "RBI-APIX-2026-GOV-4d8e52fa"}

# 1. Ingest Inflation Timeseries for MPC Modeling
res = requests.get(f"{BASE_URL}/gov/v1/inflation-timeseries", headers=HEADERS).json()["data"]
apix_live = res["apix_live_t7"]["index"]
cpi_t_latest = res["mospi_cpi_transport_series"][-1]["cpi_transport_index"]
divergence = apix_live - cpi_t_latest

print("=== RBI MONETARY POLICY RESEARCH BRIEFING ===")
print(f"• APIx Real-Time T+7   : {apix_live:.2f}")
print(f"• Latest MoSPI CPI-T   : {cpi_t_latest:.2f}")
print(f"• Sector Drift Spread  : {divergence:+.2f} pts")

# 2. Measure Booking Horizon Yield Spread (Spot vs Advance)
idx_data = requests.get(f"{BASE_URL}/gov/v1/index", headers=HEADERS).json()["data"]["index_by_horizon"]
spot_spread = idx_data["T+1"]["index"] - idx_data["T+30"]["index"]
print(f"\\n• T+1 Spot vs T+30 Advance Yield Spread: {spot_spread:+.2f} pts")`,
    curl: `# 1. Fetch Macro Inflation Timeseries
curl -X GET "${B}/gov/v1/inflation-timeseries" \\
  -H "X-Gov-API-Key: RBI-APIX-2026-GOV-4d8e52fa"

# 2. Fetch Multi-Horizon Index for Yield Curve Analysis
curl -X GET "${B}/gov/v1/index" \\
  -H "X-Gov-API-Key: RBI-APIX-2026-GOV-4d8e52fa"`,
    js: `// RBI Macroeconomic Integration Script
const BASE = "${B}";
const KEY  = "RBI-APIX-2026-GOV-4d8e52fa";

async function fetchRbiDashboard() {
  const res = await fetch(\`\${BASE}/gov/v1/inflation-timeseries\`, {
    headers: { "X-Gov-API-Key": KEY }
  });
  const data = await res.json();
  console.log("Transport Leading Indicator:", data.data);
}

fetchRbiDashboard();`,
    schema: `{
  "meta": {
    "consumer": "Reserve Bank of India (RBI), MPCRD",
    "endpoint": "/gov/v1/inflation-timeseries",
    "generated_at": "2026-09-02T19:49:12Z"
  },
  "data": {
    "apix_live_t7": {
      "index": 125.31,
      "inflation_pct": 25.31,
      "base_period": "July 2022"
    },
    "mospi_cpi_transport_series": [
      { "date": "2020-01-01", "cpi_transport_index": 100.0, "cpi_inflation_yoy_pct": 3.8 },
      { "date": "2024-01-01", "cpi_transport_index": 121.85, "cpi_inflation_yoy_pct": 5.2 },
      { "date": "2026-01-01", "cpi_transport_index": 130.45, "cpi_inflation_yoy_pct": 6.0 }
    ],
    "divergence_note": "Current APIx T+7 vs latest MoSPI CPI-T comparison."
  }
}`,
  },

  /* ──────────────────────────────────────────────────────────
     3. DIRECTORATE GENERAL OF CIVIL AVIATION (DGCA)
  ────────────────────────────────────────────────────────── */
  {
    id: 'dgca',
    badge: 'DGCA',
    name: 'Directorate General of Civil Aviation',
    ministry: 'Ministry of Civil Aviation',
    department: 'Government of India',
    key: 'DGCA-APIX-2026-GOV-2c1b73de',
    tagline: 'Tariff Surveillance Cell & Price Surge Monitoring',
    overview: `This API integration provides the DGCA Tariff Surveillance Cell (TSC) with real-time price monitoring feeds across domestic airline routes.

Monitoring Capabilities:
• Baseline Benchmarking: Surges are measured against reference base fare schedules across advance booking windows.
• Anomaly Detection: Automatically flags severe price spikes (surges ≥60% classified as critical; 35–60% as high).
• Spot Fare Audits: Specialized T+1 tracking highlights last-minute fare movements across routes during high-demand and peak travel periods.`,
    workflow: [
      { step: 1, title: 'Execute Anomaly Scan', desc: 'Query /gov/v1/price-anomalies?threshold=60 to identify routes exhibiting significant fare surges.' },
      { step: 2, title: 'Spot Fare Review (T+1)', desc: 'Filter for ?horizon=T+1 to analyze last-minute ticket pricing patterns across corridors.' },
      { step: 3, title: 'Extract Route Data', desc: 'Retrieve detailed fare records including airline codes, observed fares, base rates, and surge percentages.' },
      { step: 4, title: 'Competition Cross-Check', desc: 'Cross-reference routes with /gov/v1/market-concentration to review market share and route density.' },
    ],
    endpoints: [
      { path: '/gov/v1/price-anomalies', desc: 'Real-time price surge detection and anomaly feed', freq: 'Continuous' },
      { path: '/gov/v1/base-fares', desc: 'Reference base fare schedules across monitored routes', freq: 'Reference' },
      { path: '/gov/v1/corridors', desc: 'Live median fare tracking across domestic corridors', freq: 'Daily' },
      { path: '/gov/v1/market-concentration', desc: 'Herfindahl-Hirschman Index (HHI) for competition review', freq: 'Weekly' },
      { path: '/gov/v1/export/anomalies', desc: 'CSV export of flagged anomalies and price surges', freq: 'On-Demand' },
    ],
    python: `import requests

BASE_URL = "${B}"
HEADERS  = {"X-Gov-API-Key": "DGCA-APIX-2026-GOV-2c1b73de"}

# 1. Execute Price Surge Audit (Surges >= 60%)
anomalies_res = requests.get(
    f"{BASE_URL}/gov/v1/price-anomalies",
    params={"threshold": 60, "horizon": "T+1"},
    headers=HEADERS
).json()["data"]

print("=== DGCA TARIFF SURVEILLANCE FEED ===")
print(f"• Total Anomalies Detected: {anomalies_res['total_anomalies_detected']}")
print(f"• Critical Surges (>=60%) : {anomalies_res['severity_breakdown']['critical_gte60pct']}")

print("\\nSample Flagged Routes:")
for item in anomalies_res["anomalies"][:4]:
    print(f"  • Route: {item['route_id']:10s} | Airline: {item.get('airline', 'N/A'):20s} | Fare: ₹{item['fare']} (Surge: +{item['surge_pct']:.1f}%)")`,
    curl: `# 1. Scan for Fare Surges (>=60%) on T+1 Bookings
curl -X GET "${B}/gov/v1/price-anomalies?threshold=60&horizon=T%2B1" \\
  -H "X-Gov-API-Key: DGCA-APIX-2026-GOV-2c1b73de"

# 2. Export Compliance Audit CSV
curl -X GET "${B}/gov/v1/export/anomalies" \\
  -H "X-Gov-API-Key: DGCA-APIX-2026-GOV-2c1b73de" \\
  -o "dgca_audit_$(date +%Y%m%d).csv"`,
    js: `// DGCA Tariff Surveillance Integration
const BASE = "${B}";
const KEY  = "DGCA-APIX-2026-GOV-2c1b73de";

async function runDgcaSurveillance() {
  const res = await fetch(\`\${BASE}/gov/v1/price-anomalies?threshold=50\`, {
    headers: { "X-Gov-API-Key": KEY }
  });
  const json = await res.json();
  console.log("Anomalies Flagged:", json.data.total_anomalies_detected);
}

runDgcaSurveillance();`,
    schema: `{
  "meta": {
    "consumer": "Directorate General of Civil Aviation (DGCA)",
    "endpoint": "/gov/v1/price-anomalies",
    "generated_at": "2026-09-02T19:49:19Z"
  },
  "data": {
    "threshold_applied_pct": 60.0,
    "total_anomalies_detected": 161,
    "severity_breakdown": {
      "critical_gte60pct": 161,
      "high_35_60pct": 89,
      "moderate_20_35pct": 62
    },
    "anomalies": [
      {
        "route_id": "DEL-BOM",
        "airline": "IndiGo (6E)",
        "horizon": "T+1",
        "base_fare": 5600,
        "fare": 11200,
        "surge_pct": 100.0,
        "severity": "CRITICAL"
      }
    ]
  }
}`,
  },

  /* ──────────────────────────────────────────────────────────
     4. MINISTRY OF CIVIL AVIATION (MoCA)
  ────────────────────────────────────────────────────────── */
  {
    id: 'moca',
    badge: 'MoCA',
    name: 'Ministry of Civil Aviation',
    ministry: 'MoCA Secretariat',
    department: 'Government of India',
    key: 'MOCA-APIX-2026-GOV-9e4f61aa',
    tagline: 'Regional Connectivity Scheme (UDAN) & Aviation Policy Planning',
    overview: `This API integration provides the Ministry of Civil Aviation with route-level price analytics and connectivity data to support aviation policy planning and regional connectivity programs.

Key Applications:
• Regional Route Affordability: Tracks fare trends across secondary and Tier-2 corridors to assess passenger affordability.
• Tier-2 Corridor Health: Monitors connectivity and fare developments across regional hubs (such as GOI, COK, JAI, IXC, PAT, GAU, BBI).
• Executive Briefings: Supplies certified headline statistics for policy dashboards and departmental reporting.`,
    workflow: [
      { step: 1, title: 'Corridor Affordability Review', desc: 'Screen routes with higher index values to evaluate fare affordability trends.' },
      { step: 2, title: 'Regional Hub Monitoring', desc: 'Filter /gov/v1/corridors for Tier-2 airport pairs to track connectivity and fare health.' },
      { step: 3, title: 'Traffic Weights Review', desc: 'Review /gov/v1/weights against official passenger data to maintain representative route baskets.' },
      { step: 4, title: 'Executive Dashboard Sync', desc: 'Ingest /gov/v1/status and /gov/v1/index for departmental briefings and policy reporting.' },
    ],
    endpoints: [
      { path: '/gov/v1/corridors', desc: '80 monitored routes for affordability and connectivity evaluation', freq: 'Weekly' },
      { path: '/gov/v1/weights', desc: 'DGCA passenger traffic weights W_i for basket governance', freq: 'Quarterly' },
      { path: '/gov/v1/index', desc: 'National headline APIx for executive briefings', freq: 'Daily' },
      { path: '/gov/v1/status', desc: 'Overall system health and scraper operational metrics', freq: 'Continuous' },
      { path: '/gov/v1/export/corridors', desc: 'Bulk route database download for policy review', freq: 'Quarterly' },
    ],
    python: `import requests

BASE_URL = "${B}"
HEADERS  = {"X-Gov-API-Key": "MOCA-APIX-2026-GOV-9e4f61aa"}

# 1. Screen Regional Corridor Trends
corridors = requests.get(f"{BASE_URL}/gov/v1/corridors", headers=HEADERS).json()["data"]["corridors"]

high_fare_routes = [c for c in corridors if (c.get("corridor_index_t7") or 0) > 135]
print("=== MoCA AVIATION POLICY FEED ===")
print(f"• Monitored High-Fare Corridors: {len(high_fare_routes)}")
for c in high_fare_routes[:4]:
    print(f"  - {c['corridor_id']:10s}: Index={c['corridor_index_t7']:.1f} (Fare: ₹{c['representative_fare_inr']:,})")`,
    curl: `# 1. Regional Corridor Fare Scan
curl -X GET "${B}/gov/v1/corridors" \\
  -H "X-Gov-API-Key: MOCA-APIX-2026-GOV-9e4f61aa"

# 2. System Status Overview
curl -X GET "${B}/gov/v1/status" \\
  -H "X-Gov-API-Key: MOCA-APIX-2026-GOV-9e4f61aa"`,
    js: `// MoCA Aviation Policy Ingestion
const BASE = "${B}";
const KEY  = "MOCA-APIX-2026-GOV-9e4f61aa";

async function fetchMocaStatus() {
  const res = await fetch(\`\${BASE}/gov/v1/status\`, {
    headers: { "X-Gov-API-Key": KEY }
  });
  const data = await res.json();
  console.log("Aviation Status Overview:", data);
}

fetchMocaStatus();`,
    schema: `{
  "meta": {
    "consumer": "Ministry of Civil Aviation (MoCA) Secretariat",
    "endpoint": "/gov/v1/corridors",
    "generated_at": "2026-09-02T19:49:14Z"
  },
  "data": {
    "total_corridors": 80,
    "corridors": [
      {
        "corridor_id": "DEL-BOM",
        "origin_iata": "DEL",
        "destination_iata": "BOM",
        "corridor_index_t7": 131.24,
        "representative_fare_inr": 7205,
        "base_fare_inr_july2022": 5490,
        "dgca_passenger_weight": 0.047800
      }
    ]
  }
}`,
  },

  /* ──────────────────────────────────────────────────────────
     5. COMPETITION COMMISSION OF INDIA (CCI)
  ────────────────────────────────────────────────────────── */
  {
    id: 'cci',
    badge: 'CCI',
    name: 'Competition Commission of India',
    ministry: 'Ministry of Corporate Affairs',
    department: 'Government of India',
    key: 'CCI-APIX-2026-GOV-6b2d84ef',
    tagline: 'Market Concentration & Competition Assessment',
    overview: `This API integration provides the Competition Commission of India (CCI) with route-level market structure and concentration metrics to support competition analysis in the aviation sector.

Analytical Focus:
• Market Concentration: Route-by-route Herfindahl-Hirschman Index (HHI) scores to evaluate competitive balance across city pairs.
• Dominance & Pricing Trends: Tracks corridors with high market share alongside price movement data.
• Coordinated Fare Trends: Identifies synchronized multi-carrier fare changes across shared routes.`,
    workflow: [
      { step: 1, title: 'Corridor HHI Surveillance', desc: 'Query /gov/v1/market-concentration to evaluate route-level concentration levels.' },
      { step: 2, title: 'High Concentration Review', desc: 'Filter for routes with HHI ≥ 2500 to review carrier market share and active competitors.' },
      { step: 3, title: 'Price Anomaly Cross-Reference', desc: 'Cross-reference /gov/v1/price-anomalies to inspect pricing behavior on concentrated routes.' },
      { step: 4, title: 'Market Structure Ingest', desc: 'Export structured data feeds for competition assessments and sector studies.' },
    ],
    endpoints: [
      { path: '/gov/v1/market-concentration', desc: 'Route-by-route Herfindahl-Hirschman Index and dominance metrics', freq: 'Daily / On-Demand' },
      { path: '/gov/v1/price-anomalies', desc: 'Multi-carrier anomaly feeds for pricing trend analysis', freq: 'Daily' },
      { path: '/gov/v1/corridors', desc: 'Combined fare inflation and market share structures', freq: 'Weekly' },
      { path: '/gov/v1/base-fares', desc: 'Reference base prices across routes and horizons', freq: 'Reference' },
      { path: '/gov/v1/export/competition', desc: 'Bulk CSV dataset for competition studies', freq: 'On-Demand' },
    ],
    python: `import requests

BASE_URL = "${B}"
HEADERS  = {"X-Gov-API-Key": "CCI-APIX-2026-GOV-6b2d84ef"}

# 1. Fetch Market Concentration Report
comp_data = requests.get(f"{BASE_URL}/gov/v1/market-concentration", headers=HEADERS).json()["data"]
routes = comp_data["routes"]

print("=== CCI COMPETITION ANALYSIS REPORT ===")
print(f"• National Average HHI: {comp_data['national_avg_hhi']:.0f}")
print(f"• High Concentration Routes (HHI >= 2500): {comp_data['summary']['high_concentration_gt2500']}")

# 2. Sample Concentrated Routes
high_hhi_routes = [r for r in routes if r.get("hhi_score", 0) >= 2500]
print(f"\\nSample Concentrated Routes (HHI >= 2500):")
for r in high_hhi_routes[:4]:
    print(f"  • {r['corridor_id']:10s} | Dominant: {r['dominant_carrier']:20s} | Share: {r['dominant_share_pct']:.1f}% | HHI: {r['hhi_score']}")`,
    curl: `# 1. Fetch HHI Competition Assessment
curl -X GET "${B}/gov/v1/market-concentration" \\
  -H "X-Gov-API-Key: CCI-APIX-2026-GOV-6b2d84ef"

# 2. Export Competition Dataset
curl -X GET "${B}/gov/v1/export/competition" \\
  -H "X-Gov-API-Key: CCI-APIX-2026-GOV-6b2d84ef" \\
  -o "cci_competition_$(date +%Y%m%d).csv"`,
    js: `// CCI Market Concentration Integration
const BASE = "${B}";
const KEY  = "CCI-APIX-2026-GOV-6b2d84ef";

async function fetchCciSurveillance() {
  const res = await fetch(\`\${BASE}/gov/v1/market-concentration\`, {
    headers: { "X-Gov-API-Key": KEY }
  });
  const data = await res.json();
  console.log("Market Concentration Summary:", data.data.summary);
}

fetchCciSurveillance();`,
    schema: `{
  "meta": {
    "consumer": "Competition Commission of India (CCI)",
    "endpoint": "/gov/v1/market-concentration",
    "generated_at": "2026-09-02T19:49:14Z"
  },
  "data": {
    "national_avg_hhi": 3883.5,
    "cci_threshold_high_concentration": 2500,
    "summary": {
      "high_concentration_gt2500": 64,
      "pct_high_concentration": 80.0
    },
    "routes": [
      {
        "corridor_id": "DEL-BOM",
        "hhi_score": 4820,
        "dominant_carrier": "IndiGo (6E)",
        "dominant_share_pct": 68.4,
        "fare_inflation_pct": 31.24
      }
    ]
  }
}`,
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT — CLEAN PROFESSIONAL THEME
═══════════════════════════════════════════════════════════════════════════ */

const GovAPI: React.FC = () => {
  const [activeId, setActiveId] = useState<string>('nso');
  const [codeLang, setCodeLang] = useState<'python' | 'curl' | 'js'>('python');
  const [testEp, setTestEp] = useState<string>('/gov/v1/status');
  const [testRes, setTestRes] = useState<string | null>(null);
  const [testing, setTesting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [schemaOpen, setSchemaOpen] = useState<boolean>(false);

  const current = ORGANIZATIONS.find(m => m.id === activeId) || ORGANIZATIONS[0];

  const copyKey = () => {
    navigator.clipboard.writeText(current.key).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const executeLiveTest = async () => {
    setTesting(true);
    setTestRes(null);
    try {
      const r = await fetch(`${B}${testEp}`, {
        headers: { 'X-Gov-API-Key': current.key }
      });
      const data = await r.json();
      setTestRes(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setTestRes(`Execution Error: ${err.message}`);
    }
    setTesting(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Professional Institutional Header ─────────────────────────────────── */}
      <header style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', color: '#ffffff', padding: '24px 32px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 24 }}>
          
          {/* Official Emblem */}
          <div style={{ background: '#ffffff', padding: '6px 10px', borderRadius: 8, flexShrink: 0 }}>
            <NationalEmblem height={60} />
          </div>

          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em', color: '#ffffff' }}>
              Government & Institutional API Gateway
            </h1>
            <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0, maxWidth: 840, lineHeight: 1.5 }}>
              Dedicated, authenticated data APIs designed for consumption by government organizations including the National Statistical Office (MoSPI), Reserve Bank of India (RBI), DGCA, MoCA, and the Competition Commission of India (CCI).
            </p>
          </div>
        </div>
      </header>

      {/* ── Main Layout (Sidebar + Content) ─────────────────────────────────── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', minHeight: 'calc(100vh - 140px)', padding: '24px 0' }}>

        {/* ── Left Organization Navigation ────────────────────────────────── */}
        <aside style={{ width: 300, flexShrink: 0, paddingRight: 24 }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#334155', padding: '12px 16px', fontSize: '12px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Target Organizations
            </div>

            <nav style={{ padding: '8px' }}>
              {ORGANIZATIONS.map(org => {
                const isSelected = activeId === org.id;
                return (
                  <button
                    key={org.id}
                    onClick={() => {
                      setActiveId(org.id);
                      setTestRes(null);
                      setSchemaOpen(false);
                      setTestEp(org.endpoints[0].path);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      border: isSelected ? '1.5px solid #0f172a' : '1px solid transparent',
                      cursor: 'pointer',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      background: isSelected ? '#f1f5f9' : 'transparent',
                      borderRadius: 6,
                      marginBottom: 4,
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <div style={{ flexShrink: 0, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 4, padding: '3px', width: 32, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <NationalEmblem height={36} />
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>{org.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
                        {org.badge} · {org.ministry.split(',')[0]}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          <div style={{ marginTop: 16, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '16px', fontSize: '12px', color: '#475569', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 6, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>
              API Authentication
            </div>
            All requests to <code>/gov/v1/</code> require your organization's API key passed via the <strong style={{ color: '#0f172a' }}>X-Gov-API-Key</strong> HTTP header.
          </div>
        </aside>

        {/* ── Main Organization Content Panel ─────────────────────────────── */}
        <main style={{ flex: 1, minWidth: 0, paddingLeft: 8 }}>

          {/* 1. Organization Header Card */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '24px', marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
              
              <div style={{ flexShrink: 0, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <NationalEmblem height={76} />
              </div>

              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ display: 'inline-block', fontSize: '11px', fontWeight: 800, color: '#0f172a', background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  {current.badge} Integration Profile
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.01em' }}>
                  {current.name}
                </h2>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  {current.ministry} · {current.department}
                </div>
                <div style={{ fontSize: '13px', color: '#334155', fontWeight: 500, marginTop: 4 }}>
                  Focus: <strong>{current.tagline}</strong>
                </div>
              </div>

              {/* API Key Box */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '12px 16px', minWidth: 280 }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  Organization API Key
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 4, padding: '6px 10px' }}>
                  <code style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'monospace', color: '#0f172a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {current.key}
                  </code>
                  <button
                    onClick={copyKey}
                    style={{
                      background: '#0f172a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 4,
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: 6 }}>
                  Header: <code>X-Gov-API-Key: {current.key.substring(0, 16)}...</code>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Overview */}
          <section style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '24px', marginBottom: 24 }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px', borderBottom: '2px solid #f1f5f9', paddingBottom: 8 }}>
              1. Integration Overview & Use Case
            </h3>
            <div style={{ fontSize: '14px', lineHeight: 1.8, color: '#1e293b', whiteSpace: 'pre-line' }}>
              {current.overview}
            </div>
          </section>

          {/* 3. Ingestion Workflow */}
          <section style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '24px', marginBottom: 24 }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px', borderBottom: '2px solid #f1f5f9', paddingBottom: 8 }}>
              2. Recommended Ingestion Pipeline
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {current.workflow.map(w => (
                <div key={w.step} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 4, background: '#0f172a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>
                      {w.step}
                    </div>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>{w.title}</div>
                  </div>
                  <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>{w.desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* 4. Primary Endpoints */}
          <section style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '24px', marginBottom: 24 }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px', borderBottom: '2px solid #f1f5f9', paddingBottom: 8 }}>
              3. Available Endpoints for {current.badge}
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#ffffff' }}>
                    <th style={{ padding: '10px 14px', borderRadius: '4px 0 0 0' }}>Method & Path</th>
                    <th style={{ padding: '10px 14px' }}>Description</th>
                    <th style={{ padding: '10px 14px', borderRadius: '0 4px 0 0' }}>Update Frequency</th>
                  </tr>
                </thead>
                <tbody>
                  {current.endpoints.map((ep, idx) => (
                    <tr key={ep.path} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#0284c7', whiteSpace: 'nowrap' }}>
                        <span style={{ background: '#0f172a', color: '#ffffff', padding: '2px 6px', borderRadius: 3, fontSize: '10px', marginRight: 6 }}>GET</span>
                        {ep.path}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#1e293b', fontWeight: 500 }}>{ep.desc}</td>
                      <td style={{ padding: '12px 14px', color: '#64748b', fontWeight: 600 }}>{ep.freq}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 5. Client Code Samples */}
          <section style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '24px', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                4. Client Implementation Samples ({current.badge})
              </h3>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['python', 'curl', 'js'] as const).map(lang => (
                  <button
                    key={lang}
                    onClick={() => setCodeLang(lang)}
                    style={{
                      padding: '5px 14px',
                      borderRadius: 4,
                      border: '1px solid #0f172a',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: codeLang === lang ? '#0f172a' : '#ffffff',
                      color: codeLang === lang ? '#ffffff' : '#0f172a'
                    }}
                  >
                    {lang === 'python' ? 'Python' : lang === 'curl' ? 'cURL' : 'JavaScript'}
                  </button>
                ))}
              </div>
            </div>

            <pre style={{ background: '#0b1120', color: '#f8fafc', padding: '18px', borderRadius: 6, fontSize: '12.5px', lineHeight: 1.7, fontFamily: "'JetBrains Mono', monospace", overflowX: 'auto', margin: 0 }}>
              {current[codeLang]}
            </pre>
          </section>

          {/* 6. Response Schema */}
          <section style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '24px', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                5. Response Schema & Envelope
              </h3>
              <button
                onClick={() => setSchemaOpen(!schemaOpen)}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: 4,
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: '#0f172a'
                }}
              >
                {schemaOpen ? '▲ Hide Schema' : '▼ View Schema'}
              </button>
            </div>

            {schemaOpen && (
              <pre style={{ background: '#0b1120', color: '#4ade80', padding: '18px', borderRadius: 6, fontSize: '12px', lineHeight: 1.7, fontFamily: "'JetBrains Mono', monospace", overflowX: 'auto', marginTop: 14 }}>
                {current.schema}
              </pre>
            )}
          </section>

          {/* 7. Live API Test Console */}
          <section style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '24px', marginBottom: 24 }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>
              6. Interactive API Explorer ({current.badge})
            </h3>
            <p style={{ fontSize: '13px', color: '#475569', marginTop: 0, marginBottom: 16 }}>
              Execute live requests using the pre-configured API key for <strong>{current.name}</strong>.
            </p>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <select
                value={testEp}
                onChange={e => setTestEp(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: 260,
                  padding: '10px 14px',
                  borderRadius: 6,
                  border: '1.5px solid #0f172a',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  background: '#f8fafc',
                  color: '#0f172a',
                  fontWeight: 600
                }}
              >
                {current.endpoints.map(ep => (
                  <option key={ep.path} value={ep.path}>GET {ep.path}</option>
                ))}
              </select>

              <button
                onClick={executeLiveTest}
                disabled={testing}
                style={{
                  padding: '10px 24px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#0f172a',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  opacity: testing ? 0.7 : 1
                }}
              >
                {testing ? 'Sending...' : '▶ Send Request'}
              </button>
            </div>

            {testRes && (
              <pre style={{ background: '#0b1120', color: '#e2e8f0', padding: '16px', borderRadius: 6, fontSize: '12px', lineHeight: 1.6, maxHeight: 420, overflow: 'auto', fontFamily: 'monospace', margin: 0 }}>
                {testRes}
              </pre>
            )}
          </section>

          {/* ── Footer ────────────────────────────────────────────────────── */}
          <footer style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16, fontSize: '12px', color: '#64748b', lineHeight: 1.8 }}>
            APIx Airfare Price Index Platform · Institutional Integration API Services · Base Period: July 2022
          </footer>
        </main>
      </div>
    </div>
  );
};

export default GovAPI;
