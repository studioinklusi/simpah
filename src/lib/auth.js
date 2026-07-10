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
  '/register',
  '/forgot-password',
  '/reset-password',
  '/portal',
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
        if (!_isPublicRoute(window.location.hash.slice(1) || '/login')) {
          window.location.hash = '#/login';
        }
        break;

      case 'USER_UPDATED':
        if (session?.user) {
          await _loadProfile(session.user.id);
        }
        break;

      case 'PASSWORD_RECOVERY':
        console.log('[Auth] Password recovery event triggered');
        window.location.hash = '#/reset-password';
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
  let email = emailOrUsername.trim();

  // Jika input login adalah username (tidak ada '@')
  if (!email.includes('@')) {
    try {
      const { data: resolvedEmail, error: rpcError } = await supabase
        .rpc('get_email_by_username', { p_username: email.toLowerCase() });
      
      if (!rpcError && resolvedEmail) {
        email = resolvedEmail;
      } else {
        // Fallback jika RPC error atau tidak menemukan email
        console.warn('[Auth] Gagal translate username via RPC, menggunakan fallback default:', rpcError?.message);
        email = `${email.toLowerCase()}@simpah.dev`;
      }
    } catch (err) {
      console.warn('[Auth] Gagal panggil RPC get_email_by_username:', err);
      email = `${email.toLowerCase()}@simpah.dev`;
    }
  }

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
 * Check if a username is already taken in the profiles table.
 * Uses RPC function (SECURITY DEFINER) so it works for unauthenticated users.
 * Returns true if available, false if taken.
 */
export async function checkUsernameAvailable(username) {
  try {
    // Try RPC function first (works for anon users)
    const { data, error } = await supabase
      .rpc('check_username_available', { p_username: username.trim().toLowerCase() });

    if (!error && data !== null) {
      return data === true;
    }

    // Fallback: direct table query (only works for authenticated users)
    console.warn('[Auth] RPC check_username_available not available, trying direct query:', error?.message);
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.trim().toLowerCase())
      .limit(1);

    if (profileError) {
      console.warn('[Auth] Username check failed:', profileError);
      return true; // Allow registration attempt if check fails
    }

    return !profileData || profileData.length === 0;
  } catch (err) {
  }
}

/**
 * Check if an email is already registered in auth.users.
 * Uses RPC function (SECURITY DEFINER) so it works for unauthenticated users.
 * Returns true if available, false if taken.
 */
export async function checkEmailAvailable(email) {
  try {
    // Try RPC function first (works for anon users)
    const { data, error } = await supabase
      .rpc('check_email_available', { p_email: email.trim().toLowerCase() });

    if (!error && data !== null) {
      return data === true;
    }

    if (error) {
      console.warn('[Auth] RPC check_email_available not available or failed:', error.message);
    }
    return true; // Allow registration attempt if check fails
  } catch (err) {
    console.warn('[Auth] Email availability check error:', err);
    return true; // Allow registration attempt if check fails entirely
  }
}

/**
 * Register a new user with email, password, username, and full name.
 * Default role is 'warga' set by database trigger.
 */
export async function register(email, password, username, fullName, invitationCode = null, desaId = null, kecamatan = null) {
  // Pre-check: username uniqueness
  const usernameAvailable = await checkUsernameAvailable(username);
  if (!usernameAvailable) {
    throw new AuthError('Username "' + username.trim().toLowerCase() + '" sudah digunakan. Silakan pilih username lain.', 409);
  }

  // Pre-check: email uniqueness
  const emailAvailable = await checkEmailAvailable(email);
  if (!emailAvailable) {
    throw new AuthError('Alamat email sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda.', 409);
  }

  const metadata = {
    username: username.trim().toLowerCase(),
    full_name: fullName.trim(),
  };

  if (invitationCode && invitationCode.trim()) {
    metadata.invitation_code = invitationCode.trim().toUpperCase();
  }

  if (desaId && desaId.trim()) {
    metadata.desa_id = desaId.trim();
  }

  if (kecamatan && kecamatan.trim()) {
    metadata.kecamatan = kecamatan.trim();
  }

  console.log('[Auth] Registration metadata:', JSON.stringify(metadata, null, 2));

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  });

  if (error) {
    console.error('[Auth] SignUp error FULL:', JSON.stringify({
      message: error.message,
      status: error.status,
      code: error.code,
      details: error.details,
      hint: error.hint,
      name: error.name,
    }, null, 2));
    console.error('[Auth] SignUp error RAW:', error);
    throw new AuthError(_mapAuthError(error), error.status);
  }

  return data;
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
 * Send password reset link to user's email.
 */
