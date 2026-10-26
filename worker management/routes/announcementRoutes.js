const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');

// ✅ Get announcements (Owner sees all, Admin sees only for them)
router.get('/', async (req, res) => {
    try {
        const role = req.query.role;
        let filter = {};
        if (role === 'Owner') {
            filter = { createdBy: { $exists: true } }; // all announcements by owner
        }
        const list = await Announcement.find(filter).sort({ createdAt: -1 }).limit(50);
        res.json(list);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ Create announcement
router.post('/', async (req, res) => {
    try {
        const { title, message, createdBy } = req.body;
        if (!title || !message) {
            return res.status(400).json({ error: 'Title and message required' });
        }
        const ann = await Announcement.create({ title, message, createdBy });
        // optionally also create Notification entry
        res.status(201).json(ann);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;