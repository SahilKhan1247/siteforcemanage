// ============================================================
// ADMIN MANAGEMENT - COMPLETE FIXED VERSION (CLEAN)
// ============================================================

let currentPage = 1;
const itemsPerPage = 8;
let totalItems = 0;

// ============================================================
// TOAST NOTIFICATION
// ============================================================
function showToast(message, type = 'success') {
    const existingToast = document.getElementById('toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

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

    // Set user info
    const userNameElement = document.querySelector('.profile-text h4');
    if (userNameElement) userNameElement.textContent = user.name;
    const profileImg = document.querySelector('.profile img');
    if (profileImg) profileImg.src = `https://ui-avatars.com/api/?name=${user.name}&background=2563eb&color=fff`;
    const userRole = document.querySelector('.profile-text small');
    if (userRole) userRole.textContent = 'Owner';

    // Set current date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateElement = document.getElementById('currentDate');
    if (dateElement) dateElement.textContent = new Date().toLocaleDateString('en-US', options) + ' · All sites';

    // ============================================================
    // NAVIGATION
    // ============================================================
    document.getElementById('ownerdashBtn')?.addEventListener('click', e => { e.preventDefault(); window.location.href = '/owner-dashboard'; });
    document.getElementById('adminattendanceBtn')?.addEventListener('click', e => { e.preventDefault(); window.location.href = '/adminattend'; });
    document.getElementById('projectsBtn')?.addEventListener('click', e => { e.preventDefault(); window.location.href = '/projects'; });
    document.getElementById('reportsBtn')?.addEventListener('click', e => { e.preventDefault(); window.location.href = '/reports'; });
    document.getElementById('apayrollBtn')?.addEventListener('click', e => { e.preventDefault(); window.location.href = '/apayroll'; });
    document.getElementById('settingsBtn')?.addEventListener('click', e => { e.preventDefault(); window.location.href = '/settings'; });
    document.getElementById('logoutBtn')?.addEventListener('click', e => { e.preventDefault(); if (confirm('Are you sure you want to logout?')) { localStorage.removeItem('user'); window.location.href = '/'; } });

    document.querySelector('.setting')?.addEventListener('click', () => window.location.href = '/settings');
    document.querySelector('.profile')?.addEventListener('click', () => { if (confirm('Do you want to logout?')) { localStorage.removeItem('user'); window.location.href = '/'; } });

    // ============================================================
    // ✅ NOTIFICATION DROPDOWN
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

    // ✅ Fresh fetch on tab focus
    window.addEventListener('focus', () => loadNotifications());
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) loadNotifications();
    });

    // ============================================================
    // SEARCH AND FILTERS
    // ============================================================
    document.getElementById('searchAdmin')?.addEventListener('input', function() {
        const searchValue = this.value.trim();
        const globalSearch = document.getElementById('globalSearch');
        if (globalSearch && globalSearch.value !== searchValue) globalSearch.value = searchValue;
        currentPage = 1;
        loadAdmins(currentPage);
    });

    document.getElementById('globalSearch')?.addEventListener('input', function() {
        const searchValue = this.value.trim();
        const searchAdmin = document.getElementById('searchAdmin');
        if (searchAdmin && searchAdmin.value !== searchValue) searchAdmin.value = searchValue;
        currentPage = 1;
        loadAdmins(currentPage);
    });

    document.getElementById('roleFilter')?.addEventListener('change', () => { currentPage = 1; loadAdmins(currentPage); });
    document.getElementById('projectFilter')?.addEventListener('change', () => { currentPage = 1; loadAdmins(currentPage); });

    // ============================================================
    // PAGINATION
    // ============================================================
    document.getElementById('prevPage')?.addEventListener('click', function() {
        if (currentPage > 1) { currentPage--; loadAdmins(currentPage); }
    });
    document.getElementById('nextPage')?.addEventListener('click', function() {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (currentPage < totalPages) { currentPage++; loadAdmins(currentPage); }
    });
    document.querySelectorAll('.page-number').forEach(btn => {
        btn.addEventListener('click', function() {
            currentPage = parseInt(this.textContent);
            document.querySelectorAll('.page-number').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            loadAdmins(currentPage);
        });
    });

    // ============================================================
    // MODAL CONTROLS
    // ============================================================
    const modal = document.getElementById('adminModal');
    const addBtn = document.getElementById('addAdminBtn');
    const closeBtn = document.querySelector('.close');

    addBtn?.addEventListener('click', function() {
        modal.style.display = 'block';
        const form = document.getElementById('adminForm');
        const submitBtn = form.querySelector('.btn-submit');
        submitBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add Admin';
        form.onsubmit = handleAddAdmin;
        form.reset();
        document.querySelector('.modal-header h2').textContent = 'Add New Admin';
        loadProjectsForFilters();
    });

    closeBtn?.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

    function handleAddAdmin(e) {
        e.preventDefault();
        const adminData = {
            name: document.getElementById('adminName').value,
            email: document.getElementById('adminEmail').value,
            phone: document.getElementById('adminPhone').value,
            project: document.getElementById('adminProject').value,
            role: document.getElementById('adminRole').value,
            status: document.getElementById('adminStatus').value
        };
        fetch('/api/admins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(adminData) })
        .then(response => response.json())
        .then(data => {
            if (data._id) {
                showToast('✅ Admin added successfully!', 'success');
                document.getElementById('adminModal').style.display = 'none';
                document.getElementById('adminForm').reset();
                loadAdmins(currentPage);
                loadProjectsForFilters();
                loadNotifications();
            } else {
                showToast('❌ Failed to add admin', 'error');
            }
        })
        .catch(error => { showToast('❌ Error adding admin', 'error'); });
    }
    document.getElementById('adminForm').onsubmit = handleAddAdmin;

    // ============================================================
    // ✅ IMPORT EXCEL
    // ============================================================
    document.getElementById('importBtn')?.addEventListener('click', function() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.xlsx, .xls, .csv';
        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                showToast('📥 Reading file...', 'info');
                const data = await file.arrayBuffer();
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                if (jsonData.length === 0) {
                    showToast('❌ No data found in file', 'error');
                    return;
                }

                let added = 0, errors = 0;

                for (const row of jsonData) {
                    try {
                        const adminData = {
                            name: row.Name || row.name || row.NAME || '',
                            email: row.Email || row.email || row.EMAIL || '',
                            phone: row.Phone || row.phone || row.PHONE || '',
                            project: row.Project || row.project || row.PROJECT || '',
                            role: row.Role || row.role || row.ROLE || 'Site Admin',
                            status: row.Status || row.status || row.STATUS || 'Active'
                        };

                        if (!adminData.name || !adminData.email || !adminData.phone || !adminData.project || !adminData.role) {
                            errors++;
                            continue;
                        }

                        const response = await fetch('/api/admins', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(adminData)
                        });

                        if (response.ok) added++;
                        else errors++;
                    } catch {
                        errors++;
                    }
                }

                showToast(`✅ Imported ${added} admins${errors > 0 ? `, ${errors} failed` : ''}`, 'success');
                currentPage = 1;
                await loadAdmins(1);
                await loadProjectsForFilters();
                await loadNotifications();

            } catch (error) {
                showToast('❌ Error importing file: ' + error.message, 'error');
            }
        };
        fileInput.click();
    });

    document.getElementById('exportBtn')?.addEventListener('click', exportToExcel);

    // ============================================================
    // LOAD ALL DATA
    // ============================================================
    loadProjectsForFilters();
    loadAdmins(1);
    loadNotifications();

    setInterval(loadNotifications, 10000);
    setInterval(() => loadAdmins(currentPage), 60000);
});

