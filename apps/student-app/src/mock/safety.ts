/** MOCK DATA ONLY for the Safety quick-dial screen. No API exists yet. */

export type SafetyAvatar = 'sarah' | 'man' | 'elena';

export interface QuickDialContact {
  id: string;
  title: string;
  subtitle: string;
  /** Number passed to the phone dialler. */
  dial: string;
  /** Red emergency tile instead of a photo. */
  emergency?: boolean;
  avatar?: SafetyAvatar;
}

export const QUICK_DIAL: readonly QuickDialContact[] = [
  {
    id: 'emergency',
    title: 'Emergency Services',
    subtitle: 'Police, Fire, Ambulance',
    dial: '112',
    emergency: true,
  },
  {
    id: 'ambulance',
    title: 'Ambulance',
    subtitle: 'Police, Fire, Ambulance',
    dial: '108',
    emergency: true,
  },
  {
    id: 'sarah',
    title: 'Sarah Miller',
    subtitle: 'Staff • +1 555-0123',
    dial: '+15550123',
    avatar: 'sarah',
  },
  {
    id: 'teacher',
    title: 'teacher staff • +1 555-0987',
    subtitle: 'Teacher staff • +1 555-0987',
    dial: '+15550987',
    avatar: 'man',
  },
  {
    id: 'elena',
    title: 'Elena Rodriguez',
    subtitle: 'Staff • +1 555-4422',
    dial: '+15554422',
    avatar: 'elena',
  },
  {
    id: 'parent',
    title: 'Parents No • +91 7893444656',
    subtitle: 'Shelesh Sharma',
    dial: '+917893444656',
    avatar: 'man',
  },
];
