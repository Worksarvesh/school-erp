# V1.1 application schema (Phase B draft)

Status: **draft for review, 2026-11-07.** Nothing here is migrated. The live schema stays `apps/api/prisma/schema.prisma`; each build slice copies the models it needs, adds the hand-written SQL (RLS, CHECKs, partial uniques, triggers, partitions) and its tests.

Sources, newest first: V1.1 locked decisions and your Phase A answers (see [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md) "Decided") → [Scope Report](../School_ERP_Graphic_Design_Scope_Report_V1.pdf) and [App Flow](../School_ERP_Full_App_Flow.pdf) → [system-design-v1.md](../system-design-v1.md) → existing code. Conflicts between them are listed in [AUDIT-2026-11-07.md](../AUDIT-2026-11-07.md) (A5 and A10).

## Files

| File                                             | What it holds                                                                                                                                      |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| [schema.draft.prisma](schema.draft.prisma)       | 65 models, 58 enums, relations, uniques, indexes (passes `prisma validate`)                                                                        |
| [TABLES.md](TABLES.md)                           | Table dictionary: purpose, columns, keys, tenant column, writers, readers, retention, size                                                         |
| [ER-DIAGRAMS.md](ER-DIAGRAMS.md)                 | Mermaid ER diagrams, one per module (10)                                                                                                           |
| [RLS-MATRIX.md](RLS-MATRIX.md)                   | Request contexts, policy codes, per-table access for school staff, student, parent, platform; parent access across schools; isolation tests to add |
| [ENUMS.md](ENUMS.md)                             | Every enum and its values                                                                                                                          |
| [BUSINESS-RULES.md](BUSINESS-RULES.md)           | Each V1.1 rule → DB constraint / trigger / RLS / app check; actions that must be audited                                                           |
| [SCREEN-TRACEABILITY.md](SCREEN-TRACEABILITY.md) | Screen → tables read/written, API audience, removed screens, gaps                                                                                  |
| [SEED-PLAN.md](SEED-PLAN.md)                     | Permission catalogue, role → permission map, demo data                                                                                             |
| [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md)           | Open questions with defaults; decisions already taken                                                                                              |

## Design summary

- **One database, one schema, both apps.** No table, column or policy depends on which app calls. The School App, the Student App (student mode) and the Student App (parent mode) differ only in route family and request context.
- **Tenant isolation, three layers.** (1) Guard: active membership + permission, or an active guardian link for parent routes. (2) RLS on every school table: tenant policy, plus restrictive policies so students and parents see only their own student/section and never staff-only tables. (3) **Composite foreign keys** `(school_id, x_id)` on every school-to-school reference, because foreign-key checks ignore RLS: a row in school A can never point at a row in school B.
- **Identity.** Global `users`. Staff and students log in with a school-issued username (`sch0001e0001`, `sch0001s0001`) and password; temp passwords are hashed once in `credentials` with a forced change. Principal and parent log in with mobile + OTP (`otp_challenges`, SECURITY DEFINER only). Platform staff live in `platform_staff`.
- **Parents.** Guardian mobiles live on the student record (`student_guardians`). A verified OTP mobile that matches active guardian rows creates `parent_student_links` across schools. A username never grants parent access.
- **Approvals.** One generic engine (`approval_requests` + append-only `approval_actions`) for the 7 V1.1 types; real approver recorded, reason required on reject, resubmission as a new version.
- **History is never overwritten:** enrollments per year, teacher assignments with `valid_from/valid_to` (trigger-guarded), timetable versions, result-set versions, attendance corrections, approval actions, audit logs.
- **Cheap by default.** Generic tables replace one-off ones (holidays in `calendar_events`, periods computed from `school_timings`, conflicts computed, transitions and assignment changes as approval payloads). Only three tables are partitioned.

## Conventions

