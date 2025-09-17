'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated on component mount
    const checkAuth = () => {
      const authData = localStorage.getItem('bisetun_auth');
      if (authData) {
        try {
          const { token, expiresAt } = JSON.parse(authData);
          const now = new Date().getTime();
          
          if (now < expiresAt) {
            setIsAuthenticated(true);
          } else {
            // Token expired, remove it
            localStorage.removeItem('bisetun_auth');
            setIsAuthenticated(false);
          }
        } catch (error) {
          localStorage.removeItem('bisetun_auth');
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = (password) => {
    if (password === 'bisetun@134') {
      // Set expiration to 1 year from now
      const expiresAt = new Date().getTime() + (365 * 24 * 60 * 60 * 1000);
      const authData = {
        token: 'bisetun_auth_token',
        expiresAt: expiresAt
      };
      
      localStorage.setItem('bisetun_auth', JSON.stringify(authData));
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('bisetun_auth');
    setIsAuthenticated(false);
  };

  const value = {
    isAuthenticated,
    isLoading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
