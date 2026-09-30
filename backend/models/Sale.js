const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
    medicine: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicine',
        required: true
    },
    medicineName: {
        type: String,
        required: true   // Snapshot at time of sale
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    unitPrice: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        required: true
    }
}, { _id: false });

const saleSchema = new mongoose.Schema({
    receiptNumber: {
        type: String,
        unique: true,
        required: true
    },
    // Optional: link to a patient if booked via receptionist
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        default: null
    },
    patientName: {
        type: String,
        default: "Walk-in Patient"
    },
    patientPhone: {
        type: String,
        default: ""
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    },
    items: [saleItemSchema],
    subtotal: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0
    },
    grandTotal: {
        type: Number,
        required: true
    },
    paymentMode: {
        type: String,
        enum: ['Cash', 'UPI', 'Card'],
        default: 'Cash'
    },
    soldBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pharmaceutical'
    },
    saleDate: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

saleSchema.index({ branch: 1, saleDate: -1 });

module.exports = mongoose.model('Sale', saleSchema);
