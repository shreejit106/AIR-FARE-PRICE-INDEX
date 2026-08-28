import React, { useState, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { useTheme } from '../App';

/* ─── Plotly helpers ─────────────────────────────────────────────────────── */
function plotBase(dark: boolean): Partial<any> {
  return {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor:  dark ? '#0A1628' : '#F8FAFC',
    font: { color: dark ? '#94A3B8' : '#334155', family: 'Inter, sans-serif', size: 12 },
  };
}
function axisStyle(dark: boolean): Partial<any> {
  return {
    gridcolor: dark ? '#1E3A5F' : '#E2E8F0', gridwidth: 1,
    zerolinecolor: dark ? '#2D4A6E' : '#CBD5E1', zerolinewidth: 1,
    tickfont: { color: dark ? '#64748B' : '#475569', size: 10, family: 'Inter, sans-serif' },
    titlefont: { color: dark ? '#94A3B8' : '#334155', size: 12, family: 'Inter, sans-serif' },
    showline: true, linecolor: dark ? '#1E3A5F' : '#CBD5E1', linewidth: 1,
  };
}

/* ─── ATF BASE ROUTE DATA (representative sample of 10 routes) ─────────── */
const ATF_ROUTES = [
  { id: 'DEL-BOM', baseFare: 5200, atfSens: 0.38, dominant: '6E' },
  { id: 'DEL-BLR', baseFare: 4800, atfSens: 0.41, dominant: '6E' },
  { id: 'BOM-BLR', baseFare: 3900, atfSens: 0.35, dominant: '6E' },
  { id: 'DEL-HYD', baseFare: 4200, atfSens: 0.39, dominant: 'AI' },
  { id: 'MAA-DEL', baseFare: 5100, atfSens: 0.42, dominant: '6E' },
  { id: 'CCU-DEL', baseFare: 4600, atfSens: 0.40, dominant: 'AI' },
  { id: 'BOM-COK', baseFare: 3500, atfSens: 0.33, dominant: 'IX' },
  { id: 'HYD-BLR', baseFare: 2800, atfSens: 0.28, dominant: 'SG' },
  { id: 'DEL-PNQ', baseFare: 3800, atfSens: 0.36, dominant: '6E' },
  { id: 'BOM-AMD', baseFare: 2600, atfSens: 0.30, dominant: 'QP' },
];

const Simulation: React.FC = () => {
  const { dark } = useTheme();
  const [atfChange, setAtfChange]   = useState(15);
  const [passThru, setPassThru]     = useState<'low' | 'medium' | 'high'>('medium');
  const [apixBase]                  = useState(103.4);

  const ptMultiplier = passThru === 'low' ? 0.4 : passThru === 'medium' ? 0.65 : 0.85;
  const PB = useMemo(() => plotBase(dark), [dark]);
  const AX = useMemo(() => axisStyle(dark), [dark]);

  const avgFareImpact = atfChange * 0.37 * ptMultiplier;
  const newIndex = apixBase * (1 + avgFareImpact / 100);
  const consumerCostPerYear = Math.round(avgFareImpact / 100 * 5200 * 150e6 * 0.3);

  const shockedFares = ATF_ROUTES.map(r => ({
    ...r,
    newFare: Math.round(r.baseFare * (1 + atfChange / 100 * r.atfSens * ptMultiplier)),
    fareDelta: Math.round(r.baseFare * atfChange / 100 * r.atfSens * ptMultiplier),
  }));

  const days = Array.from({ length: 31 }, (_, i) => i);
  const baselineTrend = days.map(d => apixBase + d * 0.05);
  const shockTrend    = days.map((d) => {
    const phaseIn = Math.min(1, d / 14);
    return apixBase + d * 0.05 + avgFareImpact * phaseIn;
  });

  return (
    <div className="page-content">
      <div className="runway-bar" />

      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--amber)', marginBottom: 8 }}>
          Economic Shock Modelling
        </div>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 900, letterSpacing: -1, color: 'var(--text)', margin: '0 0 8px 0' }}>
          ATF Fuel Price Shock Simulator
        </h1>
        <p style={{ color: 'var(--sub)', fontSize: '0.95rem', maxWidth: 760, lineHeight: 1.75, margin: 0 }}>
          Aviation Turbine Fuel (ATF) constitutes ~35–42% of an airline's operating cost structure. Simulate how global crude tariff fluctuations ripple through India's domestic airfare index and aggregate household budgets.
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginBottom: 32, padding: 24, background: dark ? '#0A1628' : '#F8FAFC', borderRadius: 12, border: `1px solid ${dark ? '#1E3A5F' : '#E2E8F0'}` }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <label className="control-label">ATF Price Change: <span style={{ color: 'var(--amber)', fontFamily: 'JetBrains Mono,monospace' }}>{atfChange > 0 ? '+' : ''}{atfChange}%</span></label>
          <input type="range" min={-20} max={60} step={1} value={atfChange}
            onChange={e => setAtfChange(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#F59E0B', marginTop: 8 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--sub)', marginTop: 4 }}>
            <span>−20% (Crude Glut)</span><span>+60% (Supply Disruption)</span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <label className="control-label">Carrier Pass-Through Rate</label>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {(['low', 'medium', 'high'] as const).map(p => (
              <button key={p} onClick={() => setPassThru(p)}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
                  background: passThru === p ? (p === 'low' ? '#10B981' : p === 'medium' ? '#F59E0B' : '#EF4444') : (dark ? '#1F2D54' : '#E2E8F0'),
                  color: passThru === p ? '#fff' : 'var(--sub)',
                  transition: 'all 0.2s',
                }}>
                {p === 'low' ? 'Low (40%)' : p === 'medium' ? 'Med (65%)' : 'High (85%)'}
              </button>
            ))}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--sub)', marginTop: 8 }}>
            Ultra-LCCs pass through fuel spikes rapidly; full-service carriers absorb short-term variance.
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="stat-strip" style={{ marginBottom: 28 }}>
        <div className="stat-cell">
          <div className="stat-sub">Average Fare Delta</div>
          <div className="stat-big" style={{ color: atfChange > 0 ? '#EF4444' : '#10B981' }}>
            {atfChange > 0 ? '+' : ''}{avgFareImpact.toFixed(1)}%
          </div>
          <div className="stat-note">on typical ₹5,200 ticket</div>
        </div>
        <div className="stat-cell">
          <div className="stat-sub">Projected APIx Level</div>
          <div className="stat-big stat-amber">{newIndex.toFixed(1)}</div>
          <div className="stat-note">vs baseline {apixBase}</div>
        </div>
        <div className="stat-cell">
          <div className="stat-sub">Consumer Cost Impact</div>
          <div className="stat-big" style={{ color: '#F59E0B', fontSize: '1.2rem' }}>
            ₹{(consumerCostPerYear / 1e9).toFixed(1)}B / yr
          </div>
          <div className="stat-note">across 150M domestic passengers</div>
        </div>
        <div className="stat-cell">
          <div className="stat-sub">Monitored Route Sample</div>
          <div className="stat-big stat-cyan">{ATF_ROUTES.length} / 80</div>
          <div className="stat-note">representative trunk basket</div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid-2" style={{ gap: 20, marginBottom: 28 }}>
        <div>
          <div className="section-label">30-Day Index Trajectory Projection</div>
          <Plot
            key={`shock-trend-${dark}`}
            data={[
              {
                type: 'scatter', mode: 'lines',
                x: days.map(d => `Day ${d}`), y: baselineTrend,
                name: 'Baseline Projection', line: { color: dark ? '#64748B' : '#94A3B8', dash: 'dash', width: 2 },
                hovertemplate: 'Baseline: %{y:.1f}<extra></extra>',
              },
              {
                type: 'scatter', mode: 'lines',
                x: days.map(d => `Day ${d}`), y: shockTrend,
                name: `Shocked APIx (${atfChange > 0 ? '+' : ''}${atfChange}% ATF)`,
                line: { color: atfChange > 0 ? '#EF4444' : '#10B981', width: 2.5 },
                fill: 'tonexty', fillcolor: (atfChange > 0 ? '#EF4444' : '#10B981') + '15',
                hovertemplate: 'Shocked: %{y:.1f}<extra></extra>',
              },
            ]}
            layout={{
              ...PB, height: 320,
              margin: { l: 60, r: 20, t: 20, b: 50 },
              legend: { font: { color: dark ? '#94A3B8' : '#475569', size: 10 }, bgcolor: 'transparent', orientation: 'h', y: -0.2 },
              xaxis: { ...AX, tickfont: { size: 9 }, tickmode: 'array', tickvals: [0,5,10,15,20,25,30].map(d => `Day ${d}`) },
              yaxis: { ...AX, title: { text: 'APIx Value', font: { size: 11 } } },
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <div className="section-label">Route-by-Route Fare Impact</div>
          <Plot
            key={`route-shock-${dark}`}
            data={[
              {
                type: 'bar', x: shockedFares.map(r => r.id), y: shockedFares.map(r => r.baseFare),
                name: 'Current Base Fare', marker: { color: dark ? '#1E3A5F' : '#CBD5E1' },
                hovertemplate: 'Base: ₹%{y:,}<extra></extra>',
              },
              {
                type: 'bar', x: shockedFares.map(r => r.id), y: shockedFares.map(r => r.fareDelta),
                name: 'ATF Delta', marker: { color: atfChange > 0 ? '#F59E0B' : '#10B981' },
                hovertemplate: 'Delta: ₹%{y:,}<extra></extra>',
              },
            ]}
            layout={{
              ...PB, height: 320, barmode: 'stack',
              margin: { l: 70, r: 20, t: 20, b: 60 },
              legend: { font: { color: dark ? '#94A3B8' : '#475569', size: 10 }, bgcolor: 'transparent', orientation: 'h', y: -0.25 },
              xaxis: { ...AX, tickangle: -45, tickfont: { size: 9, family: 'JetBrains Mono, monospace' } },
              yaxis: { ...AX, title: { text: 'Fare (₹)', font: { size: 11 } }, tickformat: ',.0f' },
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
          />
        </div>
      </div>
    </div>
  );
};

export default Simulation;
