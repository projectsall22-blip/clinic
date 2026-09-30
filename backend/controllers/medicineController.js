const Medicine = require('../models/Medicine');

// @desc  Add a new medicine
// @route POST /api/medicines
// @access Pharmaceutical
const addMedicine = async (req, res) => {
    try {
        const { name, genericName, category, unit, purchasePrice, sellingPrice, stock, minStockAlert, expiryDate, manufacturer } = req.body;
        const medicine = await Medicine.create({
            name, genericName, category, unit, purchasePrice, sellingPrice,
            stock: stock || 0, minStockAlert: minStockAlert || 10,
            expiryDate, manufacturer,
            branch: req.user.branch,
            addedBy: req.user._id
        });
        res.status(201).json(medicine);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get all medicines for a branch
// @route GET /api/medicines?search=&lowStock=&expired=
// @access Pharmaceutical, Admin
const getMedicines = async (req, res) => {
    try {
        const branchId = req.user.role === 'admin' ? req.query.branch : req.user.branch;
        const { search, lowStock, expired } = req.query;

        const filter = {};
        if (branchId) filter.branch = branchId;
        if (search) filter.name = { $regex: search, $options: 'i' };
        if (lowStock === 'true') {
            // Return medicines where stock <= minStockAlert
            filter.$expr = { $lte: ['$stock', '$minStockAlert'] };
        }
        if (expired === 'true') {
            filter.expiryDate = { $lte: new Date() };
        }

        const medicines = await Medicine.find(filter).sort({ name: 1 });
        res.json(medicines);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Search medicines by name (for sell page autocomplete)
// @route GET /api/medicines/search?q=
// @access Pharmaceutical
const searchMedicines = async (req, res) => {
    try {
        const { q = '' } = req.query;
        const branchId = req.user.branch;
        const medicines = await Medicine.find({
            branch: branchId,
            name: { $regex: q, $options: 'i' },
            stock: { $gt: 0 }
        }).select('name genericName sellingPrice stock unit category').limit(20);
        res.json(medicines);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Update medicine details
// @route PUT /api/medicines/:id
// @access Pharmaceutical, Admin
const updateMedicine = async (req, res) => {
    try {
        const medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!medicine) return res.status(404).json({ message: "Medicine not found" });
        res.json(medicine);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Add stock to existing medicine
// @route PUT /api/medicines/:id/add-stock
// @access Pharmaceutical
const addStock = async (req, res) => {
    try {
        const { quantity } = req.body;
        if (!quantity || quantity <= 0) return res.status(400).json({ message: "Quantity must be positive" });
        const medicine = await Medicine.findByIdAndUpdate(
            req.params.id,
            { $inc: { stock: quantity } },
            { new: true }
        );
        if (!medicine) return res.status(404).json({ message: "Medicine not found" });
        res.json(medicine);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Delete medicine
// @route DELETE /api/medicines/:id
// @access Pharmaceutical, Admin
const deleteMedicine = async (req, res) => {
    try {
        await Medicine.findByIdAndDelete(req.params.id);
        res.json({ message: "Medicine deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get stock dashboard summary
// @route GET /api/medicines/stock-summary
// @access Pharmaceutical
const getStockSummary = async (req, res) => {
    try {
        const branchId = req.user.branch;
        const today = new Date();
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

        const [total, lowStock, expiringSoon, outOfStock] = await Promise.all([
            Medicine.countDocuments({ branch: branchId }),
            Medicine.countDocuments({ branch: branchId, $expr: { $lte: ['$stock', '$minStockAlert'] } }),
            Medicine.countDocuments({ branch: branchId, expiryDate: { $gte: today, $lte: thirtyDaysLater } }),
            Medicine.countDocuments({ branch: branchId, stock: 0 })
        ]);

        res.json({ total, lowStock, expiringSoon, outOfStock });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { addMedicine, getMedicines, searchMedicines, updateMedicine, addStock, deleteMedicine, getStockSummary };
