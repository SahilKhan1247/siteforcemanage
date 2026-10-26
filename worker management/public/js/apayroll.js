// ============================================================
// ADMIN PAYROLL - COMPLETE REAL-TIME VERSION
// ============================================================

let currentPage = 1;
const itemsPerPage = 8;
let totalItems = 0;
let totalPages = 1;
let allPayrollData = [];
let allAdmins = [];

// ============================================================
// ✅ CUSTOM TOAST (same as owner-dashboard)
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
// ALIAS (so existing showToast(...) calls keep working)
// ============================================================
function showToast(message, type = 'success') {
    showCustomToast(message, type);
}

// ============================================================
// DOM CONTENT LOADED
// ============================================================
document.addEventListener('DOMContentLoaded', function() {

    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.name) {
        window.location.href = '/';
        return;
    }

    // Set user name in profile
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = user.name;
    }

    // Update profile image
    const profileImg = document.querySelector('.profile img');
    if (profileImg) {
        profileImg.src = `https://ui-avatars.com/api/?name=${user.name}&background=7c3aed&color=fff`;
    }

    // Set current date
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    const today = new Date();
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        dateElement.textContent = today.toLocaleDateString('en-US', options) + ' · All sites';
    }

    // ============================================================
    // NAVIGATION
    // ============================================================
    document.getElementById('ownerdashBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = '/owner-dashboard';
    });

    document.getElementById('adminsmanBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = '/adminsmang';
    });

    document.getElementById('adminattendanceBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = '/adminattend';
    });

    document.getElementById('projectsBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = '/projects';
    });

    document.getElementById('reportsBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = '/reports';
    });

    document.getElementById('settingsBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = '/settings';
    });

    document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('user');
            window.location.href = '/';
        }
    });

    // Settings button in topbar
    document.getElementById('settingsBtnTop')?.addEventListener('click', function() {
        window.location.href = '/settings';
    });

    // Profile click - logout
    document.querySelector('.profile')?.addEventListener('click', function() {
        if (confirm('Do you want to logout?')) {
            localStorage.removeItem('user');
            window.location.href = '/';
        }
    });

    // ============================================================
    // ✅ NOTIFICATION DROPDOWN - SAME AS OWNER DASHBOARD
    // ============================================================
    const notificationBtn = document.querySelector('.notification');

    const notificationDropdown = document.createElement('div');
    notificationDropdown.className = 'notification-dropdown';
    notificationDropdown.id = 'notificationDropdown';
    notificationDropdown.innerHTML = `
        <div class="dropdown-header">
            <h4>Notifications</h4>
            <div id="notifHeaderButtons" style="display: none; gap: 8px;">
                <button onclick="markAllRead()" style="color: var(--blue); background: none; border: none; cursor: pointer; font-weight: 600;">Mark all read</button>
                <button onclick="clearAllNotifications()" style="color: var(--red); background: none; border: none; cursor: pointer; font-weight: 600;">Clear All</button>
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
        if (dropdown.classList.contains('show')) {
            loadNotifications();
        }
    });

    document.addEventListener('click', function(e) {
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown && !dropdown.contains(e.target) && e.target !== notificationBtn) {
            dropdown.classList.remove('show');
        }
    });

    // ============================================================
    // MODAL CONTROLS
    // ============================================================
    const payslipModal = document.getElementById('payslipModal');
    const generateModal = document.getElementById('generateModal');
    const editSalaryModal = document.getElementById('editSalaryModal');
    const giveSalaryModal = document.getElementById('giveSalaryModal');
    const salaryModal = document.getElementById('salaryModal');
    const closeBtns = document.querySelectorAll('.close');

    closeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            payslipModal.style.display = 'none';
            generateModal.style.display = 'none';
            editSalaryModal.style.display = 'none';
            giveSalaryModal.style.display = 'none';
            salaryModal.style.display = 'none';
        });
    });

    window.addEventListener('click', function(e) {
        if (e.target === payslipModal) payslipModal.style.display = 'none';
        if (e.target === generateModal) generateModal.style.display = 'none';
        if (e.target === editSalaryModal) editSalaryModal.style.display = 'none';
        if (e.target === giveSalaryModal) giveSalaryModal.style.display = 'none';
        if (e.target === salaryModal) salaryModal.style.display = 'none';
    });

    // ============================================================
    // GENERATE PAYROLL FORM
    // ============================================================
    document.getElementById('generateForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const month = document.getElementById('payrollMonthSelect').value;
        const year = document.getElementById('payrollYear').value;
        generateAdminPayroll(month, year);
    });

    // ============================================================
    // GIVE SALARY FORM - REAL-TIME CALCULATION
    // ============================================================
    document.getElementById('salaryPresentDays')?.addEventListener('input', calculateGiveSalary);
    document.getElementById('salaryDailyWage')?.addEventListener('input', calculateGiveSalary);
    document.getElementById('salaryOvertime')?.addEventListener('input', calculateGiveSalary);
    document.getElementById('salaryAdvance')?.addEventListener('input', calculateGiveSalary);

    document.getElementById('giveSalaryForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        giveSalary();
    });

    // ============================================================
    // EDIT SALARY FORM - REAL-TIME CALCULATION
    // ============================================================
    document.getElementById('editPresentDays')?.addEventListener('input', calculateEditSalary);
    document.getElementById('editDailyWage')?.addEventListener('input', calculateEditSalary);
    document.getElementById('editOvertime')?.addEventListener('input', calculateEditSalary);
    document.getElementById('editAdvance')?.addEventListener('input', calculateEditSalary);

    document.getElementById('editSalaryForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        updateAdminSalary();
    });

    // ============================================================
    // SALARY SETTINGS FORM
    // ============================================================
    document.getElementById('salaryForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const role = document.getElementById('salaryRole').value;
        const dailyWage = parseInt(document.getElementById('salaryDailyWage').value);
        updateSalarySettings(role, dailyWage);
    });

    // ============================================================
    // SEARCH AND FILTERS (✅ month/year now included)
    // ============================================================
    ['searchPayroll', 'statusFilter', 'roleFilter', 'projectFilter', 'monthFilter', 'yearFilter'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', () => { currentPage = 1; loadAdminPayroll(); });
        document.getElementById(id)?.addEventListener('change', () => { currentPage = 1; loadAdminPayroll(); });
    });

    document.getElementById('globalSearch')?.addEventListener('input', function() {
        document.getElementById('searchPayroll').value = this.value;
        currentPage = 1;
        loadAdminPayroll();
    });

    // ============================================================
    // PAGINATION
    // ============================================================
    document.getElementById('prevPage')?.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            loadAdminPayroll();
        }
    });

    document.getElementById('nextPage')?.addEventListener('click', function() {
        if (currentPage < totalPages) {
            currentPage++;
            loadAdminPayroll();
        }
    });

    // ============================================================
    // REFRESH BUTTON
    // ============================================================
    document.getElementById('refreshBtn')?.addEventListener('click', function() {
        const btn = this;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Refreshing...';
        btn.disabled = true;

        loadAdminPayroll().then(() => {
            btn.innerHTML = '<i class="fa-solid fa-sync"></i> Refresh';
            btn.disabled = false;
            showToast('✅ Data refreshed successfully!', 'success');
        }).catch(() => {
            btn.innerHTML = '<i class="fa-solid fa-sync"></i> Refresh';
            btn.disabled = false;
            showToast('❌ Failed to refresh data', 'error');
        });
    });

    // ============================================================
    // LOAD ALL DATA
    // ============================================================
    loadSalarySettings();
    loadAdminPayroll();
    loadAdminsForDropdown();
    loadProjectsForFilters();

    // ✅ NEW LINE: load notifications on page load (fixes invisible badge + list)
    loadNotifications();

    // Auto-refresh every 60 seconds
    setInterval(() => {
        loadAdminPayroll();
    }, 60000);

    // ✅ Notification polling every 10 seconds (like owner dashboard)
    setInterval(loadNotifications, 10000);
});

// ============================================================
// LOAD PROJECTS FOR FILTERS
// ============================================================
async function loadProjectsForFilters() {
    try {
        const response = await fetch('/api/projects');
        const projects = await response.json();

        const projectFilter = document.getElementById('projectFilter');
        if (projectFilter) {
            let options = '<option value="">All Projects</option>';
            projects.forEach(p => {
                options += `<option value="${p.name}">${p.name}</option>`;
            });
            projectFilter.innerHTML = options;
        }
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

// ============================================================
// LOAD ADMINS FOR DROPDOWN
// ============================================================
async function loadAdminsForDropdown() {
    try {
        const response = await fetch('/api/admins');
        allAdmins = await response.json();

        const select = document.getElementById('salaryAdmin');
        if (select) {
            select.innerHTML = '<option value="">Select Admin</option>' +
                allAdmins.map(admin =>
                    `<option value="${admin._id}">${admin.name} (${admin.adminId}) - ${admin.role}</option>`
                ).join('');
        }
    } catch (error) {
        console.error('Error loading admins:', error);
    }
}

// ============================================================
// CALCULATE GIVE SALARY
// ============================================================
function calculateGiveSalary() {
    const presentDays = parseInt(document.getElementById('salaryPresentDays').value) || 0;
    const dailyWage = parseInt(document.getElementById('salaryDailyWage').value) || 0;
    const overtime = parseInt(document.getElementById('salaryOvertime').value) || 0;
    const advance = parseInt(document.getElementById('salaryAdvance').value) || 0;

    const basicSalary = presentDays * dailyWage;
    const netSalary = basicSalary + overtime - advance;

    document.getElementById('salaryNetSalary').value = `₹${netSalary.toLocaleString()}`;
    return netSalary;
}

// ============================================================
// CALCULATE EDIT SALARY
// ============================================================
function calculateEditSalary() {
    const presentDays = parseInt(document.getElementById('editPresentDays').value) || 0;
    const dailyWage = parseInt(document.getElementById('editDailyWage').value) || 0;
    const overtime = parseInt(document.getElementById('editOvertime').value) || 0;
    const advance = parseInt(document.getElementById('editAdvance').value) || 0;

    const basicSalary = presentDays * dailyWage;
    const netSalary = basicSalary + overtime - advance;

    document.getElementById('editNetSalary').value = `₹${netSalary.toLocaleString()}`;
    return netSalary;
}

// ============================================================
// OPEN GIVE SALARY MODAL
// ============================================================
function openGiveSalaryModal() {
    document.getElementById('giveSalaryModal').style.display = 'block';
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('salaryDate').value = today;

    document.getElementById('salaryPresentDays').value = 26;
    document.getElementById('salaryDailyWage').value = 1500;
    document.getElementById('salaryOvertime').value = 0;
    document.getElementById('salaryAdvance').value = 0;
    document.getElementById('salaryStatus').value = 'Paid';

    calculateGiveSalary();
    loadAdminsForDropdown();
}

// ============================================================
// GIVE SALARY
// ============================================================
async function giveSalary() {
    const adminId = document.getElementById('salaryAdmin').value;
    const date = document.getElementById('salaryDate').value;
    const presentDays = parseInt(document.getElementById('salaryPresentDays').value) || 0;
    const dailyWage = parseInt(document.getElementById('salaryDailyWage').value) || 0;
    const overtime = parseInt(document.getElementById('salaryOvertime').value) || 0;
    const advance = parseInt(document.getElementById('salaryAdvance').value) || 0;
    const netSalary = presentDays * dailyWage + overtime - advance;
    const status = document.getElementById('salaryStatus').value;

    if (!adminId) {
        showToast('Please select an admin', 'error');
        return;
    }

    const data = {
        adminId,
        date,
        presentDays,
        dailyWage,
        overtime,
        advance,
        netSalary,
        status,
        month: new Date(date).toLocaleString('default', { month: 'long' }),
        year: new Date(date).getFullYear()
    };

    try {
        const response = await fetch('/api/admin-payroll/give-salary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            showToast(`✅ Salary given to ${result.name} successfully!`, 'success');
            document.getElementById('giveSalaryModal').style.display = 'none';
            document.getElementById('giveSalaryForm').reset();

            // ✅ Auto-set month/year filters to the record we just added (like wpayroll)
            const monthFilterEl = document.getElementById('monthFilter');
            const yearFilterEl = document.getElementById('yearFilter');
            if (monthFilterEl) monthFilterEl.value = data.month;
            if (yearFilterEl) yearFilterEl.value = data.year;

            currentPage = 1;
            loadAdminPayroll();
        } else {
            showToast(`❌ ${result.error}`, 'error');
        }
    } catch (error) {
        showToast('Error giving salary: ' + error.message, 'error');
    }
}

// ============================================================
// LOAD SALARY SETTINGS
// ============================================================
async function loadSalarySettings() {
    try {
        const response = await fetch('/api/admin-payroll/settings');
        const settings = await response.json();

        const grid = document.getElementById('salarySettingsGrid');

        const roleIcons = {
            'Super Admin': 'fa-crown',
            'Project Admin': 'fa-project-diagram',
            'Site Admin': 'fa-hard-hat'
        };

        const roleColors = {
            'Super Admin': 'super-admin',
            'Project Admin': 'project-admin',
            'Site Admin': 'site-admin'
        };

        const roleDescriptions = {
            'Super Admin': 'Full system access and control',
            'Project Admin': 'Manage projects and teams',
            'Site Admin': 'Oversee site operations'
        };

        grid.innerHTML = settings.map(setting => `
            <div class="settings-card">
                <div class="role-icon ${roleColors[setting.role]}">
                    <i class="fa-solid ${roleIcons[setting.role] || 'fa-user'}"></i>
                </div>
                <div class="role-name">${setting.role}</div>
                <div class="role-desc">${roleDescriptions[setting.role] || ''}</div>
                <div class="salary-display">
                    <div class="daily">
                        Daily <span>₹${setting.dailyWage.toLocaleString()}</span>
                    </div>
                    <div class="monthly">
                        Monthly <span>₹${(setting.dailyWage * 26).toLocaleString()}</span>
                    </div>
                </div>
                <button class="btn-edit-salary" onclick="openSalaryModal('${setting.role}', ${setting.dailyWage})">
                    <i class="fa-solid fa-pen"></i> Edit Salary
                </button>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading salary settings:', error);
    }
}

