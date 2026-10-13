require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../server/config/db');

const GALLERY_DIR = path.join(__dirname, '..', 'uploads', 'gallery');
const IMAGE_EXT = /\.(jpg|jpeg|png|webp|gif)$/i;

(async () => {
  try {
    if (!fs.existsSync(GALLERY_DIR)) {
      console.error('✗ Gallery directory not found:', GALLERY_DIR);
      process.exit(1);
    }

    console.log('Scanning:', GALLERY_DIR);
    const entries = fs.readdirSync(GALLERY_DIR, { withFileTypes: true });
    const folders = entries.filter(e => e.isDirectory());

    console.log(`Found ${folders.length} subfolder(s):`);
    folders.forEach(f => console.log('  -', f.name));

    if (!folders.length) {
      console.log('\n✗ No subfolders inside uploads/gallery.');
      console.log('  Move your event folders into:', GALLERY_DIR);
      process.exit(0);
    }

    let inserted = 0, skipped = 0, errors = 0;

    for (const folder of folders) {
      const folderName = folder.name;
      const folderPath = path.join(GALLERY_DIR, folderName);

      const yearMatch = folderName.match(/\((\d{4})\)/) || folderName.match(/\b(20\d{2})\b/);
      const year = yearMatch ? parseInt(yearMatch[1], 10) : null;

      const files = fs.readdirSync(folderPath).filter(f => IMAGE_EXT.test(f));
      console.log(`\n📁 ${folderName}  (year: ${year || '?'})  —  ${files.length} image(s)`);

      for (const file of files) {
        const imagePath = `/uploads/gallery/${folderName}/${file}`;

        const [existing] = await pool.query(
          'SELECT id FROM gallery_images WHERE image_path = ?',
          [imagePath]
        );
        if (existing.length) { skipped++; continue; }

        try {
          await pool.query(
            'INSERT INTO gallery_images (title, caption, alt_text, image_path, category, display_order) VALUES (?, ?, ?, ?, ?, ?)',
            [
              folderName,
              null,
              folderName.replace(/\s+/g, ' ').trim(),
              imagePath,
              String(year || ''),
              0
            ]
          );
          inserted++;
        } catch (err) {
          console.error(`  ✗ ${file}: ${err.message}`);
          errors++;
        }
      }
    }

    console.log(`\n✓ Done.`);
    console.log(`   Inserted: ${inserted}`);
    console.log(`   Skipped:  ${skipped}`);
    console.log(`   Errors:   ${errors}`);

    const [[count]] = await pool.query('SELECT COUNT(*) AS c FROM gallery_images');
    console.log(`\nTotal rows in gallery_images: ${count.c}`);

    process.exit(0);
  } catch (err) {
    console.error('\n✗ Script error:', err.message);
    process.exit(1);
  }
})();