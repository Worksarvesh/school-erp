import { z } from 'zod';

export const DESCRIPTION_MAX = 500;

/** UX checks only; the API validates every notice again. */
export const noticeSchema = z
  .object({
    title: z.string().trim().min(1, 'Enter a title').min(3, 'Title is too short'),
    description: z
      .string()
      .trim()
      .min(1, 'Enter a description')
      .max(DESCRIPTION_MAX, `Use at most ${DESCRIPTION_MAX} characters`),
    assignedBy: z.string().trim().min(1, 'Enter who is assigning this notice'),
    audience: z.string().min(1, 'Select an audience'),
    publishDate: z.date({ error: 'Select a publish date' }),
    expiryDate: z.date({ error: 'Select an expiry date' }),
  })
  .refine((v) => v.expiryDate >= v.publishDate, {
    message: 'Expiry date cannot be before the publish date',
    path: ['expiryDate'],
  });
export type NoticeForm = z.infer<typeof noticeSchema>;
