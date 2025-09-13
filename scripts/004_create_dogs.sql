-- Create dogs table for dog profiles

create table if not exists public.dogs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  breed text,
  age_years integer,
  age_months integer,
  size text check (size in ('small', 'medium', 'large', 'extra_large')),
  gender text check (gender in ('male', 'female')),
  description text,
  medical_notes text,
  behavioral_notes text,
  adoption_fee numeric(10,2),
  status text not null default 'available' check (status in ('available', 'pending', 'adopted', 'not_available')),
  location_city text,
  location_state text,
  photos jsonb default '[]'::jsonb, -- Array of photo URLs
  created_by uuid not null references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.dogs enable row level security;

-- RLS policies for dogs
create policy "dogs_select_all"
  on public.dogs for select
  using (true); -- Public read access for browsing

create policy "dogs_insert_org_member"
  on public.dogs for insert
  with check (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = dogs.organization_id
      and om.user_id = auth.uid()
      and om.role in ('admin', 'foster')
    )
  );

create policy "dogs_update_org_member"
  on public.dogs for update
  using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = dogs.organization_id
      and om.user_id = auth.uid()
      and om.role in ('admin', 'foster')
    )
  );

create policy "dogs_delete_org_admin"
  on public.dogs for delete
  using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = dogs.organization_id
      and om.user_id = auth.uid()
      and om.role = 'admin'
    )
  );

-- Create index for searching
create index if not exists dogs_breed_idx on public.dogs(breed);
create index if not exists dogs_location_idx on public.dogs(location_city, location_state);
create index if not exists dogs_status_idx on public.dogs(status);
