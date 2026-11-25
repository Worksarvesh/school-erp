import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, CornerUpLeft, Download, Search, Users } from 'lucide-react-native';
import { useState } from 'react';
import { Image, Linking, Pressable, ScrollView, View } from 'react-native';
import { StyleSheet, Text, scaled } from '@school-erp/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COMMUNITY_CHATS, COMMUNITY_THREADS, type ThreadMessage } from '@/mock/community';
import { fonts } from '@/theme/fonts';
import { communityImages } from '@/theme/images';

const DEEP = '#4B18AA';
const NAME = '#4B3AA8';
const SOFT = '#EDE9FD';

/**
 * One Community group, built to the approved design (Sports Department): header with members,
 * date chip and message cards with attachment and likes. MOCK data only.
 */
export function CommunityChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const thread = id ? COMMUNITY_THREADS[id] : undefined;
  const chat = COMMUNITY_CHATS.find((c) => c.id === id);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/messages'));

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable
          testID="chat-back"
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={back}
          style={styles.round}
        >
          <ChevronLeft size={scaled(26)} color={DEEP} />
        </Pressable>
        {chat ? (
          <Image
            source={communityImages[chat.avatar === 'sports' ? 'sportsHead' : chat.avatar]}
            style={styles.headAvatar}
          />
        ) : null}
        <View style={styles.headText}>
          <Text accessibilityRole="header" style={styles.headTitle} numberOfLines={1}>
            {thread?.title ?? chat?.title ?? 'Community'}
          </Text>
          <Text style={styles.headSub} numberOfLines={1}>
            {thread?.subtitle ?? chat?.preview ?? ''}
          </Text>
        </View>
        <View style={styles.round}>
          <Search size={scaled(24)} color={DEEP} />
        </View>
      </View>

      {thread ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.members}>
            <Users size={scaled(20)} color={NAME} fill={NAME} />
            <Text style={styles.membersText}>{thread.members} Members</Text>
          </View>
          <View style={styles.dateChip}>
            <Text style={styles.dateText}>{thread.dateLabel}</Text>
          </View>
          {thread.messages.map((m) => (
            <Message key={m.id} message={m} />
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.empty}>No messages yet.</Text>
      )}
    </SafeAreaView>
  );
}

function Message({ message: m }: { message: ThreadMessage }) {
  const [liked, setLiked] = useState(false);
  return (
    <View style={styles.row} testID={`message-${m.id}`}>
      <Image source={communityImages[m.avatar]} style={styles.avatar} />
      <View style={styles.flex}>
        <View style={styles.bubble}>
          <View style={styles.bubbleHead}>
            <Text style={styles.sender}>{m.sender}</Text>
            <Text style={styles.time}>{m.time}</Text>
          </View>
          <View style={styles.bodyRow}>
            <View style={styles.flex}>
              {m.lines.map((line) => (
                <Text key={line} style={styles.body}>
                  {line}
                </Text>
              ))}
            </View>
            {m.emoji ? <Text style={styles.emoji}>{m.emoji}</Text> : null}
          </View>
          {m.attachment ? (
            <Pressable
              testID={`attachment-${m.id}`}
              accessibilityRole="button"
              accessibilityLabel={`Download ${m.attachment.name}`}
              onPress={() => void Linking.openURL(m.attachment?.url ?? '').catch(() => undefined)}
              style={styles.file}
            >
              <View style={styles.pdf}>
                <Text style={styles.pdfText}>PDF</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {m.attachment.name}
                </Text>
                <Text style={styles.fileSize}>{m.attachment.size}</Text>
              </View>
              <Download size={scaled(22)} color={NAME} />
            </Pressable>
          ) : null}
        </View>
        <View style={styles.reactions}>
          <Pressable
            testID={`like-${m.id}`}
            accessibilityRole="button"
            accessibilityLabel={liked ? 'Remove like' : 'Like'}
            accessibilityState={{ selected: liked }}
            onPress={() => setLiked((v) => !v)}
            style={[styles.like, liked && styles.likeActive]}
          >
            <Text style={styles.likeEmoji}>👍</Text>
            <Text style={[styles.likeCount, liked && styles.likeCountActive]}>
              {m.likes + (liked ? 1 : 0)}
            </Text>
          </Pressable>
          {m.canReply ? <CornerUpLeft size={scaled(20)} color="#5B5B6B" /> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  round: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SOFT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headAvatar: { width: 44, height: 44, borderRadius: 22 },
  headText: { flex: 1 },
  headTitle: { color: '#111827', fontSize: 17, fontFamily: fonts.bold },
  headSub: { color: '#6B6B8A', fontSize: 13, fontFamily: fonts.medium, marginTop: 2 },
  content: { paddingHorizontal: 16, paddingBottom: 40, alignItems: 'stretch' },
  members: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  membersText: { color: NAME, fontSize: 15, fontFamily: fonts.medium },
  dateChip: {
    alignSelf: 'center',
    marginTop: 22,
    marginBottom: 22,
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: SOFT,
  },
  dateText: { color: '#2D2A4A', fontSize: 14, fontFamily: fonts.medium },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 20 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  bubble: {
    padding: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E4DDFB',
    backgroundColor: '#FFFFFF',
    shadowColor: DEEP,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  bubbleHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sender: { color: NAME, fontSize: 16, fontFamily: fonts.bold },
  time: { color: '#6B7280', fontSize: 12, fontFamily: fonts.medium },
  bodyRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 8 },
  body: {
    color: '#111827',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.medium,
    marginBottom: 6,
  },
  emoji: { fontSize: 18, marginBottom: 6 },
  file: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
    padding: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E4DDFB',
    backgroundColor: '#F7F5FE',
  },
  pdf: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D62B2B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfText: { color: '#FFFFFF', fontSize: 12, fontFamily: fonts.bold },
  fileName: { color: '#111827', fontSize: 14, fontFamily: fonts.bold },
  fileSize: { color: '#6B7280', fontSize: 12, fontFamily: fonts.medium, marginTop: 2 },
  reactions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingRight: 8,
  },
  like: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: SOFT,
  },
  likeActive: { backgroundColor: DEEP },
  likeCountActive: { color: '#FFFFFF' },
  likeEmoji: { fontSize: 14 },
  likeCount: { color: '#2D2A4A', fontSize: 14, fontFamily: fonts.semibold },
  empty: { textAlign: 'center', color: '#6B7280', marginTop: 40, fontFamily: fonts.medium },
});
