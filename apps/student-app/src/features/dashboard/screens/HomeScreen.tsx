/* eslint-disable @typescript-eslint/no-require-imports -- React Native image assets are loaded with require() */
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowRight, Bell, School } from 'lucide-react-native';
import { useEffect } from 'react';
import { Image, type ImageSourcePropType, Pressable, ScrollView, View } from 'react-native';
import { StyleSheet, Text, scaled } from '@school-erp/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { findChild, mockParent, mockStudent } from '@/mock/student';
import { useSession } from '@/state/session';
import { formatLongDate, greetingFor, QUICK_ACTIONS } from '../quickActions';

/** Fixed light palette for Home (approved design: white page, deep-violet cards). */
const HOME = {
  deep: '#4B18AA',
  text: '#111827',
  muted: '#6B7280',
  tileBg: '#F7F3FF',
  hero: '#F1EBFF',
  red: '#DC2626',
} as const;

const SOFT_SHADOW = {
  shadowColor: '#4B18AA',
  shadowOpacity: 0.14,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 4,
} as const;

/**
 * Student App Home: school header, greeting with bell, hero card, 8 quick tiles, School Notices
 * and the Career Guidance / Events cards. Parent mode adds a child switcher. MOCK data only.
 * The floating tab bar (app/(tabs)/_layout.tsx) overlays the bottom, so the scroll area leaves
 * room for it.
 */
