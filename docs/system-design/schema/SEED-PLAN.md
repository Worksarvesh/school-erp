# Seed data plan (draft V1.2)

Two kinds of seed data, kept apart as today:

1. **Reference data** (every environment, by migration, fixed UUIDv7 ids): permissions, role → permission grants. Tests never truncate these tables, and a test checks that `apps/api/src/tenancy/permissions.ts` matches the rows.
2. **Demo data** (`pnpm --filter api run seed`, refused in production, idempotent): platform staff, sample schools, people, academic setup.

Each build slice adds only the keys its routes use (rule from Step 1). The full catalogue below is the target.

## Permission catalogue

| Key                                         | Meaning                                                                                                                                  |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `school.read`                               | View the school profile (exists)                                                                                                         |
| `school.branding.manage`                    | Change name, logo, address, contact                                                                                                      |
| `members.read`                              | List people and roles (exists)                                                                                                           |
| `accounts.manage_leadership`                | Create/disable Admin and Vice Principal accounts                                                                                         |
| `members.manage`                            | Change memberships of staff and students                                                                                                 |
| `credentials.reset`                         | Start a password reset for an account the caller is allowed to manage                                                                    |
| `academics.read`                            | Read years, classes, sections, subjects, timings                                                                                         |
| `academics.manage`                          | Create/edit years, classes, sections, subjects, timings, holidays                                                                        |
| `students.read`                             | Student directory and records                                                                                                            |
| `students.manage`                           | Add/edit students, guardians, enrollments, promotions, transfers                                                                         |
| `guardians.link_codes.issue`                | Issue or revoke a parent link code for an active guardian                                                                                |
| `guardians.links.revoke`                    | Revoke a parent's link to a student                                                                                                      |
| `staff.read`                                | Staff directory and records                                                                                                              |
| `staff.manage`                              | Add/edit staff (teacher add goes through approval)                                                                                       |
| `staff.assign`                              | Request teacher assignment changes                                                                                                       |
| `designations.manage`                       | Create, rename, activate and deactivate the school's non-teaching designations                                                           |
| `permissions.grant`                         | Grant or revoke a grantable permission (V1: `inventory.manage`) for an individual member                                                 |
| `attendance.read`                           | Read student attendance                                                                                                                  |
| `attendance.mark`                           | Mark today's attendance for an assigned section                                                                                          |
| `attendance.correct`                        | Correct a past attendance mark directly, no approval (reason, old/new value, audit; BUSINESS-RULES T4)                                   |
| `staff_attendance.read`                     | Read all staff attendance                                                                                                                |
| `staff_attendance.mark`                     | Mark staff attendance                                                                                                                    |
| `leave.apply`                               | Apply for own leave                                                                                                                      |
| `leave.read_all`                            | See all leave requests                                                                                                                   |
| `leave.manage_types`                        | Configure leave types                                                                                                                    |
| `timetable.read`                            | Read timetables                                                                                                                          |
| `timetable.manage`                          | Build and submit timetables, teacher availability                                                                                        |
| `timetable.publish`                         | Publish an approved timetable                                                                                                            |
| `substitutions.manage`                      | Assign and cancel substitutes (Admin and Vice Principal)                                                                                 |
| `exams.read`                                | Read exams and schedules                                                                                                                 |
| `exams.manage`                              | Create exams, subjects, max marks                                                                                                        |
| `marks.read`                                | Read marks                                                                                                                               |
| `marks.enter`                               | Enter marks for an assigned subject                                                                                                      |
| `results.read`                              | Read compiled results                                                                                                                    |
| `results.manage`                            | Compile results and submit for approval                                                                                                  |
| `results.publish`                           | Publish approved results                                                                                                                 |
| `homework.read`                             | Read homework                                                                                                                            |
| `homework.manage`                           | Create homework, mark completion                                                                                                         |
| `lesson_plans.manage`                       | Own lesson plans                                                                                                                         |
| `approvals.read`                            | Approval inbox                                                                                                                           |
| `approvals.decide`                          | Approve or reject (final)                                                                                                                |
| `academic_year.approve`                     | Decide an `academic_year_change` request; Principal only (a trigger also refuses any non-Principal decider)                              |
| `notices.read`                              | Read notices for my audience                                                                                                             |
| `notices.manage`                            | Create, schedule, publish notices                                                                                                        |
| `student_messages.publish.school`           | Send to the full school student group                                                                                                    |
| `student_messages.publish.section.any`      | Send to any class-section group of the school                                                                                            |
| `student_messages.publish.section.assigned` | Send only to class-sections with an open teacher assignment (checked in the database, R-send)                                            |
| `student_messages.publish.section.granted`  | Send only to class-sections an Admin granted individually (checked in the database, R-send); no grant = no access                        |
| `student_messages.grants.manage`            | Grant and revoke section messaging for individual non-teaching staff                                                                     |
| `student_messages.read_all`                 | Read every student message of the school (staff view)                                                                                    |
| `student_messages.moderate`                 | Withdraw any student message (senders can always withdraw their own)                                                                     |
| `calendar.read`                             | Read the calendar                                                                                                                        |
| `calendar.manage`                           | Create calendar events and holidays                                                                                                      |
| `duties.manage`                             | Create duty schedules                                                                                                                    |
| `tasks.manage`                              | Assign tasks                                                                                                                             |
| `inventory.manage`                          | Assets, inventory, maintenance handling. **Grantable**: Admin by role; anyone else only through an explicit `user_permission_grants` row |
| `maintenance.raise`                         | Raise a maintenance request                                                                                                              |
| `imports.manage`                            | Excel imports                                                                                                                            |
| `reports.read`                              | School reports                                                                                                                           |
| `audit.read.all`                            | Every audit row of the school                                                                                                            |
| `audit.read.operational`                    | Audit rows except categories `admin_account` and `branding`                                                                              |
| `audit.read.own`                            | Own actions only                                                                                                                         |
| `self.profile.update`                       | Student: fill optional profile fields, submit a pending guardian mobile                                                                  |
| `self.academics.read`                       | Student: own timetable, attendance, homework, published results, notices, calendar                                                       |
| `self.messages.read`                        | Student: read own school and class-section message groups                                                                                |
| `child.academics.read`                      | Parent: the same for a linked child (guardian path)                                                                                      |

