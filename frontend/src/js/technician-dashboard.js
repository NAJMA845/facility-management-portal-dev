document.addEventListener('DOMContentLoaded', () => {
    if (window.authGuard) {
        const user = window.authGuard.protect({ allowedRoles: ['technician'] });
        if (!user) return;
    }

    const currentUser = window.authGuard ? window.authGuard.getUser() : null;

    function isAssignedToCurrentUser(wo) {
        return String(wo.assigned_to) === String(currentUser?.id)
            || String(wo.assigned_name || '').toLowerCase() === String(currentUser?.name || '').toLowerCase();
    }

    (async function loadTechnicianData() {
        try {
            const workOrders = await window.api.getWorkOrders();
            const assigned = Array.isArray(workOrders) ? workOrders.filter(isAssignedToCurrentUser) : [];

            const metrics = document.querySelectorAll('.metric-card .metric-value');
            if (metrics.length >= 4) {
                const completed = assigned.filter((wo) => wo.status === 'Completed').length;
                const pending = assigned.filter((wo) => wo.status === 'Open' || wo.status === 'Pending').length;
                const overdue = assigned.filter((wo) => wo.status === 'Closed').length;
                metrics[0].textContent = String(assigned.length);
                metrics[1].textContent = String(pending);
                metrics[2].textContent = String(completed);
                metrics[3].textContent = String(overdue);
            }

            const assignedBody = document.querySelector('.table-container-card table tbody');
            if (assignedBody) {
                assignedBody.innerHTML = '';
                assigned.slice(0, 10).forEach((wo) => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td class="semi-bold-text">WO-${String(wo.id).padStart(4, '0')}</td>
                        <td>${wo.title || ''}</td>
                        <td>${wo.priority || ''}</td>
                        <td><span class="badge badge-${String(wo.status || 'open').toLowerCase().replace(/\s+/g, '-')}">${wo.status || ''}</span></td>
                        <td>${new Date(wo.created_at || Date.now()).toLocaleDateString()}</td>
                    `;
                    assignedBody.appendChild(tr);
                });
            }

            const alertsStack = document.querySelector('.alerts-stack');
            if (alertsStack) {
                const flagged = assigned.filter((wo) => (wo.priority === 'Urgent' || wo.priority === 'High') && wo.status !== 'Completed').slice(0, 2);
                alertsStack.innerHTML = '';

                if (!flagged.length) {
                    const item = document.createElement('div');
                    item.className = 'alert-item';
                    item.innerHTML = `
                        <div class="alert-left-group">
                            <div class="alert-badge-box"><i class="fa-solid fa-circle-check"></i></div>
                            <div class="alert-details">
                                <h4>No critical alerts</h4>
                                <p>All assigned tasks are under control</p>
                            </div>
                        </div>
                        <span class="status-marker-dot"></span>
                    `;
                    alertsStack.appendChild(item);
                } else {
                    flagged.forEach((wo) => {
                        const item = document.createElement('div');
                        item.className = 'alert-item';
                        item.innerHTML = `
                            <div class="alert-left-group">
                                <div class="alert-badge-box"><i class="fa-solid fa-triangle-exclamation"></i></div>
                                <div class="alert-details">
                                    <h4>WO-${String(wo.id).padStart(4, '0')}</h4>
                                    <p>${wo.title || ''} (${wo.priority || 'High'})</p>
                                </div>
                            </div>
                            <span class="status-marker-dot red-dot"></span>
                        `;
                        alertsStack.appendChild(item);
                    });
                }
            }

            const completedBody = document.querySelector('.simple-tracking-table tbody');
            if (completedBody) {
                completedBody.innerHTML = '';
                assigned
                    .filter((wo) => wo.status === 'Completed')
                    .slice(0, 5)
                    .forEach((wo) => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td class="semi-bold-text text-slate">WO-${String(wo.id).padStart(4, '0')}</td>
                            <td><span class="badge badge-completed">Completed</span></td>
                            <td class="text-right label-muted">${new Date(wo.created_at || Date.now()).toLocaleDateString()}</td>
                        `;
                        completedBody.appendChild(row);
                    });
            }
        } catch (err) {
            console.warn('Technician live data load failed', err);
        }
    })();
});