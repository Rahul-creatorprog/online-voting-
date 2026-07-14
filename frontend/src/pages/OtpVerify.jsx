import React, { useState, useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Toast from '../components/Toast';

const OtpVerify = () => {
  const { verifyOtp, API_BASE } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendCooldown, setResendCooldown] = useState(30);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state && location.state.email) {
      setEmail(location.state.email);
    } else {
      navigate('/login');
    }
  }, [location, navigate]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await verifyOtp(email, otp);
      setSuccess('Verification successful! Logging in...');
      setTimeout(() => navigate('/student'), 1500);
    } catch (err) {
      setError(err.message || 'Invalid OTP code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_BASE}/auth/otp/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Resend failed');
      setSuccess('OTP resent successfully!');
      setResendCooldown(30);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '80vh', alignItems: 'center', justifyContent: 'center' }}>
      <div className="bg-decor decor-1"></div>
      <div className="bg-decor decor-2"></div>

      <div className="glass-card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h3>Two-Factor Authentication</h3>
        <p style={{ fontSize: '0.9rem', margin: '0.5rem 0 1.5rem 0' }}>
          Please enter the 6-digit verification code sent to <br />
          <strong>{email}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              maxLength="6"
              className="form-control"
              style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px', fontWeight: 'bold' }}
              placeholder="000000"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem' }}>
          {resendCooldown > 0 ? (
            <p style={{ fontSize: '0.85rem' }}>Resend code in {resendCooldown}s</p>
          ) : (
            <button onClick={handleResend} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
              🔄 Resend OTP
            </button>
          )}
        </div>

        <div id="toast-container">
          {error && <Toast message={error} type="error" onClose={() => setError('')} />}
          {success && <Toast message={success} type="success" onClose={() => setSuccess('')} />}
        </div>
      </div>
    </div>
  );
};

export default OtpVerify;
