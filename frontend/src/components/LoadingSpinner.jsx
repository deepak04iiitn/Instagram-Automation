import React from 'react';
import { RefreshCw } from 'lucide-react';

const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <RefreshCw className={`${sizeClasses[size]} text-blue-600 animate-spin mx-auto mb-4`} />
        <p className="text-gray-600">{text}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
