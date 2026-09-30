const Receptionist = require('../models/Receptionist');
const Pharmaceutical = require('../models/Pharmaceutical');
const bcrypt = require('bcryptjs');

// ─── Helper: generate employee code ─────────────────────────────────────────
const generateCode = async (Model, prefix) => {
    const count = await Model.countDocuments();
    return `${prefix}${String(count + 1).padStart(3, '0')}`;
};

// ═══════════════════════════════════════════════════════════════════
//  RECEPTIONIST CRUD
// ═══════════════════════════════════════════════════════════════════

// @route POST /api/staff/receptionists
const addReceptionist = async (req, res) => {
    try {
        const { name, phone, email, gender, dateOfBirth, joiningDate, address, branch, password } = req.body;
        const employeeCode = await generateCode(Receptionist, 'REC');
        const finalPassword = password || 'Clinic@123';
        const rec = await Receptionist.create({
            name, phone, email, gender, dateOfBirth, joiningDate, address, branch,
            employeeCode,
            password: finalPassword
        });
        res.status(201).json({ message: "Receptionist added", employeeCode: rec.employeeCode });
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ message: "Duplicate email or employee code" });
        res.status(500).json({ message: err.message });
    }
};

// @route GET /api/staff/receptionists
const getAllReceptionists = async (req, res) => {
    try {
        const filter = { isActive: true };
        if (req.query.branch) filter.branch = req.query.branch;
        const list = await Receptionist.find(filter).populate('branch', 'name').sort({ createdAt: -1 });
        res.json(list);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @route PUT /api/staff/receptionists/:id
const updateReceptionist = async (req, res) => {
    try {
        const rec = await Receptionist.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!rec) return res.status(404).json({ message: "Not found" });
        res.json(rec);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @route DELETE /api/staff/receptionists/:id
const deactivateReceptionist = async (req, res) => {
    try {
        await Receptionist.findByIdAndUpdate(req.params.id, { isActive: false });
        res.json({ message: "Receptionist deactivated" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @route PUT /api/staff/receptionists/:id/reset-password
const resetReceptionistPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword) return res.status(400).json({ message: "Password required" });
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(newPassword, salt);
        await Receptionist.findByIdAndUpdate(req.params.id, { password: hashed });
        res.json({ message: "Password reset successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ═══════════════════════════════════════════════════════════════════
//  PHARMACEUTICAL CRUD
// ═══════════════════════════════════════════════════════════════════

// @route POST /api/staff/pharmaceuticals
const addPharmaceutical = async (req, res) => {
    try {
        const { name, phone, email, gender, dateOfBirth, joiningDate, address, branch, password } = req.body;
        const employeeCode = await generateCode(Pharmaceutical, 'PHA');
        const finalPassword = password || 'Pharma@123';
        const pharma = await Pharmaceutical.create({
            name, phone, email, gender, dateOfBirth, joiningDate, address, branch,
            employeeCode,
            password: finalPassword
        });
        res.status(201).json({ message: "Pharmaceutical staff added", employeeCode: pharma.employeeCode });
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ message: "Duplicate email or employee code" });
        res.status(500).json({ message: err.message });
    }
};

// @route GET /api/staff/pharmaceuticals
const getAllPharmaceuticals = async (req, res) => {
    try {
        const filter = { isActive: true };
        if (req.query.branch) filter.branch = req.query.branch;
        const list = await Pharmaceutical.find(filter).populate('branch', 'name').sort({ createdAt: -1 });
        res.json(list);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @route PUT /api/staff/pharmaceuticals/:id
const updatePharmaceutical = async (req, res) => {
    try {
        const pharma = await Pharmaceutical.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!pharma) return res.status(404).json({ message: "Not found" });
        res.json(pharma);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @route DELETE /api/staff/pharmaceuticals/:id
const deactivatePharmaceutical = async (req, res) => {
    try {
        await Pharmaceutical.findByIdAndUpdate(req.params.id, { isActive: false });
        res.json({ message: "Pharmaceutical staff deactivated" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @route PUT /api/staff/pharmaceuticals/:id/reset-password
const resetPharmaceuticalPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword) return res.status(400).json({ message: "Password required" });
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(newPassword, salt);
        await Pharmaceutical.findByIdAndUpdate(req.params.id, { password: hashed });
        res.json({ message: "Password reset successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    addReceptionist, getAllReceptionists, updateReceptionist, deactivateReceptionist, resetReceptionistPassword,
    addPharmaceutical, getAllPharmaceuticals, updatePharmaceutical, deactivatePharmaceutical, resetPharmaceuticalPassword
};
