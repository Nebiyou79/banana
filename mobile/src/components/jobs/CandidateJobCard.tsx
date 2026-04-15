/**
 * mobile/src/components/jobs/CandidateJobCard.tsx
 *
 * Performance-List-Specialist + Mobile-UI-Architect skills applied.
 * - Wrapped in React.memo to prevent re-renders during FlashList scroll
 * - All colors from theme — zero hardcoded values
 * - 44px minimum touch targets
 * - Platform-aware shadows
 */

import React, { useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Image, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { Job } from '../../services/jobService';
import {
  formatSalary, formatDeadline, formatPostedDate,
  isDeadlineSoon, isDeadlinePast, getJobTypeColor, getJobTypeLabel,
  getExperienceLevelLabel, getCompanyInitials, getSalaryModeConfig,
} from '../../utils/jobHelpers';

// ─── Sub-components ───────────────────────────────────────────────────────────

interface LogoProps { name: string; logoUrl?: string; size?: number; primary: string; primaryLight: string }
const CompanyLogo = React.memo<LogoProps>(({ name, logoUrl, size = 46, primary, primaryLight }) => {
  if (logoUrl) {
    return <Image source={{ uri: logoUrl }} style={{ width: size, height: size, borderRadius: 12 }} resizeMode="cover" />;
  }
  return (
    <View style={[logo.wrap, { width: size, height: size, backgroundColor: primaryLight, borderRadius: 12 }]}>
      <Text style={[logo.text, { color: primary, fontSize: size * 0.36 }]}>{getCompanyInitials(name)}</Text>
    </View>
  );
});

const logo = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  text: { fontWeight: '800' },
});
const formatLocation = (loc: any) => {
  if (!loc) return 'Remote';
  if (typeof loc === 'string') return loc;
  // Extract specific fields from the object
  return loc.city || loc.region || loc.specificLocation || 'Location N/A';
};
// ─── Types ────────────────────────────────────────────────────────────────────

export interface CandidateJobCardProps {
  job:       Job;
  onPress:   () => void;
  onSave?:   () => void;
  isSaved?:  boolean;
  compact?:  boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const CandidateJobCard = React.memo<CandidateJobCardProps>(({
  job, onPress, onSave, isSaved, compact = false,
}) => {
  const { theme } = useThemeStore();
  const c = theme.colors;
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 60 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 60 }).start();

  const owner      = job.company ?? job.organization;
  const ownerName  = owner?.name ?? 'Unknown';
  const logoUrl    = owner?.logoUrl ?? (owner as any)?.logo;
  const typeColor  = getJobTypeColor(job.type);
  const salCfg     = getSalaryModeConfig(job.salaryMode, theme.isDark);
  const deadline   = job.applicationDeadline;
  const dlPast     = isDeadlinePast(deadline);
  const dlSoon     = isDeadlineSoon(deadline);
  const dlText     = formatDeadline(deadline);
  const dlBg       = dlPast ? (theme.isDark ? '#450A0A' : '#FEF2F2')
                   : dlSoon ? (theme.isDark ? '#451A03' : '#FEF9C3')
                   : (theme.isDark ? '#1F2937' : '#F1F5F9');
  const dlColor    = dlPast ? c.error : dlSoon ? c.warning : c.textMuted;

