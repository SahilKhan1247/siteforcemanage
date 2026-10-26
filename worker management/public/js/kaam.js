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

    // Navigation - Admin
    document.getElementById('admindashBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = '/admin-dashboard';
    });

    document.getElementById('workersmangBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = '/workersmang';
    });

    document.getElementById('workerattendBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = '/workerattend';
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

    document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('user');
            window.location.href = '/';
        }
    });

    document.querySelector('.profile')?.addEventListener('click', function() {
        if (confirm('Do you want to logout?')) {
            localStorage.removeItem('user');
            window.location.href = '/';
        }
    });

    // Load projects
    loadProjects();

    // Modal controls
    setupModal();

    // Search
    document.getElementById('globalSearch')?.addEventListener('input', function() {
        loadProjects(null, this.value);
    });

    // Filter buttons
    document.querySelectorAll('.btn-filter').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            loadProjects(this.textContent.trim());
        });
    });
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
        const userRole = 'Admin';
        
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
                showToast('✅ Project added successfully!');
                document.getElementById('projectModal').style.display = 'none';
                document.getElementById('projectForm').reset();
                loadProjects();
            } else {
                showToast('❌ ' + (data.error || 'Failed to add project'), 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('❌ Error adding project: ' + error.message, 'error');
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
        showToast('❌ Error loading project details', 'error');
    }
}

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
        const userRole = 'Admin';
        
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
                    showToast('✅ Project updated successfully!');
                    document.getElementById('projectModal').style.display = 'none';
                    form.reset();
                    submitBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add Project';
                    loadProjects();
                } else {
                    const error = await response.json();
                    showToast('❌ ' + (error.error || 'Failed to update project'), 'error');
                }
            } catch (error) {
                showToast('❌ Error updating project: ' + error.message, 'error');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        };
        
    } catch (error) {
        showToast('❌ Error loading project for editing', 'error');
    }
}

async function deleteProject(id) {
    if (!confirm('⚠️ Are you sure you want to delete this project?')) return;
    
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userName = user.name;
        const userRole = 'Admin';
        
        const response = await fetch(`/api/projects/${id}?user=${userName}&role=${userRole}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            const data = await response.json();
            showToast(`✅ ${data.message}`);
            loadProjects();
        } else {
            const error = await response.json();
            showToast('❌ ' + (error.error || 'Failed to delete project'), 'error');
        }
    } catch (error) {
        showToast('❌ Error deleting project: ' + error.message, 'error');
    }
}

function showToast(message, type) {
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type || 'success'}`;
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }, 100);
}

// Make functions globally accessible
window.viewProject = viewProject;
window.editProject = editProject;
window.deleteProject = deleteProject;
window.loadProjects = loadProjects;