// ============================================================
// ✅ NOTIFICATION FUNCTIONS
// ============================================================
async function loadNotifications() {
    try {
        // ✅ cache: 'no-store' — purani cache se unread dikhna band
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
                    badge.classList.remove('has-notification');
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
                badge.classList.remove('has-notification');
            }
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

// Format time
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

// Mark single notification as read
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
        } else {
            badge.textContent = '0';
            badge.style.display = 'none';
        }
    }

    try {
        await fetch(`/api/admins/notifications/${notifId}/read`, { method: 'PUT' });
    } catch (err) {
        console.error('markNotificationRead backend failed:', err);
    }
}

// ============================================================
// ✅ MARK ALL AS READ — await + fresh load (Clear All jaisa permanent)
// ============================================================
async function markAllRead() {
    // 1. UI turant
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
    
    // 2. Backend save + 3. fresh reload
    try {
        const res = await fetch('/api/admins/notifications/mark-all-read', { method: 'PUT' });
        if (!res.ok) throw new Error('Backend failed');
        showCustomToast('✅ All notifications marked as read', 'success');
        await loadNotifications();
    } catch (err) {
        console.error('markAllRead failed:', err);
        showCustomToast('❌ Failed to mark as read', 'error');
        await loadNotifications();
    }
}

// Clear all notifications
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
                badge.classList.remove('has-notification');
            }
            
            showCustomToast('✅ All notifications cleared!', 'success');
        }
    } catch (error) {
        console.error('Error clearing notifications:', error);
        showCustomToast('❌ Error clearing notifications', 'error');
    }
}

