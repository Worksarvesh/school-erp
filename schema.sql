--
-- PostgreSQL database dump
--

\restrict 1uXQ8OFEbzYcaUNzfpqwwJ4Vu7LeITcEn65WfgSOXOjVhce6wvd46Up9bddbOBC

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: school_erp_owner
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO school_erp_owner;

--
-- Name: audit_category; Type: TYPE; Schema: public; Owner: school_erp_owner
--

CREATE TYPE public.audit_category AS ENUM (
    'general',
    'admin_account',
    'branding',
    'security'
);


ALTER TYPE public.audit_category OWNER TO school_erp_owner;

--
-- Name: audit_module; Type: TYPE; Schema: public; Owner: school_erp_owner
--

CREATE TYPE public.audit_module AS ENUM (
    'auth',
    'platform',
    'tenancy',
    'users',
    'academics',
    'students',
    'staff',
    'attendance',
    'leave',
    'timetable',
    'exams',
    'homework',
    'approvals',
    'notices',
    'calendar',
    'non_teaching',
    'imports',
    'documents'
);


ALTER TYPE public.audit_module OWNER TO school_erp_owner;

--
-- Name: client_app; Type: TYPE; Schema: public; Owner: school_erp_owner
--

CREATE TYPE public.client_app AS ENUM (
    'school_app',
    'student_app'
);


ALTER TYPE public.client_app OWNER TO school_erp_owner;

--
-- Name: membership_status; Type: TYPE; Schema: public; Owner: school_erp_owner
--

CREATE TYPE public.membership_status AS ENUM (
    'invited',
    'active',
    'suspended',
    'revoked'
);


ALTER TYPE public.membership_status OWNER TO school_erp_owner;

--
-- Name: otp_purpose; Type: TYPE; Schema: public; Owner: school_erp_owner
--

CREATE TYPE public.otp_purpose AS ENUM (
    'principal_registration',
    'principal_login',
    'parent_login'
);


ALTER TYPE public.otp_purpose OWNER TO school_erp_owner;

--
-- Name: platform_role; Type: TYPE; Schema: public; Owner: school_erp_owner
--

CREATE TYPE public.platform_role AS ENUM (
    'super_admin',
    'verifier'
);


ALTER TYPE public.platform_role OWNER TO school_erp_owner;

--
-- Name: role; Type: TYPE; Schema: public; Owner: school_erp_owner
--

CREATE TYPE public.role AS ENUM (
    'principal',
    'school_admin',
    'vice_principal',
    'teacher',
    'non_teaching_staff',
    'office_clerk',
    'accountant',
    'student',
    'parent',
    'other_staff'
);


ALTER TYPE public.role OWNER TO school_erp_owner;

--
-- Name: school_status; Type: TYPE; Schema: public; Owner: school_erp_owner
--

CREATE TYPE public.school_status AS ENUM (
    'active',
    'suspended',
    'unclaimed'
);


ALTER TYPE public.school_status OWNER TO school_erp_owner;

--
-- Name: user_status; Type: TYPE; Schema: public; Owner: school_erp_owner
--

CREATE TYPE public.user_status AS ENUM (
    'active',
    'disabled'
);


ALTER TYPE public.user_status OWNER TO school_erp_owner;

--
-- Name: verification_status; Type: TYPE; Schema: public; Owner: school_erp_owner
--

CREATE TYPE public.verification_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'withdrawn'
);


ALTER TYPE public.verification_status OWNER TO school_erp_owner;

--
-- Name: audit_logs_append_only(); Type: FUNCTION; Schema: public; Owner: school_erp_owner
--

CREATE FUNCTION public.audit_logs_append_only() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN RAISE EXCEPTION 'audit_logs is append-only'; END $$;


ALTER FUNCTION public.audit_logs_append_only() OWNER TO school_erp_owner;

--
-- Name: auth_find_login_user(text); Type: FUNCTION; Schema: public; Owner: school_erp_auth_lookup
--

CREATE FUNCTION public.auth_find_login_user(p_identifier text) RETURNS TABLE(user_id uuid, status public.user_status)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'pg_temp'
    AS $$
    SELECT u.id, u.status
    FROM public.users u
    WHERE u.phone = p_identifier OR u.email = p_identifier
  $$;


ALTER FUNCTION public.auth_find_login_user(p_identifier text) OWNER TO school_erp_auth_lookup;

--
-- Name: auth_find_session_user(uuid); Type: FUNCTION; Schema: public; Owner: school_erp_auth_lookup
--

CREATE FUNCTION public.auth_find_session_user(p_session_id uuid) RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'pg_temp'
    AS $$
    SELECT s.user_id FROM public.sessions s WHERE s.id = p_session_id
  $$;


ALTER FUNCTION public.auth_find_session_user(p_session_id uuid) OWNER TO school_erp_auth_lookup;

--
-- Name: auth_otp_issue(uuid, text, public.otp_purpose, text, integer, text); Type: FUNCTION; Schema: public; Owner: school_erp_auth_lookup
--

CREATE FUNCTION public.auth_otp_issue(p_id uuid, p_phone text, p_purpose public.otp_purpose, p_code_hash text, p_ttl_seconds integer, p_ip text) RETURNS void
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'pg_temp'
    AS $$
    UPDATE public.otp_challenges SET consumed_at = now()
    WHERE phone = p_phone AND purpose = p_purpose AND consumed_at IS NULL;
    INSERT INTO public.otp_challenges (id, purpose, phone, code_hash, expires_at, ip)
    VALUES (p_id, p_purpose, p_phone, p_code_hash, now() + make_interval(secs => p_ttl_seconds), p_ip);
  $$;


ALTER FUNCTION public.auth_otp_issue(p_id uuid, p_phone text, p_purpose public.otp_purpose, p_code_hash text, p_ttl_seconds integer, p_ip text) OWNER TO school_erp_auth_lookup;

--
-- Name: auth_otp_verify(text, public.otp_purpose[], text); Type: FUNCTION; Schema: public; Owner: school_erp_auth_lookup
--

CREATE FUNCTION public.auth_otp_verify(p_phone text, p_purposes public.otp_purpose[], p_code_hash text) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'pg_temp'
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


ALTER FUNCTION public.auth_otp_verify(p_phone text, p_purposes public.otp_purpose[], p_code_hash text) OWNER TO school_erp_auth_lookup;

--
-- Name: current_app_user_id(); Type: FUNCTION; Schema: public; Owner: school_erp_owner
--

CREATE FUNCTION public.current_app_user_id() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$ SELECT nullif(current_setting('app.user_id', true), '')::uuid $$;


ALTER FUNCTION public.current_app_user_id() OWNER TO school_erp_owner;

--
-- Name: current_platform_role(); Type: FUNCTION; Schema: public; Owner: school_erp_owner
--

CREATE FUNCTION public.current_platform_role() RETURNS public.platform_role
    LANGUAGE sql STABLE
    AS $$ SELECT nullif(pg_catalog.current_setting('app.platform_role', true), '')::public.platform_role $$;


ALTER FUNCTION public.current_platform_role() OWNER TO school_erp_owner;

--
-- Name: current_school_id(); Type: FUNCTION; Schema: public; Owner: school_erp_owner
--

CREATE FUNCTION public.current_school_id() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$ SELECT nullif(current_setting('app.school_id', true), '')::uuid $$;


ALTER FUNCTION public.current_school_id() OWNER TO school_erp_owner;

--
-- Name: directory_search_schools(text, text, uuid, integer); Type: FUNCTION; Schema: public; Owner: school_erp_auth_lookup
--

