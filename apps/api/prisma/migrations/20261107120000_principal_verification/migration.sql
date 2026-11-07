-- CreateEnum
CREATE TYPE "platform_role" AS ENUM ('super_admin', 'verifier');

-- CreateEnum
CREATE TYPE "client_app" AS ENUM ('school_app', 'student_app');

-- CreateEnum
CREATE TYPE "otp_purpose" AS ENUM ('principal_registration', 'principal_login', 'parent_login');

-- CreateEnum
CREATE TYPE "verification_status" AS ENUM ('pending', 'approved', 'rejected', 'withdrawn');

-- CreateEnum
CREATE TYPE "audit_category" AS ENUM ('general', 'admin_account', 'branding', 'security');

-- CreateEnum
CREATE TYPE "audit_module" AS ENUM ('auth', 'platform', 'tenancy', 'users', 'academics', 'students', 'staff', 'attendance', 'leave', 'timetable', 'exams', 'homework', 'approvals', 'notices', 'calendar', 'non_teaching', 'imports', 'documents');

-- AlterEnum
ALTER TYPE "school_status" ADD VALUE 'unclaimed';

-- AlterTable
ALTER TABLE "schools" ADD COLUMN     "address_line" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "contact_email" TEXT,
ADD COLUMN     "contact_phone" TEXT,
ADD COLUMN     "logo_file_id" UUID,
ADD COLUMN     "pin_code" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
ADD COLUMN     "updated_by" UUID;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "last_login_at" TIMESTAMPTZ,
ADD COLUMN     "phone_verified_at" TIMESTAMPTZ,
ADD COLUMN     "username" TEXT;

-- AlterTable
ALTER TABLE "credentials" ADD COLUMN     "must_change_password" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "client_app" "client_app";

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "actor_role" TEXT,
ADD COLUMN     "category" "audit_category" NOT NULL DEFAULT 'general',
ADD COLUMN     "module" "audit_module",
ADD COLUMN     "new_value" JSONB,
ADD COLUMN     "old_value" JSONB,
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "session_id" UUID;