// ============================================================
// LOADERS & HELPERS
// ============================================================
async function loadProjectsForFilters() {
    try {
        const response = await fetch('/api/projects');
        const projects = await response.json();
        const projectNames = [...new Set(projects.map(p => p.name || p.projectName))].filter(Boolean);
        
        const projectFilter = document.getElementById('projectFilter');
        if (projectFilter) projectFilter.innerHTML = '<option value="">All Projects</option>' + projectNames.map(n => `<option value="${n}">${n}</option>`).join('');
        
        const adminProject = document.getElementById('adminProject');
        if (adminProject) adminProject.innerHTML = '<option value="">Select Project</option>' + projectNames.map(n => `<option value="${n}">${n}</option>`).join('');
    } catch (error) {
        console.error('Error loading projects:', error);
        const defaultProjects = ['Skyline Tower B', 'Metro Bridge', 'Harbor Logistics', 'Riverside Mall', 'Greenfield Estate', 'Airport Terminal 3'];
        const projectFilter = document.getElementById('projectFilter');
        if (projectFilter) projectFilter.innerHTML = '<option value="">All Projects</option>' + defaultProjects.map(n => `<option value="${n}">${n}</option>`).join('');
        const adminProject = document.getElementById('adminProject');
        if (adminProject) adminProject.innerHTML = '<option value="">Select Project</option>' + defaultProjects.map(n => `<option value="${n}">${n}</option>`).join('');
    }
}

async function loadAdmins(page = 1) {
    try {
        const searchTerm = document.getElementById('searchAdmin')?.value || document.getElementById('globalSearch')?.value || '';
        const role = document.getElementById('roleFilter')?.value || '';
        const project = document.getElementById('projectFilter')?.value || '';
        
        let url = `/api/admins?search=${encodeURIComponent(searchTerm)}&role=${encodeURIComponent(role)}&project=${encodeURIComponent(project)}`;
        const response = await fetch(url);
        const admins = await response.json();

        totalItems = admins.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
        
        if (page > totalPages) page = totalPages;
        if (page < 1) page = 1;
        currentPage = page;
        
        const start = (page - 1) * itemsPerPage;
        const end = Math.min(start + itemsPerPage, totalItems);
        const paginatedAdmins = admins.slice(start, end);

        const tbody = document.getElementById('adminTableBody');
        if (tbody) {
            if (paginatedAdmins.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 40px; color: var(--text-muted);"><i class="fa-solid fa-users-slash" style="font-size: 32px; display: block; margin-bottom: 8px;"></i>No admins found</td></tr>`;
            } else {
                tbody.innerHTML = paginatedAdmins.map(admin => `
                    <tr>
                        <td><div class="avatar">${getInitials(admin.name)}</div></td>
                        <td><strong>${admin.adminId || 'AD-' + String(admin._id).slice(-4).toUpperCase()}</strong></td>
                        <td>${admin.name}</td>
                        <td>${admin.phone || 'N/A'}</td>
                        <td>${admin.project || 'N/A'}</td>
                        <td>${admin.role || 'N/A'}</td>
                        <td><span class="status-badge ${admin.status?.toLowerCase().replace(' ', '-') || 'active'}">${admin.status || 'Active'}</span></td>
                        <td>
                            <div class="action-buttons">
                                <button class="view-btn" onclick="viewAdmin('${admin._id}')"><i class="fa-solid fa-eye"></i></button>
                                <button class="edit-btn" onclick="editAdmin('${admin._id}')"><i class="fa-solid fa-pen"></i></button>
                                <button class="delete-btn" onclick="deleteAdmin('${admin._id}')"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </td>
                    </tr>`).join('');
            }
        }

        const startEntry = totalItems === 0 ? 0 : start + 1;
        const endEntry = Math.min(end, totalItems);
        document.getElementById('entriesInfo').textContent = totalItems === 0 ? 'No entries found' : `Showing ${startEntry} to ${endEntry} of ${totalItems} entries`;

        document.getElementById('prevPage').disabled = page <= 1;
        document.getElementById('nextPage').disabled = page >= totalPages || totalPages === 0;

        const pageNumbers = document.querySelectorAll('.page-number');
        pageNumbers.forEach((btn, index) => {
            const pageNum = index + 1;
            if (pageNum <= totalPages) {
                btn.textContent = pageNum;
                btn.style.display = 'flex';
                btn.classList.toggle('active', pageNum === page);
            } else {
                btn.style.display = 'none';
            }
        });

        localStorage.setItem('adminPage', page);

    } catch (error) {
        console.error('Error loading admins:', error);
        const tbody = document.getElementById('adminTableBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 40px; color: var(--text-muted);"><i class="fa-solid fa-exclamation-circle" style="font-size: 24px; display: block; margin-bottom: 8px;"></i>Failed to load admins.</td></tr>`;
        }
        showToast('❌ Failed to load admins', 'error');
    }
}

