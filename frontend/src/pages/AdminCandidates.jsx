import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Toast from '../components/Toast';

const AdminCandidates = () => {
  const { electionId } = useParams();
  const { token, API_BASE } = useContext(AuthContext);
  const [candidates, setCandidates] = useState([]);
  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Add Candidate Form State
  const [name, setName] = useState('');
  const [registerNo, setRegisterNo] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [position, setPosition] = useState('');
  const [manifesto, setManifesto] = useState('');
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchCandidatesData();
  }, [electionId]);

  const fetchCandidatesData = async () => {
    try {
      // 1. Fetch Election Detail
      const elecRes = await fetch(`${API_BASE}/admin/elections/${electionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (elecRes.ok) {
        const elecData = await elecRes.json();
        setElection(elecData);
      }

      // 2. Fetch Candidates
      const candRes = await fetch(`${API_BASE}/admin/candidates?electionId=${electionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (candRes.ok) {
        const candData = await candRes.json();
        setCandidates(candData);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch candidate list');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    const formData = new FormData();
    formData.append('electionId', electionId);
    formData.append('name', name);
    formData.append('registerNo', registerNo);
    formData.append('department', department);
    formData.append('year', year);
    formData.append('position', position);
    formData.append('manifesto', manifesto);
    if (photo) {
      formData.append('photo', photo);
    }

    try {
      const res = await fetch(`${API_BASE}/admin/candidates`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add candidate');

      setSuccess('Candidate added successfully!');
      setName('');
      setRegisterNo('');
      setDepartment('');
      setYear('');
      setPosition('');
      setManifesto('');
      setPhoto(null);
      setShowAddForm(false);
      fetchCandidatesData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this candidate?')) return;
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE}/admin/candidates/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete candidate');

      setSuccess('Candidate deleted successfully.');
      fetchCandidatesData();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div id="loading-overlay"><div className="spinner"></div><p>Loading Candidates...</p></div>;
  }

  return (
    <div className="dashboard-layout">
      <div className="dashboard-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ marginBottom: '0.2rem' }}>Candidates Registry</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Election: <strong>{election?.title}</strong>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-primary">
              {showAddForm ? 'Hide Form' : '➕ Add Candidate'}
            </button>
            <button onClick={() => navigate('/admin')} className="btn btn-secondary">
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Add Candidate Form */}
        {showAddForm && (
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <h3>New Candidate Nomination</h3>
            <hr style={{ border: '0', borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} />

            <form onSubmit={handleAddSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-control" required value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Register Number</label>
                  <input type="text" className="form-control" required placeholder="e.g. 2026CSE100" value={registerNo} onChange={(e) => setRegisterNo(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input type="text" className="form-control" required placeholder="e.g. Computer Science" value={department} onChange={(e) => setDepartment(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Year</label>
                  <input type="text" className="form-control" required placeholder="e.g. IV Year" value={year} onChange={(e) => setYear(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Position / Post</label>
                  <input type="text" className="form-control" required placeholder="e.g. Secretary" value={position} onChange={(e) => setPosition(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Candidate Photo</label>
                  <input type="file" className="form-control" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Manifesto / Bio</label>
                <textarea className="form-control" rows="3" placeholder="Brief outline of candidate goals..." value={manifesto} onChange={(e) => setManifesto(e.target.value)}></textarea>
              </div>

              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Register Nominee'}
              </button>
            </form>
          </div>
        )}

        {/* Candidates List Grid */}
        <div className="glass-card">
          <h3>Registered Nominees</h3>
          <hr style={{ border: '0', borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} />

          <div className="card-grid">
            {candidates.map(cand => (
              <div key={cand._id} className="candidate-card glass-card">
                <span className="candidate-badge">{cand.position}</span>
                <div className="candidate-photo-container">
                  <img
                    src={cand.photo.startsWith('http') ? cand.photo : `http://localhost:8080/uploads/${cand.photo}`}
                    alt={cand.name}
                    className="candidate-photo"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
                  />
                </div>
                <h4>{cand.name}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {cand.registerNo} | {cand.department}
                </p>
                <p style={{ fontSize: '0.8rem', fontStyle: 'italic', margin: '0.5rem 0' }}>
                  "{cand.manifesto || 'No manifesto provided.'}"
                </p>
                
                <button
                  onClick={() => handleDelete(cand._id)}
                  className="btn btn-danger"
                  style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', marginTop: '1rem' }}
                >
                  🗑️ Revoke Nomination
                </button>
              </div>
            ))}
            {candidates.length === 0 && (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', gridColumn: '1/-1' }}>
                No candidates registered for this election yet. Click "Add Candidate" above.
              </p>
            )}
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

export default AdminCandidates;
