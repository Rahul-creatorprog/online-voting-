import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Toast from '../components/Toast';

const Settings = () => {
  const { token, role, API_BASE } = useContext(AuthContext);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must contain at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const endpoint = role === 'ADMIN' ? 'admin/change-password' : 'student/change-password';
      const res = await fetch(`${API_BASE}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update password');

      setSuccess('Password updated successfully!');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <div className="dashboard-content">
        <h2 style={{ marginBottom: '1.5rem' }}>Account Settings</h2>

        <div className="glass-card" style={{ maxWidth: '500px' }}>
          <h3>Change Password</h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Update your account password. Must contain at least 8 characters.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type={showPassword ? "text" : "password"}
                className="form-control"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type={showPassword ? "text" : "password"}
                className="form-control"
                placeholder="••••••••"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="show-password-settings"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="show-password-settings" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
                Show password while typing
              </label>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        <div id="toast-container">
          {error && <Toast message={error} type="error" onClose={() => setError('')} />}
          {success && <Toast message={success} type="success" onClose={() => setSuccess('')} />}
        </div>
      </div>
    </div>
  );
};

export default Settings;
