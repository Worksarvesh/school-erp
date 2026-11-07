# Table dictionary (draft V1.1)

Generated from [schema.draft.prisma](schema.draft.prisma) plus hand-written notes. Column types are PostgreSQL types. Every school table also has the RLS policies in [RLS-MATRIX.md](RLS-MATRIX.md). Actor columns (`created_by`, `marked_by`, ...) hold user ids.

**65 tables.** Status: _New_ (not yet built), _Extended_ (exists today, gains columns), _Existing_ (unchanged).

Over 10 million rows a year at pilot scale (100 schools, ~2.5 lakh users): `student_attendance`, `notifications`, `audit_logs` (all partitioned by month), and `homework_completions` if every student is tracked for every homework (watch; partition later if needed).

## Contents

- **Tenancy and identity:** `schools`, `users`, `credentials`, `credential_issuances`, `username_sequences`, `sessions`, `push_tokens`, `otp_challenges`, `school_verification_requests`, `platform_staff`, `school_memberships`, `permissions`, `role_permissions`
- **Academic setup:** `academic_years`, `school_timings`, `classes`, `sections`, `subjects`, `class_subjects`
- **People:** `students`, `student_field_definitions`, `student_enrollments`, `student_guardians`, `parent_student_links`, `departments`, `staff`, `teacher_subject_qualifications`, `teacher_assignments`
- **Attendance and leave:** `attendance_registers`, `student_attendance`, `attendance_corrections`, `staff_attendance`, `leave_types`, `leave_requests`
- **Timetable:** `timetables`, `timetable_entries`, `teacher_availability`, `substitutions`
- **Exams and results:** `exams`, `exam_subjects`, `marks_entries`, `result_sets`, `student_results`, `homework`, `homework_completions`, `lesson_plans`
- **Approvals:** `approval_requests`, `approval_actions`
- **Notices and notifications:** `notices`, `notice_audiences`, `calendar_events`, `notifications`, `outbox_events`
- **Non-teaching:** `duty_schedules`, `tasks`, `assets`, `asset_assignments`, `inventory_items`, `inventory_movements`, `maintenance_requests`
- **Import and documents:** `import_jobs`, `import_rows`, `files`, `documents`
- **Audit:** `audit_logs`

## Tenancy and identity

### `schools`

School profile, directory entry and branding. The tenant. code is sch + 4+ digits from the global sequence school_code_seq (CHECK code ~ '^sch[0-9]{4,}$'). Branding (name, logo, address, contact) is managed by the Principal and shown in the Student App.

| Item             | Value                                                                      |
| ---------------- | -------------------------------------------------------------------------- |
| Status           | Extended                                                                   |
| Tenant column    | is the tenant                                                              |
| Written by       | Platform (create/verify); Principal (branding)                             |
| Read by          | Members; Student App (name, logo); directory search (name, city, PIN only) |
| Retention        | Kept                                                                       |
| Expected size    | ~100 at pilot                                                              |
| Keys and indexes | PK (id)                                                                    |

| Column          | Type          | Null | Default              | Notes  |
| --------------- | ------------- | ---- | -------------------- | ------ |
| `id`            | uuid          | no   | UUIDv7 (app)         | PK     |
| `name`          | text          | no   |                      |        |
| `code`          | text          | no   |                      | unique |
| `udise_code`    | text          | yes  |                      | unique |
| `status`        | school_status | no   | active               |        |
| `shard_key`     | smallint      | no   | 0                    |        |
| `address_line`  | text          | yes  |                      |        |
| `city`          | text          | yes  |                      |        |
| `state`         | text          | yes  |                      |        |
| `pin_code`      | text          | yes  |                      |        |
| `contact_phone` | text          | yes  |                      |        |
| `contact_email` | text          | yes  |                      |        |
| `logo_file_id`  | uuid          | yes  |                      |        |
| `timezone`      | text          | no   | "Asia/Kolkata"       |        |
| `created_at`    | timestamptz   | no   | now()                |        |
| `updated_at`    | timestamptz   | no   | set by app on update |        |
| `created_by`    | uuid          | yes  |                      |        |
| `updated_by`    | uuid          | yes  |                      |        |

### `users`

One person, one account (username or phone). Global person. username is set for school-issued accounts (staff, students) and is unique system-wide; a username account belongs to the school that issued it. phone is set for OTP accounts (principal, parent). CHECK: username IS NOT NULL OR phone IS NOT NULL.

| Item             | Value                                                   |
| ---------------- | ------------------------------------------------------- |
| Status           | Extended                                                |
| Tenant column    | global                                                  |
| Written by       | Auth, Admin/Principal (create accounts), self (profile) |
| Read by          | Self; members of the same school                        |
| Retention        | Kept; anonymise on DPDP erasure                         |
| Expected size    | ~2.5 lakh                                               |
| Keys and indexes | PK (id)                                                 |

| Column              | Type        | Null | Default              | Notes  |
| ------------------- | ----------- | ---- | -------------------- | ------ |
| `id`                | uuid        | no   | UUIDv7 (app)         | PK     |
| `full_name`         | text        | no   |                      |        |
| `username`          | text        | yes  |                      | unique |
| `phone`             | text        | yes  |                      | unique |
| `phone_verified_at` | timestamptz | yes  |                      |        |
| `email`             | text        | yes  |                      | unique |
| `status`            | user_status | no   | active               |        |
| `last_login_at`     | timestamptz | yes  |                      |        |
| `created_at`        | timestamptz | no   | now()                |        |
| `updated_at`        | timestamptz | no   | set by app on update |        |

### `credentials`

Password hash, forced-change flag. One password hash per user (argon2id). A temporary password (6 characters, shown once) is stored here with must_change_password = true; there is never a second copy of any hash.

| Item             | Value                         |
| ---------------- | ----------------------------- |
| Status           | Extended                      |
| Tenant column    | per user                      |
| Written by       | Auth, Admin/Principal reset   |
| Read by          | Auth only (own row)           |
| Retention        | Kept while the account exists |
| Expected size    | ~2.5 lakh                     |
| Keys and indexes | PK (id)                       |

| Column                 | Type        | Null | Default              | Notes |
| ---------------------- | ----------- | ---- | -------------------- | ----- |
| `user_id`              | uuid        | no   |                      | PK    |
| `password_hash`        | text        | no   |                      |       |
| `must_change_password` | boolean     | no   | false                |       |
| `password_changed_at`  | timestamptz | no   |                      |       |
| `created_at`           | timestamptz | no   | now()                |       |
| `updated_at`           | timestamptz | no   | set by app on update |       |

### `credential_issuances`

History of temporary passwords issued (no hash). History of issued temporary passwords (initial and admin-initiated resets). Metadata only, no hash.

| Item             | Value                                                    |
| ---------------- | -------------------------------------------------------- |
| Status           | New                                                      |
| Tenant column    | school_id nullable                                       |
| Written by       | Admin/Principal/Super Admin                              |
| Read by          | Issuer roles, audit                                      |
| Retention        | Kept                                                     |
| Expected size    | Small                                                    |
| Keys and indexes | index (user_id, issued_at); index (school_id, issued_at) |

| Column        | Type                     | Null | Default      | Notes |
| ------------- | ------------------------ | ---- | ------------ | ----- |
| `id`          | uuid                     | no   | UUIDv7 (app) | PK    |
| `school_id`   | uuid                     | yes  |              |       |
| `user_id`     | uuid                     | no   |              |       |
| `kind`        | credential_issuance_kind | no   |              |       |
| `issued_by`   | uuid                     | no   |              |       |
| `issued_at`   | timestamptz              | no   | now()        |       |
| `shown_at`    | timestamptz              | yes  |              |       |
| `consumed_at` | timestamptz              | yes  |              |       |
| `expires_at`  | timestamptz              | no   |              |       |
| `reason`      | text                     | yes  |              |       |

### `username_sequences`

Next username number per school and kind. Next number per school and kind. Allocated with UPDATE ... SET next_value = next_value + 1 RETURNING, which row-locks, so two Admins never get the same username.

| Item             | Value                |
| ---------------- | -------------------- |
| Status           | New                  |
| Tenant column    | school_id NOT NULL   |
| Written by       | Account creation     |
| Read by          | Account creation     |
| Retention        | Kept                 |
| Expected size    | 2 rows per school    |
| Keys and indexes | PK (school_id, kind) |

| Column       | Type          | Null | Default              | Notes |
| ------------ | ------------- | ---- | -------------------- | ----- |
| `school_id`  | uuid          | no   |                      |       |
| `kind`       | username_kind | no   |                      |       |
| `next_value` | integer       | no   | 1                    |       |
| `updated_at` | timestamptz   | no   | set by app on update |       |

### `sessions`

Signed-in device, hashed refresh token.

| Item             | Value                                   |
| ---------------- | --------------------------------------- |
| Status           | Extended                                |
| Tenant column    | per user                                |
| Written by       | Auth                                    |
| Read by          | Self                                    |
| Retention        | Deleted 30 days after expiry/revocation |
| Expected size    | ~1 lakh active                          |
| Keys and indexes | index (user_id)                         |

| Column                | Type        | Null | Default      | Notes  |
| --------------------- | ----------- | ---- | ------------ | ------ |
| `id`                  | uuid        | no   | UUIDv7 (app) | PK     |
| `user_id`             | uuid        | no   |              |        |
| `token_hash`          | text        | no   |              | unique |
| `previous_token_hash` | text        | yes  |              |        |
| `device_name`         | text        | yes  |              |        |
| `client_app`          | client_app  | yes  |              |        |
| `created_at`          | timestamptz | no   | now()        |        |
| `last_used_at`        | timestamptz | no   | now()        |        |
| `expires_at`          | timestamptz | no   |              |        |
| `revoked_at`          | timestamptz | yes  |              |        |
| `revoked_reason`      | text        | yes  |              |        |

### `push_tokens`

Push token per app install. Push token of one app install. app decides which app a notification goes to (a parent's Student App, not the same person's School App). Revoked with its session.

| Item             | Value                                                        |
| ---------------- | ------------------------------------------------------------ |
| Status           | New                                                          |
| Tenant column    | per user                                                     |
| Written by       | Apps on login                                                |
| Read by          | Worker (send), self                                          |
| Retention        | Deleted with its session or when the push service rejects it |
| Expected size    | ~2 lakh                                                      |
| Keys and indexes | index (user_id, app)                                         |

| Column         | Type            | Null | Default      | Notes  |
| -------------- | --------------- | ---- | ------------ | ------ |
| `id`           | uuid            | no   | UUIDv7 (app) | PK     |
| `user_id`      | uuid            | no   |              |        |
| `session_id`   | uuid            | yes  |              |        |
| `app`          | client_app      | no   |              |        |
| `platform`     | device_platform | no   |              |        |
| `token`        | text            | no   |              | unique |
| `last_seen_at` | timestamptz     | no   | now()        |        |
| `revoked_at`   | timestamptz     | yes  |              |        |
| `created_at`   | timestamptz     | no   | now()        |        |

### `otp_challenges`

