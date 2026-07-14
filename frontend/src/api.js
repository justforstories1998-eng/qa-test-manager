import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL
  || (import.meta.env.PROD ? 'https://qa-test-manager.onrender.com/api' : '/api');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000
});

const uploadClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
});

uploadClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

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
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 || error.response?.status === 403) {
      if (!error.config?.url?.includes('/auth/login')) {
        const serverMsg = error.response?.data?.error || '';
        if (serverMsg.includes('expired') || serverMsg.includes('Invalid')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }

    const isRetryable =
      !error.response ||
      error.code === 'ECONNABORTED' ||
      error.code === 'ERR_NETWORK' ||
      (error.message && (
        error.message.includes('Network Error') ||
        error.message.includes('timeout') ||
        error.message.includes('CORS')
      ));

    if (isRetryable && !originalRequest._retry) {
      originalRequest._retry = true;
      await new Promise(resolve => setTimeout(resolve, 5000));
      return apiClient(originalRequest);
    }

    if (error.response?.data instanceof Blob) return Promise.resolve(error.response.data);

    const errorMsg = error.response?.data?.error
      || error.response?.data?.message
      || error.message
      || 'An unexpected error occurred';

    return Promise.reject({ success: false, error: errorMsg });
  }
);

const api = {
  login: (data) => apiClient.post('/auth/login', data),
  changePassword: (data) => apiClient.post('/auth/change-password', data),
  getMe: () => apiClient.get('/auth/me'),

  searchUsers: (query) => apiClient.get('/users/search', { params: { q: query } }),
  getAllUsers: () => apiClient.get('/users'),

  getUsers: () => apiClient.get('/admin/users'),
  createUser: (data) => apiClient.post('/admin/users', data),
  updateUser: (id, data) => apiClient.put(`/admin/users/${id}`, data),
  deleteUser: (id) => apiClient.delete(`/admin/users/${id}`),
  resetPassword: (id) => apiClient.post(`/admin/users/${id}/reset-password`),
  assignProject: (projectId, userIds) => apiClient.post(`/admin/projects/${projectId}/assign`, { userIds }),
  getProjectUsers: (projectId) => apiClient.get(`/admin/projects/${projectId}/users`),

  getProjects: () => apiClient.get('/projects'),
  createProject: (data) => apiClient.post('/projects', data),
  deleteProject: (id) => apiClient.delete(`/projects/${id}`),

  getBugs: (projectId) => apiClient.get('/bugs', { params: { projectId } }),
  createBug: (formData) => apiClient.post('/bugs', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateBug: (id, formData) => apiClient.put(`/bugs/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteBug: (id) => apiClient.delete(`/bugs/${id}`),

  getTestSuites: (projectId) => apiClient.get('/test-suites', { params: { projectId } }),
  createTestSuite: (data) => apiClient.post('/test-suites', data),
  deleteTestSuite: (id) => apiClient.delete(`/test-suites/${id}`),

  getTestCases: (projectId, suiteId) => apiClient.get('/test-cases', { params: { projectId, suiteId } }),
  createTestCase: (data) => apiClient.post('/test-cases', data),
  updateTestCase: (id, data) => apiClient.put(`/test-cases/${id}`, data),
  deleteTestCase: (id) => apiClient.delete(`/test-cases/${id}`),

  uploadCSV: (file, suiteName, projectId) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('suiteName', suiteName);
    fd.append('projectId', projectId);
    return uploadClient.post('/upload/csv', fd).then(r => r.data);
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
  updateSettings: (category, data) => apiClient.put(`/settings/${category}`, data),

  getBoards: (projectId) => apiClient.get('/boards', { params: { projectId } }),
  getBoard: (id) => apiClient.get(`/boards/${id}`),
  createBoard: (data) => apiClient.post('/boards', data),
  updateBoard: (id, data) => apiClient.put(`/boards/${id}`, data),
  deleteBoard: (id) => apiClient.delete(`/boards/${id}`),

  getWorkItems: (projectId, filters = {}) => apiClient.get('/work-items', { params: { projectId, ...filters } }),
  getWorkItemHierarchy: (projectId) => apiClient.get('/work-items/hierarchy', { params: { projectId } }),
  getWorkItem: (id) => apiClient.get(`/work-items/${id}`),
  createWorkItem: (data) => apiClient.post('/work-items', data),
  updateWorkItem: (id, data) => apiClient.put(`/work-items/${id}`, data),
  deleteWorkItem: (id) => apiClient.delete(`/work-items/${id}`),
  updateWorkItemsOrder: (items) => apiClient.put('/work-items/batch/order', { items }),

  getWorkItemLinks: (workItemId) => apiClient.get(`/work-item-links/${workItemId}`),
  createWorkItemLink: (data) => apiClient.post('/work-item-links', data),
  deleteWorkItemLink: (id) => apiClient.delete(`/work-item-links/${id}`),

  getSprints: (projectId) => apiClient.get('/sprints', { params: { projectId } }),
  createSprint: (data) => apiClient.post('/sprints', data),
  updateSprint: (id, data) => apiClient.put(`/sprints/${id}`, data),
  deleteSprint: (id) => apiClient.delete(`/sprints/${id}`),

  getSprintCapacity: (sprintId) => apiClient.get(`/sprint-capacity/${sprintId}`),
  upsertCapacity: (data) => apiClient.post('/sprint-capacity', data),
  deleteCapacity: (id) => apiClient.delete(`/sprint-capacity/${id}`),

  getBurndown: (sprintId) => apiClient.get(`/burndown/${sprintId}`),
  generateBurndown: (sprintId, projectId) => apiClient.post('/burndown/generate', { sprintId, projectId }),

  getVelocity: (projectId) => apiClient.get(`/velocity/${projectId}`),

  getQueries: (projectId) => apiClient.get(`/queries/${projectId}`),
  createQuery: (data) => apiClient.post('/queries', data),
  updateQuery: (id, data) => apiClient.put(`/queries/${id}`, data),
  deleteQuery: (id) => apiClient.delete(`/queries/${id}`),

  getFileUrl: (path) => {
    if (!path || typeof path !== 'string') return '#';
    if (path.indexOf('://') !== -1) return path;
    const root = API_BASE_URL.replace('/api', '').replace(/\/+$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${root}${cleanPath}`;
  }
};

export default api;
