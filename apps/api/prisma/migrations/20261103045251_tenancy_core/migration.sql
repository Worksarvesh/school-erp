-- CreateEnum
CREATE TYPE "role" AS ENUM ('principal', 'school_admin', 'vice_principal', 'teacher', 'non_teaching_staff', 'office_clerk', 'accountant', 'student', 'parent', 'other_staff');

-- CreateEnum
CREATE TYPE "membership_status" AS ENUM ('invited', 'active', 'suspended', 'revoked');

-- CreateEnum
CREATE TYPE "school_status" AS ENUM ('active', 'suspended');

-- CreateTable
CREATE TABLE "schools" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "udise_code" TEXT,
    "status" "school_status" NOT NULL DEFAULT 'active',
    "shard_key" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" UUID,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_memberships" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "role" NOT NULL,
    "status" "membership_status" NOT NULL DEFAULT 'invited',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" UUID,

    CONSTRAINT "school_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" UUID NOT NULL,
    "role" "role" NOT NULL,
    "permission_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schools_code_key" ON "schools"("code");

-- CreateIndex
CREATE UNIQUE INDEX "schools_udise_code_key" ON "schools"("udise_code");

-- CreateIndex
CREATE INDEX "school_memberships_school_id_idx" ON "school_memberships"("school_id");

-- CreateIndex
CREATE UNIQUE INDEX "school_memberships_user_id_school_id_role_key" ON "school_memberships"("user_id", "school_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_permission_id_key" ON "role_permissions"("role", "permission_id");

-- AddForeignKey
ALTER TABLE "school_memberships" ADD CONSTRAINT "school_memberships_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_memberships" ADD CONSTRAINT "school_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Row Level Security (hand-written; Prisma does not manage policies)
-- ---------------------------------------------------------------------------

-- Request context, set transaction-locally by the API (withSchoolContext / withUserContext).
-- nullif: once a transaction-local setting ends it reads as '' (not NULL), so no context
-- means NULL, and `x = NULL` matches no rows.
CREATE FUNCTION current_school_id() RETURNS uuid
  LANGUAGE sql STABLE
  AS $$ SELECT nullif(current_setting('app.school_id', true), '')::uuid $$;

CREATE FUNCTION current_app_user_id() RETURNS uuid
  LANGUAGE sql STABLE
  AS $$ SELECT nullif(current_setting('app.user_id', true), '')::uuid $$;

-- schools: a tenant sees only its own row.
ALTER TABLE "schools" ENABLE ROW LEVEL SECURITY;
CREATE POLICY school_isolation ON "schools"
  USING (id = current_school_id())
  WITH CHECK (id = current_school_id());

-- school_memberships: rows of the current school, plus (read-only) the caller's own rows
-- in any school, so login can list a user's schools. Permissive policies are OR'd.
ALTER TABLE "school_memberships" ENABLE ROW LEVEL SECURITY;
CREATE POLICY school_isolation ON "school_memberships"
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());
CREATE POLICY own_memberships ON "school_memberships"
  FOR SELECT
  USING (user_id = current_app_user_id());

-- users are global, but only visible as yourself or as a member of the current school.
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
CREATE POLICY visible_users ON "users"
  USING (
    id = current_app_user_id()
    OR EXISTS (
      SELECT 1 FROM "school_memberships" m
      WHERE m.user_id = "users".id AND m.school_id = current_school_id()
    )
  );

-- Global reference data: the app role may read it, never change it.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON "permissions", "role_permissions" FROM school_erp_app;
