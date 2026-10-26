const mongoose = require('mongoose');

const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
];

const workerPayrollSchema = new mongoose.Schema({
    workerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Worker',
        required: true,
        index: true
    },

    name: {
        type: String,
        required: true,
        trim: true
    },

    workerIdNumber: {
        type: String,
        default: 'N/A'
    },

    category: {
        type: String,
        default: 'Worker'
    },

    project: {
        type: String,
        default: 'N/A'
    },

    presentDays: {
        type: Number,
        default: 0,
        min: 0,
        max: 31
    },

    dailyWage: {
        type: Number,
        default: 750,
        min: 0
    },

    overtime: {
        type: Number,
        default: 0,
        min: 0
    },

    advance: {
        type: Number,
        default: 0,
        min: 0
    },

    netSalary: {
        type: Number,
        default: 0
    },

    status: {
        type: String,
        enum: ['Paid', 'Pending', 'Processing'],
        default: 'Pending'
    },

    salaryDate: {
        type: Date,
        required: true,
        default: Date.now,
        index: true
    },

    month: {
        type: String,
        required: true,
        enum: MONTHS,
        index: true
    },

    year: {
        type: Number,
        required: true,
        index: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: false
});

workerPayrollSchema.index({
    salaryDate: -1
});

workerPayrollSchema.index({
    year: 1,
    month: 1
});

module.exports = mongoose.model(
    'WorkerPayroll',
    workerPayrollSchema
);