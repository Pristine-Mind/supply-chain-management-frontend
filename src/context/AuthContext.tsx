import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuthToken, getUserData, removeAuthToken, setAuthToken } from '../utils/auth';
import { useCart } from './CartContext';

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
  b2b_verified?: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string, userData: any) => void;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { clearCart } = useCart();

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

  const logout = async () => {
    removeAuthToken();
    setUser(null);
    await clearCart();
    window.location.href = '/';
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
