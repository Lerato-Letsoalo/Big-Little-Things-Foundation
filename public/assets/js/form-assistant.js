/* ============================================================
   FORM ASSISTANT — field help, AI chat, in-field voice input
   ============================================================ */
console.log('[form-assistant.js] loaded');

(function () {
  let GUIDE = {};

  /* ---------- Load field guide ---------- */
  async function loadGuide() {
    try {
      GUIDE = await fetch('/assets/data/field-guide.json').then(r => r.json());
    } catch {
      GUIDE = {};
    }
  }

  /* ---------- Detect current form ---------- */
  function detectFormName() {
    const path = window.location.pathname;
    if (path.includes('register')) return 'register';
    if (path.includes('contact')) return 'contact';
    if (path.includes('donate')) return 'donate';
    if (path.includes('volunteer')) return 'register';
    return null;
  }

  /* ---------- Attach help icons + assistant button + in-field mic ---------- */
  function attachHelp() {
    const formName = detectFormName();
    if (!formName || !GUIDE[formName]) return;

    /* 1. Help icons on each field */
    Object.entries(GUIDE[formName]).forEach(([fieldName, info]) => {
      const el = document.querySelector(`#${fieldName}`) || document.querySelector(`[name="${fieldName}"]`);
      if (!el || el.dataset.helpAttached) return;
      el.dataset.helpAttached = '1';

      const label = el.closest('.form-group')?.querySelector('label');
      if (!label) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'field-help';
      btn.setAttribute('aria-label', `Help for ${fieldName}`);
      btn.setAttribute('title', `Help with ${fieldName}`);
      btn.textContent = 'i';
      btn.addEventListener('click', e => {
        e.preventDefault();
        showFieldModal(formName, fieldName, info);
      });
      label.appendChild(btn);
    });

    /* 2. Attach mic to long-text fields (textarea or message-type input) */
    attachMicToLongFields();

    /* 3. Add "Ask about this form" button under the form */
    const form = document.querySelector('form');
    if (form && !form.querySelector('.form-assistant-btn')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'form-assistant-btn';
      btn.textContent = 'Ask about this form';
      btn.addEventListener('click', e => {
        e.preventDefault();
        openAssistant(formName);
      });
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.parentNode.insertBefore(btn, submitBtn.nextSibling);
      else form.appendChild(btn);
    }
  }

  /* ---------- Attach mic to any textarea + inputs named message/notes/etc ---------- */
  function attachMicToLongFields() {
    const longFieldNames = ['message', 'notes', 'description', 'skills', 'about_me', 'about', 'subject'];
    const candidates = document.querySelectorAll(
      'form textarea, form input[name="message"], form input[name="notes"], form input[name="description"], form input[name="skills"], form input[name="about_me"], form input[name="about"]'
    );

    candidates.forEach(field => {
      if (field.dataset.micAttached) return;
      if (field.closest('.dashboard-main')) return;
      // Skip short fields that happen to match by name
      if (field.tagName === 'INPUT' && !longFieldNames.includes(field.name)) return;

      field.dataset.micAttached = '1';
      const wrapper = field.parentElement;
      if (!wrapper) return;
      wrapper.classList.add('has-mic');

      const mic = document.createElement('button');
      mic.type = 'button';
      mic.className = 'field-mic';
      mic.setAttribute('aria-label', 'Dictate into this field');
      mic.setAttribute('title', 'Dictate into this field');
      mic.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <rect x="9" y="3" width="6" height="12" rx="3"/>
          <path d="M5 11a7 7 0 0 0 14 0"/>
          <line x1="12" y1="18" x2="12" y2="22"/>
        </svg>
      `;
      wrapper.appendChild(mic);

      setupFieldMic(mic, field);
    });
  }

  /* ---------- Per-field dictation ---------- */
  function setupFieldMic(btn, field) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      btn.style.display = 'none';
      return;
    }

    const rec = new SR();
    rec.lang = 'en-ZA';
    rec.interimResults = true;
    rec.continuous = false;
    let isListening = false;
    let baseValue = '';

    rec.onstart = () => {
      isListening = true;
      baseValue = field.value;
      btn.classList.add('listening');
      btn.setAttribute('aria-label', 'Stop dictation');
    };
    rec.onresult = (e) => {
      let interim = '';
      let final = '';
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      const spacer = baseValue && !baseValue.endsWith(' ') ? ' ' : '';
      field.value = baseValue + spacer + final + interim;
      field.dispatchEvent(new Event('input', { bubbles: true }));
    };
    rec.onerror = (e) => {
      isListening = false;
      btn.classList.remove('listening');
      btn.setAttribute('aria-label', 'Dictate into this field');
      if (e.error === 'not-allowed') {
        alert('Microphone permission is required to use voice input.');
      }
    };
    rec.onend = () => {
      isListening = false;
      btn.classList.remove('listening');
      btn.setAttribute('aria-label', 'Dictate into this field');
    };

    btn.addEventListener('click', e => {
      e.preventDefault();
      if (isListening) rec.stop();
      else { try { rec.start(); } catch {} }
    });
  }

  /* ---------- Field help modal (centered, no overlap) ---------- */
  function showFieldModal(formName, fieldName, info) {
    const existing = document.querySelector('.field-modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'field-modal-overlay open';
    overlay.innerHTML = `
      <div class="field-modal" role="dialog" aria-labelledby="fieldModalTitle">
        <div class="field-modal__label">Field help</div>
        <h2 class="field-modal__title" id="fieldModalTitle">${escapeHtml(fieldName)}</h2>
        <p class="field-modal__description">${escapeHtml(info.description || '')}</p>
        <dl class="field-modal__meta">
          <dt>Required</dt>
          <dd>${info.required ? 'Yes — you must fill this in' : 'No — optional'}</dd>
          ${info.purpose ? `<dt>Why we ask</dt><dd>${escapeHtml(info.purpose)}</dd>` : ''}
          ${info.example ? `<dt>Example</dt><dd>${escapeHtml(info.example)}</dd>` : ''}
        </dl>
        <div class="field-modal__actions">
          <button type="button" class="btn btn-outline" data-close>Got it</button>
          <button type="button" class="btn btn-primary" data-ai>Ask a question</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('[data-close]').onclick = close;
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });

    overlay.querySelector('[data-ai]').onclick = () => {
      close();
      openAssistant(formName, `Tell me more about the "${fieldName}" field — specifically, what's the correct format and are there any rules I should know?`);
    };
  }

  /* ---------- Form validation ---------- */
  function clearErrors(form) {
    form.querySelectorAll('.field-error').forEach(e => e.remove());
    form.querySelectorAll('.has-error').forEach(e => e.classList.remove('has-error'));
  }

  function setError(field, message) {
    field.classList.add('has-error');
    const group = field.closest('.form-group') || field.parentElement;
    let err = group.querySelector('.field-error');
    if (!err) {
      err = document.createElement('div');
      err.className = 'field-error';
      group.appendChild(err);
    }
    err.textContent = message;
  }

  function validateForm(form) {
    clearErrors(form);
    let firstInvalid = null;
    form.querySelectorAll('input, select, textarea').forEach(field => {
      if (field.type === 'hidden' || field.disabled) return;
      const value = (field.value || '').trim();
      if (field.required && !value) {
        setError(field, 'This field is required.');
        firstInvalid ||= field; return;
      }
      if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        setError(field, 'Please enter a valid email address.');
        firstInvalid ||= field;
      }
      if (field.type === 'tel' && value && !/^[0-9\s+\-()]{7,20}$/.test(value)) {
        setError(field, 'Please enter a valid phone number.');
        firstInvalid ||= field;
      }
      if (field.type === 'password' && value && field.minLength && value.length < field.minLength) {
        setError(field, `Password must be at least ${field.minLength} characters.`);
        firstInvalid ||= field;
      }
    });
    return firstInvalid;
  }

  function attachValidation() {
    document.querySelectorAll('form').forEach(form => {
      if (form.closest('.dashboard-main')) return;
      form.addEventListener('submit', e => {
        const invalid = validateForm(form);
        if (invalid) {
          e.preventDefault();
          e.stopImmediatePropagation();
          invalid.focus();
        }
      }, true);
    });
  }

  /* ============================================================
     AI CHAT PANEL
     ============================================================ */
  function openAssistant(formName, initialQuestion = '') {
    const existing = document.querySelector('.form-assistant-panel');
    if (existing) existing.remove();

    const panel = document.createElement('div');
    panel.className = 'form-assistant-panel';
    panel.innerHTML = `
      <div class="form-assistant-panel__header">
        <div>
          <strong>Ask about this form</strong>
          <small>Powered by Gemini — answers use your field guide and live inputs</small>
        </div>
        <button type="button" class="form-assistant-panel__close" aria-label="Close">×</button>
      </div>
      <div class="form-assistant-panel__thread" id="assistantThread"></div>
      <div class="form-assistant-panel__presets">
        <button type="button" data-q="What information do I need to provide?">What info do I need?</button>
        <button type="button" data-q="Why can't I submit this form?">Why won't it submit?</button>
        <button type="button" data-q="Have I missed anything?">Anything missing?</button>
      </div>
      <div class="form-assistant-panel__input-row">
        <input type="text" class="form-assistant-panel__input" placeholder="Ask anything about this form…" aria-label="Your question" />
        <button type="button" class="form-assistant-panel__send" aria-label="Send">→</button>
      </div>
    `;
    document.body.appendChild(panel);

    const thread = panel.querySelector('#assistantThread');
    const input = panel.querySelector('.form-assistant-panel__input');
    const send = panel.querySelector('.form-assistant-panel__send');

    function appendMsg(text, who) {
      const el = document.createElement('div');
      el.className = `form-assistant-msg form-assistant-msg--${who}`;
      el.textContent = text;
      thread.appendChild(el);
      thread.scrollTop = thread.scrollHeight;
      return el;
    }

    function appendTyping() {
      const el = document.createElement('div');
      el.className = 'form-assistant-msg form-assistant-msg--typing';
      el.textContent = 'Thinking';
      thread.appendChild(el);
      thread.scrollTop = thread.scrollHeight;
      return el;
    }

    appendMsg("Hi — ask me anything about this form. I'll use the field guide and your current inputs to give you a real answer.", 'bot');

    /* Collect context on each ask */
    function buildContext() {
      const fields = GUIDE[formName] || {};
      const form = document.querySelector('form');
      const liveValues = {};
      if (form) {
        form.querySelectorAll('input, select, textarea').forEach(f => {
          if (f.type === 'hidden' || f.type === 'password' || f.disabled) return;
          const key = f.id || f.name;
          if (key) liveValues[key] = (f.value || '').trim() || '(empty)';
        });
      }

      const fieldContext = Object.entries(fields).map(([name, info]) =>
        `- ${name}: ${info.description} ${info.purpose || ''} ${info.required ? '(required)' : '(optional)'} Example: ${info.example || 'n/a'}`
      ).join('\n');

      const valueContext = Object.entries(liveValues)
        .map(([k, v]) => `- ${k} = "${v}"`)
        .join('\n');

      return { fieldContext, valueContext, fields, form };
    }

    async function askAI(question) {
      appendMsg(question, 'user');
      const typing = appendTyping();
      send.disabled = true;

      const { fieldContext, valueContext, fields, form } = buildContext();

      try {
        const res = await fetch('/api/ai/form-ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formName,
            question,
            fieldContext,
            valueContext
          })
        }).then(r => r.json());

        typing.remove();

        if (res.success && res.answer) {
          appendMsg(res.answer, 'bot');
        } else {
          /* AI unavailable — tell the user honestly, fall back to local */
          const fallback = localAnswer(question, fields, form);
          appendMsg(fallback + "\n\n(AI is currently unavailable — this is a basic answer.)", 'bot');
        }
      } catch (err) {
        typing.remove();
        const fallback = localAnswer(question, fields, form);
        appendMsg(fallback + "\n\n(Could not reach the AI service.)", 'bot');
      } finally {
        send.disabled = false;
        input.focus();
      }
    }

    /* Local deterministic fallback only used when AI fails */
    function localAnswer(q, fields, form) {
      const lower = q.toLowerCase();
      const required = Object.entries(fields).filter(([, f]) => f.required);
      const optional = Object.entries(fields).filter(([, f]) => !f.required);

      if (lower.includes('what info') || lower.includes('which info') || lower.includes('what do i need')) {
        return `Required: ${required.map(([n]) => n).join(', ') || 'none'}. Optional: ${optional.map(([n]) => n).join(', ') || 'none'}.`;
      }
      if (lower.includes("why can't i submit") || lower.includes("won't submit") || lower.includes('cannot submit')) {
        if (!form) return 'No form found.';
        const problems = [];
        form.querySelectorAll('input, select, textarea').forEach(f => {
          if (f.type === 'hidden' || f.disabled) return;
          const v = (f.value || '').trim();
          if (f.required && !v) problems.push(`"${f.id || f.name}" is empty`);
          else if (f.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) problems.push(`"${f.id || f.name}" is not a valid email`);
        });
        return problems.length ? `Blocked by:\n• ${problems.join('\n• ')}` : 'No validation errors found. Try submitting again.';
      }
      if (lower.includes('missed') || lower.includes('missing')) {
        if (!form) return 'No form found.';
        const missing = [];
        form.querySelectorAll('input, select, textarea').forEach(f => {
          if (f.type === 'hidden' || f.disabled) return;
          if (f.required && !(f.value || '').trim()) missing.push(f.id || f.name);
        });
        return missing.length ? `Still empty: ${missing.join(', ')}` : 'All required fields are filled in.';
      }
      const match = Object.keys(fields).find(n => lower.includes(n.toLowerCase()));
      if (match) return `${match}: ${fields[match].description} ${fields[match].purpose || ''}`;
      return 'Please rephrase — I can help with any field on this form.';
    }

    panel.querySelector('.form-assistant-panel__close').onclick = () => panel.remove();
    panel.querySelectorAll('[data-q]').forEach(b => {
      b.addEventListener('click', () => askAI(b.dataset.q));
    });
    send.onclick = () => {
      const q = input.value.trim();
      if (!q) return;
      input.value = '';
      askAI(q);
    };
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); send.click(); }
    });
    input.focus();

    if (initialQuestion) setTimeout(() => askAI(initialQuestion), 300);
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await loadGuide();
    attachHelp();
    attachValidation();
  });
})();