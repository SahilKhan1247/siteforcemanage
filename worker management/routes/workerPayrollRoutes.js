const express = require('express');
const router = express.Router();

const WorkerPayroll = require('../models/WorkerPayroll');
const Worker = require('../models/Worker');
const WorkerSalarySettings = require('../models/WorkerSalarySettings');

const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
];

// Convert YYYY-MM-DD to a local calendar date.
// This avoids interpreting an HTML date input as a UTC date.
function parseSalaryDate(value) {
    if (typeof value !== 'string') {
        return null;
    }

    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!match) {
        return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    const date = new Date(year, month - 1, day);

    if (
        month < 1 ||
        month > 12 ||
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }

    return date;
}

// Derive month and year from the actual salary date.
function getMonthYear(date) {
    return {
        month: MONTHS[date.getMonth()],
        year: date.getFullYear()
    };
}

// Calculate net salary.
function calculateNetSalary(presentDays, dailyWage, overtime, advance) {
    return (presentDays * dailyWage) + overtime - advance;
}

// Validate salary numbers.
function validSalaryNumbers(days, wage, overtime, advance) {
    return (
        [days, wage, overtime, advance].every(Number.isFinite) &&
        days >= 0 &&
        days <= 31 &&
        wage >= 0 &&
        overtime >= 0 &&
        advance >= 0
    );
}

// --------------------------------------------------
// GET CATEGORY SALARY SETTINGS
// GET /api/worker-payroll/settings
// --------------------------------------------------
router.get('/settings', async (req, res) => {
    try {
        let settings = await WorkerSalarySettings
            .find()
            .sort({ category: 1 });

        if (settings.length === 0) {
            const defaultSettings = [
                { category: 'Mason', dailyWage: 750 },
                { category: 'Electrician', dailyWage: 900 },
                { category: 'Welder', dailyWage: 820 },
                { category: 'Foreman', dailyWage: 1100 },
                { category: 'Carpenter', dailyWage: 780 },
                { category: 'Site Engineer', dailyWage: 1400 },
                { category: 'Plumber', dailyWage: 800 },
                { category: 'Painter', dailyWage: 700 },
                { category: 'Driver', dailyWage: 650 }
            ];

            await WorkerSalarySettings.insertMany(defaultSettings);

            settings = await WorkerSalarySettings
                .find()
                .sort({ category: 1 });
        }

        res.json(settings);
    } catch (error) {
        console.error('Get salary settings error:', error);

        res.status(500).json({
            error: 'Unable to load salary settings.'
        });
    }
});

// --------------------------------------------------
// UPDATE CATEGORY DAILY WAGE
// PUT /api/worker-payroll/settings
// --------------------------------------------------
router.put('/settings', async (req, res) => {
    try {
        const category = String(req.body.category || '').trim();
        const dailyWage = Number(req.body.dailyWage);

        if (
            !category ||
            !Number.isFinite(dailyWage) ||
            dailyWage <= 0
        ) {
            return res.status(400).json({
                error: 'Please provide a valid category and daily wage.'
            });
        }

        const setting = await WorkerSalarySettings.findOneAndUpdate(
            { category },
            {
                $set: {
                    dailyWage,
                    updatedAt: new Date()
                }
            },
            {
                new: true,
                upsert: true,
                runValidators: true
            }
        );

        res.json({
            message: `Salary for ${category} updated successfully.`,
            setting
        });
    } catch (error) {
        console.error('Update salary settings error:', error);

        res.status(500).json({
            error: error.message
        });
    }
});

