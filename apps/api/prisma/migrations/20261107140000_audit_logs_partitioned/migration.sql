-- audit_logs becomes range-partitioned by month on created_at (tens of millions of rows a year at
-- pilot scale; retention = dropping old partitions). Done now, while no staging or production
-- database exists: rename, recreate partitioned, copy, drop.

ALTER TABLE "audit_logs" RENAME TO "audit_logs_unpartitioned";
ALTER TABLE "audit_logs_unpartitioned" RENAME CONSTRAINT "audit_logs_pkey" TO "audit_logs_unpartitioned_pkey";
ALTER INDEX "audit_logs_school_id_created_at_idx" RENAME TO "audit_logs_unpartitioned_school_id_created_at_idx";
ALTER INDEX "audit_logs_actor_user_id_created_at_idx" RENAME TO "audit_logs_unpartitioned_actor_user_id_created_at_idx";
ALTER INDEX "audit_logs_school_id_module_created_at_idx" RENAME TO "audit_logs_unpartitioned_school_id_module_created_at_idx";

CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "school_id" UUID,
    "actor_user_id" UUID,
    "actor_role" TEXT,
    "category" "audit_category" NOT NULL DEFAULT 'general',
    "module" "audit_module",
    "action" TEXT NOT NULL,
    "target_type" TEXT,
    "target_id" UUID,
    "old_value" JSONB,
    "new_value" JSONB,
    "reason" TEXT,
    "ip" TEXT,
    "session_id" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id", "created_at")
) PARTITION BY RANGE ("created_at");

CREATE INDEX "audit_logs_school_id_created_at_idx" ON "audit_logs"("school_id", "created_at");
CREATE INDEX "audit_logs_actor_user_id_created_at_idx" ON "audit_logs"("actor_user_id", "created_at");
CREATE INDEX "audit_logs_school_id_module_created_at_idx" ON "audit_logs"("school_id", "module", "created_at");

-- Monthly partitions Oct 2026 to Dec 2027, plus a DEFAULT partition so an insert never fails when a
-- month has not been created yet (a scheduled job creating months ahead comes in slice 8).
-- The app role reaches rows only through the parent (whose RLS policies apply); partitions get RLS
-- with no policies and no app-role grants, so they cannot be queried directly.
DO $$
DECLARE
  m date := date '2026-10-01';
  part text;
BEGIN
  WHILE m < date '2028-01-01' LOOP
    part := format('audit_logs_y%sm%s', to_char(m, 'YYYY'), to_char(m, 'MM'));
    EXECUTE format(
      'CREATE TABLE %I PARTITION OF "audit_logs" FOR VALUES FROM (%L) TO (%L)',
      part, m, (m + interval '1 month')::date);
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', part);
    EXECUTE format('REVOKE ALL ON %I FROM school_erp_app', part);
    m := (m + interval '1 month')::date;
  END LOOP;
END
$$;
CREATE TABLE "audit_logs_default" PARTITION OF "audit_logs" DEFAULT;
ALTER TABLE "audit_logs_default" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "audit_logs_default" FROM school_erp_app;

INSERT INTO "audit_logs" SELECT
  "id", "school_id", "actor_user_id", "actor_role", "category", "module", "action", "target_type",
  "target_id", "old_value", "new_value", "reason", "ip", "session_id", "metadata", "created_at"
FROM "audit_logs_unpartitioned";
DROP TABLE "audit_logs_unpartitioned";

-- Same access rules as before: a school context reads its own rows; append-only for the app role.
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY school_read ON "audit_logs"
  FOR SELECT
  USING (school_id = current_school_id());
CREATE POLICY append ON "audit_logs"
  FOR INSERT
  WITH CHECK (school_id IS NULL OR school_id = current_school_id());
REVOKE UPDATE, DELETE, TRUNCATE ON "audit_logs" FROM school_erp_app;

-- Append-only for everyone, the owner included: any UPDATE or DELETE raises. Retention drops whole
-- partitions (DDL), which a row trigger does not block.
CREATE FUNCTION audit_logs_append_only() RETURNS trigger
  LANGUAGE plpgsql
  AS $$ BEGIN RAISE EXCEPTION 'audit_logs is append-only'; END $$;
CREATE TRIGGER audit_logs_append_only
  BEFORE UPDATE OR DELETE ON "audit_logs"
  FOR EACH ROW EXECUTE FUNCTION audit_logs_append_only();
