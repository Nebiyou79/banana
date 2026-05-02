// ─────────────────────────────────────────────────────────────────────────────
//  src/screens/company/professionalTenders/MyProfessionalTendersScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  Owner-side list of own posted professional tenders.
//
//  • Hook: useMyPostedProfessionalTenders
//  • Status filter chips (All / Draft / Published / Locked / Deadline / Closed)
//  • Pull-to-refresh, infinite scroll (page-based)
//  • FAB → CreateProfessionalTenderScreen
//  • Tap card → ProfessionalTenderDetailScreen
//
//  All sealed-bid contents are obscured at this level — list endpoints
//  intentionally don't carry bid amounts. The card just shows count.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeStore } from '../../../store/themeStore';
import { useMyPostedProfessionalTenders } from '../../../hooks/useProfessionalTender';
import ProfessionalTenderStatusBadge, {
  getStatusTone,
} from '../../../components/professionalTenders/ProfessionalTenderStatusBadge';
import ProfessionalTenderWorkflowBadge from '../../../components/professionalTenders/ProfessionalTenderWorkflowBadge';
import type {
  MyProfessionalTendersFilters,
  ProfessionalTenderListItem,
  ProfessionalTenderStatus,
} from '../../../types/professionalTender';

// ═════════════════════════════════════════════════════════════════════════════
//  FILTER CHIPS
// ═════════════════════════════════════════════════════════════════════════════

type StatusFilter = 'all' | ProfessionalTenderStatus;

const STATUS_FILTERS: ReadonlyArray<{ value: StatusFilter; label: string }> = [
  { value: 'all',              label: 'All' },
  { value: 'draft',            label: 'Drafts' },
  { value: 'published',        label: 'Live' },
  { value: 'locked',           label: 'Locked' },
  { value: 'deadline_reached', label: 'Closed Window' },
  { value: 'revealed',         label: 'Revealed' },
  { value: 'closed',           label: 'Concluded' },
];

// ═════════════════════════════════════════════════════════════════════════════
//  CARD
// ═════════════════════════════════════════════════════════════════════════════

