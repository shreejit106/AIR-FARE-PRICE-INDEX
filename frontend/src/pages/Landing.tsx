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
    delay: 0.05,
  },
  {
    icon: '🛡',
    category: 'STATISTICAL INTEGRITY',
    title: 'Robust IQR Outlier Filtration',
    desc: 'Mathematical [Q1, Q3] interquartile range boundaries filter out predatory last-seat fare spikes, ensuring true consumer price representation.',
    badge: 'Upper Bound = Q3 + 1.5×IQR',
    badgeColor: '#10B981',
    path: '/methodology',
    delay: 0.1,
  },
  {
    icon: '🗺',
    category: 'GEOSPATIAL TELEMETRY',
    title: 'Real-Time 80-Route Geospatial Radar',
    desc: 'Interactive GIS radar mapping domestic flight corridors across 20 airports with inflation-colored arcs and passenger density thickness.',
    badge: '5 Lead Horizons (T+1 to T+45)',
    badgeColor: '#3B82F6',
    path: '/dashboard',
    delay: 0.15,
  },
  {
    icon: '🏛',
    category: 'REGULATORY & POLICY',
    title: 'Antitrust & HHI Monopoly Analytics',
    desc: 'Automated Herfindahl-Hirschman Index market concentration scoring, pinpointing high-barrier monopoly routes for DGCA and CCI oversight.',
    badge: 'HHI > 2500 Alert System',
    badgeColor: '#EF4444',
    path: '/analysts',
    delay: 0.2,
  },
  {
    icon: '🔮',
    category: 'PREDICTIVE MODELING',
    title: 'ATF Fuel Shock Sensitivity Simulator',
    desc: 'Interactive macroeconomic engine simulating Aviation Turbine Fuel shocks (±50%) with carrier-specific cost pass-through elasticities.',
    badge: 'Elasticity η = 0.55 – 0.80',
    badgeColor: '#F59E0B',
    path: '/simulation',
    delay: 0.25,
  },
  {
    icon: '🛩',
    category: 'INDUSTRY BENCHMARKING',
    title: 'Carrier Fleet Intelligence Cockpit',
    desc: 'Deep operational profiles and pricing curves for IndiGo, Air India, SpiceJet, Akasa Air, and AI Express spanning 600+ active aircraft.',
    badge: '5 Fleets · 92% National Share',
    badgeColor: '#A78BFA',
    path: '/fleet',
    delay: 0.3,
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

      {/* ══════════════════════════════════════════════════════
          HERO SECTION — SOBER, CINEMATIC & INSTANT
          ══════════════════════════════════════════════════════ */}
      <section className="hero-plane-section">

        {/* Plane Background with subtle soft focus for text readability */}
        <div className="hero-plane-bg sober-hero-bg" />

        {/* Rich dark vignette overlay */}
        <div className="hero-plane-overlay sober-hero-overlay" />

        {/* Top Navbar */}
        <header className="hero-top-nav">
          <div className="hud-logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
            <span className="hud-logo-icon">✈</span>
            <span className="hud-logo-text">APIx</span>
            <span className="hud-badge">v2.0</span>
          </div>

          <button
            className="hero-nav-cta-btn"
            onClick={() => navigate('/dashboard')}
          >
            Enter Flight Deck →
          </button>
        </header>

        {/* Center Content: Title Card + CTAs */}
        <div className="hero-center-content">
          {/* Live Status Pill */}
          <motion.div
            className="hero-badge-pill"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="live-dot" />
            <span>CIVIL AVIATION ECONOMIC INTELLIGENCE</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            className="hero-title-main"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <span className="hero-title-icon">✈</span>
            <span className="hero-title-gradient">APIx</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="hero-tagline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            Airfare Price Index of India
          </motion.p>

          {/* Description */}
          <motion.p
            className="hero-description"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Real-time macroeconomic intelligence platform tracking domestic airfare inflation across{' '}
            <strong>80 marquee routes</strong>, weighted by official <strong>DGCA quarterly passenger volume</strong>{' '}
            using a <strong>Modified Laspeyres Index</strong> with robust statistical IQR outlier filtration.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="hero-cta-group"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            <button
              className="hero-cta-primary"
              onClick={() => navigate('/dashboard')}
            >
              <span>Launch Flight Deck</span>
              <span style={{ fontSize: '1.1rem' }}>✈</span>
            </button>

            <button
              className="hero-cta-secondary"
              onClick={() => navigate('/methodology')}
            >
              <span>Read Methodology</span>
              <span>📐</span>
            </button>
          </motion.div>
        </div>

        {/* Scroll Down Indicator */}
        <div
          className="hero-scroll-indicator"
          onClick={scrollToFeatures}
          role="button"
          tabIndex={0}
        >
          <span>EXPLORE PLATFORM</span>
          <span className="scroll-arrow">▼</span>
        </div>

      </section>

      {/* ══════════════════════════════════════════════════════
          FEATURES SECTION — CLEAN BLACK & BLUE TEXTURE
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
              ✦ CORE ARCHITECTURE
            </div>
            <h2 className="features-main-title">
              Built for Civil Aviation Intelligence
            </h2>
            <p className="features-subtitle">
              Engineered for policymakers, economists, and airline analysts to monitor
              real-time fare dynamics, antitrust concentration, and fuel shock elasticities.
            </p>
          </div>

          {/* 6 Glassmorphism Feature Cards Grid */}
          <div className="glass-features-grid">
            {FEATURES.map((feat) => (
              <div
                key={feat.title}
                className="glass-feature-card"
                onClick={() => navigate(feat.path)}
                role="button"
                tabIndex={0}
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
              </div>
            ))}
          </div>

          {/* Bottom Call to Action Card */}
          <div className="features-bottom-cta-card">
            <div className="cta-card-content">
              <span className="cta-card-tag">DGCA & MOSPI METHODOLOGY</span>
              <h3 className="cta-card-title">
                Experience the Live Airfare Calculator
              </h3>
              <p className="cta-card-desc">
                Access real-time price trajectories, 80-route geospatial flight radars, and carrier yield curves.
              </p>
            </div>
            <button
              className="cta-card-button"
              onClick={() => navigate('/dashboard')}
            >
              <span>Launch Flight Deck</span>
              <span>✈</span>
            </button>
          </div>

        </div>
      </section>

    </div>
  );
};

export default Landing;
