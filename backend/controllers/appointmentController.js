const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Branch = require('../models/Branch');

// ─── Helper: get next token for a branch on a given date ────────────────────
const getNextToken = async (branchId, date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const last = await Appointment.findOne(
        { branch: branchId, appointmentDate: { $gte: dayStart, $lte: dayEnd } },
        { tokenNumber: 1 }
    ).sort({ tokenNumber: -1 });

    return last ? last.tokenNumber + 1 : 1;
};

// @desc  Book a new appointment (creates patient if new)
// @route POST /api/appointments
// @access Receptionist
const bookAppointment = async (req, res) => {
    try {
        const { patientId, patientData, doctorName, doctorDegree, appointmentDate, chiefComplaint } = req.body;
        const branchId = req.user.branch;

        // 1. Resolve patient — either existing or create new
        let patient;
        if (patientId) {
            patient = await Patient.findById(patientId);
            if (!patient) return res.status(404).json({ message: "Patient not found" });
        } else {
            patient = await Patient.create({
                ...patientData,
                branch: branchId,
                registeredBy: req.user._id
            });
        }

        // 2. Get doctor from branch if not provided
        let doctor = doctorName;
        let degree = doctorDegree || '';
        if (!doctor) {
            const branch = await Branch.findById(branchId);
            doctor = branch?.doctorName || 'Doctor';
            degree = branch?.doctorDegree || '';
        }

        // 3. Auto-assign token
        const apptDate = appointmentDate ? new Date(appointmentDate) : new Date();
        const tokenNumber = await getNextToken(branchId, apptDate);

        // 4. Create appointment
        const appointment = await Appointment.create({
            patient: patient._id,
            branch: branchId,
            doctorName: doctor,
            doctorDegree: degree,
            appointmentDate: apptDate,
            tokenNumber,
            chiefComplaint: chiefComplaint || '',
            createdBy: req.user._id
        });

        const populated = await Appointment.findById(appointment._id)
            .populate('patient', 'name age gender phone address')
            .populate('branch', 'name address phone doctorName');

        res.status(201).json(populated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get appointments for a branch (filterable by date/status)
// @route GET /api/appointments?date=&status=&page=
// @access Receptionist, Admin
const getAppointments = async (req, res) => {
    try {
        const branchId = req.user.role === 'admin' ? req.query.branch : req.user.branch;
        const { date, status, page = 1, limit = 50 } = req.query;

        const filter = {};
        if (branchId) filter.branch = branchId;
        if (status) filter.status = status;

        if (date) {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            const dEnd = new Date(date);
            dEnd.setHours(23, 59, 59, 999);
            filter.appointmentDate = { $gte: d, $lte: dEnd };
        }

        const total = await Appointment.countDocuments(filter);
        const appointments = await Appointment.find(filter)
            .populate('patient', 'name age gender phone address')
            .populate('branch', 'name doctorName')
            .sort({ tokenNumber: 1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({ appointments, total });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get single appointment
// @route GET /api/appointments/:id
const getAppointmentById = async (req, res) => {
    try {
        const appt = await Appointment.findById(req.params.id)
            .populate('patient')
            .populate('branch');
        if (!appt) return res.status(404).json({ message: "Appointment not found" });
        res.json(appt);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Update appointment status or prescription
// @route PUT /api/appointments/:id
// @access Receptionist, Admin
const updateAppointment = async (req, res) => {
    try {
        const { status, prescription, chiefComplaint, doctorName } = req.body;
        const updateData = {};
        if (status) updateData.status = status;
        if (prescription !== undefined) updateData.prescription = prescription;
        if (chiefComplaint) updateData.chiefComplaint = chiefComplaint;
        if (doctorName) updateData.doctorName = doctorName;

        const appt = await Appointment.findByIdAndUpdate(req.params.id, updateData, { new: true })
            .populate('patient', 'name age gender phone address')
            .populate('branch', 'name address phone doctorName doctorDegree');

        if (!appt) return res.status(404).json({ message: "Appointment not found" });
        res.json(appt);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get today's summary for receptionist dashboard
// @route GET /api/appointments/dashboard-summary
// @access Receptionist
const getDashboardSummary = async (req, res) => {
    try {
        const branchId = req.user.branch;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [total, pending, completed, cancelled, totalPatients] = await Promise.all([
            Appointment.countDocuments({ branch: branchId, appointmentDate: { $gte: today, $lt: tomorrow } }),
            Appointment.countDocuments({ branch: branchId, appointmentDate: { $gte: today, $lt: tomorrow }, status: 'Pending' }),
            Appointment.countDocuments({ branch: branchId, appointmentDate: { $gte: today, $lt: tomorrow }, status: 'Completed' }),
            Appointment.countDocuments({ branch: branchId, appointmentDate: { $gte: today, $lt: tomorrow }, status: 'Cancelled' }),
            Patient.countDocuments({ branch: branchId })
        ]);

        res.json({ total, pending, completed, cancelled, totalPatients });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get appointment slip data (used for PDF generation on frontend)
// @route GET /api/appointments/:id/slip
// @access Receptionist
const getSlipData = async (req, res) => {
    try {
        const appt = await Appointment.findById(req.params.id)
            .populate('patient')
            .populate('branch');
        if (!appt) return res.status(404).json({ message: "Appointment not found" });
        res.json(appt);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get appointment by token number (for pharma — today's branch token)
// @route GET /api/appointments/by-token/:tokenNumber
// @access Pharmaceutical, Receptionist, Admin
const getAppointmentByToken = async (req, res) => {
    try {
        const tokenNumber = Number(req.params.tokenNumber);
        if (isNaN(tokenNumber)) return res.status(400).json({ message: "Invalid token number" });

        const branchId = req.user.role === 'admin' ? req.query.branch : req.user.branch;

        // Search today's appointments for this branch + token
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const appt = await Appointment.findOne({
            branch: branchId,
            tokenNumber,
            appointmentDate: { $gte: today, $lt: tomorrow }
        })
        .populate('patient', 'name age gender phone address')
        .populate('branch', 'name address phone doctorName');

        if (!appt) {
            return res.status(404).json({ message: `Token ${tokenNumber} not found for today` });
        }

        res.json(appt);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { bookAppointment, getAppointments, getAppointmentById, updateAppointment, getDashboardSummary, getSlipData, getAppointmentByToken };
