/** Phone width (dp) the designs are drawn for. */
const DESIGN_WIDTH = 360;

/** How much to grow or shrink the design for a screen `width`; 1 when the width is unknown. */
export function scaleFor(width: number): number {
  return width > 0 ? Math.min(1.15, Math.max(0.88, width / DESIGN_WIDTH)) : 1;
}

/** One size, rounded to half a point so edges stay sharp. */
export const scaleSize = (n: number, k: number) => Math.round(n * k * 2) / 2;

// minWidth / minHeight stay as drawn so touch targets never shrink below what was asked for.
const SCALED_KEY =
  /^(width|height|maxWidth|maxHeight|top|right|bottom|left|gap|rowGap|columnGap|lineHeight|(margin|padding)(Top|Right|Bottom|Left|Start|End|Horizontal|Vertical)?|border\w*Radius)$/;

/** Scales the sizes in a `StyleSheet.create` object; colours, flex, borders and shadows stay. */
export function scaleStyles<T extends object>(styles: T, k: number): T {
  const out: Record<string, Record<string, unknown>> = {};
  for (const [name, style] of Object.entries(styles)) {
    const next: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(style as object)) {
      if (typeof value !== 'number') next[key] = value;
      // Text drawn at 10 or less is already small: it may grow but never shrink.
      else if (key === 'fontSize') next[key] = Math.max(scaleSize(value, k), Math.min(value, 10));
      else next[key] = SCALED_KEY.test(key) && value !== 1 ? scaleSize(value, k) : value;
    }
    out[name] = next;
  }
  return out as T;
}
