// ============================================================
// AREPORTS - COMPLETE REAL-TIME VERSION (FULLY FIXED)
// ============================================================

let currentPage = 1;
const itemsPerPage = 10;
let totalItems = 0;
let totalPages = 1;

let attendanceTrendChartInstance = null;
let categoryChartInstance = null;

let allAttendanceData = [];
let allWorkersData = [];
let allProjectsData = [];
let allAdminsData = [];
let allPayrollData = [];
let allReportsData = [];

// ============================================================
// TOAST
// ============================================================
function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 50);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ============================================================
// DATE HELPERS
// ============================================================
function getTodayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function toISODate(dateObj) {
    return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return dateStr;
}

function formatDateDisplay(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTimeAgo(timestamp) {
    if (!timestamp) return 'Just now';
    const diff = new Date() - new Date(timestamp);
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    if (diff < 604800000) return Math.floor(diff / 86400000) + 'd ago';
    return new Date(timestamp).toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
}

// ============================================================
// LOAD ALL DATA FROM DB
// ============================================================
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

        allReportsData = JSON.parse(localStorage.getItem('areports') || '[]');

        updateStats();
        updateAttendanceTrendChart();
        updateCategoryChart();
        updateProjectList();
        loadAttendanceTable(currentPage);
        updateRecentReports();

        console.log('✅ All data loaded!');
        return Promise.resolve();
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('❌ Failed to load data', 'error');
        return Promise.reject(error);
    }
}

// ============================================================
// STATS CARDS (8) - REAL TIME (FULLY FIXED)
// ============================================================
function updateStats() {
    const today = getTodayISO();
    const totalWorkers = allWorkersData.length;
    const totalAdmins = allAdminsData.length;

    // =============== TODAY'S ATTENDANCE ===============
    const todayAtt = allAttendanceData.filter(a => a.date === today);
    const presentToday = todayAtt.filter(a => a.status === 'Present').length;
    const absentToday = todayAtt.filter(a => a.status === 'Absent').length;
    const lateToday = todayAtt.filter(a => a.status === 'Late').length;
    const totalToday = todayAtt.length || 1;

    // =============== WEEKLY & MONTHLY (BULLETPROOF) ===============
    // Find the absolute latest date in the attendance DB to use as reference
    let refDateStr = getTodayISO();
    if (allAttendanceData.length > 0) {
        const dates = allAttendanceData.map(a => a.date).filter(Boolean).sort();
        if (dates.length > 0) refDateStr = dates[dates.length - 1];
    }
    const refDate = new Date(refDateStr + 'T00:00:00');

    // Helper to calculate rate accurately
    const calculateRate = (daysToLookBack) => {
        const startDate = new Date(refDate);
        startDate.setDate(startDate.getDate() - daysToLookBack);
        const startDateStr = toISODate(startDate);

        const periodData = allAttendanceData.filter(a => a.date >= startDateStr && a.date <= refDateStr);
        if (periodData.length === 0) return 0;

        const uniqueDates = [...new Set(periodData.map(a => a.date))];
        if (uniqueDates.length === 0) return 0;

        let totalPossible = 0;
        let totalPresent = 0;

        uniqueDates.forEach(date => {
            const dayData = periodData.filter(a => a.date === date);
            const present = dayData.filter(a => a.status === 'Present').length;
            
            // Use total registered workers if available, else use daily records
            const totalOnDay = totalWorkers > 0 ? totalWorkers : dayData.length;

            totalPresent += present;
            totalPossible += totalOnDay;
        });

        if (totalPossible === 0) return 0;
        return Math.round((totalPresent / totalPossible) * 100);
    };

    const weeklyRate = calculateRate(7);
    const monthlyRate = calculateRate(30);

    // =============== TOTAL PAYROLL ===============
    const cm = new Date().getMonth();
    const cy = new Date().getFullYear();
    const monthPayroll = allPayrollData.filter(p => {
        const pDate = new Date(p.salaryDate || p.createdAt);
        return pDate.getMonth() === cm && pDate.getFullYear() === cy;
    });
    const totalPayroll = monthPayroll.reduce((sum, p) => sum + (p.netSalary || 0), 0);

    // =============== UPDATE DOM ===============
    document.getElementById('totalWorkers').textContent = totalWorkers;
    document.getElementById('presentToday').textContent = presentToday;
    document.getElementById('absentToday').textContent = absentToday;
    document.getElementById('lateToday').textContent = lateToday;
    
    document.getElementById('weeklyAttendance').textContent = weeklyRate + '%';
    document.getElementById('monthlyAttendance').textContent = monthlyRate + '%';
    
    document.getElementById('totalPayroll').textContent = totalPayroll > 0 ? `₹${(totalPayroll / 100000).toFixed(1)}L` : '₹0';
    document.getElementById('totalAdmins').textContent = totalAdmins;

    document.getElementById('presentPercent').textContent = Math.round((presentToday / totalToday) * 100) + '%';
    document.getElementById('absentPercent').textContent = Math.round((absentToday / totalToday) * 100) + '%';
    document.getElementById('latePercent').textContent = Math.round((lateToday / totalToday) * 100) + '%';
}

