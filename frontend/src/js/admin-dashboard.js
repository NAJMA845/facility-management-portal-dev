document.addEventListener('DOMContentLoaded', () => {
    if (window.authGuard) {
        const user = window.authGuard.protect({ allowedRoles: ['admin'] });
        if (!user) return;
    }

    const palette = {
        accentBlue: '#3b82f6',
        neutralMedium: '#94a3b8',
        neutralLight: '#cbd5e1',
        alertRed: '#ef4444'
    };

    function renderCustomLegend(containerId, labels, data, colorsList) {
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

    (async function loadLiveAdminData() {
        try {
            const [summary, workOrders, assets] = await Promise.all([
                window.api.getSummary(),
                window.api.getWorkOrders(),
                window.api.getAssets()
            ]);

            const list = Array.isArray(workOrders) ? workOrders : [];
            const assetList = Array.isArray(assets) ? assets : [];

            const totalWorkOrders = list.length;
            const openCount = list.filter((item) => ['Open', 'Pending'].includes(item.status)).length;
            const inProgressCount = list.filter((item) => item.status === 'In Progress').length;
            const completedCount = list.filter((item) => item.status === 'Completed').length;

            const metricEls = document.querySelectorAll('.metric-card .metric-value');
            if (metricEls.length >= 4) {
                metricEls[0].textContent = String(totalWorkOrders);
                metricEls[1].textContent = String(openCount);
                metricEls[2].textContent = String(summary.assets || assetList.length || 0);
                metricEls[3].textContent = String(summary.assets || assetList.length || 0);
            }

            const assetTotalCards = document.querySelectorAll('.mini-card-value');
            if (assetTotalCards.length >= 3) {
                const activeAssets = assetList.filter((item) => item.status === 'Active').length;
                const maintenanceAssets = assetList.filter((item) => item.status === 'Maintenance').length;
                assetTotalCards[0].textContent = String(assetList.length);
                assetTotalCards[1].textContent = String(activeAssets);
                assetTotalCards[2].textContent = String(maintenanceAssets);
            }

            const donutNum = document.querySelector('.donut-num');
            if (donutNum) donutNum.textContent = String(assetList.length);

            const tbody = document.querySelector('.split-card table tbody');
            if (tbody) {
                tbody.innerHTML = '';
                list.slice(0, 4).forEach((workOrder) => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="bold-text">WO-${String(workOrder.id).padStart(4, '0')}</td>
                        <td>${workOrder.title || ''}</td>
                        <td class="text-right"><span class="badge badge-${String(workOrder.status || 'open').toLowerCase().replace(/\s+/g, '-')}">${workOrder.status || ''}</span></td>
                    `;
                    tbody.appendChild(row);
                });
            }

            const woLabels = ['Pending/Open', 'In Progress', 'Completed', 'Closed'];
            const woData = [
                openCount,
                inProgressCount,
                completedCount,
                list.filter((item) => item.status === 'Closed').length
            ];
            const woColors = [palette.accentBlue, palette.neutralLight, palette.neutralMedium, '#e2e8f0'];
            const ctxWO = document.getElementById('workOrderStatusChart');
            if (ctxWO) {
                new Chart(ctxWO.getContext('2d'), {
                    type: 'doughnut',
                    data: { labels: woLabels, datasets: [{ data: woData, backgroundColor: woColors, borderWidth: 0, cutout: '75%' }] },
                    options: { plugins: { legend: { display: false } }, responsive: true, maintainAspectRatio: false }
                });
                renderCustomLegend('workOrderLegend', woLabels, woData, woColors);
            }

            const machineLabels = ['Active', 'Maintenance', 'Inactive', 'Retired'];
            const machineData = [
                assetList.filter((item) => item.status === 'Active').length,
                assetList.filter((item) => item.status === 'Maintenance').length,
                assetList.filter((item) => item.status === 'Inactive').length,
                assetList.filter((item) => item.status === 'Retired').length
            ];
            const machineColors = [palette.accentBlue, palette.neutralLight, palette.alertRed, '#e2e8f0'];
            const ctxMachine = document.getElementById('machinesOverviewChart');
            if (ctxMachine) {
                new Chart(ctxMachine.getContext('2d'), {
                    type: 'doughnut',
                    data: { labels: machineLabels, datasets: [{ data: machineData, backgroundColor: machineColors, borderWidth: 0, cutout: '80%' }] },
                    options: { plugins: { legend: { display: false } }, responsive: true, maintainAspectRatio: false }
                });
                renderCustomLegend('machinesOverviewLegend', machineLabels, machineData, machineColors);
            }
        } catch (error) {
            console.warn('Admin dashboard live data load failed', error);
        }
    })();
});