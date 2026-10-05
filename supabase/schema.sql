-- ============================================================================
-- AegisWatch — Supabase schema for the notification workflow
-- ============================================================================
-- How to apply:
--   Supabase Dashboard → SQL Editor → New query → paste this whole file → Run.
--   Safe to re-run: every statement is idempotent (IF NOT EXISTS / OR REPLACE /
--   DROP TRIGGER IF EXISTS). It will not clobber an existing `user_profiles`
--   table — missing columns are added with ALTER TABLE ... ADD COLUMN IF NOT
--   EXISTS.
--
-- What this file creates
--   1. user_profiles      – application profile mirroring auth.users
--   2. saved_locations    – places a user watches
--   3. alert_preferences  – per-location rules (types, radius, min severity)
--   4. disaster_events    – normalised hazard events ingested from live feeds
--   5. notifications      – generated alerts (in-app now, push later)
--   6. push_subscriptions – Web Push endpoints for the next phase
--   7. Triggers           – auto-create profile on signup + fan out
--                           notifications when a relevant event appears
--   8. RLS policies       – users can only ever read/write their own rows
--   9. Realtime           – notifications/disaster_events stream to the client
--
-- Design constraints honoured (docs/Rules.md):
--   RULE 1.1 — risk/severity is fully deterministic. Severity is assigned by
--              the feed adapters (magnitude / wind speed thresholds) and is
--              only ever compared here, never inferred by a model.
--   PRD §12  — spam prevention: per-user dedupe keys, a 30-minute cooldown,
--              grouping per disaster event, a 12-hour freshness gate, and a
--              HIGH-severity default so a new account is not buried in noise.
--
-- NOTE: the docs describe a Java/Spring Boot backend. This project's real
-- backend is Supabase, so Postgres is authoritative here.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Extensions & helpers
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto;  -- gen_random_uuid() on older PG

-- Deterministic severity ordering used for min-severity comparisons.
create or replace function public.fn_severity_rank(sev text)
returns int
language sql
immutable
as $$
  select case upper(coalesce(sev, ''))
    when 'CRITICAL' then 4
    when 'HIGH'     then 3
    when 'MEDIUM'   then 2
    when 'LOW'      then 1
    else 0
  end;
$$;

-- Great-circle distance in km. Pure arithmetic so the schema does not depend
-- on PostGIS being enabled; deterministic and stable for RLS/trigger use.
create or replace function public.fn_haversine_km(
  lat1 double precision,
  lon1 double precision,
  lat2 double precision,
  lon2 double precision
)
returns double precision
language sql
immutable
as $$
  select 2 * 6371.0 * asin(
    sqrt(
      power(sin(radians(lat2 - lat1) / 2), 2) +
      cos(radians(lat1)) * cos(radians(lat2)) *
      power(sin(radians(lon2 - lon1) / 2), 2)
    )
  );
$$;

-- Shared updated_at maintenance.
create or replace function public.fn_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. user_profiles
-- ---------------------------------------------------------------------------
create table if not exists public.user_profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text unique,
  full_name   text,
  avatar_url  text,
  role        text not null default 'user',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Align an already-existing `user_profiles` table (e.g. created by hand).
alter table public.user_profiles add column if not exists email      text;
alter table public.user_profiles add column if not exists full_name  text;
alter table public.user_profiles add column if not exists avatar_url text;
alter table public.user_profiles add column if not exists role       text default 'user';
alter table public.user_profiles add column if not exists created_at timestamptz default now();
alter table public.user_profiles add column if not exists updated_at timestamptz default now();

create index if not exists user_profiles_email_idx on public.user_profiles (email);

-- A hand-created user_profiles table may lack a unique key on id, which would
-- break `ON CONFLICT (id)` and, by extension, the signup trigger.
do $$
begin
  if not exists (
    select 1
    from pg_index i
    join pg_class t on t.oid = i.indrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'user_profiles'
      and i.indisunique
      and i.indnatts = 1
      and (
        select a.attname
        from pg_attribute a
        where a.attrelid = t.oid and a.attnum = i.indkey[0]
      ) = 'id'
  ) then
    begin
      create unique index if not exists user_profiles_id_uidx
        on public.user_profiles (id);
    exception when unique_violation then
      raise warning 'AegisWatch: user_profiles(id) has duplicates - skipped unique index.';
    end;
  end if;
end $$;

-- Timestamp columns need defaults, otherwise a NOT NULL created_at would
-- reject the signup trigger's insert.
do $$
declare
  r record;
