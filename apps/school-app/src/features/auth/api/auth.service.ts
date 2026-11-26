import { ApiError } from '@school-erp/api-client';
import {
  mockLoginResponse,
  mockMembershipsForUsername,
  mockPrincipalMemberships,
  type Membership,
} from '@/mock/memberships';
import type { LoginResponseDto } from '@school-erp/api-client';

/**
 * Feature service pattern: screens call this interface, never axios directly. Today the mock
 * implementation is exported; swap `authService` for the HTTP one (using `apiClient` from
 * @school-erp/mobile-core and `API_ROUTES`) when wiring the real API. Screens do not change.
 */
export interface SignInResult {
  login: LoginResponseDto;
  fullName: string;
  memberships: Membership[];
  mustChangePassword: boolean;
}

export interface AuthService {
  /** Staff (Admin, VP, Teacher, Non-teaching): username + password. */
  staffLogin(
    username: string,
    password: string,
    demoRole?: 'vice_principal',
  ): Promise<SignInResult>;
  /** Principal: OTP to a registered mobile. Same generic answer whether or not it exists. */
  requestPrincipalOtp(mobile: string): Promise<void>;
  verifyPrincipalOtp(mobile: string, code: string): Promise<SignInResult>;
  changeTemporaryPassword(currentPassword: string, newPassword: string): Promise<void>;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockAuthService: AuthService = {
  async staffLogin(username, password, demoRole) {
    await delay(400);
    if (!username.trim() || !password) {
      // Generic message: never say whether the username exists.
      throw new ApiError(401, {
        code: 'invalid_credentials',
        message: 'Invalid username or password',
      });
    }
    // MOCK ONLY: the Vice Principal page opens that demo account for any username. The real API
    // takes the role from the account, never from the page the person used.
    const memberships = mockMembershipsForUsername(demoRole ? 'vp' : username);
    const fullName = `Demo ${memberships[0]?.roleLabel ?? 'Staff'}`;
    return {
      login: mockLoginResponse(fullName, memberships),
      fullName,
      memberships,
      mustChangePassword: password.toLowerCase().startsWith('temp'),
    };
  },

  async requestPrincipalOtp() {
    await delay(400);
  },

  async verifyPrincipalOtp(_mobile, code) {
    await delay(400);
    // MOCK: the approved design uses a 4-digit code; the real API sends 6 digits (OTP_FIXED_CODE).
    if (!/^(\d{4}|\d{6})$/.test(code)) {
      throw new ApiError(400, { code: 'invalid_otp', message: 'Invalid or expired code' });
    }
    const memberships = mockPrincipalMemberships();
    return {
      login: mockLoginResponse('Demo Principal', memberships),
      fullName: 'Demo Principal',
      memberships,
      mustChangePassword: false,
    };
  },

  async changeTemporaryPassword() {
    await delay(400);
  },
};

export const authService: AuthService = mockAuthService;
