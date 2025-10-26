import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  Clock,
  AlertCircle,
  Eye,
  ExternalLink,
  RefreshCw,
  Calendar,
  User,
  Mail,
  Loader2
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { automationAPI, approvalAPI } from '../services/api';
import { cn } from '../utils/cn';

const ApprovalPanel = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [expandedPost, setExpandedPost] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const fetchPostsNeedingApproval = async () => {
    try {
      setLoading(true);
      const response = await automationAPI.getPosts(1, 50); // Get more posts to find pending ones
      const allPosts = response.data.data.posts || [];
      
      // Filter posts that need approval (pending status)
      const pendingPosts = allPosts.filter(post => 
        post.status === 'pending' || 
        post.status === 'generated' ||
        (post.status === 'failed' && post.retryCount < post.maxRetries)
      );
      
      setPosts(pendingPosts);
      setError(null);
    } catch (err) {
      console.error('Error fetching posts needing approval:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostsNeedingApproval();
    const interval = setInterval(fetchPostsNeedingApproval, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleApprovalAction = async (postId, action, emailId = 'manual') => {
    try {
      setActionLoading(prev => ({ ...prev, [`${postId}-${action}`]: true }));
      
      let result;
      switch (action) {
        case 'accept':
          result = await approvalAPI.acceptPost(postId, emailId);
          addNotification('Post approved and published successfully!', 'success');
          break;
        case 'decline':
          result = await approvalAPI.declinePost(postId, emailId);
          addNotification('Post declined successfully', 'info');
          break;
        case 'retry':
          result = await approvalAPI.retryPost(postId, emailId);
          addNotification('Post retry initiated successfully', 'warning');
          break;
        default:
          throw new Error('Invalid action');
      }
      
      // Refresh the posts list
      await fetchPostsNeedingApproval();
      
    } catch (error) {
      console.error(`Error ${action}ing post:`, error);
      addNotification(`Error ${action}ing post: ${error.message}`, 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`${postId}-${action}`]: false }));
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="h-4 w-4" />,
      generated: <AlertCircle className="h-4 w-4" />,
      failed: <XCircle className="h-4 w-4" />,
    };
    return icons[status] || <Clock className="h-4 w-4" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      generated: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      failed: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const truncateText = (text, maxLength = 200) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatContent = (content) => {
    if (!content) return 'No content available';
    const [questionPart, solutionPart] = content.split("|||SPLIT|||");
    return {
      question: questionPart?.trim() || "No question provided",
      solution: solutionPart?.trim() || "No solution provided"
    };
  };

  if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
          <span className="text-gray-300">Loading posts needing approval...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
        <div className="flex items-center space-x-2 text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span>Error loading posts: {error}</span>
        </div>
        <button
          onClick={fetchPostsNeedingApproval}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Post Approval Panel</h2>
          <p className="text-gray-400">
            {posts.length} post{posts.length !== 1 ? 's' : ''} need{posts.length === 1 ? 's' : ''} approval
          </p>
        </div>
        <button
          onClick={fetchPostsNeedingApproval}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "p-4 rounded-lg border",
              notification.type === 'success' && "bg-green-500/20 text-green-400 border-green-500/30",
              notification.type === 'error' && "bg-red-500/20 text-red-400 border-red-500/30",
              notification.type === 'warning' && "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
              notification.type === 'info' && "bg-blue-500/20 text-blue-400 border-blue-500/30"
            )}
          >
            {notification.message}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Posts List */}
      {posts.length === 0 ? (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">All Caught Up!</h3>
          <p className="text-gray-400">No posts currently need approval.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const content = formatContent(post.content);
            const isExpanded = expandedPost === post._id;
            const isLoading = Object.keys(actionLoading).some(key => key.startsWith(`${post._id}-`));

            return (
              <motion.div
                key={post._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden"
              >
                {/* Post Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{post.topic}</h3>
                        <span className={cn(
                          "inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                          getStatusColor(post.status)
                        )}>
                          {getStatusIcon(post.status)}
                          <span className="capitalize">{post.status}</span>
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(post.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>Retry: {post.retryCount || 0}/{post.maxRetries || 3}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setExpandedPost(isExpanded ? null : post._id)}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        <span>{isExpanded ? 'Hide' : 'View'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleApprovalAction(post._id, 'accept')}
                      disabled={isLoading}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white rounded-lg transition-colors"
                    >
                      {actionLoading[`${post._id}-accept`] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      <span>Accept & Post</span>
                    </button>

                    <button
                      onClick={() => handleApprovalAction(post._id, 'decline')}
                      disabled={isLoading}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white rounded-lg transition-colors"
                    >
                      {actionLoading[`${post._id}-decline`] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      <span>Decline</span>
                    </button>

                    {(post.retryCount || 0) < (post.maxRetries || 3) && (
                      <button
                        onClick={() => handleApprovalAction(post._id, 'retry')}
                        disabled={isLoading}
                        className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-600/50 text-white rounded-lg transition-colors"
                      >
                        {actionLoading[`${post._id}-retry`] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RotateCcw className="h-4 w-4" />
                        )}
                        <span>Retry</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-700/50"
                    >
                      <div className="p-6 space-y-6">
                        {/* Question Section */}
                        <div>
                          <h4 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center space-x-2">
                            <AlertCircle className="h-4 w-4" />
                            <span>Question</span>
                          </h4>
                          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                            <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                              {content.question}
                            </pre>
                          </div>
                        </div>

                        {/* Solution Section */}
                        <div>
                          <h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4" />
                            <span>Solution</span>
                          </h4>
                          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                            <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                              {content.solution}
                            </pre>
                          </div>
                        </div>

                        {/* Post Metadata */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-700/50">
                          <div>
                            <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Post Details</h5>
                            <div className="space-y-1 text-sm text-gray-300">
                              <div><span className="font-medium">ID:</span> {post._id}</div>
                              <div><span className="font-medium">Created:</span> {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</div>
                              <div><span className="font-medium">Status:</span> {post.status}</div>
                              <div><span className="font-medium">Retry Count:</span> {post.retryCount || 0}/{post.maxRetries || 3}</div>
                            </div>
                          </div>
                          
                          <div>
                            <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Actions</h5>
                            <div className="space-y-2">
                              <a
                                href={`/api/approve/${post._id}/manual`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                              >
                                <ExternalLink className="h-3 w-3" />
                                <span>Manual Approval Link</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ApprovalPanel;
