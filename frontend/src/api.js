import axios from 'axios';

// ============================================
// AXIOS INSTANCE CONFIGURATION
// ============================================

// FIX: Changed process.env to import.meta.env for Vite support
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ============================================
// REQUEST INTERCEPTOR
// ============================================

apiClient.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// ============================================
// RESPONSE INTERCEPTOR
// ============================================

apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const errorMessage = error.response?.data?.error 
      || error.message 
      || 'An unexpected error occurred';
    
    console.error('API Error:', errorMessage);
    
    // Create standardized error response
    const errorResponse = {
      success: false,
      error: errorMessage,
      status: error.response?.status || 500
    };
    
    return Promise.reject(errorResponse);
  }
);

// ============================================
// TEST SUITES API
// ============================================

const getTestSuites = async () => {
  return apiClient.get('/test-suites');
};

const getTestSuiteById = async (id) => {
  return apiClient.get(`/test-suites/${id}`);
};

const createTestSuite = async (data) => {
  return apiClient.post('/test-suites', data);
};

const updateTestSuite = async (id, data) => {
  return apiClient.put(`/test-suites/${id}`, data);
};

const deleteTestSuite = async (id) => {
  return apiClient.delete(`/test-suites/${id}`);
};

// ============================================
// TEST CASES API
// ============================================

const getTestCases = async (suiteId = null) => {
  const params = suiteId ? { suiteId } : {};
  return apiClient.get('/test-cases', { params });
};

const getTestCaseById = async (id) => {
  return apiClient.get(`/test-cases/${id}`);
};

const createTestCase = async (data) => {
  return apiClient.post('/test-cases', data);
};

const updateTestCase = async (id, data) => {
  return apiClient.put(`/test-cases/${id}`, data);
};

const deleteTestCase = async (id) => {
  return apiClient.delete(`/test-cases/${id}`);
};

// ============================================
// CSV UPLOAD API
// ============================================

const uploadCSV = async (file, suiteName, suiteDescription) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('suiteName', suiteName);
  formData.append('suiteDescription', suiteDescription || '');
  
  return apiClient.post('/upload/csv', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    timeout: 60000 // Extended timeout for large files
  });
};

// ============================================
// TEST RUNS API
// ============================================

const getTestRuns = async () => {
  return apiClient.get('/test-runs');
};

const getTestRunById = async (id) => {
  return apiClient.get(`/test-runs/${id}`);
};

const createTestRun = async (data) => {
  return apiClient.post('/test-runs', data);
};

const updateTestRun = async (id, data) => {
  return apiClient.put(`/test-runs/${id}`, data);
};

const deleteTestRun = async (id) => {
  return apiClient.delete(`/test-runs/${id}`);
};

// ============================================
// EXECUTION RESULTS API
// ============================================

const getExecutionResults = async (runId) => {
  return apiClient.get(`/test-runs/${runId}/results`);
};

const updateExecutionResult = async (id, data) => {
  return apiClient.put(`/execution-results/${id}`, data);
};

// ============================================
// REPORTS API
// ============================================

const getReports = async () => {
  return apiClient.get('/reports');
};

const getReportById = async (id) => {
  return apiClient.get(`/reports/${id}`);
};

const generateReport = async (runId, format, options = {}) => {
  return apiClient.post('/reports/generate', {
    runId,
    format,
    options
  });
};

const downloadReport = async (id) => {
  const response = await axios.get(`${API_BASE_URL}/reports/${id}/download`, {
    responseType: 'blob'
  });
  return response;
};

const deleteReport = async (id) => {
  return apiClient.delete(`/reports/${id}`);
};

// ============================================
// GROK AI API
// ============================================

const analyzeWithGrok = async (runId) => {
  return apiClient.post('/grok/analyze', { runId });
};

const generateGrokSummary = async (runId) => {
  return apiClient.post('/grok/summary', { runId });
};

// ============================================
// SETTINGS API
// ============================================

const getSettings = async () => {
  return apiClient.get('/settings');
};

const updateSettings = async (category, data) => {
  return apiClient.put(`/settings/${category}`, data);
};

const updateAllSettings = async (data) => {
  return apiClient.put('/settings', data);
};

// ============================================
// STATISTICS API
// ============================================

const getStatistics = async () => {
  return apiClient.get('/statistics');
};

const getSuiteStatistics = async (suiteId) => {
  return apiClient.get(`/statistics/suite/${suiteId}`);
};

// ============================================
// HEALTH CHECK API
// ============================================

const checkHealth = async () => {
  try {
    const response = await axios.get('http://localhost:5000/health');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: 'Server is not responding'
    };
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Download a file from blob response
 * @param {Blob} blob - File blob
 * @param {string} fileName - Desired file name
 */
const downloadFile = (blob, fileName) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Download report by ID
 * @param {string} reportId - Report ID
 * @param {string} fileName - File name for download
 */
const downloadReportFile = async (reportId, fileName) => {
  try {
    const response = await downloadReport(reportId);
    downloadFile(response.data, fileName);
    return { success: true };
  } catch (error) {
    console.error('Download failed:', error);
    return { success: false, error: 'Download failed' };
  }
};

// ============================================
// EXPORT API OBJECT
// ============================================

const api = {
  // Test Suites
  getTestSuites,
  getTestSuiteById,
  createTestSuite,
  updateTestSuite,
  deleteTestSuite,
  
  // Test Cases
  getTestCases,
  getTestCaseById,
  createTestCase,
  updateTestCase,
  deleteTestCase,
  
  // CSV Upload
  uploadCSV,
  
  // Test Runs
  getTestRuns,
  getTestRunById,
  createTestRun,
  updateTestRun,
  deleteTestRun,
  
  // Execution Results
  getExecutionResults,
  updateExecutionResult,
  
  // Reports
  getReports,
  getReportById,
  generateReport,
  downloadReport,
  downloadReportFile,
  deleteReport,
  
  // Grok AI
  analyzeWithGrok,
  generateGrokSummary,
  
  // Settings
  getSettings,
  updateSettings,
  updateAllSettings,
  
  // Statistics
  getStatistics,
  getSuiteStatistics,
  
  // Health
  checkHealth,
  
  // Utilities
  downloadFile
};

export default api;