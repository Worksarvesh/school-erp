/** MOCK DATA ONLY for the Community tab. No API exists yet. */

export type CommunityAvatar = 'announcements' | 'teacher' | 'sports';

export interface CommunityChat {
  id: string;
  title: string;
  /** Blue tick next to official school accounts. */
  verified?: boolean;
  preview: string;
  time: string;
  unread?: number;
  avatar: CommunityAvatar;
}

export const COMMUNITY_CHATS: readonly CommunityChat[] = [
  {
    id: 'announcements',
    title: 'School Announcements',
    verified: true,
    preview: 'Exam timetable has been released...',
    time: '10:30 AM',
    unread: 2,
    avatar: 'announcements',
  },
  {
    id: 'teacher',
    title: 'Class Teacher',
    preview: 'Good morning everyone! 😊',
    time: '09:15 AM',
    unread: 1,
    avatar: 'teacher',
  },
  {
    id: 'sports',
    title: 'Sports Department',
    preview: 'Inter-school sports event details...',
    time: 'Yesterday',
    avatar: 'sports',
  },
];

export interface ThreadMessage {
  id: string;
  sender: string;
  avatar: 'coordinator' | 'coach';
  time: string;
  /** Lines of text, shown as separate paragraphs. */
  lines: readonly string[];
  /** Emoji at the end of the message. */
  emoji?: string;
  attachment?: { name: string; size: string; url: string };
  likes: number;
  /** Show the reply arrow under the message. */
  canReply?: boolean;
}

export interface CommunityThread {
  title: string;
  subtitle: string;
  members: number;
  dateLabel: string;
  messages: readonly ThreadMessage[];
}

/** Only the Sports Department group has messages in the design. */
export const COMMUNITY_THREADS: Record<string, CommunityThread> = {
  sports: {
    title: 'Sports Department',
    subtitle: 'Inter-school sports event',
    members: 124,
    dateLabel: 'Today, 17 Nov',
    messages: [
      {
        id: 'm1',
        sender: 'Sports Coordinator',
        avatar: 'coordinator',
        time: '09:15 AM',
        lines: [
          'Dear Students,',
          'Inter-school sports event will be held on 25th November at School Ground.',
          'Kindly prepare for your respective events.',
        ],
        emoji: '🏆',
        likes: 24,
        canReply: true,
      },
      {
        id: 'm2',
        sender: 'Sports Coordinator',
        avatar: 'coordinator',
        time: '10:30 AM',
        lines: ['Event Schedule is out now!'],
        emoji: '🗓️',
        attachment: {
          name: 'Sports_Event_Schedule.pdf',
          size: '245 KB',
          url: 'https://drive.google.com',
        },
        likes: 18,
      },
      {
        id: 'm3',
        sender: 'Sports Coach',
        avatar: 'coach',
        time: '11:12 AM',
        lines: ['Practice for Basketball Team will be held today at 4 PM in Sports Hall.'],
        emoji: '🏀',
        likes: 16,
      },
    ],
  },
};
