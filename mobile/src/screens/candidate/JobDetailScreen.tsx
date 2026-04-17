/**
 * src/screens/candidate/JobDetailScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Full candidate job detail view.
 * Uses JobHeader for colourful top section.
 * Tabs: Overview · Requirements · Details · Company
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, Share, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useJob, useSaveJob, useUnsaveJob, useSavedJobs } from '../../hooks/useJobs';
import { ListSkeleton } from '../../components/skeletons';
import { JobHeader } from '../../components/jobs/JobHeader';
import { Job } from '../../services/jobService';

interface Props {
  navigation: any;
  route: { params: { jobId: string } };
}

type Tab = 'overview' | 'requirements' | 'details' | 'company';
const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'overview',     label: 'Overview',      icon: 'document-text-outline' },
  { key: 'requirements', label: 'Requirements',  icon: 'checkmark-circle-outline' },
  { key: 'details',      label: 'Details',       icon: 'information-circle-outline' },
  { key: 'company',      label: 'Company',       icon: 'business-outline' },
];

// ─── Education map ────────────────────────────────────────────────────────────
const EDU_LABELS: Record<string, string> = {
  'primary-education': 'Primary Education',
  'secondary-education': 'Secondary Education',
  'tvet-level-i': 'TVET Level I', 'tvet-level-ii': 'TVET Level II',
  'tvet-level-iii': 'TVET Level III', 'tvet-level-iv': 'TVET Level IV',
  'tvet-level-v': 'TVET Level V',
  'undergraduate-bachelors': "Bachelor's Degree",
  'postgraduate-masters': "Master's Degree",
  'doctoral-phd': 'PhD / Doctoral',
  'none-required': 'No Requirement',
};

const EXP_LABELS: Record<string, string> = {
  'fresh-graduate': 'Fresh Graduate', 'entry-level': 'Entry Level',
  'mid-level': 'Mid Level', 'senior-level': 'Senior Level',
  'managerial': 'Managerial', 'director': 'Director', 'executive': 'Executive',
};

const REMOTE_LABELS: Record<string, string> = {
  'on-site': 'On-Site', 'hybrid': 'Hybrid', 'remote': 'Fully Remote',
};

export const JobDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { jobId } = route.params;
  const { theme } = useThemeStore();
  const c = theme.colors;

  const jobQ = useJob(jobId);
  const savedJobsQ = useSavedJobs();
  const saveMut   = useSaveJob();
  const unsaveMut = useUnsaveJob();

  const [tab, setTab] = useState<Tab>('overview');

  const job = jobQ.data;
  const isSaved = (savedJobsQ.data ?? []).some(j => j._id === jobId);

  const handleSave = useCallback(() => {
    if (isSaved) unsaveMut.mutate(jobId);
    else saveMut.mutate(jobId);
  }, [isSaved, jobId, saveMut, unsaveMut]);

  const handleShare = useCallback(async () => {
    if (!job) return;
    const owner = job.company ?? job.organization;
    await Share.share({
      message: `Check out this job: ${job.title} at ${owner?.name ?? ''}\n\nApply on Banana App.`,
    });
  }, [job]);

  const handleApply = useCallback(() => {
    if (!job) return;
    if (!job.isApplyEnabled) {
      Alert.alert('Applications Closed', 'Applications are currently closed for this position.');
      return;
    }
    const deadlinePast = job.applicationDeadline
      ? new Date(job.applicationDeadline) < new Date()
      : false;
    if (deadlinePast) {
      Alert.alert('Deadline Passed', 'The application deadline for this position has passed.');
      return;
    }
    navigation.navigate('ApplyJob', { jobId: job._id, jobTitle: job.title });
  }, [job, navigation]);

  if (jobQ.isLoading) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: c.background }]} edges={[]}>
        <View style={[s.loadingHeader, { backgroundColor: '#0F2040' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <ListSkeleton count={3} type="job" />
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: c.background }]} edges={['top']}>
        <View style={[s.emptyContainer, { backgroundColor: c.background }]}>
          <Ionicons name="alert-circle-outline" size={64} color={c.textMuted} />
          <Text style={[s.emptyTitle, { color: c.text }]}>Job Not Found</Text>
          <Text style={[s.emptySubtitle, { color: c.textMuted }]}>This job may have been removed.</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[s.backButton, { backgroundColor: c.primary }]}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const canApply = job.isApplyEnabled &&
    (!job.applicationDeadline || new Date(job.applicationDeadline) >= new Date());

  return (
    <SafeAreaView style={[s.root, { backgroundColor: c.background }]} edges={[]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Colourful Job Header */}
        <JobHeader
          job={job}
          onBack={() => navigation.goBack()}
          onSave={handleSave}
          onShare={handleShare}
          isSaved={isSaved}
        />

        {/* Tab bar — sticky */}
        <View style={[s.tabBar, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>
            {TABS.map(t => {
              const active = tab === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  onPress={() => setTab(t.key)}
                  style={[s.tab, active && { borderBottomColor: c.primary, borderBottomWidth: 2 }]}
                >
                  <Ionicons name={t.icon as any} size={14} color={active ? c.primary : c.textMuted} />
                  <Text style={[s.tabText, { color: active ? c.primary : c.textMuted, fontWeight: active ? '700' : '400' }]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Tab Content */}
        <View style={s.content}>
          {tab === 'overview' && <OverviewTab job={job} c={c} />}
          {tab === 'requirements' && <RequirementsTab job={job} c={c} />}
          {tab === 'details' && <DetailsTab job={job} c={c} />}
          {tab === 'company' && <CompanyTab job={job} c={c} />}
        </View>
      </ScrollView>

      {/* Apply CTA */}
      <View style={[s.cta, { backgroundColor: c.surface, borderTopColor: c.border }]}>
        <View style={s.ctaLeft}>
          {job.applicationInfo?.applicationCount !== undefined && (
            <Text style={[s.ctaApplicants, { color: c.textMuted }]}>
              {job.applicationInfo.applicationCount} applicants
            </Text>
          )}
          {canApply && job.applicationInfo?.candidatesRemaining !== undefined && (
            <Text style={[s.ctaSpots, { color: c.success ?? '#10B981' }]}>
              {job.applicationInfo.candidatesRemaining} spot{job.applicationInfo.candidatesRemaining !== 1 ? 's' : ''} left
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={handleApply}
          disabled={!canApply}
          style={[
            s.applyBtn,
            { backgroundColor: canApply ? c.primary : c.border },
          ]}
        >
          <Ionicons name="send-outline" size={18} color={canApply ? '#fff' : c.textMuted} />
          <Text style={[s.applyBtnText, { color: canApply ? '#fff' : c.textMuted }]}>
            {canApply ? 'Apply Now' : 'Closed'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ─── Overview Tab ─────────────────────────────────────────────────────────────
const OverviewTab = ({ job, c }: { job: Job; c: any }) => (
  <View>
    {job.shortDescription && (
      <Card c={c} title="Overview" icon="information-circle-outline">
        <Text style={[ts.body, { color: c.textSecondary ?? c.textMuted }]}>{job.shortDescription}</Text>
      </Card>
    )}
    <Card c={c} title="Job Description" icon="document-text-outline">
      <Text style={[ts.body, { color: c.textSecondary ?? c.textMuted }]}>{job.description}</Text>
    </Card>
    {(job.skills ?? []).length > 0 && (
      <Card c={c} title="Key Skills" icon="sparkles-outline">
        <View style={ts.tagsRow}>
          {job.skills!.map((sk, i) => (
            <View key={i} style={[ts.tag, { backgroundColor: `${c.primary}15`, borderColor: `${c.primary}30` }]}>
              <Text style={[ts.tagText, { color: c.primary }]}>{sk}</Text>
            </View>
          ))}
        </View>
      </Card>
    )}
    {(job.benefits ?? []).length > 0 && (
      <Card c={c} title="Benefits & Perks" icon="gift-outline">
        {job.benefits!.map((b, i) => (
          <BulletItem key={i} text={b} c={c} icon="checkmark-circle" color="#10B981" />
        ))}
      </Card>
    )}
  </View>
);

// ─── Requirements Tab ─────────────────────────────────────────────────────────
const RequirementsTab = ({ job, c }: { job: Job; c: any }) => (
  <View>
    {(job.requirements ?? []).length > 0 && (
      <Card c={c} title="Requirements" icon="checkmark-circle-outline">
        {job.requirements!.map((r, i) => (
          <BulletItem key={i} text={r} c={c} icon="checkmark-circle" color={c.primary} />
        ))}
      </Card>
    )}
    {(job.responsibilities ?? []).length > 0 && (
      <Card c={c} title="Responsibilities" icon="list-outline">
        {job.responsibilities!.map((r, i) => (
          <BulletItem key={i} text={r} c={c} icon="arrow-forward-circle" color="#F59E0B" />
        ))}
      </Card>
    )}
    {(job.requirements ?? []).length === 0 && (job.responsibilities ?? []).length === 0 && (
      <View style={ts.emptyTab}>
        <Ionicons name="document-outline" size={40} color={c.textMuted} />
        <Text style={[ts.emptyText, { color: c.textMuted }]}>No requirements listed</Text>
      </View>
    )}
  </View>
);

// ─── Details Tab ─────────────────────────────────────────────────────────────
const DetailsTab = ({ job, c }: { job: Job; c: any }) => {
  const rows = [
    { icon: 'briefcase-outline', label: 'Employment Type', value: job.type },
    { icon: 'trending-up-outline', label: 'Experience Level', value: EXP_LABELS[job.experienceLevel] ?? job.experienceLevel },
    { icon: 'school-outline', label: 'Education Level', value: EDU_LABELS[job.educationLevel ?? ''] ?? job.educationLevel },
    { icon: 'globe-outline', label: 'Work Mode', value: REMOTE_LABELS[job.remote] ?? job.remote },
    { icon: 'business-outline', label: 'Work Arrangement', value: job.workArrangement === 'office' ? 'Office Based' : job.workArrangement === 'field-work' ? 'Field Work' : job.workArrangement === 'both' ? 'Office & Field' : undefined },
    { icon: 'location-outline', label: 'Region', value: job.location?.region },
    { icon: 'map-outline', label: 'City', value: job.location?.city },
    { icon: 'flag-outline', label: 'Country', value: job.location?.country ?? 'Ethiopia' },
    { icon: 'people-outline', label: 'Positions Available', value: job.candidatesNeeded ? `${job.candidatesNeeded} position${job.candidatesNeeded > 1 ? 's' : ''}` : undefined },
    { icon: 'calendar-outline', label: 'Posted On', value: job.createdAt ? new Date(job.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined },
    { icon: 'time-outline', label: 'Application Deadline', value: job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined },
    { icon: 'document-outline', label: 'Job Reference', value: job.jobNumber },
  ].filter(r => r.value);

  const salaryText = (() => {
    if (job.salaryDisplay) return job.salaryDisplay;
    if (job.salaryMode === 'negotiable') return 'Negotiable';
    if (job.salaryMode === 'hidden') return 'Confidential';
    if (job.salaryMode === 'company-scale') return 'As per company scale';
    if (job.salary?.min || job.salary?.max) {
      const fmt = (n: number) => n.toLocaleString();
      const cur = job.salary?.currency ?? 'ETB';
      if (job.salary?.min && job.salary?.max) return `${cur} ${fmt(job.salary.min)} – ${fmt(job.salary.max)} / ${job.salary?.period ?? 'month'}`;
      if (job.salary?.min) return `${cur} ${fmt(job.salary.min)}+ / ${job.salary?.period ?? 'month'}`;
    }
    return null;
  })();

  return (
    <View>
      {salaryText && (
        <Card c={c} title="Salary & Compensation" icon="cash-outline">
          <View style={[ts.salaryBox, { backgroundColor: `${c.success ?? '#10B981'}10`, borderColor: `${c.success ?? '#10B981'}30` }]}>
            <Ionicons name="cash-outline" size={22} color={c.success ?? '#10B981'} />
            <Text style={[ts.salaryText, { color: c.success ?? '#10B981' }]}>{salaryText}</Text>
          </View>
        </Card>
      )}
      <Card c={c} title="Position Details" icon="information-circle-outline">
        {rows.map((row, i) => (
          <View key={i} style={[ts.detailRow, { borderBottomColor: c.border }]}>
            <View style={[ts.detailIconBox, { backgroundColor: `${c.primary}15` }]}>
              <Ionicons name={row.icon as any} size={15} color={c.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[ts.detailLabel, { color: c.textMuted }]}>{row.label}</Text>
              <Text style={[ts.detailValue, { color: c.text }]}>{String(row.value)}</Text>
            </View>
          </View>
        ))}
      </Card>
      {job.demographicRequirements?.sex && job.demographicRequirements.sex !== 'any' && (
        <Card c={c} title="Additional Requirements" icon="person-outline">
          <InfoRow icon="person-outline" label="Gender" value={job.demographicRequirements.sex === 'male' ? 'Male Only' : 'Female Only'} c={c} />
          {job.demographicRequirements.age?.min && (
            <InfoRow icon="calendar-outline" label="Min Age" value={`${job.demographicRequirements.age.min} years`} c={c} />
          )}
          {job.demographicRequirements.age?.max && (
            <InfoRow icon="calendar-outline" label="Max Age" value={`${job.demographicRequirements.age.max} years`} c={c} />
          )}
        </Card>
      )}
    </View>
  );
};

// ─── Company Tab ──────────────────────────────────────────────────────────────
const CompanyTab = ({ job, c }: { job: Job; c: any }) => {
  const owner = job.jobType === 'organization' ? job.organization : job.company;
  const isOrg = job.jobType === 'organization';

  if (!owner) {
    return (
      <View style={ts.emptyTab}>
        <Ionicons name="business-outline" size={40} color={c.textMuted} />
        <Text style={[ts.emptyText, { color: c.textMuted }]}>No company info available</Text>
      </View>
    );
  }

  return (
    <View>
      <Card c={c} title={isOrg ? 'Organization Info' : 'Company Info'} icon="business-outline">
        <View style={[ts.companyHeader, { borderBottomColor: c.border }]}>
          <View style={[ts.companyLogoBox, { backgroundColor: isOrg ? '#7C3AED' : '#F1BB03' }]}>
            <Text style={ts.companyLogoText}>
              {(owner.name ?? '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[ts.companyName, { color: c.text }]}>{owner.name}</Text>
              {owner.verified && <Ionicons name="checkmark-circle" size={16} color="#10B981" />}
            </View>
            {owner.industry && (
              <Text style={[ts.companyIndustry, { color: c.textMuted }]}>{owner.industry}</Text>
            )}
          </View>
        </View>
        <Text style={[ts.companyNote, { color: c.textMuted }]}>
          {isOrg ? 'This opportunity is posted by a verified organization on Banana.' : 'This job is posted by a verified company on Banana.'}
        </Text>
      </Card>
      <Card c={c} title="Posted By" icon="person-circle-outline">
        <View style={[ts.detailRow, { borderBottomColor: c.border }]}>
          <Ionicons name="business-outline" size={16} color={c.textMuted} />
          <Text style={[ts.detailValue, { color: c.text }]}>{isOrg ? 'Organization' : 'Company'}</Text>
        </View>
        <View style={[ts.detailRow, { borderBottomColor: c.border }]}>
          <Ionicons name="calendar-outline" size={16} color={c.textMuted} />
          <Text style={[ts.detailValue, { color: c.text }]}>
            Posted {job.createdAt ? new Date(job.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
          </Text>
        </View>
      </Card>
    </View>
  );
};

// ─── Reusable atoms ───────────────────────────────────────────────────────────
const Card = ({ children, title, icon, c }: any) => (
  <View style={[ts.card, { backgroundColor: c.card ?? c.surface, borderColor: c.border }]}>
    <View style={[ts.cardHeader, { borderBottomColor: c.border }]}>
      <Ionicons name={icon} size={18} color={c.primary} />
      <Text style={[ts.cardTitle, { color: c.text }]}>{title}</Text>
    </View>
    <View style={ts.cardBody}>{children}</View>
  </View>
);

const BulletItem = ({ text, c, icon, color }: any) => (
  <View style={ts.bulletRow}>
    <Ionicons name={icon} size={16} color={color} style={{ marginTop: 2 }} />
    <Text style={[ts.bulletText, { color: c.textSecondary ?? c.textMuted }]}>{text}</Text>
  </View>
);

const InfoRow = ({ icon, label, value, c }: any) => (
  <View style={[ts.detailRow, { borderBottomColor: c.border }]}>
    <View style={[ts.detailIconBox, { backgroundColor: `${c.primary}15` }]}>
      <Ionicons name={icon} size={15} color={c.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[ts.detailLabel, { color: c.textMuted }]}>{label}</Text>
      <Text style={[ts.detailValue, { color: c.text }]}>{value}</Text>
    </View>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:          { flex: 1 },
  loadingHeader: { height: 180, paddingTop: 50, paddingLeft: 16 },
  backBtn:       { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  emptyContainer:{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyTitle:    { fontSize: 20, fontWeight: '700' },
  emptySubtitle: { fontSize: 14, textAlign: 'center' },
  backButton:    { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  tabBar:        { borderBottomWidth: 1 },
  tabs:          { paddingHorizontal: 12 },
  tab:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 14, gap: 5 },
  tabText:       { fontSize: 13 },
  content:       { padding: 16, gap: 12 },
  cta:           { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, paddingBottom: 30, gap: 12 },
  ctaLeft:       { flex: 1 },
  ctaApplicants: { fontSize: 12 },
  ctaSpots:      { fontSize: 12, fontWeight: '600', marginTop: 2 },
  applyBtn:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  applyBtnText:  { fontSize: 16, fontWeight: '700' },
});

const ts = StyleSheet.create({
  card:           { borderRadius: 16, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  cardTitle:      { fontSize: 16, fontWeight: '700' },
  cardBody:       { padding: 16 },
  body:           { fontSize: 14, lineHeight: 22 },
  tagsRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag:            { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  tagText:        { fontSize: 12, fontWeight: '600' },
  bulletRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  bulletText:     { flex: 1, fontSize: 14, lineHeight: 21 },
  detailRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth },
  detailIconBox:  { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  detailLabel:    { fontSize: 11, fontWeight: '600', marginBottom: 2 },
  detailValue:    { fontSize: 14, fontWeight: '500' },
  salaryBox:      { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  salaryText:     { fontSize: 18, fontWeight: '700' },
  companyHeader:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 14, borderBottomWidth: 1, marginBottom: 12 },
  companyLogoBox: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  companyLogoText:{ fontSize: 18, fontWeight: '800', color: '#fff' },
  companyName:    { fontSize: 16, fontWeight: '700' },
  companyIndustry:{ fontSize: 13, marginTop: 2 },
  companyNote:    { fontSize: 13, lineHeight: 19 },
  emptyTab:       { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 12 },
  emptyText:      { fontSize: 14 },
});
