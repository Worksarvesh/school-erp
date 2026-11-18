import {
  mockStudentRecord,
  mockTimetableSlots,
  mockAttendanceSummary,
  mockRecentAttendance,
  mockHomeworkList,
  mockExamSchedules,
  mockExamResult,
  mockSyllabus,
  mockFeeSummary,
  mockNotices,
  mockNotifications,
  mockBroadcastThreads,
} from './fixtures';
import type {
  LoginRequestDto,
  LoginResponseDto,
  StudentRecordDto,
  TimetableSlotDto,
  AttendanceSummaryDto,
  AttendanceRecordDto,
  HomeworkDto,
  ExamScheduleDto,
  ExamResultDto,
  SyllabusSubjectDto,
  FeeSummaryDto,
  NoticeDto,
  NotificationDto,
  ConversationThreadDto,
} from '@school-erp/api-client';

const SIMULATED_DELAY_MS = 250;

function delay<T>(data: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), SIMULATED_DELAY_MS));
}

export const MockStudentServices = {
  login: async (dto: LoginRequestDto): Promise<LoginResponseDto> => {
    if (!dto.identifier || !dto.password) {
      throw new Error('Username and password are required');
    }
    return delay<LoginResponseDto>({
      tokens: {
        accessToken: 'mock_jwt_access_token_student_001',
        refreshToken: 'mock_jwt_refresh_token_student_001',
        sessionId: '018e3a2b-c4d5-7e8f-9a0b-session001',
        expiresIn: 900,
      },
      user: {
        id: mockStudentRecord.userId,
        fullName: mockStudentRecord.fullName,
        email: mockStudentRecord.email,
        phone: mockStudentRecord.studentMobile,
        roles: ['student'],
        activeSchoolId: mockStudentRecord.schoolId,
      },
    });
  },

  getStudentRecord: async (): Promise<StudentRecordDto> => {
    return delay(mockStudentRecord);
  },

  updateEditableProfile: async (updates: Partial<StudentRecordDto>): Promise<StudentRecordDto> => {
    // Only optional student-editable fields can be merged
    Object.assign(mockStudentRecord, {
      studentMobile: updates.studentMobile ?? mockStudentRecord.studentMobile,
      email: updates.email ?? mockStudentRecord.email,
      address: updates.address ?? mockStudentRecord.address,
      emergencyContactName: updates.emergencyContactName ?? mockStudentRecord.emergencyContactName,
      emergencyContactPhone:
        updates.emergencyContactPhone ?? mockStudentRecord.emergencyContactPhone,
      heightCm: updates.heightCm ?? mockStudentRecord.heightCm,
      weightKg: updates.weightKg ?? mockStudentRecord.weightKg,
      bloodGroup: updates.bloodGroup ?? mockStudentRecord.bloodGroup,
      hobbies: updates.hobbies ?? mockStudentRecord.hobbies,
      profileCompletedAt: mockStudentRecord.profileCompletedAt || new Date().toISOString(),
    });
    return delay({ ...mockStudentRecord });
  },

  getTimetable: async (dayOfWeek?: number): Promise<TimetableSlotDto[]> => {
    const list = dayOfWeek
      ? mockTimetableSlots.filter((s) => s.dayOfWeek === dayOfWeek)
      : mockTimetableSlots;
    return delay(list);
  },

  getAttendanceSummary: async (): Promise<AttendanceSummaryDto> => {
    return delay(mockAttendanceSummary);
  },

  getAttendanceHistory: async (): Promise<AttendanceRecordDto[]> => {
    return delay(mockRecentAttendance);
  },

  getHomeworkList: async (): Promise<HomeworkDto[]> => {
    return delay(mockHomeworkList);
  },

  getHomeworkDetail: async (id: string): Promise<HomeworkDto | null> => {
    const found = mockHomeworkList.find((h) => h.id === id) || null;
    return delay(found);
  },

  getExamSchedules: async (): Promise<ExamScheduleDto[]> => {
    return delay(mockExamSchedules);
  },

  getExamResult: async (id: string): Promise<ExamResultDto | null> => {
    return delay(mockExamResult.id === id ? mockExamResult : mockExamResult);
  },

  getSyllabus: async (): Promise<SyllabusSubjectDto[]> => {
    return delay(mockSyllabus);
  },

  getFeeSummary: async (): Promise<FeeSummaryDto> => {
    return delay(mockFeeSummary);
  },

  getNotices: async (): Promise<NoticeDto[]> => {
    return delay(mockNotices);
  },

  getNoticeDetail: async (id: string): Promise<NoticeDto | null> => {
    const found = mockNotices.find((n) => n.id === id) || null;
    return delay(found);
  },

  getNotifications: async (): Promise<NotificationDto[]> => {
    return delay(mockNotifications);
  },

  markNotificationAsRead: async (id: string): Promise<NotificationDto> => {
    const target = mockNotifications.find((n) => n.id === id);
    if (target) {
      target.readAt = new Date().toISOString();
      return delay({ ...target });
    }
    throw new Error('Notification not found');
  },

  getBroadcastThreads: async (): Promise<ConversationThreadDto[]> => {
    return delay(mockBroadcastThreads);
  },
};
