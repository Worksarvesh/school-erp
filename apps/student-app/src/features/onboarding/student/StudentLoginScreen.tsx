import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, User, Lock, Eye, EyeOff } from 'lucide-react-native';
import { Input } from '@school-erp/ui';

export function StudentLoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const validate = (): boolean => {
    let isValid = true;

    if (!username.trim()) {
      setUsernameError('School-issued username is required');
      isValid = false;
    } else {
      setUsernameError('');
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else {
      setPasswordError('');
    }

    return isValid;
  };

  const handleLogin = () => {
    if (!validate()) return;

    setIsSubmitting(true);

    // =========================================================================
    // TODO: backend login integration
    // When the backend auth endpoint is ready, invoke the login mutation here
    // with { username, password } to obtain tokens and session hydration.
    //
    // For now: Keep interactive with a brief loading state, without faking
    // a successful login or navigating to a fake dashboard.
    // =========================================================================
    setTimeout(() => {
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top, 16) + 8,
              paddingBottom: Math.max(insets.bottom, 24) + 16,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Bar with Back Action */}
          <View style={styles.topBar}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Back to role selection"
              onPress={handleBack}
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ArrowLeft size={22} color="#0F172A" strokeWidth={2.2} />
            </TouchableOpacity>
          </View>

          {/* Heading */}
          <View style={styles.headerBlock}>
            <Text style={styles.headingText}>Student Login</Text>
            <Text style={styles.subtitleText}>
              Please enter your school-issued credentials to access your student account.
            </Text>
          </View>

          {/* Login Form */}
          <View style={styles.formSection}>
            <Input
              label="Username"
              placeholder="e.g. STU2026001"
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                if (usernameError) setUsernameError('');
              }}
              error={usernameError}
              autoCapitalize="none"
              autoCorrect={false}
              leftIcon={<User size={18} color="#64748B" />}
              testID="student-login-username"
            />

            <View style={styles.fieldSpacer} />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError('');
              }}
              error={passwordError}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              leftIcon={<Lock size={18} color="#64748B" />}
              testID="student-login-password"
            />

            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowPassword(!showPassword)}
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {showPassword ? (
                <EyeOff size={18} color="#64748B" />
              ) : (
                <Eye size={18} color="#64748B" />
              )}
            </TouchableOpacity>

            <View style={styles.infoBanner}>
              <Text style={styles.infoText}>
                Student accounts are created during school enrollment. If you forgot your
                credentials, please contact your school administrator.
              </Text>
            </View>
          </View>

          {/* Login Action Button */}
          <View style={styles.bottomArea}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Log In"
              accessibilityState={{ disabled: isSubmitting }}
              disabled={isSubmitting}
              onPress={handleLogin}
              activeOpacity={0.88}
              style={[
                styles.loginButton,
                isSubmitting ? styles.loginButtonDisabled : styles.loginButtonActive,
              ]}
            >
              <Text style={styles.loginButtonText}>{isSubmitting ? 'Verifying...' : 'Log In'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  headerBlock: {
    marginBottom: 32,
  },
  headingText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  subtitleText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#64748B',
  },
  formSection: {
    flex: 1,
  },
  fieldSpacer: {
    height: 16,
  },
  passwordToggle: {
    position: 'absolute',
    right: 14,
    top: 104,
  },
  infoBanner: {
    marginTop: 24,
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoText: {
    fontSize: 12,
    lineHeight: 17,
    color: '#64748B',
  },
  bottomArea: {
    marginTop: 36,
  },
  loginButton: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonActive: {
    backgroundColor: '#7000FF',
    ...Platform.select({
      ios: {
        shadowColor: '#7000FF',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 14,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  loginButtonDisabled: {
    backgroundColor: '#EDE9FE',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
