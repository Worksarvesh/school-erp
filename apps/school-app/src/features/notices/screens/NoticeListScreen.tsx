import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Pencil, Trash2, UsersRound } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePermission } from '@/core/permissions';
import { formatDate } from '../format';
import { useNotices } from '../store';

/** SCHOOL-NOTICE-LIST: the notices that were sent, with edit and delete. MOCK data. */
export function NoticeListScreen() {
  const router = useRouter();
  const canPublish = usePermission('notices.publish');
  const notices = useNotices((s) => s.notices);
  const remove = useNotices((s) => s.remove);

  const line = (label: string, value: string) => (
    <Text style={styles.line}>
      {label}: <Text style={styles.value}>{value}</Text>
    </Text>
  );

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable
          testID="notice-list-back"
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={10}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          style={styles.back}
        >
          <ArrowLeft size={24} color="#1E293B" strokeWidth={2.2} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>
          School Notice
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {notices.map((notice) => (
          <View key={notice.id} testID={`notice-card-${notice.id}`} style={styles.card}>
            <View style={styles.row}>
              <View style={styles.icon}>
                <UsersRound size={24} color="#4F46E5" fill="#4F46E5" strokeWidth={2.4} />
              </View>
              <View style={styles.info}>
                <Text style={styles.noticeTitle}>{notice.title}</Text>
                <Text numberOfLines={3} style={styles.description}>
                  {notice.description}
                </Text>
                <View style={styles.lines}>
                  {line('Assign by', notice.assignedBy)}
                  {line('Publish Date', formatDate(notice.publishDate, true))}
                  {line('Expiry Date', formatDate(notice.expiryDate, true))}
                </View>
              </View>
            </View>

            {canPublish ? (
              <View style={styles.actions}>
                <Pressable
                  testID={`notice-edit-${notice.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit: ${notice.title}`}
                  onPress={() =>
                    router.push({ pathname: '/school-notice', params: { id: notice.id } })
                  }
                  style={styles.action}
                >
                  <Pencil size={17} color="#4B5563" strokeWidth={2.4} />
                </Pressable>
                <Pressable
                  testID={`notice-remove-${notice.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete: ${notice.title}`}
                  onPress={() => remove(notice.id)}
                  style={styles.action}
                >
                  <Trash2 size={17} color="#B91C1C" strokeWidth={2.2} />
                </Pressable>
              </View>
            ) : null}
          </View>
        ))}
        {notices.length === 0 ? <Text style={styles.empty}>No notices yet.</Text> : null}
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
    paddingRight: 10,
  },
  list: { paddingTop: 18, paddingHorizontal: 20, paddingBottom: 32, gap: 15 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BDBDBD',
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
    paddingBottom: 15,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  row: { flexDirection: 'row', gap: 10, paddingLeft: 9, paddingRight: 10 },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  noticeTitle: { color: '#333333', fontSize: 15.5, lineHeight: 21, fontWeight: '500' },
  description: { marginTop: 4, color: '#4B4B57', fontSize: 14.5, lineHeight: 16.5 },
  lines: { marginTop: 11, gap: 3 },
  line: { color: '#555555', fontSize: 14.5, lineHeight: 19 },
  value: { color: '#2E3A4D' },
  actions: {
    marginTop: 6,
    paddingRight: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
  },
  action: {
    width: 36,
    height: 36,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { marginTop: 40, textAlign: 'center', color: '#555555', fontSize: 14 },
});
