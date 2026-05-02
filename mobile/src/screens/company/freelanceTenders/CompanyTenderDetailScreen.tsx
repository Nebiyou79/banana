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
import { useThemeStore } from '../../../store/themeStore';
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

const APP_STATUS_COLORS: Record<ApplicationStatus, string> = {
  submitted: '#3B82F6',
  under_review: '#F59E0B',
  shortlisted: '#8B5CF6',
  awarded: '#10B981',
  rejected: '#EF4444',
};

interface ApplicantCardProps {
  app: FreelanceTenderApplication;
  tenderId: string;
  textColor: string;
  mutedColor: string;
  surfaceColor: string;
  borderColor: string;
  primaryColor: string;
}

const ApplicantCard: React.FC<ApplicantCardProps> = React.memo(
  ({ app, tenderId, textColor, mutedColor, surfaceColor, borderColor, primaryColor }) => {
    const updateStatus = useUpdateApplicationStatus();
    const applicant =
      typeof app.applicant === 'object' ? app.applicant : { _id: String(app.applicant), name: 'Unknown', avatar: undefined };

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
            onPress: () =>
              updateStatus.mutate({ tenderId, appId: app._id, status }),
          },
        ]
      );
    };

    const statusColor = APP_STATUS_COLORS[app.status] ?? mutedColor;

    return (
      <View style={[styles.appCard, { backgroundColor: surfaceColor, borderColor }]}>
        {/* Applicant info */}
        <View style={styles.appHeader}>
          <View style={[styles.appAvatar, { backgroundColor: primaryColor + '22' }]}>
            <Text style={[styles.appAvatarText, { color: primaryColor }]}>
              {applicant.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.appInfo}>
            <Text style={[styles.appName, { color: textColor }]}>{applicant.name}</Text>
            <Text style={[styles.appDate, { color: mutedColor }]}>
              Applied {new Date(app.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          </View>
          <View style={[styles.appStatusBadge, { backgroundColor: statusColor + '22' }]}>
            <Text style={[styles.appStatusText, { color: statusColor }]}>
              {app.status.replace(/_/g, ' ')}
            </Text>
          </View>
        </View>

        {/* Rate */}
        <Text style={[styles.appRate, { color: textColor }]}>
          Proposed: {app.proposedRateCurrency ?? 'ETB'} {app.proposedRate.toLocaleString()}
        </Text>

        {/* Cover letter preview */}
        <Text style={[styles.appCover, { color: mutedColor }]} numberOfLines={3}>
          {app.coverLetter}
        </Text>

        {/* Status actions */}
        {app.status !== 'awarded' && app.status !== 'rejected' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.appActions}>
            {STATUS_OPTIONS.filter((s) => s !== app.status).map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => handleStatusChange(s)}
                style={[
                  styles.appActionBtn,
                  { borderColor: (APP_STATUS_COLORS[s] ?? mutedColor) + '66' },
                ]}
                activeOpacity={0.75}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.appActionText,
                    { color: APP_STATUS_COLORS[s] ?? mutedColor },
                  ]}
                >
                  {s.replace(/_/g, ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {updateStatus.isPending && (
          <ActivityIndicator size="small" style={{ marginTop: 8 }} />
        )}
      </View>
    );
  }
);

// ─── Main screen ──────────────────────────────────────────────────────────────

const CompanyTenderDetailScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const c = theme.colors;
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
      {
        text: 'Close',
        style: 'destructive',
        onPress: () => closeMutation.mutate(tenderId),
      },
    ]);
  }, [closeMutation, tenderId]);

  if (isLoading || !tender) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: c.background ?? c.card }]} edges={['top']}>
        <ActivityIndicator color={c.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  const isDraft = tender.status === 'draft';
  const isPublished = tender.status === 'published';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background ?? c.card }]} edges={['top']}>
      {/* Top bar */}
      <View style={[styles.topBar, { borderBottomColor: c.border ?? c.textMuted + '22' }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={[styles.backBtnText, { color: c.primary }]}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('FreelanceTenderEdit', { tenderId })}
          style={[styles.editTopBtn, { borderColor: c.primary + '66' }]}
          accessibilityRole="button"
        >
          <Text style={[styles.editTopBtnText, { color: c.primary }]}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabRow, { borderBottomColor: c.border ?? c.textMuted + '22' }]}>
        {(['overview', 'applicants'] as Tab[]).map((t) => {
          const active = tab === t;
          return (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tabItem, active && { borderBottomColor: c.primary, borderBottomWidth: 2 }]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.tabText, { color: active ? c.primary : c.textMuted, fontWeight: active ? '700' : '400' }]}>
                {t === 'applicants' ? `Applicants (${appCount})` : 'Overview'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {tab === 'overview' ? (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={c.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Status + badges */}
          <View style={styles.badgeRow}>
            <FreelanceTenderStatusBadge status={tender.status} />
          </View>

          <Text style={[styles.title, { color: c.text }]}>{tender.title}</Text>
          <Text style={[styles.category, { color: c.textMuted }]}>{tender.procurementCategory}</Text>

          {/* Meta */}
          <View style={styles.metaRow}>
            <FreelanceTenderBudgetTag details={tender.details} />
            <FreelanceTenderDeadlineTimer deadline={tender.deadline} />
          </View>

          {/* Skills */}
          {tender.skillsRequired.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>Required Skills</Text>
              <FreelanceTenderSkillTags skills={tender.skillsRequired} />
            </View>
          )}

          {/* Brief */}
          {tender.briefDescription && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>Summary</Text>
              <Text style={[styles.body, { color: c.text }]}>{tender.briefDescription}</Text>
            </View>
          )}

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Full Description</Text>
            <Text style={[styles.body, { color: c.text }]}>
              {tender.description.replace(/<[^>]+>/g, ' ').trim()}
            </Text>
          </View>

          {/* Stats */}
          <View style={[styles.statsCard, { backgroundColor: c.surface ?? c.card, borderColor: c.border ?? c.textMuted + '33' }]}>
            <StatRow label="Views" value={String(tender.metadata?.views ?? 0)} textColor={c.text} mutedColor={c.textMuted} />
            <StatRow label="Applications" value={String(tender.metadata?.totalApplications ?? 0)} textColor={c.text} mutedColor={c.textMuted} />
            <StatRow label="Saved by" value={String(tender.metadata?.savedBy?.length ?? 0)} textColor={c.text} mutedColor={c.textMuted} />
            {tender.maxApplications != null && (
              <StatRow label="Max applications" value={String(tender.maxApplications)} textColor={c.text} mutedColor={c.textMuted} />
            )}
          </View>

          {/* Owner actions */}
          <View style={styles.ownerActions}>
            {isDraft && (
              <TouchableOpacity
                onPress={handlePublish}
                disabled={publishMutation.isPending}
                style={[styles.ownerActionBtn, { backgroundColor: c.success }]}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                {publishMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.ownerActionBtnText}>Publish Tender</Text>
                )}
              </TouchableOpacity>
            )}
            {isPublished && (
              <TouchableOpacity
                onPress={handleClose}
                disabled={closeMutation.isPending}
                style={[styles.ownerActionBtn, { backgroundColor: c.textMuted }]}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                {closeMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.ownerActionBtnText}>Close Tender</Text>
                )}
              </TouchableOpacity>
            )}
            {isDraft && (
              <TouchableOpacity
                onPress={handleDelete}
                disabled={deleteMutation.isPending}
                style={[styles.ownerActionBtn, { backgroundColor: c.error ?? '#EF4444' }]}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                {deleteMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.ownerActionBtnText}>Delete Tender</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      ) : (
        // Applicants tab
        appsLoading ? (
          <ActivityIndicator color={c.primary} style={{ flex: 1 }} />
        ) : (
          <FlashList
            data={applications}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.content}
            renderItem={({ item }) => (
              <ApplicantCard
                app={item}
                tenderId={tenderId}
                textColor={c.text}
                mutedColor={c.textMuted}
                surfaceColor={c.surface ?? c.card}
                borderColor={c.border ?? c.textMuted + '33'}
                primaryColor={c.primary}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyApps}>
                <Text style={[styles.emptyAppsText, { color: c.textMuted }]}>
                  No applications yet.
                </Text>
              </View>
            }
          />
        )
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
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 12, minHeight: 44, justifyContent: 'center' },
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
  ownerActionBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
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