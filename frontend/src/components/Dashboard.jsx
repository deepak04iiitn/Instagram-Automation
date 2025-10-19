import React, { useState, useEffect } from 'react';
import { automationAPI } from '../services/api';
import { 
  Activity, 
  Calendar, 
  Clock, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Play,
  Pause,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import StatusCard from './StatusCard';
import RecentPosts from './RecentPosts';
import AnalyticsChart from './AnalyticsChart';
import ControlPanel from './ControlPanel';
import LoadingSpinner from './LoadingSpinner';
import ErrorBoundary from './ErrorBoundary';

const Dashboard = () => {
  const [status, setStatus] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statusResponse, postsResponse] = await Promise.all([
        automationAPI.getStatus(),
        automationAPI.getPosts(1, 10)
      ]);
      
      setStatus(statusResponse.data.data);
      setPosts(postsResponse.data.data.posts);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchData();
  };

  const handleRunAutomation = async () => {
    try {
      setLoading(true);
      await automationAPI.runAutomation();
      await fetchData(); // Refresh data after running
    } catch (err) {
      console.error('Error running automation:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !status) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <Activity className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Instagram Automation</h1>
                  <p className="text-sm text-gray-500">Monitoring Dashboard</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  Last updated: {format(lastUpdated, 'HH:mm:ss')}
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={handleRunAutomation}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  <Play className="h-4 w-4" />
                  <span>Run Now</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatusCard
              title="Today's Posts"
              value={status?.todayPosts || 0}
              icon={Calendar}
              color="blue"
              subtitle={`Topic: ${status?.todayTopic || 'N/A'}`}
            />
            <StatusCard
              title="System Status"
              value="Online"
              icon={CheckCircle}
              color="green"
              subtitle="All services running"
            />
            <StatusCard
              title="Recent Activity"
              value={posts.length}
              icon={TrendingUp}
              color="purple"
              subtitle="Posts in last 10"
            />
            <StatusCard
              title="Next Run"
              value="10:00 AM"
              icon={Clock}
              color="orange"
              subtitle="Daily automation"
            />
          </div>

          {/* Charts and Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Post Status Distribution</h3>
              <AnalyticsChart posts={posts} />
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Database Connection</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Connected</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Instagram API</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Active</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Email Service</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Ready</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Scheduler</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Running</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Posts and Control Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <RecentPosts posts={posts} onRefresh={handleRefresh} />
            </div>
            <div>
              <ControlPanel onRunAutomation={handleRunAutomation} loading={loading} />
            </div>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;
