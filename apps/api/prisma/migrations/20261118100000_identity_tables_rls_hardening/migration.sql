-- Phase 2, Slice 1: global identity tables are never writable from a school context.
--
-- Root cause (Phase 0 audit R1): `visible_users` on users had no FOR clause and no WITH CHECK, so its
-- read rule ("you, or a member of the current school") also allowed UPDATE and DELETE; the app role
-- held table-wide UPDATE and DELETE through the default privileges. A school context could therefore
-- rewrite the phone (OTP login identity) of a user who is also principal of another school, or try to
-- delete them. `own_credentials` and `own_sessions` (FOR ALL) had the same shape: any context that
-- carried app.user_id, including a school context, could rewrite that user's password hash or tokens.
--
-- Fix: split each policy by command. Reads keep exactly the approved scope. Writes need a user context
-- (app.user_id) AND no school context (app.school_id unset). No policy covers DELETE, and DELETE and
-- TRUNCATE are revoked. On users, UPDATE is limited to non-identity columns; phone, email, username and
-- status change only through future narrow, audited paths (none exist yet). No SECURITY DEFINER code.
-- Every function and table in these policies is schema-qualified (rule for policies evaluated inside
-- the pre-login SECURITY DEFINER functions, which run with search_path = pg_catalog).

-- users -------------------------------------------------------------------------------------------
DROP POLICY visible_users ON public.users;

CREATE POLICY users_read ON public.users
  FOR SELECT
  USING (
    id = public.current_app_user_id()
    OR EXISTS (
      SELECT 1 FROM public.school_memberships m
      WHERE m.user_id = users.id AND m.school_id = public.current_school_id()
    )
  );

CREATE POLICY users_insert_self ON public.users
  FOR INSERT
  WITH CHECK (id = public.current_app_user_id() AND public.current_school_id() IS NULL);

CREATE POLICY users_update_self ON public.users
  FOR UPDATE
  USING (id = public.current_app_user_id() AND public.current_school_id() IS NULL)
  WITH CHECK (id = public.current_app_user_id() AND public.current_school_id() IS NULL);

REVOKE DELETE, TRUNCATE ON public.users FROM school_erp_app;
REVOKE UPDATE ON public.users FROM school_erp_app;
GRANT UPDATE (full_name, phone_verified_at, last_login_at, updated_at) ON public.users TO school_erp_app;

-- credentials -------------------------------------------------------------------------------------
DROP POLICY own_credentials ON public.credentials;

CREATE POLICY credentials_read_own ON public.credentials
  FOR SELECT
  USING (user_id = public.current_app_user_id() AND public.current_school_id() IS NULL);

CREATE POLICY credentials_insert_own ON public.credentials
  FOR INSERT
  WITH CHECK (user_id = public.current_app_user_id() AND public.current_school_id() IS NULL);

CREATE POLICY credentials_update_own ON public.credentials
  FOR UPDATE
  USING (user_id = public.current_app_user_id() AND public.current_school_id() IS NULL)
  WITH CHECK (user_id = public.current_app_user_id() AND public.current_school_id() IS NULL);

REVOKE DELETE, TRUNCATE ON public.credentials FROM school_erp_app;

-- sessions ----------------------------------------------------------------------------------------
DROP POLICY own_sessions ON public.sessions;

CREATE POLICY sessions_read_own ON public.sessions
  FOR SELECT
  USING (user_id = public.current_app_user_id() AND public.current_school_id() IS NULL);

CREATE POLICY sessions_insert_own ON public.sessions
  FOR INSERT
  WITH CHECK (user_id = public.current_app_user_id() AND public.current_school_id() IS NULL);

CREATE POLICY sessions_update_own ON public.sessions
  FOR UPDATE
  USING (user_id = public.current_app_user_id() AND public.current_school_id() IS NULL)
  WITH CHECK (user_id = public.current_app_user_id() AND public.current_school_id() IS NULL);

REVOKE DELETE, TRUNCATE ON public.sessions FROM school_erp_app;
