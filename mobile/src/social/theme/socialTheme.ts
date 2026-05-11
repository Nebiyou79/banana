// src/social/theme/socialTheme.ts
// ─────────────────────────────────────────────────────────────────────────────
// ROLE-BACKGROUND SYSTEM — Mobile equivalent of the web RoleThemeProvider.
//
// Key principle: Each role owns its own bg gradient, card surface, border, and
// text palette — exactly as the web app does via getPageBgStyle() / getCardStyle().
//
// Web → Mobile mapping:
//   bgGradientDark / bgGradientLight  → bgGradient (rendered via LinearGradient)
//   cardBgDark / cardBgLight          → card (rgba string for View bg)
//   cardBorderDark / cardBorderLight  → cardBorder
//   colors.primary                    → primary
//   colors.secondary                  → secondary
//   colors.accent                     → accent
//
// Usage:
//   const { colors, bgGradient, card, cardBorder } = useSocialTheme();
//   <LinearGradient colors={bgGradient} style={StyleSheet.absoluteFill} />
//   <View style={{ backgroundColor: card, borderColor: cardBorder }} />
// ─────────────────────────────────────────────────────────────────────────────

import { useColorScheme } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import type { UserRole } from '../types';

/* ─── Types ─────────────────────────────────────────────────────────────────── */

export type RoleType = 'candidate' | 'company' | 'freelancer' | 'organization' | 'admin';

export interface RoleSurface {
  /** Two-stop gradient array — pass to expo-linear-gradient or react-native-linear-gradient */
  bgGradient:   [string, string];
  /** Solid fallback for platforms without LinearGradient */
  bgSolid:      string;
  /** Card / sheet background (semi-transparent rgba) */
  card:         string;
  /** Card border color */
  cardBorder:   string;
  /** Secondary surface (inputs, chips, dividers) */
  surface:      string;
  /** Navbar background (blurred, semi-transparent) */
  navBg:        string;
  /** Bottom tab bar background */
  tabBg:        string;
  /** Input field background */
  inputBg:      string;
}

export interface RolePalette {
  /** Main interactive color — buttons, links, active indicators */
  primary:      string;
  /** Lighter variant — icon fills, secondary actions */
  primaryLight: string;
  /** Second brand color — badges, gradients */
  secondary:    string;
  /** Accent color — highlights, sparkles, notifications */
  accent:       string;
  /** Ambient orb 1 background (decorative, very low opacity) */
  orb1:         string;
  /** Ambient orb 2 background */
  orb2:         string;
}

export interface RoleTypography {
  text:    string;  // primary text
  textSec: string;  // secondary text
  muted:   string;  // placeholder / muted
}

export interface RoleColors extends RoleSurface, RolePalette, RoleTypography {
  success: string;
  warning: string;
  error:   string;
  info:    string;
  white:   string;
  black:   string;
}

/* ─── Per-role, per-mode token maps ─────────────────────────────────────────── */

