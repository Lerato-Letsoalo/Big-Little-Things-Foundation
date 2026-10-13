require('dotenv').config();
const fs = require('fs');
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
    ssl: { ca: fs.readFileSync('./certs/ca.pem'), rejectUnauthorized: false }
  });

  try {
    console.log('Running schema.sql ...');
    await conn.query(fs.readFileSync('./database/schema.sql', 'utf8'));
    console.log('✓ Schema applied');

    console.log('Running seed.sql ...');
    await conn.query(fs.readFileSync('./database/seed.sql', 'utf8'));
    console.log('✓ Seed applied');

    const [tables] = await conn.query('SHOW TABLES');
    console.log('Tables in DB:');
    tables.forEach(t => console.log(' -', Object.values(t)[0]));
  } catch (err) {
    console.error('✗', err.message);
  } finally {
    await conn.end();
  }
})();