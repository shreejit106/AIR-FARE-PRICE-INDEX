import React, { useState, useEffect, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { useTheme } from '../App';

/* ─────────────────── AIRLINE INTELLIGENCE DATABASE ─────────────────────── */
const CARRIERS = [
  {
    code: '6E', iata: '6E', icao: 'IGO',
    name: 'IndiGo', fullName: 'InterGlobe Aviation Ltd.',
    color: '#1B67B2', accent: '#00AEEF', textColor: '#fff',
    logo: 'https://img.logo.dev/goindigo.in?token=pk_free&size=60',
    domain: 'goindigo.in',
    rating: 'CHEAPEST', ratingColor: '#10B981',
    tagline: "India's dominant LCC. Pure capacity game.",
    fleet: 330, fleetType: 'A320neo Family',
    founded: 2006, hubs: ['DEL', 'BOM', 'HYD'],
    routes: 80, routesInBasket: 63, marketShare: 47,
    avgFare: 4200, baseScore: 100,
    metrics: { network: 92, price: 95, onTime: 78, surge: 82, comfort: 52 },
    topRoutes: ['DEL-BOM', 'BOM-BLR', 'DEL-HYD'],
    fleetBreakdown: [{ type: 'A320neo', count: 185 }, { type: 'A321neo', count: 95 }, { type: 'A321XLR', count: 50 }],
    funFact: 'Operates every 3rd domestic flight in India. Largest A320 family order in aviation history.',
    booking: { t1: 8420, t7: 6200, t15: 5100, t30: 4400, t45: 3800 },
  },
  {
    code: 'AI', iata: 'AI', icao: 'AIC',
    name: 'Air India', fullName: 'Air India Limited (Tata Sons)',
    color: '#C8102E', accent: '#F5A623', textColor: '#fff',
    logo: 'https://img.logo.dev/airindia.com?token=pk_free&size=60',
    domain: 'airindia.com',
    rating: 'PREMIUM', ratingColor: '#F59E0B',
    tagline: "National carrier reborn. Tata premium push.",
    fleet: 188, fleetType: 'Mixed Wide + Narrow body',
    founded: 1932, hubs: ['DEL', 'BOM'],
    routes: 45, routesInBasket: 40, marketShare: 19,
    avgFare: 7100, baseScore: 100,
    metrics: { network: 95, price: 52, onTime: 71, surge: 55, comfort: 88 },
    topRoutes: ['DEL-BOM', 'DEL-CCU', 'BOM-COK'],
    fleetBreakdown: [{ type: 'B787 Dreamliner', count: 27 }, { type: 'A350', count: 10 }, { type: 'A320/321', count: 105 }, { type: 'B777', count: 14 }],
    funFact: 'Ordered 470 aircraft in 2023 — the largest commercial aviation order in history. Operates 43 international routes.',
    booking: { t1: 11200, t7: 8900, t15: 7600, t30: 6800, t45: 6200 },
  },
  {
    code: 'SG', iata: 'SG', icao: 'SEJ',
    name: 'SpiceJet', fullName: 'SpiceJet Ltd.',
    color: '#F37B20', accent: '#FFCB5B', textColor: '#fff',
    logo: 'https://img.logo.dev/spicejet.com?token=pk_free&size=60',
    domain: 'spicejet.com',
    rating: 'BUDGET', ratingColor: '#06B6D4',
    tagline: "India's discount warrior. Turbulent, but cheap.",
    fleet: 62, fleetType: 'B737 + Q400',
    founded: 2005, hubs: ['DEL', 'HYD'],
    routes: 30, routesInBasket: 28, marketShare: 14,
    avgFare: 3800, baseScore: 100,
    metrics: { network: 62, price: 90, onTime: 58, surge: 70, comfort: 44 },
    topRoutes: ['DEL-BOM', 'MAA-HYD', 'CCU-BOM'],
    fleetBreakdown: [{ type: 'B737-800', count: 38 }, { type: 'B737 MAX 8', count: 16 }, { type: 'Q400', count: 8 }],
    funFact: 'Was briefly grounded in 2022 due to financial stress. Highest ATF pass-through rate of any Indian carrier.',
    booking: { t1: 7800, t7: 5900, t15: 4900, t30: 4100, t45: 3500 },
  },
  {
    code: 'QP', iata: 'QP', icao: 'AKJ',
    name: 'Akasa Air', fullName: 'SNV Aviation Pvt. Ltd.',
    color: '#FF6600', accent: '#FFB347', textColor: '#fff',
    logo: 'https://img.logo.dev/akasaair.com?token=pk_free&size=60',
    domain: 'akasaair.com',
    rating: 'DISRUPTOR', ratingColor: '#8B5CF6',
    tagline: "Rakesh Jhunjhunwala's dream LCC. Greenest fleet.",
    fleet: 25, fleetType: 'B737 MAX 8 exclusively',
    founded: 2022, hubs: ['BOM', 'DEL'],
    routes: 22, routesInBasket: 18, marketShare: 8,
    avgFare: 3950, baseScore: 100,
    metrics: { network: 40, price: 88, onTime: 88, surge: 48, comfort: 72 },
    topRoutes: ['BOM-BLR', 'DEL-BOM', 'HYD-BOM'],
    fleetBreakdown: [{ type: 'B737 MAX 8', count: 25 }],
    funFact: 'India\'s youngest airline. 100% Boeing 737 MAX 8 fleet — the most fuel-efficient single-aisle jet. ~30% lower carbon per seat-km than A320ceo.',
    booking: { t1: 7200, t7: 5600, t15: 4700, t30: 4000, t45: 3600 },
  },
  {
    code: 'IX', iata: 'IX', icao: 'AXB',
    name: 'Air India Express', fullName: 'Air India Express Ltd.',
    color: '#E83B3B', accent: '#FF9A9A', textColor: '#fff',
    logo: 'https://img.logo.dev/airindiaexpress.in?token=pk_free&size=60',
    domain: 'airindiaexpress.in',
    rating: 'MID-RANGE', ratingColor: '#06B6D4',
    tagline: "AI's low-cost arm. South India & Gulf specialist.",
    fleet: 84, fleetType: 'B737-800 + A320',
    founded: 2005, hubs: ['COK', 'BLR', 'MAA'],
    routes: 35, routesInBasket: 22, marketShare: 7,
    avgFare: 5200, baseScore: 100,
    metrics: { network: 55, price: 72, onTime: 74, surge: 62, comfort: 65 },
    topRoutes: ['COK-CCU', 'BOM-COK', 'MAA-COK'],
    fleetBreakdown: [{ type: 'B737-800', count: 50 }, { type: 'A320neo', count: 34 }],
    funFact: 'Dominates the Kerala-to-rest-of-India corridor. Post-merger with AIX Connect, forms a mega LCC under Tata umbrella.',
    booking: { t1: 8900, t7: 6800, t15: 5800, t30: 5200, t45: 4700 },
  },
];

const HORIZONS = ['T+1', 'T+7', 'T+15', 'T+30', 'T+45'];
const HORIZON_KEYS = ['t1', 't7', 't15', 't30', 't45'] as const;

/* ─── Plotly helpers ─────────────────────────────────────────────────────── */
function plotBase(dark: boolean): Partial<Plotly.Layout> {
  return {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: dark ? '#0A1628' : '#F8FAFC',
    font: { color: dark ? '#94A3B8' : '#334155', family: 'Inter, sans-serif', size: 12 },
  };
}
function axisStyle(dark: boolean): Partial<Plotly.LayoutAxis> {
  return {
    gridcolor: dark ? '#1E3A5F' : '#E2E8F0', gridwidth: 1,
    zerolinecolor: dark ? '#2D4A6E' : '#CBD5E1', zerolinewidth: 1,
    tickfont: { color: dark ? '#64748B' : '#475569', size: 10, family: 'Inter, sans-serif' },
    titlefont: { color: dark ? '#94A3B8' : '#334155', size: 12, family: 'Inter, sans-serif' },
    showline: true, linecolor: dark ? '#1E3A5F' : '#CBD5E1', linewidth: 1,
  };
}

/* ─── Metric bar component ───────────────────────────────────────────────── */
const MetricBar: React.FC<{ label: string; value: number; color: string; dark: boolean }> = ({ label, value, color, dark }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
      <span style={{ fontSize: '0.78rem', color: 'var(--sub)' }}>{label}</span>
      <span style={{ fontSize: '0.78rem', fontWeight: 700, color, fontFamily: 'JetBrains Mono,monospace' }}>{value}</span>
    </div>
    <div style={{ height: 6, borderRadius: 3, background: dark ? '#1E3A5F' : '#E2E8F0', overflow: 'hidden' }}>
      <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
    </div>
  </div>
);

/* ════════════════════════════════════════════════════════════════════════════
   MAIN FLEET & CARRIERS PAGE
   ════════════════════════════════════════════════════════════════════════════ */
const Fleet: React.FC = () => {
  const { dark } = useTheme();
  const [selected, setSelected] = useState(0);
  const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({});
  const [tickerPos, setTickerPos] = useState(0);

  const c = CARRIERS[selected];
  const PB = useMemo(() => plotBase(dark), [dark]);
  const AX = useMemo(() => axisStyle(dark), [dark]);

  // Scrolling ticker animation
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerPos(p => (p - 1) % 600);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const surgeRatio = (c.booking.t1 / c.booking.t45).toFixed(2);

  // Live ticker content — cheapest airline per route
  const tickerItems = [
    '6E DEL-BOM ₹4,200', 'AI DEL-BLR ₹5,100', 'SG BOM-BLR ₹3,700', 'QP HYD-BOM ₹3,450',
    '6E MAA-DEL ₹4,800', 'IX BOM-COK ₹3,300', 'AI CCU-DEL ₹5,600', 'SG DEL-PNQ ₹3,100',
    '6E AMD-BOM ₹2,900', 'QP DEL-BOM ₹3,950', 'IX MAA-COK ₹2,800', '6E BLR-HYD ₹2,400',
  ];

  return (
    <div className="page-content">
      <div className="runway-bar" />

      {/* ── PAGE HEADER ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: '#06B6D4', marginBottom: 8 }}>
          Carrier Command Center
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: -1, color: 'var(--text)', margin: '0 0 10px 0' }}>
          🛩 India Aviation Fleet Intelligence
        </h1>
        <p style={{ color: 'var(--sub)', fontSize: '1rem', maxWidth: 820, lineHeight: 1.75, margin: 0 }}>
          Live-grade carrier intelligence for India's 5 major domestic airlines. From fleet composition and booking dynamics to competitive pricing radar — this is the aerospace enthusiast's cockpit.
        </p>
      </div>

      {/* ── LIVE FARE TICKER ────────────────────────────────────────────── */}
      <div style={{
        overflow: 'hidden', height: 40, background: dark ? '#030710' : '#0F172A',
        borderRadius: 8, marginBottom: 32, display: 'flex', alignItems: 'center',
        border: `1px solid ${dark ? '#1E3A5F' : '#1E3A5F'}`,
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, zIndex: 2, background: `linear-gradient(to right, ${dark ? '#030710' : '#0F172A'}, transparent)` }} />
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, zIndex: 2, background: `linear-gradient(to left, ${dark ? '#030710' : '#0F172A'}, transparent)` }} />
        <div style={{ whiteSpace: 'nowrap', transform: `translateX(${tickerPos}px)`, transition: 'transform 0.03s linear', display: 'flex', alignItems: 'center', gap: 40 }}>
          {[...tickerItems, ...tickerItems].map((item, i) => {
            const [code, ...rest] = item.split(' ');
            const carrier = CARRIERS.find(a => a.code === code);
            return (
              <span key={i} style={{ fontSize: '0.82rem', fontFamily: 'JetBrains Mono, monospace', color: '#94A3B8' }}>
                <span style={{ color: carrier?.color ?? '#06B6D4', fontWeight: 700 }}>{code}</span>
                {' '}{rest.join(' ')}
                <span style={{ color: dark ? '#1E3A5F' : '#334155', margin: '0 16px' }}>◆</span>
              </span>
            );
          })}
        </div>
        <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '0.65rem', fontWeight: 700, color: '#10B981', letterSpacing: 1, textTransform: 'uppercase', zIndex: 3, background: dark ? '#030710' : '#0F172A', padding: '2px 6px', borderRadius: 4 }}>
          LIVE
        </div>
      </div>

      {/* ── FLEET OVERVIEW STAT STRIP ───────────────────────────────────── */}
      <div className="stat-strip" style={{ marginBottom: 32 }}>
        <div className="stat-cell">
          <div className="stat-sub">Total Carriers Tracked</div>
          <div className="stat-big stat-cyan">{CARRIERS.length}</div>
          <div className="stat-note">Indian domestic operators</div>
        </div>
        <div className="stat-cell">
          <div className="stat-sub">Combined Fleet</div>
          <div className="stat-big" style={{ color: '#F59E0B' }}>{CARRIERS.reduce((s, a) => s + a.fleet, 0)}</div>
          <div className="stat-note">active aircraft</div>
        </div>
        <div className="stat-cell">
          <div className="stat-sub">Youngest Airline</div>
          <div className="stat-big" style={{ color: '#FF6600' }}>Akasa</div>
          <div className="stat-note">Est. 2022</div>
        </div>
        <div className="stat-cell">
          <div className="stat-sub">Oldest Carrier</div>
          <div className="stat-big" style={{ color: '#C8102E' }}>Air India</div>
          <div className="stat-note">Est. 1932</div>
        </div>
      </div>

      {/* ── CARRIER SELECTOR ────────────────────────────────────────────── */}
      <div className="section-label">Select Carrier — Deep Dive</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
        {CARRIERS.map((a, i) => (
          <button key={a.code} onClick={() => setSelected(i)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 20px', borderRadius: 12, cursor: 'pointer',
              border: `2px solid ${selected === i ? a.color : (dark ? '#1E3A5F' : '#E2E8F0')}`,
              background: selected === i ? `linear-gradient(135deg, ${a.color}22, ${a.accent}11)` : 'transparent',
              transition: 'all 0.25s',
              boxShadow: selected === i ? `0 0 20px ${a.color}30` : 'none',
            }}>
            {!logoErrors[a.code] ? (
              <img
                src={a.logo}
                alt={a.name}
                style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 4 }}
                onError={() => setLogoErrors(prev => ({ ...prev, [a.code]: true }))}
              />
            ) : (
              <div style={{ width: 28, height: 28, background: a.color, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 900, color: '#fff' }}>{a.code}</div>
            )}
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: selected === i ? a.color : 'var(--text)' }}>{a.name}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--sub)' }}>{a.fleet} aircraft</div>
            </div>
          </button>
        ))}
      </div>

      {/* ── CARRIER SPOTLIGHT CARD ──────────────────────────────────────── */}
      <div style={{
        borderRadius: 20, overflow: 'hidden', marginBottom: 32,
        border: `1px solid ${c.color}40`,
        boxShadow: `0 0 60px ${c.color}18`,
      }}>
        {/* Header banner */}
        <div style={{
          background: `linear-gradient(135deg, ${c.color}ee, ${c.accent}88)`,
          padding: '28px 32px',
          display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* Logo or IATA badge */}
            <div style={{ width: 80, height: 80, background: 'rgba(255,255,255,0.15)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
              {!logoErrors[c.code] ? (
                <img src={c.logo} alt={c.name} style={{ width: 60, height: 60, objectFit: 'contain' }}
                  onError={() => setLogoErrors(prev => ({ ...prev, [c.code]: true }))} />
              ) : (
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', fontFamily: 'JetBrains Mono,monospace', letterSpacing: 2 }}>{c.code}</div>
              )}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: 2, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>IATA: {c.iata}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: 2, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>ICAO: {c.icao}</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', letterSpacing: -0.5 }}>{c.name}</div>
              <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)' }}>{c.fullName}</div>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ padding: '6px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', fontSize: '0.85rem', fontWeight: 800, color: '#fff', letterSpacing: 1, marginBottom: 8 }}>
              {c.rating}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Est. {c.founded} · {c.fleet} aircraft</div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 28, background: dark ? '#080F1F' : '#FFFFFF' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, flexWrap: 'wrap' }}>

            {/* Col 1 — Info */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--sub)', marginBottom: 12 }}>Carrier Profile</div>
              <div style={{ fontSize: '0.88rem', color: 'var(--sub)', lineHeight: 1.8, marginBottom: 20 }}>{c.tagline}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--sub)', lineHeight: 2.2 }}>
                <div>🛫 Hubs: <strong style={{ color: 'var(--text)' }}>{c.hubs.join(', ')}</strong></div>
                <div>🌐 Routes: <strong style={{ color: 'var(--text)' }}>{c.routes} (total)</strong></div>
                <div>📊 In APIx Basket: <strong style={{ color: c.color }}>{c.routesInBasket} / 80 routes</strong></div>
                <div>🏆 Market Share: <strong style={{ color: c.color, fontFamily: 'JetBrains Mono,monospace' }}>{c.marketShare}%</strong></div>
                <div>💺 Fleet Type: <strong style={{ color: 'var(--text)' }}>{c.fleetType}</strong></div>
              </div>

              {/* Fleet breakdown */}
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--sub)', marginBottom: 10 }}>Fleet Composition</div>
                {c.fleetBreakdown.map(f => (
                  <div key={f.type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${dark ? '#1E3A5F' : '#E2E8F0'}` }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text)', fontFamily: 'JetBrains Mono,monospace' }}>{f.type}</span>
                    <span style={{ fontSize: '0.82rem', color: c.color, fontWeight: 700 }}>{f.count}</span>
                  </div>
                ))}
              </div>

              {/* Fun fact */}
              <div style={{ marginTop: 20, padding: 14, borderRadius: 10, background: `${c.color}12`, border: `1px solid ${c.color}30` }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: c.color, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>✈ Aviation Fact</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--sub)', lineHeight: 1.6 }}>{c.funFact}</div>
              </div>
            </div>

            {/* Col 2 — Performance Metrics */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--sub)', marginBottom: 16 }}>Performance Metrics</div>
              <MetricBar label="Network Breadth"       value={c.metrics.network}  color="#06B6D4" dark={dark} />
              <MetricBar label="Price Competitiveness" value={c.metrics.price}    color="#10B981" dark={dark} />
              <MetricBar label="On-Time Performance"   value={c.metrics.onTime}   color="#8B5CF6" dark={dark} />
              <MetricBar label="Surge Aggression"      value={c.metrics.surge}    color="#EF4444" dark={dark} />
              <MetricBar label="Comfort Score"         value={c.metrics.comfort}  color="#F59E0B" dark={dark} />

              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--sub)', marginBottom: 12 }}>Top Routes in APIx Basket</div>
                {c.topRoutes.map((r, i) => (
                  <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${dark ? '#1E3A5F' : '#E2E8F0'}` }}>
                    <span style={{ width: 22, height: 22, borderRadius: 6, background: c.color + '22', color: c.color, fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>#{i + 1}</span>
                    <span style={{ fontSize: '0.88rem', fontFamily: 'JetBrains Mono,monospace', color: 'var(--text)' }}>{r}</span>
                  </div>
                ))}
              </div>

              {/* Booking recommendation */}
              <div style={{ marginTop: 20, padding: 14, borderRadius: 10, background: dark ? '#0A1628' : '#F8FAFC', border: `1px solid ${dark ? '#1E3A5F' : '#E2E8F0'}` }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#10B981', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Consumer Booking Guide</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--sub)', lineHeight: 1.6 }}>
                  T+1/T+45 surge ratio: <strong style={{ color: c.color, fontFamily: 'JetBrains Mono,monospace' }}>{surgeRatio}×</strong>
                  <br />
                  {Number(surgeRatio) > 2.0
                    ? `⚠ Book ≥30 days ahead to avoid ${((Number(surgeRatio) - 1) * 100).toFixed(0)}% premium.`
                    : Number(surgeRatio) > 1.5
                    ? `📅 Book ≥15 days ahead for best fares.`
                    : `✅ Low surge penalty — flexible booking works fine.`}
                </div>
              </div>
            </div>

            {/* Col 3 — Fare Chart */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--sub)', marginBottom: 8 }}>Fare vs Booking Horizon</div>
              <Plot
                key={`fareplot-${selected}-${dark}`}
                data={[{
                  type: 'scatter', mode: 'lines+markers',
                  x: HORIZONS,
                  y: HORIZON_KEYS.map(k => c.booking[k]),
                  line: { color: c.color, width: 3, shape: 'spline' },
                  marker: { size: 10, color: c.color, line: { color: dark ? '#080F1F' : '#fff', width: 2 } },
                  fill: 'tozeroy', fillcolor: c.color + '18',
                  hovertemplate: '<b>%{x}</b><br>₹%{y:,}<extra></extra>',
                }]}
                layout={{
                  ...PB, height: 220,
                  margin: { l: 60, r: 10, t: 10, b: 40 },
                  xaxis: { ...AX, title: { text: 'Booking Horizon', font: { size: 10 }, standoff: 6 } },
                  yaxis: { ...AX, title: { text: '₹', font: { size: 10 }, standoff: 6 }, tickformat: ',.0f' },
                  showlegend: false,
                }}
                config={{ displayModeBar: false, responsive: true }}
                style={{ width: '100%' }}
              />

              {/* Fare KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                {[
                  { label: 'T+1 Fare',    val: `₹${c.booking.t1.toLocaleString()}`, color: '#EF4444' },
                  { label: 'T+45 Fare',   val: `₹${c.booking.t45.toLocaleString()}`, color: '#10B981' },
                  { label: 'Avg Fare',    val: `₹${c.avgFare.toLocaleString()}`,     color: c.color    },
                  { label: 'Surge ×',     val: `${surgeRatio}×`,                     color: Number(surgeRatio) > 2 ? '#EF4444' : '#F59E0B' },
                ].map(k => (
                  <div key={k.label} className="card" style={{ textAlign: 'center', padding: '10px 6px' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--sub)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{k.label}</div>
                    <div style={{ color: k.color, fontSize: '1rem', fontWeight: 800, fontFamily: 'JetBrains Mono,monospace' }}>{k.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ALL CARRIERS COMPARISON CHARTS ──────────────────────────────── */}
      <div className="section-label">National Fleet & Market Comparison</div>
      <div className="grid-2" style={{ gap: 20, marginBottom: 32 }}>

        {/* Market share donut */}
        <Plot
          key={`mktshare-${dark}`}
          data={[{
            type: 'pie',
            labels: CARRIERS.map(a => `${a.code} ${a.name}`),
            values: CARRIERS.map(a => a.marketShare),
            hole: 0.65,
            marker: { colors: CARRIERS.map(a => a.color), line: { color: dark ? '#060B14' : '#fff', width: 2 } },
            hovertemplate: '<b>%{label}</b><br>%{value}% market share<extra></extra>',
            textinfo: 'none',
          }]}
          layout={{
            ...PB, height: 320,
            margin: { t: 40, b: 10, l: 30, r: 30 },
            title: { text: 'Market Share by Carrier (APIx Routes)', font: { color: dark ? '#E2E8F0' : '#0F172A', size: 13 } },
            showlegend: true,
            legend: { font: { color: dark ? '#94A3B8' : '#475569', size: 10 }, bgcolor: 'transparent', orientation: 'h', x: 0.5, xanchor: 'center', y: -0.1 },
            annotations: [{ text: '<b>Market Share</b>', x: 0.5, y: 0.5, showarrow: false, font: { color: dark ? '#E2E8F0' : '#0F172A', size: 13 }, align: 'center' }],
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%' }}
        />

        {/* Fleet size comparison */}
        <Plot
          key={`fleet-${dark}`}
          data={[{
            type: 'bar',
            x: CARRIERS.map(a => `${a.code}`),
            y: CARRIERS.map(a => a.fleet),
            marker: { color: CARRIERS.map(a => a.color), line: { width: 0 } },
            text: CARRIERS.map(a => `${a.fleet}`),
            textposition: 'outside',
            textfont: { color: dark ? '#94A3B8' : '#475569', size: 11 },
            hovertemplate: '<b>%{x}</b><br>%{y} aircraft<extra></extra>',
          }]}
          layout={{
            ...PB, height: 320,
            margin: { l: 50, r: 20, t: 40, b: 50 },
            title: { text: 'Active Fleet Size by Carrier', font: { color: dark ? '#E2E8F0' : '#0F172A', size: 13 } },
            showlegend: false,
            xaxis: { ...AX, showgrid: false },
            yaxis: { ...AX, title: { text: 'Aircraft Count', font: { size: 11 }, standoff: 8 } },
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%' }}
        />
      </div>

      {/* Radar comparison */}
      <div className="section-label">Competitive Intelligence Radar</div>
      <p style={{ color: 'var(--sub)', fontSize: '0.88rem', marginBottom: 20 }}>
        5-axis performance radar comparing all carriers simultaneously. Higher score = better on that axis.
        <strong style={{ color: 'var(--text)' }}> Surge Aggression and Market Concentration are inverted — lower is better for consumers.</strong>
      </p>
      <Plot
        key={`bigRadar-${dark}`}
        data={CARRIERS.map(a => ({
          type: 'scatterpolar' as const,
          r: [a.metrics.network, a.metrics.price, a.metrics.onTime, 100 - a.metrics.surge, a.metrics.comfort],
          theta: ['Network Breadth', 'Price Competitive', 'On-Time Perf', 'Low Surge Risk', 'Comfort Score'],
          fill: 'toself' as const,
          name: `${a.code} — ${a.name}`,
          line: { color: a.color, width: 2.5 },
          fillcolor: a.color + '22',
          hovertemplate: `<b>${a.name}</b><br>%{theta}: %{r}/100<extra></extra>`,
        }))}
        layout={{
          ...PB, height: 460,
          polar: {
            bgcolor: dark ? '#060B14' : '#F8FAFC',
            radialaxis: { visible: true, range: [0, 100], color: dark ? '#1E3A5F' : '#CBD5E1', tickfont: { size: 9, color: dark ? '#475569' : '#94A3B8' } },
            angularaxis: { color: dark ? '#2D4A6E' : '#CBD5E1', tickfont: { size: 12, color: dark ? '#94A3B8' : '#334155' } },
          },
          legend: { font: { color: dark ? '#94A3B8' : '#475569', size: 11 }, bgcolor: 'transparent', orientation: 'h', x: 0.5, xanchor: 'center', y: -0.12 },
          margin: { t: 30, b: 70, l: 40, r: 40 },
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
      />

      {/* Footer context */}
      <div style={{ marginTop: 32, padding: 20, borderRadius: 12, background: dark ? '#0A1628' : '#F8FAFC', border: `1px solid ${dark ? '#1E3A5F' : '#E2E8F0'}` }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--sub)', lineHeight: 1.8 }}>
          <strong style={{ color: 'var(--text)' }}>📌 Data Sources & Methodology:</strong> Market share figures derived from DGCA quarterly traffic data (Q1 2024). Fleet counts from DGCA aircraft register and airline annual reports. Performance metrics are composite scores computed from DGCA on-time statistics, DGCA consumer complaint data, and APIx pricing analysis. Logos served via Logo.dev (identification use only). All figures are for analytical and research purposes.
        </div>
      </div>
    </div>
  );
};

export default Fleet;
