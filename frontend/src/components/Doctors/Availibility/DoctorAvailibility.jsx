import React, { useMemo } from 'react';
import './DoctorAvailibility.css';
import AvailibilityCard from './components/AvailibilityCard';

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
  const [availability, setAvailability] = useMemo(() => {
    const initial = {};
    DAYS.forEach((day) => {
      initial[day] = new Set();
    });
    return initial;
  }, []);

  const functionHold = {};

  const saveAvailability = () => {
    const newAvailability = Object.keys(functionHold).map((day) => {
      functionHold[day]();
    });
    console.log(newAvailability);
    setAvailability(newAvailability);
  };
  return (
    <div className="doctor-availability">
      <h1>Set Your Availability</h1>
      <div className="availability-description">
        Select 30-minute slots between 9:00 AM and 5:00 PM.
      </div>

      <div className="availability-grid">
        {DAYS.map((day) => (
          <AvailibilityCard
            key={day}
            day={day}
            getAvailability={(fn) => (functionHold[day] = fn)}
            oldAvailability={availability[day]}
          />
        ))}
      </div>
      <button onClick={saveAvailability}>Save</button>
    </div>
  );
}
