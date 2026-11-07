-- Policies on users and schools call current_platform_role(). When they are checked inside the
-- pre-login SECURITY DEFINER functions (search_path = pg_catalog), an unqualified type name does
-- not resolve, so every pre-login lookup failed. Schema-qualify every name in these helpers.
CREATE OR REPLACE FUNCTION current_platform_role() RETURNS public.platform_role
  LANGUAGE sql STABLE
  AS $$ SELECT nullif(pg_catalog.current_setting('app.platform_role', true), '')::public.platform_role $$;

CREATE OR REPLACE FUNCTION next_school_code() RETURNS text
  LANGUAGE sql VOLATILE
  AS $$ SELECT 'sch' || pg_catalog.lpad(pg_catalog.nextval('public.school_code_seq')::text, 4, '0') $$;
