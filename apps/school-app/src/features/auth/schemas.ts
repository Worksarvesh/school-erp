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
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
});
export type PrincipalMobileForm = z.infer<typeof principalMobileSchema>;

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
