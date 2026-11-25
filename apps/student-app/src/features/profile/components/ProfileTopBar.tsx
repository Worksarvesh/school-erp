import { ArrowLeft } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { StyleSheet, Text, scaled } from '@school-erp/ui';

/** White top bar with a back arrow and a centred violet title (approved Profile design). */
export function ProfileTopBar({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.bar}>
      <Pressable
        testID="profile-back"
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={12}
        onPress={onBack}
        style={styles.back}
      >
        <ArrowLeft size={scaled(26)} color="#111827" />
      </Pressable>
      <Text accessibilityRole="header" style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      <View style={styles.back} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  back: { width: 32, alignItems: 'flex-start' },
  title: {
    flex: 1,
    textAlign: 'center',
    color: '#4B18AA',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '800',
  },
});
