import type { LoginResponseDto } from '@school-erp/api-client';
import type { AppRole } from '@/state/session';
import { mockParent, mockStudent } from './student';

/**
 * MOCK sign-in result passed to useAuthStore.setSession so the shared auth guard sees a signed-in
 * user. No network call is made; tokens are placeholders.
 */
export function mockSignInResponse(role: AppRole): LoginResponseDto {
  const isParent = role === 'parent';
  return {
    tokens: {
      accessToken: `mock_access_token_${role}`,
      refreshToken: `mock_refresh_token_${role}`,
      sessionId: `mock-session-${role}`,
      expiresIn: 900,
    },
    user: {
      id: isParent ? 'mock-user-parent-001' : 'mock-user-student-001',
      fullName: isParent ? mockParent.name : mockStudent.fullName,
      phone: isParent ? mockParent.mobile : null,
      roles: [role],
      activeSchoolId: 'mock-school-001',
    },
  };
}
