import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  ExternalLink,
  Image as ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Activity
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '../utils/cn';

const RecentPosts = ({ posts, onRefresh }) => {
  const [expandedPost, setExpandedPost] = useState(null);
  const [imageLoaded, setImageLoaded] = useState({});
  const [imageModal, setImageModal] = useState({ isOpen: false, images: [], currentIndex: 0 });

  const getStatusIcon = (status) => {
    const icons = {
      posted: <CheckCircle className="h-4 w-4" />,
      pending: <Clock className="h-4 w-4" />,
      failed: <XCircle className="h-4 w-4" />,
      declined: <AlertCircle className="h-4 w-4" />,
    };
    return icons[status] || <Activity className="h-4 w-4" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      posted: 'bg-green-500/20 text-green-400 border-green-500/30',
      pending: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      failed: 'bg-red-500/20 text-red-400 border-red-500/30',
      declined: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const truncateText = (text, maxLength = 150) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const openImageModal = (images, startIndex = 0) => {
    setImageModal({ isOpen: true, images, currentIndex: startIndex });
  };

  const closeImageModal = () => {
    setImageModal({ isOpen: false, images: [], currentIndex: 0 });
  };

  const nextImage = () => {
    setImageModal(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.images.length
    }));
  };

  const prevImage = () => {
    setImageModal(prev => ({
      ...prev,
      currentIndex: prev.currentIndex === 0 ? prev.images.length - 1 : prev.currentIndex - 1
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/50 rounded-2xl shadow-lg border border-gray-700/50 overflow-hidden backdrop-blur-sm"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white">Recent Posts</h3>
              <p className="text-xs sm:text-sm text-purple-100">Latest automation activities</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-white/20 rounded-full backdrop-blur-sm">
            <span className="text-sm font-semibold text-white">{posts.length}</span>
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="p-6">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-700/50 mb-4">
              <Activity className="h-8 w-8 text-gray-500" />
            </div>
            <h4 className="text-lg font-semibold text-gray-100 mb-2">No posts found</h4>
            <p className="text-sm text-gray-400">Posts will appear here once created</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post, index) => (
              <motion.div
                key={post._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative bg-gray-900/50 rounded-xl p-5 border border-gray-700/50 hover:border-gray-600/50 hover:shadow-md transition-all duration-300"
              >
                {/* Status Badge & Time */}
                <div className="flex items-center justify-between mb-3">
                  <div className={cn(
                    'inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold',
                    getStatusColor(post.status)
                  )}>
                    {getStatusIcon(post.status)}
                    <span>{post.status?.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs text-gray-400">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>

                {/* Topic */}
                <h4 className="text-base font-bold text-gray-100 mb-2 group-hover:text-blue-400 transition-colors">
                  {post.topic}
                </h4>

                {/* Content */}
                <p className="text-sm text-gray-400 leading-relaxed mb-3">
                  {expandedPost === post._id ? post.content : truncateText(post.content)}
                </p>

                {post.content && post.content.length > 150 && (
                  <button
                    onClick={() => setExpandedPost(expandedPost === post._id ? null : post._id)}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 mb-3 inline-flex items-center space-x-1"
                  >
                    <span>{expandedPost === post._id ? 'Show less' : 'Show more'}</span>
                  </button>
                )}

                {/* Images */}
                {post.images && post.images.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <ImageIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-xs font-medium text-gray-400">
                        {post.images.length} image{post.images.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {post.images.map((image, idx) => {
                        const imageUrl = image.cloudinaryUrl || image.googleDriveUrl || image.localPath;
                        return (
                          <motion.div
                            key={idx}
                            whileHover={{ scale: 1.05 }}
                            onClick={() => openImageModal(post.images, idx)}
                            className="relative aspect-video rounded-lg overflow-hidden bg-gray-800/50 shadow-sm cursor-pointer group/img border border-gray-700/30"
                          >
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={`Post image ${idx + 1}`}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-110"
                                onLoad={() => setImageLoaded(prev => ({ ...prev, [imageUrl]: true }))}
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <ImageIcon className="h-8 w-8 text-gray-600" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 transition-colors flex items-center justify-center">
                              <Eye className="h-5 w-5 text-white opacity-0 group-hover/img:opacity-100 transition-opacity" />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {post.errorMessage && (
                  <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-xs font-semibold text-red-400 mb-1">Error:</p>
                    <p className="text-xs text-red-300">{post.errorMessage}</p>
                  </div>
                )}

                {/* Post Link */}
                {post.postUrl && (
                  <a
                    href={post.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors mb-3"
                  >
                    <span>View Post</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}

                {/* Footer Metadata */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
                  <div className="flex items-center space-x-1.5 text-xs text-gray-400">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{format(new Date(post.createdAt), 'MMM dd, yyyy')}</span>
                  </div>
                  {post.scheduledFor && (
                    <div className="flex items-center space-x-1.5 text-xs text-gray-400">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Scheduled: {format(new Date(post.scheduledFor), 'MMM dd, HH:mm')}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {imageModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeImageModal}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl w-full"
            >
              {/* Close button */}
              <button
                onClick={closeImageModal}
                className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>

              {/* Navigation buttons */}
              {imageModal.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}

              {/* Image */}
              <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-700">
                <img
                  src={
                    imageModal.images[imageModal.currentIndex]?.cloudinaryUrl ||
                    imageModal.images[imageModal.currentIndex]?.googleDriveUrl ||
                    imageModal.images[imageModal.currentIndex]?.localPath
                  }
                  alt={`Preview ${imageModal.currentIndex + 1}`}
                  className="w-full max-h-[80vh] object-contain"
                />
              </div>

              {/* Image counter */}
              {imageModal.images.length > 1 && (
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium">
                  {imageModal.currentIndex + 1} / {imageModal.images.length}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default RecentPosts;
