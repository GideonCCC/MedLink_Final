import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../../context/AuthContext';
import './PatientLayout.css';

function PatientLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate('/');
  }

  function isActive(path) {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  }

  return (
    <div className="patient-layout">
      <div className="patient-brand">
        <Link to="/patient/dashboard" className="brand-link">
          MedLink
        </Link>
      </div>

      <div className="patient-layout-body">
        <aside className="patient-menu">
          <div className="sidebar-welcome">Welcome back, {user?.name || 'User'}</div>
          <nav className="sidebar-nav">
            <Link
              to="/patient/dashboard"
              className={`sidebar-nav-item ${isActive('/patient/dashboard') ? 'active' : ''}`}
            >
              Dashboard
            </Link>
            <Link
              to="/patient/book-visit"
              className={`sidebar-nav-item ${isActive('/patient/book-visit') ? 'active' : ''}`}
            >
              Book Visit
            </Link>
            <Link
              to="/patient/history"
              className={`sidebar-nav-item ${isActive('/patient/history') ? 'active' : ''}`}
            >
              Visit History
            </Link>
            <button onClick={handleLogout} className="sidebar-nav-item sidebar-logout" type="button">
              Logout
            </button>
          </nav>
        </aside>

        <main className="patient-content">{children}</main>
      </div>
    </div>
  );
}

PatientLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PatientLayout;

