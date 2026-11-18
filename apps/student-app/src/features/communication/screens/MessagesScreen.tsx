import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen, Header, Card, Badge, StateView, useTheme } from '@school-erp/ui';
import type { ConversationThreadDto } from '@school-erp/api-client';
import { MockStudentServices } from '../../../core/mocks/mock-services.js';

export function MessagesScreen() {
  const { colors, spacing, typography } = useTheme();
  const [threads, setThreads] = useState<ConversationThreadDto[]>([]);
  const [loading, setLoading] = useState(true);

  const loadThreads = async () => {
    try {
      setLoading(true);
      const data = await MockStudentServices.getBroadcastThreads();
      setThreads(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, []);

  return (
    <Screen
      header={<Header title="Messages & Broadcasts" />}
      scrollable
      contentContainerStyle={{ padding: spacing.base }}
      onRefresh={loadThreads}
      refreshing={loading}
    >
      <View style={{ marginBottom: spacing.sm }}>
        <Text style={{ color: colors.textSecondary, fontSize: typography.fontSizes.xs }}>
          Official school broadcast channels. One-way announcements from authorized staff and class
          teachers.
        </Text>
      </View>

      {loading ? (
        <StateView state="loading" title="Loading messages..." />
      ) : threads.length === 0 ? (
        <StateView
          state="empty"
          title="No messages"
          description="You have no announcements right now."
        />
      ) : (
        threads.map((thread) => (
          <Card key={thread.id} variant="elevated" style={styles.card}>
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.threadTitle,
                    { color: colors.text, fontSize: typography.fontSizes.base, fontWeight: '700' },
                  ]}
                >
                  {thread.title}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: typography.fontSizes.xs }}>
                  {thread.recipientName} • {thread.recipientRole}
                </Text>
              </View>
              {thread.unreadCount > 0 ? (
                <Badge label={`${thread.unreadCount} New`} variant="info" size="sm" />
              ) : null}
            </View>

            <View
              style={[
                styles.messageBox,
                {
                  backgroundColor: colors.surfaceSubtle,
                  marginTop: spacing.sm,
                  padding: spacing.sm,
                  borderRadius: 8,
                },
              ]}
            >
              <Text style={{ color: colors.text, fontSize: typography.fontSizes.sm }}>
                {thread.lastMessage}
              </Text>
            </View>

            <Text
              style={{
                color: colors.textMuted,
                fontSize: typography.fontSizes.xs,
                marginTop: spacing.xs,
                textAlign: 'right',
              }}
            >
              {thread.lastMessageTime}
            </Text>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  threadTitle: {},
  messageBox: {},
});
