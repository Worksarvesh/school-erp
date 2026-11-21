import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { SafetyScreen } from '../../src/features/safety/screens/SafetyScreen';
import { ParentGuardianScreen } from '../../src/features/profile/screens/ParentGuardianScreen';
import { ProfileSectionScreen } from '../../src/features/profile/screens/ProfileSectionScreen';

export default function ProfileSectionRoute() {
  const { section } = useLocalSearchParams<{ section?: string }>();
  if (section === 'safety') return <SafetyScreen />;
  if (section === 'parent') return <ParentGuardianScreen />;
  return <ProfileSectionScreen />;
}
