document.addEventListener('DOMContentLoaded', () => {
    if (window.authGuard) {
        const user = window.authGuard.protect({ allowedRoles: ['super-admin', 'admin'] });
        if (!user) return;
    }

    const tbody = document.getElementById('usersTableBody');
    const searchInput = document.querySelector('.search-bar-field');
    const addUserButton = document.querySelector('.primary-action-btn');
    const modal = new Modal('userModal');

    let allUsers = [];
    let editingUserId = null;

    function normalizeRole(role) {
        return String(role || 'user').replace('-', ' ');
    }

    function renderUsers(items) {
        if (!tbody) return;

        if (!items.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No users found.</td></tr>';
            return;
        }

        tbody.innerHTML = items.map((user) => {
            const statusLabel = user.role === 'super-admin' ? 'Protected' : 'Active';
            const statusClass = user.role === 'super-admin' ? 'text-inactive' : 'text-active';

            return `
                <tr>
                    <td class="slate-id-text">US-${String(user.id).padStart(4, '0')}</td>
                    <td class="bold-cell-text">${user.name || ''}</td>
                    <td class="secondary-cell-text">${user.email || ''}</td>
                    <td class="secondary-cell-text">${normalizeRole(user.role)}</td>
                    <td><span class="status-lbl ${statusClass}">${statusLabel}</span></td>
                    <td class="text-right actionable-cell-icons">
                        <button class="action-btn-trigger edit-btn" title="Edit" data-id="${user.id}"><i class="fa-solid fa-pencil"></i></button>
                        <button class="action-btn-trigger delete-btn" title="Delete" data-id="${user.id}"><i class="fa-regular fa-trash-can"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function applySearch() {
        const term = (searchInput?.value || '').trim().toLowerCase();
        if (!term) {
            renderUsers(allUsers);
            return;
        }

        const filtered = allUsers.filter((user) => {
            return [user.name, user.email, user.role]
                .map((value) => String(value || '').toLowerCase())
                .some((value) => value.includes(term));
        });

        renderUsers(filtered);
    }

    async function loadUsers() {
        try {
            const users = await window.api.getUsers();
            allUsers = Array.isArray(users) ? users : [];
            applySearch();
        } catch (err) {
            console.error('Failed loading users', err);
            if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Failed to load users.</td></tr>';
        }
    }

    function openAddUserModal() {
        modal.clearForm();
        editingUserId = null;
        const title = document.getElementById('userModalTitle');
        if (title) title.textContent = 'Add User';
        const pwdLabel = document.getElementById('userPasswordLabel');
        if (pwdLabel) pwdLabel.textContent = 'Password *';
        modal.open();
    }

    function openEditUserModal(user) {
        modal.clearForm();
        editingUserId = user.id;

        const title = document.getElementById('userModalTitle');
        if (title) title.textContent = 'Edit User';
        const pwdLabel = document.getElementById('userPasswordLabel');
        if (pwdLabel) pwdLabel.textContent = 'Password (optional)';

        const nameInput = document.getElementById('userName');
        const emailInput = document.getElementById('userEmail');
        const roleInput = document.getElementById('userRole');
        const passwordInput = document.getElementById('userPassword');

        if (nameInput) nameInput.value = user.name || '';
        if (emailInput) emailInput.value = user.email || '';
        if (roleInput) roleInput.value = user.role || 'user';
        if (passwordInput) passwordInput.value = '';

        modal.open();
    }

    async function handleCreateOrUpdateUser(formData) {
        if (!formData.name) {
            modal.showError('name', 'Name is required');
            return;
        }
        if (!formData.email) {
            modal.showError('email', 'Email is required');
            return;
        }
        if (!formData.role) {
            modal.showError('role', 'Role is required');
            return;
        }
        if (!editingUserId && (!formData.password || formData.password.length < 6)) {
            modal.showError('password', 'Password must be at least 6 characters');
            return;
        }
        if (editingUserId && formData.password && formData.password.length < 6) {
            modal.showError('password', 'Password must be at least 6 characters');
            return;
        }

        try {
            let result;
            if (editingUserId) {
                const payload = {
                    name: formData.name,
                    email: formData.email,
                    role: formData.role
                };
                if (formData.password) payload.password = formData.password;
                result = await window.api.updateUser(editingUserId, payload);
            } else {
                result = await window.api.createUser(formData.name, formData.email, formData.password, formData.role);
            }

            if (result && result.error) {
                showToast(result.error, 'error');
                return;
            }

            showToast(editingUserId ? 'User updated successfully' : 'User created successfully', 'success');
            modal.close();
            await loadUsers();
        } catch (err) {
            console.error('Save user failed', err);
            showToast('Failed to save user', 'error');
        }
    }

    document.addEventListener('click', async (e) => {
        const editButton = e.target.closest('button.edit-btn');
        if (editButton) {
            const id = Number(editButton.dataset.id);
            const user = allUsers.find((item) => Number(item.id) === id);
            if (user) openEditUserModal(user);
            return;
        }

        const deleteButton = e.target.closest('button.delete-btn');
        if (!deleteButton) return;

        const id = deleteButton.dataset.id;
        if (!id) return;
        if (!confirm('Delete this user?')) return;

        try {
            const result = await window.api.deleteUser(id);
            if (result && result.error) {
                showToast(result.error, 'error');
                return;
            }

            showToast('User deleted', 'success');
            await loadUsers();
        } catch (err) {
            console.error('Delete failed', err);
            showToast('Delete failed', 'error');
        }
    });

    if (searchInput) {
        searchInput.addEventListener('input', applySearch);
    }
    if (addUserButton) {
        addUserButton.addEventListener('click', openAddUserModal);
    }

    modal.setSubmitHandler(handleCreateOrUpdateUser);
    loadUsers();
});