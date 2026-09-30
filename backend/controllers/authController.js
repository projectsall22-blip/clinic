const Admin        = require('../models/Admin');
const Receptionist = require('../models/Receptionist');
const Pharmaceutical = require('../models/Pharmaceutical');
const bcrypt       = require('bcryptjs');
const generateToken = require('../utils/generateToken');

// @desc  Admin Login
// @route POST /api/auth/admin-login
const adminLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const admin = await Admin.findOne({ email });
        if (admin && (await bcrypt.compare(password, admin.password))) {
            res.json({
                _id: admin._id,
                name: admin.name,
                role: 'admin',
                profileImage: admin.profileImage,
                email: admin.email,
                phone: admin.phone,
                token: generateToken(admin._id, 'admin')
            });
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc  Receptionist Login
// @route POST /api/auth/receptionist-login
const receptionistLogin = async (req, res) => {
    const { employeeCode, password } = req.body;
    try {
        const rec = await Receptionist.findOne({ employeeCode })
            .populate('branch', 'name address phone doctorName doctorDegree');

        if (!rec || !rec.isActive) {
            return res.status(401).json({ message: "Account is inactive or not found. Please contact Admin." });
        }

        const isMatch = await bcrypt.compare(password, rec.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid employee code or password" });
        }

        res.json({
            _id: rec._id,
            name: rec.name,
            role: 'receptionist',
            employeeCode: rec.employeeCode,
            email: rec.email,
            phone: rec.phone,
            gender: rec.gender,
            profileImage: rec.profileImage,
            branch: rec.branch,
            token: generateToken(rec._id, 'receptionist')
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc  Pharmaceutical Login
// @route POST /api/auth/pharmaceutical-login
const pharmaceuticalLogin = async (req, res) => {
    const { employeeCode, password } = req.body;
    try {
        const pharma = await Pharmaceutical.findOne({ employeeCode })
            .populate('branch', 'name address phone');

        if (!pharma || !pharma.isActive) {
            return res.status(401).json({ message: "Account is inactive or not found. Please contact Admin." });
        }

        const isMatch = await bcrypt.compare(password, pharma.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid employee code or password" });
        }

        res.json({
            _id: pharma._id,
            name: pharma.name,
            role: 'pharmaceutical',
            employeeCode: pharma.employeeCode,
            email: pharma.email,
            phone: pharma.phone,
            gender: pharma.gender,
            profileImage: pharma.profileImage,
            branch: pharma.branch,
            token: generateToken(pharma._id, 'pharmaceutical')
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc  Bootstrap first admin (one-time use)
// @route POST /api/auth/create-secret-admin-12345
const createFirstAdmin = async (req, res) => {
    try {
        await Admin.deleteMany({});
        const admin = await Admin.create({
            name: "Clinic Owner",
            email: "admin@newlifeclinic.com",
            username: "admin",
            password: "NewLife@2026",
            role: "admin"
        });
        res.status(201).json({
            message: "Admin created successfully",
            email: admin.email,
            password_status: "Secured"
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { adminLogin, receptionistLogin, pharmaceuticalLogin, createFirstAdmin };
