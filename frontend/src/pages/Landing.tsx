import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ModuleItem {
  number: string;
  title: string;
  category: string;
  description: string;
  tag: string;
  path: string;
}

const MODULES: ModuleItem[] = [
  {
    number: '01',
    category: 'PRICE INDEX ENGINE',
    title: 'Modified Laspeyres Index',
    description: 'Computes daily national and route-level price indices weighted by quarterly passenger distributions across 80 scheduled city-pairs.',
    tag: 'Base 2024 = 100.00',
    path: '/dashboard',
  },
  {
    number: '02',
    category: 'DATA INTEGRITY',
    title: 'Statistical IQR Outlier Filtration',
    description: 'Implements [Q1, Q3] interquartile range boundaries to filter unrepresentative last-seat surge fares before median aggregation.',
    tag: 'Upper Bound = Q3 + 1.5×IQR',
    path: '/methodology',
  },
  {
    number: '03',
    category: 'TRAFFIC DENSITY',
    title: 'Passenger Volume Weighting',
    description: 'Normalizes 80 domestic corridors by actual quarterly passenger traffic share so high-density trunk routes carry truthful macroeconomic weight.',
    tag: '80 Corridors · Σ W = 1.0',
    path: '/methodology',
  },
  {
    number: '04',
    category: 'ANTITRUST & REGULATION',
    title: 'Herfindahl-Hirschman Concentration (HHI)',
    description: 'Calculates route-level market concentration scores, flagging high-barrier monopoly corridors with HHI exceeding 2,500.',
    tag: 'Market Concentration Alert',
    path: '/analysts',
  },
  {
    number: '05',
    category: 'MACROECONOMIC SIMULATION',
    title: 'ATF Fuel Shock Elasticity Simulator',
    description: 'Models cost pass-through dynamics for Aviation Turbine Fuel fluctuations (±50%) with route-specific carrier elasticity factors.',
    tag: 'Elasticity η = 0.55 – 0.80',
    path: '/simulation',
  },
  {
    number: '06',
    category: 'FLEET INTELLIGENCE',
    title: 'Carrier Yield & Capacity Cockpit',
    description: 'Deep operational profiles and dynamic pricing curves for IndiGo, Air India, SpiceJet, Akasa Air, and AI Express across 600+ aircraft.',
    tag: '5 Fleets · 92% Domestic Share',
    path: '/fleet',
  },
];

