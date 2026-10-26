// ============================================================
// WPAYROLL - COMPLETE REAL-TIME VERSION
// ============================================================

let currentPage = 1;
const itemsPerPage = 8;
let totalItems = 0;
let totalPages = 1;
let allPayrollData = [];
let allWorkers = [];
let allProjectsData = [];

// ============================================================
// TOAST NOTIFICATION
// ============================================================
function showToast(message, type = 'success') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 50);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 400);
    }, 3000);
}

// ============================================================
// DATE HELPERS
// ============================================================
function getTodayISO() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
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
// NOTIFICATIONS
// ============================================================
async function loadNotifications() {
    try {
        const response = await fetch('/api/admins/notifications');
        const notifications = await response.json();
        
        const list = document.getElementById('notificationList');
        if (!list) return;
        
        const badge = document.getElementById('notificationBadge');
        
        if (notifications && notifications.length > 0) {
            const unreadCount = notifications.filter(n => !n.read).length;
            if (badge) {
                badge.textContent = unreadCount;
                badge.style.display = unreadCount > 0 ? 'flex' : 'none';
                if (unreadCount > 0) badge.classList.add('has-notification');
                else badge.classList.remove('has-notification');
            }
            
            list.innerHTML = notifications.slice(0, 20).map(notif => `
                <div class="notification-item ${notif.read ? 'read' : 'unread'}" onclick="markNotificationRead('${notif._id}')">
                    <div class="notif-icon ${notif.type || 'updated'}">
                        <i class="${getNotificationIcon(notif.type)}"></i>
                    </div>
                    <div class="notif-content">
                        <p>${notif.message}</p>
                        <small>${formatTimeAgo(notif.timestamp)}</small>
                    </div>
                    ${!notif.read ? '<span class="notif-dot"></span>' : ''}
                </div>
            `).join('');
        } else {
            list.innerHTML = `<div class="no-notifications"><i class="fa-regular fa-bell-slash"></i><p>No notifications</p></div>`;
            if (badge) { badge.textContent = '0'; badge.style.display = 'none'; }
        }
    } catch (error) {
        const list = document.getElementById('notificationList');
        if (list) list.innerHTML = `<div class="no-notifications"><i class="fa-solid fa-exclamation-circle"></i><p>Failed to load</p></div>`;
    }
}

