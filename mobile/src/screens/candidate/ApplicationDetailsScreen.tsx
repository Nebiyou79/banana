/**
 * mobile/src/screens/candidate/ApplicationDetailScreen.tsx
 * Candidate view: submitted application, current status, and timeline.
 */

import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useCompanyApplicationDetails } from '../../hooks/useApplications';
import {
  STATUS_LABELS, STATUS_COLORS, STATUS_COLORS_DARK, ApplicationStatus,
} from '../../services/applicationService';
import { formatDate, formatPostedDate, getCompanyInitials } from '../../utils/jobHelpers';
import { ScreenHeader } from '../../components/shared/ScreenHeader';
import { ListSkeleton } from '../../components/skeletons';

interface Props {
  navigation: any;
  route: { params: { applicationId: string } };
}

export const ApplicationDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { applicationId } = route.params;
  const { theme } = useThemeStore();
  const c = theme.colors;
  const appQ = useCompanyApplicationDetails(applicationId);
  const app = appQ.data;

  if (appQ.isLoading) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: c.background }]} edges={['top']}>
        <ScreenHeader title="Application" onBack={() => navigation.goBack()} />
        <ListSkeleton count={2} type="application" />
      </SafeAreaView>
    );
  }

  if (!app) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: c.background }]} edges={['top']}>
        <ScreenHeader title="Not Found" onBack={() => navigation.goBack()} />
        <View style={s.center}>
          <Text style={{ color: c.textMuted }}>Application not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const SC = theme.isDark ? STATUS_COLORS_DARK : STATUS_COLORS;
  const sc = SC[app.status];
  const job = app.job;
  const owner = job?.company ?? job?.organization;

  return (
    <SafeAreaView style={[s.root, { backgroundColor: c.background }]} edges={['top']}>
      <ScreenHeader title="Application" subtitle={job?.title} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Status hero */}
        <View style={[s.statusHero, { backgroundColor: sc.bg, borderColor: sc.border }]}>
          <View style={[s.statusIconWrap, { backgroundColor: sc.dot + '22' }]}>
            <Ionicons name="briefcase-outline" size={28} color={sc.dot} />
          </View>
          <Text style={[s.statusLabel, { color: sc.text }]}>{STATUS_LABELS[app.status]}</Text>
          <Text style={[s.statusSub, { color: sc.text + 'BB' }]}>
            Applied {formatPostedDate(app.createdAt)}
          </Text>
        </View>

        {/* Job info card */}
        <View style={[s.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[s.cardTitle, { color: c.text }]}>{job?.title ?? 'Job Position'}</Text>
          <Text style={[s.cardSub, { color: c.textSecondary }]}>{owner?.name}</Text>
          {job?.location && (
            <View style={s.row}>
              <Ionicons name="location-outline" size={13} color={c.textMuted} />
              <Text style={[s.rowText, { color: c.textMuted }]}>
                {job.location.city ?? job.location.region}
              </Text>
            </View>
          )}
        </View>

        {/* Cover Letter */}
        {app.coverLetter && (
          <View style={[s.card, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={s.cardHeader}>
              <Ionicons name="document-text-outline" size={16} color={c.primary} />
              <Text style={[s.cardHeaderText, { color: c.text }]}>Cover Letter</Text>
            </View>
            <Text style={[s.bodyText, { color: c.textSecondary }]}>{app.coverLetter}</Text>
          </View>
        )}

        {/* Skills */}
        {(app.skills ?? []).length > 0 && (
          <View style={[s.card, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={s.cardHeader}>
              <Ionicons name="code-outline" size={16} color={c.primary} />
              <Text style={[s.cardHeaderText, { color: c.text }]}>Skills Highlighted</Text>
            </View>
            <View style={s.skillsRow}>
              {app.skills.map(sk => (
                <View key={sk} style={[s.skillTag, { backgroundColor: c.primaryLight }]}>
                  <Text style={[s.skillText, { color: c.primary }]}>{sk}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Company response */}
        {app.companyResponse && (
          <View style={[s.card, { backgroundColor: c.card, borderColor: c.border, borderLeftWidth: 4, borderLeftColor: c.primary }]}>
            <View style={s.cardHeader}>
              <Ionicons name="chatbubble-outline" size={16} color={c.primary} />
              <Text style={[s.cardHeaderText, { color: c.text }]}>Company Message</Text>
            </View>
            {app.companyResponse.message && (
              <Text style={[s.bodyText, { color: c.textSecondary }]}>{app.companyResponse.message}</Text>
            )}
            {app.companyResponse.interviewDetails && (
              <View style={[s.interviewBox, { backgroundColor: c.primaryLight }]}>
                <Ionicons name="calendar-outline" size={16} color={c.primary} />
                <View>
                  <Text style={[s.interviewTitle, { color: c.primary }]}>Interview Scheduled</Text>
                  <Text style={[s.interviewDate, { color: c.text }]}>
                    {formatDate(app.companyResponse.interviewDetails.date)}
                  </Text>
                  <Text style={[s.interviewLoc, { color: c.textSecondary }]}>
                    {app.companyResponse.interviewDetails.location}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Status Timeline */}
        {(app.statusHistory ?? []).length > 0 && (
          <View style={[s.card, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={s.cardHeader}>
              <Ionicons name="time-outline" size={16} color={c.primary} />
              <Text style={[s.cardHeaderText, { color: c.text }]}>Status Timeline</Text>
            </View>
            {[...app.statusHistory].reverse().map((entry, i) => {
              const esc = SC[entry.status as ApplicationStatus] ?? SC.applied;
              return (
                <View key={entry._id ?? i} style={s.timelineItem}>
                  <View style={s.timelineLeft}>
                    <View style={[s.timelineDot, { backgroundColor: esc.dot }]} />
                    {i < app.statusHistory.length - 1 && (
                      <View style={[s.timelineLine, { backgroundColor: c.border }]} />
                    )}
                  </View>
                  <View style={s.timelineContent}>
                    <Text style={[s.timelineStatus, { color: c.text }]}>
                      {STATUS_LABELS[entry.status as ApplicationStatus]}
                    </Text>
                    {entry.message && (
                      <Text style={[s.timelineMsg, { color: c.textSecondary }]}>{entry.message}</Text>
                    )}
                    <Text style={[s.timelineDate, { color: c.textMuted }]}>
                      {formatDate(entry.changedAt)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root:            { flex: 1 },
  scroll:          { padding: 16, gap: 14, paddingBottom: 40 },
  center:          { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statusHero:      { alignItems: 'center', padding: 24, borderRadius: 18, borderWidth: 1, gap: 8 },
  statusIconWrap:  { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  statusLabel:     { fontSize: 20, fontWeight: '800' },
  statusSub:       { fontSize: 13 },
  card:            { borderRadius: 16, borderWidth: 1, padding: 16 },
  cardTitle:       { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  cardSub:         { fontSize: 14, marginBottom: 8 },
  cardHeader:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardHeaderText:  { fontSize: 14, fontWeight: '700' },
  row:             { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowText:         { fontSize: 12 },
  bodyText:        { fontSize: 14, lineHeight: 22 },
  skillsRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillTag:        { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  skillText:       { fontSize: 12, fontWeight: '500' },
  interviewBox:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 12, padding: 12, borderRadius: 12 },
  interviewTitle:  { fontSize: 12, fontWeight: '700' },
  interviewDate:   { fontSize: 15, fontWeight: '700', marginTop: 4 },
  interviewLoc:    { fontSize: 13, marginTop: 2 },
  timelineItem:    { flexDirection: 'row', gap: 12, paddingBottom: 16 },
  timelineLeft:    { alignItems: 'center', width: 16 },
  timelineDot:     { width: 12, height: 12, borderRadius: 6 },
  timelineLine:    { flex: 1, width: 2, marginTop: 4 },
  timelineContent: { flex: 1, paddingBottom: 4 },
  timelineStatus:  { fontSize: 14, fontWeight: '700' },
  timelineMsg:     { fontSize: 13, marginTop: 4, lineHeight: 19 },
  timelineDate:    { fontSize: 11, marginTop: 6 },
});