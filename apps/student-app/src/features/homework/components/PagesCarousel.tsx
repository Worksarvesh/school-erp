import { useState } from 'react';
import {
  FlatList,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '@school-erp/ui';

/**
 * Swipeable pages of a homework (attachments). MOCK: there is no file API yet, so each slide is
 * a placeholder sheet. Swipe sideways to move between pages; the dots show where you are.
 */
export function PagesCarousel({ title, pages = 3 }: { title: string; pages?: number }) {
  const { colors, typography } = useTheme();
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const data = Array.from({ length: pages }, (_, i) => i + 1);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width > 0) setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <View testID="pages-carousel" onLayout={onLayout}>
      {width > 0 ? (
        <FlatList
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          data={data}
          keyExtractor={(n) => String(n)}
          onScroll={onScroll}
          scrollEventThrottle={16}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          renderItem={({ item }) => (
            <View style={{ width }}>
              <View
                accessible
                accessibilityLabel={`${title}, page ${item} of ${pages}`}
                style={[
                  styles.page,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                ]}
              >
                <Text style={{ color: colors.textSecondary, fontSize: typography.fontSizes.xs }}>
                  Page {item} of {pages}
                </Text>
                {[100, 88, 94, 70].map((w, i) => (
                  <View
                    key={i}
                    style={[styles.line, { width: `${w}%`, backgroundColor: colors.border }]}
                  />
                ))}
              </View>
            </View>
          )}
        />
      ) : null}
      <View style={styles.dots} accessibilityLabel={`Page ${index + 1} of ${pages}`}>
        {data.map((n, i) => (
          <View
            key={n}
            style={[styles.dot, { backgroundColor: i === index ? colors.primary : colors.border }]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { height: 150, borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
  line: { height: 8, borderRadius: 4 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
