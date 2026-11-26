import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AddPersonIcon } from '@/components/AddPersonIcon';

const OPTIONS = [
  { key: 'admin', label: 'Add Admin' },
  { key: 'vice-principal', label: 'Add Vice - Principle' },
] as const;

/**
 * SCHOOL-SETUP-ADD-ADMIN-VP: the principal chooses to add an Admin or a Vice Principal. (Spelling
 * "Principle" is from the approved design.) Add Admin opens its form; the Vice
 * Principal side is not designed yet and opens the coming-soon page.
 */
export function AddStaffScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.body}>
        <Text accessibilityRole="header" style={styles.title}>
          {'Add Admin/\nVice Principle'}
        </Text>
        <Text style={styles.subtitle}>Add your school admin/ vice - principle</Text>

        <View style={styles.cards}>
          {OPTIONS.map((o) => (
            <Pressable
              key={o.key}
              testID={`add-${o.key}`}
              accessibilityRole="button"
              accessibilityLabel={o.label}
              onPress={() => router.push(o.key === 'admin' ? '/(auth)/add-admin' : '/coming-soon')}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            >
              <AddPersonIcon size={26} />
              <Text style={styles.cardLabel}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  body: { flex: 1, paddingHorizontal: 49, paddingTop: 54 },
  title: {
    color: '#000000',
    fontSize: 28,
    lineHeight: 29,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: '#333333',
    fontSize: 16,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 22,
  },
  cards: { marginTop: 56, gap: 24 },
  card: {
    height: 69,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E1E6',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardPressed: { backgroundColor: '#F7F5FF' },
  cardLabel: { color: '#444444', fontSize: 16, lineHeight: 20, marginTop: 4 },
});
