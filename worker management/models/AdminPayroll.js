const mongoose = require('mongoose');

const adminPayrollSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    name: { type: String, required: true },
    adminId: { type: String, default: 'N/A' },
    role: { type: String, default: 'Admin' },
    project: { type: String, default: 'N/A' },
    presentDays: { type: Number, default: 0 },
    dailyWage: { type: Number, default: 1200 },
    overtime: { type: Number, default: 0 },
    advance: { type: Number, default: 0 },
    netSalary: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['Paid', 'Pending', 'Processing'],
        default: 'Pending'
    },
    salaryDate: { type: Date, default: Date.now },
    month: { type: String, required: true },
    year: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

adminPayrollSchema.index({ adminId: 1, salaryDate: 1 }, { unique: true });

module.exports = mongoose.model('AdminPayroll', adminPayrollSchema);