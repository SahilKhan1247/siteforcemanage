// ============================================================
// ADMIN DASHBOARD - COMPLETE REAL-TIME VERSION
// ============================================================

let weeklyChartInstance = null;
let sitePerformanceChartInstance = null;
let allWorkersData = [];
let allAttendanceData = [];
let allProjectsData = [];
let allPayrollData = [];
let allAdminsData = [];

// ============================================================
// ✅ CUSTOM TOAST (Like Owner Dashboard)
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

// Alias for older code calls
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

    // Set admin name in banner
    const adminNameElement = document.getElementById('adminName');
    if (adminNameElement) {
        adminNameElement.textContent = user.name;
    }

    // Update profile image
    const profileImg = document.querySelector('.profile img');
    if (profileImg) {
        profileImg.src = `https://ui-avatars.com/api/?name=${user.name}&background=7c3aed&color=fff`;
    }

    // Set profile text
    const profileSmall = document.querySelector('.profile-text small');
    if (profileSmall) {
        profileSmall.textContent = 'Admin';
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

    // Set banner date
    const bannerDate = document.getElementById('bannerDate');
    if (bannerDate) {
        bannerDate.textContent = today.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
        });
    }

    // ============================================================
    // NAVIGATION
    // ============================================================
    document.getElementById('workersmangBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = '/workersmang';
    });

    document.getElementById('workerattendBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = '/workerattend';
    });

    document.getElementById('aprojectsBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = '/kaam';
    });

    document.getElementById('areportsBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = '/areports';
    });

    document.getElementById('wpayrollBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = '/wpayroll';
    });

    document.getElementById('settingsBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = '/settings';
    });

    // Settings button in topbar
    document.getElementById('settingsBtnTop')?.addEventListener('click', function() {
        window.location.href = '/settings';
    });

    document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('user');
            window.location.href = '/';
        }
    });

    // Profile click
    document.querySelector('.profile')?.addEventListener('click', function() {
        if (confirm('Do you want to logout?')) {
            localStorage.removeItem('user');
            window.location.href = '/';
        }
    });

    // ============================================================
    // ✅ NOTIFICATION DROPDOWN (With Announcement Support & Clear All)
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
    // SEARCH
    // ============================================================
    document.getElementById('globalSearch')?.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        if (searchTerm.length > 0) {
            searchDashboard(searchTerm);
        }
    });

    // ============================================================
    // LOAD ALL DATA
    // ============================================================
    loadDashboardData();

    // Auto-refresh every 60 seconds
    setInterval(() => {
        loadDashboardData();
    }, 60000);
    
    // Notification polling every 10 seconds
    setInterval(loadNotifications, 10000);
});

// ============================================================
// LOAD DASHBOARD DATA
// ============================================================
async function loadDashboardData() {
    try {
        const [workersRes, attendanceRes, projectsRes, adminsRes, payrollRes] = await Promise.all([
            fetch('/api/workers'),
            fetch('/api/worker-attendance'),
            fetch('/api/projects'),
            fetch('/api/admins'),
            fetch('/api/worker-payroll')
        ]);

        allWorkersData = await workersRes.json();
        allAttendanceData = await attendanceRes.json();
        allProjectsData = await projectsRes.json();
        allAdminsData = await adminsRes.json();
        allPayrollData = await payrollRes.json();

        // Update all UI components
        updateStats();
        updateBanner();
        updateCharts();
        updateActivity();

        console.log('✅ Dashboard data loaded successfully!');
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showToast('❌ Failed to load dashboard data', 'error');
    }
}

