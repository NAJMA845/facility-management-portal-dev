const db = require('../db');

function canManageTenants(role) {
  return role === 'super-admin' || role === 'admin' || role === 'manager';
}

exports.getRequests = async (req, res) => {
  if (!canManageTenants(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  await db.read();
  const requests = [...db.data.tenant_requests].sort((a,b)=> new Date(b.created_at) - new Date(a.created_at));
  res.json({ requests });
};

exports.createRequest = async (req, res) => {
  const { tenant_name, tenant_email, subject, description } = req.body;
  if (!tenant_name || !tenant_email || !subject || !description) return res.status(400).json({ error: 'Missing fields' });
  await db.read();
  const id = db.data.tenant_requests.length ? Math.max(...db.data.tenant_requests.map(r=>r.id)) + 1 : 1;
  const r = { id, tenant_name, tenant_email, subject, description, status: 'Pending', created_at: new Date().toISOString() };
  db.data.tenant_requests.push(r);
  await db.write();
  res.status(201).json({ request: r });
};

exports.update = async (req, res) => {
  if (!canManageTenants(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { id } = req.params;
  const { tenant_name, tenant_email, subject, description, status } = req.body;
  await db.read();
  const idx = db.data.tenant_requests.findIndex(r => String(r.id) === String(id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const req_data = db.data.tenant_requests[idx];
  const updated = { ...req_data, tenant_name: tenant_name ?? req_data.tenant_name, tenant_email: tenant_email ?? req_data.tenant_email, subject: subject ?? req_data.subject, description: description ?? req_data.description, status: status ?? req_data.status };
  db.data.tenant_requests[idx] = updated;
  await db.write();
  res.json({ request: updated });
};

exports.remove = async (req, res) => {
  if (!canManageTenants(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { id } = req.params;
  await db.read();
  const idx = db.data.tenant_requests.findIndex(r => String(r.id) === String(id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.data.tenant_requests.splice(idx, 1);
  await db.write();
  res.json({ success: true });
};