// ============================================================
// ATTENDANCE TREND CHART - REAL 4 WEEKS (FULLY FIXED)
// ============================================================
function updateAttendanceTrendChart() {
    const ctx = document.getElementById('attendanceTrendChart')?.getContext('2d');
    if (!ctx) return;

    const weeks = [];
    const presentData = [];
    const absentData = [];

    // Find reference date
    let refDateStr = getTodayISO();
    if (allAttendanceData.length > 0) {
        const dates = allAttendanceData.map(a => a.date).filter(Boolean).sort();
        if (dates.length > 0) refDateStr = dates[dates.length - 1];
    }
    const refDate = new Date(refDateStr + 'T00:00:00');
    const totalWorkers = allWorkersData.length;

    for (let i = 3; i >= 0; i--) {
        const weekEnd = new Date(refDate);
        weekEnd.setDate(weekEnd.getDate() - (i * 7));
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 7);

        const startStr = toISODate(weekStart);
        const endStr = toISODate(weekEnd);

        const weekData = allAttendanceData.filter(a => a.date >= startStr && a.date < endStr);
        
        let weekRate = 0;
        if (weekData.length > 0) {
            const uniqueDates = [...new Set(weekData.map(a => a.date))];
            let totalPossible = 0;
            let totalPresent = 0;

            uniqueDates.forEach(date => {
                const dayData = weekData.filter(a => a.date === date);
                const present = dayData.filter(a => a.status === 'Present').length;
                const totalOnDay = totalWorkers > 0 ? totalWorkers : dayData.length;
                totalPresent += present;
                totalPossible += totalOnDay;
            });

            if (totalPossible > 0) {
                weekRate = Math.round((totalPresent / totalPossible) * 100);
            }
        }

        weeks.push(`Week ${4 - i}`);
        presentData.push(weekRate);
        absentData.push(weekRate > 0 ? 100 - weekRate : 0);
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
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { usePointStyle: true, pointStyle: 'circle', padding: 20 } }
            },
            scales: {
                y: { beginAtZero: true, max: 100, ticks: { callback: (v) => v + '%' }, grid: { color: '#f1f5f9' } },
                x: { grid: { display: false } }
            }
        }
    });
}

// ============================================================
// CATEGORY CHART - REAL
// ============================================================
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
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { usePointStyle: true, pointStyle: 'circle', padding: 16, font: { size: 12 } } }
            },
            cutout: '65%'
        }
    });
}