// ============================================================
// UPDATE STATS
// ============================================================
function updateStats() {
    const today = new Date().toISOString().split('T')[0];
    const totalWorkers = allWorkersData.length;
    const activeProjects = allProjectsData.filter(p => p.status !== 'Completed').length;
    const uniqueSites = new Set(allProjectsData.map(p => p.location)).size;

    // Today's attendance
    const todayAttendance = allAttendanceData.filter(a => a.date === today);
    const presentToday = todayAttendance.filter(a => a.status === 'Present').length;
    const absentToday = todayAttendance.filter(a => a.status === 'Absent').length;
    const lateToday = todayAttendance.filter(a => a.status === 'Late').length;
    const totalToday = todayAttendance.length || 1;

    // Calculate payroll
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthPayroll = allPayrollData.filter(p => {
        const pDate = new Date(p.salaryDate || p.createdAt);
        return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
    });
    const totalPayroll = monthPayroll.reduce((sum, p) => sum + (p.netSalary || 0), 0);

    // Pending approvals (leave requests)
    const pendingApprovals = allAttendanceData.filter(a => a.status === 'On Leave' || a.status === 'Late').length;

    // Update cards
    document.getElementById('totalWorkers').textContent = totalWorkers || 0;
    document.getElementById('presentToday').textContent = presentToday || 0;
    document.getElementById('absentToday').textContent = absentToday || 0;
    document.getElementById('lateToday').textContent = lateToday || 0;
    document.getElementById('activeProjects').textContent = activeProjects || 0;
    document.getElementById('totalSites').textContent = uniqueSites || 0;
    document.getElementById('totalPayroll').textContent = totalPayroll > 0 ? `₹${(totalPayroll / 100000).toFixed(1)}L` : '₹0';
    document.getElementById('pendingApprovals').textContent = pendingApprovals || 0;

    // Update percentages
    document.getElementById('presentPercent').textContent = `${Math.round((presentToday / totalToday) * 100)}%`;
    document.getElementById('absentPercent').textContent = `${Math.round((absentToday / totalToday) * 100)}%`;
    document.getElementById('latePercent').textContent = `${Math.round((lateToday / totalToday) * 100)}%`;
}

// ============================================================
// UPDATE BANNER
// ============================================================
function updateBanner() {
    const today = new Date().toISOString().split('T')[0];
    const totalWorkers = allWorkersData.length;
    const todayAttendance = allAttendanceData.filter(a => a.date === today);
    const presentToday = todayAttendance.filter(a => a.status === 'Present').length;
    const totalToday = todayAttendance.length || 1;
    const attendanceRate = Math.round((presentToday / totalToday) * 100);
    const activeProjects = allProjectsData.filter(p => p.status !== 'Completed').length;

    document.getElementById('bannerTotalWorkers').textContent = totalWorkers || 0;
    document.getElementById('bannerPresent').textContent = presentToday || 0;
    document.getElementById('bannerAttendanceRate').textContent = `${attendanceRate}%`;
    document.getElementById('bannerActiveProjects').textContent = activeProjects || 0;
}

// ============================================================
// UPDATE CHARTS - REAL TIME
// ============================================================
function updateCharts() {
    updateWeeklyChart();
    updateSitePerformanceChart();
}

// ============================================================
// UPDATE WEEKLY CHART
// ============================================================
function updateWeeklyChart() {
    const ctx = document.getElementById('dailyCheckinsChart')?.getContext('2d');
    if (!ctx) return;

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const weekData = [];

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayAttendance = allAttendanceData.filter(a => a.date === dateStr);
        weekData.push(dayAttendance.filter(a => a.status === 'Present').length);
    }

    if (weeklyChartInstance) {
        weeklyChartInstance.destroy();
    }

    weeklyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [{
                label: 'Check-ins',
                data: weekData,
                backgroundColor: ['#2563eb', '#3b82f6', '#60a5fa', '#93bbfc', '#2563eb', '#3b82f6', '#60a5fa'],
                borderRadius: 6,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#f1f5f9' },
                    ticks: {
                        callback: function(value) {
                            return value + ' workers';
                        }
                    }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

// ============================================================
// UPDATE SITE PERFORMANCE CHART - REAL TIME PROJECTS
// ============================================================
function updateSitePerformanceChart() {
    const ctx = document.getElementById('sitePerformanceChart')?.getContext('2d');
    if (!ctx) return;

    // Get project data from database
    const projects = allProjectsData;
    const projectNames = projects.map(p => p.name);
    const projectData = projects.map(p => {
        // Calculate attendance rate for each project
        const projectWorkers = allWorkersData.filter(w => w.project === p.name);
        const workerIds = projectWorkers.map(w => w._id);
        const projectAttendance = allAttendanceData.filter(a => 
            workerIds.includes(a.workerId?._id || a.workerId)
        );
        const total = projectAttendance.length || 1;
        const present = projectAttendance.filter(a => a.status === 'Present').length;
        return Math.round((present / total) * 100);
    });

    if (sitePerformanceChartInstance) {
        sitePerformanceChartInstance.destroy();
    }

    // Colors for projects
    const colors = ['#2563eb', '#7c3aed', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#f472b6', '#34d399'];

    sitePerformanceChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: projectNames,
            datasets: [{
                data: projectData,
                backgroundColor: colors.slice(0, projectNames.length),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 16,
                        font: { size: 12 }
                    }
                }
            },
            cutout: '65%'
        }
    });
}