const TenderCard: React.FC<{
  item: ProfessionalTenderListItem;
  onPress: () => void;
}> = ({ item, onPress }) => {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const palette = isDark
    ? { surface: '#1E293B', border: '#334155', text: '#F1F5F9', muted: '#94A3B8', subtle: '#64748B' }
    : { surface: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', muted: '#64748B', subtle: '#94A3B8' };

  const deadline = new Date(item.deadline);
  const isPast = deadline.getTime() < Date.now();
  const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / 86_400_000);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [
        cardStyles.root,
        { backgroundColor: palette.surface, borderColor: palette.border, opacity: pressed ? 0.92 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Open tender ${item.title}`}
    >
      {/* Header — badges */}
      <View style={cardStyles.headerRow}>
        <ProfessionalTenderStatusBadge status={item.status} />
        <ProfessionalTenderWorkflowBadge workflowType={item.workflowType} size="sm" />
      </View>

      {/* Title */}
      <Text style={[cardStyles.title, { color: palette.text }]} numberOfLines={2}>
        {item.title}
      </Text>

      {/* Brief */}
      {!!item.briefDescription && (
        <Text style={[cardStyles.brief, { color: palette.muted }]} numberOfLines={2}>
          {item.briefDescription}
        </Text>
      )}

      {/* Meta */}
      <View style={cardStyles.metaRow}>
        <View style={cardStyles.metaItem}>
          <Ionicons name="pricetag-outline" size={11} color={palette.subtle} />
          <Text style={[cardStyles.metaText, { color: palette.subtle }]} numberOfLines={1}>
            {item.procurementCategory || '—'}
          </Text>
        </View>
        {!!item.referenceNumber && (
          <View style={cardStyles.metaItem}>
            <Ionicons name="barcode-outline" size={11} color={palette.subtle} />
            <Text
              style={[cardStyles.metaText, { color: palette.subtle, fontFamily: 'monospace' }]}
              numberOfLines={1}
            >
              {item.referenceNumber}
            </Text>
          </View>
        )}
      </View>

      {/* Footer row — deadline + bid count */}
      <View style={cardStyles.footerRow}>
        <View style={cardStyles.metaItem}>
          <Ionicons
            name={isPast ? 'time' : 'calendar-outline'}
            size={12}
            color={isPast ? '#DC2626' : palette.muted}
          />
          <Text
            style={[
              cardStyles.metaTextStrong,
              { color: isPast ? '#DC2626' : palette.text },
            ]}
            numberOfLines={1}
          >
            {isPast
              ? 'Deadline passed'
              : daysLeft <= 1
                ? 'Closes today'
                : `${daysLeft} days left`}
          </Text>
        </View>
        <View style={cardStyles.metaItem}>
          <Ionicons name="people-outline" size={12} color={palette.muted} />
          <Text style={[cardStyles.metaTextStrong, { color: palette.text }]}>
            {item.bidCount ?? 0} bid{(item.bidCount ?? 0) === 1 ? '' : 's'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  EMPTY STATE
// ═════════════════════════════════════════════════════════════════════════════

const EmptyState: React.FC<{ onCreate: () => void; filterLabel: string }> = ({
  onCreate,
  filterLabel,
}) => {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const palette = isDark
    ? { text: '#F1F5F9', muted: '#94A3B8', primary: '#60A5FA', primaryFg: '#0F172A' }
    : { text: '#0F172A', muted: '#64748B', primary: '#2563EB', primaryFg: '#FFFFFF' };
  const isFiltered = filterLabel !== 'All';

  return (
    <View style={emptyStyles.root}>
      <View style={[emptyStyles.iconWrap, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
        <Ionicons
          name={isFiltered ? 'funnel-outline' : 'document-text-outline'}
          size={36}
          color={palette.muted}
        />
      </View>
      <Text style={[emptyStyles.title, { color: palette.text }]}>
        {isFiltered ? `No ${filterLabel.toLowerCase()} tenders` : 'No tenders yet'}
      </Text>
      <Text style={[emptyStyles.desc, { color: palette.muted }]}>
        {isFiltered
          ? 'Try clearing the filter or creating a new tender.'
          : 'Create your first professional tender to start receiving bids.'}
      </Text>
      <Pressable
        onPress={onCreate}
        style={[emptyStyles.cta, { backgroundColor: palette.primary }]}
        accessibilityRole="button"
        accessibilityLabel="Create new tender"
      >
        <Ionicons name="add" size={16} color={palette.primaryFg} />
        <Text style={[emptyStyles.ctaLabel, { color: palette.primaryFg }]}>
          New Tender
        </Text>
      </Pressable>
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  SCREEN
// ═════════════════════════════════════════════════════════════════════════════

const PAGE_SIZE = 20;

export const MyProfessionalTendersScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const isDark = useThemeStore((s) => s.theme.isDark);

  const palette = useMemo(
    () => isDark
      ? { background: '#0F172A', surface: '#1E293B', border: '#334155', text: '#F1F5F9', muted: '#94A3B8', primary: '#60A5FA', primaryFg: '#0F172A', chipBg: '#1E293B', chipBgActive: '#1E3A5F', chipFg: '#94A3B8', chipFgActive: '#93C5FD' }
      : { background: '#F8FAFC', surface: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', muted: '#64748B', primary: '#2563EB', primaryFg: '#FFFFFF', chipBg: '#FFFFFF',  chipBgActive: '#DBEAFE', chipFg: '#475569', chipFgActive: '#1D4ED8' },
    [isDark],
  );

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const filters: MyProfessionalTendersFilters = useMemo(
    () => ({
      status: statusFilter,
      page,
      limit: PAGE_SIZE,
    }),
    [statusFilter, page],
  );

  const { data, isLoading, isError, error, refetch, isFetching } =
    useMyPostedProfessionalTenders(filters);

  const tenders = data?.tenders ?? [];
  const pagination = data?.pagination;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const onLoadMore = useCallback(() => {
    if (!pagination) return;
    if (pagination.page >= pagination.totalPages) return;
    if (isFetching) return;
    setPage((p) => p + 1);
  }, [pagination, isFetching]);

  const goToCreate = useCallback(() => {
    navigation.navigate('CreateProfessionalTender');
  }, [navigation]);

  const goToDetail = useCallback(
    (id: string) => navigation.navigate('ProfessionalTenderDetail', { tenderId: id }),
    [navigation],
  );

  const activeFilterLabel = STATUS_FILTERS.find((f) => f.value === statusFilter)?.label ?? 'All';

  // ─── Render ───────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: palette.background }]}>
      {/* Filter chips */}
      <View style={[styles.filterBar, { backgroundColor: palette.background, borderColor: palette.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {STATUS_FILTERS.map((f) => {
            const active = statusFilter === f.value;
            return (
              <Pressable
                key={f.value}
                onPress={() => { setStatusFilter(f.value); setPage(1); }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? palette.chipBgActive : palette.chipBg,
                    borderColor: active ? palette.chipFgActive : palette.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? palette.chipFgActive : palette.chipFg },
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Body */}
      {isLoading && tenders.length === 0 ? (
        <View style={styles.fullCenter}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      ) : isError ? (
        <View style={styles.fullCenter}>
          <Ionicons name="alert-circle-outline" size={36} color={palette.muted} />
          <Text style={[styles.errorText, { color: palette.text }]}>
            {(error as any)?.message ?? 'Couldn\'t load your tenders.'}
          </Text>
          <Pressable onPress={onRefresh} style={[styles.retryBtn, { backgroundColor: palette.primary }]}>
            <Text style={[styles.retryLabel, { color: palette.primaryFg }]}>Try again</Text>
          </Pressable>
        </View>
      ) : tenders.length === 0 ? (
        <EmptyState onCreate={goToCreate} filterLabel={activeFilterLabel} />
      ) : (
        <FlatList
          data={tenders}
          keyExtractor={(item) => item._id}
          renderItem={({ item }: { item: ProfessionalTenderListItem }) => (
            <TenderCard item={item} onPress={() => goToDetail(item._id)} />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={palette.primary}
            />
          }
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetching && tenders.length > 0 ? (
              <View style={styles.footer}>
                <ActivityIndicator color={palette.primary} />
              </View>
            ) : null
          }
        />
      )}

      {/* FAB */}
      {tenders.length > 0 && (
        <Pressable
          onPress={goToCreate}
          style={[styles.fab, { backgroundColor: palette.primary }]}
          accessibilityRole="button"
          accessibilityLabel="Create new tender"
        >
          <Ionicons name="add" size={24} color={palette.primaryFg} />
        </Pressable>
      )}
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  STYLES
// ═════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  root: { flex: 1 },
  filterBar: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  filterRow: {
    paddingHorizontal: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 32,
    justifyContent: 'center',
  },
  chipText: { fontSize: 12, fontWeight: '600' },

  fullCenter: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 24, gap: 12,
  },
  errorText: { fontSize: 14, textAlign: 'center', maxWidth: 280 },
  retryBtn:  { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  retryLabel:{ fontSize: 13, fontWeight: '700' },

  listContent: { padding: 14, gap: 10, paddingBottom: 96 },
  footer:      { padding: 16, alignItems: 'center' },

  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 52, height: 52,
    borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
});

const cardStyles = StyleSheet.create({
  root: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  title:  { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  brief:  { fontSize: 12, lineHeight: 17 },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148,163,184,0.15)',
  },
  metaItem:    { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: 200 },
  metaText:    { fontSize: 11 },
  metaTextStrong: { fontSize: 12, fontWeight: '600' },
});

const emptyStyles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center', justifyContent: 'center',
    padding: 24, gap: 12,
  },
  iconWrap: {
    width: 80, height: 80,
    borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 16, fontWeight: '700' },
  desc:  { fontSize: 13, lineHeight: 18, textAlign: 'center', maxWidth: 280 },
  cta: {
    flexDirection: 'row', alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 12, minHeight: 44,
    marginTop: 8,
  },
  ctaLabel: { fontSize: 14, fontWeight: '700' },
});

export default MyProfessionalTendersScreen;
