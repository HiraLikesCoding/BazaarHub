'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getToken, setToken } from '@/lib/api';
import * as authService from '@/services/auth';

const AuthContext = createContext(null);

/**
 * Holds the logged in user for the whole app.
 * The JWT lives in localStorage - never in a cookie - so a separate
 * backend can be used without sharing domains.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const token = getToken();

    if (!token) {
      setLoading(false);
      return () => {};
    }

    authService
      .fetchMe(token)
      .then((me) => {
        if (active) setUser(me);
      })
      .catch(() => {
        setToken(null); // expired or invalid token
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (payload) => {
    const data = await authService.login(payload);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await authService.register(payload);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    const me = await authService.fetchMe();
    setUser(me);
    return me;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refresh,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
    }),
    [user, loading, login, register, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