OTP for Principal and Parent. OTP for Principal and Parent. Reached only through SECURITY DEFINER functions (create/verify), never by the app role directly. code_hash only; codes never stored or logged. 6 digits, 5 min, 5 attempts (design §4). Until real SMS exists, OTP_PROVIDER=fixed creates normal challenges whose expected code is OTP_FIXED_CODE (999999): same rows, expiry, attempts and rate limits. Switching to OTP_PROVIDER=sms changes no tables.

| Item             | Value                              |
| ---------------- | ---------------------------------- |
| Status           | New                                |
| Tenant column    | global (no user context)           |
| Written by       | SECURITY DEFINER functions only    |
| Read by          | SECURITY DEFINER functions only    |
| Retention        | Deleted after 24 hours             |
| Expected size    | Short-lived                        |
| Keys and indexes | index (phone, purpose, created_at) |

| Column         | Type        | Null | Default      | Notes |
| -------------- | ----------- | ---- | ------------ | ----- |
| `id`           | uuid        | no   | UUIDv7 (app) | PK    |
| `purpose`      | otp_purpose | no   |              |       |
| `phone`        | text        | no   |              |       |
| `code_hash`    | text        | no   |              |       |
| `attempts`     | smallint    | no   | 0            |       |
| `max_attempts` | smallint    | no   | 5            |       |
| `expires_at`   | timestamptz | no   |              |       |
| `consumed_at`  | timestamptz | yes  |              |       |
| `ip`           | text        | yes  |              |       |
| `created_at`   | timestamptz | no   | now()        |       |

### `school_verification_requests`

New principal registration and school claim. New principal registration. Either school_id (picked from the directory) or the "not listed" fields. CHECK: (school_id IS NOT NULL) <> (proposed_name IS NOT NULL); status = rejected requires decision_reason. Resubmission creates a new row pointing at the old one.

| Item             | Value                                                   |
| ---------------- | ------------------------------------------------------- |
| Status           | New                                                     |
| Tenant column    | school_id nullable                                      |
| Written by       | Principal (submit), Verifier (decide)                   |
| Read by          | Own principal; Verifier; Super Admin                    |
| Retention        | Kept                                                    |
| Expected size    | Small                                                   |
| Keys and indexes | index (status, submitted_at); index (principal_user_id) |

| Column                | Type                | Null | Default              | Notes  |
| --------------------- | ------------------- | ---- | -------------------- | ------ |
| `id`                  | uuid                | no   | UUIDv7 (app)         | PK     |
| `principal_user_id`   | uuid                | no   |                      |        |
| `school_id`           | uuid                | yes  |                      |        |
| `proposed_name`       | text                | yes  |                      |        |
| `proposed_address`    | text                | yes  |                      |        |
| `proposed_pin_code`   | text                | yes  |                      |        |
| `principal_name`      | text                | no   |                      |        |
| `status`              | verification_status | no   | pending              |        |
| `decided_by_staff_id` | uuid                | yes  |                      |        |
| `decided_at`          | timestamptz         | yes  |                      |        |
| `decision_reason`     | text                | yes  |                      |        |
| `previous_request_id` | uuid                | yes  |                      | unique |
| `submitted_at`        | timestamptz         | no   | now()                |        |
| `updated_at`          | timestamptz         | no   | set by app on update |        |

### `platform_staff`

Company Super Admin and School Verifier. Company staff (Super Admin, School Verifier). Not school members. Separate routes; every access audited.

| Item             | Value                                    |
| ---------------- | ---------------------------------------- |
| Status           | New                                      |
| Tenant column    | global                                   |
| Written by       | Super Admin (by migration/seed at first) |
| Read by          | Platform guard                           |
| Retention        | Kept                                     |
| Expected size    | A few rows                               |
| Keys and indexes | PK (id)                                  |

| Column       | Type          | Null | Default              | Notes |
| ------------ | ------------- | ---- | -------------------- | ----- |
| `user_id`    | uuid          | no   |                      | PK    |
| `role`       | platform_role | no   |                      |       |
| `status`     | user_status   | no   | active               |       |
| `created_at` | timestamptz   | no   | now()                |       |
| `updated_at` | timestamptz   | no   | set by app on update |       |
| `created_by` | uuid          | yes  |                      |       |

### `school_memberships`

Role of a user in a school (several allowed). One role for one user in one school (several roles per person allowed; role switching = choosing one). CHECK role <> 'parent'. A teacher's membership is invited until TEACHER_ADDITION is approved.

| Item             | Value                                                              |
| ---------------- | ------------------------------------------------------------------ |
| Status           | Extended                                                           |
| Tenant column    | school_id NOT NULL                                                 |
| Written by       | Principal (Admin, VP), Admin (staff, students), approvals          |
| Read by          | Members with members.read; self                                    |
| Retention        | Kept (status, never deleted)                                       |
| Expected size    | ~2.5 lakh                                                          |
| Keys and indexes | unique (user_id, school_id, role); index (school_id, role, status) |

| Column        | Type              | Null | Default              | Notes |
| ------------- | ----------------- | ---- | -------------------- | ----- |
| `id`          | uuid              | no   | UUIDv7 (app)         | PK    |
| `school_id`   | uuid              | no   |                      |       |
| `user_id`     | uuid              | no   |                      |       |
| `role`        | role              | no   |                      |       |
| `status`      | membership_status | no   | invited              |       |
| `approved_by` | uuid              | yes  |                      |       |
| `approved_at` | timestamptz       | yes  |                      |       |
| `created_at`  | timestamptz       | no   | now()                |       |
| `updated_at`  | timestamptz       | no   | set by app on update |       |
| `created_by`  | uuid              | yes  |                      |       |

### `permissions`

Permission catalogue.

| Item             | Value           |
| ---------------- | --------------- |
| Status           | Existing        |
| Tenant column    | global          |
| Written by       | Migrations only |
| Read by          | Guards          |
| Retention        | Kept            |
| Expected size    | ~60 rows        |
| Keys and indexes | PK (id)         |

| Column        | Type        | Null | Default      | Notes  |
| ------------- | ----------- | ---- | ------------ | ------ |
| `id`          | uuid        | no   | UUIDv7 (app) | PK     |
| `key`         | text        | no   |              | unique |
| `description` | text        | no   |              |        |
| `created_at`  | timestamptz | no   | now()        |        |

### `role_permissions`

Default role -> permission grants.

| Item             | Value                        |
| ---------------- | ---------------------------- |
| Status           | Existing                     |
| Tenant column    | global                       |
| Written by       | Migrations only              |
| Read by          | Guards                       |
| Retention        | Kept                         |
| Expected size    | ~300 rows                    |
| Keys and indexes | unique (role, permission_id) |

| Column          | Type        | Null | Default      | Notes |
| --------------- | ----------- | ---- | ------------ | ----- |
| `id`            | uuid        | no   | UUIDv7 (app) | PK    |
| `role`          | role        | no   |              |       |
| `permission_id` | uuid        | no   |              |       |
| `created_at`    | timestamptz | no   | now()        |       |

## Academic setup

### `academic_years`

Academic years, one active. Partial unique index: one active year per school (WHERE status = 'active').

| Item             | Value                                            |
| ---------------- | ------------------------------------------------ |
| Status           | New                                              |
| Tenant column    | school_id NOT NULL                               |
| Written by       | Admin (create); approval (activate/transition)   |
| Read by          | All members, students, parents                   |
| Retention        | Kept                                             |
| Expected size    | ~1 per school per year                           |
| Keys and indexes | unique (school_id, id); unique (school_id, name) |

| Column       | Type                 | Null | Default              | Notes |
| ------------ | -------------------- | ---- | -------------------- | ----- |
| `id`         | uuid                 | no   | UUIDv7 (app)         | PK    |
| `school_id`  | uuid                 | no   |                      |       |
| `name`       | text                 | no   |                      |       |
| `starts_on`  | date                 | no   |                      |       |
| `ends_on`    | date                 | no   |                      |       |
| `status`     | academic_year_status | no   | planned              |       |
| `created_at` | timestamptz          | no   | now()                |       |
| `updated_at` | timestamptz          | no   | set by app on update |       |
| `created_by` | uuid                 | yes  |                      |       |

### `school_timings`

Working days, start/end, period length and count per year. Working days and timings per academic year. Period n runs from day_start + (n-1) * period_minutes. No breaks, no rooms. CHECK day_start + period_count * period_minutes <= day_end.

| Item             | Value                                |
| ---------------- | ------------------------------------ |
| Status           | New                                  |
| Tenant column    | school_id NOT NULL                   |
| Written by       | Admin                                |
| Read by          | All members, students, parents       |
| Retention        | Kept                                 |
| Expected size    | 1 per school per year                |
| Keys and indexes | unique (school_id, academic_year_id) |

| Column             | Type        | Null | Default              | Notes |
| ------------------ | ----------- | ---- | -------------------- | ----- |
| `id`               | uuid        | no   | UUIDv7 (app)         | PK    |
| `school_id`        | uuid        | no   |                      |       |
| `academic_year_id` | uuid        | no   |                      |       |
| `working_days`     | smallint[]  | no   |                      |       |
| `day_start`        | time        | no   |                      |       |
| `day_end`          | time        | no   |                      |       |
| `period_minutes`   | smallint    | no   |                      |       |
| `period_count`     | smallint    | no   |                      |       |
| `created_at`       | timestamptz | no   | now()                |       |
| `updated_at`       | timestamptz | no   | set by app on update |       |
| `created_by`       | uuid        | yes  |                      |       |
| `updated_by`       | uuid        | yes  |                      |       |

### `classes`

Classes 1-12. Classes 1 to 12 (CHECK grade BETWEEN 1 AND 12). School-wide, not per year.

| Item             | Value                                            |
| ---------------- | ------------------------------------------------ |
| Status           | New                                              |
| Tenant column    | school_id NOT NULL                               |
| Written by       | Admin                                            |
| Read by          | All members, students, parents                   |
| Retention        | Kept                                             |
| Expected size    | ~12 per school                                   |
| Keys and indexes | unique (school_id, id); unique (school_id, name) |

| Column          | Type          | Null | Default              | Notes |
| --------------- | ------------- | ---- | -------------------- | ----- |
| `id`            | uuid          | no   | UUIDv7 (app)         | PK    |
| `school_id`     | uuid          | no   |                      |       |
| `name`          | text          | no   |                      |       |
| `grade`         | smallint      | no   |                      |       |
| `display_order` | smallint      | no   | 0                    |       |
| `status`        | record_status | no   | active               |       |
| `created_at`    | timestamptz   | no   | now()                |       |
| `updated_at`    | timestamptz   | no   | set by app on update |       |
| `created_by`    | uuid          | yes  |                      |       |

### `sections`

Section of a class in a year. A section of a class in one academic year (sections change every year).

| Item             | Value                                                                        |
| ---------------- | ---------------------------------------------------------------------------- |
| Status           | New                                                                          |
| Tenant column    | school_id NOT NULL                                                           |
| Written by       | Admin                                                                        |
| Read by          | All members; student/parent (own section)                                    |
| Retention        | Kept                                                                         |
| Expected size    | ~40 per school per year                                                      |
| Keys and indexes | unique (school_id, id); unique (school_id, academic_year_id, class_id, name) |

