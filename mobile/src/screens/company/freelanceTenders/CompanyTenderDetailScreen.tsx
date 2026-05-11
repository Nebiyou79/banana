// mobile/src/screens/company/freelanceTenders/CompanyTenderDetailScreen.tsx

import { FlashList } from '@shopify/flash-list';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
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
  useFreelanceTender,
  useFreelanceTenderApplications,
  usePublishFreelanceTender,
  useUpdateApplicationStatus,
} from '../../../hooks/useFreelanceTender';
import type {
  ApplicationStatus,
  FreelanceTenderApplication,
} from '../../../types/freelanceTender';
import FreelanceTenderStatusBadge from '../../../components/freelanceTenders/FreelanceTenderStatusBadge';
import FreelanceTenderBudgetTag from '../../../components/freelanceTenders/FreelanceTenderBudgetTag';
import FreelanceTenderDeadlineTimer from '../../../components/freelanceTenders/FreelanceTenderDeadlineTimer';
import FreelanceTenderSkillTags from '../../../components/freelanceTenders/FreelanceTenderSkillTags';

type RouteParams = { tenderId: string };
type Tab = 'overview' | 'applicants';

// ─── Application card ─────────────────────────────────────────────────────────

interface ApplicantCardProps {
  app: FreelanceTenderApplication;
  tenderId: string;
}

