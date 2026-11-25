import { Dimensions, StyleSheet as RNStyleSheet } from 'react-native';
import { scaleFor, scaleSize, scaleStyles } from './scale.js';

// shortcut: measured once at start; reload after resizing a browser window or unfolding a phone.
const { width, height } = Dimensions.get('window');
const SCALE = scaleFor(Math.min(width, height));

/** The phone's font-size setting may enlarge app text by at most this much. */
export const MAX_FONT_SCALE = 1.15;

/** A size from the 360-wide design, for icons and inline styles. */
export const scaled = (n: number) => scaleSize(n, SCALE);

const create: typeof RNStyleSheet.create = (styles) =>
  RNStyleSheet.create(scaleStyles(styles, SCALE));

/** React Native's StyleSheet, with sizes from the 360-wide design scaled to this screen. */
export const StyleSheet = {
  create,
  absoluteFill: RNStyleSheet.absoluteFill,
  hairlineWidth: RNStyleSheet.hairlineWidth,
};
