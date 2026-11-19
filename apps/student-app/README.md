# Student App (V1.2, UI only)

Expo Router app for students and parents. **Mock data only**: no API calls, no real sign-in.
Shared design system and auth plumbing come from the workspace packages:

- `@school-erp/ui`: theme (`ThemeProvider`, `useTheme`), `Screen`, `Header`, `Button`, `Input`, `Card`, `Badge`, `Avatar`, `StateView`.
- `@school-erp/mobile-core`: `useAuthStore` (the root layout guard reads it), `SecureStorage`.
- Icons: `lucide-react-native`.

## Run it (Windows PowerShell, from the repo root)

```powershell
pnpm install
pnpm --filter student-app start
pnpm --filter student-app android
pnpm --filter student-app typecheck
```

Press `a` in the Expo terminal for Android or scan the QR code with Expo Go.

## Flow (V1.2 spec)

1. Splash -> Role select (Student / Parents) -> Login.
2. Login is role-aware (`src/features/auth/screens/RoleAwareLoginScreen.tsx`):
   - **Student**: username (placeholder `sch0001s0001`) + password with Show/Hide. "Forgot Password?"
     opens Contact School Admin. There is no reset form.
   - **Parent**: mobile (+91, 10 digits, must start 6-9) + "Send OTP" -> OTP screen. No password.
     Mock: `9000000000` shows "No account found for this number. Please contact your school." with a
     Contact School button.
3. OTP (parents): 6 boxes, auto-advance, 30 s resend timer, Verify enabled at 6 digits. Any 6 digits work.
4. Profile completion (students only) never blocks Home. Shown once after a student's first login;
   Skip, Save and Back all go to Home. School fields are read-only ("Verified by School"); only height
   and blood group are editable. Parents never see it.
5. Home: school header, greeting, bell, hero card, exactly 7 tiles (Time Table, Homework, Attendance,
   Exams, Results, Syllabus, Notices) and one School Notices card. Parents get a child switcher
   (2 mock children at different schools).
6. Tabs: Home, Academic, Messages, Profile (one `TABS` constant in `app/(tabs)/_layout.tsx`).
   Messages is an empty-state placeholder. Fees is out of V1 and hidden from the tab bar.

## Navigation and guard

`app/_layout.tsx` guards every route with `useAuthStore`:

- Signed out, outside `(auth)` -> `/(auth)/splash`.
- Signed in, still in `(auth)` -> students who have not seen the profile prompt go to
  `/(onboarding)/complete-profile`, everyone else to `/(tabs)` (`landingRouteAfterSignIn` in
  `src/state/session.ts`).

| Group | Routes |
| --- | --- |
| `(auth)` | `splash`, `role-select`, `login`, `otp`, `contact-admin` |
| `(onboarding)` | `complete-profile` |
| `(tabs)` | `index` (Home), `academic`, `messages`, `profile` (`fees` kept on disk, hidden) |
| root stack | `timetable`, `attendance`, `homework`, `examinations`, `examinations/results`, `syllabus`, `notices`, `notifications` |

Route files are one-line re-exports; screens live in `src/features/<feature>/screens`.

## Mock data and switches

- `src/mock/student.ts`: student, parent, two linked children, `MOCK_UNREGISTERED_PARENT_MOBILE`
  (`9000000000`) and `MOCK_FLAGS.parentMobileMissing` (set to `true` to demo the editable parent
  mobile with the "Pending confirmation by school" badge).
- `src/mock/auth.ts`: placeholder sign-in result passed to `useAuthStore.setSession`.
- `src/core/mocks/*`: data used by the academic screens (timetable, homework, exams, notices...).

To see the flow from the start again, sign out from the Profile tab. To see the profile prompt
again, clear the app's storage (Android: Settings -> Apps -> Expo Go -> Storage -> Clear data).

## Kept but not linked

`src/features/dashboard/screens/DashboardScreen.tsx`, `src/features/communication/screens/MessagesScreen.tsx`,
`src/features/onboarding/screens/MandatoryOnboardingScreen.tsx`, `src/features/auth/screens/LoginScreen.tsx`,
`src/features/auth/screens/ForgotPasswordModal.tsx` (+ `app/forgot-password-modal.tsx`),
`src/features/fees/screens/FeesScreen.tsx` (+ `app/(tabs)/fees.tsx`, hidden with `href: null`).

## Tests

Unit tests are not set up in this app yet (no jest). Adding jest, `jest-expo` and
`@testing-library/react-native` needs approval because it changes the root lockfile.
