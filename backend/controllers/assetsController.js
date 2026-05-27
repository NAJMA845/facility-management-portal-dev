const db = require('../db');

function canViewAssets(role) {
  return role === 'super-admin' || role === 'admin' || role === 'manager';
}

function canManageAssets(role) {
  return role === 'super-admin' || role === 'admin';
}

exports.getAll = async (req, res) => {
  if (!canViewAssets(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await db.read();
  const assets = [...db.data.assets].sort((a,b)=> new Date(b.created_at) - new Date(a.created_at));
  res.json({ assets });
};

exports.create = async (req, res) => {
  if (!canManageAssets(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { name, type, location, purchase_date, warranty_end, status } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  await db.read();
  const id = db.data.assets.length ? Math.max(...db.data.assets.map(a=>a.id)) + 1 : 1;
  const asset = { id, name, type: type||'', location: location||'', purchase_date: purchase_date||null, warranty_end: warranty_end||null, status: status||'Active', created_at: new Date().toISOString() };
  db.data.assets.push(asset);
  await db.write();
  res.status(201).json({ asset });
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const { name, type, location, purchase_date, warranty_end, status } = req.body;
  await db.read();
  const idx = db.data.assets.findIndex(a => String(a.id) === String(id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const asset = db.data.assets[idx];

  if (req.user.role === 'manager') {
    // Managers have limited edit rights: only update location and status
    const updated = { ...asset, location: location ?? asset.location, status: status ?? asset.status };
    db.data.assets[idx] = updated;
    await db.write();
    return res.json({ asset: updated });
  }

  if (!canManageAssets(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const updated = { ...asset, name: name ?? asset.name, type: type ?? asset.type, location: location ?? asset.location, purchase_date: purchase_date ?? asset.purchase_date, warranty_end: warranty_end ?? asset.warranty_end, status: status ?? asset.status };
  db.data.assets[idx] = updated;
  await db.write();
  res.json({ asset: updated });
};

exports.remove = async (req, res) => {
  if (!canManageAssets(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { id } = req.params;
  await db.read();
  const idx = db.data.assets.findIndex(a => String(a.id) === String(id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.data.assets.splice(idx, 1);
  await db.write();
  res.json({ success: true });
};
