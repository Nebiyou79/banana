// ─────────────────────────────────────────────────────────────────────────────
// screens/company/CompanyJobListScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, SafeAreaView, ScrollView,
} from 'react-native';
import { Ionicons }       from '@expo/vector-icons';
import { useNavigation }  from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore }  from '../../store/themeStore';
import { useAuthStore }   from '../../store/authStore';
import {
  useCompanyJobs, useOrganizationJobs,
  useDeleteJob, useDeleteOrganizationJob,
} from '../../hooks/useJobs';
import { CompanyJobCard } from '../../components/jobs/JobComponents';
import { Job }            from '../../services/jobService';
import type { CompanyStackParamList }      from '../../navigation/CompanyNavigator';
import type { OrganizationStackParamList } from '../../navigation/OrganizationNavigator';

type CompanyNav = NativeStackNavigationProp<CompanyStackParamList>;
type OrgNav     = NativeStackNavigationProp<OrganizationStackParamList>;

const STATUS_TABS = ['All', 'Active', 'Draft', 'Closed'];

export const CompanyJobListScreen: React.FC = () => {
  const { theme }  = useThemeStore();
  const { colors, typography, spacing } = theme;
  const { role }   = useAuthStore();
  const navigation = useNavigation<CompanyNav | OrgNav>();
  const isOrg      = role === 'organization';

  const [activeTab, setActiveTab] = useState('All');
  const statusFilter = activeTab === 'All' ? undefined : activeTab.toLowerCase();

  const companyQuery = useCompanyJobs(isOrg ? undefined : { status: statusFilter });
  const orgQuery     = useOrganizationJobs(isOrg ? { status: statusFilter } : undefined);
  const query        = isOrg ? orgQuery : companyQuery;

  const deleteCompanyJob = useDeleteJob();
  const deleteOrgJob     = useDeleteOrganizationJob();

  const allJobs: Job[] = query.data?.pages.flatMap((p) => p.jobs) ?? [];
  const totalCount     = query.data?.pages[0]?.pagination.totalResults ?? allJobs.length;

  const handleDelete = (jobId: string) => {
    if (isOrg) deleteOrgJob.mutate(jobId);
    else deleteCompanyJob.mutate(jobId);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[cj.header, { borderBottomColor: colors.border }]}>
        <Text style={[cj.headerTitle, { color: colors.text, fontSize: typography.xl }]}>
          My {isOrg ? 'Opportunities' : 'Jobs'}
        </Text>
        <View style={[cj.countBadge, { backgroundColor: colors.primary + '18' }]}>
          <Text style={[{ color: colors.primary, fontSize: typography.xs, fontWeight: '700' }]}>{totalCount}</Text>
        </View>
      </View>

      {/* Status filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing[4], paddingVertical: 8, gap: 8 }}
      >
        {STATUS_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              cj.tab,
              {
                backgroundColor: activeTab === tab ? colors.primary : colors.surface,
                borderColor:     activeTab === tab ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={[{
              color:      activeTab === tab ? '#fff' : colors.textMuted,
              fontWeight: activeTab === tab ? '700' : '500',
              fontSize:   typography.sm,
            }]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Job list */}
      <FlatList
        data={allJobs}
        keyExtractor={(j) => j._id}
        contentContainerStyle={{ paddingHorizontal: spacing[4], paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={colors.primary} />}
        onEndReached={() => { if (query.hasNextPage) query.fetchNextPage(); }}
        onEndReachedThreshold={0.3}
        renderItem={({ item }) => (
          <CompanyJobCard
            job={item}
            onEdit={() => (navigation as CompanyNav).navigate('EditJob', { jobId: item._id })}
            onDelete={() => handleDelete(item._id)}
            onViewApplicants={() =>
              (navigation as CompanyNav).navigate('ApplicantList', { jobId: item._id, jobTitle: item.title })
            }
          />
        )}
        ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} /> : null}
        ListEmptyComponent={
          !query.isLoading ? (
            <View style={cj.emptyState}>
              <Ionicons name="briefcase-outline" size={48} color={colors.textMuted} />
              <Text style={[cj.emptyTitle, { color: colors.text, fontSize: typography.lg }]}>
                No {isOrg ? 'opportunities' : 'jobs'} yet
              </Text>
              <Text style={[{ color: colors.textMuted, fontSize: typography.sm, textAlign: 'center' }]}>
                Post your first {isOrg ? 'opportunity' : 'job'} to start receiving applications
              </Text>
            </View>
          ) : <ActivityIndicator color={colors.primary} style={{ marginVertical: 32 }} />
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={[cj.fab, { backgroundColor: colors.primary }]}
        onPress={() => (navigation as CompanyNav).navigate('CreateJob')}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// screens/company/CreateJobScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────
import { useCreateJob, useCreateOrganizationJob } from '../../hooks/useJobs';
import { JobForm } from '../../components/jobs/JobForm';
import { CreateJobData } from '../../services/jobService';
import { useToast } from '../../hooks/useToast';

export const CreateJobScreen: React.FC = () => {
  const { theme }  = useThemeStore();
  const { colors, typography } = theme;
  const { role }   = useAuthStore();
  const navigation = useNavigation<CompanyNav>();
  const isOrg      = role === 'organization';

  const createCompanyJob = useCreateJob();
  const createOrgJob     = useCreateOrganizationJob();
  const { showError }    = useToast();

  const handleCreate = (data: CreateJobData) => {
    const mutation = isOrg ? createOrgJob : createCompanyJob;
    mutation.mutate(data, {
      onSuccess: () => navigation.goBack(),
      onError:   (e: any) => showError(e?.response?.data?.message ?? 'Failed to create job'),
    });
  };

  const isPending = isOrg ? createOrgJob.isPending : createCompanyJob.isPending;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <SafeAreaView>
        <View style={[cj.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[cj.headerTitle, { color: colors.text, fontSize: typography.lg }]}>
            Post a {isOrg ? 'Opportunity' : 'Job'}
          </Text>
          <View style={{ width: 24 }} />
        </View>
      </SafeAreaView>
      <JobForm mode="create" onSubmit={handleCreate} isLoading={isPending} />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// screens/company/EditJobScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useJob, useUpdateJob, useUpdateOrganizationJob } from '../../hooks/useJobs';

type EditJobRoute = RouteProp<CompanyStackParamList, 'EditJob'>;

export const EditJobScreen: React.FC = () => {
  const { theme }  = useThemeStore();
  const { colors, typography } = theme;
  const { role }   = useAuthStore();
  const navigation = useNavigation<CompanyNav>();
  const route      = useRoute<EditJobRoute>();
  const { jobId }  = route.params;
  const isOrg      = role === 'organization';

  const { data: job, isLoading } = useJob(jobId);
  const updateCompanyJob = useUpdateJob();
  const updateOrgJob     = useUpdateOrganizationJob();
  const { showError }    = useToast();

  const handleUpdate = (data: CreateJobData) => {
    const mutation = isOrg ? updateOrgJob : updateCompanyJob;
    mutation.mutate(
      { id: jobId, data },
      {
        onSuccess: () => navigation.goBack(),
        onError:   (e: any) => showError(e?.response?.data?.message ?? 'Failed to update job'),
      }
    );
  };

  if (isLoading) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView>
        <View style={[cj.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[cj.headerTitle, { color: colors.text, fontSize: typography.lg }]}>Edit Job</Text>
          <View style={{ width: 22 }} />
        </View>
      </SafeAreaView>
      {job && (
        <JobForm
          mode="edit"
          initialData={job}
          onSubmit={handleUpdate}
          isLoading={isOrg ? updateOrgJob.isPending : updateCompanyJob.isPending}
        />
      )}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// screens/company/ApplicantListScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────

type ApplicantListRoute = RouteProp<CompanyStackParamList, 'ApplicantList'>;

const APP_STATUS_TABS = ['All', 'Applied', 'Shortlisted', 'Interview', 'Offer', 'Rejected'];

export const ApplicantListScreen: React.FC = () => {
  const { theme }  = useThemeStore();
  const { colors, typography, spacing } = theme;
  const navigation = useNavigation<CompanyNav>();
  const route      = useRoute<ApplicantListRoute>();
  const { jobId, jobTitle } = route.params;

  const [activeTab, setActiveTab] = useState('All');

  // NOTE: useJobApplications hook is defined in the Applications module (Prompt 02)
  // This screen shows a placeholder until that module is built.
  // Once Applications module is built, replace the content below with:
  //   const { data: applications = [] } = useJobApplications(jobId);
  //   then render CompanyApplicationCard list

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[cj.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[cj.headerTitle, { color: colors.text, fontSize: typography.base, flex: 1 }]} numberOfLines={1}>
          {jobTitle}
        </Text>
      </View>

      {/* Status filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing[4], paddingVertical: 8, gap: 8 }}
      >
        {APP_STATUS_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[cj.tab, {
              backgroundColor: activeTab === tab ? colors.primary : colors.surface,
              borderColor:     activeTab === tab ? colors.primary : colors.border,
            }]}
          >
            <Text style={[{
              color:      activeTab === tab ? '#fff' : colors.textMuted,
              fontWeight: activeTab === tab ? '700' : '500',
              fontSize:   typography.sm,
            }]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Placeholder — replaced when Applications module (Prompt 02) is built */}
      <View style={cj.emptyState}>
        <Ionicons name="people-outline" size={48} color={colors.textMuted} />
        <Text style={[cj.emptyTitle, { color: colors.text, fontSize: typography.lg }]}>Applicants</Text>
        <Text style={[{ color: colors.textMuted, fontSize: typography.sm, textAlign: 'center', paddingHorizontal: 32 }]}>
          Application cards will appear here once the Applications module is integrated.
          {'\n\n'}Job ID: {jobId}
        </Text>
      </View>
    </SafeAreaView>
  );
};

// ─── Shared styles ────────────────────────────────────────────────────────────
const cj = StyleSheet.create({
  header:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  headerTitle:{ fontWeight: '700' },
  countBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  tab:        { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1 },
  fab:        { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontWeight: '700', marginTop: 12, marginBottom: 8 },
});
