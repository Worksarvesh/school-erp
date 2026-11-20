import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Bus,
  Check,
  FlaskConical,
  GraduationCap,
  LibraryBig,
  ReceiptText,
  type LucideIcon,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@school-erp/ui';
import { mockFeeItems, mockFeePayments, type FeeIcon, type MockFeeItem } from '@/mock/fees';
import { fonts } from '@/theme/fonts';
import { homeImages } from '@/theme/images';

const PURPLE = '#5016A8';
const RED = '#D92D20';
const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const HISTORY_PREVIEW = 3;

const FEE_ICONS: Record<FeeIcon, LucideIcon> = {
  transport: Bus,
  library: LibraryBig,
  tuition: GraduationCap,
  lab: FlaskConical,
};

/** "₹4,500.00" with Indian digit grouping, from integer paise. */
export function formatRupees(paise: number): string {
  const rupees = Math.floor(Math.abs(paise) / 100);
  const decimals = String(Math.abs(paise) % 100).padStart(2, '0');
  const digits = String(rupees);
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${paise < 0 ? '-' : ''}₹${rest ? `${rest},${last3}` : last3}.${decimals}`;
}

/** "Oct 15". */
function shortDate(d: Date): string {
  return `${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** "Sep 01, 2024". */
function longDate(d: Date): string {
  return `${SHORT_MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`;
}

/** Sum of pending fees and the earliest pending due date. */
export function pendingBalance(items: readonly MockFeeItem[]): { paise: number; dueOn?: Date } {
  const pending = items.filter((i) => i.status === 'pending');
  const paise = pending.reduce((s, i) => s + i.amountPaise, 0);
  const dueOn = pending
    .map((i) => i.dueOn)
    .sort((a, b) => a.getTime() - b.getTime())
    .at(0);
  return { paise, dueOn };
}

/**
 * Fees tab, built to the approved design: pending balance card, fee breakdown with Pending /
 * Paid status, and recent payment history. UI only: fees are out of V1.2 scope on the backend,
 * so everything here is MOCK data and there is no payment action.
 */
export function FeesScreen() {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const items = useMemo(() => mockFeeItems(today), [today]);
  const payments = useMemo(
    () => mockFeePayments(today).sort((a, b) => b.paidOn.getTime() - a.paidOn.getTime()),
    [today],
  );
  const [showAll, setShowAll] = useState(false);
  const balance = pendingBalance(items);
  const history = showAll ? payments : payments.slice(0, HISTORY_PREVIEW);

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable
          testID="fees-back"
          accessibilityRole="button"
          accessibilityLabel="Go back to Home"
          onPress={() => router.navigate('/')}
          style={styles.headerButton}
        >
          <ArrowLeft size={22} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle} accessibilityRole="header">
          Fees
        </Text>
        <Pressable
          testID="fees-profile"
          accessibilityRole="button"
          accessibilityLabel="Profile"
          onPress={() => router.push('/profile')}
          style={styles.headerButton}
        >
          <View style={styles.photo}>
            <Image source={homeImages.avatar} style={styles.photoImage} resizeMode="contain" />
          </View>
        </Pressable>
      </View>

      <Text style={styles.pageTitle}>Fees & Payments</Text>

      <View style={styles.balanceCard} testID="fees-balance">
        <Text style={styles.balanceLabel}>TOTAL PENDING BALANCE</Text>
        {balance.paise > 0 ? (
          <View style={styles.balanceRow}>
            <Text style={styles.balanceAmount}>{formatRupees(balance.paise)}</Text>
            {balance.dueOn ? (
              <Text style={styles.balanceDue}>Due {shortDate(balance.dueOn)}</Text>
            ) : null}
          </View>
        ) : (
          <Text style={[styles.balanceAmount, styles.balanceClear]}>All paid</Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>Fee Breakdown</Text>
      <View style={styles.breakdown}>
        {items.map((item) => {
          const Icon = FEE_ICONS[item.icon];
          const paid = item.status === 'paid';
          return (
            <View
              key={item.id}
              style={styles.feeCard}
              testID={`fee-${item.id}`}
              accessible
              accessibilityLabel={`${item.title}, ${formatRupees(item.amountPaise)}, ${
                paid ? 'paid' : 'pending'
              }`}
            >
              <View style={styles.feeIcon}>
                <Icon size={18} color="#4B5563" />
              </View>
              <View style={styles.feeText}>
                <Text style={styles.feeTitle}>{item.title}</Text>
                <Text style={styles.feeSub}>{item.subtitle}</Text>
              </View>
              <View style={styles.feeRight}>
                <Text style={[styles.feeAmount, paid && styles.feeAmountPaid]}>
                  {formatRupees(item.amountPaise)}
                </Text>
                {paid ? (
                  <View style={[styles.badge, styles.badgePaid]}>
                    <Check size={9} color="#2563EB" strokeWidth={3} />
                    <Text style={[styles.badgeText, styles.badgeTextPaid]}>PAID</Text>
                  </View>
                ) : (
                  <View style={[styles.badge, styles.badgePending]}>
                    <Text style={[styles.badgeText, styles.badgeTextPending]}>PENDING</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.historyHeader}>
        <Text style={styles.sectionTitleInline}>Recent History</Text>
        {payments.length > HISTORY_PREVIEW ? (
          <Pressable
            testID="fees-view-all"
            accessibilityRole="button"
            accessibilityLabel={showAll ? 'Show less history' : 'View all history'}
            onPress={() => setShowAll((s) => !s)}
            hitSlop={10}
          >
            <Text style={styles.viewAll}>{showAll ? 'View Less' : 'View All'}</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.historyCard}>
        {history.map((p, i) => (
          <View
            key={p.id}
            style={[styles.historyRow, i < history.length - 1 && styles.historyDivider]}
            testID={`fees-history-${p.id}`}
          >
            <View style={styles.historyIcon}>
              <ReceiptText size={16} color="#4B5563" />
            </View>
            <View style={styles.historyText}>
              <Text style={styles.historyTitle}>{p.title}</Text>
              <Text style={styles.historySub}>
                {longDate(p.paidOn)} • {p.method}
              </Text>
            </View>
            <Text style={styles.historyAmount}>{formatRupees(p.amountPaise)}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 28 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginHorizontal: -8,
  },
  headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: PURPLE, fontSize: 20, fontFamily: fonts.semibold },
  photo: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: '#E3EEF9',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoImage: { width: 28, height: 28 },
  pageTitle: { marginTop: 8, color: '#111827', fontSize: 24, fontFamily: fonts.bold },
  balanceCard: {
    marginTop: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F1F4',
    borderLeftWidth: 5,
    borderLeftColor: RED,
    shadowColor: '#1F2937',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  balanceLabel: { color: '#374151', fontSize: 10, fontFamily: fonts.semibold, letterSpacing: 0.4 },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 4 },
  balanceAmount: { color: RED, fontSize: 30, fontFamily: fonts.bold },
  balanceClear: { color: '#16A34A', marginTop: 4 },
  balanceDue: { color: '#6B7280', fontSize: 12, fontFamily: fonts.regular },
  sectionTitle: { marginTop: 22, color: '#111827', fontSize: 18, fontFamily: fonts.bold },
  sectionTitleInline: { color: '#111827', fontSize: 18, fontFamily: fonts.bold },
  breakdown: { marginTop: 12, gap: 12 },
  feeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F1F4',
    shadowColor: '#1F2937',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  feeIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feeText: { flex: 1 },
  feeTitle: { color: '#111827', fontSize: 13, fontFamily: fonts.semibold },
  feeSub: { color: '#6B7280', fontSize: 11, fontFamily: fonts.regular, marginTop: 2 },
  feeRight: { alignItems: 'flex-end', gap: 4 },
  feeAmount: { color: '#111827', fontSize: 13, fontFamily: fonts.semibold },
  feeAmountPaid: { color: '#9CA3AF', textDecorationLine: 'line-through' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgePending: { backgroundColor: '#FEE4E2' },
  badgePaid: { backgroundColor: '#E0EAFF' },
  badgeText: { fontSize: 9, fontFamily: fonts.bold, letterSpacing: 0.3 },
  badgeTextPending: { color: RED },
  badgeTextPaid: { color: '#2563EB' },
  historyHeader: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewAll: { color: PURPLE, fontSize: 13, fontFamily: fonts.semibold },
  historyCard: {
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F1F4',
    paddingHorizontal: 14,
  },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  historyDivider: { borderBottomWidth: 1, borderBottomColor: '#F1F1F4' },
  historyIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyText: { flex: 1 },
  historyTitle: { color: '#111827', fontSize: 13, fontFamily: fonts.semibold },
  historySub: { color: '#6B7280', fontSize: 11, fontFamily: fonts.regular, marginTop: 2 },
  historyAmount: { color: '#111827', fontSize: 13, fontFamily: fonts.semibold },
});
