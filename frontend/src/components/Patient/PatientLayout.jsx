import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../../context/AuthContext';
import './PatientLayout.css';

function PatientLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  function handleLogoutClick() {
    setShowLogoutConfirm(true);
  }

  function handleLogoutConfirm() {
    logout();
    navigate('/');
  }

  function handleLogoutCancel() {
    setShowLogoutConfirm(false);
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
        <aside className="patient-sidebar">
          <div className="sidebar-welcome">
            <div className="welcome-text">Welcome back,</div>
            <div className="user-name">{user?.name || 'User'}</div>
          </div>
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
            <button onClick={handleLogoutClick} className="sidebar-nav-item sidebar-logout" type="button">
              Logout
            </button>
          </nav>
        </aside>

            <main className="patient-content" role="main">{children}</main>
      </div>

      {showLogoutConfirm && (
        <LogoutConfirmModal
          onConfirm={handleLogoutConfirm}
          onDismiss={handleLogoutCancel}
        />
      )}
    </div>
  );
}

function LogoutConfirmModal({ onConfirm, onDismiss }) {
  const modalRef = useRef(null);
  const firstFocusableRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    if (firstFocusableRef.current) {
      firstFocusableRef.current.focus();
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onDismiss();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onDismiss]);

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements && focusableElements.length > 0) {
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    }
  };

  return createPortal(
    <div
      className="modal-overlay"
      onClick={onDismiss}
      role="presentation"
      aria-hidden="false"
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-modal-title"
        aria-describedby="logout-modal-description"
        tabIndex={-1}
        ref={modalRef}
        onKeyDown={handleKeyDown}
      >
        <h3 id="logout-modal-title">Logout?</h3>
        <p id="logout-modal-description">
          Are you sure you want to logout? You will need to login again to access your account.
        </p>
        <div className="modal-actions">
          <button
            onClick={onDismiss}
            className="modal-cancel-button"
            aria-label="Stay logged in"
            ref={firstFocusableRef}
          >
            Stay
          </button>
          <button
            onClick={onConfirm}
            className="modal-confirm-button"
            aria-label="Logout"
          >
            Logout
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

LogoutConfirmModal.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired,
};

PatientLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PatientLayout;

