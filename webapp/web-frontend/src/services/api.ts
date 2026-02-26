import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired, try to refresh
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          const { user, accessToken, refreshToken: newRefreshToken } = response.data;
          useAuthStore.getState().setAuth(user, accessToken, newRefreshToken);
          
          // Retry the original request
          if (error.config) {
            error.config.headers.Authorization = `Bearer ${accessToken}`;
            return api.request(error.config);
          }
        } catch {
          useAuthStore.getState().logout();
        }
      } else {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (email: string, password: string, name: string) =>
    api.post('/auth/register', { email, password, name }),
  
  logout: () => api.post('/auth/logout'),
  
  me: () => api.get('/auth/me'),
  
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
};

// Task API
export const taskApi = {
  create: (prompt: string, workspaceId?: string, model?: string) =>
    api.post('/tasks', { prompt, workspaceId, model }),
  
  get: (taskId: string) => api.get(`/tasks/${taskId}`),
  
  list: (params?: { limit?: number; offset?: number; status?: string }) =>
    api.get('/tasks', { params }),
  
  sendMessage: (taskId: string, content: string, attachments?: unknown[]) =>
    api.post(`/tasks/${taskId}/messages`, { content, attachments }),
  
  cancel: (taskId: string) => api.post(`/tasks/${taskId}/cancel`),
  
  delete: (taskId: string) => api.delete(`/tasks/${taskId}`),
  
  getCheckpoints: (taskId: string) => api.get(`/tasks/${taskId}/checkpoints`),
  
  restoreCheckpoint: (taskId: string, checkpointId: string, workspaceOnly?: boolean) =>
    api.post(`/tasks/${taskId}/checkpoints/${checkpointId}/restore`, { workspaceOnly }),
  
  approveTool: (taskId: string, toolId: string) =>
    api.post(`/tasks/${taskId}/tools/${toolId}/approve`),
  
  denyTool: (taskId: string, toolId: string, reason?: string) =>
    api.post(`/tasks/${taskId}/tools/${toolId}/deny`, { reason }),
};

// AI API
export const aiApi = {
  getModels: (provider?: string) => api.get('/ai/models', { params: { provider } }),
  
  getModelPricing: (modelId: string) => api.get(`/ai/models/${modelId}/pricing`),
  
  testConnection: (provider: string, apiKey?: string, model?: string) =>
    api.post('/ai/test', { provider, apiKey, model }),
  
  getUsage: (startDate?: string, endDate?: string) =>
    api.get('/ai/usage', { params: { startDate, endDate } }),
  
  getConfig: () => api.get('/ai/config'),
  
  updateConfig: (config: object) => api.put('/ai/config', config),
};

// Storage API
export const storageApi = {
  getWorkspaces: () => api.get('/storage/workspaces'),
  
  createWorkspace: (name: string, description?: string, visibility?: string) =>
    api.post('/storage/workspaces', { name, description, visibility }),
  
  getWorkspace: (workspaceId: string) => api.get(`/storage/workspaces/${workspaceId}`),
  
  listFiles: (workspaceId: string, path?: string, recursive?: boolean) =>
    api.get(`/storage/files/${workspaceId}`, { params: { path, recursive } }),
  
  uploadFile: (workspaceId: string, path: string, content: string) =>
    api.post('/storage/upload', { workspaceId, path, content }),
  
  downloadFile: (workspaceId: string, path: string) =>
    api.get(`/storage/download/${workspaceId}/${path}`, { responseType: 'blob' }),
};

// MCP API
export const mcpApi = {
  getServers: () => api.get('/mcp/servers'),
  
  getMarketplace: (category?: string, search?: string) =>
    api.get('/mcp/marketplace', { params: { category, search } }),
  
  addServer: (name: string, type: string, config: object) =>
    api.post('/mcp/servers', { name, type, config }),
  
  deleteServer: (serverId: string) => api.delete(`/mcp/servers/${serverId}`),
  
  toggleServer: (serverId: string) => api.post(`/mcp/servers/${serverId}/toggle`),
  
  getTools: (serverId: string) => api.get(`/mcp/servers/${serverId}/tools`),
  
  executeTool: (serverId: string, toolName: string, args: object) =>
    api.post(`/mcp/servers/${serverId}/tools/${toolName}`, args),
};
