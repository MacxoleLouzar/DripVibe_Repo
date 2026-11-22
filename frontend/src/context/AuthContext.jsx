import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('dripvibe_token');
    const stored = localStorage.getItem('dripvibe_user');
    if (token && stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('dripvibe_token', data.token);
    localStorage.setItem('dripvibe_user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const register = async (name, email, password, location) => {
    const { data } = await api.post('/auth/register', { name, email, password, location });
    localStorage.setItem('dripvibe_token', data.token);
    localStorage.setItem('dripvibe_user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('dripvibe_token');
    localStorage.removeItem('dripvibe_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
