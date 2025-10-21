import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const containerVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
  };

  const spinnerVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  const dotVariants = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="flex flex-col items-center justify-center space-y-4"
    >
      <motion.div
        variants={spinnerVariants}
        animate="animate"
        className="relative"
      >
        <Loader2 className={`${sizeClasses[size]} text-blue-600`} />
        <motion.div
          className="absolute inset-0 border-4 border-blue-200 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>
      
      {text && (
        <div className="flex items-center space-x-1">
          <span className="text-sm font-medium text-gray-600">{text}</span>
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                variants={dotVariants}
                animate="animate"
                transition={{ delay: i * 0.2 }}
                className="w-1.5 h-1.5 bg-blue-600 rounded-full"
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default LoadingSpinner;
