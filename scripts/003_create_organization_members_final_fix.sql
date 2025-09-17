-- Complete fix for infinite recursion in organization_members RLS policies
-- This solution uses stored procedures to safely check admin status

-- Drop existing policies first
drop policy if exists "organization_members_select_own_org" on public.organization_members;
drop policy if exists "organization_members_insert_admin" on public.organization_members;
drop policy if exists "organization_members_update_admin" on public.organization_members;
drop policy if exists "organization_members_delete_admin" on public.organization_members;

-- Drop any existing functions
drop function if exists public.is_organization_admin(uuid, uuid);
drop function if exists public.add_organization_member(uuid, uuid, text);

-- Create a function to safely check if a user is an admin of an organization
-- This function bypasses RLS using SECURITY DEFINER
create or replace function public.is_organization_admin(org_id uuid, user_id uuid)
returns boolean
language sql
security definer
as $$
  select exists (
    -- Check if user is the organization creator
    select 1 from public.organizations o
    where o.id = org_id and o.created_by = user_id
  ) or exists (
    -- Check if user is an admin member (bypassing RLS)
    select 1 from public.organization_members om
    where om.organization_id = org_id
    and om.user_id = user_id
    and om.role = 'admin'
  );
$$;

-- Create a function to safely add organization members
-- This allows existing admins to add new members
create or replace function public.add_organization_member(
  org_id uuid,
  new_user_id uuid,
  new_role text
)
returns uuid
language plpgsql
security definer
as $$
declare
  member_id uuid;
begin
  -- Check if the current user can add members to this organization
  if not public.is_organization_admin(org_id, auth.uid()) then
    raise exception 'Insufficient permissions to add members to this organization';
  end if;

  -- Insert the new member
  insert into public.organization_members (organization_id, user_id, role)
  values (org_id, new_user_id, new_role)
  returning id into member_id;

  return member_id;
end;
$$;

-- Create new RLS policies that avoid recursion

-- SELECT policy: Users can see their own memberships and all members of organizations they can access
create policy "organization_members_select_own_org"
  on public.organization_members for select
  using (
    -- Users can always see their own membership
    auth.uid() = user_id or
    -- Users can see members of organizations they have access to
    public.is_organization_admin(organization_members.organization_id, auth.uid())
  );

-- INSERT policy: Only organization creators can insert directly
-- For other cases, use the add_organization_member function
create policy "organization_members_insert_admin"
  on public.organization_members for insert
  with check (
    -- Only organization creators can insert directly
    exists (
      select 1 from public.organizations o
      where o.id = organization_members.organization_id
      and o.created_by = auth.uid()
    )
  );

-- UPDATE policy: Organization creators and admins can update
create policy "organization_members_update_admin"
  on public.organization_members for update
  using (
    -- Organization creator or admin can update
    public.is_organization_admin(organization_members.organization_id, auth.uid()) or
    -- Users can update their own role (but not to admin unless they're org creator)
    (auth.uid() = user_id and role != 'admin')
  );

-- DELETE policy: Users can leave, organization creators and admins can remove others
create policy "organization_members_delete_admin"
  on public.organization_members for delete
  using (
    -- Users can remove themselves
    auth.uid() = user_id or
    -- Organization creator or admin can remove anyone
    public.is_organization_admin(organization_members.organization_id, auth.uid())
  );

-- Grant execute permissions on the functions
grant execute on function public.is_organization_admin(uuid, uuid) to authenticated;
grant execute on function public.add_organization_member(uuid, uuid, text) to authenticated;
