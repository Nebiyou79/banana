// src/constants/theme/shadows.ts
import { Platform } from 'react-native';

export const shadows = {
  none: {},
  sm: Platform.select({
    ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4,  elevation: 2 },
    android: { elevation: 2 },
  }) ?? {},
  md: Platform.select({
    ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 12, elevation: 5 },
    android: { elevation: 5 },
  }) ?? {},
  lg: Platform.select({
    ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 24, elevation: 10 },
    android: { elevation: 10 },
  }) ?? {},
  gold: Platform.select({
    ios:     { shadowColor: '#F1BB03', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.30, shadowRadius: 16, elevation: 8 },
    android: { elevation: 8 },
  }) ?? {},
} as const;

export type Shadows = typeof shadows;