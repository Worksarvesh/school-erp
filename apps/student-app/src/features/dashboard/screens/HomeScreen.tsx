import { useRouter } from 'expo-router';
import { Bell, BookOpen, Megaphone, School } from 'lucide-react-native';
import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar, Screen, useTheme, type ThemeContextValue } from '@school-erp/ui';
import { BigActionCard, QuickActionTile } from '@/components';
import { findChild, mockParent, mockStudent } from '@/mock/student';
import { useSession } from '@/state/session';
import { mockNotices } from '../../../core/mocks/fixtures';
import { formatLongDate, greetingFor, QUICK_ACTIONS } from '../quickActions';

/** The two latest mock notices, title only (one line each on the card). */
const LATEST_NOTICE_TITLES = mockNotices.slice(0, 2).map((n) => n.title);

/**
 * Student App Home (V1.2): school header, greeting, bell, hero card, exactly 7 tiles and one
 * "School Notices" card. Parent mode adds a child switcher (2 mock children at different schools);
 * the header, greeting line and badges follow the selected child. MOCK data only.
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
        <School size={22} color={colors.primaryForeground} />
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
                <Text style={[styles.childName, active && styles.childNameActive]} numberOfLines={1}>
                  {child.firstName}
                </Text>
                <Text style={[styles.childSchool, active && styles.childNameActive]} numberOfLines={1}>
                  {child.schoolName}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <View style={styles.greetingRow}>
        <Avatar name={name} size={44} />
        <View style={styles.greetingText}>
          <Text style={styles.greeting} numberOfLines={1}>
            {greetingFor(now)}, {name}
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
          <Bell size={24} color={colors.primary} />
          {s.unreadNotices > 0 ? <View style={styles.dot} /> : null}
        </Pressable>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroText}>
          <Text style={styles.heroTitle}>Ready to Learn? ⭐</Text>
          <Text style={styles.heroSubtitle}>{s.heroSubtitle}</Text>
        </View>
        <View style={styles.heroArt} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <BookOpen size={36} color={colors.primary} />
        </View>
      </View>

      <View style={styles.grid}>
        {QUICK_ACTIONS.map((a) => (
          <QuickActionTile
            key={a.key}
            testID={`quick-${a.key}`}
            label={a.label}
            icon={a.icon}
            onPress={() => router.push(a.href)}
          />
        ))}
      </View>

      <BigActionCard
        testID="school-notices"
        title="School Notices"
        icon={Megaphone}
        badge={s.unreadNotices}
        previews={LATEST_NOTICE_TITLES}
        onPress={() => router.push('/notices')}
      />
    </Screen>
  );
}

function makeStyles({ colors, spacing, radii, typography }: ThemeContextValue) {
  return StyleSheet.create({
    content: { padding: spacing.base },
    schoolHeader: {
      minHeight: 52,
      borderRadius: radii.full,
      backgroundColor: colors.primaryDark,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    schoolName: {
      flexShrink: 1,
      color: colors.primaryForeground,
      fontSize: typography.fontSizes.base,
      fontWeight: typography.fontWeights.semibold,
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
    childName: {
      color: colors.text,
      fontSize: typography.fontSizes.sm,
      fontWeight: typography.fontWeights.semibold,
    },
    childSchool: { color: colors.textSecondary, fontSize: typography.fontSizes.xs },
    childNameActive: { color: colors.primaryForeground },
    greetingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
    greetingText: { flex: 1, gap: spacing.xxs },
    greeting: {
      color: colors.text,
      fontSize: typography.fontSizes.base,
      fontWeight: typography.fontWeights.semibold,
    },
    meta: { color: colors.textSecondary, fontSize: typography.fontSizes.xs },
    bell: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    dot: {
      position: 'absolute',
      top: spacing.sm,
      right: spacing.sm,
      width: 8,
      height: 8,
      borderRadius: radii.full,
      backgroundColor: colors.error,
    },
    hero: {
      marginTop: spacing.lg,
      borderRadius: radii.xl,
      backgroundColor: colors.surfaceSubtle,
      padding: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    heroText: { flex: 1, gap: spacing.sm },
    heroTitle: {
      color: colors.text,
      fontSize: typography.fontSizes.base,
      fontWeight: typography.fontWeights.semibold,
    },
    heroSubtitle: { color: colors.textSecondary, fontSize: typography.fontSizes.xs },
    heroArt: {
      width: 72,
      height: 72,
      borderRadius: radii.xl,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: spacing.lg,
      marginBottom: spacing.lg,
      rowGap: spacing.sm,
      justifyContent: 'flex-start',
    },
  });
}
