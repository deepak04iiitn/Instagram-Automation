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
  Settings,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
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
      const statusResponse = await automationAPI.getStatus();
      console.log('Status response:', statusResponse.data.data);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Loading Dashboard..." />
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header with Glassmorphism */}
        <motion.header 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-gray-200/50 shadow-sm"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center space-x-3">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg"
                >
                  <Sparkles className="h-6 w-6 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Automation Dashboard
                  </h1>
                  <p className="text-sm text-gray-500">Real-time monitoring & control</p>
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium">Refresh</span>
              </motion.button>
            </div>
          </div>
        </motion.header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3"
              >
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Status Cards Grid */}
            <motion.div variants={itemVariants}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <StatusCard
                  title="Total Posts"
                  value={status?.totalPosts || 0}
                  icon={Activity}
                  color="blue"
                  subtitle="All time"
                  trend={{ value: '+12%', positive: true }}
                />
                <StatusCard
                  title="Posted"
                  value={status?.posted || 0}
                  icon={CheckCircle}
                  color="green"
                  subtitle="Success rate"
                />
                <StatusCard
                  title="Pending"
                  value={status?.pending || 0}
                  icon={Clock}
                  color="orange"
                  subtitle="In queue"
                />
                <StatusCard
                  title="Failed"
                  value={status?.failed || 0}
                  icon={XCircle}
                  color="red"
                  subtitle="Needs attention"
                />
              </div>
            </motion.div>

            {/* Control Panel */}
            <motion.div variants={itemVariants}>
              <ControlPanel onRunAutomation={handleRunAutomation} loading={loading} />
            </motion.div>

            {/* Analytics & Recent Posts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div variants={itemVariants} className="lg:col-span-1">
                <AnalyticsChart posts={posts} />
              </motion.div>
              
              <motion.div variants={itemVariants} className="lg:col-span-2">
                <RecentPosts posts={posts} onRefresh={handleRefresh} />
              </motion.div>
            </div>

            {/* Footer Info */}
            <motion.div 
              variants={itemVariants}
              className="flex justify-center items-center space-x-2 text-sm text-gray-500"
            >
              <Clock className="h-4 w-4" />
              <span>Last updated: {format(lastUpdated, 'MMM dd, yyyy HH:mm:ss')}</span>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;
