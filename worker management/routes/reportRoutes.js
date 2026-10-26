const express = require('express');
const router = express.Router();
const Worker = require('../models/Worker');
const Admin = require('../models/Admin');
const AdminAttendance = require('../models/AdminAttendance');
const Project = require('../models/Project');

// GET all report data
router.get('/all', async (req, res) => {
    try {
        const [workers, admins, attendance, projects] = await Promise.all([
            Worker.find(),
            Admin.find(),
            AdminAttendance.find().populate('adminId'),
            Project.find()
        ]);

        res.json({
            workers,
            admins,
            attendance,
            projects
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET attendance stats
router.get('/attendance-stats', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);

        const totalWorkers = await Worker.countDocuments();
        const totalAdmins = await Admin.countDocuments();

        // Today's attendance
        const todayAttendance = await AdminAttendance.find({ date: today });
        const presentToday = todayAttendance.filter(a => a.status === 'Present').length;

        // Weekly attendance
        const weeklyAttendance = await AdminAttendance.find({
            date: { $gte: weekAgo.toISOString().split('T')[0] }
        });
        const weeklyPresent = weeklyAttendance.filter(a => a.status === 'Present').length;

        // Monthly attendance
        const monthlyAttendance = await AdminAttendance.find({
            date: { $gte: monthAgo.toISOString().split('T')[0] }
        });
        const monthlyPresent = monthlyAttendance.filter(a => a.status === 'Present').length;

        // Category distribution
        const categoryDist = await Worker.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        res.json({
            totalWorkers,
            totalAdmins,
            today: {
                total: todayAttendance.length,
                present: presentToday,
                absent: todayAttendance.length - presentToday
            },
            weekly: {
                total: weeklyAttendance.length,
                present: weeklyPresent,
                rate: weeklyAttendance.length ? Math.round((weeklyPresent / weeklyAttendance.length) * 100) : 0
            },
            monthly: {
                total: monthlyAttendance.length,
                present: monthlyPresent,
                rate: monthlyAttendance.length ? Math.round((monthlyPresent / monthlyAttendance.length) * 100) : 0
            },
            categories: categoryDist
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET project-wise attendance
router.get('/project-attendance', async (req, res) => {
    try {
        const projects = await Project.find();
        const attendance = await AdminAttendance.find().populate('adminId');

        const projectData = projects.map(project => {
            const projectAttendance = attendance.filter(a => 
                a.adminId && a.adminId.project === project.name
            );
            const total = projectAttendance.length || 1;
            const present = projectAttendance.filter(a => a.status === 'Present').length;
            const rate = Math.round((present / total) * 100);
            return {
                name: project.name,
                total: projectAttendance.length,
                present: present,
                rate: rate
            };
        });

        res.json(projectData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;