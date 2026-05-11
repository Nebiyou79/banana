// mobile/src/screens/company/freelanceTenders/CompanyMyTendersScreen.tsx

import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../hooks/useTheme';
import { withAlpha } from '../../../theme/utils';
import {
  useCloseFreelanceTender,
  useDeleteFreelanceTender,
  useMyPostedFreelanceTenders,
  usePublishFreelanceTender,
} from '../../../hooks/useFreelanceTender';
import type { FreelanceTenderListItem, TenderStatus } from '../../../types/freelanceTender';
import FreelanceTenderStatusBadge from '../../../components/freelanceTenders/FreelanceTenderStatusBadge';
import FreelanceTenderSkeleton from '../../../components/freelanceTenders/FreelanceTenderSkeleton';
import FreelanceTenderEmptyState from '../../../components/freelanceTenders/FreelanceTenderEmptyState';
import FreelanceTenderDeadlineTimer from '../../../components/freelanceTenders/FreelanceTenderDeadlineTimer';
import FreelanceTenderBudgetTag from '../../../components/freelanceTenders/FreelanceTenderBudgetTag';

interface Props {
  navigation: any;
}

type TabStatus = TenderStatus | 'all';

const STATUS_TABS: Array<{ key: TabStatus; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'published', label: 'Published' },
  { key: 'closed', label: 'Closed' },
];

const CompanyMyTendersScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabStatus>('all');

  const { data, isLoading, refetch, isRefetching } = useMyPostedFreelanceTenders({
    status: activeTab === 'all' ? undefined : activeTab,
    limit: 20,
  });

  const deleteMutation = useDeleteFreelanceTender();
  const publishMutation = usePublishFreelanceTender();
  const closeMutation = useCloseFreelanceTender();

  const tenders: FreelanceTenderListItem[] = useMemo(
    () => data?.tenders ?? [],
    [data]
  );

  const totalCount = data?.pagination?.total ?? tenders.length;

  const handleDelete = useCallback(
    (tender: FreelanceTenderListItem) => {
      Alert.alert(
        'Delete Tender',
        `Delete "${tender.title}"? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteMutation.mutate(tender._id),
          },
        ]
      );
    },
    [deleteMutation]
  );

  const handlePublish = useCallback(
    (tender: FreelanceTenderListItem) => {
      Alert.alert(
        'Publish Tender',
        `Publish "${tender.title}"? It will be visible to all freelancers.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Publish',
            onPress: () => publishMutation.mutate(tender._id),
          },
        ]
      );
    },
    [publishMutation]
  );

  const handleClose = useCallback(
    (tender: FreelanceTenderListItem) => {
      Alert.alert(
        'Close Tender',
        `Close "${tender.title}"? No new applications will be accepted.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Close',
            style: 'destructive',
            onPress: () => closeMutation.mutate(tender._id),
          },
        ]
      );
    },
    [closeMutation]
  );

  const renderItem = useCallback(
    ({ item }: { item: FreelanceTenderListItem }) => (
      <TenderOwnerCard
        tender={item}
        onPress={() =>
          navigation.navigate('CompanyTenderDetail', { tenderId: item._id })
        }
        onEdit={() =>
          navigation.navigate('CompanyTenderEdit', { tenderId: item._id })
        }
        onViewApplicants={() =>
          navigation.navigate('CompanyTenderApplicants', { tenderId: item._id })
        }
        onPublish={() => handlePublish(item)}
        onClose={() => handleClose(item)}
        onDelete={() => handleDelete(item)}
      />
    ),
    [navigation, handlePublish, handleClose, handleDelete]
  );

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.bg }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>My Tenders</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {totalCount} tender{totalCount !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('CompanyTenderCreate')}
          style={[styles.createBtn, { backgroundColor: colors.primary }]}
          accessibilityRole="button"
        >
          <Text style={[styles.createBtnText, { color: colors.textInverse }]}>+ Create</Text>
        </TouchableOpacity>
      </View>

      {/* Status tabs */}
      <View style={[styles.tabsBar, { borderBottomColor: colors.border }]}>
        <FlashList
          data={STATUS_TABS}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item: tab }) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                onPress={() => setActiveTab(tab.key)}
                style={[
                  styles.tab,
                  active && {
                    borderBottomWidth: 2,
                    borderBottomColor: colors.primary,
                  },
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: active ? colors.primary : colors.textMuted,
                      fontWeight: active ? '700' : '400',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          }}
          keyExtractor={(item) => item.key}
        />
      </View>

      {/* List */}
      {isLoading ? (
        <FreelanceTenderSkeleton count={4} />
      ) : (
        <FlashList
          data={tenders}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + spacing.xxl,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <FreelanceTenderEmptyState
              message={
                activeTab === 'all'
                  ? 'No tenders yet'
                  : `No ${activeTab} tenders`
              }
              subtitle={
                activeTab === 'all'
                  ? 'Create your first freelance tender to find talent.'
                  : undefined
              }
              actionLabel={activeTab === 'all' ? 'Create Tender' : undefined}
              onAction={
                activeTab === 'all'
                  ? () => navigation.navigate('CompanyTenderCreate')
                  : undefined
              }
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

// ─── Owner card ───────────────────────────────────────────────────────────────

interface TenderOwnerCardProps {
  tender: FreelanceTenderListItem;
  onPress: () => void;
  onEdit: () => void;
  onViewApplicants: () => void;
  onPublish: () => void;
  onClose: () => void;
  onDelete: () => void;
}

const TenderOwnerCard: React.FC<TenderOwnerCardProps> = ({
  tender,
  onPress,
  onEdit,
  onViewApplicants,
  onPublish,
  onClose,
  onDelete,
}) => {
  const { colors } = useTheme();
  const appCount = tender.metadata?.totalApplications ?? 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.card,
        { backgroundColor: colors.bgCard, borderColor: colors.border },
      ]}
      activeOpacity={0.8}
      accessibilityRole="button"
    >
      {/* Top row */}
      <View style={styles.cardTop}>
        <View style={styles.cardTitleRow}>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
            {tender.title}
          </Text>
        </View>
        <FreelanceTenderStatusBadge status={tender.status} />
      </View>

      {/* Category */}
      <Text style={[styles.cardCategory, { color: colors.textMuted }]} numberOfLines={1}>
        {tender.procurementCategory}
      </Text>

      {/* Tags row */}
      <View style={styles.tagsRow}>
        <FreelanceTenderBudgetTag details={tender.details} />
        <FreelanceTenderDeadlineTimer deadline={tender.deadline} />
      </View>

      {/* Stats */}
      <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
        <Text style={[styles.statText, { color: colors.textMuted }]}>
          {appCount} applicant{appCount !== 1 ? 's' : ''}
        </Text>
        <Text style={[styles.statText, { color: colors.textMuted }]}>
          {tender.metadata?.views ?? 0} views
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          onPress={onViewApplicants}
          style={[
            styles.actionBtn,
            {
              backgroundColor: withAlpha(colors.primary, 0.08),
              borderColor: withAlpha(colors.primary, 0.27),
            },
          ]}
          accessibilityRole="button"
        >
          <Text style={[styles.actionBtnText, { color: colors.primary }]}>
            Applicants ({appCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onEdit}
          style={[
            styles.actionBtn,
            { backgroundColor: colors.bgCard, borderColor: colors.border },
          ]}
          accessibilityRole="button"
        >
          <Text style={[styles.actionBtnText, { color: colors.text }]}>Edit</Text>
        </TouchableOpacity>

        {tender.status === 'draft' && (
          <TouchableOpacity
            onPress={onPublish}
            style={[
              styles.actionBtn,
              {
                backgroundColor: withAlpha(colors.success, 0.08),
                borderColor: withAlpha(colors.success, 0.27),
              },
            ]}
            accessibilityRole="button"
          >
            <Text style={[styles.actionBtnText, { color: colors.success }]}>Publish</Text>
          </TouchableOpacity>
        )}

        {tender.status === 'published' && (
          <TouchableOpacity
            onPress={onClose}
            style={[
              styles.actionBtn,
              {
                backgroundColor: withAlpha(colors.danger, 0.06),
                borderColor: withAlpha(colors.danger, 0.20),
              },
            ]}
            accessibilityRole="button"
          >
            <Text style={[styles.actionBtnText, { color: colors.danger }]}>Close</Text>
          </TouchableOpacity>
        )}

        {tender.status === 'draft' && (
          <TouchableOpacity
            onPress={onDelete}
            style={[
              styles.actionBtn,
              {
                backgroundColor: withAlpha(colors.danger, 0.06),
                borderColor: withAlpha(colors.danger, 0.20),
              },
            ]}
            accessibilityRole="button"
          >
            <Text style={[styles.actionBtnText, { color: colors.danger }]}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

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
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 2 },
  createBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  createBtnText: { fontSize: 14, fontWeight: '700' },
  tabsBar: { borderBottomWidth: StyleSheet.hairlineWidth },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
    marginRight: 4,
  },
  tabText: { fontSize: 14 },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  cardTitleRow: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', lineHeight: 22 },
  cardCategory: { fontSize: 12, marginBottom: 10 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  statText: { fontSize: 12 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  actionBtnText: { fontSize: 13, fontWeight: '600' },
});

export default CompanyMyTendersScreen;