-- CreateTable
CREATE TABLE "otp_challenges" (
    "id" UUID NOT NULL,
    "purpose" "otp_purpose" NOT NULL,
    "phone" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "attempts" SMALLINT NOT NULL DEFAULT 0,
    "max_attempts" SMALLINT NOT NULL DEFAULT 5,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "consumed_at" TIMESTAMPTZ,
    "ip" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_verification_requests" (
    "id" UUID NOT NULL,
    "principal_user_id" UUID NOT NULL,
    "school_id" UUID,
    "principal_name" TEXT NOT NULL,
    "proposed_name" TEXT,
    "proposed_address" TEXT,
    "proposed_pin_code" TEXT,
    "status" "verification_status" NOT NULL DEFAULT 'pending',
    "decided_by_user_id" UUID,
    "decided_at" TIMESTAMPTZ,
    "decision_reason" TEXT,
    "previous_request_id" UUID,
    "submitted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "school_verification_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_staff" (
    "user_id" UUID NOT NULL,
    "role" "platform_role" NOT NULL,
    "status" "user_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" UUID,

    CONSTRAINT "platform_staff_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE INDEX "otp_challenges_phone_purpose_created_at_idx" ON "otp_challenges"("phone", "purpose", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "school_verification_requests_previous_request_id_key" ON "school_verification_requests"("previous_request_id");

-- CreateIndex
CREATE INDEX "school_verification_requests_status_submitted_at_idx" ON "school_verification_requests"("status", "submitted_at");

-- CreateIndex
CREATE INDEX "school_verification_requests_principal_user_id_idx" ON "school_verification_requests"("principal_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "svr_one_pending_per_principal" ON "school_verification_requests"("principal_user_id") WHERE (status = 'pending');

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "audit_logs_school_id_module_created_at_idx" ON "audit_logs"("school_id", "module", "created_at");

-- AddForeignKey
ALTER TABLE "school_verification_requests" ADD CONSTRAINT "school_verification_requests_principal_user_id_fkey" FOREIGN KEY ("principal_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_verification_requests" ADD CONSTRAINT "school_verification_requests_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_verification_requests" ADD CONSTRAINT "school_verification_requests_previous_request_id_fkey" FOREIGN KEY ("previous_request_id") REFERENCES "school_verification_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_staff" ADD CONSTRAINT "platform_staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Hand-written: constraints, school codes, RLS, platform path, OTP functions
-- ---------------------------------------------------------------------------

-- School codes: sch0001, sch0002, ... from one global sequence. NOT VALID: checked on every new or
-- changed row; existing demo codes are rewritten by the seed, then a later migration validates.
CREATE SEQUENCE school_code_seq;
ALTER TABLE "schools"
  ADD CONSTRAINT schools_code_format CHECK (code ~ '^sch[0-9]{4,}$') NOT VALID,
  ADD CONSTRAINT schools_pin_code_format CHECK (pin_code ~ '^[1-9][0-9]{5}$');

CREATE FUNCTION next_school_code() RETURNS text
  LANGUAGE sql VOLATILE
  AS $$ SELECT 'sch' || lpad(nextval('school_code_seq')::text, 4, '0') $$;

-- School-issued usernames (slice 3): school code + e/s + number, e.g. sch0001e0001.
ALTER TABLE "users"
  ADD CONSTRAINT users_username_format CHECK (username ~ '^sch[0-9]{4,}[es][0-9]{4,}$');

ALTER TABLE "otp_challenges"
  ADD CONSTRAINT otp_challenges_phone_e164 CHECK (phone ~ '^\+[1-9][0-9]{6,14}$'),
  ADD CONSTRAINT otp_challenges_attempts CHECK (attempts >= 0 AND attempts <= max_attempts);

-- A request names a directory school OR describes an unlisted one (name, address, PIN), never both.
-- Approving an unlisted one creates the school, and the request then points at it.
ALTER TABLE "school_verification_requests"
  ADD CONSTRAINT svr_school_or_proposed CHECK (
    (school_id IS NOT NULL AND proposed_name IS NULL AND proposed_address IS NULL AND proposed_pin_code IS NULL)
    OR (
      proposed_name IS NOT NULL AND proposed_address IS NOT NULL AND proposed_pin_code IS NOT NULL
      AND (school_id IS NULL OR status = 'approved')
    )
  ),
  ADD CONSTRAINT svr_pin_code_format CHECK (proposed_pin_code ~ '^[1-9][0-9]{5}$'),
  ADD CONSTRAINT svr_reject_needs_reason CHECK (status <> 'rejected' OR length(trim(decision_reason)) > 0),
  ADD CONSTRAINT svr_decision_needs_decider CHECK (
    status NOT IN ('approved', 'rejected') OR (decided_by_user_id IS NOT NULL AND decided_at IS NOT NULL)
  ),
  ADD CONSTRAINT svr_not_self_decided CHECK (decided_by_user_id IS NULL OR decided_by_user_id <> principal_user_id);

-- Platform context, set transaction-locally by withPlatformContext() after the platform guard.
CREATE FUNCTION current_platform_role() RETURNS platform_role
  LANGUAGE sql STABLE
  AS $$ SELECT nullif(current_setting('app.platform_role', true), '')::platform_role $$;

-- platform_staff: a user reads their own row (the platform guard); Super Admins manage the table.
ALTER TABLE "platform_staff" ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_row ON "platform_staff"
  FOR SELECT
  USING (user_id = current_app_user_id());
CREATE POLICY super_admin ON "platform_staff"
  USING (current_platform_role() = 'super_admin')
  WITH CHECK (current_platform_role() = 'super_admin');

-- school_verification_requests: the principal reads and creates their own; the platform path
-- reads and decides; a school sees only the approved request that made its principal.
ALTER TABLE "school_verification_requests" ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_read ON "school_verification_requests"
  FOR SELECT
  USING (principal_user_id = current_app_user_id());
CREATE POLICY own_submit ON "school_verification_requests"
  FOR INSERT
  WITH CHECK (
    principal_user_id = current_app_user_id()
    AND status = 'pending'
    AND decided_by_user_id IS NULL
    AND decided_at IS NULL
    AND decision_reason IS NULL
  );
CREATE POLICY platform ON "school_verification_requests"
  USING (current_platform_role() IS NOT NULL)
  WITH CHECK (current_platform_role() IS NOT NULL);
CREATE POLICY school_approved ON "school_verification_requests"
  FOR SELECT
  USING (school_id = current_school_id() AND status = 'approved');
REVOKE DELETE, TRUNCATE ON "school_verification_requests" FROM school_erp_app;

-- Platform reach into tenancy tables: read, create and activate schools; add the principal
-- membership; read the principals behind verification requests. Every platform request is audited.
CREATE POLICY platform_read ON "schools"
  FOR SELECT
  USING (current_platform_role() IS NOT NULL);
CREATE POLICY platform_add ON "schools"
  FOR INSERT
  WITH CHECK (current_platform_role() IS NOT NULL);
CREATE POLICY platform_update ON "schools"
  FOR UPDATE
  USING (current_platform_role() IS NOT NULL)
  WITH CHECK (current_platform_role() IS NOT NULL);
CREATE POLICY platform_read ON "school_memberships"
  FOR SELECT
  USING (current_platform_role() IS NOT NULL);
CREATE POLICY platform_add_principal ON "school_memberships"
  FOR INSERT
  WITH CHECK (current_platform_role() IS NOT NULL AND role = 'principal');
CREATE POLICY platform_principals ON "users"
  FOR SELECT
  USING (
    current_platform_role() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM "school_verification_requests" r WHERE r.principal_user_id = "users".id
    )
  );

-- otp_challenges: no access for the app role at all. Two SECURITY DEFINER functions (same rules as
-- the auth migration: owned by school_erp_auth_lookup, pinned search_path, EXECUTE for the app only).
ALTER TABLE "otp_challenges" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "otp_challenges" FROM school_erp_app;
GRANT USAGE ON TYPE public.otp_purpose TO school_erp_auth_lookup;
GRANT SELECT, INSERT, UPDATE ON "otp_challenges" TO school_erp_auth_lookup;
CREATE POLICY auth_lookup ON "otp_challenges" TO school_erp_auth_lookup USING (true) WITH CHECK (true);

-- New challenge for (phone, purpose); any open one for the same pair is consumed (one per login).
CREATE FUNCTION public.auth_otp_issue(
  p_id uuid, p_phone text, p_purpose public.otp_purpose, p_code_hash text, p_ttl_seconds integer, p_ip text
) RETURNS void
  LANGUAGE sql VOLATILE SECURITY DEFINER
  SET search_path = pg_catalog, pg_temp
  AS $$
    UPDATE public.otp_challenges SET consumed_at = now()
    WHERE phone = p_phone AND purpose = p_purpose AND consumed_at IS NULL;
    INSERT INTO public.otp_challenges (id, purpose, phone, code_hash, expires_at, ip)
    VALUES (p_id, p_purpose, p_phone, p_code_hash, now() + make_interval(secs => p_ttl_seconds), p_ip);
  $$;

-- Checks a code against the newest open challenge for the phone and any of the purposes.
-- Returns ok | wrong | expired | locked | none. Every check counts as an attempt; ok consumes it.
CREATE FUNCTION public.auth_otp_verify(
  p_phone text, p_purposes public.otp_purpose[], p_code_hash text
) RETURNS text
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = pg_catalog, pg_temp
  AS $$
    DECLARE
      c record;
    BEGIN
      SELECT id, code_hash, attempts, max_attempts, expires_at INTO c
      FROM public.otp_challenges
      WHERE phone = p_phone AND purpose = ANY (p_purposes) AND consumed_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
      FOR UPDATE;
      IF NOT FOUND THEN
        RETURN 'none';
      END IF;
      IF c.expires_at <= now() THEN
        RETURN 'expired';
      END IF;
      IF c.attempts >= c.max_attempts THEN
        RETURN 'locked';
      END IF;
      IF c.code_hash = p_code_hash THEN
        UPDATE public.otp_challenges SET attempts = attempts + 1, consumed_at = now() WHERE id = c.id;
        RETURN 'ok';
      END IF;
      UPDATE public.otp_challenges SET attempts = attempts + 1 WHERE id = c.id;
      RETURN CASE WHEN c.attempts + 1 >= c.max_attempts THEN 'locked' ELSE 'wrong' END;
    END
  $$;

-- School directory for principals who are not members yet: name or PIN search over schools that
-- are not suspended, returning only public directory fields. Keyset pagination on (name, id).
GRANT SELECT (id, name, code, city, pin_code, status) ON "schools" TO school_erp_auth_lookup;
GRANT USAGE ON TYPE public.school_status TO school_erp_auth_lookup;
CREATE POLICY auth_lookup ON "schools" FOR SELECT TO school_erp_auth_lookup USING (true);

CREATE FUNCTION public.directory_search_schools(
  p_query text, p_after_name text, p_after_id uuid, p_limit integer
) RETURNS TABLE (id uuid, name text, code text, city text, pin_code text)
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = pg_catalog, pg_temp
  AS $$
    SELECT s.id, s.name, s.code, s.city, s.pin_code
    FROM public.schools s
    WHERE s.status <> 'suspended'
      AND (s.name ILIKE '%' || p_query || '%' ESCAPE '\' OR s.pin_code = p_query)
      AND (p_after_name IS NULL OR (s.name, s.id) > (p_after_name, p_after_id))
    ORDER BY s.name, s.id
    LIMIT least(greatest(p_limit, 1), 50)
  $$;

GRANT CREATE ON SCHEMA public TO school_erp_auth_lookup;
ALTER FUNCTION public.auth_otp_issue(uuid, text, public.otp_purpose, text, integer, text) OWNER TO school_erp_auth_lookup;
ALTER FUNCTION public.auth_otp_verify(text, public.otp_purpose[], text) OWNER TO school_erp_auth_lookup;
ALTER FUNCTION public.directory_search_schools(text, text, uuid, integer) OWNER TO school_erp_auth_lookup;
REVOKE CREATE ON SCHEMA public FROM school_erp_auth_lookup;
REVOKE ALL ON FUNCTION public.auth_otp_issue(uuid, text, public.otp_purpose, text, integer, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.auth_otp_verify(text, public.otp_purpose[], text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.directory_search_schools(text, text, uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auth_otp_issue(uuid, text, public.otp_purpose, text, integer, text) TO school_erp_app;
GRANT EXECUTE ON FUNCTION public.auth_otp_verify(text, public.otp_purpose[], text) TO school_erp_app;
GRANT EXECUTE ON FUNCTION public.directory_search_schools(text, text, uuid, integer) TO school_erp_app;
