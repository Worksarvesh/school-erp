import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  ArrowRightLeft,
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  IndianRupee,
  UsersRound,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import type { ApprovalKind, ApprovalRequest, ApprovalStatus } from '@/mock/approvals';

const KINDS: Record<ApprovalKind, { Icon: LucideIcon; color: string; bg: string; border: string }> =
  {
    swap: { Icon: ArrowRightLeft, color: '#0D9488', bg: '#F0FDFA', border: '#D5F7EF' },
    teacher: { Icon: UsersRound, color: '#4F46E5', bg: '#EEF2FF', border: '#E0E7FF' },
    timetable: { Icon: CalendarDays, color: '#2563EB', bg: '#EFF6FF', border: '#DBEAFE' },
    fees: { Icon: IndianRupee, color: '#D97706', bg: '#FFFBEB', border: '#FEF3C7' },
  };

const STATUSES: Record<
  ApprovalStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  pending: { label: 'Pending', color: '#EA580C', bg: '#FFF7ED', border: '#FFEDD5' },
  approved: { label: 'Approved', color: '#059669', bg: '#ECFDF5', border: '#D1FAE5' },
  rejected: { label: 'Rejected', color: '#E11D48', bg: '#FFF1F2', border: '#FFE4E6' },
};

interface Props {
  request: ApprovalRequest;
  /** False hides Approve and Reject (the member may only read). */
  canDecide: boolean;
  onApprove: () => void;
  onReject: () => void;
  onOpen: () => void;
  onViewLog: () => void;
}

export function ApprovalCard({
  request,
  canDecide,
  onApprove,
  onReject,
  onOpen,
  onViewLog,
}: Props) {
  const kind = KINDS[request.kind];
  const status = STATUSES[request.status];
  const pending = request.status === 'pending';

  const line = (label: string, value: string, strong = false) => (
    <Text style={styles.line}>
      {label}: <Text style={[styles.value, strong && styles.strong]}>{value}</Text>
    </Text>
  );

  return (
    <View testID={`approval-${request.key}`} style={styles.card}>
      <Pressable
        testID={`approval-open-${request.key}`}
        accessibilityRole="button"
        accessibilityLabel={`${request.id}, ${request.title}, ${status.label}`}
        onPress={onOpen}
        style={styles.top}
      >
        <View style={[styles.icon, { backgroundColor: kind.bg, borderColor: kind.border }]}>
          <kind.Icon
            size={request.kind === 'teacher' ? 24 : 22}
            color={kind.color}
            fill={request.kind === 'teacher' ? kind.color : 'none'}
            strokeWidth={2.4}
          />
        </View>
        <View style={styles.info}>
          <Text style={styles.id}>{request.id}</Text>
          <Text style={styles.title}>{request.title}</Text>
          <View style={styles.lines}>
            {line('Requested by', request.requestedBy, pending && request.kind === 'swap')}
            {line('Class', request.classLabel)}
            {line('Date', request.date)}
          </View>
        </View>
        <View style={[styles.pill, { backgroundColor: status.bg, borderColor: status.border }]}>
          <Text style={[styles.pillText, { color: status.color }]}>{status.label}</Text>
        </View>
        {/* Drawn without an arrow in the design. */}
        {request.kind === 'teacher' ? null : (
          <View style={styles.chevron}>
            <ChevronRight size={22} color="#94A3B8" strokeWidth={2} />
          </View>
        )}
      </Pressable>

      {pending && canDecide ? (
        <View style={[styles.divider, styles.actions]}>
          <Pressable
            testID={`reject-${request.key}`}
            accessibilityRole="button"
            accessibilityLabel={`Reject ${request.id}`}
            onPress={onReject}
            style={[styles.button, styles.reject]}
          >
            <X size={16} color="#E11D48" strokeWidth={2.6} />
            <Text style={[styles.buttonText, styles.rejectText]}>Reject</Text>
          </Pressable>
          <Pressable
            testID={`approve-${request.key}`}
            accessibilityRole="button"
            accessibilityLabel={`Approve ${request.id}`}
            onPress={onApprove}
            style={[styles.button, styles.approve]}
          >
            <Check size={16} color="#FFFFFF" strokeWidth={2.6} />
            <Text style={[styles.buttonText, styles.approveText]}>Approve</Text>
          </Pressable>
        </View>
      ) : null}

      {request.status === 'approved' ? (
        <View style={[styles.divider, styles.footer]}>
          <CircleCheck size={14} color="#047857" strokeWidth={2.2} />
          <Text style={styles.decidedBy}>Approved by {request.decidedBy}</Text>
          <Pressable
            testID={`view-log-${request.key}`}
            accessibilityRole="button"
            accessibilityLabel={`View log for ${request.id}`}
            hitSlop={10}
            onPress={onViewLog}
          >
            <Text style={styles.viewLog}>View Log</Text>
          </Pressable>
        </View>
      ) : null}

      {request.status === 'rejected' && request.reason ? (
        <View style={styles.reason}>
          <CircleAlert size={14} color="#E11D48" strokeWidth={2.2} />
          <Text style={styles.reasonText}>Reason: {request.reason}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E2E2',
    backgroundColor: '#FFFFFF',
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  top: { flexDirection: 'row', gap: 14 },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  id: { marginTop: 2, color: '#333333', fontSize: 13, lineHeight: 18, fontWeight: '700' },
  title: { marginTop: 5, color: '#333333', fontSize: 15, lineHeight: 20, fontWeight: '600' },
  lines: { marginTop: 5, gap: 4 },
  line: { color: '#555555', fontSize: 13, lineHeight: 18 },
  value: { color: '#333333' },
  strong: { fontWeight: '600' },
  pill: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: 23,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  pillText: { fontSize: 11, lineHeight: 15, fontWeight: '500' },
  chevron: { position: 'absolute', top: 24, right: -3 },
  divider: { marginTop: 13, borderTopWidth: 1, borderTopColor: '#F1F1F1' },
  actions: { paddingTop: 12, flexDirection: 'row', gap: 23 },
  button: {
    height: 34,
    borderRadius: 11,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: { fontSize: 13, lineHeight: 18, fontWeight: '700' },
  reject: { flex: 163, backgroundColor: '#FFF5F6', borderColor: '#FECDD3' },
  rejectText: { color: '#E11D48' },
  approve: { flex: 142, backgroundColor: '#059669', borderColor: '#059669' },
  approveText: { color: '#FFFFFF' },
  footer: { paddingTop: 10, flexDirection: 'row', alignItems: 'center', gap: 7 },
  decidedBy: { flex: 1, color: '#047857', fontSize: 11.5, lineHeight: 16, fontWeight: '500' },
  viewLog: { color: '#1D4ED8', fontSize: 11.5, lineHeight: 16, fontWeight: '700' },
  reason: {
    marginTop: 13,
    minHeight: 35,
    borderRadius: 12,
    backgroundColor: '#FFF7F8',
    paddingHorizontal: 9,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  reasonText: { flex: 1, color: '#BE123C', fontSize: 11.5, lineHeight: 16 },
});
