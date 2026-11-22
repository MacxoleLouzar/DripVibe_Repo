import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('dripvibe_user');
      if (stored) setUser(JSON.parse(stored));
      setLoading(false);
    })();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    await AsyncStorage.setItem('dripvibe_token', data.token);
    await AsyncStorage.setItem('dripvibe_user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const register = async (name, email, password, location) => {
    const { data } = await api.post('/auth/register', { name, email, password, location });
    await AsyncStorage.setItem('dripvibe_token', data.token);
    await AsyncStorage.setItem('dripvibe_user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['dripvibe_token', 'dripvibe_user']);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
