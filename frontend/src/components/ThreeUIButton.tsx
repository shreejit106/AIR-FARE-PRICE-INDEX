import React, { type ButtonHTMLAttributes } from 'react';
import './ThreeUIButton.css';

interface ThreeUIButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

const ThreeUIButton: React.FC<ThreeUIButtonProps> = ({ 
  children, 
  className = '', 
  active = false,
  ...props 
}) => {
  return (
    <button 
      className={`threeui-button ${active ? 'active' : ''} ${className}`.trim()} 
      {...props}
    >
      <span className="threeui-button__title">{children}</span>
      <span className="threeui-button__circle" aria-hidden="true" />
    </button>
  );
};

export default ThreeUIButton;
