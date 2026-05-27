const fs = require('fs');
const path = require('path');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const DB_FILE = path.join(dataDir, 'db.json');
const adapter = new JSONFile(DB_FILE);
const defaultData = { users: [], assets: [], work_orders: [], tenant_requests: [], revenue_entries: [] };
const db = new Low(adapter, defaultData);

async function init() {
  await db.read();
  const d = db.data || defaultData;
  let changed = !db.data;

  if (!Array.isArray(d.users)) {
    d.users = [];
    changed = true;
  }
  if (!Array.isArray(d.assets)) {
    d.assets = [];
    changed = true;
  }
  if (!Array.isArray(d.work_orders)) {
    d.work_orders = [];
    changed = true;
  }
  if (!Array.isArray(d.tenant_requests)) {
    d.tenant_requests = [];
    changed = true;
  }
  if (!Array.isArray(d.revenue_entries)) {
    d.revenue_entries = [];
    changed = true;
  }

  const pw = (value) => bcrypt.hashSync(value, 10);
  const ensureUser = (name, email, password, role) => {
    if (!d.users.some((user) => user.email === email)) {
      const nextId = d.users.length ? Math.max(...d.users.map((user) => user.id || 0)) + 1 : 1;
      d.users.push({ id: nextId, name, email, password: pw(password), role, created_at: new Date().toISOString() });
      changed = true;
    }
  };

  ensureUser('Super Admin', 'superadmin@example.com', 'superpass', 'super-admin');
  ensureUser('Admin User', 'admin@example.com', 'adminpass', 'admin');
  ensureUser('Manager User', 'manager@example.com', 'managerpass', 'manager');
  ensureUser('Tech One', 'tech1@example.com', 'techpass1', 'technician');
  ensureUser('Tech Two', 'tech2@example.com', 'techpass2', 'technician');
  ensureUser('Tech Three', 'tech3@example.com', 'techpass3', 'technician');

  if (changed) {
    await db.write();
  }
}

init().catch(err => console.error('DB init error', err));

module.exports = db;
