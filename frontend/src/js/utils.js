// Modal and UI Utilities

class Modal {
    constructor(modalId) {
        this.modal = document.getElementById(modalId);
        this.closeBtn = this.modal?.querySelector('.modal-close');
        this.submitBtn = this.modal?.querySelector('.btn-submit');
        this.cancelBtn = this.modal?.querySelector('.btn-cancel');
        
        this.closeBtn?.addEventListener('click', () => this.close());
        this.cancelBtn?.addEventListener('click', () => this.close());
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });
    }

    open() {
        if (this.modal) {
            this.modal.classList.add('show');
            this.modal.style.display = 'flex';
        }
    }

    close() {
        if (this.modal) {
            this.modal.classList.remove('show');
            this.modal.style.display = 'none';
        }
    }

    getFormData() {
        const form = this.modal?.querySelector('form');
        if (!form) return {};
        const formData = new FormData(form);
        return Object.fromEntries(formData);
    }

    clearForm() {
        const form = this.modal?.querySelector('form');
        if (form) {
            form.reset();
            form.querySelectorAll('.form-group').forEach(group => {
                group.classList.remove('error');
                const error = group.querySelector('.form-error');
                if (error) error.textContent = '';
            });
        }
    }

    showError(fieldName, message) {
        const form = this.modal?.querySelector('form');
        const input = form?.querySelector(`[name="${fieldName}"]`);
        if (input) {
            const group = input.closest('.form-group');
            if (group) {
                group.classList.add('error');
                const error = group.querySelector('.form-error');
                if (error) error.textContent = message;
            }
        }
    }

    setSubmitHandler(callback) {
        if (this.submitBtn) {
            this.submitBtn.onclick = () => {
                const formData = this.getFormData();
                callback(formData);
            };
        }
    }
}

// Toast Notification
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Format date helper
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Filter data by search term
function filterBySearch(items, searchTerm, searchFields) {
    if (!searchTerm) return items;
    const lowerSearch = searchTerm.toLowerCase();
    return items.filter(item => 
        searchFields.some(field => 
            String(item[field]).toLowerCase().includes(lowerSearch)
        )
    );
}

// Filter data by multiple conditions
function filterItems(items, filters) {
    return items.filter(item => {
        return Object.entries(filters).every(([key, value]) => {
            if (!value) return true;
            return item[key] === value;
        });
    });
}

// Paginate items
function paginate(items, page = 1, itemsPerPage = 10) {
    const totalPages = Math.ceil(items.length / itemsPerPage);
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return {
        items: items.slice(start, end),
        page,
        totalPages,
        totalItems: items.length
    };
}

// Create table row for work orders
function createWorkOrderRow(wo, options = {}) {
    const { canEdit = true, canDelete = true, editLabel = 'Edit', editIcon = 'fa-solid fa-pencil', deleteLabel = 'Delete' } = options;
    const actions = [];

    if (canEdit) {
        actions.push(`<button class="action-btn-trigger edit-btn" data-id="${wo.id}" title="${editLabel}"><i class="${editIcon}"></i></button>`);
    }

    if (canDelete) {
        actions.push(`<button class="action-btn-trigger delete-btn" data-id="${wo.id}" title="${deleteLabel}"><i class="fa-regular fa-trash-can"></i></button>`);
    }

    return `
        <tr>
            <td class="slate-id-text">WO-${String(wo.id).padStart(4, '0')}</td>
            <td class="bold-cell-text">${wo.title}</td>
            <td class="secondary-cell-text">
                <span class="status-badge ${wo.priority.toLowerCase()}">${wo.priority}</span>
            </td>
            <td class="secondary-cell-text">
                <span class="status-badge ${wo.status.toLowerCase()}">${wo.status}</span>
            </td>
            <td class="secondary-cell-text">${wo.assigned_name || 'Unassigned'}</td>
            <td class="secondary-cell-text">${formatDate(wo.created_at)}</td>
            <td class="text-right actionable-cell-icons">
                ${actions.join('')}
            </td>
        </tr>
    `;
}

