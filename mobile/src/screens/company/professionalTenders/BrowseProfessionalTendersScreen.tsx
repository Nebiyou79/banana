// src/screens/tenders/browse/BrowseProfessionalTendersScreen.tsx
// FIXED: Replaced non-existent theme tokens (bgCard→surface, textSecondary→textMuted,
//        textInverse→bg, inputBg→bg, inputBorder→border, inputPlaceholder→textMuted)
// FIXED: Navigation to detail uses the correct 'BrowseProfessionalTenderDetail' name
// FIXED: Saved tenders badge shows count in header

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../../hooks/useTheme';
import { withAlpha } from '../../../theme/utils';
import {
  useProfessionalTenders,
  useSavedProfessionalTenders,
  useToggleSavedProfessionalTender,
} from '../../../hooks/useProfessionalTender';
import ProfessionalTenderStatusBadge from '../../../components/professionalTenders/ProfessionalTenderStatusBadge';
import ProfessionalTenderWorkflowBadge from '../../../components/professionalTenders/ProfessionalTenderWorkflowBadge';
import type {
  ProfessionalTenderFilters,
  ProfessionalTenderListItem,
  ProfessionalTenderType,
  ProfessionalTenderWorkflowType,
} from '../../../types/professionalTender';

// ─── Filter options ───────────────────────────────────────────────────────────

const WORKFLOW_FILTERS: ReadonlyArray<{ value: 'all' | ProfessionalTenderWorkflowType; label: string }> = [
  { value: 'all',    label: 'All Workflows' },
  { value: 'open',   label: 'Open' },
  { value: 'closed', label: 'Sealed' },
];

const TYPE_FILTERS: ReadonlyArray<{ value: 'all' | ProfessionalTenderType; label: string }> = [
  { value: 'all',         label: 'All Types' },
  { value: 'works',       label: 'Works' },
  { value: 'goods',       label: 'Goods' },
  { value: 'services',    label: 'Services' },
  { value: 'consultancy', label: 'Consultancy' },
];

// ─── Deadline helper ──────────────────────────────────────────────────────────
function deadlineLabel(deadlineStr: string): { text: string; urgent: boolean; past: boolean } {
  const deadline = new Date(deadlineStr);
  const now = Date.now();
  const msDiff = deadline.getTime() - now;

  if (msDiff <= 0) return { text: 'Deadline passed', urgent: false, past: true };

  const days = Math.ceil(msDiff / 86_400_000);
  if (days <= 1) return { text: 'Closes today', urgent: true, past: false };
  if (days <= 3) return { text: `${days} days left`, urgent: true, past: false };
  return { text: `${days} days left`, urgent: false, past: false };
}

