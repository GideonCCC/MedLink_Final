import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';

function generateTimeSlots(startHour, endHour) {
  const slots = [];
  for (let hour = startHour; hour < endHour; hour += 1) {
    slots.push(`${hour}:00`);
    slots.push(`${hour}:30`);
  }
  return slots;
}

export default function AvailibilityCard({
  day,
  getAvailability,
  oldAvailability,
}) {
  const slots = useMemo(() => generateTimeSlots(9, 17), []); // 9:00 to 16:30

  const [availability, setAvailability] = useState(() => {
    return oldAvailability || new Set();
  });

  const toggleSlot = (time) => {
    setAvailability((prev) => {
      const currentSet = new Set(prev);
      if (currentSet.has(time)) {
        currentSet.delete(time);
      } else {
        currentSet.add(time);
      }
      return currentSet;
    });
  };

  useEffect(() => {
    getAvailability(() => availability);
  });

  return (
    <div key={day} className="day-card">
      <div className="day-header">{day}</div>
      <div className="slots-grid">
        {slots.map((time) => {
          const isSelected = availability[day].has(time);
          return (
            <button
              key={time}
              type="button"
              className={`slot-button ${isSelected ? 'selected' : ''}`}
              onClick={() => toggleSlot(day, time)}
            >
              {time}
            </button>
          );
        })}
      </div>
    </div>
  );
}

AvailibilityCard.propTypes = {
  day: PropTypes.string.isRequired,
  getAvailability: PropTypes.func.isRequired,
  oldAvailability: PropTypes.set.isRequired,
};
