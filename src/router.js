// SIMPAH - Hash Router
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
