require('dotenv').config();
const pool = require('../server/config/db');

const pastProjects = [
  {
    title: 'September Spring Drive',
    category: '2026 · Tshwane Haven',
    description: "BLT's spring outreach at Tshwane Haven, bringing people together through community engagement, care and meaningful interactions.",
    event_date: '2026-09-01',
  },
  {
    title: 'Easter Drive',
    category: '2026 · Tshwane Haven',
    description: 'An Easter outreach initiative focused on sharing kindness, supporting the community and making a positive difference.',
    event_date: '2026-04-01',
  },
  {
    title: 'Spring Drive',
    category: "2025 · East Rand Children's Home",
    description: 'A community outreach initiative centred on connection, compassion and supporting children.',
    event_date: '2025-09-01',
  },
  {
    title: 'Spring Drive',
    category: '2025 · Tshwane Haven',
    description: 'BLT continued its spring outreach efforts, creating opportunities to connect with and support the local community.',
    event_date: '2025-09-15',
  },
  {
    title: 'Spring Drive',
    category: '2025 · SA Children\u2019s Home, Cape Town',
    description: "A spring community initiative extending BLT's outreach to beneficiaries in Cape Town.",
    event_date: '2025-09-20',
  },
  {
    title: 'Winter Clothing Drive',
    category: '2025 · Community Outreach',
    description: 'A seasonal initiative dedicated to collecting and distributing clothing to help people stay warm during winter.',
    event_date: '2025-06-01',
  },
  {
    title: 'Easter Drive',
    category: '2025 · Tshwane Haven',
    description: 'An Easter initiative bringing generosity and community spirit to Tshwane Haven.',
    event_date: '2025-04-01',
  },
  {
    title: 'Christmas Lunch Packs',
    category: '2022 · Food Support',
    description: 'A festive-season food initiative focused on sharing meals and extending care to the community.',
    event_date: '2022-12-20',
  },
  {
    title: 'Community Collaboration with AWCA',
    category: '2024 · Partnership',
    description: 'A collaborative initiative with AWCA, reflecting the value of partnerships in advancing community-focused work.',
    event_date: '2024-06-01',
  },
  {
    title: 'Sanitary Pad Drive',
    category: '2021 · Menstrual Hygiene Support',
    description: 'An initiative focused on menstrual hygiene support and helping improve access to essential sanitary products.',
    event_date: '2021-08-01',
  },
  {
    title: 'Easter Drive',
    category: '2025 · SA Children\u2019s Home, Cape Town',
    description: "An Easter outreach project extending BLT's support to the children's home in Cape Town.",
    event_date: '2025-04-15',
  },
  {
    title: 'Easter Drive',
    category: "2025 · East Rand Children's Home",
    description: 'A seasonal outreach initiative centred on generosity, community support and bringing care to children.',
    event_date: '2025-04-20',
  },
];

(async () => {
  try {
    // Optional: clear any previously seeded completed projects to avoid duplicates
    console.log('Removing existing completed drives (past projects)...');
    await pool.query("DELETE FROM events WHERE status = 'completed'");

    console.log('\nInserting past projects...');
    for (const p of pastProjects) {
      const [result] = await pool.query(
        "INSERT INTO events (title, description, category, status, event_date, published) VALUES (?, ?, ?, 'completed', ?, 1)",
        [p.title, p.description, p.category, p.event_date]
      );
      console.log(`  ✓ [${result.insertId}] ${p.title} — ${p.category}`);
    }

    const [count] = await pool.query("SELECT COUNT(*) AS c FROM events WHERE status = 'completed'");
    console.log(`\nDone. Total completed drives in database: ${count[0].c}`);
    process.exit(0);
  } catch (err) {
    console.error('\n✗ Error:', err.message);
    process.exit(1);
  }
})();