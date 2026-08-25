import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { PlaneTakeoff, CalendarDays, TrendingUp, AlertCircle, Filter } from 'lucide-react';

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

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [baseDate, setBaseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [aggregation, setAggregation] = useState('overall');
  const [airline, setAirline] = useState('all');
  const [route, setRoute] = useState('all');
  const [cabinClass, setCabinClass] = useState('economy');

  const fetchData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        base_date: baseDate,
        aggregation,
        airline,
        route,
        cabin_class: cabinClass
      });
      
      const response = await fetch(`/api/apix?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error("Failed to fetch APIx data:", err);
      setError("Failed to connect to the backend API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [baseDate, aggregation, airline, route, cabinClass]);

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

  const chartData = [
    { name: 'T+7 Days', APIx: t7Data?.APIx || 0 },
    { name: 'T+15 Days', APIx: data?.apix_index.find(d => d.lead_time === 'T+15')?.APIx || 0 },
    { name: 'T+30 Days', APIx: t30Data?.APIx || 0 },
  ];

  return (
    <div className="dashboard-container">
      <header className="header">
        <div>
          <h1>APIx Calculator</h1>
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

      {/* Filter Control Panel */}
      <div className="glass-panel" style={{ marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', marginBottom: '-0.5rem' }}>
          <Filter size={18} color="var(--accent-primary)" />
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Parameters</h3>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Base Period</label>
          <input type="date" value={baseDate} onChange={e => setBaseDate(e.target.value)} 
            style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--panel-border)', color: 'white' }} 
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Aggregation Level</label>
          <select value={aggregation} onChange={e => { setAggregation(e.target.value); if(e.target.value !== 'airline') setAirline('all'); if(e.target.value !== 'route') setRoute('all'); }} 
            style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--panel-border)', color: 'white' }}>
            <option value="overall" style={{ color: 'black' }}>Overall Industry</option>
            <option value="airline" style={{ color: 'black' }}>Airline Specific</option>
            <option value="route" style={{ color: 'black' }}>Route Specific</option>
          </select>
        </div>

        {aggregation === 'airline' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Airline</label>
            <select value={airline} onChange={e => setAirline(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--panel-border)', color: 'white' }}>
              <option value="all" style={{ color: 'black' }}>All Airlines</option>
              <option value="6E" style={{ color: 'black' }}>IndiGo (6E)</option>
              <option value="AI" style={{ color: 'black' }}>Air India (AI)</option>
            </select>
          </div>
        )}

        {aggregation === 'route' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Route</label>
            <select value={route} onChange={e => setRoute(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--panel-border)', color: 'white' }}>
              <option value="all" style={{ color: 'black' }}>All Routes</option>
              <option value="DEL-BOM" style={{ color: 'black' }}>DEL-BOM</option>
              <option value="DEL-BLR" style={{ color: 'black' }}>DEL-BLR</option>
            </select>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Cabin Class</label>
          <select value={cabinClass} onChange={e => setCabinClass(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--panel-border)', color: 'white' }}>
            <option value="economy" style={{ color: 'black' }}>Economy</option>
            <option value="business" style={{ color: 'black' }}>Business</option>
            <option value="first" style={{ color: 'black' }}>First Class</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading" style={{ height: '300px' }}>Crunching Data...</div>
      ) : (
        <>
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
                Dynamic Filtered Sample
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
        </>
      )}
    </div>
  );
};

export default Dashboard;
