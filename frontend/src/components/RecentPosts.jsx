import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  ExternalLink,
  ChevronDown,
  Image as ImageIcon,
  Activity,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '../utils/cn';

const RecentPosts = ({ posts, onRefresh }) => {
  const [expandedPost, setExpandedPost] = useState(null);
  const [imageLoaded, setImageLoaded] = useState({});
  const [imageModal, setImageModal] = useState({ isOpen: false, images: [], currentIndex: 0 });

  const getStatusIcon = (status) => {
    const icons = {
      posted: <CheckCircle className="h-5 w-5 text-green-600" />,
      pending: <Clock className="h-5 w-5 text-orange-600" />,
      failed: <XCircle className="h-5 w-5 text-red-600" />,
      declined: <AlertCircle className="h-5 w-5 text-gray-600" />,
    };
    return icons[status] || <Clock className="h-5 w-5 text-gray-600" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      posted: 'bg-green-100 text-green-700 border-green-200',
      pending: 'bg-orange-100 text-orange-700 border-orange-200',
      failed: 'bg-red-100 text-red-700 border-red-200',
      declined: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const openImageModal = (images, startIndex = 0) => {
    setImageModal({
      isOpen: true,
      images: images,
      currentIndex: startIndex
    });
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
    >
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Recent Posts</h2>
              <p className="text-sm text-gray-500">Latest automation activities</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRefresh}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <RefreshCw className="h-5 w-5 text-gray-600" />
          </motion.button>
        </div>
      </div>

      <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
        {posts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-12 text-center"
          >
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No posts found</p>
            <p className="text-sm text-gray-400 mt-1">Posts will appear here once created</p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="divide-y divide-gray-100"
          >
            {posts.map((post) => (
              <motion.div
                key={post._id}
                variants={itemVariants}
                layout
                className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-300"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {getStatusIcon(post.status)}
                      </motion.div>
                      <div>
                        <span className={cn(
                          'inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border',
                          getStatusColor(post.status)
                        )}>
                          {post.status?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                    </span>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {post.topic}
                  </h3>

                  <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                    {expandedPost === post._id ? post.content : truncateText(post.content)}
                  </p>

                  {post.content && post.content.length > 100 && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setExpandedPost(expandedPost === post._id ? null : post._id)}
                      className="flex items-center space-x-1 text-xs font-medium text-blue-600 hover:text-blue-700 mb-3"
                    >
                      <span>{expandedPost === post._id ? 'Show less' : 'Show more'}</span>
                      <motion.div
                        animate={{ rotate: expandedPost === post._id ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </motion.div>
                    </motion.button>
                  )}

                  {/* Images - Always show if available */}
                  {post.images && post.images.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <ImageIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-xs font-medium text-gray-600">
                          {post.images.length} image{post.images.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      {/* Show all images in a grid */}
                      <div className="grid grid-cols-2 gap-2">
                        {post.images.map((image, idx) => {
                          const imageUrl = image.cloudinaryUrl || image.googleDriveUrl || image.localPath;
                          
                          return (
                            <motion.div
                              key={idx}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => openImageModal(post.images, idx)}
                              className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 shadow-sm cursor-pointer group"
                            >
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={`Post image ${idx + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                  <ImageIcon className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                              {/* Hover overlay */}
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <Eye className="h-5 w-5 text-white" />
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )}


                  {/* Error Message */}
                  {post.errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2 mb-3"
                    >
                      <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-red-700">Error:</p>
                        <p className="text-xs text-red-600">{post.errorMessage}</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Post Link */}
                  {post.postUrl && (
                    <motion.a
                      href={post.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.02, x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex items-center space-x-2 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>View Post</span>
                    </motion.a>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center space-x-4 mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(post.createdAt), 'MMM dd, yyyy')}</span>
                    </div>
                    {post.scheduledFor && (
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>Scheduled: {format(new Date(post.scheduledFor), 'MMM dd, HH:mm')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {imageModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
            onClick={closeImageModal}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-4xl max-h-[90vh] w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={closeImageModal}
                className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
              >
                <X className="h-6 w-6" />
              </button>

              {/* Navigation buttons */}
              {imageModal.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}

              {/* Image */}
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={imageModal.images[imageModal.currentIndex]?.cloudinaryUrl || 
                        imageModal.images[imageModal.currentIndex]?.googleDriveUrl || 
                        imageModal.images[imageModal.currentIndex]?.localPath}
                  alt={`Image ${imageModal.currentIndex + 1}`}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              </div>

              {/* Image counter */}
              {imageModal.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                  {imageModal.currentIndex + 1} / {imageModal.images.length}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </motion.div>
  );
};

export default RecentPosts;
