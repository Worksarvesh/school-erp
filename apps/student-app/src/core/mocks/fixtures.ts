import type {
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
import { mockStudent } from '../../mock/student';

export const mockStudentRecord: StudentRecordDto = {
  id: '018e3a2b-c4d5-7e8f-9a0b-student001',
  schoolId: '018e3a2b-c4d5-7e8f-9a0b-school0001',
  userId: '018e3a2b-c4d5-7e8f-9a0b-user0000001',
  // School-recorded identity: single source of truth is src/mock/student.ts, so Home, onboarding
  // and the Profile tab always show the same student.
  fullName: mockStudent.fullName,
  admissionNumber: 'SCH-2024-0412',
  dateOfBirth: mockStudent.dateOfBirth,
  gender: mockStudent.gender.toLowerCase() as 'male' | 'female' | 'other',
  status: 'active',
  // Mandatory parent record
  fatherName: mockStudent.parent.name,
  motherName: 'Mrs. Meena Patil',
  registeredParentMobile: mockStudent.parent.mobile ? `+91${mockStudent.parent.mobile}` : null,
  // Active enrollment (derived)
  className: `Class ${mockStudent.className}`,
  sectionName: `Section ${mockStudent.section}`,
  rollNumber: String(mockStudent.rollNumber),
  // Optional editable fields
  studentMobile: '',
  email: '',
  address: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  heightCm: null,
  weightKg: null,
  bloodGroup: '',
  hobbies: '',
  profileCompletedAt: null,
};

export const mockTimetableSlots: TimetableSlotDto[] = [
  {
    id: 'slot-1',
    dayOfWeek: 1, // Monday
    periodNumber: 1,
    startTime: '08:00 AM',
    endTime: '08:45 AM',
    subjectName: 'Mathematics',
    teacherName: 'Mr. R. K. Gupta',
    roomNumber: 'Room 204',
  },
  {
    id: 'slot-2',
    dayOfWeek: 1,
    periodNumber: 2,
    startTime: '08:45 AM',
    endTime: '09:30 AM',
    subjectName: 'Science (Physics)',
    teacherName: 'Dr. Anita Desai',
    roomNumber: 'Physics Lab',
  },
  {
    id: 'slot-3',
    dayOfWeek: 1,
    periodNumber: 3,
    startTime: '09:45 AM',
    endTime: '10:30 AM',
    subjectName: 'English Literature',
    teacherName: 'Ms. Sarah Johnson',
    roomNumber: 'Room 204',
  },
  {
    id: 'slot-4',
    dayOfWeek: 1,
    periodNumber: 4,
    startTime: '10:30 AM',
    endTime: '11:15 AM',
    subjectName: 'Social Studies',
    teacherName: 'Mr. D. Verma',
    roomNumber: 'Room 204',
  },
  {
    id: 'slot-5',
    dayOfWeek: 1,
    periodNumber: 5,
    startTime: '11:45 AM',
    endTime: '12:30 PM',
    subjectName: 'Computer Science',
    teacherName: 'Mrs. Neha Mehta',
    roomNumber: 'Computer Lab 1',
  },
];

export const mockAttendanceSummary: AttendanceSummaryDto = {
  academicYear: '2026-2027',
  totalDays: 142,
  presentDays: 131,
  absentDays: 11,
  percentage: 92.25,
};

export const mockRecentAttendance: AttendanceRecordDto[] = [
  { date: '2026-11-18', status: 'present' },
  { date: '2026-11-17', status: 'present' },
  { date: '2026-11-16', status: 'present' },
  { date: '2026-11-15', status: 'absent', remarks: 'Medical leave approved' },
  { date: '2026-11-14', status: 'present' },
  { date: '2026-11-13', status: 'present' },
];

export const mockHomeworkList: HomeworkDto[] = [
  {
    id: 'hw-1',
    subjectName: 'English',
    title: 'Catcher in the Rye Vocab',
    description: 'Learn the 20 vocabulary words from chapters 1-5 and use each in a sentence.',
    assignedDate: '2026-11-12',
    dueDate: '2026-11-14',
    status: 'completed',
    teacherName: 'Ms. Sarah Johnson',
  },
  {
    id: 'hw-2',
    subjectName: 'Chemistry',
    title: 'Chapter 9 Chemical Reactions',
    description: 'Read Chapter 9 and answer the review questions at the end of the chapter.',
    assignedDate: '2026-11-12',
    dueDate: '2026-11-15',
    status: 'completed',
    teacherName: 'Dr. Anita Desai',
  },
  {
    id: 'hw-3',
    subjectName: 'Geometry',
    title: 'Read 5-1 - Do all "Got it"',
    description: 'Read lesson 5-1 and complete every "Got it?" problem in your notebook.',
    assignedDate: '2026-11-13',
    dueDate: '2026-11-16',
    status: 'completed',
    teacherName: 'Mr. R. K. Gupta',
  },
  {
    id: 'hw-4',
    subjectName: 'Chemistry',
    title: 'Chapter 9 Chemical Reactions WS II',
    description: 'Complete worksheet II on balancing chemical equations.',
    assignedDate: '2026-11-16',
    dueDate: '2026-11-20',
    status: 'pending',
    teacherName: 'Dr. Anita Desai',
  },
  {
    id: 'hw-5',
    subjectName: 'Health',
    title: 'Supplies Due',
    description: 'Bring the health class supplies listed on the class notice.',
    assignedDate: '2026-11-14',
    dueDate: '2026-11-17',
    status: 'completed',
    teacherName: 'Ms. P. Nair',
  },
  {
    id: 'hw-6',
    subjectName: 'Chemistry',
    title: 'Chapter 9 Problems',
    description: 'Solve problems 1-20 from the Chapter 9 problem set.',
    assignedDate: '2026-11-17',
    dueDate: '2026-11-21',
    status: 'pending',
    teacherName: 'Dr. Anita Desai',
  },
  {
    id: 'hw-7',
    subjectName: 'Geometry',
    title: 'Read 6 Capture',
    description: 'Read chapter 6 and capture the key theorems in your notes.',
    assignedDate: '2026-11-18',
    dueDate: '2026-11-22',
    status: 'pending',
    teacherName: 'Mr. R. K. Gupta',
  },
  {
    id: 'hw-8',
    subjectName: 'English',
    title: 'Read Ch. 3-5 Catcher in the Rye',
    description: 'Read chapters 3 to 5 and write a short summary of each.',
    assignedDate: '2026-11-18',
    dueDate: '2026-11-23',
    status: 'pending',
    teacherName: 'Ms. Sarah Johnson',
  },
  {
    id: 'hw-9',
    subjectName: 'English',
    title: 'PSAT PLAN Guidance Inventory',
    description: 'Fill in the PSAT PLAN guidance inventory form.',
    assignedDate: '2026-11-10',
    dueDate: '2026-11-13',
    status: 'completed',
    teacherName: 'Ms. Sarah Johnson',
  },
];

export const mockExamSchedules: ExamScheduleDto[] = [
  {
    id: 'exam-1',
    title: 'Pre-Board Examination Term 1',
    startDate: '2026-12-05',
    endDate: '2026-12-16',
    status: 'upcoming',
  },
  {
    id: 'exam-2',
    title: 'Mid-Term Assessment 2026',
    startDate: '2026-09-15',
    endDate: '2026-09-25',
    status: 'completed',
  },
];

export const mockExamResult: ExamResultDto = {
  id: 'result-midterm-2026',
  examTitle: 'Mid-Term Assessment 2026',
  term: 'Term 1',
  academicYear: '2026-2027',
  totalMarks: 448,
  maxTotalMarks: 500,
  percentage: 89.6,
  grade: 'A1',
  publishedAt: '2026-10-05T09:00:00Z',
  subjects: [
    { subjectName: 'Mathematics', marksObtained: 94, maxMarks: 100, grade: 'A1' },
    { subjectName: 'Science', marksObtained: 91, maxMarks: 100, grade: 'A1' },
    { subjectName: 'English', marksObtained: 88, maxMarks: 100, grade: 'A2' },
    { subjectName: 'Social Studies', marksObtained: 85, maxMarks: 100, grade: 'A2' },
    { subjectName: 'Computer Science', marksObtained: 90, maxMarks: 100, grade: 'A1' },
  ],
};

export const mockSyllabus: SyllabusSubjectDto[] = [
  {
    id: 'syl-math',
    subjectName: 'Mathematics',
    completionPercentage: 75,
    topics: [
      { id: 't-1', title: 'Real Numbers', isCompleted: true },
      { id: 't-2', title: 'Polynomials', isCompleted: true },
      { id: 't-3', title: 'Linear Equations in Two Variables', isCompleted: true },
      { id: 't-4', title: 'Quadratic Equations', isCompleted: true },
      {
        id: 't-5',
        title: 'Arithmetic Progressions',
        isCompleted: false,
        expectedDate: '2026-11-28',
      },
      { id: 't-6', title: 'Triangles & Geometry', isCompleted: false, expectedDate: '2026-12-15' },
    ],
  },
  {
    id: 'syl-sci',
    subjectName: 'Science',
    completionPercentage: 80,
    topics: [
      { id: 's-1', title: 'Chemical Reactions and Equations', isCompleted: true },
      { id: 's-2', title: 'Acids, Bases and Salts', isCompleted: true },
      { id: 's-3', title: 'Life Processes', isCompleted: true },
      { id: 's-4', title: 'Light - Reflection and Refraction', isCompleted: true },
      {
        id: 's-5',
        title: 'Electricity & Magnetism',
        isCompleted: false,
        expectedDate: '2026-12-10',
      },
    ],
  },
];

export const mockFeeSummary: FeeSummaryDto = {
  totalFeePaise: 7500000, // Rs. 75,000
  paidFeePaise: 5000000, // Rs. 50,000
  dueFeePaise: 2500000, // Rs. 25,000
  currency: 'INR',
  items: [
    {
      id: 'fee-q1',
      title: 'Quarter 1 Tuition & Lab Fee (Apr - Jun)',
      amountPaise: 2500000,
      status: 'paid',
      dueDate: '2026-04-15',
    },
    {
      id: 'fee-q2',
      title: 'Quarter 2 Tuition & Activity Fee (Jul - Sep)',
      amountPaise: 2500000,
      status: 'paid',
      dueDate: '2026-07-15',
    },
    {
      id: 'fee-q3',
      title: 'Quarter 3 Tuition & Examination Fee (Oct - Dec)',
      amountPaise: 2500000,
      status: 'due',
      dueDate: '2026-10-31',
    },
  ],
};

export const mockNotices: NoticeDto[] = [
  {
    id: 'notice-1',
    title: 'Annual Sports Day 2026 - Registration Open',
    content:
      'Students interested in track events and team sports should submit their nominations to their physical education teacher by Monday, 23rd November.',
    category: 'event',
    publishedAt: '2026-11-16T08:30:00Z',
    authorName: 'Department of Physical Education',
    isImportant: true,
  },
  {
    id: 'notice-2',
    title: 'Pre-Board Examination Date Sheet Published',
    content:
      'The timetable for Term 1 Pre-Board examinations has been finalized. Download or view the schedule under the Academic section.',
    category: 'exam',
    publishedAt: '2026-11-14T11:00:00Z',
    authorName: 'Examination Cell',
    isImportant: true,
  },
  {
    id: 'notice-3',
    title: 'Winter Uniform Mandatory from 1st December',
    content:
      'All students are required to wear complete winter school uniform starting Tuesday, 1st December 2026.',
    category: 'academic',
    publishedAt: '2026-11-10T09:15:00Z',
    authorName: 'Principal Office',
    isImportant: false,
  },
];

export const mockNotifications: NotificationDto[] = [
  {
    id: 'notif-1',
    title: 'New Homework Assigned',
    body: 'Mathematics: Quadratic Equations Exercise 4.2 has been assigned.',
    type: 'homework',
    createdAt: '2026-11-17T09:30:00Z',
    readAt: null,
    targetRoute: '/homework/hw-1',
  },
  {
    id: 'notif-2',
    title: 'Attendance Recorded',
    body: 'Your attendance has been marked as Present for today.',
    type: 'attendance',
    createdAt: '2026-11-18T08:15:00Z',
    readAt: null,
    targetRoute: '/attendance',
  },
  {
    id: 'notif-3',
    title: 'Upcoming Fee Due Reminder',
    body: 'Quarter 3 Fee is pending. Please have your guardian review fee details.',
    type: 'fee',
    createdAt: '2026-11-15T10:00:00Z',
    readAt: '2026-11-16T12:00:00Z',
    targetRoute: '/fees',
  },
];

export const mockBroadcastThreads: ConversationThreadDto[] = [
  {
    id: 'thread-school',
    title: 'Full School Announcements',
    recipientName: 'School Administration',
    recipientRole: 'Broadcast Channel',
    lastMessage: 'Welcome to the 2026-27 Academic Session student app portal.',
    lastMessageTime: 'Yesterday, 04:30 PM',
    unreadCount: 1,
  },
  {
    id: 'thread-class',
    title: 'Class 10-A Notice Board',
    recipientName: 'Class Teacher (Mr. R. K. Gupta)',
    recipientRole: 'Class Broadcast',
    lastMessage: 'Reminder: Mathematics doubt session scheduled for Thursday after 4th period.',
    lastMessageTime: 'Today, 09:15 AM',
    unreadCount: 2,
  },
];
