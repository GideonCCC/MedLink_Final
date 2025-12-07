import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../../utils/apiClient';
import PropTypes from 'prop-types';
import './PastAppointments.css';

export default function PastAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadAppointments = useCallback(async () => {
    try {
      const data = await apiClient('/api/doctor/past-appointments');
      setAllAppointments(data.appointments);
      filterAppointments(data.appointments, searchQuery);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  const filterAppointments = (appts, query) => {
    if (!query || query.trim() === '') {
      setAppointments(appts);
      return;
    }

    const searchTerm = query.toLowerCase().trim();
    const filtered = appts.filter((apt) => {
      const patientName = apt.patientName?.toLowerCase() || '';
      return patientName.includes(searchTerm);
    });

    setAppointments(filtered);
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    filterAppointments(allAppointments, query);
  };

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  return (
    <div className="past-appointments">
      <div className="info-container">
        <h1>Past Appointments</h1>
        <div className="search-container">
          <input
            type="text"
            id="past-appointments-search-input"
            name="past-appointments-search"
            placeholder="Search by patient name..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
            aria-label="Search appointments by patient name"
          />
        </div>
      </div>
      {error && <div className="error-message" role="alert">{error}</div>}
      <div className="upcoming-section">
        {loading ? (
          <div className="loading">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="empty-state">
            <p>
              {searchQuery
                ? `No appointments found matching "${searchQuery}".`
                : "You don't have any past appointments."}
            </p>
          </div>
        ) : (
          <>
            {searchQuery && (
              <div className="search-results-info">
                Found {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} matching &quot;{searchQuery}&quot;
              </div>
            )}
            <div className="appointments-grid">
              {appointments.map((appointment) => (
                <PastAppointmentCard
                  key={appointment._id}
                  appointment={appointment}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

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

function PastAppointmentCard({ appointment }) {
  return (
    <div className="appointment-card">
      <div className="appointment-header">
        <h3>{appointment.patientName}</h3>
        <span className={`status-badge status-${appointment.status}`}>
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
      </div>
    </div>
  );
}

PastAppointmentCard.propTypes = {
  appointment: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    patientName: PropTypes.string.isRequired,
    startDateTime: PropTypes.string.isRequired,
    reason: PropTypes.string,
    status: PropTypes.string.isRequired,
  }).isRequired,
};
