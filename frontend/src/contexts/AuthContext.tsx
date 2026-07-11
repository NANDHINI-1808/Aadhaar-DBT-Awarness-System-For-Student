import React, { createContext, useState, useEffect, useContext } from 'react';

interface User {
  id: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
  wizardCompleted: boolean;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  updateUserWizardStatus: (completed: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const backendUrl = import.meta.env.VITE_API_URL || '/api';

  const refreshSession = async (): Promise<boolean> => {
    try {
      const res = await fetch(`${backendUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        // Fetch profile to sync user details
        const profileRes = await fetch(`${backendUrl}/profile`);
        if (profileRes.ok) {
          const prof = await profileRes.json();
          setUser({
            id: prof.userId,
            email: '', // Not needed for general views or fetched from profile
            role: prof.userId ? 'STUDENT' : 'ADMIN', // Simple fallback or read state
            wizardCompleted: prof.wizardCompleted,
            name: prof.name || '',
          });
          return true;
        }
      }
      setUser(null);
      return false;
    } catch {
      setUser(null);
      return false;
    }
  };

  const login = async (email: string, password: string) => {
    const res = await fetch(`${backendUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Login failed.');
    }

    const data = await res.json();
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await fetch(`${backendUrl}/auth/logout`, { method: 'POST' });
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      setUser(null);
      // Clear cookies locally as a backstop
      document.cookie = 'accessToken=; Max-Age=0; path=/;';
      document.cookie = 'refreshToken=; Max-Age=0; path=/;';
    }
  };

  const updateUserWizardStatus = (completed: boolean) => {
    if (user) {
      setUser({ ...user, wizardCompleted: completed });
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      await refreshSession();
      setLoading(false);
    };
    initAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshSession, updateUserWizardStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
