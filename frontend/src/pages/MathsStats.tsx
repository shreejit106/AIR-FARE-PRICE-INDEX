import React, { useState, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { useTheme } from '../App';

const RAW_FARES = [3800, 4100, 4200, 4350, 4400, 4500, 4600, 4750, 4900, 5100, 5300, 18500];
const Q1 = 4200, Q3 = 4900, IQR = Q3 - Q1, UB = Q3 + 1.5 * IQR;
const CLEAN = RAW_FARES.filter(x => x <= UB);
const MEDIAN_CLEAN = CLEAN[Math.floor(CLEAN.length / 2)];

/* ─── Shared Plotly layout builders (adapts to theme) ───────────────────── */
function plotBase(dark: boolean): Partial<Plotly.Layout> {
  return {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor:  dark ? '#0A1628' : '#F8FAFC',
    font: { color: dark ? '#94A3B8' : '#334155', family: 'Inter, sans-serif', size: 12 },
  };
}
function axisStyle(dark: boolean): Partial<Plotly.LayoutAxis> {
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

const PIPELINE_STEPS = [
  {
    num: '01', title: 'Ingestion', color: '#06B6D4',
    action: 'Continuous scraping of MakeMyTrip, Ixigo, Goibibo, and direct airline portals.',
    rationale: 'Captures real pricing signals across T+1, T+7, T+15, T+30, T+45 booking horizons.',
  },
  {
    num: '02', title: 'IQR Filtration', color: '#F59E0B',
    action: 'Discard any fare outside Q3 + 1.5 × IQR for its route-horizon pair.',
    rationale: 'Eliminates last-seat surge outliers that would catastrophically distort the average.',
  },
  {
    num: '03', title: 'Median Aggregation', color: '#10B981',
    action: 'Compute the statistical median of remaining clean fares.',
    rationale: 'Median is resistant to residual skewness — gives a truer reflection of what a typical traveller pays.',
  },
  {
    num: '04', title: 'Laspeyres Weighting', color: '#8B5CF6',
    action: 'Multiply each route\'s price ratio (current/base) by its DGCA passenger share Q_base.',
    rationale: 'DEL-BOM correctly outweighs low-traffic routes, producing a consumer-representative national index.',
  },
];

const VARS = [
  { sym: 'P(r,t)', title: 'Current Median Fare',      color: '#06B6D4', desc: 'IQR-filtered median ticket price on route r at time t, scraped live from airlines and OTAs.' },
  { sym: 'P(r,0)', title: 'Base Period Fare',          color: '#F59E0B', desc: 'Fixed reference price for route r during the chosen base year, anchoring the index at exactly 100.' },
  { sym: 'Q(r,0)', title: 'Passenger Weight (DGCA)',   color: '#8B5CF6', desc: 'Proportion of national passengers on route r during the base period, from DGCA quarterly data.' },
];

const MathsStats: React.FC = () => {
  const { dark } = useTheme();
  const [outlierVal, setOutlierVal] = useState(22000);
  const baseFares = [4200, 4400, 4500, 4600, 4750];
  const allFares  = [...baseFares, outlierVal];
  const mean   = allFares.reduce((s, v) => s + v, 0) / allFares.length;
  const sorted = [...allFares].sort((a, b) => a - b);
  const med    = sorted[Math.floor(sorted.length / 2)];

  const PB = useMemo(() => plotBase(dark), [dark]);
  const AX = useMemo(() => axisStyle(dark), [dark]);

  return (
    <div className="page-content">
      <div className="runway-bar" />

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--cyan)', marginBottom: 8 }}>Methodology</div>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 900, letterSpacing: -1, color: 'var(--text)', margin: '0 0 10px 0' }}>Modified Laspeyres Price Index</h1>
        <p style={{ color: 'var(--sub)', fontSize: '1rem', maxWidth: 820, lineHeight: 1.75, margin: 0 }}>
          The <strong style={{ color: 'var(--text)' }}>Airfare Price Index (APIx)</strong> uses a modified Laspeyres methodology — the gold standard used by national statistical agencies — adapted specifically for India's aviation market, where booking horizon, airline mix, and passenger volume vary enormously across routes.
        </p>
      </div>

      <div className="grid-2" style={{ gap: 20, marginBottom: 32 }}>
        {/* Formula box */}
        <div>
          <div className="formula-box">
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--sub)', marginBottom: 22 }}>Core Formula</div>
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

          {/* Parity cards */}
          <div className="grid-3" style={{ gap: 8 }}>
            {[
              { val: '100',   label: 'Base Parity',    color: 'var(--cyan)'  },
              { val: '>100',  label: 'Fare Inflation',  color: 'var(--red)'   },
              { val: '<100',  label: 'Fare Deflation',  color: 'var(--green)' },
            ].map(c => (
              <div key={c.label} className="card" style={{ textAlign: 'center', border: `1px solid ${c.color}25` }}>
                <div style={{ color: c.color, fontSize: '1.5rem', fontWeight: 900, fontFamily: 'JetBrains Mono,monospace' }}>{c.val}</div>
                <div style={{ color: 'var(--sub)', fontSize: '0.75rem', marginTop: 4 }}>{c.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Variable legend */}
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

      {/* Pipeline */}
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

      <div style={{ marginTop: 36 }} />

      {/* IQR Demo Chart */}
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
          xaxis: {
            ...AX,
            title: { text: 'Scraped Fare Samples', font: { size: 13 }, standoff: 12 },
            tickfont: { size: 11, family: 'JetBrains Mono, monospace' }
          },
          yaxis: {
            ...AX,
            title: { text: 'Fare (₹)', font: { size: 13 }, standoff: 10 },
            tickformat: ',.0f',
            range: [0, Math.max(...RAW_FARES) * 1.08]
          },
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%', marginBottom: 48 }}
      />

      {/* Mean vs Median Slider */}
      <div className="section-label">Mean vs Median: Real-time Outlier Injection</div>
      <p style={{ color: 'var(--sub)', fontSize: '0.88rem', marginBottom: 16 }}>Drag the slider to inject a high-value outlier. Watch the Mean distort while the Median stays grounded.</p>
      <div className="grid-2" style={{ gap: 20 }}>
        {/* Slider + stats */}
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

        {/* Scatter chart */}
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
              { type: 'line', x0: -0.5, x1: 5.5, y0: med, y1: med,  line: { color: '#10B981', dash: 'dot',  width: 2 } },
            ],
            annotations: [
              { x: 5, y: mean, text: `Mean: ₹${Math.round(mean).toLocaleString()}`, showarrow: false, font: { color: '#EF4444', size: 12, family: 'Inter, sans-serif' }, xanchor: 'right', yanchor: 'bottom', yshift: 4 },
              { x: 5, y: med,  text: `Median: ₹${Math.round(med).toLocaleString()}`,  showarrow: false, font: { color: '#10B981', size: 12, family: 'Inter, sans-serif' }, xanchor: 'right', yanchor: 'bottom', yshift: 4 },
            ],
            showlegend: false,
            xaxis: {
              ...AX,
              title: { text: 'Fare Scenarios', font: { size: 13 }, standoff: 12 },
              tickfont: { size: 11, family: 'JetBrains Mono, monospace' }
            },
            yaxis: {
              ...AX,
              title: { text: 'Fare (₹)', font: { size: 13 }, standoff: 10 },
              tickformat: ',.0f'
            },
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
};

export default MathsStats;
