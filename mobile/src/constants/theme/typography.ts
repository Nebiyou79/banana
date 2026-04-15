// src/constants/theme/typography.ts
// Fonts: Sora (headings) + DM Sans (body)
// Install: npx expo install @expo-google-fonts/sora @expo-google-fonts/dm-sans expo-font

import { Platform } from 'react-native';

export const fonts = {
  display: 'Sora-ExtraBold',
  bold:    'Sora-Bold',
  semibold:'Sora-SemiBold',
  regular: 'Sora-Regular',
  body:    'DMSans-Regular',
  medium:  'DMSans-Medium',
  bodyBold:'DMSans-Bold',
  mono:    Platform.select({ ios: 'Courier New', android: 'monospace' }) as string,
} as const;

export const type = {
  display: { fontFamily: fonts.display,  fontSize: 32, lineHeight: 40, letterSpacing: -0.5 },
  h1:      { fontFamily: fonts.bold,     fontSize: 28, lineHeight: 36, letterSpacing: -0.3 },
  h2:      { fontFamily: fonts.bold,     fontSize: 22, lineHeight: 30, letterSpacing: -0.2 },
  h3:      { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 26 },
  h4:      { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 24 },
  bodyLg:  { fontFamily: fonts.body,     fontSize: 16, lineHeight: 26 },
  body:    { fontFamily: fonts.body,     fontSize: 14, lineHeight: 22 },
  bodySm:  { fontFamily: fonts.body,     fontSize: 13, lineHeight: 20 },
  caption: { fontFamily: fonts.body,     fontSize: 12, lineHeight: 18 },
  label:   { fontFamily: fonts.medium,   fontSize: 11, lineHeight: 16, letterSpacing: 0.8, textTransform: 'uppercase' as const },
  button:  { fontFamily: fonts.bold,     fontSize: 15, lineHeight: 20, letterSpacing: 0.2 },
  buttonSm:{ fontFamily: fonts.bold,     fontSize: 13, lineHeight: 18 },
  mono:    { fontFamily: fonts.mono,     fontSize: 13, lineHeight: 20 },
} as const;