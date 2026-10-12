import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { authService } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: Role | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; full_name: string; phone?: string }) => Promise<void>;
  logout: () => void;
  switchRoleDemo: (demoEmail: string, demoPass: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('aerolux_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const profile = await authService.getMe();
          setUser(profile);
        } catch (error) {
          console.error('Session expired or invalid', error);
          logout();
        }
      }
      setIsLoading(false);
    };

    fetchUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await authService.login(email, password);
      localStorage.setItem('aerolux_token', data.access_token);
      setToken(data.access_token);
      const profile = await authService.getMe();
      setUser(profile);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (formData: { email: string; password: string; full_name: string; phone?: string }) => {
    setIsLoading(true);
    try {
      const data = await authService.register(formData);
      localStorage.setItem('aerolux_token', data.access_token);
      setToken(data.access_token);
      const profile = await authService.getMe();
      setUser(profile);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('aerolux_token');
    setToken(null);
    setUser(null);
  };

  const switchRoleDemo = async (demoEmail: string, demoPass: string) => {
    await login(demoEmail, demoPass);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        isLoading,
        login,
        register,
        logout,
        switchRoleDemo
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
