const modules = [
  './server/middleware/errorHandler',
  './server/middleware/auth',
  './server/middleware/upload',
  './server/routes/auth.routes',
  './server/routes/team.routes',
  './server/routes/events.routes',
  './server/routes/donations.routes',
  './server/routes/testimonials.routes',
  './server/routes/gallery.routes',
  './server/routes/volunteers.routes',
  './server/routes/certificates.routes',
  './server/routes/contact.routes'
];

for (const m of modules) {
  try {
    const mod = require('../' + m.replace('./', ''));
    const type = typeof mod;
    const isFn = type === 'function';
    console.log(`${isFn ? '✓' : '✗'} ${m} → ${type}${isFn ? '' : '  ' + JSON.stringify(Object.keys(mod))}`);
  } catch (e) {
    console.log(`✗ ${m} → ERROR: ${e.message}`);
  }
}