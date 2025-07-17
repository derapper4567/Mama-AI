import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'teal';
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  label,
  color = 'blue',
  size = 'md',
  showValue = true
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-500',
    red: 'bg-red-600',
    teal: 'bg-teal-600'
  };

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {showValue && (
            <span className="text-sm text-gray-500">
              {value}/{max} ({percentage.toFixed(0)}%)
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]}`}>
        <div
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};