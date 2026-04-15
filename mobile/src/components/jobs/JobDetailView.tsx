/**
 * mobile/src/components/jobs/JobDetailView.tsx
 *
 * Complete job detail view rendered inside the JobDetailsScreen.
 * Mirrors the web TabbedJobDetails / JobDetails component.
 *
 * Tabs: Overview · Requirements · Details · Company
 * Shows: description, requirements, responsibilities, benefits, skills,
 *        salary info, deadline, location, experience, candidate progress.
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { Job } from '../../services/jobService';
import {
  formatDate,
  formatSalary,
  getJobTypeLabel,
  getExperienceLevelLabel,
  getSalaryModeConfig,
  getCompanyInitials,
} from '../../utils/jobHelpers';

// ─── Types ────────────────────────────────────────────────────────────────────

interface JobDetailViewProps {
  job: Job;
  /** role determines label tweaks for org vs company */
  role?: 'company' | 'organization' | 'candidate';
}

type Tab = 'overview' | 'requirements' | 'details' | 'company';

// ─── Atoms ────────────────────────────────────────────────────────────────────

const InfoRow: React.FC<{ icon: string; label: string; value: string; colors: any }> = ({ icon, label, value, colors }) => (
  <View style={ir.row}>
    <View style={[ir.iconBox, { backgroundColor: colors.primaryLight }]}>
      <Ionicons name={icon as any} size={16} color={colors.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[ir.label, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[ir.value, { color: colors.text }]}>{value}</Text>
    </View>
  </View>
);

const ir = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label:   { fontSize: 11, fontWeight: '600', marginBottom: 1 },
  value:   { fontSize: 14, fontWeight: '600' },
});

const BulletList: React.FC<{ items: string[]; colors: any; icon?: string; iconColor?: string }> = ({ items, colors, icon = 'ellipse', iconColor }) => (
  <View>
    {items.map((item, i) => (
      <View key={i} style={bl.row}>
        <Ionicons name={icon as any} size={icon === 'ellipse' ? 8 : 16} color={iconColor ?? colors.primary} style={{ marginTop: 3 }} />
        <Text style={[bl.text, { color: colors.textSecondary }]}>{item}</Text>
      </View>
    ))}
  </View>
);

const bl = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  text: { flex: 1, fontSize: 14, lineHeight: 21 },
});