| Column             | Type          | Null | Default              | Notes |
| ------------------ | ------------- | ---- | -------------------- | ----- |
| `id`               | uuid          | no   | UUIDv7 (app)         | PK    |
| `school_id`        | uuid          | no   |                      |       |
| `academic_year_id` | uuid          | no   |                      |       |
| `class_id`         | uuid          | no   |                      |       |
| `name`             | text          | no   |                      |       |
| `capacity`         | smallint      | yes  |                      |       |
| `status`           | record_status | no   | active               |       |
| `created_at`       | timestamptz   | no   | now()                |       |
| `updated_at`       | timestamptz   | no   | set by app on update |       |
| `created_by`       | uuid          | yes  |                      |       |

### `subjects`

Subject catalogue.

| Item             | Value                                            |
| ---------------- | ------------------------------------------------ |
| Status           | New                                              |
| Tenant column    | school_id NOT NULL                               |
| Written by       | Admin                                            |
| Read by          | All members, students, parents                   |
| Retention        | Kept                                             |
| Expected size    | ~20 per school                                   |
| Keys and indexes | unique (school_id, id); unique (school_id, code) |

| Column       | Type          | Null | Default              | Notes |
| ------------ | ------------- | ---- | -------------------- | ----- |
| `id`         | uuid          | no   | UUIDv7 (app)         | PK    |
| `school_id`  | uuid          | no   |                      |       |
| `name`       | text          | no   |                      |       |
| `code`       | text          | no   |                      |       |
| `status`     | record_status | no   | active               |       |
| `created_at` | timestamptz   | no   | now()                |       |
| `updated_at` | timestamptz   | no   | set by app on update |       |
| `created_by` | uuid          | yes  |                      |       |

### `class_subjects`

Which subjects a class studies.

| Item             | Value                                    |
| ---------------- | ---------------------------------------- |
| Status           | New                                      |
| Tenant column    | school_id NOT NULL                       |
| Written by       | Admin                                    |
| Read by          | All members                              |
| Retention        | Kept                                     |
| Expected size    | ~200 per school                          |
| Keys and indexes | unique (school_id, class_id, subject_id) |

| Column       | Type        | Null | Default      | Notes |
| ------------ | ----------- | ---- | ------------ | ----- |
| `id`         | uuid        | no   | UUIDv7 (app) | PK    |
| `school_id`  | uuid        | no   |              |       |
| `class_id`   | uuid        | no   |              |       |
| `subject_id` | uuid        | no   |              |       |
| `created_at` | timestamptz | no   | now()        |       |
| `created_by` | uuid        | yes  |              |       |

## People

### `students`

Student record and profile. One student in one school (Indian model). Login account = user_id (username sch0001s0001). Added by Admin only after offline management approval: CHECK management_approval_confirmed = true. Optional health fields and hobbies never block app use.

| Item             | Value                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------ |
| Status           | New                                                                                        |
| Tenant column    | school_id NOT NULL                                                                         |
| Written by       | Admin (create/edit, audited); student (optional profile fields)                            |
| Read by          | Leadership, Admin, assigned teachers; self; linked parents                                 |
| Retention        | Kept; status inactive/transferred, never deleted                                           |
| Expected size    | ~2 lakh                                                                                    |
| Keys and indexes | unique (school_id, id); unique (school_id, admission_number); index (school_id, full_name) |

| Column                          | Type           | Null | Default              | Notes  |
| ------------------------------- | -------------- | ---- | -------------------- | ------ |
| `id`                            | uuid           | no   | UUIDv7 (app)         | PK     |
| `school_id`                     | uuid           | no   |                      |        |
| `user_id`                       | uuid           | no   |                      | unique |
| `full_name`                     | text           | no   |                      |        |
| `admission_number`              | text           | yes  |                      |        |
| `date_of_birth`                 | date           | yes  |                      |        |
| `gender`                        | gender         | yes  |                      |        |
| `status`                        | student_status | no   | active               |        |
| `student_mobile`                | text           | yes  |                      |        |
| `email`                         | text           | yes  |                      |        |
| `address`                       | text           | yes  |                      |        |
| `emergency_contact_name`        | text           | yes  |                      |        |
| `emergency_contact_phone`       | text           | yes  |                      |        |
| `height_cm`                     | smallint       | yes  |                      |        |
| `weight_kg`                     | smallint       | yes  |                      |        |
| `blood_group`                   | blood_group    | yes  |                      |        |
| `hobbies`                       | text           | yes  |                      |        |
| `custom_fields`                 | jsonb          | no   | "{}"                 |        |
| `profile_completed_at`          | timestamptz    | yes  |                      |        |
| `management_approval_confirmed` | boolean        | no   |                      |        |
| `confirmed_by_user_id`          | uuid           | no   |                      |        |
| `confirmed_at`                  | timestamptz    | no   |                      |        |
| `created_at`                    | timestamptz    | no   | now()                |        |
| `updated_at`                    | timestamptz    | no   | set by app on update |        |
| `created_by`                    | uuid           | yes  |                      |        |
| `updated_by`                    | uuid           | yes  |                      |        |

### `student_field_definitions`

Per-school custom student fields. Per-school definitions for students.custom_fields (no per-school schema changes).

| Item             | Value                   |
| ---------------- | ----------------------- |
| Status           | New                     |
| Tenant column    | school_id NOT NULL      |
| Written by       | Admin                   |
| Read by          | Admin, staff            |
| Retention        | Kept                    |
| Expected size    | Small                   |
| Keys and indexes | unique (school_id, key) |

| Column       | Type          | Null | Default              | Notes |
| ------------ | ------------- | ---- | -------------------- | ----- |
| `id`         | uuid          | no   | UUIDv7 (app)         | PK    |
| `school_id`  | uuid          | no   |                      |       |
| `key`        | text          | no   |                      |       |
| `label`      | text          | no   |                      |       |
| `data_type`  | text          | no   |                      |       |
| `required`   | boolean       | no   | false                |       |
| `status`     | record_status | no   | active               |       |
| `created_at` | timestamptz   | no   | now()                |       |
| `updated_at` | timestamptz   | no   | set by app on update |       |
| `created_by` | uuid          | yes  |                      |       |

### `student_enrollments`

Student in a section for a year (history). One row per student per academic year. Promotion/transfer creates or closes rows, never rewrites history. Partial unique (school_id, section_id, roll_number) WHERE status = 'active'.

| Item             | Value                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------- |
| Status           | New                                                                                     |
| Tenant column    | school_id NOT NULL                                                                      |
| Written by       | Admin (enrol, promote, transfer)                                                        |
| Read by          | Members; self; linked parents                                                           |
| Retention        | Kept                                                                                    |
| Expected size    | ~2 lakh per year                                                                        |
| Keys and indexes | unique (school_id, student_id, academic_year_id); index (school_id, section_id, status) |

| Column             | Type              | Null | Default              | Notes |
| ------------------ | ----------------- | ---- | -------------------- | ----- |
| `id`               | uuid              | no   | UUIDv7 (app)         | PK    |
| `school_id`        | uuid              | no   |                      |       |
| `student_id`       | uuid              | no   |                      |       |
| `academic_year_id` | uuid              | no   |                      |       |
| `section_id`       | uuid              | no   |                      |       |
| `roll_number`      | smallint          | yes  |                      |       |
| `status`           | enrollment_status | no   | active               |       |
| `started_on`       | date              | no   |                      |       |
| `ended_on`         | date              | yes  |                      |       |
| `end_reason`       | text              | yes  |                      |       |
| `created_at`       | timestamptz       | no   | now()                |       |
| `updated_at`       | timestamptz       | no   | set by app on update |       |
| `created_by`       | uuid              | yes  |                      |       |

### `student_guardians`

Guardian name, relation, mobile (parent login key). Guardian contact on the student record. mobile (E.164) is what parent OTP login matches. Only status = active rows create parent links; student-entered rows start as pending.

| Item             | Value                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------- |
| Status           | New                                                                                    |
| Tenant column    | school_id NOT NULL                                                                     |
| Written by       | Admin (active); student profile (pending)                                              |
| Read by          | Admin, leadership, class teacher; parent login lookup (SECURITY DEFINER)               |
| Retention        | Kept; removed rows kept as history                                                     |
| Expected size    | ~3-4 lakh                                                                              |
| Keys and indexes | unique (school_id, id); unique (school_id, student_id, mobile); index (mobile, status) |

| Column         | Type              | Null | Default              | Notes |
| -------------- | ----------------- | ---- | -------------------- | ----- |
| `id`           | uuid              | no   | UUIDv7 (app)         | PK    |
| `school_id`    | uuid              | no   |                      |       |
| `student_id`   | uuid              | no   |                      |       |
| `name`         | text              | no   |                      |       |
| `relation`     | guardian_relation | no   |                      |       |
| `mobile`       | text              | no   |                      |       |
| `is_primary`   | boolean           | no   | false                |       |
| `status`       | guardian_status   | no   | active               |       |
| `source`       | guardian_source   | no   |                      |       |
| `confirmed_by` | uuid              | yes  |                      |       |
| `confirmed_at` | timestamptz       | yes  |                      |       |
| `created_at`   | timestamptz       | no   | now()                |       |
| `updated_at`   | timestamptz       | no   | set by app on update |       |
| `created_by`   | uuid              | yes  |                      |       |
| `updated_by`   | uuid              | yes  |                      |       |

### `parent_student_links`

Parent user <-> student, from verified mobile match. Parent user <-> student, derived from a verified OTP mobile matching an active guardian mobile. Created/refreshed at parent login; revoked when the guardian is removed or the mobile changes.

| Item             | Value                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------- |
| Status           | New                                                                                   |
| Tenant column    | school_id NOT NULL                                                                    |
| Written by       | Parent login (system)                                                                 |
| Read by          | Parent (own); Admin, leadership                                                       |
| Retention        | Kept; revoked rows kept                                                               |
| Expected size    | ~3 lakh                                                                               |
| Keys and indexes | unique (user_id, guardian_id); index (user_id, status); index (school_id, student_id) |

| Column          | Type               | Null | Default      | Notes |
| --------------- | ------------------ | ---- | ------------ | ----- |
| `id`            | uuid               | no   | UUIDv7 (app) | PK    |
| `school_id`     | uuid               | no   |              |       |
| `user_id`       | uuid               | no   |              |       |
| `student_id`    | uuid               | no   |              |       |
| `guardian_id`   | uuid               | no   |              |       |
| `status`        | parent_link_status | no   | active       |       |
| `linked_at`     | timestamptz        | no   | now()        |       |
| `revoked_at`    | timestamptz        | yes  |              |       |
| `revoke_reason` | text               | yes  |              |       |

### `departments`

Configurable department labels. Configurable department labels (non-teaching dashboards, tasks, assets).

