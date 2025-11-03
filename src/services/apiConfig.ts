// Configuración de la API
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'https://p6couriersync-f5-back.onrender.com',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      PROFILE: '/api/auth/profile',
    },
    INVOICES: {
      BASE: '/api/v1/invoices',
      BY_ID: (id: string) => `/api/v1/invoices/${id}`,
      ISSUE: (id: string) => `/api/v1/invoices/${id}/issue`,
      PDF: (id: string) => `/api/v1/invoices/${id}/pdf`,
      BY_STATUS: (status: string) => `/api/v1/invoices/status/${status}`,
      HISTORY: (id: string) => `/api/v1/invoices/${id}/history`,
    },
    SHIPMENTS: {
      BASE: '/api/v1/shipments',
      BY_STATUS: (status: string) => `/api/v1/shipments/status/${status}`,
      UNLINKED: '/api/v1/shipments/unlinked',
    },
  },
};

// Helper para construir URLs completas
export const buildUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};