-- Run this in your Supabase project → SQL Editor

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_name text not null default '',
  theme text not null default 'light',
  onboarding_done boolean not null default false
);

create table habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  icon text not null default 'book',
  type text not null default 'boolean',
  goal_minutes int,
  frequency int[] not null,
  reminder_time text,
  created_at date not null default current_date,
  sort_order int default 0
);

create table habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  habit_id uuid references habits(id) on delete cascade not null,
  date date not null,
  completed boolean not null default false,
  minutes int,
  unique(habit_id, date)
);

-- Enable Row Level Security
alter table profiles   enable row level security;
alter table habits     enable row level security;
alter table habit_logs enable row level security;

-- Policies: users can only access their own data
create policy "own profile"   on profiles   for all using (auth.uid() = id);
create policy "own habits"    on habits     for all using (auth.uid() = user_id);
create policy "own logs"      on habit_logs for all using (auth.uid() = user_id);

-- Push subscriptions table
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  subscription jsonb not null,
  created_at timestamptz default now()
);
alter table push_subscriptions enable row level security;
create policy "own subscriptions" on push_subscriptions for all using (auth.uid() = user_id);
