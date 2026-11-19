import type { ReactNode } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { useTheme } from '@school-erp/ui';

const WIDE_SCREEN_MIN = 600;
const COLUMN_MAX_WIDTH = 480;

/**
 * Centers its children in a column of at most 480 px when the window is wider than 600 px
 * (browser, tablet). On phones it renders the children untouched. Used by the route-group
 * layouts, so every screen inside a group gets it without per-screen changes.
 */
export function WebColumn({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  if (width <= WIDE_SCREEN_MIN) return <>{children}</>;
  return (
    <View style={{ flex: 1, alignItems: 'center', backgroundColor: colors.background }}>
      <View style={{ flex: 1, width: '100%', maxWidth: COLUMN_MAX_WIDTH }}>{children}</View>
    </View>
  );
}
