import { useRouter } from 'expo-router';
import { Bell, School } from 'lucide-react-native';
import { useEffect, useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen, useTheme, type ThemeContextValue } from '@school-erp/ui';
import { BigActionCard, QuickActionTile } from '@/components';
import { findChild, mockParent, mockStudent } from '@/mock/student';
import { useSession } from '@/state/session';
import { fonts } from '@/theme/fonts';
import { homeImages } from '@/theme/images';
import { comingSoon, formatLongDate, greetingFor, QUICK_ACTIONS } from '../quickActions';

const IMG = homeImages;

/**
 * Student App Home, built to the approved Home design: purple school header, greeting with bell,
 * "Ready to Learn?" hero, 8 quick-action tiles, School Notices card, and Career Guidance / Events
 * cards. Parent mode adds a child switcher (2 mock children at different schools). MOCK data only.
 */
export function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors } = theme;
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
    <Screen scrollable contentContainerStyle={styles.content}>
      <View style={styles.schoolHeader} accessibilityRole="header">
        <School size={30} color={colors.primaryForeground} strokeWidth={2.2} />
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
                  style={[styles.childName, active && styles.childNameActive]}
                  numberOfLines={1}
                >
                  {child.firstName}
                </Text>
                <Text
                  style={[styles.childSchool, active && styles.childNameActive]}
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
        <View style={styles.avatar}>
          <Image source={IMG.avatar} style={styles.avatarImage} resizeMode="contain" />
        </View>
        <View style={styles.greetingText}>
          <Text style={styles.greeting} numberOfLines={1}>
            {greetingFor(now)}, {name}!
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {formatLongDate(now)}
            {isParent ? '' : ` • ${classLabel}`}
          </Text>
          {isParent ? (
            <Text style={styles.meta} numberOfLines={1}>
              Viewing {s.fullName} • {classLabel}
            </Text>
          ) : null}
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
          <Bell size={24} color={colors.primary} strokeWidth={2.2} />
          {s.unreadNotices > 0 ? <View style={styles.dot} /> : null}
        </Pressable>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroText}>
          <View style={styles.heroTitleRow}>
            <Text style={styles.heroTitle}>Ready to Learn?</Text>
            <Image source={IMG.star} style={styles.star} resizeMode="contain" />
          </View>
          <Text style={styles.heroSubtitle}>{s.heroSubtitle}</Text>
        </View>
        <View
          style={styles.heroArt}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <View style={styles.heroPanel} />
          <Image source={IMG.books} style={styles.books} resizeMode="contain" />
          <Image source={IMG.gradcap} style={styles.gradcap} resizeMode="contain" />
        </View>
      </View>

      <View style={styles.grid}>
        {QUICK_ACTIONS.map((a) => (
          <QuickActionTile
            key={a.key}
            testID={`quick-${a.key}`}
            label={a.label}
            image={a.image}
            onPress={() => router.push(a.href)}
          />
        ))}
      </View>

      <BigActionCard
        testID="school-notices"
        title="School Notices"
        image={IMG.notices}
        badge={s.unreadNotices}
        onPress={() => router.push('/notices')}
      />
      <View style={styles.cardRow}>
        <BigActionCard
          testID="career-guidance"
          title={'Career\nGuidance'}
          image={IMG.career}
          style={styles.halfCard}
          onPress={() => router.push(comingSoon('Career Guidance'))}
        />
        <BigActionCard
          testID="events"
          title="Events"
          image={IMG.events}
          style={styles.halfCard}
          onPress={() => router.push(comingSoon('Events'))}
        />
      </View>
    </Screen>
  );
}

function makeStyles({ colors, spacing, radii, isDark }: ThemeContextValue) {
  return StyleSheet.create({
    content: { padding: spacing.base, paddingBottom: spacing.xl },
    schoolHeader: {
      minHeight: 56,
      borderRadius: radii.full,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    schoolName: {
      flexShrink: 1,
      color: colors.primaryForeground,
      fontSize: 22,
      fontFamily: fonts.semibold,
    },
    switcher: { gap: spacing.sm, paddingTop: spacing.md },
    childChip: {
      minHeight: 44,
      maxWidth: 220,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      justifyContent: 'center',
    },
    childChipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
    childName: { color: colors.text, fontSize: 14, fontFamily: fonts.semibold },
    childSchool: { color: colors.textSecondary, fontSize: 12, fontFamily: fonts.regular },
    childNameActive: { color: colors.primaryForeground },
    greetingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginTop: spacing.lg,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: radii.full,
      backgroundColor: isDark ? colors.surfaceSubtle : '#E3EEF9',
      borderWidth: 2,
      borderColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarImage: { width: 36, height: 36 },
    greetingText: { flex: 1, gap: 2 },
    greeting: { color: colors.text, fontSize: 20, fontFamily: fonts.bold },
    meta: { color: colors.textSecondary, fontSize: 12, fontFamily: fonts.regular },
    bell: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    dot: {
      position: 'absolute',
      top: 9,
      right: 11,
      width: 8,
      height: 8,
      borderRadius: radii.full,
      backgroundColor: colors.error,
    },
    hero: {
      marginTop: spacing.lg,
      minHeight: 148,
      borderRadius: radii.xl,
      backgroundColor: isDark ? colors.surfaceSubtle : '#F1ECFB',
      borderWidth: 1,
      borderColor: isDark ? colors.border : '#FFFFFF',
      paddingLeft: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      overflow: 'hidden',
      shadowColor: '#5016A8',
      shadowOpacity: 0.12,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    heroText: { flex: 1, gap: spacing.sm, paddingVertical: spacing.lg },
    heroTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    heroTitle: { color: colors.text, fontSize: 18, fontFamily: fonts.medium },
    star: { width: 22, height: 22 },
    heroSubtitle: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 18,
      fontFamily: fonts.regular,
    },
    heroArt: { width: 112, alignSelf: 'stretch', justifyContent: 'flex-end' },
    heroPanel: {
      position: 'absolute',
      right: -24,
      bottom: -10,
      width: 120,
      height: 96,
      borderRadius: radii.md,
      backgroundColor: isDark ? colors.surface : '#E6DEF7',
      transform: [{ rotate: '-8deg' }],
    },
    books: { position: 'absolute', right: 8, bottom: 10, width: 84, height: 84 },
    gradcap: { position: 'absolute', right: 6, bottom: 66, width: 46, height: 46 },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: spacing.lg,
      marginBottom: spacing.lg,
      rowGap: spacing.md,
    },
    cardRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
    halfCard: { flex: 1 },
  });
}
