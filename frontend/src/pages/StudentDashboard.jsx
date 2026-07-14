import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Toast from '../components/Toast';

const StudentDashboard = () => {
  const { user, token, API_BASE } = useContext(AuthContext);
  const [activeElection, setActiveElection] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [availableResults, setAvailableResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchActiveElection();
    fetchAvailableResults();
  }, []);

  const fetchActiveElection = async () => {
    try {
      const res = await fetch(`${API_BASE}/voting/active-election`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveElection(data.election);
        setHasVoted(data.hasVoted);
      } else {
        setActiveElection(null);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch election details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableResults = async () => {
    try {
      const res = await fetch(`${API_BASE}/results/available/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableResults(data);
      }
    } catch (err) {
      console.error('Failed to fetch available results:', err);
    }
  };

  if (loading) {
    return <div id="loading-overlay"><div className="spinner"></div><p>Loading Dashboard...</p></div>;
  }

  return (
    <div className="dashboard-layout">
      <div className="dashboard-content" style={{ marginLeft: 0, maxWidth: '100%' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Student Portal</h2>

        <div className="glass-card" style={{ marginBottom: '2rem' }}>
          <h3>Welcome, {user?.name}!</h3>
          <p style={{ marginTop: '0.5rem' }}>
            Register Number: <strong>{user?.registerNo}</strong> <br />
            Department: <strong>{user?.department}</strong> | Year: <strong>{user?.year}</strong> <br />
            Email: <strong>{user?.email}</strong>
          </p>
        </div>

        <div className="glass-card">
          <h3>Active Election Status</h3>
          <hr style={{ border: '0', borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} />

          {activeElection ? (
            <div>
              <h4 style={{ color: 'var(--primary-color)' }}>{activeElection.title}</h4>
              <p style={{ margin: '0.5rem 0' }}>
                Voting Ends: <strong>{new Date(activeElection.endTime).toLocaleString()}</strong>
              </p>
              
              {hasVoted ? (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid var(--success-color)',
                  color: 'var(--success-color)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  marginTop: '1.5rem',
                  fontWeight: '600',
                  textAlign: 'center'
                }}>
                  ✅ Thank you! You have successfully cast your ballot for this election.
                </div>
              ) : (
                <div style={{ marginTop: '1.5rem' }}>
                  <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                    An active election is running. Please proceed to the voting ballot screen to cast your anonymous votes.
                  </p>
                  <button onClick={() => navigate('/student/vote')} className="btn btn-primary">
                    🗳️ Go to Ballot Screen
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>There is no active election running at the moment.</p>
          )}
        </div>

        <div className="glass-card" style={{ marginTop: '2rem' }}>
          <h3>Election Results</h3>
          <hr style={{ border: '0', borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} />
          {availableResults.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {availableResults.map(election => (
                <div key={election._id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <div>
                    <h4 style={{ margin: 0 }}>{election.title}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Status: {election.status} | Participation: {election.votesCast}/{election.totalStudents} ({election.totalStudents > 0 ? Math.round((election.votesCast/election.totalStudents)*100) : 0}%)
                    </span>
                  </div>
                  <button onClick={() => navigate(`/results/${election._id}`)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                    📈 View Result
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No election results are available at the moment.</p>
          )}
        </div>

        <div id="toast-container">
          {error && <Toast message={error} type="error" onClose={() => setError('')} />}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
