import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import { connectToDatabase } from './database/connection.js';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import appointmentRoutes from './routes/appointments.js';
import doctorRoutes from './routes/doctors.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

app.use(cors());

// Routes
app.use('/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/doctors', doctorRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Clinic Appointment Management System API',
    endpoints: {
      health: '/health',
      auth: '/auth',
      appointments: '/api/appointments',
      doctors: '/api/doctors',
    },
    frontend: 'http://localhost:3000',
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, _, res) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function startServer() {
  try {
    await connectToDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
