import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(localStorage.getItem('role') || '');
  const [loading, setLoading] = useState(true);

  const API_BASE = 'https://arrange-cruelty-jingle.ngrok-free.dev/api';

  useEffect(() => {
    if (token) {
      checkStatus();
    } else {
      setLoading(false);
    }
  }, [token]);

  const checkStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/status`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.loggedIn) {
          setRole(data.role);
          setUser(data.role === 'ADMIN' ? data.admin : data.student);
        } else {
          logout();
        }
      } else {
        logout();
      }
    } catch (err) {
      console.error('Auth verification error:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    return data; // returns email for OTP verification
  };

  const verifyOtp = async (email, otp) => {
    const res = await fetch(`${API_BASE}/auth/otp/verify`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({ email, otp })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'OTP verification failed');
    
    setToken(data.token);
    setRole(data.role);
    setUser(data.student);
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);
    return data;
  };

  const adminLogin = async (username, password) => {
    const res = await fetch(`${API_BASE}/auth/admin-login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Invalid admin credentials');

    setToken(data.token);
    setRole(data.role);
    setUser(data.admin);
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);
    return data;
  };

  const logout = () => {
    setToken('');
    setUser(null);
    setRole('');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
  };

  return (
    <AuthContext.Provider value={{ token, user, role, loading, login, verifyOtp, adminLogin, logout, API_BASE }}>
      {children}
    </AuthContext.Provider>
  );
};