| Topic           | Rule                                                                                                                                                                                     |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keys            | UUIDv7 generated by the app; every referenced school table has `@@unique([schoolId, id])`                                                                                                |
| Tenant column   | `school_id uuid NOT NULL` on every school table; nullable only on `credential_issuances`, `school_verification_requests`, `notifications`, `outbox_events`, `audit_logs` (global events) |
| Timestamps      | `timestamptz`; `created_at`, `updated_at`, `created_by` everywhere; `updated_by` where edits are audited                                                                                 |
| Dates           | School-local `date` columns for attendance, leave, timetable and exams; "today" uses `schools.timezone` (default `Asia/Kolkata`)                                                         |
| Soft delete     | None. Students, staff and memberships use status values; history tables are append-only                                                                                                  |
| Enums vs tables | Enums for stable sets; tables for configurable lists (`departments`, `leave_types`); free text for designations, exam types and categories                                               |
| Actor columns   | Plain user ids, no foreign key (as today)                                                                                                                                                |
| Money           | No money columns in V1 (fees out). The integer-paise rule stays for later                                                                                                                |
| Migrations      | Expand-then-contract. Existing tables only gain columns; no renames (`audit_logs.target_type/target_id` stay)                                                                            |

## Partitioning and size (pilot: 100 schools, ~2.5 lakh users)

| Table                | Partitioning                                      | Why                                                                                                                   |
| -------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `student_attendance` | Monthly range on `attendance_date`                | ~4.4 crore rows a year                                                                                                |
| `notifications`      | Monthly range on `created_at`, drop after 90 days | Crores of rows a year, short-lived                                                                                    |
| `audit_logs`         | Monthly range on `created_at`                     | Tens of millions a year; retention by dropping partitions. Converted now, while no staging/production database exists |

Watch: `homework_completions` (up to ~2 crore rows a year if every student is tracked for every homework). Not partitioned in V1.

## Build order (maps the draft onto your slices)

| Slice                                              | Tables                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2B principal registration and verification (built) | `schools` (+ branding, `unclaimed`, `sch` codes), `users` (+ username, phone verified, last login), `credentials` (+ must change), `otp_challenges`, `school_verification_requests`, `platform_staff`, `sessions` (+ client app), `audit_logs` (expand + partition). Fixed OTP provider with the production startup guard. `credential_issuances` and `username_sequences` moved to slice 3 |
| 3 school setup                                     | `academic_years`, `school_timings`, `classes`, `sections`, `subjects`, `class_subjects`, `departments`, `staff`, `teacher_subject_qualifications`, `teacher_assignments`, `approval_requests`, `approval_actions`, `leave_types`, `student_field_definitions`                                                                                                                               |
| 4 students and parents                             | `students`, `student_enrollments`, `student_guardians`, `parent_student_links`, `files`, `import_jobs`, `import_rows` (replaces the link-code plan)                                                                                                                                                                                                                                         |
| 5 attendance, notices, notifications               | `attendance_registers`, `student_attendance`, `attendance_corrections`, `staff_attendance`, `leave_requests`, `notices`, `notice_audiences`, `calendar_events`, `notifications`, `push_tokens`, `outbox_events`                                                                                                                                                                             |
| 6 homework, documents, non-teaching (fees removed) | `homework`, `homework_completions`, `lesson_plans`, `documents`, `duty_schedules`, `tasks`, `assets`, `asset_assignments`, `inventory_items`, `inventory_movements`, `maintenance_requests`                                                                                                                                                                                                 |
| 7 timetable, exams, results                        | `timetables`, `timetable_entries`, `teacher_availability`, `substitutions`, `exams`, `exam_subjects`, `marks_entries`, `result_sets`, `student_results`                                                                                                                                                                                                                                     |
| 8 hardening                                        | Partition automation, retention jobs, load test on attendance/results/notifications, DPDP review items                                                                                                                                                                                                                                                                                      |

## Future extension points (no tables now)

