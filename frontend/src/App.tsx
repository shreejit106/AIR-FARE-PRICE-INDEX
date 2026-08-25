import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, Sigma, Scale } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import MathsStats from './pages/MathsStats';
import Weights from './pages/Weights';

const App: React.FC = () => {
  return (
    <Router>
      <div className="app-layout">
        <aside className="sidebar glass-panel">
          <div className="logo">
            <h2>APIx</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Operate Dashboard</span>
          </div>
          
          <nav className="nav-menu">
            <NavLink to="/" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <LayoutDashboard size={20} />
              <span>Calculator</span>
            </NavLink>
            <NavLink to="/methodology" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Sigma size={20} />
              <span>Maths & Stats</span>
            </NavLink>
            <NavLink to="/weights" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Scale size={20} />
              <span>Weights (DGCA)</span>
            </NavLink>
          </nav>

          <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            v2.1 Premium Edition
          </div>
        </aside>
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/methodology" element={<MathsStats />} />
            <Route path="/weights" element={<Weights />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
