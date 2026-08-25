# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Streamlit (Python), Postgres (Supabase), pandas

## Users

- Hackathon Judges / Evaluators reviewing the APIx methodology, logic, and data quality.
- Government Statisticians / Economists evaluating it as a candidate input for CPI.
- Analysts or Journalists reporting on aviation trends.

## Product Purpose

To provide a traffic-weighted airfare inflation index for Indian domestic air travel (APIx). It aggregates fare data based on actual passenger traffic rather than a flat average, serving as a more accurate reflection of airfare inflation and a candidate input for the "Transport → Air Travel" component of India's CPI.

## Positioning

A traffic-weighted, Laspeyres-type fixed-weight index for airfares based on real Amadeus GDS-backed data, distinct from naive averages or non-compliant scraped OTA data.

## Operating Context

A web dashboard displaying time-series trends of APIx, route-wise current fares, airline indices, heatmaps, top gainers/decliners, and a critical data-quality panel. Users interact with this dashboard to evaluate the index's credibility, track inflation, or judge the prototype.

## Capabilities and Constraints

- **Scope:** 6–8 marquee city pairs (e.g., DEL-BOM, DEL-BLR). Horizons: T+7 and T+30. Cabin class: Economy.
- **Data Sourcing:** Must use Amadeus API for ToS-compliant live fares. No OTA scraping.
- **Processing:** Missing data is forward-filled for ≤1 day max. Sold-out flights are excluded and logged. Outliers are filtered per route/horizon using IQR/MAD before median calculation. Fares forced to INR, all-in.

## Evidence on Hand

- Route/passenger weights derived from DGCA (Vonter/india-aviation-traffic).
- Airport/airline references (OurAirports, OpenFlights).
- Documented cleaning rules and index math (Laspeyres-type).

## Product Principles

- **Defensible Provenance:** Rely on ToS-compliant GDS data to maintain institutional credibility.
- **Methodological Rigor:** Apply proven economic principles (traffic-weighting, outlier filtering) rather than naive averages.
- **Radical Transparency:** Surface data quality, missing data, and outlier flags directly in the UI to build trust with evaluators and economists.
