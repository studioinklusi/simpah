// SIMPAH - Modal Component
export function showModal({ title, content, actions = [], onClose }) {
  const container = document.getElementById('modal-container');
  if (!container) return;

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.onclick = () => closeModal();

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-header">
      <h3>${title}</h3>
      <button class="btn btn-icon btn-ghost modal-close-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body">${typeof content === 'string' ? content : ''}</div>
    ${actions.length > 0 ? `
    <div class="modal-footer">
      ${actions.map((a, i) => `
        <button class="btn ${a.variant || 'btn-secondary'}" data-action-idx="${i}">${a.label}</button>
      `).join('')}
    </div>` : ''}
  `;

  if (typeof content !== 'string' && content instanceof HTMLElement) {
    modal.querySelector('.modal-body').appendChild(content);
  }

  // Wire up close
  modal.querySelector('.modal-close-btn').onclick = () => closeModal();

  // Wire up actions
  actions.forEach((action, idx) => {
    const btn = modal.querySelector(`[data-action-idx="${idx}"]`);
    if (btn) {
      btn.onclick = () => {
        if (action.handler) action.handler();
        if (action.closeOnClick !== false) closeModal();
      };
    }
  });

  container.appendChild(backdrop);
  container.appendChild(modal);

  function closeModal() {
    backdrop.remove();
    modal.remove();
    if (onClose) onClose();
  }

  return { close: closeModal, modal };
}
