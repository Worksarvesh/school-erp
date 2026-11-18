import type { Role } from '@school-erp/shared-types';

export interface ApiResponse<T> {
  data: T;
  meta?: {
    requestId?: string;
    timestamp?: string;
  };
}

export interface PaginationParams {
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string | null;
  hasMore: boolean;
  total?: number;
}

// Auth contracts
export interface LoginRequestDto {
  identifier: string;
  password: string;
  clientApp?: 'student_app' | 'school_app' | 'web';
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresIn: number;
}

export interface UserSummaryDto {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  roles: Role[];
  activeSchoolId?: string | null;
}

export interface LoginResponseDto {
  tokens: AuthTokensDto;
  user: UserSummaryDto;
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}

// Student & Academic Base Models
export interface StudentRecordDto {
  id: string;
  schoolId: string;
  userId: string;
  fullName: string;
  admissionNumber: string;
  dateOfBirth?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  status: 'active' | 'transferred' | 'withdrawn';
  // Mandatory parent record fields (school-recorded)
  fatherName?: string | null;
  motherName?: string | null;
  registeredParentMobile?: string | null;
  // Active enrollment fields (derived from enrollment)
  className: string;
  sectionName: string;
  rollNumber: string;
  // Optional student-editable fields
  studentMobile?: string | null;
  email?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  bloodGroup?: string | null;
  hobbies?: string | null;
  profileCompletedAt?: string | null;
}

export interface TimetableSlotDto {
  id: string;
  dayOfWeek: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  periodNumber: number;
  startTime: string;
  endTime: string;
  subjectName: string;
  teacherName: string;
  roomNumber?: string | null;
}

export interface AttendanceRecordDto {
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks?: string | null;
}

export interface AttendanceSummaryDto {
  academicYear: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  percentage: number;
}

export interface HomeworkDto {
  id: string;
  subjectName: string;
  title: string;
  description: string;
  assignedDate: string;
  dueDate: string;
  status: 'pending' | 'completed';
  teacherName: string;
}

export interface ExamScheduleDto {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'ongoing' | 'completed';
}

export interface ExamSubjectResultDto {
  subjectName: string;
  marksObtained: number;
  maxMarks: number;
  grade?: string | null;
}

export interface ExamResultDto {
  id: string;
  examTitle: string;
  term: string;
  academicYear: string;
  totalMarks: number;
  maxTotalMarks: number;
  percentage: number;
  grade: string;
  subjects: ExamSubjectResultDto[];
  publishedAt: string;
}

export interface SyllabusTopicDto {
  id: string;
  title: string;
  isCompleted: boolean;
  expectedDate?: string | null;
}

export interface SyllabusSubjectDto {
  id: string;
  subjectName: string;
  completionPercentage: number;
  topics: SyllabusTopicDto[];
}

export interface FeeItemDto {
  id: string;
  title: string;
  amountPaise: number;
  status: 'paid' | 'due' | 'overdue';
  dueDate: string;
}

export interface FeeSummaryDto {
  totalFeePaise: number;
  paidFeePaise: number;
  dueFeePaise: number;
  currency: string;
  items: FeeItemDto[];
}

export interface NoticeDto {
  id: string;
  title: string;
  content: string;
  category: 'academic' | 'event' | 'holiday' | 'exam' | 'urgent';
  publishedAt: string;
  authorName: string;
  isImportant: boolean;
}

export interface NotificationDto {
  id: string;
  title: string;
  body: string;
  type: 'homework' | 'attendance' | 'exam' | 'fee' | 'general';
  createdAt: string;
  readAt?: string | null;
  targetRoute?: string | null;
}

export interface ConversationThreadDto {
  id: string;
  title: string;
  recipientName: string;
  recipientRole: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}
