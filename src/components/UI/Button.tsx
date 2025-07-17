import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-500'
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      className={`relative inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        ${variant === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
        ${variant === 'secondary' ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : ''}
        ${variant === 'danger' ? 'bg-red-600 text-white hover:bg-red-700' : ''}
        ${variant === 'ghost' ? 'bg-transparent text-gray-700 hover:bg-gray-100' : ''}
        ${disabled || loading ? 'opacity-60 cursor-not-allowed' : ''}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
      {loading && (
        <span className="absolute left-3">
          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
          </svg>
        </span>
      )}
    </button>
  );
};