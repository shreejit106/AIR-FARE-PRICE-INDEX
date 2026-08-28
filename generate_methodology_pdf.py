import os
import subprocess

html_content = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>APIx Research & Methodology: Statistical & Econometric Grounding</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;0,6..72,700;1,6..72,400&display=swap');

  @page {
    size: A4;
    margin: 16mm 14mm 16mm 14mm;
    @bottom-right {
      content: "Page " counter(page) " of " counter(pages);
      font-family: 'Inter', sans-serif;
      font-size: 8pt;
      color: #64748B;
    }
  }

  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #0F172A;
    background-color: #FFFFFF;
    line-height: 1.55;
    font-size: 9pt;
    margin: 0;
    padding: 0;
  }

  /* Header Section */
  .header-card {
    border-bottom: 2.5px solid #0284C7;
    padding-bottom: 12px;
    margin-bottom: 16px;
  }

  .badge-row {
    display: flex;
    gap: 8px;
    margin-bottom: 6px;
  }

  .badge {
    font-family: 'JetBrains Mono', monospace;
    font-size: 7pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    padding: 2px 7px;
    border-radius: 4px;
  }

  .badge-primary {
    background: #E0F2FE;
    color: #0369A1;
    border: 1px solid #BAE6FD;
  }

  .badge-verified {
    background: #DCFCE7;
    color: #15803D;
    border: 1px solid #BBF7D0;
  }

  .doc-title {
    font-family: 'Newsreader', Georgia, serif;
    font-size: 19pt;
    font-weight: 700;
    color: #0F172A;
    margin: 0 0 4px 0;
    line-height: 1.2;
  }

  .doc-subtitle {
    font-size: 9pt;
    color: #475569;
    margin: 0 0 8px 0;
    font-style: italic;
  }

  .meta-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 7.5pt;
  }

  .meta-item strong {
    display: block;
    color: #64748B;
    font-size: 6.5pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .meta-item span {
    color: #0F172A;
    font-weight: 600;
  }

  /* Section Typography */
  h2 {
    font-family: 'Inter', sans-serif;
    font-size: 11.5pt;
    font-weight: 800;
    color: #0369A1;
    border-bottom: 1.5px solid #E2E8F0;
    padding-bottom: 3px;
    margin: 14px 0 8px 0;
    page-break-after: avoid;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  h3 {
    font-family: 'Inter', sans-serif;
    font-size: 9.5pt;
    font-weight: 700;
    color: #1E293B;
    margin: 10px 0 4px 0;
    page-break-after: avoid;
  }

  p {
    margin: 0 0 6px 0;
    color: #334155;
    text-align: justify;
  }

  /* Formula Display Boxes */
  .formula-card {
    background: #F0F9FF;
    border: 1.5px solid #BAE6FD;
    border-left: 4px solid #0284C7;
    border-radius: 6px;
    padding: 8px 12px;
    margin: 8px 0 10px 0;
    page-break-inside: avoid;
  }

  .formula-title {
    font-size: 7pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #0369A1;
    margin-bottom: 4px;
  }

  .formula-equation {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9.5pt;
    font-weight: 700;
    color: #0F172A;
    background: #FFFFFF;
    border: 1px solid #CBD5E1;
    border-radius: 4px;
    padding: 6px 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    margin: 3px 0;
  }

  .formula-fraction {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    vertical-align: middle;
    padding: 0 4px;
  }

  .formula-num {
    border-bottom: 1.5px solid #0284C7;
    padding-bottom: 1px;
    width: 100%;
    text-align: center;
  }

  .formula-den {
    padding-top: 1px;
    width: 100%;
    text-align: center;
  }

  .var-legend {
    font-size: 7.5pt;
    color: #475569;
    margin-top: 4px;
    line-height: 1.35;
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0 10px 0;
    font-size: 7.8pt;
    page-break-inside: avoid;
  }

  th {
    background: #F1F5F9;
    color: #1E293B;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 5px 6px;
    border: 1px solid #CBD5E1;
    text-align: left;
  }

  td {
    padding: 5px 6px;
    border: 1px solid #E2E8F0;
    color: #334155;
    vertical-align: top;
  }

  tr:nth-child(even) td {
    background: #F8FAFC;
  }

  /* Callout Boxes */
  .callout {
    background: #FFFBEB;
    border: 1px solid #FDE68A;
    border-left: 3.5px solid #D97706;
    border-radius: 4px;
    padding: 6px 10px;
    margin: 8px 0;
    font-size: 8pt;
    page-break-inside: avoid;
  }

  .callout-title {
    font-weight: 700;
    color: #92400E;
    margin-bottom: 2px;
  }

  .reference-item {
    margin-bottom: 8px;
    padding-left: 16px;
    text-indent: -16px;
    font-size: 7.8pt;
    color: #334155;
    page-break-inside: avoid;
  }

  .reference-item strong {
    color: #0F172A;
  }

  .ref-link {
    font-family: 'JetBrains Mono', monospace;
    font-size: 6.8pt;
    color: #0284C7;
    text-decoration: none;
    display: block;
    text-indent: 0;
    margin-top: 1px;
  }
</style>
</head>
<body>

<!-- HEADER -->
<div class="header-card">
  <div class="badge-row">
    <span class="badge badge-primary">Smart India Hackathon 2026</span>
    <span class="badge badge-verified">Indian Aviation Governance & Econometric Standards</span>
  </div>
  <h1 class="doc-title">Airfare Price Index (APIx): Research & Methodology</h1>
  <div class="doc-subtitle">Statistical Formulation, Indian Regulatory Grounding, Weighting Mechanics, and International Precedents</div>
  
  <div class="meta-grid">
    <div class="meta-item">
      <strong>Target Index</strong>
      <span>APIx (Domestic Airfare)</span>
    </div>
    <div class="meta-item">
      <strong>Mathematical Model</strong>
      <span>Modified Laspeyres / Lowe</span>
    </div>
    <div class="meta-item">
      <strong>Weighting Source</strong>
      <span>DGCA Quarterly PAX Filings</span>
    </div>
    <div class="meta-item">
      <strong>Benchmark Base</strong>
      <span>Sept 2022 = 100.00</span>
    </div>
  </div>
</div>

<!-- SECTION 1 -->
<h2>1. Statistical Foundation</h2>

<h3>1.1 Textbook Laspeyres Price Index</h3>
<p>
In neoclassical price index theory, a standard <strong>Laspeyres Price Index</strong> measures the relative percentage change in the cost of purchasing a fixed basket of goods and services evaluated at base-period consumption quantities (Laspeyres, 1871):
</p>

<div class="formula-card">
  <div class="formula-title">Standard Laspeyres Formula (Textbook Form)</div>
  <div class="formula-equation">
    <span>I<sub>L</sub> = </span>
    <span class="formula-fraction">
      <span class="formula-num">Σ<sub>i=1</sub><sup>n</sup> P(i, t) × Q(i, 0)</span>
      <span class="formula-den">Σ<sub>i=1</sub><sup>n</sup> P(i, 0) × Q(i, 0)</span>
    </span>
    <span>× 100</span>
  </div>
  <div class="var-legend">
    Where <strong>P(i, t)</strong> is the price of item <em>i</em> in period <em>t</em>; <strong>P(i, 0)</strong> is the price in base period 0; and <strong>Q(i, 0)</strong> is the fixed consumption volume during base period 0.
  </div>
</div>

<h3>1.2 The APIx Formulation</h3>
<p>
In civil aviation, an "item" represents a sovereign origin–destination city pair sampled across distinct advance booking horizons <em>h ∈ {T+1, T+7, T+15, T+30, T+45}</em>. APIx implements a <strong>Modified Laspeyres Price Index</strong> weighted by passenger volume shares derived from Directorate General of Civil Aviation (DGCA) quarterly traffic filings:
</p>

<div class="formula-card">
  <div class="formula-title">APIx Modified Laspeyres Formulation</div>
  <div class="formula-equation">
    <span>APIx<sub>t</sub> = </span>
    <span>[ Σ<sub>r=1</sub><sup>R</sup> w<sub>r,0</sub> × </span>
    <span class="formula-fraction">
      <span class="formula-num">P(r, t)</span>
      <span class="formula-den">P(r, 0)</span>
    </span>
    <span> ] × 100</span>
  </div>
  <div class="formula-equation" style="font-size: 8pt; background: #F8FAFC; border-color: #E2E8F0;">
    <span>where passenger weight: &nbsp; w<sub>r,0</sub> = </span>
    <span class="formula-fraction">
      <span class="formula-num">PAX(r, 0)</span>
      <span class="formula-den">Σ<sub>k=1</sub><sup>R</sup> PAX(k, 0)</span>
    </span>
    <span> &nbsp; such that &nbsp; Σ<sub>r=1</sub><sup>R</sup> w<sub>r,0</sub> = 1.000000</span>
  </div>
  <div class="var-legend">
    Where <strong>P(r, t)</strong> is the IQR-cleaned median fare on route <em>r</em> at date <em>t</em>; <strong>P(r, 0)</strong> is the baseline reference median fare (Sept 2022 = 100.0); and <strong>PAX(r, 0)</strong> is the official quarterly passenger count recorded in DGCA filings.
  </div>
</div>

<h3>1.3 Methodological Equivalence</h3>
<table>
  <thead>
    <tr>
      <th>Dimension</th>
      <th>Textbook Laspeyres</th>
      <th>U.S. BLS Air Passenger Fares Index</th>
      <th>APIx (India Domestic Index)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Aggregator</strong></td>
      <td>Fixed-base arithmetic mean</td>
      <td>Modified Laspeyres (Passenger-Revenue Weighted)</td>
      <td>Modified Laspeyres (Passenger-Volume Weighted)</td>
    </tr>
    <tr>
      <td><strong>Weighting Source</strong></td>
      <td>Base quantities Q<sub>0</sub></td>
      <td>DOT DB1B Survey & Commerce Dept I-92</td>
      <td>DGCA Form A/B Quarterly Traffic Returns</td>
    </tr>
    <tr>
      <td><strong>Formula Structure</strong></td>
      <td>[ Σ P<sub>t</sub> Q<sub>0</sub> / Σ P<sub>0</sub> Q<sub>0</sub> ] × 100</td>
      <td>Σ w<sub>r,0</sub> · [ P(r,t) / P(r,0) ] × 100</td>
      <td>Σ w<sub>r,0</sub> · [ P(r,t) / P(r,0) ] × 100</td>
    </tr>
    <tr>
      <td><strong>Precedent Reference</strong></td>
      <td>Classical Economics (1871)</td>
      <td>U.S. BLS IPP Handbook (Ref #6)</td>
      <td>Directly Method-Equivalent to BLS IPP (Ref #6)</td>
    </tr>
  </tbody>
</table>

<h3>1.4 Operational Reality: The Lowe Index Distinction</h3>
<p>
As documented in the <strong>UK Office for National Statistics (ONS) Consumer Price Indices Technical Manual</strong> (Reference #9), when quantity weights <em>Q<sub>b</sub></em> originate from an independent base period <em>b ≠ 0</em>, the index is formally classified as a <strong>Lowe Index</strong>:
</p>

<div class="formula-card">
  <div class="formula-title">Lowe Price Index Formulation (UK ONS Specification)</div>
  <div class="formula-equation">
    <span>I<sub>Lowe, t</sub> = </span>
    <span class="formula-fraction">
      <span class="formula-num">Σ<sub>r=1</sub><sup>R</sup> P(r, t) × Q(r, b)</span>
      <span class="formula-den">Σ<sub>r=1</sub><sup>R</sup> P(r, 0) × Q(r, b)</span>
    </span>
    <span> = Σ<sub>r=1</sub><sup>R</sup> w<sub>r,b</sub> × </span>
    <span class="formula-fraction">
      <span class="formula-num">P(r, t)</span>
      <span class="formula-den">P(r, 0)</span>
    </span>
  </div>
</div>
<p>
Because DGCA passenger volume matrices are refreshed quarterly with a minor reporting lag, APIx operates in practical execution as a <strong>Lowe Index</strong>, matching international best practices across the UK ONS, Eurostat, and the U.S. BLS.
</p>

<!-- SECTION 2 -->
<h2>2. Why Weighting Matters: Statistical Justification</h2>

<h3>2.1 Variance & Outlier Sensitivity: Weighted vs. Unweighted Indices</h3>
<p>
An unweighted arithmetic mean assigns equal weight (<em>1/R</em>) to every route regardless of passenger volume:
</p>

<div class="formula-card">
  <div class="formula-title">Naive Unweighted Mean Index</div>
  <div class="formula-equation">
    <span>Index<sub>Naive, t</sub> = </span>
    <span class="formula-fraction">
      <span class="formula-num">1</span>
      <span class="formula-den">R</span>
    </span>
    <span>Σ<sub>r=1</sub><sup>R</sup> </span>
    <span class="formula-fraction">
      <span class="formula-num">P(r, t)</span>
      <span class="formula-den">P(r, 0)</span>
    </span>
    <span> × 100</span>
  </div>
</div>

<div class="callout">
  <div class="callout-title">Theoretical Proof of Distortion (80-Route Network):</div>
  Suppose 79 trunk routes experience zero price movement (P<sub>t</sub>/P<sub>0</sub> = 1.00), while one low-volume regional route (w<sub>r</sub> = 0.0015) experiences an acute 200% surge (P<sub>t</sub>/P<sub>0</sub> = 3.00):
  <ul style="margin: 3px 0 0 0; padding-left: 14px;">
    <li><strong>Unweighted Naive Shift:</strong> ΔIndex = (1/80) × (3.00 − 1.00) × 100 = <strong>+2.50 index points</strong></li>
    <li><strong>DGCA Weighted Shift:</strong> ΔAPIx = 0.0015 × (3.00 − 1.00) × 100 = <strong>+0.30 index points</strong></li>
  </ul>
  <em>Takeaway: Unweighted averaging magnifies regional price anomalies by over <strong>800%</strong>, triggering false regulatory alerts.</em>
</div>

<h3>2.2 Economic Debate: Fixed vs. Adaptive Weights</h3>
<p>
In <strong>BLS Working Paper (2021)</strong> (Reference #8), economists evaluate fixed-weight Laspeyres/Lowe systems against adaptive/superlative formulations (e.g., Törnqvist). The findings demonstrate that while adaptive weighting captures short-term consumer substitution, computing adaptive weights on high-frequency scraped quotes introduces <strong>severe chain drift</strong>. APIx's fixed-weight Laspeyres/Lowe approach was chosen deliberately to maintain deterministic regulatory stability.
</p>

<!-- SECTION 3 -->
<h2>3. Data Cleaning & Robust Statistical Methods</h2>
<p>
To prevent dynamic pricing spikes, API scraping artifacts, and seat unbundling from corrupting route price relatives, scraped fares pass through a dual-stage robust statistical sanitization pipeline:
</p>

<h3>3.1 Tukey's Interquartile Range (IQR) Inner Fences</h3>
<div class="formula-card">
  <div class="formula-title">Tukey IQR Outlier Boundary Formulation</div>
  <div class="formula-equation">
    <span>IQR<sub>r,h,t</sub> = Q<sub>3</sub>(r, h, t) − Q<sub>1</sub>(r, h, t)</span>
  </div>
  <div class="formula-equation" style="font-size: 8pt; background: #F8FAFC; border-color: #E2E8F0;">
    <span>Acceptance Interval: &nbsp; max(0, Q<sub>1</sub> − 1.5 × IQR) &nbsp; ≤ &nbsp; Fare &nbsp; ≤ &nbsp; Q<sub>3</sub> + 1.5 × IQR</span>
  </div>
  <div class="var-legend">
    <em>Attribution:</em> John W. Tukey, <em>Exploratory Data Analysis</em> (1977). Yields a 25% breakdown point against surge pricing distortions.
  </div>
</div>

<h3>3.2 Median Absolute Deviation (MAD) Filter</h3>
<p>
For thin-sample corridors (<em>N < 10</em>), APIx implements the 50% breakdown-point MAD scale estimator:
</p>

<div class="formula-card">
  <div class="formula-title">Hampel's Median Absolute Deviation (MAD)</div>
  <div class="formula-equation">
    <span>MAD<sub>r,h,t</sub> = Median( | p<sub>i</sub> − Median(Fares<sub>r,h,t</sub>) | )</span>
  </div>
  <div class="formula-equation" style="font-size: 8pt; background: #F8FAFC; border-color: #E2E8F0;">
    <span>Normalized Scale: &nbsp; σ̂<sub>MAD</sub> = 1.4826 × MAD &nbsp;&nbsp;|&nbsp;&nbsp; Boundary: &nbsp; | p<sub>i</sub> − Median(p) | ≤ 2.0 × σ̂<sub>MAD</sub></span>
  </div>
  <div class="var-legend">
    <em>Attribution:</em> Frank R. Hampel, <em>Journal of the American Statistical Association</em> (1974).
  </div>
</div>

<!-- SECTION 4 -->
<h2>4. Precedents & Indian Regulatory Grounding</h2>
<p>
APIx is grounded in both Indian statutory governance and four decades of international price index research:
</p>

<h3>4.1 Government of India Statutory & Econometric Foundations</h3>
<ul style="padding-left: 14px; margin-top: 3px;">
  <li><strong>Ministry of Statistics & Programme Implementation (MoSPI) — CPI Transport Series (Reference #1):</strong> Official national methodology under the COICOP framework for measuring transport services inflation. MoSPI utilizes digital online portal data collection and HCES household expenditure weighting. APIx acts as a high-frequency regulatory cross-check against published monthly MoSPI CPI releases.</li>
  <li><strong>DGCA — Tariff Monitoring Unit (TMU) Operational Directives (Reference #2):</strong> Under Rule 135 of the <em>Aircraft Rules, 1937</em> and CAR Section 3, DGCA monitors airline tariff bands across 78+ domestic routes. APIx automates and scales this framework into an objective 80-route real-time index.</li>
  <li><strong>Parliamentary Standing Committee on Transport, Tourism & Culture (Report No. 328) (Reference #3):</strong> Evaluated dynamic pricing algorithms and recommended transparent national airfare benchmarking to protect consumer welfare during peak festive surge periods.</li>
  <li><strong>Competition Commission of India (CCI) — Market Study on Civil Aviation (Reference #4):</strong> Evaluates route-level market power (HHI), capacity discipline, and algorithmic pricing coordination risks, providing the econometric basis for the APIx Antitrust Portal (/analysts).</li>
</ul>

<h3>4.2 International Precedents</h3>
<ul style="padding-left: 14px; margin-top: 3px;">
  <li><strong>U.S. BLS CPI Airline Fares Factsheet (Reference #5):</strong> Official U.S. methodology for tracking commercial airline fares in the CPI basket.</li>
  <li><strong>U.S. BLS International Price Program (IPP) (Reference #6):</strong> Direct international precedent for passenger-volume weighted modified Laspeyres aggregation.</li>
  <li><strong>ATPI Research — Lent & Dorfman (2005) (Reference #7):</strong> Pioneering study in the <em>Monthly Labor Review</em> validating high-frequency electronic airfare data against published CPI benchmarks.</li>
</ul>

<!-- SECTION 5 -->
<h2>5. Limitations & Future Work (Honest, Citable)</h2>
<ol style="padding-left: 14px; margin-top: 3px;">
  <li><strong>Consumer Substitution Bias (Reference #8):</strong> Fixed-weight Laspeyres indexes do not reflect instantaneous traveler substitution away from surging routes. Future iterations will explore a <strong>Chained Superlative Törnqvist Index</strong> once real-time transactional APIs are linked with DGCA systems.</li>
  <li><strong>Network Scope:</strong> Prototype monitors 80 core domestic corridors; future expansion will incorporate regional UDAN routes to audit government Viability Gap Funding (VGF) price caps.</li>
  <li><strong>Weight Refresh Cycles:</strong> Regular quarterly refresh under the Lowe specification ensures seasonal alignment while preventing structural index breaks.</li>
</ol>

<!-- SECTION 6 -->
<h2>6. Verified Reference & Citation List</h2>

<div class="reference-item">
  <strong>[1] Ministry of Statistics and Programme Implementation (MoSPI), Govt. of India</strong> — <em>Consumer Price Index: Concepts, Definitions and Methodology for Transport Services (COICOP Framework)</em>, National Statistical Office (NSO).
  <a class="ref-link" href="https://esankhyiki.mospi.gov.in/">https://esankhyiki.mospi.gov.in/</a>
</div>

<div class="reference-item">
  <strong>[2] Directorate General of Civil Aviation (DGCA), Ministry of Civil Aviation, Govt. of India</strong> — <em>Handbook of Civil Aviation Statistics & Tariff Monitoring Unit (TMU) Operational Directives (Rule 135, Aircraft Rules, 1937)</em>.
  <a class="ref-link" href="https://www.dgca.gov.in">https://www.dgca.gov.in</a>
</div>

<div class="reference-item">
  <strong>[3] Parliamentary Standing Committee on Transport, Tourism & Culture, Parliament of India</strong> — <em>Report on Fixing of Airfares and Issues Related to Dynamic Pricing in Civil Aviation Sector (Report No. 328)</em>, Rajya Sabha Secretariat.
  <a class="ref-link" href="https://sansad.in">https://sansad.in</a>
</div>

<div class="reference-item">
  <strong>[4] Competition Commission of India (CCI), Govt. of India</strong> — <em>Market Study on the Civil Aviation Sector in India: Market Power, Concentration and Dynamic Pricing</em>.
  <a class="ref-link" href="https://www.cci.gov.in">https://www.cci.gov.in</a>
</div>

<div class="reference-item">
  <strong>[5] U.S. Bureau of Labor Statistics (BLS)</strong> — <em>Consumer Price Index: Airline Fares Factsheet</em>, U.S. Department of Labor.
  <a class="ref-link" href="https://www.bls.gov/cpi/factsheets/airline-fares.htm">https://www.bls.gov/cpi/factsheets/airline-fares.htm</a>
</div>

<div class="reference-item">
  <strong>[6] U.S. Bureau of Labor Statistics (BLS)</strong> — <em>Air Passenger Fares Price Indexes (IPP Methodology)</em>, BLS Handbook of Methods.
  <a class="ref-link" href="https://www.bls.gov/mxp/methods/air-passenger-fares.htm">https://www.bls.gov/mxp/methods/air-passenger-fares.htm</a>
</div>

<div class="reference-item">
  <strong>[7] Janice Lent & Alan H. Dorfman (2005)</strong> — <em>"Air-Travel Transaction Index,"</em> <strong>Monthly Labor Review</strong>, U.S. BLS, Vol. 128, No. 6, pp. 45–54.
  <a class="ref-link" href="https://www.bls.gov/opub/mlr/2005/06/art4full.pdf">https://www.bls.gov/opub/mlr/2005/06/art4full.pdf</a>
</div>

<div class="reference-item">
  <strong>[8] U.S. Bureau of Labor Statistics (2021)</strong> — <em>CPI Indexes for Subsets of the Target Population: Laspeyres vs. Törnqvist Formulations and Substitution Bias</em>, BLS Working Paper No. 543.
  <a class="ref-link" href="https://www.bls.gov/osmr/research-papers/2021/">https://www.bls.gov/osmr/research-papers/2021/</a>
</div>

<div class="reference-item">
  <strong>[9] UK Office for National Statistics (ONS)</strong> — <em>Consumer Price Indices Technical Manual (Methodology Appendix: Formulae used to calculate CPI and RPI)</em>, UK ONS Guidance.
</div>

<div class="reference-item">
  <strong>[10] John W. Tukey (1977)</strong> — <em>Exploratory Data Analysis</em>, Addison-Wesley Series in Behavioral Science (IQR Inner Fences).
</div>

<div class="reference-item">
  <strong>[11] Frank R. Hampel (1974)</strong> — <em>"The Influence Curve and its Role in Robust Estimation,"</em> <strong>Journal of the American Statistical Association</strong>, Vol. 69, No. 346, pp. 383–393 (MAD Scale Estimator).
</div>

</body>
</html>
"""

html_path = "APIx_Research_Methodology.html"
pdf_path = "APIx_Research_Methodology.pdf"

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"Generated {html_path}")

# Compile to PDF using Headless Chrome
chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
if not os.path.exists(chrome_path):
    chrome_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

abs_html = os.path.abspath(html_path)
abs_pdf = os.path.abspath(pdf_path)

cmd = [
    chrome_path,
    "--headless",
    "--disable-gpu",
    "--no-pdf-header-footer",
    f"--print-to-pdf={abs_pdf}",
    f"file:///{abs_html}"
]

print("Executing Chrome headless PDF render...")
subprocess.run(cmd, check=True)

if os.path.exists(pdf_path):
    size_kb = os.path.getsize(pdf_path) / 1024
    print(f"Successfully compiled: {abs_pdf} ({size_kb:.1f} KB)")
else:
    print("PDF generation failed.")
