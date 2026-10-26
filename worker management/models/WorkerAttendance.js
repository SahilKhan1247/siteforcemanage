const mongoose = require('mongoose');

const workerAttendanceSchema = new mongoose.Schema({
    workerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Worker',
        required: true
    },
    name: {
        type: String,
        required: true // ✅ Ye add kiya gaya hai
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

// Ensure one attendance per worker per day
workerAttendanceSchema.index({ workerId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('WorkerAttendance', workerAttendanceSchema);