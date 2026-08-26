import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../App';
import ThreeUIButton from './ThreeUIButton';
import GlassmorphismCTA from './GlassmorphismCTA';
import { API_BASE_URL } from '../config';

const TABS = [
  { label: '✈ Calculator',       path: '/dashboard'   },
  { label: '📐 Methodology',     path: '/methodology' },
  { label: '🏛 For Analysts',    path: '/analysts'    },
  { label: '🔮 Simulation',      path: '/simulation'  },
  { label: '🛩 Fleet & Carriers',path: '/fleet'       },
];

const API = API_BASE_URL;

const HudNav: React.FC = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { theme, setTheme } = useTheme();
  const [syncing, setSyncing] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const themeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setThemeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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
          <ThreeUIButton
            key={tab.path}
            active={location.pathname === tab.path}
            onClick={() => navigate(tab.path)}
          >
            {tab.label}
          </ThreeUIButton>
        ))}
      </div>

      {/* Actions */}
      <div className="hud-actions">
        <GlassmorphismCTA 
          onClick={handleSync} 
          disabled={syncing}
        >
          {syncing ? '↻ Scraping...' : 'Fetch Live Fares'}
        </GlassmorphismCTA>
        <div ref={themeRef} style={{ position: 'relative' }}>
          <ThreeUIButton onClick={() => setThemeOpen(!themeOpen)} title="Select theme">
            Theme: {theme.charAt(0).toUpperCase() + theme.slice(1)} ▼
          </ThreeUIButton>
          {themeOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              background: 'var(--surface-glass)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              minWidth: '140px',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              zIndex: 1000
            }}>
              <ThreeUIButton active={theme === 'dark'} onClick={() => { setTheme('dark'); setThemeOpen(false); }}>🌙 Dark</ThreeUIButton>
              <ThreeUIButton active={theme === 'light'} onClick={() => { setTheme('light'); setThemeOpen(false); }}>☀ Light</ThreeUIButton>
              <ThreeUIButton active={theme === 'intermediate'} onClick={() => { setTheme('intermediate'); setThemeOpen(false); }}>☁ Inter</ThreeUIButton>
              <ThreeUIButton active={theme === 'coastal'} onClick={() => { setTheme('coastal'); setThemeOpen(false); }}>🌊 Coastal</ThreeUIButton>
            </div>
          )}
        </div>
        <ThreeUIButton onClick={() => navigate('/')}>
          ← Hub
        </ThreeUIButton>
      </div>
    </nav>
  );
};

export default HudNav;
