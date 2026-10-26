const mongoose = require('mongoose');
const AdminPayroll = require('./models/AdminPayroll');
const Admin = require('./models/Admin');
require('dotenv').config();

async function seedAdminPayroll() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/siteforce', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');
        
        // Get all admins
        const admins = await Admin.find();
        
        if (admins.length === 0) {
            console.log('❌ No admins found. Please add admins first.');
            console.log('Go to: http://localhost:3000/adminsmang to add admins');
            await mongoose.disconnect();
            return;
        }
        
        console.log(`📊 Found ${admins.length} admins`);
        
        const month = 'June';
        const year = 2026;
        
        // Delete existing payroll for this month/year
        const deleted = await AdminPayroll.deleteMany({ month, year });
        console.log(`✅ Deleted ${deleted.deletedCount} existing admin payroll records`);
        
        // Role-based wage mapping
        const wageMap = {
            'Super Admin': 2000,
            'Project Admin': 1500,
            'Site Admin': 1200
        };
        
        // Generate payroll for each admin
        const payrollRecords = admins.map(admin => {
            // Random present days between 22-28
            const presentDays = Math.floor(Math.random() * 6) + 22;
            const dailyWage = wageMap[admin.role] || 1200;
            const overtime = Math.floor(Math.random() * 5000);
            const advance = Math.floor(Math.random() * 8000);
            const basicSalary = presentDays * dailyWage;
            const netSalary = basicSalary + overtime - advance;
            
            // Random status
            const statuses = ['Paid', 'Pending', 'Processing'];
            const status = statuses[Math.floor(Math.random() * 3)];
            
            return {
                adminId: admin._id,
                name: admin.name,
                adminId: admin.adminId || 'N/A',
                role: admin.role || 'Admin',
                project: admin.project || 'N/A',
                presentDays: presentDays,
                dailyWage: dailyWage,
                overtime: overtime,
                advance: advance,
                netSalary: netSalary,
                status: status,
                month: month,
                year: year
            };
        });
        
        // Save all payroll records
        const saved = await AdminPayroll.insertMany(payrollRecords);
        console.log(`✅ Generated admin payroll for ${saved.length} admins`);
        
        // Show summary
        const totalPayroll = payrollRecords.reduce((sum, p) => sum + p.netSalary, 0);
        const pending = payrollRecords.filter(p => p.status === 'Pending').length;
        const paid = payrollRecords.filter(p => p.status === 'Paid').length;
        const processing = payrollRecords.filter(p => p.status === 'Processing').length;
        
        console.log('\n📊 Admin Payroll Summary:');
        console.log(`   Total Admins: ${payrollRecords.length}`);
        console.log(`   Total Payroll: ₹${(totalPayroll / 100000).toFixed(1)}L`);
        console.log(`   Paid: ${paid} admins`);
        console.log(`   Processing: ${processing} admins`);
        console.log(`   Pending: ${pending} admins`);
        console.log(`   Month: ${month} ${year}`);
        
        await mongoose.disconnect();
        console.log('\n✅ Done!');
        console.log('Visit: http://localhost:3000/apayroll to view admin payroll');
        
    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.disconnect();
    }
}

// Run the function
seedAdminPayroll();