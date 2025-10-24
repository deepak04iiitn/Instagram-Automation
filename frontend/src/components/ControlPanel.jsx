import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  RefreshCw,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  Briefcase,
  Settings,
  Zap
} from 'lucide-react';
import { automationAPI, jobAPI } from '../services/api';
import { cn } from '../utils/cn';

const ControlPanel = ({ onRunAutomation, loading }) => {
  const [actionLoading, setActionLoading] = useState({});
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const handleAction = async (action, apiCall, successMessage) => {
    try {
      setActionLoading(prev => ({ ...prev, [action]: true }));
      await apiCall();
      addNotification(successMessage, 'success');
    } catch (error) {
      console.error(`Error ${action}:`, error);
      addNotification(`Error ${action}: ${error.message}`, 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [action]: false }));
    }
  };

  const actions = [
    {
      id: 'run',
      title: 'Run Automation',
      description: 'Trigger automation process',
      icon: Play,
      color: 'blue',
      action: () => handleAction('run', onRunAutomation, 'Automation started successfully'),
      loading: loading || actionLoading.run,
    },
    {
      id: 'postJob',
      title: 'Post Job Update',
      description: 'Post QA opportunities',
      icon: Briefcase,
      color: 'green',
      action: () => handleAction('postJob', jobAPI.postJobUpdate, 'Job update posted successfully'),
      loading: actionLoading.postJob,
    },
    {
      id: 'refresh',
      title: 'Refresh Data',
      description: 'Reload dashboard',
      icon: RefreshCw,
      color: 'gray',
      action: () => window.location.reload(),
      loading: false,
    },
    {
      id: 'cleanupImages',
      title: 'Cleanup Images',
      description: 'Remove old images',
      icon: Trash2,
      color: 'orange',
      action: () => handleAction('cleanupImages', automationAPI.cleanupImages, 'Image cleanup completed'),
      loading: actionLoading.cleanupImages,
    },
    {
      id: 'cleanupPosts',
      title: 'Cleanup Posts',
      description: 'Remove old posts',
      icon: Trash2,
      color: 'red',
      action: () => handleAction('cleanupPosts', automationAPI.cleanupPosts, 'Post cleanup completed'),
      loading: actionLoading.cleanupPosts,
    },
  ];

  const getColorClasses = (color) => {
    const classes = {
      blue: {
        bg: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
        text: 'text-blue-400',
        light: 'bg-blue-500/10'
      },
      green: {
        bg: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
        text: 'text-green-400',
        light: 'bg-green-500/10'
      },
      gray: {
        bg: 'from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700',
        text: 'text-gray-400',
        light: 'bg-gray-500/10'
      },
      orange: {
        bg: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
        text: 'text-orange-400',
        light: 'bg-orange-500/10'
      },
      red: {
        bg: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
        text: 'text-red-400',
        light: 'bg-red-500/10'
      },
    };
    return classes[color] || classes.gray;
  };

  const notificationConfig = {
    success: { icon: CheckCircle, color: 'bg-green-500/10 border-green-500/20 text-green-300' },
    error: { icon: AlertTriangle, color: 'bg-red-500/10 border-red-500/20 text-red-300' },
    info: { icon: Clock, color: 'bg-blue-500/10 border-blue-500/20 text-blue-300' },
  };

  return (
    <div className="bg-gray-800/50 rounded-2xl shadow-lg border border-gray-700/50 overflow-hidden h-full backdrop-blur-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Control Panel</h3>
            <p className="text-xs text-indigo-100">Manage automation tasks</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-6 space-y-3">
        {actions.map((action, index) => {
          const colors = getColorClasses(action.color);
          const Icon = action.icon;

          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={action.action}
              disabled={action.loading}
              className={cn(
                'w-full group relative overflow-hidden rounded-xl p-4 cursor-pointer',
                'bg-gray-900/50',
                'border border-gray-700/50 hover:border-gray-600/50',
                'shadow-sm hover:shadow-md',
                'transition-all duration-300',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center space-x-4'
              )}
            >
              {/* Icon */}
              <div className={cn(
                'p-3 rounded-xl bg-gradient-to-br shadow-sm',
                'transform group-hover:scale-110 transition-transform duration-300',
                colors.bg
              )}>
                <Icon className={cn(
                  'h-5 w-5 text-white',
                  action.loading && 'animate-spin'
                )} />
              </div>

              {/* Content */}
              <div className="flex-1 text-left">
                <h4 className="text-sm font-semibold text-gray-100 group-hover:text-white">
                  {action.title}
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  {action.description}
                </p>
              </div>

              {/* Loading Indicator */}
              {action.loading && (
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-blue-400 rounded-full animate-pulse" />
                  <div className="h-2 w-2 bg-blue-400 rounded-full animate-pulse delay-75" />
                  <div className="h-2 w-2 bg-blue-400 rounded-full animate-pulse delay-150" />
                </div>
              )}

              {/* Hover Effect */}
              <div className={cn(
                'absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-5 transition-opacity',
                colors.bg
              )} />
            </motion.button>
          );
        })}
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {notifications.length > 0 && (
          <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
            {notifications.map((notification) => {
              const config = notificationConfig[notification.type];
              const NotifIcon = config.icon;

              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 100, scale: 0.9 }}
                  className={cn(
                    'flex items-start space-x-3 p-4 rounded-xl shadow-lg border backdrop-blur-sm',
                    config.color
                  )}
                >
                  <NotifIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium flex-1">{notification.message}</p>
                  <button
                    onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                    className="flex-shrink-0 hover:opacity-70 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ControlPanel;
