import React from 'react';
import { useNavigate } from 'react-router-dom';

const MODULES = [
  {
    code: 'MOD-01',
    title: 'Modified Laspeyres Index Engine',
    desc: 'Daily national price index computation weighted by quarterly domestic passenger distributions across 80 scheduled corridors and 5 advance booking horizons (T+1 to T+45).',
    badge: 'Base 2024 = 100.00',
    path: '/dashboard',
    icon: '📊',
  },
  {
    code: 'MOD-02',
    title: 'Statistical IQR Outlier Filtration',
    desc: 'Mathematical [Q1, Q3] interquartile boundaries filter out predatory last-seat fare spikes, ensuring true consumer price representation across all routes.',
    badge: 'IQR Filtered Median',
    path: '/methodology',
    icon: '🛡️',
  },
  {
    code: 'MOD-03',
    title: 'Passenger-Weighted Traffic Allocation',
    desc: 'Dynamic weight matrices derived from quarterly domestic passenger volumes, preventing high-density trunk routes from being diluted by low-traffic regional hops.',
    badge: '80 Corridors · Sum = 1.0',
    path: '/methodology',
    icon: '⚖️',
  },
  {
    code: 'MOD-04',
    title: 'Antitrust & Market Concentration (HHI)',
    desc: 'Automated Herfindahl-Hirschman Index scoring across all domestic corridors, pinpointing high-barrier monopoly routes with HHI > 2500 for competition analysis.',
    badge: 'Antitrust Telemetry',
    path: '/analysts',
    icon: '🏛️',
  },
  {
    code: 'MOD-05',
    title: 'ATF Fuel Shock Sensitivity Simulator',
    desc: 'Macroeconomic simulation engine modeling Aviation Turbine Fuel price fluctuations (±50%) with carrier-specific cost pass-through elasticities (η = 0.55 - 0.80).',
    badge: 'Predictive Policy Engine',
    path: '/simulation',
    icon: '🔮',
  },
  {
    code: 'MOD-06',
    title: 'Carrier Fleet Intelligence Cockpit',
    desc: 'Operational profiles, seat capacities, and yield curves across IndiGo, Air India, SpiceJet, Akasa Air, and AI Express representing 92% of domestic aviation traffic.',
    badge: '5 Scheduled Carriers',
    path: '/fleet',
    icon: '✈️',
  },
];

