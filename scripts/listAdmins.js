require('dotenv').config();
const pool = require('../server/config/db');

(async () => {
  try {
    const [rows] = await pool.query(
      "SELECT id, email, full_name, role FROM users WHERE role = 'admin' ORDER BY id"
    );
    console.log('Admins:');
    rows.forEach(u => console.log(` - ${u.id} | ${u.email} | ${u.full_name} | ${u.role}`));
    process.exit(0);
  } catch (err) {
    console.error('✗', err.message);
    process.exit(1);
  }
})();