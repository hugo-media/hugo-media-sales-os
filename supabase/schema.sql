create extension if not exists "pgcrypto";

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  niche text not null,
  city text not null,
  contact_name text,
  instagram_url text,
  facebook_url text,
  tiktok_url text,
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

alter table public.leads
add column if not exists priority text not null default 'Medium';

alter table public.leads
add column if not exists last_message text not null default '';

alter table public.leads
add column if not exists proposal_sent_date date;

alter table public.leads
add column if not exists tiktok_url text not null default '';

create table if not exists public.lead_candidates (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  niche text not null default '',
  city text not null default '',
  address text not null default '',
  website_url text not null default '',
  instagram_url text not null default '',
  facebook_url text not null default '',
  tiktok_url text not null default '',
  youtube_url text not null default '',
  linkedin_url text not null default '',
  phone text not null default '',
  email text not null default '',
  osm_url text not null default '',
  source text not null default 'OpenStreetMap',
  media_score integer not null default 0,
  media_level text not null default 'No media',
  media_notes text not null default '',
  why_good_for_hugo text not null default '',
  status text not null default 'Candidate',
  created_at date not null default current_date,
  updated_at date not null default current_date
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

create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  value numeric(12, 2) not null default 0,
  description text,
  color text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.statuses (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  color text,
  sort_order integer not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.kpi_targets (
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
create index if not exists lead_candidates_status_idx on public.lead_candidates(status);
create index if not exists lead_candidates_media_score_idx on public.lead_candidates(media_score);
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

drop trigger if exists packages_set_updated_at on public.packages;
create trigger packages_set_updated_at before update on public.packages
for each row execute function public.set_updated_at();

drop trigger if exists statuses_set_updated_at on public.statuses;
create trigger statuses_set_updated_at before update on public.statuses
for each row execute function public.set_updated_at();

drop trigger if exists kpi_targets_set_updated_at on public.kpi_targets;
create trigger kpi_targets_set_updated_at before update on public.kpi_targets
for each row execute function public.set_updated_at();

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.leads to anon, authenticated;
grant select, insert, update, delete on public.lead_candidates to anon, authenticated;
grant select, insert, update, delete on public.tasks to anon, authenticated;
grant select, insert, update, delete on public.content_items to anon, authenticated;
grant select, insert, update, delete on public.templates to anon, authenticated;
grant select, insert, update, delete on public.status_history to anon, authenticated;
grant select, insert, update, delete on public.settings to anon, authenticated;
grant select, insert, update, delete on public.packages to anon, authenticated;
grant select, insert, update, delete on public.statuses to anon, authenticated;
grant select, insert, update, delete on public.kpi_targets to anon, authenticated;

alter table public.leads enable row level security;
alter table public.lead_candidates enable row level security;
alter table public.tasks enable row level security;
alter table public.content_items enable row level security;
alter table public.templates enable row level security;
alter table public.status_history enable row level security;
alter table public.settings enable row level security;
alter table public.packages enable row level security;
alter table public.statuses enable row level security;
alter table public.kpi_targets enable row level security;

drop policy if exists "public_crm_access" on public.leads;
create policy "public_crm_access" on public.leads
for all to anon, authenticated
using (true)
with check (true);

drop policy if exists "public_crm_access" on public.lead_candidates;
create policy "public_crm_access" on public.lead_candidates
for all to anon, authenticated
using (true)
with check (true);

drop policy if exists "public_crm_access" on public.tasks;
create policy "public_crm_access" on public.tasks
for all to anon, authenticated
using (true)
with check (true);

drop policy if exists "public_crm_access" on public.content_items;
create policy "public_crm_access" on public.content_items
for all to anon, authenticated
using (true)
with check (true);

drop policy if exists "public_crm_access" on public.templates;
create policy "public_crm_access" on public.templates
for all to anon, authenticated
using (true)
with check (true);

drop policy if exists "public_crm_access" on public.status_history;
create policy "public_crm_access" on public.status_history
for all to anon, authenticated
using (true)
with check (true);

drop policy if exists "public_crm_access" on public.settings;
create policy "public_crm_access" on public.settings
for all to anon, authenticated
using (true)
with check (true);

drop policy if exists "public_crm_access" on public.packages;
create policy "public_crm_access" on public.packages
for all to anon, authenticated
using (true)
with check (true);

drop policy if exists "public_crm_access" on public.statuses;
create policy "public_crm_access" on public.statuses
for all to anon, authenticated
using (true)
with check (true);

drop policy if exists "public_crm_access" on public.kpi_targets;
create policy "public_crm_access" on public.kpi_targets
for all to anon, authenticated
using (true)
with check (true);
