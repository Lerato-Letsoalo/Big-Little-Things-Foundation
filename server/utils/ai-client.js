/* ============================================================
   AI CLIENT — Groq (free tier, no credit card)
   Uses Llama 3.3 70B on Groq hardware.
   Falls back gracefully when GROQ_API_KEY is missing.
   ============================================================ */
const Groq = require('groq-sdk');

const API_KEY = process.env.GROQ_API_KEY || '';
const MODEL_NAME = 'openai/gpt-oss-120b';
const MAX_REQUESTS_PER_MINUTE = 20;

let client = null;

if (API_KEY) {
  try {
    client = new Groq({ apiKey: API_KEY });
    console.log('[ai] Groq client initialised (model:', MODEL_NAME + ')');
  } catch (err) {
    console.warn('[ai] Failed to init Groq:', err.message);
  }
} else {
  console.warn('[ai] GROQ_API_KEY not set — AI features will use keyword fallback only');
}

const requestTimestamps = [];
function rateLimitOk() {
  const now = Date.now();
  const oneMinuteAgo = now - 60_000;
  while (requestTimestamps.length && requestTimestamps[0] < oneMinuteAgo) {
    requestTimestamps.shift();
  }
  if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) return false;
  requestTimestamps.push(now);
  return true;
}

function isAvailable() {
  return client !== null;
}

async function ask(prompt, opts = {}) {
  if (!client) return null;
  if (!rateLimitOk()) {
    console.warn('[ai] rate limit reached — falling back');
    return null;
  }

  try {
    const response = await client.chat.completions.create({
      model: MODEL_NAME,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: opts.maxTokens || 400,
      response_format: opts.json ? { type: 'json_object' } : undefined
    });
    const text = response.choices?.[0]?.message?.content;
    return text ? text.trim() : null;
  } catch (err) {
    console.warn('[ai] Groq error name:', err.name);
    console.warn('[ai] Groq error message:', err.message);
    if (err.status) console.warn('[ai] Groq status:', err.status);
    return null;
  }
}

module.exports = { ask, isAvailable };