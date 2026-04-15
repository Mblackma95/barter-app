alter table public.profiles
add column if not exists interests text[] not null default '{}',
add column if not exists skills text[] not null default '{}',
add column if not exists current_wants text[] not null default '{}',
add column if not exists hobbies text[] not null default '{}',
add column if not exists profession text,
add column if not exists profile_completed_at timestamptz;

create or replace function public.normalize_profile_arrays()
returns trigger
language plpgsql
as $$
begin
  new.interests := coalesce(
    array(
      select distinct lower(trim(value))
      from unnest(coalesce(new.interests, '{}')) as value
      where trim(value) <> ''
      order by lower(trim(value))
    ),
    '{}'
  );

  new.skills := coalesce(
    array(
      select distinct lower(trim(value))
      from unnest(coalesce(new.skills, '{}')) as value
      where trim(value) <> ''
      order by lower(trim(value))
    ),
    '{}'
  );

  new.current_wants := coalesce(
    array(
      select distinct lower(trim(value))
      from unnest(coalesce(new.current_wants, '{}')) as value
      where trim(value) <> ''
      order by lower(trim(value))
    ),
    '{}'
  );

  new.hobbies := coalesce(
    array(
      select distinct lower(trim(value))
      from unnest(coalesce(new.hobbies, '{}')) as value
      where trim(value) <> ''
      order by lower(trim(value))
    ),
    '{}'
  );

  if new.avatar_url is not null and btrim(new.avatar_url) = '' then
    new.avatar_url := null;
  end if;

  if new.bio is not null and btrim(new.bio) = '' then
    new.bio := null;
  end if;

  if new.profession is not null and btrim(new.profession) = '' then
    new.profession := null;
  end if;

  if new.avatar_url is not null
    and new.bio is not null
    and btrim(new.city) <> ''
    and (coalesce(array_length(new.interests, 1), 0) > 0 or coalesce(array_length(new.skills, 1), 0) > 0)
    and coalesce(array_length(new.current_wants, 1), 0) > 0
  then
    new.profile_completed_at := coalesce(new.profile_completed_at, now());
  else
    new.profile_completed_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists normalize_profile_arrays_before_write on public.profiles;
create trigger normalize_profile_arrays_before_write
before insert or update of avatar_url, bio, city, interests, skills, current_wants, hobbies, profession
on public.profiles
for each row execute function public.normalize_profile_arrays();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-media',
  'profile-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Profile media is publicly readable"
on storage.objects for select
using (bucket_id = 'profile-media');

create policy "Authenticated users can upload profile media"
on storage.objects for insert
to authenticated
with check (bucket_id = 'profile-media' and owner = auth.uid());

create policy "Owners can update profile media"
on storage.objects for update
to authenticated
using (bucket_id = 'profile-media' and owner = auth.uid())
with check (bucket_id = 'profile-media' and owner = auth.uid());

create policy "Owners can delete profile media"
on storage.objects for delete
to authenticated
using (bucket_id = 'profile-media' and owner = auth.uid());

create policy "Public profiles are readable"
on public.profiles for select
using (true);
