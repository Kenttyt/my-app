import { useEffect, useState, createContext, useContext } from 'react';

const AuthContext = createContext();

const createGuestSession = () => {
  const guestId = `guest-${Date.now()}`;
  return {
    guestUser: {
      id: guestId,
      username: `Guest${guestId.slice(-4)}`,
      email: `${guestId}@local.interesthub`,
      interests: [],
      sports: [],
      bio: ''
    },
    guestToken: guestId
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || null;
  });

  useEffect(() => {
    if (user && token) {
      return;
    }

    const { guestUser, guestToken } = createGuestSession();

    setUser(guestUser);
    setToken(guestToken);
    localStorage.setItem('user', JSON.stringify(guestUser));
    localStorage.setItem('token', guestToken);
  }, [token, user]);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const startNewGuestSession = () => {
    const { guestUser, guestToken } = createGuestSession();
    setUser(guestUser);
    setToken(guestToken);
    localStorage.setItem('user', JSON.stringify(guestUser));
    localStorage.setItem('token', guestToken);
  };

  const updateProfile = (updates) => {
    setUser((prev) => {
      if (!prev) {
        return prev;
      }

      const nextUser = { ...prev, ...updates };
      localStorage.setItem('user', JSON.stringify(nextUser));
      return nextUser;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateProfile, startNewGuestSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
