import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock,
  MapPin,
} from 'lucide-react-native';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SPORT_CATEGORIES, SPORTS_EVENTS } from '@/mock/sports';
import { fonts } from '@/theme/fonts';
import { sportsImages } from '@/theme/images';

const DEEP = '#4B18AA';
const BLUE = '#2563EB';
/** Icon drawn at the size it has in the design. */
function SportIcon({
  name,
  size,
}: {
  name: keyof typeof sportsImages;
  size: readonly [number, number];
}) {
  return (
    <Image
      source={sportsImages[name]}
      resizeMode="contain"
      accessibilityElementsHidden
      style={{ width: size[0], height: size[1] }}
    />
  );
}

/**
 * Sports, built to the approved design: join banner, eight categories and upcoming events.
 * MOCK data only. The buttons and rows have no screens behind them yet, so they do nothing.
 */
export function SportsScreen() {
  const router = useRouter();
  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.topBar}>
        <Pressable
          testID="sports-back"
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
          onPress={back}
          style={styles.topSide}
        >
          <ArrowLeft size={26} color="#111827" />
        </Pressable>
        <Text accessibilityRole="header" style={styles.topTitle}>
          Sports
        </Text>
        <View style={[styles.topSide, styles.topRight]}>
          <Image source={sportsImages.avatar} accessibilityLabel="Profile" style={styles.avatar} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Join the{'\n'}School Sports Team</Text>
            <Text style={styles.bannerSub}>Discover your talent, build your confidence!</Text>
            <Pressable
              testID="sports-view-details"
              accessibilityRole="button"
              accessibilityLabel="View details"
              style={styles.bannerButton}
            >
              <Text style={styles.bannerButtonText}>View Details</Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </Pressable>
          </View>
          <Image
            source={sportsImages.banner}
            resizeMode="contain"
            accessibilityElementsHidden
            style={styles.bannerArt}
          />
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Sports Categories</Text>
          <Pressable testID="sports-see-all" accessibilityRole="link" style={styles.link}>
            <Text style={styles.linkText}>See All</Text>
            <ChevronRight size={16} color={BLUE} />
          </Pressable>
        </View>
        <View style={styles.grid}>
          {SPORT_CATEGORIES.map((c) => (
            <Pressable
              key={c.key}
              testID={`sport-${c.key}`}
              accessibilityRole="button"
              accessibilityLabel={c.label}
              style={styles.cat}
            >
              <View style={[styles.catTile, { backgroundColor: c.tint }]}>
                <SportIcon name={c.key} size={c.size} />
              </View>
              <Text style={styles.catLabel} numberOfLines={1}>
                {c.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.events}>
          <View style={styles.sectionRow}>
            <View style={styles.eventsTitleRow}>
              <CalendarDays size={22} color={BLUE} />
              <Text style={styles.eventsTitle}>Upcoming Sports Events</Text>
            </View>
            <Pressable testID="sports-view-all" accessibilityRole="link" style={styles.link}>
              <Text style={styles.linkText}>View All</Text>
              <ChevronRight size={16} color={BLUE} />
            </Pressable>
          </View>
          {SPORTS_EVENTS.map((e) => (
            <Pressable
              key={e.id}
              testID={`event-${e.id}`}
              accessibilityRole="button"
              accessibilityLabel={`${e.title}, ${e.day} ${e.month}, ${e.place}, ${e.time}`}
              style={styles.event}
            >
              <View style={[styles.dateBox, { backgroundColor: e.box[0] }]}>
                <Text style={[styles.dateDay, { color: e.box[1] }]}>{e.day}</Text>
                <Text style={[styles.dateMonth, { color: e.box[1] }]}>{e.month}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.eventTitle}>{e.title}</Text>
                <View style={styles.meta}>
                  <MapPin size={14} color="#6B7280" />
                  <Text style={styles.metaText}>{e.place}</Text>
                </View>
                <View style={styles.meta}>
                  <Clock size={14} color="#6B7280" />
                  <Text style={styles.metaText}>{e.time}</Text>
                </View>
              </View>
              <View style={styles.pill}>
                <Text style={styles.pillText}>{e.status}</Text>
              </View>
              <ChevronRight size={20} color="#4B5563" />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  topBar: {
    height: 58,
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
  topSide: { width: 36 },
  topRight: { alignItems: 'flex-end' },
  topTitle: { flex: 1, textAlign: 'center', color: DEEP, fontSize: 21, fontFamily: fonts.bold },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 32 },
  banner: {
    minHeight: 160,
    borderRadius: 24,
    backgroundColor: '#D6E8FC',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    overflow: 'hidden',
    shadowColor: '#2563EB',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  bannerText: { flex: 1, paddingVertical: 16 },
  bannerTitle: { color: '#111827', fontSize: 18, lineHeight: 24, fontFamily: fonts.semibold },
  bannerSub: {
    color: '#4B5563',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
    fontFamily: fonts.regular,
  },
  bannerButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 18,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1F5BFF',
  },
  bannerButtonText: { color: '#FFFFFF', fontSize: 14, fontFamily: fonts.semibold },
  bannerArt: { width: 118, height: 110, marginRight: 2 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 12,
  },
  sectionTitle: { color: '#111827', fontSize: 18, fontFamily: fonts.medium },
  link: { flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 32 },
  linkText: { color: BLUE, fontSize: 14, fontFamily: fonts.medium },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 14 },
  cat: { width: '25%', alignItems: 'center' },
  catTile: {
    width: 76,
    height: 76,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  catLabel: { color: '#111827', fontSize: 12, marginTop: 8, fontFamily: fonts.medium },
  events: {
    marginTop: 22,
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#EEF0F5',
    backgroundColor: '#FFFFFF',
  },
  eventsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  eventsTitle: { color: '#111827', fontSize: 17, fontFamily: fonts.medium },
  event: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    marginBottom: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEF0F5',
    backgroundColor: '#FFFFFF',
  },
  dateBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDay: { fontSize: 20, fontFamily: fonts.bold },
  dateMonth: { fontSize: 11, fontFamily: fonts.semibold },
  eventTitle: { color: '#111827', fontSize: 15, lineHeight: 21, fontFamily: fonts.medium },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  metaText: { color: '#6B7280', fontSize: 11.5, fontFamily: fonts.regular },
  pill: {
    backgroundColor: '#E3F6EA',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  pillText: { color: '#16A34A', fontSize: 11, fontFamily: fonts.medium },
});
