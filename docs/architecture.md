# Architecture overview

**Style:** modular monolith. One NestJS API, one PostgreSQL database, clients (mobile, web) talk to the API over REST. No microservices until measured load or team size justifies it.

**Modules (inside `apps/api`, added incrementally):** auth, schools/tenancy, users and roles, students, guardians, attendance, timetable, homework, results, fees, notices, notifications. Optional later: transport, library, hostel, payroll, inventory.

**Multi-tenancy:** shared database, shared schema, `school_id` on every tenant table. Isolation is enforced in the backend (guards plus PostgreSQL Row Level Security as a second layer). Frontend checks are never the control.

**Authorization:** role-based, enforced in the API. Parents can access only verified linked children; linking uses school code, admission number and a school-issued verification step, never phone-number matching alone.

**Data:** PostgreSQL via Supabase initially, used as plain managed Postgres. No privileged keys in any client. Migrations are version-controlled.

**Background work (later):** queue (BullMQ + Redis, or SQS) for notifications, report generation, imports and exports.

**Scale path:** indexing, connection pooling, caching, partitioning of large tables (attendance), read replicas, then AWS-hosted infrastructure when measured triggers are hit (see `decisions.md`). No scale claim is made without load testing.
