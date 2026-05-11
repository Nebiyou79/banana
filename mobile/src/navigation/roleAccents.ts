// src/navigation/roleAccents.ts
// ─────────────────────────────────────────────────────────────────────────────
// Per-role accent palettes consumed by PillTabBar instances.
// Each role declares its own tab metadata (icon, label, accent colours).
// Import the relevant constant in the matching navigator; never reference
// another role's accents from inside a navigator.
// ─────────────────────────────────────────────────────────────────────────────

import type { PillTabMeta } from './PillTabBar';

// ─── Candidate ────────────────────────────────────────────────────────────────
export const CANDIDATE_TAB_META: Record<string, PillTabMeta> = {
  Home: {
    icon: 'home-outline',
    iconActive: 'home',
    label: 'Home',
    accentDark: '#60A5FA',
    accentLight: '#2563EB',
  },
  Jobs: {
    icon: 'briefcase-outline',
    iconActive: 'briefcase',
    label: 'Jobs',
    accentDark: '#34D399',
    accentLight: '#059669',
  },
  Social: {
    icon: 'globe-outline',
    iconActive: 'globe',
    label: 'Social',
    accentDark: '#D8B4FE',
    accentLight: '#7C3AED',
  },
  Profile: {
    icon: 'person-outline',
    iconActive: 'person',
    label: 'Profile',
    accentDark: '#F1BB03',
    accentLight: '#B45309',
  },
  More: {
    icon: 'grid-outline',
    iconActive: 'grid',
    label: 'More',
    accentDark: '#94A3B8',
    accentLight: '#64748B',
  },
};

// ─── Freelancer ───────────────────────────────────────────────────────────────
export const FREELANCER_TAB_META: Record<string, PillTabMeta> = {
  Home: {
    icon: 'home-outline',
    iconActive: 'home',
    label: 'Home',
    accentDark: '#60A5FA',
    accentLight: '#2563EB',
  },
  Tenders: {
    icon: 'document-text-outline',
    iconActive: 'document-text',
    label: 'Tenders',
    accentDark: '#34D399',
    accentLight: '#059669',
  },
  Social: {
    icon: 'people-outline',
    iconActive: 'people',
    label: 'Social',
    accentDark: '#D8B4FE',
    accentLight: '#7C3AED',
  },
  Profile: {
    icon: 'person-outline',
    iconActive: 'person',
    label: 'Profile',
    accentDark: '#F1BB03',
    accentLight: '#B45309',
  },
  More: {
    icon: 'grid-outline',
    iconActive: 'grid',
    label: 'More',
    accentDark: '#94A3B8',
    accentLight: '#64748B',
  },
};

// ─── Company ──────────────────────────────────────────────────────────────────
export const COMPANY_TAB_META: Record<string, PillTabMeta> = {
  Home: {
    icon: 'home-outline',
    iconActive: 'home',
    label: 'Home',
    accentDark: '#60A5FA',
    accentLight: '#2563EB',
  },
  Jobs: {
    icon: 'briefcase-outline',
    iconActive: 'briefcase',
    label: 'Jobs',
    accentDark: '#34D399',
    accentLight: '#059669',
  },
  Social: {
    icon: 'people-outline',
    iconActive: 'people',
    label: 'Social',
    accentDark: '#D8B4FE',
    accentLight: '#7C3AED',
  },
  Tenders: {
    icon: 'document-text-outline',
    iconActive: 'document-text',
    label: 'Tenders',
    accentDark: '#F1BB03',
    accentLight: '#B45309',
  },
  Profile: {
    icon: 'business-outline',
    iconActive: 'business',
    label: 'Profile',
    accentDark: '#FDBA74',
    accentLight: '#EA580C',
  },
  More: {
    icon: 'grid-outline',
    iconActive: 'grid',
    label: 'More',
    accentDark: '#94A3B8',
    accentLight: '#64748B',
  },
};

// ─── Organization ─────────────────────────────────────────────────────────────
export const ORGANIZATION_TAB_META: Record<string, PillTabMeta> = {
  Home: {
    icon: 'home-outline',
    iconActive: 'home',
    label: 'Home',
    accentDark: '#60A5FA',
    accentLight: '#2563EB',
  },
  Jobs: {
    icon: 'briefcase-outline',
    iconActive: 'briefcase',
    label: 'Jobs',
    accentDark: '#34D399',
    accentLight: '#059669',
  },
  Tenders: {
    icon: 'document-text-outline',
    iconActive: 'document-text',
    label: 'Tenders',
    accentDark: '#F1BB03',
    accentLight: '#B45309',
  },
  Profile: {
    icon: 'business-outline',
    iconActive: 'business',
    label: 'Profile',
    accentDark: '#FB923C',
    accentLight: '#EA580C',
  },
  More: {
    icon: 'grid-outline',
    iconActive: 'grid',
    label: 'More',
    accentDark: '#94A3B8',
    accentLight: '#64748B',
  },
};

// ─── Social (internal to SocialNavigator) ────────────────────────────────────
export const SOCIAL_TAB_META: Record<string, PillTabMeta> = {
  Posts: {
    icon: 'newspaper-outline',
    iconActive: 'newspaper',
    label: 'Posts',
    accentDark: '#34D399',
    accentLight: '#059669',
  },
  Network: {
    icon: 'people-outline',
    iconActive: 'people',
    label: 'Network',
    accentDark: '#F1BB03',
    accentLight: '#B45309',
  },
  Messages: {
    icon: 'chatbubble-ellipses-outline',
    iconActive: 'chatbubble-ellipses',
    label: 'Messages',
    accentDark: '#D8B4FE',
    accentLight: '#7C3AED',
  },
  Search: {
    icon: 'search-outline',
    iconActive: 'search',
    label: 'Search',
    accentDark: '#FDBA74',
    accentLight: '#EA580C',
  },
  Profile: {
    icon: 'person-circle-outline',
    iconActive: 'person-circle',
    label: 'Profile',
    accentDark: '#94A3B8',
    accentLight: '#64748B',
  },
};