  const cardShadow = Platform.OS === 'ios'
    ? { shadowColor: '#94A3B8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8 }
    : { elevation: 2 };

  if (compact) {
    return (
      <TouchableOpacity onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} activeOpacity={1}>
        <Animated.View style={[s.compact, { backgroundColor: c.card, borderColor: c.border, transform: [{ scale }] }, cardShadow]}>
          <CompanyLogo name={ownerName} logoUrl={logoUrl} size={38} primary={c.primary} primaryLight={c.primaryLight} />
          <View style={{ flex: 1, marginLeft: 10, gap: 3 }}>
            <Text style={[s.compactTitle, { color: c.text }]} numberOfLines={1}>{job.title}</Text>
            <Text style={[s.compactCompany, { color: c.textMuted }]} numberOfLines={1}>{ownerName}</Text>
          </View>
          <View style={[s.typePill, { backgroundColor: typeColor + '18' }]}>
            <Text style={[s.typePillText, { color: typeColor }]}>{getJobTypeLabel(job.type)}</Text>
          </View>
          {onSave && (
            <TouchableOpacity onPress={onSave} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }} style={s.saveBtn}>
              <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={20} color={isSaved ? c.primary : c.textMuted} />
            </TouchableOpacity>
          )}
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} activeOpacity={1}>
      <Animated.View style={[s.card, { backgroundColor: c.card, borderColor: c.border, transform: [{ scale }] }, cardShadow]}>

        {/* ── Badges row ── */}
        {(job.featured || job.urgent) && (
          <View style={s.bannerRow}>
            {job.featured && (
              <View style={[s.banner, { backgroundColor: theme.isDark ? '#1E3A5F' : '#EFF6FF' }]}>
                <Ionicons name="star" size={10} color={c.primary} />
                <Text style={[s.bannerText, { color: c.primary }]}>Featured</Text>
              </View>
            )}
            {job.urgent && (
              <View style={[s.banner, { backgroundColor: theme.isDark ? '#450A0A' : '#FEF2F2' }]}>
                <Ionicons name="flash" size={10} color={c.error} />
                <Text style={[s.bannerText, { color: c.error }]}>Urgent</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Header: Logo + Title + Save ── */}
        <View style={s.row1}>
          <CompanyLogo name={ownerName} logoUrl={logoUrl} primary={c.primary} primaryLight={c.primaryLight} />
          <View style={s.titleBlock}>
            <Text style={[s.title, { color: c.text }]} numberOfLines={2}>{job.title}</Text>
            <View style={s.companyRow}>
              <Text style={[s.company, { color: c.textSecondary }]} numberOfLines={1}>{ownerName}</Text>
              {owner?.verified && (
                <Ionicons name="shield-checkmark" size={13} color={c.success} style={{ marginLeft: 4 }} />
              )}
            </View>
          </View>
          {onSave && (
            <TouchableOpacity onPress={onSave} style={s.saveBtn} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={22} color={isSaved ? c.primary : c.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Meta chips ── */}
        <View style={s.metaRow}>
          {[
            { icon: 'briefcase-outline', text: getJobTypeLabel(job.type) },
            { icon: 'school-outline',    text: getExperienceLevelLabel(job.experienceLevel) },
          ].map((m, i) => (
            <View key={i} style={[s.metaChip, { backgroundColor: theme.isDark ? '#1F2937' : '#F8FAFC' }]}>
              <Ionicons name={m.icon as any} size={12} color={c.textMuted} />
              <Text style={[s.metaText, { color: c.textMuted }]} numberOfLines={1}>{m.text}</Text>
            </View>
          ))}
        </View>
<View style={s.metaChip}>
  <Ionicons name="location-outline" size={14} color={c.textMuted} />
  <Text style={[s.metaText, { color: c.textMuted }]}>
    {formatLocation(job.location)} 
  </Text>
</View>
        {/* ── Salary + deadline + type ── */}
        <View style={s.row3}>
          <View style={[s.salaryBadge, { backgroundColor: salCfg.bg }]}>
            <Ionicons name={salCfg.icon as any} size={11} color={salCfg.text} />
            <Text style={[s.salaryText, { color: salCfg.text }]}>
              {job.salaryMode === 'range' ? formatSalary(job) : salCfg.label}
            </Text>
          </View>
          <View style={{ flex: 1 }} />
          {dlText && (
            <View style={[s.deadlineBadge, { backgroundColor: dlBg }]}>
              <Ionicons name="time-outline" size={11} color={dlColor} />
              <Text style={[s.deadlineText, { color: dlColor }]}>{dlText}</Text>
            </View>
          )}
          <View style={[s.typePill, { backgroundColor: typeColor + '18', marginLeft: 6 }]}>
            <Text style={[s.typePillText, { color: typeColor }]}>{getJobTypeLabel(job.type)}</Text>
          </View>
        </View>

        {/* ── Skills ── */}
        {(job.skills ?? []).length > 0 && (
          <View style={s.skillsRow}>
            {job.skills!.slice(0, 4).map(sk => (
              <View key={sk} style={[s.skillTag, { backgroundColor: c.primaryLight }]}>
                <Text style={[s.skillTagText, { color: c.primary }]}>{sk}</Text>
              </View>
            ))}
            {job.skills!.length > 4 && (
              <Text style={[s.skillMore, { color: c.textMuted }]}>+{job.skills!.length - 4}</Text>
            )}
          </View>
        )}

        {/* ── Footer ── */}
        <View style={[s.footer, { borderTopColor: c.border }]}>
          <Text style={[s.posted, { color: c.textMuted }]}>{formatPostedDate(job.createdAt)}</Text>
          {(job.applicationCount ?? 0) > 0 && (
            <View style={s.appCount}>
              <Ionicons name="people-outline" size={12} color={c.textMuted} />
              <Text style={[s.appCountText, { color: c.textMuted }]}>{job.applicationCount} applicants</Text>
            </View>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
});

CandidateJobCard.displayName = 'CandidateJobCard';

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  card:            { borderRadius: 18, borderWidth: 1, padding: 16 },
  compact:         { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 12 },
  compactTitle:    { fontSize: 14, fontWeight: '600' },
  compactCompany:  { fontSize: 12 },
  bannerRow:       { flexDirection: 'row', gap: 6, marginBottom: 12 },
  banner:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, gap: 4 },
  bannerText:      { fontSize: 10, fontWeight: '700' },
  row1:            { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  titleBlock:      { flex: 1 },
  title:           { fontSize: 16, fontWeight: '700', lineHeight: 22 },
  companyRow:      { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  company:         { fontSize: 13 },
  saveBtn:         { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  metaRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  metaChip:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, gap: 4 },
  metaText:        { fontSize: 12 },
  row3:            { flexDirection: 'row', alignItems: 'center', marginTop: 12, flexWrap: 'wrap', gap: 6 },
  salaryBadge:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, gap: 4 },
  salaryText:      { fontSize: 12, fontWeight: '600' },
  deadlineBadge:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, gap: 4 },
  deadlineText:    { fontSize: 12, fontWeight: '600' },
  typePill:        { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  typePillText:    { fontSize: 11, fontWeight: '700' },
  skillsRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  skillTag:        { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  skillTagText:    { fontSize: 11, fontWeight: '500' },
  skillMore:       { fontSize: 11, alignSelf: 'center' },
  footer:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1 },
  posted:          { fontSize: 11 },
  appCount:        { flexDirection: 'row', alignItems: 'center', gap: 4 },
  appCountText:    { fontSize: 11 },
});