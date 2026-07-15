import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Toast from '../components/Toast';

const AdminStudents = () => {
  const { token, API_BASE } = useContext(AuthContext);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Add Single Student Form
  const [regNo, setRegNo] = useState('');
  const [name, setName] = useState('');
  const [dept, setDept] = useState('');
  const [year, setYear] = useState('');
  const [email, setEmail] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // File Import State
  const [importFile, setImportFile] = useState(null);
  const [importLogs, setImportLogs] = useState([]);
  const [showImportForm, setShowImportForm] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [page, search]);

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/students?search=${search}&page=${page}&size=10`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.content || []);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load student registry');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE}/admin/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          registerNo: regNo,
          name,
          department: dept,
          year,
          email
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add student');

      setSuccess('Student registered successfully!');
      setRegNo('');
      setName('');
      setDept('');
      setYear('');
      setEmail('');
      setShowAddForm(false);
      fetchStudents();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleStatus = async (id) => {
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_BASE}/admin/students/${id}/toggle`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error('Failed to toggle status');

      setSuccess(`Student status set to ${data.status}`);
      fetchStudents();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResetPassword = async (id) => {
    const newPassword = window.prompt('Enter new password for student (min 8 chars):');
    if (!newPassword) return;
    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }

    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_BASE}/admin/students/${id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ password: newPassword })
      });
      if (!res.ok) throw new Error('Failed to reset password');

      setSuccess('Student password reset successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student profile?')) return;
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_BASE}/admin/students/${id}`, {
        method: 'DELETE',
        headers: { 
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (!res.ok) throw new Error('Failed to delete student');

      setSuccess('Student deleted successfully.');
      fetchStudents();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) return;
    setError('');
    setSuccess('');
    setImportLogs([]);
    setImporting(true);

    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const res = await fetch(`${API_BASE}/admin/students/import`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Import failed');

      setSuccess(`Bulk import finished! Success: ${data.successCount}, Duplicates: ${data.duplicateCount}, Errors: ${data.errorCount}`);
      setImportLogs(data.logs || []);
      setImportFile(null);
      fetchStudents();
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <div className="dashboard-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>Students Registry</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => { setShowAddForm(!showAddForm); setShowImportForm(false); }} className="btn btn-primary">
              {showAddForm ? 'Hide Form' : '➕ Add Student'}
            </button>
            <button onClick={() => { setShowImportForm(!showImportForm); setShowAddForm(false); }} className="btn btn-secondary">
              📥 Bulk Import Excel/CSV
            </button>
            <button onClick={() => navigate('/admin')} className="btn btn-secondary">
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Add Student Form */}
        {showAddForm && (
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <h3>Register Single Student</h3>
            <hr style={{ border: '0', borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} />

            <form onSubmit={handleAddStudent}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Register Number</label>
                  <input type="text" className="form-control" required placeholder="e.g. 2026CSE001" value={regNo} onChange={(e) => setRegNo(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-control" required value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input type="text" className="form-control" required placeholder="e.g. Computer Science" value={dept} onChange={(e) => setDept(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Year</label>
                  <input type="text" className="form-control" required placeholder="e.g. III Year" value={year} onChange={(e) => setYear(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" className="form-control" required placeholder="student@college.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                Register Student
              </button>
            </form>
          </div>
        )}

        {/* Import Bulk Form */}
        {showImportForm && (
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <h3>Import Student Registry</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Upload an Excel (.xlsx) or CSV file with the following columns: <br />
              <code>Register Number, Student Name, Department, Year, Email</code>
            </p>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <a href={`${API_BASE}/admin/students/template?format=xlsx`} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                ⬇️ Download Excel Template
              </a>
              <a href={`${API_BASE}/admin/students/template?format=csv`} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                ⬇️ Download CSV Template
              </a>
            </div>

            <form onSubmit={handleImportSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input type="file" className="form-control" accept=".xlsx, .csv" required onChange={(e) => setImportFile(e.target.files[0])} />
              <button type="submit" className="btn btn-primary" disabled={importing}>
                {importing ? 'Importing...' : 'Upload & Process'}
              </button>
            </form>

            {importLogs.length > 0 && (
              <div style={{ marginTop: '1.5rem', background: 'rgba(0,0,0,0.05)', padding: '1rem', borderRadius: 'var(--radius-sm)', maxHeight: '200px', overflowY: 'auto' }}>
                <h4>Import Event Log:</h4>
                <ul style={{ fontSize: '0.8rem', paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
                  {importLogs.map((log, idx) => <li key={idx}>{log}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Search registry */}
        <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
          <input
            type="text"
            className="form-control"
            placeholder="🔍 Search registry by Name, Register No, Department..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>

        {/* Table list */}
        <div className="glass-card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Reg No</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Year</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(stud => (
                  <tr key={stud._id}>
                    <td><strong>{stud.registerNo}</strong></td>
                    <td>{stud.name}</td>
                    <td>{stud.department}</td>
                    <td>{stud.year}</td>
                    <td>{stud.email}</td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        background: stud.status === 'ENABLED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: stud.status === 'ENABLED' ? 'var(--success-color)' : 'var(--danger-color)'
                      }}>
                        {stud.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleToggleStatus(stud._id)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
                          {stud.status === 'ENABLED' ? '🔒 Disable' : '🔑 Enable'}
                        </button>
                        <button onClick={() => handleResetPassword(stud._id)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
                          🔄 Reset Pass
                        </button>
                        <button onClick={() => handleDeleteStudent(stud._id)} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No students found in the database.
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
                Showing Page {page + 1} of {totalPages} (Total Students: {totalElements})
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
          {success && <Toast message={success} type="success" onClose={() => setSuccess('')} />}
        </div>
      </div>
    </div>
  );
};

export default AdminStudents;
