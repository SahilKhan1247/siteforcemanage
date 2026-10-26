const express = require('express');
const router = express.Router();
const AdminPayroll = require('../models/AdminPayroll');
const Admin = require('../models/Admin');
const SalarySettings = require('../models/SalarySettings');

// ============================================================
// ✅ GET all admin payroll with search, status, role, project filters
// ============================================================
router.get('/', async (req, res) => {
    try {
        const { search, status, role, project } = req.query;
        let filter = {};
        
        // Status filter
        if (status) filter.status = status;
        
        // First get all payroll data with populate
        let payrollData = await AdminPayroll.find(filter)
            .populate('adminId')
            .sort({ salaryDate: -1, createdAt: -1 });

        // Filter out null adminId
        payrollData = payrollData.filter(p => p.adminId !== null);

        // ✅ Apply search, role, project filters
        if (search || role || project) {
            payrollData = payrollData.filter(p => {
                const admin = p.adminId;
                if (!admin) return false;
                
                // Search filter - name, adminId, phone, email, project
                const matchSearch = !search || 
                    admin.name?.toLowerCase().includes(search.toLowerCase()) ||
                    admin.adminId?.toLowerCase().includes(search.toLowerCase()) ||
                    admin.phone?.includes(search) ||
                    admin.email?.toLowerCase().includes(search.toLowerCase()) ||
                    admin.project?.toLowerCase().includes(search.toLowerCase());
                
                // Role filter
                const matchRole = !role || admin.role === role;
                
                // Project filter
                const matchProject = !project || admin.project === project;
                
                return matchSearch && matchRole && matchProject;
            });
        }

        res.json(payrollData);
    } catch (error) {
        console.error('Error in GET /api/admin-payroll:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// GET salary settings
// ============================================================
router.get('/settings', async (req, res) => {
    try {
        let settings = await SalarySettings.find();
        if (settings.length === 0) {
            const defaultSettings = [
                { role: 'Super Admin', dailyWage: 2000 },
                { role: 'Project Admin', dailyWage: 1500 },
                { role: 'Site Admin', dailyWage: 1200 }
            ];
            settings = await SalarySettings.insertMany(defaultSettings);
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// UPDATE salary settings
// ============================================================
router.put('/settings', async (req, res) => {
    try {
        const { role, dailyWage } = req.body;
        if (!role || !dailyWage) {
            return res.status(400).json({ error: 'Role and daily wage are required' });
        }
        const setting = await SalarySettings.findOneAndUpdate(
            { role },
            { dailyWage, updatedAt: Date.now() },
            { new: true, upsert: true }
        );
        res.json({ message: `Salary for ${role} updated to ₹${dailyWage}/day`, setting });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// POST - Give Salary to individual admin
// ============================================================
router.post('/give-salary', async (req, res) => {
    try {
        const { adminId, date, presentDays, dailyWage, overtime, advance, netSalary, status, month, year } = req.body;
        
        if (!adminId || !date) {
            return res.status(400).json({ error: 'Admin ID and date are required' });
        }
        
        // Check if admin exists
        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }
        
        // Check if payroll already exists
        const existing = await AdminPayroll.findOne({ adminId, salaryDate: date });
        if (existing) {
            return res.status(400).json({ error: 'Payroll already exists for this admin on this date' });
        }
        
        const payroll = new AdminPayroll({
            adminId: admin._id,
            name: admin.name,
            adminId: admin.adminId || 'N/A',
            role: admin.role || 'Admin',
            project: admin.project || 'N/A',
            presentDays: presentDays || 26,
            dailyWage: dailyWage || 1500,
            overtime: overtime || 0,
            advance: advance || 0,
            netSalary: netSalary || (presentDays * dailyWage + overtime - advance),
            status: status || 'Paid',
            salaryDate: date,
            month: month || new Date(date).toLocaleString('default', { month: 'long' }),
            year: year || new Date(date).getFullYear()
        });
        
        await payroll.save();
        res.status(201).json({ message: 'Salary given successfully', name: admin.name });
        
    } catch (error) {
        console.error('Error in POST /api/admin-payroll/give-salary:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// POST - Generate payroll for all admins
// ============================================================
router.post('/generate', async (req, res) => {
    try {
        const { month, year } = req.body;
        if (!month || !year) {
            return res.status(400).json({ error: 'Month and year are required' });
        }
        
        const admins = await Admin.find();
        if (admins.length === 0) {
            return res.status(404).json({ error: 'No admins found. Please add admins first.' });
        }
        
        const settings = await SalarySettings.find();
        const wageMap = {};
        settings.forEach(s => wageMap[s.role] = s.dailyWage);
        
        const defaultWages = {
            'Super Admin': 2000,
            'Project Admin': 1500,
            'Site Admin': 1200
        };
        
        await AdminPayroll.deleteMany({ month, year });
        
        const payrollRecords = admins.map(admin => {
            const presentDays = Math.floor(Math.random() * 6) + 22;
            const dailyWage = wageMap[admin.role] || defaultWages[admin.role] || 1200;
            const overtime = Math.floor(Math.random() * 5000);
            const advance = Math.floor(Math.random() * 8000);
            const basicSalary = presentDays * dailyWage;
            const netSalary = basicSalary + overtime - advance;
            const statuses = ['Paid', 'Pending', 'Processing'];
            const status = statuses[Math.floor(Math.random() * 3)];
            
            return {
                adminId: admin._id,
                name: admin.name,
                adminId: admin.adminId || 'N/A',
                role: admin.role || 'Admin',
                project: admin.project || 'N/A',
                presentDays,
                dailyWage,
                overtime,
                advance,
                netSalary,
                status,
                month,
                year,
                salaryDate: new Date()
            };
        });
        
        const saved = await AdminPayroll.insertMany(payrollRecords);
        res.status(201).json({
            message: `Admin payroll generated for ${saved.length} admins`,
            count: saved.length
        });
        
    } catch (error) {
        console.error('Error in POST /api/admin-payroll/generate:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// GET - Single payroll by ID
// ============================================================
router.get('/:id', async (req, res) => {
    try {
        const payroll = await AdminPayroll.findById(req.params.id).populate('adminId');
        if (!payroll) {
            return res.status(404).json({ error: 'Admin payroll record not found' });
        }
        res.json(payroll);
    } catch (error) {
        console.error('Error in GET /api/admin-payroll/:id:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// PUT - Update payroll
// ============================================================
router.put('/:id', async (req, res) => {
    try {
        const { presentDays, dailyWage, overtime, advance, netSalary, status, salaryDate } = req.body;
        const payroll = await AdminPayroll.findByIdAndUpdate(
            req.params.id,
            { presentDays, dailyWage, overtime, advance, netSalary, status, salaryDate },
            { new: true }
        ).populate('adminId');
        if (!payroll) {
            return res.status(404).json({ error: 'Admin payroll record not found' });
        }
        res.json(payroll);
    } catch (error) {
        console.error('Error in PUT /api/admin-payroll/:id:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// DELETE - Delete payroll record
// ============================================================
router.delete('/:id', async (req, res) => {
    try {
        const payroll = await AdminPayroll.findByIdAndDelete(req.params.id);
        if (!payroll) {
            return res.status(404).json({ error: 'Admin payroll record not found' });
        }
        res.json({ message: 'Admin payroll record deleted successfully' });
    } catch (error) {
        console.error('Error in DELETE /api/admin-payroll/:id:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;