function getInitials(name) {
    if (!name) return '??';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
}

async function viewAdmin(id) {
    try {
        const response = await fetch(`/api/admins/${id}`);
        const admin = await response.json();
        showToast(`👤 Admin Details\n\nName: ${admin.name}\nID: ${admin.adminId || 'N/A'}\nEmail: ${admin.email}\nPhone: ${admin.phone || 'N/A'}\nProject: ${admin.project || 'N/A'}\nRole: ${admin.role || 'N/A'}\nStatus: ${admin.status || 'Active'}`, 'info');
    } catch (error) { showToast('❌ Error loading admin details', 'error'); }
}

async function editAdmin(id) {
    try {
        const response = await fetch(`/api/admins/${id}`);
        const admin = await response.json();
        
        document.getElementById('adminName').value = admin.name || '';
        document.getElementById('adminEmail').value = admin.email || '';
        document.getElementById('adminPhone').value = admin.phone || '';
        document.getElementById('adminProject').value = admin.project || '';
        document.getElementById('adminRole').value = admin.role || '';
        document.getElementById('adminStatus').value = admin.status || 'Active';
        
        document.getElementById('adminModal').style.display = 'block';
        document.querySelector('.modal-header h2').textContent = '✏️ Edit Admin';
        
        const form = document.getElementById('adminForm');
        const submitBtn = form.querySelector('.btn-submit');
        submitBtn.innerHTML = '<i class="fa-solid fa-pen"></i> Update Admin';
        
        form.onsubmit = async function(e) {
            e.preventDefault();
            const updatedData = {
                name: document.getElementById('adminName').value,
                email: document.getElementById('adminEmail').value,
                phone: document.getElementById('adminPhone').value,
                project: document.getElementById('adminProject').value,
                role: document.getElementById('adminRole').value,
                status: document.getElementById('adminStatus').value
            };
            try {
                const response = await fetch(`/api/admins/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedData) });
                if (response.ok) {
                    showToast('✅ Admin updated successfully!', 'success');
                    document.getElementById('adminModal').style.display = 'none';
                    form.reset();
                    submitBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add Admin';
                    loadAdmins(currentPage);
                    loadProjectsForFilters();
                    loadNotifications();
                } else {
                    showToast('❌ Failed to update admin', 'error');
                }
            } catch (error) { showToast('❌ Error updating admin', 'error'); }
        };
    } catch (error) { showToast('❌ Error loading admin for editing', 'error'); }
}

async function deleteAdmin(id) {
    if (!confirm('⚠️ Are you sure you want to delete this admin?')) return;
    try {
        const response = await fetch(`/api/admins/${id}`, { method: 'DELETE' });
        if (response.ok) {
            showToast('✅ Admin deleted successfully!', 'success');
            loadAdmins(currentPage);
            loadProjectsForFilters();
            loadNotifications();
        } else { showToast('❌ Failed to delete admin', 'error'); }
    } catch (error) { showToast('❌ Error deleting admin', 'error'); }
}

function exportToExcel() {
    try {
        const tbody = document.getElementById('adminTableBody');
        const rows = tbody.querySelectorAll('tr');
        if (rows.length === 0 || rows[0].textContent.includes('No admins found')) {
            showToast('❌ No data to export', 'error'); return;
        }
        let csvContent = "Admin ID,Name,Phone,Project,Role,Status\n";
        rows.forEach(row => {
            const cols = row.querySelectorAll('td');
            if (cols.length < 7) return;
            csvContent += `${cols[1]?.textContent?.trim()},${cols[2]?.textContent?.trim()},${cols[3]?.textContent?.trim()},${cols[4]?.textContent?.trim()},${cols[5]?.textContent?.trim()},${cols[6]?.textContent?.trim()}\n`;
        });
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `admins_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
        showToast('✅ Admins exported successfully!', 'success');
    } catch (error) { showToast('❌ Error exporting admins', 'error'); }
}

// ============================================================
// MAKE FUNCTIONS GLOBALLY ACCESSIBLE
// ============================================================
window.viewAdmin = viewAdmin;
window.editAdmin = editAdmin;
window.deleteAdmin = deleteAdmin;
window.loadAdmins = loadAdmins;
window.markAllRead = markAllRead;
window.markNotificationRead = markNotificationRead;
window.clearAllNotifications = clearAllNotifications;
window.exportToExcel = exportToExcel;
window.showToast = showToast;
window.showCustomToast = showCustomToast;
window.loadNotifications = loadNotifications;
window.loadProjectsForFilters = loadProjectsForFilters;