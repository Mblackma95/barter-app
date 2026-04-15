insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-media',
  'listing-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Listing media is publicly readable"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'listing-media');

create policy "Authenticated users can upload listing media"
on storage.objects for insert
to authenticated
with check (bucket_id = 'listing-media' and owner = auth.uid());

create policy "Owners can update listing media"
on storage.objects for update
to authenticated
using (bucket_id = 'listing-media' and owner = auth.uid())
with check (bucket_id = 'listing-media' and owner = auth.uid());

create policy "Owners can delete listing media"
on storage.objects for delete
to authenticated
using (bucket_id = 'listing-media' and owner = auth.uid());
