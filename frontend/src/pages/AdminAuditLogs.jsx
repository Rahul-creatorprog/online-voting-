import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Toast from '../components/Toast';

const AdminAuditLogs = () => {
  const { token, API_BASE } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/audit-logs?page=${page}&size=15`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.content || []);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch audit events.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div id="loading-overlay"><div className="spinner"></div><p>Loading Audit Registry...</p></div>;
  }

  return (
    <div className="dashboard-layout">
      <div className="dashboard-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>Security Audit Registry</h2>
          <button onClick={() => navigate('/admin')} className="btn btn-secondary">
            Back to Dashboard
          </button>
        </div>

        <div className="glass-card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Performed By</th>
                  <th>Action Event</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log._id}>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td><strong>{log.performedBy}</strong></td>
                    <td>{log.action}</td>
                    <td><code style={{ fontSize: '0.85rem' }}>{log.ip || 'Local/Internal'}</code></td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No audit events logged.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="pagination">
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Showing Page {page + 1} of {totalPages} (Total Events: {totalElements})
              </span>
              <div className="pagination-buttons">
                <button disabled={page === 0} onClick={() => setPage(page - 1)} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                  Prev
                </button>
                <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        <div id="toast-container">
          {error && <Toast message={error} type="error" onClose={() => setError('')} />}
        </div>
      </div>
    </div>
  );
};

export default AdminAuditLogs;
