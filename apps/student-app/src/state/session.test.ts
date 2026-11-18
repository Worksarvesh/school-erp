import { landingRouteAfterSignIn, useSession } from './session';

describe('landingRouteAfterSignIn', () => {
  it('shows the profile prompt to a student once, then Home', () => {
    expect(landingRouteAfterSignIn({ role: 'student', profilePromptSeen: false })).toBe(
      '/complete-profile',
    );
    expect(landingRouteAfterSignIn({ role: 'student', profilePromptSeen: true })).toBe('/home');
  });

  it('sends parents straight Home', () => {
    expect(landingRouteAfterSignIn({ role: 'parent', profilePromptSeen: false })).toBe('/home');
  });
});

describe('session store', () => {
  it('skipping the profile marks the prompt as seen without completing it', () => {
    useSession.getState().signIn('student');
    useSession.getState().skipProfile();
    const s = useSession.getState();
    expect(s.profilePromptSeen).toBe(true);
    expect(s.profileCompleted).toBe(false);
  });

  it('saving the profile stores the optional values', () => {
    useSession.getState().saveProfile({ heightCm: 145, bloodGroup: 'O+' });
    const s = useSession.getState();
    expect(s.profileCompleted).toBe(true);
    expect(s.optionalProfile).toEqual({ heightCm: 145, bloodGroup: 'O+' });
  });
});
