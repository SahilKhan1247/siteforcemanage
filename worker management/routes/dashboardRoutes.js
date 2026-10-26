const express = require('express');
const router = express.Router();

// Dashboard stats
router.get('/', async (req, res) => {
    try {
        res.json({
            message: 'Dashboard API working',
            totalProjects: 0,
            totalWorkers: 0,
            totalAdmins: 0,
            presentToday: 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;