## Role → permission map

✓ = granted. `parent` is the permission subject of the guardian-link path, not a membership. The removed roles `office_clerk`, `accountant`, `other_staff` get **no** grants (and leave the enum in a contract migration); job titles are designations, which grant nothing; the migration that adds this catalogue also deletes their existing `school.read` rows from Step 1.

| Key                                         | principal | vice_principal | school_admin | teacher | non_teaching_staff | student | parent |
| ------------------------------------------- | :-------: | :------------: | :----------: | :-----: | :----------------: | :-----: | :----: |
| `school.read`                               |     ✓     |       ✓        |      ✓       |    ✓    |         ✓          |    ✓    |   ✓    |
| `school.branding.manage`                    |     ✓     |                |              |         |                    |         |        |
| `members.read`                              |     ✓     |       ✓        |      ✓       |         |                    |         |        |
| `accounts.manage_leadership`                |     ✓     |                |              |         |                    |         |        |
| `members.manage`                            |     ✓     |                |      ✓       |         |                    |         |        |
| `credentials.reset`                         |     ✓     |                |      ✓       |         |                    |         |        |
| `academics.read`                            |     ✓     |       ✓        |      ✓       |    ✓    |         ✓          |         |        |
| `academics.manage`                          |           |                |      ✓       |         |                    |         |        |
| `students.read`                             |     ✓     |       ✓        |      ✓       |    ✓    |                    |         |        |
| `students.manage`                           |           |                |      ✓       |         |                    |         |        |
| `guardians.link_codes.issue`                |     ✓     |                |      ✓       |         |                    |         |        |
| `guardians.links.revoke`                    |     ✓     |                |      ✓       |         |                    |         |        |
| `staff.read`                                |     ✓     |       ✓        |      ✓       |         |                    |         |        |
| `staff.manage`                              |     ✓     |                |      ✓       |         |                    |         |        |
| `staff.assign`                              |           |                |      ✓       |         |                    |         |        |
| `designations.manage`                       |           |                |      ✓       |         |                    |         |        |
| `permissions.grant`                         |           |                |      ✓       |         |                    |         |        |
| `attendance.read`                           |     ✓     |       ✓        |      ✓       |    ✓    |                    |         |        |
| `attendance.mark`                           |           |                |      ✓       |    ✓    |                    |         |        |
| `attendance.correct`                        |           |                |      ✓       |         |                    |         |        |
| `staff_attendance.read`                     |     ✓     |       ✓        |      ✓       |         |                    |         |        |
| `staff_attendance.mark`                     |           |                |      ✓       |         |                    |         |        |
| `leave.apply`                               |           |       ✓        |      ✓       |    ✓    |         ✓          |         |        |
| `leave.read_all`                            |     ✓     |       ✓        |      ✓       |         |                    |         |        |
| `leave.manage_types`                        |           |                |      ✓       |         |                    |         |        |
| `timetable.read`                            |     ✓     |       ✓        |      ✓       |    ✓    |         ✓          |         |        |
| `timetable.manage`                          |           |                |      ✓       |         |                    |         |        |
| `timetable.publish`                         |     ✓     |       ✓        |              |         |                    |         |        |
| `substitutions.manage`                      |           |       ✓        |      ✓       |         |                    |         |        |
| `exams.read`                                |     ✓     |       ✓        |      ✓       |    ✓    |                    |         |        |
| `exams.manage`                              |           |                |      ✓       |         |                    |         |        |
| `marks.read`                                |     ✓     |       ✓        |      ✓       |    ✓    |                    |         |        |
| `marks.enter`                               |           |                |              |    ✓    |                    |         |        |
| `results.read`                              |     ✓     |       ✓        |      ✓       |    ✓    |                    |         |        |
| `results.manage`                            |           |                |      ✓       |         |                    |         |        |
| `results.publish`                           |     ✓     |       ✓        |              |         |                    |         |        |
| `homework.read`                             |     ✓     |       ✓        |      ✓       |    ✓    |                    |         |        |
| `homework.manage`                           |           |                |              |    ✓    |                    |         |        |
| `lesson_plans.manage`                       |           |                |              |    ✓    |                    |         |        |
| `approvals.read`                            |     ✓     |       ✓        |      ✓       |         |                    |         |        |
| `approvals.decide`                          |     ✓     |       ✓        |              |         |                    |         |        |
| `academic_year.approve`                     |     ✓     |                |              |         |                    |         |        |
| `notices.read`                              |     ✓     |       ✓        |      ✓       |    ✓    |         ✓          |         |        |
| `notices.manage`                            |     ✓     |                |      ✓       |         |                    |         |        |
| `student_messages.publish.school`           |     ✓     |       ✓        |      ✓       |         |                    |         |        |
| `student_messages.publish.section.any`      |     ✓     |       ✓        |      ✓       |         |                    |         |        |
| `student_messages.publish.section.assigned` |           |                |              |    ✓    |                    |         |        |
| `student_messages.publish.section.granted`  |           |                |              |         |         ✓          |         |        |
| `student_messages.grants.manage`            |           |                |      ✓       |         |                    |         |        |
| `student_messages.read_all`                 |     ✓     |       ✓        |      ✓       |         |                    |         |        |
| `student_messages.moderate`                 |     ✓     |       ✓        |      ✓       |         |                    |         |        |
| `calendar.read`                             |     ✓     |       ✓        |      ✓       |    ✓    |         ✓          |         |        |
| `calendar.manage`                           |     ✓     |                |      ✓       |         |                    |         |        |
| `duties.manage`                             |           |                |      ✓       |         |                    |         |        |
| `tasks.manage`                              |     ✓     |       ✓        |      ✓       |         |                    |         |        |
| `inventory.manage`                          |           |                |      ✓       |         |                    |         |        |
| `maintenance.raise`                         |     ✓     |       ✓        |      ✓       |    ✓    |         ✓          |         |        |
| `imports.manage`                            |           |                |      ✓       |         |                    |         |        |
| `reports.read`                              |     ✓     |       ✓        |      ✓       |         |                    |         |        |
| `audit.read.all`                            |     ✓     |                |              |         |                    |         |        |
| `audit.read.operational`                    |           |       ✓        |      ✓       |         |                    |         |        |
| `audit.read.own`                            |           |                |              |    ✓    |         ✓          |         |        |
| `self.profile.update`                       |           |                |              |         |                    |    ✓    |        |
| `self.academics.read`                       |           |                |              |         |                    |    ✓    |        |
| `self.messages.read`                        |           |                |              |         |                    |    ✓    |        |
| `child.academics.read`                      |           |                |              |         |                    |         |   ✓    |