| Later feature                           | How it fits without breaking V1 tables                                                                                                |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Messaging (parent–class teacher, staff) | New `conversations`, `conversation_participants`, `messages` keyed by `school_id`; add `new_message` to `notification_event` (expand) |
| Notification preferences                | New `notification_preferences(user_id, event, channel)`; absence of a row keeps today's "always on"                                   |
| SMS / email / WhatsApp channels         | New `notification_deliveries(notification_id, channel, status)`; the in-app row stays the source                                      |
| Fees                                    | `fee_structures`, `fee_categories`, `invoices`, `receipts` in integer paise; add `fees_allocation` to `approval_type`                 |
| Admissions                              | `admission_applications` → on acceptance creates `students` (the management-approval flag stays)                                      |
| Transport, PTM, grievance, discipline   | Own module tables keyed by `school_id`; no change to existing ones                                                                    |
| Biometric attendance                    | Add nullable `source` and `check_in/check_out` to `staff_attendance` (expand)                                                         |
| Timetable rooms and breaks              | New `rooms` + nullable `timetable_entries.room_id`; new `school_breaks` used by period computation                                    |
| Student documents                       | Add `student_visible` to `document_access`                                                                                            |
| Homework submissions                    | New `homework_submissions` + `file_purpose` value                                                                                     |
| Per-school permission overrides         | New `school_role_permissions(school_id, role, permission_id, granted)` read by the guard before defaults                              |
| IT / support staff                      | Add a value to `platform_role`                                                                                                        |
| Web portal                              | No schema change (same API)                                                                                                           |

## Acceptance checklist

|     | Item                                                                                                                                         | Proof                                                                                                                     |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| [x] | No messaging/conversation/message tables exist anywhere                                                                                      | [TABLES.md](TABLES.md) contents (65 tables); grep check in verification; `notification_event` has no message event        |
| [x] | No `notification_preferences` table, no parent notification settings                                                                         | No such model; SCREEN-TRACEABILITY marks STUDENT-PARENT-SETTINGS "notification settings Removed"                          |
| [x] | No fees, admission, discipline, IT staff, ticket, device-management, transport or biometric tables                                           | Model list in [TABLES.md](TABLES.md); `push_tokens` is push delivery only, not device management                          |
| [x] | Attendance status has only PRESENT and ABSENT; leave only for staff                                                                          | `attendance_status` (2 values) in [ENUMS.md](ENUMS.md); `leave_requests.staff_id` NOT NULL (BUSINESS-RULES T1, T6)        |
| [x] | Timetable entries have no room and no break fields                                                                                           | `timetable_entries` and `school_timings` columns in [TABLES.md](TABLES.md) (BUSINESS-RULES Y1, S5)                        |
| [x] | Parent identity resolves through verified mobile matching `student_guardians`; children across schools; a username alone never grants access | RLS-MATRIX "Parent access across schools"; BUSINESS-RULES A10, A11                                                        |
| [x] | Username generators produce `sch0001s0001` and `sch0001e0001` without collision                                                              | `username_sequences` row-locked allocation + UNIQUE + format CHECKs (BUSINESS-RULES A5)                                   |
| [x] | Temporary credentials are hashed and shown once; first login forces a change                                                                 | `credentials.must_change_password`, `credential_issuances.shown_at` (BUSINESS-RULES A6, A7)                               |
| [x] | Approval records the real approver, mandatory rejection reason, resubmission history preserved                                               | `approval_requests` CHECKs, `parent_request_id`, append-only `approval_actions` (BUSINESS-RULES P1–P5)                    |
| [x] | Teacher qualification and teacher assignment are separate; assignment history never overwritten                                              | Two tables + `valid_to`-only trigger (BUSINESS-RULES E6, E7)                                                              |
| [x] | Attendance correction after the same day is Admin-only and audited                                                                           | `attendance.correct` (Admin only, SEED-PLAN); `attendance_corrections.reason` NOT NULL; audit row (BUSINESS-RULES T3, T4) |
| [x] | Audit logs are append-only, role-scoped, and cover every sensitive action                                                                    | Grants + trigger; categories and `audit.read.*` permissions; "Actions that MUST write an audit row" in BUSINESS-RULES     |
| [x] | RLS policy exists for every tenant table, and cross-school access tests are listed                                                           | [RLS-MATRIX.md](RLS-MATRIX.md) has one row per table (65) and the isolation test list                                     |
| [~] | Every Figma screen maps to tables, and gaps are listed                                                                                       | Done for the screen inventory **derived from the Scope Report**; real Figma frame names still needed (gap G1)             |
