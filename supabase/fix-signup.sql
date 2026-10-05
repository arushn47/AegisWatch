-- ============================================================================
-- AegisWatch — signup recovery: re-deploy the NEWUSER bootstrap trigger
-- ============================================================================
-- Paste this whole file into Supabase Dashboard → SQL Editor → Run.
--
-- What it fixes
--   * Replaces fn_handle_new_user with the version that uses `ON CONFLICT
--     DO NOTHING` (no target) so it never fails even when user_profiles has
--     no unique index on id.
--   * Every inner insert is wrapped in its own BEGIN/EXCEPTION so a profile
--     or preference failure NEVER rolls back the auth.users insert. Without
--     this, any error in the trigger produces the "Database error saving new
--     user" screen you are seeing.
--   * Re-creates the trigger so the new function is actually wired up.
--
-- Safe to re-run: every statement is idempotent (CREATE OR REPLACE /
-- DROP TRIGGER IF EXISTS).
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Replace the bootstrap function
-- ---------------------------------------------------------------------------
create or replace function public.fn_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Profile bootstrap. ON CONFLICT DO NOTHING with no target works regardless
  -- of which unique/PK constraint user_profiles actually has, so a hand-created
  -- table without a unique index on id cannot break signup.
  begin
    insert into public.user_profiles (id, email, full_name, avatar_url)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data ->> 'full_name',
               new.raw_user_meta_data ->> 'name'),
      new.raw_user_meta_data ->> 'avatar_url'
    )
    on conflict do nothing;
  exception when others then
    raise warning 'AegisWatch: profile bootstrap failed for user % -> % (%)',
      new.id, sqlerrm, sqlstate;
  end;

  -- Default alert preference: watch everywhere, every hazard type, HIGH+,
  -- in-app on. Wrapped so a preference failure cannot abort signup.
  begin
    insert into public.alert_preferences (
      user_id, location_id, disaster_types, min_severity,
      in_app_enabled, push_enabled
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

-- ---------------------------------------------------------------------------
-- 2. Recreate the trigger so it points at the new function
-- ---------------------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.fn_handle_new_user();

-- ---------------------------------------------------------------------------
-- 3. Smoke test — should return one row with the NEW function body
-- ---------------------------------------------------------------------------
-- If this returns the ON CONFLICT DO NOTHING form, signup will work.
-- If it still shows ON CONFLICT (id) DO UPDATE, something is caching the old
-- definition and you should refresh the dashboard and re-run this file.
select
  pg_get_functiondef(oid) as function_body
from pg_proc
where proname = 'fn_handle_new_user'
  and pronamespace = 'public'::regnamespace;

commit;

-- ============================================================================
-- Next: sign up again from the app. If it still fails, run this diagnostic
-- in the same SQL editor and paste the output back:
--
--   select * from pg_trigger t
--   join pg_proc p on p.oid = t.tgfoid
--   where t.tgrelid = 'auth.users'::regclass
--     and t.tgname = 'on_auth_user_created';
--
-- That tells you exactly which function OID the trigger is pointing at.
-- ============================================================================
