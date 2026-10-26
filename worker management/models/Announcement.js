const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    createdBy: { type: String, default: 'Owner' }
}, { timestamps: true });
module.exports = mongoose.model('Announcement', schema);