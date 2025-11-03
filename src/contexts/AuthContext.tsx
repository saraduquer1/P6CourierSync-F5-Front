import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '@/service/apiService';
import { API_CONFIG } from '@/service/apiConfig';
// Tipos basados en la respuesta del backend
interface AuthResponse {
  token: string;
  username: string;
  email: string;
  id: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: number;
}

interface User {
  id: string;
  email: string;
  name: string;
  token: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar si existe una sesión guardada
    const savedUser = localStorage.getItem('couriersync:user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('couriersync:user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiService.post<ApiResponse<AuthResponse>>(
        API_CONFIG.ENDPOINTS.AUTH.LOGIN,
        {
          usernameOrEmail: email,
          password: password,
        },
        false // No requiere autenticación
      );

      if (response.success && response.data) {
        const userData: User = {
          id: response.data.id.toString(),
          email: response.data.email,
          name: response.data.username,
          token: response.data.token,
        };

        setUser(userData);
        localStorage.setItem('couriersync:user', JSON.stringify(userData));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string
  ): Promise<boolean> => {
    try {
      const response = await apiService.post<ApiResponse<AuthResponse>>(
        API_CONFIG.ENDPOINTS.AUTH.REGISTER,
        {
          username,
          email,
          password,
        },
        false // No requiere autenticación
      );

      if (response.success && response.data) {
        const userData: User = {
          id: response.data.id.toString(),
          email: response.data.email,
          name: response.data.username,
          token: response.data.token,
        };

        setUser(userData);
        localStorage.setItem('couriersync:user', JSON.stringify(userData));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('couriersync:user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}