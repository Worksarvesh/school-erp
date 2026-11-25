import React, { type ComponentProps } from 'react';
import { Text as RNText } from 'react-native';
import { MAX_FONT_SCALE } from '../theme/responsive.js';

/** React Native's Text, with the phone's font-size setting capped so layouts hold. */
export function Text(props: ComponentProps<typeof RNText>) {
  return <RNText maxFontSizeMultiplier={MAX_FONT_SCALE} {...props} />;
}
