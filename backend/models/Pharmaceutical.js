const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const pharmaceuticalSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is mandatory"],
        trim: true
    },
    employeeCode: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'pharmaceutical'
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: [true, "Branch assignment is mandatory"]
    },
    phone: {
        type: String,
        required: [true, "Phone is mandatory"],
        validate: {
            validator: function (v) { return /^\d{10}$/.test(v); },
            message: "Phone must be exactly 10 digits."
        }
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: [true, "Gender is mandatory"]
    },
    dateOfBirth: {
        type: Date
    },
    joiningDate: {
        type: Date
    },
    address: {
        type: String
    },
    profileImage: {
        type: String,
        default: ""
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

pharmaceuticalSchema.pre('save', async function () {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
});

module.exports = mongoose.model('Pharmaceutical', pharmaceuticalSchema);
