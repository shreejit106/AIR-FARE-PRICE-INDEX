import React, { useState, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Methodology from './pages/MathsStats';
import Analysts from './pages/Analysts';
import Simulation from './pages/Simulation';
import Fleet from './pages/Fleet';
import References from './pages/References';
import HudNav from './components/HudNav';

type ThemeMode = 'light' | 'intermediate' | 'coastal' | 'dark';
interface ThemeCtx { theme: ThemeMode; dark: boolean; setTheme: (t: ThemeMode) => void; }
export const ThemeContext = createContext<ThemeCtx>({ theme: 'dark', dark: true, setTheme: () => {} });
export const useTheme = () => useContext(ThemeContext);

/* ─── Inner layout (with HUD nav) ───────────────────────────────────────── */
const AppInner: React.FC = () => {
  return (
    <div className="app-inner">
      <HudNav />
      <Routes>
        <Route path="/"            element={<Landing />} />
        <Route path="/dashboard"   element={<Dashboard />} />
        <Route path="/methodology" element={<Methodology />} />
        {/* Legacy /weights route still works — redirects to /methodology */}
        <Route path="/weights"     element={<Methodology />} />
        <Route path="/analysts"    element={<Analysts />} />
        <Route path="/simulation"  element={<Simulation />} />
        <Route path="/fleet"       element={<Fleet />} />
        <Route path="/references"  element={<References />} />
      </Routes>
    </div>
  );
};

const App: React.FC = () => {
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const dark = theme === 'dark';

  React.useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    
    html.setAttribute('data-theme', theme);
    
    if (theme === 'dark') {
      html.style.colorScheme = 'dark';
      body.style.backgroundColor = '#060B14';
      body.style.color = '#E2E8F0';
    } else if (theme === 'intermediate') {
      html.style.colorScheme = 'light';
      body.style.backgroundColor = '#F5F0E9'; // SWAN WING
      body.style.color = '#112250'; // ROYAL BLUE
    } else if (theme === 'coastal') {
      html.style.colorScheme = 'light';
      body.style.backgroundColor = '#CCD4D7'; // LIGHT BLUE-GREY
      body.style.color = '#3F4F5F'; // DARK BLUE-GREY
    } else {
      html.style.colorScheme = 'light';
      body.style.backgroundColor = '#F0F4F8';
      body.style.color = '#0F172A';
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, dark, setTheme }}>
      <Router>
        <AppInner />
      </Router>
    </ThemeContext.Provider>
  );
};

export default App;
