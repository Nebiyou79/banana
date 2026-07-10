// ─────────────────────────────────────────────────────────────────────────────
//  src/screens/tenders/CompanyInvitePickerScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  FIXED:
//   • Uses GET /professional-tenders/companies/list (getCompaniesForInvitation)
//   • Loads ALL companies on mount (no search required to see results)
//   • Debounced search 300ms, infinite scroll pagination via FlashList
//   • Avatars through TenderOwnerAvatar (Profile architecture, Cloudinary)
//   • Zero hardcoded colors — 100% useTheme() tokens
//   • Floating "Confirm N Companies" CTA, selected chips row

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery } from '@tanstack/react-query';

import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import TenderOwnerAvatar from '../../components/shared/TenderOwnerAvatar';
import api from '../../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InviteCompany {
  _id:       string;
  name:      string;
  industry:  string;
  headline:  string;
  verified:  boolean;
  avatarUrl: string | null;
}

interface CompanyPage {
  companies:  InviteCompany[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

interface RouteParams {
  selectedIds: string[];
  onPick:      (ids: string[]) => void;
}

// ─── API ──────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

async function fetchCompanies(page: number, search: string): Promise<CompanyPage> {
  const params: Record<string, string | number> = { page, limit: PAGE_SIZE };
  if (search) params.search = search;
  const res = await api.get<{ success: boolean; data: CompanyPage }>(
    '/professional-tenders/companies/list',
    { params },
  );
  if (!res.data?.success) throw new Error('Failed to fetch companies');
  return res.data.data;
}

// ─── Company row ──────────────────────────────────────────────────────────────

const CompanyRow = React.memo<{
  item: InviteCompany;
  isSelected: boolean;
  onToggle: (id: string) => void;
}>(({ item, isSelected, onToggle }) => {
  const { colors, radius, type } = useTheme();
  return (
    <Pressable
      onPress={() => onToggle(item._id)}
      style={({ pressed }) => [
        rowS.root,
        {
          backgroundColor: isSelected ? withAlpha(colors.primary, 0.10) : colors.surface,
          borderColor:     isSelected ? colors.primary : colors.border,
          borderRadius:    radius.lg,
          opacity:         pressed ? 0.86 : 1,
        },
      ]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isSelected }}
      accessibilityLabel={`${isSelected ? 'Deselect' : 'Select'} ${item.name}`}
    >
      <TenderOwnerAvatar
        name={item.name}
        avatarUrl={item.avatarUrl}
        verified={item.verified}
        role="company"
        size={44}
        showBadge={item.verified}
      />
      <View style={rowS.text}>
        <View style={rowS.nameRow}>
          <Text style={[type.bodySm, { color: colors.text, fontWeight: '600', flex: 1 }]} numberOfLines={1}>
            {item.name}
          </Text>
          {item.verified && <Ionicons name="checkmark-circle" size={14} color={colors.success} />}
        </View>
        {!!(item.industry || item.headline) && (
          <Text style={[type.caption, { color: colors.textMuted, marginTop: 1 }]} numberOfLines={1}>
            {[item.industry, item.headline].filter(Boolean).join(' · ')}
          </Text>
        )}
      </View>
      <View
        style={[
          rowS.checkbox,
          {
            backgroundColor: isSelected ? colors.primary : 'transparent',
            borderColor:     isSelected ? colors.primary : colors.border,
            borderRadius:    radius.sm,
          },
        ]}
      >
        {isSelected && <Ionicons name="checkmark" size={14} color={colors.textInverse} />}
      </View>
    </Pressable>
  );
});
CompanyRow.displayName = 'CompanyRow';

const rowS = StyleSheet.create({
  root:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, minHeight: 64 },
  text:     { flex: 1, minWidth: 0 },
  nameRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  checkbox: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, flexShrink: 0 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export const CompanyInvitePickerScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route      = useRoute<{ key: string; name: string; params: RouteParams }>();
  const { colors, spacing, radius, type } = useTheme();
  const insets = useSafeAreaInsets();

  const initialIds: string[] = route.params?.selectedIds ?? [];
  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);

