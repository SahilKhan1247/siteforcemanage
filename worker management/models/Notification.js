const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    message: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['created', 'updated', 'deleted', 'status_changed', 'announcement'], 
        default: 'updated' 
    },
    targetRole: { 
        type: String, 
        enum: ['Owner', 'Admin'], 
        default: 'Admin' 
    },
    read: { type: Boolean, default: false }, // ✅ single boolean (as used in your routes)
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);