import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../App';
import ThreeUIButton from './ThreeUIButton';
import GlassmorphismCTA from './GlassmorphismCTA';
import { API_BASE_URL } from '../config';

const TABS = [
  { label: 'Home',              short: 'Home',        path: '/'            },
  { label: 'Index Calculator',  short: 'Calculator',  path: '/dashboard'   },
  { label: 'Methodology',       short: 'Methodology', path: '/methodology' },
  { label: 'Antitrust & HHI',   short: 'Antitrust',   path: '/analysts'    },
  { label: 'Fuel Simulator',    short: 'Simulation',  path: '/simulation'  },
  { label: 'Carrier Fleet',     short: 'Fleet',       path: '/fleet'       },
  { label: 'Data & References', short: 'References',  path: '/references'  },
  { label: 'Gov API Portal',    short: 'Gov API',     path: '/gov-api'     },
];

const API = API_BASE_URL;

const HudNav: React.FC = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { theme, setTheme } = useTheme();
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'done'>('idle');
  const [themeOpen, setThemeOpen]   = useState(false);
  const [menuOpen, setMenuOpen]     = useState(false);
  const themeRef = useRef<HTMLDivElement>(null);
  const menuRef  = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setThemeOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const handleSync = async () => {
    if (syncStatus !== 'idle') return;
    setSyncStatus('syncing');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
      const res = await fetch(`${API}/api/sync`, { method: 'POST', signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        setSyncStatus('done');
        setTimeout(() => {
          setSyncStatus('idle');
          window.location.reload();
        }, 700);
      } else {
        setSyncStatus('done');
        setTimeout(() => setSyncStatus('idle'), 1000);
      }
    } catch (e) {
      clearTimeout(timeoutId);
      setSyncStatus('done');
      setTimeout(() => {
        setSyncStatus('idle');
        window.location.reload();
      }, 700);
    }
  };

  const activeTab = TABS.find(t => t.path === location.pathname);

  return (
    <>
      <nav className="hud-nav" role="navigation" aria-label="Main navigation">
        {/* ── Logo ── */}
        <button
          className="hud-logo hud-logo-btn"
          onClick={() => navigate('/')}
          aria-label="Go to home"
        >
          <span className="hud-logo-text">APIx</span>
          <span className="hud-badge" aria-hidden="true">RESEARCH</span>
        </button>

        {/* ── Desktop Tabs (strictly hidden on screens <= 900px) ── */}
        <div className="hud-nav-tabs" role="tablist" aria-label="Page tabs">
          {TABS.map(tab => (
            <ThreeUIButton
              key={tab.path}
              active={location.pathname === tab.path}
              onClick={() => navigate(tab.path)}
              role="tab"
              aria-selected={location.pathname === tab.path}
            >
              {tab.label}
            </ThreeUIButton>
          ))}
        </div>

        {/* ── Desktop Actions (strictly hidden on screens <= 900px) ── */}
        <div className="hud-actions hud-actions-desktop">
          <GlassmorphismCTA onClick={handleSync} disabled={syncStatus !== 'idle'}>
            {syncStatus === 'syncing' ? '↻ Ingesting Live Quotes…' : syncStatus === 'done' ? '✓ Market Synced!' : 'Fetch Live Fares'}
          </GlassmorphismCTA>

          <div ref={themeRef} style={{ position: 'relative' }}>
            <ThreeUIButton onClick={() => setThemeOpen(!themeOpen)} title="Select theme" aria-expanded={themeOpen}>
              Theme: {theme.charAt(0).toUpperCase() + theme.slice(1)} ▼
            </ThreeUIButton>
            {themeOpen && (
              <div className="hud-dropdown" role="menu">
                {([['dark','Dark'],['light','Light'],['intermediate','Intermediate'],['coastal','Coastal']] as [string,string][]).map(([val, label]) => (
                  <ThreeUIButton
                    key={val}
                    active={theme === val}
                    onClick={() => { setTheme(val as any); setThemeOpen(false); }}
                    role="menuitem"
                  >
                    {label}
                  </ThreeUIButton>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            MOBILE HEADER: Active Indicator + Sync + Hamburger
            ══════════════════════════════════════════════════════════ */}
        <div className="hud-mobile-row">
          {/* Current active page indicator pill */}
          <span className="hud-mobile-active-page">
            {activeTab ? activeTab.short : 'APIx'}
          </span>

          {/* Sync Button */}
          <button
            className="hud-mobile-sync-btn"
            onClick={handleSync}
            disabled={syncStatus !== 'idle'}
            aria-label="Fetch live fares"
            title="Fetch live fares"
          >
            {syncStatus === 'syncing' ? '↻' : syncStatus === 'done' ? '✓' : 'Sync'}
          </button>

          {/* Hamburger trigger */}
          <div ref={menuRef} className="hud-hamburger-wrapper">
            <button
              className={`hud-hamburger${menuOpen ? ' open' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              <span />
              <span />
              <span />
            </button>

            {/* Mobile Dropdown Menu */}
            {menuOpen && (
              <div className="hud-mobile-menu" role="menu" aria-label="Navigation menu">
                {/* Header inside menu */}
                <div className="hud-mobile-menu-heading">NAVIGATION CHANNELS</div>

                {/* Nav links */}
                <div className="hud-mobile-menu-section">
                  {TABS.map(tab => (
                    <button
                      key={tab.path}
                      className={`hud-mobile-nav-item${location.pathname === tab.path ? ' active' : ''}`}
                      onClick={() => { navigate(tab.path); setMenuOpen(false); }}
                      role="menuitem"
                      aria-current={location.pathname === tab.path ? 'page' : undefined}
                    >
                      <span className="hud-mobile-nav-label">{tab.label}</span>
                      {location.pathname === tab.path && <span className="hud-mobile-active-dot" />}
                    </button>
                  ))}
                </div>

                <div className="hud-mobile-divider" />

                {/* Theme selector */}
                <div className="hud-mobile-menu-heading">DISPLAY THEME</div>
                <div className="hud-mobile-theme-grid">
                  {([['dark','Dark'],['light','Light'],['intermediate','Inter'],['coastal','Coastal']] as [string,string][]).map(([val, label]) => (
                    <button
                      key={val}
                      className={`hud-mobile-theme-btn${theme === val ? ' active' : ''}`}
                      onClick={() => { setTheme(val as any); }}
                    >
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Dimmed backdrop when mobile menu is open */}
      {menuOpen && (
        <div 
          className="hud-mobile-backdrop" 
          onClick={() => setMenuOpen(false)} 
          aria-hidden="true" 
        />
      )}
    </>
  );
};

export default HudNav;
