import React, { useState, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import MathsStats from './pages/MathsStats';
import Weights from './pages/Weights';
import HudNav from './components/HudNav';

/* ─── Theme context ──────────────────────────────────────────────────────── */
interface ThemeCtx { dark: boolean; toggle: () => void; }
export const ThemeContext = createContext<ThemeCtx>({ dark: true, toggle: () => {} });
export const useTheme = () => useContext(ThemeContext);

/* ─── Inner layout (with HUD nav) ───────────────────────────────────────── */
const AppInner: React.FC = () => {
  const location = useLocation();
  const showNav = location.pathname !== '/';

  return (
    <div className="app-inner">
      {showNav && <HudNav />}
      <Routes>
        <Route path="/"            element={<Landing />} />
        <Route path="/dashboard"   element={<Dashboard />} />
        <Route path="/methodology" element={<MathsStats />} />
        <Route path="/weights"     element={<Weights />} />
      </Routes>
    </div>
  );
};

const App: React.FC = () => {
  const [dark, setDark] = useState(true);

  React.useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const theme = dark ? 'dark' : 'light';
    // Apply to <html> so CSS [data-theme] selectors work
    html.setAttribute('data-theme', theme);
    html.style.colorScheme = theme;
    // Force background to switch immediately (no flash)
    body.style.backgroundColor = dark ? '#060B14' : '#F0F4F8';
    body.style.color = dark ? '#E2E8F0' : '#0F172A';
  }, [dark]);

  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark(d => !d) }}>
      <Router>
        <AppInner />
      </Router>
    </ThemeContext.Provider>
  );
};

export default App;
