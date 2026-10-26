// ============================================================
// WORKER MANAGEMENT - COMPLETE FIXED VERSION
// ============================================================

let currentPage = 1;
const itemsPerPage = 8;
let totalItems = 0;
let totalPages = 1;
let allWorkers = [];

// ============================================================
// TOAST
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
// DOM READY
// ============================================================
document.addEventListener('DOMContentLoaded', function () {

    // Auth check
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.name) {
        window.location.href = '/';
        return;
    }

    // Profile
    const userNameElement = document.getElementById('userName');
    if (userNameElement) userNameElement.textContent = user.name;

    const profileImg = document.querySelector('.profile img');
    if (profileImg) {
        profileImg.src = `https://ui-avatars.com/api/?name=${user.name}&background=7c3aed&color=fff`;
    }

    // Date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        dateElement.textContent = new Date().toLocaleDateString('en-US', options) + ' · All sites';
    }

    // ============================================================
    // NAVIGATION
    // ============================================================
    document.getElementById('admindashBtn')?.addEventListener('click', (e) => { e.preventDefault(); window.location.href = '/admin-dashboard'; });
    document.getElementById('workerattendBtn')?.addEventListener('click', (e) => { e.preventDefault(); window.location.href = '/workerattend'; });
    document.getElementById('aprojectsBtn')?.addEventListener('click', (e) => { e.preventDefault(); window.location.href = '/kaam'; });
    document.getElementById('areportsBtn')?.addEventListener('click', (e) => { e.preventDefault(); window.location.href = '/areports'; });
    document.getElementById('wpayrollBtn')?.addEventListener('click', (e) => { e.preventDefault(); window.location.href = '/wpayroll'; });
    document.getElementById('settingsBtn')?.addEventListener('click', (e) => { e.preventDefault(); window.location.href = '/settings'; });
    document.getElementById('settingsBtnTop')?.addEventListener('click', () => { window.location.href = '/settings'; });
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('user');
            window.location.href = '/';
        }
    });
    document.querySelector('.profile')?.addEventListener('click', () => {
        if (confirm('Do you want to logout?')) {
            localStorage.removeItem('user');
            window.location.href = '/';
        }
    });

    // ============================================================
    // NOTIFICATION DROPDOWN
    // ============================================================
    const notificationBtn = document.getElementById('notificationBtn');

    const notificationDropdown = document.createElement('div');
    notificationDropdown.className = 'notification-dropdown';
    notificationDropdown.id = 'notificationDropdown';
    notificationDropdown.innerHTML = `
        <div class="dropdown-header">
            <h4>Notifications</h4>
            <button onclick="markAllRead()">Mark all read</button>
        </div>
        <div id="notificationList">
            <div class="no-notifications">Loading notifications...</div>
        </div>
    `;
    document.querySelector('.top-right').appendChild(notificationDropdown);

    notificationBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        const dropdown = document.getElementById('notificationDropdown');
        dropdown.classList.toggle('show');
        if (dropdown.classList.contains('show')) {
            loadNotifications();
        }
    });

    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown && !dropdown.contains(e.target) && e.target !== notificationBtn) {
            dropdown.classList.remove('show');
        }
    });

    // ============================================================
    // LOAD PROJECTS
    // ============================================================
    async function loadProjectsForFilters() {
        try {
            const response = await fetch('/api/projects');
            const projects = await response.json();

            const projectNames = [...new Set(projects.map(p => p.name || p.projectName))].filter(Boolean);

            const projectFilter = document.getElementById('projectFilter');
            if (projectFilter) {
                let options = '<option value="">All Projects</option>';
                projectNames.forEach(name => {
                    options += `<option value="${name}">${name}</option>`;
                });
                projectFilter.innerHTML = options;
            }

            const workerProject = document.getElementById('workerProject');
            if (workerProject) {
                let options = '<option value="">Select Project</option>';
                projectNames.forEach(name => {
                    options += `<option value="${name}">${name}</option>`;
                });
                workerProject.innerHTML = options;
            }
        } catch (error) {
            console.error('Error loading projects for filters:', error);
        }
    }

    // ============================================================
    // LOAD WORKERS
    // ============================================================
    async function loadWorkers(page = 1) {
        try {
            const search = document.getElementById('searchWorker')?.value || '';
            const searchGlobal = document.getElementById('globalSearch')?.value || '';
            const searchTerm = search || searchGlobal;

            const category = document.getElementById('categoryFilter')?.value || '';
            const project = document.getElementById('projectFilter')?.value || '';

            let url = `/api/workers?`;
            if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}&`;
            if (category) url += `category=${encodeURIComponent(category)}&`;
            if (project) url += `project=${encodeURIComponent(project)}&`;

            const response = await fetch(url, { cache: 'no-store' });
            allWorkers = await response.json();

            totalItems = allWorkers.length;
            totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

            if (page > totalPages) page = totalPages;
            if (page < 1) page = 1;
            currentPage = page;

            const start = (page - 1) * itemsPerPage;
            const end = Math.min(start + itemsPerPage, totalItems);
            const paginatedWorkers = allWorkers.slice(start, end);

            const tbody = document.getElementById('workerTableBody');
            if (tbody) {
                if (paginatedWorkers.length === 0) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="8" style="text-align: center; padding: 40px; color: var(--text-muted);">
                                <i class="fa-solid fa-users-slash" style="font-size: 32px; display: block; margin-bottom: 8px;"></i>
                                No workers found
                            </td>
                        </tr>
                    `;
                } else {
                    tbody.innerHTML = paginatedWorkers.map(worker => `
                        <tr>
                            <td>
                                <div class="avatar">${getInitials(worker.name)}</div>
                            </td>
                            <td><strong>${worker.workerId || 'WB-0000'}</strong></td>
                            <td>${worker.name}</td>
                            <td>${worker.phone}</td>
                            <td>${worker.project}</td>
                            <td>${worker.category}</td>
                            <td><span class="status-badge ${(worker.status || 'Active').toLowerCase().replace(' ', '-')}">${worker.status || 'Active'}</span></td>
                            <td>
                                <div class="action-buttons">
                                    <button class="view-btn" onclick="viewWorker('${worker._id}')">
                                        <i class="fa-solid fa-eye"></i>
                                    </button>
                                    <button class="edit-btn" onclick="editWorker('${worker._id}')">
                                        <i class="fa-solid fa-pen"></i>
                                    </button>
                                    <button class="delete-btn" onclick="deleteWorker('${worker._id}')">
                                        <i class="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('');
                }
            }

            const startEntry = totalItems === 0 ? 0 : start + 1;
            const endEntry = Math.min(end, totalItems);
            const entriesInfo = document.getElementById('entriesInfo');
            if (entriesInfo) {
                entriesInfo.textContent = totalItems === 0
                    ? 'No entries found'
                    : `Showing ${startEntry} to ${endEntry} of ${totalItems} entries`;
            }

            const prevBtn = document.getElementById('prevPage');
            const nextBtn = document.getElementById('nextPage');
            if (prevBtn) prevBtn.disabled = page <= 1;
            if (nextBtn) nextBtn.disabled = page >= totalPages || totalPages === 0;

            updatePageNumbers();

        } catch (error) {
            console.error('Error loading workers:', error);
            const tbody = document.getElementById('workerTableBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 40px; color: var(--text-muted);">
                            <i class="fa-solid fa-exclamation-circle" style="font-size: 24px; display: block; margin-bottom: 8px;"></i>
                            Failed to load workers. Please try again.
                        </td>
                    </tr>
                `;
            }
            showToast('❌ Failed to load workers', 'error');
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
            btn.onclick = () => {
                currentPage = i;
                loadWorkers(i);
            };
            container.appendChild(btn);
        }
    }

    function getInitials(name) {
        if (!name) return '??';
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    }

    // ============================================================
    // VIEW WORKER
    // ============================================================
    async function viewWorker(id) {
        try {
            const response = await fetch(`/api/workers/${id}`);
            const worker = await response.json();
            showToast(
                `👤 ${worker.name}\n` +
                `ID: ${worker.workerId || 'N/A'}\n` +
                `Phone: ${worker.phone}\n` +
                `Email: ${worker.email || 'N/A'}\n` +
                `Project: ${worker.project}\n` +
                `Category: ${worker.category}\n` +
                `Status: ${worker.status}`,
                'info'
            );
        } catch (error) {
            showToast('❌ Error loading worker details', 'error');
        }
    }

    // ============================================================
    // EDIT WORKER
    // ============================================================
    async function editWorker(id) {
        try {
            const response = await fetch(`/api/workers/${id}`);
            const worker = await response.json();

            const modalTitle = document.getElementById('modalTitle');
            const submitBtn = document.getElementById('submitBtn');

            if (modalTitle) modalTitle.textContent = '✏️ Edit Worker';
            if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-pen"></i> Update Worker';

            document.getElementById('workerName').value = worker.name || '';
            document.getElementById('workerPhone').value = worker.phone || '';
            document.getElementById('workerEmail').value = worker.email || '';
            document.getElementById('workerProject').value = worker.project || '';
            document.getElementById('workerCategory').value = worker.category || '';
            document.getElementById('workerStatus').value = worker.status || 'Active';

            const form = document.getElementById('workerForm');
            form.dataset.mode = 'edit';
            form.dataset.id = id;

            document.getElementById('workerModal').style.display = 'block';

            form.onsubmit = async function (e) {
                e.preventDefault();

                const submitBtn = document.getElementById('submitBtn');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating...';
                submitBtn.disabled = true;

                const updatedData = {
                    name: document.getElementById('workerName').value.trim(),
                    phone: document.getElementById('workerPhone').value.trim(),
                    email: document.getElementById('workerEmail').value.trim() || null,
                    project: document.getElementById('workerProject').value,
                    category: document.getElementById('workerCategory').value,
                    status: document.getElementById('workerStatus').value,
                    updatedBy: user.name // ✅ FORCE ADMIN NAME
                };

                try {
                    const res = await fetch(`/api/workers/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatedData)
                    });

                    const data = await res.json();

                    if (res.ok) {
                        showToast('✅ Worker updated successfully!', 'success');
                        document.getElementById('workerModal').style.display = 'none';
                        form.onsubmit = null;
                        await loadWorkers(currentPage);
                        await loadProjectsForFilters();
                        await loadNotifications();
                    } else {
                        showToast('❌ ' + (data.error || 'Failed to update worker'), 'error');
                    }
                } catch (err) {
                    console.error(err);
                    showToast('❌ Error updating worker', 'error');
                } finally {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            };

        } catch (error) {
            showToast('❌ Error loading worker for editing', 'error');
        }
    }

    // ============================================================
    // DELETE WORKER
    // ============================================================
    async function deleteWorker(id) {
        if (!confirm('⚠️ Are you sure you want to delete this worker?')) return;

        try {
            // ✅ FORCE ADMIN NAME IN QUERY
            const response = await fetch(`/api/workers/${id}?deletedBy=${encodeURIComponent(user.name)}`, { method: 'DELETE' });

            if (response.ok) {
                showToast('✅ Worker deleted successfully!', 'success');
                if (allWorkers.length - 1 <= (currentPage - 1) * itemsPerPage && currentPage > 1) {
                    currentPage--;
                }
                await loadWorkers(currentPage);
                await loadProjectsForFilters();
                await loadNotifications();
            } else {
                const data = await response.json();
                showToast('❌ ' + (data.error || 'Failed to delete worker'), 'error');
            }
        } catch (error) {
            showToast('❌ Error deleting worker', 'error');
        }
    }

    // ============================================================
    // ADD WORKER MODAL
    // ============================================================
    const modal = document.getElementById('workerModal');
    const addBtn = document.getElementById('addWorkerBtn');
    const closeBtn = document.querySelector('.close');

    addBtn?.addEventListener('click', () => {
        modal.style.display = 'block';
        document.getElementById('modalTitle').textContent = 'Add New Worker';
        document.getElementById('submitBtn').innerHTML = '<i class="fa-solid fa-plus"></i> Add Worker';

        const form = document.getElementById('workerForm');
        form.reset();
        form.dataset.mode = 'add';
        form.dataset.id = '';
        form.onsubmit = null;

        loadProjectsForFilters();
    });

    closeBtn?.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // ============================================================
    // ADD WORKER FORM SUBMIT
    // ============================================================
    document.getElementById('workerForm')?.addEventListener('submit', async function (e) {
        e.preventDefault();

        const form = e.target;
        if (form.dataset.mode === 'edit') return;

        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
        submitBtn.disabled = true;

        const workerData = {
            name: document.getElementById('workerName').value.trim(),
            phone: document.getElementById('workerPhone').value.trim(),
            email: document.getElementById('workerEmail').value.trim() || null,
            project: document.getElementById('workerProject').value,
            category: document.getElementById('workerCategory').value,
            status: document.getElementById('workerStatus').value,
            addedBy: user.name // ✅ FORCE ADMIN NAME
        };

        try {
            const response = await fetch('/api/workers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(workerData)
            });

            const data = await response.json();

            if (response.ok) {
                showToast('✅ Worker added successfully!', 'success');
                document.getElementById('workerModal').style.display = 'none';
                form.reset();
                currentPage = 1;
                await loadWorkers(1);
                await loadProjectsForFilters();
                await loadNotifications();
            } else {
                showToast('❌ ' + (data.error || 'Failed to add worker'), 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('❌ Error adding worker: ' + error.message, 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });

    // ============================================================
    // SEARCH & FILTERS
    // ============================================================
    document.getElementById('searchWorker')?.addEventListener('input', function () {
        const v = this.value.trim();
        const g = document.getElementById('globalSearch');
        if (g && g.value !== v) g.value = v;
        currentPage = 1;
        loadWorkers(1);
    });

    document.getElementById('globalSearch')?.addEventListener('input', function () {
        const v = this.value.trim();
        const s = document.getElementById('searchWorker');
        if (s && s.value !== v) s.value = v;
        currentPage = 1;
        loadWorkers(1);
    });

    document.getElementById('categoryFilter')?.addEventListener('change', () => {
        currentPage = 1;
        loadWorkers(1);
    });

    document.getElementById('projectFilter')?.addEventListener('change', () => {
        currentPage = 1;
        loadWorkers(1);
    });

    // ============================================================
    // PAGINATION
    // ============================================================
    document.getElementById('prevPage')?.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadWorkers(currentPage);
        }
    });

    document.getElementById('nextPage')?.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadWorkers(currentPage);
        }
    });

    // ============================================================
    // IMPORT EXCEL
    // ============================================================
    document.getElementById('importBtn')?.addEventListener('click', () => {
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
                        const workerData = {
                            name: row.Name || row.name || row.NAME || '',
                            phone: row.Phone || row.phone || row.PHONE || '',
                            email: row.Email || row.email || row.EMAIL || null,
                            project: row.Project || row.project || row.PROJECT || '',
                            category: row.Category || row.category || row.CATEGORY || '',
                            status: row.Status || row.status || row.STATUS || 'Active',
                            addedBy: user.name // ✅ FORCE ADMIN NAME
                        };

                        if (!workerData.name || !workerData.phone || !workerData.project || !workerData.category) {
                            errors++;
                            continue;
                        }

                        const response = await fetch('/api/workers', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(workerData)
                        });

                        if (response.ok) added++;
                        else errors++;
                    } catch {
                        errors++;
                    }
                }

                showToast(`✅ Imported ${added} workers${errors > 0 ? `, ${errors} failed` : ''}`, 'success');
                currentPage = 1;
                await loadWorkers(1);
                await loadProjectsForFilters();
                await loadNotifications();

            } catch (error) {
                showToast('❌ Error importing file: ' + error.message, 'error');
            }
        };
        fileInput.click();
    });

    // ============================================================
    // EXPORT EXCEL
    // ============================================================
    document.getElementById('exportBtn')?.addEventListener('click', () => {
        try {
            if (allWorkers.length === 0) {
                showToast('❌ No data to export', 'error');
                return;
            }

            const exportData = allWorkers.map(w => ({
                'Worker ID': w.workerId || 'N/A',
                'Name': w.name || '',
                'Phone': w.phone || '',
                'Email': w.email || '',
                'Project': w.project || '',
                'Category': w.category || '',
                'Status': w.status || 'Active'
            }));

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);
            XLSX.utils.book_append_sheet(wb, ws, 'Workers');
            XLSX.writeFile(wb, `workers_${new Date().toISOString().split('T')[0]}.xlsx`);

            showToast(`✅ Exported ${exportData.length} workers successfully!`, 'success');
        } catch (error) {
            showToast('❌ Error exporting data: ' + error.message, 'error');
        }
    });

    // ============================================================
    // NOTIFICATIONS
    // ============================================================
    async function loadNotifications() {
        try {
            const response = await fetch('/api/workers/notifications');
            const notifications = await response.json();

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
        } catch (error) {
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

    function getNotificationIcon(type) {
        const icons = {
            'created': 'fa-plus-circle',
            'updated': 'fa-pen',
            'deleted': 'fa-trash',
            'status_changed': 'fa-exchange-alt'
        };
        return icons[type] || 'fa-bell';
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

    function markNotificationRead() {
        document.querySelectorAll('.notification-item').forEach(item => {
            item.classList.remove('unread');
            item.classList.add('read');
            const dot = item.querySelector('.notif-dot');
            if (dot) dot.remove();
        });
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            badge.textContent = '0';
            badge.style.display = 'none';
        }
        setTimeout(() => {
            document.getElementById('notificationDropdown')?.classList.remove('show');
        }, 1000);
    }

    function markAllRead() {
        document.querySelectorAll('.notification-item.unread').forEach(item => {
            item.classList.remove('unread');
            item.classList.add('read');
            const dot = item.querySelector('.notif-dot');
            if (dot) dot.remove();
        });
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            badge.textContent = '0';
            badge.style.display = 'none';
        }
        showToast('✅ All notifications marked as read', 'success');
    }

    // ============================================================
    // EXPOSE GLOBALS
    // ============================================================
    window.viewWorker = viewWorker;
    window.editWorker = editWorker;
    window.deleteWorker = deleteWorker;
    window.loadWorkers = loadWorkers;
    window.loadNotifications = loadNotifications;
    window.loadProjectsForFilters = loadProjectsForFilters;
    window.markAllRead = markAllRead;
    window.markNotificationRead = markNotificationRead;
    window.showToast = showToast;

    // ============================================================
    // INITIAL LOAD
    // ============================================================
    loadProjectsForFilters();
    loadWorkers(1);
    loadNotifications();

    setInterval(loadNotifications, 30000); 

    console.log('✅ SiteForce Worker Management ready!');
});