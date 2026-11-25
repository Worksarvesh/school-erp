import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Header, Card, Badge, StateView, useTheme, StyleSheet, Text } from '@school-erp/ui';
import type { NoticeDto } from '@school-erp/api-client';
import { MockStudentServices } from '../../../core/mocks/mock-services.js';

export function SchoolNoticesScreen() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();

  const [notices, setNotices] = useState<NoticeDto[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotices = async () => {
    try {
      setLoading(true);
      const data = await MockStudentServices.getNotices();
      setNotices(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  return (
    <Screen
      header={<Header title="School Notices" showBack onBack={() => router.back()} />}
      scrollable
      contentContainerStyle={{ padding: spacing.base }}
      onRefresh={loadNotices}
      refreshing={loading}
    >
      <Text
        style={{
          color: colors.textSecondary,
          fontSize: typography.fontSizes.xs,
          marginBottom: spacing.md,
        }}
      >
        Official school circulars, academic notifications, and event announcements.
      </Text>

      {loading ? (
        <StateView state="loading" title="Loading notices..." />
      ) : notices.length === 0 ? (
        <StateView
          state="empty"
          title="No notices"
          description="There are no active notices at this time."
        />
      ) : (
        notices.map((notice) => (
          <Card
            key={notice.id}
            variant="elevated"
            onPress={() => router.push({ pathname: '/notices/[id]', params: { id: notice.id } })}
            style={styles.card}
          >
            <View style={styles.cardTop}>
              <Badge label={notice.category.toUpperCase()} variant="info" size="sm" />
              {notice.isImportant ? <Badge label="IMPORTANT" variant="error" size="sm" /> : null}
            </View>

            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                  fontSize: typography.fontSizes.base,
                  fontWeight: '700',
                  marginTop: 6,
                },
              ]}
            >
              {notice.title}
            </Text>

            <Text
              style={{
                color: colors.textSecondary,
                fontSize: typography.fontSizes.xs,
                marginTop: 4,
              }}
              numberOfLines={2}
            >
              {notice.content}
            </Text>

            <View style={styles.cardBottom}>
              <Text style={{ color: colors.textMuted, fontSize: typography.fontSizes.xs }}>
                By: {notice.authorName}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: typography.fontSizes.xs }}>
                {new Date(notice.publishedAt).toLocaleDateString()}
              </Text>
            </View>
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
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {},
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
});