// ─── Tender card ──────────────────────────────────────────────────────────────
const TenderCard = React.memo<{
  item: ProfessionalTenderListItem;
  onPress: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
  saveBusy?: boolean;
}>(({ item, onPress, isSaved, onToggleSave, saveBusy }) => {
  const { colors: c, radius, type } = useTheme();

  const dl = deadlineLabel(item.deadline);
  const entityName =
    typeof item.ownerEntity === 'object' && item.ownerEntity
      ? (item.ownerEntity as any).name
      : undefined;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        cardS.root,
        {
          backgroundColor: c.surface,     // ← was colors.bgCard (doesn't exist)
          borderColor:     c.border,
          borderRadius:    radius.lg,
          opacity: pressed ? 0.93 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`View tender: ${item.title}`}
    >
      {/* Header row — status/workflow badges + bookmark */}
      <View style={cardS.headerRow}>
        <View style={cardS.badges}>
          <ProfessionalTenderStatusBadge status={item.status} />
          <ProfessionalTenderWorkflowBadge workflowType={item.workflowType} size="sm" />
        </View>
        <Pressable
          onPress={onToggleSave}
          disabled={saveBusy}
          hitSlop={10}
          style={({ pressed }) => [
            cardS.bookmarkBtn,
            { opacity: saveBusy ? 0.4 : pressed ? 0.7 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={isSaved ? 'Remove from saved' : 'Save tender'}
        >
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={18}
            color={isSaved ? c.primary : c.textMuted}
          />
        </Pressable>
      </View>

      {/* Title */}
      <Text style={[cardS.title, { color: c.text }]} numberOfLines={2}>
        {item.title}
      </Text>

      {/* Brief description */}
      {!!item.briefDescription && (
        <Text style={[cardS.brief, { color: c.textMuted }]} numberOfLines={2}>
          {item.briefDescription}
        </Text>
      )}

      {/* Owner entity name */}
      {!!entityName && (
        <View style={cardS.entityRow}>
          <Ionicons name="business-outline" size={11} color={c.textMuted} />
          <Text
            style={[cardS.entityText, { color: c.textMuted }]}  // ← was textSecondary
            numberOfLines={1}
          >
            {entityName}
          </Text>
        </View>
      )}

      {/* Reference number */}
      {!!item.referenceNumber && (
        <View style={cardS.entityRow}>
          <Ionicons name="barcode-outline" size={11} color={c.textMuted} />
          <Text style={[cardS.entityText, { color: c.textMuted }]} numberOfLines={1}>
            {item.referenceNumber}
          </Text>
        </View>
      )}

      {/* Footer: deadline + category */}
      <View style={[cardS.footerRow, { borderTopColor: withAlpha(c.border, 0.6) }]}>
        {/* Deadline */}
        <View style={cardS.metaItem}>
          <Ionicons
            name={dl.past ? 'time' : dl.urgent ? 'alarm-outline' : 'calendar-outline'}
            size={12}
            color={dl.past || dl.urgent ? c.danger : c.textMuted}
          />
          <Text
            style={[
              cardS.metaTextStrong,
              { color: dl.past || dl.urgent ? c.danger : c.text },
            ]}
            numberOfLines={1}
          >
            {dl.text}
          </Text>
        </View>

        {/* Category */}
        {!!item.procurementCategory && (
          <View style={cardS.metaItem}>
            <Ionicons name="pricetag-outline" size={12} color={c.textMuted} />
            <Text style={[cardS.metaText, { color: c.textMuted }]} numberOfLines={1}>
              {item.procurementCategory}
            </Text>
          </View>
        )}

        {/* Bid count (if the server exposes it on the list item) */}
        {(item as any).bidCount != null && (
          <View style={cardS.metaItem}>
            <Ionicons name="people-outline" size={12} color={c.textMuted} />
            <Text style={[cardS.metaText, { color: c.textMuted }]} numberOfLines={1}>
              {(item as any).bidCount} bid{(item as any).bidCount === 1 ? '' : 's'}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
});

// ─── Main screen ──────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

export const BrowseProfessionalTendersScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors: c, spacing, radius, type } = useTheme();

  // ── Filter state ─────────────────────────────────────────────────────
  const [rawSearch,      setRawSearch]      = useState('');
  const [search,         setSearch]         = useState('');
  const [workflowFilter, setWorkflowFilter] = useState<'all' | ProfessionalTenderWorkflowType>('all');
  const [typeFilter,     setTypeFilter]     = useState<'all' | ProfessionalTenderType>('all');
  const [page,           setPage]           = useState(1);
  const [refreshing,     setRefreshing]     = useState(false);

  // Debounce search 350 ms
  useEffect(() => {
    const h = setTimeout(() => setSearch(rawSearch), 350);
    return () => clearTimeout(h);
  }, [rawSearch]);

  // Reset to page 1 on filter changes
  useEffect(() => { setPage(1); }, [search, workflowFilter, typeFilter]);

  const filters: ProfessionalTenderFilters = useMemo(() => {
    const f: ProfessionalTenderFilters = {
      page,
      limit: PAGE_SIZE,
      sortBy: 'deadline',
      sortOrder: 'asc',
    };
    if (search.trim())           f.search       = search.trim();
    if (workflowFilter !== 'all') f.workflowType = workflowFilter;
    if (typeFilter     !== 'all') f.tenderType   = typeFilter;
    return f;
  }, [page, search, workflowFilter, typeFilter]);

  const { data, isLoading, isError, error, refetch, isFetching } =
    useProfessionalTenders(filters);

  const tenders    = data?.tenders    ?? [];
  const pagination = data?.pagination;

  // ── Saved integration ─────────────────────────────────────────────────
  const { data: savedData }   = useSavedProfessionalTenders();
  const savedIds = useMemo(
    () => new Set((savedData?.tenders ?? []).map(t => t._id)),
    [savedData],
  );
  const savedCount       = savedData?.tenders?.length ?? 0;
  const toggleSaveMutation = useToggleSavedProfessionalTender();

  // ── Handlers ──────────────────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const onLoadMore = useCallback(() => {
    if (!pagination || pagination.page >= pagination.totalPages || isFetching) return;
    setPage(p => p + 1);
  }, [pagination, isFetching]);

  // FIXED: correct screen name 'BrowseProfessionalTenderDetail'
  const goToDetail = useCallback(
    (id: string) =>
      navigation.navigate('BrowseProfessionalTenderDetail', { tenderId: id }),
    [navigation],
  );

  // ── Chip style helpers ────────────────────────────────────────────────
  const chipStyle = (active: boolean) => ({
    backgroundColor: active ? c.primary : c.surface,
    borderColor:     active ? c.primary : c.border,
  });
  const chipTextColor = (active: boolean) => (active ? c.bg : c.textMuted);  // ← was textInverse

  const hasActiveFilter = search || workflowFilter !== 'all' || typeFilter !== 'all';

  return (
    <SafeAreaView style={[S.root, { backgroundColor: c.bg }]} edges={['top']}>
      {/* ── Header strip ─────────────────────────────────────────────── */}
      <View
        style={[
          S.headerStrip,
          { backgroundColor: c.surface, borderColor: c.border },
        ]}
      >
        {/* Title row */}
        <View style={S.headerTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={[S.screenTitle, { color: c.text }]}>Browse Tenders</Text>
            <Text style={[S.subtitle, { color: c.textMuted }]}>
              {pagination?.total != null
                ? `${pagination.total.toLocaleString()} tender${pagination.total === 1 ? '' : 's'} available`
                : 'Open procurement opportunities'}
            </Text>
          </View>

          {/* Saved tenders shortcut */}
          <Pressable
            onPress={() => navigation.navigate('SavedProfessionalTenders')}
            style={({ pressed }) => [
              S.savedLink,
              {
                backgroundColor: withAlpha(c.primary, 0.1),
                borderRadius: radius.full,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Saved tenders: ${savedCount}`}
          >
            <Ionicons name="bookmark" size={14} color={c.primary} />
            <Text style={[S.savedLinkText, { color: c.primary }]}>
              {savedCount > 0 ? `${savedCount} Saved` : 'Saved'}
            </Text>
          </Pressable>
        </View>

        {/* Search box — FIXED: bg/border/placeholder use real tokens */}
        <View
          style={[
            S.searchBox,
            {
              backgroundColor: c.bg,          // ← was c.inputBg
              borderColor: c.border,           // ← was c.inputBorder
              borderRadius: radius.md,
            },
          ]}
        >
          <Ionicons name="search-outline" size={16} color={c.textMuted} />
          <TextInput
            value={rawSearch}
            onChangeText={setRawSearch}
            placeholder="Search tenders, categories, refs…"
            placeholderTextColor={c.textMuted}  // ← was c.inputPlaceholder
            autoCapitalize="none"
            autoCorrect={false}
            style={[S.searchInput, { color: c.text }]}
            returnKeyType="search"
          />
          {rawSearch.length > 0 && (
            <Pressable onPress={() => setRawSearch('')} hitSlop={6}>
              <Ionicons name="close-circle" size={16} color={c.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Filter chips — workflow + type */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={S.filterRow}
        >
          {WORKFLOW_FILTERS.map(f => {
            const active = workflowFilter === f.value;
            return (
              <Pressable
                key={`wf-${f.value}`}
                onPress={() => setWorkflowFilter(f.value)}
                style={[S.chip, chipStyle(active)]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[S.chipText, { color: chipTextColor(active) }]}>{f.label}</Text>
              </Pressable>
            );
          })}

          <View style={[S.chipDivider, { backgroundColor: withAlpha(c.border, 0.5) }]} />

          {TYPE_FILTERS.map(f => {
            const active = typeFilter === f.value;
            return (
              <Pressable
                key={`type-${f.value}`}
                onPress={() => setTypeFilter(f.value)}
                style={[S.chip, chipStyle(active)]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[S.chipText, { color: chipTextColor(active) }]}>{f.label}</Text>
              </Pressable>
            );
          })}

          {/* Clear-all chip — only shown when a filter is active */}
          {hasActiveFilter && (
            <>
              <View style={[S.chipDivider, { backgroundColor: withAlpha(c.border, 0.5) }]} />
              <Pressable
                onPress={() => {
                  setRawSearch('');
                  setSearch('');
                  setWorkflowFilter('all');
                  setTypeFilter('all');
                }}
                style={[S.chip, { backgroundColor: withAlpha(c.danger, 0.1), borderColor: withAlpha(c.danger, 0.3) }]}
              >
                <Ionicons name="close" size={12} color={c.danger} />
                <Text style={[S.chipText, { color: c.danger }]}>Clear</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </View>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      {isLoading && tenders.length === 0 ? (
        <View style={S.fullCenter}>
          <ActivityIndicator size="large" color={c.primary} />
          <Text style={[type.caption, { color: c.textMuted, marginTop: 8 }]}>
            Loading tenders…
          </Text>
        </View>
      ) : isError ? (
        <View style={S.fullCenter}>
          <Ionicons name="alert-circle-outline" size={36} color={c.textMuted} />
          <Text style={[S.errorText, { color: c.text }]}>
            {(error as any)?.message ?? "Couldn't load tenders."}
          </Text>
          <Pressable
            onPress={onRefresh}
            style={[S.retryBtn, { backgroundColor: c.primary, borderRadius: radius.md }]}
          >
            <Text style={{ color: c.bg, fontWeight: '700', fontSize: 14 }}>  {/* ← was textInverse */}
              Try again
            </Text>
          </Pressable>
        </View>
      ) : tenders.length === 0 ? (
        <View style={S.fullCenter}>
          <View
            style={[
              S.emptyIconWrap,
              { backgroundColor: c.surface, borderColor: c.border, borderRadius: radius.full },
            ]}
          >
            <Ionicons
              name={hasActiveFilter ? 'funnel-outline' : 'document-text-outline'}
              size={32}
              color={c.textMuted}
            />
          </View>
          <Text style={[S.emptyTitle, { color: c.text }]}>No tenders found</Text>
          <Text style={[S.emptyDesc, { color: c.textMuted }]}>
            {hasActiveFilter
              ? 'Try clearing filters or adjusting your search.'
              : 'No active tenders are available right now.'}
          </Text>
          {hasActiveFilter && (
            <Pressable
              onPress={() => {
                setRawSearch('');
                setSearch('');
                setWorkflowFilter('all');
                setTypeFilter('all');
              }}
              style={[S.retryBtn, { backgroundColor: c.surface, borderRadius: radius.md, borderWidth: 1, borderColor: c.border }]}
            >
              <Text style={{ color: c.text, fontWeight: '600', fontSize: 14 }}>Clear filters</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={tenders}
          keyExtractor={(item: ProfessionalTenderListItem) => item._id}
          renderItem={({ item }: { item: ProfessionalTenderListItem }) => (
            <TenderCard
              item={item}
              onPress={() => goToDetail(item._id)}
              isSaved={savedIds.has(item._id)}
              onToggleSave={() =>
                toggleSaveMutation.mutate({ id: item._id, tender: item })
              }
              saveBusy={toggleSaveMutation.isPending}
            />
          )}
          contentContainerStyle={S.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={c.primary}
            />
          }
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetching && tenders.length > 0 ? (
              <View style={S.listFooter}>
                <ActivityIndicator color={c.primary} />
              </View>
            ) : pagination && pagination.page < pagination.totalPages ? (
              <View style={S.listFooter}>
                <Text style={[type.caption, { color: c.textMuted }]}>
                  Showing {tenders.length} of {pagination.total}
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root: { flex: 1 },

  headerStrip:  { paddingHorizontal: 14, paddingVertical: 10, gap: 10, borderBottomWidth: 1 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  screenTitle:  { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  subtitle:     { fontSize: 12, marginTop: 1 },

  savedLink:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, minHeight: 32 },
  savedLinkText: { fontSize: 12, fontWeight: '700' },

  searchBox:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, height: 42, borderRadius: 10, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },

  filterRow: { paddingVertical: 2, gap: 6, flexDirection: 'row', alignItems: 'center' },
  chip:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, minHeight: 30, justifyContent: 'center' },
  chipText:  { fontSize: 12, fontWeight: '600' },
  chipDivider:{ width: 1, height: 16, marginHorizontal: 4 },

  listContent: { padding: 14, paddingBottom: 32 },
  listFooter:  { padding: 16, alignItems: 'center' },

  fullCenter:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  errorText:    { fontSize: 14, textAlign: 'center', maxWidth: 280 },
  retryBtn:     { paddingHorizontal: 20, paddingVertical: 10, minHeight: 44, justifyContent: 'center', alignItems: 'center' },

  emptyIconWrap:{ width: 80, height: 80, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 4 },
  emptyTitle:   { fontSize: 16, fontWeight: '700' },
  emptyDesc:    { fontSize: 13, lineHeight: 18, textAlign: 'center', maxWidth: 280 },
});

const cardS = StyleSheet.create({
  root:       { padding: 14, borderWidth: 1, gap: 8 },
  headerRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  badges:     { flexDirection: 'row', gap: 6, flexWrap: 'wrap', flex: 1 },
  bookmarkBtn:{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  title:      { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  brief:      { fontSize: 12, lineHeight: 17 },
  entityRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  entityText: { fontSize: 11, fontWeight: '600', flex: 1 },
  footerRow:  { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, paddingTop: 8, borderTopWidth: 1 },
  metaItem:   { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: 200 },
  metaText:   { fontSize: 11 },
  metaTextStrong:{ fontSize: 12, fontWeight: '600' },
});

export default BrowseProfessionalTendersScreen;