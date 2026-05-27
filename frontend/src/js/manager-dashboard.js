document.addEventListener('DOMContentLoaded', () => {
    const currentUser = window.authGuard && window.authGuard.getUser ? window.authGuard.getUser() : null;

    if (window.authGuard) {
        const user = window.authGuard.protect({ allowedRoles: ['manager'] });
        if (!user) return;
    }

    function statusToProgress(status) {
        if (status === 'Completed') return 100;
        if (status === 'In Progress') return 65;
        if (status === 'Open' || status === 'Pending') return 30;
        return 15;
    }

    function dateKey(value) {
        return new Date(value).toISOString().slice(0, 10);
    }

    (async function loadManagerData() {
        try {
            const canReadUsers = ['admin', 'super-admin'].includes((currentUser && currentUser.role) || '');
            const [summary, workOrders, users, assets] = await Promise.all([
                window.api.getSummary().catch(() => ({})),
                window.api.getWorkOrders().catch(() => []),
                canReadUsers ? window.api.getUsers().catch(() => []) : Promise.resolve([]),
                window.api.getAssets().catch(() => [])
            ]);

            const list = Array.isArray(workOrders) ? workOrders : [];
            const userList = Array.isArray(users) ? users : [];
            const assetList = Array.isArray(assets) ? assets : [];

            const metrics = document.querySelectorAll('.metric-card .metric-value');
            if (metrics.length >= 4) {
                const totalWorkOrders = list.length;
                const inProgress = list.filter((item) => item.status === 'In Progress').length;
                const completed = list.filter((item) => item.status === 'Completed').length;
                const technicians = userList.filter((item) => item.role === 'technician').length;
                metrics[0].textContent = String(totalWorkOrders);
                metrics[1].textContent = String(inProgress);
                metrics[2].textContent = String(completed);
                metrics[3].textContent = String(technicians);
            }

            const progressItems = document.querySelectorAll('.progress-item-block');
            const activeOrders = list.filter((item) => item.status !== 'Completed').slice(0, progressItems.length);
            progressItems.forEach((node, index) => {
                const order = activeOrders[index];
                if (!order) return;
                const progressValue = statusToProgress(order.status);
                const nameEl = node.querySelector('.progress-name');
                const percentEl = node.querySelector('.progress-percentage');
                const progressEl = node.querySelector('progress');
                if (nameEl) nameEl.textContent = order.title || `Work Order ${order.id}`;
                if (percentEl) percentEl.textContent = `${progressValue}%`;
                if (progressEl) progressEl.value = progressValue;
            });

            const timeline = document.querySelector('.activity-timeline');
            if (timeline) {
                timeline.innerHTML = '';
                list.slice(0, 4).forEach((wo) => {
                    const item = document.createElement('div');
                    item.className = 'activity-row';
                    item.innerHTML = `
                        <div class="activity-icon-box"><i class="fa-regular fa-file-lines"></i></div>
                        <div class="activity-details">
                            <p class="activity-text">Work order <strong>WO-${String(wo.id).padStart(4, '0')}</strong> ${String(wo.status || '').toLowerCase()}</p>
                            <span class="activity-time">${new Date(wo.created_at || Date.now()).toLocaleString()}</span>
                        </div>
                    `;
                    timeline.appendChild(item);
                });
            }

            const machineBody = document.querySelector('.table-responsive table tbody');
            if (machineBody && assetList.length) {
                machineBody.innerHTML = '';
                assetList.slice(0, 5).forEach((asset) => {
                    const statusClass = String(asset.status || '').toLowerCase() === 'maintenance' ? 'maintenance' : 'running';
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="dark-text font-semibold">${asset.name || ''}</td>
                        <td><span class="badge badge-${statusClass}">${asset.status || 'Active'}</span></td>
                        <td class="slate-text">${new Date(asset.created_at || Date.now()).toLocaleString()}</td>
                    `;
                    machineBody.appendChild(row);
                });
            }

            const chartEl = document.getElementById('teamPerformanceChart');
            if (chartEl) {
                const days = [];
                for (let i = 6; i >= 0; i -= 1) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    days.push(d);
                }
                const labels = days.map((d) => d.toLocaleDateString(undefined, { weekday: 'short' }));
                const dayKeys = days.map((d) => dateKey(d));
                const doneByDay = list.reduce((acc, item) => {
                    if (item.status !== 'Completed') return acc;
                    const key = dateKey(item.created_at || Date.now());
                    acc[key] = (acc[key] || 0) + 1;
                    return acc;
                }, {});

                new Chart(chartEl.getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels,
                        datasets: [{
                            data: dayKeys.map((key) => doneByDay[key] || 0),
                            backgroundColor: '#3b82f6',
                            borderRadius: 4,
                            borderSkipped: false,
                            barThickness: 14
                        }]
                    },
                    options: {
                        plugins: { legend: { display: false } },
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                min: 0,
                                grid: { color: '#f1f5f9' },
                                ticks: {
                                    color: '#94a3b8',
                                    font: { size: 10 },
                                    stepSize: 1
                                },
                                border: { display: false }
                            },
                            x: {
                                grid: { display: false },
                                ticks: { color: '#94a3b8', font: { size: 10 } }
                            }
                        }
                    }
                });
            }
        } catch (err) {
            console.warn('Manager live data load failed', err);
        }
    })();
});