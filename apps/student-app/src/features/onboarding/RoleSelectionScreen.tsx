import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight } from 'lucide-react-native';
import studentIllustration from '../../../assets/onboarding/student.png';
import parentsIllustration from '../../../assets/onboarding/parents.png';
import { RoleSelectionCard } from './components/RoleSelectionCard';
import { useRoleStore } from './store/role.store';

interface RoleSelectionScreenProps {
  /**
   * Extension point for Parent flow (to be plugged in by teammate).
   * Pressing Parents invokes this callback without breaking Student flow.
   */
  onParentSelected?: () => void;
}

export function RoleSelectionScreen({ onParentSelected }: RoleSelectionScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const selectedRole = useRoleStore((state) => state.selectedRole);
  const setSelectedRole = useRoleStore((state) => state.setSelectedRole);

  const isStudentSelected = selectedRole === 'student';

  const handleSelectStudent = () => {
    setSelectedRole('student');
  };

  const handleSelectParents = () => {
    // Clean extension point for teammate:
    if (onParentSelected) {
      onParentSelected();
    } else {
      // Intentionally a safe no-op until Parent module is integrated
      // Does not navigate, does not crash, does not enable Continue.
    }
  };

  const handleContinue = () => {
    if (!isStudentSelected) return;
    router.push('/(auth)/student-login');
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 70, // ~100px total whitespace above heading
            paddingBottom: Math.max(insets.bottom, 24) + 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Top Heading Block */}
        <View style={styles.headerBlock}>
          <Text style={styles.headingText}>Tell Us About Yourself</Text>
          <Text style={styles.subtitleText}>
            Tell us a little about yourself so we can get to know you better.
          </Text>
        </View>

        {/* Center Selection Cards Row */}
        <View style={styles.cardsRow}>
          {/* Student Card */}
          <RoleSelectionCard
            title="Student"
            description="Are you planning to use our platform for learning?"
            tileBgColor="#F7F4FD"
            imageSource={studentIllustration}
            isSelected={isStudentSelected}
            onPress={handleSelectStudent}
            testID="role-card-student"
          />

          <View style={styles.cardGap} />

          {/* Parents Card */}
          <RoleSelectionCard
            title="Parents"
            description="Learning through engaging meaningful experiences."
            tileBgColor="#EFF6FF"
            imageSource={parentsIllustration}
            isSelected={false} // Intentionally unselected until Parent flow is connected
            onPress={handleSelectParents}
            testID="role-card-parents"
          />
        </View>

        {/* Bottom Pinned Continue Area */}
        <View style={styles.bottomArea}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Continue"
            accessibilityState={{ disabled: !isStudentSelected }}
            disabled={!isStudentSelected}
            onPress={handleContinue}
            activeOpacity={0.88}
            style={[
              styles.continueButton,
              isStudentSelected ? styles.continueButtonActive : styles.continueButtonDisabled,
            ]}
          >
            <Text
              style={[
                styles.continueButtonText,
                !isStudentSelected && styles.continueButtonTextDisabled,
              ]}
            >
              Continue
            </Text>
            <ArrowRight
              size={18}
              color={isStudentSelected ? '#FFFFFF' : '#C4B5FD'}
              strokeWidth={2.6}
              style={styles.arrowIcon}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 22,
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 50,
  },
  headingText: {
    fontSize: 27,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.4,
  },
  subtitleText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 36, // Wraps onto 2 clean lines as shown in screenshot
  },
  cardsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    marginVertical: 'auto',
  },
  cardGap: {
    width: 16,
  },
  bottomArea: {
    marginTop: 60,
    marginBottom: 10,
    alignItems: 'center',
  },
  continueButton: {
    width: '100%',
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonActive: {
    backgroundColor: '#7000FF',
    ...Platform.select({
      ios: {
        shadowColor: '#7000FF',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.38,
        shadowRadius: 18,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  continueButtonDisabled: {
    backgroundColor: '#DDD6FE',
    opacity: 0.65,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  continueButtonTextDisabled: {
    color: '#FFFFFF',
  },
  arrowIcon: {
    marginLeft: 8,
  },
});
