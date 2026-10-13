/* ============================================================
   Language switcher — custom dropdown driving Google Translate
   ============================================================ */
console.log('[lang-switcher.js] loaded');

const LANG_LABELS = {
  en: 'English',
  af: 'Afrikaans',
  zu: 'isiZulu',
  xh: 'isiXhosa',
  nso: 'Sepedi',
  tn: 'Setswana',
  st: 'Sesotho',
  ts: 'Xitsonga',
  ss: 'siSwati',
  ve: 'Tshivenda',
  nr: 'isiNdebele'
};

/* ---------- Google Translate cookie helpers ---------- */
function setGoogleLang(code) {
  // Google Translate uses the googtrans cookie to remember the language
  const domain = location.hostname;
  if (code === 'en') {
    // Clear cookie → back to original
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`;
  } else {
    const value = `/en/${code}`;
    document.cookie = `googtrans=${value}; path=/;`;
    document.cookie = `googtrans=${value}; path=/; domain=${domain};`;
  }
}

function applyGoogleLang(code) {
  if (code === 'nr') {
    // Google doesn't support isiNdebele. Show a graceful notice.
    alert('isiNdebele translation is coming soon. Displaying English for now.');
    return;
  }
  setGoogleLang(code);
  location.reload();
}

/* ---------- Custom dropdown ---------- */
function initLangSwitcher() {
  const btn = document.getElementById('langCustomBtn');
  const menu = document.getElementById('langCustomMenu');
  const label = document.getElementById('langCustomLabel');
  if (!btn || !menu) return;

  // Read the current language from the googtrans cookie
  const match = document.cookie.match(/googtrans=\/en\/([a-z-]+)/);
  const current = match ? match[1] : 'en';
  if (label && LANG_LABELS[current]) label.textContent = LANG_LABELS[current];

  // Highlight the active item
  menu.querySelectorAll('button').forEach(b => {
    if (b.dataset.lang === current) {
      b.style.color = 'var(--red)';
      b.style.fontWeight = '700';
    }
  });

  // Toggle open/close
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const open = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // Close when clicking outside
  document.addEventListener('click', () => {
    menu.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });

  // Handle selection
  menu.querySelectorAll('button').forEach(b => {
    b.addEventListener('click', e => {
      e.stopPropagation();
      const code = b.dataset.lang;
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      if (label) label.textContent = LANG_LABELS[code];
      applyGoogleLang(code);
    });
  });
}

/* ---------- Google injects its widget asynchronously — wait for it ---------- */
function hideGoogleWidget() {
  // Google wraps its UI in .goog-te-gadget and inserts a banner at the top
  document.querySelectorAll('.goog-te-gadget').forEach(el => {
    el.style.fontSize = '0';
    el.style.color = 'transparent';
    el.style.height = '0';
    el.style.overflow = 'hidden';
  });
  // Remove the banner frame Google injects
  const banner = document.querySelector('.goog-te-banner-frame');
  if (banner) banner.style.display = 'none';
  // Reset the top offset Google adds to <body>
  document.body.style.top = '0px';
}

document.addEventListener('DOMContentLoaded', () => {
  initLangSwitcher();
  hideGoogleWidget();
  // Google loads late; keep hiding until it settles
  let attempts = 0;
  const int = setInterval(() => {
    hideGoogleWidget();
    if (++attempts >= 20) clearInterval(int);
  }, 250);
});

// Google sometimes re-injects the banner after translation — catch it
const observer = new MutationObserver(() => hideGoogleWidget());
document.addEventListener('DOMContentLoaded', () => {
  observer.observe(document.body, { childList: true, subtree: true });
});