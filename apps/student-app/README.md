# apps/student-app

Student App (Student + Parent modes). Expo SDK 58, React Native 0.88, Expo Router, TypeScript strict.
**UI only:** no backend, no network calls. All data comes from typed mocks in `src/mock/`.

Owner: Frontend Developer B (see the folder ownership rules). Shared infrastructure (root config,
lockfile) is owned by the Technical Lead.

## Run it (Windows PowerShell)

Prerequisites: Node 24 (`.node-version`), Corepack, and the **Expo Go** app (SDK 58) on a phone, or an
Android emulator / iOS simulator.

```powershell
# from the repository root
corepack enable
pnpm install
cd apps/student-app
npx expo start
```

Then scan the QR code with Expo Go (Android) or the Camera app (iOS), or press `a` (Android emulator) or
`w` (web preview). If the phone cannot reach your PC, run `npx expo start --tunnel`.

Checks (also run by CI from the repository root):

```powershell
pnpm --filter student-app run typecheck
pnpm --filter student-app run test
pnpm run lint
pnpm run format:check
```

## Demo flow

| Step            | What to do                                                                                                                                                             |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Splash          | Waits about 1.5 s, then opens role selection                                                                                                                           |
| Role            | Pick **Student** or **Parents**; Continue stays disabled until one is picked                                                                                           |
| Student login   | Any non-empty username and password (placeholder shows the real format `sch0001s0001`)                                                                                 |
| Forgot password | Opens "Contact Your School Admin" (no reset form, by design)                                                                                                           |
| Profile         | Shown once after the first student login. School records are read-only; height and blood group are optional. **Save and continue** or **Skip for now** both go to Home |
| Parent login    | A valid 10-digit Indian mobile number, then **any 6 digits** as the code                                                                                               |
| Home            | Quick actions, School Notices and the bell open a "Coming soon" screen; tabs other than Home are placeholders                                                          |

Session state is in memory only: restarting the app starts again at the splash screen as a first login.

## Structure

```
app/                     Expo Router routes (thin: each file re-exports a feature screen)
  (tabs)/                Home, Academic, Messages, Profile + custom tab bar
src/theme/               Design tokens (colours, spacing, radius, typography, sizes, shadows)
src/components/          Shared UI: PrimaryButton, TextField, PasswordField, SelectCard, Dropdown,
                         ProgressBar, SectionHeader, QuickActionTile, BigActionCard, BottomTabBar,
                         ScreenContainer
src/features/<feature>/  Screens and logic per feature (auth, profile, dashboard, academic, messages)
src/mock/                Typed mock data (the only data source)
src/state/               Mock session (zustand)
```

No colour, font size or spacing value appears outside `src/theme`.

## Decisions and assumptions

The Figma flow was adapted to the approved V1 product decisions (confirmed 2026-11-18):

1. **Sign-in by role.** Students use their school-issued username and password; parents use mobile number + one-time code (an extra **OTP screen** not in the Figma). The Figma's single "User ID / Email + password" form is not used.
2. **Profile never blocks Home.** Parent name, parent mobile, gender, date of birth and school details are school-controlled and shown read-only ("Verified by School"); the student fills only the optional height and blood group. The Figma's "Required" section is titled "School records", and **Skip for now** was added. Progress counts school records as complete, so it starts at 71 %, not the Figma's 60 %. No date picker is needed (date of birth is read-only).
3. **Home scope.** Tabs are Home, Academic, Messages, Profile (Fees is out of V1; no Focus tab). Quick actions are the approved academic modules: Time Table, Homework (Homework and Assignments are one module), Attendance, Exams, Results, Report Card, Syllabus, Chapter Progress. Sports, Puzzle, separate Assignments, Career Guidance and Events are not built. Only the School Notices big card remains.
4. **Parent mode** shows the same Home for one linked mock child ("Viewing ...") with the parent's name in the greeting. Linking a child with a link code is a later feature and is not built.
5. **Illustrations** are icon placeholders until real artwork is supplied; the logo is the grey "Logo" circle from the Figma.
6. **Mock data** (`src/mock/student.ts`) uses the Figma's names (Truptil, Mr. Suresh Patil, St. Joseph High School). The Home date and greeting use the device clock.
7. **Web** (`react-native-web`, `react-dom`) is included as in the Expo SDK 58 template so `w` gives a quick browser preview; the target is iOS and Android.
8. **Typed routes** are off so CI typechecks without running `expo start` first.
