// SIMPAH - General Helpers
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

// Session management
export function getCurrentUser() {
  const userData = localStorage.getItem('simpah-user');
  return userData ? JSON.parse(userData) : null;
}

export function setCurrentUser(user) {
  localStorage.setItem('simpah-user', JSON.stringify(user));
  setState('user', user);
}

export function logout() {
  localStorage.removeItem('simpah-user');
  setState('user', null);
  window.location.hash = '#/login';
}
