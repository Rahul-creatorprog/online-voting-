import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Toast from '../components/Toast';

const Ballot = () => {
  const { token, logout, API_BASE } = useContext(AuthContext);
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [groupedCandidates, setGroupedCandidates] = useState({});
  const [selectedVotes, setSelectedVotes] = useState({}); // position: candidateId
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchBallot();
  }, []);

  const fetchBallot = async () => {
    try {
      const res = await fetch(`${API_BASE}/voting/active-election`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.hasVoted) {
          navigate('/student');
          return;
        }
        setElection(data.election);
        setCandidates(data.candidates);

        // Group by position
        const grouped = {};
        data.candidates.forEach(c => {
          if (!grouped[c.position]) grouped[c.position] = [];
          grouped[c.position].push(c);
        });
        setGroupedCandidates(grouped);
      } else {
        setError('No active election to display.');
      }
    } catch (err) {
      console.error(err);
      setError('Error loading ballot sheet.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (position, candidateId) => {
    setSelectedVotes(prev => ({
      ...prev,
      [position]: candidateId
    }));
  };

  const handleVoteSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const positions = Object.keys(groupedCandidates);
    const selectedCands = Object.values(selectedVotes);

    if (selectedCands.length < positions.length) {
      setError('Please select one candidate for each position before submitting.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/voting/cast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          electionId: election._id,
          candidateIds: selectedCands
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to submit votes');

      setSuccess('Votes submitted successfully! Redirecting back to dashboard...');
      setTimeout(() => {
        navigate('/student');
      }, 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div id="loading-overlay"><div className="spinner"></div><p>Loading Ballot Sheet...</p></div>;
  }

  return (
    <div className="dashboard-layout">
      <div className="dashboard-content" style={{ marginLeft: 0, maxWidth: '100%' }}>
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Ballot Sheet</h2>

        {election && (
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h3>{election.title}</h3>
            <p>Please vote for exactly one candidate in each of the following roles.</p>
          </div>
        )}

        <form onSubmit={handleVoteSubmit} style={{ maxWidth: '800px', margin: '0 auto' }}>
          {Object.keys(groupedCandidates).map(position => (
            <div key={position} className="glass-card" style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                Position: {position}
              </h3>

              <div className="card-grid">
                {groupedCandidates[position].map(cand => {
                  const isSelected = selectedVotes[position] === cand._id;
                  return (
                    <div
                      key={cand._id}
                      className="candidate-card glass-card"
                      style={{
                        cursor: 'pointer',
                        border: isSelected ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                        background: isSelected ? 'rgba(37, 99, 235, 0.05)' : 'var(--bg-card)'
                      }}
                      onClick={() => handleSelect(position, cand._id)}
                    >
                      <div className="candidate-photo-container">
                        <img
                          src={cand.photo.startsWith('http') ? cand.photo : `http://localhost:8080/uploads/${cand.photo}`}
                          alt={cand.name}
                          className="candidate-photo"
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
                        />
                      </div>
                      <h4>{cand.name}</h4>
                      <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                        {cand.department} - {cand.year}
                      </p>
                      <p style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>
                        "{cand.manifesto || 'No manifesto provided.'}"
                      </p>
                      
                      <div style={{ marginTop: '1rem' }}>
                        <span style={{
                          display: 'inline-block',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: '2px solid var(--primary-color)',
                          background: isSelected ? 'var(--primary-color)' : 'transparent',
                        }}></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>
              Submit Ballot
            </button>
          </div>
        </form>

        <div id="toast-container">
          {error && <Toast message={error} type="error" onClose={() => setError('')} />}
          {success && <Toast message={success} type="success" onClose={() => setSuccess('')} />}
        </div>
      </div>
    </div>
  );
};

export default Ballot;
