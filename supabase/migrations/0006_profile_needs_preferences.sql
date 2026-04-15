alter table public.profiles
add column if not exists current_needs text[] not null default '{}',
add column if not exists preferred_category_ids uuid[] not null default '{}';

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

  new.current_needs := coalesce(
    array(
      select distinct lower(trim(value))
      from unnest(coalesce(new.current_needs, '{}')) as value
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

  new.preferred_category_ids := coalesce(
    array(
      select distinct value
      from unnest(coalesce(new.preferred_category_ids, '{}')) as value
      where value is not null
      order by value
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
    and (
      coalesce(array_length(new.current_wants, 1), 0) > 0
      or coalesce(array_length(new.current_needs, 1), 0) > 0
    )
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
before insert or update of avatar_url, bio, city, interests, skills, current_wants, current_needs, hobbies, profession, preferred_category_ids
on public.profiles
for each row execute function public.normalize_profile_arrays();