| Item             | Value                                            |
| ---------------- | ------------------------------------------------ |
| Status           | New                                              |
| Tenant column    | school_id NOT NULL                               |
| Written by       | Admin                                            |
| Read by          | Members                                          |
| Retention        | Kept                                             |
| Expected size    | Small                                            |
| Keys and indexes | unique (school_id, id); unique (school_id, name) |

| Column       | Type          | Null | Default              | Notes |
| ------------ | ------------- | ---- | -------------------- | ----- |
| `id`         | uuid          | no   | UUIDv7 (app)         | PK    |
| `school_id`  | uuid          | no   |                      |       |
| `name`       | text          | no   |                      |       |
| `status`     | record_status | no   | active               |       |
| `created_at` | timestamptz   | no   | now()                |       |
| `updated_at` | timestamptz   | no   | set by app on update |       |
| `created_by` | uuid          | yes  |                      |       |

### `staff`

Employee record (designation free text). Every school employee with a username (VP, Admin, teaching, non-teaching; Principal optional). designation is FREE TEXT. user_id stays null until the account exists: for teachers, until TEACHER_ADDITION is approved (credentials only after approval).

| Item             | Value                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------ |
| Status           | New                                                                                        |
| Tenant column    | school_id NOT NULL                                                                         |
| Written by       | Principal (VP/Admin), Admin (staff); approvals                                             |
| Read by          | Leadership, Admin; self                                                                    |
| Retention        | Kept; status inactive                                                                      |
| Expected size    | ~25,000                                                                                    |
| Keys and indexes | unique (school_id, id); unique (school_id, user_id); index (school_id, staff_type, status) |

| Column                 | Type         | Null | Default              | Notes |
| ---------------------- | ------------ | ---- | -------------------- | ----- |
| `id`                   | uuid         | no   | UUIDv7 (app)         | PK    |
| `school_id`            | uuid         | no   |                      |       |
| `user_id`              | uuid         | yes  |                      |       |
| `full_name`            | text         | no   |                      |       |
| `staff_type`           | staff_type   | no   |                      |       |
| `designation`          | text         | no   |                      |       |
| `department_id`        | uuid         | yes  |                      |       |
| `mobile`               | text         | yes  |                      |       |
| `email`                | text         | yes  |                      |       |
| `joining_date`         | date         | yes  |                      |       |
| `status`               | staff_status | no   | pending_approval     |       |
| `profile_completed_at` | timestamptz  | yes  |                      |       |
| `created_at`           | timestamptz  | no   | now()                |       |
| `updated_at`           | timestamptz  | no   | set by app on update |       |
| `created_by`           | uuid         | yes  |                      |       |
| `updated_by`           | uuid         | yes  |                      |       |

### `teacher_subject_qualifications`

Subjects a teacher can teach. Subjects a teacher CAN teach (qualification). Separate from current assignments.

| Item             | Value                                    |
| ---------------- | ---------------------------------------- |
| Status           | New                                      |
| Tenant column    | school_id NOT NULL                       |
| Written by       | Admin                                    |
| Read by          | Leadership, Admin, self                  |
| Retention        | Kept                                     |
| Expected size    | Small                                    |
| Keys and indexes | unique (school_id, staff_id, subject_id) |

| Column       | Type        | Null | Default      | Notes |
| ------------ | ----------- | ---- | ------------ | ----- |
| `id`         | uuid        | no   | UUIDv7 (app) | PK    |
| `school_id`  | uuid        | no   |              |       |
| `staff_id`   | uuid        | no   |              |       |
| `subject_id` | uuid        | no   |              |       |
| `created_at` | timestamptz | no   | now()        |       |
| `created_by` | uuid        | yes  |              |       |

### `teacher_assignments`

Current and past class/subject assignments. CURRENT and past assignments. Never overwritten: a trigger allows only setting valid_to on an open row; a change closes the old row and inserts a new one (after TEACHER_ASSIGNMENT_CHANGE approval). CHECK (type = 'class_teacher') = (subject_id IS NULL). Partial unique: one open class teacher per section (WHERE type = 'class_teacher' AND valid_to IS NULL).

| Item             | Value                                                                          |
| ---------------- | ------------------------------------------------------------------------------ |
| Status           | New                                                                            |
| Tenant column    | school_id NOT NULL                                                             |
| Written by       | Admin after approval                                                           |
| Read by          | Leadership, Admin, self; students/parents (teacher names)                      |
| Retention        | Kept forever (history)                                                         |
| Expected size    | ~1 lakh                                                                        |
| Keys and indexes | index (school_id, staff_id, valid_to); index (school_id, section_id, valid_to) |

| Column                | Type                    | Null | Default      | Notes |
| --------------------- | ----------------------- | ---- | ------------ | ----- |
| `id`                  | uuid                    | no   | UUIDv7 (app) | PK    |
| `school_id`           | uuid                    | no   |              |       |
| `academic_year_id`    | uuid                    | no   |              |       |
| `staff_id`            | uuid                    | no   |              |       |
| `section_id`          | uuid                    | no   |              |       |
| `subject_id`          | uuid                    | yes  |              |       |
| `type`                | teacher_assignment_type | no   |              |       |
| `valid_from`          | date                    | no   |              |       |
| `valid_to`            | date                    | yes  |              |       |
| `approval_request_id` | uuid                    | yes  |              |       |
| `created_at`          | timestamptz             | no   | now()        |       |
| `created_by`          | uuid                    | yes  |              |       |

## Attendance and leave

### `attendance_registers`

