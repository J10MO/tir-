import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!getToken());

  useEffect(() => {
    if (!getToken()) return;
    api('/auth/me')
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setReady(true));
  }, []);

  const value = useMemo(() => ({
    user,
    ready,
    async login(phone, password) {
      const { token, user } = await api('/auth/login', { method: 'POST', body: { phone, password } });
      setToken(token);
      setUser(user);
      return user;
    },
    async register(name, phone, password) {
      const { token, user } = await api('/auth/register', { method: 'POST', body: { name, phone, password } });
      setToken(token);
      setUser(user);
      return user;
    },
    logout() {
      setToken(null);
      setUser(null);
    },
  }), [user, ready]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
