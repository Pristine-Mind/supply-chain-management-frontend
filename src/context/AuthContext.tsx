import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuthToken, getUserData, removeAuthToken, setAuthToken } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

export interface User {
  id?: number;
  email: string;
  name?: string;
  phone?: string;
  hasAccessToMarketplace: boolean;
  businessType?: string;
  role?: string;
  shopId?: string;
  isActive?: boolean;
  dateJoined?: string;
  lastLogin?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string, userData: any) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      const userData = getUserData();
      setUser(userData);
    }
    setLoading(false);
  }, []);

  const login = (token: string, userData: any) => {
    setAuthToken(token);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        login,
        logout,
        loading,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
