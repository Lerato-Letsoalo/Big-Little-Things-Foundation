require('dotenv').config();
const pool = require('../server/config/db');

const updates = [
  {
    author: 'Lerato Letsoalo',
    event: 'Spring Day 2026',
    content: 'Spring Day 2026 was such a beautiful and fulfilling experience. I really enjoyed spending time with the children, playing games with them, laughing together and seeing how something as simple as giving your time can make a difference. Being part of a team that shared the same heart for giving back made the day even more special. It was a reminder that the little things we do can create meaningful memories.'
  },
  {
    author: 'Unathi Masemola',
    event: 'Spring Day 2026',
    content: 'Spring Day was such an amazing experience! I loved interacting with the children, joining in their games and sharing so many laughs with them. It was wonderful to see everyone enjoying themselves and to work alongside a team that genuinely cares about making a difference. I left with a happy heart and memories that I will always appreciate.'
  },
  {
    author: 'Tebogo Mosoma',
    event: 'Spring Day 2026',
    content: 'Spring Day 2026 was such a refreshing and enjoyable experience. I had an amazing time working alongside the team, sharing laughs and being part of something meaningful. The energy throughout the day made it truly memorable, and it was wonderful to see everyone come together with a shared purpose. It reminded me that making a difference can also be a joyful and rewarding experience.'
  },
  {
    author: 'Benjamin Mulamba',
    event: 'Spring Day 2026',
    content: 'Being part of Spring Day 2026 was a beautiful experience. I enjoyed every moment spent with the team, from working together to sharing fun and laughter throughout the day. It was great to contribute to something bigger than ourselves while creating lasting memories along the way. I left feeling grateful for the experience and proud to be part of a team that values giving back.'
  }
];

(async () => {
  try {
    for (const u of updates) {
      const [result] = await pool.query(
        "UPDATE testimonials SET content = ?, status = 'published', event_label = ? WHERE author_name = ?",
        [u.content, u.event, u.author]
      );
      console.log(`✓ ${u.author} — ${result.affectedRows} row(s) updated`);
    }
    console.log('\nAll 4 testimonials updated and published.');
    process.exit(0);
  } catch (err) {
    console.error('✗', err.message);
    process.exit(1);
  }
})();