const HORIZONS_PREVIEW = [
  { horizon: 'T+1', label: 'Last Minute', index: '138.40', change: '+38.40%', color: '#F87171' },
  { horizon: 'T+7', label: 'Short Horizon', index: '114.20', change: '+14.20%', color: '#FBBF24' },
  { horizon: 'T+15', label: 'Standard Lead', index: '105.80', change: '+5.80%', color: '#60A5FA' },
  { horizon: 'T+30', label: 'Advance Leisure', index: '98.40', change: '-1.60%', color: '#34D399' },
  { horizon: 'T+45', label: 'Base Booking', index: '86.50', change: '-13.50%', color: '#A78BFA' },
];

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [activeHorizon, setActiveHorizon] = useState('T+7');

  const activeData = HORIZONS_PREVIEW.find(h => h.horizon === activeHorizon) || HORIZONS_PREVIEW[1];

  return (
    <div className="apix-landing-root">

      {/* ── Pure Black Canvas with White Blending & Morphing Grids ── */}
      <div className="apix-morph-grid-base" />
      <div className="apix-morph-grid-animated" />
      <div className="apix-white-blend-orb orb-top" />
      <div className="apix-white-blend-orb orb-mid" />
      <div className="apix-white-blend-orb orb-bottom" />
      <div className="apix-white-sweep-beam" />

      {/* ── Header Navigation ── */}
      <header className="apix-header">
        <div className="apix-header-container">
          <div className="apix-logo-group" onClick={() => navigate('/')}>
            <span className="apix-logo-text">APIx</span>
            <span className="apix-logo-badge">RESEARCH</span>
          </div>

          <nav className="apix-nav-links">
            <span className="apix-nav-link" onClick={() => navigate('/dashboard')}>Index Data</span>
            <span className="apix-nav-link" onClick={() => navigate('/methodology')}>Methodology</span>
            <span className="apix-nav-link" onClick={() => navigate('/analysts')}>Antitrust</span>
            <span className="apix-nav-link" onClick={() => navigate('/simulation')}>Simulation</span>
            <span className="apix-nav-link" onClick={() => navigate('/fleet')}>Carriers</span>
          </nav>

          <div className="apix-header-actions">
            <button className="apix-btn-launch" onClick={() => navigate('/dashboard')}>
              <span>Open Dashboard</span>
              <span style={{ fontSize: '0.85rem' }}>↗</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero Section with Airport Night Background ── */}
      <section className="apix-hero">
        <div className="apix-hero-airport-bg" />
        <div className="apix-hero-airport-overlay" />
        <div className="apix-hero-container">

          <div className="apix-kicker">
            <span className="apix-kicker-dot" />
            <span>DOMESTIC CIVIL AVIATION MACROECONOMIC TELEMETRY</span>
          </div>

          <h1 className="apix-headline">
            The Airfare Price Index of India
          </h1>

          <p className="apix-subhead">
            A high-frequency macroeconomic price index tracking domestic passenger tariff inflation across{' '}
            <strong>80 scheduled flight corridors</strong>. Standardized using a <strong>Modified Laspeyres Index</strong>,
            passenger volume traffic weights, and statistical <strong>Interquartile Range (IQR)</strong> anomaly rejection.
          </p>

          <div className="apix-actions">
            <button className="apix-btn-solid" onClick={() => navigate('/dashboard')}>
              <span>Launch Live Dashboard</span>
              <span>→</span>
            </button>
            <button className="apix-btn-ghost" onClick={() => navigate('/methodology')}>
              <span>Read Technical Methodology</span>
              <span>↗</span>
            </button>
          </div>

          {/* ── Live Index Terminal Card ── */}
          <div className="apix-terminal-card">
            <div className="apix-terminal-header">
              <div className="apix-terminal-title">
                <span className="terminal-pulse" />
                <span>COMPOSITE NATIONAL APIx (BASE 2024 = 100.00)</span>
              </div>
              <div className="apix-terminal-meta">
                <span>80 ROUTES MONITORED</span>
                <span className="meta-sep">/</span>
                <span>DAILY REBALANCING</span>
              </div>
            </div>

            <div className="apix-terminal-body">
              {/* Horizon Selector Tabs */}
              <div className="apix-horizon-tabs">
                {HORIZONS_PREVIEW.map(h => (
                  <button
                    key={h.horizon}
                    className={`apix-horizon-tab ${activeHorizon === h.horizon ? 'active' : ''}`}
                    onClick={() => setActiveHorizon(h.horizon)}
                  >
                    <span className="tab-horizon">{h.horizon}</span>
                    <span className="tab-label">{h.label}</span>
                  </button>
                ))}
              </div>

              {/* Active Horizon Readout */}
              <div className="apix-readout-grid">
                <div className="readout-box">
                  <span className="readout-label">INDEX LEVEL ({activeData.horizon})</span>
                  <div className="readout-val-wrap">
                    <span className="readout-val">{activeData.index}</span>
                    <span className="readout-unit">PTS</span>
                  </div>
                  <span className="readout-status" style={{ color: activeData.color }}>
                    {activeData.change} vs Base Period
                  </span>
                </div>

                <div className="readout-box">
                  <span className="readout-label">PASSENGER COVERAGE</span>
                  <div className="readout-val-wrap">
                    <span className="readout-val">98.4</span>
                    <span className="readout-unit">%</span>
                  </div>
                  <span className="readout-sub">Quarterly Volume Weighted</span>
                </div>

                <div className="readout-box">
                  <span className="readout-label">STATISTICAL INTEGRITY</span>
                  <div className="readout-val-wrap">
                    <span className="readout-val" style={{ fontSize: '1.4rem', letterSpacing: '0px' }}>[Q1, Q3]</span>
                  </div>
                  <span className="readout-sub">IQR Filtered Median</span>
                </div>

                <div className="readout-box">
                  <span className="readout-label">CORRIDORS IN BASKET</span>
                  <div className="readout-val-wrap">
                    <span className="readout-val">80</span>
                    <span className="readout-unit">ROUTES</span>
                  </div>
                  <span className="readout-sub">20 Primary Airport Hubs</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Architecture & Subsystems Grid ── */}
      <section className="apix-modules-sec">
        <div className="apix-modules-container">

          <div className="apix-sec-head">
            <span className="apix-sec-tag">PLATFORM ARCHITECTURE</span>
            <h2 className="apix-sec-title">Core Econometric & Analytical Modules</h2>
            <p className="apix-sec-desc">
              Engineered to provide standardized inflation measurement, antitrust market concentration scoring, and macroeconomic simulation.
            </p>
          </div>

          <div className="apix-grid-modules">
            {MODULES.map(m => (
              <div
                key={m.number}
                className="apix-mod-card"
                onClick={() => navigate(m.path)}
                role="button"
                tabIndex={0}
              >
                <div className="apix-mod-top">
                  <span className="apix-mod-num">{m.number}</span>
                  <span className="apix-mod-tag">{m.tag}</span>
                </div>

                <div className="apix-mod-cat">{m.category}</div>
                <h3 className="apix-mod-title">{m.title}</h3>
                <p className="apix-mod-desc">{m.description}</p>

                <div className="apix-mod-foot">
                  <span>Explore module</span>
                  <span className="foot-arrow">→</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Technical Benchmark Table ── */}
      <section className="apix-table-sec">
        <div className="apix-table-container">

          <div className="apix-sec-head" style={{ marginBottom: 36 }}>
            <span className="apix-sec-tag">METHODOLOGY COMPARISON</span>
            <h2 className="apix-sec-title">APIx Laspeyres Standard vs. Simple Average</h2>
            <p className="apix-sec-desc">
              Why unweighted simple arithmetic averages fail for national airfare inflation and how APIx resolves statistical distortion.
            </p>
          </div>

          <div className="apix-table-wrapper">
            <table className="apix-comp-table">
              <thead>
                <tr>
                  <th style={{ width: '26%' }}>
                    <span className="th-label">METHODOLOGICAL DIMENSION</span>
                  </th>
                  <th style={{ width: '37%' }}>
                    <div className="th-col-header">
                      <span className="th-title">Naive Simple Average</span>
                      <span className="th-pill-bad">✕ UNWEIGHTED</span>
                    </div>
                  </th>
                  <th style={{ width: '37%' }} className="th-highlight">
                    <div className="th-col-header">
                      <span className="th-title">APIx Modified Laspeyres Standard</span>
                      <span className="th-pill-good">✓ PASSENGER WEIGHTED</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="row-dim">
                    <div className="dim-title">Passenger Traffic Weighting</div>
                    <div className="dim-sub">Route density distribution</div>
                  </td>
                  <td className="row-naive">
                    <div className="cell-content">
                      <span className="status-cross">✕</span>
                      <span>Equal 1.25% weight per route. High-density trunk corridors are diluted by low-traffic regional hops.</span>
                    </div>
                  </td>
                  <td className="row-apix">
                    <div className="cell-content">
                      <span className="status-check">✓</span>
                      <span><strong>Quarterly volume weighted.</strong> DEL-BOM carries ~4.8% weight, accurately mirroring real consumer spend.</span>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td className="row-dim">
                    <div className="dim-title">Dynamic Surge Outliers</div>
                    <div className="dim-sub">Last-seat predatory fares</div>
                  </td>
                  <td className="row-naive">
                    <div className="cell-content">
                      <span className="status-cross">✕</span>
                      <span>Unfiltered arithmetic mean. A single ₹45,000 last-seat ticket artificially inflates the entire index.</span>
                    </div>
                  </td>
                  <td className="row-apix">
                    <div className="cell-content">
                      <span className="status-check">✓</span>
                      <span><strong>Robust [Q1, Q3] IQR trimming.</strong> Outliers violating Q3 + 1.5×IQR are discarded before median aggregation.</span>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td className="row-dim">
                    <div className="dim-title">Advance Booking Horizons</div>
                    <div className="dim-sub">Yield curve segmentation</div>
                  </td>
                  <td className="row-naive">
                    <div className="cell-content">
                      <span className="status-cross">✕</span>
                      <span>Single static departure date. Fails to separate last-minute business travel from leisure booking.</span>
                    </div>
                  </td>
                  <td className="row-apix">
                    <div className="cell-content">
                      <span className="status-check">✓</span>
                      <span><strong>5 Lead horizons (T+1 to T+45).</strong> Captures the full dynamic yield curve across all booking segments.</span>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td className="row-dim">
                    <div className="dim-title">Antitrust & Fuel Simulation</div>
                    <div className="dim-sub">Macroeconomic policy utility</div>
                  </td>
                  <td className="row-naive">
                    <div className="cell-content">
                      <span className="status-cross">✕</span>
                      <span>Zero market concentration or fuel price shock elasticity tracking.</span>
                    </div>
                  </td>
                  <td className="row-apix">
                    <div className="cell-content">
                      <span className="status-check">✓</span>
                      <span><strong>Automated HHI &gt; 2500 alerts</strong> and interactive ATF crude oil fuel shock elasticity modeling (η = 0.55 to 0.80).</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="apix-foot">
        <div className="apix-foot-container">
          <div className="apix-foot-top">
            <div>
              <div className="apix-foot-title">APIx • Airfare Price Index Platform</div>
              <div className="apix-foot-sub">
                Domestic civil aviation economic intelligence platform computing standardized Laspeyres price indices across Indian flight corridors.
              </div>
            </div>
            <div className="apix-foot-pills">
              <span className="apix-foot-pill">Base Period: 2024 = 100.00</span>
              <span className="apix-foot-pill">80 Domestic Corridors</span>
              <span className="apix-foot-pill">5 Booking Horizons</span>
            </div>
          </div>

          <div className="apix-foot-bottom">
            <div>Airfare Price Index (APIx) • Advanced Civil Aviation Intelligence</div>
            <div>Built for Economic Transparency & Tariff Analysis</div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Landing;
