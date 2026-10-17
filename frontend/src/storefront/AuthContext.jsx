import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

import { AuthContext } from './storeAuthContext';

function savedUser() {
  try {
    return JSON.parse(localStorage.getItem('tkart_user') || 'null');
  } catch {
    return null;
  }
}

function clearSavedSession() {
  localStorage.removeItem('tkart_token');
  localStorage.removeItem('tkart_user');
  window.dispatchEvent(new Event('tkart:cart-updated'));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(savedUser);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('tkart_token')));

  useEffect(() => {
    if (!localStorage.getItem('tkart_token')) {
      return;
    }
    api.get('/auth/me')
      .then(({ data }) => {
        const profile = data.data.user;
        localStorage.setItem('tkart_user', JSON.stringify(profile));
        setUser(profile);
      })
      .catch(() => {
        localStorage.removeItem('tkart_token');
        localStorage.removeItem('tkart_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const expireSession = (event) => {
      const currentToken = localStorage.getItem('tkart_token');
      const failedAuthorization = event.detail?.authorization;
      if (failedAuthorization && failedAuthorization !== `Bearer ${currentToken}`) return;
      clearSavedSession();
      setUser(null);
      setLoading(false);
    };
    window.addEventListener('tkart:session-expired', expireSession);
    return () => window.removeEventListener('tkart:session-expired', expireSession);
  }, []);

  const acceptSession = (data) => {
    localStorage.setItem('tkart_token', data.token);
    localStorage.setItem('tkart_user', JSON.stringify(data.user));
    setUser(data.user);
    window.dispatchEvent(new Event('tkart:cart-updated'));
    return data.user;
  };

  const signIn = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    return acceptSession(data.data);
  };

  const register = async (details) => {
    const { data } = await api.post('/auth/register', details);
    return acceptSession(data.data);
  };

  const signOut = () => {
    clearSavedSession();
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, signIn, register, signOut }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

