require('dotenv').config();
const pool = require('../server/config/db');

(async () => {
  const [cols] = await pool.query('SHOW COLUMNS FROM users');
  console.log('users columns:');
  cols.forEach(c => console.log(' -', c.Field, '|', c.Type));
  process.exit(0);
})();