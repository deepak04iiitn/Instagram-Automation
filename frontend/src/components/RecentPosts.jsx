import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  Eye,
  ExternalLink
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '../utils/cn';

const RecentPosts = ({ posts, onRefresh }) => {
  const [expandedPost, setExpandedPost] = useState(null);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'posted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'declined':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'posted':
        return 'bg-green-100 text-green-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const truncateText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recent Posts</h3>
          <button
            onClick={onRefresh}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="divide-y divide-gray-200">
        {posts.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No posts found</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post._id} className="px-6 py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    {getStatusIcon(post.status)}
                    <span className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      getStatusColor(post.status)
                    )}>
                      {post.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  
                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                    {post.topic}
                  </h4>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {truncateText(post.content)}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(new Date(post.createdAt), 'MMM dd, yyyy')}
                    </span>
                    {post.postedAt && (
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Posted: {format(new Date(post.postedAt), 'MMM dd, HH:mm')}
                      </span>
                    )}
                    {post.retryCount > 0 && (
                      <span className="text-orange-600">
                        Retries: {post.retryCount}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => setExpandedPost(expandedPost === post._id ? null : post._id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {post.instagramPostId && (
                    <a
                      href={`https://www.instagram.com/p/${post.instagramPostId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
              
              {expandedPost === post._id && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-900 mb-2">Full Content:</h5>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{post.content}</p>
                  
                  {post.images && post.images.length > 0 && (
                    <div className="mt-3">
                      <h6 className="text-xs font-medium text-gray-700 mb-2">Images ({post.images.length}):</h6>
                      <div className="flex space-x-2">
                        {post.images.map((image, index) => (
                          <div key={index} className="text-xs text-gray-500">
                            Image {index + 1}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {post.errorMessage && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                      <p className="text-xs text-red-700">
                        <strong>Error:</strong> {post.errorMessage}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentPosts;