const DARK: Record<RoleType, RoleColors> = {
  candidate: {
    // Surfaces
    bgGradient:   ['#140B08', '#1F120D'],
    bgSolid:      '#140B08',
    card:         'rgba(31,18,13,0.97)',
    cardBorder:   'rgba(234,179,8,0.22)',
    surface:      'rgba(50,28,18,0.80)',
    navBg:        'rgba(20,11,8,0.90)',
    tabBg:        'rgba(20,11,8,0.96)',
    inputBg:      'rgba(50,28,18,0.70)',
    // Palette
    primary:      '#FB923C',
    primaryLight: '#FED7AA',
    secondary:    '#EAB308',
    accent:       '#FDE68A',
    orb1:         'rgba(251,146,60,0.08)',
    orb2:         'rgba(234,179,8,0.07)',
    // Typography
    text:         '#FEF3E2',
    textSec:      '#D4956A',
    muted:        '#92400E',
    // Semantic
    success:      '#34D399',
    warning:      '#FCD34D',
    error:        '#F87171',
    info:         '#60A5FA',
    white:        '#FFFFFF',
    black:        '#000000',
  },
  freelancer: {
    bgGradient:   ['#17110E', '#241B17'],
    bgSolid:      '#17110E',
    card:         'rgba(36,27,23,0.96)',
    cardBorder:   'rgba(212,163,115,0.25)',
    surface:      'rgba(55,40,32,0.80)',
    navBg:        'rgba(23,17,14,0.92)',
    tabBg:        'rgba(23,17,14,0.96)',
    inputBg:      'rgba(55,40,32,0.70)',
    primary:      '#D4A373',
    primaryLight: '#E9CBA7',
    secondary:    '#A1887F',
    accent:       '#F5DEB3',
    orb1:         'rgba(212,163,115,0.08)',
    orb2:         'rgba(161,136,127,0.06)',
    text:         '#F5E6D3',
    textSec:      '#C4956A',
    muted:        '#8D6E63',
    success:      '#6A994E',
    warning:      '#BC6C25',
    error:        '#9B2226',
    info:         '#8D6E63',
    white:        '#FFFFFF',
    black:        '#000000',
  },
  company: {
    bgGradient:   ['#0F172A', '#1E293B'],
    bgSolid:      '#0F172A',
    card:         'rgba(30,41,59,0.95)',
    cardBorder:   'rgba(108,138,255,0.28)',
    surface:      'rgba(38,52,75,0.80)',
    navBg:        'rgba(15,23,42,0.92)',
    tabBg:        'rgba(15,23,42,0.96)',
    inputBg:      'rgba(38,52,75,0.70)',
    primary:      '#6C8AFF',
    primaryLight: '#9DB3FF',
    secondary:    '#9D4EDD',
    accent:       '#4CC9F0',
    orb1:         'rgba(108,138,255,0.08)',
    orb2:         'rgba(157,78,221,0.06)',
    text:         '#E8EEFF',
    textSec:      '#94A3C8',
    muted:        '#5A6A9A',
    success:      '#10B981',
    warning:      '#F59E0B',
    error:        '#EF4444',
    info:         '#3B82F6',
    white:        '#FFFFFF',
    black:        '#000000',
  },
  organization: {
    bgGradient:   ['#0F1F3A', '#1A2F4A'],
    bgSolid:      '#0F1F3A',
    card:         'rgba(26,47,74,0.95)',
    cardBorder:   'rgba(95,160,255,0.28)',
    surface:      'rgba(34,58,90,0.80)',
    navBg:        'rgba(15,31,58,0.92)',
    tabBg:        'rgba(15,31,58,0.96)',
    inputBg:      'rgba(34,58,90,0.70)',
    primary:      '#5FA0FF',
    primaryLight: '#90C0FF',
    secondary:    '#FF7B3D',
    accent:       '#9D4EDD',
    orb1:         'rgba(95,160,255,0.08)',
    orb2:         'rgba(255,123,61,0.06)',
    text:         '#D8EAFF',
    textSec:      '#82A8D8',
    muted:        '#4A6A9A',
    success:      '#4CAF50',
    warning:      '#FF9800',
    error:        '#F44336',
    info:         '#2196F3',
    white:        '#FFFFFF',
    black:        '#000000',
  },
  admin: {
    bgGradient:   ['#1F0A3A', '#2A1A4A'],
    bgSolid:      '#1F0A3A',
    card:         'rgba(42,26,74,0.95)',
    cardBorder:   'rgba(167,139,250,0.28)',
    surface:      'rgba(55,35,90,0.80)',
    navBg:        'rgba(31,10,58,0.92)',
    tabBg:        'rgba(31,10,58,0.96)',
    inputBg:      'rgba(55,35,90,0.70)',
    primary:      '#A78BFA',
    primaryLight: '#C4B5FD',
    secondary:    '#34D399',
    accent:       '#D8B4FE',
    orb1:         'rgba(167,139,250,0.09)',
    orb2:         'rgba(52,211,153,0.07)',
    text:         '#EDE9FF',
    textSec:      '#A890D8',
    muted:        '#6A50A8',
    success:      '#10B981',
    warning:      '#F59E0B',
    error:        '#EF4444',
    info:         '#8B5CF6',
    white:        '#FFFFFF',
    black:        '#000000',
  },
};

