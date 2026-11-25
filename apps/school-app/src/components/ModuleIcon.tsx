import React from 'react';
import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileCheck2,
  GraduationCap,
  KeyRound,
  Link2,
  Megaphone,
  MessageSquare,
  NotebookPen,
  School,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import type { ModuleIcon as ModuleIconName } from '@/core/navigation/modules';

const ICONS: Record<ModuleIconName, LucideIcon> = {
  approvals: ShieldCheck,
  calendar: CalendarDays,
  classes: School,
  staff: Users,
  students: GraduationCap,
  attendance: ClipboardCheck,
  notices: Megaphone,
  messages: MessageSquare,
  homework: NotebookPen,
  timetable: BookOpen,
  exams: FileCheck2,
  marks: ClipboardList,
  audit: KeyRound,
  link: Link2,
};

export function ModuleIcon({
  name,
  size = 24,
  color,
}: {
  name: ModuleIconName;
  size?: number;
  color: string;
}) {
  const Icon = ICONS[name];
  return <Icon size={size} color={color} />;
}
