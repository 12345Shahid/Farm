-- Run this in Supabase SQL Editor to create the storage bucket
-- for verification video uploads

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'verification-videos',
  'verification-videos',
  false,
  52428800, -- 50MB
  array['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska']
)
on conflict (id) do nothing;

-- Grant insert access to authenticated users via the service role
create policy "Service role can upload verification videos"
on storage.objects for insert
to service_role
with check (bucket_id = 'verification-videos');

create policy "Service role can read verification videos"
on storage.objects for select
to service_role
using (bucket_id = 'verification-videos');

-- SQL function to count referrals
create or replace function tma_count_referrals(p_user_id bigint)
returns integer
language plpgsql
security definer
as $$
declare
  v_count integer;
begin
  select count(*) into v_count
  from tma_users
  where referred_by = p_user_id;
  return v_count;
end;
$$;