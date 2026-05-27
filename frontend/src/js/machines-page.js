function getStoredUserRole() {
    try {
        const raw = localStorage.getItem('user');
        if (!raw) return '';
        const user = JSON.parse(raw);
        return user?.role || '';
    } catch {
        return '';
    }
}

if (getStoredUserRole() === 'technician' && /\/src\/pages\/(assets|machines)\.html$/i.test(window.location.pathname || '')) {
    window.location.replace('/src/pages/technician-dashboard.html');
}

let allMachines = [];
let filteredMachines = [];
let machinesCurrentPage = 1;
const itemsPerPage = 10;
let modal;
let editingId = null;

async function init() {
    if (!checkAuth()) return;

    modal = new Modal('machineModal');

    await loadMachines();

    document.getElementById('addMachineBtn')?.addEventListener('click', () => openModal());
    document.getElementById('searchInput')?.addEventListener('input', handleSearch);

    modal.setSubmitHandler(handleSubmit);
}

async function loadMachines() {
    const machines = await window.api.getAssets();
    allMachines = Array.isArray(machines) ? machines : [];
    filteredMachines = [...allMachines];
    loadCurrentPage();
}

function handleSearch() {
    machinesCurrentPage = 1;
    const searchTerm = document.getElementById('searchInput')?.value || '';

    if (searchTerm) {
        filteredMachines = filterBySearch(allMachines, searchTerm, ['name', 'type', 'location', 'status']);
    } else {
        filteredMachines = [...allMachines];
    }

    loadCurrentPage();
}

function loadCurrentPage() {
    const paginated = paginate(filteredMachines, machinesCurrentPage, itemsPerPage);
    renderTable(paginated.items);
    renderPagination(paginated.totalPages, machinesCurrentPage);
}

window.loadCurrentPage = loadCurrentPage;

function renderTable(machines) {
    const tbody = document.getElementById('machinesTableBody');
    if (!tbody) return;

    if (machines.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;"><div class="empty-state"><div class="empty-state-icon"><i class="fa-solid fa-gears"></i></div><div class="empty-state-title">No Machines</div><div class="empty-state-text">No machines found. Add one to get started.</div></div></td></tr>';
        return;
    }

    tbody.innerHTML = machines.map((machine) => createAssetRow(machine)).join('');

    tbody.querySelectorAll('.edit-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id, 10);
            const machine = allMachines.find((item) => item.id === id);
            if (machine) openModal(machine);
        });
    });

    tbody.querySelectorAll('.delete-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id, 10);
            deleteMachine(id);
        });
    });
}

function openModal(machine = null) {
    modal.clearForm();
    editingId = machine?.id || null;

    const title = document.getElementById('machineModalTitle');
    if (title) title.textContent = machine ? 'Edit Machine' : 'Add Machine';

    if (machine) {
        document.getElementById('machineName').value = machine.name || '';
        document.getElementById('machineType').value = machine.type || '';
        document.getElementById('machineLocation').value = machine.location || '';
        document.getElementById('machinePurchaseDate').value = machine.purchase_date || '';
        document.getElementById('machineWarrantyEnd').value = machine.warranty_end || '';
        document.getElementById('machineStatus').value = machine.status || 'Active';
    }

    modal.open();
}

async function handleSubmit(formData) {
    if (!formData.name) {
        modal.showError('name', 'Machine name is required');
        return;
    }

    const payload = {
        name: formData.name,
        type: formData.type || '',
        location: formData.location || '',
        purchase_date: formData.purchase_date || null,
        warranty_end: formData.warranty_end || null,
        status: formData.status || 'Active'
    };

    try {
        const result = editingId
            ? await window.api.updateAsset(editingId, payload)
            : await window.api.createAsset(payload.name, payload.type, payload.location, payload.purchase_date, payload.warranty_end, payload.status);

        if (result && result.error) {
            showToast(result.error, 'error');
            return;
        }

        showToast(editingId ? 'Machine updated successfully' : 'Machine created successfully', 'success');
        modal.close();
        await loadMachines();
    } catch (err) {
        console.error('Machine save error:', err);
        showToast('Failed to save machine', 'error');
    }
}

async function deleteMachine(id) {
    if (!confirm('Are you sure you want to delete this machine?')) return;

    try {
        const result = await window.api.deleteAsset(id);
        if (result && result.error) {
            showToast(result.error, 'error');
            return;
        }

        showToast('Machine deleted successfully', 'success');
        await loadMachines();
    } catch (err) {
        console.error('Machine delete error:', err);
        showToast('Failed to delete machine', 'error');
    }
}

document.addEventListener('DOMContentLoaded', init);