// ============================================================
// PROJECT LIST - REAL
// ============================================================
function updateProjectList() {
    const projectList = document.getElementById('projectList');
    if (!projectList) return;

    if (allProjectsData.length === 0) {
        projectList.innerHTML = `
            <div class="project-empty">
                <i class="fa-regular fa-building"></i>
                <p>No projects found</p>
            </div>
        `;
        return;
    }

    const projectData = {};
    allProjectsData.forEach(project => {
        const projectWorkers = allWorkersData.filter(w => w.project === project.name);
        const workerIds = projectWorkers.map(w => w._id);

        const projectAttendance = allAttendanceData.filter(a =>
            workerIds.includes(a.workerId?._id || a.workerId)
        );

        const total = projectAttendance.length || 1;
        const present = projectAttendance.filter(a => a.status === 'Present').length;
        const rate = Math.round((present / total) * 100);

        projectData[project.name] = {
            rate: rate || 0,
            workerCount: projectWorkers.length,
            status: project.status || 'On Track'
        };
    });

    const sortedProjects = Object.entries(projectData).sort((a, b) => b[1].rate - a[1].rate);

    projectList.innerHTML = sortedProjects.map(([name, data]) => {
        let rateClass = 'high';
        if (data.rate < 70) rateClass = 'low';
        else if (data.rate < 85) rateClass = 'medium';

        return `
            <div class="project-item">
                <div class="project-info">
                    <span class="project-name">${name}</span>
                    <span class="project-workers">${data.workerCount} workers · ${data.status}</span>
                </div>
                <div class="project-rate-wrap">
                    <span class="project-rate ${rateClass}">${data.rate}%</span>
                    <div class="progress-track">
                        <div class="progress-fill ${rateClass}" style="width: ${data.rate}%; height: 100%;"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================================
// ATTENDANCE TABLE - REAL with FILTERS
// ============================================================
async function loadAttendanceTable(page = 1) {
    try {
        const search = (document.getElementById('globalSearch')?.value || '').toLowerCase();
        const startDate = document.getElementById('filterStartDate')?.value || '';
        const endDate = document.getElementById('filterEndDate')?.value || '';
        const reportType = document.getElementById('filterReportType')?.value || 'all';

        let filteredData = [...allAttendanceData];

        if (search) {
            filteredData = filteredData.filter(att => {
                const worker = att.workerId || {};
                return worker.name?.toLowerCase().includes(search) ||
                       worker.workerId?.toLowerCase().includes(search) ||
                       worker.category?.toLowerCase().includes(search) ||
                       worker.project?.toLowerCase().includes(search);
            });
        }

        if (startDate && endDate) {
            filteredData = filteredData.filter(att => att.date >= startDate && att.date <= endDate);
        }

        if (reportType === 'daily') {
            const t = getTodayISO();
            filteredData = filteredData.filter(att => att.date === t);
        } else if (reportType === 'weekly') {
            let refStr = getTodayISO();
            if (allAttendanceData.length > 0) {
                const dates = allAttendanceData.map(a => a.date).filter(Boolean).sort();
                if (dates.length > 0) refStr = dates[dates.length - 1];
            }
            const d = new Date(refStr); d.setDate(d.getDate() - 7);
            filteredData = filteredData.filter(att => att.date >= toISODate(d));
        } else if (reportType === 'monthly') {
            let refStr = getTodayISO();
            if (allAttendanceData.length > 0) {
                const dates = allAttendanceData.map(a => a.date).filter(Boolean).sort();
                if (dates.length > 0) refStr = dates[dates.length - 1];
            }
            const d = new Date(refStr); d.setDate(d.getDate() - 30);
            filteredData = filteredData.filter(att => att.date >= toISODate(d));
        }

        filteredData.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

        totalItems = filteredData.length;
        totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
        if (page > totalPages) page = totalPages;
        if (page < 1) page = 1;
        currentPage = page;

        const start = (page - 1) * itemsPerPage;
        const end = Math.min(start + itemsPerPage, totalItems);
        const paginatedData = filteredData.slice(start, end);

        const tbody = document.getElementById('attendanceTableBody');
        if (tbody) {
            if (paginatedData.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="9" style="text-align: center; padding: 40px; color: var(--text-muted);">
                            <i class="fa-regular fa-calendar-xmark" style="font-size: 32px; display: block; margin-bottom: 8px;"></i>
                            No attendance records found
                        </td>
                    </tr>
                `;
            } else {
                tbody.innerHTML = paginatedData.map((att, idx) => {
                    const worker = att.workerId || {};
                    const statusClass = (att.status || 'Absent').toLowerCase().replace(' ', '-');
                    return `
                        <tr>
                            <td>${start + idx + 1}</td>
                            <td><strong>${worker.name || 'Unknown'}</strong></td>
                            <td>${worker.workerId || 'N/A'}</td>
                            <td>${worker.category || 'N/A'}</td>
                            <td>${worker.project || 'N/A'}</td>
                            <td>${formatDate(att.date)}</td>
                            <td>${att.checkIn || '--:--'}</td>
                            <td>${att.checkOut || '--:--'}</td>
                            <td><span class="status-badge ${statusClass}">${att.status || 'Absent'}</span></td>
                        </tr>
                    `;
                }).join('');
            }
        }

        const startEntry = totalItems === 0 ? 0 : start + 1;
        const endEntry = Math.min(end, totalItems);
        document.getElementById('tableInfo').textContent = totalItems === 0
            ? 'No entries found'
            : `Showing ${startEntry} to ${endEntry} of ${totalItems} entries`;

        document.getElementById('currentPageDisplay').textContent = page;
        document.getElementById('prevPage').disabled = page <= 1;
        document.getElementById('nextPage').disabled = page >= totalPages || totalPages === 0;

    } catch (error) {
        console.error('Error loading attendance table:', error);
    }
}

