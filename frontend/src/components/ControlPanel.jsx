import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Trash2, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
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

  const handleRunNow = () => {
    handleAction(
      'run',
      onRunAutomation,
      'Automation started successfully'
    );
  };

  const handleCleanupImages = () => {
    handleAction(
      'cleanupImages',
      automationAPI.cleanupImages,
      'Image cleanup completed'
    );
  };

  const handleCleanupPosts = () => {
    handleAction(
      'cleanupPosts',
      automationAPI.cleanupPosts,
      'Post cleanup completed'
    );
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const actions = [
    {
      id: 'run',
      title: 'Run Automation',
      description: 'Manually trigger the automation process',
      icon: Play,
      color: 'blue',
      action: handleRunNow,
      loading: loading || actionLoading.run,
    },
    {
      id: 'refresh',
      title: 'Refresh Data',
      description: 'Reload all dashboard data',
      icon: RefreshCw,
      color: 'gray',
      action: handleRefresh,
      loading: false,
    },
    {
      id: 'cleanupImages',
      title: 'Cleanup Images',
      description: 'Remove old generated images',
      icon: Trash2,
      color: 'orange',
      action: handleCleanupImages,
      loading: actionLoading.cleanupImages,
    },
    {
      id: 'cleanupPosts',
      title: 'Cleanup Posts',
      description: 'Remove old declined/failed posts',
      icon: Trash2,
      color: 'red',
      action: handleCleanupPosts,
      loading: actionLoading.cleanupPosts,
    },
  ];

  const getIconColor = (color) => {
    const colors = {
      blue: 'text-blue-600',
      gray: 'text-gray-600',
      orange: 'text-orange-600',
      red: 'text-red-600',
    };
    return colors[color] || 'text-gray-600';
  };

  const getButtonColor = (color) => {
    const colors = {
      blue: 'bg-blue-600 hover:bg-blue-700 text-white',
      gray: 'bg-gray-600 hover:bg-gray-700 text-white',
      orange: 'bg-orange-600 hover:bg-orange-700 text-white',
      red: 'bg-red-600 hover:bg-red-700 text-white',
    };
    return colors[color] || 'bg-gray-600 hover:bg-gray-700 text-white';
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Control Panel</h3>
        </div>
        
        <div className="p-6 space-y-4">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <div key={action.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    'p-2 rounded-lg',
                    action.color === 'blue' && 'bg-blue-50',
                    action.color === 'gray' && 'bg-gray-50',
                    action.color === 'orange' && 'bg-orange-50',
                    action.color === 'red' && 'bg-red-50',
                  )}>
                    <Icon className={cn('h-5 w-5', getIconColor(action.color))} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{action.title}</h4>
                    <p className="text-xs text-gray-500">{action.description}</p>
                  </div>
                </div>
                
                <button
                  onClick={action.action}
                  disabled={action.loading}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                    getButtonColor(action.color)
                  )}
                >
                  {action.loading ? (
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Running...</span>
                    </div>
                  ) : (
                    action.title
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
        </div>
        
        <div className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Scheduler</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-600">Running</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Next Run</span>
            <span className="text-sm text-gray-900">10:00 AM Daily</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Last Check</span>
            <span className="text-sm text-gray-900">
              {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                'p-3 rounded-lg text-sm',
                notification.type === 'success' && 'bg-green-50 text-green-800 border border-green-200',
                notification.type === 'error' && 'bg-red-50 text-red-800 border border-red-200',
                notification.type === 'info' && 'bg-blue-50 text-blue-800 border border-blue-200'
              )}
            >
              <div className="flex items-center space-x-2">
                {notification.type === 'success' && <CheckCircle className="h-4 w-4" />}
                {notification.type === 'error' && <AlertTriangle className="h-4 w-4" />}
                {notification.type === 'info' && <Clock className="h-4 w-4" />}
                <span>{notification.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ControlPanel;
