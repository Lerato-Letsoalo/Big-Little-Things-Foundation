/* ============================================================
   AI ROUTES — intent, ask, form-help, form-ask, parse-voice
   All AI calls happen on the backend via Gemini.
   The backend validates every AI-suggested route.
   ============================================================ */
const router = require('express').Router();
const pool = require('../config/db');
const rateLimit = require('express-rate-limit');
const ai = require('../utils/ai-client');
const fs = require('fs');
const path = require('path');

const aiLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  message: { success: false, message: 'Too many AI requests. Please slow down.' }
});

/* ---------- Public route whitelist ---------- */
const PUBLIC_ROUTES = {
  '/index.html': 'Homepage',
  '/about.html': 'About Us',
  '/projects.html': 'Projects & Drives',
  '/volunteer.html': 'Volunteer Information',
  '/register.html': 'Volunteer Registration',
  '/gallery.html': 'Gallery',
  '/contact.html': 'Contact',
  '/donate.html': 'Donate',
  '/login.html': 'Login'
};

/* ============================================================
   POST /api/ai/intent
   ============================================================ */
router.post('/intent', aiLimiter, async (req, res, next) => {
  try {
    const query = (req.body.query || '').toString().trim().slice(0, 200);
    if (!query) return res.status(400).json({ success: false, message: 'Query is required.' });

    const routeList = Object.entries(PUBLIC_ROUTES)
      .map(([path, title]) => `- "${title}" → ${path}`)
      .join('\n');

    const prompt = `You are helping a visitor navigate the Big Little Things Foundation website.

The ONLY valid destinations are:
${routeList}

Visitor query: "${query}"

Reply with valid JSON only, no markdown, no extra text. Format:
{
  "intent": "short description of what the visitor wants",
  "route": "/exact/path.html or null if no confident match",
  "title": "Human-readable page title or null",
  "confidence": 0.0 to 1.0,
  "alternatives": [{"route": "/path.html", "title": "Title"}]
}

Rules:
- If the visitor wants to volunteer or register, prefer /register.html.
- If they ask about donation, banking details or giving, use /donate.html.
- If they ask about events or drives, use /projects.html.
- If unsure, set route to null and provide alternatives.
- Never invent a route that is not in the list above.`;

    const raw = await ai.ask(prompt, { json: true, maxTokens: 300 });
    if (!raw) return res.json({ success: true, ai: false, query });

    let parsed;
    try { parsed = JSON.parse(raw.replace(/```json|```/g, '').trim()); }
    catch { return res.json({ success: true, ai: false, query }); }

    const routeOk = parsed.route && PUBLIC_ROUTES[parsed.route];
    const alternatives = Array.isArray(parsed.alternatives)
      ? parsed.alternatives.filter(a => a && PUBLIC_ROUTES[a.route])
      : [];

    res.json({
      success: true,
      ai: true,
      query,
      intent: parsed.intent || null,
      route: routeOk ? parsed.route : null,
      title: routeOk ? PUBLIC_ROUTES[parsed.route] : null,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
      alternatives
    });
  } catch (err) { next(err); }
});

/* ============================================================
   POST /api/ai/ask
   ============================================================ */
router.post('/ask', aiLimiter, async (req, res, next) => {
  try {
    const query = (req.body.query || '').toString().trim().slice(0, 300);
    if (!query) return res.status(400).json({ success: false, message: 'Query is required.' });

    const indexPath = path.join(__dirname, '..', '..', 'public', 'assets', 'data', 'search-index.json');
    let pages = [];
    try { pages = JSON.parse(fs.readFileSync(indexPath, 'utf8')); }
    catch { return res.json({ success: true, ai: false, query }); }

    let events = [];
    try {
      const [rows] = await pool.query(
        "SELECT title, description, status, event_date, category FROM events WHERE published = 1 LIMIT 20"
      );
      events = rows;
    } catch {}

    const contextParts = [
      'PAGES:',
      ...pages.map(p => `- ${p.title}: ${p.summary} (${p.url})`),
      '',
      'CURRENT EVENTS/DRIVES:',
      ...events.map(e => `- ${e.title} [${e.status}] ${e.event_date || 'date TBC'}: ${e.description || ''}`)
    ].join('\n');

    const prompt = `You are a helpful assistant for the Big Little Things Foundation (BLTF), a South African nonprofit.

Use ONLY the following verified information to answer. If the answer isn't in this content, say "I don't have that information — please use the search or contact page."

${contextParts}

Visitor question: "${query}"

Answer in 2–4 sentences. Be specific, warm and honest. Never invent dates, events, banking details or people.`;

    const answer = await ai.ask(prompt, { maxTokens: 400 });
    if (!answer) return res.json({ success: true, ai: false, query });

    res.json({ success: true, ai: true, query, answer });
  } catch (err) { next(err); }
});

