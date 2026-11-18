import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username too long'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
