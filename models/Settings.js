const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
    siteName: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Settings', SettingsSchema);
