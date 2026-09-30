const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://dvgss.in",
  "https://www.dvgss.in",
  "https://clinic-eight-fawn.vercel.app"
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser tools (Postman, curl) and same-origin requests
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',           require('./routes/authRoutes'));
app.use('/api/admin',          require('./routes/adminRoutes'));
app.use('/api/users',          require('./routes/userRoutes'));
app.use('/api/branches',       require('./routes/branchRoutes'));
app.use('/api/staff',          require('./routes/staffRoutes'));
app.use('/api/patients',       require('./routes/patientRoutes'));
app.use('/api/appointments',   require('./routes/appointmentRoutes'));
app.use('/api/medicines',      require('./routes/medicineRoutes'));
app.use('/api/sales',          require('./routes/saleRoutes'));
app.use('/api/clinic-reports', require('./routes/clinicReportRoutes'));

app.get('/', (req, res) => {
    res.send('New Life Clinic API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
