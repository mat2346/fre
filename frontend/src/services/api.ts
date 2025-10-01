import axios from 'axios';
import type { DiagramData } from '../types';
import { API_BASE_URL } from '../constants';


// Crear instancia de axios con configuración base
const API_URL = `${API_BASE_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token en cada solicitud autenticada
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para detectar respuestas 401 y manejar refresh token automáticamente

// Usar un cliente separado SIN los interceptors para el refresh para evitar recursión
const refreshClient = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } });

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: any) => void; reject: (error: any) => void; originalRequest: any }> = [];

const processQueue = (error: any) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      // Asegurar que la petición reintente con el access token más reciente
      const currentToken = localStorage.getItem('token');
      prom.originalRequest.headers = prom.originalRequest.headers || {};
      if (currentToken) {
        prom.originalRequest.headers['Authorization'] = `Bearer ${currentToken}`;
      }
      prom.resolve(prom.originalRequest);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    const status = error?.response?.status;

    // Si no hay request configurada o ya se reintentó, emitir logout
    if (!originalRequest || originalRequest._retry) {
      try {
        window.dispatchEvent(new CustomEvent('auth:logout', { detail: { url: originalRequest?.url } }));
      } catch (e) {
        console.warn('No se pudo emitir evento auth:logout', e);
      }
      return Promise.reject(error);
    }

    // Solo manejar 401
    if (status !== 401) {
      return Promise.reject(error);
    }

    // No intentar refresh si la petición original es la propia ruta de refresh
    if (originalRequest.url && originalRequest.url.includes('/users/token/refresh/')) {
      try {
        window.dispatchEvent(new CustomEvent('auth:logout', { detail: { url: originalRequest?.url } }));
      } catch (e) {
        console.warn('No se pudo emitir evento auth:logout', e);
      }
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      try {
        window.dispatchEvent(new CustomEvent('auth:logout', { detail: { url: originalRequest?.url } }));
      } catch (e) {
        console.warn('No se pudo emitir evento auth:logout', e);
      }
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Encolar la petición y devolver una promesa que se resolverá cuando termine el refresh
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject, originalRequest });
      }).then((req: any) => {
        return api(req);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Usar refreshClient para evitar que el interceptor de respuesta capture esta llamada
      const resp = await refreshClient.post('/users/token/refresh/', { refresh: refreshToken });
      const newAccess = resp.data?.access;
      const newRefresh = resp.data?.refresh; // si el backend rota refresh tokens

      if (newAccess) {
        localStorage.setItem('token', newAccess);
        if (newRefresh) localStorage.setItem('refreshToken', newRefresh);

        // Actualizar header por defecto para nuevas peticiones
        api.defaults.headers.common['Authorization'] = `Bearer ${newAccess}`;

        processQueue(null);

        // Reintentar la petición original con el nuevo token
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
        return api(originalRequest);
      }

      processQueue(new Error('No access token in refresh response'));
      try {
        window.dispatchEvent(new CustomEvent('auth:logout', { detail: { url: originalRequest?.url } }));
      } catch (e) {
        console.warn('No se pudo emitir evento auth:logout', e);
      }
      return Promise.reject(error);
    } catch (refreshError) {
      processQueue(refreshError);
      try {
        window.dispatchEvent(new CustomEvent('auth:logout', { detail: { url: originalRequest?.url } }));
      } catch (e) {
        console.warn('No se pudo emitir evento auth:logout', e);
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// Auth Services
export const authService = {
  register: (username: string, password: string, email: string) => 
    api.post('/users/register/', { username, password, email }),
  
  login: (username: string, password: string) => 
    api.post('/users/login/', { username, password }),
  
  getProfile: () => api.get('/users/profile/'),
  
  refreshToken: (refreshToken: string) => 
    api.post('/users/token/refresh/', { refresh: refreshToken }),
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },
  
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  },
  
  isAuthenticated: () => {
    return localStorage.getItem('token') !== null;
  }
};

// Canvas Services - usar nuevos endpoints creados en el backend
export const canvasService = {
  // Lista (cargar)
  getAll: () => api.get('/canvases/cargar/'),
  
  // Detalle (cargar detalle)
  getById: (id: string) => api.get(`/canvases/${id}/detalle/`),
  
  // Crear (crear)
  create: (name: string, data: DiagramData) => 
    api.post('/canvases/crear/', { name, data }),
  
  // Actualizar / Guardar (guardar)
  update: (id: string, name: string, data: DiagramData) => 
    api.put(`/canvases/${id}/guardar/`, { name, data }),
  
  // Eliminar (usar ruta por defecto)
  delete: (id: string) => api.delete(`/canvases/${id}/`),
};

export default api;
