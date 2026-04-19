import { useColorScheme } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import type { UserRole } from '../types';

export const ROLE_COLORS: Record<
  UserRole,
  {
    primary: string;
    light: string;
    lighter: string;
    dark: string;
    gradient: [string, string];
    adBorder: string;
    adBg: string;
    tabActive: string;
    splashGradient: [string, string, string];
  }
> = {
  candidate: {
    primary: '#2563EB',
    light: '#3B82F6',
    lighter: '#DBEAFE',
    dark: '#1D4ED8',
    gradient: ['#1D4ED8', '#3B82F6'],
    adBorder: '#93C5FD',
    adBg: '#EFF6FF',
    tabActive: '#2563EB',
    splashGradient: ['#1E3A8A', '#1D4ED8', '#3B82F6'],
  },
  freelancer: {
    primary: '#7C3AED',
    light: '#8B5CF6',
    lighter: '#EDE9FE',
    dark: '#6D28D9',
    gradient: ['#6D28D9', '#A78BFA'],
    adBorder: '#C4B5FD',
    adBg: '#F5F3FF',
    tabActive: '#7C3AED',
    splashGradient: ['#4C1D95', '#6D28D9', '#8B5CF6'],
  },
  company: {
    primary: '#059669',
    light: '#10B981',
    lighter: '#D1FAE5',
    dark: '#047857',
    gradient: ['#047857', '#34D399'],
    adBorder: '#6EE7B7',
    adBg: '#F0FDF4',
    tabActive: '#059669',
    splashGradient: ['#064E3B', '#047857', '#10B981'],
  },
  organization: {
    primary: '#EA580C',
    light: '#F97316',
    lighter: '#FEF3C7',
    dark: '#C2410C',
    gradient: ['#C2410C', '#FB923C'],
    adBorder: '#FED7AA',
    adBg: '#FFF7ED',
    tabActive: '#EA580C',
    splashGradient: ['#7C2D12', '#C2410C', '#F97316'],
  },
};

export const DARK_SOCIAL = {
  bg: '#0F172A',
  card: '#1E293B',
  cardAlt: '#263348',
  text: '#F8FAFC',
  subtext: '#94A3B8',
  muted: '#64748B',
  border: '#334155',
  inputBg: '#1E293B',
  tabBg: '#1E293B',
  skeleton: '#334155',
  overlay: 'rgba(0,0,0,0.75)',
} as const;

export const LIGHT_SOCIAL = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  cardAlt: '#F1F5F9',
  text: '#0F172A',
  subtext: '#475569',
  muted: '#94A3B8',
  border: '#E2E8F0',
  inputBg: '#F1F5F9',
  tabBg: '#FFFFFF',
  skeleton: '#E2E8F0',
  overlay: 'rgba(0,0,0,0.5)',
} as const;

export const ROLE_SPLASH_LABELS: Record<
  UserRole,
  { network: string; tagline: string }
> = {
  candidate: {
    network: 'Candidate Network',
    tagline: 'Discover opportunities. Build your career.',
  },
  freelancer: {
    network: 'Freelancer Hub',
    tagline: 'Showcase talent. Win more clients.',
  },
  company: {
    network: 'Company Connect',
    tagline: 'Find talent. Build your team.',
  },
  organization: {
    network: 'Organization Network',
    tagline: 'Make impact. Grow your mission.',
  },
};

export const REACTION_EMOJI: Record<string, string> = {
  like: '👍',
  love: '❤️',
  haha: '😄',
  wow: '😮',
  sad: '😢',
  angry: '😡',
};

export const useSocialTheme = () => {
  const role = (useAuthStore((s) => s.role) ?? 'candidate') as UserRole;
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const mode = dark ? DARK_SOCIAL : LIGHT_SOCIAL;
  const roleC = ROLE_COLORS[role];

  return {
    // Role identity
    role,
    primary: roleC.primary,
    primaryLight: roleC.light,
    primaryLighter: roleC.lighter,
    primaryDark: roleC.dark,
    gradient: roleC.gradient,
    adBorder: roleC.adBorder,
    adBg: roleC.adBg,
    tabActive: roleC.tabActive,
    splashGradient: roleC.splashGradient,
    // Mode-based
    bg: mode.bg,
    card: mode.card,
    cardAlt: mode.cardAlt,
    text: mode.text,
    subtext: mode.subtext,
    muted: mode.muted,
    border: mode.border,
    inputBg: mode.inputBg,
    tabBg: mode.tabBg,
    skeleton: mode.skeleton,
    overlay: mode.overlay,
    dark,
    // Reaction emoji map
    reactions: REACTION_EMOJI,
  };
};

export type SocialTheme = ReturnType<typeof useSocialTheme>;
