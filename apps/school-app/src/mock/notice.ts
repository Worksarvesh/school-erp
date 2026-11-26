// MOCK DATA for the School Notice screens, copied from the approved design. Delete once the notices
// API is wired.
import type { NoticeForm } from '@/features/notices/schemas';

/** The design shows only "All Students"; the other choices are placeholders. */
export const NOTICE_AUDIENCES = ['All Students', 'All Parents', 'All Staff', 'Everyone'] as const;

/** The one notice the design lists. */
export const NOTICE_LIST_MOCK: readonly (NoticeForm & { id: string })[] = [
  {
    id: 'early-dismissal',
    title: 'EARLY DISMISSAL NOTICE: HEAVY RAIN FORECAST FOR FRIDAY',
    description:
      'School transport will depart campus early at 1:30 PM due to regional meteorological advisory. Parent pick-ups...',
    assignedBy: 'Riya Patel',
    audience: 'All Students',
    publishDate: new Date(2026, 10, 1),
    expiryDate: new Date(2026, 10, 3),
  },
];

export const NOTICE_DRAFT_MOCK: NoticeForm = {
  title: 'Annual Sports Day',
  description:
    'Our Annual Sports Day will be held on 15th November 2025. All students are requested to participate enthusiastically.',
  assignedBy: 'Riya Patil',
  audience: 'All Students',
  publishDate: new Date(2025, 10, 10),
  expiryDate: new Date(2025, 10, 15),
};