// --------------------------------------------------
// GET PAYROLL WITH MONTH/YEAR FILTERING
// GET /api/worker-payroll?month=October&year=2026
// --------------------------------------------------
router.get('/', async (req, res) => {
    try {
        const {
            search = '',
            status = '',
            category = '',
            project = '',
            month = '',
            year = ''
        } = req.query;

        const filter = {};

        // Find month index without case sensitivity.
        const monthIndex = month
            ? MONTHS.findIndex(
                item => item.toLowerCase() ===
                    String(month).toLowerCase()
            )
            : -1;

        if (month && monthIndex === -1) {
            return res.status(400).json({
                error: 'Invalid month.'
            });
        }

        if (
            year &&
            (
                !/^\d{4}$/.test(String(year)) ||
                Number(year) < 1900 ||
                Number(year) > 2200
            )
        ) {
            return res.status(400).json({
                error: 'Invalid year.'
            });
        }

        // Exact month and year:
        // Example October 2026 means
        // 1 October 2026 <= salaryDate < 1 November 2026.
        if (year && month) {
            const selectedYear = Number(year);

            const startDate = new Date(
                selectedYear,
                monthIndex,
                1
            );

            const endDate = new Date(
                selectedYear,
                monthIndex + 1,
                1
            );

            filter.salaryDate = {
                $gte: startDate,
                $lt: endDate
            };
        } else if (year) {
            // All months within the selected year.
            const selectedYear = Number(year);

            filter.salaryDate = {
                $gte: new Date(selectedYear, 0, 1),
                $lt: new Date(selectedYear + 1, 0, 1)
            };
        } else if (month) {
            // If no year is selected, find this month across all years.
            filter.$expr = {
                $eq: [
                    { $month: '$salaryDate' },
                    monthIndex + 1
                ]
            };
        }

        if (status) {
            filter.status = status;
        }

        // Fetch records using the actual salaryDate.
        let records = await WorkerPayroll
            .find(filter)
            .populate('workerId')
            .sort({
                salaryDate: -1,
                createdAt: -1
            });

        // Apply search, category and project filters.
        const searchText = String(search).trim().toLowerCase();

        records = records.filter(record => {
            const worker = record.workerId || {};

            const workerName = String(
                record.name || worker.name || ''
            ).toLowerCase();

            const workerNumber = String(
                record.workerIdNumber || worker.workerId || ''
            ).toLowerCase();

            const workerPhone = String(
                worker.phone || ''
            ).toLowerCase();

            const recordId = String(
                record._id || ''
            ).toLowerCase();

            const matchesSearch =
                !searchText ||
                workerName.includes(searchText) ||
                workerNumber.includes(searchText) ||
                workerPhone.includes(searchText) ||
                recordId.includes(searchText);

            const matchesCategory =
                !category ||
                record.category === category ||
                worker.category === category;

            const matchesProject =
                !project ||
                record.project === project ||
                worker.project === project;

            return (
                matchesSearch &&
                matchesCategory &&
                matchesProject
            );
        });

        res.json(records);
    } catch (error) {
        console.error('Get payroll error:', error);

        res.status(500).json({
            error: 'Unable to load payroll records.'
        });
    }
});

// --------------------------------------------------
// GIVE SALARY
// POST /api/worker-payroll/give-salary
// --------------------------------------------------
router.post('/give-salary', async (req, res) => {
    try {
        const {
            workerId,
            date,
            presentDays,
            dailyWage,
            overtime,
            advance,
            status
        } = req.body;

        if (!workerId || !date) {
            return res.status(400).json({
                error: 'Worker and salary date are required.'
            });
        }

        const salaryDate = parseSalaryDate(date);

        if (!salaryDate) {
            return res.status(400).json({
                error: 'Invalid salary date. Use YYYY-MM-DD.'
            });
        }

        const worker = await Worker.findById(workerId);

        if (!worker) {
            return res.status(404).json({
                error: 'Worker not found.'
            });
        }

        const days = Number(presentDays ?? 26);
        const wage = Number(dailyWage ?? 750);
        const extra = Number(overtime ?? 0);
        const deduction = Number(advance ?? 0);

        if (!validSalaryNumbers(days, wage, extra, deduction)) {
            return res.status(400).json({
                error: 'Please enter valid salary amounts and present days.'
            });
        }

        // Month and year are always derived from the chosen date.
        const { month, year } = getMonthYear(salaryDate);

        const payroll = await WorkerPayroll.create({
            workerId: worker._id,
            name: worker.name,
            workerIdNumber: worker.workerId || 'N/A',
            category: worker.category || 'Worker',
            project: worker.project || 'N/A',

            presentDays: days,
            dailyWage: wage,
            overtime: extra,
            advance: deduction,

            netSalary: calculateNetSalary(
                days,
                wage,
                extra,
                deduction
            ),

            status: ['Paid', 'Pending', 'Processing'].includes(status)
                ? status
                : 'Pending',

            salaryDate,
            month,
            year
        });

        res.status(201).json({
            message: 'Salary saved successfully.',
            name: worker.name,
            payroll
        });
    } catch (error) {
        console.error('Give salary error:', error);

        res.status(500).json({
            error: error.message
        });
    }
});

