insert into public.categories (group_name, name, slug, sort_order)
values
  ('Goods', 'Clothing & Accessories', 'clothing-accessories', 10),
  ('Goods', 'Home & Furniture', 'home-furniture', 20),
  ('Goods', 'Electronics & Tech', 'electronics-tech', 30),
  ('Goods', 'Books & Media', 'books-media', 40),
  ('Goods', 'Baby & Kids', 'baby-kids', 50),
  ('Goods', 'Sports & Outdoor Gear', 'sports-outdoor-gear', 60),
  ('Goods', 'Beauty & Personal Care', 'beauty-personal-care', 70),
  ('Goods', 'Art & Handmade Goods', 'art-handmade-goods', 80),
  ('Goods', 'Food & Homemade Items', 'food-homemade-items', 90),
  ('Services', 'Creative & Design', 'creative-design', 100),
  ('Services', 'Writing & Editing', 'writing-editing', 110),
  ('Services', 'Marketing & Business Support', 'marketing-business-support', 120),
  ('Services', 'Tech & IT Support', 'tech-it-support', 130),
  ('Services', 'Education & Tutoring', 'education-tutoring', 140),
  ('Services', 'Health & Wellness', 'health-wellness', 150),
  ('Services', 'Spiritual & Energy Work', 'spiritual-energy-work', 160),
  ('Services', 'Home Services & Repairs', 'home-services-repairs', 170),
  ('Services', 'Personal Services', 'personal-services', 180),
  ('Community', 'Events & Workshops', 'events-workshops', 190),
  ('Community', 'Volunteering & Community Help', 'volunteering-community-help', 200),
  ('Community', 'Skill Sharing', 'skill-sharing', 210),
  ('Community', 'Miscellaneous', 'miscellaneous', 220)
on conflict (slug) do update
set group_name = excluded.group_name,
    name = excluded.name,
    sort_order = excluded.sort_order,
    is_active = true;
