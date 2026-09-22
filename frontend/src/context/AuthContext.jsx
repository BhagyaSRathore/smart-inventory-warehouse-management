import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { login as loginRequest, getCurrentUser, logout as clearSession } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getCurrentUser());
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getCurrentUser());
    setToken(localStorage.getItem('token'));
    setIsAuthenticated(!!localStorage.getItem('token'));
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const response = await loginRequest(credentials);
    const authUser = response.user;
    const authToken = response.token;

    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(authUser));

    setToken(authToken);
    setUser(authUser);
    setIsAuthenticated(true);

    return response;
  };

  const logout = () => {
    clearSession();
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = useMemo(() => ({
    user,
    token,
    isAuthenticated,
    loading,
    login,
    logout,
  }), [user, token, isAuthenticated, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
