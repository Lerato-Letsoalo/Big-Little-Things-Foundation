/* ============================================================
   SEARCH ROUTES — fuzzy keyword search across public content
   No AI required. Fast, deterministic, safe.
   ============================================================ */
const router = require('express').Router();
const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

/* ---------- Synonym expansion ---------- */
const SYNONYMS = {
  volunteer: ['volunteering', 'join', 'participate', 'help', 'helped', 'helping'],
  volunteering: ['volunteer', 'join', 'participate', 'help'],
  donate: ['donation', 'donations', 'contribute', 'contribution', 'support', 'give', 'giving', 'banking', 'money'],
  donation: ['donate', 'donations', 'give', 'giving', 'support', 'banking'],
  drive: ['event', 'events', 'campaign', 'initiative'],
  event: ['drives', 'drive', 'campaign'],
  contact: ['email', 'phone', 'reach', 'touch', 'message', 'enquiry'],
  certificate: ['award', 'proof', 'participation', 'cert'],
  gallery: ['photos', 'pictures', 'images', 'photographs'],
  easter: ['easter'],
  stationery: ['school', 'supplies', 'materials', 'learners'],
  team: ['founders', 'people', 'who', 'directors'],
  about: ['information', 'story', 'mission', 'vision', 'values'],
  projects: ['work', 'initiatives', 'drives', 'campaigns']
};

function expandTokens(tokens) {
  const set = new Set(tokens);
  tokens.forEach(t => {
    if (SYNONYMS[t]) SYNONYMS[t].forEach(s => set.add(s));
  });
  return [...set];
}

/* ---------- Levenshtein for fuzzy matching ---------- */
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/* ---------- Score one item against a token set ---------- */
function scoreItem(item, tokens, expanded) {
  const haystack = `${item.title} ${item.summary || ''} ${(item.keywords || []).join(' ')}`.toLowerCase();
  let score = 0;

  expanded.forEach(tok => {
    if (!tok || tok.length < 2) return;
    if (haystack.includes(tok)) score += 10;
    const words = haystack.split(/\s+/);
    words.forEach(w => {
      if (Math.abs(w.length - tok.length) > 2) return;
      const d = levenshtein(w, tok);
      if (d === 1 && tok.length >= 4) score += 4;
      else if (d === 2 && tok.length >= 6) score += 2;
    });
  });

  return score;
}

/* ============================================================
   GET /api/search?q=...&limit=12
   ============================================================ */
router.get('/', async (req, res, next) => {
  try {
    const q = (req.query.q || '').toString().trim().slice(0, 200);
    const limit = Math.min(parseInt(req.query.limit, 10) || 12, 25);

    if (!q) {
      return res.json({ success: true, query: '', results: [] });
    }

    const tokens = q.toLowerCase().split(/\s+/).filter(t => t.length >= 2);
    const expanded = expandTokens(tokens);

    /* Load static page index */
    const indexPath = path.join(__dirname, '..', '..', 'public', 'assets', 'data', 'search-index.json');
    let pages = [];
    try { pages = JSON.parse(fs.readFileSync(indexPath, 'utf8')); } catch (err) {
      console.warn('[search] index not found:', err.message);
    }

    /* Load current events from DB */
    let events = [];
    try {
      const [rows] = await pool.query(
        `SELECT id, title, description AS summary, status, event_date, category
         FROM events
         WHERE published = 1`
      );
      events = rows.map(e => ({
        type: 'event',
        title: e.title,
        summary: e.summary || '',
        url: '/projects.html',
        category: e.category || e.status,
        date: e.event_date,
        keywords: [e.title, e.status, e.category || ''].filter(Boolean)
      }));
    } catch (err) {
      console.warn('[search] events query failed:', err.message);
    }

    /* Score & combine */
    const items = [...pages, ...events];
    const scored = items
      .map(item => ({ item, score: scoreItem(item, tokens, expanded) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ item, score }) => ({ ...item, score }));

    res.json({ success: true, query: q, results: scored });
  } catch (err) {
    next(err);
  }
});

module.exports = router;