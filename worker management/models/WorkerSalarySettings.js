const mongoose = require('mongoose');

const workerSalarySettingsSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    dailyWage: {
        type: Number,
        required: true,
        min: 0,
        default: 750
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model(
    'WorkerSalarySettings',
    workerSalarySettingsSchema
);