# ER diagrams (draft V1.1)

One diagram per module, key columns only (full columns in [TABLES.md](TABLES.md)). Every school table also has `school_id`; arrows between school tables are composite foreign keys `(school_id, x_id)`, so a row can never point into another school. `schools` is drawn only where it matters.

## 1. Tenancy and identity

```mermaid
erDiagram
  schools ||--o{ school_memberships : has
  users ||--o{ school_memberships : holds
  users ||--o| credentials : "password hash"
  users ||--o{ sessions : "signed-in devices"
  sessions ||--o{ push_tokens : "app install"
  users ||--o{ push_tokens : owns
  users ||--o| platform_staff : "company staff"
  users ||--o{ school_verification_requests : "principal submits"
  schools |o--o{ school_verification_requests : "claimed school"
  school_verification_requests |o--o| school_verification_requests : resubmission
  schools ||--o{ username_sequences : "e and s counters"
  schools |o--o{ credential_issuances : "temp passwords issued"
  permissions ||--o{ role_permissions : granted

  schools {
    uuid id PK
    text code UK
    school_status status
    text pin_code
    uuid logo_file_id
  }
  users {
    uuid id PK
    text username UK
    text phone UK
    timestamptz phone_verified_at
    user_status status
  }
  credentials {
    uuid user_id PK
    text password_hash
    boolean must_change_password
  }
  sessions {
    uuid id PK
    uuid user_id FK
    text token_hash UK
    client_app client_app
  }
  push_tokens {
    uuid id PK
    uuid user_id FK
    client_app app
    text token UK
  }
  otp_challenges {
    uuid id PK
    otp_purpose purpose
    text phone
    text code_hash
    timestamptz expires_at
  }
  school_verification_requests {
    uuid id PK
    uuid principal_user_id FK
    uuid school_id FK
    text proposed_name
    verification_status status
  }
  platform_staff {
    uuid user_id PK
    platform_role role
  }
  school_memberships {
    uuid id PK
    uuid school_id FK
    uuid user_id FK
    role role
    membership_status status
  }
  username_sequences {
    uuid school_id PK
    username_kind kind PK
    int next_value
  }
  credential_issuances {
    uuid id PK
    uuid user_id
    credential_issuance_kind kind
    timestamptz shown_at
    timestamptz consumed_at
  }
  permissions {
    uuid id PK
    text key UK
  }
  role_permissions {
    uuid id PK
    role role
    uuid permission_id FK
  }
```

## 2. Academic setup

```mermaid
erDiagram
  schools ||--o{ academic_years : has
  academic_years ||--o| school_timings : "days and periods"
  schools ||--o{ classes : has
  classes ||--o{ sections : "per year"
  academic_years ||--o{ sections : contains
  schools ||--o{ subjects : catalogue
  classes ||--o{ class_subjects : studies
  subjects ||--o{ class_subjects : "taught in"

  academic_years {
    uuid id PK
    text name
    date starts_on
    date ends_on
    academic_year_status status
  }
  school_timings {
    uuid id PK
    uuid academic_year_id FK
    smallint_array working_days
    time day_start
    smallint period_minutes
    smallint period_count
  }
  classes {
    uuid id PK
    text name
    smallint grade "1 to 12"
  }
  sections {
    uuid id PK
    uuid academic_year_id FK
    uuid class_id FK
    text name
  }
  subjects {
    uuid id PK
    text name
    text code
  }
  class_subjects {
    uuid id PK
    uuid class_id FK
    uuid subject_id FK
  }
```

## 3. People

```mermaid
erDiagram
  users ||--o| students : "student login"
  students ||--o{ student_enrollments : "one per year"
  sections ||--o{ student_enrollments : contains
  students ||--o{ student_guardians : "guardian mobiles"
  student_guardians ||--o{ parent_student_links : "verified match"
  users ||--o{ parent_student_links : "parent account"
  students ||--o{ parent_student_links : "linked child"
  users |o--o{ staff : "employee login"
  departments |o--o{ staff : groups
  staff ||--o{ teacher_subject_qualifications : "can teach"
  subjects ||--o{ teacher_subject_qualifications : ""
  staff ||--o{ teacher_assignments : "assigned (history)"
  sections ||--o{ teacher_assignments : ""
  subjects |o--o{ teacher_assignments : "null for class teacher"

  students {
    uuid id PK
    uuid user_id UK
    text full_name
    student_status status
    boolean management_approval_confirmed
    uuid confirmed_by_user_id
  }
  student_enrollments {
    uuid id PK
    uuid student_id FK
    uuid section_id FK
    smallint roll_number
    enrollment_status status
  }
  student_guardians {
    uuid id PK
    uuid student_id FK
    text mobile
    guardian_relation relation
    guardian_status status
  }
  parent_student_links {
    uuid id PK
    uuid user_id FK
    uuid student_id FK
    uuid guardian_id FK
    parent_link_status status
  }
  staff {
    uuid id PK
    uuid user_id FK
    staff_type staff_type
    text designation "free text"
    staff_status status
  }
  departments {
    uuid id PK
    text name
  }
  teacher_subject_qualifications {
    uuid id PK
    uuid staff_id FK
    uuid subject_id FK
  }
  teacher_assignments {
    uuid id PK
    uuid staff_id FK
    uuid section_id FK
    uuid subject_id FK
    teacher_assignment_type type
    date valid_from
    date valid_to
  }
```

