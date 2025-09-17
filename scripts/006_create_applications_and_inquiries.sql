-- Create adoption applications table

create table if not exists public.adoption_applications (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs(id) on delete cascade,
  form_id uuid not null references public.adoption_forms(id),
  applicant_id uuid not null references auth.users(id) on delete cascade,
  form_data jsonb not null, -- Stores the submitted form responses
  status text not null default 'pending' check (status in ('pending', 'under_review', 'approved', 'rejected')),
  notes text, -- Internal notes from rescue
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create inquiries table for initial contact
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs(id) on delete cascade,
  inquirer_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  status text not null default 'open' check (status in ('open', 'responded', 'closed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.adoption_applications enable row level security;
alter table public.inquiries enable row level security;

-- RLS policies for adoption applications
create policy "adoption_applications_select_own_or_org"
  on public.adoption_applications for select
  using (
    auth.uid() = applicant_id or
    exists (
      select 1 from public.dogs d
      join public.organization_members om on d.organization_id = om.organization_id
      where d.id = adoption_applications.dog_id
      and om.user_id = auth.uid()
    )
  );

create policy "adoption_applications_insert_own"
  on public.adoption_applications for insert
  with check (auth.uid() = applicant_id);

create policy "adoption_applications_update_own_or_org"
  on public.adoption_applications for update
  using (
    auth.uid() = applicant_id or
    exists (
      select 1 from public.dogs d
      join public.organization_members om on d.organization_id = om.organization_id
      where d.id = adoption_applications.dog_id
      and om.user_id = auth.uid()
      and om.role in ('admin', 'foster')
    )
  );

-- RLS policies for inquiries
create policy "inquiries_select_own_or_org"
  on public.inquiries for select
  using (
    auth.uid() = inquirer_id or
    exists (
      select 1 from public.dogs d
      join public.organization_members om on d.organization_id = om.organization_id
      where d.id = inquiries.dog_id
      and om.user_id = auth.uid()
    )
  );

create policy "inquiries_insert_own"
  on public.inquiries for insert
  with check (auth.uid() = inquirer_id);

create policy "inquiries_update_own_or_org"
  on public.inquiries for update
  using (
    auth.uid() = inquirer_id or
    exists (
      select 1 from public.dogs d
      join public.organization_members om on d.organization_id = om.organization_id
      where d.id = inquiries.dog_id
      and om.user_id = auth.uid()
      and om.role in ('admin', 'foster')
    )
  );
