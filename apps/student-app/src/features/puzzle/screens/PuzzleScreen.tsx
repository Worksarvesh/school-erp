import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, Search, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { Screen, StateView, useTheme } from '@school-erp/ui';
import { comingSoon } from '@/features/dashboard/quickActions';
import { fonts } from '@/theme/fonts';
import { puzzleImages } from '@/theme/images';

interface PuzzleGame {
  key: string;
  label: string;
  image: ImageSourcePropType;
  /** Icon width in the card; the artwork keeps the proportions of the design. */
  size: number;
  bg: string;
  border: string;
}

/** The six puzzle games, with the card colours taken from the approved design. */
export const PUZZLE_GAMES: readonly PuzzleGame[] = [
  {
    key: 'word',
    label: 'Word Puzzle',
    image: puzzleImages.word,
    size: 72,
    bg: '#EDF6FF',
    border: '#D5E9FF',
  },
  {
    key: 'sudoku',
    label: 'Sudoku',
    image: puzzleImages.sudoku,
    size: 84,
    bg: '#EEF9F2',
    border: '#D3F1E0',
  },
  {
    key: 'math',
    label: 'Math Puzzle',
    image: puzzleImages.math,
    size: 64,
    bg: '#FFF4EB',
    border: '#FFE2CC',
  },
  {
    key: 'jigsaw',
    label: 'Jigsaw Puzzle',
    image: puzzleImages.jigsaw,
    size: 59,
    bg: '#F6F3FF',
    border: '#E3DCFF',
  },
  {
    key: 'logic',
    label: 'Logic Puzzle',
    image: puzzleImages.logic,
    size: 64,
    bg: '#EDF9F1',
    border: '#CEEEDC',
  },
  {
    key: 'crossword',
    label: 'Crossword',
    image: puzzleImages.crossword,
    size: 59,
    bg: '#EDF6FF',
    border: '#D5E9FF',
  },
];

/** Matches the game name, ignoring case. */
export function matchesPuzzle(game: PuzzleGame, query: string): boolean {
  const q = query.trim().toLowerCase();
  return !q || game.label.toLowerCase().includes(q);
}

/**
 * Puzzle home, built to the approved design: "Play. Think. Learn!" banner and a two-column grid
 * of puzzle games with the design's own artwork. The games are not built yet, so each card opens
 * a "Coming soon" page. UI only (Puzzle is not in V1.2).
 */
export function PuzzleScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const games = PUZZLE_GAMES.filter((g) => matchesPuzzle(g, query));

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable
          testID="puzzle-back"
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          style={styles.headerButton}
        >
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        {searching ? (
          <TextInput
            testID="puzzle-search-input"
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder="Search puzzles"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="Search puzzles"
            style={styles.searchInput}
            returnKeyType="search"
          />
        ) : (
          <Text style={[styles.title, { color: colors.primary }]} accessibilityRole="header">
            Puzzle
          </Text>
        )}
        <Pressable
          testID="puzzle-search"
          accessibilityRole="button"
          accessibilityLabel={searching ? 'Close search' : 'Search'}
          onPress={() => {
            if (searching) setQuery('');
            setSearching((s) => !s);
          }}
          style={styles.headerButton}
        >
          {searching ? (
            <X size={20} color={colors.text} />
          ) : (
            <Search size={20} color={colors.text} />
          )}
        </Pressable>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroText}>
          <Text style={styles.heroTitle}>Play. Think.{'\n'}Learn!</Text>
          <Text style={styles.heroSub}>Solve puzzles and sharpen your mind</Text>
        </View>
        <Image
          source={puzzleImages.hero}
          style={styles.heroImage}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      </View>

      {games.length === 0 ? (
        <StateView state="empty" title="No puzzles found" description="Try another search." />
      ) : (
        <View style={styles.grid}>
          {games.map((g) => (
            <Pressable
              key={g.key}
              testID={`puzzle-${g.key}`}
              accessibilityRole="button"
              accessibilityLabel={g.label}
              onPress={() => router.push(comingSoon(g.label))}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: g.bg, borderColor: g.border },
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.art}>
                <Image
                  source={g.image}
                  style={{ width: g.size, height: g.size }}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.cardLabel} numberOfLines={1}>
                  {g.label}
                </Text>
                <View style={styles.arrow}>
                  <ChevronRight size={14} color="#111827" strokeWidth={2.5} />
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 28 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F6',
  },
  headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontFamily: fonts.semibold },
  searchInput: {
    flex: 1,
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D4D4D8',
    color: '#111827',
    fontSize: 13,
    fontFamily: fonts.regular,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 10,
    paddingLeft: 18,
    paddingRight: 10,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    shadowColor: '#1F2937',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  heroText: { flex: 1 },
  heroTitle: { color: '#111827', fontSize: 22, lineHeight: 27, fontFamily: fonts.bold },
  heroSub: {
    color: '#4B5563',
    fontSize: 11.5,
    lineHeight: 16,
    fontFamily: fonts.regular,
    marginTop: 8,
  },
  heroImage: { width: 118, height: 118, borderRadius: 18 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
    paddingHorizontal: 16,
    marginTop: 20,
  },
  card: {
    width: '48%',
    aspectRatio: 1.07,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
  },
  pressed: { opacity: 0.85 },
  art: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardLabel: { flex: 1, color: '#111827', fontSize: 13.5, fontFamily: fonts.bold },
  arrow: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1F2937',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
});
