# APIx — Airfare Price Index

A traffic-weighted airfare inflation index for Indian domestic air travel — conceptually similar to how CPI weights consumption categories by expenditure share, applied to flight fares.

## The Problem

A flat, unweighted average of airfare prices across all routes misrepresents real inflation in air travel. A price spike on a low-traffic Tier-2 to Tier-2 route (e.g. Indore–Coimbatore) shouldn't move a national index as much as a spike on a high-traffic trunk route (e.g. Delhi–Mumbai). Yet that's exactly what a naive average does.

## The Idea

Weight each route's fare movement by how much passenger traffic actually flows through it — the same principle CPI uses for a consumption basket — and aggregate into a single index (APIx), with route-level and airline-level sub-indices underneath it. Positioned as a candidate input or cross-check for the "Transport → Air Travel" component of India's CPI.

## Pipeline

Airline + OTA fare data
↓ Real-time collection (T+1, T+7, T+15, T+30, T+45)
↓ Cleaning & normalisation (dedup, outliers, missing data)
↓ Representative fare per route per horizon (median-based)
↓ Weighted aggregation → AIRFARE PRICE INDEX (APIx)
↓ Route-wise index | Airline-wise index | Trend & heatmap dashboard
↓ Candidate input / cross-check for CPI's Transport → Air Travel sub-index

## How the Index Works

Laspeyres-type, fixed-weight index — same family as CPI itself:
`APIx(t) = Σ [ weight_route × ( fare_route(t) / fare_route(base) ) ] × 100`

- **Base period**: a fixed date, index set to 100
- **Weight**: each route's share of total domestic passenger traffic, fixed at base period, refreshed periodically
- **Fare**: median representative fare per route per horizon, after outlier filtering

**Example**: weighted average fare ₹5,000 at base, ₹6,000 now → APIx = 120 → airfares up ~20% on a traffic-weighted basis.

## Data Sources

| Layer | Source | Access |
|---|---|---|
| Route/passenger weights | [Vonter/india-aviation-traffic](https://github.com/Vonter/india-aviation-traffic) (DGCA-derived) | Static CSV |
| Airport/airline reference | OurAirports, OpenFlights | Static CSV |
| Live fares | Amadeus for Developers — Flight Offers Search API | Free self-service/test tier |
| Official traffic stats (validation) | DGCA monthly/quarterly reports | Scraped — no official API exists |

We deliberately did not scrape OTAs (MakeMyTrip, Cleartrip, etc.) or airline websites — their Terms of Service explicitly prohibit automated access, and a dataset positioned as a CPI-adjacent index needs to stand on defensible data provenance. Amadeus is the ToS-compliant equivalent of the same GDS-backed fare data those platforms themselves draw from.

## Cleaning Rules

- Dedup on (origin, destination, airline, flight no, travel date, query run)
- Missing data: forward-fill within a horizon for ≤1 day, otherwise flagged, never silently imputed
- Sold-out flights excluded, logged separately as a capacity-stress signal
- Outliers filtered per route per horizon (IQR / MAD) before taking the median
- Airline and airport names normalised to IATA codes
- All fares forced to INR, all-in (base + taxes)

## Prototype Scope

Given the build window, this prototype covers:
- **Routes**: 6–8 marquee city pairs (e.g. DEL–BOM, DEL–BLR, BOM–BLR, DEL–HYD, BOM–GOI, DEL–CCU)
- **Horizons**: T+7 and T+30
- **Cabin class**: Economy only

Full network coverage (all routes, all five horizons, airline-level drill-down) is the natural next step, not a limitation of the method — it's a scope cut made for prototype timelines.

## Dashboard

- Headline APIx + % change since base + week-on-week / month-on-month
- Route-wise current fares across horizons
- Airline-wise average fares and airline index
- Time-series trend of APIx
- Heatmap: routes × horizons
- Top gainers / decliners
- Data-quality panel (records collected, % missing, % flagged as outliers) — included specifically because credibility of the underlying data matters if this is ever positioned near CPI

## Tech Stack

- **Collection**: scheduled jobs hitting the Amadeus API per route/horizon
- **Storage**: Postgres (Supabase)
- **Processing**: Python (pandas) — cleaning, outlier filtering, median calculation, index math
- **Dashboard**: Streamlit

## Open Questions (for judges / roadmap discussion)

- Single blended APIx vs. separate indices per booking horizon?
- Route weight refresh cadence — quarterly (recommended) or annually?
- How to onboard new/emerging airports (Navi Mumbai, Noida/Jewar) as traffic ramps up?
- Minimum sample size per route/horizon before a fare is "statistically reliable"?
- Governance: who audits the weight table and outlier thresholds before numbers are published?