// --------------------------------------------------
// GENERATE PAYROLL FOR A MONTH
// POST /api/worker-payroll/generate
// --------------------------------------------------
router.post('/generate', async (req, res) => {
    try {
        const month = String(req.body.month || '');
        const year = Number(req.body.year);

        const monthIndex = MONTHS.indexOf(month);

        if (
            monthIndex < 0 ||
            !Number.isInteger(year) ||
            year < 1900 ||
            year > 2200
        ) {
            return res.status(400).json({
                error: 'Please select a valid month and year.'
            });
        }

        const workers = await Worker.find();

        if (workers.length === 0) {
            return res.status(404).json({
                error: 'No workers found.'
            });
        }

        const settings = await WorkerSalarySettings.find();

        const wageMap = Object.fromEntries(
            settings.map(setting => [
                setting.category,
                setting.dailyWage
            ])
        );

        const startDate = new Date(year, monthIndex, 1);
        const endDate = new Date(year, monthIndex + 1, 1);

        // Do not delete or overwrite existing salary records.
        // A worker with a payroll entry in this month is skipped.
        const existingRecords = await WorkerPayroll.find({
            salaryDate: {
                $gte: startDate,
                $lt: endDate
            }
        }).select('workerId');

        const existingWorkerIds = new Set(
            existingRecords.map(record =>
                String(record.workerId)
            )
        );

        const newRecords = workers
            .filter(worker =>
                !existingWorkerIds.has(String(worker._id))
            )
            .map(worker => {
                const presentDays = 26;
                const dailyWage = Number(
                    wageMap[worker.category] || 750
                );
                const overtime = 0;
                const advance = 0;

                return {
                    workerId: worker._id,
                    name: worker.name,
                    workerIdNumber: worker.workerId || 'N/A',
                    category: worker.category || 'Worker',
                    project: worker.project || 'N/A',

                    presentDays,
                    dailyWage,
                    overtime,
                    advance,

                    netSalary: calculateNetSalary(
                        presentDays,
                        dailyWage,
                        overtime,
                        advance
                    ),

                    status: 'Pending',

                    salaryDate: startDate,
                    month,
                    year
                };
            });

        if (newRecords.length > 0) {
            await WorkerPayroll.insertMany(newRecords);
        }

        res.status(201).json({
            message:
                `Payroll for ${month} ${year} generated. ` +
                `${newRecords.length} new records added; ` +
                `${workers.length - newRecords.length} existing records skipped.`,
            count: newRecords.length
        });
    } catch (error) {
        console.error('Generate payroll error:', error);

        res.status(500).json({
            error: error.message
        });
    }
});

// --------------------------------------------------
// GET ONE PAYROLL RECORD
// GET /api/worker-payroll/:id
// --------------------------------------------------
router.get('/:id', async (req, res) => {
    try {
        const payroll = await WorkerPayroll
            .findById(req.params.id)
            .populate('workerId');

        if (!payroll) {
            return res.status(404).json({
                error: 'Payroll record not found.'
            });
        }

        res.json(payroll);
    } catch (error) {
        console.error('Get payroll record error:', error);

        res.status(500).json({
            error: error.message
        });
    }
});

// --------------------------------------------------
// UPDATE PAYROLL
// PUT /api/worker-payroll/:id
// --------------------------------------------------
router.put('/:id', async (req, res) => {
    try {
        const {
            presentDays,
            dailyWage,
            overtime,
            advance,
            status,
            salaryDate
        } = req.body;

        const days = Number(presentDays);
        const wage = Number(dailyWage);
        const extra = Number(overtime ?? 0);
        const deduction = Number(advance ?? 0);

        if (!validSalaryNumbers(days, wage, extra, deduction)) {
            return res.status(400).json({
                error: 'Invalid salary values.'
            });
        }

        if (!['Paid', 'Pending', 'Processing'].includes(status)) {
            return res.status(400).json({
                error: 'Invalid salary status.'
            });
        }

        const update = {
            presentDays: days,
            dailyWage: wage,
            overtime: extra,
            advance: deduction,

            netSalary: calculateNetSalary(
                days,
                wage,
                extra,
                deduction
            ),

            status
        };

        // If date changes, update month and year too.
        if (salaryDate) {
            const date = parseSalaryDate(salaryDate);

            if (!date) {
                return res.status(400).json({
                    error: 'Invalid salary date. Use YYYY-MM-DD.'
                });
            }

            update.salaryDate = date;

            const monthYear = getMonthYear(date);
            update.month = monthYear.month;
            update.year = monthYear.year;
        }

        const payroll = await WorkerPayroll
            .findByIdAndUpdate(
                req.params.id,
                { $set: update },
                {
                    new: true,
                    runValidators: true
                }
            )
            .populate('workerId');

        if (!payroll) {
            return res.status(404).json({
                error: 'Payroll record not found.'
            });
        }

        res.json(payroll);
    } catch (error) {
        console.error('Update payroll error:', error);

        res.status(500).json({
            error: error.message
        });
    }
});

// --------------------------------------------------
// DELETE PAYROLL
// DELETE /api/worker-payroll/:id
// --------------------------------------------------
router.delete('/:id', async (req, res) => {
    try {
        const payroll = await WorkerPayroll.findByIdAndDelete(
            req.params.id
        );

        if (!payroll) {
            return res.status(404).json({
                error: 'Payroll record not found.'
            });
        }

        res.json({
            message: 'Payroll record deleted successfully.'
        });
    } catch (error) {
        console.error('Delete payroll error:', error);

        res.status(500).json({
            error: error.message
        });
    }
});

module.exports = router;