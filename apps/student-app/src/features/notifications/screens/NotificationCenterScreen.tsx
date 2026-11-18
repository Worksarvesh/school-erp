import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { Screen, Header, Card, Badge, StateView, useTheme } from '@school-erp/ui';
import type { NotificationDto } from '@school-erp/api-client';
import { MockStudentServices } from '../../../core/mocks/mock-services';

export function NotificationCenterScreen() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await MockStudentServices.getNotifications();
      setNotifications(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handlePressNotification = async (notif: NotificationDto) => {
    if (!notif.readAt) {
      await MockStudentServices.markNotificationAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, readAt: new Date().toISOString() } : n)),
      );
    }
    if (notif.targetRoute) {
      router.push(notif.targetRoute as Href);
    }
  };

  return (
    <Screen
      header={<Header title="Notifications" showBack onBack={() => router.back()} />}
      scrollable
      contentContainerStyle={{ padding: spacing.base }}
      onRefresh={loadNotifications}
      refreshing={loading}
    >
      <Text
        style={{
          color: colors.textSecondary,
          fontSize: typography.fontSizes.xs,
          marginBottom: spacing.md,
        }}
      >
        Personal alerts for your assignments, attendance, and fee status.
      </Text>

      {loading ? (
        <StateView state="loading" title="Loading notifications..." />
      ) : notifications.length === 0 ? (
        <StateView
          state="empty"
          title="All caught up!"
          description="You have no notifications right now."
        />
      ) : (
        notifications.map((notif) => {
          const isUnread = !notif.readAt;
          return (
            <Card
              key={notif.id}
              variant={isUnread ? 'elevated' : 'outlined'}
              onPress={() => handlePressNotification(notif)}
              style={[
                styles.card,
                {
                  backgroundColor: isUnread ? colors.surface : colors.surfaceSubtle,
                  borderLeftWidth: isUnread ? 4 : 1,
                  borderLeftColor: isUnread ? colors.primary : colors.border,
                },
              ]}
            >
              <View style={styles.topRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text
                    style={[
                      styles.title,
                      {
                        color: colors.text,
                        fontSize: typography.fontSizes.sm,
                        fontWeight: isUnread ? '700' : '500',
                      },
                    ]}
                  >
                    {notif.title}
                  </Text>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: typography.fontSizes.xs,
                      marginTop: 2,
                    }}
                  >
                    {notif.body}
                  </Text>
                </View>
                {isUnread ? <Badge label="New" variant="info" size="sm" /> : null}
              </View>

              <Text
                style={{ color: colors.textMuted, fontSize: 10, marginTop: 8, textAlign: 'right' }}
              >
                {new Date(notif.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {},
});
