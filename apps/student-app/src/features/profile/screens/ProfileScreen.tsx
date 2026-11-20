/* eslint-disable @typescript-eslint/no-require-imports -- React Native image assets are loaded with require() */
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronRight, IdCard, Info, User } from 'lucide-react-native';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@school-erp/mobile-core';
import { useSession } from '@/state/session';
import { ProfileTopBar } from '../components/ProfileTopBar';
import { profileSections, profileSummary, type SectionId } from '../profileData';

const BLUE = '#1D4ED8';

/**
 * Profile tab: header card (photo, name, academic year, class and roll chips) and the five
 * sections. Each row opens the section screen. MOCK data only.
 */
export function ProfileScreen() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const saved = useSession((s) => s.optionalProfile);
  const summary = profileSummary(saved);
  const sections = profileSections(saved);

  const open = (id: SectionId) =>
    router.push({ pathname: '/profile-section/[section]', params: { section: id } });

  const onLogout = async () => {
    await logout();
    router.replace('/(auth)/splash');
  };

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <StatusBar style="dark" />
      <ProfileTopBar title="Profile" onBack={() => router.replace('/(tabs)')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.band} />
          <View style={styles.photoRing}>
            <Image
              source={require('../../../../assets/images/profile/photo.png')}
              accessibilityLabel="Profile photo"
              style={styles.photo}
            />
          </View>
          <Text style={styles.name}>{summary.fullName}</Text>
          <Text style={styles.year}>{summary.academicYear}</Text>
          <View style={styles.chips}>
            <Chip label={summary.classLabel} />
            <Chip label={summary.rollLabel} />
          </View>
        </View>

        <View style={styles.menu}>
          {sections.map((section, i) => (
            <Pressable
              key={section.id}
              testID={`profile-${section.id}`}
              accessibilityRole="button"
              accessibilityLabel={section.title}
              onPress={() => open(section.id)}
              style={[styles.row, i < sections.length - 1 && styles.rowDivider]}
            >
              <View style={[styles.iconCircle, section.id === 'parent' && styles.iconCircleGrey]}>
                {section.id === 'parent' ? (
                  <Info size={24} color="#374151" />
                ) : (
                  <User size={24} color={BLUE} />
                )}
              </View>
              <Text style={styles.rowLabel}>{rowLabel(section.id, section.title)}</Text>
              <ChevronRight size={22} color="#374151" />
            </Pressable>
          ))}
        </View>

        <Pressable
          testID="log-out"
          accessibilityRole="button"
          accessibilityLabel="Log out"
          onPress={() => void onLogout()}
          style={styles.logout}
        >
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

/** The design lists the last row in lower case ("safety"). */
function rowLabel(id: SectionId, title: string) {
  return id === 'safety' ? 'safety' : title;
}

function Chip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <IdCard size={18} color={BLUE} />
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 130 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    paddingBottom: 22,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  band: { alignSelf: 'stretch', height: 96, backgroundColor: '#9B80D0' },
  photoRing: {
    marginTop: -62,
    width: 126,
    height: 126,
    borderRadius: 63,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  photo: { width: 112, height: 112, borderRadius: 56 },
  name: { color: '#111827', fontSize: 24, fontWeight: '600', marginTop: 14 },
  year: { color: '#4B5563', fontSize: 17, marginTop: 4 },
  chips: { flexDirection: 'row', gap: 14, marginTop: 18 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E3EEFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: { color: BLUE, fontSize: 15, fontWeight: '700' },
  menu: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  row: {
    minHeight: 65,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: '#F1F2F6' },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ECEEFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleGrey: { backgroundColor: '#ECECF3' },
  rowLabel: { flex: 1, color: '#111827', fontSize: 18 },
  logout: { alignSelf: 'center', marginTop: 22, paddingVertical: 12, paddingHorizontal: 20 },
  logoutText: { color: '#DC2626', fontSize: 15, fontWeight: '600' },
});
