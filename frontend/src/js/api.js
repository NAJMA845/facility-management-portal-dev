const API_BASE = '';

function authHeader() {
  const t = localStorage.getItem('token');
  return t ? { 'Authorization': `Bearer ${t}` } : {};
}

async function fetchJson(path, opts = {}) {
  try {
    const res = await fetch(API_BASE + path, opts);
    if (!res.ok) throw new Error('Network response not ok');
    return await res.json();
  } catch (err) {
    console.warn('API fetch failed', path, err);
    return null;
  }
}

async function login(email, password) {
  const r = await fetchJson('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  if (r && r.token) localStorage.setItem('token', r.token);
  return r;
}

async function register(name, email, password) {
  const r = await fetchJson('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) });
  if (r && r.token) localStorage.setItem('token', r.token);
  return r;
}

async function createUser(name, email, password, role) {
  return fetchJson('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role })
  });
}

// Work Orders
async function getWorkOrders() {
  const r = await fetchJson('/api/workorders', { headers: { ...authHeader() } });
  return r ? r.workOrders : [];
}

async function createWorkOrder(title, description, priority, assigned_to) {
  return fetchJson('/api/workorders', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ title, description, priority, assigned_to }) });
}

async function updateWorkOrder(id, data) {
  return fetchJson(`/api/workorders/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) });
}

async function deleteWorkOrder(id) {
  return fetchJson(`/api/workorders/${id}`, { method: 'DELETE', headers: { ...authHeader() } });
}

// Assets
async function getAssets() {
  const r = await fetchJson('/api/assets', { headers: { ...authHeader() } });
  return r ? r.assets : [];
}

async function createAsset(name, type, location, purchase_date, warranty_end, status) {
  return fetchJson('/api/assets', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ name, type, location, purchase_date, warranty_end, status }) });
}

async function updateAsset(id, data) {
  return fetchJson(`/api/assets/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) });
}

async function deleteAsset(id) {
  return fetchJson(`/api/assets/${id}`, { method: 'DELETE', headers: { ...authHeader() } });
}

// Tenants
async function getTenants() {
  const r = await fetchJson('/api/tenants/requests', { headers: { ...authHeader() } });
  return r ? r.requests : [];
}

async function createTenantRequest(tenant_name, tenant_email, subject, description) {
  return fetchJson('/api/tenants/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tenant_name, tenant_email, subject, description }) });
}

async function updateTenantRequest(id, data) {
  return fetchJson(`/api/tenants/requests/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) });
}

async function deleteTenantRequest(id) {
  return fetchJson(`/api/tenants/requests/${id}`, { method: 'DELETE', headers: { ...authHeader() } });
}

// Contacts
async function getContacts() {
  const r = await fetchJson('/api/contacts', { headers: { ...authHeader() } });
  return r ? r.contacts : [];
}

async function createContact(name, email, phone, subject, message) {
  return fetchJson('/api/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, phone, subject, message }) });
}

async function updateContactStatus(id, status) {
  return fetchJson(`/api/contacts/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ status }) });
}

async function deleteContact(id) {
  return fetchJson(`/api/contacts/${id}`, { method: 'DELETE', headers: { ...authHeader() } });
}

// Profile
async function getProfile() {
  return fetchJson('/api/profile', { headers: { ...authHeader() } });
}

async function updateProfile(data) {
  return fetchJson('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) });
}

async function getCurrentUser() {
  const r = await fetchJson('/api/profile/current', { headers: { ...authHeader() } });
  return r ? r.user : null;
}

// Dashboard
async function getSummary() {
  const r = await fetchJson('/api/dashboard/stats', { headers: { ...authHeader() } });
  return r || {};
}

// Users
async function getUsers() {
  const r = await fetchJson('/api/users', { headers: { ...authHeader() } });
  return r ? r.users : [];
}

async function deleteUser(id) {
  return fetchJson(`/api/users/${id}`, { method: 'DELETE', headers: { ...authHeader() } });
}

async function updateUser(id, data) {
  return fetchJson(`/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(data)
  });
}

// Revenue
async function getRevenueSummary() {
  const r = await fetchJson('/api/revenue/summary', { headers: { ...authHeader() } });
  return r || {};
}

async function getRevenueEntries() {
  const r = await fetchJson('/api/revenue', { headers: { ...authHeader() } });
  return r ? r.entries : [];
}

async function createRevenueEntry(data) {
  return fetchJson('/api/revenue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(data)
  });
}

async function updateRevenueEntry(id, data) {
  return fetchJson(`/api/revenue/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(data)
  });
}

async function deleteRevenueEntry(id) {
  return fetchJson(`/api/revenue/${id}`, { method: 'DELETE', headers: { ...authHeader() } });
}

function logout() { localStorage.removeItem('token'); }

// expose to global scope for non-module scripts
window.api = { 
  login, register, createUser, logout,
  getWorkOrders, createWorkOrder, updateWorkOrder, deleteWorkOrder,
  getAssets, createAsset, updateAsset, deleteAsset,
  getTenants, createTenantRequest, updateTenantRequest, deleteTenantRequest,
  getContacts, createContact, updateContactStatus, deleteContact,
  getProfile, updateProfile, getCurrentUser,
  getSummary, getUsers, updateUser, deleteUser,
  getRevenueSummary, getRevenueEntries, createRevenueEntry, updateRevenueEntry, deleteRevenueEntry
};

