import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Toast from '../components/Toast';

const AdminElectionForm = () => {
  const { token, API_BASE } = useContext(AuthContext);
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
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
      const res = await fetch(`${API_BASE}/admin/elections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create election');

      setSuccess('Election created successfully!');
      setTimeout(() => navigate('/admin'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <div className="dashboard-content">
        <h2 style={{ marginBottom: '1.5rem' }}>Create New Election</h2>

        <div className="glass-card" style={{ maxWidth: '600px' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Election Title</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Department Representative Election 2026"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input
                type="datetime-local"
                className="form-control"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Time</label>
              <input
                type="datetime-local"
                className="form-control"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                {loading ? 'Creating...' : 'Create Election'}
              </button>
              <button type="button" onClick={() => navigate('/admin')} className="btn btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
            </div>
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

export default AdminElectionForm;
