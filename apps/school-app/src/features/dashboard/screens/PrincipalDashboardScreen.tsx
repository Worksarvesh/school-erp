import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowRight,
  ChevronRight,
  Monitor,
  School,
  TrendingUp,
  UserPen,
  UserRound,
  UsersRound,
  type LucideIcon,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DASHBOARD_MOCK as DATA } from '@/mock/dashboard';
import { usePermission } from '@/core/permissions';
import { useSession } from '@/state/session';
import { DonutChart } from '../components/DonutChart';
import { TAB_BAR_SPACE } from '../components/FloatingTabBar';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- Metro bundles static images only through require().
const AVATAR = require('../../../../assets/onboarding/principal-avatar.png');

const BLUE = '#1D4ED8';
const LINK = '#2563EB';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function greetingFor(hour: number): string {
  if (hour < 12) return 'Good Morning';
  return hour < 17 ? 'Good Afternoon' : 'Good Evening';
}

interface Stat {
  id: string;
  value: number;
  label: string;
  Icon: LucideIcon;
  color: string;
  tint: string;
}

const STATS: readonly Stat[] = [
  {
    id: 'students',
    value: DATA.students,
    label: 'Students',
    Icon: UsersRound,
    color: '#2563EB',
    tint: '#EFF6FF',
  },
  {
    id: 'staff',
    value: DATA.teachingStaff,
    label: 'Teaching Staff',
    Icon: UserPen,
    color: '#9333EA',
    tint: '#FAF5FF',
  },
  {
    id: 'non-teaching',
    value: DATA.nonTeaching,
    label: 'Non-Teaching',
    Icon: UserRound,
    color: '#059669',
    tint: '#ECFDF5',
  },
  {
    id: 'academic-setup',
    value: DATA.classesAndSections,
    label: 'Classes & Sections',
    Icon: Monitor,
    color: '#F59E0B',
    tint: '#FEFCE8',
  },
];

function Badge({ count }: { count: number }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count}</Text>
    </View>
  );
}

/**
 * SCHOOL-DASHBOARD-PRINCIPAL: school header, counts, notices, approvals, today's attendance and
 * academic performance. All numbers are MOCK. Cards open the coming-soon page for now.
 */
