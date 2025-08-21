import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AuthContextType {
  isLoggedIn: boolean;
  username: string | null;
  login: (username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    // Don't automatically restore login state on app load
    // This ensures the login page is always shown when the app is freshly opened
    // Users must explicitly log in each time they visit the app
    
    // Comment out the automatic login restoration:
    // const loggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    // const storedUsername = localStorage.getItem('adminUsername');
    // 
    // if (loggedIn && storedUsername) {
    //   setIsLoggedIn(true);
    //   setUsername(storedUsername);
    // }
    
    // Clear any existing login state to ensure fresh start
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminUsername');
    
    // Handle browser refresh - always show login page
    const handleBeforeUnload = () => {
      localStorage.removeItem('adminLoggedIn');
      localStorage.removeItem('adminUsername');
    };
    
    const handlePageShow = (event: PageTransitionEvent) => {
      // If page is loaded from cache (back/forward), clear auth state
      if (event.persisted) {
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminUsername');
        setIsLoggedIn(false);
        setUsername(null);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pageshow', handlePageShow);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  // Session timeout functionality
  useEffect(() => {
    let sessionTimeout: NodeJS.Timeout;

    if (isLoggedIn) {
      // Set session timeout to 30 minutes (30 * 60 * 1000 milliseconds)
      sessionTimeout = setTimeout(() => {
        console.log('Session expired due to inactivity');
        logout();
      }, 30 * 60 * 1000);

      // Reset timeout on user activity
      const resetTimeout = () => {
        clearTimeout(sessionTimeout);
        sessionTimeout = setTimeout(() => {
          console.log('Session expired due to inactivity');
          logout();
        }, 30 * 60 * 1000);
      };

      // Listen for user activity
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      events.forEach(event => {
        document.addEventListener(event, resetTimeout, true);
      });

      return () => {
        clearTimeout(sessionTimeout);
        events.forEach(event => {
          document.removeEventListener(event, resetTimeout, true);
        });
      };
    }
  }, [isLoggedIn]);

  const login = (username: string) => {
    setIsLoggedIn(true);
    setUsername(username);
    localStorage.setItem('adminLoggedIn', 'true');
    localStorage.setItem('adminUsername', username);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUsername(null);
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminUsername');
  };

  const value: AuthContextType = {
    isLoggedIn,
    username,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
