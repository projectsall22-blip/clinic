const bcrypt         = require('bcryptjs');
const Admin          = require('../models/Admin');
const Receptionist   = require('../models/Receptionist');
const Pharmaceutical = require('../models/Pharmaceutical');
const cloudinary     = require('../config/cloudinary');

// ─── Helper: resolve model from role ────────────────────────────────────────
const getModel = (role) => {
    if (role === 'admin')          return Admin;
    if (role === 'receptionist')   return Receptionist;
    if (role === 'pharmaceutical') return Pharmaceutical;
    return null;
};

// @desc  Change password
// @route PUT /api/users/change-password
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const Model = getModel(req.user.role);
        if (!Model) return res.status(400).json({ message: "Invalid role" });

        const user = await Model.findById(req.user._id);
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });

        user.password = newPassword;
        await user.save();
        res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc  Update profile picture (Cloudinary)
// @route PUT /api/users/profile-picture
const updateProfilePicture = async (req, res) => {
    try {
        const { image } = req.body;
        if (!image) return res.status(400).json({ message: "No image data provided" });

        const Model = getModel(req.user.role);
        if (!Model) return res.status(400).json({ message: "Invalid role" });

        const uploadResult = await cloudinary.uploader.upload(image, {
            folder: 'new_life_clinic/profiles',
            transformation: [
                { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                { quality: 'auto', fetch_format: 'auto' }
            ],
            public_id: `${req.user.role}_${req.user._id}`,
            overwrite: true
        });

        const updatedUser = await Model.findByIdAndUpdate(
            req.user._id,
            { profileImage: uploadResult.secure_url },
            { new: true }
        ).select('-password');

        res.status(200).json({
            message: "Profile picture updated successfully",
            profileImage: updatedUser.profileImage
        });
    } catch (error) {
        res.status(500).json({ message: "Upload failed", error: error.message });
    }
};

// @desc  Update basic user info
// @route PUT /api/users/update-info
const updateUserInfo = async (req, res) => {
    try {
        const { name, email, phone } = req.body;
        const Model = getModel(req.user.role);
        if (!Model) return res.status(400).json({ message: "Invalid role" });

        const updatedUser = await Model.findByIdAndUpdate(
            req.user._id,
            { $set: { name, email, phone } },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) return res.status(404).json({ message: "User not found" });

        res.status(200).json({ message: "Information updated successfully", user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { changePassword, updateProfilePicture, updateUserInfo };
