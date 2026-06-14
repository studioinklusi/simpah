// SIMPAH - Hash Router with Auth Guard
import { getAuthProfile, isPublicRoute, getDefaultRoute } from './lib/auth.js';

const routes = {};
let currentCleanup = null;

export function registerRoute(path, handler, allowedRoles = null) {
  routes[path] = { handler, allowedRoles };
}

export function navigate(path) {
  window.location.hash = path;
}

export function getCurrentRoute() {
  return window.location.hash.slice(1) || '/';
}

export function startRouter(defaultRoute = '/login') {
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
        const defaultRoute = getDefaultRoute(user);
        window.location.hash = defaultRoute;
        return;
      }
    }

    // Find matching route (exact match first, then prefix match)
    let routeConfig = routes[hash];
    if (!routeConfig) {
      // Try prefix matching for nested routes
      const sortedRoutes = Object.keys(routes).sort((a, b) => b.length - a.length);
      for (const route of sortedRoutes) {
        if (hash.startsWith(route)) {
          routeConfig = routes[route];
          break;
        }
      }
    }

    let handler = routeConfig ? (typeof routeConfig === 'function' ? routeConfig : routeConfig.handler) : null;
    let allowedRoles = routeConfig && typeof routeConfig !== 'function' ? routeConfig.allowedRoles : null;

    if (handler) {
      // ── Centralized Role Authorization Guard ────────────────────
      if (allowedRoles) {
        const user = getAuthProfile();
        if (!user || !allowedRoles.includes(user.role)) {
          // Unauthorized — redirect to user's default route
          const defaultRoute = getDefaultRoute(user);
          window.location.hash = defaultRoute;
          return;
        }
      }

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

    // Manage AI Assistant Widget visibility based on auth status and route
    const user = getAuthProfile();
    const widget = document.querySelector('.ai-chat-widget');
    if (user && !isPublicRoute(hash)) {
      if (!widget) {
        try {
          const { renderAIChatWidget } = await import('./components/ai-chat.js');
          renderAIChatWidget();
        } catch (err) {
          console.error('Failed to load AI Chat widget:', err);
        }
      }
    } else {
      if (widget) {
        widget.remove();
      }
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

