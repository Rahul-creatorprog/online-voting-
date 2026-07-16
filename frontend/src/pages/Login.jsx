import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Toast from '../components/Toast';
import logo from '../assets/logo.jpg';

const Login = () => {
  const { login, adminLogin } = useContext(AuthContext);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isAdmin) {
        await adminLogin(username, password);
        setSuccess('Admin login successful! Redirecting...');
        setTimeout(() => navigate('/admin'), 1500);
      } else {
        const data = await login(username, password);
        setSuccess('OTP sent to your registered email!');
        // Redirect to OTP verify with username/email details
        setTimeout(() => navigate('/otp-verify', { state: { email: data.email, username } }), 1500);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '80vh', alignItems: 'center', justifyContent: 'center' }}>
      <div className="bg-decor decor-1"></div>
      <div className="bg-decor decor-2"></div>
      
      <div className="glass-card" style={{ width: '100%', maxWidth: '450px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
          <img src={logo} alt="Department Logo" style={{ width: '90px', height: '90px', objectFit: 'contain', marginBottom: '0.75rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
          <h2 style={{ textAlign: 'center', margin: 0, fontSize: '1.4rem', fontWeight: '700' }}>
            <span className="text-gradient">B.Sc. Information Technology</span>
          </h2>
          <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '0.25rem' }}>Voting System</span>
        </div>

        {/* Tab Headers */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
          <button
            onClick={() => { setIsAdmin(false); setError(''); }}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: 'transparent',
              border: 'none',
              borderBottom: !isAdmin ? '2px solid var(--primary-color)' : 'none',
              color: !isAdmin ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🎓 Student Login
          </button>
          <button
            onClick={() => { setIsAdmin(true); setError(''); }}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: 'transparent',
              border: 'none',
              borderBottom: isAdmin ? '2px solid var(--primary-color)' : 'none',
              color: isAdmin ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🛡️ Admin Login
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{isAdmin ? 'Username' : 'Register Number'}</label>
            <input
              type="text"
              className="form-control"
              required
              placeholder={isAdmin ? 'Enter admin username' : 'e.g. 2026CSE001'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              className="form-control"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="show-password"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="show-password" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
                Show password while typing
              </label>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Processing...' : 'Sign In'}
          </button>
        </form>

        <div id="toast-container">
          {error && <Toast message={error} type="error" onClose={() => setError('')} />}
          {success && <Toast message={success} type="success" onClose={() => setSuccess('')} />}
        </div>
      </div>
    </div>
  );
};

export default Login;
