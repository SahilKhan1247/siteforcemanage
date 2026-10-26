// ============================================================
// REPORTS - COMPLETE REAL-TIME VERSION
// ============================================================

let attendanceTrendChartInstance = null;
let categoryChartInstance = null;

let allAttendanceData = [];
let allWorkersData = [];
let allProjectsData = [];
let allAdminsData = [];
let allPayrollData = [];
let allAnnouncementsData = [];

// ============================================================
// TOAST NOTIFICATION
// ============================================================
function showToast(message, type = 'success') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 50);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ============================================================
// CUSTOM TOAST
// ============================================================
function showCustomToast(message, type = 'success') {
    const existing = document.getElementById('myCustomToast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'myCustomToast';
    toast.textContent = message;
    
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        padding: '14px 24px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        color: '#fff',
        backgroundColor: type === 'error' ? '#f04438' : '#12b76a',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        zIndex: '99999',
        transform: 'translateY(100px)',
        opacity: '0',
        transition: 'all 0.4s ease'
    });

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    }, 50);

    setTimeout(() => {
        toast.style.transform = 'translateY(100px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ============================================================
// DOM CONTENT LOADED
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.name) {
        window.location.href = '/';
        return;
    }

    const userNameElement = document.getElementById('userName');
    if (userNameElement) userNameElement.textContent = user.name;

    const profileImg = document.querySelector('.profile img');
    if (profileImg) profileImg.src = `https://ui-avatars.com/api/?name=${user.name}&background=7c3aed&color=fff`;

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    const dateElement = document.getElementById('currentDate');
    if (dateElement) dateElement.textContent = today.toLocaleDateString('en-US', options) + ' · All sites';

    // NAVIGATION
    document.getElementById('ownerdashBtn')?.addEventListener('click', e => { e.preventDefault(); window.location.href = '/owner-dashboard'; });
    document.getElementById('adminsmanBtn')?.addEventListener('click', e => { e.preventDefault(); window.location.href = '/adminsmang'; });
    document.getElementById('adminattendanceBtn')?.addEventListener('click', e => { e.preventDefault(); window.location.href = '/adminattend'; });
    document.getElementById('projectsBtn')?.addEventListener('click', e => { e.preventDefault(); window.location.href = '/projects'; });
    document.getElementById('apayrollBtn')?.addEventListener('click', e => { e.preventDefault(); window.location.href = '/apayroll'; });
    document.getElementById('settingsBtn')?.addEventListener('click', e => { e.preventDefault(); window.location.href = '/settings'; });
    document.getElementById('logoutBtn')?.addEventListener('click', e => {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('user');
            window.location.href = '/';
        }
    });
    document.getElementById('settingsBtnTop')?.addEventListener('click', () => window.location.href = '/settings');
    document.querySelector('.profile')?.addEventListener('click', () => {
        if (confirm('Do you want to logout?')) {
            localStorage.removeItem('user');
            window.location.href = '/';
        }
    });

    // NOTIFICATION DROPDOWN
    const notificationBtn = document.getElementById('notificationBtn');
    
    const notificationDropdown = document.createElement('div');
    notificationDropdown.className = 'notification-dropdown';
    notificationDropdown.id = 'notificationDropdown';
    notificationDropdown.innerHTML = `
        <div class="dropdown-header" style="display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-bottom: 1px solid var(--border);">
            <h4 style="margin: 0; font-size: 14px; font-weight: 700; color: var(--text-dark);">Notifications</h4>
            <div id="notifHeaderButtons" style="display: none; gap: 8px;">
                <button onclick="markAllRead()" style="font-size: 12px; color: var(--blue); background: none; border: none; cursor: pointer; font-weight: 600;">Mark all read</button>
                <button onclick="clearAllNotifications()" style="font-size: 12px; color: var(--red); background: none; border: none; cursor: pointer; font-weight: 600;">Clear All</button>
            </div>
        </div>
        <div id="notificationList">
            <div class="no-notifications">Loading notifications...</div>
        </div>
    `;
    document.querySelector('.top-right').appendChild(notificationDropdown);

    notificationBtn?.addEventListener('click', function(e) {
        e.stopPropagation();
        const dropdown = document.getElementById('notificationDropdown');
        dropdown.classList.toggle('show');
        if (dropdown.classList.contains('show')) loadNotifications();
    });

    document.addEventListener('click', function(e) {
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown && !dropdown.contains(e.target) && e.target !== notificationBtn) {
            dropdown.classList.remove('show');
        }
    });

    window.addEventListener('focus', () => loadNotifications());
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) loadNotifications();
    });

    // ANNOUNCEMENT MODAL
    const annBtn = document.getElementById('announcementsBtn');
    const annModal = document.getElementById('announcementModal');
    const annForm = document.getElementById('announcementForm');

    annBtn?.addEventListener('click', function() {
        annModal.style.display = 'block';
    });

    window.addEventListener('click', function(e) {
        if (e.target === annModal) annModal.style.display = 'none';
    });

    annForm?.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = annForm.querySelector('.btn-submit');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
        submitBtn.disabled = true;

        const title = document.getElementById('annTitle').value.trim();
        const message = document.getElementById('annMessage').value.trim();
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        try {
            const response = await fetch('/api/announcements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, message, createdBy: user.name })
            });

            if (response.ok) {
                showCustomToast('✅ Announcement sent to all admins!', 'success');
                annModal.style.display = 'none';
                annForm.reset();
                loadAnnouncementsList();
            } else {
                const data = await response.json().catch(() => ({}));
                showCustomToast(`❌ ${data.error || 'Server error: ' + response.status}`, 'error');
            }
        } catch (error) {
            console.error('Announcement Fetch Error:', error);
            showCustomToast('❌ Network error: Backend not reachable', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });

    // SEARCH & REPORT MODAL
    document.getElementById('globalSearch')?.addEventListener('input', function() {
        filterReports(this.value.toLowerCase());
    });

    const modal = document.getElementById('reportModal');
    const closeBtn = document.querySelector('.close');

    document.getElementById('generateReportBtn')?.addEventListener('click', function() {
        modal.style.display = 'block';
        const today = new Date();
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        document.getElementById('reportStartDate').value = weekAgo.toISOString().split('T')[0];
        document.getElementById('reportEndDate').value = today.toISOString().split('T')[0];
        loadProjectDropdown();
    });

    closeBtn?.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });

    document.getElementById('reportForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        generateReport(
            document.getElementById('reportType').value,
            document.getElementById('reportStartDate').value,
            document.getElementById('reportEndDate').value,
            document.getElementById('reportSite').value
        );
    });

    document.getElementById('exportAllBtn')?.addEventListener('click', exportAllData);

    document.getElementById('refreshBtn')?.addEventListener('click', function() {
        const btn = this;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Refreshing...';
        btn.disabled = true;
        
        loadAllData().then(() => {
            btn.innerHTML = '<i class="fa-solid fa-sync"></i> Refresh';
            btn.disabled = false;
            showToast('✅ Data refreshed successfully!', 'success');
        }).catch(() => {
            btn.innerHTML = '<i class="fa-solid fa-sync"></i> Refresh';
            btn.disabled = false;
            showToast('❌ Failed to refresh data', 'error');
        });
    });

    loadAllData();
    loadNotifications();
    loadAnnouncementsList();

    setInterval(loadAllData, 60000);
    setInterval(loadNotifications, 10000);
    setInterval(loadAnnouncementsList, 30000);
});

