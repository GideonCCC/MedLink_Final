import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import './DoctorAvailibility.css';
import AvailibilityCard from './AvailibilityCard';
import { apiClient } from '../../../utils/apiClient';

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export default function DoctorAvailibility() {
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  // Ref to store all availability data from child components
  const [availability, setAvailability] = useState({
    Monday: new Set(),
    Tuesday: new Set(),
    Wednesday: new Set(),
    Thursday: new Set(),
    Friday: new Set(),
    Saturday: new Set(),
    Sunday: new Set(),
  });

  useEffect(() => {
    async function loadAvailability() {
      try {
        const data = await apiClient('/api/doctor/my-availability');
        let initial = {};
        DAYS.forEach((day) => {
          initial[day] = new Set(
            (data?.availability && data.availability[day]) || []
          );
        });
        setAvailability(initial);
      } catch (err) {
        const initial = {};
        DAYS.forEach((day) => {
          initial[day] = new Set();
        });
        setAvailability(initial);
      }
    }
    loadAvailability();
  }, []);

  const handleSaveClick = () => {
    setShowSaveConfirm(true);
  };

  const handleSaveConfirm = async () => {
    setShowSaveConfirm(false);
    setSubmitting(true);
    setError('');

    // Convert Sets to arrays for easier serialization
    const payload = {};
    DAYS.forEach((day) => {
      payload[day] = Array.from(availability[day]);
    });

    try {
      await apiClient('/api/doctor/update-availability', {
        method: 'POST',
        body: JSON.stringify({ availability: payload }),
      });
    } catch (err) {
      setError(err.message || 'Failed to save availability');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveCancel = () => {
    setShowSaveConfirm(false);
  };

  return (
    <>
      {submitting && (
        <div className="loading-spinner-container">
          <div className="loading-spinner" />
        </div>
      )}
      <div className="doctor-availability">
        {error && <div className="error-message" role="alert">{error}</div>}
        <div className="info-container">
          <h1>Set Your Availability</h1>
          <p className="availability-description">
            Click on time slots to select your available hours. Selected slots will be highlighted in green.
            <br />
            <strong>Time slots:</strong> 9:00 AM - 5:00 PM (30-minute intervals)
            <br />
            <em>Scroll horizontally to view all days (Monday - Sunday)</em>
          </p>
        </div>

        <div className="availability-cards-container">
          {DAYS.map((day) => (
            <AvailibilityCard
              key={day}
              day={day}
              availability={availability[day]}
              setNewAvailability={(newSet) => {
                setAvailability((prev) => ({
                  ...prev,
                  [day]: newSet,
                }));
              }}
            />
          ))}
        </div>
        <div className="save-availability">
          <button
            onClick={handleSaveClick}
            disabled={submitting}
            className="save-button"
            aria-label="Save availability settings"
          >
            {submitting ? 'Saving...' : 'Save Availability'}
          </button>
        </div>
      </div>

      {showSaveConfirm && (
        <SaveConfirmModal
          onConfirm={handleSaveConfirm}
          onDismiss={handleSaveCancel}
        />
      )}
    </>
  );
}

function SaveConfirmModal({ onConfirm, onDismiss }) {
  const modalRef = useRef(null);
  const firstFocusableRef = useRef(null);

  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    if (firstFocusableRef.current) {
      firstFocusableRef.current.focus();
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  React.useEffect(() => {
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
        aria-labelledby="save-modal-title"
        aria-describedby="save-modal-description"
        tabIndex={-1}
        ref={modalRef}
        onKeyDown={handleKeyDown}
      >
        <h3 id="save-modal-title">Save Availability?</h3>
        <p id="save-modal-description">
          Are you sure you want to save these availability settings? This will update your schedule and affect when patients can book appointments with you.
        </p>
        <div className="modal-actions">
          <button
            onClick={onDismiss}
            className="modal-cancel-button"
            aria-label="Cancel saving"
            ref={firstFocusableRef}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="modal-confirm-button"
            aria-label="Save availability"
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

SaveConfirmModal.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired,
};

DoctorAvailibility.propTypes = {
  // DoctorAvailibility component doesn't receive props, but we document it for consistency
};
