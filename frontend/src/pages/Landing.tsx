import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface FeatureCardProps {
  icon: string;
  category: string;
  title: string;
  desc: string;
  badge: string;
  badgeColor: string;
  path: string;
  delay: number;
}

const FEATURES: FeatureCardProps[] = [
  {
    icon: '⚖',
    category: 'CORE METHODOLOGY',
    title: 'Modified Laspeyres Price Index',
    desc: 'Computes real-time national airfare indices weighted by official DGCA quarterly passenger traffic distributions across 80 marquee routes.',
    badge: 'Base 2012/2024 = 100',
    badgeColor: '#06B6D4',
    path: '/dashboard',
    delay: 0.1,
  },
  {
    icon: '🛡',
    category: 'STATISTICAL INTEGRITY',
    title: 'Robust IQR Outlier Filtration',
    desc: 'Mathematical [Q1, Q3] interquartile range boundaries filter out predatory last-seat fare spikes, ensuring true consumer price representation.',
    badge: 'Upper Bound = Q3 + 1.5×IQR',
    badgeColor: '#10B981',
    path: '/methodology',
    delay: 0.2,
  },
  {
    icon: '🗺',
    category: 'GEOSPATIAL TELEMETRY',
    title: 'Real-Time 80-Route Geospatial Radar',
    desc: 'Interactive GIS radar mapping domestic flight corridors across 20 airports with inflation-colored arcs and passenger density thickness.',
    badge: '5 Lead Horizons (T+1 to T+45)',
    badgeColor: '#3B82F6',
    path: '/dashboard',
    delay: 0.3,
  },
  {
    icon: '🏛',
    category: 'REGULATORY & POLICY',
    title: 'Antitrust & HHI Monopoly Analytics',
    desc: 'Automated Herfindahl-Hirschman Index market concentration scoring, pinpointing high-barrier monopoly routes for DGCA and CCI oversight.',
    badge: 'HHI > 2500 Alert System',
    badgeColor: '#EF4444',
    path: '/analysts',
    delay: 0.4,
  },
  {
    icon: '🔮',
    category: 'PREDICTIVE MODELING',
    title: 'ATF Fuel Shock Sensitivity Simulator',
    desc: 'Interactive macroeconomic engine simulating Aviation Turbine Fuel shocks (±50%) with carrier-specific cost pass-through elasticities.',
    badge: 'Elasticity η = 0.55 – 0.80',
    badgeColor: '#F59E0B',
    path: '/simulation',
    delay: 0.5,
  },
  {
    icon: '🛩',
    category: 'INDUSTRY BENCHMARKING',
    title: 'Carrier Fleet Intelligence Cockpit',
    desc: 'Deep operational profiles and pricing curves for IndiGo, Air India, SpiceJet, Akasa Air, and AI Express spanning 600+ active aircraft.',
    badge: '5 Fleets · 92% National Share',
    badgeColor: '#A78BFA',
    path: '/fleet',
    delay: 0.6,
  },
];

