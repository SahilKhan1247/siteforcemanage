// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    message: { type: String, required: true },
    type: { type: String, default: 'updated' },
    targetRole: { type: String, required: true },
    read: { type: Boolean, default: false },   // ✅ YEH ZAROORI HAI
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);