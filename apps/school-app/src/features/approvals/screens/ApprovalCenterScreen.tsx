import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePermission } from '@/core/permissions';
import { TAB_BAR_SPACE } from '@/features/dashboard/components/FloatingTabBar';
import { APPROVALS_MOCK, type ApprovalRequest, type ApprovalStatus } from '@/mock/approvals';
import { useSession } from '@/state/session';
import { ApprovalCard } from '../components/ApprovalCard';

type Filter = 'all' | ApprovalStatus;

/**
 * APPROVAL-CENTER: requests with a status filter. All requests are MOCK; Approve and Reject only
 * change this screen's state. The details and log pages are not designed yet.
 */
export function ApprovalCenterScreen() {
  const router = useRouter();
  const canDecide = usePermission('approvals.decide');
  const roleLabel = useSession((s) => s.activeMembership?.roleLabel);
  const [filter, setFilter] = useState<Filter>('all');
  const [requests, setRequests] = useState<readonly ApprovalRequest[]>(APPROVALS_MOCK);

  const matching = (key: Filter) =>
    requests.filter((r) => (key === 'all' ? !r.statusTabOnly : r.status === key));

  const filters: readonly { key: Filter; label: string }[] = [
    { key: 'all', label: `All (${matching('all').length})` },
    { key: 'pending', label: `Pending (${matching('pending').length})` },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];

  const visible = matching(filter);

  const decide = (key: string, status: 'approved' | 'rejected') =>
    setRequests((list) =>
      list.map((r) => (r.key === key ? { ...r, status, decidedBy: roleLabel ?? 'Principal' } : r)),
    );

  const open = (module: string) => router.push({ pathname: '/coming-soon', params: { module } });

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable
          testID="approvals-back"
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={10}
          onPress={() => router.navigate('/(tabs)')}
          style={styles.back}
        >
          <ArrowLeft size={24} color="#1E293B" strokeWidth={2.2} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>
          Approval Center
        </Text>
      </View>

      <View style={styles.filters}>
        {filters.map((f) => {
          const selected = filter === f.key;
          return (
            <Pressable
              key={f.key}
              testID={`filter-${f.key}`}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => setFilter(f.key)}
              style={[styles.filter, selected && styles.filterSelected]}
            >
              <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, filter === 'approved' && styles.listApproved]}
        showsVerticalScrollIndicator={false}
      >
        {visible.map((request) => (
          <ApprovalCard
            key={request.key}
            request={request}
            canDecide={canDecide}
            onApprove={() => decide(request.key, 'approved')}
            onReject={() => decide(request.key, 'rejected')}
            onOpen={() => open('approvals')}
            onViewLog={() => open('approvals')}
          />
        ))}
        {visible.length === 0 ? <Text style={styles.empty}>No requests here.</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { height: 48, marginTop: -2, justifyContent: 'center' },
  back: { position: 'absolute', left: 18, zIndex: 1 },
  title: {
    textAlign: 'center',
    color: '#1E293B',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    paddingLeft: 14,
  },
  filters: {
    marginTop: 8,
    paddingLeft: 21,
    paddingRight: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  filter: { height: 32, borderRadius: 11, paddingHorizontal: 12, justifyContent: 'center' },
  filterSelected: { backgroundColor: '#1D4ED8', paddingHorizontal: 14 },
  filterText: { color: '#555555', fontSize: 13, lineHeight: 17, fontWeight: '600' },
  filterTextSelected: { color: '#FFFFFF' },
  list: {
    paddingTop: 17,
    paddingLeft: 19,
    paddingRight: 22,
    paddingBottom: TAB_BAR_SPACE,
    gap: 15,
  },
  // The Approved tab is drawn with more space between cards.
  listApproved: { gap: 20 },
  empty: { marginTop: 40, textAlign: 'center', color: '#555555', fontSize: 14 },
});
