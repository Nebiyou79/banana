/**
 * src/components/jobs/JobHeader.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Redesigned gradient job header using Avatar component.
 * Eliminates all broken logo logic — Avatar handles every edge case.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { Job } from '../../services/jobService';
import { Avatar, jobOwnerToEntity } from '../shared/Avatar';
import { formatLocation } from '../../utils/jobHelpers';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getDeadlineInfo = (d?: string): { text: string; urgent: boolean } => {
  if (!d) return { text: 'No deadline', urgent: false };
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  if (diff < 0)  return { text: 'Expired', urgent: true };
  if (diff === 0) return { text: 'Closes today!', urgent: true };
  if (diff <= 3)  return { text: `${diff} days left!`, urgent: true };
  if (diff <= 7)  return { text: `${diff} days left`, urgent: false };
  return {
    text: new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    urgent: false,
  };
};

const getGradientColors = (job: Job, isDark: boolean): [string, string, string] => {
  if (job.jobType === 'organization') {
    return isDark ? ['#1E1142', '#2D1B69', '#0F2040'] : ['#6D28D9', '#7C3AED', '#4F46E5'];
  }
  return isDark ? ['#0A1628', '#162035', '#1C2B45'] : ['#0F2040', '#1C3A60', '#243352'];
};

// ─── MetaBadge ────────────────────────────────────────────────────────────────
const MetaBadge = ({ icon, label }: { icon: string; label: string }) => (
  <View style={jh.metaBadge}>
    <Ionicons name={icon as any} size={12} color="rgba(255,255,255,0.85)" />
    <Text style={jh.metaBadgeText} numberOfLines={1}>{label}</Text>
  </View>
);

// ─── Props ────────────────────────────────────────────────────────────────────

interface JobHeaderProps {
  job: Job;
  onBack: () => void;
  onSave?: () => void;
  onShare?: () => void;
  isSaved?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const JobHeader: React.FC<JobHeaderProps> = ({
  job, onBack, onSave, onShare, isSaved = false,
}) => {
  const { theme } = useThemeStore();
  const isDark = theme.isDark;

  const ownerEntity = jobOwnerToEntity(job);
  const owner = job.jobType === 'organization' ? job.organization : job.company;
  const gradColors = getGradientColors(job, isDark);
  const dl = getDeadlineInfo(job.applicationDeadline);

  const salaryText = (() => {
    if (job.salaryDisplay) return job.salaryDisplay;
    if (job.salaryMode === 'negotiable') return 'Negotiable';
    if (job.salaryMode === 'hidden') return null;
    if (job.salaryMode === 'company-scale') return 'Company scale';
    if (job.salary?.min && job.salary?.max) {
      const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n);
      return `${job.salary.currency ?? 'ETB'} ${fmt(job.salary.min)} – ${fmt(job.salary.max)}`;
    }
    return null;
  })();

  return (
    <LinearGradient colors={gradColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={jh.gradient}>
      {/* Top nav */}
      <View style={jh.topNav}>
        <TouchableOpacity onPress={onBack} style={jh.navBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={jh.navRight}>
          {onShare && (
            <TouchableOpacity onPress={onShare} style={jh.navBtn}>
              <Ionicons name="share-social-outline" size={22} color="#fff" />
            </TouchableOpacity>
          )}
          {onSave && (
            <TouchableOpacity onPress={onSave} style={jh.navBtn}>
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={isSaved ? '#F1BB03' : '#fff'}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Banners */}
      {(job.urgent || job.featured) && (
        <View style={jh.bannerRow}>
          {job.urgent && (
            <View style={[jh.banner, { backgroundColor: '#DC2626' }]}>
              <Text style={jh.bannerText}>⚡ URGENT</Text>
            </View>
          )}
          {job.featured && (
            <View style={[jh.banner, { backgroundColor: '#F1BB03' }]}>
              <Text style={[jh.bannerText, { color: '#000' }]}>★ FEATURED</Text>
            </View>
          )}
        </View>
      )}

      {/* Company info */}
      <View style={jh.companyRow}>
        {/* Avatar with verified overlay */}
        <View style={jh.avatarWrapper}>
          <Avatar
            entity={ownerEntity}
            size={64}
            borderRadius={16}
            style={{ borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.25)' } as any}
          />
          {owner?.verified && (
            <View style={jh.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            </View>
          )}
        </View>

        <View style={jh.companyInfo}>
          <Text style={jh.companyName} numberOfLines={1}>{owner?.name ?? ''}</Text>
          {owner?.industry && (
            <View style={jh.industryRow}>
              <Ionicons name="business-outline" size={12} color="rgba(255,255,255,0.7)" />
              <Text style={jh.industryText} numberOfLines={1}>{owner.industry}</Text>
            </View>
          )}
        </View>

        <View style={[
          jh.typePill,
          { backgroundColor: job.jobType === 'organization' ? '#7C3AED' : '#F1BB03' },
        ]}>
          <Text style={[
            jh.typePillText,
            { color: job.jobType === 'organization' ? '#fff' : '#000' },
          ]}>
            {job.jobType === 'organization'
              ? (job.opportunityType ?? 'Opportunity').toUpperCase()
              : 'COMPANY'}
          </Text>
        </View>
      </View>

      {/* Title */}
      <Text style={jh.title}>{job.title}</Text>

      {/* Meta badges */}
      <View style={jh.metaRow}>
        {(job.location?.city || job.location?.region) && (
          <MetaBadge
            icon="location-outline"
            label={formatLocation(job.location)}
          />
        )}
        {job.type && <MetaBadge icon="briefcase-outline" label={job.type} />}
        {job.remote && job.remote !== 'on-site' && (
          <MetaBadge icon="globe-outline" label={job.remote} />
        )}
        {job.experienceLevel && (
          <MetaBadge icon="trending-up-outline" label={job.experienceLevel} />
        )}
      </View>

      {/* Salary + Deadline strip */}
      <View style={jh.strip}>
        {salaryText && (
          <View style={jh.stripItem}>
            <Ionicons name="cash-outline" size={16} color="#10B981" />
            <Text style={[jh.stripText, { color: '#10B981' }]}>{salaryText}</Text>
          </View>
        )}
        <View style={jh.stripItem}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color={dl.urgent ? '#F87171' : 'rgba(255,255,255,0.7)'}
          />
          <Text style={[jh.stripText, { color: dl.urgent ? '#F87171' : 'rgba(255,255,255,0.7)' }]}>
            {dl.text}
          </Text>
        </View>
        <View style={jh.stripItem}>
          <Ionicons name="people-outline" size={16} color="rgba(255,255,255,0.7)" />
          <Text style={jh.stripText}>
            {job.candidatesNeeded ?? 1} position{(job.candidatesNeeded ?? 1) > 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Application status */}
      {job.applicationInfo && (
        <View style={[
          jh.appStatus,
          {
            backgroundColor: job.applicationInfo.canApply
              ? 'rgba(16,185,129,0.15)'
              : 'rgba(239,68,68,0.15)',
          },
        ]}>
          <Ionicons
            name={job.applicationInfo.canApply ? 'checkmark-circle-outline' : 'close-circle-outline'}
            size={14}
            color={job.applicationInfo.canApply ? '#10B981' : '#F87171'}
          />
          <Text style={[
            jh.appStatusText,
            { color: job.applicationInfo.canApply ? '#10B981' : '#F87171' },
          ]}>
            {job.applicationInfo.canApply ? 'Accepting Applications' : 'Applications Closed'}
            {job.applicationInfo.candidatesRemaining !== undefined && job.applicationInfo.canApply
              ? ` · ${job.applicationInfo.candidatesRemaining} spot${job.applicationInfo.candidatesRemaining !== 1 ? 's' : ''} left`
              : ''}
          </Text>
        </View>
      )}
    </LinearGradient>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const jh = StyleSheet.create({
  gradient:      { paddingTop: 12, paddingHorizontal: 16, paddingBottom: 24 },
  topNav:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  navBtn:        { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  navRight:      { flexDirection: 'row', gap: 8 },
  bannerRow:     { flexDirection: 'row', gap: 8, marginBottom: 10 },
  banner:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 4 },
  bannerText:    { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  companyRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  avatarWrapper: { position: 'relative' },
  verifiedBadge: { position: 'absolute', bottom: -4, right: -4, backgroundColor: '#fff', borderRadius: 10, padding: 1 },
  companyInfo:   { flex: 1 },
  companyName:   { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 3 },
  industryRow:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  industryText:  { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  typePill:      { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  typePillText:  { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  title:         { fontSize: 22, fontWeight: '800', color: '#fff', lineHeight: 30, marginBottom: 14 },
  metaRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  metaBadge:     { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20, gap: 4 },
  metaBadgeText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  strip:         { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 10 },
  stripItem:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  stripText:     { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  appStatus:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginTop: 4 },
  appStatusText: { fontSize: 13, fontWeight: '600' },
});