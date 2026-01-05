import axios from 'axios';

// ============================================
// AXIOS INSTANCE CONFIGURATION
// ============================================

// Logic to handle both Localhost and Production URL automatically
const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL;
  
  if (!url) {
    return 'http://localhost:5000/api';
  }

  // Ensure the URL has the /api suffix but no double slashes
  url = url.replace(/\/+$/, ''); // Remove trailing slashes
  return url.endsWith('/api') ? url : `${url}/api`;
};

const API_BASE_URL = getBaseUrl();

console.log("📡 Frontend connecting to API at:", API_BASE_URL);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 40000, // Increased timeout for waking up cold Render servers
  headers: {
    'Content-Type': 'application/json'
  }
});

// ============================================
// INTERCEPTORS
// ============================================

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorMessage = error.response?.data?.error 
      || error.message 
      || 'Connection lost. Backend might be sleeping, please wait 30 seconds and refresh.';
    
    console.error('❌ API Error:', errorMessage);
    return Promise.reject({ success: false, error: errorMessage });
  }
);

// ============================================
// API ENDPOINTS
// ============================================

const api = {
  // Test Suites
  getTestSuites: () => apiClient.get('/test-suites'),
  createTestSuite: (data) => apiClient.post('/test-suites', data),
  updateTestSuite: (id, data) => apiClient.put(`/test-suites/${id}`, data),
  deleteTestSuite: (id) => apiClient.delete(`/test-suites/${id}`),
  
  // Test Cases
  getTestCases: (suiteId = null) => apiClient.get('/test-cases', { params: suiteId ? { suiteId } : {} }),
  getTestCaseById: (id) => apiClient.get(`/test-cases/${id}`),
  createTestCase: (data) => apiClient.post('/test-cases', data),
  updateTestCase: (id, data) => apiClient.put(`/test-cases/${id}`, data),
  deleteTestCase: (id) => apiClient.delete(`/test-cases/${id}`),
  
  // CSV Upload
  uploadCSV: (file, suiteName, suiteDescription) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('suiteName', suiteName);
    formData.append('suiteDescription', suiteDescription || '');
    return apiClient.post('/upload/csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // Test Runs
  getTestRuns: () => apiClient.get('/test-runs'),
  getTestRunById: (id) => apiClient.get(`/test-runs/${id}`),
  createTestRun: (data) => apiClient.post('/test-runs', data),
  updateTestRun: (id, data) => apiClient.put(`/test-runs/${id}`, data),
  deleteTestRun: (id) => apiClient.delete(`/test-runs/${id}`),
  
  // Execution Results
  getExecutionResults: (runId) => apiClient.get(`/test-runs/${runId}/results`),
  updateExecutionResult: (id, data) => apiClient.put(`/execution-results/${id}`, data),
  
  // Reports
  getReports: () => apiClient.get('/reports'),
  generateReport: (runId, format, options) => apiClient.post('/reports/generate', { runId, format, options }),
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
  deleteReport: (id) => apiClient.delete(`/reports/${id}`),
  
  // Grok AI
  analyzeWithGrok: (runId) => apiClient.post('/grok/analyze', { runId }),
  
  // Settings & Statistics
  getSettings: () => apiClient.get('/settings'),
  updateSettings: (category, data) => apiClient.put(`/settings/${category}`, data),
  getStatistics: () => apiClient.get('/statistics'),
  checkHealth: () => axios.get(`${API_BASE_URL.replace('/api', '')}/health`)
};

export default api;