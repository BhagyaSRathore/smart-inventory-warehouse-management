import {createContext,useContext,useEffect,useMemo,useState,} from 'react';

import {login as loginRequest,getCurrentUser,logout as clearSession,} from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getCurrentUser());

  const [token, setToken] = useState(
    () => localStorage.getItem('token')
  );

  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem('token')
  );

  const [loading, setLoading] = useState(true);


  // =========================================
  // INITIAL AUTH STATE
  // =========================================

  useEffect(() => {
    setUser(getCurrentUser());
    setToken(localStorage.getItem('token'));
    setIsAuthenticated(
      !!localStorage.getItem('token')
    );
    setLoading(false);
  }, []);


  // =========================================
  // LISTEN FOR USER UPDATES
  // =========================================

  useEffect(() => {

    const handleAuthLogin = (event) => {

      // Profile update se user directly aa raha hai
      if (event?.detail) {
        setUser(event.detail);

        return;
      }

      // Normal login / localStorage update
      const updatedUser = getCurrentUser();

      setUser(updatedUser);

      setToken(
        localStorage.getItem('token')
      );

      setIsAuthenticated(
        !!localStorage.getItem('token')
      );
    };


    const handleAuthLogout = () => {

      setUser(null);

      setToken(null);

      setIsAuthenticated(false);
    };


    window.addEventListener(
      'auth:login',
      handleAuthLogin
    );

    window.addEventListener(
      'auth:logout',
      handleAuthLogout
    );


    return () => {

      window.removeEventListener(
        'auth:login',
        handleAuthLogin
      );

      window.removeEventListener(
        'auth:logout',
        handleAuthLogout
      );
    };

  }, []);


  // =========================================
  // LOGIN
  // =========================================

  const login = async (credentials) => {

    const response =
      await loginRequest(credentials);

    const authUser =
      response.user;

    const authToken =
      response.token;


    localStorage.setItem(
      'token',
      authToken
    );

    localStorage.setItem(
      'user',
      JSON.stringify(authUser)
    );


    setToken(authToken);

    setUser(authUser);

    setIsAuthenticated(true);


    return response;
  };


  // =========================================
  // LOGOUT
  // =========================================

  const logout = () => {

    clearSession();

    setToken(null);

    setUser(null);

    setIsAuthenticated(false);
  };


  // =========================================
  // CONTEXT VALUE
  // =========================================

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated,
      loading,
      login,
      logout,
    }),
    [
      user,
      token,
      isAuthenticated,
      loading,
    ]
  );


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {

  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within AuthProvider'
    );
  }

  return context;
}