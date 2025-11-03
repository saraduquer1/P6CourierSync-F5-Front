import { buildUrl } from './apiConfig';

// Obtener el token JWT del localStorage
const getToken = (): string | null => {
  const user = localStorage.getItem('couriersync:user');
  if (user) {
    try {
      const parsedUser = JSON.parse(user);
      return parsedUser.token || null;
    } catch {
      return null;
    }
  }
  return null;
};

// Configurar headers con JWT
const getHeaders = (includeAuth: boolean = true): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

// Manejar respuestas de la API
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'Error en la solicitud'
    }));
    throw new Error(error.message || `Error ${response.status}`);
  }
  
  return response.json();
};

// Métodos HTTP
export const apiService = {
  get: async <T>(endpoint: string, requiresAuth: boolean = true): Promise<T> => {
    const response = await fetch(buildUrl(endpoint), {
      method: 'GET',
      headers: getHeaders(requiresAuth),
    });
    return handleResponse<T>(response);
  },

  post: async <T>(endpoint: string, data?: unknown, requiresAuth: boolean = true): Promise<T> => {
    const response = await fetch(buildUrl(endpoint), {
      method: 'POST',
      headers: getHeaders(requiresAuth),
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(response);
  },

  put: async <T>(endpoint: string, data: unknown, requiresAuth: boolean = true): Promise<T> => {
    const response = await fetch(buildUrl(endpoint), {
      method: 'PUT',
      headers: getHeaders(requiresAuth),
      body: JSON.stringify(data),
    });
    return handleResponse<T>(response);
  },

  delete: async <T>(endpoint: string, requiresAuth: boolean = true): Promise<T> => {
    const response = await fetch(buildUrl(endpoint), {
      method: 'DELETE',
      headers: getHeaders(requiresAuth),
    });
    return handleResponse<T>(response);
  },
};