import React, { useState, useEffect } from 'react';
import { apiClient } from '../../utils/apiClient';
import './DoctorProfile.css';

function DoctorProfile() {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    about: '',
    contact: '',
    additionalInfo: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      const data = await apiClient('/api/doctor/profile');
      setProfile({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        specialty: data.specialty || '',
        about: data.about || '',
        contact: data.contact || '',
        additionalInfo: data.additionalInfo || '',
      });
    } catch (err) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === 'specialty') return;
    setProfile((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await apiClient('/api/doctor/profile', {
        method: 'PUT',
        body: JSON.stringify(profile),
      });
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="doctor-profile-container">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="doctor-profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <p className="profile-subtitle">
          Update your profile information that patients can see
        </p>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-section">
          <h2 className="section-title">Basic Information</h2>
          
          <div className="form-group">
            <label htmlFor="name">
              Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={profile.name}
              onChange={handleChange}
              required
              placeholder="Dr. John Doe"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">
              Email <span className="required">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={profile.email}
              onChange={handleChange}
              required
              placeholder="doctor@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={profile.phone}
              onChange={handleChange}
              placeholder="555-1234"
            />
          </div>

          <div className="form-group">
            <label htmlFor="specialty">Specialty</label>
            <input
              type="text"
              id="specialty"
              name="specialty"
              value={profile.specialty}
              placeholder="e.g., Cardiology, Pediatrics"
              disabled
            />
          </div>
        </div>

        <div className="form-section">
          <h2 className="section-title">About Section</h2>
          
          <div className="form-group">
            <label htmlFor="about">About</label>
            <textarea
              id="about"
              name="about"
              value={profile.about}
              onChange={handleChange}
              rows="5"
              placeholder="Tell patients about your background, experience, and approach to care..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="contact">Contact Information</label>
            <textarea
              id="contact"
              name="contact"
              value={profile.contact}
              onChange={handleChange}
              rows="3"
              placeholder="Additional contact details, office hours, or preferred communication methods..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="additionalInfo">Additional Information</label>
            <textarea
              id="additionalInfo"
              name="additionalInfo"
              value={profile.additionalInfo}
              onChange={handleChange}
              rows="4"
              placeholder="Any other information you'd like patients to know (certifications, languages spoken, etc.)..."
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="save-button"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default DoctorProfile;

