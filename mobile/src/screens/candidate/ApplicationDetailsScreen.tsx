import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useThemeStore } from '../../store/themeStore';
import { useApplicationDetails, useWithdrawApplication } from '../../hooks/useApplications';
import { ApplicationStatusBadge } from '../../components/applications/ApplicationStatusBadge';
import { ApplicationStatusStepper } from '../../components/applications/ApplicationStatusStepper';

type RouteParams = { applicationId: string };

const fmt = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });

export const ApplicationDetailsScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const navigation = useNavigation();
  const { applicationId } = route.params;

  const { data: application, isLoading, isError } = useApplicationDetails(applicationId);
  const withdraw = useWithdrawApplication();

  const canWithdraw = application?.status === 'applied' || application?.status === 'under-review';

  const handleWithdraw = () => {
    Alert.alert(
      'Withdraw Application',
      'Are you sure? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: () =>
            withdraw.mutate(applicationId, {
              onSuccess: () => navigation.goBack(),
            }),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={s.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !application) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={s.loading}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={{ color: colors.text, marginTop: 12, fontSize: typography.base }}>
            Could not load application
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const owner = application.job.company ?? application.job.organization;
  const ownerName = owner?.name ?? 'Unknown';
  const logoUrl = (owner as any)?.logo ?? (owner as any)?.logoUrl;
  const cvEntry = application.selectedCVs?.[0];
  const cvName  = cvEntry?.originalName ?? cvEntry?.filename ?? 'CV';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Nav header */}
      <View style={[s.navHeader, { borderBottomColor: colors.border, paddingHorizontal: spacing[5] }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={s.navTitle}>
          {logoUrl ? (
            <Image source={{ uri: logoUrl }} style={s.logo} />
          ) : (
            <View style={[s.logo, { backgroundColor: colors.primary + '18', alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: typography.xs }}>
                {ownerName[0]}
              </Text>
            </View>
          )}
          <Text style={[s.jobTitle, { color: colors.text, fontSize: typography.base }]} numberOfLines={1}>
            {application.job.title}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing[5], gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status + stepper */}
        <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ApplicationStatusBadge status={application.status} />
          <Text style={[s.dateText, { color: colors.textMuted, fontSize: typography.xs, marginTop: 6, marginBottom: 12 }]}>
            Applied {fmt(application.createdAt)} · Updated {fmt(application.updatedAt)}
          </Text>
          <ApplicationStatusStepper status={application.status} />
        </View>

        {/* Job Details */}
        <Section title="Job Details" icon="briefcase" colors={colors} typography={typography}>
          <Row icon="business" label={ownerName} colors={colors} typography={typography} />
          {application.job.location?.city && (
            <Row icon="location" label={application.job.location.city} colors={colors} typography={typography} />
          )}
          {application.job.type && (
            <Row icon="time" label={application.job.type} colors={colors} typography={typography} />
          )}
        </Section>

        {/* CV */}
        <Section title="Your CV" icon="document-text" colors={colors} typography={typography}>
          <View style={s.fileRow}>
            <View style={[s.fileIcon, { backgroundColor: '#EF4444' + '18' }]}>
              <Ionicons name="document-text" size={18} color="#EF4444" />
            </View>
            <Text style={{ flex: 1, color: colors.text, fontSize: typography.sm, fontWeight: '600' }} numberOfLines={1}>
              {cvName}
            </Text>
          </View>
        </Section>

        {/* Cover letter */}
        {!!application.coverLetter && (
          <Section title="Cover Letter" icon="chatbubble-ellipses" colors={colors} typography={typography}>
            <ExpandableText text={application.coverLetter} colors={colors} typography={typography} />
          </Section>
        )}

        {/* Company response */}
        {!!application.companyResponse?.message && (
          <Section title="Employer Response" icon="mail" colors={colors} typography={typography}>
            <View style={[s.responseBox, { backgroundColor: colors.infoLight, borderColor: colors.info + '40' }]}>
              <Text style={{ color: colors.text, fontSize: typography.sm, fontStyle: 'italic' }}>
                "{application.companyResponse.message}"
              </Text>
              {application.companyResponse.respondedAt && (
                <Text style={{ color: colors.textMuted, fontSize: typography.xs, marginTop: 6 }}>
                  {fmt(application.companyResponse.respondedAt)}
                </Text>
              )}
            </View>
          </Section>
        )}

        {/* Status history */}
        {(application.statusHistory?.length ?? 0) > 0 && (
          <Section title="Activity" icon="time" colors={colors} typography={typography}>
            {application.statusHistory!.map((h, i) => (
              <View key={i} style={s.historyRow}>
                <View style={[s.historyDot, { backgroundColor: colors.primary }]} />
                <View>
                  <Text style={{ color: colors.text, fontSize: typography.sm, fontWeight: '600' }}>
                    {h.status.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: typography.xs }}>
                    {fmt(h.changedAt)}
                  </Text>
                  {!!h.message && (
                    <Text style={{ color: colors.textSecondary, fontSize: typography.xs, marginTop: 2 }}>
                      {h.message}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </Section>
        )}

        {/* Withdraw */}
        {canWithdraw && (
          <TouchableOpacity
            style={[s.withdrawBtn, { borderColor: '#EF4444' + '40' }]}
            onPress={handleWithdraw}
            disabled={withdraw.isPending}
          >
            {withdraw.isPending ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: typography.base }}>
                  Withdraw Application
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const Section: React.FC<{
  title: string;
  icon: string;
  children: React.ReactNode;
  colors: any;
  typography: any;
}> = ({ title, icon, children, colors, typography }) => (
  <View style={[s.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
    <View style={s.sectionHeader}>
      <Ionicons name={icon as any} size={16} color={colors.primary} />
      <Text style={[s.sectionTitle, { color: colors.text, fontSize: typography.sm }]}>{title}</Text>
    </View>
    {children}
  </View>
);

const Row: React.FC<{ icon: string; label: string; colors: any; typography: any }> = ({
  icon, label, colors, typography,
}) => (
  <View style={s.infoRow}>
    <Ionicons name={icon as any} size={14} color={colors.textMuted} />
    <Text style={{ color: colors.textSecondary, fontSize: typography.sm }}>{label}</Text>
  </View>
);

const ExpandableText: React.FC<{ text: string; colors: any; typography: any }> = ({
  text, colors, typography,
}) => {
  const [expanded, setExpanded] = useState(false);
  const short = text.length > 200 && !expanded;
  return (
    <View>
      <Text style={{ color: colors.textSecondary, fontSize: typography.sm, lineHeight: 20 }}>
        {short ? text.slice(0, 200) + '…' : text}
      </Text>
      {text.length > 200 && (
        <TouchableOpacity onPress={() => setExpanded(!expanded)} style={{ marginTop: 6 }}>
          <Text style={{ color: colors.primary, fontSize: typography.sm, fontWeight: '600' }}>
            {expanded ? 'Show less' : 'Read more'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  loading:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navHeader:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn:     { padding: 4 },
  navTitle:    { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo:        { width: 30, height: 30, borderRadius: 8 },
  jobTitle:    { fontWeight: '700', flex: 1 },
  card:        { borderRadius: 16, borderWidth: 1, padding: 16 },
  dateText:    {},
  section:     { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionTitle:  { fontWeight: '700' },
  infoRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fileRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fileIcon:    { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  responseBox: { borderRadius: 10, borderWidth: 1, padding: 12 },
  historyRow:  { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  historyDot:  { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
  },
});
