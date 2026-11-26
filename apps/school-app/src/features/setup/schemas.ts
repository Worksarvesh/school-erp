import { z } from 'zod';

/** Name of the Admin being added. UX check only; the API validates again. */
export const adminNameSchema = z
  .string()
  .trim()
  .min(1, 'Enter the admin name')
  .min(2, 'Name is too short')
  .max(80, 'Name is too long')
  .regex(/^[\p{L}][\p{L} .'-]*$/u, 'Use letters only');
