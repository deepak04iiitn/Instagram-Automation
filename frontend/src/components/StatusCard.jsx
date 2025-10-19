import React from 'react';
import { cn } from '../utils/cn';

const StatusCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue', 
  subtitle, 
  trend,
  className 
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    gray: 'bg-gray-50 text-gray-600',
  };

  const iconColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
    gray: 'text-gray-600',
  };

  return (
    <div className={cn(
      'bg-white rounded-lg shadow p-6 border-l-4',
      color === 'blue' && 'border-blue-500',
      color === 'green' && 'border-green-500',
      color === 'purple' && 'border-purple-500',
      color === 'orange' && 'border-orange-500',
      color === 'red' && 'border-red-500',
      color === 'gray' && 'border-gray-500',
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              <span className={cn(
                'text-xs font-medium',
                trend > 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
              <span className="text-xs text-gray-500 ml-1">vs last period</span>
            </div>
          )}
        </div>
        <div className={cn(
          'p-3 rounded-full',
          colorClasses[color]
        )}>
          <Icon className={cn('h-6 w-6', iconColorClasses[color])} />
        </div>
      </div>
    </div>
  );
};

export default StatusCard;
