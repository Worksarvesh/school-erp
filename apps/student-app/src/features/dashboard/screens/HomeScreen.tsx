import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BigActionCard, QuickActionTile, ScreenContainer } from '@/components';
import { mockParent, mockStudent } from '@/mock/student';
import { useSession } from '@/state/session';
import { colors, iconSize, radius, shadows, sizes, spacing, touch, typography } from '@/theme';
import { formatLongDate, greetingFor, QUICK_ACTIONS } from '../quickActions';

/**
 * Student App Home (approved V1 scope). Reads mock data only. In parent mode the same layout shows
 * the linked child, with the parent's name in the greeting.
 */
export function HomeScreen() {
  const router = useRouter();
  const role = useSession((s) => s.role);
  const s = mockStudent;
  const isParent = role === 'parent';
  const name = isParent ? mockParent.firstName : s.firstName;
  const classLabel = `Class ${s.className}-${s.section}`;
  const comingSoon = (title: string) =>
    router.push({ pathname: '/coming-soon', params: { title } });
  const initials = name.slice(0, 1).toUpperCase();

  return (
    <ScreenContainer edges={['top']}>
      <View style={styles.pill} accessibilityRole="header">
        <Feather name="home" size={iconSize.lg} color={colors.textOnPrimary} />
        <Text style={styles.pillText} numberOfLines={1}>
          {s.schoolName}
        </Text>
      </View>

      <View style={styles.greetingRow}>
        <View style={styles.avatar} accessibilityElementsHidden>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.greetingText}>
          <Text style={styles.greeting} numberOfLines={1}>
            {greetingFor(new Date())}, {name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {formatLongDate(new Date())}
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
          onPress={() => comingSoon('Notifications')}
          style={styles.bell}
        >
          <Feather name="bell" size={iconSize.lg} color={colors.primary} />
          {s.unreadNotices > 0 ? <View style={styles.dot} /> : null}
        </Pressable>
      </View>

      <View style={[styles.hero, shadows.card]}>
        <View style={styles.heroText}>
          <Text style={styles.heroTitle}>Ready to Learn? ⭐</Text>
          <Text style={styles.heroSubtitle}>{s.heroSubtitle}</Text>
        </View>
        <View style={styles.heroArt} accessibilityElementsHidden>
          <Feather name="book-open" size={iconSize.xl} color={colors.primary} />
        </View>
      </View>

      <View style={styles.grid}>
        {QUICK_ACTIONS.map((a) => (
          <QuickActionTile
            key={a.key}
            testID={`quick-${a.key}`}
            label={a.label}
            icon={a.icon}
            onPress={() => comingSoon(a.label)}
          />
        ))}
      </View>

      <BigActionCard
        testID="school-notices"
        title="School Notices"
        icon="bell"
        badge={s.unreadNotices}
        onPress={() => comingSoon('School Notices')}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: touch.buttonHeight,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  pillText: { ...typography.heading, color: colors.textOnPrimary, flexShrink: 1 },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  avatar: {
    width: sizes.avatar,
    height: sizes.avatar,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.heading, color: colors.primary },
  greetingText: { flex: 1, gap: spacing.xxs },
  greeting: { ...typography.heading, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary },
  bell: {
    width: touch.minTarget,
    height: touch.minTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: sizes.notificationDot,
    height: sizes.notificationDot,
    borderRadius: radius.pill,
    backgroundColor: colors.notificationDot,
  },
  hero: {
    marginTop: spacing.xl,
    borderRadius: radius.card,
    backgroundColor: colors.primarySoft,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroText: { flex: 1, gap: spacing.sm },
  heroTitle: { ...typography.heading, color: colors.textPrimary },
  heroSubtitle: { ...typography.caption, color: colors.textSecondary },
  heroArt: {
    width: sizes.heroIllustration,
    height: sizes.heroIllustration,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    rowGap: spacing.sm,
  },
});
