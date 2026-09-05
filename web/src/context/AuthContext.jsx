import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('lumiina_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('lumiina_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await authAPI.getMe();
          if (res.data?.data) {
            setUser(res.data.data);
            localStorage.setItem('lumiina_user', JSON.stringify(res.data.data));
          }
        } catch {
          // Token invalid or expired
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = (jwtToken, userData) => {
    setToken(jwtToken);
    setUser(userData);
    localStorage.setItem('lumiina_token', jwtToken);
    if (userData) {
      localStorage.setItem('lumiina_user', JSON.stringify(userData));
    }
    // Immediately synchronize authoritative profile and counters from /users/me
    authAPI.getMe().then((res) => {
      if (res.data?.data) {
        setUser(res.data.data);
        localStorage.setItem('lumiina_user', JSON.stringify(res.data.data));
      }
    }).catch(() => {});
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('lumiina_token');
    localStorage.removeItem('lumiina_user');
  };

  const updateUser = (userData) => {
    setUser((prev) => {
      const updated = { ...(prev || {}), ...userData };
      localStorage.setItem('lumiina_user', JSON.stringify(updated));
      return updated;
    });
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await authAPI.getMe();
      if (res.data?.data) {
        setUser(res.data.data);
        localStorage.setItem('lumiina_user', JSON.stringify(res.data.data));
      }
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateUser,
        refreshUser,
        isAuthenticated: !!token,
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
