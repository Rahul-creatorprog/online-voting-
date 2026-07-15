import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Toast from '../components/Toast';

const AdminDashboard = () => {
  const { token, API_BASE } = useContext(AuthContext);
  const [stats, setStats] = useState({
    active: false,
    title: 'No Active Election',
    status: 'INACTIVE',
    totalStudents: 0,
    votesCast: 0,
    remainingStudents: 0
  });
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch public/active election stats
      const statsRes = await fetch(`${API_BASE}/admin/elections/public/status`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // 2. Fetch all elections
      const electionsRes = await fetch(`${API_BASE}/admin/elections`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (electionsRes.ok) {
        const electionsData = await electionsRes.json();
        setElections(electionsData);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, currentStatus) => {
    setError('');
    setSuccess('');
    let nextStatus = 'RUNNING';
    if (currentStatus === 'RUNNING') nextStatus = 'ENDED';
    else if (currentStatus === 'NOT_STARTED') nextStatus = 'RUNNING';

    try {
      const res = await fetch(`${API_BASE}/admin/elections/${id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update election status');

      setSuccess(`Election status changed to ${nextStatus}!`);
      fetchDashboardData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteElection = async (id) => {
    if (!window.confirm('Are you sure you want to delete this election? All associated candidates and votes may be affected.')) return;
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE}/admin/elections/${id}`, {
        method: 'DELETE',
        headers: { 
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (!res.ok) throw new Error('Failed to delete election');

      setSuccess('Election deleted successfully.');
      fetchDashboardData();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div id="loading-overlay"><div className="spinner"></div><p>Loading Dashboard...</p></div>;
  }

  return (
    <div className="dashboard-layout">
      <div className="dashboard-content">
        <h2 style={{ marginBottom: '1.5rem' }}>Admin Dashboard</h2>

        {/* Metrics Grid */}
        <div className="metrics-grid">
          <div className="metric-card" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: 'white' }}>
            <div className="metric-details">
              <h3>{stats.totalStudents}</h3>
              <p>Total Students</p>
            </div>
            <div className="metric-icon">👨‍🎓</div>
          </div>

          <div className="metric-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}>
            <div className="metric-details">
              <h3>{stats.votesCast}</h3>
              <p>Votes Cast</p>
            </div>
            <div className="metric-icon">🗳️</div>
          </div>

          <div className="metric-card" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white' }}>
            <div className="metric-details">
              <h3>{stats.remainingStudents}</h3>
              <p>Voters Remaining</p>
            </div>
            <div className="metric-icon">⏳</div>
          </div>

          <div className="metric-card" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white' }}>
            <div className="metric-details">
              <h3 style={{ fontSize: '1.2rem', margin: '0.3rem 0' }}>{stats.active ? 'Active' : 'Inactive'}</h3>
              <p>Election State</p>
            </div>
            <div className="metric-icon">📢</div>
          </div>
        </div>

        {/* Election Status Banner */}
        {stats.active && (
          <div className="glass-card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--success-color)' }}>
            <h3>📢 Active Election: {stats.title}</h3>
            <p style={{ marginTop: '0.5rem' }}>
              The election is currently <strong>RUNNING</strong>. Students can log in and cast their ballots securely. <br />
              Voting ends: <strong>{new Date(stats.endTime).toLocaleString()}</strong>
            </p>
          </div>
        )}

        {/* Elections List */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3>Election Registry</h3>
            <Link to="/admin/elections/new" className="btn btn-primary">
              ➕ Create Election
            </Link>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {elections.map((elec) => (
                  <tr key={elec._id}>
                    <td>
                      <strong>{elec.title}</strong>
                    </td>
                    <td>{new Date(elec.startTime).toLocaleString()}</td>
                    <td>{new Date(elec.endTime).toLocaleString()}</td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        background: elec.status === 'RUNNING' ? 'rgba(16, 185, 129, 0.15)' : elec.status === 'ENDED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                        color: elec.status === 'RUNNING' ? 'var(--success-color)' : elec.status === 'ENDED' ? 'var(--danger-color)' : 'var(--text-muted)'
                      }}>
                        {elec.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {elec.status !== 'ENDED' && (
                          <button
                            onClick={() => handleStatusChange(elec._id, elec.status)}
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                          >
                            {elec.status === 'NOT_STARTED' ? '▶️ Start' : '⏹️ Stop'}
                          </button>
                        )}
                        <Link
                          to={`/admin/elections/${elec._id}/candidates`}
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                        >
                          👥 Candidates
                        </Link>
                        <Link
                          to={`/results/${elec._id}`}
                          className="btn btn-primary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                        >
                          📈 Results
                        </Link>
                        <button
                          onClick={() => handleDeleteElection(elec._id)}
                          className="btn btn-danger"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {elections.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No elections registered. Click "Create Election" to start.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div id="toast-container">
          {error && <Toast message={error} type="error" onClose={() => setError('')} />}
          {success && <Toast message={success} type="success" onClose={() => setSuccess('')} />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
