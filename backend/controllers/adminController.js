const bcrypt   = require('bcryptjs');
const Settings = require('../models/Settings');

// @desc  Get global settings
// @route GET /api/admin/settings
const getSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) settings = await Settings.create({});
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc  Update global settings
// @route PUT /api/admin/settings
const updateSettings = async (req, res) => {
    try {
        const settings = await Settings.findOneAndUpdate(
            {},
            { $set: req.body },
            { new: true, upsert: true }
        );
        res.status(200).json({ message: "Settings updated successfully", settings });
    } catch (error) {
        res.status(500).json({ message: "Update failed" });
    }
};

module.exports = { getSettings, updateSettings };
