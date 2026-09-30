const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Branch name is mandatory"],
        trim: true
    },
    address: {
        type: String,
        required: [true, "Branch address is mandatory"]
    },
    phone: {
        type: String,
        required: [true, "Branch phone is mandatory"]
    },
    doctorName: {
        type: String,
        required: [true, "Doctor name is mandatory"]
    },
    doctorDegree: {
        type: String,
        default: ""
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Branch', branchSchema);
