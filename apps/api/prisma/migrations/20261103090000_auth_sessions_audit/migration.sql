-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('active', 'disabled');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "status" "user_status" NOT NULL DEFAULT 'active';

-- CreateTable
CREATE TABLE "credentials" (
    "user_id" UUID NOT NULL,
    "password_hash" TEXT NOT NULL,
    "password_changed_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "credentials_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "previous_token_hash" TEXT,
    "device_name" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked_at" TIMESTAMPTZ,
    "revoked_reason" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "school_id" UUID,
    "actor_user_id" UUID,
    "action" TEXT NOT NULL,
    "target_type" TEXT,
    "target_id" UUID,
    "ip" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_school_id_created_at_idx" ON "audit_logs"("school_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_created_at_idx" ON "audit_logs"("actor_user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Hand-written: constraints, RLS, pre-login lookup functions, grants
-- ---------------------------------------------------------------------------

-- Login identifiers are stored normalised, so lookups are exact matches only.
ALTER TABLE "users"
  ADD CONSTRAINT users_phone_e164 CHECK (phone ~ '^\+[1-9][0-9]{6,14}$'),
  ADD CONSTRAINT users_email_normalised CHECK (email = lower(email) AND email LIKE '%_@_%');

-- credentials and sessions: only the user's own rows.
ALTER TABLE "credentials" ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_credentials ON "credentials"
  USING (user_id = current_app_user_id())
  WITH CHECK (user_id = current_app_user_id());

ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_sessions ON "sessions"
  USING (user_id = current_app_user_id())
  WITH CHECK (user_id = current_app_user_id());

-- schools: a user may also read the schools they are an active member of (for GET /v1/me).
CREATE POLICY member_schools ON "schools"
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM "school_memberships" m
    WHERE m.school_id = "schools".id
      AND m.user_id = current_app_user_id()
      AND m.status = 'active'
  ));

-- audit_logs: append-only. A school context reads its own rows. Global rows (school_id NULL,
-- e.g. logins) are readable by nobody through the app role; the platform path comes in 2B.
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY school_read ON "audit_logs"
  FOR SELECT
  USING (school_id = current_school_id());
CREATE POLICY append ON "audit_logs"
  FOR INSERT
  WITH CHECK (school_id IS NULL OR school_id = current_school_id());
REVOKE UPDATE, DELETE, TRUNCATE ON "audit_logs" FROM school_erp_app;

-- Pre-login lookups. Before login there is no app.user_id, so RLS hides every user and session.
-- Two narrow SECURITY DEFINER functions answer exactly one question each:
-- - owned by school_erp_auth_lookup: NOLOGIN, not a superuser, not the table owner, so RLS
--   always applies to it (as with FORCE ROW LEVEL SECURITY); it can read only the columns below
-- - pinned search_path, every name schema-qualified
-- - exact match only, minimal columns returned
-- - EXECUTE revoked from PUBLIC, granted only to the app role
GRANT USAGE ON SCHEMA public TO school_erp_auth_lookup;
GRANT USAGE ON TYPE public.user_status TO school_erp_auth_lookup;
GRANT SELECT (id, phone, email, status) ON "users" TO school_erp_auth_lookup;
GRANT SELECT (id, user_id) ON "sessions" TO school_erp_auth_lookup;
CREATE POLICY auth_lookup ON "users" FOR SELECT TO school_erp_auth_lookup USING (true);
CREATE POLICY auth_lookup ON "sessions" FOR SELECT TO school_erp_auth_lookup USING (true);

-- Which user signs in with this (already normalised) phone or email?
CREATE FUNCTION public.auth_find_login_user(p_identifier text)
  RETURNS TABLE (user_id uuid, status public.user_status)
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = pg_catalog, pg_temp
  AS $$
    SELECT u.id, u.status
    FROM public.users u
    WHERE u.phone = p_identifier OR u.email = p_identifier
  $$;

-- Which user owns this session? (Refresh tokens are `<session id>.<secret>`.)
CREATE FUNCTION public.auth_find_session_user(p_session_id uuid)
  RETURNS uuid
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = pg_catalog, pg_temp
  AS $$
    SELECT s.user_id FROM public.sessions s WHERE s.id = p_session_id
  $$;

-- A new function owner needs CREATE on the schema; grant it only for the hand-over.
GRANT CREATE ON SCHEMA public TO school_erp_auth_lookup;
ALTER FUNCTION public.auth_find_login_user(text) OWNER TO school_erp_auth_lookup;
ALTER FUNCTION public.auth_find_session_user(uuid) OWNER TO school_erp_auth_lookup;
REVOKE CREATE ON SCHEMA public FROM school_erp_auth_lookup;
REVOKE ALL ON FUNCTION public.auth_find_login_user(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.auth_find_session_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auth_find_login_user(text) TO school_erp_app;
GRANT EXECUTE ON FUNCTION public.auth_find_session_user(uuid) TO school_erp_app;
