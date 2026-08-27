import React from 'react';
import { useNavigate } from 'react-router-dom';

const MODULES = [
  {
    code: 'SEC-01',
    title: 'Modified Laspeyres Index Engine',
    desc: 'Daily national price index computation weighted by official DGCA quarterly passenger distributions across 80 scheduled corridors and 5 advance booking horizons (T+1 to T+45).',
    badge: 'Base 2024 = 100.00',
    path: '/dashboard',
    icon: '📊',
  },
  {
    code: 'SEC-02',
    title: 'Statistical IQR Outlier Rejection',
    desc: 'Mathematical [Q1, Q3] interquartile boundaries discard unrepresentative last-seat surge fares, ensuring true consumer price representation for national inflation tracking.',
    badge: 'IQR Filtered Median',
    path: '/methodology',
    icon: '🛡️',
  },
  {
    code: 'SEC-03',
    title: 'DGCA Passenger Volume Allocation',
    desc: 'Dynamic weight matrices derived from official Directorate General of Civil Aviation city-pair data, preventing high-density trunk routes from being diluted by regional hops.',
    badge: '80 Corridors · 100% Normalized',
    path: '/methodology',
    icon: '⚖️',
  },
  {
    code: 'SEC-04',
    title: 'Antitrust & Market Concentration (HHI)',
    desc: 'Automated Herfindahl-Hirschman Index monitoring for the Competition Commission of India (CCI) and DGCA to identify high-barrier routes with HHI > 2500.',
    badge: 'CCI / DGCA Oversight',
    path: '/analysts',
    icon: '🏛️',
  },
  {
    code: 'SEC-05',
    title: 'ATF Fuel Shock Elasticity Simulator',
    desc: 'Macroeconomic simulation engine modeling Aviation Turbine Fuel price fluctuations (±50%) with carrier-specific cost pass-through elasticities (η = 0.55 - 0.80).',
    badge: 'Predictive Policy Tool',
    path: '/simulation',
    icon: '🔮',
  },
  {
    code: 'SEC-06',
    title: 'Scheduled Carrier Fleet Register',
    desc: 'Operational profiles, seat capacities, and yield curves across IndiGo, Air India, SpiceJet, Akasa Air, and AI Express representing 92% of domestic aviation traffic.',
    badge: '600+ Aircraft Monitored',
    path: '/fleet',
    icon: '✈️',
  },
];

