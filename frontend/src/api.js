import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL ? 
  (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : `${import.meta.env.VITE_API_URL}/api`) : 
  'http://localhost:5000/api';

const apiClient = axios.create({ baseURL: API_BASE_URL, headers: { 'Content-Type': 'application/json' } });

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.data instanceof Blob) return Promise.resolve(error.response.data);
    return Promise.reject({ success: false, error: error.response?.data?.error || error.message });
  }
);

const api = {
  getProjects: () => apiClient.get('/projects'),
  createProject: (data) => apiClient.post('/projects', data),
  getTestSuites: (projectId) => apiClient.get('/test-suites', { params: { projectId } }),
  createTestSuite: (data) => apiClient.post('/test-suites', data),
  deleteTestSuite: (id) => apiClient.delete(`/test-suites/${id}`),
  getTestCases: (projectId, suiteId) => apiClient.get('/test-cases', { params: { projectId, suiteId } }),
  createTestCase: (data) => apiClient.post('/test-cases', data),
  updateTestCase: (id, data) => apiClient.put(`/test-cases/${id}`, data),
  deleteTestCase: (id) => apiClient.delete(`/test-cases/${id}`),
  uploadCSV: (file, suiteName, projectId) => {
    const fd = new FormData(); fd.append('file', file); fd.append('suiteName', suiteName); fd.append('projectId', projectId);
    return apiClient.post('/upload/csv', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  getTestRuns: (projectId) => apiClient.get('/test-runs', { params: { projectId } }),
  getExecutionResults: (runId) => apiClient.get(`/test-runs/${runId}/results`),
  createTestRun: (data) => apiClient.post('/test-runs', data),
  deleteTestRun: (id) => apiClient.delete(`/test-runs/${id}`),
  updateExecutionResult: (id, data) => apiClient.put(`/execution-results/${id}`, data),
  deleteExecutionResult: (id) => apiClient.delete(`/execution-results/${id}`),
  getReports: (projectId) => apiClient.get('/reports', { params: { projectId } }),
  generateReport: (runId, format, projectId) => apiClient.post('/reports/generate', { runId, format, projectId }),
  deleteReport: (id) => apiClient.delete(`/reports/${id}`),
  downloadReportFile: async (id, fileName) => {
    const res = await apiClient.get(`/reports/${id}/download`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res]));
    const link = document.createElement('a'); link.href = url; link.setAttribute('download', fileName);
    document.body.appendChild(link); link.click(); link.remove();
  },
  getStatistics: (projectId) => apiClient.get('/statistics', { params: { projectId } }),
  getSettings: () => apiClient.get('/settings'),
  updateSettings: (category, data) => apiClient.put(`/settings/${category}`, data)
};

export default api;