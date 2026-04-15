create or replace function public.slugify(value text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(
    regexp_replace(lower(coalesce(value, '')), '[^a-z0-9]+', '-', 'g'),
    '-+',
    '-',
    'g'
  ));
$$;

create or replace function public.generate_unique_slug(
  base_value text,
  table_name text,
  column_name text,
  existing_id uuid default null
)
returns text
language plpgsql
as $$
declare
  base_slug text;
  candidate_slug text;
  suffix integer := 1;
  exists_query text;
  slug_exists boolean;
begin
  base_slug := public.slugify(base_value);

  if base_slug = '' then
    base_slug := 'item';
  end if;

  candidate_slug := base_slug;

  loop
    exists_query := format(
      'select exists (
        select 1 from public.%I
        where %I = $1
          and ($2::uuid is null or id <> $2::uuid)
      )',
      table_name,
      column_name
    );

    execute exists_query into slug_exists using candidate_slug, existing_id;
    exit when not slug_exists;

    suffix := suffix + 1;
    candidate_slug := base_slug || '-' || suffix;
  end loop;

  return candidate_slug;
end;
$$;

alter table public.profiles
add column username text;

alter table public.listings
add column slug text;

alter table public.events
add column slug text;

create or replace function public.set_profile_username()
returns trigger
language plpgsql
as $$
begin
  if new.username is null or new.username = '' then
    new.username := public.generate_unique_slug(new.display_name, 'profiles', 'username', new.id);
  else
    new.username := public.generate_unique_slug(new.username, 'profiles', 'username', new.id);
  end if;

  return new;
end;
$$;

create or replace function public.set_listing_slug()
returns trigger
language plpgsql
as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := public.generate_unique_slug(new.title, 'listings', 'slug', new.id);
  else
    new.slug := public.generate_unique_slug(new.slug, 'listings', 'slug', new.id);
  end if;

  return new;
end;
$$;

create or replace function public.set_event_slug()
returns trigger
language plpgsql
as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := public.generate_unique_slug(new.title, 'events', 'slug', new.id);
  else
    new.slug := public.generate_unique_slug(new.slug, 'events', 'slug', new.id);
  end if;

  return new;
end;
$$;

update public.profiles
set username = public.generate_unique_slug(display_name, 'profiles', 'username', id)
where username is null;

update public.listings
set slug = public.generate_unique_slug(title, 'listings', 'slug', id)
where slug is null;

update public.events
set slug = public.generate_unique_slug(title, 'events', 'slug', id)
where slug is null;

alter table public.profiles
alter column username set not null;

alter table public.listings
alter column slug set not null;

alter table public.events
alter column slug set not null;

create unique index profiles_username_unique on public.profiles (username);
create unique index listings_slug_unique on public.listings (slug);
create unique index events_slug_unique on public.events (slug);

create trigger profiles_set_username
before insert or update of username, display_name on public.profiles
for each row execute function public.set_profile_username();

create trigger listings_set_slug
before insert or update of slug, title on public.listings
for each row execute function public.set_listing_slug();

create trigger events_set_slug
before insert or update of slug, title on public.events
for each row execute function public.set_event_slug();
