import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../App';

const TABS = [
  { label: '✈ Calculator',      path: '/dashboard' },
  { label: '∑ Maths & Stats',   path: '/methodology' },
  { label: '⚖ Weight Allocation', path: '/weights' },
];

const API = 'http://localhost:8000';

const HudNav: React.FC = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { dark, toggle } = useTheme();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`${API}/api/sync`, { method: 'POST' });
      if (res.ok) {
        // Optional: you can force a reload or trigger a global state update to refresh Dashboard
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

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
        <button 
          className="btn" 
          onClick={handleSync} 
          disabled={syncing}
          style={{ backgroundColor: syncing ? '#64748B' : '#10B981', color: '#fff', border: 'none' }}
        >
          {syncing ? '↻ Scraping...' : 'Fetch Live Fares'}
        </button>
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