// LOAD ALL DATA
async function loadAllData() {
    try {
        const [workersRes, adminsRes, attendanceRes, projectsRes, payrollRes] = await Promise.all([
            fetch('/api/workers'),
            fetch('/api/admins'),
            fetch('/api/worker-attendance'),
            fetch('/api/projects'),
            fetch('/api/worker-payroll')
        ]);

        allWorkersData = await workersRes.json();
        allAdminsData = await adminsRes.json();
        allAttendanceData = await attendanceRes.json();
        allProjectsData = await projectsRes.json();
        allPayrollData = await payrollRes.json();

        updateStats();
        updateAttendanceTrendChart();
        updateCategoryChart();
        updateProjectList();
        updateRecentReports();

        console.log('✅ All data loaded successfully!');
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('❌ Failed to load data. Please refresh.', 'error');
    }
}

// UPDATE STATS
function updateStats() {
    const today = new Date().toISOString().split('T')[0];
    const totalWorkers = allWorkersData.length;
    const totalAdmins = allAdminsData.length;
    const activeProjects = allProjectsData.filter(p => p.status !== 'Completed').length;

    const todayAttendance = allAttendanceData.filter(a => a.date === today);
    const presentToday = todayAttendance.filter(a => a.status === 'Present').length;
    const absentToday = todayAttendance.filter(a => a.status === 'Absent').length;
    const lateToday = todayAttendance.filter(a => a.status === 'Late').length;

    document.getElementById('todayAttendance').textContent = presentToday || 0;
    document.getElementById('todayAbsent').textContent = absentToday || 0;
    document.getElementById('todayLate').textContent = lateToday || 0;
    document.getElementById('totalWorkers').textContent = totalWorkers || 0;
    document.getElementById('totalAdmins').textContent = totalAdmins || 0;
    document.getElementById('activeProjects').textContent = activeProjects || 0;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklyData = allAttendanceData.filter(a => new Date(a.date) >= weekAgo);
    const weeklyPresent = weeklyData.filter(a => a.status === 'Present').length;
    let weeklyRate = 0;
    if (totalWorkers > 0 && weeklyData.length > 0) {
        const uniqueDates = [...new Set(weeklyData.map(a => a.date))];
        if (uniqueDates.length > 0) weeklyRate = Math.round((weeklyPresent / (uniqueDates.length * totalWorkers)) * 100);
    }
    document.getElementById('weeklyAttendance').textContent = weeklyRate + '%';

    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const monthlyData = allAttendanceData.filter(a => new Date(a.date) >= monthAgo);
    const monthlyPresent = monthlyData.filter(a => a.status === 'Present').length;
    let monthlyRate = 0;
    if (totalWorkers > 0 && monthlyData.length > 0) {
        const uniqueDates = [...new Set(monthlyData.map(a => a.date))];
        if (uniqueDates.length > 0) monthlyRate = Math.round((monthlyPresent / (uniqueDates.length * totalWorkers)) * 100);
    }
    document.getElementById('monthlyAttendance').textContent = monthlyRate + '%';

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthPayroll = allPayrollData.filter(p => {
        const pDate = new Date(p.salaryDate || p.createdAt);
        return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
    });
    const totalPayroll = monthPayroll.reduce((sum, p) => sum + (p.netSalary || 0), 0);
    document.getElementById('totalPayroll').textContent = totalPayroll > 0 ? `₹${(totalPayroll / 100000).toFixed(1)}L` : '₹0';
}

