alter table public.categories
add column group_name text not null default 'Goods';

update public.categories
set group_name = case
  when slug in (
    'clothing-accessories',
    'home-furniture',
    'electronics-tech',
    'books-media',
    'baby-kids',
    'sports-outdoor-gear',
    'beauty-personal-care',
    'art-handmade-goods',
    'food-homemade-items'
  ) then 'Goods'
  when slug in (
    'creative-design',
    'writing-editing',
    'marketing-business-support',
    'tech-it-support',
    'education-tutoring',
    'health-wellness',
    'spiritual-energy-work',
    'home-services-repairs',
    'personal-services'
  ) then 'Services'
  else 'Community'
end;