// ============================================================
// OPEN SALARY MODAL
// ============================================================
function openSalaryModal(role, currentWage) {
    document.getElementById('salaryRole').value = role;
    document.getElementById('salaryDailyWage').value = currentWage;
    document.getElementById('salaryMonthly').value = `₹${(currentWage * 26).toLocaleString()} / month`;

    document.getElementById('salaryDailyWage').oninput = function() {
        const daily = parseInt(this.value) || 0;
        document.getElementById('salaryMonthly').value = `₹${(daily * 26).toLocaleString()} / month`;
    };

    document.getElementById('salaryModal').style.display = 'block';
}

// ============================================================
// UPDATE SALARY SETTINGS
// ============================================================
async function updateSalarySettings(role, dailyWage) {
    try {
        const response = await fetch('/api/admin-payroll/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role, dailyWage })
        });

        const data = await response.json();

        if (response.ok) {
            showToast(`✅ ${data.message}`, 'success');
            document.getElementById('salaryModal').style.display = 'none';
            loadSalarySettings();
            loadAdminPayroll();
        } else {
            showToast(`❌ ${data.error}`, 'error');
        }
    } catch (error) {
        showToast('Error updating salary settings: ' + error.message, 'error');
    }
}

// ============================================================
// OPEN EDIT SALARY MODAL
// ============================================================
function openEditSalaryModal(id) {
    fetch(`/api/admin-payroll/${id}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById('editAdminName').value = data.name;
            document.getElementById('editAdminRole').value = data.role || 'Admin';
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
        .catch(error => {
            showToast('Error loading admin data', 'error');
        });
}

// ============================================================
// UPDATE ADMIN SALARY
// ============================================================
async function updateAdminSalary() {
    const id = document.getElementById('editSalaryForm').dataset.id;
    const presentDays = parseInt(document.getElementById('editPresentDays').value) || 0;
    const dailyWage = parseInt(document.getElementById('editDailyWage').value) || 0;
    const overtime = parseInt(document.getElementById('editOvertime').value) || 0;
    const advance = parseInt(document.getElementById('editAdvance').value) || 0;
    const netSalary = presentDays * dailyWage + overtime - advance;
    const status = document.getElementById('editStatus').value;
    const salaryDate = document.getElementById('editSalaryDate').value;

    const data = {
        presentDays,
        dailyWage,
        overtime,
        advance,
        netSalary,
        status,
        salaryDate
    };

    try {
        const response = await fetch(`/api/admin-payroll/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            showToast(`✅ Salary updated successfully for ${result.name}`, 'success');
            document.getElementById('editSalaryModal').style.display = 'none';
            loadAdminPayroll();
        } else {
            showToast(`❌ ${result.error}`, 'error');
        }
    } catch (error) {
        showToast('Error updating salary: ' + error.message, 'error');
    }
}

