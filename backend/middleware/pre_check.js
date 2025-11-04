function availibility(req, res, next) {
  const { availability } = req.body;

  if (!availability) {
    return res.status(400).json({ error: 'Availability is required' });
  }

  if (typeof availability !== 'object') {
    return res.status(400).json({ error: 'Availability must be an object' });
  }

  const weekdays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  // Check for exactly 7 keys, corresponding to weekdays
  const keys = Object.keys(availability);
  if (keys.length !== 7 || !weekdays.every((day) => keys.includes(day))) {
    return res.status(400).json({
      error: 'Availability must contain each weekday: Monday through Friday',
    });
  }

  // For each weekday, value must be an array
  for (const day of weekdays) {
    if (!Array.isArray(availability[day])) {
      return res
        .status(400)
        .json({ error: `Availability for ${day} must be an array` });
    }

    for (const hour of availability[day]) {
      if (
        typeof hour !== 'string' ||
        !hour.match(/^([01]\d|2[0-3]):([0-5]\d)$/)
      ) {
        return res.status(400).json({
          error: `Availability for ${day} must be an array of strings in the format "HH:MM"`,
        });
      }
    }
  }

  next();
}

export { availibility };
