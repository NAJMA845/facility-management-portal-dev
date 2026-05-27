const db = require('../db');

function canManageWorkOrders(role) {
  return role === 'super-admin' || role === 'admin' || role === 'manager';
}

function canCreateOrDeleteWorkOrders(role) {
  return role === 'super-admin' || role === 'admin';
}

function canCreateWorkOrders(role) {
  return role === 'super-admin' || role === 'admin' || role === 'manager';
}

function canEditAssignedWorkOrder(role, workOrder, userId) {
  return role === 'technician' && String(workOrder.assigned_to) === String(userId);
}

exports.getAll = async (req, res) => {
  await db.read();
  const workOrders = (req.user.role === 'technician'
    ? db.data.work_orders.filter((wo) => String(wo.assigned_to) === String(req.user.id))
    : db.data.work_orders
  ).map(wo => {
    const assigned = db.data.users.find(u => u.id === wo.assigned_to);
    return { ...wo, assigned_name: assigned ? assigned.name : null };
  }).sort((a,b)=> new Date(b.created_at) - new Date(a.created_at));
  res.json({ workOrders });
};

exports.create = async (req, res) => {
  if (!canCreateWorkOrders(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { title, description, priority, assigned_to } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  await db.read();
  const id = db.data.work_orders.length ? Math.max(...db.data.work_orders.map(w=>w.id)) + 1 : 1;
  const wo = {
    id,
    title,
    description: description || '',
    priority: priority || 'Low',
    status: 'Open',
    assigned_to: assigned_to || null,
    remarks: '',
    completion_details: '',
    created_by: req.user.id,
    created_at: new Date().toISOString()
  };
  db.data.work_orders.push(wo);
  await db.write();
  res.status(201).json({ workOrder: wo });
};

exports.update = async (req, res) => {
  const { id } = req.params;
  await db.read();
  const idx = db.data.work_orders.findIndex(w => String(w.id) === String(id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const wo = db.data.work_orders[idx];

  if (canEditAssignedWorkOrder(req.user.role, wo, req.user.id)) {
    const { status, remarks, completion_details } = req.body;
    const updated = {
      ...wo,
      status: status ?? wo.status,
      remarks: remarks ?? wo.remarks ?? '',
      completion_details: completion_details ?? wo.completion_details ?? ''
    };
    db.data.work_orders[idx] = updated;
    await db.write();
    return res.json({ workOrder: updated });
  }

  if (!canManageWorkOrders(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { title, description, priority, status, assigned_to, remarks, completion_details, completed_at } = req.body;
  const updated = { ...wo, title: title ?? wo.title, description: description ?? wo.description, priority: priority ?? wo.priority, status: status ?? wo.status, assigned_to: assigned_to ?? wo.assigned_to, remarks: remarks ?? wo.remarks ?? '', completion_details: completion_details ?? wo.completion_details ?? '', completed_at: completed_at ?? wo.completed_at };
  db.data.work_orders[idx] = updated;
  await db.write();
  res.json({ workOrder: updated });
};

exports.remove = async (req, res) => {
  if (!canCreateOrDeleteWorkOrders(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { id } = req.params;
  await db.read();
  const idx = db.data.work_orders.findIndex(w => String(w.id) === String(id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.data.work_orders.splice(idx,1);
  await db.write();
  res.json({ success: true });
};
