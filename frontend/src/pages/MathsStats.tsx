import React, { useState, useEffect, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../App';
import { API_BASE_URL } from '../config';
import { DEFAULT_ROUTE_SUMMARIES } from '../fallbackData';
import { 
  ArrowRight, 
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  TrendingUp,
  Cpu
} from 'lucide-react';

/* ─────────────────────────────── MATHS DATA & PARAMS ─────────────────────────────── */
const RAW_FARES = [3800, 4100, 4200, 4350, 4400, 4500, 4600, 4750, 4900, 5100, 5300, 18500];
const Q1 = 4200, Q3 = 4900, IQR = Q3 - Q1, UB = Q3 + 1.5 * IQR;
const CLEAN = RAW_FARES.filter(x => x <= UB);
const MEDIAN_CLEAN = CLEAN[Math.floor(CLEAN.length / 2)];

const DEFAULT_WEIGHTS: RouteWeight[] = DEFAULT_ROUTE_SUMMARIES.map(r => ({
  route_id: r.route_id,
  passenger_share: r.passenger_share,
  passenger_count: r.passenger_count || Math.round(r.passenger_share * 38500000)
}));
const DEFAULT_TOTAL_PAX = DEFAULT_WEIGHTS.reduce((s, r) => s + r.passenger_count, 0);

const PIPELINE_STEPS = [
  { num: '01', title: 'Ingestion', color: '#06B6D4',
    action: 'Continuous scraping of MakeMyTrip, Ixigo, Goibibo, and direct airline portals.',
    rationale: 'Captures real pricing signals across T+1, T+7, T+15, T+30, T+45 booking horizons.' },
  { num: '02', title: 'IQR Filtration', color: '#F59E0B',
    action: 'Discard any fare outside Q3 + 1.5 × IQR for its route-horizon pair.',
    rationale: 'Eliminates last-seat surge outliers that would catastrophically distort the average.' },
  { num: '03', title: 'Median Aggregation', color: '#10B981',
    action: 'Compute the statistical median of remaining clean fares.',
    rationale: 'Median is resistant to residual skewness — gives a truer reflection of what a typical traveller pays.' },
  { num: '04', title: 'Laspeyres Weighting', color: '#8B5CF6',
    action: "Multiply each route's price ratio (current/base) by its DGCA passenger share Q_base.",
    rationale: 'DEL-BOM correctly outweighs low-traffic routes, producing a consumer-representative national index.' },
];

const VARS = [
  { sym: 'P(r,t)', title: 'Current Median Fare',        color: '#06B6D4', desc: 'IQR-filtered median ticket price on route r at time t, scraped live from airlines and OTAs.' },
  { sym: 'P(r,0)', title: 'Base Period Fare (Sept 2022)', color: '#F59E0B', desc: 'Fixed reference price for route r during September 2022 base period, anchoring the index at exactly 100.00.' },
  { sym: 'Q(r,0)', title: 'Passenger Weight (DGCA Base)', color: '#8B5CF6', desc: 'Proportion of national passengers on route r during September 2022 base period, from DGCA quarterly traffic data.' },
];

const CANDIDATE_INDEXES = [
  {
    id: 'laspeyres',
    name: 'Modified Laspeyres / Lowe',
    badge: 'SELECTED STANDARD',
    badgeColor: 'var(--cyan)',
    formula: 'I_t = [ Σ w_r,0 × ( P_r,t / P_r,0 ) ] × 100',
    dataNeeds: 'Base-period DGCA passenger volume weights w_r,0 + current median fares P_r,t',
    whyUsed: 'Isolates pure price movements from passenger volume swings. Zero high-frequency chain drift. Fully reproducible for DGCA/CCI regulatory enforcement.',
    limitation: 'Slight consumer substitution bias during acute single-route price spikes.'
  },
  {
    id: 'tornqvist',
    name: 'Chained Superlative Törnqvist',
    badge: 'FUTURE ROADMAP',
    badgeColor: 'var(--purple)',
    formula: 'ln(I_t / I_t-1) = Σ [ (w_r,t + w_r,t-1)/2 ] × ln( P_r,t / P_r,t-1 )',
    dataNeeds: 'Real-time transaction volumes and expenditure shares for every flight',
    whyUsed: 'Theoretical gold standard for capturing dynamic traveler substitution between carriers.',
    limitation: 'Suffers from severe mathematical chain drift when computed on daily volatile web-scraped quotes.'
  },
  {
    id: 'paasche',
    name: 'Paasche Price Index',
    badge: 'OPERATIONALLY INFEASIBLE',
    badgeColor: 'var(--amber)',
    formula: 'I_P = [ Σ P_r,t × Q_r,t ] / [ Σ P_r,0 × Q_r,t ] × 100',
    dataNeeds: 'Real-time current-period passenger volume Q_r,t at quote time',
    whyUsed: 'Reflects instantaneous consumer basket composition.',
    limitation: 'Current passenger manifests Q_r,t do not exist for advance booking curves (T+1 to T+45) until flights depart.'
  },
  {
    id: 'fisher',
    name: 'Fisher Ideal Index',
    badge: 'OPERATIONALLY INFEASIBLE',
    badgeColor: 'var(--amber)',
    formula: 'I_F = sqrt( I_Laspeyres × I_Paasche )',
    dataNeeds: 'Both base quantities Q_0 and real-time passenger volumes Q_t',
    whyUsed: 'Satisfies time-reversal and factor-reversal tests in retrospective national accounts.',
    limitation: 'Cannot be calculated live due to the unobservable Paasche quantity component.'
  },
  {
    id: 'naive',
    name: 'Naive Unweighted Mean',
    badge: 'METHODOLOGICALLY FLAWED',
    badgeColor: 'var(--red)',
    formula: 'I_Naive = (1 / R) × Σ ( P_r,t / P_r,0 ) × 100',
    dataNeeds: 'Unweighted route fare ratios only',
    whyUsed: 'Simple to compute without external passenger volume data.',
    limitation: 'Distorts inflation by over 800% by giving a 10-seat regional hop the same weight as Delhi–Mumbai.'
  }
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
   PANEL 1: INDEX MATHEMATICS & FORMULATION
   ════════════════════════════════════════════════════════════════════════════ */
const IndexMathPanel: React.FC<{ dark: boolean }> = ({ dark }) => {
  const [outlierVal, setOutlierVal] = useState(22000);
  const [selectedIdxId, setSelectedIdxId] = useState('laspeyres');
  const baseFares = [4200, 4400, 4500, 4600, 4750];
  const allFares  = [...baseFares, outlierVal];
  const mean   = allFares.reduce((s, v) => s + v, 0) / allFares.length;
  const sorted = [...allFares].sort((a, b) => a - b);
  const med    = sorted[Math.floor(sorted.length / 2)];
  const PB = useMemo(() => plotBase(dark), [dark]);
  const AX = useMemo(() => axisStyle(dark), [dark]);

  const activeIdx = CANDIDATE_INDEXES.find(c => c.id === selectedIdxId) || CANDIDATE_INDEXES[0];

  return (
    <>
      {/* Hero Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--cyan)', marginBottom: 8 }}>
          Methodology
        </div>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 900, letterSpacing: -1, color: 'var(--text)', margin: '0 0 10px 0' }}>
          Modified Laspeyres Price Index
        </h1>
        <p style={{ color: 'var(--sub)', fontSize: '1rem', maxWidth: 820, lineHeight: 1.75, margin: 0 }}>
          The <strong style={{ color: 'var(--text)' }}>Airfare Price Index (APIx)</strong> uses a modified Laspeyres methodology — the gold standard used by national statistical agencies — adapted specifically for India's aviation market, where booking horizon, airline mix, and passenger volume vary enormously across routes.
        </p>
      </div>

      {/* Classic Side-by-Side Formula + Variables Layout */}
      <div className="grid-2" style={{ gap: 20, marginBottom: 32 }}>
        <div>
          <div className="formula-box">
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--sub)', marginBottom: 22 }}>
              Core Formula
            </div>
            <div style={{ fontSize: '1.05rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text)', marginBottom: 6 }}>
              <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>APIx</span>
              <sub style={{ color: 'var(--sub)', fontSize: '0.68rem' }}>t</sub>
              {' = '}
              <span className="formula-fraction">
                <span className="formula-num">
                  Σ <sub style={{ fontSize: '0.65rem', color: 'var(--sub)' }}>r=1</sub>
                  <sup style={{ fontSize: '0.65rem', color: 'var(--sub)' }}>R</sup>
                  {' '}
                  <span style={{ color: 'var(--cyan)' }}>P(r,t)</span>
                  {' × '}
                  <span style={{ color: 'var(--purple)' }}>Q(r,0)</span>
                </span>
                <span className="formula-den">
                  Σ <sub style={{ fontSize: '0.65rem', color: 'var(--sub)' }}>r=1</sub>
                  <sup style={{ fontSize: '0.65rem', color: 'var(--sub)' }}>R</sup>
                  {' '}
                  <span style={{ color: 'var(--amber)' }}>P(r,0)</span>
                  {' × '}
                  <span style={{ color: 'var(--purple)' }}>Q(r,0)</span>
                </span>
              </span>
              {' × 100'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 20, fontSize: '0.78rem' }}>
              {[['var(--cyan)', 'Current fare'], ['var(--amber)', 'Base fare'], ['var(--purple)', 'DGCA weight']].map(([c, l]) => (
                <span key={String(l)}>
                  <span style={{ color: String(c) }}>■</span>{' '}{l}
                </span>
              ))}
            </div>
          </div>
          <div className="grid-3" style={{ gap: 8 }}>
            {[
              { val: '100',  label: 'Base Parity',   color: 'var(--cyan)'  },
              { val: '>100', label: 'Fare Inflation', color: 'var(--red)'   },
              { val: '<100', label: 'Fare Deflation', color: 'var(--green)' },
            ].map(c => (
              <div key={c.label} className="card" style={{ textAlign: 'center', border: `1px solid ${c.color}25` }}>
                <div style={{ color: c.color, fontSize: '1.5rem', fontWeight: 900, fontFamily: 'JetBrains Mono,monospace' }}>{c.val}</div>
                <div style={{ color: 'var(--sub)', fontSize: '0.75rem', marginTop: 4 }}>{c.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          {VARS.map(v => (
            <div key={v.sym} className="var-pill">
              <div className="var-badge" style={{ color: v.color, background: v.color + '18', border: `1px solid ${v.color}30` }}>{v.sym}</div>
              <div>
                <div className="var-title">{v.title}</div>
                <div className="var-desc">{v.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Index Formulation Benchmark (Engaging & Compact Selector) */}
      <div className="section-label">Index Benchmark: Candidate Formulations & Rationale</div>
      <p style={{ color: 'var(--sub)', fontSize: '0.86rem', marginBottom: 14 }}>
        Select a price index below to inspect its mathematical formulation, data requirements, and the direct aviation policy rationale for selection or rejection:
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {CANDIDATE_INDEXES.map(c => {
          const isSelected = selectedIdxId === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedIdxId(c.id)}
              style={{
                padding: '8px 14px',
                fontSize: '0.82rem',
                fontWeight: 700,
                fontFamily: 'Inter, sans-serif',
                borderRadius: 8,
                border: isSelected ? `1px solid ${c.badgeColor}` : '1px solid var(--border)',
                background: isSelected ? `${c.badgeColor}15` : 'var(--card)',
                color: isSelected ? c.badgeColor : 'var(--sub)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {c.name}
            </button>
          );
        })}
      </div>

      <div 
        className="card" 
        style={{ 
          borderLeft: `4px solid ${activeIdx.badgeColor}`,
          padding: '18px 22px',
          marginBottom: 36,
          background: 'rgba(255,255,255,0.015)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>
            {activeIdx.name}
          </div>
          <span style={{ 
            fontSize: '0.7rem', 
            fontWeight: 800, 
            padding: '3px 10px', 
            borderRadius: 12,
            background: `${activeIdx.badgeColor}18`,
            color: activeIdx.badgeColor,
            border: `1px solid ${activeIdx.badgeColor}40`,
            fontFamily: 'var(--font-mono)'
          }}>
            {activeIdx.badge}
          </span>
        </div>

        <div style={{ 
          background: dark ? '#060B14' : '#F1F5F9', 
          padding: '16px 20px', 
          borderRadius: 8, 
          border: `1px solid ${activeIdx.badgeColor}30`,
          fontFamily: 'JetBrains Mono, monospace', 
          fontSize: '1.05rem', 
          color: activeIdx.badgeColor,
          marginBottom: 14,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 56,
          overflowX: 'auto'
        }}>
          {activeIdx.id === 'laspeyres' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>APIx<sub>t</sub> = </span>
              <span className="formula-fraction">
                <span className="formula-num" style={{ borderColor: activeIdx.badgeColor }}>
                  Σ<sub>r=1</sub><sup>R</sup> P(r,t) × Q(r,0)
                </span>
                <span className="formula-den">
                  Σ<sub>r=1</sub><sup>R</sup> P(r,0) × Q(r,0)
                </span>
              </span>
              <span>× 100</span>
            </div>
          )}

          {activeIdx.id === 'tornqvist' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>ln</span>
              <span className="formula-fraction" style={{ margin: '0 4px' }}>
                <span className="formula-num" style={{ borderColor: activeIdx.badgeColor }}>I<sub>t</sub></span>
                <span className="formula-den">I<sub>t−1</sub></span>
              </span>
              <span>= Σ<sub>r=1</sub><sup>R</sup></span>
              <span style={{ display: 'inline-flex', alignItems: 'center', margin: '0 4px' }}>
                <span style={{ fontSize: '1.3rem' }}>[</span>
                <span className="formula-fraction">
                  <span className="formula-num" style={{ borderColor: activeIdx.badgeColor }}>w<sub>r,t</sub> + w<sub>r,t−1</sub></span>
                  <span className="formula-den">2</span>
                </span>
                <span style={{ fontSize: '1.3rem' }}>]</span>
              </span>
              <span>× ln</span>
              <span className="formula-fraction" style={{ margin: '0 4px' }}>
                <span className="formula-num" style={{ borderColor: activeIdx.badgeColor }}>P(r,t)</span>
                <span className="formula-den">P(r,t−1)</span>
              </span>
            </div>
          )}

          {activeIdx.id === 'paasche' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>I<sub>P,t</sub> = </span>
              <span className="formula-fraction">
                <span className="formula-num" style={{ borderColor: activeIdx.badgeColor }}>
                  Σ<sub>r=1</sub><sup>R</sup> P(r,t) × Q(r,t)
                </span>
                <span className="formula-den">
                  Σ<sub>r=1</sub><sup>R</sup> P(r,0) × Q(r,t)
                </span>
              </span>
              <span>× 100</span>
            </div>
          )}

          {activeIdx.id === 'fisher' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>I<sub>F,t</sub> = √( I<sub>Laspeyres,t</sub> × I<sub>Paasche,t</sub> )</span>
            </div>
          )}

          {activeIdx.id === 'naive' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>I<sub>Naive,t</sub> = </span>
              <span className="formula-fraction">
                <span className="formula-num" style={{ borderColor: activeIdx.badgeColor }}>1</span>
                <span className="formula-den">R</span>
              </span>
              <span>Σ<sub>r=1</sub><sup>R</sup></span>
              <span className="formula-fraction">
                <span className="formula-num" style={{ borderColor: activeIdx.badgeColor }}>P(r,t)</span>
                <span className="formula-den">P(r,0)</span>
              </span>
              <span>× 100</span>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, fontSize: '0.84rem' }}>
          <div>
            <span style={{ color: 'var(--sub)', fontWeight: 600 }}>Data Requirements: </span>
            <span style={{ color: 'var(--text)' }}>{activeIdx.dataNeeds}</span>
          </div>
          <div>
            <span style={{ color: 'var(--sub)', fontWeight: 600 }}>Aviation Policy Rationale: </span>
            <span style={{ color: 'var(--text)' }}>{activeIdx.whyUsed}</span>
          </div>
        </div>
      </div>

      {/* 4-Stage Data Pipeline */}
      <div className="section-label">4-Stage Data Pipeline</div>
      <p style={{ color: 'var(--sub)', fontSize: '0.88rem', marginBottom: 20 }}>Every scraped fare passes four strict gates before contributing to the index.</p>
      {PIPELINE_STEPS.map(s => (
        <div key={s.num} className="pipeline-step">
          <div className="pipeline-num" style={{ color: s.color, background: s.color + '18', border: `1px solid ${s.color}30` }}>{s.num}</div>
          <div className="pipeline-content">
            <div className="pipeline-title">{s.title}</div>
            <div className="pipeline-action">{s.action}</div>
            <div className="pipeline-why" style={{ borderLeftColor: s.color, color: 'var(--sub)' }}>
              <strong style={{ color: s.color }}>Why: </strong>{s.rationale}
            </div>
          </div>
        </div>
      ))}

      {/* Interactive IQR Demonstration */}
      <div style={{ marginTop: 36 }} />
      <div className="section-label">Interactive IQR Demonstration</div>
      <p style={{ color: 'var(--sub)', fontSize: '0.88rem', marginBottom: 16 }}>Red bars are outliers caught by the IQR filter before the median is computed.</p>
      <Plot
        key={`iqr-${dark}`}
        data={[{
          type: 'bar',
          x: RAW_FARES.map(x => `₹${x.toLocaleString()}`),
          y: RAW_FARES,
          marker: { color: RAW_FARES.map(x => x > UB ? '#EF4444' : '#06B6D4'), line: { width: 0 } },
          hovertemplate: '<b>₹%{y:,}</b><br>%{customdata}<extra></extra>',
          customdata: RAW_FARES.map(x => x > UB ? '⚠ Outlier (IQR rejected)' : '✓ Valid fare'),
        }]}
        layout={{
          ...PB, height: 350,
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
        style={{ width: '100%', marginBottom: 48 }}
      />

      {/* Mean vs Median: Real-time Outlier Injection */}
      <div className="section-label">Mean vs Median: Real-time Outlier Injection</div>
      <p style={{ color: 'var(--sub)', fontSize: '0.88rem', marginBottom: 16 }}>Drag the slider to inject a high-value outlier. Watch the Mean distort while the Median stays grounded.</p>
      <div className="grid-2" style={{ gap: 20 }}>
        <div>
          <label className="control-label">Outlier Fare</label>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--sub)' }}>₹5,000</span>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--cyan)', fontFamily: 'JetBrains Mono,monospace' }}>₹{outlierVal.toLocaleString()}</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--sub)' }}>₹80,000</span>
          </div>
          <input type="range" min={5000} max={80000} step={1000} value={outlierVal}
            onChange={e => setOutlierVal(Number(e.target.value))} style={{ marginBottom: 20 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)' }}>
              <div style={{ color: '#FCA5A5', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Mean — Distorted</div>
              <div style={{ color: 'var(--red)', fontSize: '2rem', fontWeight: 900, fontFamily: 'JetBrains Mono,monospace' }}>₹{Math.round(mean).toLocaleString()}</div>
              <div style={{ color: 'var(--sub)', fontSize: '0.8rem', marginTop: 4 }}>Pulled by outlier</div>
            </div>
            <div className="card" style={{ border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.06)' }}>
              <div style={{ color: '#6EE7B7', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Median — Stable</div>
              <div style={{ color: 'var(--green)', fontSize: '2rem', fontWeight: 900, fontFamily: 'JetBrains Mono,monospace' }}>₹{Math.round(med).toLocaleString()}</div>
              <div style={{ color: 'var(--sub)', fontSize: '0.8rem', marginTop: 4 }}>True centre holds</div>
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
            xaxis: { ...AX, title: { text: 'Fare Scenarios', font: { size: 13 }, standoff: 12 }, tickfont: { size: 11, family: 'JetBrains Mono, monospace' } },
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
   PANEL 2: DGCA WEIGHT ALLOCATION
   ════════════════════════════════════════════════════════════════════════════ */
const WeightAllocationPanel: React.FC<{ dark: boolean }> = ({ dark }) => {
  const [routes,      setRoutes]      = useState<RouteWeight[]>(DEFAULT_WEIGHTS);
  const [total,       setTotal]       = useState(DEFAULT_TOTAL_PAX);
  const [selectedId,  setSelectedId]  = useState(DEFAULT_WEIGHTS[0]?.route_id || 'DEL-BOM');
  const [spikeChange, setSpikeChange] = useState(20);
  const [chartLimit,  setChartLimit]  = useState<25 | 80>(25);
  const [searchQuery, setSearchQuery] = useState('');

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

  const barData = useMemo(() => {
    return routes.slice(0, chartLimit);
  }, [routes, chartLimit]);

  const naiveImpact  = spikeChange / routes.length;
  const weightImpact = spikeChange * selRow.passenger_share;

  const filteredList = useMemo(() => {
    return routes.filter(r => r.route_id.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [routes, searchQuery]);

  return (
    <>
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--purple)', marginBottom: 8 }}>
          DGCA Data Integration
        </div>
        <h2 style={{ fontSize: '2.4rem', fontWeight: 900, letterSpacing: -1, color: 'var(--text)', margin: '0 0 10px 0' }}>
          Passenger-Weighted Route Allocation
        </h2>
        <p style={{ color: 'var(--sub)', fontSize: '1rem', maxWidth: 820, lineHeight: 1.75, margin: 0 }}>
          A naive index treats every route equally — the Chandigarh-Jaipur hop would carry the same weight as DEL-BOM.
          APIx uses quarterly passenger volume from the <strong style={{ color: 'var(--text)' }}>Directorate General of Civil Aviation (DGCA)</strong> to weight each route by its true share of national air traffic.
        </p>
      </div>

      <div className="grid-2" style={{ gap: 20, marginBottom: 32 }}>
        <div className="formula-box" style={{ borderLeftColor: 'var(--purple)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--sub)', marginBottom: 24 }}>Weight Formula</div>
          <div style={{ fontSize: '1.1rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text)' }}>
            <span style={{ color: 'var(--purple)', fontWeight: 700 }}>Q</span>
            <sub style={{ color: 'var(--sub)', fontSize: '0.68rem' }}>r,0</sub>
            {' = '}
            <span className="formula-fraction">
              <span className="formula-num" style={{ color: 'var(--cyan)' }}>N<sub>r</sub></span>
              <span className="formula-den" style={{ color: 'var(--amber)' }}>Σ N<sub>j</sub></span>
            </span>
          </div>
        </div>
        <div>
          {[
            { sym: 'Q(r,0)', desc: 'The final dimensionless weight for route r. All weights sum to 1.0.', color: 'var(--purple)' },
            { sym: 'N_r',    desc: 'Total passengers flown on route r during the DGCA base quarter.', color: 'var(--cyan)' },
            { sym: 'Σ N_j',  desc: 'Sum of all passengers across every tracked route — the normalising denominator.', color: 'var(--amber)' },
          ].map(v => (
            <div key={v.sym} className="var-pill" style={{ alignItems: 'center' }}>
              <div className="var-badge" style={{ color: v.color, background: '#ffffff10', border: `1px solid ${v.color}35` }}>{v.sym}</div>
              <div className="var-desc">{v.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="control-group" style={{ marginBottom: 20, maxWidth: 360 }}>
        <label className="control-label">Select Route</label>
        <select className="control-select" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
          {routes.map(r => <option key={r.route_id} value={r.route_id}>{r.route_id}</option>)}
        </select>
      </div>

      <div className="stat-strip" style={{ marginBottom: 24 }}>
        <div className="stat-cell">
          <div className="stat-sub">Route</div>
          <div className="stat-big stat-cyan" style={{ fontSize: '1.6rem', letterSpacing: 1 }}>{selRow.route_id}</div>
          <div className="stat-note">Rank #{rank} / {routes.length}</div>
        </div>
        <div className="stat-cell">
          <div className="stat-sub">Quarterly Passengers</div>
          <div className="stat-big">{selRow.passenger_count.toLocaleString()}</div>
          <div className="stat-note">of {total.toLocaleString()} total</div>
        </div>
        <div className="stat-cell">
          <div className="stat-sub">DGCA Weight Q(base)</div>
          <div className="stat-big stat-purple">{pct.toFixed(3)}%</div>
          <div className="stat-note">of national air traffic</div>
        </div>
        <div className="stat-cell">
          <div className="stat-sub">vs Equal Weight</div>
          <div className={`stat-big ${delta > 0 ? 'stat-green' : 'stat-red'}`}>
            {delta > 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(3)}%
          </div>
          <div className="stat-note">Naive = {naive.toFixed(3)}%</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="section-label">Route Weight Distribution Graphs</div>
        <button 
          onClick={() => setChartLimit(prev => prev === 25 ? 80 : 25)}
          className="btn btn-secondary"
          style={{ fontSize: '0.8rem', padding: '6px 12px' }}
        >
          Show {chartLimit === 25 ? 'All 80 Routes' : 'Top 25 Routes'}
        </button>
      </div>
      <div className="grid-2" style={{ gap: 20, marginBottom: 32 }}>
        <Plot
          key={`bar-${chartLimit}-${dark}`}
          data={[{
            type: 'bar', x: barData.map(r => r.passenger_share * 100), y: barData.map(r => r.route_id),
            orientation: 'h',
            marker: { color: barData.map(r => r.route_id === selectedId ? '#8B5CF6' : (dark ? '#1F2D54' : '#E2E8F0')) },
            text: barData.map(r => `${(r.passenger_share * 100).toFixed(2)}%`),
            textposition: 'outside', textfont: { color: dark ? '#94A3B8' : '#475569', size: 9 },
            hovertemplate: '<b>%{y}</b><br>Weight: %{x:.3f}%<extra></extra>',
          }]}
          layout={{
            ...PB,
            title: { text: chartLimit === 25 ? 'Top 25 Routes by Passenger Weight' : 'All 80 Routes by Passenger Weight', font: { color: dark ? '#E2E8F0' : '#0F172A', size: 13 } },
            height: chartLimit === 25 ? 560 : 1600, margin: { l: 90, r: 50, t: 40, b: 60 },
            xaxis: { ...AX, title: { text: 'Weight (%)', font: { size: 12 }, standoff: 12 }, ticksuffix: '%' },
            yaxis: { ...AX, showgrid: false, autorange: 'reversed', tickfont: { size: 9, family: 'JetBrains Mono, monospace' } },
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
              title: { text: `All ${routes.length} Routes — Weight Distribution`, font: { color: dark ? '#E2E8F0' : '#0F172A', size: 12 } },
              showlegend: false, height: 320, margin: { t: 50, b: 10, l: 30, r: 30 },
              annotations: [{ text: `<b>${selRow.route_id}</b><br>${pct.toFixed(2)}%`, x: 0.5, y: 0.5, showarrow: false, font: { color: dark ? '#E2E8F0' : '#0F172A', size: 13 }, align: 'center' }],
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
          />
          <div className="grid-2" style={{ gap: 10, marginTop: 12 }}>
            {[['Top 5 Routes', top5s], ['Top 10 Routes', top10s]].map(([label, val]) => (

              <div key={String(label)} className="card" style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--sub)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{String(label)}</div>
                <div style={{ color: 'var(--purple)', fontSize: '1.4rem', fontWeight: 900, fontFamily: 'JetBrains Mono,monospace' }}>{Number(val).toFixed(1)}%</div>
                <div style={{ color: 'var(--sub)', fontSize: '0.75rem' }}>of national traffic</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section-label">Index Impact Simulator</div>
      <p style={{ color: 'var(--sub)', fontSize: '0.88rem', marginBottom: 16 }}>
        Simulate a fare spike on <strong style={{ color: 'var(--purple)' }}>{selectedId}</strong> to see the difference between naive vs. DGCA-weighted index response.
      </p>
      <div className="grid-2" style={{ gap: 20 }}>
        <div>
          <label className="control-label">Fare Change (%)</label>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--sub)' }}>-50%</span>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--cyan)', fontFamily: 'JetBrains Mono,monospace' }}>{spikeChange > 0 ? '+' : ''}{spikeChange}%</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--sub)' }}>+100%</span>
          </div>
          <input type="range" min={-50} max={100} step={5} value={spikeChange}
            onChange={e => setSpikeChange(Number(e.target.value))} style={{ marginBottom: 20 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)' }}>
              <div style={{ color: '#FCA5A5', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Naive Unweighted</div>
              <div style={{ color: 'var(--red)', fontSize: '1.8rem', fontWeight: 900, fontFamily: 'JetBrains Mono,monospace' }}>
                {naiveImpact >= 0 ? '+' : ''}{naiveImpact.toFixed(3)} pts
              </div>
              <div style={{ color: 'var(--sub)', fontSize: '0.8rem', marginTop: 4 }}>Equally divides across {routes.length} routes</div>
            </div>
            <div className="card" style={{ border: '1px solid rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.06)' }}>
              <div style={{ color: '#C4B5FD', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>APIx DGCA Weighted</div>
              <div style={{ color: 'var(--purple)', fontSize: '1.8rem', fontWeight: 900, fontFamily: 'JetBrains Mono,monospace' }}>
                {weightImpact >= 0 ? '+' : ''}{weightImpact.toFixed(3)} pts
              </div>
              <div style={{ color: 'var(--sub)', fontSize: '0.8rem', marginTop: 4 }}>Weighted at {pct.toFixed(3)}% share</div>
            </div>
          </div>
        </div>
        <div>
          <Plot
            key={`impact-${dark}`}
            data={[{
              type: 'bar',
              x: ['Naive (Unweighted)', `APIx | ${selectedId}`],
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
            <span style={{ color: 'var(--sub)', fontSize: '0.88rem' }}>Naive index error: </span>
            <span style={{ color: 'var(--red)', fontWeight: 800, fontFamily: 'JetBrains Mono,monospace' }}>{Math.abs(naiveImpact - weightImpact).toFixed(3)} pts</span>
            <span style={{ color: 'var(--sub)', fontSize: '0.88rem' }}> — a misleading signal for policymakers.</span>
          </div>
        </div>
      </div>

      {/* Sovereign 80-Route Weight Ledger */}
      <div style={{ marginTop: 40, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div>
            <div className="section-label" style={{ marginBottom: 4 }}>Sovereign Basket Ledger — {routes.length} Active Routes</div>
            <div style={{ color: 'var(--sub)', fontSize: '0.8rem' }}>
              Full distribution matrix of passenger traffic and index weight assignments
            </div>
          </div>
          <div>
            <input 
              type="text" 
              placeholder="Search route (e.g. DEL-BOM)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="control-select"
              style={{ width: '220px', padding: '6px 12px', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
            <table className="ledger-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--card-border)', borderBottom: '1px solid var(--card-border)', color: 'var(--text)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Rank</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Route ID</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Quarterly Passengers</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Passenger Share</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((r) => {
                  const rIdx = routes.findIndex(x => x.route_id === r.route_id) + 1;
                  const isSelected = r.route_id === selectedId;
                  return (
                    <tr 
                      key={r.route_id} 
                      style={{ 
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        background: isSelected ? 'rgba(139,92,246,0.1)' : 'transparent',
                        transition: 'background 0.2s'
                      }}
                    >
                      <td style={{ padding: '12px 16px', color: 'var(--sub)', fontWeight: 600 }}>#{rIdx}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--cyan)' }}>{r.route_id}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>
                        {r.passenger_count.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--purple)', fontFamily: 'JetBrains Mono, monospace' }}>
                        {(r.passenger_share * 100).toFixed(4)}%
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button 
                          onClick={() => setSelectedId(r.route_id)}
                          className="btn btn-secondary"
                          style={{ 
                            fontSize: '0.75rem', 
                            padding: '4px 10px',
                            background: isSelected ? 'var(--purple)' : undefined,
                            borderColor: isSelected ? 'var(--purple)' : undefined,
                            color: isSelected ? '#fff' : undefined
                          }}
                        >
                          {isSelected ? 'Simulating' : 'Simulate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredList.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--sub)' }}>
                      No routes match your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   PANEL 3: ECONOMETRIC PRECEDENTS
   ════════════════════════════════════════════════════════════════════════════ */
const PrecedentsPanel: React.FC<{ dark: boolean }> = () => {
  const navigate = useNavigate();

  return (
    <>
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--cyan)', marginBottom: 8 }}>
          Econometric Lineage
        </div>
        <h2 style={{ fontSize: '2.4rem', fontWeight: 900, letterSpacing: -1, color: 'var(--text)', margin: '0 0 10px 0' }}>
          Scientific Grounding & Literature Precedents
        </h2>
        <p style={{ color: 'var(--sub)', fontSize: '1rem', maxWidth: 820, lineHeight: 1.75, margin: 0 }}>
          APIx is method-equivalent to established price index methodologies used by the <strong style={{ color: 'var(--text)' }}>U.S. Bureau of Labor Statistics (BLS)</strong> and the <strong style={{ color: 'var(--text)' }}>UK Office for National Statistics (ONS)</strong>.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
        <div className="card" style={{ borderLeft: '3px solid var(--cyan)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--cyan)', marginBottom: 4 }}>
            Direct Methodological Precedent
          </div>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', color: 'var(--text)' }}>
            U.S. BLS International Price Program — "Air Passenger Fares Price Indexes"
          </h3>
          <p style={{ margin: '0 0 10px 0', color: 'var(--sub)', fontSize: '0.88rem', lineHeight: 1.6 }}>
            Uses a modified Laspeyres index with passenger-volume-derived revenue weights from U.S. DOT DB1B surveys, updated periodically. This is the closest direct precedent to APIx's method.
          </p>
          <div style={{ fontSize: '0.82rem', color: 'var(--cyan)' }}>
            <strong>APIx Adaptation:</strong> Replaces U.S. DOT DB1B with Indian DGCA Form A/B passenger traffic returns across the 80-route sovereign domestic basket.
          </div>
        </div>

        <div className="card" style={{ borderLeft: '3px solid var(--purple)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--purple)', marginBottom: 4 }}>
            Index Theory Distinction
          </div>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', color: 'var(--text)' }}>
            UK Office for National Statistics — Laspeyres vs. Lowe Index Formulae
          </h3>
          <p style={{ margin: '0 0 10px 0', color: 'var(--sub)', fontSize: '0.88rem', lineHeight: 1.6 }}>
            The UK ONS methodology appendix notes that real-world operational CPI implementations are closer to a Lowe Index once quantity weights are periodically refreshed rather than a pure textbook Laspeyres.
          </p>
          <div style={{ fontSize: '0.82rem', color: 'var(--purple)' }}>
            <strong>Operational Precision:</strong> APIx operates as a robust Lowe Index across quarters as new DGCA passenger matrices are integrated.
          </div>
        </div>

        <div className="card" style={{ borderLeft: '3px solid var(--green)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--green)', marginBottom: 4 }}>
            High-Frequency Validation
          </div>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', color: 'var(--text)' }}>
            Janice Lent & Alan H. Dorfman (2005) — "Air-Travel Transaction Index"
          </h3>
          <p style={{ margin: 0, color: 'var(--sub)', fontSize: '0.88rem', lineHeight: 1.6 }}>
            Published in the <em>Monthly Labor Review</em> (U.S. BLS), Lent & Dorfman demonstrated that electronic booking transaction scraping provides a reliable leading indicator consistent with official retrospective CPI series.
          </p>
        </div>
      </div>

      <div 
        className="card" 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          border: '1px solid var(--cyan)',
          padding: '20px 24px',
          cursor: 'pointer'
        }}
        onClick={() => navigate('/references')}
      >
        <div>
          <div style={{ color: 'var(--cyan)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
            Official Data Catalog & Citations
          </div>
          <div style={{ color: 'var(--text)', fontSize: '1.15rem', fontWeight: 800, marginTop: 2 }}>
            View Full Data Sources & Research References Repository →
          </div>
        </div>
        <button 
          className="hud-mobile-sync-btn"
          style={{ padding: '8px 16px', fontSize: '0.84rem' }}
          onClick={(e) => { e.stopPropagation(); navigate('/references'); }}
        >
          Open Catalog
        </button>
      </div>
    </>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   METHODOLOGY ROOT — CLEAN INNER SUBTAB SWITCHER (NO EMOJIS / LOGOS)
   ════════════════════════════════════════════════════════════════════════════ */
const INNER_TABS = [
  { id: 'math',        label: 'Index Mathematics'       },
  { id: 'weights',     label: 'DGCA Traffic Weighting'  },
  { id: 'precedents',  label: 'Econometric Precedents'  },
];

const MathsStats: React.FC = () => {
  const { dark } = useTheme();
  const [activeTab, setActiveTab] = useState<'math' | 'weights' | 'precedents'>('math');

  return (
    <div className="page-content">
      <div className="runway-bar" />

      {/* Clean Tab Switcher (No Emojis, No Duplicate Icons) */}
      <div style={{
        display: 'flex', 
        gap: 8, 
        marginBottom: 36,
        borderBottom: `1px solid ${dark ? '#1E3A5F' : '#E2E8F0'}`,
        paddingBottom: 0,
        overflowX: 'auto'
      }}>
        {INNER_TABS.map(t => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                padding: '10px 22px',
                fontSize: '0.9rem',
                fontWeight: 600,
                fontFamily: 'Inter, sans-serif',
                background: 'none',
                border: 'none',
                borderBottom: isActive
                  ? `2px solid ${t.id === 'math' ? 'var(--cyan)' : t.id === 'weights' ? 'var(--purple)' : 'var(--green)'}`
                  : '2px solid transparent',
                color: isActive ? 'var(--text)' : 'var(--sub)',
                cursor: 'pointer',
                marginBottom: -1,
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'math'       && <IndexMathPanel dark={dark} />}
      {activeTab === 'weights'    && <WeightAllocationPanel dark={dark} />}
      {activeTab === 'precedents' && <PrecedentsPanel dark={dark} />}
    </div>
  );
};

export default MathsStats;