Notes:

- Admin's `approvals.read` shows only requests the Admin submitted (App filter); deciding stays with Principal and VP.
- `inventory.manage` is **not** granted to non-teaching staff by role. Admin holds it by role; any other member gets it only through an explicit, audited `user_permission_grants` row (`permissions.grant`). Designations never grant permissions. Grantable keys in V1 (`permissions.grantable = true`): `inventory.manage` only.
- Student messaging (decision M1): Principal, VP and Admin send to the school group and any section; teachers only to sections with an open assignment; non-teaching staff only to sections granted individually by Admin and never to the school group. The keys open the route; the database policy R-send decides the exact section at insert time, so closed assignments and revoked grants stop new messages immediately. No student or parent holds a publish key; parents have no message access (M2).
- `academic_year_change` requests need `academic_year.approve` (Principal only) in addition to `approvals.decide`; a trigger refuses any other decider, so the VP can never approve it. The other six approval types need only `approvals.decide` (Principal and VP). Attendance correction is a direct Admin action, not an approval (decision AC1).
- Platform roles are not in `role_permissions`. The platform guard checks `platform_staff.role`: `verifier` can list and decide verification requests and search the directory; `super_admin` can also manage platform staff and change a principal's phone (recovery).

## Demo data (extends `apps/api/src/seed/demo-data.ts`)

