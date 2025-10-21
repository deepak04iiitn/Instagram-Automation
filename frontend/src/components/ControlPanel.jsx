import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RefreshCw, Trash2, Settings, AlertTriangle, CheckCircle, Clock, X } from 'lucide-react';
import { automationAPI } from '../services/api';
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
      description: 'Manually trigger the automation process',
      icon: Play,
      color: 'blue',
      action: () => handleAction('run', onRunAutomation, 'Automation started successfully'),
      loading: loading || actionLoading.run,
    },
    {
      id: 'refresh',
      title: 'Refresh Data',
      description: 'Reload all dashboard data',
      icon: RefreshCw,
      color: 'gray',
      action: () => window.location.reload(),
      loading: false,
    },
    {
      id: 'cleanupImages',
      title: 'Cleanup Images',
      description: 'Remove old generated images',
      icon: Trash2,
      color: 'orange',
      action: () => handleAction('cleanupImages', automationAPI.cleanupImages, 'Image cleanup completed'),
      loading: actionLoading.cleanupImages,
    },
    {
      id: 'cleanupPosts',
      title: 'Cleanup Posts',
      description: 'Remove old declined/failed posts',
      icon: Trash2,
      color: 'red',
      action: () => handleAction('cleanupPosts', automationAPI.cleanupPosts, 'Post cleanup completed'),
      loading: actionLoading.cleanupPosts,
    },
  ];

  const getGradientColor = (color) => {
    const gradients = {
      blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
      gray: 'from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700',
      orange: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
      red: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
    };
    return gradients[color] || gradients.gray;
  };

  const notificationIcons = {
    success: CheckCircle,
    error: AlertTriangle,
    info: Clock,
  };

  const notificationColors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Control Panel</h2>
              <p className="text-sm text-gray-500">Manage automation tasks</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.03 }}
              className="group"
            >
              <motion.button
                onClick={action.action}
                disabled={action.loading}
                className={cn(
                  'w-full p-6 rounded-xl bg-gradient-to-br text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden',
                  getGradientColor(action.color)
                )}
                whileTap={{ scale: 0.97 }}
              >
                {/* Animated Background */}
                <motion.div
                  className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"
                />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <action.icon className={cn(
                      'h-6 w-6',
                      action.loading && 'animate-spin'
                    )} />
                    {action.loading && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                      />
                    )}
                  </div>
                  <h3 className="text-sm font-semibold mb-1 text-left">{action.title}</h3>
                  <p className="text-xs opacity-90 text-left">{action.description}</p>
                </div>

                {/* Shine Effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6 }}
                />
              </motion.button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Notifications */}
      <div className="fixed bottom-6 right-6 z-50 space-y-2 max-w-md">
        <AnimatePresence>
          {notifications.map((notification) => {
            const NotifIcon = notificationIcons[notification.type];
            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 50, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className={cn(
                  'flex items-center space-x-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm',
                  notificationColors[notification.type]
                )}
              >
                <NotifIcon className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm font-medium flex-1">{notification.message}</p>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                  className="p-1 hover:bg-black/10 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ControlPanel;