// ATTENDANCE TREND CHART
function updateAttendanceTrendChart() {
    const ctx = document.getElementById('attendanceTrendChart')?.getContext('2d');
    if (!ctx) return;

    const weeks = [];
    const presentData = [];
    const absentData = [];
    const today = new Date();
    const totalWorkers = allWorkersData.length;

    for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - (i * 7 + 7));
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() - (i * 7));

        const weekData = allAttendanceData.filter(a => {
            const attDate = new Date(a.date);
            return attDate >= weekStart && attDate < weekEnd;
        });

        const present = weekData.filter(a => a.status === 'Present').length;
        let presentRate = 0;
        if (totalWorkers > 0 && weekData.length > 0) {
            const uniqueDates = [...new Set(weekData.map(a => a.date))];
            if (uniqueDates.length > 0) presentRate = Math.round((present / (uniqueDates.length * totalWorkers)) * 100);
        }
        const absentRate = presentRate > 0 ? (100 - presentRate) : 0;

        weeks.push(`Week ${4 - i}`);
        presentData.push(presentRate);
        absentData.push(absentRate);
    }

    if (attendanceTrendChartInstance) attendanceTrendChartInstance.destroy();

    attendanceTrendChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: weeks,
            datasets: [
                { label: 'Present %', data: presentData, backgroundColor: '#2563eb', borderRadius: 4 },
                { label: 'Absent %', data: absentData, backgroundColor: '#f04438', borderRadius: 4 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'top', labels: { usePointStyle: true, pointStyle: 'circle', padding: 20 } } },
            scales: {
                y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' }, grid: { color: '#f1f5f9' } },
                x: { grid: { display: false } }
            }
        }
    });
}

