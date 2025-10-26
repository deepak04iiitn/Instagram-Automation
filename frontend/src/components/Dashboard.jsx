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
  Menu,
  X as CloseIcon,
  BarChart3,
  Zap,
  Target,
  Bell
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import StatusCard from './StatusCard';
import RecentPosts from './RecentPosts';
import AnalyticsChart from './AnalyticsChart';
import ControlPanel from './ControlPanel';
import ApprovalPanel from './ApprovalPanel';
import LoadingSpinner from './LoadingSpinner';
import ErrorBoundary from './ErrorBoundary';

const Dashboard = () => {
  const [status, setStatus] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' or 'approval'

  const fetchData = async () => {
    try {
      setLoading(true);
      const statusResponse = await automationAPI.getStatus();
      setStatus(statusResponse.data.data);
      setPosts(statusResponse.data.data.recentPosts || []);
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
      await fetchData();
    } catch (err) {
      console.error('Error running automation:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !status) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Loading SDETron Dashboard..." />
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Total Posts',
      value: status?.totalPosts || 0,
      icon: Activity,
      color: 'blue',
      subtitle: 'All time',
      trend: status?.totalPosts > 0 ? { value: '+12%', positive: true } : null
    },
    {
      title: 'Posted',
      value: status?.posted || 0,
      icon: CheckCircle,
      color: 'green',
      subtitle: 'Successfully published',
      trend: { value: '+8%', positive: true }
    },
    {
      title: 'Pending',
      value: status?.pending || 0,
      icon: Clock,
      color: 'orange',
      subtitle: 'Awaiting review'
    },
    {
      title: 'Failed',
      value: status?.failed || 0,
      icon: XCircle,
      color: 'red',
      subtitle: 'Need attention',
      trend: status?.failed > 0 ? { value: '-5%', positive: true } : null
    }
  ];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
        {/* Modern Dark Navigation Header */}
        <motion.nav
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800/50 shadow-xl"
        >
          <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-20">
              {/* Logo Section */}
              <div className="flex items-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-3 sm:space-x-4"
                >
                  <img
                    src="/SDETron.png"
                    alt="SDETron Logo"
                    className="h-30 w-30 sm:h-40 sm:w-40 lg:h-50 lg:w-50 object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div
                    className="hidden h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 items-center justify-center shadow-lg"
                  >
                    <Zap className="h-7 w-7 sm:h-9 sm:w-9 lg:h-11 lg:w-11 text-white" />
                  </div>
                  
                  {/* Robotic SDETron Text */}
                  <div className="hidden sm:block">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-wider font-mono bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent"
                        style={{
                          fontFamily: "'Courier New', 'Lucida Console', 'Roboto Mono', monospace",
                          letterSpacing: '0.15em',
                          textShadow: '0 0 20px rgba(59, 130, 246, 0.3)'
                        }}>
                      SDETron
                    </h1>
                  </div>
                </motion.div>
              </div>


              {/* Center Status Indicator - Hidden on mobile */}
              <div className="hidden lg:flex items-center space-x-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
                <div className="relative">
                  <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                  <div className="absolute inset-0 h-2 w-2 bg-green-400 rounded-full animate-ping opacity-75" />
                </div>
                <span className="text-sm font-medium text-green-400">System Active</span>
              </div>

              {/* Right Section */}
              <div className="flex items-center space-x-2 sm:space-x-4">
                {/* Navigation Buttons */}
                <div className="hidden md:flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      currentView === 'dashboard'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => setCurrentView('approval')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors relative ${
                      currentView === 'approval'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    Approvals
                    {status?.pending > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                        {status.pending}
                      </span>
                    )}
                  </button>
                </div>

                {/* Last Updated */}
                <div className="hidden md:flex items-center space-x-2 text-xs sm:text-sm text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span className="hidden lg:inline">Updated:</span>
                  <span className="font-medium text-gray-300">{format(lastUpdated, 'HH:mm')}</span>
                </div>

                {/* Refresh Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRefresh}
                  disabled={loading}
                  className="cursor-pointer p-2 sm:p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition-all disabled:opacity-50"
                  title="Refresh Dashboard"
                >
                  <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 ${loading ? 'animate-spin' : ''}`} />
                </motion.button>

                {/* Notifications */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="cursor-pointer p-2 sm:p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition-all relative"
                  title="Notifications"
                >
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                  {status?.pending > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 bg-red-500 rounded-full text-[10px] sm:text-xs text-white flex items-center justify-center font-bold">
                      {status.pending}
                    </span>
                  )}
                </motion.button>

                {/* Mobile Menu Toggle */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="cursor-pointer lg:hidden p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition-all"
                >
                  {sidebarOpen ? <CloseIcon className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>
        </motion.nav>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 mt-4"
            >
              <div className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded-lg shadow-sm backdrop-blur-sm">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
                  <p className="text-sm font-medium text-red-300">{error}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          {currentView === 'dashboard' ? (
            <>
              {/* Welcome Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 sm:mb-8"
              >
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
                  Welcome back! 👋
                </h2>
                <p className="text-sm sm:text-base text-gray-400">
                  Monitor your automation performance and track key metrics in real-time
                </p>
              </motion.div>

              {/* Stats Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8"
              >
                {statsCards.map((card, index) => (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <StatusCard {...card} />
                  </motion.div>
                ))}
              </motion.div>

              {/* Charts & Control Panel Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
                {/* Analytics Chart - 2 columns on xl screens */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="xl:col-span-2"
                >
                  <AnalyticsChart posts={posts} />
                </motion.div>

                {/* Control Panel - 1 column on xl screens */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <ControlPanel onRunAutomation={handleRunAutomation} loading={loading} />
                </motion.div>
              </div>

              {/* Recent Posts */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <RecentPosts posts={posts} onRefresh={handleRefresh} />
              </motion.div>
            </>
          ) : (
            /* Approval Panel */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ApprovalPanel />
            </motion.div>
          )}
        </main>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25 }}
                className="fixed right-0 top-0 h-full w-80 bg-gray-900 shadow-2xl z-50 lg:hidden overflow-y-auto border-l border-gray-800"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white">Navigation</h3>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-2 rounded-lg hover:bg-gray-800"
                    >
                      <CloseIcon className="h-5 w-5 text-gray-400" />
                    </button>
                  </div>
                  
                  {/* Mobile Navigation */}
                  <div className="mb-6 space-y-2">
                    <button
                      onClick={() => {
                        setCurrentView('dashboard');
                        setSidebarOpen(false);
                      }}
                      className={`w-full px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                        currentView === 'dashboard'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      }`}
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => {
                        setCurrentView('approval');
                        setSidebarOpen(false);
                      }}
                      className={`w-full px-4 py-3 rounded-lg text-left font-medium transition-colors relative ${
                        currentView === 'approval'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      }`}
                    >
                      Approvals
                      {status?.pending > 0 && (
                        <span className="absolute top-2 right-2 h-5 w-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
                          {status.pending}
                        </span>
                      )}
                    </button>
                  </div>
                  
                  <ControlPanel onRunAutomation={handleRunAutomation} loading={loading} />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;
