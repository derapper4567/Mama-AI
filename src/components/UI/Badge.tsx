import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'high' | 'medium' | 'low' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'info',
  size = 'md'
}) => {
  const variantClasses = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200'
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${variantClasses[variant]} ${sizeClasses[size]}`}>
      {children}
    </span>
  );
};