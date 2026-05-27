// Work Orders Page Script
let allWorkOrders = [];
let filteredWorkOrders = [];
let currentFilter = 'all';
let workOrdersCurrentPage = 1;
const itemsPerPage = 10;
let modal;
let editingId = null;
let allUsers = [];
let currentUserRole = '';

function isTechnician() {
    return currentUserRole === 'technician';
}

function toggleFieldVisibility(selector, visible) {
    document.querySelectorAll(selector).forEach((element) => {
        element.style.display = visible ? '' : 'none';
    });
}

function setWorkOrderFormMode(isEditable) {
    const titleField = document.getElementById('woTitle');
    const descriptionField = document.getElementById('woDescription');
    const priorityField = document.getElementById('woPriority');
    const statusField = document.getElementById('woStatus');
    const assignedToField = document.getElementById('woAssignedTo');
    const remarksField = document.getElementById('woRemarks');
    const completionDetailsField = document.getElementById('woCompletionDetails');

    [titleField, descriptionField, priorityField, assignedToField].forEach((field) => {
        if (field) field.disabled = !isEditable;
    });

    [statusField, remarksField, completionDetailsField].forEach((field) => {
        if (field) field.disabled = false;
    });

    toggleFieldVisibility('.manager-only-field', isEditable);
    toggleFieldVisibility('.technician-only-field', isTechnician());
}

async function init() {
    if (!checkAuth()) return;

    currentUserRole = (window.authGuard && window.authGuard.getUser && window.authGuard.getUser()?.role) || '';
    
    modal = new Modal('workOrderModal');
    
    // Load work orders and users
    await loadWorkOrders();
    await loadUsers();
    
    const addBtn = document.getElementById('addWorkOrderBtn');
    const canDeleteWorkOrders = ['admin', 'super-admin'].includes(currentUserRole);
    if (addBtn) {
        addBtn.style.display = isTechnician() ? 'none' : '';
        addBtn.addEventListener('click', () => openModal());
    }
    // store delete permission for row rendering
    window.__canDeleteWorkOrders = canDeleteWorkOrders;
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.querySelectorAll('.filter-badge').forEach(badge => {
        badge.addEventListener('click', (e) => handleFilter(e.target.dataset.filter, e.target));
    });
    
    modal.setSubmitHandler(handleSubmit);
}

async function loadWorkOrders() {
    try {
        const workOrders = await window.api.getWorkOrders();
        allWorkOrders = workOrders || [];
        filteredWorkOrders = [...allWorkOrders];
        loadCurrentPage();
    } catch (err) {
        console.error('Failed to load work orders', err);
        const tbody = document.getElementById('workOrdersTableBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Failed to load work orders.</td></tr>`;
        }
    }
}

async function loadUsers() {
    const canReadUsers = ['admin', 'super-admin', 'manager'].includes(currentUserRole);
    if (!canReadUsers) {
        allUsers = [];
        populateAssignedToSelect();
        return;
    }

    try {
        const users = await window.api.getUsers();
        allUsers = users || [];
    } catch (err) {
        console.warn('Failed to load users for assignment', err);
        allUsers = [];
    }
    populateAssignedToSelect();
}

function populateAssignedToSelect() {
    const select = document.getElementById('woAssignedTo');
    if (!select) return;

    select.innerHTML = '<option value="">Select Technician</option>';
    allUsers.forEach(user => {
        if (user.role === 'technician' || user.role === 'admin' || user.role === 'manager') {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.name;
            select.appendChild(option);
        }
    });
}

function handleFilter(filter, clickedBadge) {
    currentFilter = filter;
    workOrdersCurrentPage = 1;
    
    // Update active badge
    document.querySelectorAll('.filter-badge').forEach(badge => {
        badge.classList.remove('active');
    });
    if (clickedBadge) clickedBadge.classList.add('active');
    
    // Apply filter
    if (filter === 'all') {
        filteredWorkOrders = [...allWorkOrders];
    } else {
        filteredWorkOrders = allWorkOrders.filter(wo => wo.status === filter);
    }
    
    applySearch();
}

function handleSearch() {
    workOrdersCurrentPage = 1;
    applySearch();
}

function applySearch() {
    const searchTerm = document.getElementById('searchInput').value;
    let result = filteredWorkOrders;
    
    if (searchTerm) {
        result = filterBySearch(result, searchTerm, ['title', 'description', 'assigned_name']);
    }
    
    loadCurrentPage(result);
}

