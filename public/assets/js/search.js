/* ============================================================
   SEARCH — universal search overlay with voice + AI intent
   Visible search bar in hero band + overlay for results.
   ============================================================ */
console.log('[search.js] loaded');

(function () {
  let overlay, input, results, micBtn, clearBtn, closeBtn;
  let recognition = null;
  let isListening = false;
  let debounceTimer = null;

  /* ---------- Build the overlay once ---------- */
  function buildOverlay() {
    overlay = document.createElement('div');
    overlay.className = 'search-overlay';
    overlay.id = 'searchOverlay';
    overlay.innerHTML = `
      <div class="search-panel" role="dialog" aria-modal="true" aria-labelledby="searchLabel">
        <div class="search-bar">
          <svg class="search-bar__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input id="searchInput" type="search" placeholder="Search anything on BLTF..." aria-label="Search anything on BLTF" autocomplete="off" />
          <button type="button" class="search-bar__mic" id="searchMic" aria-label="Voice search" hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <rect x="9" y="3" width="6" height="12" rx="3"/>
              <path d="M5 11a7 7 0 0 0 14 0"/>
              <line x1="12" y1="18" x2="12" y2="22"/>
            </svg>
          </button>
          <button type="button" class="search-bar__clear" id="searchClear" aria-label="Clear search" hidden>×</button>
          <button type="button" class="search-bar__close" id="searchClose" aria-label="Close search">Esc</button>
        </div>
        <div class="search-results" id="searchResults" role="listbox"></div>
        <div class="search-hint">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>Enter</kbd> open</span>
          <span><kbd>Esc</kbd> close</span>
          <span id="searchAiBadge" class="search-hint__ai" hidden>AI-enhanced</span>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    input = document.getElementById('searchInput');
    results = document.getElementById('searchResults');
    micBtn = document.getElementById('searchMic');
    clearBtn = document.getElementById('searchClear');
    closeBtn = document.getElementById('searchClose');

    input.addEventListener('input', onInput);
    input.addEventListener('keydown', onKeyDown);
    clearBtn.addEventListener('click', clearSearch);
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', globalHotkeys);

    setupVoice();
  }

  function open(prefill = '') {
    overlay.classList.add('open');
    if (prefill) { input.value = prefill; onInput(); }
    setTimeout(() => input.focus(), 40);
    document.body.style.overflow = 'hidden';
  }
  function close() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    stopVoice();
  }

  function globalHotkeys(e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      overlay.classList.contains('open') ? close() : open();
      return;
    }
    if (e.key === '/' && !overlay.classList.contains('open')) {
      const t = document.activeElement;
      const tag = t?.tagName?.toLowerCase();
      if (tag !== 'input' && tag !== 'textarea' && tag !== 'select') {
        e.preventDefault();
        open();
      }
    }
    if (e.key === 'Escape' && overlay.classList.contains('open')) close();
  }

  function onInput() {
    const q = input.value.trim();
    clearBtn.hidden = q.length === 0;
    clearTimeout(debounceTimer);
    if (!q) { results.innerHTML = ''; return; }
    debounceTimer = setTimeout(() => runSearch(q), 200);
  }

  async function runSearch(q) {
    results.innerHTML = '<div class="search-loading">Searching…</div>';

    let localResults = [];
    try {
      const r = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=10`).then(r => r.json());
      localResults = r.results || [];
    } catch {}

    let aiIntent = null;
    try {
      const r = await fetch('/api/ai/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q })
      }).then(r => r.json());
      if (r.ai && r.route) aiIntent = r;
    } catch {}

    renderResults(localResults, aiIntent, q);
  }

  function renderResults(items, aiIntent, query) {
    const html = [];
    if (aiIntent) {
      document.getElementById('searchAiBadge').hidden = false;
      html.push(`
        <a class="search-result search-result--intent" href="${aiIntent.route}" data-result>
          <div class="search-result__icon">→</div>
          <div class="search-result__body">
            <div class="search-result__title">${escapeHtml(aiIntent.title || 'Go to page')}</div>
            <div class="search-result__summary">${escapeHtml(aiIntent.intent || '')}</div>
          </div>
          <div class="search-result__category">Suggested</div>
        </a>
      `);
    } else {
      document.getElementById('searchAiBadge').hidden = true;
    }

    if (!items.length && !aiIntent) {
      results.innerHTML = `
        <div class="search-empty">
          <p>No results for "<strong>${escapeHtml(query)}</strong>".</p>
          <p class="search-empty__hint">Try "volunteer", "donate", "Easter Drive" or "contact".</p>
        </div>`;
      return;
    }

    items.forEach(item => {
      html.push(`
        <a class="search-result" href="${item.url}" data-result>
          <div class="search-result__body">
            <div class="search-result__title">${escapeHtml(item.title)}</div>
            <div class="search-result__summary">${escapeHtml(item.summary || '')}</div>
          </div>
          <div class="search-result__category">${escapeHtml(item.category || item.type)}</div>
        </a>
      `);
    });

    results.innerHTML = html.join('');
    const first = results.querySelector('[data-result]');
    if (first) first.focus?.();
  }

  function clearSearch() {
    input.value = '';
    results.innerHTML = '';
    clearBtn.hidden = true;
    input.focus();
  }

  function onKeyDown(e) {
    const all = [...results.querySelectorAll('[data-result]')];
    const current = document.activeElement;
    const idx = all.indexOf(current);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      (all[idx + 1] || all[0]).focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      (all[idx - 1] || all[all.length - 1]).focus();
    }
  }

  function setupVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { micBtn.hidden = true; return; }
    recognition = new SR();
    recognition.lang = 'en-ZA';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isListening = true;
      micBtn.classList.add('listening');
      micBtn.setAttribute('aria-label', 'Stop listening');
    };
    recognition.onresult = (e) => {
      const transcript = [...e.results].map(r => r[0].transcript).join('');
      input.value = transcript;
      clearBtn.hidden = false;
      if (e.results[e.results.length - 1].isFinal) {
        runSearch(transcript.trim());
      }
    };
    recognition.onerror = (e) => {
      isListening = false;
      micBtn.classList.remove('listening');
      if (e.error === 'not-allowed') showVoiceToast('Microphone permission denied.');
    };
    recognition.onend = () => {
      isListening = false;
      micBtn.classList.remove('listening');
      micBtn.setAttribute('aria-label', 'Voice search');
    };
    micBtn.hidden = false;
    micBtn.addEventListener('click', toggleVoice);
  }

  function toggleVoice() {
    if (!recognition) return;
    if (isListening) { recognition.stop(); return; }
    try { recognition.start(); } catch {}
  }
  function stopVoice() { if (recognition && isListening) recognition.stop(); }

  function showVoiceToast(msg) {
    const t = document.createElement('div');
    t.className = 'search-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  /* ---------- Hero search band ---------- */
  function insertHeroSearchBar() {
    if (document.querySelector('.hero-search-band')) return;

    const band = document.createElement('section');
    band.className = 'hero-search-band';
    band.innerHTML = `
      <div class="container">
        <div class="hero-search-band__inner">
          <h2 class="hero-search-band__title">
            Looking for <em>something?</em>
          </h2>
          <button type="button" class="hero-search-bar" aria-label="Open search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="11" cy="11" r="7"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <span class="hero-search-bar__placeholder">Search anything on BLTF — projects, events, volunteering, donations...</span>
            <span class="hero-search-bar__hint">Click to search</span>
          </button>
        </div>
      </div>
    `;
    band.querySelector('.hero-search-bar').addEventListener('click', () => open());

    const headerMount = document.getElementById('header-mount');
    if (headerMount && headerMount.parentNode) {
      headerMount.parentNode.insertBefore(band, headerMount.nextSibling);
    } else {
      document.body.insertBefore(band, document.body.firstChild);
    }
  }

  window.bltSearch = { open, close };

  document.addEventListener('DOMContentLoaded', () => {
    buildOverlay();
    insertHeroSearchBar();
  });

  (function retryInsert() {
    let attempts = 0;
    const i = setInterval(() => {
      if (document.getElementById('header-mount') && !document.querySelector('.hero-search-band')) {
        insertHeroSearchBar();
        clearInterval(i);
      }
      if (++attempts >= 20) clearInterval(i);
    }, 150);
  })();
})();