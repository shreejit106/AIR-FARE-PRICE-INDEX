import React, { type ButtonHTMLAttributes } from 'react';
import './GlassmorphismCTA.css';

interface GlassmorphismCTAProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

const GlassmorphismCTA: React.FC<GlassmorphismCTAProps> = ({ 
  children, 
  className = '', 
  active = false,
  ...props 
}) => {
  return (
    <button 
      className={`glassmorphism-cta ${active ? 'active' : ''} ${className}`.trim()} 
      {...props}
    >
      <div className="glassmorphism-cta-bg-wrapper">
        <div className="glassmorphism-cta-bg-rotator">
          <div className="glassmorphism-cta-bg-conic"></div>
        </div>
      </div>
      
      <div className="glassmorphism-cta-inner-bg"></div>
      
      <div className="glassmorphism-cta-content">
        <div className="glassmorphism-cta-border-beam"></div>
        <div className="glassmorphism-cta-blur-bg"></div>
        <span className="glassmorphism-cta-text">{children}</span>
      </div>
    </button>
  );
};

export default GlassmorphismCTA;