// ============================================================
// UPDATE ACTIVITY - REAL TIME
// ============================================================
function updateActivity() {
    const activityList = document.getElementById('activityList');
    if (!activityList) return;

    // Get recent attendance records
    const recentAttendance = allAttendanceData
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10);

    if (recentAttendance.length === 0) {
        activityList.innerHTML = `
            <div class="activity-item">
                <div class="activity-icon blue">
                    <i class="fa-regular fa-clock"></i>
                </div>
                <div class="activity-content">
                    <p>No recent activity found</p>
                    <span class="activity-time">Check back later</span>
                </div>
            </div>
        `;
        return;
    }

    const statusIcons = {
        'Present': { icon: 'fa-solid fa-check', color: 'green' },
        'Absent': { icon: 'fa-solid fa-xmark', color: 'red' },
        'Late': { icon: 'fa-solid fa-clock', color: 'orange' },
        'On Leave': { icon: 'fa-solid fa-calendar-xmark', color: 'purple' }
    };

    activityList.innerHTML = recentAttendance.map(att => {
        const worker = att.workerId || {};
        const status = att.status || 'Present';
        const statusInfo = statusIcons[status] || statusIcons['Present'];
        const timeDiff = formatTimeAgo(att.createdAt || att.date);
        
        return `
            <div class="activity-item">
                <div class="activity-icon ${statusInfo.color}">
                    <i class="${statusInfo.icon}"></i>
                </div>
                <div class="activity-content">
                    <p><strong>${worker.name || 'Unknown'}</strong> marked as 
                    <strong>${status}</strong> at ${worker.project || 'Unknown site'}</p>
                    <span class="activity-time">${timeDiff}</span>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================================
// FORMAT TIME AGO
// ============================================================
function formatTimeAgo(timestamp) {
    if (!timestamp) return 'Just now';
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
// SEARCH DASHBOARD
// ============================================================
function searchDashboard(searchTerm) {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            card.style.display = 'block';
            card.classList.add('highlight');
        } else {
            card.style.display = 'none';
            card.classList.remove('highlight');
        }
    });

    // Reset after 5 seconds
    setTimeout(() => {
        cards.forEach(card => {
            card.style.display = 'block';
            card.classList.remove('highlight');
        });
    }, 5000);
}

// ============================================================
// ✅ NOTIFICATION FUNCTIONS
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
                else if (notif.type === 'announcement') { iconClass = 'fa-bullhorn'; iconColor = 'status_changed'; } // ✅ Megaphone Icon

                return `
                <div class="notification-item ${notif.read ? 'read' : 'unread'}" onclick="markNotificationRead('${notif._id}')">
                    <div class="notif-icon ${iconColor}">
                        <i class="fa-solid ${iconClass}"></i>
                    </div>
                    <div class="notif-content">
                        <p>${notif.message}</p>
                        <small>${formatTimeAgo(notif.timestamp)}</small>
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
        const list = document.getElementById('notificationList');
        if (list) {
            list.innerHTML = `
                <div class="no-notifications">
                    <i class="fa-solid fa-exclamation-circle"></i>
                    <p>Failed to load notifications</p>
                </div>
            `;
        }
    }
}

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
        } else {
            badge.textContent = '0';
            badge.style.display = 'none';
        }
    }
}

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
        }
    } catch (error) {
        console.error('Error clearing notifications:', error);
        showCustomToast('❌ Error clearing notifications', 'error');
    }
}

// ============================================================
// MAKE FUNCTIONS GLOBALLY ACCESSIBLE
// ============================================================
window.markAllRead = markAllRead;
window.markNotificationRead = markNotificationRead;
window.clearAllNotifications = clearAllNotifications;
window.loadDashboardData = loadDashboardData;
window.loadNotifications = loadNotifications;
window.showCustomToast = showCustomToast;
window.showToast = showToast;

// ============================================================
// MOBILE ANIMATION CSS
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