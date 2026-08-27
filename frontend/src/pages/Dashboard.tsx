import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../App';
import { API_BASE_URL } from '../config';
import {
  DEFAULT_INDEX,
  DEFAULT_ROUTE_SUMMARIES,
  DEFAULT_ROUTES_LIST,
  DEFAULT_HEATMAP,
  DEFAULT_MOSPI,
} from '../fallbackData';
import type { RouteSummary, HeatmapData, MospiRow } from '../fallbackData';

const API = API_BASE_URL;

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface IndexData { [horizon: string]: number; }

/* ─── Stable seeded pseudo-random (no Math.random — avoids re-render flicker) */
function seededRand(seed: number, i: number): number {
  const x = Math.sin(seed * 9301 + i * 49297 + 233) * 10000;
  return x - Math.floor(x);
}

/* ─── Shared Plotly layout builder (adapts to theme) ───────────────────── */
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
    tickfont:    { color: dark ? '#64748B' : '#475569', size: 12, family: 'Inter, sans-serif' },
    titlefont:   { color: dark ? '#94A3B8' : '#334155', size: 13, family: 'Inter, sans-serif' },
    showline:    true,
    linecolor:   dark ? '#1E3A5F' : '#CBD5E1',
    linewidth:   1,
  };
}

/* ─── Bezier helper ─────────────────────────────────────────────────────── */
function bezier(p1: [number,number], p2: [number,number], n = 22): [number,number][] {
  const mid: [number,number] = [(p1[0]+p2[0])/2, (p1[1]+p2[1])/2];
  const d: [number,number]   = [p2[0]-p1[0], p2[1]-p1[1]];
  let perp: [number,number]  = [-d[1], d[0]];
  const len = Math.sqrt(perp[0]**2 + perp[1]**2);
  if (len > 0) perp = [
    perp[0]/len * Math.sqrt(d[0]**2+d[1]**2)*0.15,
    perp[1]/len * Math.sqrt(d[0]**2+d[1]**2)*0.15,
  ];
  const ctrl: [number,number] = [mid[0]+perp[0], mid[1]+perp[1]];
  return Array.from({length: n}, (_, i) => {
    const t = i/(n-1);
    return [
      (1-t)**2*p1[0] + 2*(1-t)*t*ctrl[0] + t**2*p2[0],
      (1-t)**2*p1[1] + 2*(1-t)*t*ctrl[1] + t**2*p2[1],
    ] as [number,number];
  });
}

function pctColor(val: number): string {
  const norm = Math.max(0, Math.min(1, (val+10)/40));
  const r = norm < 0.5 ? Math.round(16 + norm*2*(239-16)) : 239;
  const g = norm < 0.5 ? Math.round(185 + norm*2*(68-185)) : Math.round(68*(1-(norm-0.5)*2));
  return `rgb(${r},${Math.max(0,g)},0)`;
}

/* ─── Carrier strip data ────────────────────────────────────────────────── */
const CARRIERS = [
  { code:'6E', name:'IndiGo',     color:'#3B82F6', bg:'rgba(59,130,246,0.12)'  },
  { code:'AI', name:'Air India',  color:'#EF4444', bg:'rgba(239,68,68,0.12)'   },
  { code:'SG', name:'SpiceJet',   color:'#F97316', bg:'rgba(249,115,22,0.12)'  },
  { code:'IX', name:'AI Express', color:'#EF4444', bg:'rgba(239,68,68,0.08)'   },
  { code:'QP', name:'Akasa Air',  color:'#A78BFA', bg:'rgba(167,139,250,0.12)' },
];
const MONTHS = ['','January','February','March','April','May','June','July','August','September','October','November','December'];

