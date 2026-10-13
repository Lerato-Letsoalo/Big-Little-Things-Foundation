require('dotenv').config();
const pool = require('../server/config/db');

(async () => {
  const [cols] = await pool.query('SHOW COLUMNS FROM users');
  console.log('Columns in users table:');
  cols.forEach(c => console.log(` - ${c.Field} | ${c.Type} | ${c.Null} | default: ${c.Default}`));
  process.exit(0);
})();