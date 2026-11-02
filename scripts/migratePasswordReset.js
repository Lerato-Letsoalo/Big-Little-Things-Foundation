require('dotenv').config();
const pool = require('../server/config/db');

async function tableExists(table) {
  const [rows] = await pool.query(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table]
  );
  return rows.length > 0;
}

(async () => {
  try {
    if (!(await tableExists('password_reset_tokens'))) {
      await pool.query(`
        CREATE TABLE password_reset_tokens (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          token_hash VARCHAR(255) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_token (token_hash),
          INDEX idx_expires (expires_at)
        ) ENGINE=InnoDB
      `);
      console.log('✓ Created password_reset_tokens table');
    } else {
      console.log('· password_reset_tokens already exists');
    }
    process.exit(0);
  } catch (err) {
    console.error('✗', err.message);
    process.exit(1);
  }
})();