export async function sendResetPasswordEmail(email) {
  const redirectUrl = `${window.location.origin}${window.location.pathname}`;
  console.log('[Auth] Sending reset email with redirect to:', redirectUrl);
  
  const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: redirectUrl,
  });

  if (error) {
    throw new AuthError(_mapAuthError(error), error.status);
  }

  return data;
}

/**
 * Update the user's password (used in the recovery/reset password flow).
 */
export async function resetPassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw new AuthError(_mapAuthError(error), error.status);
  }

  return data;
}

/**
 * Verify recovery OTP code sent to user's email.
 */
export async function verifyRecoveryOtp(email, token) {
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: token.trim(),
    type: 'recovery',
  });

  if (error) {
    throw new AuthError(_mapAuthError(error), error.status);
  }

  return data;
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
export function getDefaultRoute(roleOrProfile) {
  return _getDefaultRoute(roleOrProfile);
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
    } else if (data.is_active === false) {
      console.warn('[Auth] User is deactivated, logging out');
      _profile = null;
      sessionStorage.removeItem('simpah_user');
      await supabase.auth.signOut();
      throw new Error('Akun Anda telah dinonaktifkan oleh administrator.');
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

function _getDefaultRoute(roleOrProfile) {
  const profile = typeof roleOrProfile === 'string' ? { role: roleOrProfile } : roleOrProfile;
  if (!profile) return '#/pwa/home';
  
  switch (profile.role) {
    case 'eksekutif':
      return '#/dashboard/eksekutif';
    case 'admin':
      return '#/dashboard/gis';
    case 'petugas':
      if (profile.job_type === 'koordinator') {
        return '#/dashboard/validasi';
      }
      return '#/pwa/home';
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
  if (msg.includes('already registered') || msg.includes('email_exists') || msg.includes('user already exists')) {
    return 'Email sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda.';
  }
  if (msg.includes('unique constraint') && msg.includes('username')) {
    return 'Username sudah digunakan. Silakan pilih username lain.';
  }
  if (msg.includes('gagal membuat profil') || msg.includes('failed to create profile')) {
    // Detailed error from our updated trigger
    console.error('[Auth] Trigger error:', error.message);
    // Parse the specific constraint error
    const origMsg = error.message || '';
    if (origMsg.includes('unique') && origMsg.includes('username')) {
      return 'Username sudah digunakan oleh akun lain. Silakan pilih username yang berbeda.';
    }
    if (origMsg.includes('foreign key') || origMsg.includes('violates foreign key')) {
      return 'Data lokasi (desa/kecamatan) tidak valid. Silakan pilih ulang dari daftar yang tersedia.';
    }
    if (origMsg.includes('not-null') || origMsg.includes('null value')) {
      return 'Ada data wajib yang belum terisi. Silakan lengkapi semua kolom yang diperlukan.';
    }
    if (origMsg.includes('check constraint')) {
      return 'Data yang dimasukkan tidak sesuai format. Silakan periksa kembali inputan Anda.';
    }
    return 'Gagal menyimpan data profil. Detail: ' + origMsg;
  }
  if (msg.includes('database error saving new user') || msg.includes('unexpected_failure')) {
    // Generic Supabase error - trigger didn't have our exception handler yet
    console.error('[Auth] Database error during registration:', error.message);
    return 'Gagal menyimpan data pendaftaran ke database. Silakan coba lagi atau hubungi administrator. (Error: ' + (error.message || 'Unknown') + ')';
  }
  if (msg.includes('too many requests') || msg.includes('rate limit')) {
    return 'Terlalu banyak percobaan. Coba lagi dalam beberapa menit.';
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Tidak dapat terhubung ke server. Periksa koneksi internet.';
  }
  
  return error.message || 'Terjadi kesalahan saat memproses permintaan Anda';
}
