const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Notification = require('../models/Notification');

// ============================================================
// GET all admins with filters
// ============================================================
router.get('/', async (req, res) => {
    try {
        const { search, role, project } = req.query;
        let query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { adminId: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        if (role) query.role = role;
        if (project) query.project = project;
        
        const admins = await Admin.find(query).sort({ createdAt: -1 });
        res.json(admins);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// ✅ NOTIFICATION ROUTES — MUST BE BEFORE `/:id` ROUTES
// ============================================================

// GET NOTIFICATIONS
router.get('/notifications', async (req, res) => {
    try {
        const notifications = await Notification.find({ targetRole: 'Owner' })
            .sort({ createdAt: -1 })
            .limit(20);

        const formatted = notifications.map(n => ({
            _id: n._id,
            message: n.message,
            type: n.type,
            timestamp: n.createdAt,
            read: n.read === true          // ✅ Boolean field check
        }));

        res.json(formatted);
    } catch (error) {
        console.error('GET notifications error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ✅ MARK ALL AS READ — update `read: true`
router.put('/notifications/mark-all-read', async (req, res) => {
    try {
        const result = await Notification.updateMany(
            { targetRole: 'Owner' },
            { $set: { read: true } }
        );
        console.log(`✅ Marked ${result.modifiedCount} notifications as read`);
        res.json({ message: 'All notifications marked as read', modified: result.modifiedCount });
    } catch (error) {
        console.error('mark-all-read error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ✅ CLEAR ALL NOTIFICATIONS
router.delete('/notifications/clear', async (req, res) => {
    try {
        await Notification.deleteMany({ targetRole: 'Owner' });
        res.json({ message: 'All notifications cleared successfully' });
    } catch (error) {
        console.error('clear notifications error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ✅ MARK SINGLE NOTIFICATION AS READ
router.put('/notifications/:id/read', async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(
            req.params.id,
            { $set: { read: true } }
        );
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('mark single read error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// ⚠️ ADMIN CRUD ROUTES — MUST BE AFTER NOTIFICATIONS
// ============================================================

// POST - Add new admin
router.post('/', async (req, res) => {
    try {
        const existingAdmin = await Admin.findOne({ email: req.body.email });
        if (existingAdmin) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        const admin = new Admin(req.body);
        await admin.save();
        res.status(201).json(admin);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// GET - Get single admin
router.get('/:id', async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.id);
        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }
        res.json(admin);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT - Update admin
router.put('/:id', async (req, res) => {
    try {
        if (req.body.email) {
            const existingAdmin = await Admin.findOne({ 
                email: req.body.email,
                _id: { $ne: req.params.id }
            });
            if (existingAdmin) {
                return res.status(400).json({ error: 'Email already exists' });
            }
        }
        const admin = await Admin.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }
        res.json(admin);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE - Delete admin
router.delete('/:id', async (req, res) => {
    try {
        const admin = await Admin.findByIdAndDelete(req.params.id);
        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }
        res.json({ message: 'Admin deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;