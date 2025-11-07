import PropTypes from 'prop-types';
import { useState } from 'react';
import './UpcomingAppointmentCard.css';

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function UpcomingAppointmentCard({ appointment, onCancel }) {
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelConfirmTimeout, setCancelConfirmTimeout] = useState(false);

  return (
    <div className="upcoming-appointment-card">
      {cancelConfirm && (
        <div
          className={`cancel-modal-bg ${cancelConfirmTimeout ? '' : 'hide'}`}
        >
          <div
            className={`cancel-confirmation-modal ${cancelConfirmTimeout ? '' : 'hide'}`}
          >
            <h3 className="cancel-confirmation-modal-title">
              Cancel Appointment?
            </h3>
            <p className="cancel-confirmation-modal-description">
              Are you sure you want to cancel this appointment?
            </p>
            <p className="cancel-confirmation-modal-description-warning">
              This action cannot be undone.
            </p>
            <div className="cancel-confirmation-modal-actions">
              <button
                className="cancel-confirmation-modal-keep-button"
                onClick={() => {
                  setCancelConfirmTimeout(false);
                  setTimeout(() => setCancelConfirm(false), 500);
                }}
              >
                Keep
              </button>
              <button
                className="cancel-confirmation-modal-confirm-button"
                onClick={() => onCancel(appointment.id)}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="appointment-card">
        <div className="appointment-header">
          <h3>{appointment.patientName}</h3>
          <span className="status-badge status-upcoming">Upcoming</span>
        </div>
        <div className="appointment-details">
          <p className="appointment-date">
            {formatDate(appointment.startDateTime)}
          </p>
          {appointment.reason && (
            <p className="appointment-reason">{appointment.reason}</p>
          )}
        </div>
        <div className="appointment-actions">
          <button
            onClick={() => {
              setCancelConfirmTimeout(true);
              setCancelConfirm(true);
            }}
            className="cancel-appointment-button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

UpcomingAppointmentCard.propTypes = {
  appointment: PropTypes.shape({
    id: PropTypes.string.isRequired,
    patientName: PropTypes.string.isRequired,
    startDateTime: PropTypes.string.isRequired,
    reason: PropTypes.string,
  }).isRequired,
  onCancel: PropTypes.func.isRequired,
};