const SectionCard: React.FC<{ title: string; icon: string; iconColor: string; colors: any; children: React.ReactNode }> = ({ title, icon, iconColor, colors, children }) => (
  <View style={[sc.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={sc.header}>
      <Ionicons name={icon as any} size={18} color={iconColor} />
      <Text style={[sc.title, { color: colors.text }]}>{title}</Text>
    </View>
    {children}
  </View>
);

const sc = StyleSheet.create({
  card:   { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  title:  { fontSize: 15, fontWeight: '700' },
});

// ─── Stat card (for the "Details" tab) ────────────────────────────────────────

const StatCard: React.FC<{ value: string | number; label: string; color: string; bg: string }> = ({ value, label, color, bg }) => (
  <View style={[stc.card, { backgroundColor: bg }]}>
    <Text style={[stc.val, { color }]}>{value}</Text>
    <Text style={[stc.label, { color }]}>{label}</Text>
  </View>
);

const stc = StyleSheet.create({
  card:  { flex: 1, alignItems: 'center', padding: 12, borderRadius: 12 },
  val:   { fontSize: 20, fontWeight: '800' },
  label: { fontSize: 11, marginTop: 2, opacity: 0.8 },
});

// ─── Main component ───────────────────────────────────────────────────────────

export const JobDetailView: React.FC<JobDetailViewProps> = ({ job, role = 'candidate' }) => {
  const { theme: { colors, isDark } } = useThemeStore();
  const c = colors;
  const [tab, setTab] = useState<Tab>('overview');

  const owner     = job.company ?? job.organization;
  const isOrg     = job.jobType === 'organization';
  const salCfg    = getSalaryModeConfig(job.salaryMode, isDark);

  // ── Tab bar ─────────────────────────────────────────────────────────────────

  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview',     label: 'Overview' },
    { key: 'requirements', label: 'Requirements' },
    { key: 'details',      label: 'Details' },
    { key: 'company',      label: isOrg ? 'Org' : 'Company' },
  ];

  const TabBar = () => (
    <View style={[tb.row, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
      {TABS.map(t => (
        <TouchableOpacity key={t.key} style={tb.tab} onPress={() => setTab(t.key)} activeOpacity={0.7}>
          <Text style={[tb.text, { color: tab === t.key ? c.primary : c.textMuted }]}>{t.label}</Text>
          {tab === t.key && <View style={[tb.indicator, { backgroundColor: c.primary }]} />}
        </TouchableOpacity>
      ))}
    </View>
  );

  // ── Overview tab ─────────────────────────────────────────────────────────────

  const OverviewTab = () => (
    <>
      {/* Short description */}
      {job.shortDescription && (
        <SectionCard title="Overview" icon="information-circle-outline" iconColor={c.primary} colors={c}>
          <Text style={[s.body, { color: c.textSecondary }]}>{job.shortDescription}</Text>
        </SectionCard>
      )}

      {/* Full description */}
      <SectionCard title={isOrg ? 'About this Opportunity' : 'About the Role'} icon="document-text-outline" iconColor="#3B82F6" colors={c}>
        <Text style={[s.body, { color: c.textSecondary, lineHeight: 23 }]}>{job.description}</Text>
      </SectionCard>

      {/* Responsibilities */}
      {(job.responsibilities ?? []).length > 0 && (
        <SectionCard title="Responsibilities" icon="list-outline" iconColor="#8B5CF6" colors={c}>
          <BulletList items={job.responsibilities!} colors={c} icon="chevron-forward" iconColor={c.primary} />
        </SectionCard>
      )}

      {/* Benefits */}
      {(job.benefits ?? []).length > 0 && (
        <SectionCard title="Benefits & Perks" icon="heart-outline" iconColor={c.success} colors={c}>
          <BulletList items={job.benefits!} colors={c} icon="checkmark-circle" iconColor={c.success} />
        </SectionCard>
      )}

      {/* Skills */}
      {(job.skills ?? []).length > 0 && (
        <SectionCard title="Required Skills" icon="construct-outline" iconColor="#F59E0B" colors={c}>
          <View style={s.tagsWrap}>
            {job.skills!.map(sk => (
              <View key={sk} style={[s.tag, { backgroundColor: c.primaryLight }]}>
                <Text style={[s.tagText, { color: c.primary }]}>{sk}</Text>
              </View>
            ))}
          </View>
        </SectionCard>
      )}
    </>
  );

  // ── Requirements tab ─────────────────────────────────────────────────────────

  const RequirementsTab = () => (
    <>
      <SectionCard title="Requirements" icon="checkmark-circle-outline" iconColor={c.success} colors={c}>
        {(job.requirements ?? []).length > 0
          ? <BulletList items={job.requirements!} colors={c} icon="checkmark-circle" iconColor={c.success} />
          : <Text style={[s.body, { color: c.textMuted }]}>No specific requirements listed.</Text>}
      </SectionCard>

      {/* Quick info grid */}
      <SectionCard title="Position Requirements" icon="information-circle-outline" iconColor={c.primary} colors={c}>
        <InfoRow icon="school-outline"       label="Experience Level" value={getExperienceLevelLabel(job.experienceLevel)} colors={c} />
        <InfoRow icon="library-outline"      label="Education Level"  value={job.educationLevel?.replace(/-/g, ' ') ?? 'Not specified'} colors={c} />
        <InfoRow icon="people-outline"       label="Candidates Needed" value={`${job.candidatesNeeded ?? 1} position${(job.candidatesNeeded ?? 1) > 1 ? 's' : ''}`} colors={c} />
        {job.applicationDeadline && (
          <InfoRow icon="calendar-outline" label="Application Deadline" value={formatDate(job.applicationDeadline)} colors={c} />
        )}
      </SectionCard>

      {/* Demographic requirements */}
      {job.demographicRequirements?.sex && job.demographicRequirements.sex !== 'any' && (
        <SectionCard title="Demographic Requirements" icon="person-outline" iconColor="#F97316" colors={c}>
          <InfoRow icon="person-outline" label="Gender" value={job.demographicRequirements.sex.charAt(0).toUpperCase() + job.demographicRequirements.sex.slice(1)} colors={c} />
          {job.demographicRequirements.age?.min != null && (
            <InfoRow icon="timer-outline" label="Age Range"
              value={`${job.demographicRequirements.age.min}${job.demographicRequirements.age.max ? ` – ${job.demographicRequirements.age.max}` : '+'} years`}
              colors={c} />
          )}
        </SectionCard>
      )}
    </>
  );

  // ── Details tab ──────────────────────────────────────────────────────────────

  const DetailsTab = () => (
    <>
      {/* Quick stats */}
      <View style={[s.statsRow, { marginBottom: 12 }]}>
        <StatCard value={job.candidatesNeeded ?? 1}    label="Needed"    color={c.primary}  bg={c.primaryLight} />
        <StatCard value={job.applicationCount ?? 0}    label="Applied"   color={c.success}  bg={c.successLight} />
        <StatCard value={job.viewCount ?? 0}           label="Views"     color="#A855F7"    bg={isDark?'#3B0764':'#FAF5FF'} />
        <StatCard value={getJobTypeLabel(job.type)}    label="Type"      color={c.warning}  bg={c.warningLight} />
      </View>

      {/* Compensation */}
      <SectionCard title="Compensation" icon="cash-outline" iconColor={c.success} colors={c}>
        <View style={[s.salaryBox, { backgroundColor: salCfg.bg }]}>
          <Ionicons name={salCfg.icon as any} size={20} color={salCfg.text} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[s.salaryMode, { color: salCfg.text }]}>{salCfg.label}</Text>
            <Text style={[s.salaryVal, { color: salCfg.text }]}>{formatSalary(job)}</Text>
          </View>
        </View>
        {job.salary?.period && (
          <Text style={[s.salaryPeriod, { color: c.textMuted }]}>Per {job.salary.period}</Text>
        )}
      </SectionCard>

      {/* Job details */}
      <SectionCard title="Job Details" icon="briefcase-outline" iconColor="#3B82F6" colors={c}>
        <InfoRow icon="briefcase-outline"   label="Employment Type"  value={getJobTypeLabel(job.type)} colors={c} />
        <InfoRow icon="location-outline"    label="Location"         value={[job.location?.city, job.location?.region].filter(Boolean).join(', ') || 'Remote'} colors={c} />
        <InfoRow icon="wifi-outline"        label="Remote Policy"    value={job.remote?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) ?? 'On-site'} colors={c} />
        {job.applicationDeadline && (
          <InfoRow icon="calendar-outline" label="Application Deadline" value={formatDate(job.applicationDeadline)} colors={c} />
        )}
        <InfoRow icon="school-outline"      label="Experience Level" value={getExperienceLevelLabel(job.experienceLevel)} colors={c} />
      </SectionCard>

      {/* Tags */}
      {(job.tags ?? []).length > 0 && (
        <SectionCard title="Tags" icon="pricetag-outline" iconColor="#F59E0B" colors={c}>
          <View style={s.tagsWrap}>
            {job.tags!.map(tag => (
              <View key={tag} style={[s.tag, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }]}>
                <Text style={[s.tagText, { color: c.textSecondary }]}>{tag}</Text>
              </View>
            ))}
          </View>
        </SectionCard>
      )}
    </>
  );

  // ── Company tab ───────────────────────────────────────────────────────────────

  const CompanyTab = () => (
    <>
      <SectionCard title={isOrg ? 'About the Organization' : 'About the Company'} icon="business-outline" iconColor="#8B5CF6" colors={c}>
        <View style={s.orgHero}>
          <View style={[s.orgAvatar, { backgroundColor: c.primaryLight }]}>
            <Text style={[s.orgAvatarText, { color: c.primary }]}>{getCompanyInitials(owner?.name)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={s.orgNameRow}>
              <Text style={[s.orgName, { color: c.text }]}>{owner?.name ?? '—'}</Text>
              {owner?.verified && (
                <Ionicons name="shield-checkmark" size={16} color={c.success} style={{ marginLeft: 6 }} />
              )}
            </View>
            {owner?.industry && <Text style={[s.orgIndustry, { color: c.textMuted }]}>{owner.industry}</Text>}
          </View>
        </View>
      </SectionCard>

      <SectionCard title="Job Posted By" icon="person-circle-outline" iconColor="#3B82F6" colors={c}>
        <InfoRow icon="calendar-outline"    label="Posted Date"   value={formatDate(job.createdAt)} colors={c} />
        {job.applicationDeadline && (
          <InfoRow icon="time-outline" label="Deadline"        value={formatDate(job.applicationDeadline)} colors={c} />
        )}
        <InfoRow icon="people-outline"      label="Positions"    value={`${job.candidatesNeeded ?? 1} position(s)`} colors={c} />
        <InfoRow icon="briefcase-outline"   label="Job Type"     value={`${isOrg ? 'Organization' : 'Company'} — ${job.opportunityType ?? 'Job'}`} colors={c} />
      </SectionCard>
    </>
  );

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1 }}>
      <TabBar />
      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        {tab === 'overview'     && <OverviewTab />}
        {tab === 'requirements' && <RequirementsTab />}
        {tab === 'details'      && <DetailsTab />}
        {tab === 'company'      && <CompanyTab />}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const tb = StyleSheet.create({
  row:       { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 4 },
  tab:       { flex: 1, alignItems: 'center', paddingVertical: 14 },
  text:      { fontSize: 13, fontWeight: '600' },
  indicator: { position: 'absolute', bottom: 0, left: 8, right: 8, height: 2, borderRadius: 1 },
});

const s = StyleSheet.create({
  body:        { fontSize: 14, lineHeight: 22 },
  tagsWrap:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag:         { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tagText:     { fontSize: 12, fontWeight: '500' },
  statsRow:    { flexDirection: 'row', gap: 8 },
  salaryBox:   { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12 },
  salaryMode:  { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  salaryVal:   { fontSize: 16, fontWeight: '800' },
  salaryPeriod:{ fontSize: 12, marginTop: 6 },
  orgHero:     { flexDirection: 'row', alignItems: 'center', gap: 14 },
  orgAvatar:   { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  orgAvatarText:{ fontSize: 22, fontWeight: '700' },
  orgNameRow:  { flexDirection: 'row', alignItems: 'center' },
  orgName:     { fontSize: 16, fontWeight: '700' },
  orgIndustry: { fontSize: 13, marginTop: 3 },
});
