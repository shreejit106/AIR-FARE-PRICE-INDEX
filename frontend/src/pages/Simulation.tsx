import React, { useState, useEffect, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { useTheme } from '../App';
import { API_BASE_URL } from '../config';

const API = API_BASE_URL;

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

/* ─── Airline data ───────────────────────────────────────────────────────── */
const AIRLINES = [
  {
    code: '6E', name: 'IndiGo',         color: '#1B67B2',
    passThrough: 0.72, routeShare: 0.47,
    t1: 8420,  t7: 6200, t15: 5100, t30: 4400, t45: 3800,
    surgeScore: 82, network: 88, priceComp: 91, mktConc: 78, complaints: 45,
    routes: ['DEL-BOM', 'BOM-BLR', 'DEL-HYD'],
    rating: 'Cheapest', tagline: 'India\'s largest LCC. Aggressive capacity-led pricing.',
    hub: 'Delhi IGI (DEL)',
    fleet: 330, founded: 2006,
  },
  {
    code: 'AI', name: 'Air India',       color: '#C8102E',
    passThrough: 0.55, routeShare: 0.19,
    t1: 11200, t7: 8900, t15: 7600, t30: 6800, t45: 6200,
    surgeScore: 58, network: 95, priceComp: 55, mktConc: 42, complaints: 62,
    routes: ['DEL-BOM', 'DEL-CCU', 'BOM-COK'],
    rating: 'Premium', tagline: 'National carrier. Full-service legacy network.',
    hub: 'Delhi IGI (DEL) / Mumbai (BOM)',
    fleet: 188, founded: 1932,
  },
  {
    code: 'SG', name: 'SpiceJet',        color: '#ED1B24',
    passThrough: 0.80, routeShare: 0.14,
    t1: 7800,  t7: 5900, t15: 4900, t30: 4100, t45: 3500,
    surgeScore: 75, network: 65, priceComp: 85, mktConc: 38, complaints: 78,
    routes: ['DEL-BOM', 'MAA-HYD', 'CCU-BOM'],
    rating: 'Budget', tagline: 'Lean capacity. Highest ATF pass-through rate.',
    hub: 'Delhi IGI (DEL) / Hyderabad (HYD)',
    fleet: 62, founded: 2005,
  },
  {
    code: 'QP', name: 'Akasa Air',       color: '#FF6600',
    passThrough: 0.65, routeShare: 0.08,
    t1: 7200,  t7: 5600, t15: 4700, t30: 4000, t45: 3600,
    surgeScore: 52, network: 42, priceComp: 88, mktConc: 25, complaints: 28,
    routes: ['BOM-BLR', 'DEL-BOM', 'HYD-BOM'],
    rating: 'Cheapest', tagline: 'Newest LCC. Ultra-low base, minimal surge.',
    hub: 'Mumbai (BOM)',
    fleet: 25, founded: 2022,
  },
  {
    code: 'IX', name: 'Air India Express', color: '#E83B3B',
    passThrough: 0.60, routeShare: 0.07,
    t1: 8900,  t7: 6800, t15: 5800, t30: 5200, t45: 4700,
    surgeScore: 65, network: 55, priceComp: 70, mktConc: 48, complaints: 55,
    routes: ['COK-CCU', 'BOM-COK', 'MAA-COK'],
    rating: 'Mid',  tagline: 'AI subsidiary. South & Gulf-heavy network.',
    hub: 'Kochi (COK) / Bangalore (BLR)',
    fleet: 84, founded: 2005,
  },
];

const HORIZONS = ['T+1', 'T+7', 'T+15', 'T+30', 'T+45'];
const FARE_KEYS: (keyof typeof AIRLINES[0])[] = ['t1','t7','t15','t30','t45'];

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

/* ════════════════════════════════════════════════════════════════════════════
   SECTION A — ATF Fuel Price Shock Simulator
   ════════════════════════════════════════════════════════════════════════════ */
const ATFSimulator: React.FC<{ dark: boolean }> = ({ dark }) => {
  const [atfChange, setAtfChange]   = useState(15);
  const [passThru, setPassThru]     = useState<'low' | 'medium' | 'high'>('medium');
  const [apixBase]                  = useState(103.4); // example current index

  const ptMultiplier = passThru === 'low' ? 0.4 : passThru === 'medium' ? 0.65 : 0.85;
  const PB = useMemo(() => plotBase(dark), [dark]);
  const AX = useMemo(() => axisStyle(dark), [dark]);

  // ATF typically ~35–40% of airline operating costs; a 15% ATF spike → ~5–6% fare rise at full pass-through
  const avgFareImpact = atfChange * 0.37 * ptMultiplier;
  const newIndex = apixBase * (1 + avgFareImpact / 100);
  const consumerCostPerYear = Math.round(avgFareImpact / 100 * 5200 * 150e6 * 0.3); // rough estimate

  const shockedFares = ATF_ROUTES.map(r => ({
    ...r,
    newFare: Math.round(r.baseFare * (1 + atfChange / 100 * r.atfSens * ptMultiplier)),
    fareDelta: Math.round(r.baseFare * atfChange / 100 * r.atfSens * ptMultiplier),
  }));

  // 30-day trend projection
  const days = Array.from({ length: 31 }, (_, i) => i);
  const baselineTrend = days.map(d => apixBase + d * 0.05);
  const shockTrend    = days.map((d, i) => {
    const phaseIn = Math.min(1, d / 14); // ATF shock phases in over 14 days
    return apixBase + d * 0.05 + avgFareImpact * phaseIn;
  });

  return (
    <>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: '#F59E0B', marginBottom: 8 }}>Economic Shock Modelling</div>
        <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: -0.5, color: 'var(--text)', margin: '0 0 8px 0' }}>
          ⛽ ATF Fuel Price Shock Simulator
        </h2>
        <p style={{ color: 'var(--sub)', fontSize: '0.95rem', maxWidth: 760, lineHeight: 1.75, margin: 0 }}>
          Aviation Turbine Fuel (ATF) constitutes ~35–42% of an airline's operating cost. Simulate how a global crude price shock ripples through India's domestic airfare index and household budgets.
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginBottom: 32, padding: 24, background: dark ? '#0A1628' : '#F8FAFC', borderRadius: 12, border: `1px solid ${dark ? '#1E3A5F' : '#E2E8F0'}` }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <label className="control-label">ATF Price Change: <span style={{ color: '#F59E0B', fontFamily: 'JetBrains Mono,monospace' }}>{atfChange > 0 ? '+' : ''}{atfChange}%</span></label>
          <input type="range" min={-20} max={60} step={1} value={atfChange}
            onChange={e => setAtfChange(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#F59E0B', marginTop: 8 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--sub)', marginTop: 4 }}>
            <span>−20% (Global glut)</span><span>+60% (Supply crisis)</span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <label className="control-label">Airline Pass-Through Rate</label>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {(['low', 'medium', 'high'] as const).map(p => (
              <button key={p} onClick={() => setPassThru(p)}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
                  background: passThru === p ? (p === 'low' ? '#10B981' : p === 'medium' ? '#F59E0B' : '#EF4444') : (dark ? '#1F2D54' : '#E2E8F0'),
                  color: passThru === p ? '#fff' : 'var(--sub)',
                  transition: 'all 0.2s',
                }}>
                {p === 'low' ? '🟢 Low (40%)' : p === 'medium' ? '🟡 Med (65%)' : '🔴 High (85%)'}
              </button>
            ))}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--sub)', marginTop: 8 }}>
            LCCs like SpiceJet pass through more; legacy carriers absorb more
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="stat-strip" style={{ marginBottom: 28 }}>
        <div className="stat-cell">
          <div className="stat-sub">Avg Fare Impact</div>
          <div className="stat-big" style={{ color: atfChange > 0 ? '#EF4444' : '#10B981' }}>
            {atfChange > 0 ? '+' : ''}{avgFareImpact.toFixed(1)}%
          </div>
          <div className="stat-note">on typical ₹5,200 ticket</div>
        </div>
        <div className="stat-cell">
          <div className="stat-sub">New APIx Level</div>
          <div className="stat-big stat-amber">{newIndex.toFixed(1)}</div>
          <div className="stat-note">vs current {apixBase}</div>
        </div>
        <div className="stat-cell">
          <div className="stat-sub">Consumer Cost Impact</div>
          <div className="stat-big" style={{ color: '#F59E0B', fontSize: '1.2rem' }}>
            ₹{(consumerCostPerYear / 1e9).toFixed(1)}B/yr
          </div>
          <div className="stat-note">across 150M annual pax</div>
        </div>
        <div className="stat-cell">
          <div className="stat-sub">Routes Affected</div>
          <div className="stat-big stat-cyan">{ATF_ROUTES.length} / 80</div>
          <div className="stat-note">sample of full basket</div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid-2" style={{ gap: 20, marginBottom: 32 }}>
        {/* Route-level impact */}
        <Plot
          key={`atf-routes-${dark}`}
          data={[
            {
              type: 'bar', name: 'Base Fare',
              x: ATF_ROUTES.map(r => r.id),
              y: ATF_ROUTES.map(r => r.baseFare),
              marker: { color: dark ? '#1F2D54' : '#CBD5E1' },
              hovertemplate: '<b>%{x}</b><br>Base: ₹%{y:,}<extra></extra>',
            },
            {
              type: 'bar', name: 'Shocked Fare',
              x: shockedFares.map(r => r.id),
              y: shockedFares.map(r => r.newFare),
              marker: { color: shockedFares.map(r => r.fareDelta > 0 ? '#EF4444' : '#10B981') },
              hovertemplate: '<b>%{x}</b><br>Shocked: ₹%{y:,}<br>Δ +₹%{customdata}<extra></extra>',
              customdata: shockedFares.map(r => r.fareDelta),
            },
          ]}
          layout={{
            ...PB, barmode: 'overlay', height: 340,
            margin: { l: 70, r: 20, t: 30, b: 70 },
            title: { text: 'Route-Level Fare Impact', font: { color: dark ? '#E2E8F0' : '#0F172A', size: 13 } },
            legend: { font: { color: dark ? '#94A3B8' : '#475569', size: 11 }, bgcolor: 'transparent' },
            xaxis: { ...AX, tickfont: { size: 9, family: 'JetBrains Mono, monospace' }, tickangle: -35 },
            yaxis: { ...AX, title: { text: 'Fare (₹)', font: { size: 12 }, standoff: 10 }, tickformat: ',.0f' },
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%' }}
        />

        {/* 30-day trend projection */}
        <Plot
          key={`atf-trend-${dark}`}
          data={[
            {
              type: 'scatter', mode: 'lines', name: 'Baseline Trend',
              x: days, y: baselineTrend,
              line: { color: '#06B6D4', width: 2, dash: 'dot' },
              hovertemplate: 'Day %{x}<br>Baseline: %{y:.1f}<extra></extra>',
            },
            {
              type: 'scatter', mode: 'lines', name: 'With ATF Shock',
              x: days, y: shockTrend,
              line: { color: atfChange > 0 ? '#EF4444' : '#10B981', width: 3 },
              fill: 'tonexty', fillcolor: atfChange > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
              hovertemplate: 'Day %{x}<br>Shocked: %{y:.1f}<extra></extra>',
            },
          ]}
          layout={{
            ...PB, height: 340,
            margin: { l: 70, r: 20, t: 30, b: 50 },
            title: { text: '30-Day APIx Projection', font: { color: dark ? '#E2E8F0' : '#0F172A', size: 13 } },
            legend: { font: { color: dark ? '#94A3B8' : '#475569', size: 11 }, bgcolor: 'transparent' },
            xaxis: { ...AX, title: { text: 'Days from Today', font: { size: 12 }, standoff: 10 } },
            yaxis: { ...AX, title: { text: 'APIx Level', font: { size: 12 }, standoff: 10 }, tickformat: '.1f' },
            shapes: [{ type: 'line', x0: 14, x1: 14, y0: 0, y1: 1, xref: 'x', yref: 'paper', line: { color: '#F59E0B', dash: 'dash', width: 1 } }],
            annotations: [{ x: 14, y: 0.97, xref: 'x', yref: 'paper', text: 'Full phase-in', showarrow: false, font: { color: '#F59E0B', size: 10 } }],
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%' }}
        />
      </div>

      {/* Policy recommendation */}
      {atfChange > 20 && (
        <div style={{ padding: 20, borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', marginBottom: 16 }}>
          <div style={{ color: '#FCA5A5', fontWeight: 700, fontSize: '0.85rem', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>⚠ DGCA Policy Alert — High ATF Shock Scenario</div>
          <div style={{ color: 'var(--sub)', fontSize: '0.88rem', lineHeight: 1.7 }}>
            A +{atfChange}% ATF shock risks fare inflation of <strong style={{ color: 'var(--red)' }}>+{avgFareImpact.toFixed(1)}%</strong>. Recommended actions:
            consider temporary Fuel Surcharge Cap notification under Civil Aviation Policy § 3.4, or ATF import duty relaxation for domestic operators.
            <strong style={{ color: 'var(--text)' }}> Monitor APIx for 3 consecutive weeks before invoking fare ceiling orders.</strong>
          </div>
        </div>
      )}
    </>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   SECTION B — Carrier Pricing Aggressiveness Scorecard
   ════════════════════════════════════════════════════════════════════════════ */
const CarrierScorecard: React.FC<{ dark: boolean }> = ({ dark }) => {
  const [selected, setSelected] = useState(0);
  const airline = AIRLINES[selected];
  const PB = useMemo(() => plotBase(dark), [dark]);
  const AX = useMemo(() => axisStyle(dark), [dark]);

  const surgeRatio = airline.t1 / airline.t45;

  return (
    <>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: '#8B5CF6', marginBottom: 8 }}>Carrier Intelligence</div>
        <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: -0.5, color: 'var(--text)', margin: '0 0 8px 0' }}>
          📊 Carrier Pricing Aggressiveness Scorecard
        </h2>
        <p style={{ color: 'var(--sub)', fontSize: '0.95rem', maxWidth: 760, lineHeight: 1.75, margin: 0 }}>
          Compare how each Indian carrier prices across booking horizons. T+1 = tomorrow's flight, T+45 = 45 days in advance. High T+1/T+45 ratio = aggressive last-minute pricing.
        </p>
      </div>

      {/* Airline selector pills */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 32 }}>
        {AIRLINES.map((a, i) => (
          <button key={a.code} onClick={() => setSelected(i)}
            style={{
              padding: '10px 20px', borderRadius: 50, border: `2px solid ${selected === i ? a.color : (dark ? '#1E3A5F' : '#E2E8F0')}`,
              background: selected === i ? a.color + '22' : 'transparent',
              color: selected === i ? a.color : 'var(--sub)', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.88rem', fontFamily: 'Inter, sans-serif',
              transition: 'all 0.2s',
            }}>
            {a.code} — {a.name}
          </button>
        ))}
      </div>

      {/* Selected airline spotlight */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, marginBottom: 32,
        padding: 28, borderRadius: 16,
        background: dark ? '#080F1F' : '#F8FAFC',
        border: `1px solid ${airline.color}30`,
        boxShadow: `0 0 40px ${airline.color}15`,
      }}>
        <div>
          {/* IATA Badge */}
          <div style={{
            width: 96, height: 96, borderRadius: 20,
            background: airline.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', fontWeight: 900, color: '#fff', fontFamily: 'JetBrains Mono,monospace',
            marginBottom: 20, letterSpacing: 2,
            boxShadow: `0 8px 32px ${airline.color}40`,
          }}>{airline.code}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{airline.name}</div>
          <div style={{ color: airline.color, fontSize: '0.8rem', fontWeight: 600, marginBottom: 12 }}>{airline.rating} Tier</div>
          <div style={{ color: 'var(--sub)', fontSize: '0.82rem', lineHeight: 1.6, marginBottom: 16 }}>{airline.tagline}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--sub)', lineHeight: 2 }}>
            <div>🛫 Hub: <span style={{ color: 'var(--text)' }}>{airline.hub}</span></div>
            <div>✈ Fleet: <span style={{ color: 'var(--text)' }}>{airline.fleet} aircraft</span></div>
            <div>📅 Founded: <span style={{ color: 'var(--text)' }}>{airline.founded}</span></div>
            <div>🗺 Market Share: <span style={{ color: airline.color, fontWeight: 700 }}>{Math.round(airline.routeShare * 100)}%</span></div>
          </div>

          {/* Booking advice */}
          <div style={{ marginTop: 20, padding: 14, borderRadius: 10, background: `${airline.color}12`, border: `1px solid ${airline.color}30` }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: airline.color, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Booking Strategy</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--sub)' }}>
              {surgeRatio > 2.0
                ? `🔴 Book ≥30 days ahead. ${airline.name} surges ${surgeRatio.toFixed(1)}× on T+1 vs T+45.`
                : surgeRatio > 1.5
                ? `🟡 Book ≥15 days ahead. Moderate surge (${surgeRatio.toFixed(1)}× ratio).`
                : `🟢 Flexible booking. Low surge penalty (${surgeRatio.toFixed(1)}× T+1 vs T+45).`}
            </div>
          </div>
        </div>

        <div>
          {/* Fare curve across horizons */}
          <Plot
            key={`curve-${selected}-${dark}`}
            data={[
              {
                type: 'scatter', mode: 'lines+markers',
                x: HORIZONS,
                y: FARE_KEYS.map(k => Number(airline[k])),
                line: { color: airline.color, width: 3 },
                marker: { size: 10, color: airline.color, line: { color: dark ? '#060B14' : '#fff', width: 2 } },
                fill: 'tozeroy', fillcolor: airline.color + '15',
                hovertemplate: '<b>%{x}</b><br>₹%{y:,}<extra></extra>',
                name: airline.name,
              },
              ...AIRLINES.filter((_, i) => i !== selected).map(a => ({
                type: 'scatter' as const, mode: 'lines' as const,
                x: HORIZONS,
                y: FARE_KEYS.map(k => Number(a[k])),
                line: { color: dark ? '#1E3A5F' : '#CBD5E1', width: 1, dash: 'dot' as const },
                name: a.name, opacity: 0.5,
                hovertemplate: `<b>${a.name} %{x}</b><br>₹%{y:,}<extra></extra>`,
              })),
            ]}
            layout={{
              ...PB, height: 280,
              margin: { l: 70, r: 20, t: 30, b: 50 },
              title: { text: 'Fare Curve: Booking Horizon vs Price', font: { color: dark ? '#E2E8F0' : '#0F172A', size: 13 } },
              legend: { font: { color: dark ? '#94A3B8' : '#475569', size: 10 }, bgcolor: 'transparent', orientation: 'h', y: -0.2 },
              xaxis: { ...AX, title: { text: 'Days Before Flight', font: { size: 11 }, standoff: 8 } },
              yaxis: { ...AX, title: { text: 'Median Fare (₹)', font: { size: 11 }, standoff: 8 }, tickformat: ',.0f' },
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
          />

          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 16 }}>
            {[
              { label: 'T+1/T+45 Ratio', val: `${surgeRatio.toFixed(2)}×`, color: surgeRatio > 2 ? '#EF4444' : surgeRatio > 1.5 ? '#F59E0B' : '#10B981' },
              { label: 'Surge Score',     val: `${airline.surgeScore}/100`, color: airline.surgeScore > 70 ? '#EF4444' : '#10B981' },
              { label: 'Route Network',   val: `${airline.network}/100`,   color: '#06B6D4' },
              { label: 'Price Rank',      val: airline.rating,             color: airline.color },
            ].map(k => (
              <div key={k.label} className="card" style={{ textAlign: 'center', padding: 12 }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--sub)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{k.label}</div>
                <div style={{ color: k.color, fontSize: '1.1rem', fontWeight: 800, fontFamily: 'JetBrains Mono,monospace' }}>{k.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Radar comparison — all carriers */}
      <div className="section-label">Multi-Carrier Competitive Radar</div>
      <p style={{ color: 'var(--sub)', fontSize: '0.88rem', marginBottom: 16 }}>5-axis scorecard comparing carriers across network breadth, price competitiveness, surge aggression, market concentration, and consumer satisfaction.</p>
      <Plot
        key={`radar-${dark}`}
        data={AIRLINES.map(a => ({
          type: 'scatterpolar' as const,
          r: [a.network, a.priceComp, 100 - a.surgeScore, 100 - a.mktConc, 100 - a.complaints],
          theta: ['Network Breadth', 'Price Competitive', 'Low Surge', 'Low Concentration', 'Consumer Score'],
          fill: 'toself' as const,
          name: `${a.code} ${a.name}`,
          line: { color: a.color, width: 2 },
          fillcolor: a.color + '18',
          hovertemplate: `<b>${a.name}</b><br>%{theta}: %{r}<extra></extra>`,
          opacity: 0.9,
        }))}
        layout={{
          ...PB, height: 420,
          polar: {
            bgcolor: dark ? '#0A1628' : '#F8FAFC',
            radialaxis: { visible: true, range: [0, 100], color: dark ? '#1E3A5F' : '#CBD5E1', tickfont: { size: 9, color: dark ? '#475569' : '#94A3B8' } },
            angularaxis: { color: dark ? '#1E3A5F' : '#CBD5E1', tickfont: { size: 11, color: dark ? '#94A3B8' : '#334155' } },
          },
          legend: { font: { color: dark ? '#94A3B8' : '#475569', size: 11 }, bgcolor: 'transparent', orientation: 'h', x: 0.5, xanchor: 'center', y: -0.12 },
          margin: { t: 30, b: 60, l: 40, r: 40 },
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
      />
    </>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   SIMULATION ROOT — with inner tab switcher
   ════════════════════════════════════════════════════════════════════════════ */
const SIM_TABS = [
  { id: 'atf',      label: '⛽ ATF Shock Simulator' },
  { id: 'scorecard', label: '📊 Carrier Scorecard' },
];

const Simulation: React.FC = () => {
  const { dark } = useTheme();
  const [activeTab, setActiveTab] = useState<'atf' | 'scorecard'>('atf');

  return (
    <div className="page-content">
      <div className="runway-bar" />

      <div style={{
        display: 'flex', gap: 8, marginBottom: 40,
        borderBottom: `1px solid ${dark ? '#1E3A5F' : '#E2E8F0'}`,
        paddingBottom: 0,
      }}>
        {SIM_TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as 'atf' | 'scorecard')}
            style={{
              padding: '10px 22px', fontSize: '0.9rem', fontWeight: 600,
              fontFamily: 'Inter, sans-serif', background: 'none', border: 'none',
              borderBottom: activeTab === t.id
                ? `2px solid ${t.id === 'atf' ? '#F59E0B' : '#8B5CF6'}`
                : '2px solid transparent',
              color: activeTab === t.id ? 'var(--text)' : 'var(--sub)',
              cursor: 'pointer', marginBottom: -1, transition: 'all 0.2s',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'atf'       && <ATFSimulator dark={dark} />}
      {activeTab === 'scorecard' && <CarrierScorecard dark={dark} />}
    </div>
  );
};

export default Simulation;
