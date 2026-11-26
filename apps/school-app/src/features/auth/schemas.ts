import { z } from 'zod';

/**
 * Form validation for UX only. The API validates every input again (class-validator DTOs);
 * these schemas never replace that and are not copies of API DTOs.
 */
export const staffLoginSchema = z.object({
  username: z.string().trim().min(1, 'Enter your username'),
  password: z.string().min(1, 'Enter your password'),
});
export type StaffLoginForm = z.infer<typeof staffLoginSchema>;

export const principalMobileSchema = z.object({
  mobile: z
    .string()
    .trim()
    .min(1, 'Enter your mobile number')
    .regex(/^\d+$/, 'Use digits only')
    .length(10, 'Mobile number must be 10 digits')
    .regex(/^[6-9]/, 'Mobile number must start with 6, 7, 8 or 9'),
});
export type PrincipalMobileForm = z.infer<typeof principalMobileSchema>;

export const GENDERS = ['Male', 'Female', 'Other'] as const;

/** Reads "DD/MM/YYYY" as a real calendar date, or null when it is not one. */
export function parseDob(value: string): Date | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!m) return null;
  const [day, month, year] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(year, month - 1, day);
  const real = d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
  return real ? d : null;
}

function ageOn(dob: Date, today: Date): number {
  let age = today.getFullYear() - dob.getFullYear();
  const beforeBirthday =
    today.getMonth() < dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

/** Principal registration after the first OTP sign-in. UX checks only; the API checks again. */
export const registrationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter your name')
    .min(2, 'Name is too short')
    .max(80, 'Name is too long')
    .regex(/^[\p{L}][\p{L} .'-]*$/u, 'Use letters only'),
  dob: z
    .string()
    .trim()
    .min(1, 'Enter your date of birth')
    .superRefine((v, ctx) => {
      const dob = parseDob(v);
      if (!dob) {
        ctx.addIssue({ code: 'custom', message: 'Enter a valid date as DD/MM/YYYY' });
      } else if (dob > new Date()) {
        ctx.addIssue({ code: 'custom', message: 'Date of birth cannot be in the future' });
      } else if (ageOn(dob, new Date()) < 18) {
        ctx.addIssue({ code: 'custom', message: 'You must be at least 18 years old' });
      }
    }),
  gender: z
    .string()
    .refine((v) => (GENDERS as readonly string[]).includes(v), 'Select your gender'),
});
export type RegistrationForm = z.infer<typeof registrationSchema>;

/** "Add Other School": used when the school is not in the list. UX checks only. */
export const otherSchoolSchema = z.object({
  name: z.string().trim().min(1, 'Enter the school name').min(3, 'School name is too short'),
  address: z.string().trim().min(1, 'Enter the full address').min(10, 'Enter the complete address'),
  pincode: z
    .string()
    .trim()
    .min(1, 'Enter the pincode')
    .regex(/^\d+$/, 'Use digits only')
    .length(6, 'Pincode must be 6 digits')
    .regex(/^[1-9]/, 'Enter a valid pincode'),
});
export type OtherSchoolForm = z.infer<typeof otherSchoolSchema>;

/** Length of the principal sign-in code in the approved design. */
export const OTP_LENGTH = 4;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter the temporary password'),
    newPassword: z.string().min(8, 'Use at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type ChangePasswordForm = z.infer<typeof changePasswordSchema>;
