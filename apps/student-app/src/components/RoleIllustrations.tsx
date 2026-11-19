import Svg, { Circle, Path, Rect } from 'react-native-svg';

/**
 * Vector stand-in for the Parents artwork (the Student card is an empty lavender box in the design). To use the real images, replace the
 * `illustration` props in RoleSelectScreen with <Image source={require('...')} />.
 */
export function ParentsIllustration() {
  return (
    <Svg width={76} height={76} viewBox="0 0 76 76">
      <Rect width={76} height={76} fill="#E8F0FF" />
      {/* father */}
      <Path d="M6 76c0-13 6-20 15-20s15 7 15 20z" fill="#3B6FE0" />
      <Circle cx={21} cy={38} r={9} fill="#E9B890" />
      <Path d="M12 36c0-7 5-11 10-11s9 4 9 9c-4-1-8-3-10-6-2 4-5 7-9 8z" fill="#2B2B2B" />
      {/* mother */}
      <Path d="M40 76c0-13 6-20 15-20s15 7 15 20z" fill="#F08AA8" />
      <Circle cx={55} cy={38} r={9} fill="#F2C3A0" />
      <Path
        d="M45 38c0-8 4-13 10-13s10 5 10 13c0 4-1 8-2 10 0-6-3-10-8-10s-8 4-8 10c-1-2-2-6-2-10z"
        fill="#4A2E1F"
      />
      {/* child */}
      <Path d="M28 76c0-8 4-12 10-12s10 4 10 12z" fill="#FFC857" />
      <Circle cx={38} cy={56} r={6} fill="#F5C9A6" />
      <Path d="M32 55c0-5 3-7 6-7s6 2 6 6c-3 0-5-1-6-3-1 2-3 4-6 4z" fill="#3B2A20" />
    </Svg>
  );
}

/** Vector stand-in for the school help-desk artwork (replace with the real image when available). */
export function HelpDeskIllustration() {
  return (
    <Svg width={110} height={110} viewBox="0 0 110 110">
      <Rect width={110} height={110} fill="#F4F8F8" />
      {/* wall board */}
      <Circle cx={30} cy={28} r={13} fill="#7FC8C8" />
      <Circle cx={30} cy={28} r={8} fill="#E9F7F7" />
      {/* desk */}
      <Rect x={14} y={70} width={62} height={32} rx={3} fill="#C98F55" />
      <Rect x={14} y={66} width={66} height={7} rx={2} fill="#E2B27A" />
      <Rect x={32} y={80} width={26} height={8} rx={1} fill="#FFFFFF" />
      {/* staff behind desk */}
      <Circle cx={42} cy={48} r={8} fill="#E9B890" />
      <Path d="M33 46c0-8 5-12 10-12s9 4 9 11c-4-1-8-4-10-7-2 4-5 7-9 8z" fill="#3B2A20" />
      <Path d="M28 68c0-10 6-14 14-14s14 4 14 14z" fill="#E0A53A" />
      {/* parent */}
      <Circle cx={88} cy={40} r={7} fill="#F2C3A0" />
      <Path d="M80 38c0-7 4-11 9-11s8 4 8 10c-4 0-7-2-8-5-2 3-5 5-9 6z" fill="#4A2E1F" />
      <Path d="M80 98V56c0-4 4-6 8-6s8 2 8 6v42z" fill="#F4E9D8" />
      {/* child */}
      <Circle cx={68} cy={62} r={5} fill="#F5C9A6" />
      <Path d="M62 100V72c0-3 3-5 6-5s6 2 6 5v28z" fill="#3F6B4F" />
    </Svg>
  );
}
