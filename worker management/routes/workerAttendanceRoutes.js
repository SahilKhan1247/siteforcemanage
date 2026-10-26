const express = require('express');
const router = express.Router();
const WorkerAttendance = require('../models/WorkerAttendance');
const Worker = require('../models/Worker');

// GET all attendance with filters
router.get('/', async (req, res) => {
    try {
        const { search, status, category, project, date } = req.query;
        let query = {};
        
        if (status) query.status = status;
        if (date) query.date = date;
        
        let attendances = await WorkerAttendance.find(query)
            .populate('workerId', 'name workerId category project phone')
            .sort({ date: -1, createdAt: -1 });

        if (search || category || project) {
            attendances = attendances.filter(att => {
                const worker = att.workerId;
                if (!worker) return false;
                
                const matchSearch = !search || 
                    worker.name?.toLowerCase().includes(search.toLowerCase()) ||
                    worker.workerId?.toLowerCase().includes(search.toLowerCase()) ||
                    worker.phone?.includes(search);
                
                const matchCategory = !category || worker.category === category;
                const matchProject = !project || worker.project === project;
                
                return matchSearch && matchCategory && matchProject;
            });
        }

        res.json(attendances);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET attendance stats
router.get('/stats', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const totalWorkers = await Worker.countDocuments();
        const presentToday = await WorkerAttendance.countDocuments({ date: today, status: 'Present' });
        const absentToday = await WorkerAttendance.countDocuments({ date: today, status: 'Absent' });
        const lateToday = await WorkerAttendance.countDocuments({ date: today, status: 'Late' });

        res.json({ totalWorkers, presentToday, absentToday, lateToday });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST - Mark attendance
router.post('/', async (req, res) => {
    try {
        const { workerId, date, checkIn, checkOut, status } = req.body;
        
        if (!workerId || !date || !checkIn || !status) {
            return res.status(400).json({ error: 'Worker ID, Date, Check In time and Status are required' });
        }
        
        const worker = await Worker.findById(workerId);
        if (!worker) {
            return res.status(404).json({ error: 'Worker not found' });
        }
        
        const existing = await WorkerAttendance.findOne({ workerId, date });
        if (existing) {
            return res.status(400).json({ error: `Attendance already marked for ${worker.name} on ${date}` });
        }
        
        // ✅ FIX: name save karo
        const attendance = new WorkerAttendance({
            workerId,
            name: worker.name,
            date,
            checkIn,
            checkOut: checkOut || null,
            status
        });
        
        await attendance.save();
        await attendance.populate('workerId', 'name workerId category project');
        
        res.status(201).json({
            message: 'Attendance marked successfully',
            attendance
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// GET - Single attendance
router.get('/:id', async (req, res) => {
    try {
        const attendance = await WorkerAttendance.findById(req.params.id).populate('workerId');
        if (!attendance) {
            return res.status(404).json({ error: 'Attendance record not found' });
        }
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT - Update attendance
router.put('/:id', async (req, res) => {
    try {
        const { workerId, date, checkIn, checkOut, status } = req.body;
        
        let updateData = { date, checkIn, checkOut, status };
        
        if (workerId) {
            const worker = await Worker.findById(workerId);
            if (!worker) {
                return res.status(404).json({ error: 'Worker not found' });
            }
            updateData.workerId = workerId;
            updateData.name = worker.name; // ✅ Update karte waqt bhi name change karo
        }

        const attendance = await WorkerAttendance.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('workerId');
        
        if (!attendance) {
            return res.status(404).json({ error: 'Attendance record not found' });
        }
        res.json({
            message: 'Attendance updated successfully',
            attendance
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE - Delete attendance
router.delete('/:id', async (req, res) => {
    try {
        const attendance = await WorkerAttendance.findByIdAndDelete(req.params.id);
        if (!attendance) {
            return res.status(404).json({ error: 'Attendance record not found' });
        }
        res.json({ message: 'Attendance deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;