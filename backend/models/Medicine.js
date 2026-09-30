const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Medicine name is mandatory"],
        trim: true
    },
    genericName: {
        type: String,
        default: ""
    },
    category: {
        type: String,
        enum: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Powder', 'Other'],
        default: 'Tablet'
    },
    unit: {
        type: String,
        default: "Strip"   // Strip / Bottle / Vial / Tube etc.
    },
    purchasePrice: {
        type: Number,
        required: [true, "Purchase price is mandatory"],
        min: 0
    },
    sellingPrice: {
        type: Number,
        required: [true, "Selling price is mandatory"],
        min: 0
    },
    stock: {
        type: Number,
        required: [true, "Stock quantity is mandatory"],
        min: 0,
        default: 0
    },
    minStockAlert: {
        type: Number,
        default: 10   // Alert when stock falls below this
    },
    expiryDate: {
        type: Date
    },
    manufacturer: {
        type: String,
        default: ""
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pharmaceutical'
    }
}, { timestamps: true });

medicineSchema.index({ branch: 1 });
medicineSchema.index({ branch: 1, name: 1 });

module.exports = mongoose.model('Medicine', medicineSchema);