begin
  for r in
    select * from (values
      ('user_profiles',      'created_at', 'now()'),
      ('user_profiles',      'updated_at', 'now()'),
      ('user_profiles',      'role',       quote_literal('user')),
      ('alert_preferences',  'created_at', 'now()'),
      ('alert_preferences',  'updated_at', 'now()')
    ) as t(tbl, col, def)
  loop
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = r.tbl and column_name = r.col
    ) then
      begin
        execute format(
          'alter table public.%I alter column %I set default %s',
          r.tbl, r.col, r.def
        );
      exception when others then
        raise warning 'AegisWatch: could not set default on %.%: %', r.tbl, r.col, sqlerrm;
      end;
    end if;
  end loop;
end $$;

alter table public.user_profiles enable row level security;

drop policy if exists "Profiles are viewable by owner" on public.user_profiles;
create policy "Profiles are viewable by owner"
  on public.user_profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Profiles are updatable by owner" on public.user_profiles;
create policy "Profiles are updatable by owner"
  on public.user_profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop trigger if exists trg_user_profiles_updated_at on public.user_profiles;
create trigger trg_user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.fn_set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. saved_locations
-- ---------------------------------------------------------------------------
create table if not exists public.saved_locations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  label       text not null,
  latitude    double precision not null check (latitude between -90 and 90),
  longitude   double precision not null check (longitude between -180 and 180),
  is_primary  boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists saved_locations_user_idx on public.saved_locations (user_id);

alter table public.saved_locations enable row level security;

drop policy if exists "Saved locations are managed by owner" on public.saved_locations;
create policy "Saved locations are managed by owner"
  on public.saved_locations for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 3. alert_preferences
