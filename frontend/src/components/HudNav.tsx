import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../App';

const TABS = [
  { label: '✈ Calculator',      path: '/dashboard' },
  { label: '∑ Maths & Stats',   path: '/methodology' },
  { label: '⚖ Weight Allocation', path: '/weights' },
];

const HudNav: React.FC = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { dark, toggle } = useTheme();

  return (
    <nav className="hud-nav">
      {/* Logo */}
      <div className="hud-logo">
        <span className="hud-logo-icon">✈</span>
        <span className="hud-logo-text">APIx</span>
        <span className="hud-badge">v2.0</span>
      </div>

      {/* Tabs */}
      <div className="hud-nav-tabs">
        {TABS.map(tab => (
          <button
            key={tab.path}
            className={`hud-tab${location.pathname === tab.path ? ' active' : ''}`}
            onClick={() => navigate(tab.path)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="hud-actions">
        <button className="btn" onClick={toggle} title="Toggle theme">
          {dark ? '☀ Light' : '🌙 Dark'}
        </button>
        <button className="btn" onClick={() => navigate('/')}>
          ← Hub
        </button>
      </div>
    </nav>
  );
};

export default HudNav;
