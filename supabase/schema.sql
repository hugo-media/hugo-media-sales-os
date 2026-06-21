create extension if not exists "pgcrypto";

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  niche text not null,
  city text not null,
  contact_name text,
  instagram_url text,
  facebook_url text,
  website_url text,
  phone text,
  email text,
  contact_channel text,
  weak_point text,
  offer_angle text,
  status text not null default 'Новий',
  package_interest text,
  deal_value numeric(12, 2) not null default 0,
  first_contact_date date,
  last_contact_date date,
  follow_up_date date,
  next_action text,
  source text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type text not null check (type in ('outreach', 'follow_up', 'call', 'proposal', 'content', 'shoot', 'admin')),
  related_lead_id uuid references public.leads(id) on delete set null,
  due_date date,
  status text not null default 'To do' check (status in ('To do', 'In progress', 'Done', 'Cancelled')),
  priority text not null default 'Medium' check (priority in ('Low', 'Medium', 'High')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  topic text not null,
  hook text,
  key_points text,
  cta text,
  target_niche text,
  status text not null default 'Ідея',
  platform text not null default 'Instagram',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.status_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  status text not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_status_idx on public.leads(status);
create index if not exists leads_follow_up_date_idx on public.leads(follow_up_date);
create index if not exists leads_niche_idx on public.leads(niche);
create index if not exists leads_city_idx on public.leads(city);
create index if not exists tasks_related_lead_id_idx on public.tasks(related_lead_id);
create index if not exists tasks_due_date_idx on public.tasks(due_date);
create index if not exists status_history_lead_id_idx on public.status_history(lead_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at before update on public.leads
for each row execute function public.set_updated_at();

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at before update on public.tasks
for each row execute function public.set_updated_at();

drop trigger if exists content_items_set_updated_at on public.content_items;
create trigger content_items_set_updated_at before update on public.content_items
for each row execute function public.set_updated_at();

drop trigger if exists templates_set_updated_at on public.templates;
create trigger templates_set_updated_at before update on public.templates
for each row execute function public.set_updated_at();

drop trigger if exists settings_set_updated_at on public.settings;
create trigger settings_set_updated_at before update on public.settings
for each row execute function public.set_updated_at();
