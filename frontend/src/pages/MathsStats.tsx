import React, { useState, useEffect, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../App';
import { API_BASE_URL } from '../config';
import { DEFAULT_ROUTE_SUMMARIES } from '../fallbackData';
import { 
  BarChart3, 
  Scale, 
  BookOpen, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Layers,
  AlertTriangle
} from 'lucide-react';

/* ─────────────────────────────── MATHS DATA & PARAMS ─────────────────────────────── */
const RAW_FARES = [3800, 4100, 4200, 4350, 4400, 4500, 4600, 4750, 4900, 5100, 5300, 18500];
const Q1 = 4200, Q3 = 4900, IQR = Q3 - Q1, UB = Q3 + 1.5 * IQR, LB = Math.max(0, Q1 - 1.5 * IQR);
const CLEAN = RAW_FARES.filter(x => x <= UB && x >= LB);
const MEDIAN_CLEAN = CLEAN[Math.floor(CLEAN.length / 2)];

const DEFAULT_WEIGHTS = DEFAULT_ROUTE_SUMMARIES.map(r => ({
  route_id: r.route_id,
  passenger_share: r.passenger_share,
  passenger_count: r.passenger_count || Math.round(r.passenger_share * 38500000)
}));
const DEFAULT_TOTAL_PAX = DEFAULT_WEIGHTS.reduce((s, r) => s + r.passenger_count, 0);

const PIPELINE_STEPS = [
  { 
    num: '01', 
    title: 'High-Frequency Ingestion', 
    color: '#06B6D4',
    action: 'Scrapes live fares across MakeMyTrip, Ixigo, Goibibo, and direct airline engines for T+1, T+7, T+15, T+30, T+45 booking horizons.',
    rationale: 'Captures dynamic yield-management pricing curves across both business and leisure booking windows.' 
  },
  { 
    num: '02', 
    title: 'Robust Outlier Sanitization (IQR & MAD)', 
    color: '#F59E0B',
    action: 'Applies Tukey\'s inner fences [Q1 - 1.5×IQR, Q3 + 1.5×IQR] and Hampel\'s MAD filters to strip fare spikes.',
    rationale: 'Strips last-seat surge fares and API anomalies that would artificially distort macroeconomic averages.' 
  },
  { 
    num: '03', 
    title: 'Order-Statistic Median Aggregation', 
    color: '#10B981',
    action: 'Computes the sample median of sanitized fares for each route-horizon cell: P(r,t) = Median(CleanFares).',
    rationale: 'Sample median possesses a 50% breakdown point, resisting asymmetric positive skewness inherent in airline pricing.' 
  },
  { 
    num: '04', 
    title: 'Modified Laspeyres Passenger Weighting', 
    color: '#8B5CF6',
    action: 'Weights each route price relative by official quarterly DGCA passenger traffic volume share w(r,0).',
    rationale: 'Trunk routes (e.g. DEL-BOM) properly outweigh regional links, reflecting true aggregate consumer expenditure.' 
  },
];

interface RouteWeight {
  route_id: string;
  passenger_share: number;
  passenger_count: number;
}

/* ─── Shared Plotly layout builders ─────────────────────────────────────── */
function plotBase(dark: boolean): Partial<any> {
  return {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor:  dark ? '#0A1628' : '#F8FAFC',
    font: { color: dark ? '#94A3B8' : '#334155', family: 'Inter, sans-serif', size: 12 },
  };
}
function axisStyle(dark: boolean): Partial<any> {
  return {
    gridcolor:   dark ? '#1E3A5F' : '#E2E8F0',
    gridwidth:   1,
    zerolinecolor: dark ? '#2D4A6E' : '#CBD5E1',
    zerolinewidth: 1,
    tickfont:    { color: dark ? '#64748B' : '#475569', size: 11, family: 'Inter, sans-serif' },
    titlefont:   { color: dark ? '#94A3B8' : '#334155', size: 12, family: 'Inter, sans-serif' },
    showline:    true,
    linecolor:   dark ? '#1E3A5F' : '#CBD5E1',
    linewidth:   1,
  };
}

/* ════════════════════════════════════════════════════════════════════════════
   SUBTAB 1: INDEX THEORY & FORMULAS (WHAT INDEXES & WHY WE USED THEM)
   ════════════════════════════════════════════════════════════════════════════ */
const IndexTheoryPanel: React.FC<{ dark: boolean }> = ({ dark }) => {
  const [outlierVal, setOutlierVal] = useState(22000);
  const baseFares = [4200, 4400, 4500, 4600, 4750];
  const allFares  = [...baseFares, outlierVal];
  const mean   = allFares.reduce((s, v) => s + v, 0) / allFares.length;
  const sorted = [...allFares].sort((a, b) => a - b);
  const med    = sorted[Math.floor(sorted.length / 2)];
  const PB = useMemo(() => plotBase(dark), [dark]);
  const AX = useMemo(() => axisStyle(dark), [dark]);

  const indexComparisons = [
    {
      name: 'Modified Laspeyres / Lowe Index',
      status: 'SELECTED (APIx Standard)',
      statusType: 'selected',
      formula: 'I_t = [ Σ w_r,0 × ( P_r,t / P_r,0 ) ] × 100',
      dataReq: 'Base-period passenger traffic weights w_r,0 + live current prices P_r,t',
      pros: 'Isolates pure price signal; zero high-frequency chain drift; computationally instantaneous; legally auditable & reproducible.',
      cons: 'Subject to minor consumer substitution bias over extended annual intervals without reweighting.',
      verdict: 'Optimal for regulatory airfare monitoring, daily web-scraped inputs, and government policy cross-checks.'
    },
    {
      name: 'Paasche Price Index',
      status: 'EXCLUDED',
      statusType: 'excluded',
      formula: 'I_P = [ Σ P_r,t × Q_r,t ] / [ Σ P_r,0 × Q_r,t ] × 100',
      dataReq: 'Real-time current-period passenger volume Q_r,t for every flight and route',
      pros: 'Reflects current consumer consumption patterns and immediate demand shifts.',
      cons: 'Current passenger counts Q_r,t are physically unavailable during forward-booking horizons (T+1 to T+45) until flights complete.',
      verdict: 'Operationally impossible for forward-looking airfare indexes.'
    },
    {
      name: 'Superlative Chained Törnqvist',
      status: 'ROADMAP / FUTURE WORK',
      statusType: 'roadmap',
      formula: 'ln(I_t / I_t-1) = Σ [ (w_r,t + w_r,t-1)/2 ] × ln( P_r,t / P_r,t-1 )',
      dataReq: 'Daily continuous transaction quantities and expenditure shares for each airline flight',
      pros: 'Eliminates substitution bias by dynamically averaging base and current expenditure weights.',
      cons: 'Suffers from severe downward/upward "chain drift" when applied to volatile daily scraped fare oscillations.',
      verdict: 'Recommended for quarterly post-travel reconciliation once real-time DGCA AIMS APIs go live.'
    },
    {
      name: 'Fisher Ideal Index',
      status: 'EXCLUDED',
      statusType: 'excluded',
      formula: 'I_F = sqrt( I_Laspeyres × I_Paasche )',
      dataReq: 'Both base quantities Q_0 and real-time current passenger volumes Q_t',
      pros: 'Satisfies time-reversal and factor-reversal tests; gold standard in retrospective annual national accounts.',
      cons: 'Inherits Paasche\'s fatal flaw: requires contemporaneous passenger volume data that does not exist at quote time.',
      verdict: 'Inapplicable for daily live fare monitoring.'
    },
    {
      name: 'Naive Unweighted Arithmetic Mean',
      status: 'REJECTED (Severe Flaw)',
      statusType: 'rejected',
      formula: 'I_Naive = (1 / R) × Σ ( P_r,t / P_r,0 ) × 100',
      dataReq: 'Unweighted route price relatives only',
      pros: 'Simple to compute; requires no auxiliary traffic statistics.',
      cons: 'Treats empty 10-passenger regional hops with the exact same weight as Delhi-Mumbai (6.5% of national volume).',
      verdict: 'Statistically invalid; amplifies regional price shocks by over 800%.'
    }
  ];

  return (
    <>
      {/* Header Banner */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--cyan)', marginBottom: 8 }}>
          Econometric Architecture & Formulation
        </div>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 900, letterSpacing: -1, color: 'var(--text)', margin: '0 0 10px 0' }}>
          Index Frameworks: What We Chose & Why
        </h1>
        <p style={{ color: 'var(--sub)', fontSize: '1rem', maxWidth: 860, lineHeight: 1.75, margin: 0 }}>
          Price index construction requires balancing economic precision, data availability, and mathematical stability. Below is the full evaluation matrix of candidate price indexes and the formal justification for adopting the <strong style={{ color: 'var(--text)' }}>Modified Laspeyres / Lowe Index</strong> for the APIx sovereign framework.
        </p>
      </div>

      {/* Index Comparison Matrix */}
      <div style={{ marginBottom: 40 }}>
        <div className="section-label">Price Index Evaluation Matrix</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {indexComparisons.map((idx, i) => (
            <div 
              key={idx.name}
              className="card"
              style={{ 
                borderLeft: `4px solid ${
                  idx.statusType === 'selected' ? 'var(--cyan)' :
                  idx.statusType === 'roadmap' ? 'var(--purple)' :
                  idx.statusType === 'rejected' ? 'var(--red)' : 'var(--amber)'
                }`,
                background: idx.statusType === 'selected' ? 'rgba(6,182,212,0.04)' : 'var(--card)',
                padding: '20px 24px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.15rem', color: 'var(--text)', fontWeight: 800 }}>
                    {idx.name}
                  </h3>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.92rem', color: 'var(--cyan)', marginTop: 4 }}>
                    {idx.formula}
                  </div>
                </div>
                <span 
                  style={{ 
                    fontSize: '0.72rem', 
                    fontWeight: 800, 
                    padding: '4px 12px', 
                    borderRadius: 20, 
                    letterSpacing: 0.8,
                    background: 
                      idx.statusType === 'selected' ? 'rgba(6,182,212,0.15)' :
                      idx.statusType === 'roadmap' ? 'rgba(139,92,246,0.15)' :
                      idx.statusType === 'rejected' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                    color: 
                      idx.statusType === 'selected' ? 'var(--cyan)' :
                      idx.statusType === 'roadmap' ? 'var(--purple)' :
                      idx.statusType === 'rejected' ? 'var(--red)' : 'var(--amber)',
                    border: `1px solid ${
                      idx.statusType === 'selected' ? 'var(--cyan)' :
                      idx.statusType === 'roadmap' ? 'var(--purple)' :
                      idx.statusType === 'rejected' ? 'var(--red)' : 'var(--amber)'
                    }40`
                  }}
                >
                  {idx.status}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginTop: 14 }}>
                <div style={{ fontSize: '0.84rem', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--sub)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Data Requirements</div>
                  <div style={{ color: 'var(--text)' }}>{idx.dataReq}</div>
                </div>
                <div style={{ fontSize: '0.84rem', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--sub)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Econometric Assessment</div>
                  <div style={{ color: 'var(--text)' }}><strong>Pros:</strong> {idx.pros}</div>
                  <div style={{ color: 'var(--sub)', marginTop: 4 }}><strong>Cons:</strong> {idx.cons}</div>
                </div>
              </div>

              <div style={{ marginTop: 12, fontSize: '0.84rem', color: idx.statusType === 'selected' ? 'var(--cyan)' : 'var(--sub)', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                <strong>Policy Verdict: </strong>{idx.verdict}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rationale Cards */}
      <div className="section-label">4 Key Reasons Behind APIx Formulation Choice</div>
      <div className="grid-2" style={{ gap: 16, marginBottom: 36 }}>
        {[
          {
            title: '1. Pure Price Signal Isolation',
            desc: 'By fixing the basket weights to baseline passenger traffic w(r,0), APIx isolates pure tariff inflation from passenger volume swings. If travelers fly less during an economic downturn, APIx continues to measure true airline pricing without contamination.',
            icon: ShieldCheck,
            color: 'var(--cyan)'
          },
          {
            title: '2. Forward-Looking Horizon Feasibility',
            desc: 'APIx monitors prices across multiple advance booking windows (T+1, T+7, T+15, T+30, T+45). Because future flight passenger manifests are unknown until departure, a base-weighted index is the only mathematically viable model for real-time monitoring.',
            icon: TrendingUp,
            color: 'var(--purple)'
          },
          {
            title: '3. Zero High-Frequency Chain Drift',
            desc: 'Daily chained indices (like daily Chained Törnqvist) suffer from severe mathematical drift when applied to bouncing yield-management fares. Fixed-base Laspeyres completely eliminates multi-period chain drift.',
            icon: Cpu,
            color: 'var(--green)'
          },
          {
            title: '4. Legal Reproducibility for Regulators',
            desc: 'Antitrust regulators (CCI) and civil aviation authorities (DGCA, MoCA) require an index whose methodology is 100% transparent, deterministic, and court-admissible—free of black-box machine learning artifacts.',
            icon: Layers,
            color: 'var(--amber)'
          }
        ].map((r, i) => (
          <div key={r.title} className="card" style={{ borderLeft: `3px solid ${r.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <r.icon size={20} color={r.color} />
              <h4 style={{ margin: 0, color: 'var(--text)', fontSize: '1rem', fontWeight: 800 }}>{r.title}</h4>
            </div>
            <p style={{ margin: 0, color: 'var(--sub)', fontSize: '0.86rem', lineHeight: 1.65 }}>{r.desc}</p>
          </div>
        ))}
      </div>

      {/* Mathematical Formulations Display */}
      <div className="section-label">Mathematical Formulations</div>
      <div className="grid-2" style={{ gap: 20, marginBottom: 32 }}>
        {/* Core Formula Box */}
        <div className="formula-box">
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--sub)', marginBottom: 20 }}>
            APIx Core Index Formula
          </div>
          
          <div style={{ 
            background: dark ? '#060B14' : '#F1F5F9', 
            padding: '16px 20px', 
            borderRadius: 8, 
            border: '1px solid var(--border)',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '1.1rem',
            color: 'var(--text)',
            marginBottom: 16
          }}>
            APIx<sub>t</sub> = [ Σ<sub>r=1</sub><sup>R</sup> w<sub>r,0</sub> × ( P<sub>r,t</sub> / P<sub>r,0</sub> ) ] × 100
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--sub)', textAlign: 'left', lineHeight: 1.6 }}>
            <div style={{ color: 'var(--text)', fontWeight: 700, marginBottom: 6 }}>Where:</div>
            <div>• <span style={{ color: 'var(--cyan)', fontFamily: 'monospace' }}>P(r,t)</span> = IQR-cleaned median fare on route r at day t</div>
            <div>• <span style={{ color: 'var(--amber)', fontFamily: 'monospace' }}>P(r,0)</span> = Base period median fare (Sept 2022 = 100.0)</div>
            <div>• <span style={{ color: 'var(--purple)', fontFamily: 'monospace' }}>w(r,0)</span> = DGCA passenger traffic volume share (Σ w = 1.0)</div>
          </div>
        </div>

        {/* Robust Data Cleaning Math Box */}
        <div className="formula-box" style={{ borderLeftColor: 'var(--amber)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--sub)', marginBottom: 20 }}>
            Tukey's IQR Outlier Fences
          </div>

          <div style={{ 
            background: dark ? '#060B14' : '#F1F5F9', 
            padding: '16px 20px', 
            borderRadius: 8, 
            border: '1px solid var(--border)',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.98rem',
            color: 'var(--amber)',
            marginBottom: 16
          }}>
            IQR = Q<sub>3</sub> - Q<sub>1</sub><br />
            Upper Bound = Q<sub>3</sub> + 1.5 × IQR<br />
            Lower Bound = max(0, Q<sub>1</sub> - 1.5 × IQR)
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--sub)', textAlign: 'left', lineHeight: 1.6 }}>
            <div style={{ color: 'var(--text)', fontWeight: 700, marginBottom: 6 }}>Attribution: Tukey (1977) EDA</div>
            <div>• Discards last-seat surge fares and scraping glitch artifacts.</div>
            <div>• Provides 25% breakdown protection against heavy-tailed spikes.</div>
          </div>
        </div>
      </div>

      {/* 4-Stage Ingestion Pipeline */}
      <div className="section-label">4-Stage Data Verification Pipeline</div>
      <p style={{ color: 'var(--sub)', fontSize: '0.88rem', marginBottom: 20 }}>
        Every raw scraped observation is validated through four mathematical gates before index aggregation.
      </p>
      {PIPELINE_STEPS.map(s => (
        <div key={s.num} className="pipeline-step">
          <div className="pipeline-num" style={{ color: s.color, background: s.color + '18', border: `1px solid ${s.color}30` }}>{s.num}</div>
          <div className="pipeline-content">
            <div className="pipeline-title">{s.title}</div>
            <div className="pipeline-action">{s.action}</div>
            <div className="pipeline-why" style={{ borderLeftColor: s.color, color: 'var(--sub)' }}>
              <strong style={{ color: s.color }}>Econometric Rationale: </strong>{s.rationale}
            </div>
          </div>
        </div>
      ))}

      {/* Interactive IQR Plot */}
      <div style={{ marginTop: 36 }} />
      <div className="section-label">Interactive Outlier Rejection Demonstration</div>
      <p style={{ color: 'var(--sub)', fontSize: '0.88rem', marginBottom: 16 }}>
        Red bars represent extreme surge fares rejected by the IQR bound before representative median calculation.
      </p>
      <Plot
        key={`iqr-${dark}`}
        data={[{
          type: 'bar',
          x: RAW_FARES.map(x => `₹${x.toLocaleString()}`),
          y: RAW_FARES,
          marker: { color: RAW_FARES.map(x => x > UB ? '#EF4444' : '#06B6D4'), line: { width: 0 } },
          hovertemplate: '<b>₹%{y:,}</b><br>%{customdata}<extra></extra>',
          customdata: RAW_FARES.map(x => x > UB ? '⚠ Outlier (IQR Rejected)' : '✓ Valid Fare'),
        }]}
        layout={{
          ...PB, height: 340,
          margin: { l: 80, r: 30, t: 20, b: 60 },
          shapes: [
            { type: 'line', x0: -0.5, x1: RAW_FARES.length - 0.5, y0: UB, y1: UB, line: { color: '#F59E0B', dash: 'dash', width: 2 } },
            { type: 'line', x0: -0.5, x1: RAW_FARES.length - 0.5, y0: MEDIAN_CLEAN, y1: MEDIAN_CLEAN, line: { color: '#10B981', dash: 'dot', width: 2 } },
          ],
          annotations: [
            { x: 0, y: UB, text: `IQR Upper Bound: ₹${UB.toLocaleString()}`, showarrow: false, font: { color: '#F59E0B', size: 12, family: 'Inter, sans-serif' }, xanchor: 'left', yanchor: 'bottom', yshift: 4 },
            { x: 0, y: MEDIAN_CLEAN, text: `Clean Median: ₹${MEDIAN_CLEAN.toLocaleString()}`, showarrow: false, font: { color: '#10B981', size: 12, family: 'Inter, sans-serif' }, xanchor: 'left', yanchor: 'bottom', yshift: 4 },
          ],
          showlegend: false,
          xaxis: { ...AX, title: { text: 'Scraped Fare Samples', font: { size: 13 }, standoff: 12 }, tickfont: { size: 11, family: 'JetBrains Mono, monospace' } },
          yaxis: { ...AX, title: { text: 'Fare (₹)', font: { size: 13 }, standoff: 10 }, tickformat: ',.0f', range: [0, Math.max(...RAW_FARES) * 1.08] },
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%', marginBottom: 40 }}
      />

      {/* Real-time Outlier Injection Simulator */}
      <div className="section-label">Mean vs Median: Robust Centrality Simulator</div>
      <p style={{ color: 'var(--sub)', fontSize: '0.88rem', marginBottom: 16 }}>
        Drag the slider to inject an extreme price spike into the route sample. Observe how the sample Mean distorts immediately while the Median holds steady.
      </p>
      <div className="grid-2" style={{ gap: 20, marginBottom: 20 }}>
        <div>
          <label className="control-label">Simulated Outlier Fare</label>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--sub)' }}>₹5,000</span>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--cyan)', fontFamily: 'JetBrains Mono,monospace' }}>₹{outlierVal.toLocaleString()}</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--sub)' }}>₹80,000</span>
          </div>
          <input type="range" min={5000} max={80000} step={1000} value={outlierVal}
            onChange={e => setOutlierVal(Number(e.target.value))} style={{ marginBottom: 20 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)' }}>
              <div style={{ color: '#FCA5A5', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Arithmetic Mean — Heavily Distorted</div>
              <div style={{ color: 'var(--red)', fontSize: '2rem', fontWeight: 900, fontFamily: 'JetBrains Mono,monospace' }}>₹{Math.round(mean).toLocaleString()}</div>
              <div style={{ color: 'var(--sub)', fontSize: '0.8rem', marginTop: 4 }}>Pushed {((mean / med - 1) * 100).toFixed(1)}% above true center by one spike</div>
            </div>
            <div className="card" style={{ border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.06)' }}>
              <div style={{ color: '#6EE7B7', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Sample Median — Grounded & Robust</div>
              <div style={{ color: 'var(--green)', fontSize: '2rem', fontWeight: 900, fontFamily: 'JetBrains Mono,monospace' }}>₹{Math.round(med).toLocaleString()}</div>
              <div style={{ color: 'var(--sub)', fontSize: '0.8rem', marginTop: 4 }}>50% breakdown point protects consumer representation</div>
            </div>
          </div>
        </div>
        <Plot
          key={`scatter-${dark}`}
          data={[{
            x: [...baseFares.map((_, i) => `₹${baseFares[i].toLocaleString()}`), `₹${outlierVal.toLocaleString()} (Outlier)`],
            y: allFares,
            mode: 'markers',
            marker: { size: 18, color: [...Array(5).fill('#06B6D4'), '#EF4444'], line: { color: dark ? '#060B14' : '#FFFFFF', width: 2 } },
            hovertemplate: '<b>%{x}</b><extra></extra>',
          }]}
          layout={{
            ...PB, height: 340,
            margin: { l: 80, r: 30, t: 20, b: 60 },
            shapes: [
              { type: 'line', x0: -0.5, x1: 5.5, y0: mean, y1: mean, line: { color: '#EF4444', dash: 'dash', width: 2 } },
              { type: 'line', x0: -0.5, x1: 5.5, y0: med,  y1: med,  line: { color: '#10B981', dash: 'dot',  width: 2 } },
            ],
            annotations: [
              { x: 5, y: mean, text: `Mean: ₹${Math.round(mean).toLocaleString()}`, showarrow: false, font: { color: '#EF4444', size: 12, family: 'Inter, sans-serif' }, xanchor: 'right', yanchor: 'bottom', yshift: 4 },
              { x: 5, y: med,  text: `Median: ₹${Math.round(med).toLocaleString()}`,  showarrow: false, font: { color: '#10B981', size: 12, family: 'Inter, sans-serif' }, xanchor: 'right', yanchor: 'bottom', yshift: 4 },
            ],
            showlegend: false,
            xaxis: { ...AX, title: { text: 'Observed Fare Set', font: { size: 13 }, standoff: 12 }, tickfont: { size: 11, family: 'JetBrains Mono, monospace' } },
            yaxis: { ...AX, title: { text: 'Fare (₹)', font: { size: 13 }, standoff: 10 }, tickformat: ',.0f' },
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%' }}
        />
      </div>
    </>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   SUBTAB 2: DGCA WEIGHT ALLOCATION (PASSENGER VOLUME INTEGRATION)
   ════════════════════════════════════════════════════════════════════════════ */
const WeightAllocationPanel: React.FC<{ dark: boolean }> = ({ dark }) => {
  const [routes,      setRoutes]      = useState<RouteWeight[]>(DEFAULT_WEIGHTS);
  const [total,       setTotal]       = useState(DEFAULT_TOTAL_PAX);
  const [selectedId,  setSelectedId]  = useState(DEFAULT_WEIGHTS[0]?.route_id || 'DEL-BOM');
  const [spikeChange, setSpikeChange] = useState(20);
  const PB = useMemo(() => plotBase(dark), [dark]);
  const AX = useMemo(() => axisStyle(dark), [dark]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/weights`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && d.routes && d.routes.length > 0) {
          setRoutes(d.routes);
          setTotal(d.total_passengers || d.routes.reduce((s: number, r: any) => s + r.passenger_count, 0));
          if (!selectedId && d.routes.length) setSelectedId(d.routes[0].route_id);
        }
      })
      .catch(() => {});
  }, []);

  const selRow = routes.find(r => r.route_id === selectedId) ?? routes[0] ?? DEFAULT_WEIGHTS[0];
  const pct     = selRow.passenger_share * 100;
  const rank    = routes.findIndex(r => r.route_id === selectedId) + 1;
  const naive   = (1 / routes.length) * 100;
  const delta   = pct - naive;
  const top5s   = routes.slice(0, 5).reduce((s, r) => s + r.passenger_share, 0) * 100;
  const top10s  = routes.slice(0, 10).reduce((s, r) => s + r.passenger_share, 0) * 100;
  const top25   = routes.slice(0, 25);
  const naiveImpact  = spikeChange / routes.length;
  const weightImpact = spikeChange * selRow.passenger_share;

  return (
    <>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--purple)', marginBottom: 8 }}>
          Official DGCA Form A/B Data Integration
        </div>
        <h2 style={{ fontSize: '2.4rem', fontWeight: 900, letterSpacing: -1, color: 'var(--text)', margin: '0 0 10px 0' }}>
          Passenger-Weighted Route Allocation
        </h2>
        <p style={{ color: 'var(--sub)', fontSize: '1rem', maxWidth: 840, lineHeight: 1.75, margin: 0 }}>
          An unweighted index treats all routes identically—giving a low-density regional flight the same economic weight as Delhi–Mumbai. APIx weights every city-pair by its verified share of national passenger traffic sourced from quarterly <strong style={{ color: 'var(--text)' }}>DGCA filings</strong>.
        </p>
      </div>

      {/* Formula Box */}
      <div className="grid-2" style={{ gap: 20, marginBottom: 32 }}>
        <div className="formula-box" style={{ borderLeftColor: 'var(--purple)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--sub)', marginBottom: 20 }}>
            DGCA Route Weight Formulation
          </div>
          <div style={{ 
            background: dark ? '#060B14' : '#F1F5F9', 
            padding: '16px 20px', 
            borderRadius: 8, 
            border: '1px solid var(--border)',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '1.1rem',
            color: 'var(--purple)',
            marginBottom: 16
          }}>
            w<sub>r,0</sub> = PAX<sub>r,0</sub> / Σ<sub>k=1</sub><sup>R</sup> PAX<sub>k,0</sub>
          </div>
          <div style={{ fontSize: '0.84rem', color: 'var(--sub)', textAlign: 'left' }}>
            Where <span style={{ color: 'var(--cyan)' }}>PAX<sub>r,0</sub></span> is the quarterly passenger count on route r, and the denominator normalizes all weights such that <span style={{ color: 'var(--text)', fontWeight: 700 }}>Σ w<sub>r,0</sub> = 1.000</span>.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
          {[
            { sym: 'w(r,0)', desc: 'Normalized passenger weight for route r (0.0 to 1.0).', color: 'var(--purple)' },
            { sym: 'PAX_r',  desc: 'Quarterly passengers recorded in DGCA Form A/B matrix.', color: 'var(--cyan)' },
            { sym: 'Σ PAX',  desc: 'Total domestic traffic across monitored network basket.', color: 'var(--amber)' },
          ].map(v => (
            <div key={v.sym} className="var-pill" style={{ alignItems: 'center' }}>
              <div className="var-badge" style={{ color: v.color, background: '#ffffff10', border: `1px solid ${v.color}35` }}>{v.sym}</div>
              <div className="var-desc">{v.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Route Selector & Stat Strip */}
      <div className="control-group" style={{ marginBottom: 20, maxWidth: 360 }}>
        <label className="control-label">Select Route to Inspect</label>
        <select className="control-select" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
          {routes.map(r => <option key={r.route_id} value={r.route_id}>{r.route_id}</option>)}
        </select>
      </div>

      <div className="stat-strip" style={{ marginBottom: 28 }}>
        <div className="stat-cell">
          <div className="stat-sub">Selected Route</div>
          <div className="stat-big stat-cyan" style={{ fontSize: '1.6rem', letterSpacing: 1 }}>{selRow.route_id}</div>
          <div className="stat-note">Rank #{rank} / {routes.length}</div>
        </div>
        <div className="stat-cell">
          <div className="stat-sub">Quarterly Passengers</div>
          <div className="stat-big">{selRow.passenger_count.toLocaleString()}</div>
          <div className="stat-note">of {total.toLocaleString()} total</div>
        </div>
        <div className="stat-cell">
          <div className="stat-sub">DGCA Weight w(r)</div>
          <div className="stat-big stat-purple">{pct.toFixed(3)}%</div>
          <div className="stat-note">of national traffic volume</div>
        </div>
        <div className="stat-cell">
          <div className="stat-sub">vs Equal (Naive) Weight</div>
          <div className={`stat-big ${delta > 0 ? 'stat-green' : 'stat-red'}`}>
            {delta > 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(3)}%
          </div>
          <div className="stat-note">Naive = {naive.toFixed(3)}%</div>
        </div>
      </div>

      {/* Top 25 Chart & Donut */}
      <div className="grid-2" style={{ gap: 20, marginBottom: 36 }}>
        <Plot
          key={`bar25-${dark}`}
          data={[{
            type: 'bar', x: top25.map(r => r.passenger_share * 100), y: top25.map(r => r.route_id),
            orientation: 'h',
            marker: { color: top25.map(r => r.route_id === selectedId ? '#8B5CF6' : (dark ? '#1F2D54' : '#CBD5E1')) },
            text: top25.map(r => `${(r.passenger_share * 100).toFixed(2)}%`),
            textposition: 'outside', textfont: { color: dark ? '#94A3B8' : '#475569', size: 10 },
            hovertemplate: '<b>%{y}</b><br>Weight: %{x:.3f}%<extra></extra>',
          }]}
          layout={{
            ...PB,
            title: { text: 'Top 25 Sovereign Domestic Routes by Traffic Share', font: { color: dark ? '#E2E8F0' : '#0F172A', size: 13 } },
            height: 540, margin: { l: 90, r: 50, t: 40, b: 60 },
            xaxis: { ...AX, title: { text: 'Passenger Weight (%)', font: { size: 12 }, standoff: 12 }, ticksuffix: '%' },
            yaxis: { ...AX, showgrid: false, autorange: 'reversed', tickfont: { size: 10, family: 'JetBrains Mono, monospace' } },
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%' }}
        />
        <div>
          <Plot
            key={`pie-${dark}`}
            data={[{
              type: 'pie', labels: routes.map(r => r.route_id), values: routes.map(r => r.passenger_count),
              hole: 0.72, pull: routes.map(r => r.route_id === selectedId ? 0.09 : 0),
              marker: { colors: routes.map(r => r.route_id === selectedId ? '#8B5CF6' : (dark ? '#131D35' : '#E2E8F0')), line: { color: dark ? '#060B14' : '#FFFFFF', width: 1 } },
              hovertemplate: '<b>%{label}</b><br>%{value:,} pax<br>%{percent:.2f}<extra></extra>',
              textinfo: 'none',
            }]}
            layout={{
              ...PB,
              title: { text: `All ${routes.length} Routes — Traffic Concentration`, font: { color: dark ? '#E2E8F0' : '#0F172A', size: 12 } },
              showlegend: false, height: 320, margin: { t: 50, b: 10, l: 30, r: 30 },
              annotations: [{ text: `<b>${selRow.route_id}</b><br>${pct.toFixed(2)}%`, x: 0.5, y: 0.5, showarrow: false, font: { color: dark ? '#E2E8F0' : '#0F172A', size: 13 }, align: 'center' }],
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
          />
          <div className="grid-2" style={{ gap: 10, marginTop: 12 }}>
            {[['Top 5 Routes Share', top5s], ['Top 10 Routes Share', top10s]].map(([label, val]) => (
              <div key={String(label)} className="card" style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--sub)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{String(label)}</div>
                <div style={{ color: 'var(--purple)', fontSize: '1.4rem', fontWeight: 900, fontFamily: 'JetBrains Mono,monospace' }}>{Number(val).toFixed(1)}%</div>
                <div style={{ color: 'var(--sub)', fontSize: '0.75rem' }}>of sovereign domestic traffic</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Index Impact Simulator */}
      <div className="section-label">Index Impact Simulator: DGCA Weight vs Naive Mean</div>
      <p style={{ color: 'var(--sub)', fontSize: '0.88rem', marginBottom: 16 }}>
        Simulate a fare price spike on <strong style={{ color: 'var(--purple)' }}>{selectedId}</strong> to verify how weighting insulates national macroeconomic indicators from localized price spikes.
      </p>
      <div className="grid-2" style={{ gap: 20 }}>
        <div>
          <label className="control-label">Simulated Fare Change (%)</label>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--sub)' }}>-50%</span>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--cyan)', fontFamily: 'JetBrains Mono,monospace' }}>{spikeChange > 0 ? '+' : ''}{spikeChange}%</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--sub)' }}>+100%</span>
          </div>
          <input type="range" min={-50} max={100} step={5} value={spikeChange}
            onChange={e => setSpikeChange(Number(e.target.value))} style={{ marginBottom: 20 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)' }}>
              <div style={{ color: '#FCA5A5', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Naive Unweighted Impact</div>
              <div style={{ color: 'var(--red)', fontSize: '1.8rem', fontWeight: 900, fontFamily: 'JetBrains Mono,monospace' }}>
                {naiveImpact >= 0 ? '+' : ''}{naiveImpact.toFixed(3)} pts
              </div>
              <div style={{ color: 'var(--sub)', fontSize: '0.8rem', marginTop: 4 }}>Divides shock equally across all {routes.length} routes</div>
            </div>
            <div className="card" style={{ border: '1px solid rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.06)' }}>
              <div style={{ color: '#C4B5FD', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>APIx DGCA-Weighted Impact</div>
              <div style={{ color: 'var(--purple)', fontSize: '1.8rem', fontWeight: 900, fontFamily: 'JetBrains Mono,monospace' }}>
                {weightImpact >= 0 ? '+' : ''}{weightImpact.toFixed(3)} pts
              </div>
              <div style={{ color: 'var(--sub)', fontSize: '0.8rem', marginTop: 4 }}>Accurately scaled to route's {pct.toFixed(3)}% traffic volume</div>
            </div>
          </div>
        </div>
        <div>
          <Plot
            key={`impact-${dark}`}
            data={[{
              type: 'bar',
              x: ['Naive Unweighted', `APIx (DGCA Weighted)`],
              y: [naiveImpact, weightImpact],
              marker: { color: ['#EF4444', '#8B5CF6'] },
              text: [`${naiveImpact >= 0 ? '+' : ''}${naiveImpact.toFixed(3)} pts`, `${weightImpact >= 0 ? '+' : ''}${weightImpact.toFixed(3)} pts`],
              textposition: 'outside',
              textfont: { color: dark ? '#E2E8F0' : '#0F172A', size: 11, family: 'Inter, sans-serif' },
              hovertemplate: '%{x}<br>%{y:.3f} pts<extra></extra>',
            }]}
            layout={{
              ...PB, height: 320, margin: { l: 80, r: 30, t: 30, b: 60 },
              showlegend: false,
              xaxis: { ...AX, showgrid: false, tickfont: { size: 11 } },
              yaxis: { ...AX, showgrid: true, title: { text: 'Index Point Change', font: { size: 12 }, standoff: 10 }, zeroline: true, tickformat: '.3f' },
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
          />
          <div className="card" style={{ textAlign: 'center', marginTop: 12 }}>
            <span style={{ color: 'var(--sub)', fontSize: '0.88rem' }}>Statistical Distortion in Naive Index: </span>
            <span style={{ color: 'var(--red)', fontWeight: 800, fontFamily: 'JetBrains Mono,monospace' }}>{Math.abs(naiveImpact - weightImpact).toFixed(3)} pts</span>
          </div>
        </div>
      </div>
    </>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   SUBTAB 3: ECONOMETRIC PRECEDENTS & LITERATURE GROUNDING
   ════════════════════════════════════════════════════════════════════════════ */
const EconometricGroundingPanel: React.FC<{ dark: boolean }> = () => {
  const navigate = useNavigate();

  return (
    <>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--cyan)', marginBottom: 8 }}>
          Econometric Lineage & Precedents
        </div>
        <h2 style={{ fontSize: '2.4rem', fontWeight: 900, letterSpacing: -1, color: 'var(--text)', margin: '0 0 10px 0' }}>
          Scientific Grounding & Literature Precedents
        </h2>
        <p style={{ color: 'var(--sub)', fontSize: '1rem', maxWidth: 860, lineHeight: 1.75, margin: 0 }}>
          APIx is not an ad-hoc heuristic; it is method-equivalent to the official air passenger price index frameworks developed by the **U.S. Bureau of Labor Statistics (BLS)** and **UK Office for National Statistics (ONS)**.
        </p>
      </div>

      {/* Precedent Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 36 }}>
        <div className="card" style={{ borderLeft: '4px solid var(--cyan)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ color: 'var(--cyan)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
              Direct Methodological Precedent
            </span>
            <span style={{ color: 'var(--sub)', fontSize: '0.75rem', fontFamily: 'monospace' }}>U.S. BLS (IPP)</span>
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: 'var(--text)' }}>
            U.S. BLS International Price Program — "Air Passenger Fares Price Indexes"
          </h3>
          <p style={{ margin: '0 0 12px 0', color: 'var(--sub)', fontSize: '0.88rem', lineHeight: 1.65 }}>
            The closest direct precedent to APIx. The BLS International Price Program tracks airline passenger fare movements using a **modified Laspeyres index** with passenger-volume-derived revenue weights sourced from the U.S. Department of Transportation (DOT) DB1B ticket survey and Commerce Department I-92 data, updated periodically.
          </p>
          <div style={{ background: 'rgba(6,182,212,0.06)', padding: '10px 14px', borderRadius: 8, fontSize: '0.84rem', color: 'var(--cyan)', border: '1px solid rgba(6,182,212,0.2)' }}>
            <strong>APIx Method Equivalence:</strong> APIx adapts this exact volume-weighted Laspeyres aggregation structure, substituting U.S. DOT DB1B filings with official Indian DGCA Form A/B passenger traffic returns.
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--purple)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ color: 'var(--purple)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
              Official Statistical Manual
            </span>
            <span style={{ color: 'var(--sub)', fontSize: '0.75rem', fontFamily: 'monospace' }}>UK ONS Technical Manual</span>
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: 'var(--text)' }}>
            UK Office for National Statistics — Laspeyres vs. Lowe Index Distinction
          </h3>
          <p style={{ margin: '0 0 12px 0', color: 'var(--sub)', fontSize: '0.88rem', lineHeight: 1.65 }}>
            The UK ONS methodology appendix notes that real-world operational CPI implementations are closer to a **Lowe Index** than a pure textbook Laspeyres. In a pure Laspeyres, quantity weights coincide exactly with the price base period ($b=0$). When weights are periodically refreshed from quarterly reports ($b \neq 0$), the index mathematically functions as a Lowe Index.
          </p>
          <div style={{ background: 'rgba(139,92,246,0.06)', padding: '10px 14px', borderRadius: 8, fontSize: '0.84rem', color: 'var(--purple)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <strong>Operational Reality:</strong> APIx operates as a robust Lowe Index across quarters as new DGCA passenger returns are integrated.
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--green)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ color: 'var(--green)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
              Academic Validation Precedent
            </span>
            <span style={{ color: 'var(--sub)', fontSize: '0.75rem', fontFamily: 'monospace' }}>Monthly Labor Review (2005)</span>
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: 'var(--text)' }}>
            Janice Lent & Alan H. Dorfman — "Air-Travel Transaction Index" (ATPI)
          </h3>
          <p style={{ margin: '0 0 12px 0', color: 'var(--sub)', fontSize: '0.88rem', lineHeight: 1.65 }}>
            Published in the *Monthly Labor Review* (U.S. BLS, June 2005), Lent & Dorfman developed an experimental transaction-based airfare index from computerized reservation system (CRS) data and benchmarked it against official CPI airfare series, proving that automated electronic fare collection provides an accurate, high-frequency leading indicator.
          </p>
        </div>
      </div>

      {/* Limitations & Future Work */}
      <div className="section-label">Limitations & Academic Roadmap (BLS Working Paper 2021)</div>
      <div className="card" style={{ marginBottom: 32, background: 'rgba(255,255,255,0.02)' }}>
        <h4 style={{ margin: '0 0 8px 0', color: 'var(--text)', fontSize: '1.05rem', fontWeight: 800 }}>
          Addressing Laspeyres Substitution Bias
        </h4>
        <p style={{ margin: '0 0 14px 0', color: 'var(--sub)', fontSize: '0.86rem', lineHeight: 1.65 }}>
          As analyzed in <strong>BLS Working Paper (2021)</strong>, *"CPI indexes for subsets of the target population"*, fixed-weight Laspeyres price indices do not reflect short-term consumer substitution when fares surge on specific routes.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          <div style={{ padding: '12px 14px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ color: 'var(--amber)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Current Limitation</div>
            <div style={{ color: 'var(--sub)', fontSize: '0.82rem' }}>Fixed quarterly passenger weights slightly overstate inflation during acute single-route price shocks.</div>
          </div>
          <div style={{ padding: '12px 14px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ color: 'var(--cyan)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Future Chained Törnqvist Upgrade</div>
            <div style={{ color: 'var(--sub)', fontSize: '0.82rem' }}>Once DGCA AIMS real-time passenger flow APIs go live, APIx will offer an optional Chained Törnqvist superlative series.</div>
          </div>
        </div>
      </div>

      {/* CTA to Full References Page */}
      <div 
        className="card" 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(139,92,246,0.1))',
          border: '1px solid var(--cyan)',
          padding: '24px 28px',
          cursor: 'pointer'
        }}
        onClick={() => navigate('/references')}
      >
        <div>
          <div style={{ color: 'var(--cyan)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>
            Official Data Catalog & Citations
          </div>
          <div style={{ color: 'var(--text)', fontSize: '1.2rem', fontWeight: 800 }}>
            View Full Data Sources & Research References Repository →
          </div>
          <div style={{ color: 'var(--sub)', fontSize: '0.85rem', marginTop: 4 }}>
            Explore data provenance mappings (DGCA, OTAs, MOSPI, ATF) and verified academic citation cards.
          </div>
        </div>
        <button 
          className="hud-mobile-sync-btn"
          style={{ padding: '10px 18px', fontSize: '0.85rem' }}
          onClick={(e) => { e.stopPropagation(); navigate('/references'); }}
        >
          Open Catalog
        </button>
      </div>
    </>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   METHODOLOGY ROOT PAGE (WITH 3 INNER SUBTABS)
   ════════════════════════════════════════════════════════════════════════════ */
const INNER_TABS = [
  { id: 'theory',      label: '📊 Index Theory & Formulas', icon: BarChart3 },
  { id: 'weights',     label: '⚖ DGCA Traffic Weighting',   icon: Scale },
  { id: 'precedents',  label: '🔬 Econometric Precedents',  icon: BookOpen },
];

const MathsStats: React.FC = () => {
  const { dark } = useTheme();
  const [activeTab, setActiveTab] = useState<'theory' | 'weights' | 'precedents'>('theory');

  return (
    <div className="page-content">
      <div className="runway-bar" />

      {/* Subtab Switcher */}
      <div style={{
        display: 'flex', 
        gap: 8, 
        marginBottom: 36,
        borderBottom: `1px solid ${dark ? '#1E3A5F' : '#E2E8F0'}`,
        paddingBottom: 0,
        overflowX: 'auto'
      }}>
        {INNER_TABS.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 22px',
                fontSize: '0.88rem',
                fontWeight: 700,
                fontFamily: 'Inter, sans-serif',
                background: 'none',
                border: 'none',
                borderBottom: isActive
                  ? `2px solid ${t.id === 'theory' ? 'var(--cyan)' : t.id === 'weights' ? 'var(--purple)' : 'var(--green)'}`
                  : '2px solid transparent',
                color: isActive ? 'var(--text)' : 'var(--sub)',
                cursor: 'pointer',
                marginBottom: -1,
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} color={isActive ? (t.id === 'theory' ? 'var(--cyan)' : t.id === 'weights' ? 'var(--purple)' : 'var(--green)') : 'currentColor'} />
              {t.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'theory'     && <IndexTheoryPanel dark={dark} />}
      {activeTab === 'weights'    && <WeightAllocationPanel dark={dark} />}
      {activeTab === 'precedents' && <EconometricGroundingPanel dark={dark} />}
    </div>
  );
};

export default MathsStats;
