import axios from 'axios';

const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL;
  if (!url) return 'http://localhost:5000/api';
  url = url.replace(/\/+$/, '');
  return url.endsWith('/api') ? url : `${url}/api`;
};

const API_BASE_URL = getBaseUrl();
const apiClient = axios.create({ baseURL: API_BASE_URL, headers: { 'Content-Type': 'application/json' } });

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject({ success: false, error: error.response?.data?.error || error.message })
);

const api = {
  // Projects
  getProjects: () => apiClient.get('/projects'),
  createProject: (data) => apiClient.post('/projects', data),

  // Test Suites
  getTestSuites: (projectId) => apiClient.get('/test-suites', { params: { projectId } }),
  createTestSuite: (data) => apiClient.post('/test-suites', data), 
  deleteTestSuite: (id) => apiClient.delete(`/test-suites/${id}`),
  
  // Test Cases
  getTestCases: (projectId, suiteId) => apiClient.get('/test-cases', { params: { projectId, suiteId } }),
  createTestCase: (data) => apiClient.post('/test-cases', data), 
  updateTestCase: (id, data) => apiClient.put(`/test-cases/${id}`, data),
  deleteTestCase: (id) => apiClient.delete(`/test-cases/${id}`),
  
  // CSV
  uploadCSV: (file, suiteName, projectId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('suiteName', suiteName);
    formData.append('projectId', projectId);
    return apiClient.post('/upload/csv', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  
  // Runs
  getTestRuns: (projectId) => apiClient.get('/test-runs', { params: { projectId } }),
  getExecutionResults: (runId) => apiClient.get(`/test-runs/${runId}/results`),
  createTestRun: (data) => apiClient.post('/test-runs', data),
  deleteTestRun: (id) => apiClient.delete(`/test-runs/${id}`),
  updateExecutionResult: (id, data) => apiClient.put(`/execution-results/${id}`, data),
  
  // Reports
  getReports: (projectId) => apiClient.get('/reports', { params: { projectId } }),
  generateReport: (runId, format, projectId) => apiClient.post('/reports/generate', { runId, format, projectId }),
  deleteReport: (id) => apiClient.delete(`/reports/${id}`),
  downloadReportFile: (id, fileName) => {
    return axios({
        url: `${API_BASE_URL}/reports/${id}/download`,
        method: 'GET',
        responseType: 'blob',
    }).then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        return { success: true };
    });
  },
  
  // Misc
  getStatistics: (projectId) => apiClient.get('/statistics', { params: { projectId } }),
  getSettings: () => apiClient.get('/settings'),
  updateSettings: (category, data) => apiClient.put(`/settings/${category}`, data),
};

export default api;