// ============================================================
// ✅ LOAD ADMIN PAYROLL DATA - WITH MONTH/YEAR FILTER (like wpayroll)
// ============================================================
async function loadAdminPayroll() {
    try {
        const search = document.getElementById('searchPayroll')?.value || '';
        const status = document.getElementById('statusFilter')?.value || '';
        const role = document.getElementById('roleFilter')?.value || '';
        const project = document.getElementById('projectFilter')?.value || '';
        const month = document.getElementById('monthFilter')?.value || '';
        const year = document.getElementById('yearFilter')?.value || new Date().getFullYear();

        let url = `/api/admin-payroll?search=${search}&status=${status}&role=${role}&project=${project}`;

        // ✅ Append month/year just like wpayroll
        if (month) {
            url += `&month=${month}&year=${year}`;
        } else {
            url += `&year=${year}`;
        }

        const response = await fetch(url);
        let fetchedData = await response.json();

        // ✅ Client-side re-filter so calendar always works (same as wpayroll)
        allPayrollData = fetchedData.filter(item => {
            const itemDate = item.salaryDate ? new Date(item.salaryDate) : null;
            const itemMonth = itemDate ? itemDate.toLocaleString('default', { month: 'long' }) : item.month;
            const itemYear = itemDate ? itemDate.getFullYear().toString() : item.year?.toString();

            const monthMatches = !month || itemMonth === month;
            const yearMatches = !year || itemYear === year.toString();

            return monthMatches && yearMatches;
        });

        // Update stats
        updateAdminStats(allPayrollData);

        // Update mini banner stats
        document.getElementById('totalAdminCount').textContent = allPayrollData.length;
        const totalPayroll = allPayrollData.reduce((sum, p) => sum + (p.netSalary || 0), 0);
        document.getElementById('totalPayrollMini').textContent = totalPayroll > 0 ? `₹${(totalPayroll / 100000).toFixed(1)}L` : '₹0';
        document.getElementById('pendingCount').textContent = allPayrollData.filter(p => p.status === 'Pending').length;
        document.getElementById('paidCount').textContent = allPayrollData.filter(p => p.status === 'Paid').length;

        // Pagination
        totalItems = allPayrollData.length;
        totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        const start = (currentPage - 1) * itemsPerPage;
        const end = Math.min(start + itemsPerPage, totalItems);
        const paginatedData = allPayrollData.slice(start, end);

        // Update table
        const tbody = document.getElementById('payrollTableBody');
        if (tbody) {
            if (paginatedData.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="10" style="text-align: center; padding: 40px; color: var(--text-muted);">
                            <i class="fa-solid fa-file-invoice" style="font-size: 32px; display: block; margin-bottom: 8px;"></i>
                            No admin payroll records found for ${month ? month + ' ' + year : 'this year'}.
                        </td>
                    </tr>
                `;
            } else {
                tbody.innerHTML = paginatedData.map(admin => {
                    const roleClass = admin.role?.toLowerCase().replace(' ', '-') || 'admin';
                    const isPending = admin.status === 'Pending';
                    const salaryDate = admin.salaryDate ? new Date(admin.salaryDate).toLocaleDateString('en-IN') : '-';

                    return `
                        <tr>
                            <td>
                                <div class="admin-info">
                                    <div class="admin-avatar">${getInitials(admin.name)}</div>
                                    <div class="admin-details">
                                        <span class="admin-name">${admin.name}</span>
                                        <span class="admin-id">${admin.adminId || 'N/A'}</span>
                                    </div>
                                </div>
                            </td>
                            <td><span class="role-badge ${roleClass}">${admin.role || 'Admin'}</span></td>
                            <td>${admin.presentDays || 0}</td>
                            <td>₹${(admin.dailyWage || 0).toLocaleString()}</td>
                            <td>+₹${(admin.overtime || 0).toLocaleString()}</td>
                            <td>-₹${(admin.advance || 0).toLocaleString()}</td>
                            <td><strong>₹${(admin.netSalary || 0).toLocaleString()}</strong></td>
                            <td><span class="status-badge ${(admin.status || 'pending').toLowerCase()}">${admin.status || 'Pending'}</span></td>
                            <td class="salary-date">${salaryDate}</td>
                            <td>
                                <div class="action-buttons">
                                    ${isPending ? `
                                        <button class="btn-edit-salary-row" onclick="openEditSalaryModal('${admin._id}')">
                                            <i class="fa-solid fa-pen"></i> Edit
                                        </button>
                                    ` : ''}
                                    <button class="btn-view-payslip" onclick="viewAdminPayslip('${admin._id}')">
                                        <i class="fa-solid fa-eye"></i> Payslip
                                    </button>
                                    <button class="btn-delete-payroll" onclick="deletePayrollRecord('${admin._id}')">
                                        <i class="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        }

        // Update pagination info
        const startEntry = totalItems === 0 ? 0 : start + 1;
        const endEntry = Math.min(end, totalItems);
        document.getElementById('entriesInfo').textContent =
            totalItems === 0 ? 'No entries found' : `Showing ${startEntry} to ${endEntry} of ${totalItems} entries`;

        // Update pagination buttons
        document.getElementById('prevPage').disabled = currentPage <= 1;
        document.getElementById('nextPage').disabled = currentPage >= totalPages || totalPages === 0;

        // Update page numbers
        updatePageNumbers();

        // Store current page
        localStorage.setItem('adminPayrollPage', currentPage);

        return Promise.resolve();

    } catch (error) {
        console.error('Error loading admin payroll:', error);
        document.getElementById('payrollTableBody').innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <i class="fa-solid fa-exclamation-circle" style="font-size: 24px; display: block; margin-bottom: 8px;"></i>
                    Failed to load admin payroll data. Please try again.
                </td>
            </tr>
        `;
        return Promise.reject(error);
    }
}

// ============================================================
// UPDATE PAGE NUMBERS
// ============================================================
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
            loadAdminPayroll();
        };
        container.appendChild(btn);
    }
}

// ============================================================
// ✅ UPDATE ADMIN STATS - now respects selected month/year
// ============================================================
function updateAdminStats(payrollData) {
    const totalAdmins = payrollData.length;
    const totalPayroll = payrollData.reduce((sum, p) => sum + (p.netSalary || 0), 0);
    const pendingAdmins = payrollData.filter(p => p.status === 'Pending').length;
    const pendingAmount = payrollData.filter(p => p.status === 'Pending').reduce((sum, p) => sum + (p.netSalary || 0), 0);
    const paidAdmins = payrollData.filter(p => p.status === 'Paid').length;
    const processingAdmins = payrollData.filter(p => p.status === 'Processing').length;

    // Role based counts
    const superAdmins = payrollData.filter(p => p.role === 'Super Admin').length;
    const projectAdmins = payrollData.filter(p => p.role === 'Project Admin').length;
    const siteAdmins = payrollData.filter(p => p.role === 'Site Admin').length;

    document.getElementById('totalPayroll').textContent = totalPayroll > 0 ? `₹${(totalPayroll / 100000).toFixed(1)}L` : '₹0';
    document.getElementById('pendingPayments').textContent = pendingAmount > 0 ? `₹${(pendingAmount / 100000).toFixed(1)}L` : '₹0';
    document.getElementById('pendingAdmins').textContent = pendingAdmins;
    document.getElementById('paidAdmins').textContent = paidAdmins;
    document.getElementById('totalAdmins').textContent = totalAdmins;
    document.getElementById('processingCount').textContent = processingAdmins;

    document.getElementById('superAdminCount').textContent = superAdmins;
    document.getElementById('projectAdminCount').textContent = projectAdmins;
    document.getElementById('siteAdminCount').textContent = siteAdmins;

    // ✅ Payroll month badge reflects selected filter (like wpayroll)
    const monthFilter = document.getElementById('monthFilter')?.value;
    const yearFilter = document.getElementById('yearFilter')?.value || new Date().getFullYear();

    const monthEl = document.getElementById('payrollMonth');
    if (monthEl) {
        if (monthFilter) {
            monthEl.textContent = `${monthFilter} ${yearFilter}`;
        } else {
            monthEl.textContent = `All (${yearFilter})`;
        }
    }
}

// ============================================================
// GET INITIALS
// ============================================================
function getInitials(name) {
    if (!name) return '??';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
}

// ============================================================
// GENERATE ADMIN PAYROLL
// ============================================================
async function generateAdminPayroll(month, year) {
    try {
        const response = await fetch('/api/admin-payroll/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ month, year })
        });

        const data = await response.json();

        if (response.ok) {
            showToast(`✅ ${data.message}`, 'success');
            document.getElementById('generateModal').style.display = 'none';

            // ✅ Auto-set month/year filters to the generated month (like wpayroll)
            const monthFilterEl = document.getElementById('monthFilter');
            const yearFilterEl = document.getElementById('yearFilter');
            if (monthFilterEl) monthFilterEl.value = month;
            if (yearFilterEl) yearFilterEl.value = year;

            currentPage = 1;
            loadAdminPayroll();
        } else {
            showToast(`❌ ${data.error}`, 'error');
        }
    } catch (error) {
        showToast('Error generating admin payroll: ' + error.message, 'error');
    }
}

// ============================================================
// VIEW ADMIN PAYSLIP
// ============================================================
async function viewAdminPayslip(id) {
    try {
        const response = await fetch(`/api/admin-payroll/${id}`);
        const data = await response.json();

        const payslipData = document.getElementById('payslipData');
        payslipData.innerHTML = `
            <div style="text-align: center; margin-bottom: 16px;">
                <h3 style="color: var(--blue);">SiteForce</h3>
                <p style="color: var(--text-muted);">Admin Payslip</p>
                <p style="font-size: 12px; color: var(--text-muted);">${data.month || ''} ${data.year || ''}</p>
                <p style="font-size: 12px; color: var(--text-muted);">Date: ${data.salaryDate ? new Date(data.salaryDate).toLocaleDateString('en-IN') : 'N/A'}</p>
            </div>
            <div class="payslip-row">
                <span class="label">Admin ID</span>
                <span class="value">${data.adminId || 'N/A'}</span>
            </div>
            <div class="payslip-row">
                <span class="label">Name</span>
                <span class="value">${data.name}</span>
            </div>
            <div class="payslip-row">
                <span class="label">Role</span>
                <span class="value">${data.role || 'Admin'}</span>
            </div>
            <div class="payslip-row">
                <span class="label">Project</span>
                <span class="value">${data.project || 'N/A'}</span>
            </div>
            <div class="payslip-row">
                <span class="label">Present Days</span>
                <span class="value">${data.presentDays || 0}</span>
            </div>
            <div class="payslip-row">
                <span class="label">Daily Wage</span>
                <span class="value">₹${(data.dailyWage || 0).toLocaleString()}</span>
            </div>
            <div class="payslip-row">
                <span class="label">Basic Salary</span>
                <span class="value">₹${((data.presentDays || 0) * (data.dailyWage || 0)).toLocaleString()}</span>
            </div>
            <div class="payslip-row">
                <span class="label">Overtime</span>
                <span class="value">+₹${(data.overtime || 0).toLocaleString()}</span>
            </div>
            <div class="payslip-row">
                <span class="label">Advance Deduction</span>
                <span class="value">-₹${(data.advance || 0).toLocaleString()}</span>
            </div>
            <div class="payslip-total">
                <div class="payslip-row">
                    <span class="label">Net Salary</span>
                    <span class="value">₹${(data.netSalary || 0).toLocaleString()}</span>
                </div>
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

// ============================================================
// DOWNLOAD PAYSLIP
// ============================================================
function downloadPayslip() {
    const id = document.getElementById('payslipModal').dataset.id;
    showToast(`📥 Downloading payslip for admin ID: ${id}`, 'success');
}

// ============================================================
// DELETE PAYROLL RECORD
// ============================================================
async function deletePayrollRecord(id) {
    if (!confirm('⚠️ Are you sure you want to delete this payroll record?')) return;

    try {
        const response = await fetch(`/api/admin-payroll/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast('✅ Payroll record deleted successfully', 'success');
            loadAdminPayroll();
        } else {
            showToast('❌ Failed to delete record', 'error');
        }
    } catch (error) {
        showToast('Error deleting record: ' + error.message, 'error');
    }
}

// ============================================================
// GENERATE PAYROLL BUTTON
// ============================================================
function generatePayroll() {
    document.getElementById('generateModal').style.display = 'block';
}

// ============================================================
// EXPORT PAYROLL
// ============================================================
function exportPayroll() {
    try {
        if (allPayrollData.length === 0) {
            showToast('No data to export', 'error');
            return;
        }

        let csvContent = "Admin Name,Role,Present Days,Daily Wage,Overtime,Advance,Net Salary,Status,Date\n";

        allPayrollData.forEach(admin => {
            const salaryDate = admin.salaryDate ? new Date(admin.salaryDate).toLocaleDateString('en-IN') : '-';
            csvContent += `${admin.name},${admin.role || 'Admin'},${admin.presentDays || 0},${admin.dailyWage || 0},${admin.overtime || 0},${admin.advance || 0},${admin.netSalary || 0},${admin.status || 'Pending'},${salaryDate}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `admin_payroll_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showToast('✅ Admin payroll exported successfully!', 'success');

    } catch (error) {
        showToast('Failed to export data', 'error');
    }
}

// ============================================================
// ✅ LOAD NOTIFICATIONS - SAME AS OWNER DASHBOARD
// ============================================================
async function loadNotifications() {
    try {
        const response = await fetch('/api/admins/notifications');
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

                return `
                <div class="notification-item ${notif.read ? 'read' : 'unread'}" onclick="markNotificationRead('${notif._id}')">
                    <div class="notif-icon ${iconColor}">
                        <i class="fa-solid ${iconClass}"></i>
                    </div>
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
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

// ============================================================
// GET NOTIFICATION ICON
// ============================================================
function getNotificationIcon(type) {
    const icons = {
        'created': 'fa-plus-circle',
        'updated': 'fa-pen',
        'deleted': 'fa-trash',
        'status_changed': 'fa-exchange-alt'
    };
    return icons[type] || 'fa-bell';
}

// ============================================================
// FORMAT TIME
// ============================================================
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

// ============================================================
// ✅ MARK SINGLE NOTIFICATION AS READ
// ============================================================
function markNotificationRead(notifId) {
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
        if (unreadItems > 0) {
            badge.textContent = unreadItems;
            badge.style.display = 'flex';
        } else {
            badge.textContent = '0';
            badge.style.display = 'none';
        }
    }
}

// ============================================================
// ✅ MARK ALL NOTIFICATIONS AS READ (WITH TOAST)
// ============================================================
function markAllRead() {
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
    }

    fetch('/api/admins/notifications/mark-all-read', { method: 'PUT' }).catch(console.error);

    showCustomToast('✅ All notifications marked as read', 'success');
}

// ============================================================
// ✅ CLEAR ALL NOTIFICATIONS (WITH TOAST, NO ALERT)
// ============================================================
async function clearAllNotifications() {
    try {
        const response = await fetch('/api/admins/notifications/clear', {
            method: 'DELETE'
        });

        if (response.ok) {
            const list = document.getElementById('notificationList');
            if (list) {
                list.innerHTML = `
                    <div class="no-notifications">
                        <i class="fa-regular fa-bell-slash"></i>
                        <p>No notifications</p>
                    </div>
                `;
            }

            const headerButtons = document.getElementById('notifHeaderButtons');
            if (headerButtons) headerButtons.style.display = 'none';

            const badge = document.getElementById('notificationBadge') || document.querySelector('.notification .badge');
            if (badge) {
                badge.textContent = '0';
                badge.style.display = 'none';
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

// ============================================================
// MAKE FUNCTIONS GLOBALLY ACCESSIBLE
// ============================================================
window.openGiveSalaryModal = openGiveSalaryModal;
window.generatePayroll = generatePayroll;
window.exportPayroll = exportPayroll;
window.openEditSalaryModal = openEditSalaryModal;
window.viewAdminPayslip = viewAdminPayslip;
window.downloadPayslip = downloadPayslip;
window.deletePayrollRecord = deletePayrollRecord;
window.openSalaryModal = openSalaryModal;
window.updateSalarySettings = updateSalarySettings;
window.markAllRead = markAllRead;
window.markNotificationRead = markNotificationRead;
window.clearAllNotifications = clearAllNotifications;
window.loadAdminPayroll = loadAdminPayroll;
window.showCustomToast = showCustomToast;
window.showToast = showToast;

// ============================================================
// INJECT NOTIFICATION + TOAST CSS (same as owner dashboard)
// ============================================================
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
    .notification-item .notif-content { flex: 1; min-width: 0; }
    .notification-item .notif-content p { font-size: 13px; color: var(--text-dark); line-height: 1.4; margin: 0; font-weight: 500; }
    .notification-item .notif-content small { font-size: 11px; color: var(--text-muted); }
    .notification-item .notif-dot { width: 8px; height: 8px; background: var(--blue); border-radius: 50%; flex-shrink: 0; margin-top: 4px; transition: opacity 0.2s ease; }
    .no-notifications { text-align: center; padding: 30px 20px; color: var(--text-muted); font-size: 14px; }
    .no-notifications i { font-size: 32px; color: var(--text-faint); display: block; margin-bottom: 8px; }
    @media (max-width: 768px) { .notification-dropdown { width: 300px; right: -50px; } }
`;
document.head.appendChild(notifStyle);