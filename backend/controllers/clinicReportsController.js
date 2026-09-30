const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Sale = require('../models/Sale');
const Medicine = require('../models/Medicine');
const Branch = require('../models/Branch');

// ─── Helper: Build date range ────────────────────────────────────────────────
const getDateRange = (range, customFrom, customTo) => {
    const now = new Date();
    let from, to;
    to = new Date(now);
    to.setHours(23, 59, 59, 999);

    switch (range) {
        case 'daily':
            from = new Date(now);
            from.setHours(0, 0, 0, 0);
            break;
        case 'weekly':
            from = new Date(now);
            from.setDate(from.getDate() - 6);
            from.setHours(0, 0, 0, 0);
            break;
        case 'monthly':
            from = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'yearly':
            from = new Date(now.getFullYear(), 0, 1);
            break;
        case 'custom':
            from = new Date(customFrom);
            from.setHours(0, 0, 0, 0);
            to = new Date(customTo);
            to.setHours(23, 59, 59, 999);
            break;
        default:
            from = new Date(now);
            from.setHours(0, 0, 0, 0);
    }
    return { from, to };
};

// @desc  Receptionist reports — appointments & patients
// @route GET /api/reports/receptionist?range=daily&branch=
// @access Receptionist, Admin
const getReceptionistReport = async (req, res) => {
    try {
        const { range = 'daily', customFrom, customTo } = req.query;
        const branchId = req.user.role === 'admin' ? req.query.branch : req.user.branch;
        const { from, to } = getDateRange(range, customFrom, customTo);

        const dateFilter = { appointmentDate: { $gte: from, $lte: to } };
        const branchFilter = branchId ? { branch: branchId } : {};

        const [total, completed, cancelled, pending, newPatients, dailyTrend] = await Promise.all([
            Appointment.countDocuments({ ...branchFilter, ...dateFilter }),
            Appointment.countDocuments({ ...branchFilter, ...dateFilter, status: 'Completed' }),
            Appointment.countDocuments({ ...branchFilter, ...dateFilter, status: 'Cancelled' }),
            Appointment.countDocuments({ ...branchFilter, ...dateFilter, status: 'Pending' }),
            Patient.countDocuments({ ...branchFilter, createdAt: { $gte: from, $lte: to } }),
            // Daily trend: group by date
            Appointment.aggregate([
                { $match: { ...branchFilter, ...dateFilter } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$appointmentDate' } },
                        count: { $sum: 1 },
                        completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } }
                    }
                },
                { $sort: { _id: 1 } }
            ])
        ]);

        res.json({ range, from, to, total, completed, cancelled, pending, newPatients, dailyTrend });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Pharmaceutical reports — sales & stock
// @route GET /api/reports/pharma?range=daily&branch=
// @access Pharmaceutical, Admin
const getPharmaReport = async (req, res) => {
    try {
        const { range = 'daily', customFrom, customTo } = req.query;
        const branchId = req.user.role === 'admin' ? req.query.branch : req.user.branch;
        const { from, to } = getDateRange(range, customFrom, customTo);

        const branchFilter = branchId ? { branch: branchId } : {};
        const dateFilter = { saleDate: { $gte: from, $lte: to } };

        const [salesSummary, topMedicines, dailySalesTrend, stockAlerts] = await Promise.all([
            Sale.aggregate([
                { $match: { ...branchFilter, ...dateFilter } },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$grandTotal' },
                        totalDiscount: { $sum: '$discount' },
                        count: { $sum: 1 }
                    }
                }
            ]),
            Sale.aggregate([
                { $match: { ...branchFilter, ...dateFilter } },
                { $unwind: '$items' },
                {
                    $group: {
                        _id: '$items.medicineName',
                        totalQty: { $sum: '$items.quantity' },
                        totalRevenue: { $sum: '$items.total' }
                    }
                },
                { $sort: { totalRevenue: -1 } },
                { $limit: 10 }
            ]),
            Sale.aggregate([
                { $match: { ...branchFilter, ...dateFilter } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$saleDate' } },
                        revenue: { $sum: '$grandTotal' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            Medicine.find({ ...branchFilter, $expr: { $lte: ['$stock', '$minStockAlert'] } })
                .select('name stock minStockAlert unit').limit(20)
        ]);

        res.json({
            range, from, to,
            totalRevenue: salesSummary[0]?.totalRevenue || 0,
            totalDiscount: salesSummary[0]?.totalDiscount || 0,
            salesCount: salesSummary[0]?.count || 0,
            topMedicines,
            dailySalesTrend,
            stockAlerts
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Admin cross-branch report
// @route GET /api/reports/admin?range=daily&branch=
// @access Admin
const getAdminReport = async (req, res) => {
    try {
        const { range = 'daily', branch: branchId, customFrom, customTo } = req.query;
        const { from, to } = getDateRange(range, customFrom, customTo);

        const branchFilter = branchId ? { branch: branchId } : {};

        const [apptSummary, salesSummary, patientCount, allBranchData] = await Promise.all([
            Appointment.aggregate([
                { $match: { ...branchFilter, appointmentDate: { $gte: from, $lte: to } } },
                {
                    $group: {
                        _id: '$branch',
                        total: { $sum: 1 },
                        completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
                        cancelled: { $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] } }
                    }
                }
            ]),
            Sale.aggregate([
                { $match: { ...branchFilter, saleDate: { $gte: from, $lte: to } } },
                {
                    $group: {
                        _id: '$branch',
                        revenue: { $sum: '$grandTotal' },
                        count: { $sum: 1 }
                    }
                }
            ]),
            Patient.countDocuments({ ...branchFilter, createdAt: { $gte: from, $lte: to } }),
            Branch.find({ isActive: true }).select('name')
        ]);

        res.json({ range, from, to, apptSummary, salesSummary, newPatients: patientCount, branches: allBranchData });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Admin stock overview across all branches
// @route GET /api/reports/stock?branch=
// @access Admin
const getStockOverview = async (req, res) => {
    try {
        const { branch: branchId } = req.query;
        const filter = branchId ? { branch: branchId } : {};
        const today = new Date();
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

        const [lowStock, expiringSoon, outOfStock, byBranch] = await Promise.all([
            Medicine.find({ ...filter, $expr: { $lte: ['$stock', '$minStockAlert'] } })
                .populate('branch', 'name').select('name stock minStockAlert unit branch').limit(50),
            Medicine.find({ ...filter, expiryDate: { $gte: today, $lte: thirtyDaysLater } })
                .populate('branch', 'name').select('name expiryDate stock branch').limit(50),
            Medicine.find({ ...filter, stock: 0 })
                .populate('branch', 'name').select('name branch').limit(50),
            Medicine.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: '$branch',
                        totalItems: { $sum: 1 },
                        totalStockValue: { $sum: { $multiply: ['$stock', '$sellingPrice'] } },
                        lowStockCount: { $sum: { $cond: [{ $lte: ['$stock', '$minStockAlert'] }, 1, 0] } }
                    }
                }
            ])
        ]);

        res.json({ lowStock, expiringSoon, outOfStock, byBranch });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getReceptionistReport, getPharmaReport, getAdminReport, getStockOverview };