const Landing: React.FC = () => {
  const navigate = useNavigate();

  const scrollToFeatures = () => {
    const el = document.getElementById('features-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing-container">
      {/* ══════════════════════════════════════════════════════════════════
          HERO SECTION — SUNSET AIRPLANE BACKGROUND
          ══════════════════════════════════════════════════════════════════ */}
      <section className="hero-plane-section">
        {/* Background Image with Gradient Masks */}
        <div className="hero-plane-bg" />
        <div className="hero-plane-overlay" />

        {/* Floating Top Navbar */}
        <header className="hero-top-nav">
          <div className="hud-logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
            <span className="hud-logo-icon">✈</span>
            <span className="hud-logo-text">APIx</span>
            <span className="hud-badge">v2.0</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="btn"
              onClick={() => navigate('/methodology')}
              style={{ display: 'none', md: 'block' } as any}
            >
              Methodology
            </button>
            <motion.button
              className="btn btn-primary"
              onClick={() => navigate('/dashboard')}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              style={{
                background: 'linear-gradient(135deg, #06B6D4 0%, #0284C7 100%)',
                color: '#030712',
                fontWeight: 800,
                border: 'none',
                padding: '10px 20px',
                borderRadius: '10px',
                boxShadow: '0 0 25px rgba(6, 182, 212, 0.45)',
              }}
            >
              ENTER FLIGHT DECK →
            </motion.button>
          </div>
        </header>

        {/* Centered Hero Content */}
        <div className="hero-center-content">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="hero-badge-pill"
          >
            <span className="live-dot" />
            LIVE TELEMETRY · 80 ROUTES · 5 CARRIERS · DGCA WEIGHTED
          </motion.div>

          <motion.h1
            className="hero-title-main"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.1, ease: 'easeOut' }}
          >
            <span className="hero-title-icon">✈</span>
            <span className="hero-title-gradient">APIx</span>
          </motion.h1>

          <motion.div
            className="hero-tagline"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
          >
            National Airfare Price Index & Aviation Intelligence Platform
          </motion.div>

          <motion.p
            className="hero-description"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35 }}
          >
            A high-frequency macroeconomic price index tracking Indian domestic airfares using
            <strong> Modified Laspeyres Passenger Weighting</strong>, <strong>IQR Outlier Filtration</strong>,
            and automated <strong>HHI Market Concentration Surveillance</strong> across 20 airports.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            className="hero-cta-group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
          >
            <motion.button
              className="hero-cta-primary"
              onClick={() => navigate('/dashboard')}
              whileHover={{ scale: 1.05, boxShadow: '0 0 35px rgba(6, 182, 212, 0.6)' }}
              whileTap={{ scale: 0.96 }}
            >
              <span>🚀</span> Launch Interactive Dashboard
            </motion.button>

            <motion.button
              className="hero-cta-secondary"
              onClick={() => navigate('/analysts')}
              whileHover={{ scale: 1.05, background: 'rgba(255, 255, 255, 0.15)' }}
              whileTap={{ scale: 0.96 }}
            >
              <span>🏛</span> Regulatory Intelligence
            </motion.button>
          </motion.div>
        </div>

        {/* Scroll down prompt */}
        <motion.div
          className="hero-scroll-indicator"
          onClick={scrollToFeatures}
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <span>EXPLORE 6 INTELLIGENCE MODULES</span>
          <div className="scroll-arrow">▼</div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FEATURES SECTION — EARTH AT NIGHT SMOOTH TRANSITION
          ══════════════════════════════════════════════════════════════════ */}
      <section id="features-section" className="earth-features-section">
        {/* Deep space & Earth at Night Background with seamless black blends */}
        <div className="earth-bg-layer" />
        <div className="earth-vignette-layer" />
        <div className="earth-gradient-top" />
        <div className="earth-gradient-bottom" />

        <div className="earth-content-wrap">
          {/* Section Heading */}
          <div className="features-header-block">
            <div className="features-mini-tag">✦ SYSTEM CAPABILITIES</div>
            <h2 className="features-main-title">
              6 Core Aviation Intelligence Engines
            </h2>
            <p className="features-subtitle">
              Engineered for precision macroeconomic indexing, predatory surge monitoring, and antitrust transparency.
            </p>
          </div>

          {/* 6 Glassmorphism Cards Grid */}
          <div className="glass-features-grid">
            {FEATURES.map((feat, idx) => (
              <motion.div
                key={idx}
                className="glass-feature-card"
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: feat.delay }}
                whileHover={{
                  y: -6,
                  borderColor: feat.badgeColor,
                  boxShadow: `0 20px 40px -10px ${feat.badgeColor}33`,
                }}
                onClick={() => navigate(feat.path)}
              >
                {/* Glow pill badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span
                    className="glass-badge-pill"
                    style={{
                      color: feat.badgeColor,
                      background: `${feat.badgeColor}18`,
                      borderColor: `${feat.badgeColor}40`,
                    }}
                  >
                    {feat.badge}
                  </span>
                  <span className="glass-card-icon" style={{ textShadow: `0 0 20px ${feat.badgeColor}` }}>
                    {feat.icon}
                  </span>
                </div>

                <div className="glass-card-category" style={{ color: feat.badgeColor }}>
                  {feat.category}
                </div>

                <h3 className="glass-card-title">{feat.title}</h3>

                <p className="glass-card-desc">{feat.desc}</p>

                {/* Card footer CTA */}
                <div className="glass-card-footer">
                  <span className="glass-launch-text" style={{ color: feat.badgeColor }}>
                    Launch Engine <span>→</span>
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom Callout Banner */}
          <motion.div
            className="bottom-cockpit-banner"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="banner-glow-orb" />
            <div className="banner-content">
              <div className="banner-tag">🇮🇳 SMART INDIA HACKATHON 2026</div>
              <h3 className="banner-title">Ready to explore real-time domestic airfare telemetry?</h3>
              <p className="banner-desc">
                Access live 80-route pricing dynamics, interactive elasticity simulators, and antitrust HHI market surveillance.
              </p>
              <motion.button
                className="btn btn-primary"
                onClick={() => navigate('/dashboard')}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                style={{
                  background: 'linear-gradient(135deg, #06B6D4 0%, #0284C7 100%)',
                  color: '#030712',
                  fontSize: '1rem',
                  fontWeight: 900,
                  padding: '14px 36px',
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 0 30px rgba(6, 182, 212, 0.5)',
                }}
              >
                ENTER COCKPIT NOW ✈
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
