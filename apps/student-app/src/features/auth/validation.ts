import { z } from 'zod';

/** Email: must have "@", and a "." after it (name@domain.tld), no spaces. */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
export const PASSWORD_MIN_LENGTH = 8;
const SPECIAL_CHARACTER = /[^A-Za-z0-9\s]/;

/**
 * Student sign-in (frontend checks only; the server decides who may sign in).
 * Email: required, must contain "@" and a "." after it.
 * Password: at least 8 characters, with a number and a special character, no spaces.
 */
export const studentLoginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, 'Enter your Email')
    .superRefine((v, ctx) => {
      if (v === '') return;
      if (!v.includes('@')) {
        ctx.addIssue({ code: 'custom', message: 'Email must contain "@"' });
      } else if (!EMAIL_PATTERN.test(v)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Enter a valid email with "." after "@" (e.g. name@school.edu)',
        });
      }
    }),
  password: z
    .string()
    .min(1, 'Enter your password')
    .superRefine((v, ctx) => {
      if (v === '') return;
      if (/\s/.test(v)) {
        ctx.addIssue({ code: 'custom', message: 'Password cannot contain spaces' });
      } else if (v.length < PASSWORD_MIN_LENGTH) {
        ctx.addIssue({
          code: 'custom',
          message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
        });
      } else if (!/\d/.test(v)) {
        ctx.addIssue({ code: 'custom', message: 'Password must contain a number' });
      } else if (!SPECIAL_CHARACTER.test(v)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Password must contain a special character (e.g. @ # $ !)',
        });
      }
    }),
});
export type StudentLoginValues = z.infer<typeof studentLoginSchema>;

/** Indian mobile: 10 digits, starting 6-9. Spaces are ignored. */
export const INDIAN_MOBILE = /^[6-9]\d{9}$/;
export const normalizeMobile = (raw: string) => raw.replace(/\s+/g, '');

export const parentLoginSchema = z.object({
  mobile: z
    .string()
    .transform(normalizeMobile)
    .pipe(
      z
        .string()
        .min(1, 'Enter your mobile number')
        .regex(INDIAN_MOBILE, 'Enter a valid 10-digit mobile number'),
    ),
});
export type ParentLoginValues = z.input<typeof parentLoginSchema>;

export const OTP_LENGTH = 6;
export const OTP_RESEND_SECONDS = 30;
export const isCompleteOtp = (code: string) => new RegExp(`^\\d{${OTP_LENGTH}}$`).test(code);

/** Formats a 10-digit mobile as "98765 43210" for display. */
export const formatMobile = (digits: string) =>
  digits.length === 10 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits;

/** First error message per top-level field, for showing under inputs. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '');
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
