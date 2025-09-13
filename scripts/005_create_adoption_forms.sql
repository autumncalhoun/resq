-- Create adoption application forms (customizable by organizations)

create table if not exists public.adoption_forms (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null default 'Adoption Application',
  description text,
  is_active boolean default true,
  created_by uuid not null references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create form fields table for dynamic form building
create table if not exists public.form_fields (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.adoption_forms(id) on delete cascade,
  field_type text not null check (field_type in ('text', 'textarea', 'select', 'radio', 'checkbox', 'email', 'phone', 'number')),
  label text not null,
  placeholder text,
  required boolean default false,
  options jsonb, -- For select, radio, checkbox options
  order_index integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.adoption_forms enable row level security;
alter table public.form_fields enable row level security;

-- RLS policies for adoption forms
create policy "adoption_forms_select_all"
  on public.adoption_forms for select
  using (true); -- Public read access

create policy "adoption_forms_insert_org_admin"
  on public.adoption_forms for insert
  with check (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = adoption_forms.organization_id
      and om.user_id = auth.uid()
      and om.role = 'admin'
    )
  );

create policy "adoption_forms_update_org_admin"
  on public.adoption_forms for update
  using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = adoption_forms.organization_id
      and om.user_id = auth.uid()
      and om.role = 'admin'
    )
  );

create policy "adoption_forms_delete_org_admin"
  on public.adoption_forms for delete
  using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = adoption_forms.organization_id
      and om.user_id = auth.uid()
      and om.role = 'admin'
    )
  );

-- RLS policies for form fields
create policy "form_fields_select_all"
  on public.form_fields for select
  using (true); -- Public read access

create policy "form_fields_insert_org_admin"
  on public.form_fields for insert
  with check (
    exists (
      select 1 from public.adoption_forms af
      join public.organization_members om on af.organization_id = om.organization_id
      where af.id = form_fields.form_id
      and om.user_id = auth.uid()
      and om.role = 'admin'
    )
  );

create policy "form_fields_update_org_admin"
  on public.form_fields for update
  using (
    exists (
      select 1 from public.adoption_forms af
      join public.organization_members om on af.organization_id = om.organization_id
      where af.id = form_fields.form_id
      and om.user_id = auth.uid()
      and om.role = 'admin'
    )
  );

create policy "form_fields_delete_org_admin"
  on public.form_fields for delete
  using (
    exists (
      select 1 from public.adoption_forms af
      join public.organization_members om on af.organization_id = om.organization_id
      where af.id = form_fields.form_id
      and om.user_id = auth.uid()
      and om.role = 'admin'
    )
  );
