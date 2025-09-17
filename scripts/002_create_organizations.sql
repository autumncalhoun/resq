-- Create organizations table for rescue organizations

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  address text,
  city text,
  state text,
  zip_code text,
  phone text,
  email text,
  website text,
  logo_url text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.organizations enable row level security;

-- RLS policies for organizations
create policy "organizations_select_all"
  on public.organizations for select
  using (true); -- Public read access for browsing

create policy "organizations_insert_rescue_admin"
  on public.organizations for insert
  with check (
    auth.uid() = created_by and
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and user_type = 'rescue_admin'
    )
  );

create policy "organizations_update_own"
  on public.organizations for update
  using (
    auth.uid() = created_by and
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and user_type = 'rescue_admin'
    )
  );

create policy "organizations_delete_own"
  on public.organizations for delete
  using (
    auth.uid() = created_by and
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and user_type = 'rescue_admin'
    )
  );
