import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import type { User, LoginCredentials, RegisterData, AuthState } from '@/types/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: authService.getToken(),
    isAuthenticated: false,
    isLoading: true,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      const token = authService.getToken();
      if (token) {
        try {
          const { user } = await authService.me();
          setState({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          authService.logout();
          setState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const { user, token } = await authService.login(credentials);
    setState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
    
    // Redirigir según el rol
    if (user.role === 'COACH') {
      navigate('/coach');
    } else {
      navigate('/');
    }
  };

  const register = async (data: RegisterData) => {
    const { user, token } = await authService.register(data);
    setState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
    
    if (user.role === 'COACH') {
      navigate('/coach');
    } else {
      navigate('/');
    }
  };

  const logout = () => {
    authService.logout();
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
    navigate('/login');
  };

  const refreshUser = async () => {
    try {
      const { user } = await authService.me();
      setState(prev => ({ ...prev, user }));
    } catch (error) {
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