| Item                     | Content                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Platform staff           | 1 Super Admin, 1 Verifier (fictional, `.test` emails, +91 90000 0xxxx phones)                                                                                                                                                                                                                                                                                                                                                                     |
| Schools                  | `sch0001` Sunrise Public School (Demo), `sch0002` Lakeview High School (Demo), `sch0003` unclaimed directory entry. The current codes `DEMO-SUNRISE` / `DEMO-LAKEVIEW` move to the new format (seed fixes them by fixed id)                                                                                                                                                                                                                       |
| Verification             | One approved request (Sunrise principal), one pending "not listed" request                                                                                                                                                                                                                                                                                                                                                                        |
| Academic setup (Sunrise) | Year 2026-27 active; classes 1-12; sections A/B for classes 6-8; 8 subjects mapped; timings Mon-Sat 08:00-14:00, 8 periods of 40 min; 3 holidays                                                                                                                                                                                                                                                                                                  |
| Staff                    | Principal (OTP phone), 1 VP and 2 Admins (`sch0001e0001`…), 4 teachers (qualifications + assignments, one class teacher per seeded section), 2 non-teaching (designations configured for the demo school: Librarian, Office Assistant, plus one inactive designation to demo deactivation; the Office Assistant holds an explicit `inventory.manage` grant and one section-messaging grant, plus one revoked grant), 1 department                 |
| Students                 | 6 per seeded section with enrollments and roll numbers; usernames `sch0001s0001`…; `management_approval_confirmed = true`                                                                                                                                                                                                                                                                                                                         |
| Guardians and parents    | 2 guardians for some students; one parent phone linked (by redeemed link codes) to a child at Sunrise **and** a child at Lakeview (multi-school case); one open unexpired link code, one expired code and one revoked link; one pending student-entered guardian (no code can be issued). The seed prints no link code; codes for manual testing are issued through the API. Demo parent phones log in locally with the fixed OTP `999999`        |
| Operational samples      | One published timetable per seeded section, a week of attendance, one pending and one rejected+resubmitted approval, one published notice, school-group and section-group student messages from Principal, a class teacher and the granted non-teaching member (one withdrawn, one archived in a past year), one exam with published results for one class, homework with completions, two tasks, three assets, one inventory item with movements |
| Passwords and OTP        | From `SEED_DEMO_PASSWORD` (as today); `must_change_password = false` for demo users so testers can log in, except one account kept `true` to demo the forced change. Demo Principal and Parent numbers log in with `999999` through the normal OTP flow (`OTP_PROVIDER=fixed`); the seed stores no OTP rows or codes                                                                                                                              |