## 4. Attendance and leave

```mermaid
erDiagram
  sections ||--o{ attendance_registers : "one per day"
  sections ||--o{ student_attendance : ""
  students ||--o{ student_attendance : "one per day"
  student_attendance ||--o{ attendance_corrections : "admin fixes"
  staff ||--o{ staff_attendance : "one per day"
  staff ||--o{ leave_requests : applies
  leave_types ||--o{ leave_requests : ""
  leave_requests |o--o{ staff_attendance : "on_leave days"
  approval_requests |o--o{ leave_requests : "STAFF_LEAVE"

  attendance_registers {
    uuid id PK
    uuid section_id FK
    date attendance_date
    uuid submitted_by
    text idempotency_key
  }
  student_attendance {
    uuid id PK
    date attendance_date PK "partition key"
    uuid student_id FK
    attendance_status status "present or absent"
  }
  attendance_corrections {
    uuid id PK
    uuid attendance_id FK
    attendance_status old_status
    attendance_status new_status
    text reason
  }
  staff_attendance {
    uuid id PK
    uuid staff_id FK
    date attendance_date
    staff_attendance_status status
  }
  leave_types {
    uuid id PK
    text name
  }
  leave_requests {
    uuid id PK
    uuid staff_id FK
    date from_date
    date to_date
    leave_request_status status
  }
```

## 5. Timetable and substitution

```mermaid
erDiagram
  sections ||--o{ timetables : "versions"
  timetables ||--o{ timetable_entries : "day x period"
  subjects ||--o{ timetable_entries : ""
  staff ||--o{ timetable_entries : teaches
  staff ||--o{ teacher_availability : "unavailable slots"
  timetable_entries |o--o{ substitutions : covered
  staff ||--o{ substitutions : "absent teacher"
  staff ||--o{ substitutions : "substitute"
  approval_requests |o--o{ timetables : "TIMETABLE"

  timetables {
    uuid id PK
    uuid section_id FK
    smallint version
    timetable_status status
  }
  timetable_entries {
    uuid id PK
    uuid timetable_id FK
    smallint day_of_week
    smallint period_no
    uuid subject_id FK
    uuid staff_id FK
  }
  teacher_availability {
    uuid id PK
    uuid staff_id FK
    smallint day_of_week
    smallint period_no
  }
  substitutions {
    uuid id PK
    date substitution_date
    smallint period_no
    uuid absent_staff_id FK
    uuid substitute_staff_id FK
    substitution_status status
  }
```

## 6. Exams, results, homework, lesson plans

```mermaid
erDiagram
  academic_years ||--o{ exams : ""
  exams ||--o{ exam_subjects : "class x subject"
  exam_subjects ||--o{ marks_entries : "per student"
  students ||--o{ marks_entries : ""
  exams ||--o{ result_sets : "per class, versioned"
  result_sets ||--o{ student_results : "report card"
  students ||--o{ student_results : ""
  approval_requests |o--o{ result_sets : "RESULTS"
  sections ||--o{ homework : ""
  homework ||--o{ homework_completions : "per student"
  staff ||--o{ lesson_plans : writes

  exams {
    uuid id PK
    text name
    exam_status status
  }
  exam_subjects {
    uuid id PK
    uuid class_id FK
    uuid subject_id FK
    numeric max_marks
  }
  marks_entries {
    uuid id PK
    uuid exam_subject_id FK
    uuid student_id FK
    numeric marks_obtained
    marks_entry_status status
  }
  result_sets {
    uuid id PK
    uuid exam_id FK
    uuid class_id FK
    smallint version
    result_set_status status
  }
  student_results {
    uuid id PK
    uuid result_set_id FK
    uuid student_id FK
    numeric percentage
    jsonb subject_lines
  }
  homework {
    uuid id PK
    uuid section_id FK
    uuid subject_id FK
    date due_on
    homework_status status
  }
  homework_completions {
    uuid id PK
    uuid homework_id FK
    uuid student_id FK
    homework_completion_status status
  }
  lesson_plans {
    uuid id PK
    uuid staff_id FK
    text topic
    date planned_on
    lesson_plan_status status
  }
```

