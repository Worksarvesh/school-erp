import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen, Header, Card, Badge, StateView, useTheme, StyleSheet, Text } from '@school-erp/ui';
import type { NoticeDto } from '@school-erp/api-client';
import { MockStudentServices } from '../../../core/mocks/mock-services.js';

export function NoticeDetailScreen() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();

  const [notice, setNotice] = useState<NoticeDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      MockStudentServices.getNoticeDetail(params.id)
        .then(setNotice)
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  if (loading) {
    return (
      <Screen header={<Header title="School Notice" showBack onBack={() => router.back()} />}>
        <StateView state="loading" title="Loading notice..." />
      </Screen>
    );
  }

  if (!notice) {
    return (
      <Screen header={<Header title="School Notice" showBack onBack={() => router.back()} />}>
        <StateView
          state="error"
          title="Notice not found"
          actionLabel="Go Back"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  return (
    <Screen
      header={<Header title="Notice Details" showBack onBack={() => router.back()} />}
      scrollable
      contentContainerStyle={{ padding: spacing.base }}
    >
      <Card variant="elevated" style={styles.card}>
        <View style={styles.cardTop}>
          <Badge label={notice.category.toUpperCase()} variant="info" size="sm" />
          {notice.isImportant ? <Badge label="IMPORTANT" variant="error" size="sm" /> : null}
        </View>

        <Text
          style={[
            styles.title,
            {
              color: colors.text,
              fontSize: typography.fontSizes.lg,
              fontWeight: '700',
              marginVertical: spacing.sm,
            },
          ]}
        >
          {notice.title}
        </Text>

        <Text
          style={{
            color: colors.textSecondary,
            fontSize: typography.fontSizes.sm,
            lineHeight: typography.lineHeights.relaxed,
          }}
        >
          {notice.content}
        </Text>

        <View
          style={[
            styles.metaBox,
            {
              backgroundColor: colors.surfaceSubtle,
              marginTop: spacing.base,
              padding: spacing.md,
              borderRadius: 8,
            },
          ]}
        >
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: typography.fontSizes.xs,
              marginBottom: 4,
            }}
          >
            Published By:{' '}
            <Text style={{ color: colors.text, fontWeight: '600' }}>{notice.authorName}</Text>
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: typography.fontSizes.xs }}>
            Date:{' '}
            <Text style={{ color: colors.text, fontWeight: '600' }}>
              {new Date(notice.publishedAt).toLocaleString()}
            </Text>
          </Text>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {},
  metaBox: {},
});
