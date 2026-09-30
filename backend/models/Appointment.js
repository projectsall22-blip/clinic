const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    },
    doctorName: {
        type: String,
        required: [true, "Doctor name is mandatory"]
    },
    doctorDegree: {
        type: String,
        default: ""
    },
    appointmentDate: {
        type: Date,
        required: [true, "Appointment date is mandatory"]
    },
    tokenNumber: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    chiefComplaint: {
        type: String,
        default: ""
    },
    prescription: {
        type: String,
        default: ""
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Receptionist'
    }
}, { timestamps: true });

// Compound index: branch + date for fast daily queries
appointmentSchema.index({ branch: 1, appointmentDate: -1 });
appointmentSchema.index({ branch: 1, appointmentDate: 1, tokenNumber: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
