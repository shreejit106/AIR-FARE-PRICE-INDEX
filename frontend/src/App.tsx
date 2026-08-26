import React, { useState, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Methodology from './pages/MathsStats';
import Analysts from './pages/Analysts';
import Simulation from './pages/Simulation';
import Fleet from './pages/Fleet';
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
        <Route path="/methodology" element={<Methodology />} />
        {/* Legacy /weights route still works — redirects to /methodology */}
        <Route path="/weights"     element={<Methodology />} />
        <Route path="/analysts"    element={<Analysts />} />
        <Route path="/simulation"  element={<Simulation />} />
        <Route path="/fleet"       element={<Fleet />} />
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
    html.setAttribute('data-theme', theme);
    html.style.colorScheme = theme;
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
