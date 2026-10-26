// ============================================================
// WORKER ATTENDANCE - COMPLETE REAL-TIME VERSION
// ============================================================

let currentPage = 1;
const itemsPerPage = 8;
let totalItems = 0;
let totalPages = 1;
let weeklyChartInstance = null;
let monthlyChartInstance = null;
let attendanceData = [];
let allWorkers = [];

// ============================================================
// DATE HELPERS
// ============================================================
function getTodayISO() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function getTodayDDMMYYYY() {
    const today = new Date();
    return `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return dateStr;
}

// ============================================================
// FORCE DATE UPDATE - TOP
// ============================================================
(function setDateImmediately() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        dateElement.textContent = today.toLocaleDateString('en-US', options) + ' · All sites';
    }
})();

// ============================================================
// TOAST NOTIFICATION
// ============================================================
function showToast(message, type = 'success') {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

function updateDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    const dateElement = document.getElementById('currentDate');
    if (dateElement) dateElement.textContent = today.toLocaleDateString('en-US', options) + ' · All sites';
}

function setTodayDateFilter() {
    const dateFilter = document.getElementById('dateFilter');
    if (dateFilter) dateFilter.value = getTodayISO();
}

// ============================================================
// LOAD PROJECTS & WORKERS
// ============================================================
async function loadProjects() {
    try {
        const response = await fetch('/api/projects');
        const projects = await response.json();
        const select = document.getElementById('projectFilter');
        if (select) {
            select.innerHTML = '<option value="">All Projects</option>';
            if (projects && projects.length > 0) {
                projects.forEach(project => {
                    const option = document.createElement('option');
                    option.value = project.name || project.projectName || project._id;
                    option.textContent = project.name || project.projectName || 'Unnamed Project';
                    select.appendChild(option);
                });
            }
        }
    } catch (error) { console.error('Error loading projects:', error); }
}

async function loadWorkers() {
    try {
        const response = await fetch('/api/workers');
        const workers = await response.json();
        allWorkers = workers;

        const totalWorkersElement = document.getElementById('totalWorkers');
        if (totalWorkersElement) totalWorkersElement.textContent = workers.length || 0;

        const select = document.getElementById('attendanceWorker');
        if (select) {
            select.innerHTML = '<option value="">Select Worker</option>' +
                workers.map(worker => `<option value="${worker._id}">${worker.name} (${worker.workerId || 'N/A'}) - ${worker.category || 'N/A'}</option>`).join('');
        }
    } catch (error) { console.error('Error loading workers:', error); }
}

// ============================================================
// LOAD ATTENDANCE DATA
// ============================================================
async function loadAttendance(page = 1) {
    try {
        const search = document.getElementById('searchAttendance')?.value || '';
        const status = document.getElementById('statusFilter')?.value || '';
        const category = document.getElementById('categoryFilter')?.value || '';
        const project = document.getElementById('projectFilter')?.value || '';
        const date = document.getElementById('dateFilter')?.value || '';

        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (status) params.append('status', status);
        if (category) params.append('category', category);
        if (project) params.append('project', project);
        if (date) params.append('date', date);

        const response = await fetch(`/api/worker-attendance?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to load attendance');

        const data = await response.json();
        attendanceData = data;
        currentPage = page;

        await loadWorkers();
        updateStats(data);
        updateTable(data);
        updateCharts(data);
        // ✅ Yahan se updateNotifications hata diya hai, kyunki ab API se aayega

    } catch (error) {
        console.error('Error loading attendance:', error);
        const tbody = document.getElementById('attendanceTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align:center; padding:40px; color:var(--text-muted);">
                        <i class="fa-solid fa-exclamation-circle" style="font-size:24px; display:block; margin-bottom:8px;"></i>
                        Failed to load attendance records.
                    </td>
                </tr>
            `;
        }
        showToast('Failed to load attendance data', 'error');
    }
}

function updateStats(data) {
    const totalWorkers = allWorkers.length || 0;
    document.getElementById('totalWorkers').textContent = totalWorkers;

    const present = data.filter(d => d.status === 'Present').length;
    const absent = data.filter(d => d.status === 'Absent').length;
    const late = data.filter(d => d.status === 'Late').length;

    document.getElementById('presentToday').textContent = present || 0;
    document.getElementById('absentToday').textContent = absent || 0;
    document.getElementById('lateToday').textContent = late || 0;

    const presentPercent = totalWorkers > 0 ? Math.round((present / totalWorkers) * 100) : 0;
    const absentPercent = totalWorkers > 0 ? Math.round((absent / totalWorkers) * 100) : 0;
    const latePercent = totalWorkers > 0 ? Math.round((late / totalWorkers) * 100) : 0;

    document.getElementById('presentPercent').textContent = `${presentPercent}%`;
    document.getElementById('absentPercent').textContent = `${absentPercent}%`;
    document.getElementById('latePercent').textContent = `${latePercent}%`;

    const avgAttendance = totalWorkers > 0 ? Math.round(((totalWorkers - absent) / totalWorkers) * 100) : 0;
    const avgBadge = document.getElementById('avgAttendance');
    if (avgBadge) avgBadge.textContent = `${avgAttendance}%`;
}

function updateTable(data) {
    totalItems = data.length;
    totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const start = (currentPage - 1) * itemsPerPage;
    const end = Math.min(start + itemsPerPage, totalItems);
    const pageData = data.slice(start, end);

    const tbody = document.getElementById('attendanceTableBody');
    if (!tbody) return;

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align:center; padding:40px; color:var(--text-muted);">
                    <i class="fa-regular fa-calendar-xmark" style="font-size:32px; display:block; margin-bottom:8px;"></i>
                    No worker attendance records found
                </td>
            </tr>
        `;
    } else {
        tbody.innerHTML = pageData.map(att => {
            const worker = att.workerId || {};
            const name = worker.name || att.name || 'Unknown'; 
            const workerId = worker.workerId || 'N/A';
            const category = worker.category || 'N/A';
            const project = worker.project || att.project || 'N/A';
            const checkIn = att.checkIn || '--:--';
            const checkOut = att.checkOut || '--:--';
            const status = att.status || 'Absent';
            const displayDate = att.date ? formatDate(att.date) : 'N/A';

            return `
                <tr>
                    <td><div class="avatar">${getInitials(name)}</div></td>
                    <td><strong>${workerId}</strong></td>
                    <td>${name}</td>
                    <td>${category}</td>
                    <td>${project}</td>
                    <td>${displayDate}</td>
                    <td>${checkIn}</td>
                    <td>${checkOut}</td>
                    <td><span class="status-badge ${status.toLowerCase().replace(' ', '-')}">${status}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="view-btn" onclick="viewAttendance('${att._id}')"><i class="fa-solid fa-eye"></i></button>
                            <button class="edit-btn" onclick="editAttendance('${att._id}')"><i class="fa-solid fa-pen"></i></button>
                            <button class="delete-btn" onclick="deleteAttendance('${att._id}')"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    const startEntry = totalItems === 0 ? 0 : start + 1;
    const endEntry = Math.min(end, totalItems);
    const entriesInfo = document.getElementById('entriesInfo');
    if (entriesInfo) {
        entriesInfo.textContent = totalItems === 0 ? 'No entries found' : `Showing ${startEntry} to ${endEntry} of ${totalItems} entries`;
    }

    updatePaginationButtons();
}

function updatePaginationButtons() {
    const prevPage = document.getElementById('prevPage');
    const nextPage = document.getElementById('nextPage');

    if (prevPage) prevPage.disabled = currentPage <= 1;
    if (nextPage) nextPage.disabled = currentPage >= totalPages || totalPages === 0;

    let pageNumbersContainer = document.getElementById('pageNumbers');
    if (!pageNumbersContainer) {
        const paginationButtons = document.querySelector('.pagination-buttons');
        if (paginationButtons) {
            const oldPageNumbers = paginationButtons.querySelectorAll('.page-number');
            oldPageNumbers.forEach(btn => btn.remove());

            pageNumbersContainer = document.createElement('span');
            pageNumbersContainer.id = 'pageNumbers';
            pageNumbersContainer.style.display = 'flex';
            pageNumbersContainer.style.gap = '6px';
            pageNumbersContainer.style.alignItems = 'center';

            const prevBtn = document.getElementById('prevPage');
            if (prevBtn && prevBtn.nextSibling) {
                paginationButtons.insertBefore(pageNumbersContainer, prevBtn.nextSibling);
            } else {
                paginationButtons.prepend(pageNumbersContainer);
            }
        }
    }

    if (!pageNumbersContainer) return;
    pageNumbersContainer.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = `page-number${i === currentPage ? ' active' : ''}`;
        btn.textContent = i;
        btn.onclick = function() { currentPage = i; loadAttendance(i); };
        pageNumbersContainer.appendChild(btn);
    }
}

function updateCharts(data) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const presentData = [];
    const absentData = [];
    const today = new Date();
    const weekDays = [];

    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        weekDays.push(`${year}-${month}-${day}`);
    }

    weekDays.forEach(date => {
        const dayData = data.filter(d => d.date === date);
        presentData.push(dayData.filter(d => d.status === 'Present').length);
        absentData.push(dayData.filter(d => d.status === 'Absent' || d.status === 'Late').length);
    });

    const ctx1 = document.getElementById('weeklyChart');
    if (ctx1) {
        const context = ctx1.getContext('2d');
        if (weeklyChartInstance) weeklyChartInstance.destroy();
        weeklyChartInstance = new Chart(context, {
            type: 'bar',
            data: {
                labels: days,
                datasets: [
                    { label: 'Present', data: presentData, backgroundColor: '#2563eb', borderRadius: 4 },
                    { label: 'Absent/Late', data: absentData, backgroundColor: '#f04438', borderRadius: 4 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'top', labels: { usePointStyle: true, pointStyle: 'circle', padding: 20 } } },
                scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } }
            }
        });
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = [];
    const year = today.getFullYear();

    months.forEach((_, index) => {
        const monthData = data.filter(d => {
            if (!d.date) return false;
            const dDate = new Date(d.date);
            return dDate.getFullYear() === year && dDate.getMonth() === index;
        });
        const total = monthData.length;
        const present = monthData.filter(d => d.status === 'Present').length;
        monthlyData.push(total > 0 ? Math.round((present / total) * 100) : 0);
    });

    const ctx2 = document.getElementById('monthlyChart');
    if (ctx2) {
        const context2 = ctx2.getContext('2d');
        if (monthlyChartInstance) monthlyChartInstance.destroy();
        monthlyChartInstance = new Chart(context2, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Attendance Rate %',
                    data: monthlyData,
                    borderColor: '#7a5af8',
                    backgroundColor: 'rgba(122, 90, 248, 0.1)',
                    fill: true, tension: 0.3,
                    pointBackgroundColor: '#7a5af8', pointBorderColor: '#fff',
                    pointBorderWidth: 2, pointRadius: 4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' }, grid: { color: '#f1f5f9' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }
}

function getInitials(name) {
    if (!name) return '??';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
}

window.viewAttendance = async function(id) {
    try {
        const response = await fetch(`/api/worker-attendance/${id}`);
        const att = await response.json();
        const worker = att.workerId || {};
        const name = worker.name || att.name || 'Unknown';
        const displayDate = att.date ? formatDate(att.date) : 'N/A';
        showToast(`👤 ${name}\n📋 ID: ${worker.workerId || 'N/A'}\n📂 Category: ${worker.category || 'N/A'}\n📅 Date: ${displayDate}\n⏰ In: ${att.checkIn || '--:--'}\n⏰ Out: ${att.checkOut || '--:--'}\n📊 Status: ${att.status}`, 'info');
    } catch (error) { showToast('Error loading attendance details', 'error'); }
};

window.editAttendance = async function(id) {
    try {
        const response = await fetch(`/api/worker-attendance/${id}`);
        const att = await response.json();

        document.getElementById('attendanceWorker').value = att.workerId?._id || '';
        document.getElementById('attendanceDate').value = att.date || '';
        document.getElementById('checkInTime').value = att.checkIn || '';
        document.getElementById('checkOutTime').value = att.checkOut || '';
        document.getElementById('attendanceStatus').value = att.status || 'Present';

        document.getElementById('attendanceModal').style.display = 'block';
        document.querySelector('.modal-header h2').textContent = '✏️ Edit Worker Attendance';

        const form = document.getElementById('attendanceForm');
        const submitBtn = form.querySelector('.btn-submit');
        submitBtn.innerHTML = '<i class="fa-solid fa-pen"></i> Update Attendance';

        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);

        newForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const updatedData = {
                workerId: document.getElementById('attendanceWorker').value,
                date: document.getElementById('attendanceDate').value,
                checkIn: document.getElementById('checkInTime').value,
                checkOut: document.getElementById('checkOutTime').value || null,
                status: document.getElementById('attendanceStatus').value
            };

            try {
                const response = await fetch(`/api/worker-attendance/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedData)
                });

                if (response.ok) {
                    showToast('✅ Attendance updated successfully!', 'success');
                    document.getElementById('attendanceModal').style.display = 'none';
                    loadAttendance(currentPage);
                } else {
                    const error = await response.json();
                    showToast(error.error || 'Failed to update attendance', 'error');
                }
            } catch (error) { showToast('Error updating attendance', 'error'); }
        });
    } catch (error) { showToast('Error loading attendance for editing', 'error'); }
};

