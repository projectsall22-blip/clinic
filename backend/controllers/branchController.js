const Branch = require('../models/Branch');
const Receptionist = require('../models/Receptionist');
const Pharmaceutical = require('../models/Pharmaceutical');

// @desc  Create a new branch
// @route POST /api/branches
// @access Admin
const createBranch = async (req, res) => {
    try {
        const { name, address, phone, doctorName, doctorDegree } = req.body;
        const branch = await Branch.create({ name, address, phone, doctorName, doctorDegree });
        res.status(201).json(branch);
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ message: "Branch name already exists" });
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get all branches
// @route GET /api/branches
// @access Admin
const getAllBranches = async (req, res) => {
    try {
        const branches = await Branch.find().sort({ createdAt: -1 });
        res.json(branches);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get single branch
// @route GET /api/branches/:id
// @access Admin
const getBranch = async (req, res) => {
    try {
        const branch = await Branch.findById(req.params.id);
        if (!branch) return res.status(404).json({ message: "Branch not found" });
        res.json(branch);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Update a branch
// @route PUT /api/branches/:id
// @access Admin
const updateBranch = async (req, res) => {
    try {
        const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!branch) return res.status(404).json({ message: "Branch not found" });
        res.json(branch);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Deactivate a branch
// @route DELETE /api/branches/:id
// @access Admin
const deactivateBranch = async (req, res) => {
    try {
        const branch = await Branch.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!branch) return res.status(404).json({ message: "Branch not found" });
        res.json({ message: "Branch deactivated successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get branch summary stats (for admin dashboard)
// @route GET /api/branches/stats
// @access Admin
const getBranchStats = async (req, res) => {
    try {
        const Appointment = require('../models/Appointment');
        const Patient = require('../models/Patient');
        const Medicine = require('../models/Medicine');
        const Sale = require('../models/Sale');

        const branches = await Branch.find({ isActive: true });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const stats = await Promise.all(branches.map(async (branch) => {
            const [todayAppts, totalPatients, totalStock, todaySales] = await Promise.all([
                Appointment.countDocuments({ branch: branch._id, appointmentDate: { $gte: today, $lt: tomorrow } }),
                Patient.countDocuments({ branch: branch._id }),
                Medicine.aggregate([
                    { $match: { branch: branch._id } },
                    { $group: { _id: null, totalItems: { $sum: 1 }, totalStock: { $sum: '$stock' } } }
                ]),
                Sale.aggregate([
                    { $match: { branch: branch._id, saleDate: { $gte: today, $lt: tomorrow } } },
                    { $group: { _id: null, revenue: { $sum: '$grandTotal' }, count: { $sum: 1 } } }
                ])
            ]);

            return {
                branch: { _id: branch._id, name: branch.name, address: branch.address, doctorName: branch.doctorName },
                todayAppointments: todayAppts,
                totalPatients,
                stockItems: totalStock[0]?.totalItems || 0,
                todayRevenue: todaySales[0]?.revenue || 0,
                todaySalesCount: todaySales[0]?.count || 0
            };
        }));

        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { createBranch, getAllBranches, getBranch, updateBranch, deactivateBranch, getBranchStats };
