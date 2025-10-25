import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    return Promise.reject(error);
  }
);

export const automationAPI = {
  // Get automation status
  getStatus: () => api.get('/api/status'),
  
  // Run automation manually
  runAutomation: () => api.post('/api/run'),
  
  // Get posts with pagination
  getPosts: (page = 1, limit = 10) => 
    api.get(`/api/posts?page=${page}&limit=${limit}`),
  
  // Get specific post
  getPost: (postId) => api.get(`/api/posts/${postId}`),
  
  // Cleanup operations
  cleanupImages: () => api.post('/api/cleanup/images'),
  cleanupPosts: () => api.post('/api/cleanup/posts'),
  
  // Health check
  healthCheck: () => api.get('/health'),
};

export const jobAPI = {
  // Post job update
  postJobUpdate: () => api.post('/api/jobs/post'),
  
  // Get job posting status
  getJobStatus: () => api.get('/api/jobs/status'),
  
  // Test job fetching
  testJobFetching: () => api.get('/api/jobs/test'),
};

export const approvalAPI = {
  // Handle post approval
  acceptPost: (postId, emailId) => 
    api.get(`/api/approve/${postId}/${emailId}/accept`),
  
  declinePost: (postId, emailId) => 
    api.get(`/api/approve/${postId}/${emailId}/decline`),
  
  retryPost: (postId, emailId) => 
    api.get(`/api/approve/${postId}/${emailId}/retry`),
};

export default api;
