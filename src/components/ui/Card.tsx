import React, { forwardRef } from 'react';
import styles from './Card.module.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '', onClick, hoverable = false }, ref) => {
    const isClickable = !!onClick;
    
    return (
      <div 
        ref={ref}
        className={`glass-panel ${styles.card} ${hoverable || isClickable ? styles.hoverable : ''} ${className}`}
        onClick={onClick}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
