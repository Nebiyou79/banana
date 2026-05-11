// src/screens/professional/tenders/MyProfessionalTendersScreen.tsx

import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../../hooks/useTheme';
import { withAlpha } from '../../../theme/utils';
import {
  useDeleteProfessionalTender,
  useMyPostedProfessionalTenders,
  usePublishProfessionalTender,
} from '../../../hooks/useProfessionalTender';
import type {
  ProfessionalTenderListItem,
  ProfessionalTenderStatus,
} from '../../../types/professionalTender';

// ─── Filter tabs ──────────────────────────────────────────────────────────────

type TabKey = ProfessionalTenderStatus | 'all';

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'all',       label: 'All' },
  { key: 'draft',     label: 'Draft' },
  { key: 'published', label: 'Published' },
  { key: 'closed',    label: 'Closed' },
  { key: 'awarded',   label: 'Awarded' },
];

// ─── Status badge ─────────────────────────────────────────────────────────────

type ColorFn = (colors: ReturnType<typeof useTheme>['colors']) => { bg: string; fg: string };

const STATUS_META: Record<ProfessionalTenderStatus, { label: string; getColors: ColorFn }> = {
  draft:            { label: 'Draft',            getColors: (c) => ({ bg: withAlpha(c.textMuted, 0.15),   fg: c.textMuted }) },
  published:        { label: 'Published',        getColors: (c) => ({ bg: c.successBg,                   fg: c.success }) },
  closed:           { label: 'Closed',           getColors: (c) => ({ bg: c.dangerBg,                    fg: c.danger }) },
  awarded:          { label: 'Awarded',          getColors: (c) => ({ bg: c.successBg,                   fg: c.success }) },
  revealed:         { label: 'Revealed',         getColors: (c) => ({ bg: c.infoBg,                      fg: c.info }) },
  cancelled:        { label: 'Cancelled',        getColors: (c) => ({ bg: c.dangerBg,                    fg: c.danger }) },
  locked:           { label: 'Locked',           getColors: (c) => ({ bg: withAlpha(c.warning, 0.15),    fg: c.warning }) },
  deadline_reached: { label: 'Deadline Reached', getColors: (c) => ({ bg: withAlpha(c.warning, 0.15),    fg: c.warning }) },
};

const StatusBadge: React.FC<{ status: ProfessionalTenderStatus }> = ({ status }) => {
  const { colors } = useTheme();
  const meta = STATUS_META[status] ?? {
    label: status,
    getColors: (c: ReturnType<typeof useTheme>['colors']) => ({ bg: withAlpha(c.textMuted, 0.15), fg: c.textMuted }),
  };
  const { bg, fg } = meta.getColors(colors);
  return (
    <View style={[sb.root, { backgroundColor: bg }]}>
      <Text style={[sb.label, { color: fg }]}>{meta.label.toUpperCase()}</Text>
    </View>
  );
};

// ─── Tender card ──────────────────────────────────────────────────────────────

interface TenderCardProps {
  item: ProfessionalTenderListItem;
  onPress: () => void;
  onEdit: () => void;
  onViewBids: () => void;
  onPublish: () => void;
  onDelete: () => void;
}

