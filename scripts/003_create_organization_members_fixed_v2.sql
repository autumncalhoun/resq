-- Fix infinite recursion in organization_members RLS policies
-- The issue: policies were referencing the same table they were protecting, causing infinite recursion

-- Drop existing policies first
drop policy if exists "organization_members_select_own_org" on public.organization_members;
drop policy if exists "organization_members_insert_admin" on public.organization_members;
drop policy if exists "organization_members_update_admin" on public.organization_members;
drop policy if exists "organization_members_delete_admin" on public.organization_members;

-- Create new policies that avoid recursion by not self-referencing the organization_members table

-- SELECT policy: Users can see their own memberships and all members of organizations they created
create policy "organization_members_select_own_org"
  on public.organization_members for select
  using (
    -- Users can always see their own membership
    auth.uid() = user_id or
    -- Organization creators can see all members of their organizations
    exists (
      select 1 from public.organizations o
      where o.id = organization_members.organization_id
      and o.created_by = auth.uid()
    )
  );

-- INSERT policy: Only organization creators can add members initially
-- Note: Once an organization has members, we'll need a different approach for adding more admins
create policy "organization_members_insert_admin"
  on public.organization_members for insert
  with check (
    -- Only organization creators can add the first members
    exists (
      select 1 from public.organizations o
      where o.id = organization_members.organization_id
      and o.created_by = auth.uid()
    )
  );

-- UPDATE policy: Organization creators can update, users can update their own non-admin roles
create policy "organization_members_update_admin"
  on public.organization_members for update
  using (
    -- Organization creator can update any membership
    exists (
      select 1 from public.organizations o
      where o.id = organization_members.organization_id
      and o.created_by = auth.uid()
    ) or
    -- Users can update their own role (but not to admin unless they're org creator)
    (auth.uid() = user_id and role != 'admin')
  );

-- DELETE policy: Users can leave, organization creators can remove anyone
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
    )
  );

-- Note: This approach has a limitation - only organization creators can add new members.
-- If you need to allow existing admins to add more members, you'll need to implement
-- a more sophisticated solution using stored procedures or functions that can safely
-- check admin status without triggering RLS recursion.
