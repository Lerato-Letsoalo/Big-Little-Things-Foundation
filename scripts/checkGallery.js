require('dotenv').config();
const pool = require('../server/config/db');

(async () => {
  const [[count]] = await pool.query('SELECT COUNT(*) AS c FROM gallery_images');
  console.log('Rows in gallery_images:', count.c);

  const [rows] = await pool.query('SELECT id, title, image_path FROM gallery_images ORDER BY id LIMIT 10');
  console.log('\nSample:');
  rows.forEach(r => console.log(`  [${r.id}] ${r.title} → ${r.image_path}`));

  process.exit(0);
})();