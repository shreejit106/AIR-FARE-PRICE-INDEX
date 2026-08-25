import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const FEATURES = [
  {
    icon: '⚖',
    color: '#8B5CF6',
    title: 'Passenger Weights',
    desc: 'Integrates DGCA traffic data to weight routes by quarterly passenger shares — DEL-BOM counts more than Chandigarh-Jaipur.',
  },
  {
    icon: '▼',
    color: '#F59E0B',
    title: 'IQR Outlier Removal',
    desc: 'Eliminates fare spikes using Interquartile Range limits, protecting the index from last-minute surge price distortions.',
  },
  {
    icon: '✈',
    color: '#06B6D4',
    title: 'Live Flight Map',
    desc: 'Maps price trends dynamically across 80 domestic routes with inflation-coloured arcs and directional flow indicators.',
  },
  {
    icon: '📈',
    color: '#10B981',
    title: 'MoSPI CPI Sync',
    desc: 'Correlates domestic airfare indexes directly with official Indian Consumer Price Index datasets for macro validation.',
  },
];

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [gifDone, setGifDone] = useState(false);

  // Auto-transition the landing animation after 4.8s
  React.useEffect(() => {
    const t = setTimeout(() => setGifDone(true), 4800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="landing">
      {/* Top bar */}
      <div style={{ width: '100%', maxWidth: 1100, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div className="hud-logo" style={{ gap: 10 }}>
          <span className="hud-logo-icon" style={{ fontSize: '1.4rem' }}>✈</span>
          <span className="hud-logo-text" style={{ fontSize: '1.3rem' }}>APIx</span>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
          ENTER FLIGHT DECK →
        </button>
      </div>

      {/* GIF Hero (fades out) */}
      {!gifDone && (
        <motion.div
          className="landing-hero"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: 3.8, duration: 1 }}
          onAnimationComplete={() => setGifDone(true)}
        >
          <img
            className="landing-gif"
            src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMTh5dmwxbXpwNnM5dG5wZTFhM21idjAydTFkMGoxOHpsMzAxeTV4YSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o85xAYQLOh8T953aM/giphy.gif"
            alt="Aircraft approaching runway"
          />
          <div className="landing-runway-text">COCKPIT HUD: APPROACHING RUNWAY 27...</div>
        </motion.div>
      )}

      {/* Title Card (fades in after GIF) */}
      {gifDone && (
        <motion.div
          style={{ width: '100%', maxWidth: 1100, textAlign: 'center', marginBottom: 60 }}
          initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="landing-title">
            <span style={{ color: 'var(--cyan)', filter: 'drop-shadow(0 0 12px rgba(6,182,212,0.4))' }}>✈</span>
            APIx
          </div>
          <div className="landing-subtitle">Indian Airfare Price Index & Analytics</div>
          <div className="landing-desc">
            A real-time aviation intelligence platform utilizing modified Laspeyres passenger-weighted
            indexing to track domestic fare cost structures across 20 airports and 80 routes.
          </div>
          <motion.button
            className="btn btn-primary"
            style={{ fontSize: '0.9rem', padding: '12px 32px', marginBottom: '3rem' }}
            onClick={() => navigate('/dashboard')}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            ENTER FLIGHT DECK →
          </motion.button>
        </motion.div>
      )}

      {/* Feature cards */}
      <motion.div
        style={{ width: '100%', maxWidth: 1100 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: gifDone ? 1 : 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--cyan)', marginBottom: 8 }}>
            System Capabilities
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text)', letterSpacing: -0.5 }}>
            Aviation & Financial Intelligence Overview
          </div>
        </div>

        <div className="landing-features">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              className="feature-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: gifDone ? 1 : 0, y: gifDone ? 0 : 20 }}
              transition={{ delay: 0.1 * i + 0.4, duration: 0.5 }}
            >
              <div className="feature-icon" style={{ color: f.color }}>{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Landing;
