const mongoose = require('mongoose');

const adminAttendanceSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    name: {
        type: String,
        required: true // ✅ Ab name database mein save hoga
    },
    date: {
        type: String,
        required: true
    },
    checkIn: {
        type: String,
        required: true
    },
    checkOut: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Late', 'On Leave'],
        default: 'Present'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure one attendance per admin per day
adminAttendanceSchema.index({ adminId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('AdminAttendance', adminAttendanceSchema);