const db = require('../db');

exports.stats = async (req, res) => {
  await db.read();
  const users = db.data.users.length;
  const assets = db.data.assets.length;
  const tenantRequests = db.data.tenant_requests.length;
  const workOrdersByStatus = Object.entries(db.data.work_orders.reduce((acc, w) => { acc[w.status] = (acc[w.status]||0)+1; return acc; }, {})).map(([status, c]) => ({ status, c }));
  const revenue = (db.data.revenue_entries || []).reduce((total, entry) => total + (Number(entry.amount) || 0), 0);
  res.json({ users, assets, tenantRequests, workOrdersByStatus, revenue });
};