const TenderCard = React.memo<TenderCardProps>(({
  item, onPress, onEdit, onViewBids, onPublish, onDelete,
}) => {
  const { colors } = useTheme();
  const bidsCount = item.metadata?.totalBids ?? item.bidCount ?? 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      style={[tc.root, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
    >
      {/* Title + badge */}
      <View style={tc.topRow}>
        <Text style={[tc.title, { color: colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        <StatusBadge status={item.status} />
      </View>

      {/* Meta */}
      <Text style={[tc.meta, { color: colors.textMuted }]} numberOfLines={1}>
        {item.referenceNumber ?? '—'}
        {item.procurementCategory ? `  ·  ${item.procurementCategory}` : ''}
      </Text>

      {/* Deadline */}
      {item.deadline && (
        <View style={tc.deadlineRow}>
          <Ionicons name="time-outline" size={13} color={colors.textMuted} />
          <Text style={[tc.deadlineText, { color: colors.textMuted }]}>
            {new Date(item.deadline).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })}
          </Text>
        </View>
      )}

      {/* Stats */}
      <View style={[tc.statsRow, { borderTopColor: colors.border }]}>
        <Text style={[tc.statText, { color: colors.textMuted }]}>
          {bidsCount} bid{bidsCount !== 1 ? 's' : ''}
        </Text>
        <Text style={[tc.statText, { color: colors.textMuted }]}>
          {item.metadata?.views ?? 0} views
        </Text>
      </View>

      {/* Action buttons */}
      <View style={tc.actionsRow}>
        <ActionButton label={`Bids (${bidsCount})`} onPress={onViewBids} variant="primary" />
        <ActionButton label="Edit"                  onPress={onEdit}     variant="neutral" />
        {item.status === 'draft' && (
          <ActionButton label="Publish" onPress={onPublish} variant="success" />
        )}
        {item.status === 'draft' && (
          <ActionButton label="Delete" onPress={onDelete} variant="danger" />
        )}
      </View>
    </TouchableOpacity>
  );
});

type Variant = 'primary' | 'neutral' | 'success' | 'danger';

const ActionButton: React.FC<{ label: string; onPress: () => void; variant: Variant }> = ({
  label, onPress, variant,
}) => {
  const { colors } = useTheme();

  const getStyle = (): { bg: string; border: string; text: string } => {
    switch (variant) {
      case 'primary': return {
        bg: withAlpha(colors.primary, 0.10), border: withAlpha(colors.primary, 0.30), text: colors.primary,
      };
      case 'success': return {
        bg: withAlpha(colors.success, 0.10), border: withAlpha(colors.success, 0.30), text: colors.success,
      };
      case 'danger': return {
        bg: withAlpha(colors.danger, 0.08), border: withAlpha(colors.danger, 0.25), text: colors.danger,
      };
      default: return {
        bg: colors.bgCard, border: colors.border, text: colors.text,
      };
    }
  };

  const s = getStyle();
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      style={[ab.btn, { backgroundColor: s.bg, borderColor: s.border }]}
    >
      <Text style={[ab.text, { color: s.text }]}>{label}</Text>
    </TouchableOpacity>
  );
};

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ tab: TabKey; onCreate: () => void }> = ({ tab, onCreate }) => {
  const { colors } = useTheme();
  return (
    <View style={es.root}>
      <View style={[es.iconWrap, { backgroundColor: withAlpha(colors.primary, 0.10) }]}>
        <Ionicons name="document-text-outline" size={36} color={colors.primary} />
      </View>
      <Text style={[es.title, { color: colors.text }]}>
        {tab === 'all' ? 'No tenders yet' : `No ${tab} tenders`}
      </Text>
      <Text style={[es.sub, { color: colors.textMuted }]}>
        {tab === 'all'
          ? 'Create your first professional tender to invite sealed bids.'
          : `You have no tenders with status "${tab}".`}
      </Text>
      {tab === 'all' && (
        <TouchableOpacity
          onPress={onCreate}
          accessibilityRole="button"
          style={[es.btn, { backgroundColor: colors.primary }]}
        >
          <Text style={[es.btnText, { color: colors.textInverse }]}>Create Tender</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────

const MyProfessionalTendersScreen: React.FC = () => {
  const navigation     = useNavigation<any>();
  const { colors, spacing } = useTheme();
  const insets         = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const { data, isLoading, refetch, isRefetching } = useMyPostedProfessionalTenders({
    status: activeTab === 'all' ? undefined : activeTab,
    limit: 20,
  });

  const deleteMutation  = useDeleteProfessionalTender();
  const publishMutation = usePublishProfessionalTender();

  const tenders: ProfessionalTenderListItem[] = useMemo(
    () => data?.tenders ?? [],
    [data],
  );

  const totalCount = data?.pagination?.total ?? tenders.length;

  const handleDelete = useCallback(
    (item: ProfessionalTenderListItem) => {
      Alert.alert('Delete Tender', `Delete "${item.title}"? This cannot be undone.`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(item._id),
        },
      ]);
    },
    [deleteMutation],
  );

  const handlePublish = useCallback(
    (item: ProfessionalTenderListItem) => {
      Alert.alert('Publish Tender', `Publish "${item.title}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Publish', onPress: () => publishMutation.mutate(item._id) },
      ]);
    },
    [publishMutation],
  );

  const renderItem = useCallback(
    ({ item }: { item: ProfessionalTenderListItem }) => (
      <TenderCard
        item={item}
        onPress={() => navigation.navigate('ProfessionalTenderDetail', { tenderId: item._id })}
        onEdit={() => navigation.navigate('EditProfessionalTender', { tenderId: item._id })}
        onViewBids={() => navigation.navigate('IncomingBids', { tenderId: item._id })}
        onPublish={() => handlePublish(item)}
        onDelete={() => handleDelete(item)}
      />
    ),
    [navigation, handlePublish, handleDelete],
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>My Tenders</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {totalCount} tender{totalCount !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        <FlashList
          data={TABS}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          keyExtractor={(t) => t.key}
          renderItem={({ item: tab }) => {
            const active = activeTab === tab.key;
            return (
              <Pressable
                onPress={() => setActiveTab(tab.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={[
                  styles.tab,
                  active && { borderBottomWidth: 2, borderBottomColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: active ? colors.primary : colors.textMuted, fontWeight: active ? '700' : '400' },
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* List */}
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
      ) : (
        <FlashList
          data={tenders}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + spacing.xxl + 72,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              tab={activeTab}
              onCreate={() => navigation.navigate('CreateProfessionalTender')}
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        onPress={() => navigation.navigate('CreateProfessionalTender')}
        accessibilityRole="button"
        accessibilityLabel="Create tender"
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            bottom: insets.bottom + spacing.lg,
            shadowColor: colors.shadowColor,
          },
        ]}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={colors.textInverse} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  title:    { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 2 },
  tabBar:   { borderBottomWidth: StyleSheet.hairlineWidth },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
    marginRight: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: { fontSize: 14 },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
});

const tc = StyleSheet.create({
  root:        { borderWidth: 1, borderRadius: 16, padding: 16 },
  topRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 },
  title:       { flex: 1, fontSize: 16, fontWeight: '700', lineHeight: 22 },
  meta:        { fontSize: 12, marginBottom: 6 },
  deadlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  deadlineText:{ fontSize: 12 },
  statsRow:    { flexDirection: 'row', gap: 16, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, marginBottom: 12 },
  statText:    { fontSize: 12 },
  actionsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});

const ab = StyleSheet.create({
  btn:  { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, minHeight: 44, justifyContent: 'center' },
  text: { fontSize: 13, fontWeight: '600' },
});

const sb = StyleSheet.create({
  root:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  label: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
});

const es = StyleSheet.create({
  root:     { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24, gap: 10 },
  iconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  title:    { fontSize: 17, fontWeight: '700' },
  sub:      { fontSize: 13, textAlign: 'center', lineHeight: 18, maxWidth: 280 },
  btn:      { marginTop: 8, paddingHorizontal: 22, paddingVertical: 13, borderRadius: 12, minHeight: 44 },
  btnText:  { fontSize: 14, fontWeight: '700' },
});

export default MyProfessionalTendersScreen;