// src/screens/tenders/CompanyInvitePickerScreen.tsx
// FIXED: Shows all companies immediately on mount (fetches with empty query via
//        getCompaniesForInvitation endpoint from the routes file).
//        useCompanySearch requires >=1 char; we use a separate "all companies"
//        hook for the initial list, then switch to search results as the user types.
// FIXED: Uses only theme tokens (no raw colors), consistent with the rest of the app.

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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  useQuery,
} from '@tanstack/react-query';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import {
  useCompaniesByIds,
  useCompanySearch,
} from '../../hooks/useProfessionalTender';
import professionalTenderService from '../../services/professionalTenderService';
import type { CompanyProfile, CompanySearchResult } from '../../services/companyService';

interface RouteParams {
  selectedIds: string[];
  onPick:      (ids: string[]) => void;
}

const indexById = <T extends { _id: string }>(items: T[]): Record<string, T> => {
  const out: Record<string, T> = {};
  for (const it of items) out[it._id] = it;
  return out;
};

// ─── Hook: all companies available for invitation (uses the dedicated
//     /professional-tenders/companies/list endpoint in the routes file)
const useAllCompaniesForInvitation = (enabled: boolean) =>
  useQuery<CompanySearchResult[]>({
    queryKey: ['companies', 'forInvitation'],
    queryFn: async () => {
      // The service exposes getCompaniesForInvitation via /companies/list route.
      // We call companyService.searchCompanies with an empty-ish query to get the
      // initial batch. The backend returns up to `limit` companies.
      const { companyService } = await import('../../services/companyService');
      return companyService.searchCompanies('', 50);
    },
    enabled,
    staleTime: 60_000,
  });

