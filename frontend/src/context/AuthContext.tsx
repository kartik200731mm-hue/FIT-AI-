import React, { createContext, useContext, useState, useEffect } from 'react';
import { IUser, IUserProfile } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: IUser | null;
  profile: IUserProfile | null;
  isLoading: boolean;
  hasProfile: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setProfile: (profile: IUserProfile | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [profile, setProfile] = useState<IUserProfile | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkAuth = async () => {
    const token = api.getToken();
    if (!token) {
      setUser(null);
      setProfile(null);
      setHasProfile(false);
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.getCurrentUser();
      setUser(data.user);
      setHasProfile(data.hasProfile);
      setProfile(data.profile);
    } catch (err) {
      console.warn('Session verification failed:', err);
      api.setToken(null);
      setUser(null);
      setProfile(null);
      setHasProfile(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.login({ email, password });
    setUser(data.user);
    await checkAuth();
  };

  const register = async (name: string, email: string, password: string) => {
    const data = await api.register({ name, email, password });
    setUser(data.user);
    await checkAuth();
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    setProfile(null);
    setHasProfile(false);
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        hasProfile,
        login,
        register,
        logout,
        refreshUser,
        setProfile,
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
