import axios from 'axios';

// Create an Axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Setup Axios Interceptor to attach Clerk token
export const setupAxiosInterceptors = (getToken) => {
  apiClient.interceptors.request.use(
    async (config) => {
      // Get the Clerk token
      const token = await getToken();
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
};

// ==========================================
// 1. Authentication & Users
// ==========================================
export const authApi = {
  sync: () => apiClient.post('/auth/sync'),
  getMe: () => apiClient.get('/users/me'),
  updateSettings: (data) => apiClient.put('/users/settings', data),
};

// ==========================================
// 2. AI Chat (Legal Assistant)
// ==========================================
export const chatApi = {
  getSessions: () => apiClient.get('/chats'),
  createSession: (data) => apiClient.post('/chats', data),
  getMessages: (sessionId, limit = 50, offset = 0) => 
    apiClient.get(`/chats/${sessionId}`, { params: { limit, offset } }),
  sendMessage: (sessionId, messageData) => 
    apiClient.post(`/chats/${sessionId}/messages`, messageData),
  updateSession: (sessionId, data) => apiClient.patch(`/chats/${sessionId}`, data),
  deleteSession: (sessionId) => apiClient.delete(`/chats/${sessionId}`),
};

// ==========================================
// 3. LaTeX Editor (Document Generation)
// ==========================================
export const editorApi = {
  getTemplates: () => apiClient.get('/editor/templates'),
  compile: (latexCode) => apiClient.post('/editor/compile', { code: latexCode }),
  getDocs: () => apiClient.get('/editor/docs'),
  createDoc: (data) => apiClient.post('/editor/docs', data),
  getDoc: (documentId) => apiClient.get(`/editor/docs/${documentId}`),
  updateDoc: (documentId, data) => apiClient.put(`/editor/docs/${documentId}`, data),
  aiSuggest: (data) => apiClient.post('/editor/ai-suggest', data),
  deleteDoc: (documentId) => apiClient.delete(`/editor/docs/${documentId}`),
};

// ==========================================
// 4. My Database (Files & DMS)
// ==========================================
export const filesApi = {
  getFiles: () => apiClient.get('/files'),
  uploadFile: (formData) => apiClient.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  searchFiles: (query) => apiClient.get('/files/search', { params: { q: query } }),
  deleteFile: (fileId) => apiClient.delete(`/files/${fileId}`),
};

// ==========================================
// 5. Lawyers Directory
// ==========================================
export const lawyersApi = {
  getLawyers: (specialite, region) => 
    apiClient.get('/lawyers', { params: { specialite, region } }),
  getLawyer: (lawyerId) => apiClient.get(`/lawyers/${lawyerId}`),
};

export default apiClient;
