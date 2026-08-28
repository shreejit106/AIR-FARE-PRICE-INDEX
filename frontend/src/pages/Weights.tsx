import React, { useState, useEffect, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { useTheme } from '../App';
import { API_BASE_URL } from '../config';
import { DEFAULT_ROUTE_SUMMARIES } from '../fallbackData';

const API = API_BASE_URL;

interface RouteWeight {
  route_id: string;
  passenger_share: number;
  passenger_count: number;
}

const DEFAULT_WEIGHTS: RouteWeight[] = DEFAULT_ROUTE_SUMMARIES.map(r => ({
  route_id: r.route_id,
  passenger_share: r.passenger_share,
  passenger_count: r.passenger_count || Math.round(r.passenger_share * 38500000)
}));
const DEFAULT_TOTAL_PAX = DEFAULT_WEIGHTS.reduce((s, r) => s + r.passenger_count, 0);

/* ─── Shared Plotly layout builders (adapts to theme) ───────────────────── */
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

const Weights: React.FC = () => {
  const { dark } = useTheme();
  const [routes,      setRoutes]      = useState<RouteWeight[]>(DEFAULT_WEIGHTS);
  const [total,       setTotal]       = useState(DEFAULT_TOTAL_PAX);
  const [selectedId,  setSelectedId]  = useState(DEFAULT_WEIGHTS[0]?.route_id || 'DEL-BOM');
  const [spikeChange, setSpikeChange] = useState(20);
  const [loading,     setLoading]     = useState(false);
  const [chartLimit,  setChartLimit]  = useState<25 | 80>(25);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch(`${API}/api/weights`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && d.routes && d.routes.length > 0) {
          setRoutes(d.routes);
          setTotal(d.total_passengers || d.routes.reduce((s: number, r: any) => s + r.passenger_count, 0));
          if (!selectedId && d.routes.length) setSelectedId(d.routes[0].route_id);
        }
      }).catch(() => {});
  }, []);

  const PB = useMemo(() => plotBase(dark), [dark]);
  const AX = useMemo(() => axisStyle(dark), [dark]);

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
    <div className="page-content">
      <div className="runway-bar" />

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--purple)', marginBottom: 8 }}>DGCA Data Integration</div>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 900, letterSpacing: -1, color: 'var(--text)', margin: '0 0 10px 0' }}>Passenger-Weighted Route Allocation</h1>
        <p style={{ color: 'var(--sub)', fontSize: '1rem', maxWidth: 820, lineHeight: 1.75, margin: 0 }}>
          A naive index treats every route equally — the Chandigarh-Jaipur hop would carry the same weight as DEL-BOM.
          APIx uses quarterly passenger volume from the <strong style={{ color: 'var(--text)' }}>Directorate General of Civil Aviation (DGCA)</strong> to weight each route by its true share of national air traffic.
        </p>
      </div>

      {/* Formula + Variables */}
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
            { sym: 'Q(r,0)', desc: 'The final dimensionless weight for route r. All weights sum to 1.0.',                      color: 'var(--purple)' },
            { sym: 'N_r',    desc: 'Total passengers flown on route r during the DGCA base quarter.',                          color: 'var(--cyan)'   },
            { sym: 'Σ N_j',  desc: 'Sum of all passengers across every tracked route — the normalising denominator.',          color: 'var(--amber)'  },
          ].map(v => (
            <div key={v.sym} className="var-pill" style={{ alignItems: 'center' }}>
              <div className="var-badge" style={{ color: v.color, background: v.color.replace('var(--','').replace(')','') + '18', border: `1px solid ${v.color}35` }}>{v.sym}</div>
              <div className="var-desc">{v.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Route Selector */}
      <div className="control-group" style={{ marginBottom: 20, maxWidth: 360 }}>
        <label className="control-label">Select Route</label>
        <select className="control-select" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
          {routes.map(r => <option key={r.route_id} value={r.route_id}>{r.route_id}</option>)}
        </select>
      </div>

      {/* Stat strip */}
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

      {/* Charts row */}
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
        {/* Horizontal Bar Chart */}
        <Plot
          key={`bar-${chartLimit}-${dark}`}
          data={[{
            type: 'bar',
            x: barData.map(r => r.passenger_share * 100),
            y: barData.map(r => r.route_id),
            orientation: 'h',
            marker: { color: barData.map(r => r.route_id === selectedId ? '#8B5CF6' : (dark ? '#1F2D54' : '#E2E8F0')) },
            text: barData.map(r => `${(r.passenger_share * 100).toFixed(2)}%`),
            textposition: 'outside',
            textfont: { color: dark ? '#94A3B8' : '#475569', size: 9 },
            hovertemplate: '<b>%{y}</b><br>Weight: %{x:.3f}%<extra></extra>',
            hoverlabel: {
              bgcolor: dark ? '#121B32' : '#FFFFFF',
              bordercolor: dark ? '#1F2D54' : '#CBD5E1',
              font: { color: dark ? '#F1F5F9' : '#0F172A', size: 12 }
            }
          }]}
          layout={{
            ...PB,
            title: { text: chartLimit === 25 ? 'Top 25 Routes by Passenger Weight' : 'All 80 Routes by Passenger Weight', font: { color: dark ? '#E2E8F0' : '#0F172A', size: 13 } },
            height: chartLimit === 25 ? 560 : 1600,
            margin: { l: 90, r: 50, t: 40, b: 60 },
            xaxis: {
              ...AX,
              title: { text: 'Weight (%)', font: { size: 12 }, standoff: 12 },
              ticksuffix: '%'
            },
            yaxis: {
              ...AX,
              showgrid: false,
              autorange: 'reversed',
              tickfont: { size: 9, family: 'JetBrains Mono, monospace' }
            },
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%' }}
        />

        {/* Right column: donut + shares */}
        <div>
          <Plot
            key={`pie-${dark}`}
            data={[{
              type: 'pie',
              labels: routes.map(r => r.route_id),
              values: routes.map(r => r.passenger_count),
              hole: 0.72,
              pull: routes.map(r => r.route_id === selectedId ? 0.09 : 0),
              marker: {
                colors: routes.map(r => r.route_id === selectedId ? '#8B5CF6' : (dark ? '#131D35' : '#E2E8F0')),
                line: { color: dark ? '#060B14' : '#FFFFFF', width: 1 },
              },
              hovertemplate: '<b>%{label}</b><br>%{value:,} pax<br>%{percent:.2f}<extra></extra>',
              textinfo: 'none',
              hoverlabel: {
                bgcolor: dark ? '#121B32' : '#FFFFFF',
                bordercolor: dark ? '#1F2D54' : '#CBD5E1',
                font: { color: dark ? '#F1F5F9' : '#0F172A', size: 12 }
              }
            }]}
            layout={{
              ...PB,
              title: { text: `All ${routes.length} Routes — Weight Distribution`, font: { color: dark ? '#E2E8F0' : '#0F172A', size: 12 } },
              showlegend: false,
              height: 320,
              margin: { t: 50, b: 10, l: 30, r: 30 },
              annotations: [{
                text: `<b>${selRow.route_id}</b><br>${pct.toFixed(2)}%`,
                x: 0.5, y: 0.5, showarrow: false,
                font: { color: dark ? '#E2E8F0' : '#0F172A', size: 13 }, align: 'center',
              }],
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
          />

          {/* Top 5 / Top 10 cards */}
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


      {/* Index Impact Simulator */}
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
              hoverlabel: {
                bgcolor: dark ? '#121B32' : '#FFFFFF',
                bordercolor: dark ? '#1F2D54' : '#CBD5E1',
                font: { color: dark ? '#F1F5F9' : '#0F172A', size: 12 }
              }
            }]}
            layout={{
              ...PB,
              height: 320,
              margin: { l: 80, r: 30, t: 30, b: 60 },
              showlegend: false,
              xaxis: {
                ...AX,
                showgrid: false,
                tickfont: { size: 11 }
              },
              yaxis: {
                ...AX,
                showgrid: true,
                title: { text: 'Index Point Change', font: { size: 12 }, standoff: 10 },
                zeroline: true,
                tickformat: '.3f'
              },
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
    </div>
  );
};

export default Weights;