const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="govt-portal-container">

      {/* ══════════════════════════════════════════════════════
          TOP TRICOLOR & OFFICIAL GOVERNMENT HEADER STRIP
          ══════════════════════════════════════════════════════ */}
      <div className="govt-top-bar">
        <div className="govt-top-bar-inner">
          <div className="govt-emblem-text">
            <span className="govt-tricolor-dot" />
            <span>भारत सरकार | Government of India</span>
            <span className="govt-bar-sep">•</span>
            <span>नागर विमानन मंत्रालय | Ministry of Civil Aviation</span>
          </div>
          <div className="govt-top-meta">
            <span className="govt-status-tag">● OFFICIAL STATISTICAL RELEASE</span>
            <span className="govt-bar-sep">•</span>
            <span>Ref: DGCA-MoSPI / APIx-2026</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          MINISTRY PORTAL HEADER
          ══════════════════════════════════════════════════════ */}
      <header className="govt-nav-header">
        <div className="govt-nav-inner">
          <div className="govt-brand" onClick={() => navigate('/')}>
            <div className="govt-brand-icon">🏛️</div>
            <div>
              <div className="govt-brand-title">APIx • Airfare Price Index</div>
              <div className="govt-brand-sub">Directorate General of Civil Aviation (DGCA) & MoSPI Standards</div>
            </div>
          </div>

          <div className="govt-nav-actions">
            <button className="govt-btn-primary" onClick={() => navigate('/dashboard')}>
              Access National Data Portal →
            </button>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════
          SOBER INSTITUTIONAL HERO SECTION
          ══════════════════════════════════════════════════════ */}
      <section className="govt-hero-section">
        <div className="govt-hero-inner">

          {/* Department / Category Pill */}
          <div className="govt-dept-badge">
            NATIONAL CIVIL AVIATION ECONOMIC REPOSITORY
          </div>

          {/* Main Official Title */}
          <h1 className="govt-main-heading">
            National Airfare Price Index of India
          </h1>
          <div className="govt-devanagari-title">
            राष्ट्रीय हवाई किराया मूल्य सूचकांक (APIx)
          </div>

          {/* Institutional Executive Summary */}
          <p className="govt-lead-text">
            An authoritative, high-frequency macroeconomic price index tracking domestic passenger tariff
            inflation across <strong>80 scheduled flight corridors</strong>. Standardized using a{' '}
            <strong>Modified Laspeyres Index</strong> weighted by official <strong>DGCA quarterly passenger traffic</strong>,
            incorporating robust statistical <strong>Interquartile Range (IQR)</strong> anomaly rejection.
          </p>

          {/* Primary Action Buttons */}
          <div className="govt-hero-buttons">
            <button className="govt-hero-btn-primary" onClick={() => navigate('/dashboard')}>
              <span>Open Live Calculator & Radar</span>
              <span>📊</span>
            </button>
            <button className="govt-hero-btn-secondary" onClick={() => navigate('/methodology')}>
              <span>Technical Methodology & Standards</span>
              <span>📄</span>
            </button>
          </div>

          {/* ── 4 Key National Economic KPIs ── */}
          <div className="govt-kpi-grid">
            <div className="govt-kpi-card">
              <div className="govt-kpi-label">COMPOSITE APIx (T+7)</div>
              <div className="govt-kpi-value">114.20 <small>PTS</small></div>
              <div className="govt-kpi-change up">▲ +14.20% vs Base (100.00)</div>
            </div>

            <div className="govt-kpi-card">
              <div className="govt-kpi-label">SCHEDULED CORRIDORS</div>
              <div className="govt-kpi-value">80 <small>ROUTES</small></div>
              <div className="govt-kpi-sub">Across 20 Primary Airport Hubs</div>
            </div>

            <div className="govt-kpi-card">
              <div className="govt-kpi-label">PASSENGER WEIGHT COVERAGE</div>
              <div className="govt-kpi-value">98.4%</div>
              <div className="govt-kpi-sub">DGCA Quarterly Verified Traffic</div>
            </div>

            <div className="govt-kpi-card">
              <div className="govt-kpi-label">STATISTICAL INTEGRITY</div>
              <div className="govt-kpi-value">IQR [Q1, Q3]</div>
              <div className="govt-kpi-sub">Dynamic Surge Outlier Rejection</div>
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          OFFICIAL MODULES & CAPABILITIES DIRECTORY
          ══════════════════════════════════════════════════════ */}
      <section className="govt-modules-section">
        <div className="govt-modules-inner">

          <div className="govt-section-header">
            <div className="govt-section-tag">SYSTEM MODULES</div>
            <h2 className="govt-section-title">Official Analytical & Regulatory Subsystems</h2>
            <p className="govt-section-desc">
              Six institutional modules designed for policymakers, economists, airline operators, and consumers.
            </p>
          </div>

          <div className="govt-cards-grid">
            {MODULES.map(m => (
              <div
                key={m.code}
                className="govt-module-card"
                onClick={() => navigate(m.path)}
                role="button"
                tabIndex={0}
              >
                <div className="govt-module-card-top">
                  <span className="govt-module-icon">{m.icon}</span>
                  <span className="govt-module-badge">{m.badge}</span>
                </div>

                <div className="govt-module-code">{m.code}</div>
                <h3 className="govt-module-title">{m.title}</h3>
                <p className="govt-module-desc">{m.desc}</p>

                <div className="govt-module-link">
                  <span>Access Module</span>
                  <span className="govt-arrow">→</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          METHODOLOGY COMPARISON OVERVIEW
          ══════════════════════════════════════════════════════ */}
      <section className="govt-table-section">
        <div className="govt-table-inner">
          <div className="govt-section-header" style={{ marginBottom: 24 }}>
            <div className="govt-section-tag">STATISTICAL BENCHMARK</div>
            <h2 className="govt-section-title">APIx Weighted Index vs. Naive Simple Average</h2>
          </div>

          <div className="govt-table-wrapper">
            <table className="govt-comparison-table">
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
                  <td className="highlight-cell">Weighted by official DGCA passenger share (DEL-BOM = ~4.8%)</td>
                </tr>
                <tr>
                  <td><strong>Dynamic Surge Anomaly Filtration</strong></td>
                  <td>None (distorted by single ₹45,000 predatory tickets)</td>
                  <td className="highlight-cell">Robust [Q1, Q3] + 1.5×IQR statistical trimming</td>
                </tr>
                <tr>
                  <td><strong>Booking Horizons Covered</strong></td>
                  <td>Single static date snapshot</td>
                  <td className="highlight-cell">5 Advance horizons (T+1, T+7, T+15, T+30, T+45)</td>
                </tr>
                <tr>
                  <td><strong>Policy & Antitrust Utility</strong></td>
                  <td>No market concentration or fuel elasticity tracking</td>
                  <td className="highlight-cell">Automated HHI &gt; 2500 alerts + ATF fuel shock simulation</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          OFFICIAL INSTITUTIONAL FOOTER
          ══════════════════════════════════════════════════════ */}
      <footer className="govt-footer">
        <div className="govt-footer-inner">
          <div className="govt-footer-main">
            <div>
              <div className="govt-footer-title">National Airfare Price Index of India (APIx)</div>
              <div className="govt-footer-desc">
                Developed in accordance with international price index standards (UN/ILO/IMF Consumer Price Index Manual)
                and DGCA civil aviation statistics guidelines.
              </div>
            </div>
            <div className="govt-footer-badges">
              <span className="govt-footer-pill">Base Year: 2012 / 2024 = 100.00</span>
              <span className="govt-footer-pill">Release Frequency: Daily at 00:00 IST</span>
            </div>
          </div>

          <div className="govt-footer-bottom">
            <div>© 2026 Directorate General of Civil Aviation (DGCA) & Ministry of Civil Aviation, Government of India.</div>
            <div>Built for National Economic Research & Aviation Transparency</div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Landing;
