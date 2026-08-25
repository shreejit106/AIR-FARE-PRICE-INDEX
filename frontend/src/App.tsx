import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { PlaneTakeoff, CalendarDays, TrendingUp, AlertCircle } from 'lucide-react';

interface APIxData {
  query_date: string;
  lead_time: string;
  APIx: number;
}

interface RouteFare {
  origin: string;
  destination: string;
  lead_time: string;
  representative_fare: number;
}

interface DashboardData {
  apix_index: APIxData[];
  route_fares: RouteFare[];
}

function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch data from FastAPI backend
        const response = await fetch('/api/apix');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error("Failed to fetch APIx data:", err);
        setError("Failed to connect to the backend API. Make sure FastAPI is running on port 8000.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="loading">Initializing APIx Index Engine...</div>;
  
  if (error) return (
    <div className="dashboard-container">
      <div className="glass-panel" style={{ textAlign: 'center', borderColor: '#ef4444' }}>
        <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
        <h2>Connection Error</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{error}</p>
      </div>
    </div>
  );

  const t7Data = data?.apix_index.find(d => d.lead_time === 'T+7');
  const t30Data = data?.apix_index.find(d => d.lead_time === 'T+30');

  // Format data for the chart
  const chartData = [
    { name: 'T+7 Days', APIx: t7Data?.APIx || 0 },
    { name: 'T+15 Days', APIx: data?.apix_index.find(d => d.lead_time === 'T+15')?.APIx || 0 },
    { name: 'T+30 Days', APIx: t30Data?.APIx || 0 },
  ];

  return (
    <div className="dashboard-container">
      <header className="header">
        <div>
          <h1>Airfare Price Index (APIx)</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Real-time traffic-weighted inflation metric for Indian domestic air travel.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>System Live</span>
          </div>
        </div>
      </header>

      <div className="metrics-grid">
        <div className="glass-panel metric-card">
          <span className="metric-title">
            <CalendarDays size={16} /> T+7 Horizon Index
          </span>
          <span className="metric-value">{t7Data?.APIx.toFixed(1)}</span>
          <span className={`metric-trend ${(t7Data?.APIx || 0) > 100 ? 'trend-up' : 'trend-down'}`}>
            {(t7Data?.APIx || 0) > 100 ? '▲' : '▼'} {Math.abs((t7Data?.APIx || 100) - 100).toFixed(1)}% vs Base
          </span>
        </div>
        
        <div className="glass-panel metric-card">
          <span className="metric-title">
            <PlaneTakeoff size={16} /> T+30 Horizon Index
          </span>
          <span className="metric-value">{t30Data?.APIx.toFixed(1)}</span>
          <span className={`metric-trend ${(t30Data?.APIx || 0) > 100 ? 'trend-up' : 'trend-down'}`}>
            {(t30Data?.APIx || 0) > 100 ? '▲' : '▼'} {Math.abs((t30Data?.APIx || 100) - 100).toFixed(1)}% vs Base
          </span>
        </div>

        <div className="glass-panel metric-card">
          <span className="metric-title">
            <TrendingUp size={16} /> Data Freshness
          </span>
          <span className="metric-value" style={{ fontSize: '2rem', marginTop: 'auto' }}>Just Now</span>
          <span className="metric-trend" style={{ color: 'var(--text-secondary)' }}>
            Scraped via Playwright OTA Engine
          </span>
        </div>
      </div>

      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          APIx Term Structure
        </h3>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} domain={['dataMin - 10', 'dataMax + 10']} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(20, 27, 45, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                itemStyle={{ color: '#3b82f6' }}
              />
              <Legend wrapperStyle={{ paddingTop: '1rem' }} />
              <Line 
                type="monotone" 
                dataKey="APIx" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ r: 6, fill: '#0b0f19', stroke: '#3b82f6', strokeWidth: 2 }}
                activeDot={{ r: 8, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-panel">
        <h3 style={{ marginBottom: '1rem' }}>Live Route Sampling</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Route</th>
                <th>Advance Purchase</th>
                <th>Median Live Fare (₹)</th>
              </tr>
            </thead>
            <tbody>
              {data?.route_fares.map((route, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 500 }}>{route.origin} ✈ {route.destination}</td>
                  <td>
                    <span className={`badge ${route.lead_time === 'T+7' ? 'badge-t7' : 'badge-t30'}`}>
                      {route.lead_time}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>₹{route.representative_fare.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