-- ---------------------------------------------------------------------------
-- `location_id IS NULL` means "watch everywhere" (a global preference).
-- `disaster_types = '{}'` means "all hazard categories".
create table if not exists public.alert_preferences (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  location_id      uuid references public.saved_locations (id) on delete cascade,
  disaster_types   text[] not null default '{}',
  radius_km        integer not null default 500 check (radius_km between 1 and 20000),
  min_severity     text not null default 'MEDIUM'
                     check (min_severity in ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  in_app_enabled   boolean not null default true,
  push_enabled     boolean not null default false,
  email_enabled    boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists alert_preferences_user_idx on public.alert_preferences (user_id);

-- One global row per user + one row per saved location (NULLs are distinct in
-- a plain UNIQUE constraint, so use partial indexes instead).
create unique index if not exists alert_preferences_global_uidx
  on public.alert_preferences (user_id) where location_id is null;
create unique index if not exists alert_preferences_location_uidx
  on public.alert_preferences (user_id, location_id) where location_id is not null;

alter table public.alert_preferences enable row level security;

drop policy if exists "Alert preferences are managed by owner" on public.alert_preferences;
create policy "Alert preferences are managed by owner"
  on public.alert_preferences for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists trg_alert_preferences_updated_at on public.alert_preferences;
create trigger trg_alert_preferences_updated_at
  before update on public.alert_preferences
  for each row execute function public.fn_set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. disaster_events
-- ---------------------------------------------------------------------------
-- Normalised mirror of events fetched from USGS / NASA EONET / GDACS /
-- ReliefWeb. `id` is the upstream id (e.g. 'usgs-abc123') so ingestion is
-- idempotent. Publicly readable so the dashboard can render from the DB.
create table if not exists public.disaster_events (
  id             text primary key,
  type           text not null,
  title          text not null,
  location_name  text,
  region         text,
  latitude       double precision not null check (latitude between -90 and 90),
  longitude      double precision not null check (longitude between -180 and 180),
  severity       text not null default 'LOW'
                   check (severity in ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  status         text not null default 'ACTIVE'
                   check (status in ('ACTIVE', 'MONITORED', 'CONTAINED', 'RESOLVED')),
  summary        text,
  primary_source text,
  external_url   text,
  metrics        jsonb not null default '{}'::jsonb,
  source_feed    text,
  occurred_at    timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists disaster_events_occurred_idx on public.disaster_events (occurred_at desc);
create index if not exists disaster_events_type_idx     on public.disaster_events (type);
create index if not exists disaster_events_severity_idx on public.disaster_events (severity);

alter table public.disaster_events enable row level security;

-- Hazard data is public information — anyone may read it.
drop policy if exists "Disaster events are publicly readable" on public.disaster_events;
create policy "Disaster events are publicly readable"
  on public.disaster_events for select
  to anon, authenticated
  using (true);

drop trigger if exists trg_disaster_events_updated_at on public.disaster_events;
create trigger trg_disaster_events_updated_at
  before update on public.disaster_events
  for each row execute function public.fn_set_updated_at();

-- ---------------------------------------------------------------------------
-- 5. notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  disaster_event_id text references public.disaster_events (id) on delete cascade,
  risk_level        text,
  title             text not null,
  body              text,
  is_read           boolean not null default false,
  channel           text not null default 'in_app'
                      check (channel in ('in_app', 'web_push', 'email')),
  -- Grouping + dedupe key: "<event_id>:<severity>:<status>". A severity
  -- escalation produces a new key (so it still notifies) while repeats of the
  -- same state are silently dropped.
  dedupe_key        text,
  created_at        timestamptz not null default now(),
  read_at           timestamptz
);

create unique index if not exists notifications_user_dedupe_uidx
  on public.notifications (user_id, dedupe_key);
create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx
  on public.notifications (user_id) where is_read = false;

alter table public.notifications enable row level security;

drop policy if exists "Notifications are readable by owner" on public.notifications;
create policy "Notifications are readable by owner"
  on public.notifications for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Notifications are updatable by owner" on public.notifications;
create policy "Notifications are updatable by owner"
  on public.notifications for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Notifications are deletable by owner" on public.notifications;
create policy "Notifications are deletable by owner"
  on public.notifications for delete
  to authenticated
  using (auth.uid() = user_id);

-- No INSERT policy: notifications are only ever created by the SECURITY
-- DEFINER trigger below, never by a client.

-- ---------------------------------------------------------------------------
-- 6. push_subscriptions  (Web Push — wired up in the next phase)
-- ---------------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  endpoint     text not null unique,
  p256dh       text not null,
  auth         text not null,
  user_agent   text,
  created_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Push subscriptions are managed by owner" on public.push_subscriptions;
create policy "Push subscriptions are managed by owner"
  on public.push_subscriptions for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 7. New-user bootstrap
-- ---------------------------------------------------------------------------
-- Runs for both email/password and Google OAuth signups.
-- IMPORTANT: every insert is wrapped in an exception handler. A failure here
-- must never roll back the auth.users insert, or signup breaks app-wide with
-- "Database error saving new user".
create or replace function public.fn_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    insert into public.user_profiles (id, email, full_name, avatar_url)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
      new.raw_user_meta_data ->> 'avatar_url'
    )
    -- Deliberately targetless: valid whatever unique/PK constraint exists.
    on conflict do nothing;
  exception when others then
    raise warning 'AegisWatch: profile bootstrap failed for user % -> % (%)',
      new.id, sqlerrm, sqlstate;
  end;

  -- Give every new account a sensible high-signal default: watch everywhere,
  -- every hazard category, HIGH and above, in-app delivery on. Users can
  -- widen this in Settings; defaulting to HIGH keeps the bell meaningful
  -- instead of echoing every minor event on the planet.
  begin
    insert into public.alert_preferences (
      user_id, location_id, disaster_types, min_severity, in_app_enabled, push_enabled
    )
    select new.id, null, '{}'::text[], 'HIGH', true, false
    where not exists (
      select 1 from public.alert_preferences ap
      where ap.user_id = new.id and ap.location_id is null
    );
  exception when others then
    raise warning 'AegisWatch: default alert preference failed for user % -> % (%)',
      new.id, sqlerrm, sqlstate;
  end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.fn_handle_new_user();

-- ---------------------------------------------------------------------------
-- 8. Notification fan-out
-- ---------------------------------------------------------------------------
-- Creates a notification for every user whose alert_preferences match the
-- incoming event. Deterministic matching only:
--   * hazard category membership
--   * min_severity threshold
--   * distance from a saved location (when the preference is location-bound)
--   * 30-minute per-event cooldown + dedupe key
--   * 12-hour freshness gate on insert
create or replace function public.fn_notify_disaster_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cooldown   constant interval := interval '30 minutes';
  v_rank_new   int;
  v_rank_old   int;
  v_dedupe     text;
  v_pref       record;
  v_distance   double precision;
begin
  v_rank_new := public.fn_severity_rank(new.severity);

  -- On update, only speak up when something material changed. This is what
  -- keeps the 60-second ingestion poll from spamming everyone.
  if tg_op = 'UPDATE' then
    v_rank_old := public.fn_severity_rank(old.severity);
    if v_rank_new <= v_rank_old
       and new.status is not distinct from old.status
       and new.summary is not distinct from old.summary then
      return new;
    end if;
  end if;

  -- Freshness gate: the first ingestion run backfills the whole live feed,
  -- which can be hundreds of historical rows. Only announce events that
  -- actually occurred recently so a new account is not buried in stale alerts.
  -- Severity escalations on existing events still notify (see UPDATE branch).
  if tg_op = 'INSERT' and new.occurred_at < now() - interval '12 hours' then
    return new;
  end if;

  v_dedupe := new.id || ':' || upper(coalesce(new.severity, 'UNKNOWN')) || ':' || upper(coalesce(new.status, 'ACTIVE'));

  for v_pref in
    select ap.user_id,
           ap.location_id,
           ap.disaster_types,
           ap.radius_km,
           ap.min_severity
    from public.alert_preferences ap
    where ap.in_app_enabled
      and public.fn_severity_rank(ap.min_severity) <= v_rank_new
      and (
        ap.disaster_types is null
        or cardinality(ap.disaster_types) = 0
        or new.type = any (ap.disaster_types)
      )
  loop
    -- Location gate: a NULL location_id means "watch globally".
    if v_pref.location_id is not null then
      select public.fn_haversine_km(sl.latitude, sl.longitude, new.latitude, new.longitude)
        into v_distance
      from public.saved_locations sl
      where sl.id = v_pref.location_id;

      if v_distance is null or v_distance > coalesce(v_pref.radius_km, 500) then
        continue;
      end if;
    end if;

    -- Cooldown: skip if this user was already told about this event recently.
    if exists (
      select 1 from public.notifications n
      where n.user_id = v_pref.user_id
        and n.disaster_event_id = new.id
        and n.created_at > now() - v_cooldown
    ) then
      continue;
    end if;

    insert into public.notifications (user_id, disaster_event_id, risk_level, title, body, dedupe_key)
    values (
      v_pref.user_id,
      new.id,
      new.severity,
      'AEGIS WATCH: ' || new.type || ' — ' || coalesce(new.location_name, new.title),
      coalesce(new.summary, '') ||
        case when new.region is not null and new.region <> '' then ' (' || new.region || ')' else '' end,
      v_dedupe
    )
    on conflict (user_id, dedupe_key) do nothing;
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_notify_disaster_event on public.disaster_events;
create trigger trg_notify_disaster_event
  after insert or update on public.disaster_events
  for each row execute function public.fn_notify_disaster_event();

-- ---------------------------------------------------------------------------
-- 9. Ingestion RPC
-- ---------------------------------------------------------------------------
-- The dashboard fetches live feeds in the browser every 60s. It forwards the
-- normalised events here so the DB trigger can generate notifications.
-- SECURITY DEFINER because clients hold no direct write grant on
-- disaster_events (notifications must only ever be produced by the trigger).
--
-- Expected payload (array):
--   [{ "id": "usgs-abc", "type": "EARTHQUAKE", "title": "...",
--      "locationName": "...", "region": "...", "coordinates": [lat, lng],
--      "severity": "HIGH", "status": "ACTIVE", "summary": "...",
--      "primarySource": "USGS Real-Time Feed", "externalUrl": "...",
--      "metrics": {...}, "sourceFeed": "usgs",
--      "timestamp": "2026-10-02T10:00:00Z" }, ...]
create or replace function public.ingest_disaster_events(p_events jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
begin
  if p_events is null or jsonb_typeof(p_events) <> 'array' then
    return 0;
  end if;

  insert into public.disaster_events (
    id, type, title, location_name, region,
    latitude, longitude, severity, status, summary,
    primary_source, external_url, metrics, source_feed, occurred_at
  )
  select
    e ->> 'id',
    upper(coalesce(e ->> 'type', 'UNKNOWN')),
    coalesce(e ->> 'title', 'Untitled event'),
    e ->> 'locationName',
    e ->> 'region',
    (e -> 'coordinates' ->> 0)::double precision,
    (e -> 'coordinates' ->> 1)::double precision,
    upper(coalesce(e ->> 'severity', 'LOW')),
    upper(coalesce(e ->> 'status', 'ACTIVE')),
    e ->> 'summary',
    e ->> 'primarySource',
    e ->> 'externalUrl',
    coalesce(e -> 'metrics', '{}'::jsonb),
    coalesce(e ->> 'sourceFeed', e ->> 'primarySource', 'unknown'),
    coalesce(nullif(e ->> 'timestamp', '')::timestamptz, now())
  from jsonb_array_elements(p_events) as e
  where e ->> 'id' is not null
    and e -> 'coordinates' ->> 0 is not null
    and e -> 'coordinates' ->> 1 is not null
  on conflict (id) do update set
    type           = excluded.type,
    title          = excluded.title,
    location_name  = excluded.location_name,
    region         = excluded.region,
    latitude       = excluded.latitude,
    longitude      = excluded.longitude,
    severity       = excluded.severity,
    status         = excluded.status,
    summary        = excluded.summary,
    primary_source = excluded.primary_source,
    external_url   = excluded.external_url,
    metrics        = excluded.metrics,
    source_feed    = excluded.source_feed,
    occurred_at    = excluded.occurred_at;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- 10. Convenience RPCs for the client
-- ---------------------------------------------------------------------------
create or replace function public.mark_all_notifications_read()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
begin
  update public.notifications
     set is_read = true,
         read_at = now()
   where user_id = auth.uid()
     and is_read = false;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Upsert the current user's global alert preference in one call.
create or replace function public.upsert_global_alert_preference(
  p_disaster_types text[] default '{}',
  p_min_severity   text  default 'MEDIUM',
  p_radius_km      integer default 500,
  p_in_app_enabled boolean default true,
  p_push_enabled   boolean default false
)
returns public.alert_preferences
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.alert_preferences;
begin
  insert into public.alert_preferences (
    user_id, location_id, disaster_types, min_severity, radius_km,
    in_app_enabled, push_enabled
  )
  values (
    auth.uid(), null, coalesce(p_disaster_types, '{}'), upper(coalesce(p_min_severity, 'MEDIUM')),
    coalesce(p_radius_km, 500), coalesce(p_in_app_enabled, true), coalesce(p_push_enabled, false)
  )
  on conflict do nothing;

  update public.alert_preferences
     set disaster_types = coalesce(p_disaster_types, disaster_types),
         min_severity   = upper(coalesce(p_min_severity, min_severity)),
         radius_km      = coalesce(p_radius_km, radius_km),
         in_app_enabled = coalesce(p_in_app_enabled, in_app_enabled),
         push_enabled   = coalesce(p_push_enabled, push_enabled)
   where user_id = auth.uid()
     and location_id is null
  returning * into v_row;

  return v_row;
end;
$$;

-- ---------------------------------------------------------------------------
-- 11. Grants
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select on public.disaster_events to anon, authenticated;

grant select, update, delete on public.notifications to authenticated;
grant select, insert, update, delete on public.user_profiles      to authenticated;
grant select, insert, update, delete on public.saved_locations    to authenticated;
grant select, insert, update, delete on public.alert_preferences  to authenticated;
grant select, insert, update, delete on public.push_subscriptions to authenticated;

grant execute on function public.ingest_disaster_events(jsonb)        to anon, authenticated;
grant execute on function public.mark_all_notifications_read()        to authenticated;
grant execute on function public.upsert_global_alert_preference(text[], text, integer, boolean, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- 12. Realtime
-- ---------------------------------------------------------------------------
-- Streams new/mutated rows to subscribed clients so notifications appear
-- in-app instantly without polling.
do $$
declare
  v_all_tables boolean;
  v_tbl        text;
begin
  select puballtables into v_all_tables
  from pg_publication
  where pubname = 'supabase_realtime';

  if not found then
    raise notice 'Publication supabase_realtime not found — enable Realtime in the dashboard instead.';
    return;
  end if;

  -- A FOR ALL TABLES publication already streams everything.
  if v_all_tables then
    return;
  end if;

  foreach v_tbl in array array['notifications', 'disaster_events'] loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = v_tbl
    ) then
      execute format('alter publication supabase_realtime add table public.%I', v_tbl);
    end if;
  end loop;
end $$;

-- Full row payloads so UPDATE events (e.g. is_read = true) carry every column.
alter table public.notifications      replica identity full;
alter table public.disaster_events    replica identity full;

-- ============================================================================
-- Done. Next steps in the app:
--   * The dashboard calls `ingest_disaster_events(<events>)` after each poll.
--   * The notification bell subscribes to `notifications` over Realtime.
--   * Set Realtime enabled for `notifications` in Dashboard → Database →
--     Replication if your project overrides the publication.
-- ============================================================================