/* ============================================================
   POST /api/ai/form-help
   Single-field help
   ============================================================ */
router.post('/form-help', aiLimiter, async (req, res, next) => {
  try {
    const form = (req.body.form || '').toString().slice(0, 50);
    const field = (req.body.field || '').toString().slice(0, 50);
    const question = (req.body.question || '').toString().trim().slice(0, 200) || 'What does this field mean?';

    const guidePath = path.join(__dirname, '..', '..', 'public', 'assets', 'data', 'field-guide.json');
    let guide = {};
    try { guide = JSON.parse(fs.readFileSync(guidePath, 'utf8')); }
    catch { return res.json({ success: true, ai: false }); }

    const fieldInfo = guide[form]?.[field];
    if (!fieldInfo) {
      return res.json({ success: true, ai: false, message: 'No guidance available for this field.' });
    }

    const prompt = `You are helping a visitor complete a form on the Big Little Things Foundation website.

Form: ${form}
Field: ${field}
What this field means: ${fieldInfo.description}
Why we ask: ${fieldInfo.purpose || 'To help us respond accurately.'}
Whether required: ${fieldInfo.required ? 'Yes, required' : 'Optional'}
Valid format: ${fieldInfo.example || 'N/A'}

Visitor asks: "${question}"

Reply in 1–3 warm, clear sentences. If the question is unrelated to this field, gently guide them back. Do not invent requirements.`;

    const answer = await ai.ask(prompt, { maxTokens: 250 });
    if (!answer) {
      return res.json({
        success: true,
        ai: false,
        answer: `${fieldInfo.description} ${fieldInfo.purpose || ''}`.trim()
      });
    }

    res.json({ success: true, ai: true, answer });
  } catch (err) { next(err); }
});

/* ============================================================
   POST /api/ai/form-ask
   Free-text questions about the whole form
   ============================================================ */
router.post('/form-ask', aiLimiter, async (req, res, next) => {
  try {
    const { formName, question, fieldContext, valueContext } = req.body;
    if (!question) return res.status(400).json({ success: false, message: 'Question required.' });

    const prompt = `You are an assistant helping a visitor complete the "${formName}" form on the Big Little Things Foundation website.

The form is a South African nonprofit volunteer / contact form.

FIELD GUIDE (what each field is for):
${fieldContext || '(none)'}

CURRENT VALUES THE VISITOR HAS TYPED:
${valueContext || '(none)'}

Visitor's question: "${question}"

Instructions:
- Answer directly in 1-4 short, warm sentences.
- Use the field guide and the current values above as your source of truth.
- For validation questions ("Why can't I submit?"), inspect the current values against required fields and email/phone formats, and list the specific problems.
- For format questions ("Does my name need to be in capitals?"), give a clear yes/no and the recommended format. If unsure, give sensible guidance based on the example value in the guide.
- Do not invent requirements, dates, policies or personal data.
- If the question is unrelated to this form, politely steer the user back.

Reply now with the answer only, no preamble.`;

    const answer = await ai.ask(prompt, { maxTokens: 300 });
    if (!answer) return res.json({ success: false, message: 'AI unavailable.' });

    res.json({ success: true, answer });
  } catch (err) { next(err); }
});

/* ============================================================
   POST /api/ai/parse-voice
   ============================================================ */
router.post('/parse-voice', aiLimiter, async (req, res, next) => {
  try {
    const { formName, transcript, fieldList } = req.body;
    if (!transcript || !fieldList) return res.status(400).json({ success: false });

    const prompt = `You are extracting form field values from a spoken transcript.

Form: ${formName}
Available fields:
${fieldList}

Transcript: "${transcript}"

Return ONLY valid JSON mapping field names to the values the speaker provided. Format:
{ "name": "Lerato Dlamini", "email": "lerato@example.com" }

Rules:
- Only include fields that were clearly stated.
- Never invent values that weren't spoken.
- Return {} if nothing is extractable.`;

    const raw = await ai.ask(prompt, { json: true, maxTokens: 200 });
    if (!raw) return res.json({ success: false });

    let parsed;
    try { parsed = JSON.parse(raw.replace(/```json|```/g, '').trim()); }
    catch { return res.json({ success: false }); }

    res.json({ success: true, values: parsed });
  } catch (err) { next(err); }
});

module.exports = router;