function loadCurrentPage(items = filteredWorkOrders) {
    const paginated = paginate(items, workOrdersCurrentPage, itemsPerPage);
    renderTable(paginated.items);
    renderPagination(paginated.totalPages, workOrdersCurrentPage, handlePageChange);
}

window.loadCurrentPage = loadCurrentPage;

function renderTable(workOrders) {
    const tbody = document.getElementById('workOrdersTableBody');
    
    if (workOrders.length === 0) {
        const emptyMessage = isTechnician()
            ? 'No assigned work orders found.'
            : 'No work orders found. Create one to get started.';
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 32px;"><div class="empty-state"><div class="empty-state-icon"><i class="fa-solid fa-inbox"></i></div><div class="empty-state-title">No Work Orders</div><div class="empty-state-text">${emptyMessage}</div></div></td></tr>`;
        return;
    }
    
    const canDelete = window.__canDeleteWorkOrders;
    tbody.innerHTML = workOrders.map((wo) => createWorkOrderRow(wo, {
        canEdit: true,
        canDelete: !!canDelete,
        editLabel: isTechnician() ? 'Update' : 'Edit',
        editIcon: isTechnician() ? 'fa-solid fa-pen-to-square' : 'fa-solid fa-pencil'
    })).join('');
    
    // Add event listeners
    tbody.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            const wo = allWorkOrders.find(w => w.id === id);
            if (wo) openModal(wo);
        });
    });
    
    tbody.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            deleteWorkOrder(id);
        });
    });
}

function openModal(workOrder = null) {
    modal.clearForm();
    document.getElementById('modalTitle').textContent = workOrder ? (isTechnician() ? 'Update Work Order' : 'Edit Work Order') : 'Add Work Order';
    editingId = workOrder?.id || null;
    
    if (workOrder) {
        document.getElementById('woTitle').value = workOrder.title;
        document.getElementById('woDescription').value = workOrder.description || '';
        document.getElementById('woPriority').value = workOrder.priority;
        document.getElementById('woStatus').value = workOrder.status;
        document.getElementById('woAssignedTo').value = workOrder.assigned_to || '';
        document.getElementById('woRemarks').value = workOrder.remarks || '';
        document.getElementById('woCompletionDetails').value = workOrder.completion_details || '';
    }
    
    setWorkOrderFormMode(!isTechnician());
    modal.open();
}

async function handleSubmit(formData) {
    // Validate
    if (!editingId && !formData.title && !isTechnician()) {
        modal.showError('title', 'Title is required');
        return;
    }
    if (!editingId && !formData.priority && !isTechnician()) {
        modal.showError('priority', 'Priority is required');
        return;
    }
    
    try {
        if (editingId) {
            const payload = isTechnician()
                ? {
                    status: formData.status,
                    remarks: formData.remarks,
                    completion_details: formData.completion_details
                }
                : {
                    title: formData.title,
                    description: formData.description,
                    priority: formData.priority,
                    status: formData.status,
                    assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : null,
                    remarks: formData.remarks,
                    completion_details: formData.completion_details
                };
            const result = await window.api.updateWorkOrder(editingId, payload);
            if (result) {
                showToast('Work order updated successfully', 'success');
                modal.close();
                await loadWorkOrders();
            } else {
                showToast('Failed to update work order', 'error');
            }
        } else if (!isTechnician()) {
            const result = await window.api.createWorkOrder(
                formData.title,
                formData.description,
                formData.priority,
                formData.assigned_to ? parseInt(formData.assigned_to) : null
            );
            if (result) {
                showToast('Work order created successfully', 'success');
                modal.close();
                await loadWorkOrders();
            } else {
                showToast('Failed to create work order', 'error');
            }
        }
    } catch (err) {
        console.error('Error:', err);
        showToast('An error occurred', 'error');
    }
}

async function deleteWorkOrder(id) {
    if (!confirm('Are you sure you want to delete this work order?')) return;
    
    try {
        const result = await window.api.deleteWorkOrder(id);
        if (result) {
            showToast('Work order deleted successfully', 'success');
            await loadWorkOrders();
        } else {
            showToast('Failed to delete work order', 'error');
        }
    } catch (err) {
        console.error('Error:', err);
        showToast('An error occurred', 'error');
    }
}

function handlePageChange(page) {
    workOrdersCurrentPage = page;
    loadCurrentPage();
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
