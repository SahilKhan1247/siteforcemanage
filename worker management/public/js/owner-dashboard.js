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
        profileImg.src = `https://ui-avatars.com/api/?name=${user.name}&background=2563eb&color=fff`;
    }

    // Set user role
    const userRole = document.getElementById('userRole');
    if (userRole) {
        userRole.textContent = 'Owner';
    }

    // Set current date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        dateElement.textContent = today.toLocaleDateString('en-US', options) + ' · All sites';
    }

    // ============= TOPBAR FUNCTIONALITY =============
    
    const globalSearch = document.getElementById('globalSearch');
    if (globalSearch) {
        globalSearch.addEventListener('keypress', async function(e) {
            if (e.key === 'Enter') {
                const searchTerm = this.value.trim();
                if (searchTerm) {
                    await performSearch(searchTerm);
                }
            }
        });
    }

    // ============================================================
    // ✅ NOTIFICATION DROPDOWN — MASTER CONTROL (Owner)
    //    Mark All Read / Clear All → SABHI pages pe apply hoga
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
    // ✅ FRESH FETCH WHEN TAB REGAINS FOCUS
    // (so after doing Mark All Read / Clear All on another tab,
    //  returning to Owner Dashboard instantly reflects the change)
    // ============================================================
    window.addEventListener('focus', () => {
        loadNotifications();
    });

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            loadNotifications();
        }
    });

    // ============================================================
    // SETTINGS CLICK
    // ============================================================
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = '/settings';
        });
    }
    
    const settingsBtnByClass = document.querySelector('.setting');
    if (settingsBtnByClass) {
        settingsBtnByClass.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = '/settings';
        });
    }

    // Profile click - logout
    document.querySelector('.profile')?.addEventListener('click', function() {
        if (confirm('Do you want to logout?')) {
            localStorage.removeItem('user');
            window.location.href = '/';
        }
    });

    // ============= NAVIGATION =============
    document.getElementById("adminsmanBtn")?.addEventListener("click", function () {
        window.location.href = "/adminsmang";
    });

    document.getElementById("adminattendanceBtn")?.addEventListener("click", function () {
        window.location.href = "/adminattend";
    });

    document.getElementById("projectsBtn")?.addEventListener("click", function () {
        window.location.href = "/projects";
    });

    document.getElementById("reportsBtn")?.addEventListener("click", function () {
        window.location.href = "/reports";
    });

    document.getElementById("apayrollBtn")?.addEventListener("click", function () {
        window.location.href = "/apayroll";
    });

    document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('user');
            window.location.href = '/';
        }
    });

    // Load all dashboard data
    loadDashboardData();
    loadNotifications();   // ✅ page load pe hi notifications load

    // Auto-refresh
    setInterval(loadDashboardData, 60000);
    setInterval(loadNotifications, 10000); // 10 sec auto-refresh
});

