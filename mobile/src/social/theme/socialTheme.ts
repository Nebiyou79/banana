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
    // Surfaces — Glacier Mint
    bgGradient:   ['#081812', '#101E18'],
    bgSolid:      '#081812',
    card:         'rgba(16,30,24,0.97)',
    cardBorder:   'rgba(52,211,153,0.25)',
    surface:      'rgba(18,44,32,0.80)',
    navBg:        'rgba(8,24,18,0.90)',
    tabBg:        'rgba(8,24,18,0.96)',
    inputBg:      'rgba(18,44,32,0.70)',
    // Palette
    primary:      '#34D399',
    primaryLight: '#6EE7B7',
    secondary:    '#10B981',
    accent:       '#A7F3D0',
    orb1:         'rgba(52,211,153,0.08)',
    orb2:         'rgba(16,185,129,0.07)',
    // Typography
    text:         '#ECFDF5',
    textSec:      '#68C898',
    muted:        '#065F46',
    // Semantic
    success:      '#34D399',
    warning:      '#FCD34D',
    error:        '#F87171',
    info:         '#60A5FA',
    white:        '#FFFFFF',
    black:        '#000000',
  },
  freelancer: {
    // Surfaces — Teal Studio
    bgGradient:   ['#091213', '#0F1E20'],
    bgSolid:      '#091213',
    card:         'rgba(15,30,32,0.97)',
    cardBorder:   'rgba(20,184,166,0.25)',
    surface:      'rgba(20,42,45,0.80)',
    navBg:        'rgba(9,18,19,0.92)',
    tabBg:        'rgba(9,18,19,0.96)',
    inputBg:      'rgba(20,42,45,0.70)',
    // Palette
    primary:      '#2DD4BF',
    primaryLight: '#99F6E4',
    secondary:    '#0D9488',
    accent:       '#67E8F9',
    orb1:         'rgba(45,212,191,0.08)',
    orb2:         'rgba(13,148,136,0.06)',
    // Typography
    text:         '#F0FFFE',
    textSec:      '#70C8BC',
    muted:        '#0F766E',
    // Semantic
    success:      '#2DD4BF',
    warning:      '#BC6C25',
    error:        '#9B2226',
    info:         '#67E8F9',
    white:        '#FFFFFF',
    black:        '#000000',
  },
  company: {
    // Surfaces — Pacific Blue
    bgGradient:   ['#071428', '#0E1E38'],
    bgSolid:      '#071428',
    card:         'rgba(14,30,56,0.97)',
    cardBorder:   'rgba(56,189,248,0.25)',
    surface:      'rgba(16,40,70,0.80)',
    navBg:        'rgba(7,20,40,0.92)',
    tabBg:        'rgba(7,20,40,0.96)',
    inputBg:      'rgba(16,40,70,0.70)',
    // Palette
    primary:      '#38BDF8',
    primaryLight: '#BAE6FD',
    secondary:    '#0284C7',
    accent:       '#7DD3FC',
    orb1:         'rgba(56,189,248,0.08)',
    orb2:         'rgba(2,132,199,0.06)',
    // Typography
    text:         '#F0F9FF',
    textSec:      '#60A8C8',
    muted:        '#0369A1',
    // Semantic
    success:      '#10B981',
    warning:      '#F59E0B',
    error:        '#EF4444',
    info:         '#38BDF8',
    white:        '#FFFFFF',
    black:        '#000000',
  },
  organization: {
    // Surfaces — Purple Cause
    bgGradient:   ['#150F2A', '#201540'],
    bgSolid:      '#150F2A',
    card:         'rgba(32,21,64,0.97)',
    cardBorder:   'rgba(167,139,250,0.25)',
    surface:      'rgba(40,28,72,0.80)',
    navBg:        'rgba(21,15,42,0.92)',
    tabBg:        'rgba(21,15,42,0.96)',
    inputBg:      'rgba(40,28,72,0.70)',
    // Palette
    primary:      '#A78BFA',
    primaryLight: '#DDD6FE',
    secondary:    '#818CF8',
    accent:       '#C4B5FD',
    orb1:         'rgba(167,139,250,0.08)',
    orb2:         'rgba(129,140,248,0.06)',
    // Typography
    text:         '#F5F3FF',
    textSec:      '#9880D8',
    muted:        '#5B21B6',
    // Semantic
    success:      '#4CAF50',
    warning:      '#FF9800',
    error:        '#F44336',
    info:         '#A78BFA',
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
    // Surfaces — Midnight Teal
    bgGradient:   ['#F0FDFD', '#E0FAFA'],
    bgSolid:      '#F0FDFD',
    card:         'rgba(255,255,255,0.97)',
    cardBorder:   'rgba(20,184,166,0.20)',
    surface:      'rgba(204,251,241,0.60)',
    navBg:        'rgba(255,255,255,0.85)',
    tabBg:        'rgba(255,255,255,0.90)',
    inputBg:      'rgba(204,251,241,0.55)',
    // Palette
    primary:      '#0F766E',
    primaryLight: '#14B8A6',
    secondary:    '#134E4A',
    accent:       '#042F2E',
    orb1:         'rgba(15,118,110,0.07)',
    orb2:         'rgba(20,184,166,0.06)',
    // Typography
    text:         '#0A1818',
    textSec:      '#1A5050',
    muted:        '#3A7070',
    // Semantic
    success:      '#0F766E',
    warning:      '#D97706',
    error:        '#B91C1C',
    info:         '#14B8A6',
    white:        '#FFFFFF',
    black:        '#000000',
  },
  freelancer: {
    // Surfaces — Carbon & Lime
    bgGradient:   ['#FAFFFE', '#F2FFF0'],
    bgSolid:      '#FAFFFE',
    card:         'rgba(255,255,255,0.97)',
    cardBorder:   'rgba(101,163,13,0.20)',
    surface:      'rgba(220,252,190,0.60)',
    navBg:        'rgba(255,255,255,0.88)',
    tabBg:        'rgba(255,255,255,0.92)',
    inputBg:      'rgba(220,252,190,0.55)',
    // Palette
    primary:      '#3F6212',
    primaryLight: '#84CC16',
    secondary:    '#65A30D',
    accent:       '#365314',
    orb1:         'rgba(63,98,18,0.06)',
    orb2:         'rgba(101,163,13,0.07)',
    // Typography
    text:         '#0E180A',
    textSec:      '#3A5A12',
    muted:        '#6A8A30',
    // Semantic
    success:      '#65A30D',
    warning:      '#BC6C25',
    error:        '#9B2226',
    info:         '#3F6212',
    white:        '#FFFFFF',
    black:        '#000000',
  },
  company: {
    // Surfaces — Onyx & Azure
    bgGradient:   ['#FAFAFA', '#F3F4F6'],
    bgSolid:      '#FAFAFA',
    card:         'rgba(255,255,255,0.99)',
    cardBorder:   'rgba(37,99,235,0.20)',
    surface:      'rgba(243,244,246,0.80)',
    navBg:        'rgba(255,255,255,0.88)',
    tabBg:        'rgba(255,255,255,0.92)',
    inputBg:      'rgba(243,244,246,0.70)',
    // Palette
    primary:      '#1D4ED8',
    primaryLight: '#2563EB',
    secondary:    '#1E3A8A',
    accent:       '#1E40AF',
    orb1:         'rgba(29,78,216,0.06)',
    orb2:         'rgba(30,58,138,0.05)',
    // Typography
    text:         '#111827',
    textSec:      '#2A3A6A',
    muted:        '#4A5A8A',
    // Semantic
    success:      '#10B981',
    warning:      '#F59E0B',
    error:        '#EF4444',
    info:         '#1D4ED8',
    white:        '#FFFFFF',
    black:        '#000000',
  },
  organization: {
    // Surfaces — Ember & Violet
    bgGradient:   ['#FFF8F0', '#FAF0FF'],
    bgSolid:      '#FFF8F0',
    card:         'rgba(255,255,255,0.97)',
    cardBorder:   'rgba(234,88,12,0.18)',
    surface:      'rgba(255,237,213,0.60)',
    navBg:        'rgba(255,255,255,0.88)',
    tabBg:        'rgba(255,255,255,0.92)',
    inputBg:      'rgba(255,237,213,0.55)',
    // Palette
    primary:      '#C2410C',
    primaryLight: '#F97316',
    secondary:    '#7C3AED',
    accent:       '#6D28D9',
    orb1:         'rgba(194,65,12,0.07)',
    orb2:         'rgba(124,58,237,0.05)',
    // Typography
    text:         '#1A0808',
    textSec:      '#6A2818',
    muted:        '#9A2412',
    // Semantic
    success:      '#4CAF50',
    warning:      '#FF9800',
    error:        '#F44336',
    info:         '#7C3AED',
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
    primary: '#0F766E', light: '#14B8A6', lighter: '#F0FDFD', dark: '#134E4A',
    gradient: ['#134E4A', '#14B8A6'], adBorder: '#99F6E4', adBg: '#F0FDFD',
    tabActive: '#0F766E', splashGradient: ['#081812', '#134E4A', '#0F766E'],
  },
  freelancer: {
    primary: '#0D9488', light: '#2DD4BF', lighter: '#F0FDFD', dark: '#0F766E',
    gradient: ['#0F766E', '#2DD4BF'], adBorder: '#99F6E4', adBg: '#F0FDFA',
    tabActive: '#0D9488', splashGradient: ['#091213', '#0F766E', '#0D9488'],
  },
  company: {
    primary: '#1D4ED8', light: '#2563EB', lighter: '#F3F4F6', dark: '#1E3A8A',
    gradient: ['#1E3A8A', '#2563EB'], adBorder: '#BFDBFE', adBg: '#EFF6FF',
    tabActive: '#1D4ED8', splashGradient: ['#071428', '#1E3A8A', '#1D4ED8'],
  },
  organization: {
    primary: '#7C3AED', light: '#A78BFA', lighter: '#F5F3FF', dark: '#5B21B6',
    gradient: ['#5B21B6', '#A78BFA'], adBorder: '#DDD6FE', adBg: '#F5F3FF',
    tabActive: '#7C3AED', splashGradient: ['#150F2A', '#5B21B6', '#7C3AED'],
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