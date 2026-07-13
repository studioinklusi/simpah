import { getAuthProfile, isPublicRoute, getDefaultRoute, isAuthReady, waitForAuth } from './lib/auth.js';
import { initTheme } from './utils/helpers.js';

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
    
    // Force light theme on public routes, restore saved theme on protected routes
    if (isPublicRoute(hash)) {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      initTheme();
    }
    
    // Cleanup previous page
    if (currentCleanup && typeof currentCleanup === 'function') {
      currentCleanup();
      currentCleanup = null;
    }

    // ── Centralized Route Guard ──────────────────────────────────
    // Protected routes require authentication.
    // Public routes (/login, /portal/*) are always accessible.
    if (!isPublicRoute(hash)) {
      if (!isAuthReady()) {
        // Safety timeout of 5 seconds to prevent routing from hanging forever
        await Promise.race([
          waitForAuth(),
          new Promise((resolve) => setTimeout(resolve, 5000))
        ]);
      }
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

    // Inject and manage top progress bar loading indicator
    let progressBar = document.getElementById('router-progress-bar');
    if (!progressBar) {
      progressBar = document.createElement('div');
      progressBar.id = 'router-progress-bar';
      progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        height: 3px;
        background: linear-gradient(90deg, #10b981, #059669);
        z-index: 99999;
        transition: width 0.2s ease, opacity 0.2s ease;
        width: 0;
        opacity: 0;
        pointer-events: none;
      `;
      document.body.appendChild(progressBar);
    }

    let progressInterval = null;

    function startProgress() {
      if (progressInterval) clearInterval(progressInterval);
      progressBar.style.opacity = '1';
      progressBar.style.width = '10%';
      let width = 10;
      progressInterval = setInterval(() => {
        if (width < 90) {
          width += Math.random() * 10 + 2;
          if (width > 90) width = 90;
          progressBar.style.width = width + '%';
        }
      }, 100);
    }

    function finishProgress() {
      if (progressInterval) clearInterval(progressInterval);
      progressBar.style.width = '100%';
      setTimeout(() => {
        progressBar.style.opacity = '0';
        setTimeout(() => {
          progressBar.style.width = '0';
        }, 200);
      }, 150);
    }

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
        startProgress();
        const cleanup = await handler(hash);
        if (typeof cleanup === 'function') {
          currentCleanup = cleanup;
        }
      } catch (e) {
        console.error('Route handler error:', e);
      } finally {
        finishProgress();
      }
    } else {
      // 404 - redirect to default
      window.location.hash = defaultRoute;
    }

    // Manage AI Assistant Widget visibility based on auth status and route
    const user = getAuthProfile();
    const widget = document.querySelector('.ai-chat-widget');
    if (user && !isPublicRoute(hash) && !hash.startsWith('/pwa')) {
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

