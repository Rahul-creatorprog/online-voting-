import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Toast from '../components/Toast';

const AdminAuditLogs = () => {
  const { token, API_BASE } = useContext(AuthContext);
  const [elections, setElections] = useState([]);
  const [selectedElectionId, setSelectedElectionId] = useState('');
  const [voterLogs, setVoterLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchingLogs, setFetchingLogs] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchElections();
  }, []);

  useEffect(() => {
    if (selectedElectionId) {
      fetchVoterLogs(selectedElectionId);
    } else {
      setVoterLogs([]);
    }
  }, [selectedElectionId]);

  const fetchElections = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/elections`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setElections(data);
        if (data.length > 0) {
          setSelectedElectionId(data[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch elections.');
    } finally {
      setLoading(false);
    }
  };

  const fetchVoterLogs = async (electionId) => {
    setFetchingLogs(true);
    try {
      const res = await fetch(`${API_BASE}/results/${electionId}/detailed`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setVoterLogs(data);
      } else {
        setError('Failed to fetch voter logs.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch voter logs.');
    } finally {
      setFetchingLogs(false);
    }
  };

  if (loading) {
    return <div id="loading-overlay"><div className="spinner"></div><p>Loading Voter Registry...</p></div>;
  }

  return (
    <div className="dashboard-layout">
      <div className="dashboard-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>Detailed Voter Registry</h2>
          <button onClick={() => navigate('/admin')} className="btn btn-secondary">
            Back to Dashboard
          </button>
        </div>

        <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
          <label htmlFor="election-select" style={{ fontWeight: 'bold', marginRight: '1rem' }}>
            Select Election:
          </label>
          <select
            id="election-select"
            value={selectedElectionId}
            onChange={(e) => setSelectedElectionId(e.target.value)}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              minWidth: '250px',
              fontSize: '1rem'
            }}
          >
            {elections.map((elec) => (
              <option key={elec._id} value={elec._id}>
                {elec.title} ({elec.status})
              </option>
            ))}
            {elections.length === 0 && <option value="">No elections available</option>}
          </select>
        </div>

        <div className="glass-card">
          {fetchingLogs ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
              <p>Fetching detailed logs...</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Register No</th>
                    <th>Class Details</th>
                    <th>Position</th>
                    <th>Voted For (Candidate)</th>
                    <th>Candidate Register No</th>
                  </tr>
                </thead>
                <tbody>
                  {voterLogs.map((log) => (
                    <tr key={log._id}>
                      <td>{log.student?.name || 'Unknown Student'}</td>
                      <td><strong>{log.student?.registerNo || 'N/A'}</strong></td>
                      <td>{log.student ? `${log.student.department} - ${log.student.year}` : 'N/A'}</td>
                      <td>
                        <span className="candidate-badge" style={{ position: 'static', display: 'inline-block' }}>
                          {log.position}
                        </span>
                      </td>
                      <td><strong>{log.candidate?.name || 'N/A'}</strong></td>
                      <td>{log.candidate?.registerNo || 'N/A'}</td>
                    </tr>
                  ))}
                  {voterLogs.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                        No votes have been cast yet in this election.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
