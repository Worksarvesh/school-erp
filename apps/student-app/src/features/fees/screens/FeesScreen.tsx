import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen, Header, Card, Badge, StateView, useTheme } from '@school-erp/ui';
import type { FeeSummaryDto } from '@school-erp/api-client';
import { MockStudentServices } from '../../../core/mocks/mock-services';

function formatPaiseToRupees(paise: number): string {
  const rupees = (paise / 100).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
  return `₹${rupees}`;
}

export function FeesScreen() {
  const { colors, spacing, typography, radii } = useTheme();

  const [fees, setFees] = useState<FeeSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);

  const loadFees = async () => {
    try {
      setLoading(true);
      const data = await MockStudentServices.getFeeSummary();
      setFees(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFees();
  }, []);

  return (
    <Screen
      header={<Header title="Fees & Invoices" />}
      scrollable
      contentContainerStyle={{ padding: spacing.base }}
      onRefresh={loadFees}
      refreshing={loading}
    >
      <Text
        style={{
          color: colors.textSecondary,
          fontSize: typography.fontSizes.xs,
          marginBottom: spacing.md,
        }}
      >
        Official school fee statements and term-wise receipt summary. Online payment is processed
        via the school administrative desk.
      </Text>

      {loading ? (
        <StateView state="loading" title="Loading fee records..." />
      ) : fees ? (
        <>
          {/* Summary Banner */}
          <Card
            variant="elevated"
            style={[styles.banner, { backgroundColor: colors.primary, borderRadius: radii.xl }]}
          >
            <Text style={{ color: '#BFDBFE', fontSize: typography.fontSizes.xs }}>
              Total Annual Fee Structure
            </Text>
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: typography.fontSizes['2xl'],
                fontWeight: '700',
                marginVertical: 4,
              }}
            >
              {formatPaiseToRupees(fees.totalFeePaise)}
            </Text>

            <View style={styles.bannerRow}>
              <View>
                <Text style={{ color: '#E0E7FF', fontSize: typography.fontSizes.xs }}>
                  Paid Amount
                </Text>
                <Text
                  style={{
                    color: '#86EFAC',
                    fontSize: typography.fontSizes.base,
                    fontWeight: '700',
                  }}
                >
                  {formatPaiseToRupees(fees.paidFeePaise)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: '#E0E7FF', fontSize: typography.fontSizes.xs }}>
                  Outstanding Due
                </Text>
                <Text
                  style={{
                    color: '#FCA5A5',
                    fontSize: typography.fontSizes.base,
                    fontWeight: '700',
                  }}
                >
                  {formatPaiseToRupees(fees.dueFeePaise)}
                </Text>
              </View>
            </View>
          </Card>

          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.text,
                fontSize: typography.fontSizes.base,
                fontWeight: '700',
                marginVertical: spacing.md,
              },
            ]}
          >
            Installment Breakdown
          </Text>

          {fees.items.map((item) => (
            <Card key={item.id} variant="outlined" style={styles.feeCard}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text
                    style={[
                      styles.itemTitle,
                      { color: colors.text, fontSize: typography.fontSizes.sm, fontWeight: '600' },
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: typography.fontSizes.xs,
                      marginTop: 2,
                    }}
                  >
                    Due by: {item.dueDate}
                  </Text>
                </View>
                <Badge
                  label={item.status.toUpperCase()}
                  variant={
                    item.status === 'paid' ? 'success' : item.status === 'due' ? 'warning' : 'error'
                  }
                  size="sm"
                />
              </View>

              <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                <Text style={{ color: colors.textSecondary, fontSize: typography.fontSizes.xs }}>
                  Amount
                </Text>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: typography.fontSizes.base,
                    fontWeight: '700',
                  }}
                >
                  {formatPaiseToRupees(item.amountPaise)}
                </Text>
              </View>
            </Card>
          ))}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: {
    padding: 18,
    marginBottom: 16,
  },
  bannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  sectionTitle: {},
  feeCard: {
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemTitle: {},
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
