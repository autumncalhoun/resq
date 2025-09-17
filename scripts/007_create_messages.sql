-- Create messages table for communication threads

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_type text not null check (thread_type in ('inquiry', 'application')),
  thread_id uuid not null, -- References either inquiry_id or application_id
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.messages enable row level security;

-- RLS policies for messages
create policy "messages_select_thread_participants"
  on public.messages for select
  using (
    auth.uid() = sender_id or
    (thread_type = 'inquiry' and exists (
      select 1 from public.inquiries i
      where i.id = messages.thread_id
      and (i.inquirer_id = auth.uid() or exists (
        select 1 from public.dogs d
        join public.organization_members om on d.organization_id = om.organization_id
        where d.id = i.dog_id and om.user_id = auth.uid()
      ))
    )) or
    (thread_type = 'application' and exists (
      select 1 from public.adoption_applications aa
      where aa.id = messages.thread_id
      and (aa.applicant_id = auth.uid() or exists (
        select 1 from public.dogs d
        join public.organization_members om on d.organization_id = om.organization_id
        where d.id = aa.dog_id and om.user_id = auth.uid()
      ))
    ))
  );

create policy "messages_insert_thread_participants"
  on public.messages for insert
  with check (
    (thread_type = 'inquiry' and exists (
      select 1 from public.inquiries i
      where i.id = messages.thread_id
      and (i.inquirer_id = auth.uid() or exists (
        select 1 from public.dogs d
        join public.organization_members om on d.organization_id = om.organization_id
        where d.id = i.dog_id and om.user_id = auth.uid()
      ))
    )) or
    (thread_type = 'application' and exists (
      select 1 from public.adoption_applications aa
      where aa.id = messages.thread_id
      and (aa.applicant_id = auth.uid() or exists (
        select 1 from public.dogs d
        join public.organization_members om on d.organization_id = om.organization_id
        where d.id = aa.dog_id and om.user_id = auth.uid()
      ))
    ))
  );

-- Create indexes for performance
create index if not exists messages_thread_idx on public.messages(thread_type, thread_id);
create index if not exists messages_created_at_idx on public.messages(created_at);
