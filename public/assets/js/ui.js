/* ============================================================
   UI — In-page modal confirmation + toast notifications
   Replaces browser alert() and confirm() with branded UI.
   ============================================================ */
console.log('[ui.js] loaded');

/* ---------- MODAL CONFIRM ---------- */

/**
 * Show a branded in-page confirmation modal.
 * @param {string} message - The question to display
 * @param {object} opts    - Optional { title, okLabel, cancelLabel, danger }
 * @returns {Promise<boolean>} - resolves true if confirmed, false if cancelled
 */
window.confirmModal = function confirmModal(message, opts = {}) {
  return new Promise(resolve => {
    const overlay = document.getElementById('confirmModal');
    const titleEl = document.getElementById('confirmTitle');
    const msgEl   = document.getElementById('confirmMessage');
    const okBtn   = document.getElementById('confirmOk');
    const cancelBtn = document.getElementById('confirmCancel');

    if (!overlay) {
      // Fallback — should never happen if markup is in place
      return resolve(window.confirm(message));
    }

    titleEl.textContent = opts.title || 'Confirm action';
    msgEl.textContent   = message;
    okBtn.textContent   = opts.okLabel || 'Confirm';
    cancelBtn.textContent = opts.cancelLabel || 'Cancel';

    // Colour the confirm button by intent
    okBtn.classList.remove('btn-primary', 'btn-danger');
    okBtn.classList.add(opts.danger ? 'btn-danger' : 'btn-primary');

    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');

    function cleanup(result) {
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      overlay.removeEventListener('click', onBackdrop);
      document.removeEventListener('keydown', onKey);
      resolve(result);
    }
    function onOk() { cleanup(true); }
    function onCancel() { cleanup(false); }
    function onBackdrop(e) { if (e.target === overlay) cleanup(false); }
    function onKey(e) { if (e.key === 'Escape') cleanup(false); }

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    overlay.addEventListener('click', onBackdrop);
    document.addEventListener('keydown', onKey);

    // Focus the confirm button so keyboard users can just press Enter
    setTimeout(() => okBtn.focus(), 60);
  });
};

/* ---------- TOASTS ---------- */

/**
 * Show a branded toast notification.
 * @param {string} message
 * @param {'success'|'error'|'info'} type
 * @param {number} duration - ms before auto-dismiss (0 = manual)
 */
window.showToast = function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  toast.innerHTML = `
    <span>${message}</span>
    <button class="toast__close" aria-label="Dismiss">×</button>
  `;
  container.appendChild(toast);

  const remove = () => {
    toast.classList.add('closing');
    setTimeout(() => toast.remove(), 260);
  };

  toast.querySelector('.toast__close').addEventListener('click', remove);
  if (duration > 0) setTimeout(remove, duration);
};

/* Shortcut aliases */
window.toastSuccess = msg => window.showToast(msg, 'success');
window.toastError   = msg => window.showToast(msg, 'error');
window.toastInfo    = msg => window.showToast(msg, 'info');