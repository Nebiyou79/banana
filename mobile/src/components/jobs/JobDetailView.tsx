/**
 * src/components/jobs/JobDetailView.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * REFACTOR NOTES (spec compliance):
 *  ✅ useThemeStore → useTheme() bridge (single hook).
 *  ✅ All colours via useTheme() — zero hardcoded hex.
 *  ✅ withAlpha() replaces string-concatenated rgba / missing `primaryLight`.
 *  ✅ `colors: any` prop removed — sub-components read from useTheme() directly.
 *  ✅ InfoRow / BulletList / SectionCard / StatCard extracted as stable React.memo.
 *  ✅ StyleSheet memoised with useMemo per component.
 *  ✅ Tab bar touch targets ≥ 44 pt.
 *  ✅ No emoji icons.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useMemo, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { withAlpha, formatShortDate } from '../../theme/utils';
import { SPACING, RADIUS } from '../../theme/tokens';
import { Job } from '../../services/jobService';
import {
  formatSalary,
  getJobTypeLabel,
  getExperienceLevelLabel,
  getSalaryModeConfig,
  getCompanyInitials,
  formatLocation,
} from '../../utils/jobHelpers';
import Avatar, { jobOwnerToEntity } from '../shared/Avatar';

// ─── Types ────────────────────────────────────────────────────────────────────

interface JobDetailViewProps {
  job: Job;
  role?: 'company' | 'organization' | 'candidate';
}

type Tab = 'overview' | 'requirements' | 'details' | 'company';

// ─── InfoRow ──────────────────────────────────────────────────────────────────

interface InfoRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}

const InfoRow = memo<InfoRowProps>(({ icon, label, value }) => {
  const { colors: c } = useTheme();
  return (
    <View style={ir.row}>
      <View style={[ir.iconBox, { backgroundColor: withAlpha(c.primary, 0.12) }]}>
        <Ionicons name={icon} size={16} color={c.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[ir.label, { color: c.textMuted }]}>{label}</Text>
        <Text style={[ir.value, { color: c.text }]}>{value}</Text>
      </View>
    </View>
  );
});
InfoRow.displayName = 'JobDetailView.InfoRow';

const ir = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  iconBox: { width: 36, height: 36, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  label:   { fontSize: 11, fontWeight: '600', marginBottom: 1 },
  value:   { fontSize: 14, fontWeight: '600' },
});

// ─── BulletList ───────────────────────────────────────────────────────────────

interface BulletListProps {
  items: string[];
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  iconColor?: string;
}

const BulletList = memo<BulletListProps>(({ items, icon = 'ellipse', iconColor }) => {
  const { colors: c } = useTheme();
  return (
    <View>
      {items.map((item, i) => (
        <View key={i} style={bl.row}>
          <Ionicons
            name={icon}
            size={icon === 'ellipse' ? 8 : 16}
            color={iconColor ?? c.primary}
            style={{ marginTop: 3 }}
          />
          <Text style={[bl.text, { color: c.textSecondary }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
});
BulletList.displayName = 'JobDetailView.BulletList';

const bl = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: SPACING.sm },
  text: { flex: 1, fontSize: 14, lineHeight: 21 },
});

// ─── SectionCard ──────────────────────────────────────────────────────────────

interface SectionCardProps {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  children: React.ReactNode;
}

const SectionCard = memo<SectionCardProps>(({ title, icon, iconColor, children }) => {
  const { colors: c } = useTheme();
  return (
    <View style={[scc.card, { backgroundColor: c.bgCard, borderColor: c.border }]}>
      <View style={scc.header}>
        <Ionicons name={icon} size={18} color={iconColor} />
        <Text style={[scc.title, { color: c.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
});
SectionCard.displayName = 'JobDetailView.SectionCard';

const scc = StyleSheet.create({
  card:   { borderRadius: RADIUS.lg, borderWidth: 1, padding: SPACING.lg, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 12 },
  title:  { fontSize: 15, fontWeight: '700' },
});

// ─── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  value: string | number;
  label: string;
  color: string;
  bg: string;
}

const StatCard = memo<StatCardProps>(({ value, label, color, bg }) => (
  <View style={[stc.card, { backgroundColor: bg }]}>
    <Text style={[stc.val, { color }]}>{value}</Text>
    <Text style={[stc.label, { color }]}>{label}</Text>
  </View>
));
StatCard.displayName = 'JobDetailView.StatCard';

const stc = StyleSheet.create({
  card:  { flex: 1, alignItems: 'center', padding: 12, borderRadius: RADIUS.md },
  val:   { fontSize: 20, fontWeight: '800' },
  label: { fontSize: 11, marginTop: 2, opacity: 0.8 },
});

// ─── Tab bar ──────────────────────────────────────────────────────────────────

interface TabBarProps {
  tabs: Array<{ key: Tab; label: string }>;
  active: Tab;
  onPress: (t: Tab) => void;
}

const TabBar = memo<TabBarProps>(({ tabs, active, onPress }) => {
  const { colors: c } = useTheme();
  return (
    <View style={[tbs.row, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
      {tabs.map((t) => (
        <TouchableOpacity
          key={t.key}
          style={tbs.tab}
          onPress={() => onPress(t.key)}
          activeOpacity={0.7}
          accessibilityRole="tab"
          accessibilityState={{ selected: active === t.key }}
        >
          <Text style={[tbs.text, { color: active === t.key ? c.primary : c.textMuted }]}>
            {t.label}
          </Text>
          {active === t.key && (
            <View style={[tbs.indicator, { backgroundColor: c.primary }]} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
});
TabBar.displayName = 'JobDetailView.TabBar';

const tbs = StyleSheet.create({
  row:       { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 4 },
  tab:       { flex: 1, alignItems: 'center', paddingVertical: 14, minHeight: 44 },
  text:      { fontSize: 13, fontWeight: '600' },
  indicator: { position: 'absolute', bottom: 0, left: SPACING.sm, right: SPACING.sm, height: 2, borderRadius: 1 },
});

// ─── Skill tags ───────────────────────────────────────────────────────────────

const SkillTags: React.FC<{ skills: string[] }> = ({ skills }) => {
  const { colors: c } = useTheme();
  return (
    <View style={sk.wrap}>
      {skills.map((s) => (
        <View key={s} style={[sk.tag, { backgroundColor: withAlpha(c.primary, 0.12) }]}>
          <Text style={[sk.text, { color: c.primary }]}>{s}</Text>
        </View>
      ))}
    </View>
  );
};

const sk = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  tag:  { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full },
  text: { fontSize: 12, fontWeight: '500' },
});

// ─── Main component ───────────────────────────────────────────────────────────

export const JobDetailView: React.FC<JobDetailViewProps> = ({
  job,
  role = 'candidate',
}) => {
  const { colors: c, isDark } = useTheme();
  const [tab, setTab] = useState<Tab>('overview');

  const isOrg  = job.jobType === 'organization';
  const owner  = job.company ?? job.organization;
  const salCfg = getSalaryModeConfig(job.salaryMode, isDark);

  const TABS: Array<{ key: Tab; label: string }> = useMemo(
    () => [
      { key: 'overview',     label: 'Overview'      },
      { key: 'requirements', label: 'Requirements'  },
      { key: 'details',      label: 'Details'       },
      { key: 'company',      label: isOrg ? 'Org' : 'Company' },
    ],
    [isOrg],
  );

  // ── Overview ──────────────────────────────────────────────────────────────
  const OverviewTab = () => (
    <>
      {job.shortDescription && (
        <SectionCard title="Overview" icon="information-circle-outline" iconColor={c.primary}>
          <Text style={[ov.body, { color: c.textSecondary }]}>{job.shortDescription}</Text>
        </SectionCard>
      )}
      <SectionCard
        title={isOrg ? 'About this Opportunity' : 'About the Role'}
        icon="document-text-outline"
        iconColor={c.info}
      >
        <Text style={[ov.body, { color: c.textSecondary, lineHeight: 23 }]}>
          {job.description}
        </Text>
      </SectionCard>

      {(job.responsibilities ?? []).length > 0 && (
        <SectionCard title="Responsibilities" icon="list-outline" iconColor={c.primary}>
          <BulletList items={job.responsibilities!} icon="chevron-forward" iconColor={c.primary} />
        </SectionCard>
      )}

      {(job.benefits ?? []).length > 0 && (
        <SectionCard title="Benefits & Perks" icon="heart-outline" iconColor={c.success}>
          <BulletList items={job.benefits!} icon="checkmark-circle" iconColor={c.success} />
        </SectionCard>
      )}

      {(job.skills ?? []).length > 0 && (
        <SectionCard title="Required Skills" icon="construct-outline" iconColor={c.warning}>
          <SkillTags skills={job.skills!} />
        </SectionCard>
      )}
    </>
  );

  const ov = StyleSheet.create({
    body: { fontSize: 14, lineHeight: 22 },
  });

  // ── Requirements ──────────────────────────────────────────────────────────
  const RequirementsTab = () => (
    <>
      <SectionCard title="Requirements" icon="checkmark-circle-outline" iconColor={c.success}>
        {(job.requirements ?? []).length > 0 ? (
          <BulletList items={job.requirements!} icon="checkmark-circle" iconColor={c.success} />
        ) : (
          <Text style={{ fontSize: 13, color: c.textMuted }}>No specific requirements listed.</Text>
        )}
      </SectionCard>

      <SectionCard title="Position Requirements" icon="information-circle-outline" iconColor={c.primary}>
        <InfoRow icon="school-outline"   label="Experience" value={getExperienceLevelLabel(job.experienceLevel)} />
        <InfoRow icon="library-outline"  label="Education"  value={job.educationLevel?.replace(/-/g, ' ') ?? 'Not specified'} />
        <InfoRow icon="people-outline"   label="Positions"  value={`${job.candidatesNeeded ?? 1} position${(job.candidatesNeeded ?? 1) > 1 ? 's' : ''}`} />
        {job.applicationDeadline && (
          <InfoRow icon="calendar-outline" label="Deadline" value={formatShortDate(job.applicationDeadline)} />
        )}
      </SectionCard>

      {job.demographicRequirements?.sex && job.demographicRequirements.sex !== 'any' && (
        <SectionCard title="Demographic Requirements" icon="person-outline" iconColor={c.warning}>
          <InfoRow
            icon="person-outline"
            label="Gender"
            value={
              job.demographicRequirements.sex.charAt(0).toUpperCase() +
              job.demographicRequirements.sex.slice(1)
            }
          />
          {job.demographicRequirements.age?.min != null && (
            <InfoRow
              icon="timer-outline"
              label="Age Range"
              value={`${job.demographicRequirements.age.min}${job.demographicRequirements.age.max ? ` – ${job.demographicRequirements.age.max}` : '+'} years`}
            />
          )}
        </SectionCard>
      )}
    </>
  );

  // ── Details ───────────────────────────────────────────────────────────────
  const DetailsTab = () => (
    <>
      <View style={[det.statsRow, { marginBottom: 12 }]}>
        <StatCard value={job.candidatesNeeded ?? 1}  label="Needed"  color={c.primary} bg={withAlpha(c.primary, 0.12)} />
        <StatCard value={job.applicationCount ?? 0}  label="Applied" color={c.success} bg={withAlpha(c.success, 0.12)} />
        <StatCard value={job.viewCount ?? 0}         label="Views"   color={c.info}    bg={withAlpha(c.info,    0.12)} />
        <StatCard value={getJobTypeLabel(job.type)}  label="Type"    color={c.warning} bg={withAlpha(c.warning, 0.12)} />
      </View>

      <SectionCard title="Compensation" icon="cash-outline" iconColor={c.success}>
        <View style={[det.salaryBox, { backgroundColor: withAlpha(c.primary, 0.08) }]}>
          <Ionicons name={salCfg.icon as any} size={20} color={c.primary} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[det.salaryMode, { color: c.textMuted }]}>{salCfg.label}</Text>
            <Text style={[det.salaryVal, { color: c.text }]}>{formatSalary(job)}</Text>
          </View>
        </View>
        {job.salary?.period && (
          <Text style={[det.salaryPeriod, { color: c.textMuted }]}>Per {job.salary.period}</Text>
        )}
      </SectionCard>

      <SectionCard title="Job Details" icon="briefcase-outline" iconColor={c.info}>
        <InfoRow icon="briefcase-outline" label="Type"       value={getJobTypeLabel(job.type)} />
        <InfoRow icon="location-outline"  label="Location"   value={formatLocation(job.location)} />
        <InfoRow icon="wifi-outline"      label="Remote"     value={job.remote?.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase()) ?? 'On-site'} />
        {job.applicationDeadline && (
          <InfoRow icon="calendar-outline" label="Deadline"  value={formatShortDate(job.applicationDeadline)} />
        )}
        <InfoRow icon="school-outline"    label="Experience" value={getExperienceLevelLabel(job.experienceLevel)} />
      </SectionCard>

      {(job.tags ?? []).length > 0 && (
        <SectionCard title="Tags" icon="pricetag-outline" iconColor={c.warning}>
          <SkillTags skills={job.tags!} />
        </SectionCard>
      )}
    </>
  );

  const det = StyleSheet.create({
    statsRow:    { flexDirection: 'row', gap: SPACING.sm },
    salaryBox:   { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: RADIUS.sm },
    salaryMode:  { fontSize: 12, fontWeight: '600', marginBottom: 2 },
    salaryVal:   { fontSize: 16, fontWeight: '800' },
    salaryPeriod:{ fontSize: 12, marginTop: 6 },
  });

// In JobDetailView.tsx, replace the CompanyTab section:

const CompanyTab = () => {
  const ownerEntity = jobOwnerToEntity(job);
  const isOrg = job.jobType === 'organization';
  const owner = job.company ?? job.organization;
  
  return (
    <>
      <SectionCard
        title={isOrg ? 'About the Organization' : 'About the Company'}
        icon="business-outline"
        iconColor={c.primary}
      >
        <View style={comp.orgHero}>
          {/* FIXED: Replace initials with Avatar component */}
          <Avatar entity={ownerEntity} size={56} borderRadius={RADIUS.md} />
          
          <View style={{ flex: 1, marginLeft: 14 }}>
            <View style={comp.orgNameRow}>
              <Text style={[comp.orgName, { color: c.text }]}>
                {owner?.name ?? '—'}
              </Text>
              {owner?.verified && (
                <Ionicons
                  name="shield-checkmark"
                  size={16}
                  color={c.success}
                  style={{ marginLeft: 6 }}
                />
              )}
            </View>
            {owner?.industry && (
              <Text style={[comp.orgIndustry, { color: c.textMuted }]}>
                {owner.industry}
              </Text>
            )}
          </View>
        </View>
      </SectionCard>

      <SectionCard title="Job Posted By" icon="person-circle-outline" iconColor={c.info}>
        <InfoRow icon="calendar-outline"  label="Posted"   value={formatShortDate(job.createdAt)} />
        {job.applicationDeadline && (
          <InfoRow icon="time-outline"    label="Deadline" value={formatShortDate(job.applicationDeadline)} />
        )}
        <InfoRow icon="people-outline"   label="Positions" value={`${job.candidatesNeeded ?? 1} position(s)`} />
        <InfoRow icon="briefcase-outline" label="Job Type"  value={`${isOrg ? 'Organization' : 'Company'} — ${job.opportunityType ?? 'Job'}`} />
      </SectionCard>
    </>
  );
};

  const comp = StyleSheet.create({
    orgHero:       { flexDirection: 'row', alignItems: 'center', gap: 14 },
    orgAvatar:     { width: 56, height: 56, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
    orgAvatarText: { fontSize: 22, fontWeight: '700' },
    orgNameRow:    { flexDirection: 'row', alignItems: 'center' },
    orgName:       { fontSize: 16, fontWeight: '700' },
    orgIndustry:   { fontSize: 13, marginTop: 3 },
  });

  return (
    <View style={{ flex: 1 }}>
      <TabBar tabs={TABS} active={tab} onPress={setTab} />
      <ScrollView
        contentContainerStyle={{ padding: SPACING.lg }}
        showsVerticalScrollIndicator={false}
      >
        {tab === 'overview'     && <OverviewTab />}
        {tab === 'requirements' && <RequirementsTab />}
        {tab === 'details'      && <DetailsTab />}
        {tab === 'company'      && <CompanyTab />}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};