import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import type { Edge } from 'react-native-safe-area-context';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, sizes, spacing } from '@/theme';

interface ScreenContainerProps {
  children: ReactNode;
  /** Pinned below the scroll area and lifted above the keyboard (primary buttons). */
  footer?: ReactNode;
  /** Scrollable body (default true). Set false for screens that centre fixed content. */
  scroll?: boolean;
  edges?: Edge[];
  backgroundColor?: string;
  /** Background behind the footer (defaults to backgroundColor). */
  footerBackgroundColor?: string;
  /** Horizontal and top padding of the body (default true). */
  padded?: boolean;
}

/**
 * Safe-area + keyboard-avoiding wrapper. The footer sits outside the ScrollView inside a
 * KeyboardAvoidingView, so the keyboard never covers the focused input or the primary button.
 * With a footer, the bottom safe-area inset is applied to the footer itself.
 */
export function ScreenContainer({
  children,
  footer,
  scroll = true,
  edges = ['top', 'bottom'],
  backgroundColor = colors.background,
  footerBackgroundColor,
  padded = true,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const wantsBottom = edges.includes('bottom');
  const safeEdges = footer ? edges.filter((e) => e !== 'bottom') : edges;
  const bodyStyle = padded ? styles.padded : null;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor }]} edges={safeEdges}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.scrollContent, bodyStyle, padded && styles.scrollPadded]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.constrained, styles.grow]}>{children}</View>
          </ScrollView>
        ) : (
          <View style={[styles.flex, bodyStyle]}>
            <View style={[styles.flex, styles.constrained]}>{children}</View>
          </View>
        )}
        {footer ? (
          <View
            style={[
              styles.footer,
              padded && styles.footerPadded,
              { backgroundColor: footerBackgroundColor ?? backgroundColor },
              { paddingBottom: spacing.lg + (wantsBottom ? insets.bottom : 0) },
            ]}
          >
            <View style={styles.constrained}>{footer}</View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  padded: { paddingHorizontal: spacing.xxl, paddingTop: spacing.lg },
  scrollContent: { flexGrow: 1 },
  scrollPadded: { paddingBottom: spacing.xxl },
  constrained: { width: '100%', maxWidth: sizes.contentMaxWidth, alignSelf: 'center' },
  grow: { flexGrow: 1 },
  footer: { paddingTop: spacing.md },
  footerPadded: { paddingHorizontal: spacing.xxl },
});