CREATE FUNCTION public.directory_search_schools(p_query text, p_after_name text, p_after_id uuid, p_limit integer) RETURNS TABLE(id uuid, name text, code text, city text, pin_code text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'pg_temp'
    AS $$
    SELECT s.id, s.name, s.code, s.city, s.pin_code
    FROM public.schools s
    WHERE s.status <> 'suspended'
      AND (s.name ILIKE '%' || p_query || '%' ESCAPE '\' OR s.pin_code = p_query)
      AND (p_after_name IS NULL OR (s.name, s.id) > (p_after_name, p_after_id))
    ORDER BY s.name, s.id
    LIMIT least(greatest(p_limit, 1), 50)
  $$;


ALTER FUNCTION public.directory_search_schools(p_query text, p_after_name text, p_after_id uuid, p_limit integer) OWNER TO school_erp_auth_lookup;

--
-- Name: next_school_code(); Type: FUNCTION; Schema: public; Owner: school_erp_owner
--

CREATE FUNCTION public.next_school_code() RETURNS text
    LANGUAGE sql
    AS $$ SELECT 'sch' || pg_catalog.lpad(pg_catalog.nextval('public.school_code_seq')::text, 4, '0') $$;


ALTER FUNCTION public.next_school_code() OWNER TO school_erp_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: school_erp_owner
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO school_erp_owner;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: school_erp_owner
--

CREATE TABLE public.audit_logs (
    id uuid NOT NULL,
    school_id uuid,
    actor_user_id uuid,
    actor_role text,
    category public.audit_category DEFAULT 'general'::public.audit_category NOT NULL,
    module public.audit_module,
    action text NOT NULL,
    target_type text,
    target_id uuid,
    old_value jsonb,
    new_value jsonb,
    reason text,
    ip text,
    session_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
)
PARTITION BY RANGE (created_at);


ALTER TABLE public.audit_logs OWNER TO school_erp_owner;

--
-- Name: audit_logs_default; Type: TABLE; Schema: public; Owner: school_erp_owner
--

CREATE TABLE public.audit_logs_default (
    id uuid NOT NULL,
    school_id uuid,
    actor_user_id uuid,
    actor_role text,
    category public.audit_category DEFAULT 'general'::public.audit_category NOT NULL,
    module public.audit_module,
    action text NOT NULL,
    target_type text,
    target_id uuid,
    old_value jsonb,
    new_value jsonb,
    reason text,
    ip text,
    session_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs_default OWNER TO school_erp_owner;

--
-- Name: audit_logs_y2026m10; Type: TABLE; Schema: public; Owner: school_erp_owner
--

CREATE TABLE public.audit_logs_y2026m10 (
    id uuid NOT NULL,
    school_id uuid,
    actor_user_id uuid,
    actor_role text,
    category public.audit_category DEFAULT 'general'::public.audit_category NOT NULL,
    module public.audit_module,
    action text NOT NULL,
    target_type text,
    target_id uuid,
    old_value jsonb,
    new_value jsonb,
    reason text,
    ip text,
    session_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs_y2026m10 OWNER TO school_erp_owner;

--
-- Name: audit_logs_y2026m11; Type: TABLE; Schema: public; Owner: school_erp_owner
--

CREATE TABLE public.audit_logs_y2026m11 (
    id uuid NOT NULL,
    school_id uuid,
    actor_user_id uuid,
    actor_role text,
    category public.audit_category DEFAULT 'general'::public.audit_category NOT NULL,
    module public.audit_module,
    action text NOT NULL,
    target_type text,
    target_id uuid,
    old_value jsonb,
    new_value jsonb,
    reason text,
    ip text,
    session_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs_y2026m11 OWNER TO school_erp_owner;

--
-- Name: audit_logs_y2026m12; Type: TABLE; Schema: public; Owner: school_erp_owner
--

CREATE TABLE public.audit_logs_y2026m12 (
    id uuid NOT NULL,
    school_id uuid,
    actor_user_id uuid,
    actor_role text,
    category public.audit_category DEFAULT 'general'::public.audit_category NOT NULL,
    module public.audit_module,
    action text NOT NULL,
    target_type text,
    target_id uuid,
    old_value jsonb,
    new_value jsonb,
    reason text,
    ip text,
    session_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs_y2026m12 OWNER TO school_erp_owner;

--
-- Name: audit_logs_y2027m01; Type: TABLE; Schema: public; Owner: school_erp_owner
--

CREATE TABLE public.audit_logs_y2027m01 (
    id uuid NOT NULL,
    school_id uuid,
    actor_user_id uuid,
    actor_role text,
    category public.audit_category DEFAULT 'general'::public.audit_category NOT NULL,
    module public.audit_module,
    action text NOT NULL,
    target_type text,
    target_id uuid,
    old_value jsonb,
    new_value jsonb,
    reason text,
    ip text,
    session_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs_y2027m01 OWNER TO school_erp_owner;

--
-- Name: audit_logs_y2027m02; Type: TABLE; Schema: public; Owner: school_erp_owner
--

CREATE TABLE public.audit_logs_y2027m02 (
    id uuid NOT NULL,
    school_id uuid,
    actor_user_id uuid,
    actor_role text,
    category public.audit_category DEFAULT 'general'::public.audit_category NOT NULL,
    module public.audit_module,
    action text NOT NULL,
    target_type text,
    target_id uuid,
    old_value jsonb,
    new_value jsonb,
    reason text,
    ip text,
    session_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs_y2027m02 OWNER TO school_erp_owner;

--
-- Name: audit_logs_y2027m03; Type: TABLE; Schema: public; Owner: school_erp_owner
--

CREATE TABLE public.audit_logs_y2027m03 (
    id uuid NOT NULL,
    school_id uuid,
    actor_user_id uuid,
    actor_role text,
    category public.audit_category DEFAULT 'general'::public.audit_category NOT NULL,
    module public.audit_module,
    action text NOT NULL,
    target_type text,
    target_id uuid,
    old_value jsonb,
    new_value jsonb,
    reason text,
    ip text,
    session_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs_y2027m03 OWNER TO school_erp_owner;

--
-- Name: audit_logs_y2027m04; Type: TABLE; Schema: public; Owner: school_erp_owner
--

CREATE TABLE public.audit_logs_y2027m04 (
    id uuid NOT NULL,
    school_id uuid,
    actor_user_id uuid,
    actor_role text,
    category public.audit_category DEFAULT 'general'::public.audit_category NOT NULL,
    module public.audit_module,
    action text NOT NULL,
    target_type text,
    target_id uuid,
    old_value jsonb,
    new_value jsonb,
    reason text,
    ip text,
    session_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs_y2027m04 OWNER TO school_erp_owner;

--
-- Name: audit_logs_y2027m05; Type: TABLE; Schema: public; Owner: school_erp_owner
--

CREATE TABLE public.audit_logs_y2027m05 (
    id uuid NOT NULL,
    school_id uuid,
    actor_user_id uuid,
    actor_role text,
    category public.audit_category DEFAULT 'general'::public.audit_category NOT NULL,
    module public.audit_module,
    action text NOT NULL,
    target_type text,
    target_id uuid,
    old_value jsonb,
    new_value jsonb,
    reason text,
    ip text,
    session_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs_y2027m05 OWNER TO school_erp_owner;

--
-- Name: audit_logs_y2027m06; Type: TABLE; Schema: public; Owner: school_erp_owner
--

CREATE TABLE public.audit_logs_y2027m06 (
    id uuid NOT NULL,
    school_id uuid,
    actor_user_id uuid,
    actor_role text,
    category public.audit_category DEFAULT 'general'::public.audit_category NOT NULL,
    module public.audit_module,
    action text NOT NULL,
    target_type text,
    target_id uuid,
    old_value jsonb,
    new_value jsonb,
    reason text,
    ip text,
    session_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs_y2027m06 OWNER TO school_erp_owner;

--
-- Name: audit_logs_y2027m07; Type: TABLE; Schema: public; Owner: school_erp_owner
--

CREATE TABLE public.audit_logs_y2027m07 (
    id uuid NOT NULL,
    school_id uuid,
    actor_user_id uuid,
    actor_role text,
    category public.audit_category DEFAULT 'general'::public.audit_category NOT NULL,
    module public.audit_module,
    action text NOT NULL,
    target_type text,
    target_id uuid,
    old_value jsonb,
    new_value jsonb,
    reason text,
    ip text,
    session_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs_y2027m07 OWNER TO school_erp_owner;

--
-- Name: audit_logs_y2027m08; Type: TABLE; Schema: public; Owner: school_erp_owner
--

CREATE TABLE public.audit_logs_y2027m08 (
    id uuid NOT NULL,
    school_id uuid,
    actor_user_id uuid,
    actor_role text,
    category public.audit_category DEFAULT 'general'::public.audit_category NOT NULL,
    module public.audit_module,
    action text NOT NULL,
    target_type text,
    target_id uuid,
    old_value jsonb,
    new_value jsonb,
    reason text,
    ip text,
    session_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs_y2027m08 OWNER TO school_erp_owner;

--
-- Name: audit_logs_y2027m09; Type: TABLE; Schema: public; Owner: school_erp_owner
--

CREATE TABLE public.audit_logs_y2027m09 (
    id uuid NOT NULL,
    school_id uuid,
    actor_user_id uuid,
    actor_role text,
    category public.audit_category DEFAULT 'general'::public.audit_category NOT NULL,
    module public.audit_module,
    action text NOT NULL,
    target_type text,
    target_id uuid,
    old_value jsonb,
    new_value jsonb,
    reason text,
    ip text,
    session_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs_y2027m09 OWNER TO school_erp_owner;

--
-- Name: audit_logs_y2027m10; Type: TABLE; Schema: public; Owner: school_erp_owner
--

CREATE TABLE public.audit_logs_y2027m10 (
    id uuid NOT NULL,
    school_id uuid,
    actor_user_id uuid,
    actor_role text,
    category public.audit_category DEFAULT 'general'::public.audit_category NOT NULL,
    module public.audit_module,
    action text NOT NULL,
    target_type text,
    target_id uuid,
    old_value jsonb,
    new_value jsonb,
    reason text,
    ip text,
    session_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs_y2027m10 OWNER TO school_erp_owner;

--
-- Name: audit_logs_y2027m11; Type: TABLE; Schema: public; Owner: school_erp_owner
--

CREATE TABLE public.audit_logs_y2027m11 (
    id uuid NOT NULL,
    school_id uuid,
    actor_user_id uuid,
    actor_role text,
    category public.audit_category DEFAULT 'general'::public.audit_category NOT NULL,
    module public.audit_module,
    action text NOT NULL,
    target_type text,
    target_id uuid,
    old_value jsonb,
    new_value jsonb,
    reason text,
    ip text,
    session_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs_y2027m11 OWNER TO school_erp_owner;

--
-- Name: audit_logs_y2027m12; Type: TABLE; Schema: public; Owner: school_erp_owner
--

CREATE TABLE public.audit_logs_y2027m12 (
    id uuid NOT NULL,
    school_id uuid,
    actor_user_id uuid,
    actor_role text,
    category public.audit_category DEFAULT 'general'::public.audit_category NOT NULL,
    module public.audit_module,
    action text NOT NULL,
    target_type text,
    target_id uuid,
    old_value jsonb,
    new_value jsonb,
    reason text,
    ip text,
    session_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs_y2027m12 OWNER TO school_erp_owner;

--
-- Name: credentials; Type: TABLE; Schema: public; Owner: school_erp_owner
--

CREATE TABLE public.credentials (
    user_id uuid NOT NULL,
    password_hash text NOT NULL,
    password_changed_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    must_change_password boolean DEFAULT false NOT NULL
);


ALTER TABLE public.credentials OWNER TO school_erp_owner;

--
-- Name: otp_challenges; Type: TABLE; Schema: public; Owner: school_erp_owner
--

CREATE TABLE public.otp_challenges (
    id uuid NOT NULL,
    purpose public.otp_purpose NOT NULL,
    phone text NOT NULL,
    code_hash text NOT NULL,
    attempts smallint DEFAULT 0 NOT NULL,
    max_attempts smallint DEFAULT 5 NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    consumed_at timestamp with time zone,
    ip text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT otp_challenges_attempts CHECK (((attempts >= 0) AND (attempts <= max_attempts))),
    CONSTRAINT otp_challenges_phone_e164 CHECK ((phone ~ '^\+[1-9][0-9]{6,14}$'::text))
);


ALTER TABLE public.otp_challenges OWNER TO school_erp_owner;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: school_erp_owner
--

CREATE TABLE public.permissions (
    id uuid NOT NULL,
    key text NOT NULL,
    description text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.permissions OWNER TO school_erp_owner;

--
-- Name: platform_staff; Type: TABLE; Schema: public; Owner: school_erp_owner
--

CREATE TABLE public.platform_staff (
    user_id uuid NOT NULL,
    role public.platform_role NOT NULL,
    status public.user_status DEFAULT 'active'::public.user_status NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    created_by uuid
);


ALTER TABLE public.platform_staff OWNER TO school_erp_owner;

--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: school_erp_owner
--

CREATE TABLE public.role_permissions (
    id uuid NOT NULL,
    role public.role NOT NULL,
    permission_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO school_erp_owner;

--
-- Name: school_code_seq; Type: SEQUENCE; Schema: public; Owner: school_erp_owner
--

CREATE SEQUENCE public.school_code_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.school_code_seq OWNER TO school_erp_owner;

--
-- Name: school_memberships; Type: TABLE; Schema: public; Owner: school_erp_owner
--

CREATE TABLE public.school_memberships (
    id uuid NOT NULL,
    school_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role public.role NOT NULL,
    status public.membership_status DEFAULT 'invited'::public.membership_status NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    created_by uuid
);


ALTER TABLE public.school_memberships OWNER TO school_erp_owner;

--
-- Name: school_verification_requests; Type: TABLE; Schema: public; Owner: school_erp_owner
--

CREATE TABLE public.school_verification_requests (
    id uuid NOT NULL,
    principal_user_id uuid NOT NULL,
    school_id uuid,
    principal_name text NOT NULL,
    proposed_name text,
    proposed_address text,
    proposed_pin_code text,
    status public.verification_status DEFAULT 'pending'::public.verification_status NOT NULL,
    decided_by_user_id uuid,
    decided_at timestamp with time zone,
    decision_reason text,
    previous_request_id uuid,
    submitted_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    CONSTRAINT svr_decision_needs_decider CHECK (((status <> ALL (ARRAY['approved'::public.verification_status, 'rejected'::public.verification_status])) OR ((decided_by_user_id IS NOT NULL) AND (decided_at IS NOT NULL)))),
    CONSTRAINT svr_not_self_decided CHECK (((decided_by_user_id IS NULL) OR (decided_by_user_id <> principal_user_id))),
    CONSTRAINT svr_pin_code_format CHECK ((proposed_pin_code ~ '^[1-9][0-9]{5}$'::text)),
    CONSTRAINT svr_reject_needs_reason CHECK (((status <> 'rejected'::public.verification_status) OR (length(TRIM(BOTH FROM decision_reason)) > 0))),
    CONSTRAINT svr_school_or_proposed CHECK ((((school_id IS NOT NULL) AND (proposed_name IS NULL) AND (proposed_address IS NULL) AND (proposed_pin_code IS NULL)) OR ((proposed_name IS NOT NULL) AND (proposed_address IS NOT NULL) AND (proposed_pin_code IS NOT NULL) AND ((school_id IS NULL) OR (status = 'approved'::public.verification_status)))))
);


ALTER TABLE public.school_verification_requests OWNER TO school_erp_owner;

--
-- Name: schools; Type: TABLE; Schema: public; Owner: school_erp_owner
--

CREATE TABLE public.schools (
    id uuid NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    udise_code text,
    status public.school_status DEFAULT 'active'::public.school_status NOT NULL,
    shard_key smallint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    created_by uuid,
    address_line text,
    city text,
    contact_email text,
    contact_phone text,
    logo_file_id uuid,
    pin_code text,
    state text,
    timezone text DEFAULT 'Asia/Kolkata'::text NOT NULL,
    updated_by uuid,
    CONSTRAINT schools_pin_code_format CHECK ((pin_code ~ '^[1-9][0-9]{5}$'::text))
);


ALTER TABLE public.schools OWNER TO school_erp_owner;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: school_erp_owner
--

CREATE TABLE public.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_hash text NOT NULL,
    previous_token_hash text,
    device_name text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_used_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone,
    revoked_reason text,
    client_app public.client_app
);


ALTER TABLE public.sessions OWNER TO school_erp_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: school_erp_owner
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    full_name text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    email text,
    phone text,
    status public.user_status DEFAULT 'active'::public.user_status NOT NULL,
    last_login_at timestamp with time zone,
    phone_verified_at timestamp with time zone,
    username text,
    CONSTRAINT users_email_normalised CHECK (((email = lower(email)) AND (email ~~ '%_@_%'::text))),
    CONSTRAINT users_phone_e164 CHECK ((phone ~ '^\+[1-9][0-9]{6,14}$'::text)),
    CONSTRAINT users_username_format CHECK ((username ~ '^sch[0-9]{4,}[es][0-9]{4,}$'::text))
);


ALTER TABLE public.users OWNER TO school_erp_owner;

--
-- Name: audit_logs_default; Type: TABLE ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.audit_logs ATTACH PARTITION public.audit_logs_default DEFAULT;


--
-- Name: audit_logs_y2026m10; Type: TABLE ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.audit_logs ATTACH PARTITION public.audit_logs_y2026m10 FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');


--
-- Name: audit_logs_y2026m11; Type: TABLE ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.audit_logs ATTACH PARTITION public.audit_logs_y2026m11 FOR VALUES FROM ('2026-11-01 00:00:00+00') TO ('2026-12-01 00:00:00+00');


--
-- Name: audit_logs_y2026m12; Type: TABLE ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.audit_logs ATTACH PARTITION public.audit_logs_y2026m12 FOR VALUES FROM ('2026-12-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');


--
-- Name: audit_logs_y2027m01; Type: TABLE ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.audit_logs ATTACH PARTITION public.audit_logs_y2027m01 FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2027-02-01 00:00:00+00');


--
-- Name: audit_logs_y2027m02; Type: TABLE ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.audit_logs ATTACH PARTITION public.audit_logs_y2027m02 FOR VALUES FROM ('2027-02-01 00:00:00+00') TO ('2027-03-01 00:00:00+00');


--
-- Name: audit_logs_y2027m03; Type: TABLE ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.audit_logs ATTACH PARTITION public.audit_logs_y2027m03 FOR VALUES FROM ('2027-03-01 00:00:00+00') TO ('2027-04-01 00:00:00+00');


--
-- Name: audit_logs_y2027m04; Type: TABLE ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.audit_logs ATTACH PARTITION public.audit_logs_y2027m04 FOR VALUES FROM ('2027-04-01 00:00:00+00') TO ('2027-05-01 00:00:00+00');


--
-- Name: audit_logs_y2027m05; Type: TABLE ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.audit_logs ATTACH PARTITION public.audit_logs_y2027m05 FOR VALUES FROM ('2027-05-01 00:00:00+00') TO ('2027-06-01 00:00:00+00');


--
-- Name: audit_logs_y2027m06; Type: TABLE ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.audit_logs ATTACH PARTITION public.audit_logs_y2027m06 FOR VALUES FROM ('2027-06-01 00:00:00+00') TO ('2027-07-01 00:00:00+00');


--
-- Name: audit_logs_y2027m07; Type: TABLE ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.audit_logs ATTACH PARTITION public.audit_logs_y2027m07 FOR VALUES FROM ('2027-07-01 00:00:00+00') TO ('2027-08-01 00:00:00+00');


--
-- Name: audit_logs_y2027m08; Type: TABLE ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.audit_logs ATTACH PARTITION public.audit_logs_y2027m08 FOR VALUES FROM ('2027-08-01 00:00:00+00') TO ('2027-09-01 00:00:00+00');


--
-- Name: audit_logs_y2027m09; Type: TABLE ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.audit_logs ATTACH PARTITION public.audit_logs_y2027m09 FOR VALUES FROM ('2027-09-01 00:00:00+00') TO ('2027-10-01 00:00:00+00');


--
-- Name: audit_logs_y2027m10; Type: TABLE ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.audit_logs ATTACH PARTITION public.audit_logs_y2027m10 FOR VALUES FROM ('2027-10-01 00:00:00+00') TO ('2027-11-01 00:00:00+00');


--
-- Name: audit_logs_y2027m11; Type: TABLE ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.audit_logs ATTACH PARTITION public.audit_logs_y2027m11 FOR VALUES FROM ('2027-11-01 00:00:00+00') TO ('2027-12-01 00:00:00+00');


--
-- Name: audit_logs_y2027m12; Type: TABLE ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.audit_logs ATTACH PARTITION public.audit_logs_y2027m12 FOR VALUES FROM ('2027-12-01 00:00:00+00') TO ('2028-01-01 00:00:00+00');


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id, created_at);


--
-- Name: audit_logs_default audit_logs_default_pkey; Type: CONSTRAINT; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.audit_logs_default
    ADD CONSTRAINT audit_logs_default_pkey PRIMARY KEY (id, created_at);


--
-- Name: audit_logs_y2026m10 audit_logs_y2026m10_pkey; Type: CONSTRAINT; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.audit_logs_y2026m10
    ADD CONSTRAINT audit_logs_y2026m10_pkey PRIMARY KEY (id, created_at);


--
-- Name: audit_logs_y2026m11 audit_logs_y2026m11_pkey; Type: CONSTRAINT; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.audit_logs_y2026m11
    ADD CONSTRAINT audit_logs_y2026m11_pkey PRIMARY KEY (id, created_at);


--
-- Name: audit_logs_y2026m12 audit_logs_y2026m12_pkey; Type: CONSTRAINT; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.audit_logs_y2026m12
    ADD CONSTRAINT audit_logs_y2026m12_pkey PRIMARY KEY (id, created_at);


--
-- Name: audit_logs_y2027m01 audit_logs_y2027m01_pkey; Type: CONSTRAINT; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.audit_logs_y2027m01
    ADD CONSTRAINT audit_logs_y2027m01_pkey PRIMARY KEY (id, created_at);


--
-- Name: audit_logs_y2027m02 audit_logs_y2027m02_pkey; Type: CONSTRAINT; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.audit_logs_y2027m02
    ADD CONSTRAINT audit_logs_y2027m02_pkey PRIMARY KEY (id, created_at);


--
-- Name: audit_logs_y2027m03 audit_logs_y2027m03_pkey; Type: CONSTRAINT; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.audit_logs_y2027m03
    ADD CONSTRAINT audit_logs_y2027m03_pkey PRIMARY KEY (id, created_at);


--
-- Name: audit_logs_y2027m04 audit_logs_y2027m04_pkey; Type: CONSTRAINT; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.audit_logs_y2027m04
    ADD CONSTRAINT audit_logs_y2027m04_pkey PRIMARY KEY (id, created_at);


--
-- Name: audit_logs_y2027m05 audit_logs_y2027m05_pkey; Type: CONSTRAINT; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.audit_logs_y2027m05
    ADD CONSTRAINT audit_logs_y2027m05_pkey PRIMARY KEY (id, created_at);


--
-- Name: audit_logs_y2027m06 audit_logs_y2027m06_pkey; Type: CONSTRAINT; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.audit_logs_y2027m06
    ADD CONSTRAINT audit_logs_y2027m06_pkey PRIMARY KEY (id, created_at);


--
-- Name: audit_logs_y2027m07 audit_logs_y2027m07_pkey; Type: CONSTRAINT; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.audit_logs_y2027m07
    ADD CONSTRAINT audit_logs_y2027m07_pkey PRIMARY KEY (id, created_at);


--
-- Name: audit_logs_y2027m08 audit_logs_y2027m08_pkey; Type: CONSTRAINT; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.audit_logs_y2027m08
    ADD CONSTRAINT audit_logs_y2027m08_pkey PRIMARY KEY (id, created_at);


--
-- Name: audit_logs_y2027m09 audit_logs_y2027m09_pkey; Type: CONSTRAINT; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.audit_logs_y2027m09
    ADD CONSTRAINT audit_logs_y2027m09_pkey PRIMARY KEY (id, created_at);


--
-- Name: audit_logs_y2027m10 audit_logs_y2027m10_pkey; Type: CONSTRAINT; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.audit_logs_y2027m10
    ADD CONSTRAINT audit_logs_y2027m10_pkey PRIMARY KEY (id, created_at);


--
-- Name: audit_logs_y2027m11 audit_logs_y2027m11_pkey; Type: CONSTRAINT; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.audit_logs_y2027m11
    ADD CONSTRAINT audit_logs_y2027m11_pkey PRIMARY KEY (id, created_at);


--
-- Name: audit_logs_y2027m12 audit_logs_y2027m12_pkey; Type: CONSTRAINT; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.audit_logs_y2027m12
    ADD CONSTRAINT audit_logs_y2027m12_pkey PRIMARY KEY (id, created_at);


--
-- Name: credentials credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.credentials
    ADD CONSTRAINT credentials_pkey PRIMARY KEY (user_id);


--
-- Name: otp_challenges otp_challenges_pkey; Type: CONSTRAINT; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.otp_challenges
    ADD CONSTRAINT otp_challenges_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: platform_staff platform_staff_pkey; Type: CONSTRAINT; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.platform_staff
    ADD CONSTRAINT platform_staff_pkey PRIMARY KEY (user_id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: school_memberships school_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.school_memberships
    ADD CONSTRAINT school_memberships_pkey PRIMARY KEY (id);


--
-- Name: school_verification_requests school_verification_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.school_verification_requests
    ADD CONSTRAINT school_verification_requests_pkey PRIMARY KEY (id);


--
-- Name: schools schools_code_format; Type: CHECK CONSTRAINT; Schema: public; Owner: school_erp_owner
--

ALTER TABLE public.schools
    ADD CONSTRAINT schools_code_format CHECK ((code ~ '^sch[0-9]{4,}$'::text)) NOT VALID;


--
-- Name: schools schools_pkey; Type: CONSTRAINT; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.schools
    ADD CONSTRAINT schools_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_actor_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_actor_user_id_created_at_idx ON ONLY public.audit_logs USING btree (actor_user_id, created_at);


--
-- Name: audit_logs_default_actor_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_default_actor_user_id_created_at_idx ON public.audit_logs_default USING btree (actor_user_id, created_at);


--
-- Name: audit_logs_school_id_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_school_id_created_at_idx ON ONLY public.audit_logs USING btree (school_id, created_at);


--
-- Name: audit_logs_default_school_id_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_default_school_id_created_at_idx ON public.audit_logs_default USING btree (school_id, created_at);


--
-- Name: audit_logs_school_id_module_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_school_id_module_created_at_idx ON ONLY public.audit_logs USING btree (school_id, module, created_at);


--
-- Name: audit_logs_default_school_id_module_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_default_school_id_module_created_at_idx ON public.audit_logs_default USING btree (school_id, module, created_at);


--
-- Name: audit_logs_y2026m10_actor_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2026m10_actor_user_id_created_at_idx ON public.audit_logs_y2026m10 USING btree (actor_user_id, created_at);


--
-- Name: audit_logs_y2026m10_school_id_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2026m10_school_id_created_at_idx ON public.audit_logs_y2026m10 USING btree (school_id, created_at);


--
-- Name: audit_logs_y2026m10_school_id_module_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2026m10_school_id_module_created_at_idx ON public.audit_logs_y2026m10 USING btree (school_id, module, created_at);


--
-- Name: audit_logs_y2026m11_actor_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2026m11_actor_user_id_created_at_idx ON public.audit_logs_y2026m11 USING btree (actor_user_id, created_at);


--
-- Name: audit_logs_y2026m11_school_id_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2026m11_school_id_created_at_idx ON public.audit_logs_y2026m11 USING btree (school_id, created_at);


--
-- Name: audit_logs_y2026m11_school_id_module_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2026m11_school_id_module_created_at_idx ON public.audit_logs_y2026m11 USING btree (school_id, module, created_at);


--
-- Name: audit_logs_y2026m12_actor_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2026m12_actor_user_id_created_at_idx ON public.audit_logs_y2026m12 USING btree (actor_user_id, created_at);


--
-- Name: audit_logs_y2026m12_school_id_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2026m12_school_id_created_at_idx ON public.audit_logs_y2026m12 USING btree (school_id, created_at);


--
-- Name: audit_logs_y2026m12_school_id_module_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2026m12_school_id_module_created_at_idx ON public.audit_logs_y2026m12 USING btree (school_id, module, created_at);


--
-- Name: audit_logs_y2027m01_actor_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2027m01_actor_user_id_created_at_idx ON public.audit_logs_y2027m01 USING btree (actor_user_id, created_at);


--
-- Name: audit_logs_y2027m01_school_id_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2027m01_school_id_created_at_idx ON public.audit_logs_y2027m01 USING btree (school_id, created_at);


--
-- Name: audit_logs_y2027m01_school_id_module_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2027m01_school_id_module_created_at_idx ON public.audit_logs_y2027m01 USING btree (school_id, module, created_at);


--
-- Name: audit_logs_y2027m02_actor_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2027m02_actor_user_id_created_at_idx ON public.audit_logs_y2027m02 USING btree (actor_user_id, created_at);


--
-- Name: audit_logs_y2027m02_school_id_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2027m02_school_id_created_at_idx ON public.audit_logs_y2027m02 USING btree (school_id, created_at);


--
-- Name: audit_logs_y2027m02_school_id_module_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2027m02_school_id_module_created_at_idx ON public.audit_logs_y2027m02 USING btree (school_id, module, created_at);


--
-- Name: audit_logs_y2027m03_actor_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2027m03_actor_user_id_created_at_idx ON public.audit_logs_y2027m03 USING btree (actor_user_id, created_at);


--
-- Name: audit_logs_y2027m03_school_id_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2027m03_school_id_created_at_idx ON public.audit_logs_y2027m03 USING btree (school_id, created_at);


--
-- Name: audit_logs_y2027m03_school_id_module_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2027m03_school_id_module_created_at_idx ON public.audit_logs_y2027m03 USING btree (school_id, module, created_at);


--
-- Name: audit_logs_y2027m04_actor_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2027m04_actor_user_id_created_at_idx ON public.audit_logs_y2027m04 USING btree (actor_user_id, created_at);


--
-- Name: audit_logs_y2027m04_school_id_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2027m04_school_id_created_at_idx ON public.audit_logs_y2027m04 USING btree (school_id, created_at);


--
-- Name: audit_logs_y2027m04_school_id_module_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2027m04_school_id_module_created_at_idx ON public.audit_logs_y2027m04 USING btree (school_id, module, created_at);


--
-- Name: audit_logs_y2027m05_actor_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2027m05_actor_user_id_created_at_idx ON public.audit_logs_y2027m05 USING btree (actor_user_id, created_at);


--
-- Name: audit_logs_y2027m05_school_id_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2027m05_school_id_created_at_idx ON public.audit_logs_y2027m05 USING btree (school_id, created_at);


--
-- Name: audit_logs_y2027m05_school_id_module_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2027m05_school_id_module_created_at_idx ON public.audit_logs_y2027m05 USING btree (school_id, module, created_at);


--
-- Name: audit_logs_y2027m06_actor_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2027m06_actor_user_id_created_at_idx ON public.audit_logs_y2027m06 USING btree (actor_user_id, created_at);


--
-- Name: audit_logs_y2027m06_school_id_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2027m06_school_id_created_at_idx ON public.audit_logs_y2027m06 USING btree (school_id, created_at);


--
-- Name: audit_logs_y2027m06_school_id_module_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2027m06_school_id_module_created_at_idx ON public.audit_logs_y2027m06 USING btree (school_id, module, created_at);


--
-- Name: audit_logs_y2027m07_actor_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2027m07_actor_user_id_created_at_idx ON public.audit_logs_y2027m07 USING btree (actor_user_id, created_at);


--
-- Name: audit_logs_y2027m07_school_id_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2027m07_school_id_created_at_idx ON public.audit_logs_y2027m07 USING btree (school_id, created_at);


--
-- Name: audit_logs_y2027m07_school_id_module_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2027m07_school_id_module_created_at_idx ON public.audit_logs_y2027m07 USING btree (school_id, module, created_at);


--
-- Name: audit_logs_y2027m08_actor_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2027m08_actor_user_id_created_at_idx ON public.audit_logs_y2027m08 USING btree (actor_user_id, created_at);


--
-- Name: audit_logs_y2027m08_school_id_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2027m08_school_id_created_at_idx ON public.audit_logs_y2027m08 USING btree (school_id, created_at);


--
-- Name: audit_logs_y2027m08_school_id_module_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2027m08_school_id_module_created_at_idx ON public.audit_logs_y2027m08 USING btree (school_id, module, created_at);


--
-- Name: audit_logs_y2027m09_actor_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2027m09_actor_user_id_created_at_idx ON public.audit_logs_y2027m09 USING btree (actor_user_id, created_at);


--
-- Name: audit_logs_y2027m09_school_id_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2027m09_school_id_created_at_idx ON public.audit_logs_y2027m09 USING btree (school_id, created_at);


--
-- Name: audit_logs_y2027m09_school_id_module_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2027m09_school_id_module_created_at_idx ON public.audit_logs_y2027m09 USING btree (school_id, module, created_at);


--
-- Name: audit_logs_y2027m10_actor_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2027m10_actor_user_id_created_at_idx ON public.audit_logs_y2027m10 USING btree (actor_user_id, created_at);


--
-- Name: audit_logs_y2027m10_school_id_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2027m10_school_id_created_at_idx ON public.audit_logs_y2027m10 USING btree (school_id, created_at);


--
-- Name: audit_logs_y2027m10_school_id_module_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2027m10_school_id_module_created_at_idx ON public.audit_logs_y2027m10 USING btree (school_id, module, created_at);


--
-- Name: audit_logs_y2027m11_actor_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2027m11_actor_user_id_created_at_idx ON public.audit_logs_y2027m11 USING btree (actor_user_id, created_at);


--
-- Name: audit_logs_y2027m11_school_id_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2027m11_school_id_created_at_idx ON public.audit_logs_y2027m11 USING btree (school_id, created_at);


--
-- Name: audit_logs_y2027m11_school_id_module_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2027m11_school_id_module_created_at_idx ON public.audit_logs_y2027m11 USING btree (school_id, module, created_at);


--
-- Name: audit_logs_y2027m12_actor_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2027m12_actor_user_id_created_at_idx ON public.audit_logs_y2027m12 USING btree (actor_user_id, created_at);


--
-- Name: audit_logs_y2027m12_school_id_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2027m12_school_id_created_at_idx ON public.audit_logs_y2027m12 USING btree (school_id, created_at);


--
-- Name: audit_logs_y2027m12_school_id_module_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX audit_logs_y2027m12_school_id_module_created_at_idx ON public.audit_logs_y2027m12 USING btree (school_id, module, created_at);


--
-- Name: otp_challenges_phone_purpose_created_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX otp_challenges_phone_purpose_created_at_idx ON public.otp_challenges USING btree (phone, purpose, created_at);


--
-- Name: permissions_key_key; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE UNIQUE INDEX permissions_key_key ON public.permissions USING btree (key);


--
-- Name: role_permissions_role_permission_id_key; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE UNIQUE INDEX role_permissions_role_permission_id_key ON public.role_permissions USING btree (role, permission_id);


--
-- Name: school_memberships_school_id_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX school_memberships_school_id_idx ON public.school_memberships USING btree (school_id);


--
-- Name: school_memberships_user_id_school_id_role_key; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE UNIQUE INDEX school_memberships_user_id_school_id_role_key ON public.school_memberships USING btree (user_id, school_id, role);


--
-- Name: school_verification_requests_previous_request_id_key; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE UNIQUE INDEX school_verification_requests_previous_request_id_key ON public.school_verification_requests USING btree (previous_request_id);


--
-- Name: school_verification_requests_principal_user_id_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX school_verification_requests_principal_user_id_idx ON public.school_verification_requests USING btree (principal_user_id);


--
-- Name: school_verification_requests_status_submitted_at_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX school_verification_requests_status_submitted_at_idx ON public.school_verification_requests USING btree (status, submitted_at);


--
-- Name: schools_code_key; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE UNIQUE INDEX schools_code_key ON public.schools USING btree (code);


--
-- Name: schools_udise_code_key; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE UNIQUE INDEX schools_udise_code_key ON public.schools USING btree (udise_code);


--
-- Name: sessions_token_hash_key; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE UNIQUE INDEX sessions_token_hash_key ON public.sessions USING btree (token_hash);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE INDEX sessions_user_id_idx ON public.sessions USING btree (user_id);


--
-- Name: svr_one_pending_per_principal; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE UNIQUE INDEX svr_one_pending_per_principal ON public.school_verification_requests USING btree (principal_user_id) WHERE (status = 'pending'::public.verification_status);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_phone_key; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE UNIQUE INDEX users_phone_key ON public.users USING btree (phone);


--
-- Name: users_username_key; Type: INDEX; Schema: public; Owner: school_erp_owner
--

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);


--
-- Name: audit_logs_default_actor_user_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_actor_user_id_created_at_idx ATTACH PARTITION public.audit_logs_default_actor_user_id_created_at_idx;


--
-- Name: audit_logs_default_pkey; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_pkey ATTACH PARTITION public.audit_logs_default_pkey;


--
-- Name: audit_logs_default_school_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_school_id_created_at_idx ATTACH PARTITION public.audit_logs_default_school_id_created_at_idx;


--
-- Name: audit_logs_default_school_id_module_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_school_id_module_created_at_idx ATTACH PARTITION public.audit_logs_default_school_id_module_created_at_idx;


--
-- Name: audit_logs_y2026m10_actor_user_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_actor_user_id_created_at_idx ATTACH PARTITION public.audit_logs_y2026m10_actor_user_id_created_at_idx;


--
-- Name: audit_logs_y2026m10_pkey; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_pkey ATTACH PARTITION public.audit_logs_y2026m10_pkey;


--
-- Name: audit_logs_y2026m10_school_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_school_id_created_at_idx ATTACH PARTITION public.audit_logs_y2026m10_school_id_created_at_idx;


--
-- Name: audit_logs_y2026m10_school_id_module_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_school_id_module_created_at_idx ATTACH PARTITION public.audit_logs_y2026m10_school_id_module_created_at_idx;


--
-- Name: audit_logs_y2026m11_actor_user_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_actor_user_id_created_at_idx ATTACH PARTITION public.audit_logs_y2026m11_actor_user_id_created_at_idx;


--
-- Name: audit_logs_y2026m11_pkey; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_pkey ATTACH PARTITION public.audit_logs_y2026m11_pkey;


--
-- Name: audit_logs_y2026m11_school_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_school_id_created_at_idx ATTACH PARTITION public.audit_logs_y2026m11_school_id_created_at_idx;


--
-- Name: audit_logs_y2026m11_school_id_module_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_school_id_module_created_at_idx ATTACH PARTITION public.audit_logs_y2026m11_school_id_module_created_at_idx;


--
-- Name: audit_logs_y2026m12_actor_user_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_actor_user_id_created_at_idx ATTACH PARTITION public.audit_logs_y2026m12_actor_user_id_created_at_idx;


--
-- Name: audit_logs_y2026m12_pkey; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_pkey ATTACH PARTITION public.audit_logs_y2026m12_pkey;


--
-- Name: audit_logs_y2026m12_school_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_school_id_created_at_idx ATTACH PARTITION public.audit_logs_y2026m12_school_id_created_at_idx;


--
-- Name: audit_logs_y2026m12_school_id_module_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_school_id_module_created_at_idx ATTACH PARTITION public.audit_logs_y2026m12_school_id_module_created_at_idx;


--
-- Name: audit_logs_y2027m01_actor_user_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_actor_user_id_created_at_idx ATTACH PARTITION public.audit_logs_y2027m01_actor_user_id_created_at_idx;


--
-- Name: audit_logs_y2027m01_pkey; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_pkey ATTACH PARTITION public.audit_logs_y2027m01_pkey;


--
-- Name: audit_logs_y2027m01_school_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_school_id_created_at_idx ATTACH PARTITION public.audit_logs_y2027m01_school_id_created_at_idx;


--
-- Name: audit_logs_y2027m01_school_id_module_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_school_id_module_created_at_idx ATTACH PARTITION public.audit_logs_y2027m01_school_id_module_created_at_idx;


--
-- Name: audit_logs_y2027m02_actor_user_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_actor_user_id_created_at_idx ATTACH PARTITION public.audit_logs_y2027m02_actor_user_id_created_at_idx;


--
-- Name: audit_logs_y2027m02_pkey; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_pkey ATTACH PARTITION public.audit_logs_y2027m02_pkey;


--
-- Name: audit_logs_y2027m02_school_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_school_id_created_at_idx ATTACH PARTITION public.audit_logs_y2027m02_school_id_created_at_idx;


--
-- Name: audit_logs_y2027m02_school_id_module_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_school_id_module_created_at_idx ATTACH PARTITION public.audit_logs_y2027m02_school_id_module_created_at_idx;


--
-- Name: audit_logs_y2027m03_actor_user_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_actor_user_id_created_at_idx ATTACH PARTITION public.audit_logs_y2027m03_actor_user_id_created_at_idx;


--
-- Name: audit_logs_y2027m03_pkey; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_pkey ATTACH PARTITION public.audit_logs_y2027m03_pkey;


--
-- Name: audit_logs_y2027m03_school_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_school_id_created_at_idx ATTACH PARTITION public.audit_logs_y2027m03_school_id_created_at_idx;


--
-- Name: audit_logs_y2027m03_school_id_module_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_school_id_module_created_at_idx ATTACH PARTITION public.audit_logs_y2027m03_school_id_module_created_at_idx;


--
-- Name: audit_logs_y2027m04_actor_user_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_actor_user_id_created_at_idx ATTACH PARTITION public.audit_logs_y2027m04_actor_user_id_created_at_idx;


--
-- Name: audit_logs_y2027m04_pkey; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_pkey ATTACH PARTITION public.audit_logs_y2027m04_pkey;


--
-- Name: audit_logs_y2027m04_school_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_school_id_created_at_idx ATTACH PARTITION public.audit_logs_y2027m04_school_id_created_at_idx;


--
-- Name: audit_logs_y2027m04_school_id_module_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_school_id_module_created_at_idx ATTACH PARTITION public.audit_logs_y2027m04_school_id_module_created_at_idx;


--
-- Name: audit_logs_y2027m05_actor_user_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_actor_user_id_created_at_idx ATTACH PARTITION public.audit_logs_y2027m05_actor_user_id_created_at_idx;


--
-- Name: audit_logs_y2027m05_pkey; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_pkey ATTACH PARTITION public.audit_logs_y2027m05_pkey;


--
-- Name: audit_logs_y2027m05_school_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_school_id_created_at_idx ATTACH PARTITION public.audit_logs_y2027m05_school_id_created_at_idx;


--
-- Name: audit_logs_y2027m05_school_id_module_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_school_id_module_created_at_idx ATTACH PARTITION public.audit_logs_y2027m05_school_id_module_created_at_idx;


--
-- Name: audit_logs_y2027m06_actor_user_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_actor_user_id_created_at_idx ATTACH PARTITION public.audit_logs_y2027m06_actor_user_id_created_at_idx;


--
-- Name: audit_logs_y2027m06_pkey; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_pkey ATTACH PARTITION public.audit_logs_y2027m06_pkey;


--
-- Name: audit_logs_y2027m06_school_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_school_id_created_at_idx ATTACH PARTITION public.audit_logs_y2027m06_school_id_created_at_idx;


--
-- Name: audit_logs_y2027m06_school_id_module_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_school_id_module_created_at_idx ATTACH PARTITION public.audit_logs_y2027m06_school_id_module_created_at_idx;


--
-- Name: audit_logs_y2027m07_actor_user_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_actor_user_id_created_at_idx ATTACH PARTITION public.audit_logs_y2027m07_actor_user_id_created_at_idx;


--
-- Name: audit_logs_y2027m07_pkey; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_pkey ATTACH PARTITION public.audit_logs_y2027m07_pkey;


--
-- Name: audit_logs_y2027m07_school_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_school_id_created_at_idx ATTACH PARTITION public.audit_logs_y2027m07_school_id_created_at_idx;


--
-- Name: audit_logs_y2027m07_school_id_module_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_school_id_module_created_at_idx ATTACH PARTITION public.audit_logs_y2027m07_school_id_module_created_at_idx;


--
-- Name: audit_logs_y2027m08_actor_user_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_actor_user_id_created_at_idx ATTACH PARTITION public.audit_logs_y2027m08_actor_user_id_created_at_idx;


--
-- Name: audit_logs_y2027m08_pkey; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_pkey ATTACH PARTITION public.audit_logs_y2027m08_pkey;


--
-- Name: audit_logs_y2027m08_school_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_school_id_created_at_idx ATTACH PARTITION public.audit_logs_y2027m08_school_id_created_at_idx;


--
-- Name: audit_logs_y2027m08_school_id_module_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_school_id_module_created_at_idx ATTACH PARTITION public.audit_logs_y2027m08_school_id_module_created_at_idx;


--
-- Name: audit_logs_y2027m09_actor_user_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_actor_user_id_created_at_idx ATTACH PARTITION public.audit_logs_y2027m09_actor_user_id_created_at_idx;


--
-- Name: audit_logs_y2027m09_pkey; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_pkey ATTACH PARTITION public.audit_logs_y2027m09_pkey;


--
-- Name: audit_logs_y2027m09_school_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_school_id_created_at_idx ATTACH PARTITION public.audit_logs_y2027m09_school_id_created_at_idx;


--
-- Name: audit_logs_y2027m09_school_id_module_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_school_id_module_created_at_idx ATTACH PARTITION public.audit_logs_y2027m09_school_id_module_created_at_idx;


--
-- Name: audit_logs_y2027m10_actor_user_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_actor_user_id_created_at_idx ATTACH PARTITION public.audit_logs_y2027m10_actor_user_id_created_at_idx;


--
-- Name: audit_logs_y2027m10_pkey; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_pkey ATTACH PARTITION public.audit_logs_y2027m10_pkey;


--
-- Name: audit_logs_y2027m10_school_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_school_id_created_at_idx ATTACH PARTITION public.audit_logs_y2027m10_school_id_created_at_idx;


--
-- Name: audit_logs_y2027m10_school_id_module_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_school_id_module_created_at_idx ATTACH PARTITION public.audit_logs_y2027m10_school_id_module_created_at_idx;


--
-- Name: audit_logs_y2027m11_actor_user_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_actor_user_id_created_at_idx ATTACH PARTITION public.audit_logs_y2027m11_actor_user_id_created_at_idx;


--
-- Name: audit_logs_y2027m11_pkey; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_pkey ATTACH PARTITION public.audit_logs_y2027m11_pkey;


--
-- Name: audit_logs_y2027m11_school_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_school_id_created_at_idx ATTACH PARTITION public.audit_logs_y2027m11_school_id_created_at_idx;


--
-- Name: audit_logs_y2027m11_school_id_module_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_school_id_module_created_at_idx ATTACH PARTITION public.audit_logs_y2027m11_school_id_module_created_at_idx;


--
-- Name: audit_logs_y2027m12_actor_user_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_actor_user_id_created_at_idx ATTACH PARTITION public.audit_logs_y2027m12_actor_user_id_created_at_idx;


--
-- Name: audit_logs_y2027m12_pkey; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_pkey ATTACH PARTITION public.audit_logs_y2027m12_pkey;


--
-- Name: audit_logs_y2027m12_school_id_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_school_id_created_at_idx ATTACH PARTITION public.audit_logs_y2027m12_school_id_created_at_idx;


--
-- Name: audit_logs_y2027m12_school_id_module_created_at_idx; Type: INDEX ATTACH; Schema: public; Owner: school_erp_owner
--

ALTER INDEX public.audit_logs_school_id_module_created_at_idx ATTACH PARTITION public.audit_logs_y2027m12_school_id_module_created_at_idx;


--
-- Name: audit_logs audit_logs_append_only; Type: TRIGGER; Schema: public; Owner: school_erp_owner
--

CREATE TRIGGER audit_logs_append_only BEFORE DELETE OR UPDATE ON public.audit_logs FOR EACH ROW EXECUTE FUNCTION public.audit_logs_append_only();


--
-- Name: credentials credentials_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.credentials
    ADD CONSTRAINT credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: platform_staff platform_staff_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.platform_staff
    ADD CONSTRAINT platform_staff_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: school_memberships school_memberships_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.school_memberships
    ADD CONSTRAINT school_memberships_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: school_memberships school_memberships_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.school_memberships
    ADD CONSTRAINT school_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: school_verification_requests school_verification_requests_previous_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.school_verification_requests
    ADD CONSTRAINT school_verification_requests_previous_request_id_fkey FOREIGN KEY (previous_request_id) REFERENCES public.school_verification_requests(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: school_verification_requests school_verification_requests_principal_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.school_verification_requests
    ADD CONSTRAINT school_verification_requests_principal_user_id_fkey FOREIGN KEY (principal_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: school_verification_requests school_verification_requests_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.school_verification_requests
    ADD CONSTRAINT school_verification_requests_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: school_erp_owner
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: audit_logs append; Type: POLICY; Schema: public; Owner: school_erp_owner
--

CREATE POLICY append ON public.audit_logs FOR INSERT WITH CHECK (((school_id IS NULL) OR (school_id = public.current_school_id())));


--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: school_erp_owner
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs_default; Type: ROW SECURITY; Schema: public; Owner: school_erp_owner
--

ALTER TABLE public.audit_logs_default ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs_y2026m10; Type: ROW SECURITY; Schema: public; Owner: school_erp_owner
--

ALTER TABLE public.audit_logs_y2026m10 ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs_y2026m11; Type: ROW SECURITY; Schema: public; Owner: school_erp_owner
--

ALTER TABLE public.audit_logs_y2026m11 ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs_y2026m12; Type: ROW SECURITY; Schema: public; Owner: school_erp_owner
--

ALTER TABLE public.audit_logs_y2026m12 ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs_y2027m01; Type: ROW SECURITY; Schema: public; Owner: school_erp_owner
--

ALTER TABLE public.audit_logs_y2027m01 ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs_y2027m02; Type: ROW SECURITY; Schema: public; Owner: school_erp_owner
--

ALTER TABLE public.audit_logs_y2027m02 ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs_y2027m03; Type: ROW SECURITY; Schema: public; Owner: school_erp_owner
--

ALTER TABLE public.audit_logs_y2027m03 ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs_y2027m04; Type: ROW SECURITY; Schema: public; Owner: school_erp_owner
--

ALTER TABLE public.audit_logs_y2027m04 ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs_y2027m05; Type: ROW SECURITY; Schema: public; Owner: school_erp_owner
--

ALTER TABLE public.audit_logs_y2027m05 ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs_y2027m06; Type: ROW SECURITY; Schema: public; Owner: school_erp_owner
--

ALTER TABLE public.audit_logs_y2027m06 ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs_y2027m07; Type: ROW SECURITY; Schema: public; Owner: school_erp_owner
--

ALTER TABLE public.audit_logs_y2027m07 ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs_y2027m08; Type: ROW SECURITY; Schema: public; Owner: school_erp_owner
--

ALTER TABLE public.audit_logs_y2027m08 ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs_y2027m09; Type: ROW SECURITY; Schema: public; Owner: school_erp_owner
--

ALTER TABLE public.audit_logs_y2027m09 ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs_y2027m10; Type: ROW SECURITY; Schema: public; Owner: school_erp_owner
--

ALTER TABLE public.audit_logs_y2027m10 ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs_y2027m11; Type: ROW SECURITY; Schema: public; Owner: school_erp_owner
--

ALTER TABLE public.audit_logs_y2027m11 ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs_y2027m12; Type: ROW SECURITY; Schema: public; Owner: school_erp_owner
--

ALTER TABLE public.audit_logs_y2027m12 ENABLE ROW LEVEL SECURITY;

--
-- Name: otp_challenges auth_lookup; Type: POLICY; Schema: public; Owner: school_erp_owner
--

CREATE POLICY auth_lookup ON public.otp_challenges TO school_erp_auth_lookup USING (true) WITH CHECK (true);


--
-- Name: schools auth_lookup; Type: POLICY; Schema: public; Owner: school_erp_owner
--

CREATE POLICY auth_lookup ON public.schools FOR SELECT TO school_erp_auth_lookup USING (true);


--
-- Name: sessions auth_lookup; Type: POLICY; Schema: public; Owner: school_erp_owner
--

CREATE POLICY auth_lookup ON public.sessions FOR SELECT TO school_erp_auth_lookup USING (true);


--
-- Name: users auth_lookup; Type: POLICY; Schema: public; Owner: school_erp_owner
--

CREATE POLICY auth_lookup ON public.users FOR SELECT TO school_erp_auth_lookup USING (true);


--
-- Name: credentials; Type: ROW SECURITY; Schema: public; Owner: school_erp_owner
--

ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;

--
-- Name: schools member_schools; Type: POLICY; Schema: public; Owner: school_erp_owner
--

CREATE POLICY member_schools ON public.schools FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.school_memberships m
  WHERE ((m.school_id = schools.id) AND (m.user_id = public.current_app_user_id()) AND (m.status = 'active'::public.membership_status)))));


--
-- Name: otp_challenges; Type: ROW SECURITY; Schema: public; Owner: school_erp_owner
--

ALTER TABLE public.otp_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: credentials own_credentials; Type: POLICY; Schema: public; Owner: school_erp_owner
--

CREATE POLICY own_credentials ON public.credentials USING ((user_id = public.current_app_user_id())) WITH CHECK ((user_id = public.current_app_user_id()));


--
-- Name: school_memberships own_memberships; Type: POLICY; Schema: public; Owner: school_erp_owner
--

CREATE POLICY own_memberships ON public.school_memberships FOR SELECT USING ((user_id = public.current_app_user_id()));


--
-- Name: school_verification_requests own_read; Type: POLICY; Schema: public; Owner: school_erp_owner
--

CREATE POLICY own_read ON public.school_verification_requests FOR SELECT USING ((principal_user_id = public.current_app_user_id()));


--
-- Name: platform_staff own_row; Type: POLICY; Schema: public; Owner: school_erp_owner
--

CREATE POLICY own_row ON public.platform_staff FOR SELECT USING ((user_id = public.current_app_user_id()));


--
-- Name: sessions own_sessions; Type: POLICY; Schema: public; Owner: school_erp_owner
--

CREATE POLICY own_sessions ON public.sessions USING ((user_id = public.current_app_user_id())) WITH CHECK ((user_id = public.current_app_user_id()));


--
-- Name: school_verification_requests own_submit; Type: POLICY; Schema: public; Owner: school_erp_owner
--

CREATE POLICY own_submit ON public.school_verification_requests FOR INSERT WITH CHECK (((principal_user_id = public.current_app_user_id()) AND (status = 'pending'::public.verification_status) AND (decided_by_user_id IS NULL) AND (decided_at IS NULL) AND (decision_reason IS NULL)));


--
-- Name: school_verification_requests platform; Type: POLICY; Schema: public; Owner: school_erp_owner
--

CREATE POLICY platform ON public.school_verification_requests USING ((public.current_platform_role() IS NOT NULL)) WITH CHECK ((public.current_platform_role() IS NOT NULL));


--
-- Name: schools platform_add; Type: POLICY; Schema: public; Owner: school_erp_owner
--

CREATE POLICY platform_add ON public.schools FOR INSERT WITH CHECK ((public.current_platform_role() IS NOT NULL));


--
-- Name: school_memberships platform_add_principal; Type: POLICY; Schema: public; Owner: school_erp_owner
--

CREATE POLICY platform_add_principal ON public.school_memberships FOR INSERT WITH CHECK (((public.current_platform_role() IS NOT NULL) AND (role = 'principal'::public.role)));


--
-- Name: users platform_principals; Type: POLICY; Schema: public; Owner: school_erp_owner
--

CREATE POLICY platform_principals ON public.users FOR SELECT USING (((public.current_platform_role() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.school_verification_requests r
  WHERE (r.principal_user_id = users.id)))));


--
-- Name: school_memberships platform_read; Type: POLICY; Schema: public; Owner: school_erp_owner
--

CREATE POLICY platform_read ON public.school_memberships FOR SELECT USING ((public.current_platform_role() IS NOT NULL));


--
-- Name: schools platform_read; Type: POLICY; Schema: public; Owner: school_erp_owner
--

CREATE POLICY platform_read ON public.schools FOR SELECT USING ((public.current_platform_role() IS NOT NULL));


--
-- Name: platform_staff; Type: ROW SECURITY; Schema: public; Owner: school_erp_owner
--

ALTER TABLE public.platform_staff ENABLE ROW LEVEL SECURITY;

--
-- Name: schools platform_update; Type: POLICY; Schema: public; Owner: school_erp_owner
--

CREATE POLICY platform_update ON public.schools FOR UPDATE USING ((public.current_platform_role() IS NOT NULL)) WITH CHECK ((public.current_platform_role() IS NOT NULL));


--
-- Name: school_verification_requests school_approved; Type: POLICY; Schema: public; Owner: school_erp_owner
--

CREATE POLICY school_approved ON public.school_verification_requests FOR SELECT USING (((school_id = public.current_school_id()) AND (status = 'approved'::public.verification_status)));


--
-- Name: school_memberships school_isolation; Type: POLICY; Schema: public; Owner: school_erp_owner
--

CREATE POLICY school_isolation ON public.school_memberships USING ((school_id = public.current_school_id())) WITH CHECK ((school_id = public.current_school_id()));


--
-- Name: schools school_isolation; Type: POLICY; Schema: public; Owner: school_erp_owner
--

CREATE POLICY school_isolation ON public.schools USING ((id = public.current_school_id())) WITH CHECK ((id = public.current_school_id()));


--
-- Name: school_memberships; Type: ROW SECURITY; Schema: public; Owner: school_erp_owner
--

ALTER TABLE public.school_memberships ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs school_read; Type: POLICY; Schema: public; Owner: school_erp_owner
--

CREATE POLICY school_read ON public.audit_logs FOR SELECT USING ((school_id = public.current_school_id()));


--
-- Name: school_verification_requests; Type: ROW SECURITY; Schema: public; Owner: school_erp_owner
--

ALTER TABLE public.school_verification_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: schools; Type: ROW SECURITY; Schema: public; Owner: school_erp_owner
--

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: public; Owner: school_erp_owner
--

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: platform_staff super_admin; Type: POLICY; Schema: public; Owner: school_erp_owner
--

CREATE POLICY super_admin ON public.platform_staff USING ((public.current_platform_role() = 'super_admin'::public.platform_role)) WITH CHECK ((public.current_platform_role() = 'super_admin'::public.platform_role));


--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: school_erp_owner
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: users visible_users; Type: POLICY; Schema: public; Owner: school_erp_owner
--

CREATE POLICY visible_users ON public.users USING (((id = public.current_app_user_id()) OR (EXISTS ( SELECT 1
   FROM public.school_memberships m
  WHERE ((m.user_id = users.id) AND (m.school_id = public.current_school_id()))))));


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: school_erp_owner
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO school_erp_app;
GRANT USAGE ON SCHEMA public TO school_erp_auth_lookup;


--
-- Name: TYPE otp_purpose; Type: ACL; Schema: public; Owner: school_erp_owner
--

GRANT ALL ON TYPE public.otp_purpose TO school_erp_auth_lookup;


--
-- Name: TYPE school_status; Type: ACL; Schema: public; Owner: school_erp_owner
--

GRANT ALL ON TYPE public.school_status TO school_erp_auth_lookup;


--
-- Name: TYPE user_status; Type: ACL; Schema: public; Owner: school_erp_owner
--

GRANT ALL ON TYPE public.user_status TO school_erp_auth_lookup;


--
-- Name: FUNCTION auth_find_login_user(p_identifier text); Type: ACL; Schema: public; Owner: school_erp_auth_lookup
--

REVOKE ALL ON FUNCTION public.auth_find_login_user(p_identifier text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.auth_find_login_user(p_identifier text) TO school_erp_app;


--
-- Name: FUNCTION auth_find_session_user(p_session_id uuid); Type: ACL; Schema: public; Owner: school_erp_auth_lookup
--

REVOKE ALL ON FUNCTION public.auth_find_session_user(p_session_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.auth_find_session_user(p_session_id uuid) TO school_erp_app;


--
-- Name: FUNCTION auth_otp_issue(p_id uuid, p_phone text, p_purpose public.otp_purpose, p_code_hash text, p_ttl_seconds integer, p_ip text); Type: ACL; Schema: public; Owner: school_erp_auth_lookup
--

REVOKE ALL ON FUNCTION public.auth_otp_issue(p_id uuid, p_phone text, p_purpose public.otp_purpose, p_code_hash text, p_ttl_seconds integer, p_ip text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.auth_otp_issue(p_id uuid, p_phone text, p_purpose public.otp_purpose, p_code_hash text, p_ttl_seconds integer, p_ip text) TO school_erp_app;


--
-- Name: FUNCTION auth_otp_verify(p_phone text, p_purposes public.otp_purpose[], p_code_hash text); Type: ACL; Schema: public; Owner: school_erp_auth_lookup
--

REVOKE ALL ON FUNCTION public.auth_otp_verify(p_phone text, p_purposes public.otp_purpose[], p_code_hash text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.auth_otp_verify(p_phone text, p_purposes public.otp_purpose[], p_code_hash text) TO school_erp_app;


--
-- Name: FUNCTION directory_search_schools(p_query text, p_after_name text, p_after_id uuid, p_limit integer); Type: ACL; Schema: public; Owner: school_erp_auth_lookup
--

REVOKE ALL ON FUNCTION public.directory_search_schools(p_query text, p_after_name text, p_after_id uuid, p_limit integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.directory_search_schools(p_query text, p_after_name text, p_after_id uuid, p_limit integer) TO school_erp_app;


--
-- Name: TABLE _prisma_migrations; Type: ACL; Schema: public; Owner: school_erp_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public._prisma_migrations TO school_erp_app;


--
-- Name: TABLE audit_logs; Type: ACL; Schema: public; Owner: school_erp_owner
--

GRANT SELECT,INSERT ON TABLE public.audit_logs TO school_erp_app;


--
-- Name: TABLE credentials; Type: ACL; Schema: public; Owner: school_erp_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.credentials TO school_erp_app;


--
-- Name: TABLE otp_challenges; Type: ACL; Schema: public; Owner: school_erp_owner
--

GRANT SELECT,INSERT,UPDATE ON TABLE public.otp_challenges TO school_erp_auth_lookup;


--
-- Name: TABLE permissions; Type: ACL; Schema: public; Owner: school_erp_owner
--

GRANT SELECT ON TABLE public.permissions TO school_erp_app;


--
-- Name: TABLE platform_staff; Type: ACL; Schema: public; Owner: school_erp_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.platform_staff TO school_erp_app;


--
-- Name: TABLE role_permissions; Type: ACL; Schema: public; Owner: school_erp_owner
--

GRANT SELECT ON TABLE public.role_permissions TO school_erp_app;


--
-- Name: SEQUENCE school_code_seq; Type: ACL; Schema: public; Owner: school_erp_owner
--

GRANT SELECT,USAGE ON SEQUENCE public.school_code_seq TO school_erp_app;


--
-- Name: TABLE school_memberships; Type: ACL; Schema: public; Owner: school_erp_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.school_memberships TO school_erp_app;


--
-- Name: TABLE school_verification_requests; Type: ACL; Schema: public; Owner: school_erp_owner
--

GRANT SELECT,INSERT,UPDATE ON TABLE public.school_verification_requests TO school_erp_app;


--
-- Name: TABLE schools; Type: ACL; Schema: public; Owner: school_erp_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.schools TO school_erp_app;


--
-- Name: COLUMN schools.id; Type: ACL; Schema: public; Owner: school_erp_owner
--

GRANT SELECT(id) ON TABLE public.schools TO school_erp_auth_lookup;


--
-- Name: COLUMN schools.name; Type: ACL; Schema: public; Owner: school_erp_owner
--

GRANT SELECT(name) ON TABLE public.schools TO school_erp_auth_lookup;


--
-- Name: COLUMN schools.code; Type: ACL; Schema: public; Owner: school_erp_owner
--

GRANT SELECT(code) ON TABLE public.schools TO school_erp_auth_lookup;


--
-- Name: COLUMN schools.status; Type: ACL; Schema: public; Owner: school_erp_owner
--

GRANT SELECT(status) ON TABLE public.schools TO school_erp_auth_lookup;


--
-- Name: COLUMN schools.city; Type: ACL; Schema: public; Owner: school_erp_owner
--

GRANT SELECT(city) ON TABLE public.schools TO school_erp_auth_lookup;


--
-- Name: COLUMN schools.pin_code; Type: ACL; Schema: public; Owner: school_erp_owner
--

GRANT SELECT(pin_code) ON TABLE public.schools TO school_erp_auth_lookup;


--
-- Name: TABLE sessions; Type: ACL; Schema: public; Owner: school_erp_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.sessions TO school_erp_app;


--
-- Name: COLUMN sessions.id; Type: ACL; Schema: public; Owner: school_erp_owner
--

GRANT SELECT(id) ON TABLE public.sessions TO school_erp_auth_lookup;


--
-- Name: COLUMN sessions.user_id; Type: ACL; Schema: public; Owner: school_erp_owner
--

GRANT SELECT(user_id) ON TABLE public.sessions TO school_erp_auth_lookup;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: school_erp_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.users TO school_erp_app;


--
-- Name: COLUMN users.id; Type: ACL; Schema: public; Owner: school_erp_owner
--

GRANT SELECT(id) ON TABLE public.users TO school_erp_auth_lookup;


--
-- Name: COLUMN users.email; Type: ACL; Schema: public; Owner: school_erp_owner
--

GRANT SELECT(email) ON TABLE public.users TO school_erp_auth_lookup;


--
-- Name: COLUMN users.phone; Type: ACL; Schema: public; Owner: school_erp_owner
--

GRANT SELECT(phone) ON TABLE public.users TO school_erp_auth_lookup;


--
-- Name: COLUMN users.status; Type: ACL; Schema: public; Owner: school_erp_owner
--

GRANT SELECT(status) ON TABLE public.users TO school_erp_auth_lookup;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: school_erp_owner
--

ALTER DEFAULT PRIVILEGES FOR ROLE school_erp_owner IN SCHEMA public GRANT SELECT,USAGE ON SEQUENCES TO school_erp_app;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: school_erp_owner
--

ALTER DEFAULT PRIVILEGES FOR ROLE school_erp_owner IN SCHEMA public GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO school_erp_app;


--
-- PostgreSQL database dump complete
--

\unrestrict 1uXQ8OFEbzYcaUNzfpqwwJ4Vu7LeITcEn65WfgSOXOjVhce6wvd46Up9bddbOBC

