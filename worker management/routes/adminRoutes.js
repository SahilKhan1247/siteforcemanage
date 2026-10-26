const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Notification = require('../models/Notification');

// ============================================================
// GET all admins
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
// ✅ NOTIFICATION ROUTES — MUST BE BEFORE /:id
// ============================================================

// ✅ GET NOTIFICATIONS — role-based (?role=Owner or ?role=Admin)
router.get('/notifications', async (req, res) => {
    try {
        const role = req.query.role || 'Owner';   // default Owner
        
        const notifications = await Notification.find({ targetRole: role })
            .sort({ createdAt: -1 })
            .limit(20);

        const formatted = notifications.map(n => ({
            _id: n._id,
            message: n.message,
            type: n.type,
            timestamp: n.createdAt,
            read: n.read === true
        }));

        res.json(formatted);
    } catch (error) {
        console.error('GET notifications error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ✅ MARK ALL AS READ — role-based
router.put('/notifications/mark-all-read', async (req, res) => {
    try {
        const role = req.query.role || 'Owner';
        const result = await Notification.updateMany(
            { targetRole: role },
            { $set: { read: true } }
        );
        res.json({ message: 'All notifications marked as read', modified: result.modifiedCount, role });
    } catch (error) {
        console.error('mark-all-read error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ✅ CLEAR ALL NOTIFICATIONS — role-based
router.delete('/notifications/clear', async (req, res) => {
    try {
        const role = req.query.role || 'Owner';
        const result = await Notification.deleteMany({ targetRole: role });
        res.json({ message: 'All notifications cleared', deleted: result.deletedCount, role });
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
// ⚠️ ADMIN CRUD — MUST BE AFTER notifications
// ============================================================
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

router.get('/:id', async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.id);
        if (!admin) return res.status(404).json({ error: 'Admin not found' });
        res.json(admin);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        if (req.body.email) {
            const existingAdmin = await Admin.findOne({ 
                email: req.body.email,
                _id: { $ne: req.params.id }
            });
            if (existingAdmin) return res.status(400).json({ error: 'Email already exists' });
        }
        const admin = await Admin.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!admin) return res.status(404).json({ error: 'Admin not found' });
        res.json(admin);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const admin = await Admin.findByIdAndDelete(req.params.id);
        if (!admin) return res.status(404).json({ error: 'Admin not found' });
        res.json({ message: 'Admin deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;