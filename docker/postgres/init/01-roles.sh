#!/bin/sh
# Runs once, when the data volume is first created.
#
# school_erp_owner: owns the schema, runs migrations. CREATEDB for Prisma's shadow database.
# school_erp_app:   what the API connects as. Not an owner, no BYPASSRLS, so RLS always applies.
set -eu

psql -v ON_ERROR_STOP=1 -U postgres -d postgres \
  -v owner_pw="$DB_OWNER_PASSWORD" -v app_pw="$DB_APP_PASSWORD" <<'SQL'
CREATE ROLE school_erp_owner LOGIN CREATEDB NOSUPERUSER NOBYPASSRLS PASSWORD :'owner_pw';
CREATE ROLE school_erp_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS PASSWORD :'app_pw';

CREATE DATABASE school_erp OWNER school_erp_owner;
CREATE DATABASE school_erp_test OWNER school_erp_owner;
SQL

for db in school_erp school_erp_test; do
  psql -v ON_ERROR_STOP=1 -U postgres -d "$db" <<'SQL'
REVOKE ALL ON SCHEMA public FROM PUBLIC;
ALTER SCHEMA public OWNER TO school_erp_owner;
GRANT USAGE ON SCHEMA public TO school_erp_app;

-- Tables and sequences the owner creates later are usable (not owned) by the app role.
ALTER DEFAULT PRIVILEGES FOR ROLE school_erp_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO school_erp_app;
ALTER DEFAULT PRIVILEGES FOR ROLE school_erp_owner IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO school_erp_app;
SQL
done