// Create table row for assets
function createAssetRow(asset) {
    const perms = window.__assetPermissions || {};
    const canEdit = perms.canEdit === undefined ? true : !!perms.canEdit;
    const canDelete = perms.canDelete === undefined ? true : !!perms.canDelete;
    const actions = [];
    if (canEdit) actions.push(`<button class="action-btn-trigger edit-btn" data-id="${asset.id}" title="Edit"><i class="fa-solid fa-pencil"></i></button>`);
    if (canDelete) actions.push(`<button class="action-btn-trigger delete-btn" data-id="${asset.id}" title="Delete"><i class="fa-regular fa-trash-can"></i></button>`);

    return `
        <tr>
            <td class="slate-id-text">AS-${String(asset.id).padStart(4, '0')}</td>
            <td class="bold-cell-text">${asset.name}</td>
            <td class="secondary-cell-text">${asset.type}</td>
            <td class="secondary-cell-text">
                <span class="status-badge ${asset.status.toLowerCase()}">${asset.status}</span>
            </td>
            <td class="secondary-cell-text">${asset.location}</td>
            <td class="text-right actionable-cell-icons">
                ${actions.join('')}
            </td>
        </tr>
    `;
}

// Create table row for tenant requests
function createTenantRow(req) {
    const perms = window.__tenantPermissions || {};
    const canEdit = perms.canEdit === undefined ? true : !!perms.canEdit;
    const canDelete = perms.canDelete === undefined ? true : !!perms.canDelete;
    const actions = [];
    if (canEdit) actions.push(`<button class="action-btn-trigger edit-btn" data-id="${req.id}" title="Edit"><i class="fa-solid fa-pencil"></i></button>`);
    if (canDelete) actions.push(`<button class="action-btn-trigger delete-btn" data-id="${req.id}" title="Delete"><i class="fa-regular fa-trash-can"></i></button>`);

    return `
        <tr>
            <td class="slate-id-text">TR-${String(req.id).padStart(4, '0')}</td>
            <td class="bold-cell-text">${req.tenant_name}</td>
            <td class="secondary-cell-text">${req.subject}</td>
            <td class="secondary-cell-text">
                <span class="status-badge ${req.status.toLowerCase()}">${req.status}</span>
            </td>
            <td class="secondary-cell-text">${req.tenant_email}</td>
            <td class="text-right actionable-cell-icons">
                ${actions.join('')}
            </td>
        </tr>
    `;
}

// Create table row for contacts
function createContactRow(contact) {
    const perms = window.__contactPermissions || {};
    const canDelete = perms.canDelete === undefined ? true : !!perms.canDelete;
    const actions = [];
    actions.push(`<button class="action-btn-trigger view-btn" data-id="${contact.id}" title="View"><i class="fa-solid fa-eye"></i></button>`);
    if (canDelete) actions.push(`<button class="action-btn-trigger delete-btn" data-id="${contact.id}" title="Delete"><i class="fa-regular fa-trash-can"></i></button>`);

    return `
        <tr>
            <td class="slate-id-text">CO-${String(contact.id).padStart(4, '0')}</td>
            <td class="bold-cell-text">${contact.name}</td>
            <td class="secondary-cell-text">${contact.email}</td>
            <td class="secondary-cell-text">${contact.subject}</td>
            <td class="secondary-cell-text">
                <span class="status-badge ${contact.status.toLowerCase()}">${contact.status}</span>
            </td>
            <td class="text-right actionable-cell-icons">
                ${actions.join('')}
            </td>
        </tr>
    `;
}

// Render pagination controls
function renderPagination(totalPages, currentPage, onPageChange) {
    const container = document.querySelector('.pagination');
    if (!container) return;
    
    let html = '';
    html += `<button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="handlePageChange(${currentPage - 1})">← Previous</button>`;
    html += `<span class="pagination-info">Page ${currentPage} of ${totalPages}</span>`;
    html += `<button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="handlePageChange(${currentPage + 1})">Next →</button>`;
    
    container.innerHTML = html;
}

// Global page change handler
let currentPage = 1;
function handlePageChange(page) {
    currentPage = page;
    if (window.loadCurrentPage) {
        window.loadCurrentPage();
    }
}

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (!token || !user) {
        window.location.href = '/public/login.html';
        return false;
    }
    return true;
}

// Export for use
window.Modal = Modal;
window.showToast = showToast;
window.formatDate = formatDate;
window.filterBySearch = filterBySearch;
window.filterItems = filterItems;
window.paginate = paginate;
window.createWorkOrderRow = createWorkOrderRow;
window.createAssetRow = createAssetRow;
window.createTenantRow = createTenantRow;
window.createContactRow = createContactRow;
window.renderPagination = renderPagination;
window.checkAuth = checkAuth;