// ============================================================
// RECENT REPORTS
// ============================================================
function updateRecentReports() {
    const reportsList = document.getElementById('reportsList');
    if (!reportsList) return;

    if (allReportsData.length === 0) {
        reportsList.innerHTML = `
            <div class="report-item">
                <div class="report-info">
                    <i class="fa-regular fa-file-pdf"></i>
                    <div class="report-details">
                        <h4>No reports generated yet</h4>
                        <p>Click "Generate New Report" to create one</p>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    reportsList.innerHTML = allReportsData.slice(0, 10).map((report, index) => `
        <div class="report-item">
            <div class="report-info">
                <i class="${report.icon || 'fa-regular fa-file-pdf'}"></i>
                <div class="report-details">
                    <h4>${report.name}</h4>
                    <p>${report.type || 'Report'} · ${report.site || 'All sites'} · ${report.size || 'N/A'}</p>
                    <small>Generated: ${report.date || ''}</small>
                </div>
            </div>
            <div class="report-actions">
                <button class="download-btn" onclick="downloadReport(${index})">
                    <i class="fa-solid fa-download"></i> Download
                </button>
                <button class="delete-btn" onclick="deleteReport(${index})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// ============================================================
// GENERATE REPORT
// ============================================================
function generateReport(type, startDate, endDate, site) {
    const typeMap = {
        daily: 'Daily Attendance',
        weekly: 'Weekly Summary',
        monthly: 'Monthly Payroll',
        custom: 'Custom Report'
    };

    let filtered = allAttendanceData.filter(a => {
        const dateMatch = (!startDate || a.date >= startDate) && (!endDate || a.date <= endDate);
        const worker = a.workerId || {};
        const siteMatch = site === 'all' || worker.project === site;
        return dateMatch && siteMatch;
    });

    const report = {
        name: `${typeMap[type]} — ${formatDateDisplay(startDate)} to ${formatDateDisplay(endDate)}`,
        type: typeMap[type],
        site: site === 'all' ? 'All sites' : site,
        size: (filtered.length * 0.2).toFixed(1) + ' KB',
        icon: 'fa-regular fa-file-pdf',
        date: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
        startDate,
        endDate,
        siteValue: site,
        recordCount: filtered.length
    };

    allReportsData.unshift(report);
    localStorage.setItem('areports', JSON.stringify(allReportsData));

    document.getElementById('reportModal').style.display = 'none';
    document.getElementById('reportForm').reset();
    updateRecentReports();
    showToast(`✅ ${report.name} generated (${filtered.length} records)`, 'success');
}

// ============================================================
// DOWNLOAD REPORT
// ============================================================
function downloadReport(index) {
    if (!allReportsData[index]) return;
    const report = allReportsData[index];

    try {
        let filtered = allAttendanceData.filter(a => {
            const dateMatch = (!report.startDate || a.date >= report.startDate) && (!report.endDate || a.date <= report.endDate);
            const worker = a.workerId || {};
            const siteMatch = report.siteValue === 'all' || worker.project === report.siteValue;
            return dateMatch && siteMatch;
        });

        let csv = `Report: ${report.name}\nType: ${report.type}\nSite: ${report.site}\nGenerated: ${report.date}\nRecords: ${filtered.length}\n\n`;
        csv += "Worker Name,Worker ID,Category,Project,Date,Check In,Check Out,Status\n";

        filtered.forEach(a => {
            const w = a.workerId || {};
            csv += `"${w.name || ''}","${w.workerId || ''}","${w.category || ''}","${w.project || ''}","${a.date || ''}","${a.checkIn || ''}","${a.checkOut || ''}","${a.status || ''}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${report.name.replace(/\s/g, '_')}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);

        showToast(`✅ Downloaded ${filtered.length} records`, 'success');
    } catch (err) {
        showToast('❌ Download failed', 'error');
    }
}

// ============================================================
// DELETE REPORT
// ============================================================
function deleteReport(index) {
    if (!confirm('Delete this report?')) return;
    if (allReportsData[index]) {
        allReportsData.splice(index, 1);
        localStorage.setItem('areports', JSON.stringify(allReportsData));
        updateRecentReports();
        showToast('✅ Report deleted', 'success');
    }
}

// ============================================================
// EXPORT ALL DATA
// ============================================================
function exportAllData() {
    try {
        let csv = `SITEFORCE DATA EXPORT\nExported: ${new Date().toLocaleString()}\n\n`;

        csv += "WORKERS\nName,Worker ID,Phone,Category,Project,Status\n";
        allWorkersData.forEach(w => {
            csv += `"${w.name}","${w.workerId || ''}","${w.phone || ''}","${w.category || ''}","${w.project || ''}","${w.status || ''}"\n`;
        });

        csv += "\nADMINS\nName,Admin ID,Role,Project,Status\n";
        allAdminsData.forEach(a => {
            csv += `"${a.name}","${a.adminId || ''}","${a.role || ''}","${a.project || ''}","${a.status || ''}"\n`;
        });

        csv += "\nATTENDANCE\nWorker,Date,Check In,Check Out,Status\n";
        allAttendanceData.forEach(a => {
            const w = a.workerId || {};
            csv += `"${w.name || ''}","${a.date || ''}","${a.checkIn || ''}","${a.checkOut || ''}","${a.status || ''}"\n`;
        });

        csv += "\nPAYROLL\nWorker,Net Salary,Status,Month,Year\n";
        allPayrollData.forEach(p => {
            csv += `"${p.name || ''}","${p.netSalary || 0}","${p.status || ''}","${p.month || ''}","${p.year || ''}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `siteforce_full_export_${getTodayISO()}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);

        showToast('✅ Full data exported!', 'success');
    } catch (e) {
        showToast('❌ Export failed', 'error');
    }
}

// ============================================================
// EXPORT TABLE
// ============================================================
function exportTableData() {
    try {
        const search = (document.getElementById('globalSearch')?.value || '').toLowerCase();
        const startDate = document.getElementById('filterStartDate')?.value || '';
        const endDate = document.getElementById('filterEndDate')?.value || '';
        const reportType = document.getElementById('filterReportType')?.value || 'all';

        let filtered = [...allAttendanceData];

        if (search) {
            filtered = filtered.filter(att => {
                const w = att.workerId || {};
                return w.name?.toLowerCase().includes(search) ||
                       w.workerId?.toLowerCase().includes(search) ||
                       w.category?.toLowerCase().includes(search) ||
                       w.project?.toLowerCase().includes(search);
            });
        }
        if (startDate && endDate) filtered = filtered.filter(a => a.date >= startDate && a.date <= endDate);

        if (reportType === 'daily') {
            const t = getTodayISO();
            filtered = filtered.filter(a => a.date === t);
        } else if (reportType === 'weekly') {
            let refStr = getTodayISO();
            if (allAttendanceData.length > 0) {
                const dates = allAttendanceData.map(a => a.date).filter(Boolean).sort();
                if (dates.length > 0) refStr = dates[dates.length - 1];
            }
            const d = new Date(refStr); d.setDate(d.getDate() - 7);
            filtered = filtered.filter(a => a.date >= toISODate(d));
        } else if (reportType === 'monthly') {
            let refStr = getTodayISO();
            if (allAttendanceData.length > 0) {
                const dates = allAttendanceData.map(a => a.date).filter(Boolean).sort();
                if (dates.length > 0) refStr = dates[dates.length - 1];
            }
            const d = new Date(refStr); d.setDate(d.getDate() - 30);
            filtered = filtered.filter(a => a.date >= toISODate(d));
        }

        if (filtered.length === 0) {
            showToast('No data to export', 'error');
            return;
        }

        let csv = "Worker Name,Worker ID,Category,Project,Date,Check In,Check Out,Status\n";
        filtered.forEach(a => {
            const w = a.workerId || {};
            csv += `"${w.name || ''}","${w.workerId || ''}","${w.category || ''}","${w.project || ''}","${a.date || ''}","${a.checkIn || ''}","${a.checkOut || ''}","${a.status || ''}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `attendance_table_${getTodayISO()}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);

        showToast(`✅ Exported ${filtered.length} records!`, 'success');
    } catch (e) {
        showToast('❌ Export failed', 'error');
    }
}

// ============================================================
// PRINT
// ============================================================
function printTable() {
    window.print();
}

// ============================================================
// NOTIFICATIONS
// ============================================================
async function loadNotifications() {
    try {
        const res = await fetch('/api/admins/notifications');
        const notifications = await res.json();

        const list = document.getElementById('notificationList');
        if (!list) return;

        const badge = document.getElementById('notificationBadge');

        if (notifications && notifications.length > 0) {
            const unread = notifications.filter(n => !n.read).length;
            if (badge) {
                if (unread > 0) {
                    badge.textContent = unread;
                    badge.style.display = 'flex';
                    badge.classList.add('has-notification');
                } else {
                    badge.textContent = '0';
                    badge.style.display = 'none';
                }
            }

            list.innerHTML = notifications.slice(0, 20).map(n => `
                <div class="notification-item ${n.read ? 'read' : 'unread'}" onclick="markNotificationRead('${n._id}')">
                    <div class="notif-icon ${n.type || 'updated'}">
                        <i class="${getNotificationIcon(n.type)}"></i>
                    </div>
                    <div class="notif-content">
                        <p>${n.message}</p>
                        <small>${formatTimeAgo(n.timestamp)}</small>
                    </div>
                    ${!n.read ? '<span class="notif-dot"></span>' : ''}
                </div>
            `).join('');
        } else {
            list.innerHTML = `
                <div class="no-notifications">
                    <i class="fa-regular fa-bell-slash"></i>
                    <p>No notifications</p>
                </div>
            `;
            if (badge) {
                badge.textContent = '0';
                badge.style.display = 'none';
            }
        }
    } catch (err) {
        const list = document.getElementById('notificationList');
        if (list) {
            list.innerHTML = `
                <div class="no-notifications">
                    <i class="fa-solid fa-exclamation-circle"></i>
                    <p>Failed to load</p>
                </div>
            `;
        }
    }
}

function getNotificationIcon(type) {
    return { created: 'fa-plus-circle', updated: 'fa-pen', deleted: 'fa-trash', status_changed: 'fa-exchange-alt' }[type] || 'fa-bell';
}

function markNotificationRead() {
    document.querySelectorAll('.notification-item').forEach(item => {
        item.classList.remove('unread');
        item.classList.add('read');
        const dot = item.querySelector('.notif-dot');
        if (dot) dot.remove();
    });
    const badge = document.getElementById('notificationBadge');
    if (badge) { badge.textContent = '0'; badge.style.display = 'none'; }
    setTimeout(() => document.getElementById('notificationDropdown')?.classList.remove('show'), 1000);
}

function markAllRead() {
    document.querySelectorAll('.notification-item.unread').forEach(item => {
        item.classList.remove('unread');
        item.classList.add('read');
        const dot = item.querySelector('.notif-dot');
        if (dot) dot.remove();
    });
    const badge = document.getElementById('notificationBadge');
    if (badge) { badge.textContent = '0'; badge.style.display = 'none'; }
    showToast('✅ All notifications marked as read', 'success');
}

// ============================================================
// DOM READY
// ============================================================
document.addEventListener('DOMContentLoaded', function () {

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.name) {
        window.location.href = '/';
        return;
    }

    document.getElementById('userName').textContent = user.name;
    const profileImg = document.querySelector('.profile img');
    if (profileImg) profileImg.src = `https://ui-avatars.com/api/?name=${user.name}&background=7c3aed&color=fff`;

    const dateEl = document.getElementById('currentDate');
    if (dateEl) {
        dateEl.textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        }) + ' · All sites';
    }

    // Default filter dates
    const w = new Date(); w.setDate(w.getDate() - 7);
    document.getElementById('filterStartDate').value = w.toISOString().split('T')[0];
    document.getElementById('filterEndDate').value = getTodayISO();

    // Navigation
    document.getElementById('admindashBtn')?.addEventListener('click', e => { e.preventDefault(); window.location.href = '/admin-dashboard'; });
    document.getElementById('workersmangBtn')?.addEventListener('click', e => { e.preventDefault(); window.location.href = '/workersmang'; });
    document.getElementById('workerattendBtn')?.addEventListener('click', e => { e.preventDefault(); window.location.href = '/workerattend'; });
    document.getElementById('aprojectsBtn')?.addEventListener('click', e => { e.preventDefault(); window.location.href = '/kaam'; });
    document.getElementById('wpayrollBtn')?.addEventListener('click', e => { e.preventDefault(); window.location.href = '/wpayroll'; });
    document.getElementById('logoutBtn')?.addEventListener('click', e => {
        e.preventDefault();
        if (confirm('Logout?')) { localStorage.removeItem('user'); window.location.href = '/'; }
    });
    document.querySelector('.profile')?.addEventListener('click', () => {
        if (confirm('Logout?')) { localStorage.removeItem('user'); window.location.href = '/'; }
    });
    document.getElementById('settingsBtnTop')?.addEventListener('click', () => window.location.href = '/settings');

    // Notification dropdown
    const notificationBtn = document.getElementById('notificationBtn');
    const dropdown = document.createElement('div');
    dropdown.className = 'notification-dropdown';
    dropdown.id = 'notificationDropdown';
    dropdown.innerHTML = `
        <div class="dropdown-header">
            <h4>Notifications</h4>
            <button onclick="markAllRead()">Mark all read</button>
        </div>
        <div id="notificationList"><div class="no-notifications">Loading...</div></div>
    `;
    document.querySelector('.top-right').appendChild(dropdown);

    notificationBtn?.addEventListener('click', e => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
        if (dropdown.classList.contains('show')) loadNotifications();
    });

    document.addEventListener('click', e => {
        if (!dropdown.contains(e.target) && e.target !== notificationBtn) dropdown.classList.remove('show');
    });

    // Search
    document.getElementById('globalSearch')?.addEventListener('input', () => loadAttendanceTable(1));

    // Filters
    document.getElementById('applyFilterBtn')?.addEventListener('click', () => loadAttendanceTable(1));
    document.getElementById('resetFilterBtn')?.addEventListener('click', () => {
        const w = new Date(); w.setDate(w.getDate() - 7);
        document.getElementById('filterStartDate').value = w.toISOString().split('T')[0];
        document.getElementById('filterEndDate').value = getTodayISO();
        document.getElementById('filterReportType').value = 'all';
        document.getElementById('globalSearch').value = '';
        loadAttendanceTable(1);
    });

    // Pagination
    document.getElementById('prevPage')?.addEventListener('click', () => {
        if (currentPage > 1) { currentPage--; loadAttendanceTable(currentPage); }
    });
    document.getElementById('nextPage')?.addEventListener('click', () => {
        if (currentPage < totalPages) { currentPage++; loadAttendanceTable(currentPage); }
    });

    // Generate Report Modal
    const modal = document.getElementById('reportModal');
    document.getElementById('generateReportBtn')?.addEventListener('click', () => {
        modal.style.display = 'block';
        const w = new Date(); w.setDate(w.getDate() - 7);
        document.getElementById('reportStartDate').value = w.toISOString().split('T')[0];
        document.getElementById('reportEndDate').value = getTodayISO();

        const select = document.getElementById('reportSite');
        let opts = '<option value="all">All Sites</option>';
        allProjectsData.forEach(p => { opts += `<option value="${p.name}">${p.name}</option>`; });
        select.innerHTML = opts;
    });

    document.querySelector('.close')?.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });

    document.getElementById('reportForm')?.addEventListener('submit', e => {
        e.preventDefault();
        generateReport(
            document.getElementById('reportType').value,
            document.getElementById('reportStartDate').value,
            document.getElementById('reportEndDate').value,
            document.getElementById('reportSite').value
        );
    });

    // Export & Refresh
    document.getElementById('exportAllBtn')?.addEventListener('click', exportAllData);
    document.getElementById('refreshBtn')?.addEventListener('click', function () {
        const btn = this;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Refreshing...';
        btn.disabled = true;
        loadAllData().then(() => {
            btn.innerHTML = '<i class="fa-solid fa-sync"></i> Refresh';
            btn.disabled = false;
            showToast('✅ Data refreshed!', 'success');
        }).catch(() => {
            btn.innerHTML = '<i class="fa-solid fa-sync"></i> Refresh';
            btn.disabled = false;
            showToast('❌ Refresh failed', 'error');
        });
    });

    // Initial load
    loadAllData();
    loadNotifications();
    setInterval(loadAllData, 60000);
    setInterval(loadNotifications, 30000);
});

// ============================================================
// GLOBALS
// ============================================================
window.downloadReport = downloadReport;
window.deleteReport = deleteReport;
window.exportAllData = exportAllData;
window.exportTableData = exportTableData;
window.printTable = printTable;
window.markAllRead = markAllRead;
window.markNotificationRead = markNotificationRead;
window.generateReport = generateReport;
window.showToast = showToast;
window.loadNotifications = loadNotifications;
window.loadAllData = loadAllData;