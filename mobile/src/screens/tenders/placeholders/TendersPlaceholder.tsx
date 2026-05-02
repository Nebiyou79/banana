// ─────────────────────────────────────────────────────────────────────────────
//  src/screens/tenders/placeholders/TendersPlaceholder.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  A self-documenting placeholder for screens that the navigator wires up but
//  haven't been built yet.  Renders the screen name + intended purpose so
//  testers and future contributors know what should live here.
//
//  Replace each placeholder with the real screen as it gets built.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../../../store/themeStore';

export interface TendersPlaceholderProps {
  /** Screen name shown in big text. */
  title: string;
  /** Short description of what the real screen will do. */
  description: string;
  /** Ionicon name. Default: 'construct-outline'. */
  icon?: string;
  /** Module hint shown in a chip — e.g. "Prompt 6", "Module 5: Bids". */
  module?: string;
}

export const TendersPlaceholder: React.FC<TendersPlaceholderProps> = ({
  title,
  description,
  icon = 'construct-outline',
  module: moduleHint,
}) => {
  const navigation = useNavigation<any>();
  const isDark = useThemeStore((s) => s.theme.isDark);

  const palette = isDark
    ? { bg: '#0F172A', surface: '#1E293B', border: '#334155', text: '#F1F5F9', muted: '#94A3B8', accent: '#60A5FA', chipBg: '#1E3A5F', chipFg: '#93C5FD' }
    : { bg: '#F8FAFC', surface: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', muted: '#64748B', accent: '#2563EB', chipBg: '#DBEAFE', chipFg: '#1D4ED8' };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.bg }]} edges={['bottom']}>
      <View style={styles.container}>
        <View style={[styles.iconWrap, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Ionicons name={icon as any} size={42} color={palette.accent} />
        </View>

        <Text style={[styles.title, { color: palette.text }]}>{title}</Text>

        {!!moduleHint && (
          <View style={[styles.chip, { backgroundColor: palette.chipBg }]}>
            <Ionicons name="layers-outline" size={11} color={palette.chipFg} />
            <Text style={[styles.chipText, { color: palette.chipFg }]}>{moduleHint}</Text>
          </View>
        )}

        <Text style={[styles.description, { color: palette.muted }]}>
          {description}
        </Text>

        <Text style={[styles.hint, { color: palette.muted }]}>
          This screen is wired up and reachable, but the full implementation
          ships in a later prompt.
        </Text>

        {navigation.canGoBack() && (
          <Pressable
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, { backgroundColor: palette.accent }]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={15} color="#FFFFFF" />
            <Text style={styles.backBtnLabel}>Back</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  PRE-CONFIGURED PLACEHOLDERS
//  Each maps to a navigator screen name. Wiring these instead of the generic
//  PlaceholderScreen makes the demo navigable AND keeps each TODO labeled.
// ═════════════════════════════════════════════════════════════════════════════

export const FreelanceTendersListPlaceholder = () => (
  <TendersPlaceholder
    title="My Freelance Tenders"
    description="Lists every freelance tender this account has created. Tap one to manage applicants."
    icon="people-outline"
    module="Freelance Tenders Module"
  />
);

export const FreelanceTendersCreatePlaceholder = () => (
  <TendersPlaceholder
    title="Create Freelance Tender"
    description="Posts a new freelance tender — engagement type, budget, deadline, screening questions."
    icon="add-circle-outline"
    module="Freelance Tenders Module"
  />
);

export const BrowseProfessionalTendersPlaceholder = () => (
  <TendersPlaceholder
    title="Browse Professional Tenders"
    description="Browse professional tenders from other companies and organizations. Filter by category, deadline, workflow type."
    icon="search-outline"
    module="Prompt 6 — Bidder Screens"
  />
);

export const ProposalsListPlaceholder = () => (
  <TendersPlaceholder
    title="Proposals"
    description="Proposals received on your freelance tenders. Review, shortlist, accept, or reject."
    icon="documents-outline"
    module="Freelance Tenders Module"
  />
);

export const ReceivedBidsListPlaceholder = () => (
  <TendersPlaceholder
    title="Received Bids"
    description="A roll-up of bids received across all your professional tenders. Tap a tender to drill into its bid list."
    icon="inbox-outline"
    module="Bids Module"
  />
);

export const MyBidsPlaceholder = () => (
  <TendersPlaceholder
    title="My Bids"
    description="Bids this company has submitted on professional tenders posted by other companies/organizations."
    icon="paper-plane-outline"
    module="Bids Module"
  />
);

// ═════════════════════════════════════════════════════════════════════════════
//  STYLES
// ═════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center', justifyContent: 'center',
    gap: 12,
    padding: 28,
  },
  iconWrap: {
    width: 88, height: 88,
    borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 4,
  },
  title:       { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  description: { fontSize: 14, lineHeight: 20, textAlign: 'center', maxWidth: 320 },
  hint:        { fontSize: 11, fontStyle: 'italic', textAlign: 'center', maxWidth: 280, marginTop: 4 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 4,
  },
  chipText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
    minHeight: 40,
  },
  backBtnLabel: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
});

export default TendersPlaceholder;
