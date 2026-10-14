require('dotenv').config();
const pool = require('../server/config/db');

(async () => {
  const [rows] = await pool.query(
    `SELECT id, donor_name, donation_type, item_image_path, proof_path, created_at
     FROM donations
     ORDER BY created_at DESC
     LIMIT 5`
  );
  console.log('Recent donations:');
  rows.forEach(r => {
    console.log(`  ID ${r.id} | ${r.donor_name} | ${r.donation_type} | image: ${r.item_image_path || 'NULL'} | proof: ${r.proof_path || 'NULL'}`);
  });
  process.exit(0);
})();