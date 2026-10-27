const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');

// ✅ POST: Create Announcement & Push Notification to Admin
router.post('/', async (req, res) => {
    try {
        const { title, message, createdBy } = req.body;
        if (!title || !message) {
            return res.status(400).json({ error: 'Title and message required' });
        }

        // 1. Save announcement (Owner history ke liye)
        const ann = await Announcement.create({ title, message, createdBy });

        // 2. ✅ Create Notification entry for Admin (DropDown me dikhne ke liye)
        await Notification.create({
            message: `📢 ${title} — ${message}`,
            type: 'announcement',
            targetRole: 'Admin',
            read: false
        });

        res.status(201).json({ message: 'Announcement sent successfully!', announcement: ann });
    } catch (err) {
        console.error('Announcement error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ GET: Owner ki announcements history
router.get('/', async (req, res) => {
    try {
        const list = await Announcement.find().sort({ createdAt: -1 }).limit(50);
        res.json(list);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;