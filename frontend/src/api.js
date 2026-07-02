import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL
  || (import.meta.env.PROD ? 'https://qa-test-manager-backend.onrender.com/api' : '/api');

const apiClient = axios.create({ baseURL: API_BASE_URL, headers: { 'Content-Type': 'application/json' } });

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (!error.config?.url?.includes('/auth/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    if (error.response?.data instanceof Blob) return Promise.resolve(error.response.data);
    return Promise.reject({ success: false, error: error.response?.data?.error || error.message });
  }
);

const api = {
  // Auth
  login: (data) => apiClient.post('/auth/login', data),
  changePassword: (data) => apiClient.post('/auth/change-password', data),
  getMe: () => apiClient.get('/auth/me'),

  // Users
  searchUsers: (query) => apiClient.get('/users/search', { params: { q: query } }),
  getAllUsers: () => apiClient.get('/users'),

  // Admin
  getUsers: () => apiClient.get('/admin/users'),
  createUser: (data) => apiClient.post('/admin/users', data),
  updateUser: (id, data) => apiClient.put(`/admin/users/${id}`, data),
  deleteUser: (id) => apiClient.delete(`/admin/users/${id}`),
  resetPassword: (id) => apiClient.post(`/admin/users/${id}/reset-password`),
  assignProject: (projectId, userIds) => apiClient.post(`/admin/projects/${projectId}/assign`, { userIds }),
  getProjectUsers: (projectId) => apiClient.get(`/admin/projects/${projectId}/users`),

  // Projects
  getProjects: () => apiClient.get('/projects'),
  createProject: (data) => apiClient.post('/projects', data),
  
  // Bugs
  getBugs: (projectId) => apiClient.get('/bugs', { params: { projectId } }),
  createBug: (formData) => apiClient.post('/bugs', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateBug: (id, formData) => apiClient.put(`/bugs/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteBug: (id) => apiClient.delete(`/bugs/${id}`),
  
  // Test Suites
  getTestSuites: (projectId) => apiClient.get('/test-suites', { params: { projectId } }),
  createTestSuite: (data) => apiClient.post('/test-suites', data),
  deleteTestSuite: (id) => apiClient.delete(`/test-suites/${id}`),
  
  // Test Cases
  getTestCases: (projectId, suiteId) => apiClient.get('/test-cases', { params: { projectId, suiteId } }),
  createTestCase: (data) => apiClient.post('/test-cases', data),
  updateTestCase: (id, data) => apiClient.put(`/test-cases/${id}`, data),
  deleteTestCase: (id) => apiClient.delete(`/test-cases/${id}`),
  
  // CSV Import
  uploadCSV: (file, suiteName, projectId) => {
    const fd = new FormData(); fd.append('file', file); fd.append('suiteName', suiteName); fd.append('projectId', projectId);
    return apiClient.post('/upload/csv', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  
  // Test Runs
  getTestRuns: (projectId) => apiClient.get('/test-runs', { params: { projectId } }),
  getExecutionResults: (runId) => apiClient.get(`/test-runs/${runId}/results`),
  createTestRun: (data) => apiClient.post('/test-runs', data),
  deleteTestRun: (id) => apiClient.delete(`/test-runs/${id}`),
  
  // Execution Results
  updateExecutionResult: (id, data) => apiClient.put(`/execution-results/${id}`, data),
  deleteExecutionResult: (id) => apiClient.delete(`/execution-results/${id}`),
  
  // Reports
  getReports: (projectId) => apiClient.get('/reports', { params: { projectId } }),
  generateReport: (runId, format, projectId) => apiClient.post('/reports/generate', { runId, format, projectId }),
  deleteReport: (id) => apiClient.delete(`/reports/${id}`),
  downloadReportFile: async (id, fileName) => {
    const res = await apiClient.get(`/reports/${id}/download`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res]));
    const link = document.createElement('a'); link.href = url; link.setAttribute('download', fileName);
    document.body.appendChild(link); link.click(); link.remove();
  },
  
  // Statistics & Settings
  getStatistics: (projectId) => apiClient.get('/statistics', { params: { projectId } }),
  getSettings: () => apiClient.get('/settings'),
  updateSettings: (category, data) => apiClient.put(`/settings/${category}`, data),

  // File URL Resolver
  getFileUrl: (path) => {
    if (!path || typeof path !== 'string') return '#';
    
    // 1. If path is already a full URL (Cloudinary), return it
    if (path.indexOf('://') !== -1) {
      return path;
    }
    
    // 2. If it's a local file
    const root = API_BASE_URL.replace('/api', '').replace(/\/+$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${root}${cleanPath}`;
  }
};

export default api;