create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  settings jsonb not null default jsonb_build_object(
    'defaultCurrency','AUD',
    'enabledCurrencies', jsonb_build_array('AUD','NZD')
  ),
  created_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name',
             new.raw_user_meta_data->>'name',
             new.email),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  unique(user_id, name)
);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  unique(user_id, name)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'AUD',
  occurred_on date not null,
  description text,
  category_id uuid references public.categories(id) on delete set null,
  account_id uuid references public.accounts(id) on delete set null,
  receipt_path text,
  is_exported boolean not null default false,
  export_id uuid references public.exports(id) on delete set null,
  created_at timestamptz default now(),
  constraint expenses_currency_upper check (char_length(currency)=3 and currency = upper(currency))
);

create index if not exists expenses_user_date_idx on public.expenses(user_id, occurred_on desc);
create index if not exists expenses_user_export_idx on public.expenses(user_id, is_exported);

create table if not exists public.exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  file_path text not null,
  total_amount numeric(14,2) not null default 0,
  currency text not null default 'AUD',
  items_count integer not null default 0,
  created_at timestamptz default now()
);

create table if not exists public.export_items (
  export_id uuid not null references public.exports(id) on delete cascade,
  expense_id uuid not null references public.expenses(id) on delete cascade,
  primary key (export_id, expense_id)
);

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.accounts  enable row level security;
alter table public.expenses  enable row level security;
alter table public.exports   enable row level security;
alter table public.export_items enable row level security;

create policy "profiles self select" on public.profiles for select using (id = auth.uid());
create policy "profiles self upsert" on public.profiles for insert with check (id = auth.uid());
create policy "profiles self update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "categories owner all" on public.categories for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "accounts owner all" on public.accounts  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "expenses owner all"  on public.expenses  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "exports owner all"   on public.exports   for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "export_items owner all" on public.export_items for all using (
  exists (select 1 from public.exports e where e.id = export_items.export_id and e.user_id = auth.uid())
) with check (
  exists (select 1 from public.exports e where e.id = export_items.export_id and e.user_id = auth.uid())
);

-- Buckets (create in Dashboard or run below lines once):
-- select storage.create_bucket('receipts', true, false);
-- select storage.create_bucket('exports',  true, false);

create policy if not exists "receipts owner read" on storage.objects for select using (bucket_id = 'receipts' and owner_id = auth.uid());
create policy if not exists "receipts owner write" on storage.objects for insert with check (bucket_id = 'receipts' and owner_id = auth.uid());
create policy if not exists "receipts owner upd/del" on storage.objects for update using (bucket_id = 'receipts' and owner_id = auth.uid()) with check (bucket_id = 'receipts' and owner_id = auth.uid());

create policy if not exists "exports owner read" on storage.objects for select using (bucket_id = 'exports' and owner_id = auth.uid());
create policy if not exists "exports owner write" on storage.objects for insert with check (bucket_id = 'exports' and owner_id = auth.uid());
create policy if not exists "exports owner upd/del" on storage.objects for update using (bucket_id = 'exports' and owner_id = auth.uid()) with check (bucket_id = 'exports' and owner_id = auth.uid());