const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Worker = require('../models/Worker');
const Notification = require('../models/Notification');

// GET ALL WORKERS
router.get('/', async (req, res) => {
    try {
        const { search, category, project } = req.query;
        let query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { workerId: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        if (category) query.category = category;
        if (project) query.project = project;
        const workers = await Worker.find(query).sort({ createdAt: -1 });
        res.json(workers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

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
            read: n.readBy.length > 0
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// MARK ALL AS READ
router.put('/notifications/mark-all-read', async (req, res) => {
    try {
        await Notification.updateMany(
            { targetRole: 'Owner' },
            { $set: { readBy: [new mongoose.Types.ObjectId()] } }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// CLEAR ALL NOTIFICATIONS
router.delete('/notifications/clear', async (req, res) => {
    try {
        await Notification.deleteMany({ targetRole: 'Owner' });
        res.json({ message: 'All notifications cleared successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST - Add new worker
router.post('/', async (req, res) => {
    try {
        const { name, phone, email, project, category, status, addedBy } = req.body;
        if (!name || !phone || !project || !category) {
            return res.status(400).json({ error: 'Name, Phone, Project, and Category are required' });
        }
        const existingPhone = await Worker.findOne({ phone });
        if (existingPhone) {
            return res.status(400).json({ error: `Worker with phone ${phone} already exists` });
        }
        
        const worker = new Worker({
            name, phone, email: email || null, project, category, status: status || 'Active'
        });
        await worker.save();

        // ✅ EXACT NAME FROM FRONTEND
        const adminName = (addedBy && addedBy !== 'undefined' && addedBy.trim() !== '') ? addedBy : 'Admin';
        
        await Notification.create({
            message: `${adminName} added a new worker: ${worker.name} (${worker.workerId}) - ${worker.category}`,
            type: 'created',
            targetRole: 'Owner'
        });

        res.status(201).json(worker);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// GET - Single worker
router.get('/:id', async (req, res) => {
    try {
        const worker = await Worker.findById(req.params.id);
        if (!worker) return res.status(404).json({ error: 'Worker not found' });
        res.json(worker);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT - Update worker
router.put('/:id', async (req, res) => {
    try {
        const { name, phone, email, project, category, status, updatedBy } = req.body;
        const existingWorker = await Worker.findById(req.params.id);
        if (!existingWorker) return res.status(404).json({ error: 'Worker not found' });
        
        if (phone && phone !== existingWorker.phone) {
            const phoneExists = await Worker.findOne({ phone, _id: { $ne: req.params.id } });
            if (phoneExists) return res.status(400).json({ error: `Phone ${phone} already used by another worker` });
        }
        
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (phone !== undefined) updateData.phone = phone;
        if (email !== undefined) updateData.email = email || null;
        if (project !== undefined) updateData.project = project;
        if (category !== undefined) updateData.category = category;
        if (status !== undefined) updateData.status = status;

        const worker = await Worker.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });

        // ✅ EXACT NAME FROM FRONTEND
        const adminName = (updatedBy && updatedBy !== 'undefined' && updatedBy.trim() !== '') ? updatedBy : 'Admin';
        await Notification.create({
            message: `${adminName} updated worker: ${worker.name} (${worker.workerId})`,
            type: 'updated',
            targetRole: 'Owner'
        });

        res.json(worker);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE - Delete worker
router.delete('/:id', async (req, res) => {
    try {
        const worker = await Worker.findByIdAndDelete(req.params.id);
        if (!worker) return res.status(404).json({ error: 'Worker not found' });

        // ✅ EXACT NAME FROM FRONTEND
        const adminName = (req.query.deletedBy && req.query.deletedBy !== 'undefined' && req.query.deletedBy.trim() !== '') ? req.query.deletedBy : 'Admin';
        
        await Notification.create({
            message: `${adminName} deleted worker: ${worker.name} (${worker.workerId})`,
            type: 'deleted',
            targetRole: 'Owner'
        });

        res.json({ message: 'Worker deleted successfully', worker });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;