One submission per section per day. One per section per day: who submitted, when. Drives "marked / not marked" and the same-day edit rule (teacher may resubmit only while attendance_date is today in the school's timezone). idempotency_key stores the Idempotency-Key of the bulk submit.

| Item             | Value                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Status           | New                                                                                                                      |
| Tenant column    | school_id NOT NULL                                                                                                       |
| Written by       | Class teacher, Admin                                                                                                     |
| Read by          | Leadership, Admin, teachers                                                                                              |
| Retention        | Kept                                                                                                                     |
| Expected size    | ~1.8 lakh per year                                                                                                       |
| Keys and indexes | unique (school_id, section_id, attendance_date); unique (school_id, idempotency_key); index (school_id, attendance_date) |

| Column            | Type        | Null | Default              | Notes |
| ----------------- | ----------- | ---- | -------------------- | ----- |
| `id`              | uuid        | no   | UUIDv7 (app)         | PK    |
| `school_id`       | uuid        | no   |                      |       |
| `section_id`      | uuid        | no   |                      |       |
| `attendance_date` | date        | no   |                      |       |
| `present_count`   | smallint    | no   |                      |       |
| `absent_count`    | smallint    | no   |                      |       |
| `submitted_by`    | uuid        | no   |                      |       |
| `submitted_at`    | timestamptz | no   |                      |       |
| `idempotency_key` | text        | yes  |                      |       |
| `updated_at`      | timestamptz | no   | set by app on update |       |

### `student_attendance`

Daily PRESENT/ABSENT per student (partitioned). PRESENT or ABSENT only ("Reset" is a UI action). Monthly range partitions on attendance_date (~4.4 crore rows/year at pilot scale). Partition key is part of the primary key.

| Item             | Value                                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Status           | New                                                                                                                       |
| Tenant column    | school_id NOT NULL                                                                                                        |
| Written by       | Class teacher (same day), Admin (corrections)                                                                             |
| Read by          | Leadership, Admin, teachers; self; linked parents                                                                         |
| Retention        | Kept; old partitions can be archived                                                                                      |
| Expected size    | ~4.4 crore per year (over 10M)                                                                                            |
| Keys and indexes | PK (id, attendance_date); unique (school_id, student_id, attendance_date); index (school_id, section_id, attendance_date) |

| Column            | Type              | Null | Default              | Notes |
| ----------------- | ----------------- | ---- | -------------------- | ----- |
| `id`              | uuid              | no   | UUIDv7 (app)         |       |
| `school_id`       | uuid              | no   |                      |       |
| `attendance_date` | date              | no   |                      |       |
| `student_id`      | uuid              | no   |                      |       |
| `section_id`      | uuid              | no   |                      |       |
| `status`          | attendance_status | no   |                      |       |
| `marked_by`       | uuid              | no   |                      |       |
| `marked_at`       | timestamptz       | no   |                      |       |
| `updated_at`      | timestamptz       | no   | set by app on update |       |
| `updated_by`      | uuid              | yes  |                      |       |

### `attendance_corrections`

Admin correction after the day, with reason. Change after the day: Admin only, reason mandatory (CHECK length(trim(reason)) > 0), plus an audit row.

| Item             | Value                                          |
| ---------------- | ---------------------------------------------- |
| Status           | New                                            |
| Tenant column    | school_id NOT NULL                             |
| Written by       | Admin                                          |
| Read by          | Leadership, Admin                              |
| Retention        | Kept                                           |
| Expected size    | Small                                          |
| Keys and indexes | index (school_id, student_id, attendance_date) |

| Column            | Type              | Null | Default      | Notes |
| ----------------- | ----------------- | ---- | ------------ | ----- |
| `id`              | uuid              | no   | UUIDv7 (app) | PK    |
| `school_id`       | uuid              | no   |              |       |
| `attendance_id`   | uuid              | no   |              |       |
| `attendance_date` | date              | no   |              |       |
| `student_id`      | uuid              | no   |              |       |
| `old_status`      | attendance_status | no   |              |       |
| `new_status`      | attendance_status | no   |              |       |
| `reason`          | text              | no   |              |       |
| `corrected_by`    | uuid              | no   |              |       |
| `corrected_at`    | timestamptz       | no   | now()        |       |

### `staff_attendance`

Daily staff attendance incl. on_leave. Staff attendance, manual only (no biometric). on_leave is written when leave is approved.

| Item             | Value                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Status           | New                                                                               |
| Tenant column    | school_id NOT NULL                                                                |
| Written by       | Admin; leave approval (system)                                                    |
| Read by          | Leadership, Admin; self                                                           |
| Retention        | Kept                                                                              |
| Expected size    | ~55 lakh per year                                                                 |
| Keys and indexes | unique (school_id, staff_id, attendance_date); index (school_id, attendance_date) |

| Column             | Type                    | Null | Default              | Notes |
| ------------------ | ----------------------- | ---- | -------------------- | ----- |
| `id`               | uuid                    | no   | UUIDv7 (app)         | PK    |
| `school_id`        | uuid                    | no   |                      |       |
| `staff_id`         | uuid                    | no   |                      |       |
| `attendance_date`  | date                    | no   |                      |       |
| `status`           | staff_attendance_status | no   |                      |       |
| `leave_request_id` | uuid                    | yes  |                      |       |
| `marked_by`        | uuid                    | no   |                      |       |
| `marked_at`        | timestamptz             | no   |                      |       |
| `updated_at`       | timestamptz             | no   | set by app on update |       |

### `leave_types`

Configurable leave types. Configurable per school (seeded: Casual, Sick, Other).

| Item             | Value                                            |
| ---------------- | ------------------------------------------------ |
| Status           | New                                              |
| Tenant column    | school_id NOT NULL                               |
| Written by       | Admin                                            |
| Read by          | Staff                                            |
| Retention        | Kept                                             |
| Expected size    | ~3 per school                                    |
| Keys and indexes | unique (school_id, id); unique (school_id, name) |

| Column       | Type          | Null | Default              | Notes |
| ------------ | ------------- | ---- | -------------------- | ----- |
| `id`         | uuid          | no   | UUIDv7 (app)         | PK    |
| `school_id`  | uuid          | no   |                      |       |
| `name`       | text          | no   |                      |       |
| `status`     | record_status | no   | active               |       |
| `created_at` | timestamptz   | no   | now()                |       |
| `updated_at` | timestamptz   | no   | set by app on update |       |
| `created_by` | uuid          | yes  |                      |       |

### `leave_requests`

Staff leave application. Staff and non-teaching only (never students). Decided through a STAFF_LEAVE approval (Principal or VP). CHECK to_date >= from_date.

| Item             | Value                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------- |
| Status           | New                                                                                       |
| Tenant column    | school_id NOT NULL                                                                        |
| Written by       | Staff (own); approval (status)                                                            |
| Read by          | Self; Principal, VP, Admin                                                                |
| Retention        | Kept                                                                                      |
| Expected size    | Small                                                                                     |
| Keys and indexes | unique (school_id, id); index (school_id, staff_id, from_date); index (school_id, status) |

| Column                | Type                 | Null | Default              | Notes |
| --------------------- | -------------------- | ---- | -------------------- | ----- |
| `id`                  | uuid                 | no   | UUIDv7 (app)         | PK    |
| `school_id`           | uuid                 | no   |                      |       |
| `staff_id`            | uuid                 | no   |                      |       |
| `leave_type_id`       | uuid                 | no   |                      |       |
| `from_date`           | date                 | no   |                      |       |
| `to_date`             | date                 | no   |                      |       |
| `reason`              | text                 | no   |                      |       |
| `status`              | leave_request_status | no   | pending              |       |
| `approval_request_id` | uuid                 | yes  |                      |       |
| `cancelled_at`        | timestamptz          | yes  |                      |       |
| `created_at`          | timestamptz          | no   | now()                |       |
| `updated_at`          | timestamptz          | no   | set by app on update |       |
| `created_by`          | uuid                 | yes  |                      |       |

## Timetable

### `timetables`

Versioned timetable per section. One version per change. Partial unique: one published timetable per section (WHERE status = 'published').

| Item             | Value                                                           |
| ---------------- | --------------------------------------------------------------- |
| Status           | New                                                             |
| Tenant column    | school_id NOT NULL                                              |
| Written by       | Admin (draft/submit); Principal/VP (publish)                    |
| Read by          | Members; student/parent (published, own section)                |
| Retention        | Kept (all versions)                                             |
| Expected size    | ~40 per school per year                                         |
| Keys and indexes | unique (school_id, id); unique (school_id, section_id, version) |

| Column                | Type             | Null | Default              | Notes |
| --------------------- | ---------------- | ---- | -------------------- | ----- |
| `id`                  | uuid             | no   | UUIDv7 (app)         | PK    |
| `school_id`           | uuid             | no   |                      |       |
| `academic_year_id`    | uuid             | no   |                      |       |
| `section_id`          | uuid             | no   |                      |       |
| `version`             | smallint         | no   |                      |       |
| `status`              | timetable_status | no   | draft                |       |
| `approval_request_id` | uuid             | yes  |                      |       |
| `effective_from`      | date             | yes  |                      |       |
| `published_at`        | timestamptz      | yes  |                      |       |
| `published_by`        | uuid             | yes  |                      |       |
| `created_at`          | timestamptz      | no   | now()                |       |
| `updated_at`          | timestamptz      | no   | set by app on update |       |
| `created_by`          | uuid             | yes  |                      |       |

### `timetable_entries`

Day, period, subject, teacher. Day, period, subject, teacher ONLY (no room, no break). day_of_week ISO 1-7, period_no 1..period_count. Teacher double-booking across sections is checked by the app on validate/approve (not storable as a constraint).

| Item             | Value                                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Status           | New                                                                                                                                   |
| Tenant column    | school_id NOT NULL                                                                                                                    |
| Written by       | Admin                                                                                                                                 |
| Read by          | Members; student/parent (published)                                                                                                   |
| Retention        | Kept                                                                                                                                  |
| Expected size    | ~2,000 per school per version                                                                                                         |
| Keys and indexes | unique (school_id, id); unique (school_id, timetable_id, day_of_week, period_no); index (school_id, staff_id, day_of_week, period_no) |

| Column         | Type        | Null | Default      | Notes |
| -------------- | ----------- | ---- | ------------ | ----- |
| `id`           | uuid        | no   | UUIDv7 (app) | PK    |
| `school_id`    | uuid        | no   |              |       |
| `timetable_id` | uuid        | no   |              |       |
| `day_of_week`  | smallint    | no   |              |       |
| `period_no`    | smallint    | no   |              |       |
| `subject_id`   | uuid        | no   |              |       |
| `staff_id`     | uuid        | no   |              |       |
| `created_at`   | timestamptz | no   | now()        |       |

### `teacher_availability`

Slots a teacher is unavailable. Slots a teacher is NOT available (used by conflict detection).

| Item             | Value                                                |
| ---------------- | ---------------------------------------------------- |
| Status           | New                                                  |
| Tenant column    | school_id NOT NULL                                   |
| Written by       | Admin                                                |
| Read by          | Admin (conflict check)                               |
| Retention        | Kept                                                 |
| Expected size    | Small                                                |
| Keys and indexes | unique (school_id, staff_id, day_of_week, period_no) |

| Column        | Type        | Null | Default      | Notes |
| ------------- | ----------- | ---- | ------------ | ----- |
| `id`          | uuid        | no   | UUIDv7 (app) | PK    |
| `school_id`   | uuid        | no   |              |       |
| `staff_id`    | uuid        | no   |              |       |
| `day_of_week` | smallint    | no   |              |       |
| `period_no`   | smallint    | no   |              |       |
| `reason`      | text        | yes  |              |       |
| `created_at`  | timestamptz | no   | now()        |       |
| `created_by`  | uuid        | yes  |              |       |

### `substitutions`

Substitute for an absent teacher. Assigned manually by Admin. Partial unique: a substitute covers one class per period (school_id, substitute_staff_id, substitution_date, period_no) WHERE status = 'assigned'.

| Item             | Value                                |
| ---------------- | ------------------------------------ |
| Status           | New                                  |
| Tenant column    | school_id NOT NULL                   |
| Written by       | Admin                                |
| Read by          | Leadership, Admin, teachers involved |
| Retention        | Kept                                 |
| Expected size    | Small                                |
| Keys and indexes | index (school_id, substitution_date) |

| Column                | Type                | Null | Default              | Notes |
| --------------------- | ------------------- | ---- | -------------------- | ----- |
| `id`                  | uuid                | no   | UUIDv7 (app)         | PK    |
| `school_id`           | uuid                | no   |                      |       |
| `substitution_date`   | date                | no   |                      |       |
| `period_no`           | smallint            | no   |                      |       |
| `section_id`          | uuid                | no   |                      |       |
| `timetable_entry_id`  | uuid                | yes  |                      |       |
| `absent_staff_id`     | uuid                | no   |                      |       |
| `substitute_staff_id` | uuid                | no   |                      |       |
| `reason`              | text                | yes  |                      |       |
| `status`              | substitution_status | no   | assigned             |       |
| `assigned_by`         | uuid                | no   |                      |       |
| `created_at`          | timestamptz         | no   | now()                |       |
| `updated_at`          | timestamptz         | no   | set by app on update |       |

## Exams and results

### `exams`

Exam in an academic year.

| Item             | Value                                                              |
| ---------------- | ------------------------------------------------------------------ |
| Status           | New                                                                |
| Tenant column    | school_id NOT NULL                                                 |
| Written by       | Admin                                                              |
| Read by          | Members; students, parents                                         |
| Retention        | Kept                                                               |
| Expected size    | Small                                                              |
| Keys and indexes | unique (school_id, id); unique (school_id, academic_year_id, name) |

| Column             | Type        | Null | Default              | Notes |
| ------------------ | ----------- | ---- | -------------------- | ----- |
| `id`               | uuid        | no   | UUIDv7 (app)         | PK    |
| `school_id`        | uuid        | no   |                      |       |
| `academic_year_id` | uuid        | no   |                      |       |
| `name`             | text        | no   |                      |       |
| `exam_type`        | text        | yes  |                      |       |
| `status`           | exam_status | no   | draft                |       |
| `starts_on`        | date        | yes  |                      |       |
| `ends_on`          | date        | yes  |                      |       |
| `created_at`       | timestamptz | no   | now()                |       |
| `updated_at`       | timestamptz | no   | set by app on update |       |
| `created_by`       | uuid        | yes  |                      |       |

### `exam_subjects`

Class + subject + date + max marks. One class + subject in an exam (replaces a separate exam_classes table).

| Item             | Value                                                                     |
| ---------------- | ------------------------------------------------------------------------- |
| Status           | New                                                                       |
| Tenant column    | school_id NOT NULL                                                        |
| Written by       | Admin                                                                     |
| Read by          | Members; students, parents                                                |
| Retention        | Kept                                                                      |
| Expected size    | Small                                                                     |
| Keys and indexes | unique (school_id, id); unique (school_id, exam_id, class_id, subject_id) |

| Column       | Type         | Null | Default              | Notes |
| ------------ | ------------ | ---- | -------------------- | ----- |
| `id`         | uuid         | no   | UUIDv7 (app)         | PK    |
| `school_id`  | uuid         | no   |                      |       |
| `exam_id`    | uuid         | no   |                      |       |
| `class_id`   | uuid         | no   |                      |       |
| `subject_id` | uuid         | no   |                      |       |
| `exam_date`  | date         | yes  |                      |       |
| `max_marks`  | numeric(6,2) | no   |                      |       |
| `pass_marks` | numeric(6,2) | yes  |                      |       |
| `created_at` | timestamptz  | no   | now()                |       |
| `updated_at` | timestamptz  | no   | set by app on update |       |
| `created_by` | uuid         | yes  |                      |       |

### `marks_entries`

Marks per student per exam subject. Entered by the assigned subject teacher. CHECK is_absent OR marks_obtained IS NOT NULL; marks_obtained <= exam_subjects.max_marks is an app check (cross-table).

| Item             | Value                                                                          |
| ---------------- | ------------------------------------------------------------------------------ |
| Status           | New                                                                            |
| Tenant column    | school_id NOT NULL                                                             |
| Written by       | Assigned subject teacher                                                       |
| Read by          | Leadership, Admin, the teacher                                                 |
| Retention        | Kept                                                                           |
| Expected size    | ~20 lakh per year                                                              |
| Keys and indexes | unique (school_id, exam_subject_id, student_id); index (school_id, student_id) |

| Column            | Type               | Null | Default              | Notes |
| ----------------- | ------------------ | ---- | -------------------- | ----- |
| `id`              | uuid               | no   | UUIDv7 (app)         | PK    |
| `school_id`       | uuid               | no   |                      |       |
| `exam_subject_id` | uuid               | no   |                      |       |
| `student_id`      | uuid               | no   |                      |       |
| `marks_obtained`  | numeric(6,2)       | yes  |                      |       |
| `is_absent`       | boolean            | no   | false                |       |
| `remarks`         | text               | yes  |                      |       |
| `status`          | marks_entry_status | no   | draft                |       |
| `entered_by`      | uuid               | no   |                      |       |
| `submitted_at`    | timestamptz        | yes  |                      |       |
| `created_at`      | timestamptz        | no   | now()                |       |
| `updated_at`      | timestamptz        | no   | set by app on update |       |

### `result_sets`

Unit of result approval and publication. Unit of result approval and publication: one exam, one class, one version. Only published sets are visible to students and parents. A rejected set is kept; recompiling creates version + 1.

| Item             | Value                                                                  |
| ---------------- | ---------------------------------------------------------------------- |
| Status           | New                                                                    |
| Tenant column    | school_id NOT NULL                                                     |
| Written by       | Admin (compile/submit); Principal/VP (approve, publish)                |
| Read by          | Leadership, Admin; students/parents only when published                |
| Retention        | Kept (all versions)                                                    |
| Expected size    | Small                                                                  |
| Keys and indexes | unique (school_id, id); unique (school_id, exam_id, class_id, version) |

| Column                | Type              | Null | Default              | Notes |
| --------------------- | ----------------- | ---- | -------------------- | ----- |
| `id`                  | uuid              | no   | UUIDv7 (app)         | PK    |
| `school_id`           | uuid              | no   |                      |       |
| `exam_id`             | uuid              | no   |                      |       |
| `class_id`            | uuid              | no   |                      |       |
| `version`             | smallint          | no   | 1                    |       |
| `status`              | result_set_status | no   | compiled             |       |
| `approval_request_id` | uuid              | yes  |                      |       |
| `compiled_by`         | uuid              | no   |                      |       |
| `compiled_at`         | timestamptz       | no   |                      |       |
| `published_by`        | uuid              | yes  |                      |       |
| `published_at`        | timestamptz       | yes  |                      |       |
| `created_at`          | timestamptz       | no   | now()                |       |
| `updated_at`          | timestamptz       | no   | set by app on update |       |

### `student_results`

Report-card snapshot per student. Compiled result per student = report-card snapshot. subject_lines JSONB: [{subjectId, name, max, obtained, absent, grade}]. Never edited after the set is published.

| Item             | Value                                                                        |
| ---------------- | ---------------------------------------------------------------------------- |
| Status           | New                                                                          |
| Tenant column    | school_id NOT NULL                                                           |
| Written by       | Result compilation (system)                                                  |
| Read by          | Leadership, Admin, teachers; self/parents when published                     |
| Retention        | Kept                                                                         |
| Expected size    | ~4 lakh per year                                                             |
| Keys and indexes | unique (school_id, result_set_id, student_id); index (school_id, student_id) |

| Column           | Type         | Null | Default      | Notes |
| ---------------- | ------------ | ---- | ------------ | ----- |
| `id`             | uuid         | no   | UUIDv7 (app) | PK    |
| `school_id`      | uuid         | no   |              |       |
| `result_set_id`  | uuid         | no   |              |       |
| `student_id`     | uuid         | no   |              |       |
| `section_name`   | text         | no   |              |       |
| `total_obtained` | numeric(7,2) | no   |              |       |
| `total_max`      | numeric(7,2) | no   |              |       |
| `percentage`     | numeric(5,2) | no   |              |       |
| `grade`          | text         | yes  |              |       |
| `result_label`   | text         | yes  |              |       |
| `subject_lines`  | jsonb        | no   |              |       |
| `created_at`     | timestamptz  | no   | now()        |       |

### `homework`

Homework for a section and subject. Homework for a section and subject. No student file submissions in V1 (completion only).

| Item             | Value                                                         |
| ---------------- | ------------------------------------------------------------- |
| Status           | New                                                           |
| Tenant column    | school_id NOT NULL                                            |
| Written by       | Teacher                                                       |
| Read by          | Members; students/parents (own section, published)            |
| Retention        | Kept                                                          |
| Expected size    | ~1 lakh per year                                              |
| Keys and indexes | unique (school_id, id); index (school_id, section_id, due_on) |

| Column             | Type            | Null | Default              | Notes |
| ------------------ | --------------- | ---- | -------------------- | ----- |
| `id`               | uuid            | no   | UUIDv7 (app)         | PK    |
| `school_id`        | uuid            | no   |                      |       |
| `academic_year_id` | uuid            | no   |                      |       |
| `section_id`       | uuid            | no   |                      |       |
| `subject_id`       | uuid            | no   |                      |       |
| `staff_id`         | uuid            | no   |                      |       |
| `title`            | text            | no   |                      |       |
| `description`      | text            | yes  |                      |       |
| `assigned_on`      | date            | no   |                      |       |
| `due_on`           | date            | no   |                      |       |
| `status`           | homework_status | no   | draft                |       |
| `published_at`     | timestamptz     | yes  |                      |       |
| `created_at`       | timestamptz     | no   | now()                |       |
| `updated_at`       | timestamptz     | no   | set by app on update |       |
| `created_by`       | uuid            | yes  |                      |       |

### `homework_completions`

Completed / not completed per student. Marked by the teacher; shown read-only to the student and parent.

| Item             | Value                                       |
| ---------------- | ------------------------------------------- |
| Status           | New                                         |
| Tenant column    | school_id NOT NULL                          |
| Written by       | Teacher                                     |
| Read by          | Teacher, leadership; self; linked parents   |
| Retention        | Kept                                        |
| Expected size    | ~2 crore per year if fully tracked          |
| Keys and indexes | unique (school_id, homework_id, student_id) |

| Column        | Type                       | Null | Default      | Notes |
| ------------- | -------------------------- | ---- | ------------ | ----- |
| `id`          | uuid                       | no   | UUIDv7 (app) | PK    |
| `school_id`   | uuid                       | no   |              |       |
| `homework_id` | uuid                       | no   |              |       |
| `student_id`  | uuid                       | no   |              |       |
| `status`      | homework_completion_status | no   |              |       |
| `marked_by`   | uuid                       | no   |              |       |
| `marked_at`   | timestamptz                | no   |              |       |

### `lesson_plans`

Teacher lesson plan.

| Item             | Value                                   |
| ---------------- | --------------------------------------- |
| Status           | New                                     |
| Tenant column    | school_id NOT NULL                      |
| Written by       | Teacher                                 |
| Read by          | Self, leadership, Admin                 |
| Retention        | Kept                                    |
| Expected size    | Small                                   |
| Keys and indexes | index (school_id, staff_id, planned_on) |

| Column         | Type               | Null | Default              | Notes |
| -------------- | ------------------ | ---- | -------------------- | ----- |
| `id`           | uuid               | no   | UUIDv7 (app)         | PK    |
| `school_id`    | uuid               | no   |                      |       |
| `staff_id`     | uuid               | no   |                      |       |
| `section_id`   | uuid               | no   |                      |       |
| `subject_id`   | uuid               | no   |                      |       |
| `chapter`      | text               | no   |                      |       |
| `topic`        | text               | no   |                      |       |
| `objectives`   | text               | yes  |                      |       |
| `planned_on`   | date               | no   |                      |       |
| `status`       | lesson_plan_status | no   | planned              |       |
| `completed_on` | date               | yes  |                      |       |
| `created_at`   | timestamptz        | no   | now()                |       |
| `updated_at`   | timestamptz        | no   | set by app on update |       |

## Approvals

### `approval_requests`

Generic approval request with payload snapshot. payload = snapshot of what is being approved (validated per type by the app). decided_by = the real approver (Principal or VP, by permission approvals.decide; never the requester). First decision wins (UPDATE ... WHERE status = 'pending'). CHECK status <> 'rejected' OR length(trim(rejection_reason)) > 0. Resubmission = new row, version + 1, parent_request_id -> the rejected one. History is never overwritten.

| Item             | Value                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Status           | New                                                                                                                                         |
| Tenant column    | school_id NOT NULL                                                                                                                          |
| Written by       | Admin, staff (leave), system                                                                                                                |
| Read by          | Principal, VP (inbox); requester                                                                                                            |
| Retention        | Kept forever                                                                                                                                |
| Expected size    | Small                                                                                                                                       |
| Keys and indexes | unique (school_id, id); index (school_id, status, submitted_at); index (school_id, requested_by); index (school_id, entity_type, entity_id) |

| Column              | Type            | Null | Default              | Notes  |
| ------------------- | --------------- | ---- | -------------------- | ------ |
| `id`                | uuid            | no   | UUIDv7 (app)         | PK     |
| `school_id`         | uuid            | no   |                      |        |
| `type`              | approval_type   | no   |                      |        |
| `entity_type`       | text            | no   |                      |        |
| `entity_id`         | uuid            | yes  |                      |        |
| `payload`           | jsonb           | no   |                      |        |
| `status`            | approval_status | no   | draft                |        |
| `version`           | smallint        | no   | 1                    |        |
| `parent_request_id` | uuid            | yes  |                      | unique |
| `requested_by`      | uuid            | no   |                      |        |
| `submitted_at`      | timestamptz     | yes  |                      |        |
| `decided_by`        | uuid            | yes  |                      |        |
| `decided_at`        | timestamptz     | yes  |                      |        |
| `decision_comment`  | text            | yes  |                      |        |
| `rejection_reason`  | text            | yes  |                      |        |
| `created_at`        | timestamptz     | no   | now()                |        |
| `updated_at`        | timestamptz     | no   | set by app on update |        |

### `approval_actions`

Append-only approval history. Append-only history of every step (app role: INSERT and SELECT only).

| Item             | Value                                     |
| ---------------- | ----------------------------------------- |
| Status           | New                                       |
| Tenant column    | school_id NOT NULL                        |
| Written by       | Approval engine                           |
| Read by          | Principal, VP, requester, Admin           |
| Retention        | Kept forever                              |
| Expected size    | Small                                     |
| Keys and indexes | index (school_id, request_id, created_at) |

| Column          | Type                 | Null | Default      | Notes |
| --------------- | -------------------- | ---- | ------------ | ----- |
| `id`            | uuid                 | no   | UUIDv7 (app) | PK    |
| `school_id`     | uuid                 | no   |              |       |
| `request_id`    | uuid                 | no   |              |       |
| `actor_user_id` | uuid                 | no   |              |       |
| `actor_role`    | role                 | no   |              |       |
| `action`        | approval_action_type | no   |              |       |
| `comment`       | text                 | yes  |              |       |
| `reason`        | text                 | yes  |              |       |
| `created_at`    | timestamptz          | no   | now()        |       |

## Notices and notifications

### `notices`

Announcement (draft/scheduled/published). One-way broadcast (not messaging). No attachments in V1.

| Item             | Value                                                           |
| ---------------- | --------------------------------------------------------------- |
| Status           | New                                                             |
| Tenant column    | school_id NOT NULL                                              |
| Written by       | Principal, Admin                                                |
| Read by          | Audience members, students, parents                             |
| Retention        | Kept                                                            |
| Expected size    | Small                                                           |
| Keys and indexes | unique (school_id, id); index (school_id, status, published_at) |

| Column         | Type          | Null | Default              | Notes |
| -------------- | ------------- | ---- | -------------------- | ----- |
| `id`           | uuid          | no   | UUIDv7 (app)         | PK    |
| `school_id`    | uuid          | no   |                      |       |
| `title`        | text          | no   |                      |       |
| `body`         | text          | no   |                      |       |
| `status`       | notice_status | no   | draft                |       |
| `publish_at`   | timestamptz   | yes  |                      |       |
| `published_at` | timestamptz   | yes  |                      |       |
| `published_by` | uuid          | yes  |                      |       |
| `expires_at`   | timestamptz   | yes  |                      |       |
| `created_at`   | timestamptz   | no   | now()                |       |
| `updated_at`   | timestamptz   | no   | set by app on update |       |
| `created_by`   | uuid          | yes  |                      |       |
| `updated_by`   | uuid          | yes  |                      |       |

### `notice_audiences`

Who a notice targets. CHECK: class -> class_id; section -> section_id; staff_group -> staff_group; whole_school -> none.

| Item             | Value                        |
| ---------------- | ---------------------------- |
| Status           | New                          |
| Tenant column    | school_id NOT NULL           |
| Written by       | Principal, Admin             |
| Read by          | Notice delivery              |
| Retention        | Kept                         |
| Expected size    | Small                        |
| Keys and indexes | index (school_id, notice_id) |

| Column          | Type                 | Null | Default      | Notes |
| --------------- | -------------------- | ---- | ------------ | ----- |
| `id`            | uuid                 | no   | UUIDv7 (app) | PK    |
| `school_id`     | uuid                 | no   |              |       |
| `notice_id`     | uuid                 | no   |              |       |
| `audience_type` | notice_audience_type | no   |              |       |
| `class_id`      | uuid                 | yes  |              |       |
| `section_id`    | uuid                 | yes  |              |       |
| `staff_group`   | staff_group          | yes  |              |       |

### `calendar_events`

Holiday, exam, meeting, activity. Holidays, exams, meetings, activities (holidays are calendar events, not a separate table).

| Item             | Value                                    |
| ---------------- | ---------------------------------------- |
| Status           | New                                      |
| Tenant column    | school_id NOT NULL                       |
| Written by       | Principal, Admin                         |
| Read by          | Members, students, parents (by audience) |
| Retention        | Kept                                     |
| Expected size    | Small                                    |
| Keys and indexes | index (school_id, starts_on)             |

| Column        | Type                | Null | Default              | Notes |
| ------------- | ------------------- | ---- | -------------------- | ----- |
| `id`          | uuid                | no   | UUIDv7 (app)         | PK    |
| `school_id`   | uuid                | no   |                      |       |
| `type`        | calendar_event_type | no   |                      |       |
| `title`       | text                | no   |                      |       |
| `description` | text                | yes  |                      |       |
| `starts_on`   | date                | no   |                      |       |
| `ends_on`     | date                | no   |                      |       |
| `audience`    | calendar_audience   | no   | everyone             |       |
| `exam_id`     | uuid                | yes  |                      |       |
| `created_at`  | timestamptz         | no   | now()                |       |
| `updated_at`  | timestamptz         | no   | set by app on update |       |
| `created_by`  | uuid                | yes  |                      |       |

### `notifications`

In-app notification per recipient (partitioned). In-app notification (push is sent from the same row by the worker). recipient is always a user (parents are users after their first OTP login). student_id gives a parent the child context; school_id the school context (null only for platform events such as verification decisions). Monthly partitions, 90-day retention.

| Item             | Value                                                      |
| ---------------- | ---------------------------------------------------------- |
| Status           | New                                                        |
| Tenant column    | school_id nullable                                         |
| Written by       | Worker                                                     |
| Read by          | Recipient only                                             |
| Retention        | 90 days (drop old partitions)                              |
| Expected size    | Crores per year (over 10M)                                 |
| Keys and indexes | PK (id, created_at); index (recipient_user_id, created_at) |

| Column              | Type               | Null | Default      | Notes |
| ------------------- | ------------------ | ---- | ------------ | ----- |
| `id`                | uuid               | no   | UUIDv7 (app) |       |
| `created_at`        | timestamptz        | no   | now()        |       |
| `school_id`         | uuid               | yes  |              |       |
| `recipient_user_id` | uuid               | no   |              |       |
| `student_id`        | uuid               | yes  |              |       |
| `event`             | notification_event | no   |              |       |
| `title`             | text               | no   |              |       |
| `body`              | text               | no   |              |       |
| `entity_type`       | text               | yes  |              |       |
| `entity_id`         | uuid               | yes  |              |       |
| `payload`           | jsonb              | no   | "{}"         |       |
| `read_at`           | timestamptz        | yes  |              |       |

### `outbox_events`

Domain events for the worker. Domain events written in the same transaction as the change; a relay claims them through a SECURITY DEFINER function and pushes them to BullMQ. Published rows are purged after 7 days.

| Item             | Value                               |
| ---------------- | ----------------------------------- |
| Status           | New                                 |
| Tenant column    | school_id nullable                  |
| Written by       | Same transaction as the change      |
| Read by          | Relay (SECURITY DEFINER claim)      |
| Retention        | Published rows deleted after 7 days |
| Expected size    | Short-lived                         |
| Keys and indexes | index (published_at, available_at)  |

| Column         | Type        | Null | Default      | Notes |
| -------------- | ----------- | ---- | ------------ | ----- |
| `id`           | uuid        | no   | UUIDv7 (app) | PK    |
| `school_id`    | uuid        | yes  |              |       |
| `event_type`   | text        | no   |              |       |
| `payload`      | jsonb       | no   |              |       |
| `created_at`   | timestamptz | no   | now()        |       |
| `available_at` | timestamptz | no   | now()        |       |
| `claimed_at`   | timestamptz | yes  |              |       |
| `published_at` | timestamptz | yes  |              |       |
| `attempts`     | smallint    | no   | 0            |       |
| `last_error`   | text        | yes  |              |       |

## Non-teaching

### `duty_schedules`

Weekly or one-off duties. Either a weekly duty (day_of_week) or a one-off (duty_date). CHECK exactly one is set.

| Item             | Value                       |
| ---------------- | --------------------------- |
| Status           | New                         |
| Tenant column    | school_id NOT NULL          |
| Written by       | Admin                       |
| Read by          | Self, Admin, leadership     |
| Retention        | Kept                        |
| Expected size    | Small                       |
| Keys and indexes | index (school_id, staff_id) |

| Column        | Type        | Null | Default              | Notes |
| ------------- | ----------- | ---- | -------------------- | ----- |
| `id`          | uuid        | no   | UUIDv7 (app)         | PK    |
| `school_id`   | uuid        | no   |                      |       |
| `staff_id`    | uuid        | no   |                      |       |
| `duty_date`   | date        | yes  |                      |       |
| `day_of_week` | smallint    | yes  |                      |       |
| `start_time`  | time        | no   |                      |       |
| `end_time`    | time        | no   |                      |       |
| `location`    | text        | yes  |                      |       |
| `duty`        | text        | no   |                      |       |
| `created_at`  | timestamptz | no   | now()                |       |
| `updated_at`  | timestamptz | no   | set by app on update |       |
| `created_by`  | uuid        | yes  |                      |       |

### `tasks`

Task assigned to a staff member.

| Item             | Value                                           |
| ---------------- | ----------------------------------------------- |
| Status           | New                                             |
| Tenant column    | school_id NOT NULL                              |
| Written by       | Admin, VP, Principal                            |
| Read by          | Assignee, assigner, leadership                  |
| Retention        | Kept                                            |
| Expected size    | Small                                           |
| Keys and indexes | index (school_id, assigned_to_staff_id, status) |

| Column                 | Type          | Null | Default              | Notes |
| ---------------------- | ------------- | ---- | -------------------- | ----- |
| `id`                   | uuid          | no   | UUIDv7 (app)         | PK    |
| `school_id`            | uuid          | no   |                      |       |
| `title`                | text          | no   |                      |       |
| `description`          | text          | yes  |                      |       |
| `assigned_to_staff_id` | uuid          | no   |                      |       |
| `department_id`        | uuid          | yes  |                      |       |
| `assigned_by`          | uuid          | no   |                      |       |
| `due_at`               | timestamptz   | yes  |                      |       |
| `priority`             | task_priority | no   | medium               |       |
| `status`               | task_status   | no   | open                 |       |
| `completed_at`         | timestamptz   | yes  |                      |       |
| `created_at`           | timestamptz   | no   | now()                |       |
| `updated_at`           | timestamptz   | no   | set by app on update |       |

### `assets`

Individually tracked asset. Individually tracked item (projector, laptop). Counted stock lives in inventory_items.

| Item             | Value                                                  |
| ---------------- | ------------------------------------------------------ |
| Status           | New                                                    |
| Tenant column    | school_id NOT NULL                                     |
| Written by       | Admin, non-teaching (inventory permission)             |
| Read by          | Admin, leadership, inventory staff                     |
| Retention        | Kept                                                   |
| Expected size    | Small                                                  |
| Keys and indexes | unique (school_id, id); unique (school_id, asset_code) |

| Column          | Type            | Null | Default              | Notes |
| --------------- | --------------- | ---- | -------------------- | ----- |
| `id`            | uuid            | no   | UUIDv7 (app)         | PK    |
| `school_id`     | uuid            | no   |                      |       |
| `asset_code`    | text            | no   |                      |       |
| `name`          | text            | no   |                      |       |
| `category`      | text            | no   |                      |       |
| `department_id` | uuid            | yes  |                      |       |
| `condition`     | asset_condition | no   | good                 |       |
| `status`        | asset_status    | no   | in_stock             |       |
| `purchase_date` | date            | yes  |                      |       |
| `notes`         | text            | yes  |                      |       |
| `created_at`    | timestamptz     | no   | now()                |       |
| `updated_at`    | timestamptz     | no   | set by app on update |       |
| `created_by`    | uuid            | yes  |                      |       |

### `asset_assignments`

Who holds an asset. CHECK staff_id IS NOT NULL OR department_id IS NOT NULL. Partial unique: one open assignment per asset (WHERE returned_at IS NULL).

| Item             | Value                       |
| ---------------- | --------------------------- |
| Status           | New                         |
| Tenant column    | school_id NOT NULL          |
| Written by       | Inventory staff, Admin      |
| Read by          | Same                        |
| Retention        | Kept                        |
| Expected size    | Small                       |
| Keys and indexes | index (school_id, asset_id) |

| Column          | Type        | Null | Default      | Notes |
| --------------- | ----------- | ---- | ------------ | ----- |
| `id`            | uuid        | no   | UUIDv7 (app) | PK    |
| `school_id`     | uuid        | no   |              |       |
| `asset_id`      | uuid        | no   |              |       |
| `staff_id`      | uuid        | yes  |              |       |
| `department_id` | uuid        | yes  |              |       |
| `assigned_by`   | uuid        | no   |              |       |
| `assigned_at`   | timestamptz | no   | now()        |       |
| `returned_at`   | timestamptz | yes  |              |       |
| `notes`         | text        | yes  |              |       |

### `inventory_items`

Counted stock. Counted stock. CHECK quantity_on_hand >= 0; changed only together with an inventory_movements row.

| Item             | Value                                            |
| ---------------- | ------------------------------------------------ |
| Status           | New                                              |
| Tenant column    | school_id NOT NULL                               |
| Written by       | Inventory staff, Admin                           |
| Read by          | Same                                             |
| Retention        | Kept                                             |
| Expected size    | Small                                            |
| Keys and indexes | unique (school_id, id); unique (school_id, name) |

| Column             | Type          | Null | Default              | Notes |
| ------------------ | ------------- | ---- | -------------------- | ----- |
| `id`               | uuid          | no   | UUIDv7 (app)         | PK    |
| `school_id`        | uuid          | no   |                      |       |
| `name`             | text          | no   |                      |       |
| `category`         | text          | yes  |                      |       |
| `unit`             | text          | no   |                      |       |
| `quantity_on_hand` | integer       | no   | 0                    |       |
| `reorder_level`    | integer       | yes  |                      |       |
| `status`           | record_status | no   | active               |       |
| `created_at`       | timestamptz   | no   | now()                |       |
| `updated_at`       | timestamptz   | no   | set by app on update |       |
| `created_by`       | uuid          | yes  |                      |       |

### `inventory_movements`

Stock in/issue/return/adjust history. Issue/return/stock-in/adjustment history (append-only). CHECK quantity > 0.

| Item             | Value                                  |
| ---------------- | -------------------------------------- |
| Status           | New                                    |
| Tenant column    | school_id NOT NULL                     |
| Written by       | Inventory staff, Admin                 |
| Read by          | Same                                   |
| Retention        | Kept                                   |
| Expected size    | Small                                  |
| Keys and indexes | index (school_id, item_id, created_at) |

| Column          | Type                    | Null | Default      | Notes |
| --------------- | ----------------------- | ---- | ------------ | ----- |
| `id`            | uuid                    | no   | UUIDv7 (app) | PK    |
| `school_id`     | uuid                    | no   |              |       |
| `item_id`       | uuid                    | no   |              |       |
| `type`          | inventory_movement_type | no   |              |       |
| `quantity`      | integer                 | no   |              |       |
| `staff_id`      | uuid                    | yes  |              |       |
| `department_id` | uuid                    | yes  |              |       |
| `note`          | text                    | yes  |              |       |
| `created_at`    | timestamptz             | no   | now()        |       |
| `created_by`    | uuid                    | no   |              |       |

### `maintenance_requests`

Repair request.

| Item             | Value                          |
| ---------------- | ------------------------------ |
| Status           | New                            |
| Tenant column    | school_id NOT NULL             |
| Written by       | Any staff                      |
| Read by          | Raiser, inventory staff, Admin |
| Retention        | Kept                           |
| Expected size    | Small                          |
| Keys and indexes | index (school_id, status)      |

| Column            | Type               | Null | Default              | Notes |
| ----------------- | ------------------ | ---- | -------------------- | ----- |
| `id`              | uuid               | no   | UUIDv7 (app)         | PK    |
| `school_id`       | uuid               | no   |                      |       |
| `asset_id`        | uuid               | yes  |                      |       |
| `title`           | text               | no   |                      |       |
| `description`     | text               | yes  |                      |       |
| `raised_by`       | uuid               | no   |                      |       |
| `status`          | maintenance_status | no   | open                 |       |
| `resolved_at`     | timestamptz        | yes  |                      |       |
| `resolution_note` | text               | yes  |                      |       |
| `created_at`      | timestamptz        | no   | now()                |       |
| `updated_at`      | timestamptz        | no   | set by app on update |       |

## Import and documents

### `import_jobs`

Excel import (3 templates). One Excel upload (3 templates). A teaching-staff import raises one TEACHER_ADDITION approval for the job; credentials are generated only after approval.

| Item             | Value                                                 |
| ---------------- | ----------------------------------------------------- |
| Status           | New                                                   |
| Tenant column    | school_id NOT NULL                                    |
| Written by       | Admin                                                 |
| Read by          | Admin                                                 |
| Retention        | Kept                                                  |
| Expected size    | Small                                                 |
| Keys and indexes | unique (school_id, id); index (school_id, created_at) |

| Column                | Type              | Null | Default              | Notes |
| --------------------- | ----------------- | ---- | -------------------- | ----- |
| `id`                  | uuid              | no   | UUIDv7 (app)         | PK    |
| `school_id`           | uuid              | no   |                      |       |
| `type`                | import_type       | no   |                      |       |
| `file_id`             | uuid              | no   |                      |       |
| `status`              | import_job_status | no   | uploaded             |       |
| `total_rows`          | integer           | no   | 0                    |       |
| `valid_rows`          | integer           | no   | 0                    |       |
| `invalid_rows`        | integer           | no   | 0                    |       |
| `imported_rows`       | integer           | no   | 0                    |       |
| `approval_request_id` | uuid              | yes  |                      |       |
| `completed_at`        | timestamptz       | yes  |                      |       |
| `created_at`          | timestamptz       | no   | now()                |       |
| `updated_at`          | timestamptz       | no   | set by app on update |       |
| `created_by`          | uuid              | yes  |                      |       |

### `import_rows`

Row-level validation results. Row-level validation result. raw_data holds personal data: rows are purged 30 days after the job closes.

| Item             | Value                                  |
| ---------------- | -------------------------------------- |
| Status           | New                                    |
| Tenant column    | school_id NOT NULL                     |
| Written by       | Import worker                          |
| Read by          | Admin                                  |
| Retention        | Purged 30 days after the job closes    |
| Expected size    | Temporary                              |
| Keys and indexes | unique (school_id, job_id, row_number) |

| Column              | Type               | Null | Default      | Notes |
| ------------------- | ------------------ | ---- | ------------ | ----- |
| `id`                | uuid               | no   | UUIDv7 (app) | PK    |
| `school_id`         | uuid               | no   |              |       |
| `job_id`            | uuid               | no   |              |       |
| `row_number`        | integer            | no   |              |       |
| `raw_data`          | jsonb              | no   |              |       |
| `errors`            | jsonb              | no   | "[]"         |       |
| `outcome`           | import_row_outcome | no   | pending      |       |
| `created_entity_id` | uuid               | yes  |              |       |
| `created_at`        | timestamptz        | no   | now()        |       |

### `files`

Object-storage metadata. Object-storage metadata. storage_key starts with '<school_id>/' (CHECK); private bucket, presigned URLs.

| Item             | Value                          |
| ---------------- | ------------------------------ |
| Status           | New                            |
| Tenant column    | school_id NOT NULL             |
| Written by       | Uploader (presigned flow)      |
| Read by          | By owning record's permission  |
| Retention        | Deleted with the owning record |
| Expected size    | Small                          |
| Keys and indexes | unique (school_id, id)         |

| Column          | Type         | Null | Default              | Notes  |
| --------------- | ------------ | ---- | -------------------- | ------ |
| `id`            | uuid         | no   | UUIDv7 (app)         | PK     |
| `school_id`     | uuid         | no   |                      |        |
| `purpose`       | file_purpose | no   |                      |        |
| `storage_key`   | text         | no   |                      | unique |
| `original_name` | text         | no   |                      |        |
| `mime_type`     | text         | no   |                      |        |
| `size_bytes`    | integer      | no   |                      |        |
| `status`        | file_status  | no   | pending_upload       |        |
| `uploaded_by`   | uuid         | no   |                      |        |
| `created_at`    | timestamptz  | no   | now()                |        |
| `updated_at`    | timestamptz  | no   | set by app on update |        |

### `documents`

Admin-side document. Admin-side documents (not student-facing). Optional link to a student, staff member or year.

| Item             | Value                            |
| ---------------- | -------------------------------- |
| Status           | New                              |
| Tenant column    | school_id NOT NULL               |
| Written by       | Admin                            |
| Read by          | Leadership/Admin by access level |
| Retention        | Kept                             |
| Expected size    | Small                            |
| Keys and indexes | index (school_id, category)      |

| Column             | Type            | Null | Default              | Notes |
| ------------------ | --------------- | ---- | -------------------- | ----- |
| `id`               | uuid            | no   | UUIDv7 (app)         | PK    |
| `school_id`        | uuid            | no   |                      |       |
| `file_id`          | uuid            | no   |                      |       |
| `title`            | text            | no   |                      |       |
| `category`         | text            | no   |                      |       |
| `student_id`       | uuid            | yes  |                      |       |
| `staff_id`         | uuid            | yes  |                      |       |
| `academic_year_id` | uuid            | yes  |                      |       |
| `access`           | document_access | no   | admin_only           |       |
| `created_at`       | timestamptz     | no   | now()                |       |
| `updated_at`       | timestamptz     | no   | set by app on update |       |
| `created_by`       | uuid            | yes  |                      |       |

## Audit

### `audit_logs`

Append-only audit trail (partitioned). Append-only (no UPDATE/DELETE: privileges revoked AND a trigger that raises, even for the owner). Monthly range partitions on created_at. Existing columns kept (target_type/target_id = the record). Never holds passwords, OTPs, tokens or typed login identifiers. actor_role is text because it can be a school role or a platform role. module is nullable only for rows written before this expansion.

| Item             | Value                                                                                                                                                                   |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status           | Extended                                                                                                                                                                |
| Tenant column    | school_id nullable                                                                                                                                                      |
| Written by       | AuditService only                                                                                                                                                       |
| Read by          | Role-scoped (see RLS-MATRIX.md)                                                                                                                                         |
| Retention        | To be set in the DPDP review (default: 3 years)                                                                                                                         |
| Expected size    | Tens of millions per year (over 10M)                                                                                                                                    |
| Keys and indexes | PK (id, created_at); index (school_id, created_at); index (actor_user_id, created_at); index (school_id, module, created_at); index (school_id, target_type, target_id) |

| Column          | Type           | Null | Default      | Notes |
| --------------- | -------------- | ---- | ------------ | ----- |
| `id`            | uuid           | no   | UUIDv7 (app) |       |
| `created_at`    | timestamptz    | no   | now()        |       |
| `school_id`     | uuid           | yes  |              |       |
| `actor_user_id` | uuid           | yes  |              |       |
| `actor_role`    | text           | yes  |              |       |
| `category`      | audit_category | no   | general      |       |
| `module`        | audit_module   | yes  |              |       |
| `action`        | text           | no   |              |       |
| `target_type`   | text           | yes  |              |       |
| `target_id`     | uuid           | yes  |              |       |
| `old_value`     | jsonb          | yes  |              |       |
| `new_value`     | jsonb          | yes  |              |       |
| `reason`        | text           | yes  |              |       |
| `ip`            | text           | yes  |              |       |
| `session_id`    | uuid           | yes  |              |       |
| `metadata`      | jsonb          | no   | "{}"         |       |
