const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');

// @desc  Register a new patient
// @route POST /api/patients
// @access Receptionist
const registerPatient = async (req, res) => {
    try {
        const { name, age, gender, phone, address } = req.body;
        // Branch auto-injected from req.user.branch
        const patient = await Patient.create({
            name, age, gender, phone, address,
            branch: req.user.branch,
            registeredBy: req.user._id
        });
        res.status(201).json(patient);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get all patients for a branch (with search)
// @route GET /api/patients?search=&page=&limit=
// @access Receptionist, Pharmaceutical, Admin
const getPatients = async (req, res) => {
    try {
        // Admin can pass ?branch= to filter, others use their own branch
        const branchId = req.user.role === 'admin'
            ? req.query.branch
            : req.user.branch;

        const { search = '', page = 1, limit = 50 } = req.query;

        const filter = {};
        if (branchId) filter.branch = branchId;
        if (search) {
            filter.$or = [
                { name:  { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        const total    = await Patient.countDocuments(filter);
        const patients = await Patient.find(filter)
            .populate('branch', 'name')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({ patients, total, page: Number(page), totalPages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get single patient with appointment history
// @route GET /api/patients/:id
// @access Receptionist, Pharmaceutical, Admin
const getPatientById = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id).populate('branch', 'name');
        if (!patient) return res.status(404).json({ message: "Patient not found" });

        const appointments = await Appointment.find({ patient: req.params.id })
            .sort({ appointmentDate: -1 })
            .limit(20);   // last 20 visits

        res.json({ patient, appointments });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Update patient details
// @route PUT /api/patients/:id
// @access Receptionist, Admin
const updatePatient = async (req, res) => {
    try {
        const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!patient) return res.status(404).json({ message: "Patient not found" });
        res.json(patient);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { registerPatient, getPatients, getPatientById, updatePatient };
