document.addEventListener('DOMContentLoaded', () => {
    if (window.authGuard) {
        const user = window.authGuard.protect({ allowedRoles: ['super-admin'] });
        if (!user) return;
    }

    const colors = {
        blueLight: '#3b82f6',
        slateMedium: '#94a3b8',
        slateLight: '#cbd5e1',
        rose: '#ef4444'
    };

    function statusCount(workOrders, statuses) {
        const set = new Set(statuses);
        return workOrders.filter((item) => set.has(String(item.status || ''))).length;
    }

    function formatCurrency(value) {
        return `$${Number(value || 0).toLocaleString()}`;
    }

    function generateLegend(containerId, labels, data, colorsList) {
        const legendContainer = document.getElementById(containerId);
        if (!legendContainer) return;
        legendContainer.innerHTML = '';

        const total = data.reduce((a, b) => a + b, 0) || 1;
        labels.forEach((label, index) => {
            const percentage = Math.round((data[index] / total) * 100);
            const item = document.createElement('div');
            item.className = 'legend-item';
            item.innerHTML = `
                <div class="legend-label-group">
                    <span class="legend-color-dot" style="background-color: ${colorsList[index]}"></span>
                    <span>${label}</span>
                </div>
                <span class="legend-stats">${data[index]} (${percentage}%)</span>
            `;
            legendContainer.appendChild(item);
        });
    }

    function renderRevenueChart(byMonth, fallbackTotal) {
        const ctxRev = document.getElementById('revenueOverviewChart');
        if (!ctxRev) return;

        const keys = Object.keys(byMonth || {}).sort();
        const lastKeys = keys.slice(-7);
        const labels = lastKeys.length ? lastKeys.map((key) => key.slice(5)) : ['Current'];
        const data = lastKeys.length ? lastKeys.map((key) => Number(byMonth[key] || 0)) : [Number(fallbackTotal || 0)];

        new Chart(ctxRev.getContext('2d'), {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    data,
                    borderColor: colors.blueLight,
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.35,
                    fill: true,
                    backgroundColor: (context) => {
                        const bgColor = context.chart.ctx.createLinearGradient(0, 0, 0, 200);
                        bgColor.addColorStop(0, 'rgba(59, 130, 246, 0.15)');
                        bgColor.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
                        return bgColor;
                    }
                }]
            },
            options: {
                plugins: { legend: { display: false } },
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        grid: { color: '#f1f5f9' },
                        ticks: {
                            color: '#94a3b8',
                            font: { size: 10 },
                            callback: (value) => `$${Math.round(value / 1000)}K`
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

    (async function loadLive() {
        try {
            const [summary, workOrders, assets, revenueSummary] = await Promise.all([
                window.api.getSummary(),
                window.api.getWorkOrders(),
                window.api.getAssets(),
                window.api.getRevenueSummary()
            ]);

            const list = Array.isArray(workOrders) ? workOrders : [];
            const assetList = Array.isArray(assets) ? assets : [];

            const totalWorkOrders = list.length;
            const pendingCount = statusCount(list, ['Open', 'Pending']);
            const inProgressCount = statusCount(list, ['In Progress']);
            const completedCount = statusCount(list, ['Completed']);

            const metricEls = document.querySelectorAll('.metric-card .metric-value');
            if (metricEls.length >= 4) {
                metricEls[0].textContent = String(summary.users || 0);
                metricEls[1].textContent = String(totalWorkOrders);
                metricEls[2].textContent = formatCurrency(revenueSummary.total || summary.revenue || 0);
                metricEls[3].textContent = String(summary.assets || assetList.length || 0);
            }

            const donutNum = document.querySelector('.donut-num');
            if (donutNum) donutNum.textContent = String(summary.assets || assetList.length || 0);

            const tbody = document.querySelector('.table-card table tbody');
            if (tbody) {
                tbody.innerHTML = '';
                list.slice(0, 8).forEach((wo) => {
                    const tr = document.createElement('tr');
                    const date = new Date(wo.created_at || Date.now()).toLocaleDateString();
                    tr.innerHTML = `<td>WO-${String(wo.id).padStart(4, '0')}</td><td>${wo.title || ''}</td><td><span class="badge">${wo.status || ''}</span></td><td>${wo.priority || ''}</td><td>${wo.assigned_name || ''}</td><td>${date}</td>`;
                    tbody.appendChild(tr);
                });
            }

            const woLabels = ['Pending', 'In Progress', 'Completed', 'Closed'];
            const woData = [pendingCount, inProgressCount, completedCount, statusCount(list, ['Closed'])];
            const woColors = [colors.blueLight, colors.slateLight, colors.slateMedium, '#e2e8f0'];
            const ctxWO = document.getElementById('workOrderStatusChart');
            if (ctxWO) {
                new Chart(ctxWO.getContext('2d'), {
                    type: 'doughnut',
                    data: { labels: woLabels, datasets: [{ data: woData, backgroundColor: woColors, borderWidth: 0, cutout: '75%' }] },
                    options: { plugins: { legend: { display: false } }, responsive: true, maintainAspectRatio: false }
                });
                generateLegend('workOrderLegend', woLabels, woData, woColors);
            }

            const machineLabels = ['Active', 'Maintenance', 'Inactive', 'Retired'];
            const machineData = [
                assetList.filter((item) => item.status === 'Active').length,
                assetList.filter((item) => item.status === 'Maintenance').length,
                assetList.filter((item) => item.status === 'Inactive').length,
                assetList.filter((item) => item.status === 'Retired').length
            ];
            const machineColors = [colors.blueLight, colors.slateLight, colors.rose, '#94a3b8'];
            const ctxMachine = document.getElementById('machineStatusChart');
            if (ctxMachine) {
                new Chart(ctxMachine.getContext('2d'), {
                    type: 'doughnut',
                    data: { labels: machineLabels, datasets: [{ data: machineData, backgroundColor: machineColors, borderWidth: 0, cutout: '80%' }] },
                    options: { plugins: { legend: { display: false } }, responsive: true, maintainAspectRatio: false }
                });
                generateLegend('machineLegend', machineLabels, machineData, machineColors);
            }

            renderRevenueChart(revenueSummary.byMonth, revenueSummary.total || summary.revenue);
        } catch (err) {
            console.warn('Live load failed', err);
        }
    })();
});