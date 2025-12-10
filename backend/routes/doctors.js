import express from 'express';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../database/connection.js';

const router = express.Router();
const CLINIC_TIME_ZONE = process.env.CLINIC_TIMEZONE || 'America/New_York';

function getTimeZoneOffset(date, timeZone) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const parts = dtf.formatToParts(date).reduce((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});

  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );

  return (asUTC - date.getTime()) / 60000;
}

function createZonedDate(year, month, day, hour, minute, timeZone) {
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
  const offsetMinutes = getTimeZoneOffset(utcDate, timeZone);
  return new Date(utcDate.getTime() - offsetMinutes * 60000);
}

function formatTimeInZone(date, timeZone) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

// Get current date/time in clinic timezone as a Date object
// This creates a Date that represents the current moment in the clinic timezone
function getCurrentTimeInZone(timeZone) {
  const now = new Date();
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const parts = dtf.formatToParts(now).reduce((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});

  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  const hour = Number(parts.hour);
  const minute = Number(parts.minute);
  const second = Number(parts.second);

  // Create a Date object representing the current time in the clinic timezone
  // This will be used to compare with slot times
  const clinicTime = createZonedDate(year, month, day, hour, minute, timeZone);
  
  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    asDate: clinicTime,
  };
}

// Get all specialties (public - no auth required)
router.get('/specialties', async (req, res) => {
  try {
    const db = getDatabase();
    const specialties = await db
      .collection('users')
      .distinct('specialty', { role: 'doctor', specialty: { $ne: null } });

    // Remove duplicates (case-insensitive) and filter out empty values
    const uniqueSpecialties = Array.from(
      new Map(
        specialties
          .filter((spec) => spec && typeof spec === 'string' && spec.trim())
          .map((spec) => [spec.toLowerCase().trim(), spec.trim()])
      ).values()
    );

    res.json(uniqueSpecialties.sort());
  } catch (error) {
    console.error('Get specialties error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all doctors (public - no auth required)
router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    const { nameOrSpecialty } = req.query;

    // Build query - if nameOrSpecialty is provided, search by name or specialty
    const query = { role: 'doctor' };
    if (nameOrSpecialty && nameOrSpecialty.trim()) {
      query.$or = [
        { name: { $regex: nameOrSpecialty.trim(), $options: 'i' } },
        { specialty: { $regex: nameOrSpecialty.trim(), $options: 'i' } },
      ];
    }

    const doctors = await db
      .collection('users')
      .find(query, { projection: { hashedPassword: 0 } })
      .toArray();

    res.json(
      doctors.map((doctor) => ({
        id: doctor._id.toString(),
        name: doctor.name,
        specialty: doctor.specialty,
        email: doctor.email,
        phone: doctor.phone || '',
        about: doctor.about || '',
        contact: doctor.contact || '',
        additionalInfo: doctor.additionalInfo || '',
      }))
    );
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get doctor availability for a specific date (public)
router.get('/:id/availability', async (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res
        .status(400)
        .json({ error: 'Date parameter required (YYYY-MM-DD)' });
    }

    let doctorObjectId;
    try {
      doctorObjectId = new ObjectId(id);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid doctor ID' });
    }

    const doctor = await db
      .collection('users')
      .findOne({ _id: doctorObjectId, role: 'doctor' });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const availabilityDoc = await db
      .collection('availability')
      .findOne({ userId: id });

    // Parse the date and get start/end of day in local time
    const [year, month, day] = date.split('-').map(Number);
    if ([year, month, day].some((value) => Number.isNaN(value))) {
      return res.status(400).json({ error: 'Invalid date parameter' });
    }
    const startOfDay = createZonedDate(year, month, day, 0, 0, CLINIC_TIME_ZONE);
    const startOfNextDay = createZonedDate(year, month, day + 1, 0, 0, CLINIC_TIME_ZONE);

    const dayOfWeek = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      timeZone: CLINIC_TIME_ZONE,
    }).format(startOfDay);

    const dayAvailability =
      availabilityDoc?.availability?.[dayOfWeek] || [];

    // Get all appointments for this doctor on this date
    const appointments = await db
      .collection('appointments')
      .find({
        doctorId: id,
        startDateTime: { $gte: startOfDay, $lt: startOfNextDay },
        status: { $ne: 'cancelled' },
      })
      .toArray();

    // Optionally include patient-specific appointments to avoid conflicts
    let patientAppointments = [];
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        patientAppointments = await db
          .collection('appointments')
          .find({
            patientId: decoded.userId,
            startDateTime: { $gte: startOfDay, $lt: startOfNextDay },
            status: { $ne: 'cancelled' },
          })
          .toArray();
      } catch (error) {
        // Ignore token errors for optional auth
      }
    }

    const slots = [];
    // Get current time in clinic timezone
    const clinicNow = getCurrentTimeInZone(CLINIC_TIME_ZONE);
    const oneHourFromNow = new Date(clinicNow.asDate.getTime() + 60 * 60 * 1000);
    
    // Also check if the requested date is in the past
    const requestedDate = createZonedDate(year, month, day, 0, 0, CLINIC_TIME_ZONE);
    const todayStart = createZonedDate(
      clinicNow.year,
      clinicNow.month,
      clinicNow.day,
      0,
      0,
      CLINIC_TIME_ZONE
    );
    
    // If the requested date is before today, skip all slots
    if (requestedDate < todayStart) {
      return res.json({
        doctor: {
          id: doctor._id.toString(),
          name: doctor.name,
          specialty: doctor.specialty,
        },
        date: date,
        slots: [],
      });
    }
    
    // Check if requested date is today
    const isToday = requestedDate.getTime() === todayStart.getTime();

    const normalizedTimes = Array.from(
      new Set(
        dayAvailability
          .filter((time) => typeof time === 'string')
          .map((time) => time.trim())
      )
    ).sort();

    for (const timeString of normalizedTimes) {
      const [hourStr, minuteStr] = timeString.split(':');
      const slotHour = Number(hourStr);
      const slotMinute = Number(minuteStr);

      if (
        Number.isNaN(slotHour) ||
        Number.isNaN(slotMinute) ||
        slotHour < 0 ||
        slotHour > 23 ||
        slotMinute < 0 ||
        slotMinute >= 60
      ) {
        continue;
      }

      const slotStart = createZonedDate(
        year,
        month,
        day,
        slotHour,
        slotMinute,
        CLINIC_TIME_ZONE
      );
      const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000);

      if (slotStart < startOfDay || slotEnd > startOfNextDay) {
        continue;
      }

      // Filter out past time slots and slots less than 1 hour from now
      // Get current time - both slotStart and now are Date objects with UTC timestamps
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      
      // Always filter out slots that are in the past (before or equal to current time)
      // slotStart.getTime() returns UTC timestamp, now.getTime() returns UTC timestamp
      // So the comparison should be accurate
      const slotTimestamp = slotStart.getTime();
      const nowTimestamp = now.getTime();
      const oneHourFromNowTimestamp = oneHourFromNow.getTime();
      
      // Debug logging (temporary - remove after fixing)
      if (isToday && slotTimestamp > nowTimestamp - 3600000) {
        console.log(`[DEBUG] Slot ${timeString} on ${date}: slotTimestamp=${slotTimestamp}, nowTimestamp=${nowTimestamp}, diff=${slotTimestamp - nowTimestamp}ms, slotStart=${slotStart.toISOString()}, now=${now.toISOString()}`);
      }
      
      // Filter out past slots (slots that are before or equal to current time)
      if (slotTimestamp <= nowTimestamp) {
        continue;
      }
      
      // Filter out slots less than 1 hour from now
      if (slotTimestamp <= oneHourFromNowTimestamp) {
        continue;
      }

      const isDoctorBooked = appointments.some((apt) => {
        const aptStart = new Date(apt.startDateTime);
        const aptEnd = new Date(apt.endDateTime);
        return slotStart < aptEnd && slotEnd > aptStart;
      });

      const isPatientBooked = patientAppointments.some((apt) => {
        const aptStart = new Date(apt.startDateTime);
        const aptEnd = new Date(apt.endDateTime);
        return slotStart < aptEnd && slotEnd > aptStart;
      });

      // Check if slot is locked due to no-show (10-minute lock window)
      const isLockedByNoShow = appointments.some((apt) => {
        if (apt.status !== 'no-show' || !apt.noShowMarkedAt) {
          return false;
        }
        
        const aptStart = new Date(apt.startDateTime);
        const aptEnd = new Date(apt.endDateTime);
        const slotOverlaps = slotStart < aptEnd && slotEnd > aptStart;
        
        if (!slotOverlaps) {
          return false;
        }
        
        // Check if no-show was marked within the last 10 minutes
        const noShowMarkedAt = new Date(apt.noShowMarkedAt);
        const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
        return noShowMarkedAt > tenMinutesAgo;
      });

      slots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        available: !isDoctorBooked && !isPatientBooked && !isLockedByNoShow,
        time: formatTimeInZone(slotStart, CLINIC_TIME_ZONE),
      });
    }

    res.json({
      doctor: {
        id: doctor._id.toString(),
        name: doctor.name,
        specialty: doctor.specialty,
        email: doctor.email,
        phone: doctor.phone || '',
        about: doctor.about || '',
        contact: doctor.contact || '',
        additionalInfo: doctor.additionalInfo || '',
      },
      date: date,
      slots,
    });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single doctor by ID (public - no auth required)
// NOTE: This route must come AFTER /:id/availability to avoid route conflicts
router.get('/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    let doctorObjectId;
    try {
      doctorObjectId = new ObjectId(id);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid doctor ID' });
    }

    const doctor = await db
      .collection('users')
      .findOne(
        { _id: doctorObjectId, role: 'doctor' },
        { projection: { hashedPassword: 0 } }
      );

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json({
      id: doctor._id.toString(),
      name: doctor.name,
      specialty: doctor.specialty,
      email: doctor.email,
      phone: doctor.phone || '',
      about: doctor.about || '',
      contact: doctor.contact || '',
      additionalInfo: doctor.additionalInfo || '',
    });
  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
