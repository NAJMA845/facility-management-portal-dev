// Contacts Page Script
let allContacts = [];
let filteredContacts = [];
let currentFilter = 'all';
let contactsCurrentPage = 1;
const itemsPerPage = 10;
let modal;
let selectedContactId = null;

async function init() {
    if (!checkAuth()) return;
    
    modal = new Modal('contactModal');

    const userRole = (window.authGuard && window.authGuard.getUser && window.authGuard.getUser()?.role) || '';
    const canManage = ['admin','super-admin','manager'].includes(userRole);
    window.__contactPermissions = { canManage };
    
    await loadContacts();
    
    document.getElementById('searchInput')?.addEventListener('input', handleSearch);
    document.querySelectorAll('.filter-badge').forEach(badge => {
        badge.addEventListener('click', (e) => handleFilter(e.currentTarget.dataset.filter, e.currentTarget));
    });
    
    const updateBtn = document.getElementById('updateStatusBtn');
    if (updateBtn) updateBtn.style.display = canManage ? '' : 'none';
    if (canManage) updateBtn?.addEventListener('click', updateContactStatus);
}

async function loadContacts() {
    const contacts = await window.api.getContacts();
    allContacts = contacts || [];
    filteredContacts = [...allContacts];
    loadCurrentPage();
}

function handleFilter(filter, clickedBadge) {
    currentFilter = filter;
    contactsCurrentPage = 1;
    
    document.querySelectorAll('.filter-badge').forEach(badge => badge.classList.remove('active'));
    clickedBadge?.classList.add('active');
    
    if (filter === 'all') {
        filteredContacts = [...allContacts];
    } else {
        filteredContacts = allContacts.filter(c => c.status === filter);
    }
    
    applySearch();
}

function handleSearch() {
    contactsCurrentPage = 1;
    applySearch();
}

function applySearch() {
    const searchTerm = document.getElementById('searchInput').value;
    let result = filteredContacts;
    
    if (searchTerm) {
        result = filterBySearch(result, searchTerm, ['name', 'email', 'subject']);
    }
    
    loadCurrentPage(result);
}

function loadCurrentPage(items = filteredContacts) {
    const paginated = paginate(items, contactsCurrentPage, itemsPerPage);
    renderTable(paginated.items);
    renderPagination(paginated.totalPages, contactsCurrentPage);
}

window.loadCurrentPage = loadCurrentPage;

function renderTable(contacts) {
    const tbody = document.getElementById('contactsTableBody');
    
    if (contacts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 32px;"><div class="empty-state"><div class="empty-state-icon"><i class="fa-solid fa-envelope"></i></div><div class="empty-state-title">No Messages</div></div></td></tr>`;
        return;
    }
    
    tbody.innerHTML = contacts.map(contact => createContactRow(contact)).join('');
    
    tbody.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            const contact = allContacts.find(c => c.id === id);
            if (contact) viewContact(contact);
        });
    });
    
    tbody.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            const perms = window.__contactPermissions || {};
            if (!perms.canManage) { showToast('You do not have permission to delete messages', 'error'); return; }
            deleteContact(id);
        });
    });
}

function viewContact(contact) {
    selectedContactId = contact.id;
    const details = document.getElementById('contactDetails');
    details.innerHTML = `
        <div style="background: #f1f5f9; padding: 16px; border-radius: 6px;">
            <p><strong>From:</strong> ${contact.name}</p>
            <p><strong>Email:</strong> ${contact.email}</p>
            <p><strong>Phone:</strong> ${contact.phone || 'N/A'}</p>
            <p><strong>Subject:</strong> ${contact.subject}</p>
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap; margin-top: 8px;">${contact.message}</p>
            <p><strong>Received:</strong> ${formatDate(contact.created_at)}</p>
        </div>
    `;
    document.getElementById('contactStatus').value = contact.status;
    modal.open();
}

async function updateContactStatus() {
    const status = document.getElementById('contactStatus').value;
    try {
        const result = await window.api.updateContactStatus(selectedContactId, status);
        if (result) {
            showToast('Status updated successfully', 'success');
            modal.close();
            await loadContacts();
        } else {
            showToast('Failed to update status', 'error');
        }
    } catch (err) {
        console.error('Error:', err);
        showToast('An error occurred', 'error');
    }
}

async function deleteContact(id) {
    if (!confirm('Delete this message?')) return;
    
    try {
        const result = await window.api.deleteContact(id);
        if (result) {
            showToast('Message deleted successfully', 'success');
            await loadContacts();
        } else {
            showToast('Failed to delete message', 'error');
        }
    } catch (err) {
        console.error('Error:', err);
        showToast('An error occurred', 'error');
    }
}

document.addEventListener('DOMContentLoaded', init);
