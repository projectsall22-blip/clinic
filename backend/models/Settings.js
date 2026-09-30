const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    schoolName: { type: String, default: "New Life Clinic" },
    schoolSlogan: { type: String, default: "Your Health, Our Priority" }, // NEW
    schoolAddress: { type: String, default: "Enter School Address" },   // NEW
    contactNumber: { type: String, default: "0000000000" },
    schoolLogo: { type: String, default: "" },                           // NEW (Base64)
    currentAcademicYear: { type: String, default: "2025-26" },
    isRegistrationOpen: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
