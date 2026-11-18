import { z } from 'zod';

/** Student sign-in: school-issued username (format sch0001s0001) and password. Mock accepts any non-empty pair. */
export const studentLoginSchema = z.object({
  username: z.string().trim().min(1, 'Enter your username'),
  password: z.string().min(1, 'Enter your password'),
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
export const otpSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), `Enter the ${OTP_LENGTH}-digit code`),
});
export type OtpValues = z.infer<typeof otpSchema>;

/** Formats a 10-digit mobile as "98765 43210" for display. */
export const formatMobile = (digits: string) =>
  digits.length === 10 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits;
