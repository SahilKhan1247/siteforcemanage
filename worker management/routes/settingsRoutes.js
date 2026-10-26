const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Worker = require('../models/Worker');
const Project = require('../models/Project');
const AdminAttendance = require('../models/AdminAttendance');
const SalarySettings = require('../models/SalarySettings');

// GET database statistics
router.get('/stats', async (req, res) => {
    try {
        const [totalAdmins, totalWorkers, totalProjects, totalAttendance] = await Promise.all([
            Admin.countDocuments(),
            Worker.countDocuments(),
            Project.countDocuments(),
            AdminAttendance.countDocuments()
        ]);
        
        // Calculate approximate database size
        const dbSize = (totalAdmins * 0.5 + totalWorkers * 0.5 + totalProjects * 0.3 + totalAttendance * 0.2).toFixed(1);
        
        res.json({
            totalAdmins,
            totalWorkers,
            totalProjects,
            totalAttendance,
            dbSize: `${dbSize} MB`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET salary settings
router.get('/salary', async (req, res) => {
    try {
        const settings = await SalarySettings.find();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT salary settings
router.put('/salary', async (req, res) => {
    try {
        const { superAdminWage, projectAdminWage, siteAdminWage } = req.body;
        
        await SalarySettings.findOneAndUpdate(
            { role: 'Super Admin' },
            { dailyWage: superAdminWage },
            { upsert: true }
        );
        await SalarySettings.findOneAndUpdate(
            { role: 'Project Admin' },
            { dailyWage: projectAdminWage },
            { upsert: true }
        );
        await SalarySettings.findOneAndUpdate(
            { role: 'Site Admin' },
            { dailyWage: siteAdminWage },
            { upsert: true }
        );
        
        res.json({ message: 'Salary settings updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;