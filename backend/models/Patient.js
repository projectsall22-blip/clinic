const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Patient name is mandatory"],
        trim: true
    },
    age: {
        type: Number,
        required: [true, "Age is mandatory"],
        min: 0,
        max: 150
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: [true, "Gender is mandatory"]
    },
    phone: {
        type: String,
        default: "",
        validate: {
            validator: function (v) { return !v || /^\d{10}$/.test(v); },
            message: "Phone must be 10 digits."
        }
    },
    address: {
        type: String,
        default: ""
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    },
    registeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Receptionist'
    }
}, { timestamps: true });

// Index for fast search by phone or branch
patientSchema.index({ branch: 1, createdAt: -1 });
patientSchema.index({ phone: 1 });

module.exports = mongoose.model('Patient', patientSchema);
