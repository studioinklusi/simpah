// SIMPAH - Hash Router with Auth Guard
import { getAuthProfile, isPublicRoute } from './lib/auth.js';

const routes = {};
let currentCleanup = null;

export function registerRoute(path, handler) {
  routes[path] = handler;
}

export function navigate(path) {
  window.location.hash = path;
}

export function getCurrentRoute() {
  return window.location.hash.slice(1) || '/';
}

export function startRouter(defaultRoute = '/portal') {
  async function handleRoute() {
    const hash = window.location.hash.slice(1) || defaultRoute;
    
    // Cleanup previous page
    if (currentCleanup && typeof currentCleanup === 'function') {
      currentCleanup();
      currentCleanup = null;
    }

    // ── Centralized Route Guard ──────────────────────────────────
    // Protected routes require authentication.
    // Public routes (/login, /portal/*) are always accessible.
    if (!isPublicRoute(hash)) {
      const user = getAuthProfile();
      if (!user) {
        // Not authenticated — redirect to login
        window.location.hash = '#/login';
        return;
      }
    }

    // If user is already logged in and visits /login, redirect to their default page
    if (hash === '/login') {
      const user = getAuthProfile();
      if (user) {
        const defaultForRole = _getDefaultRouteForRole(user.role);
        window.location.hash = defaultForRole;
        return;
      }
    }

    // Find matching route (exact match first, then prefix match)
    let handler = routes[hash];
    if (!handler) {
      // Try prefix matching for nested routes
      const sortedRoutes = Object.keys(routes).sort((a, b) => b.length - a.length);
      for (const route of sortedRoutes) {
        if (hash.startsWith(route)) {
          handler = routes[route];
          break;
        }
      }
    }

    if (handler) {
      try {
        const cleanup = await handler(hash);
        if (typeof cleanup === 'function') {
          currentCleanup = cleanup;
        }
      } catch (e) {
        console.error('Route handler error:', e);
      }
    } else {
      // 404 - redirect to default
      window.location.hash = defaultRoute;
    }
  }

  window.addEventListener('hashchange', handleRoute);
  handleRoute();

  return () => {
    window.removeEventListener('hashchange', handleRoute);
  };
}

export function isActiveRoute(path) {
  const current = getCurrentRoute();
  return current === path || current.startsWith(path + '/');
}

function _getDefaultRouteForRole(role) {
  switch (role) {
    case 'eksekutif':
      return '#/dashboard/eksekutif';
    case 'admin':
      return '#/dashboard/gis';
    case 'petugas':
    case 'warga':
    default:
      return '#/pwa/home';
  }
}

