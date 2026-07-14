import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Navbar = ({ onToggleSidebar, sidebarOpen }) => {
  const { user, role, logout } = useContext(AuthContext);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <nav className="navbar">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {user && (
          <button className="sidebar-toggle" onClick={onToggleSidebar} aria-label="Toggle navigation sidebar">
            {sidebarOpen ? '✕' : '☰'}
          </button>
        )}
        <Link to="/" className="logo">
          <span style={{ color: 'var(--primary-color)', fontSize: '1.6rem' }}>🗳️</span>
          <span>Online Voting</span>
        </Link>
      </div>

      <div className="nav-links">
        {user && (
          <span className="nav-link" style={{ fontWeight: '600' }}>
            Hi, {role === 'ADMIN' ? user.fullName : user.name} ({role})
          </span>
        )}
        <button onClick={toggleTheme} className="theme-toggle" title="Toggle Theme">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        {user && (
          <button onClick={logout} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
            Logout
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
