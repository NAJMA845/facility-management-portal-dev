// Tenants Page Script
let allRequests = [];
let filteredRequests = [];
let currentFilter = 'all';
let tenantsCurrentPage = 1;
const itemsPerPage = 10;
let modal;
let editingId = null;

async function init() {
    if (!checkAuth()) return;
    
    modal = new Modal('tenantModal');

    // Permissions
    const userRole = (window.authGuard && window.authGuard.getUser && window.authGuard.getUser()?.role) || '';
    const canEdit = ['admin','super-admin','manager'].includes(userRole);
    const canDelete = ['admin','super-admin','manager'].includes(userRole);
    window.__tenantPermissions = { canEdit, canDelete };
    
    // Load requests
    await loadRequests();
    
    // Setup event listeners
    document.getElementById('addRequestBtn')?.addEventListener('click', () => openModal());
    document.getElementById('searchInput')?.addEventListener('input', handleSearch);
    document.querySelectorAll('.filter-badge').forEach(badge => {
        badge.addEventListener('click', (e) => handleFilter(e.currentTarget.dataset.filter, e.currentTarget));
    });
    
    modal.setSubmitHandler(handleSubmit);
}

async function loadRequests() {
    const requests = await window.api.getTenants();
    allRequests = requests || [];
    filteredRequests = [...allRequests];
    loadCurrentPage();
}

function handleFilter(filter, clickedBadge) {
    currentFilter = filter;
    tenantsCurrentPage = 1;
    
    document.querySelectorAll('.filter-badge').forEach(badge => badge.classList.remove('active'));
    clickedBadge?.classList.add('active');
    
    if (filter === 'all') {
        filteredRequests = [...allRequests];
    } else {
        filteredRequests = allRequests.filter(r => r.status === filter);
    }
    
    applySearch();
}

function handleSearch() {
    tenantsCurrentPage = 1;
    applySearch();
}

function applySearch() {
    const searchTerm = document.getElementById('searchInput').value;
    let result = filteredRequests;
    
    if (searchTerm) {
        result = filterBySearch(result, searchTerm, ['tenant_name', 'subject', 'tenant_email']);
    }
    
    loadCurrentPage(result);
}

function loadCurrentPage(items = filteredRequests) {
    const paginated = paginate(items, tenantsCurrentPage, itemsPerPage);
    renderTable(paginated.items);
    renderPagination(paginated.totalPages, tenantsCurrentPage);
}

window.loadCurrentPage = loadCurrentPage;

function renderTable(requests) {
    const tbody = document.getElementById('tenantsTableBody');
    
    if (requests.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 32px;"><div class="empty-state"><div class="empty-state-icon"><i class="fa-solid fa-inbox"></i></div><div class="empty-state-title">No Requests</div><div class="empty-state-text">No maintenance requests found.</div></div></td></tr>`;
        return;
    }
    
    tbody.innerHTML = requests.map(req => createTenantRow(req)).join('');
    
    tbody.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            const req = allRequests.find(r => r.id === id);
            if (req) openModal(req);
        });
    });
    
    tbody.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            const perms = window.__tenantPermissions || {};
            if (!perms.canDelete) { showToast('You do not have permission to delete requests', 'error'); return; }
            deleteRequest(id);
        });
    });
}

function openModal(request = null) {
    modal.clearForm();
    document.getElementById('modalTitle').textContent = request ? 'Edit Request' : 'New Maintenance Request';
    document.getElementById('statusGroup').style.display = request ? 'block' : 'none';
    editingId = request?.id || null;
    
    // Reset all fields for fresh form
    document.getElementById('tenantName').value = '';
    document.getElementById('tenantEmail').value = '';
    document.getElementById('tenantSubject').value = '';
    document.getElementById('tenantDescription').value = '';
    document.getElementById('tenantStatus').value = 'pending';
    
    if (request) {
        document.getElementById('tenantName').value = request.tenant_name;
        document.getElementById('tenantEmail').value = request.tenant_email;
        document.getElementById('tenantSubject').value = request.subject;
        document.getElementById('tenantDescription').value = request.description;
        document.getElementById('tenantStatus').value = request.status;
    }
    
    modal.open();
}

async function handleSubmit(formData) {
    if (!formData.tenant_name || !formData.tenant_email || !formData.subject || !formData.description) {
        if (!formData.tenant_name) modal.showError('tenant_name', 'Tenant name is required');
        if (!formData.tenant_email) modal.showError('tenant_email', 'Email is required');
        if (!formData.subject) modal.showError('subject', 'Subject is required');
        if (!formData.description) modal.showError('description', 'Description is required');
        return;
    }
    
    try {
        if (editingId) {
            const result = await window.api.updateTenantRequest(editingId, {
                tenant_name: formData.tenant_name,
                tenant_email: formData.tenant_email,
                subject: formData.subject,
                description: formData.description,
                status: formData.status
            });
            if (result) {
                showToast('Request updated successfully', 'success');
                modal.close();
                await loadRequests();
            } else {
                showToast('Failed to update request', 'error');
            }
        } else {
            const result = await window.api.createTenantRequest(
                formData.tenant_name,
                formData.tenant_email,
                formData.subject,
                formData.description
            );
            if (result) {
                showToast('Request created successfully', 'success');
                modal.close();
                await loadRequests();
            } else {
                showToast('Failed to create request', 'error');
            }
        }
    } catch (err) {
        console.error('Error:', err);
        showToast('An error occurred', 'error');
    }
}

async function deleteRequest(id) {
    if (!confirm('Delete this request?')) return;
    
    try {
        const result = await window.api.deleteTenantRequest(id);
        if (result) {
            showToast('Request deleted successfully', 'success');
            await loadRequests();
        } else {
            showToast('Failed to delete request', 'error');
        }
    } catch (err) {
        console.error('Error:', err);
        showToast('An error occurred', 'error');
    }
}

document.addEventListener('DOMContentLoaded', init);
