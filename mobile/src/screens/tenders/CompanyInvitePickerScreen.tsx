// ─────────────────────────────────────────────────────────────────────────────
//  src/screens/tenders/pickers/CompanyInvitePickerScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  Multi-select company picker for invite-only tenders (1.4).
//
//  Behavior:
//   • Debounced search box (300ms) drives useCompanySearch
//   • Currently-selected companies render as chips at the top, removable
//   • Tap a result to toggle selection
//   • On Done, returns the selected ids array via route.params.onPick
//   • Hydrates initial selection by calling getCompaniesByIds — needed so
//     edit-mode shows the names of previously-invited companies, not just ids
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeStore } from '../../store/themeStore';
import {
  useCompaniesByIds,
  useCompanySearch,
} from '../../hooks/useProfessionalTender';
import type { CompanyProfile, CompanySearchResult } from '../../services/companyService';

// ═════════════════════════════════════════════════════════════════════════════
//  ROUTE PARAMS
// ═════════════════════════════════════════════════════════════════════════════

interface RouteParams {
  /** Currently-selected company ids (form state). */
  selectedIds: string[];
  /** Called with the new selection when the user taps Done. */
  onPick: (ids: string[]) => void;
}

// ═════════════════════════════════════════════════════════════════════════════
//  HELPERS
// ═════════════════════════════════════════════════════════════════════════════

/** Stable map keyed by id, useful for chip rendering. */
const indexById = <T extends { _id: string }>(items: T[]): Record<string, T> => {
  const out: Record<string, T> = {};
  for (const it of items) out[it._id] = it;
  return out;
};

// ═════════════════════════════════════════════════════════════════════════════
//  SCREEN
// ═════════════════════════════════════════════════════════════════════════════

