// src/screens/tenders/placeholders/TendersPlaceholder.tsx
// ─── Branded Tenders Placeholder Screen ───────────────────────────────────────
// Uses tenderlogo.png branding. Dark/light mode. Premium design.
// Replace each placeholder with real screen as it gets built.

import React from 'react';
import { Pressable, StyleSheet, Text, View, Image, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../../../store/themeStore';

const { width } = Dimensions.get('window');

export interface TendersPlaceholderProps {
  title:       string;
  description: string;
  icon?:       string;
  module?:     string;
}

// ── Palette ────────────────────────────────────────────────────────────────────
const DARK = {
  bg:       '#050D1A',
  bgCard:   '#0A1628',
  gold:     '#F1BB03',
  goldDim:  'rgba(241,187,3,0.12)',
  goldBdr:  'rgba(241,187,3,0.22)',
  text:     '#F8FAFC',
  textSec:  '#CBD5E1',
  muted:    '#64748B',
  border:   'rgba(255,255,255,0.08)',
  chipBg:   'rgba(241,187,3,0.14)',
  chipFg:   '#F1BB03',
  iconBg:   '#0A1628',
  btnBg:    '#F1BB03',
  btnText:  '#050D1A',
  dot:      'rgba(241,187,3,0.18)',
};

const LIGHT = {
  bg:       '#FAFAF8',
  bgCard:   '#FFFFFF',
  gold:     '#B45309',
  goldDim:  'rgba(180,83,9,0.08)',
  goldBdr:  'rgba(180,83,9,0.20)',
  text:     '#0A1628',
  textSec:  '#334155',
  muted:    '#64748B',
  border:   'rgba(0,0,0,0.08)',
  chipBg:   'rgba(180,83,9,0.10)',
  chipFg:   '#92400E',
  iconBg:   '#FFFFFF',
  btnBg:    '#B45309',
  btnText:  '#FFFFFF',
  dot:      'rgba(180,83,9,0.12)',
};

// Decorative dots
const DOTS: [number, number][] = [
  [24, 80], [100, 40], [300, 65], [350, 185],
  [50, 310], [270, 290], [130, 490], [320, 520],
];

export const TendersPlaceholder: React.FC<TendersPlaceholderProps> = ({
  title,
  description,
  icon = 'construct-outline',
  module: moduleHint,
}) => {
  const navigation = useNavigation<any>();
  const isDark     = useThemeStore((s) => s.theme.isDark);
  const p          = isDark ? DARK : LIGHT;

  return (
    <SafeAreaView style={[S.root, { backgroundColor: p.bg }]} edges={['bottom']}>

      {/* Decorative background dots */}
      {DOTS.map(([x, y], i) => (
        <View key={i} style={[S.dot, { left: x, top: y, backgroundColor: p.dot }]} />
      ))}

      {/* Atmosphere blobs */}
      <View style={[S.blob, { top: -60, right: -60, backgroundColor: p.goldDim }]} />
      <View style={[S.blob, { bottom: -80, left: -70, backgroundColor: p.goldDim, width: 300, height: 300 }]} />

      <View style={S.container}>

        {/* Logo watermark */}
        <View style={S.logoWrap}>
          <Image
            source={require('../../../../assets/tenderlogo.png')}
            style={S.logoThumb}
            resizeMode="contain"
          />
        </View>

        {/* Icon circle */}
        <View style={[S.iconWrap, {
          backgroundColor: p.iconBg,
          borderColor: p.goldBdr,
          shadowColor: p.gold,
        }]}>
          <View style={[S.iconGlow, { backgroundColor: p.gold }]} />
          <Ionicons name={icon as any} size={40} color={p.gold} />
        </View>

        {/* Module chip */}
        {!!moduleHint && (
          <View style={[S.chip, { backgroundColor: p.chipBg, borderColor: p.goldBdr }]}>
            <Ionicons name="layers-outline" size={11} color={p.chipFg} />
            <Text style={[S.chipText, { color: p.chipFg }]}>{moduleHint}</Text>
          </View>
        )}

        {/* Title */}
        <Text style={[S.title, { color: p.text }]}>{title}</Text>

        {/* Divider */}
        <View style={S.dividerRow}>
          <View style={[S.divLine, { backgroundColor: p.goldBdr }]} />
          <View style={[S.divDot, { backgroundColor: p.gold }]} />
          <View style={[S.divLine, { backgroundColor: p.goldBdr }]} />
        </View>

        {/* Description */}
        <Text style={[S.description, { color: p.textSec }]}>{description}</Text>

        {/* Hint card */}
        <View style={[S.hintCard, { backgroundColor: p.bgCard, borderColor: p.border }]}>
          <Ionicons name="time-outline" size={14} color={p.muted} />
          <Text style={[S.hint, { color: p.muted }]}>
            This screen is wired up but ships in a later module.
          </Text>
        </View>

        {/* Back button */}
        {navigation.canGoBack() && (
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [S.backBtn, {
              backgroundColor: p.btnBg,
              opacity: pressed ? 0.85 : 1,
            }]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={16} color={p.btnText} />
            <Text style={[S.backBtnLabel, { color: p.btnText }]}>Go Back</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
};

// ── Pre-configured placeholders ────────────────────────────────────────────────

export const FreelanceTendersListPlaceholder = () => (
  <TendersPlaceholder
    title="My Freelance Tenders"
    description="Lists every freelance tender this account has created. Tap one to manage applicants and track responses."
    icon="people-outline"
    module="Freelance Tenders Module"
  />
);

export const FreelanceTendersCreatePlaceholder = () => (
  <TendersPlaceholder
    title="Create Freelance Tender"
    description="Post a new freelance tender — set engagement type, budget range, deadline, and screening questions."
    icon="add-circle-outline"
    module="Freelance Tenders Module"
  />
);

export const BrowseProfessionalTendersPlaceholder = () => (
  <TendersPlaceholder
    title="Browse Professional Tenders"
    description="Discover professional tenders from companies and organizations. Filter by category, deadline, and workflow type."
    icon="search-outline"
    module="Prompt 6 — Bidder Screens"
  />
);

export const ProposalsListPlaceholder = () => (
  <TendersPlaceholder
    title="Proposals"
    description="Review proposals received on your freelance tenders. Shortlist, accept, or reject with one tap."
    icon="documents-outline"
    module="Freelance Tenders Module"
  />
);

export const ReceivedBidsListPlaceholder = () => (
  <TendersPlaceholder
    title="Received Bids"
    description="A unified roll-up of bids received across all your professional tenders. Drill into each tender for details."
    icon="inbox-outline"
    module="Bids Module"
  />
);

export const MyBidsPlaceholder = () => (
  <TendersPlaceholder
    title="My Bids"
    description="Track bids this company has submitted on professional tenders posted by other companies and organizations."
    icon="paper-plane-outline"
    module="Bids Module"
  />
);

// ── Styles ─────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root: { flex: 1 },

  dot:  { position: 'absolute', width: 3, height: 3, borderRadius: 2 },
  blob: { position: 'absolute', width: 260, height: 260, borderRadius: 999 },

  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 32,
    paddingVertical: 24,
  },

  logoWrap:  { marginBottom: 4, opacity: 0.7 },
  logoThumb: { width: 56, height: 56 },

  iconWrap: {
    width: 92, height: 92,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  iconGlow: {
    position: 'absolute',
    width: 60, height: 60,
    borderRadius: 30,
    opacity: 0.10,
  },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  title: { fontSize: 24, fontWeight: '900', textAlign: 'center', letterSpacing: -0.2 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  divLine:    { width: 40, height: 1 },
  divDot:     { width: 6, height: 6, borderRadius: 3 },

  description: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },

  hintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    maxWidth: 300,
    marginTop: 4,
  },
  hint: { fontSize: 12, flex: 1, lineHeight: 18 },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24, paddingVertical: 13,
    borderRadius: 14,
    marginTop: 8,
    minHeight: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  backBtnLabel: { fontSize: 14, fontWeight: '800' },
});

export default TendersPlaceholder;