import React, { useState } from 'react';
import './App.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Plane, Map, Activity, Bell, Settings } from 'lucide-react';

// Mock Data
const cpiVsApiData = [
  { month: 'Jan', CPI: 102.5, API: 103.1 },
  { month: 'Feb', CPI: 103.2, API: 104.5 },
  { month: 'Mar', CPI: 103.8, API: 106.2 },
  { month: 'Apr', CPI: 104.1, API: 109.8 },
  { month: 'May', CPI: 104.5, API: 115.4 },
  { month: 'Jun', CPI: 105.0, API: 112.1 },
  { month: 'Jul', CPI: null, API: 108.5 }, // CPI lags, API is real-time
];

const routeData = [
  { day: 'Mon', DEL_BOM: 5400, DEL_BLR: 6200 },
  { day: 'Tue', DEL_BOM: 5200, DEL_BLR: 6000 },
  { day: 'Wed', DEL_BOM: 5800, DEL_BLR: 6500 },
  { day: 'Thu', DEL_BOM: 6100, DEL_BLR: 6800 },
  { day: 'Fri', DEL_BOM: 7500, DEL_BLR: 8200 }, // Weekend surge
  { day: 'Sat', DEL_BOM: 7200, DEL_BLR: 8000 },
  { day: 'Sun', DEL_BOM: 6800, DEL_BLR: 7500 },
];

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Plane size={24} style={{ marginRight: '8px', color: 'var(--accent-teal)' }} />
          Aero<span>Index</span> India
        </div>
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <Activity size={20} />
            Nowcast Dashboard
          </button>
          <button 
            className={`nav-item ${activeTab === 'routes' ? 'active' : ''}`}
            onClick={() => setActiveTab('routes')}
          >
            <Map size={20} />
            Route Analysis
          </button>
          <button 
            className={`nav-item ${activeTab === 'alerts' ? 'active' : ''}`}
            onClick={() => setActiveTab('alerts')}
          >
            <Bell size={20} />
            Alerts
          </button>
          <div style={{ flex: 1 }}></div>
          <button className="nav-item">
            <Settings size={20} />
            Settings
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <div className="header-title">
            Real-Time Airfare vs CPI Augmentation
          </div>
          <div className="header-actions">
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Last updated: Just now</span>
            <button className="btn-primary">Export Report</button>
          </div>
        </header>

        <div className="dashboard-scroll-area">
          <div className="dashboard-grid">
            
            {/* Top Stats */}
            <div className="widget glass-panel col-span-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="widget-header">
                <span className="widget-title">National Airfare Index (API)</span>
                <TrendingUp size={20} color="var(--accent-teal)" />
              </div>
              <div className="stat-value">108.5</div>
              <div className="stat-change positive">
                <TrendingUp size={16} />
                +3.2% vs Last Month
              </div>
            </div>

            <div className="widget glass-panel col-span-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="widget-header">
                <span className="widget-title">Projected MoSPI CPI</span>
                <Activity size={20} color="var(--accent-orange)" />
              </div>
              <div className="stat-value">105.4</div>
              <div className="stat-change positive">
                <TrendingUp size={16} />
                +0.4% Estimated
              </div>
            </div>

            <div className="widget glass-panel col-span-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="widget-header">
                <span className="widget-title">Active Routes Monitored</span>
                <Plane size={20} color="var(--text-secondary)" />
              </div>
              <div className="stat-value">1,248</div>
              <div className="stat-change" style={{ color: 'var(--text-muted)' }}>
                Via OAG & OTA Scrapes
              </div>
            </div>

            {/* Main Chart */}
            <div className="widget glass-panel col-span-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="widget-header">
                <span className="widget-title">CPI vs API Trend (Base 100 = Jan)</span>
              </div>
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer>
                  <LineChart data={cpiVsApiData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                    <XAxis dataKey="month" stroke="var(--text-secondary)" />
                    <YAxis domain={['dataMin - 2', 'dataMax + 2']} stroke="var(--text-secondary)" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                      itemStyle={{ color: 'var(--text-primary)' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="API" name="Real-Time API (Airfare)" stroke="var(--accent-teal)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="CPI" name="Official CPI (eSankhya)" stroke="var(--text-muted)" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Side Widget */}
            <div className="widget glass-panel col-span-4 animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <div className="widget-header">
                <span className="widget-title">7-Day Route Volatility</span>
              </div>
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer>
                  <AreaChart data={routeData} margin={{ top: 5, right: 0, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                    <XAxis dataKey="day" stroke="var(--text-secondary)" fontSize={12} />
                    <YAxis stroke="var(--text-secondary)" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                    />
                    <Area type="monotone" dataKey="DEL_BOM" name="DEL-BOM" stroke="var(--accent-teal)" fill="var(--accent-teal)" fillOpacity={0.1} />
                    <Area type="monotone" dataKey="DEL_BLR" name="DEL-BLR" stroke="var(--accent-orange)" fill="var(--accent-orange)" fillOpacity={0.1} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