  // Debounced search
  const [rawQuery, setRawQuery] = useState('');
  const [query,    setQuery]    = useState('');
  useEffect(() => {
    const h = setTimeout(() => setQuery(rawQuery.trim()), 300);
    return () => clearTimeout(h);
  }, [rawQuery]);

  // Infinite query — loads on mount even with empty query
  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage, isError, refetch } =
    useInfiniteQuery<CompanyPage, Error>({
      queryKey:         ['companies', 'forInvitation', query],
      queryFn:          ({ pageParam = 1 }) => fetchCompanies(pageParam as number, query),
      getNextPageParam: (last) =>
        last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
      initialPageParam: 1,
      staleTime:        60_000,
    });

  const companies: InviteCompany[] = useMemo(
    () => (data?.pages ?? []).flatMap((p) => p.companies),
    [data],
  );
  const totalCount = data?.pages?.[0]?.pagination?.total ?? 0;

  // Selection
  const isSelected = useCallback((id: string) => selectedIds.includes(id), [selectedIds]);
  const toggle     = useCallback((id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }, []);
  const remove     = useCallback((id: string) => setSelectedIds((prev) => prev.filter((x) => x !== id)), []);

  const handleDone = useCallback(() => {
    route.params?.onPick?.(selectedIds);
    navigation.goBack();
  }, [selectedIds, route.params, navigation]);

  // Name/avatar map for chips
  const companyMap = useMemo(() => {
    const m: Record<string, InviteCompany> = {};
    for (const c of companies) m[c._id] = c;
    return m;
  }, [companies]);

  const selectedChips = useMemo(
    () => selectedIds.map((id) => ({
      id,
      name:      companyMap[id]?.name      ?? `…${id.slice(-6)}`,
      avatarUrl: companyMap[id]?.avatarUrl ?? null,
    })),
    [selectedIds, companyMap],
  );

  const renderItem  = useCallback(({ item }: { item: InviteCompany }) => (
    <CompanyRow item={item} isSelected={isSelected(item._id)} onToggle={toggle} />
  ), [isSelected, toggle]);

  const keyExtractor  = useCallback((item: InviteCompany) => item._id, []);
  const onEndReached  = useCallback(() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <SafeAreaView style={[S.root, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <View style={[S.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={S.headerTop}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Cancel">
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={[type.bodySm, { color: colors.text, fontWeight: '700' }]}>Invite Companies</Text>
            {totalCount > 0 && (
              <Text style={[type.caption, { color: colors.textMuted, marginTop: 1 }]}>
                {selectedIds.length > 0
                  ? `${selectedIds.length} selected · ${totalCount} available`
                  : `${totalCount} companies`}
              </Text>
            )}
          </View>
          <Pressable onPress={handleDone} disabled={selectedIds.length === 0} hitSlop={10} accessibilityRole="button">
            <Text style={[type.bodySm, { color: selectedIds.length === 0 ? colors.textMuted : colors.primary, fontWeight: '700' }]}>
              Done
            </Text>
          </Pressable>
        </View>

        {/* Search */}
        <View style={[S.searchBox, { backgroundColor: colors.inputBg ?? colors.bg, borderColor: colors.inputBorder ?? colors.border, borderRadius: radius.md }]}>
          <Ionicons name="search-outline" size={16} color={colors.textMuted} />
          <TextInput
            value={rawQuery}
            onChangeText={setRawQuery}
            placeholder="Search by name or industry…"
            placeholderTextColor={colors.inputPlaceholder ?? colors.textMuted}
            autoCapitalize="words"
            autoCorrect={false}
            style={[S.searchInput, { color: colors.text }]}
            returnKeyType="search"
          />
          {rawQuery.length > 0 && (
            <Pressable onPress={() => setRawQuery('')} hitSlop={6}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Selected chips */}
        {selectedChips.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {selectedChips.slice(0, 8).map(({ id, name, avatarUrl }) => (
              <View key={id} style={[S.chip, { backgroundColor: withAlpha(colors.primary, 0.12), borderRadius: radius.full }]}>
                <TenderOwnerAvatar name={name} avatarUrl={avatarUrl} size={18} showBadge={false} />
                <Text style={[type.caption, { color: colors.primary, fontWeight: '600', maxWidth: 140 }]} numberOfLines={1}>{name}</Text>
                <Pressable onPress={() => remove(id)} hitSlop={6}>
                  <Ionicons name="close" size={13} color={colors.primary} />
                </Pressable>
              </View>
            ))}
            {selectedChips.length > 8 && (
              <View style={[S.chip, { backgroundColor: withAlpha(colors.primary, 0.12), borderRadius: radius.full }]}>
                <Text style={[type.caption, { color: colors.primary }]}>+{selectedChips.length - 8} more</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* ── Body ────────────────────────────────────────────────────── */}
      {isLoading && companies.length === 0 ? (
        <View style={S.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[type.caption, { color: colors.textMuted, marginTop: 8 }]}>Loading companies…</Text>
        </View>
      ) : isError ? (
        <View style={S.center}>
          <Ionicons name="alert-circle-outline" size={32} color={colors.textMuted} />
          <Text style={[type.bodySm, { color: colors.text, marginTop: 8 }]}>Couldn't load companies</Text>
          <Pressable onPress={() => refetch()} style={[S.retryBtn, { backgroundColor: colors.primary, borderRadius: radius.md }]}>
            <Text style={[type.bodySm, { color: colors.textInverse, fontWeight: '700' }]}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlashList
          data={companies}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={{
            padding:       spacing.md,
            paddingBottom: insets.bottom + spacing.xxl + (selectedIds.length > 0 ? 80 : 0),
          }}
          ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
          keyboardShouldPersistTaps="handled"
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={
            companies.length > 0 && !query ? (
              <View style={[S.listHeader, { backgroundColor: withAlpha(colors.primary, 0.07), borderRadius: radius.md }]}>
                <Ionicons name="business-outline" size={14} color={colors.primary} />
                <Text style={[type.caption, { color: colors.primary, fontWeight: '600' }]}>
                  {totalCount} companies available to invite
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            !isLoading ? (
              <View style={S.center}>
                <Ionicons name={query ? 'search-outline' : 'business-outline'} size={32} color={colors.textMuted} />
                <Text style={[type.bodySm, { color: colors.text, fontWeight: '700', marginTop: 8 }]}>
                  {query ? `No results for "${query}"` : 'No companies found'}
                </Text>
                <Text style={[type.caption, { color: colors.textMuted, textAlign: 'center', maxWidth: 280, marginTop: 4 }]}>
                  {query ? 'Try a different search term.' : 'Companies appear here once registered on the platform.'}
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{ padding: 16, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
        />
      )}

      {/* ── Floating confirm bar ─────────────────────────────────────── */}
      {selectedIds.length > 0 && (
        <View style={[S.floatingBar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets.bottom + spacing.md }]}>
          <Pressable
            onPress={handleDone}
            style={({ pressed }) => [S.confirmBtn, { backgroundColor: colors.primary, borderRadius: radius.md, opacity: pressed ? 0.88 : 1 }]}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color={colors.textInverse} />
            <Text style={{ color: colors.textInverse, fontWeight: '700', fontSize: 15 }}>
              Confirm {selectedIds.length} {selectedIds.length === 1 ? 'Company' : 'Companies'}
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
};

const S = StyleSheet.create({
  root:        { flex: 1 },
  header:      { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 10, gap: 10, borderBottomWidth: 1 },
  headerTop:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  searchBox:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, height: 42, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  chip:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 8, paddingRight: 8, paddingVertical: 4 },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  retryBtn:    { paddingHorizontal: 18, paddingVertical: 9, marginTop: 8 },
  listHeader:  { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, marginBottom: 8 },
  floatingBar: { borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 12 },
  confirmBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, minHeight: 50 },
});

export default CompanyInvitePickerScreen;