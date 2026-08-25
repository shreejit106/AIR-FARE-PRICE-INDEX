import React from 'react';
import { Network, Users } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

const weightData = [
  { name: 'DEL ✈ BOM', value: 35, color: '#3b82f6' },
  { name: 'DEL ✈ BLR', value: 25, color: '#8b5cf6' },
  { name: 'BOM ✈ BLR', value: 15, color: '#10b981' },
  { name: 'DEL ✈ HYD', value: 15, color: '#f59e0b' },
  { name: 'BOM ✈ GOI', value: 10, color: '#ef4444' },
];

const Weights: React.FC = () => {
  return (
    <div className="dashboard-container">
      <header className="header">
        <div>
          <h1>Weight Allocation</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            How passenger traffic data dictates the index weighting.
          </p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        <div className="glass-panel">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--accent-secondary)' }}>
            <Users size={24} /> DGCA Traffic Integration
          </h2>
          <p style={{ lineHeight: '1.7', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            A naive index treats every route equally. If a low-traffic route (e.g., Indore to Coimbatore) doubles in price, a naive index spikes, even though very few consumers are affected.
          </p>
          <p style={{ lineHeight: '1.7', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            To solve this, APIx integrates directly with the <strong>Directorate General of Civil Aviation (DGCA)</strong> passenger volume datasets. We extract the total number of passengers flown on each city-pair over the base period.
          </p>
          <div style={{ padding: '1rem', borderLeft: '4px solid var(--accent-primary)', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '0 8px 8px 0' }}>
            <strong>Weight Formula:</strong> Route Weight = (Total Passengers on Route) / (Total Passengers on All Tracked Routes)
          </div>
        </div>

        <div className="glass-panel">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#a855f7' }}>
            <Network size={24} /> Current Route Distribution
          </h2>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={weightData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {weightData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'rgba(20, 27, 45, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => [`${value}%`, 'Weight']}
                />
                <Legend layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Weights;
