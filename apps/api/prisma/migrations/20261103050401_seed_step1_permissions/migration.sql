-- Default permission catalogue for Step 1 (reference data, same in every environment).
-- Keys must match apps/api/src/tenancy/permissions.ts; a test checks they agree.
-- Fixed UUIDv7 ids so every environment has identical rows.

INSERT INTO "permissions" ("id", "key", "description") VALUES
  ('01a19fca-f7c1-7b00-bb9b-de7cdca998e3', 'school.read', 'View the school profile'),
  ('01a19fca-f7c2-7501-a19d-d33df2cc2701', 'members.read', 'List the people in the school and their roles');

-- school.read: every member of the school.
-- members.read: school leadership only.
INSERT INTO "role_permissions" ("id", "role", "permission_id") VALUES
  ('01a19fca-f7c3-7001-8443-d613809f7002', 'principal',          '01a19fca-f7c1-7b00-bb9b-de7cdca998e3'),
  ('01a19fca-f7c4-7da6-a813-222e17f8133d', 'school_admin',       '01a19fca-f7c1-7b00-bb9b-de7cdca998e3'),
  ('01a19fca-f7c5-7f4c-aba7-ef291c596573', 'vice_principal',     '01a19fca-f7c1-7b00-bb9b-de7cdca998e3'),
  ('01a19fca-f7c6-77b3-8c0c-60b8ec2041ec', 'teacher',            '01a19fca-f7c1-7b00-bb9b-de7cdca998e3'),
  ('01a19fca-f7c7-7457-a661-01f426352963', 'non_teaching_staff', '01a19fca-f7c1-7b00-bb9b-de7cdca998e3'),
  ('01a19fca-f7c8-7e31-b539-bf289b7b2b84', 'office_clerk',       '01a19fca-f7c1-7b00-bb9b-de7cdca998e3'),
  ('01a19fca-f7c9-79cf-ad5b-17274e45ec75', 'accountant',         '01a19fca-f7c1-7b00-bb9b-de7cdca998e3'),
  ('01a19fca-f7ca-7e66-b61a-a24a48631c17', 'student',            '01a19fca-f7c1-7b00-bb9b-de7cdca998e3'),
  ('01a19fca-f7cb-7711-b352-a3840f433cb3', 'parent',             '01a19fca-f7c1-7b00-bb9b-de7cdca998e3'),
  ('01a19fca-f7cc-7b63-bbf8-f85ef50bc310', 'other_staff',        '01a19fca-f7c1-7b00-bb9b-de7cdca998e3'),
  ('01a19fca-f7cd-7c62-811c-ea4621361c9b', 'principal',          '01a19fca-f7c2-7501-a19d-d33df2cc2701'),
  ('01a19fca-f7ce-738b-aae9-46c8b5098833', 'school_admin',       '01a19fca-f7c2-7501-a19d-d33df2cc2701'),
  ('01a19fca-f7cf-7d50-aa46-27cb80032516', 'vice_principal',     '01a19fca-f7c2-7501-a19d-d33df2cc2701');
