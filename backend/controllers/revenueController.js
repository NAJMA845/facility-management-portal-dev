const db = require('../db');

async function ensureRevenueArray() {
  await db.read();
  if (!db.data.revenue_entries) db.data.revenue_entries = [];
}

function sumRevenue(entries) {
  return entries.reduce((total, entry) => total + (Number(entry.amount) || 0), 0);
}

function canManageRevenue(role) {
  return role === 'super-admin' || role === 'admin';
}

exports.summary = async (req, res) => {
  await ensureRevenueArray();
  const entries = [...(db.data.revenue_entries || [])].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentQuarter = Math.floor(currentMonth / 3);

  const monthlyEntries = entries.filter((entry) => new Date(entry.created_at).getMonth() === currentMonth && new Date(entry.created_at).getFullYear() === currentYear);
  const quarterlyEntries = entries.filter((entry) => {
    const date = new Date(entry.created_at);
    return date.getFullYear() === currentYear && Math.floor(date.getMonth() / 3) === currentQuarter;
  });
  const yearlyEntries = entries.filter((entry) => new Date(entry.created_at).getFullYear() === currentYear);

  const byMonth = entries.reduce((acc, entry) => {
    const key = entry.period || new Date(entry.created_at).toISOString().slice(0, 7);
    acc[key] = (acc[key] || 0) + (Number(entry.amount) || 0);
    return acc;
  }, {});

  res.json({
    monthly: sumRevenue(monthlyEntries),
    quarterly: sumRevenue(quarterlyEntries),
    yearly: sumRevenue(yearlyEntries),
    total: sumRevenue(entries),
    entries,
    byMonth
  });
};

exports.getAll = async (req, res) => {
  await ensureRevenueArray();
  const entries = [...db.data.revenue_entries].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json({ entries });
};

exports.create = async (req, res) => {
  if (!canManageRevenue(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { source, category, amount, period, notes } = req.body;
  if (!source || amount === undefined || amount === null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  await ensureRevenueArray();
  const id = db.data.revenue_entries.length ? Math.max(...db.data.revenue_entries.map((entry) => entry.id)) + 1 : 1;

  const entry = {
    id,
    source,
    category: category || 'General',
    amount: Number(amount) || 0,
    period: period || new Date().toISOString().slice(0, 7),
    notes: notes || '',
    created_at: new Date().toISOString()
  };

  db.data.revenue_entries.push(entry);
  await db.write();
  res.status(201).json({ entry });
};

exports.update = async (req, res) => {
  if (!canManageRevenue(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { id } = req.params;
  const { source, category, amount, period, notes } = req.body;

  await ensureRevenueArray();
  const index = db.data.revenue_entries.findIndex((entry) => String(entry.id) === String(id));
  if (index === -1) {
    return res.status(404).json({ error: 'Not found' });
  }

  const existing = db.data.revenue_entries[index];
  const updated = {
    ...existing,
    source: source ?? existing.source,
    category: category ?? existing.category,
    amount: amount !== undefined ? Number(amount) || 0 : existing.amount,
    period: period ?? existing.period,
    notes: notes ?? existing.notes,
    updated_at: new Date().toISOString()
  };

  db.data.revenue_entries[index] = updated;
  await db.write();
  res.json({ entry: updated });
};

exports.remove = async (req, res) => {
  if (!canManageRevenue(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { id } = req.params;
  await ensureRevenueArray();

  const index = db.data.revenue_entries.findIndex((entry) => String(entry.id) === String(id));
  if (index === -1) {
    return res.status(404).json({ error: 'Not found' });
  }

  db.data.revenue_entries.splice(index, 1);
  await db.write();
  res.json({ success: true });
};