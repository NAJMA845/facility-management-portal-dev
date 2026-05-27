(function () {
  const sidebarWidth = 250;

  function currentPath() {
    return window.location.pathname.replace(/\/+/g, '/');
  }

  function roleHome() {
    if (window.authGuard && window.authGuard.getUser()) {
      return window.authGuard.roleHome(window.authGuard.getUser().role);
    }
    return '/src/pages/manager-dashboard.html';
  }

  function roleMenu() {
    const userRole = window.authGuard && window.authGuard.getUser() ? window.authGuard.getUser().role : 'manager';
    const baseLinks = [
      ['Dashboard', roleHome(), 'fa-solid fa-chart-pie'],
      ['Work Orders', '/src/pages/workorders.html', 'fa-regular fa-clipboard']
    ];

    const roleLinks = {
      'super-admin': [
        ['User Management', '/src/pages/user-management.html', 'fa-solid fa-users'],
        ['Tenants', '/src/pages/tenants.html', 'fa-solid fa-house-chimney'],
        ['Assets', '/src/pages/assets.html', 'fa-solid fa-shield-halved'],
        ['Machines', '/src/pages/machines.html', 'fa-solid fa-gears'],
        ['Revenue', '/src/pages/revenue.html', 'fa-solid fa-lock'],
        ['Contacts', '/src/pages/contacts.html', 'fa-solid fa-address-book']
      ],
      admin: [
        ['Tenants', '/src/pages/tenants.html', 'fa-solid fa-house-chimney'],
        ['Assets', '/src/pages/assets.html', 'fa-solid fa-shield-halved'],
        ['Machines', '/src/pages/machines.html', 'fa-solid fa-gears'],
        ['Revenue', '/src/pages/revenue.html', 'fa-solid fa-lock'],
        ['Contacts', '/src/pages/contacts.html', 'fa-solid fa-address-book']
      ],
      manager: [
        ['Tenants', '/src/pages/tenants.html', 'fa-solid fa-house-chimney'],
        ['Assets', '/src/pages/assets.html', 'fa-solid fa-shield-halved'],
        ['Machines', '/src/pages/machines.html', 'fa-solid fa-gears'],
        ['Revenue', '/src/pages/revenue.html', 'fa-solid fa-lock'],
        ['Contacts', '/src/pages/contacts.html', 'fa-solid fa-address-book']
      ],
      technician: [
        ['Submit Message', '/src/pages/technician-contact-form.html', 'fa-solid fa-envelope']
      ]
    };

    return [...baseLinks, ...(roleLinks[userRole] || roleLinks.manager)];
  }

  function buildSidebar() {
    const dashboardHref = roleHome();
    const path = currentPath();
    const links = roleMenu();

    return `
      <div class="sidebar-brand">
        <i class="fa-solid fa-building-shield brand-icon"></i>
        <span>Facility Pro</span>
      </div>
      <nav class="sidebar-menu">
        ${links.map(([label, href, icon]) => {
          const active = path === href || path.endsWith(href.replace(/^\//, '')) ? ' active' : '';
          return `<a href="${href}" class="menu-item${active}"><i class="${icon}"></i> ${label}</a>`;
        }).join('')}
        <div class="menu-divider"></div>
        <a href="/src/pages/settings.html" class="menu-item${path.endsWith('settings.html') ? ' active' : ''}"><i class="fa-solid fa-gear"></i> Settings</a>
        <a href="/src/pages/profile.html" class="menu-item${path.endsWith('profile.html') ? ' active' : ''}"><i class="fa-regular fa-user"></i> Profile</a>
      </nav>
      <div class="sidebar-footer">
        <a href="/public/login.html" class="menu-item logout-btn"><i class="fa-solid fa-arrow-right-from-bracket"></i> Logout</a>
      </div>
    `;
  }

  function applyShell() {
    const container = document.querySelector('.dashboard-container, .page-shell');
    const mainContent = document.querySelector('.main-content, .content');
    if (!container || !mainContent) return;

    let sidebar = container.querySelector('.sidebar');
    if (!sidebar) {
      sidebar = document.createElement('aside');
      sidebar.className = 'sidebar';
      container.insertBefore(sidebar, mainContent);
    }

    sidebar.innerHTML = buildSidebar();
    sidebar.style.position = 'fixed';
    sidebar.style.left = '0';
    sidebar.style.top = '0';
    sidebar.style.bottom = '0';
    sidebar.style.width = `${sidebarWidth}px`;
    sidebar.style.height = '100vh';
    sidebar.style.overflowY = 'auto';
    sidebar.style.zIndex = '20';

    mainContent.style.marginLeft = `${sidebarWidth}px`;
    mainContent.style.minHeight = '100vh';
    mainContent.style.width = `calc(100vw - ${sidebarWidth}px)`;
  }

  function renderUserProfile() {
    if (!window.authGuard) return;
    const user = window.authGuard.getUser();
    if (!user) return;

    const profile = document.querySelector('.user-profile');
    if (!profile) return;

    const roleEl = profile.querySelector('.user-role');
    const avatar = profile.querySelector('.avatar');
    const displayName = user.name || window.authGuard.roleLabel(user.role) || 'User';
    const initials = displayName
      .split(' ')
      .filter(Boolean)
      .map(word => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    if (roleEl) roleEl.textContent = displayName;
    if (avatar) {
      if (initials) {
        avatar.textContent = initials;
      } else {
        avatar.innerHTML = '<i class="fa-regular fa-user"></i>';
      }
    }
  }

  function wireLogout() {
    document.querySelectorAll('.logout-btn').forEach((link) => {
      link.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    applyShell();
    renderUserProfile();
    wireLogout();
  });
})();