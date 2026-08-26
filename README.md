# ✈️ APIx — National Airfare Price Index & Regulatory Intelligence Platform

> **An empirical, passenger-traffic-weighted airfare inflation index, antitrust monitoring suite, and macroeconomic forecasting engine for Indian domestic aviation.**

---

## 📌 Executive Summary

India's domestic aviation sector is one of the fastest-growing in the world, yet price monitoring has historically relied on unweighted spot checks and manual inquiries. A simple arithmetic average of flight fares misrepresents true consumer inflation—a ₹2,000 price surge on a low-density regional route (e.g. *Indore–Coimbatore*) moves an unweighted average as much as the same surge on a mega trunk corridor (*Delhi–Mumbai*), despite carrying a tiny fraction of the flying public.

**APIx (Airfare Price Index)** resolves this by applying an **econometrically rigorous Modified Laspeyres Index** weighted by DGCA quarterly passenger traffic volumes ($w_r$) across an **80-route sovereign domestic basket** covering over **92% of scheduled seat capacity** across 5 distinct booking horizons ($T+1$, $T+7$, $T+15$, $T+30$, and $T+45$).

---

## 🏛 Platform Architecture

```
                                  [DATA SOURCES]
             ┌──────────────────────────┴──────────────────────────┐
             ▼                                                     ▼
     [DGCA Form A/B Reports]                               [Live OTA & GDS Feeds]
  (Quarterly Passenger Volumes)                       (80 Routes × 5 Horizons × Airlines)
             │                                                     │
             ▼                                                     ▼
 [Passenger Weight Table w_r]                          [Data Ingestion & Normalizer]
             │                                                     │
             │                                                     ▼
             │                                     [IQR Outlier Filtration Engine]
             │                                     [Q1 - 1.5·IQR, Q3 + 1.5·IQR]
             │                                                     │
             │                                                     ▼
             │                                     [Representative Median Fares P_rt]
             │                                                     │
             └──────────────────────────┬──────────────────────────┘
                                        ▼
                   [Modified Laspeyres Index Engine (Base = 100.0)]
                   APIx_t = Σ [ w_r × ( P_r,t / P_r,0 ) ] × 100
                                        │
     ┌──────────────────┬───────────────┴───────────────┬──────────────────┐
     ▼                  ▼                               ▼                  ▼
[✈️ Calculator]   [📐 Methodology]              [🔮 Simulation]      [🛩 Fleet & Carriers]
Live Fare Heatmap  Index Math & Weight Alloc    ATF Shock & Radar    Aviation Intel & Logos
     │
     ▼
[🏛 For Analysts: DGCA Executive Brief + Antitrust HHI Matrix + MOSPI CPI Integration]
```

---

## 📊 Core Mathematical & Statistical Formulations

### 1. Statistical Outlier Removal (Interquartile Range - IQR)
To eliminate flash promotional pricing, error fares, and predatory surge gouging from distorting the basket:
$$\text{IQR} = Q_3 - Q_1$$
$$\text{Valid Range} = \left[ Q_1 - 1.5 \times \text{IQR},\;\; Q_3 + 1.5 \times \text{IQR} \right]$$
Fares outside this interval are flagged as anomalies and excluded prior to median computation.

### 2. Representative Route-Horizon Price ($P_{r,t,h}$)
The representative fare for route $r$, lead time $h$, at date $t$ is the robust median:
$$P_{r,t,h} = \text{Median}\left( \text{CleanedFares}_{r,t,h} \right)$$

### 3. Route Passenger Traffic Weight ($w_r$)
Calculated from DGCA quarterly Form A/B passenger matrices across the 80-route basket:
$$w_r = \frac{\text{PAX}_r}{\sum_{k=1}^{80} \text{PAX}_k}, \quad \text{where } \sum_{r=1}^{80} w_r = 1.0$$

### 4. Modified Laspeyres Price Index ($\text{APIx}_t$)
$$\text{APIx}_t = \sum_{r=1}^{80} \left( w_r \times \frac{P_{r,t}}{P_{r,0}} \right) \times 100$$
* **Baseline ($t=0$):** Fixed at $100.0$.
* An $\text{APIx}_t = 118.4$ represents an exact **$+18.4\%$ weighted inflation** in domestic air travel costs.

