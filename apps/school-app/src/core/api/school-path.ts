/**
 * Builds a tenant route: `/v1/schools/:schoolId/<path>`.
 *
 * Rules (CLAUDE.md, multi-tenancy):
 * - The school id goes in the PATH only. Never put `schoolId` / `school_id` in a body or query.
 * - Take the id from the active membership (`useSession`), never from user input.
 */
export function schoolPath(schoolId: string, path = ''): string {
  if (!schoolId) throw new Error('schoolPath: no active school');
  const clean = path.replace(/^\/+/, '');
  const base = `/v1/schools/${encodeURIComponent(schoolId)}`;
  return clean ? `${base}/${clean}` : base;
}

/**
 * Routes the API serves today (see `apps/api/src`). Add a route here only when the API has it.
 * Screens for later slices use their feature's mock service until then.
 */
export const API_ROUTES = {
  login: '/v1/auth/login',
  otpRequest: '/v1/auth/otp/request',
  otpVerify: '/v1/auth/otp/verify',
  refresh: '/v1/auth/refresh',
  logout: '/v1/auth/logout',
  me: '/v1/me',
  mySessions: '/v1/me/sessions',
  changePassword: '/v1/me/password',
  myVerificationRequests: '/v1/me/school-verification-requests',
  schoolDirectory: '/v1/directory/schools',
  /** Tenant routes: call with schoolPath(schoolId, ...). */
  school: {
    profile: '',
    members: 'members',
  },
} as const;
