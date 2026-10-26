const mongoose = require('mongoose');
const WorkerPayroll = require('./models/WorkerPayroll');
const Worker = require('./models/Worker');
require('dotenv').config();

async function seedWorkerPayroll() {
    try {
        await mongoose.connect('mongodb://localhost:27017/siteforce');
        console.log('✅ Connected to MongoDB');
        
        const workers = await Worker.find();
        if (workers.length === 0) {
            console.log('❌ No workers found. Please add workers first.');
            await mongoose.disconnect();
            return;
        }
        
        const month = 'June';
        const year = 2026;
        
        await WorkerPayroll.deleteMany({ month, year });
        console.log('✅ Deleted existing worker payroll records');
        
        const wageMap = {
            'Mason': 750,
            'Electrician': 900,
            'Welder': 820,
            'Foreman': 1100,
            'Carpenter': 780,
            'Site Engineer': 1400,
            'Plumber': 800,
            'Painter': 700,
            'Driver': 650
        };
        
        const payrollRecords = workers.map(worker => {
            const presentDays = Math.floor(Math.random() * 10) + 20;
            const dailyWage = wageMap[worker.category] || 750;
            const overtime = Math.floor(Math.random() * 3000);
            const advance = Math.floor(Math.random() * 5000);
            const basicSalary = presentDays * dailyWage;
            const netSalary = basicSalary + overtime - advance;
            const statuses = ['Paid', 'Pending', 'Processing'];
            const status = statuses[Math.floor(Math.random() * 3)];
            
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
                netSalary,
                status,
                month,
                year,
                salaryDate: new Date()
            };
        });
        
        await WorkerPayroll.insertMany(payrollRecords);
        console.log(`✅ Generated worker payroll for ${payrollRecords.length} workers`);
        
        const totalPayroll = payrollRecords.reduce((sum, p) => sum + p.netSalary, 0);
        console.log(`📊 Total Payroll: ₹${(totalPayroll / 100000).toFixed(1)}L`);
        
        await mongoose.disconnect();
        console.log('✅ Done! Visit: http://localhost:3000/wpayroll');
        
    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.disconnect();
    }
}

seedWorkerPayroll();