### 5. Antitrust Market Concentration (Herfindahl-Hirschman Index - HHI)
$$HHI_r = \sum_{i=1}^{N} (s_{i,r} \times 100)^2$$
* $s_{i,r}$ = Market flight share of carrier $i$ on route $r$.
* **Thresholds:**
  * $HHI < 1500$: Highly Competitive
  * $1500 \le HHI \le 2500$: Moderately Concentrated
  * $HHI > 2500$: **Monopoly Risk / Oligopoly (Flagged for CCI review)**

### 6. ATF (Jet Fuel) Cost Shock Elasticity Model
$$\Delta \text{APIx} = \text{ATF\_Shock}\% \times \text{Fuel\_Cost\_Share} \times \text{Pass\_Through\_Rate}$$
* **Fuel Cost Share:** $\approx 35\%\text{--}40\%$ of airline Operating Expenses (OPEX).
* **Pass-Through Rate:** Configurable (Low = 0.55, Medium = 0.70, Aggressive = 0.85).

---

## 🗂 Navigation & Feature Modules

| Module | Route | Key Capabilities |
|---|---|---|
| **✈️ Calculator** | `/dashboard` | Interactive India route map (100% Survey of India compliant), 80-route fare heatmap, horizon toggle ($T+1$ to $T+45$), and aggregate index stats. |
| **📐 Methodology** | `/methodology` | Unified portal toggleable between **"📊 Index Mathematics"** (formulas, IQR bounds, CPI comparison) and **"⚖️ Weight Allocation"** (DGCA passenger traffic weights & seat capacities). |
| **🏛 For Analysts** | `/analysts` | Policy monitoring suite: Outlier threshold sliders, HHI antitrust route matrix, MOSPI CPI correlation, 4 downloadable CSV datasets, and the **📄 1-Click DGCA Executive Brief Generator** with A4 print formatting. |
| **🔮 Simulation** | `/simulation` | Interactive **⛽ ATF Fuel Price Shock Simulator** with ₹ Billion consumer burden projections, plus **📊 Carrier Pricing Aggressiveness Scorecards** and 5-axis competitive radars. |
| **🛩 Fleet & Carriers** | `/fleet` | Aerospace-grade carrier cockpit: Live scrolling ticker, edge-free blended airline banners with real brand logos, fleet composition tables, and consumer booking strategy guides. |

---

## 💻 Tech Stack & Architecture

* **Frontend:** React 19, TypeScript, Vite, Plotly.js, Lucide Icons, Custom CSS Glassmorphism Design System.
* **Backend:** FastAPI (Python 3.10+), Uvicorn ASGI Server, Pydantic, Asynchronous Endpoints.
* **Statistical Computing:** Python (`pandas`, `numpy`, `scipy`).
* **Database & Persistence:** SQLAlchemy ORM (`models.py`) with PostgreSQL production schema (`raw_fares`, `representative_fares`, `route_weights`, `apix_index`) running on embedded SQLite for portable evaluation.
* **Data Pipelines:** Python background workers (`pipeline.py`, `scraper.py`, `dgca_scraper.py`) architected with Apache Airflow DAG specifications.

---

## 🚀 Quick Start Guide (Local Execution)

### 1. Prerequisites
* Python 3.10+
* Node.js 18+ and npm

### 2. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate      # On Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
* Backend API Documentation: `http://localhost:8000/docs`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
* Web Application: `http://localhost:5173`

---

## 📄 SIH 2026 Presentation Document
The official 6-slide landscape PDF presentation prepared for the Smart India Hackathon 2026 is available in the root folder:
👉 **[SIH2026_APIx_Idea_Presentation.pdf](SIH2026_APIx_Idea_Presentation.pdf)**

---

## 📜 Regulatory Standards & Citations
1. **DGCA (Directorate General of Civil Aviation):** Monthly Domestic Air Traffic Statistics & Form A/B City-Pair Passenger Volume Reports ([dgca.gov.in](https://www.dgca.gov.in)).
2. **MOSPI (Ministry of Statistics & Programme Implementation):** Consumer Price Index Manual & Laspeyres Index Weighting Principles ([mospi.gov.in](https://www.mospi.gov.in)).
3. **Competition Commission of India (CCI):** Market Concentration Assessment Standards & Herfindahl-Hirschman Index (HHI) Guidelines.
4. **ICAO (International Civil Aviation Organization):** Doc 9626 — *Manual on the Regulation of International Air Transport (Tariff & Price Monitoring Indices)*.
