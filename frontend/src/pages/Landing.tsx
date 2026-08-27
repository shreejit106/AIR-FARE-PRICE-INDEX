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
  // 'hud' -> Cockpit telemetry boot, 'content' -> blurred hero + active flight deck
  const [phase, setPhase] = useState<'hud' | 'content'>('hud');
  const [altimeter, setAltimeter] = useState(0);
  const [hudStep, setHudStep] = useState(1);

  // Altimeter count-up and HUD telemetry sequence
  useEffect(() => {
    if (phase !== 'hud') return;

    // Altimeter tick up
    const altInterval = setInterval(() => {
      setAltimeter(prev => {
        if (prev >= 34000) {
          clearInterval(altInterval);
          return 34000;
        }
        return prev + 1700;
      });
    }, 100);

    // Step progress
    const s1 = setTimeout(() => setHudStep(2), 600);
    const s2 = setTimeout(() => setHudStep(3), 1200);
    const s3 = setTimeout(() => setHudStep(4), 1800);
    const s4 = setTimeout(() => setPhase('content'), 2600);

    return () => {
      clearInterval(altInterval);
      clearTimeout(s1);
      clearTimeout(s2);
      clearTimeout(s3);
      clearTimeout(s4);
    };
  }, [phase]);

  const skipIntro = () => {
    setAltimeter(34000);
    setHudStep(4);
    setPhase('content');
  };

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

        {/* PLANE BACKGROUND — crystal clear during HUD, softly blurred during content */}
        <motion.div
          className="hero-plane-bg"
          animate={{ filter: phase === 'content' ? 'blur(12px) brightness(0.55)' : 'blur(0px) brightness(0.85)' }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        />

        {/* Dark gradient overlay */}
        <motion.div
          className="hero-plane-overlay"
          animate={{ opacity: phase === 'content' ? 1 : 0.4 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        />

        {/* ── CONCEPT A: COCKPIT HUD TELEMETRY CALIBRATION LOADER ── */}
        <AnimatePresence>
          {phase === 'hud' && (
            <motion.div
              key="hud-loader"
              className="cockpit-hud-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
            >
              {/* Cockpit HUD Viewport Border */}
              <div className="hud-corner hud-top-left" />
              <div className="hud-corner hud-top-right" />
              <div className="hud-corner hud-bottom-left" />
              <div className="hud-corner hud-bottom-right" />

              {/* Center Radar Scanner */}
              <div className="hud-center-radar">
                <div className="radar-circle radar-outer" />
                <div className="radar-circle radar-mid" />
                <div className="radar-circle radar-inner" />
                <div className="radar-crosshair-h" />
                <div className="radar-crosshair-v" />
                <div className="radar-sweep-beam" />
                {/* Simulated carrier flight blips */}
                <div className="radar-blip blip-indigo" title="6E DEL-BOM" />
                <div className="radar-blip blip-airindia" title="AI BOM-BLR" />
                <div className="radar-blip blip-spicejet" title="SG DEL-HYD" />
                <div className="radar-blip blip-akasa" title="QP BOM-GOI" />
                <div className="radar-center-plane">✈</div>
              </div>

              {/* Altimeter & Speed HUD Readout */}
              <div className="hud-telemetry-panel">
                <div className="hud-telemetry-badge">
                  <span className="live-dot" /> COCKPIT TELEMETRY INITIALIZATION
                </div>
                <div className="hud-metrics-row">
                  <div className="hud-metric-box">
                    <span className="hud-metric-label">ALTITUDE</span>
                    <span className="hud-metric-value">{altimeter.toLocaleString()} <small>FT</small></span>
                  </div>
                  <div className="hud-metric-box">
                    <span className="hud-metric-label">AIRSPEED</span>
                    <span className="hud-metric-value">460 <small>KTS</small></span>
                  </div>
                  <div className="hud-metric-box">
                    <span className="hud-metric-label">CORRIDORS</span>
                    <span className="hud-metric-value">80 <small>ROUTES</small></span>
                  </div>
                </div>

                {/* Monospace diagnostic boot steps */}
                <div className="hud-log-stream">
                  <div className={`hud-log-line ${hudStep >= 1 ? 'active' : ''}`}>
                    <span className="hud-log-tick">{hudStep >= 1 ? '✓' : '○'}</span>
                    <span>[01/04] Ingesting 80 DGCA Domestic Flight Corridors...</span>
                  </div>
                  <div className={`hud-log-line ${hudStep >= 2 ? 'active' : ''}`}>
                    <span className="hud-log-tick">{hudStep >= 2 ? '✓' : '○'}</span>
                    <span>[02/04] Calibrating Modified Laspeyres Base (2024=100)...</span>
                  </div>
                  <div className={`hud-log-line ${hudStep >= 3 ? 'active' : ''}`}>
                    <span className="hud-log-tick">{hudStep >= 3 ? '✓' : '○'}</span>
                    <span>[03/04] Engaging Robust [Q1, Q3] IQR Outlier Rejection...</span>
                  </div>
                  <div className={`hud-log-line ${hudStep >= 4 ? 'active' : ''}`}>
                    <span className="hud-log-tick">{hudStep >= 4 ? '✓' : '○'}</span>
                    <span>[04/04] Multi-Horizon Yield Curves Online (T+1 to T+45)...</span>
                  </div>
                </div>

                {/* Skip button */}
                <button className="hud-skip-btn" onClick={skipIntro}>
                  Skip Intro ⏭
                </button>
              </div>
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
                    cursor: 'pointer',
                    boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)',
                  }}
                >
                  Enter Flight Deck →
                </motion.button>
              </motion.header>

              {/* Center Content: Title Card + CTAs */}
              <motion.div
                key="center-content"
                className="hero-center-content"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.1, ease: 'easeOut' }}
              >
                {/* Live Pill Badge */}
                <motion.div
                  className="hero-badge-pill"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <span className="live-dot" />
                  <span>NATIONAL CIVIL AVIATION TELEMETRY</span>
                </motion.div>

                {/* Big Title: Plane Icon + APIx Gradient */}
                <h1 className="hero-title-main">
                  <span className="hero-title-icon">✈</span>
                  <span className="hero-title-gradient">APIx</span>
                </h1>

                {/* Gold Tagline */}
                <p className="hero-tagline">
                  Airfare Price Index of India
                </p>

                {/* Description */}
                <p className="hero-description">
                  Real-time macroeconomic intelligence platform tracking domestic airfare inflation across{' '}
                  <strong>80 routes</strong>, weighted by official <strong>DGCA passenger volume</strong>{' '}
                  using a <strong>Modified Laspeyres Index</strong> with robust IQR outlier filtration.
                </p>

                {/* CTA Buttons */}
                <div className="hero-cta-group">
                  <motion.button
                    className="hero-cta-primary"
                    onClick={() => navigate('/dashboard')}
                    whileHover={{ scale: 1.05, boxShadow: '0 0 45px rgba(6,182,212,0.8)' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span>Launch Flight Deck</span>
                    <span style={{ fontSize: '1.2rem' }}>✈</span>
                  </motion.button>

                  <motion.button
                    className="hero-cta-secondary"
                    onClick={() => navigate('/methodology')}
                    whileHover={{ scale: 1.03, background: 'rgba(255,255,255,0.1)' }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <span>Read Methodology</span>
                    <span>📐</span>
                  </motion.button>
                </div>
              </motion.div>

              {/* Scroll Down Indicator */}
              <motion.div
                key="scroll"
                className="hero-scroll-indicator"
                onClick={scrollToFeatures}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.4 }}
              >
                <span>EXPLORE CAPABILITIES</span>
                <span className="scroll-arrow">▼</span>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </section>

      {/* ══════════════════════════════════════════════════════
          ATMOSPHERIC ALTITUDE DESCENT STRIP (TRANSITION LAYER)
          ══════════════════════════════════════════════════════ */}
      <div className="altitude-descent-strip">
        <div className="altitude-descent-inner">
          <span className="alt-track-node">✈ FL340 CRUISE</span>
          <span className="alt-track-line" />
          <span className="alt-track-node">⚡ DESCENT VECTOR</span>
          <span className="alt-track-line" />
          <span className="alt-track-node">🗺 GROUND RADAR MATRIX</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          FEATURES SECTION — LAYERED BLACK & BLUE TEXTURE
          ══════════════════════════════════════════════════════ */}
      <section id="features-section" className="earth-features-section">

        {/* 7-Layer Deep Black & Blue Texture Background */}
        <div className="bluebk-base" />
        <div className="bluebk-grid" />
        <div className="bluebk-radial-1" />
        <div className="bluebk-radial-2" />
        <div className="bluebk-noise" />
        <div className="bluebk-top-fade" />
        <div className="bluebk-bottom-fade" />

        {/* Features Content Container */}
        <div className="earth-content-wrap">

          {/* Section Header */}
          <div className="features-header-block">
            <div className="features-mini-tag">
              ✦ PLATFORM CAPABILITIES
            </div>
            <h2 className="features-main-title">
              Built for Civil Aviation Intelligence
            </h2>
            <p className="features-subtitle">
              Engineered from the ground up for policymakers, economists, and airline analysts.
              Six dedicated intelligence modules powering the future of airfare transparency.
            </p>
          </div>

          {/* 6 Glassmorphism Feature Cards Grid */}
          <div className="glass-features-grid">
            {FEATURES.map((feat) => (
              <motion.div
                key={feat.title}
                className="glass-feature-card"
                onClick={() => navigate(feat.path)}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: feat.delay, ease: 'easeOut' }}
                whileHover={{
                  y: -8,
                  borderColor: 'rgba(6, 182, 212, 0.45)',
                  boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(6, 182, 212, 0.25)',
                }}
              >
                {/* Top Row: Icon + Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div className="glass-card-icon">
                    {feat.icon}
                  </div>
                  <span
                    className="glass-badge-pill"
                    style={{
                      color: feat.badgeColor,
                      borderColor: `${feat.badgeColor}40`,
                      background: `${feat.badgeColor}15`,
                    }}
                  >
                    {feat.badge}
                  </span>
                </div>

                {/* Category mini-tag */}
                <div className="glass-card-category">
                  {feat.category}
                </div>

                {/* Title */}
                <h3 className="glass-card-title">
                  {feat.title}
                </h3>

                {/* Description */}
                <p className="glass-card-desc">
                  {feat.desc}
                </p>

                {/* Footer link arrow */}
                <div className="glass-card-footer">
                  <span>Explore module</span>
                  <span className="glass-card-arrow">→</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom Call to Action Card */}
          <motion.div
            className="features-bottom-cta-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="cta-card-content">
              <span className="cta-card-tag">DGCA & MOSPI COMPLIANT</span>
              <h3 className="cta-card-title">
                Experience the Live Airfare Calculator
              </h3>
              <p className="cta-card-desc">
                Access real-time price trends, 80-route geospatial flight radars, and carrier yield curves now.
              </p>
            </div>
            <motion.button
              className="cta-card-button"
              onClick={() => navigate('/dashboard')}
              whileHover={{ scale: 1.05, boxShadow: '0 0 35px rgba(6,182,212,0.8)' }}
              whileTap={{ scale: 0.95 }}
            >
              <span>Launch Live Dashboard</span>
              <span>✈</span>
            </motion.button>
          </motion.div>

        </div>
      </section>

    </div>
  );
};

export default Landing;
