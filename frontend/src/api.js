import axios from 'axios';

// ============================================
// BASE URL CONFIGURATION
// ============================================
const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL;
  if (!url) return 'http://localhost:5000/api';
  
  url = url.replace(/\/+$/, ''); // Remove trailing slash
  return url.endsWith('/api') ? url : `${url}/api`;
};

const API_BASE_URL = getBaseUrl();
const apiClient = axios.create({ 
  baseURL: API_BASE_URL, 
  headers: { 'Content-Type': 'application/json' } 
});

// ============================================
// INTERCEPTORS
// ============================================
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Special handling for binary/file responses
    if (error.response?.data instanceof Blob) return Promise.resolve(error.response.data);
    return Promise.reject({ success: false, error: error.response?.data?.error || error.message });
  }
);

// ============================================
// API METHODS
// ============================================
const api = {
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
    const fd = new FormData(); 
    fd.append('file', file); 
    fd.append('suiteName', suiteName); 
    fd.append('projectId', projectId);
    return apiClient.post('/upload/csv', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  
  // Execution
  getTestRuns: (projectId) => apiClient.get('/test-runs', { params: { projectId } }),
  getExecutionResults: (runId) => apiClient.get(`/test-runs/${runId}/results`),
  createTestRun: (data) => apiClient.post('/test-runs', data),
  deleteTestRun: (id) => apiClient.delete(`/test-runs/${id}`),
  updateExecutionResult: (id, data) => apiClient.put(`/execution-results/${id}`, data),
  deleteExecutionResult: (id) => apiClient.delete(`/execution-results/${id}`),
  
  // Reports
  getReports: (projectId) => apiClient.get('/reports', { params: { projectId } }),
  generateReport: (runId, format, projectId) => apiClient.post('/reports/generate', { runId, format, projectId }),
  deleteReport: (id) => apiClient.delete(`/reports/${id}`),
  downloadReportFile: async (id, fileName) => {
    const res = await apiClient.get(`/reports/${id}/download`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res]));
    const link = document.createElement('a'); 
    link.href = url; 
    link.setAttribute('download', fileName);
    document.body.appendChild(link); 
    link.click(); 
    link.remove();
  },
  
  // Stats & Settings
  getStatistics: (projectId) => apiClient.get('/statistics', { params: { projectId } }),
  getSettings: () => apiClient.get('/settings'),
  updateSettings: (category, data) => apiClient.put(`/settings/${category}`, data),
  
  // DYNAMIC FILE URL GENERATOR
  // This takes the path from DB (e.g. /uploads/bugs/file.mp4) 
  // and turns it into a full URL (e.g. https://app.onrender.com/uploads/bugs/file.mp4)
  getFileUrl: (path) => {
    if (!path) return '';
    const root = API_BASE_URL.replace('/api', '').replace(/\/+$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${root}${cleanPath}`;
  }
};

export default api;