import React, { useState } from 'react';
import { API_BASE_URL } from '../config';

const B = API_BASE_URL;

/* ═══════════════════════════════════════════════════════════════════════════
   OFFICIAL SOVEREIGN SEALS & VECTOR LOGOS (HIGH PRECISION SVG)
═══════════════════════════════════════════════════════════════════════════ */

// 1. NSO / MoSPI: State Emblem of India (Ashoka Lion Capital) + Data Roundel
const NsoLogo: React.FC<{ size?: number }> = ({ size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
    <circle cx="50" cy="50" r="44" stroke="#d97706" strokeWidth="1.5" strokeDasharray="3 2" />
    {/* Ashoka Pillar / Emblem Stylized */}
    <path d="M50 18 L55 28 L45 28 Z" fill="#fbbf24" />
    <rect x="42" y="28" width="16" height="12" rx="2" fill="#d97706" />
    <circle cx="50" cy="34" r="3" fill="#0f172a" stroke="#fbbf24" strokeWidth="1" />
    {/* Statistical Graph bars */}
    <rect x="28" y="58" width="8" height="18" rx="1.5" fill="#38bdf8" />
    <rect x="40" y="48" width="8" height="28" rx="1.5" fill="#fbbf24" />
    <rect x="52" y="53" width="8" height="23" rx="1.5" fill="#38bdf8" />
    <rect x="64" y="42" width="8" height="34" rx="1.5" fill="#f59e0b" />
    {/* Base plinth */}
    <line x1="22" y1="78" x2="78" y2="78" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
    <text x="50" y="88" textAnchor="middle" fill="#94a3b8" fontSize="6.5" fontWeight="700" letterSpacing="0.8">MoSPI · NSO</text>
  </svg>
);

// 2. RBI: Reserve Bank of India Seal (Palm Tree & Tiger Roundel)
const RbiLogo: React.FC<{ size?: number }> = ({ size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="#064e3b" stroke="#34d399" strokeWidth="2" />
    <circle cx="50" cy="50" r="43" stroke="#fef08a" strokeWidth="1" />
    {/* Palm Tree trunk and fronds */}
    <path d="M50 38 Q50 62 52 68 L48 68 Q49 52 50 38" fill="#fef08a" />
    <path d="M50 38 Q38 30 32 36 Q42 38 50 40" fill="#fef08a" />
    <path d="M50 38 Q62 30 68 36 Q58 38 50 40" fill="#fef08a" />
    <path d="M50 38 Q42 22 46 18 Q50 26 50 38" fill="#fef08a" />
    <path d="M50 38 Q58 22 54 18 Q50 26 50 38" fill="#fef08a" />
    {/* Prowling Tiger Silhouette */}
    <path d="M30 62 Q36 56 46 58 Q56 56 64 62 Q66 66 62 67 Q54 64 44 65 Q36 67 30 62 Z" fill="#fef08a" />
    <line x1="24" y1="70" x2="76" y2="70" stroke="#a7f3d0" strokeWidth="2" strokeLinecap="round" />
    <text x="50" y="84" textAnchor="middle" fill="#ecfdf5" fontSize="7" fontWeight="800" letterSpacing="1">RESERVE BANK OF INDIA</text>
  </svg>
);

// 3. DGCA: Directorate General of Civil Aviation (Wings + Ashoka Emblem)
const DgcaLogo: React.FC<{ size?: number }> = ({ size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="#1e293b" stroke="#cbd5e1" strokeWidth="2" />
    <circle cx="50" cy="50" r="44" stroke="#38bdf8" strokeWidth="1.2" />
    {/* Golden Aviation Wings */}
    <path d="M50 45 C35 32 18 36 12 46 C24 47 38 46 50 50 Z" fill="#f59e0b" />
    <path d="M50 45 C65 32 82 36 88 46 C76 47 62 46 50 50 Z" fill="#f59e0b" />
    {/* Aircraft Center Silhouette */}
    <path d="M50 26 L53 44 L66 52 L66 56 L53 53 L53 62 L57 66 L57 69 L50 67 L43 69 L43 66 L47 62 L47 53 L34 56 L34 52 L47 44 Z" fill="#ffffff" />
    {/* Circular Chakra at Base */}
    <circle cx="50" cy="50" r="5" fill="none" stroke="#0284c7" strokeWidth="1.5" />
    <text x="50" y="84" textAnchor="middle" fill="#e2e8f0" fontSize="7.5" fontWeight="800" letterSpacing="1.2">DGCA · INDIA</text>
  </svg>
);

// 4. MoCA: Ministry of Civil Aviation (Sovereign Wings & Ashoka Lion)
const MocaLogo: React.FC<{ size?: number }> = ({ size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2" />
    <circle cx="50" cy="50" r="44" stroke="#fbbf24" strokeWidth="1.2" strokeDasharray="4 2" />
    {/* Sovereign Wing Arch */}
    <path d="M50 32 C30 20 15 28 14 44 C26 40 40 38 50 42 C60 38 74 40 86 44 C85 28 70 20 50 32 Z" fill="#fbbf24" />
    {/* Ashoka Lion Symbol */}
    <rect x="44" y="44" width="12" height="16" rx="2" fill="#e0e7ff" />
    <circle cx="50" cy="50" r="3" fill="#1e1b4b" stroke="#fbbf24" strokeWidth="1" />
    {/* Tricolour Base Accent */}
    <line x1="30" y1="67" x2="70" y2="67" stroke="#ea580c" strokeWidth="2" />
    <line x1="30" y1="70" x2="70" y2="70" stroke="#ffffff" strokeWidth="2" />
    <line x1="30" y1="73" x2="70" y2="73" stroke="#16a34a" strokeWidth="2" />
    <text x="50" y="86" textAnchor="middle" fill="#e0e7ff" fontSize="7" fontWeight="800" letterSpacing="1">MINISTRY OF CIVIL AVIATION</text>
  </svg>
);

// 5. CCI: Competition Commission of India (Scales of Justice & Antitrust Roundel)
const CciLogo: React.FC<{ size?: number }> = ({ size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="#4c0519" stroke="#f43f5e" strokeWidth="2" />
    <circle cx="50" cy="50" r="44" stroke="#fecdd3" strokeWidth="1" />
    {/* Scales of Justice Balance Beam */}
    <line x1="50" y1="22" x2="50" y2="66" stroke="#fbbf24" strokeWidth="2.5" />
    <line x1="28" y1="34" x2="72" y2="34" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
    {/* Left Scale Pan */}
    <line x1="28" y1="34" x2="22" y2="48" stroke="#fecdd3" strokeWidth="1.2" />
    <line x1="28" y1="34" x2="34" y2="48" stroke="#fecdd3" strokeWidth="1.2" />
    <path d="M20 48 Q28 54 36 48 Z" fill="#fbbf24" />
    {/* Right Scale Pan */}
    <line x1="72" y1="34" x2="66" y2="48" stroke="#fecdd3" strokeWidth="1.2" />
    <line x1="72" y1="34" x2="78" y2="48" stroke="#fecdd3" strokeWidth="1.2" />
    <path d="M64 48 Q72 54 80 48 Z" fill="#fbbf24" />
    {/* Plinth */}
    <path d="M42 66 L58 66 L62 72 L38 72 Z" fill="#fbbf24" />
    <text x="50" y="85" textAnchor="middle" fill="#ffe4e6" fontSize="6.5" fontWeight="800" letterSpacing="0.8">COMPETITION COMMISSION</text>
  </svg>
);

/* ═══════════════════════════════════════════════════════════════════════════
   INSTITUTIONAL MINISTRIES DATABASE
═══════════════════════════════════════════════════════════════════════════ */

interface MinistryInfo {
  id: string;
  badge: string;
  name: string;
  ministry: string;
  key: string;
  tagline: string;
  issued: string;
  LogoComponent: React.FC<{ size?: number }>;
  overview: string;
  workflow: { step: number; title: string; desc: string }[];
  endpoints: { path: string; desc: string; freq: string }[];
  python: string;
  curl: string;
  js: string;
  schema: string;
}

const MINISTRIES: MinistryInfo[] = [
  /* ──────────────────────────────────────────────────────────
     1. NATIONAL STATISTICAL OFFICE (MoSPI)
  ────────────────────────────────────────────────────────── */
  {
    id: 'nso',
    badge: 'NSO',
    name: 'National Statistical Office',
    ministry: 'Ministry of Statistics & Programme Implementation (MoSPI)',
    key: 'NSO-APIX-2026-GOV-7f3a91bc',
    tagline: 'Consumer Price Index (CPI) Transport Calibration & National Accounts',
    issued: '01 Sep 2026',
    LogoComponent: NsoLogo,
    overview: `The National Statistical Office (NSO) under MoSPI is the sovereign authority for national accounts and price indices in India. The APIx platform serves as the direct data feed for calibrating the Air Transport Sub-Index of the Consumer Price Index (CPI-Urban).

Methodology Integration:
• Advance Purchase Horizon: NSO consumes the T+7 economy fare index as the headline proxy, representing typical consumer booking patterns.
• Regional Reconstruction: Per-corridor Laspeyres price relatives are ingested to calculate state-wise transportation cost pressures across 80 high-density routes.
• National Accounts Integration: Automated daily pipelines export CSV tables directly into the MoSPI Data Integration Platform (MDIP).`,
    workflow: [
      { step: 1, title: 'Headline Index Ingestion', desc: 'Query /gov/v1/index daily at 06:30 IST. Extracts T+7 headline benchmark for monthly CPI-Air transport sub-index compilation.' },
      { step: 2, title: 'Corridor-Level Regional Weighting', desc: 'Fetch /gov/v1/corridors to obtain disaggregated Laspeyres price relatives for state-level inflation metrics.' },
      { step: 3, title: 'Automated MDIP Ingestion', desc: 'Call /gov/v1/export/index_series to download bulk CSV format for automated database ingestion.' },
      { step: 4, title: 'Macro Transport CPI Drift Analysis', desc: 'Compare real-time APIx against /gov/v1/inflation-timeseries to audit sector-specific airfare deviations from broader transport inflation.' },
    ],
    endpoints: [
      { path: '/gov/v1/index', desc: 'National Headline APIx across T+1, T+7, T+15, T+30, T+45 booking windows', freq: 'Daily (06:30 IST)' },
      { path: '/gov/v1/corridors', desc: 'Per-corridor price relatives, base fares, representative fares, and DGCA weights for 80 routes', freq: 'Daily / On-demand' },
      { path: '/gov/v1/inflation-timeseries', desc: 'APIx T+7 series reconciled with MoSPI CPI-Transport series (2010–present)', freq: 'Monthly / Quarterly' },
      { path: '/gov/v1/weights', desc: 'Official DGCA passenger-traffic weights W_i for basket reweighting', freq: 'Quarterly' },
      { path: '/gov/v1/export/index_series', desc: 'Bulk CSV dataset export licensed under GODL-India v1.0', freq: 'Automated Nightly' },
    ],
    python: `import requests, csv, io

BASE_URL = "${B}"
HEADERS  = {"X-Gov-API-Key": "NSO-APIX-2026-GOV-7f3a91bc"}

# 1. Fetch Headline APIx for CPI-Air Transport Calibration
response = requests.get(f"{BASE_URL}/gov/v1/index", headers=HEADERS)
data = response.json()

headline = data["data"]["headline_index"]
inflation = data["data"]["headline_inflation_pct"]
print(f"Sovereign APIx (T+7 Headline): {headline:.2f} (+{inflation:.2f}% vs July 2022 Base)")

# 2. Regional Breakdown across Corridors
corridors = requests.get(f"{BASE_URL}/gov/v1/corridors", headers=HEADERS).json()["data"]["corridors"]
print(f"Monitored DGCA Corridors: {len(corridors)} routes")
for c in corridors[:3]:
    print(f"  • {c['corridor_id']}: Index={c['corridor_index_t7']:.2f} | Weight={c['dgca_passenger_weight']:.4f}")

# 3. Download CSV for MoSPI Data Integration Platform (MDIP)
csv_res = requests.get(f"{BASE_URL}/gov/v1/export/index_series", headers=HEADERS)
reader = csv.DictReader(io.StringIO(csv_res.text))
print("\\nMDIP Ingest Sample:")
for row in reader:
    print(f"  {row['horizon']}: {row['index']} ({row['inflation_pct']}%)")`,
    curl: `# 1. Fetch Headline APIx for CPI Transport Calibration
curl -X GET "${B}/gov/v1/index?cabin_class=Economy" \\
  -H "X-Gov-API-Key: NSO-APIX-2026-GOV-7f3a91bc"

# 2. Ingest Per-Corridor Laspeyres Relatives
curl -X GET "${B}/gov/v1/corridors" \\
  -H "X-Gov-API-Key: NSO-APIX-2026-GOV-7f3a91bc"

# 3. Automated Bulk CSV Download for MoSPI MDIP
curl -X GET "${B}/gov/v1/export/index_series" \\
  -H "X-Gov-API-Key: NSO-APIX-2026-GOV-7f3a91bc" \\
  -o "mospi_apix_$(date +%Y%m%d).csv"`,
    js: `// Production Node.js / Browser Script for NSO Data Ingestion
const BASE = "${B}";
const KEY  = "NSO-APIX-2026-GOV-7f3a91bc";

async function syncNsoPipeline() {
  const res = await fetch(\`\${BASE}/gov/v1/index\`, {
    headers: { "X-Gov-API-Key": KEY }
  });
  const { meta, data } = await res.json();
  
  console.log("Authority:", meta.consumer);
  console.log("T+7 CPI-Air Benchmark:", data.headline_index);
  console.log("Horizons Breakdown:", data.index_by_horizon);
}

syncNsoPipeline();`,
    schema: `{
  "meta": {
    "api_version": "v1",
    "system": "APIx — Sovereign Airfare Price Index",
    "operator": "Ministry of Civil Aviation (MoCA), Government of India",
    "consumer": "National Statistical Office (NSO), MoSPI",
    "generated_at": "2026-09-02T19:49:10Z",
    "license": "Government Open Data License (GODL) India v1.0"
  },
  "data": {
    "headline_horizon": "T+7",
    "headline_index": 125.31,
    "headline_inflation_pct": 25.31,
    "base_period": "July 2022 (MoCA Tariff Deregulation)",
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
    ministry: 'Monetary Policy & Research Department (MPCRD)',
    key: 'RBI-APIX-2026-GOV-4d8e52fa',
    tagline: 'Monetary Policy Committee (MPC) Inflation Dashboard & Leading Indicator',
    issued: '01 Sep 2026',
    LogoComponent: RbiLogo,
    overview: `The Monetary Policy Department of the Reserve Bank of India utilizes the APIx sovereign index as an empirical leading indicator of core service sector inflation.

Monetary Surveillance Use-Cases:
• Yield Curve Booking Spread: Tracks the spread between T+1 (spot/emergency) and T+30 (advance) fares as a proxy for supply bottlenecks and corporate travel demand.
• Second-Round Pass-Through: Air transport inflation feeds directly into wholesale commercial overheads and corporate travel balance sheets.
• MPC Briefing Integration: The real-time T+7 series provides early insight into transport cost pressures ahead of lagged official CPI publication.`,
    workflow: [
      { step: 1, title: 'Monitor MPC Macro Timeseries', desc: 'Pull /gov/v1/inflation-timeseries to evaluate divergence between airfare inflation and headline CPI-Transport.' },
      { step: 2, title: 'Assess Advance-Purchase Spread', desc: 'Calculate the T+1 vs T+30 booking yield spread from /gov/v1/index to detect underlying route capacity crunches.' },
      { step: 3, title: 'Metro Corridor Heatmap Analysis', desc: 'Identify high-inflation metro corridors (T+7 > 130) driving corporate travel cost inflation across major financial hubs.' },
      { step: 4, title: 'Antitrust Monopoly Cost Check', desc: 'Cross-reference /gov/v1/market-concentration to distinguish competitive cost-push inflation from monopolistic rent extraction.' },
    ],
    endpoints: [
      { path: '/gov/v1/inflation-timeseries', desc: 'APIx live benchmark plotted against historical MoSPI CPI-T series', freq: 'Bi-Monthly / MPC Cycle' },
      { path: '/gov/v1/index', desc: 'Horizon breakdown for booking curve spread computations', freq: 'Daily' },
      { path: '/gov/v1/corridors', desc: 'High-density business route inflation monitoring', freq: 'Weekly' },
      { path: '/gov/v1/market-concentration', desc: 'Route-level HHI concentration indices for competition audits', freq: 'Monthly' },
      { path: '/gov/v1/status', desc: 'System operational status and data freshness health check', freq: 'Automated' },
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
print(f"• Assessment Note      : {res['divergence_note']}")

# 2. Measure Booking Horizon Yield Spread (Spot vs Advance)
idx_data = requests.get(f"{BASE_URL}/gov/v1/index", headers=HEADERS).json()["data"]["index_by_horizon"]
spot_spread = idx_data["T+1"]["index"] - idx_data["T+30"]["index"]
print(f"\\n• T+1 Spot vs T+30 Advance Yield Spread: {spot_spread:+.2f} pts")
print(f"• Market Status: {'CAPACITY PRESSURE HIGH' if spot_spread > 35 else 'NORMAL CAPACITY'}")`,
    curl:`# 1. Fetch Macro Inflation Timeseries
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
  console.log("MPC Transport Leading Indicator:", data.data);
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
    "divergence_note": "Current APIx T+7 (125.31) vs latest MoSPI CPI-T (130.45): Sector-specific airfare inflation running below broader transport CPI."
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
    ministry: 'Ministry of Civil Aviation, Government of India',
    key: 'DGCA-APIX-2026-GOV-2c1b73de',
    tagline: 'Tariff Surveillance Cell & Price Gouging Enforcement Radar',
    issued: '01 Sep 2026',
    LogoComponent: DgcaLogo,
    overview: `The Directorate General of Civil Aviation (DGCA) Tariff Surveillance Cell (TSC) uses APIx to enforce fair pricing rules under the Aircraft Rules 1937 and DGCA Tariff Guidelines.

Enforcement Capabilities:
• Sovereign Baseline Benchmarking: Surges are assessed strictly against the July 2022 statutory base fares P_{i,0,h}, providing legally sound evidence.
• Automated Anomaly Thresholds: Surges ≥60% trigger CRITICAL enforcement flags for immediate inquiry; surges 35–60% trigger HIGH surveillance flags.
• Last-Minute Spot Fare Audits: Specialized T+1 monitoring exposes predatory pricing during festive, peak travel, and adverse weather disruptions.`,
    workflow: [
      { step: 1, title: 'Execute Morning Anomaly Scan', desc: 'Query /gov/v1/price-anomalies?threshold=60 at 08:00 IST to detect all routes exhibiting severe fare surges.' },
      { step: 2, title: 'Spot Gouging Investigation (T+1)', desc: 'Filter for ?horizon=T+1 to identify predatory last-minute ticket pricing across monitored routes.' },
      { step: 3, title: 'Extract Carrier Dossiers', desc: 'Export detailed records containing carrier flight codes, observed fares, base rates, and surge percentages for regulatory notices.' },
      { step: 4, title: 'Escalate High-HHI Violations to CCI', desc: 'Identify routes combining HHI ≥ 2500 with CRITICAL surges for joint enforcement under Section 4 of the Competition Act.' },
    ],
    endpoints: [
      { path: '/gov/v1/price-anomalies', desc: 'Real-time price surge detection and anomaly radar', freq: 'Continuous / Hourly' },
      { path: '/gov/v1/base-fares', desc: 'Sovereign July 2022 schedule P_{i,0,h} across all routes and horizons', freq: 'Reference Base' },
      { path: '/gov/v1/corridors', desc: 'Live median fare tracking for Tariff Surveillance Cell', freq: 'Daily' },
      { path: '/gov/v1/market-concentration', desc: 'Herfindahl-Hirschman Index (HHI) for competition oversight', freq: 'Weekly' },
      { path: '/gov/v1/export/anomalies', desc: 'CSV export for regulatory show-cause notice documentation', freq: 'On-Demand' },
    ],
    python: `import requests

BASE_URL = "${B}"
HEADERS  = {"X-Gov-API-Key": "DGCA-APIX-2026-GOV-2c1b73de"}

# 1. Execute Morning Price Gouging Audit (Surges >= 60%)
anomalies_res = requests.get(
    f"{BASE_URL}/gov/v1/price-anomalies",
    params={"threshold": 60, "horizon": "T+1"},
    headers=HEADERS
).json()["data"]

print("=== DGCA TARIFF SURVEILLANCE CELL AUDIT ===")
print(f"• Total Critical Anomalies Detected: {anomalies_res['total_anomalies_detected']}")
print(f"• Critical Surges (>=60% Base)     : {anomalies_res['severity_breakdown']['critical_gte60pct']}")

print("\\nActionable Show-Cause Notice Candidates:")
for item in anomalies_res["anomalies"][:5]:
    print(f"  • Route: {item['route_id']:10s} | Airline: {item.get('airline', 'N/A'):20s} | Base: ₹{item['base_fare']} -> Fare: ₹{item['fare']} (Surge: +{item['surge_pct']:.1f}%)")`,
    curl: `# 1. Scan for Critical Fare Surges (>=60%) on T+1 Bookings
curl -X GET "${B}/gov/v1/price-anomalies?threshold=60&horizon=T%2B1" \\
  -H "X-Gov-API-Key: DGCA-APIX-2026-GOV-2c1b73de"

# 2. Export Compliance Audit CSV
curl -X GET "${B}/gov/v1/export/anomalies" \\
  -H "X-Gov-API-Key: DGCA-APIX-2026-GOV-2c1b73de" \\
  -o "dgca_violations_$(date +%Y%m%d).csv"`,
    js: `// DGCA Automated Tariff Surveillance Integration
const BASE = "${B}";
const KEY  = "DGCA-APIX-2026-GOV-2c1b73de";

async function runDgcaSurveillance() {
  const res = await fetch(\`\${BASE}/gov/v1/price-anomalies?threshold=50\`, {
    headers: { "X-Gov-API-Key": KEY }
  });
  const json = await res.json();
  console.log("Violations Flagged:", json.data.total_anomalies_detected);
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
        "severity": "CRITICAL",
        "iqr_breach": true
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
    ministry: 'MoCA Secretariat, Government of India',
    key: 'MOCA-APIX-2026-GOV-9e4f61aa',
    tagline: 'National Civil Aviation Policy (NCAP) 2016 & Regional Connectivity (UDAN)',
    issued: '01 Sep 2026',
    LogoComponent: MocaLogo,
    overview: `The Ministry of Civil Aviation (MoCA) Secretariat maintains sovereign oversight over the National Civil Aviation Policy (NCAP 2016) and the Regional Connectivity Scheme (UDAN).

Policy Applications:
• UDAN Scheme Affordability: Corridors exhibiting sustained T+7 index >140 are flagged as unaffordable, qualifying for Viability Gap Funding (VGF); routes below 105 indicate commercial self-sustainability.
• Tier-2 Regional Connectivity: Continuous tracking of Tier-2 and regional nodes (e.g. GOI, COK, JAI, IXC, PAT, GAU, BBI) to prevent market underservice.
• Weekly Ministerial Briefings: Provides certified headline statistics for parliamentary and cabinet dashboards.`,
    workflow: [
      { step: 1, title: 'UDAN Affordability Review', desc: 'Screen corridors with T+7 index > 140 to identify routes requiring Viability Gap Funding intervention.' },
      { step: 2, title: 'Tier-2 Connectivity Monitoring', desc: 'Filter /gov/v1/corridors for regional airports to verify sustained affordability and route health.' },
      { step: 3, title: 'Quarterly Basket Reweighting', desc: 'Audit /gov/v1/weights against DGCA annual passenger figures to update corridor traffic weights.' },
      { step: 4, title: 'Ministerial Dashboard Briefing', desc: 'Pull /gov/v1/status and /gov/v1/index for weekly executive reports presented to the Hon’ble Minister.' },
    ],
    endpoints: [
      { path: '/gov/v1/corridors', desc: '80 monitored routes for UDAN screening and connectivity evaluation', freq: 'Weekly' },
      { path: '/gov/v1/weights', desc: 'DGCA passenger traffic weights W_i for basket governance', freq: 'Quarterly' },
      { path: '/gov/v1/index', desc: 'National headline APIx for executive cabinet briefings', freq: 'Daily (06:00 IST)' },
      { path: '/gov/v1/status', desc: 'Overall system health and scraper operational metrics', freq: 'Continuous' },
      { path: '/gov/v1/export/corridors', desc: 'Bulk route database download for parliamentary review', freq: 'Quarterly' },
    ],
    python: `import requests

BASE_URL = "${B}"
HEADERS  = {"X-Gov-API-Key": "MOCA-APIX-2026-GOV-9e4f61aa"}
TIER2_AIRPORTS = {"GOI", "COK", "JAI", "IXC", "PAT", "GAU", "BBI"}

# 1. Screen UDAN Affordability Candidates (Index > 140)
corridors = requests.get(f"{BASE_URL}/gov/v1/corridors", headers=HEADERS).json()["data"]["corridors"]

udan_candidates = [c for c in corridors if (c.get("corridor_index_t7") or 0) > 140]
viable_routes   = [c for c in corridors if (c.get("corridor_index_t7") or 0) < 105]

print("=== MoCA NCAP / UDAN POLICY DASHBOARD ===")
print(f"• High-Fare Corridors (UDAN Subsidy Review): {len(udan_candidates)}")
for c in udan_candidates[:4]:
    print(f"  - {c['corridor_id']:10s}: Index={c['corridor_index_t7']:.1f} (Fare: ₹{c['representative_fare_inr']:,})")

print(f"\\n• Market Viable Routes (Subsidy Phase-out): {len(viable_routes)}")`,
    curl: `# 1. UDAN Affordability Corridor Scan
curl -X GET "${B}/gov/v1/corridors" \\
  -H "X-Gov-API-Key: MOCA-APIX-2026-GOV-9e4f61aa"

# 2. Executive System Health Status
curl -X GET "${B}/gov/v1/status" \\
  -H "X-Gov-API-Key: MOCA-APIX-2026-GOV-9e4f61aa"`,
    js: `// MoCA Ministerial Dashboard Ingestion
const BASE = "${B}";
const KEY  = "MOCA-APIX-2026-GOV-9e4f61aa";

async function fetchMocaStatus() {
  const res = await fetch(\`\${BASE}/gov/v1/status\`, {
    headers: { "X-Gov-API-Key": KEY }
  });
  const data = await res.json();
  console.log("Ministerial Aviation Status:", data);
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
        "dgca_passenger_weight": 0.047800,
        "annual_passenger_estimate": 7170000
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
    ministry: 'Ministry of Corporate Affairs, Government of India',
    key: 'CCI-APIX-2026-GOV-6b2d84ef',
    tagline: 'Antitrust Enforcement, Merger Combinations & Abuse of Dominance Review',
    issued: '01 Sep 2026',
    LogoComponent: CciLogo,
    overview: `The Competition Commission of India (CCI) utilizes APIx market concentration analytics under the Competition Act 2002 (as amended 2023).

Antitrust Inquiries:
• Section 4 (Abuse of Dominance): Routes where a single carrier holds >70% market share while imposing fare inflation >40% above base are flagged for immediate preliminary investigation.
• Section 3 (Cartelization & Collusion): Identifies synchronized multi-carrier fare spikes occurring within the same booking horizon on high-density routes.
• Combination Regulations: Evaluates pre- and post-merger Herfindahl-Hirschman Index (HHI) changes against the statutory threshold of 2500 points.`,
    workflow: [
      { step: 1, title: 'Corridor HHI Surveillance', desc: 'Query /gov/v1/market-concentration daily. Routes with HHI ≥ 2500 are automatically flagged for antitrust scrutiny.' },
      { step: 2, title: 'Abuse of Dominance Audit (Sec. 4)', desc: 'Filter for routes combining carrier market share > 70% with price inflation > 40% above baseline.' },
      { step: 3, title: 'Cartel Coordination Screen (Sec. 3)', desc: 'Cross-reference /gov/v1/price-anomalies to detect simultaneous spikes across 3+ carriers on identical corridors.' },
      { step: 4, title: 'Merger Simulation Pre-Clearance', desc: 'Simulate post-combination HHI increases for airline merger applications prior to regulatory approval.' },
    ],
    endpoints: [
      { path: '/gov/v1/market-concentration', desc: 'Route-by-route Herfindahl-Hirschman Index and dominance metrics', freq: 'Daily / On-Demand' },
      { path: '/gov/v1/price-anomalies', desc: 'Multi-carrier anomaly feeds for cartel detection', freq: 'Daily' },
      { path: '/gov/v1/corridors', desc: 'Combined fare inflation and market share structures', freq: 'Weekly' },
      { path: '/gov/v1/base-fares', desc: 'Legal benchmark prices for damage and excessive pricing audits', freq: 'Reference Base' },
      { path: '/gov/v1/export/competition', desc: 'Bulk CSV dataset for COMPAT tribunal proceedings', freq: 'Case-Specific' },
    ],
    python: `import requests
from collections import Counter

BASE_URL = "${B}"
HEADERS  = {"X-Gov-API-Key": "CCI-APIX-2026-GOV-6b2d84ef"}

# 1. Fetch Antitrust Market Concentration Report
comp_data = requests.get(f"{BASE_URL}/gov/v1/market-concentration", headers=HEADERS).json()["data"]
routes = comp_data["routes"]

print("=== CCI ANTITRUST SURVEILLANCE REPORT ===")
print(f"• National Average HHI: {comp_data['national_avg_hhi']:.0f} (High Conc. Threshold: 2500)")
print(f"• High Concentration Routes (HHI >= 2500): {comp_data['summary']['high_concentration_gt2500']}")

# 2. Identify Section 4 Abuse of Dominance Candidates
sec4_candidates = [
    r for r in routes
    if (r.get("dominant_share_pct") or 0) > 70 and (r.get("fare_inflation_pct") or 0) > 40
]

print(f"\\nSection 4 Dominance Candidates (Share > 70% & Inflation > 40%): {len(sec4_candidates)}")
for r in sec4_candidates[:5]:
    print(f"  • {r['corridor_id']:10s} | Carrier: {r['dominant_carrier']:20s} | Share: {r['dominant_share_pct']:.1f}% | HHI: {r['hhi_score']}")`,
    curl: `# 1. Fetch Complete HHI Competition Assessment
curl -X GET "${B}/gov/v1/market-concentration" \\
  -H "X-Gov-API-Key: CCI-APIX-2026-GOV-6b2d84ef"

# 2. Export Competition Dataset for Tribunal Evidence
curl -X GET "${B}/gov/v1/export/competition" \\
  -H "X-Gov-API-Key: CCI-APIX-2026-GOV-6b2d84ef" \\
  -o "cci_antitrust_$(date +%Y%m%d).csv"`,
    js: `// CCI Antitrust & Merger Clearance Integration
const BASE = "${B}";
const KEY  = "CCI-APIX-2026-GOV-6b2d84ef";

async function fetchCciSurveillance() {
  const res = await fetch(\`\${BASE}/gov/v1/market-concentration\`, {
    headers: { "X-Gov-API-Key": KEY }
  });
  const data = await res.json();
  console.log("National HHI Overview:", data.data.summary);
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
        "fare_inflation_pct": 31.24,
        "cci_flag": "HIGH CONCENTRATION — REVIEW WARRANTED"
      }
    ]
  }
}`,
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT — INSTITUTIONAL THEME
═══════════════════════════════════════════════════════════════════════════ */

const GovAPI: React.FC = () => {
  const [activeId, setActiveId] = useState<string>('nso');
  const [codeLang, setCodeLang] = useState<'python' | 'curl' | 'js'>('python');
  const [testEp, setTestEp] = useState<string>('/gov/v1/status');
  const [testRes, setTestRes] = useState<string | null>(null);
  const [testing, setTesting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [schemaOpen, setSchemaOpen] = useState<boolean>(false);

  const current = MINISTRIES.find(m => m.id === activeId) || MINISTRIES[0];
  const Logo = current.LogoComponent;

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
    <div style={{ minHeight: '100vh', background: '#f1f5f9', color: '#0f172a', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Official Sovereign Banner ────────────────────────────────────────── */}
      <header style={{ background: '#091e3a', borderBottom: '3px solid #d97706', color: '#ffffff', padding: '24px 32px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', background: '#1e3a5f', border: '1px solid #3b82f6', color: '#93c5fd', padding: '3px 12px', borderRadius: 4 }}>
                Sovereign Government Gateway
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: '#14532d', border: '1px solid #22c55e', color: '#86efac', padding: '3px 12px', borderRadius: 4 }}>
                GODL-India v1.0 Licensed
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b' }}>
                REST API v2.1.0
              </span>
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 900, margin: '0 0 6px', letterSpacing: '-0.02em', color: '#ffffff' }}>
              APIx Sovereign Government Data Access Portal
            </h1>
            <p style={{ fontSize: '14px', color: '#cbd5e1', margin: 0, maxWidth: 840, lineHeight: 1.6 }}>
              Restricted data distribution interface operated by the Ministry of Civil Aviation (MoCA) for the National Statistical Office (MoSPI), Reserve Bank of India, DGCA, and Competition Commission of India.
            </p>
          </div>

          <div style={{ textAlign: 'right', borderLeft: '1px solid #1e3a5f', paddingLeft: 24 }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Base API Host</div>
            <code style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 700, fontFamily: 'monospace' }}>{B}</code>
            <div style={{ marginTop: 6 }}>
              <a href={`${B}/docs`} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#fbbf24', textDecoration: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                OpenAPI Specification (Swagger) ↗
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Layout (Sidebar + Content) ─────────────────────────────────── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', minHeight: 'calc(100vh - 150px)', padding: '24px 0' }}>

        {/* ── Left Ministry Navigation ────────────────────────────────────── */}
        <aside style={{ width: 280, flexShrink: 0, paddingRight: 24 }}>
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ background: '#0f172a', color: '#ffffff', padding: '12px 16px', fontSize: '12px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Authorized Sovereign Entities
            </div>

            <nav style={{ padding: '8px' }}>
              {MINISTRIES.map(m => {
                const isSelected = activeId === m.id;
                const MinLogo = m.LogoComponent;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setActiveId(m.id);
                      setTestRes(null);
                      setSchemaOpen(false);
                      setTestEp(m.endpoints[0].path);
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
                      background: isSelected ? '#f8fafc' : 'transparent',
                      borderRadius: 6,
                      marginBottom: 4,
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <div style={{ flexShrink: 0 }}>
                      <MinLogo size={42} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>{m.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>{m.badge} · {m.ministry.split(',')[0]}</div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          <div style={{ marginTop: 16, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8, padding: '16px', fontSize: '12px', color: '#475569', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 6, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>
              Security & Authentication
            </div>
            All requests to <code>/gov/v1/</code> require a valid pre-issued key passed in the <strong style={{ color: '#0f172a' }}>X-Gov-API-Key</strong> HTTP header.
          </div>
        </aside>

        {/* ── Main Ministry Content Panel ─────────────────────────────────── */}
        <main style={{ flex: 1, minWidth: 0, paddingLeft: 8 }}>

          {/* 1. Ministry Header Card */}
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8, padding: '24px', marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ flexShrink: 0 }}>
                <Logo size={72} />
              </div>

              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ display: 'inline-block', fontSize: '11px', fontWeight: 800, color: '#091e3a', background: '#e2e8f0', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  {current.badge} Sovereign Authority
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.01em' }}>
                  {current.name}
                </h2>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                  {current.ministry}
                </div>
                <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: 500 }}>
                  Primary Mandate: <strong>{current.tagline}</strong>
                </div>
              </div>

              {/* API Key Box */}
              <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: 6, padding: '12px 16px', minWidth: 280 }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  Official Access Key
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#ffffff', border: '1px solid #94a3b8', borderRadius: 4, padding: '6px 10px' }}>
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

          {/* 2. Institutional Overview */}
          <section style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8, padding: '24px', marginBottom: 24 }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px', borderBottom: '2px solid #e2e8f0', paddingBottom: 8 }}>
              1. Institutional Mandate & Policy Context
            </h3>
            <div style={{ fontSize: '14px', lineHeight: 1.8, color: '#1e293b', whiteSpace: 'pre-line' }}>
              {current.overview}
            </div>
          </section>

          {/* 3. Integration Workflow */}
          <section style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8, padding: '24px', marginBottom: 24 }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px', borderBottom: '2px solid #e2e8f0', paddingBottom: 8 }}>
              2. Recommended Statutory Ingestion Workflow
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {current.workflow.map(w => (
                <div key={w.step} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6, padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 4, background: '#0f172a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 900 }}>
                      {w.step}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{w.title}</div>
                  </div>
                  <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6 }}>{w.desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* 4. Primary Endpoints Table */}
          <section style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8, padding: '24px', marginBottom: 24 }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px', borderBottom: '2px solid #e2e8f0', paddingBottom: 8 }}>
              3. Primary Endpoints Available for {current.badge}
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#ffffff' }}>
                    <th style={{ padding: '10px 14px', borderRadius: '4px 0 0 0' }}>Method & Path</th>
                    <th style={{ padding: '10px 14px' }}>Description & Institutional Use</th>
                    <th style={{ padding: '10px 14px', borderRadius: '0 4px 0 0' }}>Update Cadence</th>
                  </tr>
                </thead>
                <tbody>
                  {current.endpoints.map((ep, idx) => (
                    <tr key={ep.path} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#0369a1', whiteSpace: 'nowrap' }}>
                        <span style={{ background: '#0284c7', color: '#ffffff', padding: '2px 6px', borderRadius: 3, fontSize: '10px', marginRight: 6 }}>GET</span>
                        {ep.path}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#1e293b', fontWeight: 500 }}>{ep.desc}</td>
                      <td style={{ padding: '12px 14px', color: '#475569', fontWeight: 600 }}>{ep.freq}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 5. Production Integration Code */}
          <section style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8, padding: '24px', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                4. Production Client Code Sample ({current.badge})
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
                    {lang === 'python' ? 'Python (requests)' : lang === 'curl' ? 'cURL' : 'JavaScript (fetch)'}
                  </button>
                ))}
              </div>
            </div>

            <pre style={{ background: '#0b1120', color: '#f8fafc', padding: '18px', borderRadius: 6, fontSize: '12.5px', lineHeight: 1.7, fontFamily: "'JetBrains Mono', monospace", overflowX: 'auto', margin: 0 }}>
              {current[codeLang]}
            </pre>
          </section>

          {/* 6. Annotated Schema Inspector */}
          <section style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8, padding: '24px', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                5. Sovereign Response Envelope & Schema
              </h3>
              <button
                onClick={() => setSchemaOpen(!schemaOpen)}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #94a3b8',
                  borderRadius: 4,
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: '#0f172a'
                }}
              >
                {schemaOpen ? '▲ Collapse Schema' : '▼ Expand Schema'}
              </button>
            </div>

            {schemaOpen && (
              <pre style={{ background: '#0b1120', color: '#4ade80', padding: '18px', borderRadius: 6, fontSize: '12px', lineHeight: 1.7, fontFamily: "'JetBrains Mono', monospace", overflowX: 'auto', marginTop: 14 }}>
                {current.schema}
              </pre>
            )}
          </section>

          {/* 7. Live Interactive Test Console */}
          <section style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8, padding: '24px', marginBottom: 24 }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>
              6. Live Interactive Test Console (Authenticated as {current.badge})
            </h3>
            <p style={{ fontSize: '13px', color: '#475569', marginTop: 0, marginBottom: 16 }}>
              Execute real-time requests against the sovereign API gateway using the pre-authenticated key for <strong>{current.name}</strong>.
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
                {testing ? 'Executing...' : `▶ Execute Request`}
              </button>
            </div>

            {testRes && (
              <pre style={{ background: '#0b1120', color: '#e2e8f0', padding: '16px', borderRadius: 6, fontSize: '12px', lineHeight: 1.6, maxHeight: 420, overflow: 'auto', fontFamily: 'monospace', margin: 0 }}>
                {testRes}
              </pre>
            )}
          </section>

          {/* ── Footer ────────────────────────────────────────────────────── */}
          <footer style={{ borderTop: '1px solid #cbd5e1', paddingTop: 16, fontSize: '12px', color: '#64748b', lineHeight: 1.8 }}>
            <strong>Ministry of Civil Aviation (MoCA)</strong> · Government of India · Tariff Surveillance & Sovereign Airfare Price Index System · Version 2.1.0 · Base Period: July 2022 · Licensed under GODL-India v1.0
          </footer>
        </main>
      </div>
    </div>
  );
};

export default GovAPI;
