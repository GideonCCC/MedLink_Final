import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../../context/AuthContext';
import './DoctorsLayout.css';

function DoctorsLayout({ children }) {
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
      {/* Brand name at top left */}
      <div className="patient-brand">
        <Link to="/doctor/dashboard" className="brand-link">
          MedLink
        </Link>
      </div>

      {/* Main content grid: 1, 4, 6, 1 */}
      <div className="patient-content-grid">
        {/* Left margin - empty */}
        <div className="patient-left-margin"></div>

        {/* Left sidebar menu - 4 units */}
        <div className="patient-sidebar">
          <div className="sidebar-welcome">
            Welcome back, {user?.name || 'User'}
          </div>
          <nav className="sidebar-nav">
            <Link
              to="/doctor/availability"
              className={`sidebar-nav-item ${isActive('/doctor/availability') ? 'active' : ''}`}
            >
              Home
            </Link>
            <Link
              to="/doctor/upcoming-appointments"
              className={`sidebar-nav-item ${isActive('/doctor/upcoming-appointments') ? 'active' : ''}`}
            >
              Upcoming Appointments
            </Link>
            <Link
              to="/doctor/history"
              className={`sidebar-nav-item ${isActive('/doctor/history') ? 'active' : ''}`}
            >
              Past Appointments
            </Link>
            <button onClick={handleLogout} className="sidebar-nav-item sidebar-logout">
              Logout
            </button>
          </nav>
        </div>

        {/* Right content area - 6 units */}
        <div className="patient-content">
          {children}
        </div>

        {/* Right margin - empty */}
        <div className="patient-right-margin"></div>
      </div>
    </div>
  );
}

DoctorsLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default DoctorsLayout;

