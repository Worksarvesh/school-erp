import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession, type LoginPath } from '@/state/session';

/* eslint-disable @typescript-eslint/no-require-imports -- Metro bundles static images only through require(). */
const AVATARS = {
  principal: require('../../../../assets/roles/principal.png'),
  vicePrincipal: require('../../../../assets/roles/vice-principal.png'),
  admin: require('../../../../assets/roles/admin.png'),
  teaching: require('../../../../assets/roles/teaching.png'),
  nonTeaching: require('../../../../assets/roles/non-teaching.png'),
};
/* eslint-enable @typescript-eslint/no-require-imports */

const TITLE = '#111A33';
const SUBTITLE = '#7A7F8E';
const MUTED = '#5F6B85';
const BORDER = '#C9C9D1';

interface Option {
  key: string;
  path: LoginPath;
  title: string;
  description: string;
  avatar: number;
  /** Left padding of the avatar, as in the design (the content is not centred identically). */
  inset: number;
}

/**
 * SCHOOL-COMMON-ROLE-SELECTION: a client-side choice of LOGIN PATH only (Principal OTP vs staff
 * username). It grants nothing; what the person can do comes from their memberships.
 */
const OPTIONS: readonly Option[] = [
  {
    key: 'principal',
    path: 'principal',
    title: 'Principal',
    description: 'Mobile number + OTP',
    avatar: AVATARS.principal,
    inset: 27,
  },
  {
    key: 'vice-principal',
    path: 'staff',
    title: 'Vice Principal',
    description: 'Username + password',
    avatar: AVATARS.vicePrincipal,
    inset: 24,
  },
  {
    key: 'admin',
    path: 'staff',
    title: 'Admin',
    description: 'Username + password',
    avatar: AVATARS.admin,
    inset: 22,
  },
  {
    key: 'teaching',
    path: 'staff',
    title: 'Teaching Staff',
    description: 'Class Teacher / Subject Teacher',
    avatar: AVATARS.teaching,
    inset: 21,
  },
  {
    key: 'non-teaching',
    path: 'staff',
    title: 'Non-Teaching Staff',
    description: 'Library, office, security and more',
    avatar: AVATARS.nonTeaching,
    inset: 17,
  },
];

export function RoleSelectScreen() {
  const router = useRouter();
  const chooseLoginPath = useSession((s) => s.chooseLoginPath);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>
          Tell Us About Yourself
        </Text>
        <Text style={styles.subtitle}>
          Tell us a little about yourself so we can get to know you better.
        </Text>

        <View style={styles.cards}>
          {OPTIONS.map((o) => (
            <Pressable
              key={o.key}
              testID={`role-${o.key}`}
              accessibilityRole="button"
              accessibilityLabel={`${o.title}. ${o.description}`}
              onPress={() => {
                chooseLoginPath(o.path);
                if (o.path === 'principal') router.push('/(auth)/principal-login');
                // The Vice Principal has designed pages of its own: registration, then login.
                else if (o.key === 'vice-principal')
                  router.push('/(auth)/vice-principal-registration');
                else router.push('/(auth)/staff-login');
              }}
              style={({ pressed }) => [
                styles.card,
                { paddingLeft: o.inset },
                pressed && styles.cardPressed,
              ]}
            >
              <Image source={o.avatar} style={styles.avatar} />
              <View style={styles.text}>
                <Text style={styles.cardTitle}>{o.title}</Text>
                <Text style={styles.cardDescription}>{o.description}</Text>
              </View>
              <ChevronRight size={28} color="#2B2B33" style={styles.chevron} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 30, paddingTop: 56, paddingBottom: 32 },
  title: {
    color: TITLE,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  subtitle: {
    color: SUBTITLE,
    fontSize: 16,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 20,
  },
  cards: { marginTop: 24, gap: 16 },
  card: {
    height: 81,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  cardPressed: { backgroundColor: '#F7F5FF' },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  text: { marginLeft: 12, flexShrink: 1, paddingRight: 30 },
  cardTitle: { color: TITLE, fontSize: 20, lineHeight: 26, fontWeight: '600' },
  cardDescription: { color: MUTED, fontSize: 14, lineHeight: 19, marginTop: 2 },
  chevron: { position: 'absolute', right: 12 },
});