const LIGHT: Record<RoleType, RoleColors> = {
  candidate: {
    bgGradient:   ['#FFF7ED', '#FFEDD5'],
    bgSolid:      '#FFF7ED',
    card:         'rgba(255,255,255,0.97)',
    cardBorder:   'rgba(194,65,12,0.22)',
    surface:      'rgba(255,237,213,0.60)',
    navBg:        'rgba(255,255,255,0.85)',
    tabBg:        'rgba(255,255,255,0.90)',
    inputBg:      'rgba(255,237,213,0.55)',
    primary:      '#C2410C',
    primaryLight: '#FB923C',
    secondary:    '#EAB308',
    accent:       '#A16207',
    orb1:         'rgba(194,65,12,0.07)',
    orb2:         'rgba(234,179,8,0.06)',
    text:         '#1A0E0C',
    textSec:      '#6E3B2E',
    muted:        '#92400E',
    success:      '#16A34A',
    warning:      '#D97706',
    error:        '#B91C1C',
    info:         '#92400E',
    white:        '#FFFFFF',
    black:        '#000000',
  },
  freelancer: {
    bgGradient:   ['#FAF8F5', '#F1ECE6'],
    bgSolid:      '#FAF8F5',
    card:         'rgba(255,255,255,0.96)',
    cardBorder:   'rgba(141,110,99,0.18)',
    surface:      'rgba(241,236,230,0.60)',
    navBg:        'rgba(255,255,255,0.88)',
    tabBg:        'rgba(255,255,255,0.92)',
    inputBg:      'rgba(241,236,230,0.55)',
    primary:      '#3A2E2A',
    primaryLight: '#8D6E63',
    secondary:    '#D4A373',
    accent:       '#B08968',
    orb1:         'rgba(58,46,42,0.06)',
    orb2:         'rgba(212,163,115,0.07)',
    text:         '#241B17',
    textSec:      '#5A4A42',
    muted:        '#8D6E63',
    success:      '#6A994E',
    warning:      '#BC6C25',
    error:        '#9B2226',
    info:         '#8D6E63',
    white:        '#FFFFFF',
    black:        '#000000',
  },
  company: {
    bgGradient:   ['#F8F9FF', '#F0F2FF'],
    bgSolid:      '#F8F9FF',
    card:         'rgba(248,249,255,0.95)',
    cardBorder:   'rgba(67,97,238,0.20)',
    surface:      'rgba(240,242,255,0.60)',
    navBg:        'rgba(255,255,255,0.88)',
    tabBg:        'rgba(255,255,255,0.92)',
    inputBg:      'rgba(240,242,255,0.55)',
    primary:      '#4361EE',
    primaryLight: '#6C8AFF',
    secondary:    '#7209B7',
    accent:       '#4CC9F0',
    orb1:         'rgba(67,97,238,0.06)',
    orb2:         'rgba(114,9,183,0.05)',
    text:         '#0F1535',
    textSec:      '#3A4A8A',
    muted:        '#6370AA',
    success:      '#10B981',
    warning:      '#F59E0B',
    error:        '#EF4444',
    info:         '#3B82F6',
    white:        '#FFFFFF',
    black:        '#000000',
  },
  organization: {
    bgGradient:   ['#F0F5FF', '#F8F0FF'],
    bgSolid:      '#F0F5FF',
    card:         'rgba(240,245,255,0.95)',
    cardBorder:   'rgba(58,134,255,0.20)',
    surface:      'rgba(232,240,255,0.60)',
    navBg:        'rgba(255,255,255,0.88)',
    tabBg:        'rgba(255,255,255,0.92)',
    inputBg:      'rgba(232,240,255,0.55)',
    primary:      '#3A86FF',
    primaryLight: '#5FA0FF',
    secondary:    '#FB5607',
    accent:       '#8338EC',
    orb1:         'rgba(58,134,255,0.06)',
    orb2:         'rgba(251,86,7,0.05)',
    text:         '#0A1828',
    textSec:      '#1A3A70',
    muted:        '#5A7AAA',
    success:      '#4CAF50',
    warning:      '#FF9800',
    error:        '#F44336',
    info:         '#2196F3',
    white:        '#FFFFFF',
    black:        '#000000',
  },
  admin: {
    bgGradient:   ['#F5F3FF', '#FDF4FF'],
    bgSolid:      '#F5F3FF',
    card:         'rgba(245,243,255,0.95)',
    cardBorder:   'rgba(124,58,237,0.20)',
    surface:      'rgba(237,233,254,0.60)',
    navBg:        'rgba(255,255,255,0.88)',
    tabBg:        'rgba(255,255,255,0.92)',
    inputBg:      'rgba(237,233,254,0.55)',
    primary:      '#7C3AED',
    primaryLight: '#A78BFA',
    secondary:    '#10B981',
    accent:       '#C084FC',
    orb1:         'rgba(124,58,237,0.06)',
    orb2:         'rgba(16,185,129,0.05)',
    text:         '#1A0A38',
    textSec:      '#4A2A88',
    muted:        '#7A5AB8',
    success:      '#10B981',
    warning:      '#F59E0B',
    error:        '#EF4444',
    info:         '#8B5CF6',
    white:        '#FFFFFF',
    black:        '#000000',
  },
};

/* ─── Role accent badges (used across all roles' feeds) ─────────────────────── */
// Each role sees other roles' posts — these are the badge/ring colors per role.

