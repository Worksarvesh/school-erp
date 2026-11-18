import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { ReactElement } from 'react';
import { LoginScreen } from './LoginScreen';
import { RoleSelectScreen } from './RoleSelectScreen';

const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
    canGoBack: () => false,
  }),
  useLocalSearchParams: () => mockParams,
}));

const metrics = {
  frame: { x: 0, y: 0, width: 360, height: 740 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};
const renderScreen = (ui: ReactElement) =>
  render(<SafeAreaProvider initialMetrics={metrics}>{ui}</SafeAreaProvider>);
// Testing Library v14: render and fireEvent are async.

beforeEach(() => {
  mockPush.mockClear();
  mockReplace.mockClear();
  mockParams = {};
});

describe('RoleSelectScreen', () => {
  it('keeps Continue disabled until a role is chosen, then opens the matching login', async () => {
    await renderScreen(<RoleSelectScreen />);
    await fireEvent.press(screen.getByTestId('role-continue'));
    expect(mockPush).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByTestId('role-parent'));
    await fireEvent.press(screen.getByTestId('role-continue'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/login', params: { role: 'parent' } });
  });
});

describe('LoginScreen', () => {
  it('student mode shows inline errors for empty fields and does not sign in', async () => {
    mockParams = { role: 'student' };
    await renderScreen(<LoginScreen />);
    await fireEvent.press(screen.getByTestId('sign-in'));
    expect(await screen.findByText('Enter your username')).toBeTruthy();
    expect(screen.getByText('Enter your password')).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('student mode signs in with any non-empty values and shows the profile prompt first', async () => {
    mockParams = { role: 'student' };
    await renderScreen(<LoginScreen />);
    await fireEvent.changeText(screen.getByTestId('username'), 'sch0001s0014');
    await fireEvent.changeText(screen.getByTestId('password'), 'secret');
    await fireEvent.press(screen.getByTestId('sign-in'));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/complete-profile'));
  });

  it('forgot password goes to Contact Admin', async () => {
    mockParams = { role: 'student' };
    await renderScreen(<LoginScreen />);
    await fireEvent.press(screen.getByTestId('forgot-password'));
    expect(mockPush).toHaveBeenCalledWith('/contact-admin');
  });

  it('parent mode asks for a mobile number and validates it', async () => {
    mockParams = { role: 'parent' };
    await renderScreen(<LoginScreen />);
    expect(screen.queryByTestId('password')).toBeNull();
    await fireEvent.changeText(screen.getByTestId('mobile'), '12345');
    await fireEvent.press(screen.getByTestId('send-otp'));
    expect(await screen.findByText('Enter a valid 10-digit mobile number')).toBeTruthy();

    await fireEvent.changeText(screen.getByTestId('mobile'), '98765 43210');
    await fireEvent.press(screen.getByTestId('send-otp'));
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith({ pathname: '/otp', params: { mobile: '9876543210' } }),
    );
  });
});
