require('dotenv').config();
const pool = require('../server/config/db');

(async () => {
  const [rows] = await pool.query(
    "SELECT id, title, status, event_date FROM events WHERE status = 'upcoming' ORDER BY id"
  );
  console.log('Upcoming drives:');
  rows.forEach(e => console.log(` - [${e.id}] ${e.title} | ${e.status} | ${e.event_date || 'TBC'}`));
  process.exit(0);
})();