export const ROLE_COLORS: Record<RoleType, {
  primary: string; light: string; lighter: string; dark: string;
  gradient: [string, string]; adBorder: string; adBg: string;
  tabActive: string; splashGradient: [string, string, string];
}> = {
  candidate: {
    primary: '#C2410C', light: '#FB923C', lighter: '#FFEDD5', dark: '#9A3412',
    gradient: ['#9A3412', '#FB923C'], adBorder: '#FED7AA', adBg: '#FFF7ED',
    tabActive: '#C2410C', splashGradient: ['#140B08', '#9A3412', '#C2410C'],
  },
  freelancer: {
    primary: '#5A4A42', light: '#8D6E63', lighter: '#F1ECE6', dark: '#3A2E2A',
    gradient: ['#3A2E2A', '#8D6E63'], adBorder: '#D4A373', adBg: '#FAF8F5',
    tabActive: '#5A4A42', splashGradient: ['#17110E', '#3A2E2A', '#5A4A42'],
  },
  company: {
    primary: '#4361EE', light: '#6C8AFF', lighter: '#F0F2FF', dark: '#3A56D4',
    gradient: ['#3A56D4', '#6C8AFF'], adBorder: '#9DB3FF', adBg: '#F8F9FF',
    tabActive: '#4361EE', splashGradient: ['#0F172A', '#3A56D4', '#4361EE'],
  },
  organization: {
    primary: '#3A86FF', light: '#5FA0FF', lighter: '#F0F5FF', dark: '#2B6CD9',
    gradient: ['#2B6CD9', '#5FA0FF'], adBorder: '#90C0FF', adBg: '#F0F5FF',
    tabActive: '#3A86FF', splashGradient: ['#0F1F3A', '#2B6CD9', '#3A86FF'],
  },
  admin: {
    primary: '#7C3AED', light: '#A78BFA', lighter: '#F5F3FF', dark: '#5B21B6',
    gradient: ['#5B21B6', '#A78BFA'], adBorder: '#C4B5FD', adBg: '#F5F3FF',
    tabActive: '#7C3AED', splashGradient: ['#1F0A3A', '#5B21B6', '#7C3AED'],
  },
};

/* ─── Shared tokens ──────────────────────────────────────────────────────────── */

export const SPACING = { xs:4, sm:8, md:12, lg:16, xl:24, xxl:32 } as const;

export const RADIUS = { sm:6, md:10, lg:14, xl:20, pill:999 } as const;

export const TYPE = {
  display: { fontSize:24, fontWeight:'800' as const, lineHeight:30 },
  title:   { fontSize:18, fontWeight:'700' as const, lineHeight:24 },
  bodyMd:  { fontSize:15, fontWeight:'600' as const, lineHeight:21 },
  body:    { fontSize:14, fontWeight:'400' as const, lineHeight:20 },
  bodySm:  { fontSize:13, fontWeight:'500' as const, lineHeight:18 },
  caption: { fontSize:11, fontWeight:'500' as const, lineHeight:14 },
} as const;

export const ROLE_SPLASH_LABELS: Record<RoleType, { network: string; tagline: string }> = {
  candidate:    { network:'Candidate Network',   tagline:'Discover opportunities. Build your career.' },
  freelancer:   { network:'Freelancer Hub',       tagline:'Showcase talent. Win more clients.' },
  company:      { network:'Company Connect',      tagline:'Find talent. Build your team.' },
  organization: { network:'Organization Network', tagline:'Make impact. Grow your mission.' },
  admin:        { network:'Admin Dashboard',      tagline:'Manage the platform.' },
};

export const REACTION_EMOJI: Record<string, string> = {
  like:'👍', heart:'❤️', celebrate:'🎉', percent_100:'💯', clap:'👏',
};

/* ─── Utility ────────────────────────────────────────────────────────────────── */

export const withAlpha = (color: string, alpha: number): string => {
  const a = Math.max(0, Math.min(1, alpha));
  if (!color) return color;
  if (color.startsWith('#')) {
    let hex = color.slice(1);
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if (hex.length === 6) {
      const aa = Math.round(a * 255).toString(16).padStart(2, '0').toUpperCase();
      return `#${hex.toUpperCase()}${aa}`;
    }
    return color;
  }
  if (color.startsWith('rgb')) {
    const nums = color.match(/[\d.]+/g);
    if (nums && nums.length >= 3) return `rgba(${nums[0]}, ${nums[1]}, ${nums[2]}, ${a})`;
  }
  return color;
};

/* ─── Hook ───────────────────────────────────────────────────────────────────── */

