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

    // ✅ FIXED: Set user role dynamically based on localStorage
    const userRoleElement = document.querySelector('.profile-text small');
    if (userRoleElement) {
        userRoleElement.textContent = (user.role === 'owner') ? 'Owner' : 'Admin';
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
    // ✅ NOTIFICATION CODE - DYNAMIC ROLE SUPPORT
    // ============================================================
    const notificationBtn = document.querySelector('.notification');
    
    // Create notification dropdown
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

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown && !dropdown.contains(e.target) && e.target !== notificationBtn) {
            dropdown.classList.remove('show');
        }
    });

    // ============================================================
    // ✅ SETTINGS CLICK - FIXED
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
    
    const settingsIcon = document.querySelector('.setting i');
    if (settingsIcon) {
        settingsIcon.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = '/settings';
        });
    }

    // ✅ PROFILE CLICK - LOGOUT CONFIRMATION
    document.querySelector('.profile')?.addEventListener('click', function() {
        if (confirm('Do you want to logout?')) {
            localStorage.removeItem('user');
            window.location.href = '/';
        }
    });

    // ============= NAVIGATION =============
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

    document.getElementById('reportsBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = '/reports';
    });

    document.getElementById('apayrollBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = '/apayroll';
    });

    document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('user');
            window.location.href = '/';
        }
    });

    // Filter buttons
    document.querySelectorAll('.btn-filter').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            loadProjects(this.textContent.trim());
        });
    });

    // Load projects
    loadProjects();

    // Modal controls
    setupModal();

    // Search
    document.getElementById('globalSearch')?.addEventListener('input', function() {
        loadProjects(null, this.value);
    });

    // Load notifications
    loadNotifications();

    // ✅ Auto-refresh notifications every 10 seconds
    setInterval(loadNotifications, 10000);
});

// Setup Modal
function setupModal() {
    const modal = document.getElementById('projectModal');
    const addBtn = document.getElementById('addProjectBtn');
    const closeBtn = document.querySelector('.close');

    addBtn?.addEventListener('click', function() {
        modal.style.display = 'block';
        const form = document.getElementById('projectForm');
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add Project';
        form.onsubmit = handleAddProject;
        form.reset();
        document.getElementById('modalTitle').textContent = 'Add New Project';
        form.dataset.mode = 'add';
        form.dataset.id = '';
    });

    closeBtn?.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    function handleAddProject(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
        submitBtn.disabled = true;
        
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userName = user.name;
        const userRole = (user.role === 'owner') ? 'Owner' : 'Admin';
        
        const projectData = {
            name: document.getElementById('projectName').value,
            client: document.getElementById('projectClient').value,
            location: document.getElementById('projectLocation').value,
            startDate: document.getElementById('projectStart').value,
            completionDate: document.getElementById('projectCompletion').value || null,
            supervisor: document.getElementById('projectSupervisor').value,
            progress: parseInt(document.getElementById('projectProgress').value),
            budget: parseFloat(document.getElementById('projectBudget').value),
            type: document.getElementById('projectType').value,
            status: document.getElementById('projectStatus').value,
            user: userName,
            role: userRole
        };

        fetch('/api/projects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(projectData)
        })
        .then(response => response.json())
        .then(data => {
            if (data._id) {
                showCustomToast('✅ Project added successfully!');
                document.getElementById('projectModal').style.display = 'none';
                document.getElementById('projectForm').reset();
                loadProjects();
            } else {
                showCustomToast('❌ ' + (data.error || 'Failed to add project'), 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showCustomToast('❌ Error adding project: ' + error.message, 'error');
        })
        .finally(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });
    }

    document.getElementById('projectForm').onsubmit = handleAddProject;
}

