import React from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useTheme } from '../theme/theme.context.js';

export interface ScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  safeAreaEdges?: Edge[];
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Screen({
  children,
  scrollable = false,
  refreshing = false,
  onRefresh,
  header,
  footer,
  safeAreaEdges = ['top', 'left', 'right'],
  style,
  contentContainerStyle,
  testID,
}: ScreenProps) {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      edges={safeAreaEdges}
      style={[styles.container, { backgroundColor: colors.background }, style]}
      testID={testID}
    >
      {header}
      {scrollable ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, contentContainerStyle]}>{children}</View>
      )}
      {footer}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
});