## 7. Approvals

```mermaid
erDiagram
  approval_requests ||--o{ approval_actions : "history"
  approval_requests |o--o| approval_requests : "resubmission (parent_request_id)"
  approval_requests |o--o{ teacher_assignments : "TEACHER_ASSIGNMENT_CHANGE"
  approval_requests |o--o{ leave_requests : "STAFF_LEAVE"
  approval_requests |o--o{ timetables : "TIMETABLE"
  approval_requests |o--o{ result_sets : "RESULTS"
  approval_requests |o--o{ import_jobs : "TEACHER_ADDITION (bulk)"

  approval_requests {
    uuid id PK
    approval_type type
    text entity_type
    uuid entity_id
    jsonb payload
    approval_status status
    smallint version
    uuid parent_request_id UK
    uuid decided_by
    text rejection_reason
  }
  approval_actions {
    uuid id PK
    uuid request_id FK
    uuid actor_user_id
    role actor_role
    approval_action_type action
    text reason
  }
```

Teacher addition/update and academic-year transition point at their record through `entity_type` + `entity_id` (staff, academic_years) instead of a foreign key.

## 8. Notices, calendar, notifications

```mermaid
erDiagram
  schools ||--o{ notices : publishes
  notices ||--o{ notice_audiences : targets
  classes |o--o{ notice_audiences : ""
  sections |o--o{ notice_audiences : ""
  schools ||--o{ calendar_events : ""
  exams |o--o{ calendar_events : "exam dates"
  users ||--o{ notifications : receives
  schools |o--o{ notifications : context

  notices {
    uuid id PK
    text title
    notice_status status
    timestamptz publish_at
  }
  notice_audiences {
    uuid id PK
    uuid notice_id FK
    notice_audience_type audience_type
    staff_group staff_group
  }
  calendar_events {
    uuid id PK
    calendar_event_type type
    date starts_on
    date ends_on
    calendar_audience audience
  }
  notifications {
    uuid id PK
    timestamptz created_at PK "partition key"
    uuid recipient_user_id FK
    uuid student_id "child context"
    notification_event event
    timestamptz read_at
  }
  outbox_events {
    uuid id PK
    text event_type
    jsonb payload
    timestamptz published_at
  }
```

No conversations, messages, read receipts or notification preferences exist.

## 9. Non-teaching staff

```mermaid
erDiagram
  staff ||--o{ duty_schedules : ""
  staff ||--o{ tasks : "assigned to"
  departments |o--o{ tasks : ""
  departments |o--o{ assets : owns
  assets ||--o{ asset_assignments : "held by"
  staff |o--o{ asset_assignments : ""
  inventory_items ||--o{ inventory_movements : "stock history"
  assets |o--o{ maintenance_requests : ""

  duty_schedules {
    uuid id PK
    uuid staff_id FK
    date duty_date
    smallint day_of_week
    time start_time
    text duty
  }
  tasks {
    uuid id PK
    uuid assigned_to_staff_id FK
    task_priority priority
    task_status status
  }
  assets {
    uuid id PK
    text asset_code
    asset_condition condition
    asset_status status
  }
  asset_assignments {
    uuid id PK
    uuid asset_id FK
    uuid staff_id FK
    timestamptz returned_at
  }
  inventory_items {
    uuid id PK
    text name
    int quantity_on_hand
  }
  inventory_movements {
    uuid id PK
    uuid item_id FK
    inventory_movement_type type
    int quantity
  }
  maintenance_requests {
    uuid id PK
    uuid asset_id FK
    maintenance_status status
  }
```

## 10. Import, files, documents, audit

```mermaid
erDiagram
  files ||--o{ import_jobs : "uploaded Excel"
  import_jobs ||--o{ import_rows : "row results"
  files ||--o{ documents : ""
  students |o--o{ documents : ""
  staff |o--o{ documents : ""

  import_jobs {
    uuid id PK
    import_type type
    import_job_status status
    int invalid_rows
  }
  import_rows {
    uuid id PK
    uuid job_id FK
    int row_number
    jsonb errors
    import_row_outcome outcome
  }
  files {
    uuid id PK
    file_purpose purpose
    text storage_key UK "school_id/..."
    file_status status
  }
  documents {
    uuid id PK
    uuid file_id FK
    text category
    document_access access
  }
  audit_logs {
    uuid id PK
    timestamptz created_at PK "partition key"
    uuid school_id
    uuid actor_user_id
    text actor_role
    audit_module module
    audit_category category
    text action
    jsonb old_value
    jsonb new_value
    text reason
  }
```

`audit_logs` has no foreign keys on purpose: audit rows must outlive anything they describe.
