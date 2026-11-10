-- ============================================================
--  HASHAAVA / IHRA — FULL SCHEMA
--  Paste this entire file into Supabase SQL Editor and Run.
--  Safe to run more than once (idempotent).
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1. Applications table
-- ------------------------------------------------------------
create table if not exists public.applications (
  id                  uuid primary key default gen_random_uuid(),
  first_name          text        not null,
  middle_name         text,
  last_name           text        not null,
  dob                 date        not null,
  gender              text,
  country             text        not null,
  country_code        text,
  email               text        not null,
  phone               text        not null,
  ip                  text,
  language            text        not null default 'en',
  face_verified       boolean     not null default false,
  status              text        not null default 'approved_pending_email',
  email_sent          boolean     not null default false,
  email_sent_at       timestamptz,
  email_error         text,
  email_attempts      int         not null default 0,
  scheduled_send_at   timestamptz not null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. Visits table (IP tracking)
-- ------------------------------------------------------------
create table if not exists public.visits (
  id           uuid primary key default gen_random_uuid(),
  ip           text,
  country      text,
  country_code text,
  language     text not null default 'en',
  user_agent   text,
  created_at   timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3. Constraints
-- ------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'applications_email_format') then
    alter table public.applications
      add constraint applications_email_format
      check (email ~* '^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$');
  end if;

  if not exists (select 1 from pg_constraint where conname = 'applications_status_check') then
    alter table public.applications
      add constraint applications_status_check
      check (status in ('approved_pending_email','emailed','failed','cancelled'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'applications_language_check') then
    alter table public.applications
      add constraint applications_language_check
      check (language in ('en','he','ar','es','fr','de','ru','pl','pt','it'));
  end if;
end
$$;

-- ------------------------------------------------------------
-- 4. Indexes
-- ------------------------------------------------------------
create index if not exists idx_applications_pending_email
  on public.applications (scheduled_send_at)
  where email_sent = false;

create index if not exists idx_applications_email
  on public.applications (email);

create index if not exists idx_applications_country
  on public.applications (country);

create index if not exists idx_applications_created_at
  on public.applications (created_at desc);

create index if not exists idx_visits_created_at
  on public.visits (created_at desc);

create index if not exists idx_visits_ip
  on public.visits (ip);

create index if not exists idx_visits_country_code
  on public.visits (country_code);

-- ------------------------------------------------------------
-- 5. Auto-update updated_at
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_applications_updated_at on public.applications;
create trigger trg_applications_updated_at
  before update on public.applications
  for each row
  execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 6. RLS — locked down (backend uses service_role key)
-- ------------------------------------------------------------
alter table public.applications enable row level security;
alter table public.visits enable row level security;

-- ------------------------------------------------------------
-- 7. Views
-- ------------------------------------------------------------
create or replace view public.v_pending_emails as
select
  id, email, language, country, scheduled_send_at, email_attempts,
  greatest(0, extract(epoch from (scheduled_send_at - now()))::int) as seconds_remaining
from public.applications
where email_sent = false
  and status = 'approved_pending_email';

create or replace view public.v_email_stats as
select
  language, country,
  count(*)                                            as total,
  count(*) filter (where email_sent)                  as sent,
  count(*) filter (where not email_sent)              as pending,
  count(*) filter (where status = 'failed')           as failed,
  max(created_at)                                     as last_created
from public.applications
group by language, country
order by total desc;

create or replace view public.v_visits_summary as
select
  coalesce(country_code, '??')                        as country_code,
  coalesce(country, 'Unknown')                        as country,
  count(*)                                            as total_visits,
  count(*) filter (where created_at > now() - interval '24 hours') as last_24h,
  max(created_at)                                     as last_visit
from public.visits
group by country_code, country
order by total_visits desc;

-- ------------------------------------------------------------
-- 8. RPC — atomic "claim due emails"
-- ------------------------------------------------------------
create or replace function public.claim_due_emails(batch_limit int default 15)
returns setof public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed_ids uuid[];
begin
  with due as (
    select id from public.applications
    where email_sent = false
      and status = 'approved_pending_email'
      and scheduled_send_at <= now()
    order by scheduled_send_at asc
    limit batch_limit
    for update skip locked
  )
  update public.applications a
    set email_attempts = a.email_attempts + 1
    from due
    where a.id = due.id
    returning a.id into claimed_ids;

  return query
    select * from public.applications
    where id = any(claimed_ids)
    order by scheduled_send_at asc;
end;
$$;

revoke all on function public.claim_due_emails(int) from public;
revoke all on function public.claim_due_emails(int) from anon, authenticated;

-- ------------------------------------------------------------
-- 9. Sanity check
-- ------------------------------------------------------------
select
  (select count(*) from public.applications)     as total_applications,
  (select count(*) from public.visits)           as total_visits,
  (select count(*) from public.v_pending_emails) as pending_emails;
