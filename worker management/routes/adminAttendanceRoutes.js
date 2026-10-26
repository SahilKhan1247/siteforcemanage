const express = require('express');
const router = express.Router();
const AdminAttendance = require('../models/AdminAttendance');
const Admin = require('../models/Admin');

// GET all admin attendance with filters
router.get('/', async (req, res) => {
    try {
        const { search, status, role, project, date } = req.query;
        let query = {};
        
        if (status) query.status = status;
        if (date) query.date = date;
        
        // ✅ Ab populate ke saath name bhi direct model se aayega
        let attendances = await AdminAttendance.find(query)
            .populate('adminId', 'name adminId role project email phone')
            .sort({ date: -1, createdAt: -1 });

        attendances = attendances.filter(att => att.adminId !== null);

        if (search || role || project) {
            attendances = attendances.filter(att => {
                const admin = att.adminId;
                if (!admin) return false;
                
                const matchSearch = !search || 
                    admin.name?.toLowerCase().includes(search.toLowerCase()) ||
                    admin.adminId?.toLowerCase().includes(search.toLowerCase()) ||
                    admin.phone?.includes(search) ||
                    admin.email?.toLowerCase().includes(search.toLowerCase());
                
                const matchRole = !role || admin.role === role;
                const matchProject = !project || admin.project === project;
                
                return matchSearch && matchRole && matchProject;
            });
        }

        res.json(attendances);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET admin attendance stats
router.get('/stats', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const totalAdmins = await Admin.countDocuments();
        
        const todayAttendances = await AdminAttendance.find({ date: today }).populate('adminId');
        const validAttendances = todayAttendances.filter(att => att.adminId !== null);
        
        const presentToday = validAttendances.filter(att => att.status === 'Present').length;
        const absentToday = validAttendances.filter(att => att.status === 'Absent').length;
        const lateToday = validAttendances.filter(att => att.status === 'Late').length;

        res.json({ totalAdmins, presentToday, absentToday, lateToday });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST - Mark admin attendance
router.post('/', async (req, res) => {
    try {
        const { adminId, date, checkIn, checkOut, status } = req.body;
        
        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }
        
        const existing = await AdminAttendance.findOne({ adminId, date });
        if (existing) {
            return res.status(400).json({ error: 'Attendance already marked for this admin on this date' });
        }
        
        // ✅ FIX: name ko database mein save karo
        const attendance = new AdminAttendance({
            adminId,
            name: admin.name, 
            date,
            checkIn,
            checkOut,
            status
        });
        
        await attendance.save();
        await attendance.populate('adminId', 'name adminId role project');
        res.status(201).json(attendance);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// GET - Single admin attendance
router.get('/:id', async (req, res) => {
    try {
        const attendance = await AdminAttendance.findById(req.params.id).populate('adminId');
        if (!attendance) {
            return res.status(404).json({ error: 'Admin attendance record not found' });
        }
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT - Update admin attendance
router.put('/:id', async (req, res) => {
    try {
        const { adminId, date, checkIn, checkOut, status } = req.body;
        
        let updateData = { date, checkIn, checkOut, status };
        
        if (adminId) {
            const admin = await Admin.findById(adminId);
            if (!admin) {
                return res.status(404).json({ error: 'Admin not found' });
            }
            updateData.adminId = adminId;
            updateData.name = admin.name; // ✅ Update karte waqt bhi name change karo
        }
        
        const attendance = await AdminAttendance.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('adminId');
        
        if (!attendance) {
            return res.status(404).json({ error: 'Admin attendance record not found' });
        }
        res.json(attendance);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE - Delete admin attendance
router.delete('/:id', async (req, res) => {
    try {
        const attendance = await AdminAttendance.findByIdAndDelete(req.params.id);
        if (!attendance) {
            return res.status(404).json({ error: 'Admin attendance record not found' });
        }
        res.json({ message: 'Admin attendance deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;