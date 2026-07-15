import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { role } = useContext(AuthContext);

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <ul className="sidebar-menu">
        {role === 'ADMIN' ? (
          <>
            <li>
              <NavLink to="/admin" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                📊 Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/elections" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                🗳️ Elections
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/students" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                👨‍🎓 Students
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/audit-logs" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                🗳️ Voter Logs
              </NavLink>
            </li>
            <li>
              <NavLink to="/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                ⚙️ Change Password
              </NavLink>
            </li>
          </>
        ) : (
          <>
            <li>
              <NavLink to="/student" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                🏠 Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/student/vote" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                🗳️ Cast Ballot
              </NavLink>
            </li>
          </>
        )}
      </ul>
    </aside>
  );
};

export default Sidebar;
