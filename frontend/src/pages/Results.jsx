import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Toast from '../components/Toast';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ChartTitle,
  Tooltip,
  Legend
);

const Results = () => {
  const { electionId } = useParams();
  const { token, role, API_BASE } = useContext(AuthContext);
  const [results, setResults] = useState(null);
  const [detailedVotes, setDetailedVotes] = useState([]);
  const [resultsReleased, setResultsReleased] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchResults();
    if (role === 'ADMIN') {
      fetchDetailedVotes();
    }
  }, [electionId]);

  const fetchResults = async () => {
    try {
      const res = await fetch(`${API_BASE}/results/${electionId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch results');
      setResults(data);

      // Check release status if admin
      if (role === 'ADMIN') {
        const elecRes = await fetch(`${API_BASE}/admin/elections/${electionId}`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true'
          }
        });
        if (elecRes.ok) {
          const elecData = await elecRes.json();
          setResultsReleased(elecData.resultsReleased);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailedVotes = async () => {
    try {
      const res = await fetch(`${API_BASE}/results/${electionId}/detailed`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setDetailedVotes(data);
      }
    } catch (err) {
      console.error('Failed to fetch detailed votes:', err);
    }
  };

  const handleReleaseToggle = async () => {
    try {
      const nextReleased = !resultsReleased;
      const res = await fetch(`${API_BASE}/admin/elections/${electionId}/release`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ released: nextReleased })
      });
      if (res.ok) {
        setResultsReleased(nextReleased);
        fetchResults();
      }
    } catch (err) {
      console.error('Failed to toggle results release:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div id="loading-overlay"><div className="spinner"></div><p>Loading Results...</p></div>;
  }

  return (
    <div className="dashboard-layout">
      <div className="dashboard-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ marginBottom: '0.2rem' }}>Election Tally</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Official results representation
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handlePrint} className="btn btn-secondary">
              🖨️ Print Page
            </button>
            <a href={`${API_BASE}/results/${electionId}/export/excel`} className="btn btn-secondary" style={{ fontSize: '0.9rem' }}>
              📊 Excel Report
            </a>
            <a href={`${API_BASE}/results/${electionId}/export/pdf`} className="btn btn-secondary" style={{ fontSize: '0.9rem' }}>
              📄 PDF Report
            </a>
            <a href={`${API_BASE}/results/${electionId}/export/csv`} className="btn btn-secondary" style={{ fontSize: '0.9rem' }}>
              📝 CSV Report
            </a>
            <button onClick={() => navigate(role === 'ADMIN' ? '/admin' : '/student')} className="btn btn-secondary">
              Back to Dashboard
            </button>
          </div>
        </div>

        {results && (
          <>
            {role === 'ADMIN' && (
              <div className="glass-card" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0 }}>Results Publication</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                    {resultsReleased 
                      ? '📢 Results are currently published and visible to all students.' 
                      : '🔒 Results are hidden from students. Click release to publish.'}
                  </p>
                </div>
                <button 
                  onClick={handleReleaseToggle} 
                  className={`btn ${resultsReleased ? 'btn-secondary' : 'btn-primary'}`}
                >
                  {resultsReleased ? '🔒 Hide Results' : '📢 Release Results'}
                </button>
              </div>
            )}
            {/* Metadata Summary */}
            <div className="glass-card" style={{ marginBottom: '2rem' }}>
              <h3>{results.electionTitle} Summary</h3>
              <hr style={{ border: '0', borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} />
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>STATUS</span>
                  <h4>{results.electionStatus}</h4>
                </div>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>TOTAL ELECTORATE</span>
                  <h4>{results.totalStudents}</h4>
                </div>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>VOTES LOGGED</span>
                  <h4>{results.votesCast}</h4>
                </div>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>PARTICIPATION RATE</span>
                  <h4>{results.participationRate}%</h4>
                </div>
              </div>
            </div>

            {/* Position tallies */}
            {Object.keys(results.resultsByPosition).map(position => {
              const positionResults = results.resultsByPosition[position];
              
              // Prepare chart details
              const chartData = {
                labels: positionResults.map(r => r.name),
                datasets: [{
                  label: 'Votes Recieved',
                  data: positionResults.map(r => r.voteCount),
                  backgroundColor: 'rgba(37, 99, 235, 0.65)',
                  borderColor: 'rgba(37, 99, 235, 1)',
                  borderWidth: 1,
                  borderRadius: 6
                }]
              };

              const chartOptions = {
                responsive: true,
                plugins: {
                  legend: { display: false },
                  tooltip: { enabled: true }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: { precision: 0 }
                  }
                }
              };

              return (
                <div key={position} className="glass-card" style={{ marginBottom: '2rem' }}>
                  <h3 style={{ color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                    Role: {position}
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem', alignItems: 'center' }}>
                    {/* Visual Chart */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                      <Bar data={chartData} options={chartOptions} />
                    </div>

                    {/* Nominee Table tally */}
                    <div>
                      <h4 style={{ marginBottom: '1rem' }}>Nominee Breakdown</h4>
                      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {positionResults.map(r => (
                          <li
                            key={r.candidateId}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '0.75rem',
                              background: r.label === 'WINNER' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0,0,0,0.02)',
                              border: r.label === 'WINNER' ? '1px solid var(--success-color)' : '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-md)'
                            }}
                          >
                            <div>
                              <strong style={{ display: 'block' }}>
                                {r.name} {r.label && <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.3rem', borderRadius: '4px', background: r.label === 'WINNER' ? 'var(--success-color)' : 'var(--warning-color)', color: 'white', marginLeft: '0.5rem' }}>{r.label}</span>}
                              </strong>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {r.department} - {r.year}
                              </span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <strong style={{ fontSize: '1.1rem' }}>{r.voteCount}</strong>
                              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.percentage}%</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
            {role === 'ADMIN' && detailedVotes.length > 0 && (
              <div className="glass-card" style={{ marginTop: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Detailed Student Votes Breakdown</h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Register No</th>
                        <th>Class Details</th>
                        <th>Position</th>
                        <th>Voted For</th>
                        <th>Nominee Register No</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailedVotes.map((vote) => (
                        <tr key={vote._id}>
                          <td>{vote.student?.name || 'Unknown Student'}</td>
                          <td><strong>{vote.student?.registerNo || 'N/A'}</strong></td>
                          <td>{vote.student ? `${vote.student.department} - ${vote.student.year}` : 'N/A'}</td>
                          <td><span className="candidate-badge" style={{ position: 'static' }}>{vote.position}</span></td>
                          <td><strong>{vote.candidate?.name || 'N/A'}</strong></td>
                          <td>{vote.candidate?.registerNo || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        <div id="toast-container">
          {error && <Toast message={error} type="error" onClose={() => setError('')} />}
        </div>
      </div>
    </div>
  );
};

export default Results;