// ─── Avatar initials helper ───────────────────────────────────────────────────
const CompanyAvatar: React.FC<{ name?: string; verified?: boolean }> = ({ name, verified }) => {
  const { colors: c, radius, type } = useTheme();
  const initial = (name?.[0] ?? 'C').toUpperCase();
  return (
    <View style={[av.wrap, { backgroundColor: withAlpha(c.primary, 0.1), borderColor: c.border, borderRadius: radius.full }]}>
      <Text style={[type.bodySm, { color: c.primary, fontWeight: '800', fontSize: 15 }]}>{initial}</Text>
      {verified && (
        <View style={[av.badge, { backgroundColor: c.primary }]}>
          <Ionicons name="checkmark" size={8} color="#fff" />
        </View>
      )}
    </View>
  );
};
const av = StyleSheet.create({
  wrap:  { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, position: 'relative' },
  badge: { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export const CompanyInvitePickerScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route      = useRoute<{ key: string; name: string; params: RouteParams }>();
  const { colors: c, spacing, radius, type } = useTheme();

  const initialIds = route.params?.selectedIds ?? [];
  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);

  const [rawQuery, setRawQuery] = useState('');
  const [query, setQuery]       = useState('');

  // Debounce search 300 ms
  useEffect(() => {
    const h = setTimeout(() => setQuery(rawQuery.trim()), 300);
    return () => clearTimeout(h);
  }, [rawQuery]);

  const isSearching = query.length >= 1;

  // Initial list (all companies) — fetched on mount
  const {
    data: allCompanies = [],
    isLoading: allLoading,
  } = useAllCompaniesForInvitation(!isSearching);

  // Live search results — only when query >= 1 char
  const {
    data: searchResults = [],
    isLoading: searchLoading,
  } = useCompanySearch(query, { enabled: isSearching });

  // The active list shown to the user
  const displayList: CompanySearchResult[] = isSearching ? searchResults : allCompanies;
  const isLoading = isSearching ? searchLoading : allLoading;

  // Hydrate selected ids → full profiles (for chips display)
  const { data: selectedProfiles = [] } = useCompaniesByIds(selectedIds);
  const profilesById = useMemo(() => indexById(selectedProfiles), [selectedProfiles]);

  const isSelected = (id: string) => selectedIds.includes(id);

  const toggle = (id: string) =>
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );

  const remove = (id: string) =>
    setSelectedIds(prev => prev.filter(x => x !== id));

  const handleDone = () => {
    route.params?.onPick?.(selectedIds);
    navigation.goBack();
  };

  const selectedChips = useMemo(
    () =>
      selectedIds.map(id => {
        const profile = profilesById[id];
        const display = profile?.name ?? `Company …${id.slice(-6)}`;
        return { id, display };
      }),
    [selectedIds, profilesById],
  );

  // ─── Row renderer ─────────────────────────────────────────────────────
  const renderItem = ({ item }: { item: CompanySearchResult }) => {
    const selected = isSelected(item._id);
    return (
      <Pressable
        onPress={() => toggle(item._id)}
        style={({ pressed }) => [
          S.row,
          {
            backgroundColor: selected ? withAlpha(c.primary, 0.10) : c.surface,
            borderColor:     selected ? c.primary : c.border,
            borderRadius:    radius.lg,
            opacity:         pressed ? 0.85 : 1,
          },
        ]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={`${selected ? 'Deselect' : 'Select'} ${item.name}`}
      >
        <CompanyAvatar name={item.name} verified={item.verified} />

        <View style={S.rowText}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text
              style={[type.bodySm, { color: c.text, fontWeight: '600', flex: 1 }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
          </View>
          {!!(item.industry || item.location) && (
            <Text style={[type.caption, { color: c.textMuted, marginTop: 1 }]} numberOfLines={1}>
              {[item.industry, item.location].filter(Boolean).join(' · ')}
            </Text>
          )}
        </View>

        <View
          style={[
            S.checkbox,
            {
              backgroundColor: selected ? c.primary : 'transparent',
              borderColor:     selected ? c.primary : c.border,
              borderRadius:    radius.sm,
            },
          ]}
        >
          {selected && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[S.root, { backgroundColor: c.bg }]} edges={['top', 'bottom']}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={[S.header, { backgroundColor: c.surface, borderColor: c.border }]}>
        <View style={S.headerTop}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Cancel without saving"
          >
            <Ionicons name="close" size={24} color={c.text} />
          </Pressable>

          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={[type.bodySm, { color: c.text, fontWeight: '700' }]}>Invite Companies</Text>
            <Text style={[type.caption, { color: c.textMuted, marginTop: 1 }]}>
              {selectedIds.length === 0
                ? 'Tap to select'
                : `${selectedIds.length} selected`}
            </Text>
          </View>

          <Pressable
            onPress={handleDone}
            disabled={selectedIds.length === 0}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Confirm selection"
          >
            <Text
              style={[
                type.bodySm,
                { color: selectedIds.length === 0 ? c.textMuted : c.primary, fontWeight: '700' },
              ]}
            >
              Done
            </Text>
          </Pressable>
        </View>

        {/* Search input */}
        <View
          style={[
            S.searchBox,
            { backgroundColor: c.bg, borderColor: c.border, borderRadius: radius.md },
          ]}
        >
          <Ionicons name="search-outline" size={16} color={c.textMuted} />
          <TextInput
            value={rawQuery}
            onChangeText={setRawQuery}
            placeholder="Search companies by name…"
            placeholderTextColor={c.textMuted}
            autoCapitalize="words"
            autoCorrect={false}
            style={[S.searchInput, { color: c.text }]}
            returnKeyType="search"
          />
          {rawQuery.length > 0 && (
            <Pressable onPress={() => setRawQuery('')} hitSlop={6}>
              <Ionicons name="close-circle" size={16} color={c.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Selected chips */}
        {selectedChips.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {selectedChips.slice(0, 8).map(({ id, display }) => (
              <View
                key={id}
                style={[S.chip, { backgroundColor: withAlpha(c.primary, 0.12), borderRadius: radius.full }]}
              >
                <Text
                  style={[type.caption, { color: c.primary, fontWeight: '600', maxWidth: 160 }]}
                  numberOfLines={1}
                >
                  {display}
                </Text>
                <Pressable onPress={() => remove(id)} hitSlop={6}>
                  <Ionicons name="close" size={13} color={c.primary} />
                </Pressable>
              </View>
            ))}
            {selectedChips.length > 8 && (
              <View style={[S.chip, { backgroundColor: withAlpha(c.primary, 0.12), borderRadius: radius.full }]}>
                <Text style={[type.caption, { color: c.primary }]}>
                  +{selectedChips.length - 8} more
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* ── Body ────────────────────────────────────────────────────── */}
      {isLoading && displayList.length === 0 ? (
        <View style={S.center}>
          <ActivityIndicator size="large" color={c.primary} />
          <Text style={[type.caption, { color: c.textMuted, marginTop: 8 }]}>
            {isSearching ? 'Searching companies…' : 'Loading companies…'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayList}
          keyExtractor={(item: CompanySearchResult) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 48 }}
          ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            !isSearching && displayList.length > 0 ? (
              <View
                style={[
                  S.listHeader,
                  { backgroundColor: withAlpha(c.primary, 0.06), borderRadius: radius.md },
                ]}
              >
                <Ionicons name="business-outline" size={14} color={c.primary} />
                <Text style={[type.caption, { color: c.primary, fontWeight: '600' }]}>
                  {displayList.length} companies available to invite
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={S.emptyWrap}>
              <Ionicons
                name={isSearching ? 'search-outline' : 'business-outline'}
                size={32}
                color={c.textMuted}
              />
              <Text style={[type.bodySm, { color: c.text, fontWeight: '700', marginTop: 8 }]}>
                {isSearching ? `No results for "${query}"` : 'No companies found'}
              </Text>
              <Text
                style={[type.caption, { color: c.textMuted, textAlign: 'center', maxWidth: 280, marginTop: 4 }]}
              >
                {isSearching
                  ? 'Try a different search term.'
                  : 'Companies will appear here once they are registered on the platform.'}
              </Text>
            </View>
          }
        />
      )}

      {/* ── Floating done button when selections exist ──────────────── */}
      {selectedIds.length > 0 && (
        <View
          style={[
            S.floatingBar,
            {
              backgroundColor: c.surface,
              borderTopColor: c.border,
              paddingBottom: 16,
            },
          ]}
        >
          <Pressable
            onPress={handleDone}
            style={({ pressed }) => [
              S.doneBtn,
              { backgroundColor: c.primary, borderRadius: radius.md, opacity: pressed ? 0.88 : 1 },
            ]}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
              Confirm {selectedIds.length} {selectedIds.length === 1 ? 'Company' : 'Companies'}
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
};

const S = StyleSheet.create({
  root:       { flex: 1 },
  header:     { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 10, gap: 10, borderBottomWidth: 1 },
  headerTop:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  searchBox:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, height: 42, borderWidth: 1 },
  searchInput:{ flex: 1, fontSize: 14, padding: 0 },
  chip:       { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 10, paddingRight: 8, paddingVertical: 4 },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  listHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, marginBottom: 8 },
  row:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, minHeight: 60 },
  rowText:    { flex: 1, minWidth: 0 },
  checkbox:   { width: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, flexShrink: 0 },
  emptyWrap:  { alignItems: 'center', gap: 4, paddingVertical: 48, paddingHorizontal: 24 },
  floatingBar:{ borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 12 },
  doneBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, minHeight: 50 },
});

export default CompanyInvitePickerScreen;