export function PrincipalDashboardScreen() {
  const router = useRouter();
  const canPublishNotices = usePermission('notices.publish');
  const canManageExams = usePermission('exams.manage');
  const fullName = useSession((s) => s.fullName);
  const active = useSession((s) => s.activeMembership);
  const now = new Date();
  const today = `${WEEKDAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`;

  const open = (module: string) => router.push({ pathname: '/coming-soon', params: { module } });

  const viewAll = (id: string) => {
    if (id === 'approvals') router.navigate('/(tabs)/approvals');
    // The only notice screen designed so far writes a notice, so it needs that permission.
    else if (id === 'notices' && canPublishNotices) router.push('/school-notice');
    else open(id);
  };

  const linkRow = (id: string, title: string, count: number) => (
    <View style={[styles.box, styles.linkRow]}>
      <Text style={styles.rowTitle}>{title}</Text>
      <Badge count={count} />
      <Pressable
        testID={`view-all-${id}`}
        accessibilityRole="button"
        accessibilityLabel={`View all: ${title}`}
        hitSlop={10}
        onPress={() => viewAll(id)}
        style={styles.viewAll}
      >
        <Text style={styles.viewAllText}>View All</Text>
        <ArrowRight size={18} color={LINK} />
      </Pressable>
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        bounces={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}
        showsVerticalScrollIndicator={false}
      >
        <SafeAreaView edges={['top']} style={styles.header}>
          <View style={styles.schoolRow}>
            <School size={44} color="#FFFFFF" strokeWidth={2} />
            <Text numberOfLines={2} style={styles.schoolName}>
              {active?.schoolName ?? 'School Name'}
            </Text>
          </View>
          <View style={styles.personRow}>
            <View style={styles.avatarRing}>
              <Image source={AVATAR} style={styles.avatar} />
            </View>
            <View style={styles.flex}>
              <Text accessibilityRole="header" style={styles.greeting}>
                {greetingFor(now.getHours())}, {fullName || 'Principal'}
              </Text>
              <Text style={styles.date}>
                {today} •{active?.roleLabel ?? 'Principal'}
              </Text>
            </View>
          </View>
        </SafeAreaView>

        <View style={styles.body}>
          <View style={styles.statGrid}>
            {STATS.map(({ id, value, label, Icon, color, tint }) => (
              <Pressable
                key={id}
                testID={`stat-${id}`}
                accessibilityRole="button"
                accessibilityLabel={`${value} ${label}`}
                onPress={() => open(id)}
                style={[styles.box, styles.stat]}
              >
                <View style={[styles.statIcon, { backgroundColor: tint }]}>
                  <Icon size={21} color={color} strokeWidth={2.2} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.statValue}>{value.toLocaleString('en-IN')}</Text>
                  <Text style={styles.statLabel}>{label}</Text>
                </View>
                <ChevronRight size={18} color="#000000" />
              </Pressable>
            ))}
          </View>

          {linkRow('notices', 'School Notice', DATA.notices)}
          {linkRow('approvals', 'Pending Approvals', DATA.pendingApprovals)}

          <View style={styles.donutRow}>
            <View style={[styles.box, styles.donutBox]}>
              <DonutChart
                percent={DATA.studentAttendance}
                label="Students"
                color="#10B981"
                track="#DCFCE7"
              />
            </View>
            <View style={[styles.box, styles.donutBox]}>
              <DonutChart
                percent={DATA.facultyAttendance}
                label="Faculty"
                color="#2563EB"
                track="#DBEAFE"
              />
            </View>
          </View>

          <Pressable
            testID="academic-performance"
            accessibilityRole="button"
            accessibilityLabel={`Academic Performance, ${DATA.academicPerformance} percent`}
            onPress={() =>
              canManageExams ? router.navigate('/(tabs)/academics') : open('academics')
            }
            style={[styles.box, styles.performance]}
          >
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>Academic Performance</Text>
              <Text style={styles.performanceSub}>(Class 10 Avg.)</Text>
            </View>
            <Text style={styles.performanceValue}>{DATA.academicPerformance}%</Text>
            <View style={styles.trend}>
              <TrendingUp size={18} color="#059669" strokeWidth={2.4} />
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  header: {
    backgroundColor: BLUE,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 17,
    paddingBottom: 48,
  },
  schoolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginTop: 4,
    paddingLeft: 72,
  },
  schoolName: { flex: 1, color: '#FFFFFF', fontSize: 20, lineHeight: 26, fontWeight: '600' },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20 },
  avatarRing: {
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { width: 28, height: 28, borderRadius: 14 },
  greeting: { color: '#FFFFFF', fontSize: 17, lineHeight: 22, fontWeight: '600' },
  date: { color: '#FFFFFF', fontSize: 16, lineHeight: 21 },
  body: { paddingHorizontal: 20, paddingTop: 18, gap: 17 },
  box: {
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#A8A8A8',
    backgroundColor: '#FFFFFF',
  },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  stat: {
    width: '48.5%',
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 8,
    paddingRight: 2,
    paddingVertical: 8,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { color: '#333333', fontSize: 20, lineHeight: 25, fontWeight: '700' },
  statLabel: { color: '#555555', fontSize: 12, lineHeight: 16, letterSpacing: -0.2 },
  linkRow: { height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  rowTitle: { color: '#333333', fontSize: 17, lineHeight: 22, fontWeight: '700' },
  badge: {
    marginLeft: 8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: '#E11D48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 12, lineHeight: 16, fontWeight: '700' },
  viewAll: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewAllText: { color: LINK, fontSize: 15, fontWeight: '600' },
  donutRow: { flexDirection: 'row', gap: 10 },
  donutBox: { flex: 1, height: 149, alignItems: 'center', justifyContent: 'center' },
  performance: {
    minHeight: 73,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  performanceSub: { color: '#555555', fontSize: 14, lineHeight: 19 },
  performanceValue: { color: '#333333', fontSize: 24, fontWeight: '700' },
  trend: {
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
