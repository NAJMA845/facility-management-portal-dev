// Simple auth guard used by protected pages. Does not change UI markup.
(function () {
  const roleHomeMap = {
    'super-admin': '/src/pages/super-admin.html',
    admin: '/src/pages/admin-dashboard.html',
    manager: '/src/pages/manager-dashboard.html',
    technician: '/src/pages/technician-dashboard.html',
    user: '/src/pages/manager-dashboard.html'
  };

  const pathRoleRules = [
    { pattern: /\/src\/pages\/super-admin\.html$/i, roles: ['super-admin'] },
    { pattern: /\/src\/pages\/admin-dashboard\.html$/i, roles: ['admin', 'super-admin'] },
    { pattern: /\/src\/pages\/manager-dashboard\.html$/i, roles: ['manager', 'user', 'admin', 'super-admin'] },
    { pattern: /\/src\/pages\/technician-dashboard\.html$/i, roles: ['technician', 'admin', 'super-admin'] },
    { pattern: /\/src\/pages\/user-management\.html$/i, roles: ['super-admin', 'admin'] },
    { pattern: /\/src\/pages\/tenants\.html$/i, roles: ['super-admin', 'admin', 'manager'] },
    { pattern: /\/src\/pages\/revenue\.html$/i, roles: ['super-admin', 'admin', 'manager'] },
    { pattern: /\/src\/pages\/assets\.html$/i, roles: ['super-admin', 'admin', 'manager'] },
    { pattern: /\/src\/pages\/machines\.html$/i, roles: ['super-admin', 'admin', 'manager'] }
  ];

  function getToken() { return localStorage.getItem('token'); }
  function getUser() {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  function roleHome(role) {
    return roleHomeMap[role] || '/src/pages/manager-dashboard.html';
  }

  function normalizeRoles(roles) {
    if (!roles) return [];
    return Array.isArray(roles) ? roles : [roles];
  }

  function getAllowedRolesForPath(pathname) {
    const rule = pathRoleRules.find((entry) => entry.pattern.test(pathname));
    return rule ? rule.roles : [];
  }

  function enforceCurrentPageAccess() {
    const pathname = window.location.pathname || '';
    const isLoginPage = /\/public\/login\.html$/i.test(pathname);
    const token = getToken();
    const user = getUser();

    if (!token || !user) {
      if (!isLoginPage) {
        window.location.replace('/public/login.html');
      }
      return null;
    }

    const allowed = getAllowedRolesForPath(pathname);
    if (allowed.length && !allowed.includes(user.role)) {
      window.location.replace(roleHome(user.role));
      return null;
    }

    return user;
  }

  function protect(options = {}) {
    const { allowedRoles = [], redirectToLogin = '/public/login.html' } = options;
    const token = getToken();
    const user = getUser();

    if (!token || !user) {
      window.location.href = redirectToLogin;
      return null;
    }

    const allowed = normalizeRoles(allowedRoles);
    if (allowed.length && !allowed.includes(user.role)) {
      window.location.href = roleHome(user.role);
      return null;
    }

    return user;
  }

  window.authGuard = {
    protect,
    enforceCurrentPageAccess,
    getToken,
    getUser,
    roleHome,
    roleLabel(role) {
      const labels = {
        'super-admin': 'Super Admin',
        admin: 'Admin',
        manager: 'Manager',
        technician: 'Technician',
        user: 'User'
      };
      return labels[role] || 'User';
    }
  };

  enforceCurrentPageAccess();
})();