function getNotificationIcon(type) {
    const icons = { 'created': 'fa-plus-circle', 'updated': 'fa-pen', 'deleted': 'fa-trash', 'status_changed': 'fa-exchange-alt' };
    return icons[type] || 'fa-bell';
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
// LOAD DROPDOWNS & FILTERS
// ============================================================
async function loadWorkersForDropdown() {
    try {
        const response = await fetch('/api/workers');
        allWorkers = await response.json();
        
        document.getElementById('totalWorkerCount').textContent = allWorkers.length || 0;
        document.getElementById('totalWorkers').textContent = allWorkers.length || 0;
        
        const select = document.getElementById('salaryWorker');
        if (select) {
            select.innerHTML = '<option value="">Select Worker</option>' +
                allWorkers.map(worker => `<option value="${worker._id}">${worker.name} (${worker.workerId}) - ${worker.category}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading workers:', error);
    }
}

async function loadProjectsForFilters() {
    try {
        const response = await fetch('/api/projects');
        allProjectsData = await response.json();
        
        const projectFilter = document.getElementById('projectFilter');
        if (projectFilter) {
            let options = '<option value="">All Projects</option>';
            allProjectsData.forEach(p => { options += `<option value="${p.name}">${p.name}</option>`; });
            projectFilter.innerHTML = options;
        }
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

// ============================================================
// CALCULATIONS
// ============================================================
function calculateGiveSalary() {
    const presentDays = parseInt(document.getElementById('salaryPresentDays').value) || 0;
    const dailyWage = parseInt(document.getElementById('salaryDailyWage').value) || 0;
    const overtime = parseInt(document.getElementById('salaryOvertime').value) || 0;
    const advance = parseInt(document.getElementById('salaryAdvance').value) || 0;
    
    const netSalary = (presentDays * dailyWage) + overtime - advance;
    document.getElementById('salaryNetSalary').value = `₹${netSalary.toLocaleString()}`;
    return netSalary;
}

function calculateEditSalary() {
    const presentDays = parseInt(document.getElementById('editPresentDays').value) || 0;
    const dailyWage = parseInt(document.getElementById('editDailyWage').value) || 0;
    const overtime = parseInt(document.getElementById('editOvertime').value) || 0;
    const advance = parseInt(document.getElementById('editAdvance').value) || 0;
    
    const netSalary = (presentDays * dailyWage) + overtime - advance;
    document.getElementById('editNetSalary').value = `₹${netSalary.toLocaleString()}`;
    return netSalary;
}

// ============================================================
// MODALS
// ============================================================
function openGiveSalaryModal() {
    document.getElementById('giveSalaryModal').style.display = 'block';
    document.getElementById('salaryDate').value = getTodayISO();
    
    document.getElementById('salaryPresentDays').value = 26;
    document.getElementById('salaryDailyWage').value = 750;
    document.getElementById('salaryOvertime').value = 0;
    document.getElementById('salaryAdvance').value = 0;
    document.getElementById('salaryStatus').value = 'Paid';
    
    calculateGiveSalary();
    loadWorkersForDropdown();
}

async function giveSalary() {
    const workerId = document.getElementById('salaryWorker').value;
    const date = document.getElementById('salaryDate').value;
    const presentDays = parseInt(document.getElementById('salaryPresentDays').value) || 0;
    const dailyWage = parseInt(document.getElementById('salaryDailyWage').value) || 0;
    const overtime = parseInt(document.getElementById('salaryOvertime').value) || 0;
    const advance = parseInt(document.getElementById('salaryAdvance').value) || 0;
    const netSalary = presentDays * dailyWage + overtime - advance;
    const status = document.getElementById('salaryStatus').value;

    if (!workerId) {
        showToast('Please select a worker', 'error');
        return;
    }

    const dateObj = new Date(date);
    const data = {
        workerId, date, presentDays, dailyWage, overtime, advance, netSalary, status,
        month: dateObj.toLocaleString('default', { month: 'long' }),
        year: dateObj.getFullYear()
    };

    try {
        const response = await fetch('/api/worker-payroll/give-salary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (response.ok) {
            showToast(`✅ Salary given to ${result.name} successfully!`, 'success');
            document.getElementById('giveSalaryModal').style.display = 'none';
            document.getElementById('giveSalaryForm').reset();
            
            // Set filter to the month we just added
            document.getElementById('monthFilter').value = data.month;
            document.getElementById('yearFilter').value = data.year;
            
            loadWorkerPayroll();
        } else {
            showToast(`❌ ${result.error}`, 'error');
        }
    } catch (error) {
        showToast('Error giving salary: ' + error.message, 'error');
    }
}

async function loadSalarySettings() {
    try {
        const response = await fetch('/api/worker-payroll/settings');
        const settings = await response.json();

        const grid = document.getElementById('salarySettingsGrid');
        
        const categoryIcons = {
            'Mason': 'fa-hammer', 'Electrician': 'fa-bolt', 'Welder': 'fa-fire', 'Foreman': 'fa-helmet-safety',
            'Carpenter': 'fa-hammer', 'Site Engineer': 'fa-drafting-compass', 'Plumber': 'fa-wrench',
            'Painter': 'fa-paint-roller', 'Driver': 'fa-truck'
        };

        const categoryColors = {
            'Mason': 'super-admin', 'Electrician': 'project-admin', 'Welder': 'site-admin',
            'Foreman': 'super-admin', 'Carpenter': 'project-admin', 'Site Engineer': 'super-admin',
            'Plumber': 'site-admin', 'Painter': 'project-admin', 'Driver': 'site-admin'
        };

        grid.innerHTML = settings.map(setting => `
            <div class="settings-card">
                <div class="role-icon ${categoryColors[setting.category] || 'site-admin'}">
                    <i class="fa-solid ${categoryIcons[setting.category] || 'fa-user'}"></i>
                </div>
                <div class="role-name">${setting.category}</div>
                <div class="role-desc">Daily wage for ${setting.category}</div>
                <div class="salary-display">
                    <div class="daily">Daily <span>₹${setting.dailyWage.toLocaleString()}</span></div>
                    <div class="monthly">Monthly <span>₹${(setting.dailyWage * 26).toLocaleString()}</span></div>
                </div>
                <button class="btn-edit-salary" onclick="openCategorySalaryModal('${setting.category}', ${setting.dailyWage})">
                    <i class="fa-solid fa-pen"></i> Edit Salary
                </button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading salary settings:', error);
    }
}

function openCategorySalaryModal(category, currentWage) {
    document.getElementById('categorySalaryName').value = category;
    document.getElementById('categoryDailyWage').value = currentWage;
    document.getElementById('categoryMonthlySalary').value = `₹${(currentWage * 26).toLocaleString()} / month`;
    
    document.getElementById('categoryDailyWage').oninput = function() {
        const daily = parseInt(this.value) || 0;
        document.getElementById('categoryMonthlySalary').value = `₹${(daily * 26).toLocaleString()} / month`;
    };
    
    document.getElementById('categorySalaryModal').style.display = 'block';
}

async function updateCategorySalary(category, dailyWage) {
    try {
        const response = await fetch('/api/worker-payroll/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category, dailyWage })
        });

        const data = await response.json();
        if (response.ok) {
            showToast(`✅ ${data.message}`, 'success');
            document.getElementById('categorySalaryModal').style.display = 'none';
            loadSalarySettings();
            loadWorkerPayroll();
        } else {
            showToast(`❌ ${data.error}`, 'error');
        }
    } catch (error) {
        showToast('Error updating salary settings: ' + error.message, 'error');
    }
}

function openEditSalaryModal(id) {
    fetch(`/api/worker-payroll/${id}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById('editWorkerName').value = data.name;
            document.getElementById('editWorkerCategory').value = data.category || 'Worker';
            document.getElementById('editPresentDays').value = data.presentDays || 0;
            document.getElementById('editDailyWage').value = data.dailyWage || 0;
            document.getElementById('editOvertime').value = data.overtime || 0;
            document.getElementById('editAdvance').value = data.advance || 0;
            document.getElementById('editSalaryDate').value = data.salaryDate?.split('T')[0] || '';
            document.getElementById('editStatus').value = data.status || 'Pending';
            
            calculateEditSalary();
            document.getElementById('editSalaryModal').style.display = 'block';
            document.getElementById('editSalaryForm').dataset.id = id;
        })
        .catch(error => showToast('Error loading worker data', 'error'));
}

async function updateWorkerSalary() {
    const id = document.getElementById('editSalaryForm').dataset.id;
    const presentDays = parseInt(document.getElementById('editPresentDays').value) || 0;
    const dailyWage = parseInt(document.getElementById('editDailyWage').value) || 0;
    const overtime = parseInt(document.getElementById('editOvertime').value) || 0;
    const advance = parseInt(document.getElementById('editAdvance').value) || 0;
    const netSalary = presentDays * dailyWage + overtime - advance;
    const status = document.getElementById('editStatus').value;
    const salaryDate = document.getElementById('editSalaryDate').value;

    const data = { presentDays, dailyWage, overtime, advance, netSalary, status, salaryDate };

    try {
        const response = await fetch(`/api/worker-payroll/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (response.ok) {
            showToast(`✅ Salary updated successfully for ${result.name}`, 'success');
            document.getElementById('editSalaryModal').style.display = 'none';
            loadWorkerPayroll();
        } else {
            showToast(`❌ ${result.error}`, 'error');
        }
    } catch (error) {
        showToast('Error updating salary: ' + error.message, 'error');
    }
}

// ============================================================
// LOAD WORKER PAYROLL DATA (THE ONLY FIX)
// ============================================================
async function loadWorkerPayroll() {
    try {
        const workersRes = await fetch('/api/workers');
        const allWorkersData = await workersRes.json();
        
        const search = document.getElementById('searchPayroll')?.value || '';
        const status = document.getElementById('statusFilter')?.value || '';
        const category = document.getElementById('categoryFilter')?.value || '';
        const project = document.getElementById('projectFilter')?.value || '';
        const month = document.getElementById('monthFilter')?.value || '';
        const year = document.getElementById('yearFilter')?.value || new Date().getFullYear();
        
        let url = `/api/worker-payroll?search=${search}&status=${status}&category=${category}&project=${project}`;
        
        if (month) {
            url += `&month=${month}&year=${year}`;
        } else {
            url += `&year=${year}`;
        }

        const response = await fetch(url);
        let fetchedData = await response.json();

        // ✅ FIX: Filter the data strictly on the frontend so the calendar always works
        allPayrollData = fetchedData.filter(item => {
            const itemDate = item.salaryDate ? new Date(item.salaryDate) : null;
            const itemMonth = itemDate ? itemDate.toLocaleString('default', { month: 'long' }) : item.month;
            const itemYear = itemDate ? itemDate.getFullYear().toString() : item.year?.toString();

            const monthMatches = !month || itemMonth === month;
            const yearMatches = !year || itemYear === year.toString();

            return monthMatches && yearMatches;
        });

        document.getElementById('totalWorkerCount').textContent = allWorkersData.length || 0;
        document.getElementById('totalWorkers').textContent = allWorkersData.length || 0;

        updateWorkerStats(allPayrollData, allWorkersData);

        const totalPayroll = allPayrollData.reduce((sum, p) => sum + (p.netSalary || 0), 0);
        document.getElementById('totalPayrollMini').textContent = totalPayroll > 0 ? `₹${(totalPayroll / 100000).toFixed(1)}L` : '₹0';
        document.getElementById('pendingCount').textContent = allPayrollData.filter(p => p.status === 'Pending').length;

        totalItems = allPayrollData.length;
        totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
        
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;
        
        const start = (currentPage - 1) * itemsPerPage;
        const end = Math.min(start + itemsPerPage, totalItems);
        const paginatedData = allPayrollData.slice(start, end);

        const tbody = document.getElementById('payrollTableBody');
        if (tbody) {
            if (paginatedData.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="10" style="text-align: center; padding: 40px; color: var(--text-muted);">
                            <i class="fa-solid fa-file-invoice" style="font-size: 32px; display: block; margin-bottom: 8px;"></i>
                            No worker payroll records found for ${month ? month + ' ' + year : 'this year'}.
                        </td>
                    </tr>
                `;
            } else {
                tbody.innerHTML = paginatedData.map(worker => {
                    const isPending = worker.status === 'Pending';
                    const salaryDate = worker.salaryDate ? new Date(worker.salaryDate).toLocaleDateString('en-IN') : '-';
                    
                    return `
                        <tr>
                            <td>
                                <div class="admin-info">
                                    <div class="admin-avatar">${getInitials(worker.name)}</div>
                                    <div class="admin-details">
                                        <span class="admin-name">${worker.name}</span>
                                        <span class="admin-id">${worker.workerIdNumber || worker.workerId?.workerId || 'N/A'}</span>
                                    </div>
                                </div>
                            </td>
                            <td><span class="role-badge">${worker.category || 'Worker'}</span></td>
                            <td>${worker.presentDays || 0}</td>
                            <td>₹${(worker.dailyWage || 0).toLocaleString()}</td>
                            <td>+₹${(worker.overtime || 0).toLocaleString()}</td>
                            <td>-₹${(worker.advance || 0).toLocaleString()}</td>
                            <td><strong>₹${(worker.netSalary || 0).toLocaleString()}</strong></td>
                            <td><span class="status-badge ${(worker.status || 'pending').toLowerCase()}">${worker.status || 'Pending'}</span></td>
                            <td class="salary-date">${salaryDate}</td>
                            <td>
                                <div class="action-buttons">
                                    ${isPending ? `
                                        <button class="btn-edit-salary-row" onclick="openEditSalaryModal('${worker._id}')">
                                            <i class="fa-solid fa-pen"></i> Edit
                                        </button>
                                    ` : ''}
                                    <button class="btn-view-payslip" onclick="viewWorkerPayslip('${worker._id}')">
                                        <i class="fa-solid fa-eye"></i> Payslip
                                    </button>
                                    <button class="btn-delete-payroll" onclick="deletePayrollRecord('${worker._id}')">
                                        <i class="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        }

        const startEntry = totalItems === 0 ? 0 : start + 1;
        const endEntry = Math.min(end, totalItems);
        document.getElementById('entriesInfo').textContent = 
            totalItems === 0 ? 'No entries found' : `Showing ${startEntry} to ${endEntry} of ${totalItems} entries`;

        document.getElementById('prevPage').disabled = currentPage <= 1;
        document.getElementById('nextPage').disabled = currentPage >= totalPages || totalPages === 0;

        updatePageNumbers();
        localStorage.setItem('workerPayrollPage', currentPage);

    } catch (error) {
        console.error('Error loading worker payroll:', error);
        const tbody = document.getElementById('payrollTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align: center; padding: 40px; color: var(--text-muted);">
                        <i class="fa-solid fa-exclamation-circle" style="font-size: 24px; display: block; margin-bottom: 8px;"></i>
                        Failed to load worker payroll data. Please try again.
                    </td>
                </tr>
            `;
        }
    }
}

function updatePageNumbers() {
    const container = document.getElementById('pageNumbers');
    if (!container) return;
    container.innerHTML = '';
    
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = `page-number${i === currentPage ? ' active' : ''}`;
        btn.textContent = i;
        btn.onclick = function() {
            currentPage = i;
            loadWorkerPayroll();
        };
        container.appendChild(btn);
    }
}

function updateWorkerStats(payrollData, workersData) {
    const totalWorkers = workersData ? workersData.length : 0;
    const totalPayroll = payrollData.reduce((sum, p) => sum + (p.netSalary || 0), 0);
    const pendingWorkers = payrollData.filter(p => p.status === 'Pending').length;
    const pendingAmount = payrollData.filter(p => p.status === 'Pending').reduce((sum, p) => sum + (p.netSalary || 0), 0);
    const paidWorkers = payrollData.filter(p => p.status === 'Paid').length;

    document.getElementById('totalWorkers').textContent = totalWorkers || 0;
    document.getElementById('totalPayroll').textContent = totalPayroll > 0 ? `₹${(totalPayroll / 100000).toFixed(1)}L` : '₹0';
    document.getElementById('pendingPayments').textContent = pendingAmount > 0 ? `₹${(pendingAmount / 100000).toFixed(1)}L` : '₹0';
    document.getElementById('pendingWorkers').textContent = pendingWorkers;
    document.getElementById('paidWorkers').textContent = paidWorkers;

    const monthFilter = document.getElementById('monthFilter')?.value;
    const yearFilter = document.getElementById('yearFilter')?.value || new Date().getFullYear();
    
    if (monthFilter) {
        document.getElementById('payrollMonth').textContent = `${monthFilter} ${yearFilter}`;
    } else {
        document.getElementById('payrollMonth').textContent = `All (${yearFilter})`;
    }
}

function getInitials(name) {
    if (!name) return '??';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
}

async function generateWorkerPayroll(month, year) {
    try {
        const response = await fetch('/api/worker-payroll/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ month, year })
        });

        const data = await response.json();
        if (response.ok) {
            showToast(`✅ ${data.message}`, 'success');
            document.getElementById('generateModal').style.display = 'none';
            
            document.getElementById('monthFilter').value = month;
            document.getElementById('yearFilter').value = year;
            
            loadWorkerPayroll();
        } else {
            showToast(`❌ ${data.error}`, 'error');
        }
    } catch (error) {
        showToast('Error generating worker payroll: ' + error.message, 'error');
    }
}

function generatePayroll() {
    document.getElementById('generateModal').style.display = 'block';
}

async function viewWorkerPayslip(id) {
    try {
        const response = await fetch(`/api/worker-payroll/${id}`);
        const data = await response.json();

        const payslipData = document.getElementById('payslipData');
        payslipData.innerHTML = `
            <div style="text-align: center; margin-bottom: 16px;">
                <h3 style="color: var(--blue);">SiteForce</h3>
                <p style="color: var(--text-muted);">Worker Payslip</p>
                <p style="font-size: 12px; color: var(--text-muted);">${data.month || ''} ${data.year || ''}</p>
                <p style="font-size: 12px; color: var(--text-muted);">Date: ${data.salaryDate ? new Date(data.salaryDate).toLocaleDateString('en-IN') : 'N/A'}</p>
            </div>
            <div class="payslip-row"><span class="label">Worker ID</span><span class="value">${data.workerIdNumber || data.workerId?.workerId || 'N/A'}</span></div>
            <div class="payslip-row"><span class="label">Name</span><span class="value">${data.name}</span></div>
            <div class="payslip-row"><span class="label">Category</span><span class="value">${data.category || 'Worker'}</span></div>
            <div class="payslip-row"><span class="label">Project</span><span class="value">${data.project || 'N/A'}</span></div>
            <div class="payslip-row"><span class="label">Present Days</span><span class="value">${data.presentDays || 0}</span></div>
            <div class="payslip-row"><span class="label">Daily Wage</span><span class="value">₹${(data.dailyWage || 0).toLocaleString()}</span></div>
            <div class="payslip-row"><span class="label">Basic Salary</span><span class="value">₹${((data.presentDays || 0) * (data.dailyWage || 0)).toLocaleString()}</span></div>
            <div class="payslip-row"><span class="label">Overtime</span><span class="value">+₹${(data.overtime || 0).toLocaleString()}</span></div>
            <div class="payslip-row"><span class="label">Advance Deduction</span><span class="value">-₹${(data.advance || 0).toLocaleString()}</span></div>
            <div class="payslip-total">
                <div class="payslip-row"><span class="label">Net Salary</span><span class="value">₹${(data.netSalary || 0).toLocaleString()}</span></div>
            </div>
            <div style="text-align: center; margin-top: 12px; color: var(--text-muted); font-size: 12px;">
                Status: <span class="status-badge ${(data.status || 'pending').toLowerCase()}">${data.status || 'Pending'}</span>
            </div>
        `;

        document.getElementById('payslipModal').style.display = 'block';
        document.getElementById('payslipModal').dataset.id = id;
    } catch (error) {
        showToast('Error loading payslip data', 'error');
    }
}

function downloadPayslip() {
    const id = document.getElementById('payslipModal').dataset.id;
    showToast(`📥 Downloading payslip for worker ID: ${id}`, 'success');
}

async function deletePayrollRecord(id) {
    if (!confirm('⚠️ Are you sure you want to delete this payroll record?')) return;
    try {
        const response = await fetch(`/api/worker-payroll/${id}`, { method: 'DELETE' });
        if (response.ok) {
            showToast('✅ Payroll record deleted successfully', 'success');
            loadWorkerPayroll();
        } else {
            showToast('❌ Failed to delete record', 'error');
        }
    } catch (error) {
        showToast('Error deleting record: ' + error.message, 'error');
    }
}

function exportPayroll() {
    try {
        if (allPayrollData.length === 0) {
            showToast('No data to export', 'error');
            return;
        }

        let csvContent = "Worker Name,Category,Present Days,Daily Wage,Overtime,Advance,Net Salary,Status,Date\n";
        
        allPayrollData.forEach(worker => {
            const salaryDate = worker.salaryDate ? new Date(worker.salaryDate).toLocaleDateString('en-IN') : '-';
            csvContent += `"${worker.name}","${worker.category || 'Worker'}",${worker.presentDays || 0},${worker.dailyWage || 0},${worker.overtime || 0},${worker.advance || 0},${worker.netSalary || 0},"${worker.status || 'Pending'}","${salaryDate}"\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `worker_payroll_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
        
        showToast('✅ Worker payroll exported successfully!', 'success');
    } catch (error) {
        showToast('Failed to export data', 'error');
    }
}

async function refreshData() {
    const btn = document.getElementById('refreshBtn');
    if (btn) { btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Refreshing...'; btn.disabled = true; }
    
    try {
        await Promise.all([
            loadWorkerPayroll(),
            loadSalarySettings(),
            loadWorkersForDropdown(),
            loadProjectsForFilters(),
            loadNotifications()
        ]);
        showToast('✅ Data refreshed successfully!', 'success');
    } catch (error) {
        showToast('❌ Failed to refresh data', 'error');
    } finally {
        if (btn) { btn.innerHTML = '<i class="fa-solid fa-sync"></i> Refresh'; btn.disabled = false; }
    }
}

// ============================================================
// DOM CONTENT LOADED
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.name) { window.location.href = '/'; return; }

    document.getElementById('userName').textContent = user.name;
    const profileImg = document.querySelector('.profile img');
    if (profileImg) profileImg.src = `https://ui-avatars.com/api/?name=${user.name}&background=7c3aed&color=fff`;

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateElement = document.getElementById('currentDate');
    if (dateElement) dateElement.textContent = new Date().toLocaleDateString('en-US', options) + ' · All sites';

    // Navigation
    document.getElementById('admindashBtn')?.addEventListener('click', e => { e.preventDefault(); window.location.href = '/admin-dashboard'; });
    document.getElementById('workersmangBtn')?.addEventListener('click', e => { e.preventDefault(); window.location.href = '/workersmang'; });
    document.getElementById('workerattendBtn')?.addEventListener('click', e => { e.preventDefault(); window.location.href = '/workerattend'; });
    document.getElementById('aprojectsBtn')?.addEventListener('click', e => { e.preventDefault(); window.location.href = '/kaam'; });
    document.getElementById('areportsBtn')?.addEventListener('click', e => { e.preventDefault(); window.location.href = '/areports'; });
    document.getElementById('logoutBtn')?.addEventListener('click', e => { e.preventDefault(); if (confirm('Logout?')) { localStorage.removeItem('user'); window.location.href = '/'; } });
    document.querySelector('.profile')?.addEventListener('click', () => { if (confirm('Logout?')) { localStorage.removeItem('user'); window.location.href = '/'; } });
    document.getElementById('settingsBtnTop')?.addEventListener('click', () => window.location.href = '/settings');

    // Notification Dropdown
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationDropdown = document.createElement('div');
    notificationDropdown.className = 'notification-dropdown';
    notificationDropdown.id = 'notificationDropdown';
    notificationDropdown.innerHTML = `
        <div class="dropdown-header"><h4>Notifications</h4><button onclick="markAllRead()">Mark all read</button></div>
        <div id="notificationList"><div class="no-notifications">Loading notifications...</div></div>
    `;
    document.querySelector('.top-right').appendChild(notificationDropdown);

    notificationBtn?.addEventListener('click', function(e) {
        e.stopPropagation();
        notificationDropdown.classList.toggle('show');
        if (notificationDropdown.classList.contains('show')) loadNotifications();
    });

    document.addEventListener('click', function(e) {
        if (notificationDropdown && !notificationDropdown.contains(e.target) && e.target !== notificationBtn) {
            notificationDropdown.classList.remove('show');
        }
    });

    // Modal Controls
    const modals = ['payslipModal', 'generateModal', 'editSalaryModal', 'giveSalaryModal', 'categorySalaryModal'];
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', function() {
            modals.forEach(id => { const m = document.getElementById(id); if(m) m.style.display = 'none'; });
        });
    });

    window.addEventListener('click', function(e) {
        modals.forEach(id => { const m = document.getElementById(id); if (e.target === m) m.style.display = 'none'; });
    });

    // Forms
    document.getElementById('generateForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        generateWorkerPayroll(document.getElementById('payrollMonthSelect').value, document.getElementById('payrollYear').value);
    });

    document.getElementById('categorySalaryForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        updateCategorySalary(document.getElementById('categorySalaryName').value, parseInt(document.getElementById('categoryDailyWage').value));
    });

    // Real-time Calculations
    ['salaryPresentDays', 'salaryDailyWage', 'salaryOvertime', 'salaryAdvance'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', calculateGiveSalary);
    });
    ['editPresentDays', 'editDailyWage', 'editOvertime', 'editAdvance'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', calculateEditSalary);
    });

    // Submit Forms
    document.getElementById('giveSalaryForm')?.addEventListener('submit', function(e) { e.preventDefault(); giveSalary(); });
    document.getElementById('editSalaryForm')?.addEventListener('submit', function(e) { e.preventDefault(); updateWorkerSalary(); });

    // Filters & Search
    ['searchPayroll', 'statusFilter', 'categoryFilter', 'projectFilter', 'monthFilter', 'yearFilter'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', () => { currentPage = 1; loadWorkerPayroll(); });
        document.getElementById(id)?.addEventListener('change', () => { currentPage = 1; loadWorkerPayroll(); });
    });

    document.getElementById('globalSearch')?.addEventListener('input', function() {
        document.getElementById('searchPayroll').value = this.value;
        currentPage = 1; loadWorkerPayroll();
    });

    // Pagination & Refresh
    document.getElementById('prevPage')?.addEventListener('click', () => { if (currentPage > 1) { currentPage--; loadWorkerPayroll(); } });
    document.getElementById('nextPage')?.addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; loadWorkerPayroll(); } });
    document.getElementById('refreshBtn')?.addEventListener('click', refreshData);

    // Initial Load
    loadWorkersForDropdown();
    loadSalarySettings();
    loadWorkerPayroll();
    loadProjectsForFilters();
    loadNotifications();

    setInterval(() => { loadWorkerPayroll(); loadNotifications(); }, 60000);

    console.log('✅ SiteForce Worker Payroll Management initialized!');
});

window.openGiveSalaryModal = openGiveSalaryModal;
window.generatePayroll = generatePayroll;
window.exportPayroll = exportPayroll;
window.openEditSalaryModal = openEditSalaryModal;
window.viewWorkerPayslip = viewWorkerPayslip;
window.downloadPayslip = downloadPayslip;
window.deletePayrollRecord = deletePayrollRecord;
window.openCategorySalaryModal = openCategorySalaryModal;
window.updateCategorySalary = updateCategorySalary;
window.markAllRead = markAllRead;
window.markNotificationRead = markNotificationRead;
window.loadWorkerPayroll = loadWorkerPayroll;
window.refreshData = refreshData;
window.showToast = showToast;