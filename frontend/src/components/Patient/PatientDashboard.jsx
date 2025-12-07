import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { apiClient } from '../../utils/apiClient';
import './PatientDashboard.css';

function PatientDashboard() {
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelConfirm, setCancelConfirm] = useState(null);

  useEffect(() => {
    loadUpcomingAppointments();
  }, []);

  async function loadUpcomingAppointments() {
    try {
      setLoading(true);
      const now = new Date().toISOString();
      const data = await apiClient(
        `/api/appointments?status=upcoming&from=${now}&page=1&limit=5`
      );
      setUpcomingAppointments(data.appointments);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleCancelClick(id) {
    setCancelConfirm(id);
  }

  function handleConfirmCancel() {
    if (!cancelConfirm) return;
    performCancel(cancelConfirm);
  }

  function handleCancelDismiss() {
    setCancelConfirm(null);
  }

  async function performCancel(id) {
    try {
      await apiClient(`/api/appointments/${id}`, { method: 'DELETE' });
      setCancelConfirm(null);
      loadUpcomingAppointments();
    } catch (err) {
      setError(err.message);
      setCancelConfirm(null);
    }
  }

  return (
    <div className="patient-dashboard">
      {error && <div className="error-banner">{error}</div>}

      <div className="dashboard-header-section">
        <h2>Upcoming Appointments</h2>
      </div>

      <div className="upcoming-section">
        {loading ? (
          <div className="loading">Loading appointments...</div>
        ) : upcomingAppointments.length === 0 ? (
          <div className="empty-state">
            <p>You don&apos;t have any upcoming appointments.</p>
            <Link to="/patient/book-visit" className="link-button">
              Book your first appointment
            </Link>
          </div>
        ) : (
          <div className="appointments-grid">
            {upcomingAppointments.map((apt) => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                onCancel={handleCancelClick}
              />
            ))}
          </div>
        )}
      </div>

      {cancelConfirm && (
        <CancelConfirmModal
          onConfirm={handleConfirmCancel}
          onDismiss={handleCancelDismiss}
        />
      )}
    </div>
  );
}

function AppointmentCard({ appointment, onCancel }) {
  function formatDate(dateString) {
    const date = new Date(dateString);
    // Use clinic timezone (America/New_York) for consistent date display
    return date.toLocaleDateString('en-US', {
      timeZone: 'America/New_York',
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return (
    <div className="appointment-card">
      <div className="appointment-header">
        <h3>{appointment.doctorName}</h3>
        <span className="status-badge status-upcoming">
          {appointment.status}
        </span>
      </div>
      <div className="appointment-details">
        <p className="appointment-date">
          {formatDate(appointment.startDateTime)}
        </p>
        {appointment.reason && (
          <p className="appointment-reason">{appointment.reason}</p>
        )}
        {appointment.doctorSpecialty && (
          <p className="appointment-specialty">{appointment.doctorSpecialty}</p>
        )}
      </div>
      <div className="appointment-actions">
        <Link
          to={`/patient/appointments/${appointment.id}/edit`}
          className="action-button"
        >
          Reschedule
        </Link>
        <button
          onClick={() => onCancel(appointment.id)}
          className="cancel-appointment-button"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

AppointmentCard.propTypes = {
  appointment: PropTypes.shape({
    id: PropTypes.string.isRequired,
    doctorName: PropTypes.string.isRequired,
    doctorSpecialty: PropTypes.string,
    startDateTime: PropTypes.string.isRequired,
    reason: PropTypes.string,
    status: PropTypes.string.isRequired,
  }).isRequired,
  onCancel: PropTypes.func.isRequired,
};

function CancelConfirmModal({ onConfirm, onDismiss }) {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onDismiss();
      }
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    // Focus the modal when it opens
    if (modalRef.current) {
      modalRef.current.focus();
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onDismiss]);

  const handleKeyDown = (e) => {
    // Trap focus within modal
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
        aria-labelledby="cancel-modal-title"
        aria-describedby="cancel-modal-description"
        tabIndex={-1}
        ref={modalRef}
        onKeyDown={handleKeyDown}
      >
        <h3 id="cancel-modal-title">Cancel Appointment?</h3>
        <p id="cancel-modal-description">
          Are you sure you want to cancel this appointment? This action cannot
          be undone.
        </p>
        <div className="modal-actions">
          <button
            onClick={onDismiss}
            className="modal-cancel-button"
            aria-label="Keep appointment"
          >
            Keep
          </button>
          <button
            onClick={onConfirm}
            className="modal-confirm-button"
            aria-label="Cancel appointment"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

CancelConfirmModal.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired,
};

export default PatientDashboard;
