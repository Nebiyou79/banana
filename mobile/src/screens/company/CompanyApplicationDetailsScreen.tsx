import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useCompanyApplicationDetails, useUpdateApplicationStatus } from '../../hooks/useApplications';
import { ApplicationStatusBadge } from '../../components/applications/ApplicationStatusBadge';
import { ApplicationStatusStepper } from '../../components/applications/ApplicationStatusStepper';
import { StatusUpdateModal } from '../../components/applications/StatusUpdateModal';
import { ApplicationStatus } from '../../services/applicationService';

type RouteParams = { applicationId: string };

const fmt = (dateStr?: string) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

export const CompanyApplicationDetailsScreen: React.FC = () => {
  const { theme }   = useThemeStore();
  const { colors, typography, spacing } = theme;
  const { role }    = useAuthStore();
  const route       = useNavigation();
  const navigation  = useNavigation();

  // Get applicationId from route params
  const { params }  = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const { applicationId } = params;

  const isOrg = role === 'organization';
  const { data: application, isLoading, isError } = useCompanyApplicationDetails(applicationId, isOrg ? 'organization' : 'company');
  const updateStatus = useUpdateApplicationStatus();

  const [showStatusModal, setShowStatusModal] = useState(false);

  const handleStatusUpdate = (status: ApplicationStatus, notes?: string) => {
    updateStatus.mutate(
      { id: applicationId, status, message: notes },
      {
        onSuccess: () => {
          setShowStatusModal(false);
        },
        onError: () =>
          Alert.alert('Error', 'Failed to update status. Please try again.'),
      }
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={s.loading}><ActivityIndicator size="large" color={colors.primary} /></View>
      </SafeAreaView>
    );
  }

  if (isError || !application) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={s.loading}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={{ color: colors.text, marginTop: 12 }}>Could not load application</Text>
        </View>
      </SafeAreaView>
    );
  }

  const candidate = application.candidate ?? application.userInfo;
  const candidateName = (candidate as any)?.name ?? 'Candidate';
  const avatarUrl = (candidate as any)?.avatar;
  const initials = candidateName.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
  const cvEntry = application.selectedCVs?.[0];
  const cvName  = cvEntry?.originalName ?? cvEntry?.filename ?? 'CV';

  const allAttachments = [
    ...(application.attachments?.referenceDocuments ?? []),
    ...(application.attachments?.experienceDocuments ?? []),
    ...(application.attachments?.portfolioFiles ?? []),
    ...(application.attachments?.otherDocuments ?? []),
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Nav header */}
      <View style={[s.navHeader, { borderBottomColor: colors.border, paddingHorizontal: spacing[5] }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.navTitle, { color: colors.text, fontSize: typography.lg }]}>Application</Text>
        <TouchableOpacity
          style={[s.updateBtn, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]}
          onPress={() => setShowStatusModal(true)}
        >
          <Text style={{ color: colors.primary, fontSize: typography.sm, fontWeight: '700' }}>
            Update Status
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing[5], gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Candidate card */}
        <View style={[s.candidateCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, { backgroundColor: colors.primary + '18', alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ color: colors.primary, fontWeight: '800', fontSize: typography.xl }}>{initials}</Text>
            </View>
          )}
          <View style={s.candidateInfo}>
            <Text style={[{ color: colors.text, fontSize: typography.lg, fontWeight: '800' }]}>
              {candidateName}
            </Text>
            {!!(candidate as any)?.headline && (
              <Text style={{ color: colors.textSecondary, fontSize: typography.sm }}>
                {(candidate as any).headline}
              </Text>
            )}
            {!!(candidate as any)?.email && (
              <Text style={{ color: colors.textMuted, fontSize: typography.sm }}>
                {(candidate as any).email}
              </Text>
            )}
          </View>
          <TouchableOpacity style={[s.profileBtn, { borderColor: colors.border }]}>
            <Text style={{ color: colors.textSecondary, fontSize: typography.xs, fontWeight: '600' }}>
              Profile →
            </Text>
          </TouchableOpacity>
        </View>

        {/* Status stepper */}
        <View style={[s.stepperCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={s.statusRow}>
            <ApplicationStatusBadge status={application.status} />
            <Text style={{ color: colors.textMuted, fontSize: typography.xs }}>
              Updated {fmt(application.updatedAt)}
            </Text>
          </View>
          <View style={{ marginTop: 16 }}>
            <ApplicationStatusStepper status={application.status} />
          </View>
        </View>

        {/* Application details */}
        <Section title="Application Details" icon="clipboard" colors={colors} typography={typography}>
          <InfoRow icon="calendar" label="Applied" value={fmt(application.createdAt)} colors={colors} typography={typography} />
          <InfoRow icon="briefcase" label="Job" value={application.job.title} colors={colors} typography={typography} />
        </Section>

        {/* CV */}
        <Section title="CV" icon="document-text" colors={colors} typography={typography}>
          <View style={s.fileRow}>
            <View style={[s.fileIcon, { backgroundColor: '#EF4444' + '18' }]}>
              <Ionicons name="document-text" size={18} color="#EF4444" />
            </View>
            <Text style={{ flex: 1, color: colors.text, fontSize: typography.sm, fontWeight: '600' }} numberOfLines={1}>
              {cvName}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: typography.xs }}>Download</Text>
          </View>
        </Section>

        {/* Cover letter */}
        {!!application.coverLetter && (
          <Section title="Cover Letter" icon="chatbubble-ellipses" colors={colors} typography={typography}>
            <Text style={{ color: colors.textSecondary, fontSize: typography.sm, lineHeight: 20 }}>
              {application.coverLetter}
            </Text>
          </Section>
        )}

        {/* Skills */}
        {(application.skills?.length ?? 0) > 0 && (
          <Section title="Skills" icon="star" colors={colors} typography={typography}>
            <View style={s.skillsWrap}>
              {application.skills!.map((skill) => (
                <View key={skill} style={[s.chip, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]}>
                  <Text style={{ color: colors.primary, fontSize: typography.xs, fontWeight: '600' }}>{skill}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {/* Contact info */}
        <Section title="Contact Info" icon="call" colors={colors} typography={typography}>
          <InfoRow icon="mail" label="Email" value={application.contactInfo?.email} colors={colors} typography={typography} />
          {!!application.contactInfo?.phone && (
            <InfoRow icon="call" label="Phone" value={application.contactInfo.phone} colors={colors} typography={typography} />
          )}
          {!!application.contactInfo?.location && (
            <InfoRow icon="location" label="Location" value={application.contactInfo.location} colors={colors} typography={typography} />
          )}
        </Section>

        {/* Attachments */}
        {allAttachments.length > 0 && (
          <Section title="Attachments" icon="attach" colors={colors} typography={typography}>
            {allAttachments.map((att, i) => (
              <View key={i} style={s.fileRow}>
                <View style={[s.fileIcon, { backgroundColor: colors.primary + '18' }]}>
                  <Ionicons name="document-attach" size={16} color={colors.primary} />
                </View>
                <Text style={{ flex: 1, color: colors.text, fontSize: typography.sm }} numberOfLines={1}>
                  {att.originalName ?? att.fileName ?? att.filename ?? `File ${i + 1}`}
                </Text>
                <Text style={{ color: colors.primary, fontSize: typography.xs, fontWeight: '600' }}>
                  Download
                </Text>
              </View>
            ))}
          </Section>
        )}
      </ScrollView>

      {/* Status modal */}
      <StatusUpdateModal
        applicationId={applicationId}
        currentStatus={application.status}
        visible={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onUpdate={handleStatusUpdate}
        isLoading={updateStatus.isPending}
        colors={colors}
        typography={typography}
        spacing={spacing}
      />
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
    <View style={{ gap: 8 }}>{children}</View>
  </View>
);

const InfoRow: React.FC<{
  icon: string;
  label: string;
  value?: string;
  colors: any;
  typography: any;
}> = ({ icon, label, value, colors, typography }) => (
  <View style={s.infoRow}>
    <Ionicons name={icon as any} size={14} color={colors.textMuted} />
    <Text style={{ color: colors.textMuted, fontSize: typography.sm, width: 64 }}>{label}</Text>
    <Text style={{ color: colors.text, fontSize: typography.sm, flex: 1 }} numberOfLines={1}>
      {value ?? '—'}
    </Text>
  </View>
);

const s = StyleSheet.create({
  loading:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navHeader:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  navTitle:      { flex: 1, fontWeight: '800' },
  updateBtn:     { borderRadius: 99, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  candidateCard: { borderRadius: 16, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  avatar:        { width: 60, height: 60, borderRadius: 30 },
  candidateInfo: { flex: 1, gap: 3 },
  profileBtn:    { borderRadius: 99, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  stepperCard:   { borderRadius: 16, borderWidth: 1, padding: 16 },
  statusRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  section:       { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  sectionTitle:  { fontWeight: '700' },
  infoRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fileRow:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fileIcon:      { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  skillsWrap:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip:          { borderRadius: 99, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
});
