-- Create organization members table to link users to organizations

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'foster', 'volunteer')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(organization_id, user_id)
);

-- Enable RLS
alter table public.organization_members enable row level security;

-- RLS policies for organization members
create policy "organization_members_select_own_org"
  on public.organization_members for select
  using (
    auth.uid() = user_id or
    exists (
      select 1 from public.organization_members om
      where om.organization_id = organization_members.organization_id
      and om.user_id = auth.uid()
      and om.role = 'admin'
    )
  );

create policy "organization_members_insert_admin"
  on public.organization_members for insert
  with check (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = organization_members.organization_id
      and om.user_id = auth.uid()
      and om.role = 'admin'
    ) or
    exists (
      select 1 from public.organizations o
      where o.id = organization_members.organization_id
      and o.created_by = auth.uid()
    )
  );

create policy "organization_members_update_admin"
  on public.organization_members for update
  using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = organization_members.organization_id
      and om.user_id = auth.uid()
      and om.role = 'admin'
    )
  );

create policy "organization_members_delete_admin"
  on public.organization_members for delete
  using (
    auth.uid() = user_id or
    exists (
      select 1 from public.organization_members om
      where om.organization_id = organization_members.organization_id
      and om.user_id = auth.uid()
      and om.role = 'admin'
    )
  );
