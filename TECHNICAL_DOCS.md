# 📖 APIx Technical Documentation & System Specifications

---

## 1. Overview & System Scope
**APIx (Airfare Price Index)** is an econometric price monitoring system designed for the **Ministry of Civil Aviation (MoCA)**, **Directorate General of Civil Aviation (DGCA)**, and **Competition Commission of India (CCI)**.

It measures pure price inflation in Indian domestic commercial air travel using a fixed-basket **Modified Laspeyres Aggregation** weighted by quarterly passenger traffic volume across an **80-Route Sovereign Domestic Basket**.

---

## 2. Mathematical Specifications

### 2.1 Outlier Sanitization (IQR Bound Filter)
For each route $r$ and lead-time horizon $h \in \{T+1, T+7, T+15, T+30, T+45\}$:
$$\text{IQR} = Q_3 - Q_1$$
$$\text{Lower Bound} = Q_1 - 1.5 \times \text{IQR}$$
$$\text{Upper Bound} = Q_3 + 1.5 \times \text{IQR}$$
$$\text{CleanedFares}_{r,h,t} = \{ p \in \text{Fares}_{r,h,t} \mid \text{Lower Bound} \le p \le \text{Upper Bound} \}$$

### 2.2 Representative Price ($P_{r,t}$)
The representative fare at date $t$ is calculated as the robust median of cleaned observations:
$$P_{r,t} = \text{Median}(\text{CleanedFares}_{r,h,t})$$

### 2.3 Route Passenger Weighting ($w_r$)
Derived from DGCA Form A/B passenger matrices across the 80-route basket:
$$w_r = \frac{\text{PAX}_r}{\sum_{k=1}^{80} \text{PAX}_k}, \quad \sum_{r=1}^{80} w_r = 1.0$$

### 2.4 Modified Laspeyres Price Index ($\text{APIx}_t$)
$$\text{APIx}_t = \left[ \sum_{r=1}^{80} w_r \times \left( \frac{P_{r,t}}{P_{r,0}} \right) \right] \times 100$$
* $\text{APIx}_0 = 100.0$ (Baseline).

### 2.5 Market Concentration Index (HHI)
$$HHI_r = \sum_{i=1}^{N} (s_{i,r} \times 100)^2$$
* $s_{i,r} = \frac{\text{Flights}_{i,r}}{\sum_{j=1}^N \text{Flights}_{j,r}}$

---

## 3. Database Schema (`models.py`)

```sql
-- Raw scraped observations
CREATE TABLE raw_fares (
    id SERIAL PRIMARY KEY,
    origin VARCHAR(3) NOT NULL,
    destination VARCHAR(3) NOT NULL,
    airline VARCHAR(2) NOT NULL,
    flight_no VARCHAR(10),
    query_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    travel_date DATE NOT NULL,
    lead_time VARCHAR(10) NOT NULL,
    total_fare FLOAT NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    source VARCHAR(50)
);

-- IQR-cleaned representative daily medians
CREATE TABLE representative_fares (
    id SERIAL PRIMARY KEY,
    origin VARCHAR(3) NOT NULL,
    destination VARCHAR(3) NOT NULL,
    query_date DATE NOT NULL,
    lead_time VARCHAR(10) NOT NULL,
    representative_fare FLOAT NOT NULL
);

-- DGCA passenger volume weights
CREATE TABLE route_weights (
    id SERIAL PRIMARY KEY,
    origin VARCHAR(3) NOT NULL,
    destination VARCHAR(3) NOT NULL,
    weight FLOAT NOT NULL,
    effective_from DATE,
    effective_to DATE
);

-- Historic Index time series
CREATE TABLE apix_index (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    lead_time VARCHAR(10) NOT NULL,
    apix_value FLOAT NOT NULL
);
```

---

## 4. API Endpoints Specification

| Method | Endpoint | Description | Query Parameters |
|---|---|---|---|
| `GET` | `/api/heatmap` | Returns 80-route fare matrix, delta vs base, and current APIx level | `horizon` (default: `T+30`) |
| `GET` | `/api/timeseries` | Returns historic daily APIx index and airline sub-indices | `range` (`1M`, `3M`, `6M`, `1Y`, `ALL`) |
| `GET` | `/api/routes` | Returns list of all 80 domestic routes with city names and weights | None |
| `GET` | `/api/analysts/anomalies` | Returns price gouging audit records and IQR boundaries | `threshold`, `horizon`, `route` |
| `GET` | `/api/analysts/competition` | Returns route-level HHI antitrust matrix & flight shares | None |
| `GET` | `/api/analysts/cpi-comparison` | Returns MOSPI CPI correlation and transport inflation alignment | None |
| `GET` | `/api/analysts/export/{dataset}` | Downloads full CSV datasets (`summary`, `weights`, `anomalies`, `competition`) | None |
| `GET` | `/logos/{filename}` | Serves airline brand assets for edge-free hero banners | None |

---

## 5. Security, Cartographic Compliance & Sovereignty
* **Survey of India Compliance:** All interactive and static maps strictly follow official Survey of India boundary maps (100% integral Indian territory).
* **Privacy & Fair Use:** Data collection is non-PII (flight pricing and flight numbers only) with rate-limiting backoffs.
