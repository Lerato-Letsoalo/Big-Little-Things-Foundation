/* ============================================================
   API — Browser-side HTTP client
   No require, no imports — pure fetch
   ============================================================ */

async function apiFetch(url, options = {}) {
  const opts = { credentials: 'include', ...options };

  if (opts.body && !(opts.body instanceof FormData)) {
    opts.headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    opts.body = JSON.stringify(opts.body);
  }

  const res = await fetch(url, opts);
  let data = {};
  try { data = await res.json(); } catch { /* some responses have no body */ }

  if (!res.ok) {
    const message = data.message || `Request failed (HTTP ${res.status}).`;
    const err = new Error(message);
    err.status = res.status;
    err.body = data;
    console.error('[api]', (options.method || 'GET'), url, '→', res.status, data);
    throw err;
  }
  return data;
}

window.api = {
  get: (url) => apiFetch(url),
  post: (url, body) => apiFetch(url, { method: 'POST', body }),
  postForm: (url, formData) => apiFetch(url, { method: 'POST', body: formData }),
  put: (url, body) => apiFetch(url, { method: 'PUT', body }),
  putForm: (url, formData) => apiFetch(url, { method: 'PUT', body: formData }),
  del: (url) => apiFetch(url, { method: 'DELETE' })
};