// Load Projects
async function loadProjects(status = null, search = '') {
    try {
        const grid = document.getElementById('projectsGrid');
        if (grid) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <i class="fa-solid fa-spinner fa-spin" style="font-size: 48px; color: var(--blue);"></i>
                    <h3>Loading Projects...</h3>
                    <p>Please wait while we fetch your projects.</p>
                </div>
            `;
        }
        
        let url = `/api/projects?search=${encodeURIComponent(search)}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to fetch projects');
        }
        
        let projects = await response.json();

        // Filter by status if provided
        if (status && status !== 'All Statuses') {
            projects = projects.filter(p => p.status === status);
        }

        const count = document.getElementById('projectsCount');
        if (count) {
            count.textContent = `${projects.length} projects`;
        }

        if (!grid) return;

        if (projects.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <i class="fa-solid fa-hard-hat"></i>
                    <h3>No Projects Found</h3>
                    <p>Click "Add New Project" to create your first project.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = projects.map(project => {
            const statusClass = project.status?.replace(' ', '-') || 'On-Track';
            const progressColor = getProgressColor(project.progress);
            
            return `
                <div class="project-card status-${statusClass}">
                    <div class="project-header">
                        <h3>${project.name}</h3>
                        <span class="project-id">${project.projectId || 'PRJ-001'}</span>
                    </div>
                    <div class="project-client">
                        <i class="fa-solid fa-building"></i> ${project.client}
                    </div>
                    <div class="project-details">
                        <div class="detail-item">
                            <span class="label">Location</span>
                            <span class="value"><i class="fa-solid fa-location-dot"></i> ${project.location}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">Start</span>
                            <span class="value"><i class="fa-regular fa-calendar"></i> ${formatDate(project.startDate)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">Supervisor</span>
                            <span class="value"><i class="fa-solid fa-user"></i> ${project.supervisor}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">Status</span>
                            <span class="value"><span class="status-badge ${project.status?.toLowerCase().replace(' ', '-') || 'on-track'}">${project.status || 'On Track'}</span></span>
                        </div>
                    </div>
                    <div class="progress-section">
                        <div class="progress-header">
                            <span>Progress</span>
                            <span class="progress-percent">${project.progress || 0}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill ${progressColor}" style="width: ${project.progress || 0}%"></div>
                        </div>
                    </div>
                    <div class="project-footer-card">
                        <div class="budget">
                            ₹ ${project.budget || 0} <span>Cr</span>
                        </div>
                        <div class="project-actions">
                            <button class="view-btn" onclick="viewProject('${project._id}')">
                                <i class="fa-solid fa-eye"></i>
                            </button>
                            <button class="edit-btn" onclick="editProject('${project._id}')">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="delete-btn" onclick="deleteProject('${project._id}')">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading projects:', error);
        const grid = document.getElementById('projectsGrid');
        if (grid) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <i class="fa-solid fa-exclamation-circle" style="color: var(--red);"></i>
                    <h3>Failed to Load Projects</h3>
                    <p>${error.message}</p>
                    <br>
                    <button onclick="loadProjects()" style="padding: 10px 20px; background: var(--blue); color: white; border-radius: 6px; cursor: pointer; border: none;">
                        <i class="fa-solid fa-sync"></i> Retry
                    </button>
                </div>
            `;
        }
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getProgressColor(progress) {
    if (progress >= 75) return 'green';
    if (progress >= 40) return 'orange';
    return 'red';
}

// View Project
async function viewProject(id) {
    try {
        const response = await fetch(`/api/projects/${id}`);
        const project = await response.json();
        alert(
            `📋 Project Details\n\n` +
            `Name: ${project.name}\n` +
            `ID: ${project.projectId}\n` +
            `Client: ${project.client}\n` +
            `Location: ${project.location}\n` +
            `Start: ${formatDate(project.startDate)}\n` +
            `Completion: ${formatDate(project.completionDate)}\n` +
            `Supervisor: ${project.supervisor}\n` +
            `Progress: ${project.progress}%\n` +
            `Budget: ₹${project.budget} Cr\n` +
            `Type: ${project.type}\n` +
            `Status: ${project.status}`
        );
    } catch (error) {
        showCustomToast('❌ Error loading project details', 'error');
    }
}

// Edit Project
async function editProject(id) {
    try {
        const response = await fetch(`/api/projects/${id}`);
        const project = await response.json();
        
        document.getElementById('modalTitle').textContent = 'Edit Project';
        document.getElementById('submitBtn').innerHTML = '<i class="fa-solid fa-pen"></i> Update Project';
        document.getElementById('projectName').value = project.name;
        document.getElementById('projectClient').value = project.client;
        document.getElementById('projectLocation').value = project.location;
        document.getElementById('projectStart').value = project.startDate?.split('T')[0] || '';
        document.getElementById('projectCompletion').value = project.completionDate?.split('T')[0] || '';
        document.getElementById('projectSupervisor').value = project.supervisor;
        document.getElementById('projectProgress').value = project.progress;
        document.getElementById('projectBudget').value = project.budget;
        document.getElementById('projectType').value = project.type;
        document.getElementById('projectStatus').value = project.status;
        
        document.getElementById('projectModal').style.display = 'block';
        
        const form = document.getElementById('projectForm');
        form.dataset.mode = 'edit';
        form.dataset.id = id;
        
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userName = user.name;
        const userRole = (user.role === 'owner') ? 'Owner' : 'Admin';
        
        form.onsubmit = async function(e) {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submitBtn');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating...';
            submitBtn.disabled = true;
            
            const updatedData = {
                name: document.getElementById('projectName').value,
                client: document.getElementById('projectClient').value,
                location: document.getElementById('projectLocation').value,
                startDate: document.getElementById('projectStart').value,
                completionDate: document.getElementById('projectCompletion').value || null,
                supervisor: document.getElementById('projectSupervisor').value,
                progress: parseInt(document.getElementById('projectProgress').value),
                budget: parseFloat(document.getElementById('projectBudget').value),
                type: document.getElementById('projectType').value,
                status: document.getElementById('projectStatus').value,
                user: userName,
                role: userRole
            };

            try {
                const response = await fetch(`/api/projects/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatedData)
                });

                if (response.ok) {
                    showCustomToast('✅ Project updated successfully!');
                    document.getElementById('projectModal').style.display = 'none';
                    form.reset();
                    submitBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add Project';
                    loadProjects();
                } else {
                    const error = await response.json();
                    showCustomToast('❌ ' + (error.error || 'Failed to update project'), 'error');
                }
            } catch (error) {
                showCustomToast('❌ Error updating project: ' + error.message, 'error');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        };
        
    } catch (error) {
        showCustomToast('❌ Error loading project for editing', 'error');
    }
}

// Delete Project
async function deleteProject(id) {
    if (!confirm('⚠️ Are you sure you want to delete this project?')) return;
    
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userName = user.name;
        const userRole = (user.role === 'owner') ? 'Owner' : 'Admin';
        
        const response = await fetch(`/api/projects/${id}?user=${userName}&role=${userRole}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            const data = await response.json();
            showCustomToast(`✅ ${data.message}`);
            loadProjects();
        } else {
            const error = await response.json();
            showCustomToast('❌ ' + (error.error || 'Failed to delete project'), 'error');
        }
    } catch (error) {
        showCustomToast('❌ Error deleting project: ' + error.message, 'error');
    }
}

// ============================================================
// ✅ NEW CUSTOM TOAST (Like Owner Dashboard)
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

    // Animation In
    setTimeout(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    }, 50);

    // Animation Out
    setTimeout(() => {
        toast.style.transform = 'translateY(100px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ============================================================
// ✅ NOTIFICATION FUNCTIONS (DYNAMIC ROLE SUPPORT)
// ============================================================

// Load notifications
async function loadNotifications() {
    try {
        // ✅ DYNAMIC ROLE: Check current logged in user
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const role = (user.role === 'owner') ? 'Owner' : 'Admin';

        // ✅ Fetch based on role
        const response = await fetch(`/api/admins/notifications?role=${role}`, { cache: 'no-store' });
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
    
    // Update badge count
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
    }
    
    try {
        // ✅ DYNAMIC ROLE
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const role = (user.role === 'owner') ? 'Owner' : 'Admin';

        const res = await fetch(`/api/admins/notifications/mark-all-read?role=${role}`, { method: 'PUT' });
        if (!res.ok) throw new Error('Backend failed');
        showCustomToast('✅ All notifications marked as read', 'success');
        setTimeout(() => loadNotifications(), 200);
    } catch (err) {
        console.error('markAllRead failed:', err);
        showCustomToast('❌ Failed to mark as read', 'error');
    }
}

async function clearAllNotifications() {
    try {
        // ✅ DYNAMIC ROLE
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const role = (user.role === 'owner') ? 'Owner' : 'Admin';

        const response = await fetch(`/api/admins/notifications/clear?role=${role}`, {
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
// NAVIGATION - ADMIN SPECIFIC
// ============================================================
document.getElementById('workersmangBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    window.location.href = '/workersmang';
});

document.getElementById('workerattendBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    window.location.href = '/workerattend';
});

document.getElementById('admindashBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    window.location.href = '/admin-dashboard';
});

document.getElementById('areportsBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    window.location.href = '/areports';
});

document.getElementById('wpayrollBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    window.location.href = '/wpayroll';
});


// Make functions globally accessible
window.viewProject = viewProject;
window.editProject = editProject;
window.deleteProject = deleteProject;
window.loadProjects = loadProjects;
window.markAllRead = markAllRead;
window.markNotificationRead = markNotificationRead;
window.clearAllNotifications = clearAllNotifications;
window.showCustomToast = showCustomToast;
window.loadNotifications = loadNotifications;

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