const ApplicantCard: React.FC<ApplicantCardProps> = React.memo(({ app, tenderId }) => {
  const { colors } = useTheme();
  const updateStatus = useUpdateApplicationStatus();

  // APP_STATUS_COLORS via theme tokens
  const APP_STATUS_COLORS: Record<ApplicationStatus, string> = {
    submitted:    colors.candidate,
    under_review: colors.warning,
    shortlisted:  colors.organization,
    awarded:      colors.success,
    rejected:     colors.danger,
  };

  const applicant =
    typeof app.applicant === 'object'
      ? app.applicant
      : { _id: String(app.applicant), name: 'Unknown', avatar: undefined };

  const STATUS_OPTIONS: ApplicationStatus[] = [
    'under_review',
    'shortlisted',
    'awarded',
    'rejected',
  ];

  const handleStatusChange = (status: ApplicationStatus) => {
    Alert.alert(
      'Update Status',
      `Set application to "${status.replace(/_/g, ' ')}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => updateStatus.mutate({ tenderId, appId: app._id, status }),
        },
      ]
    );
  };

  const statusColor = APP_STATUS_COLORS[app.status] ?? colors.textMuted;

  return (
    <View style={[styles.appCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <View style={styles.appHeader}>
        <View style={[styles.appAvatar, { backgroundColor: withAlpha(colors.primary, 0.13) }]}>
          <Text style={[styles.appAvatarText, { color: colors.primary }]}>
            {applicant.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.appInfo}>
          <Text style={[styles.appName, { color: colors.text }]}>{applicant.name}</Text>
          <Text style={[styles.appDate, { color: colors.textMuted }]}>
            Applied{' '}
            {new Date(app.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
        </View>
        <View style={[styles.appStatusBadge, { backgroundColor: withAlpha(statusColor, 0.13) }]}>
          <Text style={[styles.appStatusText, { color: statusColor }]}>
            {app.status.replace(/_/g, ' ')}
          </Text>
        </View>
      </View>

      <Text style={[styles.appRate, { color: colors.text }]}>
        Proposed: {app.proposedRateCurrency ?? 'ETB'} {app.proposedRate.toLocaleString()}
      </Text>

      <Text style={[styles.appCover, { color: colors.textMuted }]} numberOfLines={3}>
        {app.coverLetter}
      </Text>

      {app.status !== 'awarded' && app.status !== 'rejected' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.appActions}>
          {STATUS_OPTIONS.filter((s) => s !== app.status).map((s) => {
            const sc = APP_STATUS_COLORS[s] ?? colors.textMuted;
            return (
              <TouchableOpacity
                key={s}
                onPress={() => handleStatusChange(s)}
                style={[styles.appActionBtn, { borderColor: withAlpha(sc, 0.40) }]}
                activeOpacity={0.75}
                accessibilityRole="button"
              >
                <Text style={[styles.appActionText, { color: sc }]}>
                  {s.replace(/_/g, ' ')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {updateStatus.isPending && (
        <ActivityIndicator size="small" style={{ marginTop: 8 }} />
      )}
    </View>
  );
});

// ─── Main screen ──────────────────────────────────────────────────────────────

const CompanyTenderDetailScreen: React.FC = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ CompanyTenderDetail: RouteParams }, 'CompanyTenderDetail'>>();
  const { tenderId } = route.params;

  const [tab, setTab] = useState<Tab>('overview');

  const { data: tender, isLoading, refetch, isRefetching } = useFreelanceTender(tenderId);
  const { data: appsData, isLoading: appsLoading } = useFreelanceTenderApplications(tenderId);

  const deleteMutation = useDeleteFreelanceTender();
  const publishMutation = usePublishFreelanceTender();
  const closeMutation = useCloseFreelanceTender();

  const applications: FreelanceTenderApplication[] = appsData?.applications ?? [];
  const appCount = appsData?.pagination?.total ?? 0;

  const handleDelete = useCallback(() => {
    Alert.alert('Delete Tender', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deleteMutation.mutate(tenderId, {
            onSuccess: () => navigation.goBack(),
          }),
      },
    ]);
  }, [deleteMutation, tenderId, navigation]);

  const handlePublish = useCallback(() => {
    Alert.alert('Publish Tender', 'Make this tender live?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Publish', onPress: () => publishMutation.mutate(tenderId) },
    ]);
  }, [publishMutation, tenderId]);

  const handleClose = useCallback(() => {
    Alert.alert('Close Tender', 'Stop accepting new applications?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Close', onPress: () => closeMutation.mutate(tenderId) },
    ]);
  }, [closeMutation, tenderId]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['top']}>
        <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (!tender) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.textMuted }}>Tender not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isDraft = tender.status === 'draft';
  const isPublished = tender.status === 'published';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* Top bar */}
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityRole="button"
        >
          <Text style={[styles.backBtnText, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('CompanyTenderEdit', { tenderId })}
          style={[styles.editTopBtn, { borderColor: colors.border }]}
          accessibilityRole="button"
        >
          <Text style={[styles.editTopBtnText, { color: colors.text }]}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Tab row */}
      <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
        {(['overview', 'applicants'] as Tab[]).map((t) => {
          const active = tab === t;
          return (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={[
                styles.tabItem,
                active && { borderBottomWidth: 2, borderBottomColor: colors.primary },
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: active ? colors.primary : colors.textMuted, fontWeight: active ? '700' : '400' },
                ]}
              >
                {t === 'overview' ? 'Overview' : `Applicants (${appCount})`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {tab === 'overview' ? (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 32 },
          ]}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.badgeRow}>
            <FreelanceTenderStatusBadge status={tender.status} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{tender.title}</Text>
          <Text style={[styles.category, { color: colors.textMuted }]}>{tender.procurementCategory}</Text>

          <View style={styles.metaRow}>
            <FreelanceTenderBudgetTag details={tender.details} />
            <FreelanceTenderDeadlineTimer deadline={tender.deadline} />
          </View>

          {tender.skillsRequired.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Required Skills</Text>
              <FreelanceTenderSkillTags skills={tender.skillsRequired} />
            </View>
          )}

          {tender.briefDescription && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Summary</Text>
              <Text style={[styles.body, { color: colors.text }]}>{tender.briefDescription}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Full Description</Text>
            <Text style={[styles.body, { color: colors.text }]}>
              {tender.description.replace(/<[^>]+>/g, ' ').trim()}
            </Text>
          </View>

          <View style={[styles.statsCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <StatRow label="Views"            value={String(tender.metadata?.views ?? 0)}                textColor={colors.text} mutedColor={colors.textMuted} />
            <StatRow label="Applications"     value={String(tender.metadata?.totalApplications ?? 0)}    textColor={colors.text} mutedColor={colors.textMuted} />
            <StatRow label="Saved by"         value={String(tender.metadata?.savedBy?.length ?? 0)}      textColor={colors.text} mutedColor={colors.textMuted} />
            {tender.maxApplications != null && (
              <StatRow label="Max applications" value={String(tender.maxApplications)}                   textColor={colors.text} mutedColor={colors.textMuted} />
            )}
          </View>

          <View style={styles.ownerActions}>
            {isDraft && (
              <TouchableOpacity
                onPress={handlePublish}
                disabled={publishMutation.isPending}
                style={[styles.ownerActionBtn, { backgroundColor: colors.success }]}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                {publishMutation.isPending ? (
                  <ActivityIndicator color={colors.textInverse} size="small" />
                ) : (
                  <Text style={[styles.ownerActionBtnText, { color: colors.textInverse }]}>
                    Publish Tender
                  </Text>
                )}
              </TouchableOpacity>
            )}
            {isPublished && (
              <TouchableOpacity
                onPress={handleClose}
                disabled={closeMutation.isPending}
                style={[styles.ownerActionBtn, { backgroundColor: colors.textMuted }]}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                {closeMutation.isPending ? (
                  <ActivityIndicator color={colors.textInverse} size="small" />
                ) : (
                  <Text style={[styles.ownerActionBtnText, { color: colors.textInverse }]}>
                    Close Tender
                  </Text>
                )}
              </TouchableOpacity>
            )}
            {isDraft && (
              <TouchableOpacity
                onPress={handleDelete}
                disabled={deleteMutation.isPending}
                style={[styles.ownerActionBtn, { backgroundColor: colors.danger }]}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                {deleteMutation.isPending ? (
                  <ActivityIndicator color={colors.textInverse} size="small" />
                ) : (
                  <Text style={[styles.ownerActionBtnText, { color: colors.textInverse }]}>
                    Delete Tender
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      ) : appsLoading ? (
        <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />
      ) : (
        <FlashList
          data={applications}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 32,
          }}
          renderItem={({ item }) => (
            <ApplicantCard app={item} tenderId={tenderId} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyApps}>
              <Text style={[styles.emptyAppsText, { color: colors.textMuted }]}>
                No applications yet.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const StatRow: React.FC<{ label: string; value: string; textColor: string; mutedColor: string }> = ({
  label, value, textColor, mutedColor,
}) => (
  <View style={styles.statRow}>
    <Text style={[styles.statLabel, { color: mutedColor }]}>{label}</Text>
    <Text style={[styles.statValue, { color: textColor }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { minHeight: 44, justifyContent: 'center', paddingRight: 12 },
  backBtnText: { fontSize: 15, fontWeight: '600' },
  editTopBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, minHeight: 44, justifyContent: 'center' },
  editTopBtnText: { fontSize: 13, fontWeight: '600' },
  tabRow: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 12, minHeight: 44, justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 14 },
  content: { padding: 16 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 4, lineHeight: 30 },
  category: { fontSize: 13, marginBottom: 14 },
  metaRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 20 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 },
  body: { fontSize: 15, lineHeight: 24 },
  statsCard: { borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 20 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.05)' },
  statLabel: { fontSize: 13 },
  statValue: { fontSize: 13, fontWeight: '700' },
  ownerActions: { gap: 10, marginBottom: 40 },
  ownerActionBtn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center', minHeight: 52 },
  ownerActionBtnText: { fontSize: 15, fontWeight: '700' },
  appCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 14 },
  appHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  appAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  appAvatarText: { fontSize: 16, fontWeight: '700' },
  appInfo: { flex: 1 },
  appName: { fontSize: 14, fontWeight: '700' },
  appDate: { fontSize: 11, marginTop: 2 },
  appStatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  appStatusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  appRate: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  appCover: { fontSize: 13, lineHeight: 19, marginBottom: 10 },
  appActions: { marginTop: 4 },
  appActionBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, minHeight: 44, justifyContent: 'center' },
  appActionText: { fontSize: 12, fontWeight: '700' },
  emptyApps: { padding: 40, alignItems: 'center' },
  emptyAppsText: { fontSize: 14 },
});

export default CompanyTenderDetailScreen;