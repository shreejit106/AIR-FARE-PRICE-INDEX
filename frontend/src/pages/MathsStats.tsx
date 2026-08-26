import React, { useState, useEffect, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { useTheme } from '../App';

/* ─────────────────────────────── MATHS DATA ─────────────────────────────── */
const RAW_FARES = [3800, 4100, 4200, 4350, 4400, 4500, 4600, 4750, 4900, 5100, 5300, 18500];
const Q1 = 4200, Q3 = 4900, IQR = Q3 - Q1, UB = Q3 + 1.5 * IQR;
const CLEAN = RAW_FARES.filter(x => x <= UB);
const MEDIAN_CLEAN = CLEAN[Math.floor(CLEAN.length / 2)];

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
  { sym: 'P(r,t)', title: 'Current Median Fare',    color: '#06B6D4', desc: 'IQR-filtered median ticket price on route r at time t, scraped live from airlines and OTAs.' },
  { sym: 'P(r,0)', title: 'Base Period Fare',        color: '#F59E0B', desc: 'Fixed reference price for route r during the chosen base year, anchoring the index at exactly 100.' },
  { sym: 'Q(r,0)', title: 'Passenger Weight (DGCA)', color: '#8B5CF6', desc: 'Proportion of national passengers on route r during the base period, from DGCA quarterly data.' },
];

const API = 'http://localhost:8000';

interface RouteWeight {
  route_id: string;
  passenger_share: number;
  passenger_count: number;
}

/* ─── Shared Plotly layout builders ─────────────────────────────────────── */
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

/* ════════════════════════════════════════════════════════════════════════════
   INDEX MATHEMATICS PANEL
   ════════════════════════════════════════════════════════════════════════════ */
const IndexMath: React.FC<{ dark: boolean }> = ({ dark }) => {
  const [outlierVal, setOutlierVal] = useState(22000);
  const baseFares = [4200, 4400, 4500, 4600, 4750];
  const allFares  = [...baseFares, outlierVal];
  const mean   = allFares.reduce((s, v) => s + v, 0) / allFares.length;
  const sorted = [...allFares].sort((a, b) => a - b);
  const med    = sorted[Math.floor(sorted.length / 2)];
  const PB = useMemo(() => plotBase(dark), [dark]);
  const AX = useMemo(() => axisStyle(dark), [dark]);

  return (
    <>
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--cyan)', marginBottom: 8 }}>Methodology</div>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 900, letterSpacing: -1, color: 'var(--text)', margin: '0 0 10px 0' }}>Modified Laspeyres Price Index</h1>
        <p style={{ color: 'var(--sub)', fontSize: '1rem', maxWidth: 820, lineHeight: 1.75, margin: 0 }}>
          The <strong style={{ color: 'var(--text)' }}>Airfare Price Index (APIx)</strong> uses a modified Laspeyres methodology — the gold standard used by national statistical agencies — adapted specifically for India's aviation market, where booking horizon, airline mix, and passenger volume vary enormously across routes.
        </p>
      </div>

      <div className="grid-2" style={{ gap: 20, marginBottom: 32 }}>
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
   WEIGHT ALLOCATION PANEL
   ════════════════════════════════════════════════════════════════════════════ */
const WeightAllocation: React.FC<{ dark: boolean }> = ({ dark }) => {
  const [routes,      setRoutes]      = useState<RouteWeight[]>([]);
  const [total,       setTotal]       = useState(0);
  const [selectedId,  setSelectedId]  = useState('');
  const [spikeChange, setSpikeChange] = useState(20);
  const [loading,     setLoading]     = useState(true);
  const PB = useMemo(() => plotBase(dark), [dark]);
  const AX = useMemo(() => axisStyle(dark), [dark]);

  useEffect(() => {
    fetch(`${API}/api/weights`)
      .then(r => r.json())
      .then(d => {
        setRoutes(d.routes);
        setTotal(d.total_passengers);
        if (d.routes.length) setSelectedId(d.routes[0].route_id);
        setLoading(false);
      }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
      <div style={{ color: 'var(--cyan)', fontSize: '1.2rem', fontFamily: 'JetBrains Mono,monospace' }}>● Loading DGCA data...</div>
    </div>
  );

  const selRow = routes.find(r => r.route_id === selectedId) ?? routes[0];
  if (!selRow) return null;

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
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--purple)', marginBottom: 8 }}>DGCA Data Integration</div>
        <h2 style={{ fontSize: '2.4rem', fontWeight: 900, letterSpacing: -1, color: 'var(--text)', margin: '0 0 10px 0' }}>Passenger-Weighted Route Allocation</h2>
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

      <div className="grid-2" style={{ gap: 20, marginBottom: 32 }}>
        <Plot
          key={`bar25-${dark}`}
          data={[{
            type: 'bar', x: top25.map(r => r.passenger_share * 100), y: top25.map(r => r.route_id),
            orientation: 'h',
            marker: { color: top25.map(r => r.route_id === selectedId ? '#8B5CF6' : (dark ? '#1F2D54' : '#E2E8F0')) },
            text: top25.map(r => `${(r.passenger_share * 100).toFixed(2)}%`),
            textposition: 'outside', textfont: { color: dark ? '#94A3B8' : '#475569', size: 10 },
            hovertemplate: '<b>%{y}</b><br>Weight: %{x:.3f}%<extra></extra>',
          }]}
          layout={{
            ...PB,
            title: { text: 'Top 25 Routes by Passenger Weight', font: { color: dark ? '#E2E8F0' : '#0F172A', size: 13 } },
            height: 560, margin: { l: 90, r: 50, t: 40, b: 60 },
            xaxis: { ...AX, title: { text: 'Weight (%)', font: { size: 12 }, standoff: 12 }, ticksuffix: '%' },
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
    </>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   METHODOLOGY ROOT — inner tab switcher
   ════════════════════════════════════════════════════════════════════════════ */
const INNER_TABS = [
  { id: 'math',    label: '📊 Index Mathematics' },
  { id: 'weights', label: '⚖ Weight Allocation'  },
];

const MathsStats: React.FC = () => {
  const { dark } = useTheme();
  const [activeTab, setActiveTab] = useState<'math' | 'weights'>('math');

  return (
    <div className="page-content">
      <div className="runway-bar" />

      {/* Inner tab switcher */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 40,
        borderBottom: `1px solid ${dark ? '#1E3A5F' : '#E2E8F0'}`,
        paddingBottom: 0,
      }}>
        {INNER_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as 'math' | 'weights')}
            style={{
              padding: '10px 22px',
              fontSize: '0.9rem',
              fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === t.id
                ? `2px solid ${t.id === 'math' ? 'var(--cyan)' : 'var(--purple)'}`
                : '2px solid transparent',
              color: activeTab === t.id ? 'var(--text)' : 'var(--sub)',
              cursor: 'pointer',
              marginBottom: -1,
              transition: 'all 0.2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'math'    && <IndexMath dark={dark} />}
      {activeTab === 'weights' && <WeightAllocation dark={dark} />}
    </div>
  );
};

export default MathsStats;