export const useSocialTheme = () => {
  const role = (useAuthStore((s) => s.role) ?? 'candidate') as RoleType;
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const roleColors = dark ? DARK[role] : LIGHT[role];
  const roleC = ROLE_COLORS[role];

  // Flat colors object — same shape as before for backwards-compat
  const colors = {
    // ── Surfaces ─────────────────────────────────────────────────
    bg:           roleColors.bgSolid,
    bgGradient:   roleColors.bgGradient,
    card:         roleColors.card,
    cardAlt:      roleColors.surface,
    inputBg:      roleColors.inputBg,
    tabBg:        roleColors.tabBg,
    navBg:        roleColors.navBg,
    surface:      roleColors.surface,
    skeleton:     dark ? withAlpha(roleColors.primary, 0.15) : withAlpha(roleColors.primary, 0.08),
    overlay:      dark ? 'rgba(0,0,0,0.72)' : 'rgba(0,0,0,0.42)',
    orb1:         roleColors.orb1,
    orb2:         roleColors.orb2,
    // ── Borders ──────────────────────────────────────────────────
    border:       roleColors.cardBorder,
    borderAccent: withAlpha(roleColors.primary, 0.40),
    cardBorder:   roleColors.cardBorder,
    // ── Text ─────────────────────────────────────────────────────
    text:         roleColors.text,
    textMuted:    roleColors.textSec,
    subtext:      roleColors.textSec,
    muted:        roleColors.muted,
    // ── Role accent ──────────────────────────────────────────────
    primary:      roleColors.primary,
    primaryLight: roleColors.primaryLight,
    primaryLighter: roleC.lighter,
    primaryDark:  roleC.dark,
    secondary:    roleColors.secondary,
    accent:       roleColors.accent,
    // ── Semantic ─────────────────────────────────────────────────
    success:      roleColors.success,
    warning:      roleColors.warning,
    danger:       roleColors.error,
    error:        roleColors.error,
    info:         roleColors.info,
    // ── Constants ────────────────────────────────────────────────
    white:        roleColors.white,
    black:        roleColors.black,
    // ── Legacy web-style aliases ──────────────────────────────────
    cardBgLight:  LIGHT[role].card,
    cardBgDark:   DARK[role].card,
    cardBorderLight: LIGHT[role].cardBorder,
    cardBorderDark:  DARK[role].cardBorder,
  };

  return {
    role,
    dark,
    colors,
    // ── Background helpers (mirrors web getPageBgStyle / getCardStyle) ──
    /** Pass colors to expo-linear-gradient / react-native-linear-gradient */
    bgGradient: roleColors.bgGradient as [string, string],
    bgSolid:    roleColors.bgSolid,
    /** Inline style for card View */
    getCardStyle: () => ({
      backgroundColor: roleColors.card,
      borderColor:     roleColors.cardBorder,
      borderWidth:     1,
    }),
    /** Inline style for page-level background (use with LinearGradient) */
    getPageBgStyle: () => ({
      backgroundColor: roleColors.bgSolid,
    }),
    // ── Token sets ─────────────────────────────────────────────────
    roleColors:  ROLE_COLORS,
    spacing:     SPACING,
    radius:      RADIUS,
    type:        TYPE,
    withAlpha,
    // ── Legacy flat aliases ─────────────────────────────────────────
    primary:         roleColors.primary,
    primaryLight:    roleColors.primaryLight,
    primaryLighter:  roleC.lighter,
    primaryDark:     roleC.dark,
    secondary:       roleColors.secondary,
    accent:          roleColors.accent,
    gradient:        roleC.gradient,
    adBorder:        roleC.adBorder,
    adBg:            roleC.adBg,
    tabActive:       roleC.tabActive,
    splashGradient:  roleC.splashGradient,
    bg:              roleColors.bgSolid,
    card:            roleColors.card,
    cardAlt:         roleColors.surface,
    text:            roleColors.text,
    subtext:         roleColors.textSec,
    muted:           roleColors.muted,
    border:          roleColors.cardBorder,
    inputBg:         roleColors.inputBg,
    tabBg:           roleColors.tabBg,
    skeleton:        dark ? withAlpha(roleColors.primary, 0.15) : withAlpha(roleColors.primary, 0.08),
    overlay:         dark ? 'rgba(0,0,0,0.72)' : 'rgba(0,0,0,0.42)',
    reactions:       REACTION_EMOJI,
  };
};

export type SocialTheme = ReturnType<typeof useSocialTheme>;

// ─── Named exports for backwards-compat with existing index.ts ────────────────
// These are the "default" (candidate dark) values — runtime values come from hook.
export const DARK_SOCIAL  = DARK.candidate;
export const LIGHT_SOCIAL = LIGHT.candidate;