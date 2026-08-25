import React from 'react';
import { Calculator, ShieldAlert, BarChart3 } from 'lucide-react';

const MathsStats: React.FC = () => {
  return (
    <div className="dashboard-container">
      <header className="header">
        <div>
          <h1>Maths & Stats</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Transparent methodology for the APIx calculation and data sanitization.
          </p>
        </div>
      </header>

      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--accent-primary)' }}>
          <Calculator size={24} /> The Laspeyres Price Index
        </h2>
        <p style={{ lineHeight: '1.7', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          The APIx is constructed using a modified Laspeyres Price Index formula. Just like the Consumer Price Index (CPI) measures a fixed basket of goods, the APIx measures a fixed basket of domestic flight routes, weighted by their passenger traffic significance.
        </p>
        
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', fontFamily: 'monospace', fontSize: '1.2rem', textAlign: 'center', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
          APIx = ( Σ [ P(current) × Q(base) ] / Σ [ P(base) × Q(base) ] ) × 100
        </div>
        
        <ul style={{ listStyle: 'none', paddingLeft: '1rem', color: 'var(--text-secondary)' }}>
          <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'white' }}>P(current):</strong> The median live scraped fare for a specific route and advance purchase window.</li>
          <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'white' }}>P(base):</strong> The baseline median fare for that same route/window established during the base period.</li>
          <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'white' }}>Q(base):</strong> The fixed quantity weight (passenger volume) assigned to that route by the DGCA.</li>
        </ul>
      </div>

      <div className="glass-panel">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#ef4444' }}>
          <ShieldAlert size={24} /> Data Cleaning & Outlier Removal
        </h2>
        <p style={{ lineHeight: '1.7', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          OTA pricing data is notoriously noisy. It includes artificially deflated prices (student/armed forces discounts) and extreme outliers (last seat on a flight sold at a 500% premium). To ensure the APIx reflects reality, we run a rigorous 2-step cleaning pipeline.
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <h3 style={{ marginBottom: '0.5rem', color: '#eab308' }}>Step 1: Interquartile Range (IQR)</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              We calculate the 25th (Q1) and 75th (Q3) percentiles of scraped fares for a route. Any fare falling below Q1 - 1.5*IQR or above Q3 + 1.5*IQR is mathematically classified as an anomaly and discarded.
            </p>
          </div>
          
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <h3 style={{ marginBottom: '0.5rem', color: '#10b981' }}>Step 2: Median Representation</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Instead of taking a simple average (mean) which is highly susceptible to skewness, we take the median of the remaining cleaned dataset to represent the P(current) for that specific route and horizon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MathsStats;