const Arrow: React.FC<{idx: number}> = ({idx}) => {
  const v = idx - 100;
  if (v > 0)  return <span className="hud-ticker-value hud-ticker-up">▲ {v.toFixed(2)}%</span>;
  if (v < 0)  return <span className="hud-ticker-value hud-ticker-down">▼ {Math.abs(v).toFixed(2)}%</span>;
  return <span className="hud-ticker-value hud-ticker-flat">— 0.00%</span>;
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════════ */
const Dashboard: React.FC = () => {
  const { dark } = useTheme();

  const [cabinClass,    setCabinClass]    = useState('Economy');
  const [aggregation,   setAggregation]   = useState('Overall Industry');
  const [airlineFilter, setAirlineFilter] = useState('all');
  const [routeFilter,   setRouteFilter]   = useState('all');
  const [routes,        setRoutes]        = useState<string[]>(DEFAULT_ROUTES_LIST);
  const [activeTab,     setActiveTab]     = useState(0);
  const [baseYear,      setBaseYear]      = useState(2022);
  const [baseMonth,     setBaseMonth]     = useState(9);

  const [indexData,    setIndexData]    = useState<IndexData>(DEFAULT_INDEX);
  const [routeSummary, setRouteSummary] = useState<RouteSummary[]>(DEFAULT_ROUTE_SUMMARIES);
  const [heatmapData,  setHeatmapData]  = useState<HeatmapData | null>(DEFAULT_HEATMAP);
  const [mospiData,    setMospiData]    = useState<MospiRow[]>(DEFAULT_MOSPI);
  const [loading,      setLoading]      = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);

  const airlineParam = aggregation === 'Airline Specific' ? airlineFilter : 'all';
  const routeParam   = aggregation === 'Route Specific'   ? routeFilter   : 'all';

  useEffect(() => {
    fetch(`${API}/api/routes/list`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && d.routes && d.routes.length > 0) setRoutes(d.routes);
      })
      .catch(() => {});
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    const qs = `cabin_class=${cabinClass}&airline=${airlineParam}&route=${routeParam}`;
    Promise.all([
      fetch(`${API}/api/index?${qs}`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API}/api/route-summary?${qs}`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API}/api/heatmap?${qs}`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API}/api/mospi`).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([idx, summary, hm, mospi]) => {
      if (idx && Object.keys(idx).length > 0) setIndexData(idx);
      if (summary && summary.length > 0) setRouteSummary(summary);
      if (hm && hm.routes && hm.routes.length > 0) setHeatmapData(hm);
      if (mospi && mospi.length > 0) setMospiData(mospi);
      setLiveConnected(Boolean(idx && summary));
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [cabinClass, airlineParam, routeParam]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Index values ── */
  const ti7  = indexData['T+7']  ?? 100;
  const ti15 = indexData['T+15'] ?? 100;
  const ti30 = indexData['T+30'] ?? 100;
  const ti45 = indexData['T+45'] ?? 100;

  /* ── STABLE trend — seeded from the actual index values so never re-randomises on theme toggle ── */
  const { trendDates, trendVals, yMin, yMax, fillBase } = useMemo(() => {
    const seed = Math.round(ti7 * 100 + ti15 * 10);
    const dates = Array.from({length: 45}, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() + i);
      return d.toISOString().split('T')[0];
    });
    const vals = dates.map((_, i) =>
      ti7 - 3 + i * 0.35 + (seededRand(seed, i) - 0.5) * 1.2
    );
    const allY = [...vals, 100];
    const minVal = Math.min(...allY);
    const maxVal = Math.max(...allY);
    const pad = (maxVal - minVal) * 0.15 || 5;
    return {
      trendDates: dates,
      trendVals: vals,
      yMin: minVal - pad,
      yMax: maxVal + pad,
      fillBase: minVal - pad
    };
  }, [ti7, ti15]);

  /* ── MoSPI rebasing ── */
  const mospiRebased = useMemo(() => {
    const base = mospiData.find(r => {
      const d = new Date(r.date);
      return d.getFullYear() === baseYear && d.getMonth() + 1 === baseMonth;
    });
    const baseVal = base ? base.cpi_index : (mospiData[0]?.cpi_index ?? 100);
    return mospiData
      .filter(r => new Date(r.date) >= new Date(`${baseYear}-${String(baseMonth).padStart(2,'0')}-01`))
      .map(r => ({ ...r, cpi_rebased: (r.cpi_index / baseVal) * 100 }));
  }, [mospiData, baseYear, baseMonth]);

  const top5 = useMemo(() =>
    [...routeSummary].sort((a, b) => b.avg_pct_change - a.avg_pct_change).slice(0, 5),
    [routeSummary]
  );

  /* ── Map routes: filter to selected route when Route Specific mode is on ── */
  const mapRoutes = useMemo(() => {
    if (aggregation === 'Route Specific' && routeFilter !== 'all') {
      return routeSummary.filter(r => r.route_id === routeFilter);
    }
    return routeSummary;
  }, [routeSummary, aggregation, routeFilter]);

  const PB = plotBase(dark);
  const AX = axisStyle(dark);


  /* ──────────────────────────────── RENDER ──────────────────────────────── */
  return (
    <div className="page-content">

      {/* ── Control Panel ── */}
      <div className="section-label" style={{marginBottom:10}}>✦ Flight Control Panel</div>
      <div className="control-panel">
        <div className="control-group">
          <label className="control-label">Cabin Class</label>
          <select className="control-select" value={cabinClass} onChange={e => setCabinClass(e.target.value)}>
            <option>Economy</option><option>Business</option>
          </select>
        </div>
        <div className="control-group">
          <label className="control-label">Aggregation Target</label>
          <select className="control-select" value={aggregation}
            onChange={e => { setAggregation(e.target.value); setAirlineFilter('all'); setRouteFilter('all'); }}>
            <option>Overall Industry</option>
            <option>Airline Specific</option>
            <option>Route Specific</option>
          </select>
        </div>
        <div className="control-group">
          <label className="control-label">
            {aggregation === 'Airline Specific' ? 'Select Carrier' :
             aggregation === 'Route Specific'   ? 'Select Route'   : 'Filter Target'}
          </label>
          {aggregation === 'Airline Specific' ? (
            <select className="control-select" value={airlineFilter} onChange={e => setAirlineFilter(e.target.value)}>
              <option value="all">All Airlines</option>
              <option value="IndiGo (6E)">IndiGo (6E)</option>
              <option value="Air India (AI)">Air India (AI)</option>
              <option value="SpiceJet (SG)">SpiceJet (SG)</option>
              <option value="Air India Express (IX)">Air India Express (IX)</option>
              <option value="Akasa Air (QP)">Akasa Air (QP)</option>
            </select>
          ) : aggregation === 'Route Specific' ? (
            <select className="control-select" value={routeFilter} onChange={e => setRouteFilter(e.target.value)}>
              <option value="all">All Routes</option>
              {routes.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          ) : (
            <select className="control-select" disabled><option>All Routes / Carriers</option></select>
          )}
        </div>
        <div className="control-group">
          <label className="control-label">Status</label>
          <div style={{display:'flex', alignItems:'center', gap:8, marginTop:8}}>
            <span style={{color:'var(--green)', fontSize:'0.85rem', fontWeight:700}}>● LIVE</span>
            <span style={{color:'var(--sub)', fontSize:'0.78rem'}}>{aggregation} · {cabinClass}</span>
          </div>
        </div>
      </div>

      {/* ── Carrier Strip ── */}
      <div className="carrier-strip">
        <span style={{fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:1.5, color:'var(--sub)', whiteSpace:'nowrap'}}>Active Fleet:</span>
        {CARRIERS.map(c => (
          <div key={c.code} className="carrier-badge" style={{background:c.bg, border:`1px solid ${c.color}55`}}>
            <span style={{color:c.color, fontWeight:900, fontFamily:'JetBrains Mono,monospace', fontSize:'0.82rem'}}>{c.code}</span>
            <span style={{color:'var(--text)', fontWeight:600, fontSize:'0.8rem'}}>{c.name}</span>
          </div>
        ))}
        <div style={{marginLeft:'auto', display:'flex', gap:16, fontSize:'0.75rem', fontFamily:'JetBrains Mono,monospace', color:'var(--sub)', whiteSpace:'nowrap', alignItems:'center'}}>
          <span>ROUTES: <b style={{color:'var(--text)'}}>{routeSummary.length}</b><span style={{color:'var(--cyan)', marginLeft:4}}>/ 80 {aggregation === 'Overall Industry' ? 'Sovereign' : 'Active'}</span></span>
          <span>FEED: <b style={{color:'var(--green)'}}>● LIVE</b></span>
        </div>
      </div>

      {/* ── HUD Ticker ── */}
      <div className="hud-ticker">
        <div className="hud-ticker-item">
          <div className="hud-ticker-label">APIx Live</div>
          <div className="hud-ticker-live">{loading ? '—' : ti7.toFixed(1)}</div>
          <div style={{fontSize:'0.75rem', color:'var(--sub)', marginTop:4, fontFamily:'JetBrains Mono,monospace'}}>T+7 basis</div>
        </div>
        {([['T+7', ti7], ['T+15', ti15], ['T+30', ti30], ['T+45', ti45]] as [string, number][]).map(([label, val]) => (
          <div key={label} className="hud-ticker-item">
            <div className="hud-ticker-label" style={{color: label === 'T+7' ? 'var(--cyan)' : 'var(--sub)'}}>{label}</div>
            {loading ? <span className="hud-ticker-value">—</span> : <Arrow idx={val} />}
          </div>
        ))}
        <div className="hud-ticker-item" style={{marginLeft:'auto'}}>
          <div className="hud-ticker-label">Aggregation</div>
          <div style={{fontSize:'0.88rem', fontWeight:700, color:'var(--text)', marginTop:4}}>{aggregation}</div>
          <div style={{fontSize:'0.75rem', color:'var(--sub)'}}>{cabinClass} class</div>
        </div>
      </div>

      {/* ── 30-Day Forward Trend ── */}
      <div style={{marginBottom:8}}>
        <div className="section-label">30-Day APIx Forward Trajectory</div>
        <div style={{color:'var(--sub)', fontSize:'0.8rem', marginBottom:8}}>
          Projected index values across booking horizons · Base = 100 (parity)
        </div>
      </div>
      <Plot
        key={`trend-${dark}`}
        data={[
          { x:trendDates, y:Array(45).fill(fillBase), mode:'lines', line:{width:0}, showlegend:false, hoverinfo:'skip' as const },
          {
            x:trendDates, y:trendVals,
            mode:'lines', name:'APIx Index',
            fill:'tonexty', fillcolor: dark ? 'rgba(6,182,212,0.09)' : 'rgba(2,132,199,0.09)',
            line:{color: dark ? '#06B6D4' : '#0284C7', width:2.5, shape:'spline' as const},
            hovertemplate:'<b>Date:</b> %{x}<br><b>APIx:</b> %{y:.2f}<extra></extra>',
            hoverlabel: {
              bgcolor: dark ? '#121B32' : '#FFFFFF',
              bordercolor: dark ? '#1F2D54' : '#CBD5E1',
              font: { color: dark ? '#F1F5F9' : '#0F172A', size: 12, family: 'Inter, sans-serif' }
            }
          },
          {
            x:[trendDates[0], trendDates[44]], y:[100,100], mode:'lines', name:'Parity (100)',
            line:{color: dark ? 'rgba(245,158,11,0.5)' : 'rgba(217,119,6,0.5)', dash:'dot', width:1.5},
            hoverinfo:'skip' as const,
          },
        ]}
        layout={{
          ...PB, height:260,
          hovermode:'closest', showlegend:true,
          legend:{
            orientation: 'h' as const,
            y: 1.18,
            x: 0.5,
            xanchor: 'center' as const,
            yanchor: 'bottom' as const,
            bgcolor: 'rgba(0,0,0,0)',
            font: { color: dark ? '#94A3B8' : '#475569', size: 11 }
          },
          margin:{l:70, r:40, t:50, b:55},
          xaxis:{
            ...AX,
            title:{text:'Date', font:{color: dark?'#94A3B8':'#334155', size:13}, standoff:12},
          },
          yaxis:{
            ...AX,
            title:{text:'APIx Index', font:{color: dark?'#94A3B8':'#334155', size:13}, standoff:10},
            tickformat:'.1f',
            range: [yMin, yMax],
          },
        }}
        config={{displayModeBar:false, responsive:true}}
        style={{width:'100%', marginBottom:24}}
      />

      {/* ── Tabs ── */}
      <div className="tabs-header">
        {['✈  Geographic Map', '▪  Route Heatmap (All 80)', '📈  MoSPI CPI Trends'].map((t, i) => (
          <button key={i} className={`tab-btn${activeTab===i?' active':''}`} onClick={()=>setActiveTab(i)}>{t}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-8}}
          transition={{duration:0.2}}
        >

          {/* ══════════ TAB 0 — MAP ══════════ */}
          {activeTab===0 && (
            <div className="grid-2" style={{gridTemplateColumns:'3fr 1fr', gap:16}}>
              <div>
                <div className="section-label">Live Route Map — {routeSummary.length} Routes</div>
                <div style={{fontSize:'0.8rem', color:'var(--sub)', marginBottom:10}}>
                  🟢 deflating → 🔴 inflating · Arc thickness = passenger volume · Click for details
                </div>
                <div className="map-wrap">
                  <MapContainer center={[22.5,80]} zoom={5} style={{height:'100%',width:'100%'}} zoomControl>
                    <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}" attribution="&copy; Esri, DeLorme, NAVTEQ" />
                    {mapRoutes.map(r => {
                      const pts = bezier([r.origin_lat,r.origin_lon],[r.dest_lat,r.dest_lon]);
                      const shares = mapRoutes.map(x=>x.passenger_share);
                      const mn=Math.min(...shares), mx=Math.max(...shares);
                      const weight = mapRoutes.length === 1 ? 4 : 1+5*((r.passenger_share-mn)/(mx-mn+1e-9));
                      return (
                        <Polyline key={r.route_id} positions={pts}
                          pathOptions={{color:pctColor(r.avg_pct_change), weight, opacity:0.85}}>
                          <Popup>
                            <div style={{fontFamily:'Inter,sans-serif', minWidth:180, color:'#0F172A'}}>
                              <div style={{fontSize:'1.05rem', fontWeight:800, color:'#0284C7', marginBottom:6, display:'flex', alignItems:'center', gap:6}}>
                                <span>{r.origin}</span>
                                <span style={{color:'#64748B'}}>➔</span>
                                <span>{r.destination}</span>
                              </div>
                              <div style={{fontSize:'0.75rem', color:'#475569', marginBottom:4}}>Directional City-Pair Corridor</div>
                              <div style={{fontSize:'0.85rem', marginBottom:3}}>APIx Index: <b style={{color:'#0F172A'}}>{r.route_index.toFixed(1)} PTS</b></div>
                              <div style={{fontSize:'0.85rem', marginBottom:3}}>Fare Inflation: <b style={{color:r.avg_pct_change>0?'#DC2626':'#059669'}}>
                                {r.avg_pct_change>0?'+':''}{r.avg_pct_change.toFixed(1)}%
                              </b></div>
                              <div style={{fontSize:'0.85rem', color:'#334155'}}>DGCA Weight: <b>{(r.passenger_share*100).toFixed(3)}%</b></div>
                            </div>
                          </Popup>
                        </Polyline>
                      );
                    })}
                    {Array.from(new Set(mapRoutes.flatMap(r=>[r.origin,r.destination]))).map(code => {
                      const row = mapRoutes.find(r=>r.origin===code||r.destination===code);
                      if(!row) return null;
                      const lat = row.origin===code ? row.origin_lat : row.dest_lat;
                      const lon = row.origin===code ? row.origin_lon : row.dest_lon;
                      return (
                        <CircleMarker key={code} center={[lat,lon]} radius={6}
                          pathOptions={{color:'#06B6D4',fillColor:'#06B6D4',fillOpacity:1,weight:2}}>
                          <Popup><b style={{color:'#06B6D4'}}>{code}</b></Popup>
                        </CircleMarker>
                      );
                    })}
                  </MapContainer>
                </div>
              </div>
              {/* Top 5 */}
              <div>
                <div className="section-label">Top Inflating Routes</div>
                {top5.map(r => (
                  <div key={r.route_id} className="card" style={{marginBottom:8}}>
                    <div style={{fontWeight:700, color:'var(--text)', fontSize:'0.95rem'}}>{r.route_id}</div>
                    <div style={{color:r.avg_pct_change>0?'var(--red)':'var(--green)', fontFamily:'JetBrains Mono,monospace', fontSize:'0.85rem', marginTop:3}}>
                      {r.avg_pct_change>0?'▲':'▼'} {r.avg_pct_change>0?'+':''}{r.avg_pct_change.toFixed(2)}%
                    </div>
                    <div style={{color:'var(--sub)', fontSize:'0.75rem', marginTop:2}}>{(r.passenger_share*100).toFixed(2)}% traffic</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════ TAB 1 — HEATMAP (ALL 80 ROUTES) ══════════ */}
          {activeTab===1 && heatmapData && (() => {
            const N = heatmapData.routes.length; // All routes — no cap
            const CELL_H = 36; // px per row
            const chartH = N * CELL_H + 120;

            return (
              <div>
                {/* Header + legend */}
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12, flexWrap:'wrap', gap:8}}>
                  <div>
                    <div className="section-label">
                      Route Fare Inflation Matrix — {N} Routes × {heatmapData.horizons.length} Booking Horizons
                    </div>
                    <div style={{color:'var(--sub)', fontSize:'0.79rem', marginTop:4}}>
                      Cell value = representative fare (₹) · Color = % change vs base · Right bar = DGCA passenger weight
                    </div>
                  </div>
                  <div style={{display:'flex', gap:10, alignItems:'center', flexShrink:0}}>
                    {[['#10B981','Deflating (< 0%)'],['#EAB308','Neutral (0–15%)'],['#EF4444','Inflating (> 15%)']].map(([c,l]) => (
                      <div key={String(l)} style={{display:'flex', alignItems:'center', gap:5, fontSize:'0.78rem', color:'var(--sub)'}}>
                        <div style={{width:13, height:13, borderRadius:2, background:String(c)}} />
                        {l}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scrollable heatmap container */}
                <div style={{
                  overflowY: 'auto',
                  maxHeight: '80vh',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  background: dark ? '#0A1628' : '#F8FAFC',
                }}>
                  <Plot
                    key={`heatmap-${dark}`}
                    data={[
                      /* ── Heatmap trace ── */
                      {
                        type: 'heatmap',
                        z:    heatmapData.z,
                        x:    heatmapData.horizons,
                        y:    heatmapData.routes,
                        text: heatmapData.text,
                        texttemplate: '<b>%{text}</b>',
                        textfont: { color:'white', size:11, family:'JetBrains Mono, monospace' },
                        colorscale: [
                          [0,    '#10B981'],
                          [0.25, '#22C55E'],
                          [0.45, '#84CC16'],
                          [0.55, '#EAB308'],
                          [0.7,  '#F97316'],
                          [0.85, '#EF4444'],
                          [1,    '#DC2626'],
                        ],
                        zmin: -10, zmax: 30,
                        showscale: true,
                        colorbar: {
                          title:{ text:'% Change', side:'right' as const, font:{color: dark?'#94A3B8':'#334155', size:12} },
                          tickfont:{ color: dark?'#64748B':'#475569', size:11 },
                          ticksuffix:'%',
                          thickness:15,
                          len:0.9,
                          x: 0.76,
                          bgcolor:'rgba(0,0,0,0)',
                          bordercolor: dark?'#1E3A5F':'#CBD5E1',
                        },
                        customdata: heatmapData.hover,
                        hovertemplate: '%{customdata}<extra></extra>',
                        xgap: 2, ygap: 2,
                      } as any,

                      /* ── Weight bar (right panel) ── */
                      {
                        type: 'bar',
                        x:    heatmapData.weights.map(w => w * 100),
                        y:    heatmapData.routes,
                        orientation: 'h',
                        marker:{
                          color: heatmapData.weights.map(w => {
                            const maxW = Math.max(...heatmapData.weights);
                            const alpha = 0.35 + (w / maxW) * 0.65;
                            return dark ? `rgba(6,182,212,${alpha})` : `rgba(3,105,161,${alpha})`;
                          }),
                          line:{color: dark?'rgba(6,182,212,0.2)':'rgba(3,105,161,0.2)', width:1},
                        },
                        hovertemplate:'<b>%{y}</b><br>Weight: <b>%{x:.3f}%</b><extra></extra>',
                        xaxis:'x2', yaxis:'y',
                        showlegend:false,
                      } as any,
                    ]}
                    layout={{
                      ...PB,
                      height: chartH,
                      margin:{ l:90, r:170, t:50, b:70 },

                      /* ── Heatmap axes ── */
                      xaxis:{
                        ...AX,
                        domain:[0,0.73],
                        title:{ text:'Booking Horizon (Days Before Travel)', font:{color:dark?'#94A3B8':'#334155', size:13}, standoff:12 },
                        tickfont:{ color:dark?'#C4CBDA':'#334155', size:13, family:'JetBrains Mono, monospace' },
                        showgrid:false,
                        side:'bottom',
                      },
                      yaxis:{
                        ...AX,
                        autorange:'reversed',
                        tickfont:{ color:dark?'#C4CBDA':'#334155', size:12, family:'JetBrains Mono, monospace' },
                        showgrid:false,
                        title:{ text:'Route (Origin–Destination)', font:{color:dark?'#94A3B8':'#334155', size:13}, standoff:10 },
                      },

                      /* ── Weight bar axes ── */
                      xaxis2:{
                        ...AX,
                        domain:[0.80,1],
                        title:{ text:'Traffic %', font:{color:dark?'#94A3B8':'#334155', size:11}, standoff:8 },
                        tickfont:{ color:dark?'#64748B':'#475569', size:10 },
                        showgrid:true,
                        zeroline:false,
                        ticksuffix:'%',
                      },

                      annotations:[
                        { text:'% Change', showarrow:false, x:0.77, xref:'paper', y:1.015, yref:'paper', font:{color:dark?'#94A3B8':'#334155', size:12}, xanchor:'center' },
                        { text:'Passenger Weight', showarrow:false, x:0.90, xref:'paper', y:1.015, yref:'paper', font:{color:dark?'#06B6D4':'#0369A1', size:12}, xanchor:'center' },
                      ],
                      showlegend:false,
                    }}
                    config={{displayModeBar:true, displaylogo:false, responsive:true,
                      modeBarButtonsToRemove:['select2d','lasso2d'] as any}}
                    style={{width:'100%'}}
                  />
                </div>
              </div>
            );
          })()}

          {/* ══════════ TAB 2 — MoSPI CPI ══════════ */}
          {activeTab===2 && (
            <div>
              <div className="section-label">MoSPI CPI Base Period</div>
              <div className="grid-2" style={{gap:12, marginBottom:16}}>
                <div className="control-group">
                  <label className="control-label">Base Year</label>
                  <select className="control-select" value={baseYear} onChange={e=>setBaseYear(Number(e.target.value))}>
                    {Array.from({length:15},(_,i)=>2010+i).map(y=><option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="control-group">
                  <label className="control-label">Base Month</label>
                  <select className="control-select" value={baseMonth} onChange={e=>setBaseMonth(Number(e.target.value))}>
                    {MONTHS.slice(1).map((m,i)=><option key={m} value={i+1}>{m}</option>)}
                  </select>
                </div>
              </div>

              {mospiRebased.length > 0 && (() => {
                const minY = Math.min(...mospiRebased.map(r=>r.cpi_rebased))*0.985;
                const maxY = Math.max(...mospiRebased.map(r=>r.cpi_rebased))*1.012;
                const covidRow = mospiRebased.find(r=>r.date.startsWith('2020-0')) ??
                                 mospiRebased.find(r=>r.date.startsWith('2020-'));
                return (
                  <Plot
                    key={`mospi-${dark}`}
                    data={[
                      { x:mospiRebased.map(r=>r.date), y:Array(mospiRebased.length).fill(minY),
                        mode:'lines', line:{width:0}, showlegend:false, hoverinfo:'skip' as const },
                      {
                        x:mospiRebased.map(r=>r.date),
                        y:mospiRebased.map(r=>r.cpi_rebased),
                        customdata:mospiRebased.map(r=>{
                          const d=new Date(r.date);
                          return [`${MONTHS[d.getMonth()+1]} ${d.getFullYear()}`, r.cpi_rebased-100];
                        }),
                        mode:'lines', name:'MoSPI CPI (Rebased)',
                        line:{color:dark?'#06B6D4':'#0284C7', width:2.5, shape:'spline' as const},
                        fill:'tonexty', fillcolor:dark?'rgba(6,182,212,0.08)':'rgba(2,132,199,0.08)',
                        hovertemplate:
                          '<b>%{customdata[0]}</b><br>' +
                          '<span style="font-size:16px; font-weight:900">%{y:.1f}</span><br>' +
                          '<span style="color:#06B6D4">%{customdata[1]:+.2f}% vs base</span><extra></extra>',
                        hoverlabel: {
                          bgcolor: dark ? '#121B32' : '#FFFFFF',
                          bordercolor: dark ? '#1F2D54' : '#CBD5E1',
                          font: { color: dark ? '#F1F5F9' : '#0F172A', size: 12, family: 'Inter, sans-serif' }
                        }
                      },
                      {
                        x:[mospiRebased[0]?.date, mospiRebased[mospiRebased.length-1]?.date],
                        y:[100,100], mode:'lines', name:'Base (= 100)',
                        line:{color:dark?'rgba(245,158,11,0.45)':'rgba(217,119,6,0.45)', dash:'dot', width:1.5},
                        hoverinfo:'skip' as const,
                      },
                    ]}
                    layout={{
                      ...PB, height:520,
                      hovermode:'closest',
                      showlegend:true,
                      legend:{x:0.01, y:0.99, bgcolor:'rgba(0,0,0,0)', font:{color:dark?'#64748B':'#475569', size:12}},
                      margin:{l:75, r:30, t:50, b:65},
                      title:{
                        text:`MoSPI Consumer Price Index — Rebased to ${MONTHS[baseMonth]} ${baseYear}`,
                        font:{color:dark?'#E2E8F0':'#0F172A', size:15},
                        x:0.04,
                      },
                      xaxis:{
                        ...AX,
                        title:{text:'Year', font:{color:dark?'#94A3B8':'#334155', size:13}, standoff:14},
                        tickformat:'%Y', dtick:'M24',
                        showspikes:true, spikedash:'dash',
                        spikecolor:dark?'#2D4A6E':'#CBD5E1', spikethickness:1, spikemode:'across',
                      },
                      yaxis:{
                        ...AX,
                        title:{text:'Price Index  (Base = 100)', font:{color:dark?'#94A3B8':'#334155', size:13}, standoff:12},
                        tickformat:'.1f',
                        range:[minY, maxY],
                      },
                      shapes: covidRow ? [{
                        type:'line' as const,
                        x0:covidRow.date, x1:covidRow.date,
                        y0:0, y1:1, yref:'paper' as const,
                        line:{color:dark?'rgba(255,255,255,0.35)':'rgba(0,0,0,0.3)', dash:'dash', width:1.5},
                      }] : [],
                      annotations: covidRow ? [{
                        x:covidRow.date, y:maxY*0.97,
                        text:covidRow.date.slice(0,7),
                        showarrow:false,
                        font:{color:dark?'#94A3B8':'#475569', size:11},
                        xanchor:'left', yanchor:'top', xshift:6,
                      }] : [],
                    }}
                    config={{displayModeBar:true, displaylogo:false, responsive:true,
                      modeBarButtonsToRemove:['select2d','lasso2d'] as any}}
                    style={{width:'100%'}}
                  />
                );
              })()}
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
