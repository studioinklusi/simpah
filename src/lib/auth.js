// SIMPAH - Centralized Auth Module
// Manages Supabase auth session lifecycle, route guards, and profile caching
import { supabase } from './supabase.js';
import { setState, getState } from '../utils/helpers.js';

// ── Internal State ──────────────────────────────────────────────────────────
let _profile = null;
let _authReady = false;
let _authReadyResolve = null;
const _authReadyPromise = new Promise((resolve) => { _authReadyResolve = resolve; });

// Routes that DON'T require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/portal',
  '/portal/edukasi',
  '/portal/galeri',
  '/portal/regulasi',
  '/portal/aduan',
  '/portal/cek-aduan',
];

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Initialize the auth system. Call once during app bootstrap.
 * Sets up onAuthStateChange listener and restores session.
 */
export async function initAuth() {
  // 1. Listen for auth state changes (login, logout, token refresh, etc.)
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('[Auth] State change:', event);

    switch (event) {
      case 'SIGNED_IN':
      case 'TOKEN_REFRESHED':
        if (session?.user) {
          await _loadProfile(session.user.id);
        }
        break;

      case 'SIGNED_OUT':
        _clearSession();
        // Only redirect if we're on a protected route
        if (!_isPublicRoute(window.location.hash.slice(1) || '/portal')) {
          window.location.hash = '#/login';
        }
        break;

      case 'USER_UPDATED':
        if (session?.user) {
          await _loadProfile(session.user.id);
        }
        break;
    }
  });

  // 2. Restore existing session on page load
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await _loadProfile(session.user.id);
    }
  } catch (err) {
    console.warn('[Auth] Session restore failed:', err);
  }

  _authReady = true;
  _authReadyResolve();
}

/**
 * Wait for the auth system to be ready (session restored).
 * Use this before checking auth state on app startup.
 */
export function waitForAuth() {
  return _authReadyPromise;
}

/**
 * Is the auth system initialized?
 */
export function isAuthReady() {
  return _authReady;
}

/**
 * Login with email/username + password.
 * Returns { user, profile } on success, throws on failure.
 */
export async function login(emailOrUsername, password) {
  const email = emailOrUsername.includes('@')
    ? emailOrUsername
    : `${emailOrUsername}@simpah.dev`;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new AuthError(_mapAuthError(error), error.status);
  }

  // Profile should already be loaded by onAuthStateChange,
  // but ensure it's there
  if (!_profile) {
    await _loadProfile(data.user.id);
  }

  return { user: data.user, profile: _profile };
}

/**
 * Logout the current user. Clears session and redirects to login.
 */
export async function logout() {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('[Auth] Sign out error:', err);
  }
  _clearSession();
  window.location.hash = '#/login';
}

/**
 * Get the currently authenticated user's profile.
 * Returns null if not logged in.
 */
export function getAuthProfile() {
  return _profile;
}

/**
 * Get the current Supabase session (async).
 */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Refresh the cached profile from Supabase.
 * Useful after profile updates.
 */
export async function refreshProfile() {
  const session = await getSession();
  if (session?.user) {
    await _loadProfile(session.user.id, true);
  }
  return _profile;
}

/**
 * Route guard — call at the top of protected page renderers.
 * Returns the profile if authenticated, or redirects to login.
 * @param {string[]} allowedRoles - Optional: restrict to specific roles
 * @returns {object|null} User profile or null (after redirect)
 */
export function requireAuth(allowedRoles = null) {
  if (!_profile) {
    window.location.hash = '#/login';
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(_profile.role)) {
    // User doesn't have the required role — redirect to their default page
    window.location.hash = _getDefaultRoute(_profile.role);
    return null;
  }

  return _profile;
}

/**
 * Check if a hash route is public (no auth required).
 */
export function isPublicRoute(hash) {
  return _isPublicRoute(hash);
}

/**
 * Get the default landing route for a given role.
 */
export function getDefaultRoute(role) {
  return _getDefaultRoute(role);
}

// ── Custom Error ────────────────────────────────────────────────────────────

export class AuthError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

// ── Internal Helpers ────────────────────────────────────────────────────────

async function _loadProfile(userId, forceRefresh = false) {
  // Check cache first (unless force refresh)
  if (_profile && _profile.id === userId && !forceRefresh) {
    return _profile;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.warn('[Auth] Profile load failed:', error);
      _profile = null;
    } else {
      // Fetch RBAC Permissions
      try {
        const { data: permData, error: permError } = await supabase
          .from('role_permissions')
          .select('module_id')
          .eq('role_code', data.role);
          
        if (!permError && permData) {
          data.permissions = permData.map(p => p.module_id);
        } else {
          data.permissions = [];
        }
      } catch (err) {
        data.permissions = [];
      }

      _profile = data;
      // Sync with legacy helpers state
      sessionStorage.setItem('simpah_user', JSON.stringify(data));
      setState('user', data);
    }
  } catch (err) {
    console.error('[Auth] Profile fetch error:', err);
    _profile = null;
  }

  return _profile;
}

function _clearSession() {
  _profile = null;
  sessionStorage.removeItem('simpah_user');
  setState('user', null);
}

function _isPublicRoute(hash) {
  const route = hash.startsWith('#') ? hash.slice(1) : hash;
  return PUBLIC_ROUTES.some(r => route === r || route.startsWith(r + '/'));
}

function _getDefaultRoute(role) {
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

function _mapAuthError(error) {
  const msg = (error.message || '').toLowerCase();
  if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
    return 'Email/username atau password salah';
  }
  if (msg.includes('email not confirmed')) {
    return 'Akun belum dikonfirmasi. Hubungi administrator.';
  }
  if (msg.includes('too many requests') || msg.includes('rate limit')) {
    return 'Terlalu banyak percobaan. Coba lagi dalam beberapa menit.';
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Tidak dapat terhubung ke server. Periksa koneksi internet.';
  }
  return error.message || 'Terjadi kesalahan saat login';
}
