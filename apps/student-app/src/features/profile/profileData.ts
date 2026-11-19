import { mockStudentRecord } from '../../core/mocks/fixtures';
import type { OptionalProfile } from '@/state/session';
import { mockStudent } from '@/mock/student';
import { formatDisplayDate } from './progress';

export type SectionId = 'personal' | 'parent' | 'contact' | 'academic' | 'safety';

/** Keys of the fields a student can edit (all optional). */
export type EditKey =
  | 'heightCm'
  | 'weightKg'
  | 'hobbies'
  | 'studentMobile'
  | 'email'
  | 'address'
  | 'emergencyContactName'
  | 'emergencyContactPhone'
  | 'bloodGroup';

export interface SectionField {
  label: string;
  /** Read-only value (school-controlled). */
  value?: string;
  /** Present when the student can edit this field. */
  edit?: EditKey;
}

export interface SectionDef {
  id: SectionId;
  title: string;
  /** Short note shown under the title. */
  note: string;
  fields: SectionField[];
}

const record = mockStudentRecord;
const dash = (v: string | null | undefined) => (v && v.trim() !== '' ? v : 'Not recorded');

/** Values for the Profile header card, with anything saved on the device taking priority. */
export function profileSummary(saved: OptionalProfile) {
  return {
    fullName: mockStudent.fullName,
    academicYear: mockStudent.academicYear,
    classLabel: `Class : ${mockStudent.className} ${mockStudent.section}`,
    rollLabel: `Roll: ${mockStudent.rollNumber}`,
    gender: saved.gender ?? mockStudent.gender,
  };
}

/** The five Profile sections, in menu order. School-controlled fields are read-only. */
export function profileSections(saved: OptionalProfile): SectionDef[] {
  const mobile = saved.parentMobile ?? mockStudent.parent.mobile;
  return [
    {
      id: 'personal',
      title: 'Personal Information',
      note: 'Name, date of birth and gender are set by your school.',
      fields: [
        { label: 'Full name', value: record.fullName },
        { label: 'Admission number', value: record.admissionNumber },
        {
          label: 'Date of birth',
          value: formatDisplayDate(saved.dateOfBirth ?? mockStudent.dateOfBirth),
        },
        { label: 'Gender', value: saved.gender ?? mockStudent.gender },
        { label: 'Height (cm)', edit: 'heightCm' },
        { label: 'Weight (kg)', edit: 'weightKg' },
        { label: 'Hobbies', edit: 'hobbies' },
      ],
    },
    {
      id: 'parent',
      title: 'Parent & Guardian Information',
      note: 'Registered with your school. Contact the school office to change these.',
      fields: [
        { label: "Parents' name", value: dash(saved.parentName ?? record.fatherName) },
        { label: "Mother's name", value: dash(record.motherName) },
        { label: "Parents' mobile number", value: mobile ? `+91 ${mobile}` : 'Not recorded' },
      ],
    },
    {
      id: 'contact',
      title: 'Contact & Address',
      note: 'Optional. Keeping these up to date helps your school reach you.',
      fields: [
        { label: 'Student mobile', edit: 'studentMobile' },
        { label: 'Email', edit: 'email' },
        { label: 'Address', edit: 'address' },
      ],
    },
    {
      id: 'academic',
      title: 'Academic Information',
      note: 'Derived from your active enrollment. Read only.',
      fields: [
        { label: 'School', value: mockStudent.schoolName },
        { label: 'Academic year', value: mockStudent.academicYear },
        { label: 'Class', value: mockStudent.className },
        { label: 'Section', value: mockStudent.section },
        { label: 'Roll number', value: String(mockStudent.rollNumber) },
      ],
    },
    {
      id: 'safety',
      title: 'Safety',
      note: 'Used by your school in an emergency.',
      fields: [
        { label: 'Emergency contact name', edit: 'emergencyContactName' },
        { label: 'Emergency contact mobile', edit: 'emergencyContactPhone' },
        { label: 'Blood group', edit: 'bloodGroup' },
      ],
    },
  ];
}

/** Current value of an editable field as text for an input. */
export function editValue(saved: OptionalProfile, key: EditKey): string {
  const fromRecord: Record<EditKey, string> = {
    heightCm: record.heightCm ? String(record.heightCm) : '',
    weightKg: record.weightKg ? String(record.weightKg) : '',
    hobbies: record.hobbies ?? '',
    studentMobile: record.studentMobile ?? '',
    email: record.email ?? '',
    address: record.address ?? '',
    emergencyContactName: record.emergencyContactName ?? '',
    emergencyContactPhone: record.emergencyContactPhone ?? '',
    bloodGroup: record.bloodGroup ?? '',
  };
  const s = saved[key];
  return s !== undefined && s !== null ? String(s) : fromRecord[key];
}
