// src/screens/professional/tenders/MyProfessionalTendersScreen.tsx
// UPDATED: Uses TenderBidCard with live bid counts from bid service
// ─────────────────────────────────────────────────────────────────────────────

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
import { TenderBidCard } from '../../../components/professionalTenders/TenderBidCard';
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

  // Navigation handlers
  const handleTenderPress = useCallback(
    (item: ProfessionalTenderListItem) => {
      navigation.navigate('ProfessionalTenderDetail', { tenderId: item._id });
    },
    [navigation],
  );

  const handleEdit = useCallback(
    (item: ProfessionalTenderListItem) => {
      navigation.navigate('EditProfessionalTender', { tenderId: item._id });
    },
    [navigation],
  );

  const handleViewBids = useCallback(
    (item: ProfessionalTenderListItem) => {
      navigation.navigate('IncomingBids', { tenderId: item._id });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: ProfessionalTenderListItem }) => (
      <TenderBidCard
        tender={item}
        onPress={() => handleTenderPress(item)}
        onEdit={() => handleEdit(item)}
        onViewBids={() => handleViewBids(item)}
        onPublish={() => handlePublish(item)}
        onDelete={() => handleDelete(item)}
      />
    ),
    [handleTenderPress, handleEdit, handleViewBids, handlePublish, handleDelete],
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

const es = StyleSheet.create({
  root:     { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24, gap: 10 },
  iconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  title:    { fontSize: 17, fontWeight: '700' },
  sub:      { fontSize: 13, textAlign: 'center', lineHeight: 18, maxWidth: 280 },
  btn:      { marginTop: 8, paddingHorizontal: 22, paddingVertical: 13, borderRadius: 12, minHeight: 44 },
  btnText:  { fontSize: 14, fontWeight: '700' },
});

export default MyProfessionalTendersScreen;