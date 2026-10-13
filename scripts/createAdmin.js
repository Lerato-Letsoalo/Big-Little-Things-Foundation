require('dotenv').config();
const readline = require('readline');
const bcrypt = require('bcryptjs');
const pool = require('../server/config/db');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

(async () => {
  try {
    const email = await ask('Admin email: ');
    const password = await ask('Admin password (min 8 chars): ');
    const name = await ask('Admin full name: ');

    if (password.length < 8) throw new Error('Password too short (min 8 characters).');
    const hash = await bcrypt.hash(password, 12);

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);

    if (existing.length) {
      await pool.query(
        "UPDATE users SET password_hash = ?, full_name = ?, role = 'admin' WHERE email = ?",
        [hash, name, email]
      );
      console.log('✓ Existing user promoted to admin.');
    } else {
      await pool.query(
        "INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, 'admin')",
        [email, hash, name]
      );
      console.log('✓ Admin created.');
    }

    process.exit(0);
  } catch (err) {
    console.error('✗', err.message);
    process.exit(1);
  }
})();