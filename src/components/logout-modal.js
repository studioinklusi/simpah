// SIMPAH - Logout Confirmation Modal
import { icons } from './icons.js';
import { logout } from '../lib/auth.js';

/**
 * Show a confirmation modal before logging out.
 * Called from both PWA layout and Dashboard layout.
 */
export function confirmLogout() {
  // Don't create duplicates
  if (document.getElementById('logoutModal')) return;

  const overlay = document.createElement('div');
  overlay.id = 'logoutModal';
  overlay.className = 'logout-modal-overlay';
  overlay.innerHTML = `
    <div class="logout-modal" role="dialog" aria-labelledby="logoutTitle" aria-modal="true">
      <div class="logout-modal-icon">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="22" stroke="#f59e0b" stroke-width="2" fill="rgba(245,158,11,0.1)"/>
          <path d="M24 14v12" stroke="#f59e0b" stroke-width="3" stroke-linecap="round"/>
          <circle cx="24" cy="32" r="2" fill="#f59e0b"/>
        </svg>
      </div>
      <h3 id="logoutTitle">Konfirmasi Logout</h3>
      <p>Apakah Anda yakin ingin keluar dari SIMPAH?</p>
      <p class="logout-modal-note">Data yang belum disinkronkan mungkin akan hilang.</p>
      <div class="logout-modal-actions">
        <button class="btn btn-secondary" id="logoutCancelBtn">Batal</button>
        <button class="btn btn-danger" id="logoutConfirmBtn">
          ${icons.logout} Ya, Keluar
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Animate in
  requestAnimationFrame(() => {
    overlay.classList.add('show');
  });

  // Wire up buttons
  const cancelBtn = document.getElementById('logoutCancelBtn');
  const confirmBtn = document.getElementById('logoutConfirmBtn');

  function dismiss() {
    overlay.classList.remove('show');
    setTimeout(() => overlay.remove(), 200);
  }

  cancelBtn.addEventListener('click', dismiss);
  
  // Click overlay background to dismiss
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) dismiss();
  });

  // Escape key to dismiss
  function onKeydown(e) {
    if (e.key === 'Escape') {
      dismiss();
      document.removeEventListener('keydown', onKeydown);
    }
  }
  document.addEventListener('keydown', onKeydown);

  confirmBtn.addEventListener('click', async () => {
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<div class="spinner" style="margin:0 auto;width:18px;height:18px;border-width:2px"></div>';
    
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
      // Force redirect even on error
      sessionStorage.clear();
      window.location.hash = '#/login';
    }
    
    dismiss();
  });

  // Focus the cancel button by default (safer)
  cancelBtn.focus();
}
