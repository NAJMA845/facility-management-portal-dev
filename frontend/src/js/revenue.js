let allRevenueEntries = [];
let filteredRevenueEntries = [];
let revenueCurrentPage = 1;
const itemsPerPage = 10;
let modal;
let editingRevenueId = null;

document.addEventListener('DOMContentLoaded', init);

async function init() {
  if (window.authGuard) {
    const user = window.authGuard.protect({ allowedRoles: ['super-admin', 'admin', 'manager'] });
    if (!user) return;
  }

  modal = new Modal('revenueModal');

  const user = window.authGuard && window.authGuard.getUser ? window.authGuard.getUser() : null;
  const userRole = user ? user.role : '';
  const canManage = ['admin','super-admin'].includes(userRole);
  window.__revenuePermissions = { canManage };

  const addBtn = document.getElementById('addRevenueBtn');
  if (addBtn) addBtn.style.display = canManage ? '' : 'none';
  if (canManage) addBtn?.addEventListener('click', () => openModal());

  const actionHeader = document.querySelector('.management-grid thead th:last-child');
  if (actionHeader) actionHeader.style.display = canManage ? '' : 'none';

  document.getElementById('searchInput')?.addEventListener('input', handleSearch);

  modal.setSubmitHandler(handleSubmit);

  await Promise.all([loadRevenueEntries(), loadSummary()]);
}

async function loadSummary() {
  try {
    const summary = await window.api.getRevenueSummary();
    setAmount('revMonthly', summary.monthly || 0);
    setAmount('revQuarterly', summary.quarterly || 0);
    setAmount('revYearly', summary.yearly || 0);
    setAmount('revTotal', summary.total || 0);
  } catch (err) {
    console.warn('Revenue summary load failed', err);
  }
}

function setAmount(id, amount) {
  const el = document.getElementById(id);
  if (el) el.textContent = `$${Number(amount || 0).toLocaleString()}`;
}

async function loadRevenueEntries() {
  try {
    const entries = await window.api.getRevenueEntries();
    allRevenueEntries = Array.isArray(entries) ? entries : [];
    filteredRevenueEntries = [...allRevenueEntries];
    loadCurrentPage();
  } catch (err) {
    console.error('Failed loading revenue entries', err);
    const tbody = document.getElementById('revenueTableBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Failed to load revenue entries.</td></tr>';
  }
}

function handleSearch() {
  revenueCurrentPage = 1;
  const term = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();

  if (!term) {
    filteredRevenueEntries = [...allRevenueEntries];
  } else {
    filteredRevenueEntries = allRevenueEntries.filter((entry) => {
      return [entry.source, entry.category, entry.period, entry.notes]
        .map((value) => String(value || '').toLowerCase())
        .some((value) => value.includes(term));
    });
  }

  loadCurrentPage();
}

function loadCurrentPage() {
  const paginated = paginate(filteredRevenueEntries, revenueCurrentPage, itemsPerPage);
  renderTable(paginated.items);
  renderPagination(paginated.totalPages, revenueCurrentPage);
}

window.loadCurrentPage = loadCurrentPage;

function renderTable(entries) {
  const tbody = document.getElementById('revenueTableBody');
  if (!tbody) return;

  if (!entries.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No revenue entries found.</td></tr>';
    return;
  }

  const canManage = (window.__revenuePermissions && window.__revenuePermissions.canManage) || false;
  tbody.innerHTML = entries.map((entry) => `
    <tr>
      <td class="slate-id-text">RV-${String(entry.id).padStart(4, '0')}</td>
      <td class="bold-cell-text">${entry.source || ''}</td>
      <td class="secondary-cell-text">${entry.category || 'General'}</td>
      <td class="secondary-cell-text">${entry.period || '-'}</td>
      <td class="secondary-cell-text">$${Number(entry.amount || 0).toLocaleString()}</td>
      ${canManage ? `<td class="text-right actionable-cell-icons">
        <button class="action-btn-trigger edit-btn" data-id="${entry.id}" title="Edit"><i class="fa-solid fa-pencil"></i></button>
        <button class="action-btn-trigger delete-btn" data-id="${entry.id}" title="Delete"><i class="fa-regular fa-trash-can"></i></button>
      </td>` : ''}
    </tr>
  `).join('');

  tbody.querySelectorAll('.edit-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      const entry = allRevenueEntries.find((item) => Number(item.id) === id);
      if (entry) openModal(entry);
    });
  });

  tbody.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', () => deleteEntry(btn.dataset.id));
  });
}

function openModal(entry = null) {
  modal.clearForm();
  editingRevenueId = entry?.id || null;

  const title = document.getElementById('revenueModalTitle');
  if (title) title.textContent = entry ? 'Edit Revenue' : 'Add Revenue';

  if (entry) {
    document.getElementById('revenueSource').value = entry.source || '';
    document.getElementById('revenueCategory').value = entry.category || '';
    document.getElementById('revenuePeriod').value = entry.period || '';
    document.getElementById('revenueAmount').value = Number(entry.amount || 0);
    document.getElementById('revenueNotes').value = entry.notes || '';
  }

  modal.open();
}

async function handleSubmit(formData) {
  if (!formData.source) {
    modal.showError('source', 'Source is required');
    return;
  }

  if (formData.amount === '' || Number(formData.amount) < 0) {
    modal.showError('amount', 'Amount must be 0 or more');
    return;
  }

  const payload = {
    source: formData.source,
    category: formData.category || 'General',
    period: formData.period || new Date().toISOString().slice(0, 7),
    amount: Number(formData.amount || 0),
    notes: formData.notes || ''
  };

  try {
    const result = editingRevenueId
      ? await window.api.updateRevenueEntry(editingRevenueId, payload)
      : await window.api.createRevenueEntry(payload);

    if (result && result.error) {
      showToast(result.error, 'error');
      return;
    }

    showToast(editingRevenueId ? 'Revenue entry updated' : 'Revenue entry added', 'success');
    modal.close();
    await Promise.all([loadRevenueEntries(), loadSummary()]);
  } catch (err) {
    console.error('Revenue save failed', err);
    showToast('Failed to save revenue entry', 'error');
  }
}

async function deleteEntry(id) {
  if (!confirm('Delete this revenue entry?')) return;

  try {
    const result = await window.api.deleteRevenueEntry(id);
    if (result && result.error) {
      showToast(result.error, 'error');
      return;
    }

    showToast('Revenue entry deleted', 'success');
    await Promise.all([loadRevenueEntries(), loadSummary()]);
  } catch (err) {
    console.error('Revenue delete failed', err);
    showToast('Failed to delete revenue entry', 'error');
  }
}