window.deleteAttendance = async function(id) {
    if (!confirm('Are you sure you want to delete this worker attendance record?')) return;
    try {
        const response = await fetch(`/api/worker-attendance/${id}`, { method: 'DELETE' });
        if (response.ok) {
            showToast('✅ Attendance record deleted successfully!', 'success');
            loadAttendance(currentPage);
        } else { showToast('Failed to delete attendance record', 'error'); }
    } catch (error) { showToast('Error deleting attendance record', 'error'); }
};

document.getElementById('exportBtn')?.addEventListener('click', function() {
    try {
        if (!attendanceData || attendanceData.length === 0) {
            showToast('No data to export', 'error');
            return;
        }
        const exportData = attendanceData.map(att => {
            const worker = att.workerId || {};
            const name = worker.name || att.name || 'Unknown';
            return {
                'Worker ID': worker.workerId || 'N/A',
                'Name': name,
                'Category': worker.category || 'N/A',
                'Project': worker.project || att.project || 'N/A',
                'Date': att.date ? formatDate(att.date) : 'N/A',
                'Check In': att.checkIn || '--:--',
                'Check Out': att.checkOut || '--:--',
                'Status': att.status || 'Absent'
            };
        });

        if (typeof XLSX !== 'undefined') {
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);
            XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
            XLSX.writeFile(wb, `worker_attendance_${getTodayISO()}.xlsx`);
            showToast(`✅ Exported ${exportData.length} records!`, 'success');
        } else {
            let csv = 'Worker ID,Name,Category,Project,Date,Check In,Check Out,Status\n';
            exportData.forEach(row => {
                csv += Object.values(row).map(value => `"${String(value).replace(/"/g, '""')}"`).join(',') + '\n';
            });
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `worker_attendance_${getTodayISO()}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            showToast(`✅ Exported ${exportData.length} records!`, 'success');
        }
    } catch (error) { showToast('Failed to export data', 'error'); }
});

// ============================================================
// ✅ NOTIFICATIONS (FIXED FOR ANNOUNCEMENTS)
// ============================================================
async function loadNotifications() {
    try {
        // ✅ Changed URL to fetch Admin notifications (includes announcements)
        const response = await fetch('/api/admins/notifications?role=Admin', { cache: 'no-store' });
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
        if (unreadItems > 0) {
            badge.textContent = unreadItems;
            badge.style.display = 'flex';
        } else {
            badge.textContent = '0';
            badge.style.display = 'none';
        }
    }

    try {
        await fetch(`/api/admins/notifications/${notifId}/read`, { method: 'PUT' });
    } catch (err) {
        console.error('Failed to mark read:', err);
    }
}

async function markAllRead() {
    document.querySelectorAll('.notification-item.unread').forEach(item => {
        item.classList.remove('unread'); 
        item.classList.add('read');
        const dot = item.querySelector('.notif-dot'); 
        if (dot) dot.remove();
    });
    const badge = document.getElementById('notificationBadge') || document.querySelector('.notification .badge');
    if (badge) { badge.textContent = '0'; badge.style.display = 'none'; }

    try {
        await fetch('/api/admins/notifications/mark-all-read?role=Admin', { method: 'PUT' });
        showToast('✅ All notifications marked as read');
        setTimeout(() => loadNotifications(), 200);
    } catch (err) {
        showToast('❌ Failed to mark as read', 'error');
    }
}

async function clearAllNotifications() {
    try {
        const response = await fetch('/api/admins/notifications/clear?role=Admin', { method: 'DELETE' });
        if (response.ok) {
            const list = document.getElementById('notificationList');
            if (list) {
                list.innerHTML = `<div class="no-notifications"><i class="fa-regular fa-bell-slash"></i><p>No notifications</p></div>`;
            }
            const headerButtons = document.getElementById('notifHeaderButtons');
            if (headerButtons) headerButtons.style.display = 'none';
            
            const badge = document.getElementById('notificationBadge') || document.querySelector('.notification .badge');
            if (badge) { badge.textContent = '0'; badge.style.display = 'none'; }
            
            showToast('✅ All notifications cleared!');
        }
    } catch (error) {
        showToast('❌ Error clearing notifications', 'error');
    }
}

// ============================================================
// DOM CONTENT LOADED
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.name) { window.location.href = '/'; return; }

    const userNameElement = document.querySelector('.profile-text h4');
    if (userNameElement) userNameElement.textContent = user.name;
    const profileImg = document.querySelector('.profile img');
    if (profileImg) profileImg.src = `https://ui-avatars.com/api/?name=${user.name}&background=7c3aed&color=fff`;
    const userRole = document.querySelector('.profile-text small');
    if (userRole) userRole.textContent = 'Admin';

    updateDate();
    setTodayDateFilter();

    // Navigation
    document.getElementById('admindashBtn')?.addEventListener('click', e => { e.preventDefault(); window.location.href = '/admin-dashboard'; });
    document.getElementById('workersmangBtn')?.addEventListener('click', e => { e.preventDefault(); window.location.href = '/workersmang'; });
    document.getElementById('aprojectsBtn')?.addEventListener('click', e => { e.preventDefault(); window.location.href = '/kaam'; });
    document.getElementById('areportsBtn')?.addEventListener('click', e => { e.preventDefault(); window.location.href = '/areports'; });
    document.getElementById('wpayrollBtn')?.addEventListener('click', e => { e.preventDefault(); window.location.href = '/wpayroll'; });
    document.getElementById('settingsBtn')?.addEventListener('click', e => { e.preventDefault(); window.location.href = '/settings'; });
    document.getElementById('logoutBtn')?.addEventListener('click', e => { e.preventDefault(); if (confirm('Are you sure you want to logout?')) { localStorage.removeItem('user'); window.location.href = '/'; } });
    document.querySelector('.profile')?.addEventListener('click', () => { if (confirm('Do you want to logout?')) { localStorage.removeItem('user'); window.location.href = '/'; } });

    // ============================================================
    // NOTIFICATION DROPDOWN UI (NEW)
    // ============================================================
    const notificationBtn = document.querySelector('.notification');
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
        notificationDropdown.classList.toggle('show');
        if (notificationDropdown.classList.contains('show')) loadNotifications();
    });
    
    document.addEventListener('click', function(e) {
        if (notificationDropdown && !notificationDropdown.contains(e.target) && e.target !== notificationBtn) {
            notificationDropdown.classList.remove('show');
        }
    });

    document.getElementById('settingsBtnTop')?.addEventListener('click', () => window.location.href = '/settings');

    document.getElementById('filterBtn')?.addEventListener('click', function() {
        const filters = document.getElementById('filtersContainer');
        if (filters) {
            const isHidden = filters.style.display === 'none';
            filters.style.display = isHidden ? 'flex' : 'none';
            this.innerHTML = isHidden ? '<i class="fa-solid fa-filter"></i> Hide Filters' : '<i class="fa-solid fa-filter"></i> Filter';
        }
    });

    document.getElementById('searchAttendance')?.addEventListener('input', function() {
        const globalSearch = document.getElementById('globalSearch');
        if (globalSearch && globalSearch.value !== this.value) globalSearch.value = this.value;
        currentPage = 1; loadAttendance(1);
    });
    document.getElementById('globalSearch')?.addEventListener('input', function() {
        const searchAttendance = document.getElementById('searchAttendance');
        if (searchAttendance && searchAttendance.value !== this.value) searchAttendance.value = this.value;
        currentPage = 1; loadAttendance(1);
    });

    document.getElementById('statusFilter')?.addEventListener('change', () => { currentPage = 1; loadAttendance(1); });
    document.getElementById('categoryFilter')?.addEventListener('change', () => { currentPage = 1; loadAttendance(1); });
    document.getElementById('projectFilter')?.addEventListener('change', () => { currentPage = 1; loadAttendance(1); });
    document.getElementById('dateFilter')?.addEventListener('change', () => { currentPage = 1; loadAttendance(1); });

    document.getElementById('prevPage')?.addEventListener('click', () => { if (currentPage > 1) { currentPage--; loadAttendance(currentPage); } });
    document.getElementById('nextPage')?.addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; loadAttendance(currentPage); } });

    const modal = document.getElementById('attendanceModal');
    const markBtn = document.getElementById('markAttendanceBtn');
    const closeBtn = document.querySelector('.close');

    markBtn?.addEventListener('click', function() {
        modal.style.display = 'block';
        document.getElementById('attendanceDate').value = getTodayISO();
        const now = new Date();
        document.getElementById('checkInTime').value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        document.getElementById('checkOutTime').value = '';
        document.getElementById('attendanceStatus').value = 'Present';
        document.querySelector('.modal-header h2').textContent = '📝 Mark Worker Attendance';
        
        const form = document.getElementById('attendanceForm');
        const submitBtn = form.querySelector('.btn-submit');
        submitBtn.innerHTML = '<i class="fa-regular fa-calendar-check"></i> Mark Attendance';

        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);

        newForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const attendanceData = {
                workerId: document.getElementById('attendanceWorker').value,
                date: document.getElementById('attendanceDate').value,
                checkIn: document.getElementById('checkInTime').value,
                checkOut: document.getElementById('checkOutTime').value || null,
                status: document.getElementById('attendanceStatus').value
            };
            if (!attendanceData.workerId) { showToast('Please select a worker', 'error'); return; }
            try {
                const response = await fetch('/api/worker-attendance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(attendanceData)
                });
                if (response.ok) {
                    showToast('✅ Worker attendance marked successfully!', 'success');
                    modal.style.display = 'none';
                    this.reset();
                    await loadWorkers();
                    await loadAttendance(1);
                } else {
                    const error = await response.json();
                    showToast(error.error || 'Failed to mark attendance', 'error');
                }
            } catch (error) { showToast('Error marking attendance', 'error'); }
        });
    });

    closeBtn?.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

    // Initial Load
    loadWorkers();
    loadProjects();
    loadAttendance(1);
    loadNotifications();

    // Refresh
    setInterval(() => {
        loadWorkers();
        loadAttendance(currentPage);
        loadNotifications();
    }, 10000); // ✅ 10 sec refresh (announcements turant dikhe)

    window.markAllRead = markAllRead;
    window.markNotificationRead = markNotificationRead;
    window.clearAllNotifications = clearAllNotifications;
});

const notifStyle = document.createElement('style');
notifStyle.textContent = `
    .notification-dropdown { display: none; position: absolute; top: 50px; right: 0; width: 380px; max-height: 420px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); box-shadow: 0 8px 32px rgba(0,0,0,0.15); z-index: 1000; overflow: hidden; }
    .notification-dropdown.show { display: block; animation: slideDown 0.3s ease; }
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