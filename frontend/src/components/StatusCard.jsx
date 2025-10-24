import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import { cn } from '../utils/cn';

const StatusCard = ({ title, value, icon: Icon, color = 'blue', subtitle, trend, className }) => {
  const colorClasses = {
    blue: {
      gradient: 'from-blue-500 to-blue-600',
      bg: 'from-blue-500/10 to-blue-600/5',
      text: 'text-blue-400',
      ring: 'ring-blue-500/20',
      shadow: 'shadow-blue-500/20',
      glow: 'shadow-blue-500/30'
    },
    green: {
      gradient: 'from-green-500 to-green-600',
      bg: 'from-green-500/10 to-green-600/5',
      text: 'text-green-400',
      ring: 'ring-green-500/20',
      shadow: 'shadow-green-500/20',
      glow: 'shadow-green-500/30'
    },
    purple: {
      gradient: 'from-purple-500 to-purple-600',
      bg: 'from-purple-500/10 to-purple-600/5',
      text: 'text-purple-400',
      ring: 'ring-purple-500/20',
      shadow: 'shadow-purple-500/20',
      glow: 'shadow-purple-500/30'
    },
    orange: {
      gradient: 'from-orange-500 to-orange-600',
      bg: 'from-orange-500/10 to-orange-600/5',
      text: 'text-orange-400',
      ring: 'ring-orange-500/20',
      shadow: 'shadow-orange-500/20',
      glow: 'shadow-orange-500/30'
    },
    red: {
      gradient: 'from-red-500 to-red-600',
      bg: 'from-red-500/10 to-red-600/5',
      text: 'text-red-400',
      ring: 'ring-red-500/20',
      shadow: 'shadow-red-500/20',
      glow: 'shadow-red-500/30'
    },
    gray: {
      gradient: 'from-gray-500 to-gray-600',
      bg: 'from-gray-500/10 to-gray-600/5',
      text: 'text-gray-400',
      ring: 'ring-gray-500/20',
      shadow: 'shadow-gray-500/20',
      glow: 'shadow-gray-500/30'
    }
  };

  const colors = colorClasses[color];

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-gray-800/50 border border-gray-700/50',
        'shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm',
        `hover:${colors.glow}`,
        className
      )}
    >
      {/* Gradient Background Effect */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300',
        colors.bg
      )} />

      {/* Decorative Circle */}
      <div className={cn(
        'absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br opacity-5',
        colors.gradient
      )} />

      <div className="relative p-5 sm:p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            'p-3 rounded-xl bg-gradient-to-br shadow-lg transform group-hover:scale-110 transition-transform duration-300',
            colors.gradient
          )}>
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>

          {trend && (
            <div className={cn(
              'flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold',
              trend.positive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            )}>
              {trend.positive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{trend.value}</span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">
            {title}
          </h3>
          <p className={cn(
            'text-3xl sm:text-4xl font-bold transition-colors',
            colors.text
          )}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 flex items-center space-x-1">
              <span>{subtitle}</span>
            </p>
          )}
        </div>
      </div>

      {/* Hover Indicator */}
      <div className={cn(
        'absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r transition-all duration-300 group-hover:w-full',
        colors.gradient
      )} />
    </motion.div>
  );
};

export default StatusCard;
