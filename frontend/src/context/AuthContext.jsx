import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/parceloServices';
import { useToast } from './ToastContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('parcelo_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login'); // 'login', 'register', 'otp'
  const { showToast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('parcelo_access_token');
    if (token) {
      authService.getProfile()
        .then((res) => {
          setUser(res.data);
          localStorage.setItem('parcelo_user', JSON.stringify(res.data));
        })
        .catch(() => {
          // Handled by axios interceptor
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    const handleAuthRequired = () => {
      setUser(null);
      setIsAuthModalOpen(true);
      showToast('Please sign in to continue with Privé services.');
    };

    window.addEventListener('parcelo_auth_required', handleAuthRequired);
    return () => window.removeEventListener('parcelo_auth_required', handleAuthRequired);
  }, [showToast]);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    const { user: userData, access, refresh } = res.data;
    localStorage.setItem('parcelo_access_token', access);
    localStorage.setItem('parcelo_refresh_token', refresh);
    localStorage.setItem('parcelo_user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthModalOpen(false);
    showToast(`Welcome back, ${userData.full_name?.split(' ')[0] || 'Privé Member'}!`);
    return userData;
  };

  const register = async (data) => {
    const res = await authService.register(data);
    const { user: userData, access, refresh } = res.data;
    localStorage.setItem('parcelo_access_token', access);
    localStorage.setItem('parcelo_refresh_token', refresh);
    localStorage.setItem('parcelo_user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthModalOpen(false);
    showToast(`Welcome to Parcelo Privé, ${userData.full_name?.split(' ')[0] || 'Member'}!`);
    return userData;
  };

  const logout = async () => {
    const refresh = localStorage.getItem('parcelo_refresh_token');
    if (refresh) {
      try {
        await authService.logout(refresh);
      } catch (err) {}
    }
    localStorage.removeItem('parcelo_access_token');
    localStorage.removeItem('parcelo_refresh_token');
    localStorage.removeItem('parcelo_user');
    setUser(null);
    showToast('Signed out of Parcelo Privé.');
  };

  const refreshProfile = async () => {
    try {
      const res = await authService.getProfile();
      setUser(res.data);
      localStorage.setItem('parcelo_user', JSON.stringify(res.data));
      return res.data;
    } catch (e) {
      return null;
    }
  };

  const openAuthModal = (tab = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => setIsAuthModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        refreshProfile,
        isAuthModalOpen,
        authModalTab,
        setAuthModalTab,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
