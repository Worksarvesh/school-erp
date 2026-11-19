import { z } from 'zod';
import type { BloodGroup, MockStudent } from '@/mock/student';
import { BLOOD_GROUPS } from '@/mock/student';

export const HEIGHT_MIN_CM = 50;
export const HEIGHT_MAX_CM = 250;

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
  bloodGroup: z.enum(BLOOD_GROUPS).optional(),
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
 * With every school record present and both optional fields empty this is 5 / 7 = 71 %.
 */
export function profileCompletion(
  student: MockStudent,
  optional: { height?: string; bloodGroup?: BloodGroup },
): number {
  const school = schoolRecordFields(student);
  const schoolFilled = school.filter((v) => v.trim() !== '').length;
  const optionalFilled = [optional.height?.trim(), optional.bloodGroup].filter(Boolean).length;
  const total = school.length + 2;
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
