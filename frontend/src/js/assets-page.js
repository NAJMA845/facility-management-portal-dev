// Assets Page Script
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

let allAssets = [];
let filteredAssets = [];
let assetsCurrentPage = 1;
const itemsPerPage = 10;
let modal;
let editingId = null;

async function init() {
    if (!checkAuth()) return;
    
    modal = new Modal('assetModal');

    // Determine permissions based on role
    const userRole = (window.authGuard && window.authGuard.getUser && window.authGuard.getUser()?.role) || getStoredUserRole();
    const canCreate = ['admin', 'super-admin'].includes(userRole);
    const canEdit = ['admin', 'super-admin', 'manager'].includes(userRole);
    const canDelete = ['admin', 'super-admin'].includes(userRole);
    window.__assetPermissions = { canCreate, canEdit, canDelete };
    
    // Load assets
    await loadAssets();
    
    // Setup event listeners
    const addBtn = document.getElementById('addAssetBtn');
    if (addBtn) {
        addBtn.style.display = canCreate ? '' : 'none';
        if (canCreate) addBtn.addEventListener('click', () => openModal());
    }
    document.getElementById('searchInput')?.addEventListener('input', handleSearch);
    
    modal.setSubmitHandler(handleSubmit);
}

async function loadAssets() {
    const assets = await window.api.getAssets();
    allAssets = assets || [];
    filteredAssets = [...allAssets];
    loadCurrentPage();
}

function handleSearch() {
    assetsCurrentPage = 1;
    const searchTerm = document.getElementById('searchInput').value;
    
    if (searchTerm) {
        filteredAssets = filterBySearch(allAssets, searchTerm, ['name', 'type', 'location']);
    } else {
        filteredAssets = [...allAssets];
    }
    
    loadCurrentPage();
}

function loadCurrentPage() {
    const paginated = paginate(filteredAssets, assetsCurrentPage, itemsPerPage);
    renderTable(paginated.items);
    renderPagination(paginated.totalPages, assetsCurrentPage);
}

window.loadCurrentPage = loadCurrentPage;

function renderTable(assets) {
    const tbody = document.getElementById('assetsTableBody');
    
    if (assets.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 32px;"><div class="empty-state"><div class="empty-state-icon"><i class="fa-solid fa-box"></i></div><div class="empty-state-title">No Assets</div><div class="empty-state-text">No assets found. Create one to get started.</div></div></td></tr>`;
        return;
    }
    
    tbody.innerHTML = assets.map(asset => createAssetRow(asset)).join('');
    
    // Add event listeners
    tbody.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            const asset = allAssets.find(a => a.id === id);
            if (asset) openModal(asset);
        });
    });
    
    tbody.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            deleteAsset(id);
        });
    });
}

function openModal(asset = null) {
    modal.clearForm();
    document.getElementById('modalTitle').textContent = asset ? 'Edit Asset' : 'Add Asset';
    editingId = asset?.id || null;
    
    const userRole = (window.authGuard && window.authGuard.getUser && window.authGuard.getUser()?.role) || getStoredUserRole();
    const isManager = userRole === 'manager';
    
    // Reset all fields to enabled state first
    ['assetName','assetType','assetLocation','assetPurchaseDate','assetWarrantyEnd','assetStatus'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = false;
    });
    
    if (asset) {
        document.getElementById('assetName').value = asset.name;
        document.getElementById('assetType').value = asset.type || '';
        document.getElementById('assetLocation').value = asset.location || '';
        document.getElementById('assetPurchaseDate').value = asset.purchase_date || '';
        document.getElementById('assetWarrantyEnd').value = asset.warranty_end || '';
        document.getElementById('assetStatus').value = asset.status;

        // Managers can only edit location and status
        if (isManager) {
            ['assetName','assetType','assetPurchaseDate','assetWarrantyEnd'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.disabled = true;
            });
        }
    }
    
    modal.open();
}

async function handleSubmit(formData) {
    // Validate
    if (!formData.name) {
        modal.showError('name', 'Asset name is required');
        return;
    }
    
    try {
        if (editingId) {
            const result = await window.api.updateAsset(editingId, {
                name: formData.name,
                type: formData.type,
                location: formData.location,
                purchase_date: formData.purchase_date || null,
                warranty_end: formData.warranty_end || null,
                status: formData.status
            });
            if (result) {
                showToast('Asset updated successfully', 'success');
                modal.close();
                await loadAssets();
            } else {
                showToast('Failed to update asset', 'error');
            }
        } else {
            const result = await window.api.createAsset(
                formData.name,
                formData.type,
                formData.location,
                formData.purchase_date || null,
                formData.warranty_end || null,
                formData.status
            );
            if (result) {
                showToast('Asset created successfully', 'success');
                modal.close();
                await loadAssets();
            } else {
                showToast('Failed to create asset', 'error');
            }
        }
    } catch (err) {
        console.error('Error:', err);
        showToast('An error occurred', 'error');
    }
}

async function deleteAsset(id) {
    const perms = window.__assetPermissions || {};
    if (!perms.canDelete) { showToast('You do not have permission to delete assets', 'error'); return; }
    if (!confirm('Are you sure you want to delete this asset?')) return;
    
    try {
        const result = await window.api.deleteAsset(id);
        if (result) {
            showToast('Asset deleted successfully', 'success');
            await loadAssets();
        } else {
            showToast('Failed to delete asset', 'error');
        }
    } catch (err) {
        console.error('Error:', err);
        showToast('An error occurred', 'error');
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
