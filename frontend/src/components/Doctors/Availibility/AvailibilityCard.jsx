import PropTypes from 'prop-types';
import { useMemo } from 'react';
function generateTimeSlots(startHour, endHour) {
  const slots = [];
  for (let hour = startHour; hour < endHour; hour += 1) {
    const hourStr = String(hour).padStart(2, '0');
    slots.push(`${hourStr}:00`);
    slots.push(`${hourStr}:30`);
  }
  return slots;
}

export default function AvailibilityCard({
  day,
  availability,
  setNewAvailability,
}) {
  const slots = useMemo(() => generateTimeSlots(9, 17), []); // 9:00 AM to 5:00 PM (17:00)

  const toggleSlot = (time) => {
    const newSet = new Set(availability);
    if (newSet.has(time)) {
      newSet.delete(time);
    } else {
      newSet.add(time);
    }
    setNewAvailability(newSet);
  };

  const selectedCount = availability.size;
  const totalSlots = slots.length;

  // Separate slots into morning (9:00 - 12:00) and afternoon (12:30 - 17:00)
  const morningSlots = slots.filter((time) => {
    const hour = parseInt(time.split(':')[0]);
    return hour < 12;
  });

  const afternoonSlots = slots.filter((time) => {
    const hour = parseInt(time.split(':')[0]);
    return hour >= 12;
  });

  return (
    <div className="day-card">
      <div className="day-header">
        {day}
        {selectedCount > 0 && (
          <span className="selection-count">
            {selectedCount} of {totalSlots} slots selected
          </span>
        )}
      </div>

      {/* Morning Section */}
      <div className="time-section">
        <div className="time-section-header">
          <span className="time-section-title">Morning • 9:00 AM - 12:00 PM</span>
        </div>
        <div className="slots-grid" role="group" aria-label={`${day} morning availability slots`}>
          {morningSlots.map((time) => {
            const isSelected = availability.has(time);
            return (
              <button
                key={time}
                type="button"
                className={`slot-button ${isSelected ? 'selected' : ''}`}
                onClick={() => toggleSlot(time)}
                aria-pressed={isSelected}
                aria-label={`${time} - ${isSelected ? 'Available' : 'Not available'}`}
              >
                {time}
              </button>
            );
          })}
        </div>
      </div>

      {/* Afternoon Section */}
      <div className="time-section">
        <div className="time-section-header">
          <span className="time-section-title">Afternoon • 12:30 PM - 5:00 PM</span>
        </div>
        <div className="slots-grid" role="group" aria-label={`${day} afternoon availability slots`}>
          {afternoonSlots.map((time) => {
            const isSelected = availability.has(time);
            return (
              <button
                key={time}
                type="button"
                className={`slot-button ${isSelected ? 'selected' : ''}`}
                onClick={() => toggleSlot(time)}
                aria-pressed={isSelected}
                aria-label={`${time} - ${isSelected ? 'Available' : 'Not available'}`}
              >
                {time}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

AvailibilityCard.propTypes = {
  day: PropTypes.string.isRequired,
  availability: PropTypes.object.isRequired,
  setNewAvailability: PropTypes.func.isRequired,
};
