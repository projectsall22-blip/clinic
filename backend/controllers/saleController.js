const Sale = require('../models/Sale');
const Medicine = require('../models/Medicine');
const Branch = require('../models/Branch');

// ─── Helper: generate receipt number ────────────────────────────────────────
const generateReceiptNumber = async (branchId) => {
    const year = new Date().getFullYear();
    const count = await Sale.countDocuments({ branch: branchId });
    return `NLC-${year}-${String(count + 1).padStart(4, '0')}`;
};

// @desc  Create a new sale / bill
// @route POST /api/sales
// @access Pharmaceutical
const createSale = async (req, res) => {
    try {
        const { items, patientName, patientPhone, patientId, discount, paymentMode } = req.body;
        const branchId = req.user.branch;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: "No items in sale" });
        }

        // 1. Validate stock and calculate totals
        let subtotal = 0;
        const saleItems = [];

        for (const item of items) {
            const medicine = await Medicine.findById(item.medicineId);
            if (!medicine) return res.status(404).json({ message: `Medicine ${item.medicineId} not found` });
            if (medicine.stock < item.quantity) {
                return res.status(400).json({ message: `Insufficient stock for ${medicine.name}. Available: ${medicine.stock}` });
            }

            const total = item.quantity * medicine.sellingPrice;
            subtotal += total;
            saleItems.push({
                medicine: medicine._id,
                medicineName: medicine.name,
                quantity: item.quantity,
                unitPrice: medicine.sellingPrice,
                total
            });
        }

        const discountAmt = discount || 0;
        const grandTotal = subtotal - discountAmt;

        // 2. Generate receipt number
        const receiptNumber = await generateReceiptNumber(branchId);

        // 3. Create sale record
        const sale = await Sale.create({
            receiptNumber,
            patient: patientId || null,
            patientName: patientName || 'Walk-in Patient',
            patientPhone: patientPhone || '',
            branch: branchId,
            items: saleItems,
            subtotal,
            discount: discountAmt,
            grandTotal,
            paymentMode: paymentMode || 'Cash',
            soldBy: req.user._id,
            saleDate: new Date()
        });

        // 4. Deduct stock for each medicine
        for (const item of items) {
            await Medicine.findByIdAndUpdate(item.medicineId, { $inc: { stock: -item.quantity } });
        }

        // 5. Populate branch for receipt
        const populated = await Sale.findById(sale._id).populate('branch', 'name address phone');
        res.status(201).json(populated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get sales list for a branch
// @route GET /api/sales?from=&to=&page=
// @access Pharmaceutical, Admin
const getSales = async (req, res) => {
    try {
        const branchId = req.user.role === 'admin' ? req.query.branch : req.user.branch;
        const { from, to, page = 1, limit = 50 } = req.query;

        const filter = {};
        if (branchId) filter.branch = branchId;
        if (from || to) {
            filter.saleDate = {};
            if (from) { const d = new Date(from); d.setHours(0, 0, 0, 0); filter.saleDate.$gte = d; }
            if (to) { const d = new Date(to); d.setHours(23, 59, 59, 999); filter.saleDate.$lte = d; }
        }

        const total = await Sale.countDocuments(filter);
        const sales = await Sale.find(filter)
            .sort({ saleDate: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .populate('branch', 'name');

        res.json({ sales, total });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get single sale (for receipt)
// @route GET /api/sales/:id
const getSaleById = async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id).populate('branch', 'name address phone');
        if (!sale) return res.status(404).json({ message: "Sale not found" });
        res.json(sale);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Today's sales summary for pharma dashboard
// @route GET /api/sales/dashboard-summary
// @access Pharmaceutical
const getSaleDashboardSummary = async (req, res) => {
    try {
        const branchId = req.user.branch;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const result = await Sale.aggregate([
            { $match: { branch: branchId, saleDate: { $gte: today, $lt: tomorrow } } },
            { $group: { _id: null, totalRevenue: { $sum: '$grandTotal' }, count: { $sum: 1 } } }
        ]);

        const Medicine = require('../models/Medicine');
        const [totalMedicines, lowStock, stockSummary] = await Promise.all([
            Medicine.countDocuments({ branch: branchId }),
            Medicine.countDocuments({ branch: branchId, $expr: { $lte: ['$stock', '$minStockAlert'] } }),
            Medicine.aggregate([
                { $match: { branch: branchId } },
                { $group: { _id: null, totalStockValue: { $sum: { $multiply: ['$stock', '$sellingPrice'] } } } }
            ])
        ]);

        res.json({
            todayRevenue: result[0]?.totalRevenue || 0,
            todaySalesCount: result[0]?.count || 0,
            totalMedicines,
            lowStockCount: lowStock,
            totalStockValue: stockSummary[0]?.totalStockValue || 0
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { createSale, getSales, getSaleById, getSaleDashboardSummary };