export const CompanyInvitePickerScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<{ key: string; name: string; params: RouteParams }>();
  const isDark = useThemeStore((s) => s.theme.isDark);

  const palette = useMemo(
    () => isDark
      ? { bg: '#0F172A', surface: '#1E293B', border: '#334155', text: '#F1F5F9', muted: '#94A3B8', primary: '#60A5FA', primaryFg: '#0F172A', inputBg: '#1E293B', chipBg: '#1E3A5F', chipFg: '#93C5FD' }
      : { bg: '#F8FAFC', surface: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', muted: '#64748B', primary: '#2563EB', primaryFg: '#FFFFFF', inputBg: '#FFFFFF', chipBg: '#DBEAFE', chipFg: '#1D4ED8' },
    [isDark],
  );

  const initialIds = route.params?.selectedIds ?? [];
  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);

  // Debounced search query
  const [rawQuery, setRawQuery] = useState('');
  const [query, setQuery] = useState('');
  useEffect(() => {
    const handle = setTimeout(() => setQuery(rawQuery), 300);
    return () => clearTimeout(handle);
  }, [rawQuery]);

  const { data: searchResults = [], isLoading: searching } = useCompanySearch(query);

  // Hydrate selected company profiles so chips show names, not ids
  const { data: selectedProfiles = [] } = useCompaniesByIds(selectedIds);
  const profilesById = useMemo(() => indexById(selectedProfiles), [selectedProfiles]);

  const isSelected = (id: string) => selectedIds.includes(id);

  const toggle = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const remove = (id: string) => setSelectedIds((prev) => prev.filter((x) => x !== id));

  const handleDone = () => {
    route.params?.onPick?.(selectedIds);
    navigation.goBack();
  };

  // Build the selected chips. Prefer profile names; fall back to id substrings
  // so the chip is always informative even when the profile fetch lags.
  const selectedChips = useMemo(() => {
    return selectedIds.map((id) => {
      const profile = profilesById[id];
      const display = profile?.name ?? `Company ${id.slice(-6)}`;
      return { id, display, profile };
    });
  }, [selectedIds, profilesById]);

  const renderResult = ({ item }: { item: CompanySearchResult }) => {
    const selected = isSelected(item._id);
    return (
      <Pressable
        onPress={() => toggle(item._id)}
        style={({ pressed }: { pressed: boolean }) => [
          styles.row,
          {
            backgroundColor: selected ? (isDark ? '#1E3A5F' : '#DBEAFE') : palette.surface,
            borderColor: selected ? palette.primary : palette.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={`${selected ? 'Deselect' : 'Select'} ${item.name}`}
      >
        <View style={[styles.avatar, { backgroundColor: palette.bg, borderColor: palette.border }]}>
          <Text style={[styles.avatarText, { color: palette.muted }]}>
            {item.name?.[0]?.toUpperCase() ?? 'C'}
          </Text>
        </View>
        <View style={styles.rowText}>
          <View style={styles.rowNameRow}>
            <Text style={[styles.rowName, { color: palette.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            {item.verified && (
              <Ionicons name="checkmark-circle" size={14} color={palette.primary} />
            )}
          </View>
          {!!item.industry && (
            <Text style={[styles.rowMeta, { color: palette.muted }]} numberOfLines={1}>
              {item.industry}
              {item.location ? ` · ${item.location}` : ''}
            </Text>
          )}
        </View>
        <Ionicons
          name={selected ? 'checkbox' : 'square-outline'}
          size={22}
          color={selected ? palette.primary : palette.muted}
        />
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.bg }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <View style={styles.headerTop}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Cancel without saving"
          >
            <Ionicons name="close" size={24} color={palette.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: palette.text }]}>Invite Companies</Text>
            <Text style={[styles.headerSub, { color: palette.muted }]}>
              {selectedIds.length} selected
            </Text>
          </View>
          <Pressable
            onPress={handleDone}
            disabled={selectedIds.length === 0}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Save and close picker"
          >
            <Text
              style={[
                styles.headerDone,
                { color: selectedIds.length === 0 ? palette.muted : palette.primary },
              ]}
            >
              Done
            </Text>
          </Pressable>
        </View>

        {/* Search */}
        <View style={[styles.searchBox, { backgroundColor: palette.inputBg, borderColor: palette.border }]}>
          <Ionicons name="search-outline" size={16} color={palette.muted} />
          <TextInput
            value={rawQuery}
            onChangeText={setRawQuery}
            placeholder="Search companies by name…"
            placeholderTextColor={palette.muted}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus={selectedIds.length === 0}
            style={[styles.searchInput, { color: palette.text }]}
            returnKeyType="search"
          />
          {rawQuery.length > 0 && (
            <Pressable onPress={() => setRawQuery('')} hitSlop={6}>
              <Ionicons name="close-circle" size={16} color={palette.muted} />
            </Pressable>
          )}
        </View>

        {/* Selected chips */}
        {selectedChips.length > 0 && (
          <View style={styles.chipsWrap}>
            {selectedChips.slice(0, 8).map(({ id, display }) => (
              <View key={id} style={[styles.chip, { backgroundColor: palette.chipBg }]}>
                <Text style={[styles.chipText, { color: palette.chipFg }]} numberOfLines={1}>
                  {display}
                </Text>
                <Pressable onPress={() => remove(id)} hitSlop={6}>
                  <Ionicons name="close" size={13} color={palette.chipFg} />
                </Pressable>
              </View>
            ))}
            {selectedChips.length > 8 && (
              <View style={[styles.chip, { backgroundColor: palette.chipBg }]}>
                <Text style={[styles.chipText, { color: palette.chipFg }]}>
                  +{selectedChips.length - 8} more
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Results */}
      {!query && selectedChips.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="search" size={36} color={palette.muted} />
          <Text style={[styles.hintTitle, { color: palette.text }]}>Find companies to invite</Text>
          <Text style={[styles.hintDesc, { color: palette.muted }]}>
            Search by name. Tap to select; tap again to deselect.
          </Text>
        </View>
      ) : searching && searchResults.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={(item: CompanySearchResult) => item._id}
          renderItem={renderResult}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            query ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="search-outline" size={28} color={palette.muted} />
                <Text style={[styles.emptyText, { color: palette.muted }]}>
                  No companies match “{query}”
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  STYLES
// ═════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 10, gap: 10, borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  headerSub:   { fontSize: 11, marginTop: 1 },
  headerDone:  { fontSize: 14, fontWeight: '700' },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 10,
    paddingRight: 8,
    paddingVertical: 4,
    borderRadius: 999,
    maxWidth: '100%',
  },
  chipText: { fontSize: 12, fontWeight: '600', maxWidth: 200 },

  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  hintTitle: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  hintDesc:  { fontSize: 12, lineHeight: 17, textAlign: 'center', maxWidth: 280 },

  list: { padding: 12, paddingBottom: 32 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 56,
  },
  avatar: {
    width: 36, height: 36,
    borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  avatarText: { fontSize: 14, fontWeight: '700' },
  rowText:    { flex: 1, gap: 2, minWidth: 0 },
  rowNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowName:    { fontSize: 14, fontWeight: '600', flex: 1 },
  rowMeta:    { fontSize: 11 },

  emptyWrap: { alignItems: 'center', gap: 6, paddingVertical: 32 },
  emptyText: { fontSize: 13, textAlign: 'center', maxWidth: 280 },
});

export default CompanyInvitePickerScreen;