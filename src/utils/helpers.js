// SIMPAH - General Helpers
import { supabase } from '../lib/supabase.js';
import { getAuthProfile, logout as authLogout, refreshProfile } from '../lib/auth.js';

export function formatDate(isoString) {
  if (!isoString) return '-';
  const d = new Date(isoString);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(isoString) {
  if (!isoString) return '-';
  const d = new Date(isoString);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export function formatTime(isoString) {
  if (!isoString) return '-';
  const d = new Date(isoString);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export function formatWeight(kg) {
  if (kg == null) return '-';
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} ton`;
  return `${kg.toFixed(1)} kg`;
}

export function formatNumber(num) {
  if (num == null) return '-';
  return new Intl.NumberFormat('id-ID').format(num);
}

export function formatPercent(value) {
  if (value == null) return '-';
  return `${parseFloat(value).toFixed(1)}%`;
}

export function getRelativeTime(isoString) {
  const now = new Date();
  const date = new Date(isoString);
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  if (days < 7) return `${days} hari lalu`;
  return formatDate(isoString);
}

export function getToday() {
  return new Date().toISOString().split('T')[0];
}

export function getThisMonth() {
  return new Date().toISOString().substring(0, 7);
}

export function getDaysInRange(startDate, endDate) {
  const days = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    days.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return days;
}

export function getLast30Days() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 29);
  return getDaysInRange(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
}

export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function truncate(str, len = 50) {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '...' : str;
}

// Simple state management
const _state = {};
const _listeners = {};

export function setState(key, value) {
  _state[key] = value;
  if (_listeners[key]) {
    _listeners[key].forEach(fn => fn(value));
  }
}

export function getState(key) {
  return _state[key];
}

export function onStateChange(key, fn) {
  if (!_listeners[key]) _listeners[key] = [];
  _listeners[key].push(fn);
  return () => {
    _listeners[key] = _listeners[key].filter(l => l !== fn);
  };
}

// Theme management
export function initTheme() {
  const saved = localStorage.getItem('simpah-theme');
  const theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
  setState('theme', theme);
}

export function toggleTheme() {
  const current = getState('theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('simpah-theme', next);
  setState('theme', next);
}

// Session management — bridged to centralized auth module (src/lib/auth.js)
export function getCurrentUser() {
  return getAuthProfile();
}

export async function fetchCurrentUser() {
  // Now handled by initAuth() in auth.js during bootstrap.
  // Kept for backward compat — delegates to refreshProfile.
  return refreshProfile();
}

export function setCurrentUser(user) {
  // Still used by auth.js internally to sync state.
  // Keep sessionStorage for quick access fallback.
  sessionStorage.setItem('simpah_user', JSON.stringify(user));
  setState('user', user);
}

export async function logout() {
  return authLogout();
}


export function isMobileDevice() {
  const ua = navigator.userAgent || '';
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);
  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  
  // HP / Smartphone (termasuk layar 6.7" berdensitas DP tinggi) akan terdeteksi sebagai Mobile
  if (isMobileUA) return true;
  return (window.innerWidth <= 1024) && isTouch;
}

/**
 * Menghitung status keaktifan kader berdasarkan tanggal input terakhir (ambang 10 hari)
 * @param {string|Date|null} lastInputDate 
 * @returns {{ status: 'active'|'passive'|'inactive', label: string, color: string, icon: string, days: number|null }}
 */
export function getKaderActivityStatus(lastInputDate) {
  if (!lastInputDate) {
    return { status: 'never', label: 'Belum Input', color: 'red', icon: '🔴', days: null };
  }
  const now = new Date();
  const inputDate = new Date(lastInputDate);
  const diffTime = Math.max(0, now - inputDate);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 10) {
    return { status: 'active', label: 'Aktif', color: 'green', icon: '🟢', days: diffDays };
  } else if (diffDays <= 30) {
    return { status: 'passive', label: 'Pasif', color: 'amber', icon: '🟡', days: diffDays };
  } else {
    return { status: 'inactive', label: 'Inaktif', color: 'red', icon: '🔴', days: diffDays };
  }
}


