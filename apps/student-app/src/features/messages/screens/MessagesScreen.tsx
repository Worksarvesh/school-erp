import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, BadgeCheck, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, TextInput, View } from 'react-native';
import { StyleSheet, Text, scaled, MAX_FONT_SCALE } from '@school-erp/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COMMUNITY_CHATS } from '@/mock/community';
import { fonts } from '@/theme/fonts';
import { communityImages, homeImages } from '@/theme/images';

const DEEP = '#4B18AA';

/**
 * Community tab (was Messages), built to the approved design: search box and the list of school
 * groups. MOCK data only; the rows have no chat screen behind them yet.
 */
export function MessagesScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  const chats = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMUNITY_CHATS;
    return COMMUNITY_CHATS.filter(
      (c) => c.title.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.topBar}>
        <Pressable
          testID="community-back"
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
          onPress={back}
          style={styles.side}
        >
          <ArrowLeft size={scaled(26)} color="#111827" />
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>
          Community
        </Text>
        <View style={[styles.side, styles.sideRight]}>
          <Image source={homeImages.avatar} style={styles.photo} resizeMode="cover" />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.search}>
          <Search size={scaled(22)} color="#6B7280" />
          <TextInput
            maxFontSizeMultiplier={MAX_FONT_SCALE}
            testID="community-search"
            value={query}
            onChangeText={setQuery}
            placeholder="Search Messages, groups..."
            placeholderTextColor="#6B7280"
            style={styles.searchInput}
          />
        </View>

        {chats.map((c) => (
          <Pressable
            key={c.id}
            testID={`chat-${c.id}`}
            accessibilityRole="button"
            accessibilityLabel={`Open ${c.title}`}
            onPress={() => router.push({ pathname: '/community/[id]', params: { id: c.id } })}
            style={styles.card}
          >
            <Image source={communityImages[c.avatar]} style={styles.avatar} />
            <View style={styles.text}>
              <View style={styles.titleRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {c.title}
                </Text>
                {c.verified ? (
                  <BadgeCheck size={scaled(20)} color="#FFFFFF" fill="#4B3AA8" />
                ) : null}
              </View>
              <Text style={styles.preview} numberOfLines={2}>
                {c.preview}
              </Text>
            </View>
            <View style={styles.meta}>
              <Text style={styles.time}>{c.time}</Text>
              {c.unread ? (
                <View style={styles.badge}>
                  <Text allowFontScaling={false} style={styles.badgeText}>
                    {c.unread}
                  </Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        ))}
        {chats.length === 0 ? <Text style={styles.empty}>No chats found.</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  topBar: {
    height: 64,
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
  side: { width: 40, alignItems: 'flex-start' },
  sideRight: { alignItems: 'flex-end' },
  title: { flex: 1, textAlign: 'center', color: DEEP, fontSize: 24, fontFamily: fonts.bold },
  photo: { width: 34, height: 34, borderRadius: 17 },
  content: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 120 },
  search: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    backgroundColor: '#FFFFFF',
    marginBottom: 22,
  },
  searchInput: { flex: 1, color: '#111827', fontSize: 15, fontFamily: fonts.medium },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E4DDFB',
    backgroundColor: '#FFFFFF',
    shadowColor: DEEP,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  text: { flex: 1, marginLeft: 14, marginRight: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { flexShrink: 1, color: '#111827', fontSize: 16, fontFamily: fonts.bold },
  preview: {
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.medium,
    marginTop: 4,
  },
  meta: { alignSelf: 'stretch', alignItems: 'flex-end', justifyContent: 'space-between' },
  time: { color: '#6B7280', fontSize: 12, fontFamily: fonts.medium },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 6,
    backgroundColor: '#4B3AA8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 24,
    height: 24,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    fontWeight: '700',
  },
  empty: { textAlign: 'center', color: '#6B7280', marginTop: 24, fontFamily: fonts.medium },
});
