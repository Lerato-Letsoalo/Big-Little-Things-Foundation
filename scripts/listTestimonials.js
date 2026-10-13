require('dotenv').config();
const pool = require('../server/config/db');

(async () => {
  try {
    const [rows] = await pool.query(
      'SELECT id, author_name, event_label, status FROM testimonials ORDER BY display_order, id'
    );
    console.log('Testimonials:');
    rows.forEach(t => console.log(` - ${t.id} | ${t.author_name} | ${t.event_label || '(no event)'} | ${t.status}`));
    process.exit(0);
  } catch (err) {
    console.error('✗', err.message);
    process.exit(1);
  }
})();