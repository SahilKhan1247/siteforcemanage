const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    adminId: { 
        type: String, 
        unique: true 
    },
    name: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true 
    },
    phone: { 
        type: String, 
        required: true 
    },
    project: { 
        type: String, 
        required: true 
    },
    role: { 
        type: String, 
        required: true,
        enum: ['Super Admin', 'Project Admin', 'Site Admin']
    },
    status: { 
        type: String, 
        default: 'Active',
        enum: ['Active', 'On Leave', 'Inactive']
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Generate Admin ID before saving
adminSchema.pre('save', async function(next) {
    if (!this.adminId) {
        const Admin = mongoose.model('Admin');
        const count = await Admin.countDocuments();
        this.adminId = `AD-${String(count + 1001).padStart(4, '0')}`;
    }
    next();
});

module.exports = mongoose.model('Admin', adminSchema);