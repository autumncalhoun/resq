-- Create payments table for adoption fees

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.adoption_applications(id) on delete cascade,
  amount numeric(10,2) not null,
  platform_fee numeric(10,2) not null, -- 10% platform fee
  total_amount numeric(10,2) not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'refunded')),
  payment_method text,
  transaction_id text, -- External payment processor transaction ID
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.payments enable row level security;

-- RLS policies for payments
create policy "payments_select_own_or_org"
  on public.payments for select
  using (
    exists (
      select 1 from public.adoption_applications aa
      where aa.id = payments.application_id
      and (aa.applicant_id = auth.uid() or exists (
        select 1 from public.dogs d
        join public.organization_members om on d.organization_id = om.organization_id
        where d.id = aa.dog_id and om.user_id = auth.uid()
      ))
    )
  );

create policy "payments_insert_applicant"
  on public.payments for insert
  with check (
    exists (
      select 1 from public.adoption_applications aa
      where aa.id = payments.application_id
      and aa.applicant_id = auth.uid()
    )
  );

create policy "payments_update_system"
  on public.payments for update
  using (
    exists (
      select 1 from public.adoption_applications aa
      where aa.id = payments.application_id
      and (aa.applicant_id = auth.uid() or exists (
        select 1 from public.dogs d
        join public.organization_members om on d.organization_id = om.organization_id
        where d.id = aa.dog_id and om.user_id = auth.uid() and om.role = 'admin'
      ))
    )
  );

-- Create function to calculate platform fee
create or replace function calculate_platform_fee(adoption_fee numeric)
returns numeric
language plpgsql
as $$
begin
  return round(adoption_fee * 0.10, 2);
end;
$$;
