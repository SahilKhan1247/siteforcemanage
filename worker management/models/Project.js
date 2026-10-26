const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    projectId: {
        type: String,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    client: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    completionDate: {
        type: Date,
        default: null
    },
    supervisor: {
        type: String,
        required: true
    },
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    budget: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['Residential', 'Commercial', 'Infrastructure', 'Warehouse & Logistics', 'Industrial', 'Others'],
        default: 'Others'
    },
    status: {
        type: String,
        enum: ['On Track', 'At Risk', 'Delayed', 'Completed'],
        default: 'On Track'
    },
    lastUpdatedBy: {
        type: String,
        default: 'System'
    },
    lastUpdatedRole: {
        type: String,
        enum: ['Owner', 'Admin', 'System'],
        default: 'System'
    },
    lastUpdatedAt: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Generate Project ID before saving
projectSchema.pre('save', async function(next) {
    if (!this.projectId) {
        try {
            const Project = mongoose.model('Project');
            const count = await Project.countDocuments();
            this.projectId = `PRJ-${String(count + 1).padStart(3, '0')}`;
        } catch (error) {
            console.error('Error generating project ID:', error);
        }
    }
    next();
});

module.exports = mongoose.model('Project', projectSchema);