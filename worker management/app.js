const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/siteforce', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ Connected to MongoDB');
}).catch(err => {
    console.error('❌ MongoDB connection error:', err);
});

// ============================================================
// ✅ IMPORT ROUTES - CHECK KARO SAB FILES EXIST KARTI HAI
// ============================================================
const workerRoutes = require('./routes/workerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const adminAttendanceRoutes = require('./routes/adminAttendanceRoutes');
const projectRoutes = require('./routes/projectRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminPayrollRoutes = require('./routes/adminPayrollRoutes');
const workerPayrollRoutes = require('./routes/workerPayrollRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const workerAttendanceRoutes = require('./routes/workerAttendanceRoutes');


// ✅ AGAR dashboardRoutes NAHI HAI TOH COMMENT KARO
// const dashboardRoutes = require('./routes/dashboardRoutes');

// ============================================================
// ✅ USE ROUTES
// ============================================================
// app.use('/api/dashboard', dashboardRoutes);  // COMMENT KARO

app.use('/api/workers', workerRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/admin-attendance', adminAttendanceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin-payroll', adminPayrollRoutes);
app.use('/api/worker-payroll', workerPayrollRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/worker-attendance', workerAttendanceRoutes);

// ============================================================
// ✅ VIEW ROUTES
// ============================================================
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.get("/owner-dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "owner-dashboard.html"));
});

app.get("/admin-dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "admin-dashboard.html"));
});

app.get("/adminsmang", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "adminsmang.html"));
});

app.get("/adminattend", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "adminattend.html"));
});

app.get("/administratend", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "adminattend.html"));
});

app.get("/workersmang", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "workermang.html"));
});

app.get("/workermang", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "workermang.html"));
});

app.get("/workerattend", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "workerattend.html"));
});

app.get("/projects", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "projects.html"));
});

app.get("/aprojects", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "aprojects.html"));
});

app.get("/reports", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "reports.html"));
});

app.get("/areports", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "areports.html"));
});

app.get("/apayroll", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "apayroll.html"));
});

app.get("/wpayroll", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "wpayroll.html"));
});

app.get("/settings", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "settings.html"));
});

app.get("/kaam", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "kaam.html"));
});

// 404 handler
app.use((req, res) => {
    res.status(404).send(`
        <h1>404 - Page Not Found</h1>
        <p>The page you are looking for does not exist.</p>
        <a href="/">Go back to Login</a>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});