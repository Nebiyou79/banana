/**
 * mobile/src/screens/candidate/JobDetailScreen.tsx
 * Full job view with apply/save action, requirements, company info.
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, Platform, Share, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useJob, useSaveJob, useUnsaveJob } from '../../hooks/useJobs';
import {
  formatSalary, formatDeadline, formatPostedDate,
  isDeadlinePast, getJobTypeLabel, getExperienceLevelLabel,
  getCompanyInitials, getSalaryModeConfig,
} from '../../utils/jobHelpers';
import { ScreenHeader } from '../../components/shared/ScreenHeader';
import { ListSkeleton } from '../../components/skeletons';

interface Props {
  navigation: any;
  route: { params: { jobId: string } };
}

export const JobDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { jobId } = route.params;
  const { theme } = useThemeStore();
  const c = theme.colors;

  const jobQ     = useJob(jobId);
  const saveMut  = useSaveJob();
  const unsaveMut = useUnsaveJob();
  const [saved, setSaved] = useState(false);

  const job = jobQ.data;
  const shadow = Platform.OS === 'ios'
    ? { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16 }
    : { elevation: 6 };

  const handleSave = useCallback(() => {
    if (saved) {
      unsaveMut.mutate(jobId);
    } else {
      saveMut.mutate(jobId);
    }
    setSaved(s => !s);
  }, [saved, jobId, saveMut, unsaveMut]);

  const handleShare = useCallback(async () => {
    if (!job) return;
    await Share.share({ message: `Check out this job: ${job.title} at ${job.company?.name ?? job.organization?.name}` });
  }, [job]);

  const handleApply = useCallback(() => {
    if (!job) return;
    if (isDeadlinePast(job.applicationDeadline)) {
      Alert.alert('Application Closed', 'The deadline for this position has passed.');
      return;
    }
    navigation.navigate('ApplyJob', { jobId: job._id, jobTitle: job.title });
  }, [job, navigation]);

  if (jobQ.isLoading) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: c.background }]} edges={['top']}>
        <ScreenHeader title="Job Details" onBack={() => navigation.goBack()} />
        <ListSkeleton count={2} type="job" />
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: c.background }]} edges={['top']}>
        <ScreenHeader title="Not Found" onBack={() => navigation.goBack()} />
        <View style={s.center}>
          <Ionicons name="alert-circle-outline" size={52} color={c.textMuted} />
          <Text style={[s.notFoundText, { color: c.textMuted }]}>Job not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const owner = job.company ?? job.organization;
  const ownerName = owner?.name ?? 'Unknown';
  const logoUrl = owner?.logoUrl;
  const salCfg = getSalaryModeConfig(job.salaryMode, theme.isDark);
  const isPast = isDeadlinePast(job.applicationDeadline);
  const canApply = job.isApplyEnabled && !isPast;

  return (
    <SafeAreaView style={[s.root, { backgroundColor: c.background }]} edges={['top']}>
      <ScreenHeader
        title="Job Details"
        onBack={() => navigation.goBack()}
        rightIcon="share-outline"
        onRightPress={handleShare}
      />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero card */}
        <View style={[s.heroCard, { backgroundColor: c.card, borderColor: c.border }, shadow]}>
          {/* Badges */}
          {(job.featured || job.urgent) && (
            <View style={s.badges}>
              {job.featured && (
                <View style={[s.badge, { backgroundColor: c.primaryLight }]}>
                  <Ionicons name="star" size={11} color={c.primary} />
                  <Text style={[s.badgeText, { color: c.primary }]}>Featured</Text>
                </View>
              )}
              {job.urgent && (
                <View style={[s.badge, { backgroundColor: c.errorLight }]}>
                  <Ionicons name="flash" size={11} color={c.error} />
                  <Text style={[s.badgeText, { color: c.error }]}>Urgent</Text>
                </View>
              )}
            </View>
          )}

          {/* Company + title */}
          <View style={s.heroTop}>
            <View style={[s.logo, { backgroundColor: c.primaryLight }]}>
              {logoUrl ? (
                <Image source={{ uri: logoUrl }} style={s.logoImg} />
              ) : (
                <Text style={[s.logoText, { color: c.primary }]}>{getCompanyInitials(ownerName)}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.jobTitle, { color: c.text }]}>{job.title}</Text>
              <View style={s.companyRow}>
                <Text style={[s.companyName, { color: c.textSecondary }]}>{ownerName}</Text>
                {owner?.verified && <Ionicons name="shield-checkmark" size={14} color={c.success} style={{ marginLeft: 4 }} />}
              </View>
            </View>
            <TouchableOpacity onPress={handleSave} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={24} color={saved ? c.primary : c.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Meta chips */}
          <View style={s.metaRow}>
            {[
              { icon: 'location-outline',  text: job.location?.city ?? job.location?.region ?? 'Ethiopia' },
              { icon: 'briefcase-outline', text: getJobTypeLabel(job.type) },
              { icon: 'school-outline',    text: getExperienceLevelLabel(job.experienceLevel) },
            ].map((m, i) => (
              <View key={i} style={[s.metaChip, { backgroundColor: theme.isDark ? '#1F2937' : '#F1F5F9' }]}>
                <Ionicons name={m.icon as any} size={12} color={c.textMuted} />
                <Text style={[s.metaText, { color: c.textMuted }]}>{m.text}</Text>
              </View>
            ))}
          </View>

          {/* Salary + deadline */}
          <View style={s.row2}>
            <View style={[s.salaryBadge, { backgroundColor: salCfg.bg }]}>
              <Ionicons name={salCfg.icon as any} size={13} color={salCfg.text} />
              <Text style={[s.salaryText, { color: salCfg.text }]}>
                {job.salaryMode === 'range' ? formatSalary(job) : salCfg.label}
              </Text>
            </View>
            <View style={[s.deadlineBadge, { backgroundColor: isPast ? c.errorLight : (theme.isDark ? '#1F2937' : '#F1F5F9') }]}>
              <Ionicons name="time-outline" size={13} color={isPast ? c.error : c.textMuted} />
              <Text style={[s.deadlineText, { color: isPast ? c.error : c.textMuted }]}>
                {formatDeadline(job.applicationDeadline)}
              </Text>
            </View>
          </View>

          {/* Stats */}
          <View style={[s.statsRow, { borderTopColor: c.border }]}>
            <View style={s.statItem}>
              <Text style={[s.statValue, { color: c.text }]}>{job.applicationCount ?? 0}</Text>
              <Text style={[s.statLabel, { color: c.textMuted }]}>Applied</Text>
            </View>
            <View style={[s.statDivider, { backgroundColor: c.border }]} />
            <View style={s.statItem}>
              <Text style={[s.statValue, { color: c.text }]}>{job.viewCount ?? 0}</Text>
              <Text style={[s.statLabel, { color: c.textMuted }]}>Views</Text>
            </View>
            <View style={[s.statDivider, { backgroundColor: c.border }]} />
            <View style={s.statItem}>
              <Text style={[s.statValue, { color: c.text }]}>{job.candidatesNeeded}</Text>
              <Text style={[s.statLabel, { color: c.textMuted }]}>Openings</Text>
            </View>
            <View style={[s.statDivider, { backgroundColor: c.border }]} />
            <View style={s.statItem}>
              <Text style={[s.statValue, { color: c.text }]}>{formatPostedDate(job.createdAt)}</Text>
              <Text style={[s.statLabel, { color: c.textMuted }]}>Posted</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={[s.section, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={s.sectionHeader}>
            <Ionicons name="document-text-outline" size={18} color={c.primary} />
            <Text style={[s.sectionTitle, { color: c.text }]}>Job Description</Text>
          </View>
          <Text style={[s.bodyText, { color: c.textSecondary }]}>{job.description}</Text>
        </View>

        {/* Requirements */}
        {(job.requirements ?? []).length > 0 && (
          <View style={[s.section, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={s.sectionHeader}>
              <Ionicons name="checkmark-circle-outline" size={18} color={c.primary} />
              <Text style={[s.sectionTitle, { color: c.text }]}>Requirements</Text>
            </View>
            {job.requirements!.map((r, i) => (
              <View key={i} style={s.bulletItem}>
                <View style={[s.bullet, { backgroundColor: c.primary }]} />
                <Text style={[s.bulletText, { color: c.textSecondary }]}>{r}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Responsibilities */}
        {(job.responsibilities ?? []).length > 0 && (
          <View style={[s.section, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={s.sectionHeader}>
              <Ionicons name="list-outline" size={18} color={c.primary} />
              <Text style={[s.sectionTitle, { color: c.text }]}>Responsibilities</Text>
            </View>
            {job.responsibilities!.map((r, i) => (
              <View key={i} style={s.bulletItem}>
                <View style={[s.bullet, { backgroundColor: c.primary }]} />
                <Text style={[s.bulletText, { color: c.textSecondary }]}>{r}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {(job.skills ?? []).length > 0 && (
          <View style={[s.section, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={s.sectionHeader}>
              <Ionicons name="code-outline" size={18} color={c.primary} />
              <Text style={[s.sectionTitle, { color: c.text }]}>Required Skills</Text>
            </View>
            <View style={s.skillsGrid}>
              {job.skills!.map(sk => (
                <View key={sk} style={[s.skillTag, { backgroundColor: c.primaryLight }]}>
                  <Text style={[s.skillText, { color: c.primary }]}>{sk}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Benefits */}
        {(job.benefits ?? []).length > 0 && (
          <View style={[s.section, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={s.sectionHeader}>
              <Ionicons name="gift-outline" size={18} color={c.primary} />
              <Text style={[s.sectionTitle, { color: c.text }]}>Benefits</Text>
            </View>
            {job.benefits!.map((b, i) => (
              <View key={i} style={s.bulletItem}>
                <Ionicons name="checkmark" size={14} color={c.success} />
                <Text style={[s.bulletText, { color: c.textSecondary }]}>{b}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={s.bottomSpacer} />
      </ScrollView>

      {/* Sticky Apply Button */}
      <View style={[s.applyBar, { backgroundColor: c.background, borderTopColor: c.border }]}>
        <TouchableOpacity
          style={[
            s.applyBtn,
            { backgroundColor: canApply ? c.primary : c.border },
          ]}
          onPress={handleApply}
          disabled={!canApply}
          activeOpacity={0.85}
        >
          <Ionicons name={canApply ? 'send' : 'lock-closed-outline'} size={18} color="#fff" />
          <Text style={s.applyBtnText}>
            {isPast ? 'Applications Closed' : !job.isApplyEnabled ? 'Applications Disabled' : 'Apply Now'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root:           { flex: 1 },
  scroll:         { padding: 16 },
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText:   { fontSize: 16 },
  heroCard:       { borderRadius: 18, borderWidth: 1, padding: 18, marginBottom: 16 },
  badges:         { flexDirection: 'row', gap: 6, marginBottom: 12 },
  badge:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, gap: 4 },
  badgeText:      { fontSize: 11, fontWeight: '700' },
  heroTop:        { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  logo:           { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  logoImg:        { width: 56, height: 56, borderRadius: 14 },
  logoText:       { fontSize: 20, fontWeight: '800' },
  jobTitle:       { fontSize: 18, fontWeight: '800', lineHeight: 24 },
  companyRow:     { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  companyName:    { fontSize: 14 },
  metaRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  metaChip:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 5 },
  metaText:       { fontSize: 12 },
  row2:           { flexDirection: 'row', gap: 10, marginBottom: 14 },
  salaryBadge:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, gap: 5 },
  salaryText:     { fontSize: 13, fontWeight: '700' },
  deadlineBadge:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, gap: 5 },
  deadlineText:   { fontSize: 13, fontWeight: '600' },
  statsRow:       { flexDirection: 'row', paddingTop: 14, borderTopWidth: 1 },
  statItem:       { flex: 1, alignItems: 'center' },
  statValue:      { fontSize: 16, fontWeight: '800' },
  statLabel:      { fontSize: 10, marginTop: 2 },
  statDivider:    { width: 1, height: 32, alignSelf: 'center' },
  section:        { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  sectionHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle:   { fontSize: 15, fontWeight: '700' },
  bodyText:       { fontSize: 14, lineHeight: 23 },
  bulletItem:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  bullet:         { width: 7, height: 7, borderRadius: 4, marginTop: 7 },
  bulletText:     { flex: 1, fontSize: 14, lineHeight: 21 },
  skillsGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillTag:       { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  skillText:      { fontSize: 13, fontWeight: '500' },
  bottomSpacer:   { height: 100 },
  applyBar:       { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
  applyBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14, gap: 8 },
  applyBtnText:   { color: '#fff', fontSize: 16, fontWeight: '700' },
});