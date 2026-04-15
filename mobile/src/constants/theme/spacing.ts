// src/constants/theme/spacing.ts

export const spacing = {
  xs:      4,
  sm:      8,
  md:      12,
  lg:      16,
  xl:      20,
  '2xl':   24,
  '3xl':   32,
  '4xl':   40,
  section: 48,
  screen:  20,   // horizontal screen padding — always use this
  card:    16,   // card internal padding — always use this
} as const;

export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  '2xl':24,
  full: 999,
} as const;

export type Spacing = typeof spacing;
export type Radius  = typeof radius;