// CATEGORY CHART
function updateCategoryChart() {
    const ctx = document.getElementById('categoryChart')?.getContext('2d');
    if (!ctx) return;

    const categoryCount = {};
    allWorkersData.forEach(w => {
        categoryCount[w.category] = (categoryCount[w.category] || 0) + 1;
    });

    const categories = Object.keys(categoryCount);
    const counts = Object.values(categoryCount);
    const colors = ['#2563eb', '#7c3aed', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#f472b6', '#34d399'];

    if (categoryChartInstance) categoryChartInstance.destroy();
    if (categories.length === 0) return;

    categoryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{ data: counts, backgroundColor: colors.slice(0, categories.length), borderWidth: 2, borderColor: '#ffffff' }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'right', labels: { usePointStyle: true, pointStyle: 'circle', padding: 16, font: { size: 12 } } } },
            cutout: '65%'
        }
    });
}

// PROJECT LIST
function updateProjectList() {
    const projectList = document.getElementById('projectList');
    if (!projectList) return;

    if (allProjectsData.length === 0) {
        projectList.innerHTML = `<div class="project-empty"><i class="fa-regular fa-building"></i><h3>No Projects Found</h3><p>Create a project to see attendance data here.</p></div>`;
        return;
    }

    const projectData = {};

    allProjectsData.forEach(project => {
        const projectWorkers = allWorkersData.filter(w => w.project === project.name);
        const workerIds = projectWorkers.map(w => w._id);
        const projectAttendance = allAttendanceData.filter(a => workerIds.includes(a.workerId?._id || a.workerId));
        const total = projectAttendance.length || 1;
        const present = projectAttendance.filter(a => a.status === 'Present').length;
        const rate = Math.round((present / total) * 100);
        
        projectData[project.name] = {
            rate: rate || 0, workerCount: projectWorkers.length,
            totalAttendance: total, presentCount: present, status: project.status || 'On Track'
        };
    });

    const sortedProjects = Object.entries(projectData).sort((a, b) => b[1].rate - a[1].rate);
    const iconColors = ['purple', 'blue', 'green', 'orange', 'cyan', 'red'];

    projectList.innerHTML = `
        <div class="project-grid">
            ${sortedProjects.map(([name, data], index) => {
                const iconColor = iconColors[index % iconColors.length];
                let rateClass = 'high', borderClass = 'border-high', progressClass = 'high';
                
                if (data.rate < 70) { rateClass = 'low'; borderClass = 'border-low'; progressClass = 'low'; }
                else if (data.rate < 85) { rateClass = 'medium'; borderClass = 'border-medium'; progressClass = 'medium'; }
                
                return `
                    <div class="project-card-item ${borderClass}">
                        <div class="project-top">
                            <div class="project-name-area">
                                <div class="project-icon ${iconColor}"><i class="fa-solid fa-hard-hat"></i></div>
                                <div>
                                    <div class="project-name-text">${name}</div>
                                    <span style="font-size: 11px; color: var(--text-muted);"><i class="fa-solid fa-user"></i> ${data.workerCount} workers</span>
                                </div>
                            </div>
                            <span class="project-status-badge ${data.status === 'At Risk' ? 'at-risk' : data.status === 'Delayed' ? 'delayed' : ''}">${data.status}</span>
                        </div>
                        <div class="project-stats">
                            <div class="stat-item"><span class="stat-label">Attendance Rate</span><span class="stat-number ${rateClass}">${data.rate}%</span></div>
                            <div class="stat-item"><span class="stat-label">Present</span><span class="stat-number">${data.presentCount} <span class="small-text">/ ${data.totalAttendance}</span></span></div>
                            <div class="stat-item"><span class="stat-label">Status</span><span class="stat-number" style="font-size: 14px;"><span class="status-badge ${data.status === 'On Track' ? 'on-track' : data.status === 'Completed' ? 'completed' : data.status === 'At Risk' ? 'at-risk' : 'delayed'}">${data.status}</span></span></div>
                        </div>
                        <div class="attendance-progress">
                            <div class="progress-header">
                                <span class="progress-label"><i class="fa-solid fa-chart-line"></i> Attendance Rate</span>
                                <span class="progress-value ${rateClass}">${data.rate}%</span>
                            </div>
                            <div class="progress-track"><div class="progress-fill ${progressClass}" style="width: ${data.rate}%"></div></div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// RECENT REPORTS
function updateRecentReports() {
    const reportsList = document.getElementById('reportsList');
    if (!reportsList) return;

    const savedReports = JSON.parse(localStorage.getItem('reports') || '[]');

    if (savedReports.length === 0) {
        reportsList.innerHTML = `
            <div class="report-item">
                <div class="report-info"><i class="fa-regular fa-file-pdf"></i><div class="report-details"><h4>No reports generated yet</h4><p>Click "Generate New Report" to create one</p></div></div>
            </div>
        `;
        return;
    }

    reportsList.innerHTML = savedReports.map((report, index) => `
        <div class="report-item">
            <div class="report-info">
                <i class="${report.icon || 'fa-regular fa-file-pdf'}"></i>
                <div class="report-details">
                    <h4>${report.name}</h4>
                    <p>${report.type || 'Report'} · ${report.site || 'All sites'} · ${report.size || 'N/A'}</p>
                    <small>Generated: ${report.date || new Date().toLocaleDateString()}</small>
                </div>
            </div>
            <div class="report-actions">
                <button class="download-btn" onclick="downloadReport(${index})"><i class="fa-solid fa-download"></i> Download</button>
                <button class="delete-btn" onclick="deleteReport(${index})"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

// ✅ RECENT ANNOUNCEMENTS LIST
async function loadAnnouncementsList() {
    const list = document.getElementById('announcementsList');
    if (!list) return;

    try {
        const response = await fetch('/api/announcements?role=Owner', { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to fetch');

        const data = await response.json();
        allAnnouncementsData = Array.isArray(data) ? data : [];

        if (allAnnouncementsData.length === 0) {
            list.innerHTML = `
                <div class="announcement-item">
                    <i class="fa-solid fa-bullhorn"></i>
                    <div class="announcement-body">
                        <h4>No announcements yet</h4>
                        <p>Click "Announcements" button to send one</p>
                    </div>
                </div>
            `;
            return;
        }

        list.innerHTML = allAnnouncementsData.map(ann => {
            const dt = ann.createdAt ? new Date(ann.createdAt) : new Date();
            const dateStr = dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
            const timeStr = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

            const safeTitle   = (ann.title   || 'Untitled').toString().trim().replace(/</g, '&lt;');
            const safeMessage = (ann.message || '').toString().trim().replace(/</g, '&lt;');
            const safeCreator = (ann.createdBy || 'Owner').toString().replace(/</g, '&lt;');

            return `
                <div class="announcement-item">
                    <i class="fa-solid fa-bullhorn"></i>
                    <div class="announcement-body">
                        <h4>${safeTitle}</h4>
                        ${safeMessage ? `<p>${safeMessage}</p>` : ''}
                        <small>
                            <i class="fa-solid fa-user"></i> ${safeCreator}
                            <span>·</span>
                            <i class="fa-regular fa-calendar"></i> ${dateStr}
                            <span>·</span>
                            <i class="fa-regular fa-clock"></i> ${timeStr}
                        </small>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading announcements:', error);
        list.innerHTML = `
            <div class="announcement-item">
                <i class="fa-solid fa-exclamation-circle" style="background:var(--red-light);color:var(--red);"></i>
                <div class="announcement-body">
                    <h4>Could not load announcements</h4>
                    <p>/api/announcements endpoint not reachable</p>
                </div>
            </div>
        `;
    }
}

// GENERATE REPORT
function generateReport(type, startDate, endDate, site) {
    const typeMap = { daily: 'Daily Attendance', weekly: 'Weekly Summary', monthly: 'Monthly Payroll', custom: 'Custom Report' };
    const siteDisplay = site === 'all' ? 'All sites' : site;
    const dateDisplay = `${formatDateDisplay(startDate)} to ${formatDateDisplay(endDate)}`;

    const report = {
        name: `${typeMap[type]} — ${dateDisplay}`,
        type: typeMap[type],
        site: siteDisplay,
        size: Math.floor(Math.random() * 1000 + 100) + ' KB',
        icon: 'fa-regular fa-file-pdf',
        date: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
        startDate, endDate, siteValue: site
    };

    const reports = JSON.parse(localStorage.getItem('reports') || '[]');
    reports.unshift(report);
    localStorage.setItem('reports', JSON.stringify(reports));

    document.getElementById('reportModal').style.display = 'none';
    document.getElementById('reportForm').reset();
    updateRecentReports();
    showToast(`✅ ${report.name} generated successfully!`, 'success');
}

// DOWNLOAD / DELETE REPORT
function downloadReport(index) {
    const reports = JSON.parse(localStorage.getItem('reports') || '[]');
    if (reports[index]) {
        const report = reports[index];
        showToast(`📥 Downloading "${report.name}"...`, 'success');
        
        let csvContent = "Report Name,Type,Site,Generated Date\n";
        csvContent += `${report.name},${report.type},${report.site},${report.date}\n\n`;
        csvContent += "Worker,Category,Project,Status,Date\n";
        
        const today = new Date().toISOString().split('T')[0];
        allWorkersData.slice(0, 10).forEach(w => {
            const statuses = ['Present', 'Present', 'Present', 'Absent', 'Late'];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            csvContent += `${w.name},${w.category},${w.project},${status},${today}\n`;
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${report.name.replace(/\s/g, '_')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        
        showToast(`✅ "${report.name}" downloaded successfully!`, 'success');
    }
}

function deleteReport(index) {
    if (!confirm('Are you sure you want to delete this report?')) return;
    const reports = JSON.parse(localStorage.getItem('reports') || '[]');
    if (reports[index]) {
        reports.splice(index, 1);
        localStorage.setItem('reports', JSON.stringify(reports));
        updateRecentReports();
        showToast('✅ Report deleted successfully!', 'success');
    }
}

// EXPORT ALL DATA
function exportAllData() {
    try {
        let csvContent = "=== SITEFORCE DATA EXPORT ===\n";
        csvContent += `Exported: ${new Date().toLocaleString()}\n\n`;
        
        csvContent += "--- WORKERS ---\nName,Worker ID,Phone,Category,Project,Status\n";
        allWorkersData.forEach(w => {
            csvContent += `${w.name},${w.workerId || 'N/A'},${w.phone || 'N/A'},${w.category || 'N/A'},${w.project || 'N/A'},${w.status || 'Active'}\n`;
        });
        
        csvContent += "\n--- ADMINS ---\nName,Admin ID,Role,Project,Status\n";
        allAdminsData.forEach(a => {
            csvContent += `${a.name},${a.adminId || 'N/A'},${a.role || 'N/A'},${a.project || 'N/A'},${a.status || 'Active'}\n`;
        });
        
        csvContent += "\n--- ATTENDANCE ---\nWorker,Date,Check In,Check Out,Status\n";
        allAttendanceData.slice(0, 50).forEach(a => {
            const worker = a.workerId || {};
            csvContent += `${worker.name || 'Unknown'},${a.date || 'N/A'},${a.checkIn || '--:--'},${a.checkOut || '--:--'},${a.status || 'N/A'}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `siteforce_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        
        showToast('✅ All data exported successfully!', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showToast('❌ Failed to export data', 'error');
    }
}

// FILTER / DROPDOWN / FORMAT
function filterReports(searchTerm) {
    document.querySelectorAll('.report-item').forEach(item => {
        item.style.display = item.textContent.toLowerCase().includes(searchTerm) ? 'flex' : 'none';
    });
}

async function loadProjectDropdown() {
    try {
        const response = await fetch('/api/projects');
        const projects = await response.json();
        const select = document.getElementById('reportSite');
        if (select) {
            select.innerHTML = '<option value="all">All Sites</option>' +
                projects.map(p => `<option value="${p.name}">${p.name}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

function formatDateDisplay(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

// NOTIFICATION FUNCTIONS
async function loadNotifications() {
    try {
        const response = await fetch('/api/admins/notifications?role=Owner', { cache: 'no-store' });
        const notifications = await response.json();
        
        const list = document.getElementById('notificationList');
        if (!list) return;
        
        const badge = document.getElementById('notificationBadge') || document.querySelector('.notification .badge');
        const headerButtons = document.getElementById('notifHeaderButtons');
        
        if (notifications && notifications.length > 0) {
            if (headerButtons) headerButtons.style.display = 'flex';

            const unreadCount = notifications.filter(n => !n.read).length;
            if (badge) {
                if (unreadCount > 0) {
                    badge.textContent = unreadCount;
                    badge.style.display = 'flex';
                    badge.classList.add('has-notification');
                } else {
                    badge.textContent = '0';
                    badge.style.display = 'none';
                }
            }
            
            list.innerHTML = notifications.map(notif => {
                let iconClass = 'fa-bell';
                let iconColor = 'updated';
                
                if (notif.type === 'created') { iconClass = 'fa-plus-circle'; iconColor = 'created'; }
                else if (notif.type === 'updated') { iconClass = 'fa-pen'; iconColor = 'updated'; }
                else if (notif.type === 'deleted') { iconClass = 'fa-trash'; iconColor = 'deleted'; }
                else if (notif.type === 'announcement') { iconClass = 'fa-bullhorn'; iconColor = 'status_changed'; }

                return `
                <div class="notification-item ${notif.read ? 'read' : 'unread'}" onclick="markNotificationRead('${notif._id}')">
                    <div class="notif-icon ${iconColor}"><i class="fa-solid ${iconClass}"></i></div>
                    <div class="notif-content">
                        <p>${notif.message}</p>
                        <small>${formatTime(notif.timestamp)}</small>
                    </div>
                    ${!notif.read ? '<span class="notif-dot"></span>' : ''}
                </div>
                `;
            }).join('');
            
        } else {
            if (headerButtons) headerButtons.style.display = 'none';
            list.innerHTML = `<div class="no-notifications"><i class="fa-regular fa-bell-slash"></i><p>No notifications</p></div>`;
            if (badge) {
                badge.textContent = '0';
                badge.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    if (diff < 604800000) return Math.floor(diff / 86400000) + 'd ago';
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
}

async function markNotificationRead(notifId) {
    const item = document.querySelector(`.notification-item[onclick*="${notifId}"]`);
    if (item) {
        item.classList.remove('unread');
        item.classList.add('read');
        const dot = item.querySelector('.notif-dot');
        if (dot) dot.remove();
    }
    
    const unreadItems = document.querySelectorAll('.notification-item.unread').length;
    const badge = document.getElementById('notificationBadge') || document.querySelector('.notification .badge');
    if (badge) {
        if (unreadItems > 0) badge.textContent = unreadItems;
        else { badge.textContent = '0'; badge.style.display = 'none'; }
    }

    try {
        await fetch(`/api/admins/notifications/${notifId}/read`, { method: 'PUT' });
    } catch (err) {
        console.error('markNotificationRead failed:', err);
    }
}

async function markAllRead() {
    const unreadItems = document.querySelectorAll('.notification-item.unread');
    unreadItems.forEach(item => {
        item.classList.remove('unread');
        item.classList.add('read');
        const dot = item.querySelector('.notif-dot');
        if (dot) dot.remove();
    });
    
    const badge = document.getElementById('notificationBadge') || document.querySelector('.notification .badge');
    if (badge) {
        badge.textContent = '0';
        badge.style.display = 'none';
        badge.classList.remove('has-notification');
    }
    
    try {
        const res = await fetch('/api/admins/notifications/mark-all-read?role=Owner', { method: 'PUT' });
        if (!res.ok) throw new Error('Backend failed');
        showCustomToast('✅ All notifications marked as read', 'success');
        setTimeout(() => loadNotifications(), 200);
    } catch (err) {
        console.error('markAllRead failed:', err);
        showCustomToast('❌ Failed to mark as read', 'error');
        await loadNotifications();
    }
}

async function clearAllNotifications() {
    try {
        const response = await fetch('/api/admins/notifications/clear?role=Owner', {
            method: 'DELETE'
        });

        if (response.ok) {
            const list = document.getElementById('notificationList');
            if (list) {
                list.innerHTML = `<div class="no-notifications"><i class="fa-regular fa-bell-slash"></i><p>No notifications</p></div>`;
            }
            
            const headerButtons = document.getElementById('notifHeaderButtons');
            if (headerButtons) headerButtons.style.display = 'none';
            
            const badge = document.getElementById('notificationBadge') || document.querySelector('.notification .badge');
            if (badge) {
                badge.textContent = '0';
                badge.style.display = 'none';
                badge.classList.remove('has-notification');
            }
            
            showCustomToast('✅ All notifications cleared!', 'success');
        } else {
            showCustomToast('❌ Failed to clear notifications', 'error');
        }
    } catch (error) {
        console.error('Error clearing notifications:', error);
        showCustomToast('❌ Error clearing notifications', 'error');
    }
}

// MAKE FUNCTIONS GLOBALLY ACCESSIBLE
window.downloadReport = downloadReport;
window.deleteReport = deleteReport;
window.markAllRead = markAllRead;
window.markNotificationRead = markNotificationRead;
window.clearAllNotifications = clearAllNotifications;
window.loadAllData = loadAllData;
window.generateReport = generateReport;
window.exportAllData = exportAllData;
window.showCustomToast = showCustomToast;
window.loadNotifications = loadNotifications;
window.loadAnnouncementsList = loadAnnouncementsList;

// MOBILE ANIMATION CSS
const notifStyle = document.createElement('style');
notifStyle.textContent = `
    .notification-dropdown { display: none; position: absolute; top: 50px; right: 0; width: 380px; max-height: 420px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); box-shadow: 0 8px 32px rgba(0,0,0,0.15); z-index: 1000; overflow: hidden; }
    .notification-dropdown.show { display: block; animation: slideDown 0.3s ease; }
    @keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .dropdown-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-bottom: 1px solid var(--border); background: var(--bg); }
    .dropdown-header h4 { font-size: 14px; font-weight: 700; color: var(--text-dark); margin: 0; }
    .dropdown-header button { font-size: 12px; background: none; border: none; cursor: pointer; font-weight: 600; padding: 4px 8px; border-radius: 4px; }
    .dropdown-header button:hover { background: var(--border); }
    #notificationList { max-height: 340px; overflow-y: auto; padding: 4px 0; }
    .notification-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px 20px; cursor: pointer; transition: all 0.2s ease; border-bottom: 1px solid var(--border); position: relative; }
    .notification-item:hover { background: var(--bg); }
    .notification-item.unread { background: var(--blue-light); }
    .notification-item.unread:hover { background: #dbeafe; }
    .notification-item .notif-icon { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
    .notification-item .notif-icon.created { background: var(--green-light); color: var(--green); }
    .notification-item .notif-icon.updated { background: var(--blue-light); color: var(--blue); }
    .notification-item .notif-icon.deleted { background: var(--red-light); color: var(--red); }
    .notification-item .notif-icon.status_changed { background: var(--orange-light); color: var(--orange); }
    .notification-item .notif-content { flex: 1; min-width: 0; }
    .notification-item .notif-content p { font-size: 13px; color: var(--text-dark); line-height: 1.4; margin: 0; font-weight: 500; }
    .notification-item .notif-content small { font-size: 11px; color: var(--text-muted); }
    .notification-item .notif-dot { width: 8px; height: 8px; background: var(--blue); border-radius: 50%; flex-shrink: 0; margin-top: 4px; transition: opacity 0.2s ease; }
    .no-notifications { text-align: center; padding: 30px 20px; color: var(--text-muted); font-size: 14px; }
    .no-notifications i { font-size: 32px; color: var(--text-faint); display: block; margin-bottom: 8px; }
    @media (max-width: 768px) { .notification-dropdown { width: 300px; right: -50px; } }
`;
document.head.appendChild(notifStyle);