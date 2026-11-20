import { z } from 'zod';
import type { BloodGroup, MockStudent } from '@/mock/student';
import { BLOOD_GROUPS } from '@/mock/student';

export const HEIGHT_MIN_CM = 50;
export const HEIGHT_MAX_CM = 250;
export const WEIGHT_MIN_KG = 5;
export const WEIGHT_MAX_KG = 250;

/** Optional fields the student may fill. Empty is always valid: these never block saving. */
export const optionalProfileSchema = z.object({
  height: z
    .string()
    .trim()
    .refine((v) => v === '' || /^\d{2,3}$/.test(v), 'Enter height in whole centimetres')
    .refine(
      (v) => v === '' || (Number(v) >= HEIGHT_MIN_CM && Number(v) <= HEIGHT_MAX_CM),
      `Height must be between ${HEIGHT_MIN_CM} and ${HEIGHT_MAX_CM} cm`,
    ),
  weight: z
    .string()
    .trim()
    .refine((v) => v === '' || /^\d{1,3}$/.test(v), 'Enter weight in whole kilograms')
    .refine(
      (v) => v === '' || (Number(v) >= WEIGHT_MIN_KG && Number(v) <= WEIGHT_MAX_KG),
      `Weight must be between ${WEIGHT_MIN_KG} and ${WEIGHT_MAX_KG} kg`,
    ),
  bloodGroup: z.enum(BLOOD_GROUPS).optional(),
  studentMobile: z
    .string()
    .trim()
    .refine((v) => v === '' || /^[6-9]\d{9}$/.test(v), 'Enter a valid 10-digit mobile number'),
  email: z
    .string()
    .trim()
    .refine((v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Enter a valid email address'),
  address: z.string().trim().max(250, 'Address is too long'),
  emergencyContactName: z.string().trim().max(80, 'Name is too long'),
  emergencyContactPhone: z
    .string()
    .trim()
    .refine((v) => v === '' || /^[6-9]\d{9}$/.test(v), 'Enter a valid 10-digit mobile number'),
  hobbies: z.string().trim().max(200, 'Hobbies text is too long'),
});
export type OptionalProfileValues = z.infer<typeof optionalProfileSchema>;

/** School-controlled fields (read-only in the app); each counts as complete when the school has it. */
export function schoolRecordFields(student: MockStudent) {
  return [
    student.parent.name,
    student.parent.mobile,
    student.gender,
    student.dateOfBirth,
    `${student.className}${student.section}${student.rollNumber}`,
  ];
}

/**
 * Live profile completion: filled school records plus filled optional fields, over all fields.
 * With every school record present and all optional fields empty this is 5 / 14 = 36 %.
 */
export function profileCompletion(
  student: MockStudent,
  optional: {
    height?: string;
    weight?: string;
    bloodGroup?: BloodGroup;
    studentMobile?: string;
    email?: string;
    address?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    hobbies?: string;
  },
): number {
  const school = schoolRecordFields(student);
  const schoolFilled = school.filter((v) => v.trim() !== '').length;
  const optionalFilled = [
    optional.height?.trim(),
    optional.weight?.trim(),
    optional.bloodGroup,
    optional.studentMobile?.trim(),
    optional.email?.trim(),
    optional.address?.trim(),
    optional.emergencyContactName?.trim(),
    optional.emergencyContactPhone?.trim(),
    optional.hobbies?.trim(),
  ].filter(Boolean).length;
  const total = school.length + 9;
  return Math.round(((schoolFilled + optionalFilled) / total) * 100);
}

/** "2014-03-12" -> "12 Mar 2014" (fixed English month names; no locale dependence). */
export function formatDisplayDate(iso: string): string {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const [, year, month, day] = match;
  return `${Number(day)} ${months[Number(month) - 1] ?? ''} ${year}`;
}

/** Student age window for the date-of-birth calendar (4 to 25 years old, as of today). */
export function dobRange(today: Date = new Date()): { min: string; max: string } {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = today.getFullYear();
  const m = pad(today.getMonth() + 1);
  const d = pad(today.getDate());
  return { min: `${y - 25}-${m}-${d}`, max: `${y - 4}-${m}-${d}` };
}

export const PARENT_NAME_PATTERN = /^[A-Za-z][A-Za-z .'-]{1,59}$/;

/** Frontend checks for the required fields on the profile-completion screen. */
export function validateRequiredProfile(values: {
  parentName: string;
  parentMobile: string;
  gender: string | undefined;
  dateOfBirth: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  const name = values.parentName.trim();
  if (!name) errors.parentName = "Enter your parents' name";
  else if (!PARENT_NAME_PATTERN.test(name))
    errors.parentName = 'Use letters only (2-60 characters)';

  if (!values.parentMobile) errors.parentMobile = "Enter your parents' mobile number";
  else if (!/^\d{10}$/.test(values.parentMobile))
    errors.parentMobile = 'Mobile number must be exactly 10 digits';
  else if (!/^[6-9]/.test(values.parentMobile))
    errors.parentMobile = 'Mobile number must start with 6, 7, 8 or 9';

  if (!values.gender) errors.gender = 'Select gender';

  if (!values.dateOfBirth) errors.dateOfBirth = 'Select date of birth';
  else {
    const { min, max } = dobRange();
    if (values.dateOfBirth < min || values.dateOfBirth > max)
      errors.dateOfBirth = 'Select a valid date of birth';
  }
  return errors;
}
