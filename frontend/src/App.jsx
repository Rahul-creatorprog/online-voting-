import React, { useContext, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import Login from './pages/Login';
import OtpVerify from './pages/OtpVerify';
import StudentDashboard from './pages/StudentDashboard';
import Ballot from './pages/Ballot';
import AdminDashboard from './pages/AdminDashboard';
import AdminElectionForm from './pages/AdminElectionForm';
import AdminCandidates from './pages/AdminCandidates';
import AdminStudents from './pages/AdminStudents';
import AdminAuditLogs from './pages/AdminAuditLogs';
import Results from './pages/Results';
import Settings from './pages/Settings';

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useContext(AuthContext);
  if (loading) return <div id="loading-overlay"><div className="spinner"></div></div>;
  return token ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { token, role, loading } = useContext(AuthContext);
  if (loading) return <div id="loading-overlay"><div className="spinner"></div></div>;
  return token && role === 'ADMIN' ? children : <Navigate to="/login" replace />;
};

const StudentRoute = ({ children }) => {
  const { token, role, loading } = useContext(AuthContext);
  if (loading) return <div id="loading-overlay"><div className="spinner"></div></div>;
  return token && role === 'STUDENT' ? children : <Navigate to="/login" replace />;
};

// Cohesive Layout Wrapper
const Layout = ({ children }) => {
  const { token } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
      {token ? (
        <div className="dashboard-layout">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="dashboard-content" onClick={() => setSidebarOpen(false)}>
            {children}
          </div>
        </div>
      ) : (
        <div className="container main-content">
          {children}
        </div>
      )}
    </>
  );
};

const AppContent = () => {
  const { role } = useContext(AuthContext);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Layout><Login /></Layout>} />
        <Route path="/otp-verify" element={<Layout><OtpVerify /></Layout>} />
        
        {/* Student Routes */}
        <Route path="/student" element={
          <StudentRoute>
            <Layout><StudentDashboard /></Layout>
          </StudentRoute>
        } />
        <Route path="/student/vote" element={
          <StudentRoute>
            <Layout><Ballot /></Layout>
          </StudentRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <Layout><AdminDashboard /></Layout>
          </AdminRoute>
        } />
        <Route path="/admin/elections/new" element={
          <AdminRoute>
            <Layout><AdminElectionForm /></Layout>
          </AdminRoute>
        } />
        <Route path="/admin/elections/:electionId/candidates" element={
          <AdminRoute>
            <Layout><AdminCandidates /></Layout>
          </AdminRoute>
        } />
        <Route path="/admin/students" element={
          <AdminRoute>
            <Layout><AdminStudents /></Layout>
          </AdminRoute>
        } />
        <Route path="/admin/audit-logs" element={
          <AdminRoute>
            <Layout><AdminAuditLogs /></Layout>
          </AdminRoute>
        } />
        <Route path="/results/:electionId" element={
          <ProtectedRoute>
            <Layout><Results /></Layout>
          </ProtectedRoute>
        } />

        {/* Generic Protected Route */}
        <Route path="/settings" element={
          <ProtectedRoute>
            <Layout><Settings /></Layout>
          </ProtectedRoute>
        } />

        {/* Catch-all redirect */}
        <Route path="*" element={
          role === 'ADMIN' ? <Navigate to="/admin" replace /> : <Navigate to="/student" replace />
        } />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
