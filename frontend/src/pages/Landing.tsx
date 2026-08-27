import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

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
  // Phase: 'plane' = full-screen plane only, 'content' = blurred plane + content
  const [phase, setPhase] = useState<'plane' | 'content'>('plane');

  useEffect(() => {
    const timer = setTimeout(() => setPhase('content'), 3200);
    return () => clearTimeout(timer);
  }, []);

  const scrollToFeatures = () => {
    const el = document.getElementById('features-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing-container">

      {/* ══════════════════════════════════════════════════════
          HERO SECTION
          ══════════════════════════════════════════════════════ */}
      <section className="hero-plane-section">

        {/* PLANE BACKGROUND — always present, blurs after phase change */}
        <motion.div
          className="hero-plane-bg"
          animate={{ filter: phase === 'content' ? 'blur(12px) brightness(0.55)' : 'blur(0px) brightness(1)' }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        />

        {/* Dark gradient overlay — strengthens when content appears */}
        <motion.div
          className="hero-plane-overlay"
          animate={{ opacity: phase === 'content' ? 1 : 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        />

        {/* Phase 'plane': just show the plane for a clean cinematic moment */}
        <AnimatePresence>
          {phase === 'plane' && (
            <motion.div
              key="plane-label"
              className="hero-plane-label"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="hero-plane-hud-text">COCKPIT VIEW — RUNWAY APPROACH ▌</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase 'content': Floating nav + title card fade in */}
        <AnimatePresence>
          {phase === 'content' && (
            <>
              {/* Floating Top Navbar */}
              <motion.header
                key="nav"
                className="hero-top-nav"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              >
                <div className="hud-logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
                  <span className="hud-logo-icon">✈</span>
                  <span className="hud-logo-text">APIx</span>
                  <span className="hud-badge">v2.0</span>
                </div>
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
              </motion.header>

              {/* Centered Hero Content */}
              <motion.div
                key="hero-content"
                className="hero-center-content"
                initial={{ opacity: 0, y: 40, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
              >
                <motion.div
                  className="hero-badge-pill"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                >
                  <span className="live-dot" />
                  LIVE TELEMETRY · 80 ROUTES · 5 CARRIERS · DGCA WEIGHTED
                </motion.div>

                <h1 className="hero-title-main">
                  <span className="hero-title-icon">✈</span>
                  <span className="hero-title-gradient">APIx</span>
                </h1>

                <div className="hero-tagline">
                  National Airfare Price Index & Aviation Intelligence Platform
                </div>

                <p className="hero-description">
                  A high-frequency macroeconomic price index tracking Indian domestic airfares using{' '}
                  <strong>Modified Laspeyres Passenger Weighting</strong>,{' '}
                  <strong>IQR Outlier Filtration</strong>, and automated{' '}
                  <strong>HHI Market Concentration Surveillance</strong> across 20 airports.
                </p>

                <div className="hero-cta-group">
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
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    <span>🏛</span> Regulatory Intelligence
                  </motion.button>
                </div>
              </motion.div>

              {/* Scroll Down */}
              <motion.div
                key="scroll-hint"
                className="hero-scroll-indicator"
                onClick={scrollToFeatures}
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                initial={{ opacity: 0 }}
                // @ts-ignore
                whileInView={{ opacity: 1 }}
              >
                <span>EXPLORE 6 INTELLIGENCE MODULES</span>
                <div className="scroll-arrow">▼</div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </section>

      {/* ══════════════════════════════════════════════════════
          FEATURES SECTION — Deep Black & Blue Layered Texture
          ══════════════════════════════════════════════════════ */}
      <section id="features-section" className="earth-features-section">
        {/* Layered black-blue texture background layers */}
        <div className="bluebk-base" />
        <div className="bluebk-grid" />
        <div className="bluebk-radial-1" />
        <div className="bluebk-radial-2" />
        <div className="bluebk-noise" />
        <div className="bluebk-top-fade" />
        <div className="bluebk-bottom-fade" />

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

                <div className="glass-card-footer">
                  <span className="glass-launch-text" style={{ color: feat.badgeColor }}>
                    Launch Engine <span>→</span>
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom Banner */}
          <motion.div
            className="bottom-cockpit-banner"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
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
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
