import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../utils/cn';

const StatusCard = ({ title, value, icon: Icon, color = 'blue', subtitle, trend, className }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    gray: 'from-gray-500 to-gray-600',
  };

  const bgColorClasses = {
    blue: 'from-blue-50 to-blue-100',
    green: 'from-green-50 to-green-100',
    purple: 'from-purple-50 to-purple-100',
    orange: 'from-orange-50 to-orange-100',
    red: 'from-red-50 to-red-100',
    gray: 'from-gray-50 to-gray-100',
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        'relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-6 shadow-sm hover:shadow-xl transition-all duration-300',
        className
      )}
    >
      {/* Gradient Background Effect */}
      <motion.div
        className={cn('absolute inset-0 bg-gradient-to-br opacity-0 hover:opacity-5 transition-opacity duration-300', bgColorClasses[color])}
      />

      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
          </motion.div>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center space-x-1 mt-2"
            >
              {trend.positive ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={cn(
                'text-xs font-semibold',
                trend.positive ? 'text-green-600' : 'text-red-600'
              )}>
                {trend.value}
              </span>
            </motion.div>
          )}
        </div>

        <motion.div
          whileHover={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 0.5 }}
          className={cn(
            'p-3 rounded-xl bg-gradient-to-br shadow-lg',
            colorClasses[color]
          )}
        >
          <Icon className="h-6 w-6 text-white" />
        </motion.div>
      </div>

      {/* Shine Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 hover:opacity-20"
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.6 }}
      />
    </motion.div>
  );
};

export default StatusCard;
