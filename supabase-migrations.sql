-- ============================================================
-- CareOps Hackathon MVP — Supabase Migrations
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Conversations table (one conversation per contact per workspace)
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade not null,
  contact_id uuid references contacts(id) on delete cascade not null,
  subject text,
  last_message text,
  last_message_at timestamptz default now(),
  unread_count int default 0,
  status text default 'open' check (status in ('open', 'closed', 'archived')),
  created_at timestamptz default now(),
  unique(workspace_id, contact_id)
);

-- 2. Add conversation_id to messages (nullable for backward compat)
alter table messages add column if not exists conversation_id uuid references conversations(id) on delete cascade;

-- 3. Inventory table
create table if not exists inventory (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade not null,
  name text not null,
  description text,
  category text default 'General',
  quantity int default 0,
  min_quantity int default 5,
  unit text default 'pcs',
  cost_per_unit numeric(10,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Enable RLS on new tables
alter table conversations enable row level security;
alter table inventory enable row level security;

-- 5. RLS policies — conversations
create policy "Users can view conversations in their workspace"
  on conversations for select
  using (
    workspace_id in (
      select workspace_id from workspace_members
      where user_id = auth.uid()
    )
  );

create policy "Users can insert conversations in their workspace"
  on conversations for insert
  with check (
    workspace_id in (
      select workspace_id from workspace_members
      where user_id = auth.uid()
    )
  );

create policy "Users can update conversations in their workspace"
  on conversations for update
  using (
    workspace_id in (
      select workspace_id from workspace_members
      where user_id = auth.uid()
    )
  );

-- 6. RLS policies — inventory
create policy "Users can view inventory in their workspace"
  on inventory for select
  using (
    workspace_id in (
      select workspace_id from workspace_members
      where user_id = auth.uid()
    )
  );

create policy "Users can insert inventory in their workspace"
  on inventory for insert
  with check (
    workspace_id in (
      select workspace_id from workspace_members
      where user_id = auth.uid()
    )
  );

create policy "Users can update inventory in their workspace"
  on inventory for update
  using (
    workspace_id in (
      select workspace_id from workspace_members
      where user_id = auth.uid()
    )
  );

create policy "Users can delete inventory in their workspace"
  on inventory for delete
  using (
    workspace_id in (
      select workspace_id from workspace_members
      where user_id = auth.uid()
    )
  );

-- 7. RLS policies — messages (allow service-role / anon inserts for automations)
-- If messages doesn't have RLS policies for conversation_id yet, this is fine.
-- The existing messages policies based on workspace_id still apply.

-- 8. Indexes for performance
create index if not exists idx_conversations_workspace on conversations(workspace_id);
create index if not exists idx_conversations_contact on conversations(contact_id);
create index if not exists idx_conversations_last_msg on conversations(workspace_id, last_message_at desc);
create index if not exists idx_inventory_workspace on inventory(workspace_id);
create index if not exists idx_messages_conversation on messages(conversation_id);
