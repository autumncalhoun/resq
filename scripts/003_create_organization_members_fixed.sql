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

-- Drop existing policies to avoid conflicts
drop policy if exists "organization_members_select_own_org" on public.organization_members;
drop policy if exists "organization_members_insert_admin" on public.organization_members;
drop policy if exists "organization_members_update_admin" on public.organization_members;
drop policy if exists "organization_members_delete_admin" on public.organization_members;

-- Create a helper function to check if user is admin of an organization
-- This function bypasses RLS to avoid recursion by using SECURITY DEFINER
create or replace function public.is_organization_admin(org_id uuid, user_id uuid)
returns boolean
language sql
security definer
as $$
  select exists (
    select 1 from public.organizations o
    where o.id = org_id and o.created_by = user_id
  );
$$;

-- Fixed RLS policies for organization members
-- SELECT policy: Users can see their own memberships and all members of organizations they belong to
create policy "organization_members_select_own_org"
  on public.organization_members for select
  using (
    auth.uid() = user_id or
    -- Check if user has any role in this organization
    exists (
      select 1 from public.organization_members om_check
      where om_check.organization_id = organization_members.organization_id
      and om_check.user_id = auth.uid()
      and om_check.id != organization_members.id  -- Avoid self-reference
    ) or
    -- Organization creator can see all members
    exists (
      select 1 from public.organizations o
      where o.id = organization_members.organization_id
      and o.created_by = auth.uid()
    )
  );

-- INSERT policy: Only organization creators or existing admins can add members
create policy "organization_members_insert_admin"
  on public.organization_members for insert
  with check (
    -- Organization creator can add members
    exists (
      select 1 from public.organizations o
      where o.id = organization_members.organization_id
      and o.created_by = auth.uid()
    ) or
    -- Use the helper function to check if user is admin
    public.is_organization_admin(organization_members.organization_id, auth.uid())
  );

-- UPDATE policy: Only admins can update memberships
create policy "organization_members_update_admin"
  on public.organization_members for update
  using (
    -- Organization creator can update
    exists (
      select 1 from public.organizations o
      where o.id = organization_members.organization_id
      and o.created_by = auth.uid()
    ) or
    -- Use helper function to check if user is admin
    public.is_organization_admin(organization_members.organization_id, auth.uid()) or
    -- Users can update their own role (but not to admin unless they're org creator)
    (auth.uid() = user_id and role != 'admin')
  );

-- DELETE policy: Users can leave, admins can remove others
create policy "organization_members_delete_admin"
  on public.organization_members for delete
  using (
    -- Users can remove themselves
    auth.uid() = user_id or
    -- Organization creator can remove anyone
    exists (
      select 1 from public.organizations o
      where o.id = organization_members.organization_id
      and o.created_by = auth.uid()
    ) or
    -- Use helper function to check if user is admin
    public.is_organization_admin(organization_members.organization_id, auth.uid())
  );
