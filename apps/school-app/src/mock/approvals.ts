// MOCK DATA for the Approval Center, copied from the approved design. Delete once the approvals API
// is wired. The design's request types (room swap, fees) are placeholders, not the API's types.

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type ApprovalKind = 'swap' | 'teacher' | 'timetable' | 'fees';

export interface ApprovalRequest {
  /** Unique in the list. The design repeats a request number, so `id` is not. */
  key: string;
  /** The request number shown on the card. */
  id: string;
  kind: ApprovalKind;
  title: string;
  requestedBy: string;
  classLabel: string;
  date: string;
  status: ApprovalStatus;
  /** Shown under an approved request. */
  decidedBy?: string;
  /** Shown under a rejected request. */
  reason?: string;
  /** The design lists this under its status tab but not under All. */
  statusTabOnly?: boolean;
}

export const APPROVALS_MOCK: readonly ApprovalRequest[] = [
  {
    key: 'APP-1025',
    id: 'APP-1025',
    kind: 'swap',
    title: 'Room Swap Request',
    requestedBy: 'David Reynolds',
    classLabel: 'Lab 3 → Room 102',
    date: '03 Nov 2026 (Today)',
    status: 'pending',
  },
  {
    key: 'APP-1024-a',
    id: 'APP-1024',
    kind: 'teacher',
    title: 'Teacher Addition',
    requestedBy: 'Riya Patel',
    classLabel: '10 – A',
    date: '03 Nov 2026',
    status: 'pending',
    statusTabOnly: true,
  },
  {
    key: 'APP-1024-b',
    id: 'APP-1024',
    kind: 'teacher',
    title: 'Teacher Addition',
    requestedBy: 'Riya Patel',
    classLabel: '10 – A',
    date: '03 Nov 2026',
    status: 'pending',
    statusTabOnly: true,
  },
  {
    key: 'APP-1023',
    id: 'APP-1023',
    kind: 'timetable',
    title: 'Timetable Publish',
    requestedBy: 'Amit Deshmukh',
    classLabel: '9 – B',
    date: '02 Nov 2026',
    status: 'approved',
    decidedBy: 'Principal',
  },
  {
    key: 'APP-1023-b',
    id: 'APP-1023',
    kind: 'timetable',
    title: 'Timetable Publish',
    requestedBy: 'Amit Deshmukh',
    classLabel: '9 – B',
    date: '02 Nov 2026',
    status: 'approved',
    decidedBy: 'Principal',
    statusTabOnly: true,
  },
  {
    key: 'APP-1023-c',
    id: 'APP-1023',
    kind: 'timetable',
    title: 'Timetable Publish',
    requestedBy: 'Amit Deshmukh',
    classLabel: '9 – B',
    date: '02 Nov 2026',
    status: 'approved',
    decidedBy: 'Principal',
    statusTabOnly: true,
  },
  {
    key: 'APP-1022',
    id: 'APP-1022',
    kind: 'fees',
    title: 'Fees Allocation',
    requestedBy: 'Neha Sharma',
    classLabel: '11 – A',
    date: '01 Nov 2026',
    status: 'rejected',
    reason: 'Exceeds standard fee waiver ceiling limit.',
  },
  {
    key: 'APP-1022-b',
    id: 'APP-1022',
    kind: 'fees',
    title: 'Fees Allocation',
    requestedBy: 'Neha Sharma',
    classLabel: '11 – A',
    date: '01 Nov 2026',
    status: 'rejected',
    reason: 'Exceeds standard fee waiver ceiling limit.',
    statusTabOnly: true,
  },
  {
    key: 'APP-1022-c',
    id: 'APP-1022',
    kind: 'fees',
    title: 'Fees Allocation',
    requestedBy: 'Neha Sharma',
    classLabel: '11 – A',
    date: '01 Nov 2026',
    status: 'rejected',
    reason: 'Exceeds standard fee waiver ceiling limit.',
    statusTabOnly: true,
  },
];