// ============================================================
// ✅ CUSTOM TOAST FUNCTION
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
// SEARCH FUNCTION
// ============================================================
async function performSearch(searchTerm) {
    try {
        const adminsRes = await fetch('/api/admins');
        const admins = await adminsRes.json();
        const workersRes = await fetch('/api/workers');
        const workers = await workersRes.json();
        
        const adminResults = admins.filter(admin => 
            admin.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            admin.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            admin.adminId?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        const workerResults = workers.filter(worker => 
            worker.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            worker.workerId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            worker.phone?.includes(searchTerm)
        );
        
        let message = '🔍 Search Results for "' + searchTerm + '"\n\n';
        if (adminResults.length > 0) {
            message += '👤 Admins Found (' + adminResults.length + '):\n';
            adminResults.forEach((admin, i) => {
                message += `  ${i+1}. ${admin.name} (${admin.adminId})\n`;
            });
            message += '\n';
        }
        if (workerResults.length > 0) {
            message += '👷 Workers Found (' + workerResults.length + '):\n';
            workerResults.forEach((worker, i) => {
                message += `  ${i+1}. ${worker.name} (${worker.workerId})\n`;
            });
        }
        if (adminResults.length === 0 && workerResults.length === 0) {
            message += '❌ No results found.';
        }
        alert(message);
    } catch (error) {
        console.error('Search error:', error);
    }
}

// ============================================================
// ✅ LOAD NOTIFICATIONS (MASTER - reads from /api/admins/notifications)
// Same endpoint as all pages → so Clear/Mark-Read stays in sync
// ============================================================
async function loadNotifications() {
    try {
        const response = await fetch('/api/admins/notifications', { cache: 'no-store' });
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
// ✅ MARK SINGLE NOTIFICATION AS READ (UI only)
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
// ✅ MASTER: MARK ALL AS READ (global — sab pages se clear hoga)
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
    
    // ✅ Backend call — sabhi pages ke liye targetRole: 'Owner' read ho jayega
    fetch('/api/admins/notifications/mark-all-read', { method: 'PUT' })
        .then(() => {
            showCustomToast('✅ All notifications marked as read', 'success');
        })
        .catch(err => {
            console.error('markAllRead failed:', err);
            showCustomToast('❌ Failed to mark as read', 'error');
        });
}

// ============================================================
// ✅ MASTER: CLEAR ALL NOTIFICATIONS (global — sab pages se delete)
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

// Expose globals
window.markAllRead = markAllRead;
window.markNotificationRead = markNotificationRead;
window.clearAllNotifications = clearAllNotifications;
window.showCustomToast = showCustomToast;
window.loadNotifications = loadNotifications;

// ============================================================
// DASHBOARD DATA
// ============================================================
async function loadDashboardData() {
    try {
        const [adminsRes, workersRes, attendanceRes, projectsRes, payrollRes] = await Promise.all([
            fetch('/api/admins'),
            fetch('/api/workers'),
            fetch('/api/worker-attendance'),
            fetch('/api/projects'),
            fetch('/api/worker-payroll')
        ]);

        const admins = await adminsRes.json();
        const workers = await workersRes.json();
        const attendance = await attendanceRes.json();
        const projects = await projectsRes.json();
        const payroll = await payrollRes.json();

        updateStats(admins, workers, attendance, projects, payroll);
        updateCharts(attendance);

    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function updateStats(admins, workers, attendance, projects, payroll) {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('totalAdmins').textContent = admins.length || 0;
    document.getElementById('totalWorkers').textContent = workers.length || 0;

    const todayAttendance = attendance.filter(a => a.date === today);
    const presentToday = todayAttendance.filter(a => a.status === 'Present').length;
    const absentToday = todayAttendance.filter(a => a.status === 'Absent').length;
    const lateToday = todayAttendance.filter(a => a.status === 'Late').length;
    const totalToday = todayAttendance.length || 1;

    document.getElementById('presentToday').textContent = presentToday || 0;
    document.getElementById('absentToday').textContent = absentToday || 0;
    document.getElementById('lateToday').textContent = lateToday || 0;
    
    document.getElementById('presentPercent').textContent = `${Math.round((presentToday / totalToday) * 100)}%`;
    document.getElementById('absentPercent').textContent = `${Math.round((absentToday / totalToday) * 100)}%`;
    document.getElementById('latePercent').textContent = `${Math.round((lateToday / totalToday) * 100)}%`;

    const activeProjects = projects.filter(p => p.status !== 'Completed').length;
    document.getElementById('activeProjects').textContent = activeProjects || 0;

    const uniqueSites = new Set(projects.map(p => p.location));
    document.getElementById('totalSites').textContent = uniqueSites.size || 0;

    const totalPayroll = payroll.reduce((sum, p) => sum + (p.netSalary || 0), 0);
    document.getElementById('totalPayroll').textContent = totalPayroll > 0 ? `₹${(totalPayroll / 100000).toFixed(1)}L` : '₹0';

    document.getElementById('payrollUsers').textContent = payroll.length || 0;
    document.getElementById('paidThisMonth').textContent = payroll.filter(p => p.status === 'Paid').length || 0;
    document.getElementById('pendingPayments').textContent = payroll.filter(p => p.status === 'Pending').length || 0;
}

function updateCharts(attendance) {
    const ctx1 = document.getElementById('weeklyChart')?.getContext('2d');
    if (ctx1) {
        const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const today = new Date();
        const weekData = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayAttendance = attendance.filter(a => a.date === dateStr);
            const present = dayAttendance.filter(a => a.status === 'Present').length;
            const absent = dayAttendance.filter(a => a.status === 'Absent').length;
            weekData.push({ present, absent });
        }

        if (window.weeklyChartInstance) window.weeklyChartInstance.destroy();

        window.weeklyChartInstance = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: weekDays,
                datasets: [
                    { label: 'Present', data: weekData.map(d => d.present), backgroundColor: '#2563eb', borderRadius: 4 },
                    { label: 'Absent', data: weekData.map(d => d.absent), backgroundColor: '#f04438', borderRadius: 4 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top', labels: { usePointStyle: true, pointStyle: 'circle', padding: 20 } } },
                scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } }
            }
        });
    }

    const ctx2 = document.getElementById('monthlyChart')?.getContext('2d');
    if (ctx2) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyData = [];
        const year = new Date().getFullYear();
        
        for (let i = 0; i < 12; i++) {
            const monthAttendance = attendance.filter(a => {
                const aDate = new Date(a.date);
                return aDate.getMonth() === i && aDate.getFullYear() === year;
            });
            const present = monthAttendance.filter(a => a.status === 'Present').length;
            const total = monthAttendance.length || 1;
            monthlyData.push(Math.round((present / total) * 100));
        }

        const avg = Math.round(monthlyData.reduce((a, b) => a + b, 0) / monthlyData.length);
        document.getElementById('avgAttendance').textContent = `${avg}%`;

        if (window.monthlyChartInstance) window.monthlyChartInstance.destroy();

        window.monthlyChartInstance = new Chart(ctx2, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Attendance Rate %',
                    data: monthlyData,
                    borderColor: '#7a5af8',
                    backgroundColor: 'rgba(122, 90, 248, 0.1)',
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#7a5af8',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' }, grid: { color: '#f1f5f9' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }
}

// Inject CSS for mobile animation
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