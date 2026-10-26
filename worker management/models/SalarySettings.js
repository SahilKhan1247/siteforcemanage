const mongoose = require('mongoose');

const salarySettingsSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['Super Admin', 'Project Admin', 'Site Admin'],
        unique: true,
        required: true
    },
    dailyWage: {
        type: Number,
        required: true,
        min: 100
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('SalarySettings', salarySettingsSchema);