
-- ==================== TEAM MEMBERS ====================
INSERT INTO team_members (name, role, bio, display_order) VALUES
('Hloni Mgedeza', 'Marketing & Communications',
 'Hloni Mgedeza is a passionate creative and community advocate who believes that small acts of kindness can make a big difference. As the Marketing & Communications director at Big Little Things Foundation, she helps share BLT''s story, connect with communities and create awareness around its initiatives. With a background in Somatology, beauty and content creation, Hloni brings her creativity and love for people into her work. She is passionate about giving back, creating meaningful experiences and inspiring others to see the impact that even the little things can make.',
 1),
('Chloe Grotewold', 'Secretary & Donor Sourcing',
 'Chloe Grotewold is a dedicated community advocate and Secretary at Big Little Things Foundation, where she supports the organisation''s administration, donor relationships and fundraising initiatives. She is passionate about creating meaningful opportunities to give back and connecting individuals and businesses with causes where their contributions can make a tangible difference. Based in Johannesburg, Chloe leads Big Little Things'' East Rand and Johannesburg outreach drives, coordinating four community initiatives each year and managing local donation efforts.',
 2),
('Iman Cassiem', 'Treasurer & Volunteer Coordinator',
 'Iman Cassiem is a passionate community advocate who believes that meaningful change often starts with the little things we do for others. As the Treasurer & Volunteer Coordinator at Big Little Things Foundation, she helps oversee the organisation''s finances, coordinate volunteers and ensure that Big Little Things'' initiatives are organised, impactful and sustainable. With a background in Accounting Science and a strong interest in leadership, community development and youth empowerment, Iman brings her practical skills and dedication into ensuring that Big Little Things is run ethically and functions efficiently.',
 3);

-- ==================== EVENTS / DRIVES ====================
INSERT INTO events (title, description, category, status, event_date, published) VALUES
('Upcoming Year-End Stationery Drive', 'Collecting stationery for learners ahead of the new school year.', 'Stationery', 'upcoming', NULL, 1),
('2027 Easter Drive', 'Community outreach drive during the Easter period.', 'Outreach', 'upcoming', NULL, 1),
('2027 Spring Drive', 'Spring community drive supporting local children''s homes.', 'Outreach', 'upcoming', NULL, 1);

-- ==================== TESTIMONIALS ====================
INSERT INTO testimonials (author_name, event_label, content, status, display_order) VALUES
('Larissa', 'Spring Drive 2026',
 'Volunteering with the children was such a heartwarming and rewarding experience. Seeing their smiles, energy, and excitement made every moment special. I loved interacting with them, learning from them, and creating happy memories together. It reminded me how meaningful it is to make a difference in a child''s life, even through the smallest acts of kindness.',
 'published', 1),
('Liza', 'Easter and Spring Drive 2025',
 'Volunteering with the Big Little Things Foundation during my year abroad in Cape Town was an incredibly wholesome and rewarding experience. From donating clothes and food to spending a fun-filled day playing games and connecting with the children, every moment was special. It was a beautiful reminder of how much joy and connection can come from simply showing up and spending time together.',
 'published', 2),
('Lozalea', NULL,
 'My first experience as a volunteer at the orphanage, to say the least, was an experience I won''t be quick to forget. Watching the children interact, from the youngest to the oldest of them, made me realize that they really are just children. Like every other child. They fight among one another like siblings, and ultimately make up like siblings do. Being there felt like being among a big, personality-filled family. And I had so much fun with them. With the little kids as well as the teenagers! I look forward to the next one.',
 'published', 3),
('Mercédes', NULL,
 'My experience with BLT has been amazing. I''ve attended different food drives and volunteered at children''s homes, and I''ve had some of the greatest experiences. It''s so amazing to give back, and having a community to give back with makes it even more amazing. I had one of the greatest organisers, Hloni. She made sure everything was so well planned and organised, and it never felt like things were out of order. It''s just so nice to be around people who are giving and have the same heart for giving back.',
 'published', 4);

-- Draft testimonials — awaiting text and approval
INSERT INTO testimonials (author_name, event_label, content, status, display_order) VALUES
('Lerato Letsoalo', NULL, 'Awaiting testimonial text and approval.', 'draft', 5),
('Unathi Masemola', NULL, 'Awaiting testimonial text and approval.', 'draft', 6),
('Tebogo Mosoma', NULL, 'Awaiting testimonial text and approval.', 'draft', 7),
('Benjamin Mulamba', NULL, 'Awaiting testimonial text and approval.', 'draft', 8);