const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="apix-modern-container">

      {/* ── Background Grid Pattern ── */}
      <div className="apix-grid-bg" />
      <div className="apix-glow-orb" />

      {/* ── Top Header Navigation ── */}
      <header className="apix-top-nav">
        <div className="apix-top-nav-inner">
          <div className="apix-brand" onClick={() => navigate('/')}>
            <span className="apix-brand-icon">✈</span>
            <div className="apix-brand-text">
              <span className="apix-brand-title">APIx</span>
              <span className="apix-brand-tag">v2.0</span>
            </div>
            <span className="apix-brand-divider">/</span>
            <span className="apix-brand-sub">Domestic Airfare Price Index</span>
          </div>

          <div className="apix-nav-actions">
            <button className="apix-launch-btn" onClick={() => navigate('/dashboard')}>
              Launch Dashboard →
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="apix-hero-section">
        <div className="apix-hero-inner">

          {/* Pill Badge */}
          <div className="apix-hero-badge">
            <span className="apix-badge-dot" />
            <span>DOMESTIC AVIATION ECONOMIC INTELLIGENCE</span>
          </div>

          {/* Main Title */}
          <h1 className="apix-hero-title">
            Airfare Price Index of India
          </h1>

          {/* Subtitle */}
          <p className="apix-hero-desc">
            A high-frequency macroeconomic price index tracking domestic airline tariff inflation across{' '}
            <strong>80 scheduled corridors</strong>. Built with a <strong>Modified Laspeyres Index</strong>,
            passenger volume traffic weights, and statistical <strong>Interquartile Range (IQR)</strong> anomaly rejection.
          </p>

          {/* Action Buttons */}
          <div className="apix-hero-cta-group">
            <button className="apix-cta-primary" onClick={() => navigate('/dashboard')}>
              <span>Launch Live Dashboard</span>
              <span>✈</span>
            </button>
            <button className="apix-cta-secondary" onClick={() => navigate('/methodology')}>
              <span>Explore Methodology</span>
              <span>📐</span>
            </button>
          </div>

          {/* 4 National Key Metrics */}
          <div className="apix-kpi-grid">
            <div className="apix-kpi-card">
              <div className="apix-kpi-label">COMPOSITE APIx (T+7)</div>
              <div className="apix-kpi-value">114.20 <small>PTS</small></div>
              <div className="apix-kpi-status up">▲ +14.20% vs Base (100.00)</div>
            </div>

            <div className="apix-kpi-card">
              <div className="apix-kpi-label">MONITORED CORRIDORS</div>
              <div className="apix-kpi-value">80 <small>ROUTES</small></div>
              <div className="apix-kpi-status">Across 20 Airport Hubs</div>
            </div>

            <div className="apix-kpi-card">
              <div className="apix-kpi-label">PASSENGER COVERAGE</div>
              <div className="apix-kpi-value">98.4%</div>
              <div className="apix-kpi-status">Normalized Quarterly Volume</div>
            </div>

            <div className="apix-kpi-card">
              <div className="apix-kpi-label">ANOMALY REJECTION</div>
              <div className="apix-kpi-value">IQR [Q1, Q3]</div>
              <div className="apix-kpi-status">Dynamic Surge Trimming</div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Core Modules Directory ── */}
      <section className="apix-modules-section">
        <div className="apix-modules-inner">

          <div className="apix-section-header">
            <div className="apix-section-tag">SYSTEM ARCHITECTURE</div>
            <h2 className="apix-section-title">Core Intelligence & Analytical Subsystems</h2>
            <p className="apix-section-desc">
              Six dedicated modules engineered for real-time fare tracking, antitrust market concentration, and macroeconomic forecasting.
            </p>
          </div>

          <div className="apix-cards-grid">
            {MODULES.map(m => (
              <div
                key={m.code}
                className="apix-module-card"
                onClick={() => navigate(m.path)}
                role="button"
                tabIndex={0}
              >
                <div className="apix-card-top">
                  <span className="apix-card-icon">{m.icon}</span>
                  <span className="apix-card-badge">{m.badge}</span>
                </div>

                <div className="apix-card-code">{m.code}</div>
                <h3 className="apix-card-title">{m.title}</h3>
                <p className="apix-card-desc">{m.desc}</p>

                <div className="apix-card-link">
                  <span>Open Subsystem</span>
                  <span className="apix-arrow">→</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Methodology Benchmark Table ── */}
      <section className="apix-table-section">
        <div className="apix-table-inner">
          <div className="apix-section-header" style={{ marginBottom: 28 }}>
            <div className="apix-section-tag">MATHEMATICAL BENCHMARK</div>
            <h2 className="apix-section-title">APIx Weighted Index vs. Naive Simple Average</h2>
          </div>

          <div className="apix-table-wrap">
            <table className="apix-benchmark-table">
              <thead>
                <tr>
                  <th>Dimension</th>
                  <th>Naive Simple Average (Unweighted)</th>
                  <th>APIx Modified Laspeyres Standard</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Passenger Traffic Weighting</strong></td>
                  <td>Equal weight (1.25% per route regardless of density)</td>
                  <td className="highlight-col">Weighted by quarterly passenger volume share (DEL-BOM = ~4.8%)</td>
                </tr>
                <tr>
                  <td><strong>Dynamic Surge Anomaly Filtration</strong></td>
                  <td>None (distorted by single ₹45,000 predatory tickets)</td>
                  <td className="highlight-col">Robust [Q1, Q3] + 1.5×IQR statistical trimming</td>
                </tr>
                <tr>
                  <td><strong>Booking Horizons Covered</strong></td>
                  <td>Single static date snapshot</td>
                  <td className="highlight-col">5 Advance horizons (T+1, T+7, T+15, T+30, T+45)</td>
                </tr>
                <tr>
                  <td><strong>Antitrust & Fuel Simulation</strong></td>
                  <td>No concentration or cost elasticity tracking</td>
                  <td className="highlight-col">Automated HHI &gt; 2500 alerts + ATF fuel shock simulation</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="apix-footer">
        <div className="apix-footer-inner">
          <div className="apix-footer-top">
            <div>
              <div className="apix-footer-brand">APIx • Airfare Price Index Platform</div>
              <div className="apix-footer-desc">
                Domestic civil aviation economic intelligence platform computing standardized Laspeyres price indices across Indian flight corridors.
              </div>
            </div>
            <div className="apix-footer-pills">
              <span className="apix-pill">Base: 2024 = 100.00</span>
              <span className="apix-pill">80 Domestic Corridors</span>
              <span className="apix-pill">Daily Yield Curves</span>
            </div>
          </div>

          <div className="apix-footer-bottom">
            <div>Airfare Price Index (APIx) • Advanced Civil Aviation Intelligence</div>
            <div>Built for Economic Transparency & Inflation Analytics</div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Landing;