export function HomeScreen() {
  const router = useRouter();
  const role = useSession((s) => s.role);
  const selectedChildId = useSession((s) => s.selectedChildId);
  const selectChild = useSession((s) => s.selectChild);

  useEffect(() => {
    // Restores the role after an app restart (the auth token survives; the UI role must too).
    void useSession.getState().hydrate();
  }, []);

  const isParent = role === 'parent';
  const s = isParent ? findChild(selectedChildId) : mockStudent;
  const name = isParent ? mockParent.firstName : s.firstName;
  const classLabel = `Class ${s.className}-${s.section}`;
  const now = new Date();

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.schoolHeader} accessibilityRole="header">
          <School size={scaled(28)} color="#FFFFFF" />
          <Text style={styles.schoolName} numberOfLines={1}>
            {s.schoolName}
          </Text>
        </View>

        {isParent ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            accessibilityRole="tablist"
            accessibilityLabel="Choose child"
            contentContainerStyle={styles.switcher}
          >
            {mockParent.children.map((child) => {
              const active = child.id === s.id;
              return (
                <Pressable
                  key={child.id}
                  testID={`child-${child.id}`}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${child.fullName}, ${child.schoolName}`}
                  onPress={() => selectChild(child.id)}
                  style={[styles.childChip, active && styles.childChipActive]}
                >
                  <Text
                    style={[styles.childName, active && styles.childTextActive]}
                    numberOfLines={1}
                  >
                    {child.firstName}
                  </Text>
                  <Text
                    style={[styles.childSchool, active && styles.childTextActive]}
                    numberOfLines={1}
                  >
                    {child.schoolName}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        <View style={styles.greetingRow}>
          <Image
            source={require('../../../../assets/images/home/avatar.png')}
            accessibilityElementsHidden
            style={styles.avatar}
          />
          <View style={styles.flex}>
            <Text
              style={styles.greeting}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {greetingFor(now)}, {name}!
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {formatLongDate(now)} • {classLabel}
            </Text>
          </View>
          <Pressable
            testID="notifications"
            accessibilityRole="button"
            accessibilityLabel={
              s.unreadNotices > 0 ? `Notifications, ${s.unreadNotices} unread` : 'Notifications'
            }
            onPress={() => router.push('/notifications')}
            style={styles.bell}
          >
            <Bell size={scaled(28)} color={HOME.deep} />
            {s.unreadNotices > 0 ? <View style={styles.dot} /> : null}
          </Pressable>
        </View>

        <View style={[styles.hero, SOFT_SHADOW]}>
          <View style={styles.flex}>
            <Text style={styles.heroTitle}>Ready to Learn? ⭐</Text>
            <Text style={styles.heroSubtitle}>
              Assignments, and upcoming events with your personalized dashboard.
            </Text>
          </View>
          <Image
            source={require('../../../../assets/images/home/hero.png')}
            accessibilityElementsHidden
            resizeMode="cover"
            style={styles.heroArt}
          />
        </View>

        <View style={styles.grid}>
          {QUICK_ACTIONS.map((a) => (
            <Pressable
              key={a.key}
              testID={`quick-${a.key}`}
              accessibilityRole="button"
              accessibilityLabel={a.label}
              onPress={() => a.href && router.push(a.href)}
              style={styles.tile}
            >
              <View style={[styles.iconBox, SOFT_SHADOW]}>
                <Image source={a.image} resizeMode="contain" style={styles.iconImage} />
              </View>
              <Text style={styles.tileLabel} numberOfLines={1}>
                {a.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <FeatureCard
          testID="school-notices"
          title="School Notices"
          image={require('../../../../assets/images/home/notices.png')}
          onPress={() => router.push('/notices')}
          wide
        />
        <View style={styles.cardRow}>
          <FeatureCard
            testID="career-guidance"
            title="Career Guidance"
            image={require('../../../../assets/images/home/career.png')}
          />
          <FeatureCard testID="events" title="Events" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureCard({
  title,
  image,
  onPress,
  wide,
  testID,
}: {
  title: string;
  image?: ImageSourcePropType;
  onPress?: () => void;
  wide?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={[styles.card, wide ? styles.cardWide : styles.cardHalf, SOFT_SHADOW]}
    >
      {image ? (
        <Image source={image} resizeMode="contain" style={styles.cardImage} />
      ) : (
        <View style={styles.cardPlaceholder} />
      )}
      <View style={styles.cardBottom}>
        <Text style={styles.cardTitle}>{title}</Text>
        <View style={styles.arrow}>
          <ArrowRight size={scaled(22)} color={HOME.deep} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 130 },
  schoolHeader: {
    height: 56,
    borderRadius: 28,
    backgroundColor: HOME.deep,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  schoolName: { flexShrink: 1, color: '#FFFFFF', fontSize: 20, fontWeight: '600' },
  switcher: { gap: 8, paddingTop: 12 },
  childChip: {
    minHeight: 44,
    maxWidth: 220,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  childChipActive: { borderColor: HOME.deep, backgroundColor: HOME.deep },
  childName: { color: HOME.text, fontSize: 14, fontWeight: '600' },
  childSchool: { color: HOME.muted, fontSize: 11 },
  childTextActive: { color: '#FFFFFF' },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18 },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  greeting: { color: HOME.text, fontSize: 17, fontWeight: '700' },
  meta: { color: HOME.muted, fontSize: 11, marginTop: 2 },
  bell: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  dot: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: HOME.red,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  hero: {
    marginTop: 14,
    minHeight: 140,
    borderRadius: 24,
    backgroundColor: HOME.hero,
    paddingHorizontal: 22,
    paddingVertical: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroTitle: { color: HOME.text, fontSize: 17, fontWeight: '500' },
  heroSubtitle: { color: '#4B5563', fontSize: 12, lineHeight: 18, marginTop: 10 },
  heroArt: { width: 118, height: 98, borderRadius: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 22, rowGap: 18 },
  tile: { width: '25%', alignItems: 'center' },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: HOME.tileBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconImage: { width: 38, height: 38 },
  tileLabel: { color: HOME.text, fontSize: 11, marginTop: 8 },
  card: {
    backgroundColor: HOME.deep,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
  },
  cardWide: { marginTop: 26, minHeight: 92 },
  cardHalf: { flex: 1, minHeight: 130 },
  cardRow: { flexDirection: 'row', gap: 14, marginTop: 14 },
  cardImage: { width: 40, height: 40 },
  cardPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  cardBottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  cardTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '500', flexShrink: 1, paddingRight: 8 },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
