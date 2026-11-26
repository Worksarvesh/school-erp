import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- Metro bundles static images only through require().
const ROCKET = require('../../../../assets/onboarding/rocket.png');
// eslint-disable-next-line @typescript-eslint/no-require-imports -- Metro bundles static images only through require().
const BACKPACK = require('../../../../assets/onboarding/backpack.png');
// eslint-disable-next-line @typescript-eslint/no-require-imports -- Metro bundles static images only through require().
const BOY = require('../../../../assets/onboarding/boy.png');

const ACTIVE = '#7A00FF';
const INACTIVE = '#D9D9D9';
const BUTTON = '#1D4ED8';

interface Slide {
  title: string;
  body: string;
  image: number;
  width: number;
  height: number;
  /** Moves the picture down inside its slot (the design sits the backpack lower). */
  offsetY?: number;
}

/** Intro slides, one per approved design. MOCK copy. */
const SLIDES: readonly Slide[] = [
  {
    title: 'Everything in one app',
    body: 'Attendance, homework, timetable, fees and more — your entire student life, organized in one place.',
    image: ROCKET,
    width: 304,
    height: 304,
  },
  {
    title: 'Track your progress',
    body: 'See your attendance, grades and achievements at a glance, and stay on top of every deadline.',
    image: BACKPACK,
    width: 326,
    height: 182,
    offsetY: 47,
  },
  {
    title: 'Learn together, grow together',
    body: 'Chat with teachers and classmates, get instant notices, and never miss an announcement or event.',
    image: BOY,
    width: 231,
    height: 347,
    offsetY: 10,
  },
];

/** SCHOOL-COMMON-ONBOARDING: intro slides with Skip, progress dots and Next. */
export function OnboardingScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index]!;
  const last = index === SLIDES.length - 1;

  const finish = () => router.replace('/(auth)/role-select');
  const next = () => (last ? finish() : setIndex(index + 1));

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.skipRow}>
        <Pressable
          testID="onboarding-skip"
          accessibilityRole="button"
          accessibilityLabel="Skip"
          hitSlop={12}
          onPress={finish}
        >
          <Text style={styles.skip}>Skip</Text>
        </Pressable>
      </View>

      <View style={styles.imageSlot}>
        <Image
          source={slide.image}
          style={{
            width: slide.width,
            height: slide.height,
            transform: [{ translateY: slide.offsetY ?? 0 }],
          }}
          resizeMode="contain"
        />
      </View>

      <View style={styles.copy}>
        <Text accessibilityRole="header" style={styles.title}>
          {slide.title}
        </Text>
        <Text style={styles.body}>{slide.body}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots} accessibilityLabel={`Page ${index + 1} of ${SLIDES.length}`}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === index ? styles.dotActive : null]} />
          ))}
        </View>
        <Pressable
          testID="onboarding-next"
          accessibilityRole="button"
          accessibilityLabel={last ? 'Get Started' : 'Next'}
          onPress={next}
          style={styles.next}
        >
          <Text style={styles.nextLabel}>{last ? 'Get Started' : 'Next'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  skipRow: { alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 44 },
  skip: { color: '#111111', fontSize: 18, lineHeight: 24 },
  imageSlot: { height: 304, marginTop: 4, alignItems: 'center', justifyContent: 'center' },
  copy: { paddingHorizontal: 19, marginTop: 56 },
  title: { color: '#111111', fontSize: 32, lineHeight: 39, fontWeight: '700' },
  body: { color: '#111111', fontSize: 18, lineHeight: 22, marginTop: 4 },
  footer: {
    marginTop: 'auto',
    paddingHorizontal: 20,
    paddingBottom: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 36 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: INACTIVE },
  dotActive: { width: 20, backgroundColor: ACTIVE },
  next: {
    width: 145,
    height: 58,
    borderRadius: 14,
    backgroundColor: BUTTON,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextLabel: { color: '#FFFFFF', fontSize: 20, fontWeight: '500' },
});
