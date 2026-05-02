// src/screens/company/proposals/ProposalDetailScreen.tsx
// Banana Mobile App — Module 6B: Proposals
// Company / Organization view: full proposal detail with status management,
// shortlist toggle, owner notes, interview scheduling, audit log.

import React, { useState, useLayoutEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useThemeStore } from '../../../store/themeStore';
import {
  useProposalDetail,
  useUpdateProposalStatus,
  useToggleShortlist,
} from '../../../hooks/useProposal';
import { ProposalStatusBadge } from '../../../components/proposals/ProposalStatusBadge';
import { ProposalBudgetDisplay } from '../../../components/proposals/ProposalBudgetDisplay';
import { ProposalMilestoneList } from '../../../components/proposals/ProposalMilestoneList';
import { ProposalAttachmentList } from '../../../components/proposals/ProposalAttachmentList';
import { ProposalScreeningAnswers } from '../../../components/proposals/ProposalScreeningAnswers';
import { ProposalDetailSkeleton } from '../../../components/proposals/ProposalSkeleton';
import type {
  ProposalStatus,
  ProposalTender,
  ProposalUser,
  ProposalFreelancerProfile,
  UpdateProposalStatusData,
} from '../../../types/proposal';

// ─── Navigation ───────────────────────────────────────────────────────────────

type ScreenRouteProp = RouteProp<
  {
    ProposalDetail: {
      proposalId: string;
      tenderId: string;
      role: 'company' | 'organization';
    };
  },
  'ProposalDetail'
>;

// ─── Status transition config ─────────────────────────────────────────────────

interface ActionConfig {
  label: string;
  targetStatus: ProposalStatus;
  color: string;
  bg: string;
  icon: string;
  requiresConfirm?: boolean;
  confirmTitle?: string;
  confirmMessage?: string;
  isFinal?: boolean;
}

const STATUS_ACTIONS: Partial<Record<ProposalStatus, ActionConfig[]>> = {
  submitted: [
    {
      label: 'Move to Under Review',
      targetStatus: 'under_review',
      color: '#fff',
      bg: '#2563EB',
      icon: '🔍',
    },
    {
      label: 'Reject Proposal',
      targetStatus: 'rejected',
      color: '#DC2626',
      bg: 'rgba(239,68,68,0.1)',
      icon: '✕',
      requiresConfirm: true,
      confirmTitle: 'Reject this proposal?',
      confirmMessage: 'The freelancer will be notified that their proposal was not selected.',
      isFinal: true,
    },
  ],
  under_review: [
    {
      label: 'Shortlist Proposal ⭐',
      targetStatus: 'shortlisted',
      color: '#fff',
      bg: '#0D9488',
      icon: '⭐',
    },
    {
      label: 'Reject Proposal',
      targetStatus: 'rejected',
      color: '#DC2626',
      bg: 'rgba(239,68,68,0.1)',
      icon: '✕',
      requiresConfirm: true,
      confirmTitle: 'Reject this proposal?',
      confirmMessage: 'The freelancer will be notified that their proposal was not selected.',
      isFinal: true,
    },
  ],
  shortlisted: [
    {
      label: 'Schedule Interview 📅',
      targetStatus: 'interview_scheduled',
      color: '#fff',
      bg: '#7C3AED',
      icon: '📅',
    },
    {
      label: 'Award Contract 🏆',
      targetStatus: 'awarded',
      color: '#fff',
      bg: '#059669',
      icon: '🏆',
      requiresConfirm: true,
      confirmTitle: 'Award this contract?',
      confirmMessage: 'The freelancer will be notified that they have been awarded this project.',
      isFinal: true,
    },
    {
      label: 'Reject Proposal',
      targetStatus: 'rejected',
      color: '#DC2626',
      bg: 'rgba(239,68,68,0.1)',
      icon: '✕',
      requiresConfirm: true,
      confirmTitle: 'Reject this proposal?',
      confirmMessage: 'The freelancer will be notified that their proposal was not selected.',
      isFinal: true,
    },
  ],
  interview_scheduled: [
    {
      label: 'Award Contract 🏆',
      targetStatus: 'awarded',
      color: '#fff',
      bg: '#059669',
      icon: '🏆',
      requiresConfirm: true,
      confirmTitle: 'Award this contract?',
      confirmMessage: 'The freelancer will be notified that they have been awarded this project.',
      isFinal: true,
    },
    {
      label: 'Reject Proposal',
      targetStatus: 'rejected',
      color: '#DC2626',
      bg: 'rgba(239,68,68,0.1)',
      icon: '✕',
      requiresConfirm: true,
      confirmTitle: 'Reject this proposal?',
      confirmMessage: 'The freelancer will be notified that their proposal was not selected.',
      isFinal: true,
    },
  ],
};

// ─── Status Update Modal ──────────────────────────────────────────────────────

interface StatusUpdateModalProps {
  visible: boolean;
  action: ActionConfig | null;
  onConfirm: (data: UpdateProposalStatusData) => void;
  onClose: () => void;
  isLoading: boolean;
  colors: {
    card: string;
    border: string;
    text: string;
    textMuted: string;
    textSecondary: string;
    inputBg: string;
    placeholder: string;
    background: string;
  };
}

const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
  visible,
  action,
  onConfirm,
  onClose,
  isLoading,
  colors,
}) => {
  const [ownerNotes, setOwnerNotes] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');

  const isInterview = action?.targetStatus === 'interview_scheduled';
  const isAwarded = action?.targetStatus === 'awarded';
  const isRejected = action?.targetStatus === 'rejected';

  const handleConfirm = () => {
    if (isInterview && !interviewDate.trim()) {
      Alert.alert('Interview date required', 'Please enter a date and time for the interview.');
      return;
    }
    onConfirm({
      status: action!.targetStatus,
      ownerNotes: ownerNotes.trim() || undefined,
      interviewDate: interviewDate.trim() || undefined,
      interviewNotes: interviewNotes.trim() || undefined,
    });
  };

  if (!action) return null;

  const inputStyle = {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.inputBg,
    borderColor: colors.border,
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={modalStyles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={modalStyles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[
            modalStyles.sheet,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {/* Color strip */}
          <View
            style={[
              modalStyles.strip,
              { backgroundColor: action.isFinal ? (isRejected ? '#EF4444' : '#10B981') : action.bg },
            ]}
          />

          {/* Header */}
          <View style={modalStyles.header}>
            <View
              style={[
                modalStyles.iconCircle,
                { backgroundColor: isRejected ? 'rgba(239,68,68,0.12)' : isAwarded ? 'rgba(16,185,129,0.12)' : 'rgba(241,187,3,0.12)' },
              ]}
            >
              <Text style={modalStyles.actionIcon}>{action.icon}</Text>
            </View>
            <View style={modalStyles.headerText}>
              <Text style={[modalStyles.headerTitle, { color: colors.text }]}>
                {action.label}
              </Text>
              <Text style={[modalStyles.headerSub, { color: colors.textMuted }]}>
                Update proposal status
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[modalStyles.closeBtn, { color: colors.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={modalStyles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Warning for final actions */}
            {action.isFinal && (
              <View
                style={[
                  modalStyles.warningBox,
                  {
                    backgroundColor: isRejected
                      ? 'rgba(239,68,68,0.08)'
                      : 'rgba(16,185,129,0.08)',
                    borderColor: isRejected ? '#EF4444' : '#10B981',
                  },
                ]}
              >
                <Text style={modalStyles.warningIcon}>
                  {isAwarded ? '🏆' : '⚠️'}
                </Text>
                <Text
                  style={[
                    modalStyles.warningText,
                    { color: isRejected ? '#DC2626' : '#059669' },
                  ]}
                >
                  {action.confirmMessage}
                </Text>
              </View>
            )}

            {/* Interview date/time */}
            {isInterview && (
              <View style={modalStyles.field}>
                <Text style={[modalStyles.fieldLabel, { color: colors.textMuted }]}>
                  Interview Date & Time{' '}
                  <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
                <TextInput
                  value={interviewDate}
                  onChangeText={setInterviewDate}
                  placeholder="e.g. 2025-06-15 10:00 AM"
                  placeholderTextColor={colors.placeholder}
                  style={inputStyle}
                />
                <Text style={[modalStyles.fieldHint, { color: colors.textMuted }]}>
                  Enter date and time in any clear format
                </Text>
              </View>
            )}

            {/* Interview notes */}
            {isInterview && (
              <View style={modalStyles.field}>
                <Text style={[modalStyles.fieldLabel, { color: colors.textMuted }]}>
                  Interview Notes{' '}
                  <Text style={[modalStyles.optionalLabel, { color: colors.textMuted }]}>
                    (optional)
                  </Text>
                </Text>
                <TextInput
                  value={interviewNotes}
                  onChangeText={setInterviewNotes}
                  placeholder="Format, location, topics to cover…"
                  placeholderTextColor={colors.placeholder}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  style={[inputStyle, modalStyles.textArea]}
                />
              </View>
            )}

            {/* Owner notes */}
            <View style={modalStyles.field}>
              <Text style={[modalStyles.fieldLabel, { color: colors.textMuted }]}>
                {isRejected || isAwarded ? 'Feedback for freelancer' : 'Internal notes'}
                {'  '}
                <Text style={[modalStyles.optionalLabel, { color: colors.textMuted }]}>
                  (optional)
                </Text>
              </Text>
              <TextInput
                value={ownerNotes}
                onChangeText={setOwnerNotes}
                placeholder={
                  isRejected
                    ? 'Optional feedback explaining why the proposal was not selected…'
                    : isAwarded
                    ? 'Any notes for the awarded freelancer…'
                    : 'Internal notes about this decision…'
                }
                placeholderTextColor={colors.placeholder}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={1000}
                style={[inputStyle, modalStyles.textArea]}
              />
              <Text style={[modalStyles.charCount, { color: colors.textMuted }]}>
                {ownerNotes.length}/1000
              </Text>
            </View>
          </ScrollView>

          {/* Footer actions */}
          <View
            style={[
              modalStyles.footer,
              { borderTopColor: colors.border },
            ]}
          >
            <TouchableOpacity
              onPress={onClose}
              style={[
                modalStyles.cancelBtn,
                { borderColor: colors.border, backgroundColor: colors.inputBg },
              ]}
            >
              <Text style={[modalStyles.cancelText, { color: colors.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              disabled={isLoading}
              style={[
                modalStyles.confirmBtn,
                {
                  backgroundColor: isRejected
                    ? '#EF4444'
                    : isAwarded
                    ? '#059669'
                    : action.bg,
                  opacity: isLoading ? 0.6 : 1,
                },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={modalStyles.confirmText}>
                  {isInterview ? 'Schedule' : isAwarded ? 'Award 🏆' : isRejected ? 'Reject' : 'Confirm'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  strip: { height: 4, width: '100%' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: { fontSize: 20 },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  headerSub: { fontSize: 12, marginTop: 1 },
  closeBtn: { fontSize: 18, fontWeight: '600', padding: 4 },
  body: { paddingHorizontal: 20, paddingBottom: 8 },
  warningBox: {
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  warningIcon: { fontSize: 16, flexShrink: 0 },
  warningText: { flex: 1, fontSize: 13, lineHeight: 20, fontWeight: '500' },
  field: { marginBottom: 16, gap: 6 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  optionalLabel: { fontWeight: '400', textTransform: 'none', letterSpacing: 0 },
  fieldHint: { fontSize: 11 },
  textArea: { height: 90, paddingTop: 12 },
  charCount: { fontSize: 11, textAlign: 'right', marginTop: -2 },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '600' },
  confirmBtn: {
    flex: 2,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});

// ─── Section card ─────────────────────────────────────────────────────────────

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  style?: object;
  colors: { card: string; border: string; textMuted: string };
}

const SectionCard: React.FC<SectionCardProps> = ({ title, children, style, colors }) => (
  <View
    style={[
      sectionStyles.card,
      { backgroundColor: colors.card, borderColor: colors.border },
      style,
    ]}
  >
    <Text style={[sectionStyles.title, { color: colors.textMuted }]}>{title}</Text>
    {children}
  </View>
);

const sectionStyles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  title: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: -4,
  },
});

// ─── Freelancer profile snippet ───────────────────────────────────────────────

interface FreelancerSnippetProps {
  user: ProposalUser;
  profile?: ProposalFreelancerProfile | null;
  colors: { card: string; border: string; text: string; textMuted: string; textSecondary: string };
}

const FreelancerSnippet: React.FC<FreelancerSnippetProps> = ({ user, profile, colors }) => {
  const initials = (user.name ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  const ratings = profile?.ratings;

  return (
    <View style={snippetStyles.container}>
      {/* Avatar */}
      <View style={snippetStyles.avatarWrap}>
        {user.avatar ? (
          <Image source={{ uri: user.avatar }} style={snippetStyles.avatarImg} />
        ) : (
          <View style={[snippetStyles.avatarFallback, { backgroundColor: 'rgba(241,187,3,0.15)' }]}>
            <Text style={[snippetStyles.avatarInitials, { color: '#D97706' }]}>
              {initials}
            </Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={snippetStyles.info}>
        <Text style={[snippetStyles.name, { color: colors.text }]}>{user.name}</Text>
        {profile?.headline ? (
          <Text style={[snippetStyles.headline, { color: colors.textSecondary }]} numberOfLines={1}>
            {profile.headline}
          </Text>
        ) : null}
        {user.location ? (
          <Text style={[snippetStyles.location, { color: colors.textMuted }]}>
            📍 {user.location}
          </Text>
        ) : null}
        {ratings && ratings.count > 0 && (
          <View style={snippetStyles.ratingRow}>
            <Text style={snippetStyles.ratingStars}>{'⭐'.repeat(Math.round(ratings.average))}</Text>
            <Text style={[snippetStyles.ratingValue, { color: '#D97706' }]}>
              {ratings.average.toFixed(1)}
            </Text>
            <Text style={[snippetStyles.ratingCount, { color: colors.textMuted }]}>
              ({ratings.count})
            </Text>
          </View>
        )}
      </View>

      {/* Stats */}
      <View style={snippetStyles.stats}>
        {profile?.successRate != null && (
          <View style={snippetStyles.statItem}>
            <Text style={[snippetStyles.statValue, { color: '#059669' }]}>
              {profile.successRate}%
            </Text>
            <Text style={[snippetStyles.statLabel, { color: colors.textMuted }]}>Success</Text>
          </View>
        )}
        {profile?.onTimeDelivery != null && (
          <View style={snippetStyles.statItem}>
            <Text style={[snippetStyles.statValue, { color: '#2563EB' }]}>
              {profile.onTimeDelivery}%
            </Text>
            <Text style={[snippetStyles.statLabel, { color: colors.textMuted }]}>On-time</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const snippetStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatarWrap: { flexShrink: 0 },
  avatarImg: { width: 52, height: 52, borderRadius: 26 },
  avatarFallback: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { fontSize: 18, fontWeight: '800' },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '700' },
  headline: { fontSize: 12, lineHeight: 18 },
  location: { fontSize: 11 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingStars: { fontSize: 10 },
  ratingValue: { fontSize: 12, fontWeight: '700' },
  ratingCount: { fontSize: 11 },
  stats: { flexDirection: 'column', gap: 4, alignItems: 'flex-end', flexShrink: 0 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 13, fontWeight: '800' },
  statLabel: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const CompanyProposalDetailScreen: React.FC = () => {
  const route = useRoute<ScreenRouteProp>();
  const navigation = useNavigation<any>();
  const { theme } = useThemeStore();
  const { colors } = theme;

  const { proposalId, tenderId, role } = route.params;

  const { data: proposal, isLoading, refetch } = useProposalDetail(proposalId);
  const updateStatusMutation = useUpdateProposalStatus();
  const toggleShortlistMutation = useToggleShortlist();

  const [modalAction, setModalAction] = useState<ActionConfig | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'freelancer' | 'files' | 'history'>(
    'overview',
  );

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Proposal Detail' });
  }, [navigation]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleActionPress = (action: ActionConfig) => {
    if (action.requiresConfirm && !action.targetStatus.includes('interview')) {
      // Show native confirm for final irreversible actions, then open modal for notes
      Alert.alert(
        action.confirmTitle ?? 'Confirm action',
        action.confirmMessage ?? 'Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: action.isFinal && action.targetStatus === 'rejected' ? 'Reject' : 'Proceed',
            style: action.targetStatus === 'rejected' ? 'destructive' : 'default',
            onPress: () => setModalAction(action),
          },
        ],
      );
    } else {
      setModalAction(action);
    }
  };

  const handleModalConfirm = (data: UpdateProposalStatusData) => {
    updateStatusMutation.mutate(
      { proposalId, data },
      {
        onSuccess: () => {
          setModalAction(null);
          refetch();
        },
        onError: (err: Error) => {
          Alert.alert('Error', err.message ?? 'Could not update status. Please try again.');
        },
      },
    );
  };

  const handleShortlistToggle = () => {
    toggleShortlistMutation.mutate(proposalId, {
      onSuccess: () => refetch(),
      onError: () => Alert.alert('Error', 'Could not update shortlist.'),
    });
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert('Cannot open link', 'The URL could not be opened.'),
    );
  };

  // ── Loading / error ───────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <ProposalDetailSkeleton />
      </SafeAreaView>
    );
  }

  if (!proposal) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={{ fontSize: 40 }}>🔍</Text>
          <Text style={[styles.errorText, { color: colors.text }]}>Proposal not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backLink}>← Back to proposals</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Safe extraction
  const freelancer =
    typeof proposal.freelancer === 'object'
      ? (proposal.freelancer as ProposalUser)
      : null;
  const profile =
    typeof proposal.freelancerProfile === 'object'
      ? (proposal.freelancerProfile as ProposalFreelancerProfile)
      : null;
  const tender =
    typeof proposal.tender === 'object'
      ? (proposal.tender as ProposalTender)
      : null;

  const isAwarded = proposal.status === 'awarded';
  const isRejected = proposal.status === 'rejected';
  const isTerminal = isAwarded || isRejected || proposal.status === 'withdrawn';

  const availableActions = STATUS_ACTIONS[proposal.status] ?? [];

  const formatDate = (d?: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };
  const formatDateTime = (d?: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const TABS: { key: typeof activeTab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'freelancer', label: 'Freelancer' },
    { key: 'files', label: `Files (${proposal.attachments?.length ?? 0})` },
    { key: 'history', label: 'History' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Status update modal */}
      <StatusUpdateModal
        visible={!!modalAction}
        action={modalAction}
        onConfirm={handleModalConfirm}
        onClose={() => setModalAction(null)}
        isLoading={updateStatusMutation.isPending}
        colors={colors as any}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Hero card ────────────────────────────────────────────────── */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: colors.card,
              borderColor: isAwarded ? '#10B981' : colors.border,
            },
          ]}
        >
          {/* Accent strip */}
          <View
            style={[
              styles.accentStrip,
              {
                backgroundColor: isAwarded
                  ? '#10B981'
                  : isRejected
                  ? '#EF4444'
                  : '#F1BB03',
              },
            ]}
          />

          {/* Awarded banner */}
          {isAwarded && (
            <View style={styles.awardedBanner}>
              <Text style={styles.awardedText}>🏆 Contract Awarded</Text>
            </View>
          )}
          {proposal.isShortlisted && !isAwarded && (
            <View style={[styles.shortlistedBanner, { backgroundColor: 'rgba(241,187,3,0.08)' }]}>
              <Text style={[styles.shortlistedText, { color: '#D97706' }]}>⭐ Shortlisted</Text>
            </View>
          )}

          <View style={styles.heroBody}>
            {/* Freelancer info + status */}
            <View style={styles.heroTopRow}>
              {freelancer && (
                <View style={styles.freelancerPreview}>
                  {freelancer.avatar ? (
                    <Image
                      source={{ uri: freelancer.avatar }}
                      style={styles.heroAvatar}
                    />
                  ) : (
                    <View
                      style={[
                        styles.heroAvatarFallback,
                        { backgroundColor: 'rgba(241,187,3,0.15)' },
                      ]}
                    >
                      <Text style={[styles.heroAvatarInitials, { color: '#D97706' }]}>
                        {freelancer.name?.charAt(0).toUpperCase() ?? '?'}
                      </Text>
                    </View>
                  )}
                  <View style={styles.heroFreelancerInfo}>
                    <Text style={[styles.heroFreelancerName, { color: colors.text }]}>
                      {freelancer.name ?? 'Freelancer'}
                    </Text>
                    {profile?.headline ? (
                      <Text
                        style={[styles.heroFreelancerHeadline, { color: colors.textSecondary }]}
                        numberOfLines={1}
                      >
                        {profile.headline}
                      </Text>
                    ) : null}
                    {freelancer.location ? (
                      <Text style={[styles.heroLocation, { color: colors.textMuted }]}>
                        📍 {freelancer.location}
                      </Text>
                    ) : null}
                  </View>
                </View>
              )}
              <ProposalStatusBadge status={proposal.status} size="md" />
            </View>

            {/* Budget */}
            <ProposalBudgetDisplay proposal={proposal} layout="card" />

            {/* Meta */}
            <View style={styles.metaRow}>
              {proposal.submittedAt && (
                <Text style={[styles.metaItem, { color: colors.textMuted }]}>
                  📅 Submitted {formatDate(proposal.submittedAt)}
                </Text>
              )}
              {proposal.viewCount > 0 && (
                <Text style={[styles.metaItem, { color: colors.textMuted }]}>
                  👁 {proposal.viewCount} view{proposal.viewCount !== 1 ? 's' : ''}
                </Text>
              )}
            </View>

            {/* Interview scheduled */}
            {proposal.interviewDate && (
              <View
                style={[
                  styles.interviewBox,
                  { backgroundColor: 'rgba(139,92,246,0.08)', borderColor: 'rgba(139,92,246,0.3)' },
                ]}
              >
                <Text style={[styles.interviewTitle, { color: '#7C3AED' }]}>
                  📅 Interview: {formatDateTime(proposal.interviewDate)}
                </Text>
                {proposal.interviewNotes ? (
                  <Text style={[styles.interviewNotes, { color: '#7C3AED' }]}>
                    {proposal.interviewNotes}
                  </Text>
                ) : null}
              </View>
            )}

            {/* Awarded date */}
            {isAwarded && proposal.awardedAt && (
              <Text style={[styles.awardedDate, { color: '#059669' }]}>
                Awarded on {formatDate(proposal.awardedAt)}
              </Text>
            )}
          </View>
        </View>

        {/* ── Action row ─────────────────────────────────────────────────── */}
        <View style={styles.actionRow}>
          {/* Shortlist toggle */}
          <TouchableOpacity
            onPress={handleShortlistToggle}
            disabled={toggleShortlistMutation.isPending}
            style={[
              styles.shortlistBtn,
              {
                backgroundColor: proposal.isShortlisted
                  ? 'rgba(241,187,3,0.12)'
                  : colors.card,
                borderColor: proposal.isShortlisted ? '#F1BB03' : colors.border,
              },
            ]}
          >
            {toggleShortlistMutation.isPending ? (
              <ActivityIndicator size="small" color="#F1BB03" />
            ) : (
              <>
                <Text style={styles.shortlistIcon}>
                  {proposal.isShortlisted ? '⭐' : '☆'}
                </Text>
                <Text
                  style={[
                    styles.shortlistText,
                    { color: proposal.isShortlisted ? '#D97706' : colors.textSecondary },
                  ]}
                >
                  {proposal.isShortlisted ? 'Shortlisted' : 'Shortlist'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Status actions */}
          {availableActions.map((action) => (
            <TouchableOpacity
              key={action.targetStatus}
              onPress={() => handleActionPress(action)}
              disabled={updateStatusMutation.isPending}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: action.bg,
                  borderColor: 'transparent',
                  opacity: updateStatusMutation.isPending ? 0.6 : 1,
                },
              ]}
            >
              <Text style={[styles.actionBtnText, { color: action.color }]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Tab bar ────────────────────────────────────────────────────── */}
        <View
          style={[
            styles.tabBar,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {TABS.map(({ key, label }) => {
              const active = activeTab === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => setActiveTab(key)}
                  style={[
                    styles.tab,
                    active && { borderBottomColor: '#F1BB03', borderBottomWidth: 2 },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: active ? '#F1BB03' : colors.textMuted },
                      active && styles.tabTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Tab: Overview ──────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            {/* Cover letter */}
            <SectionCard title="Cover Letter" colors={colors as any}>
              <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
                {proposal.coverLetter}
              </Text>
            </SectionCard>

            {/* Work plan */}
            {proposal.proposalPlan ? (
              <SectionCard title="Work Plan" colors={colors as any}>
                <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
                  {proposal.proposalPlan}
                </Text>
              </SectionCard>
            ) : null}

            {/* Milestones */}
            {proposal.milestones && proposal.milestones.length > 0 && (
              <SectionCard
                title={`Payment Milestones (${proposal.milestones.length})`}
                colors={colors as any}
              >
                <ProposalMilestoneList
                  milestones={proposal.milestones}
                  currency={proposal.currency}
                  totalBid={proposal.proposedAmount}
                />
              </SectionCard>
            )}

            {/* Screening answers */}
            {proposal.screeningAnswers && proposal.screeningAnswers.length > 0 && (
              <SectionCard
                title={`Screening Answers (${proposal.screeningAnswers.length})`}
                colors={colors as any}
              >
                <ProposalScreeningAnswers answers={proposal.screeningAnswers} />
              </SectionCard>
            )}

            {/* Portfolio links */}
            {proposal.portfolioLinks && proposal.portfolioLinks.filter((l) => l).length > 0 && (
              <SectionCard
                title={`Portfolio Links (${proposal.portfolioLinks.filter((l) => l).length})`}
                colors={colors as any}
              >
                {proposal.portfolioLinks.filter((l) => l).map((link, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => handleOpenLink(link)}
                    style={[
                      styles.linkRow,
                      { backgroundColor: colors.surface ?? colors.background, borderColor: colors.border },
                    ]}
                  >
                    <Text style={styles.linkIcon}>🔗</Text>
                    <Text
                      style={[styles.linkText, { color: '#2563EB' }]}
                      numberOfLines={1}
                    >
                      {link}
                    </Text>
                    <Text style={[styles.linkArrow, { color: colors.textMuted }]}>↗</Text>
                  </TouchableOpacity>
                ))}
              </SectionCard>
            )}

            {/* Owner notes (already saved) */}
            {proposal.ownerNotes ? (
              <SectionCard title="Your Notes" colors={colors as any}>
                <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
                  {proposal.ownerNotes}
                </Text>
              </SectionCard>
            ) : null}
          </View>
        )}

        {/* ── Tab: Freelancer ────────────────────────────────────────────── */}
        {activeTab === 'freelancer' && freelancer && (
          <View style={styles.tabContent}>
            <SectionCard title="Freelancer Profile" colors={colors as any}>
              <FreelancerSnippet
                user={freelancer}
                profile={profile}
                colors={colors as any}
              />
            </SectionCard>

            {/* Skills */}
            {freelancer.skills && freelancer.skills.length > 0 && (
              <SectionCard title="Skills" colors={colors as any}>
                <View style={styles.chipGrid}>
                  {freelancer.skills.map((skill, i) => (
                    <View
                      key={i}
                      style={[
                        styles.chip,
                        { backgroundColor: colors.surface ?? colors.background, borderColor: colors.border },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: colors.textSecondary }]}>
                        {skill}
                      </Text>
                    </View>
                  ))}
                </View>
              </SectionCard>
            )}

            {/* Specializations */}
            {profile?.specialization && profile.specialization.length > 0 && (
              <SectionCard title="Specializations" colors={colors as any}>
                <View style={styles.chipGrid}>
                  {profile.specialization.map((spec, i) => (
                    <View
                      key={i}
                      style={[
                        styles.chip,
                        { backgroundColor: 'rgba(241,187,3,0.08)', borderColor: 'rgba(241,187,3,0.25)' },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: '#D97706' }]}>{spec}</Text>
                    </View>
                  ))}
                </View>
              </SectionCard>
            )}

            {/* Performance stats */}
            {profile && (profile.successRate != null || profile.onTimeDelivery != null || profile.responseRate != null) && (
              <SectionCard title="Performance" colors={colors as any}>
                <View style={styles.perfGrid}>
                  {profile.successRate != null && (
                    <View style={[styles.perfItem, { backgroundColor: 'rgba(16,185,129,0.08)', borderColor: '#10B981' }]}>
                      <Text style={[styles.perfValue, { color: '#059669' }]}>{profile.successRate}%</Text>
                      <Text style={[styles.perfLabel, { color: colors.textMuted }]}>Success Rate</Text>
                    </View>
                  )}
                  {profile.onTimeDelivery != null && (
                    <View style={[styles.perfItem, { backgroundColor: 'rgba(59,130,246,0.08)', borderColor: '#3B82F6' }]}>
                      <Text style={[styles.perfValue, { color: '#2563EB' }]}>{profile.onTimeDelivery}%</Text>
                      <Text style={[styles.perfLabel, { color: colors.textMuted }]}>On-time</Text>
                    </View>
                  )}
                  {profile.responseRate != null && (
                    <View style={[styles.perfItem, { backgroundColor: 'rgba(139,92,246,0.08)', borderColor: '#8B5CF6' }]}>
                      <Text style={[styles.perfValue, { color: '#7C3AED' }]}>{profile.responseRate}%</Text>
                      <Text style={[styles.perfLabel, { color: colors.textMuted }]}>Response</Text>
                    </View>
                  )}
                </View>
              </SectionCard>
            )}

            {/* Social links */}
            {profile?.socialLinks && Object.values(profile.socialLinks).some((v) => v) && (
              <SectionCard title="Portfolio & Links" colors={colors as any}>
                {Object.entries(profile.socialLinks)
                  .filter(([, url]) => url)
                  .map(([platform, url]) => (
                    <TouchableOpacity
                      key={platform}
                      onPress={() => handleOpenLink(url)}
                      style={[
                        styles.linkRow,
                        { backgroundColor: colors.surface ?? colors.background, borderColor: colors.border },
                      ]}
                    >
                      <Text style={styles.linkIcon}>🔗</Text>
                      <Text style={[styles.linkPlatform, { color: colors.textSecondary }]}>
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </Text>
                      <Text
                        style={[styles.linkText, { color: '#2563EB', flex: 1 }]}
                        numberOfLines={1}
                      >
                        {url}
                      </Text>
                      <Text style={[styles.linkArrow, { color: colors.textMuted }]}>↗</Text>
                    </TouchableOpacity>
                  ))}
              </SectionCard>
            )}
          </View>
        )}

        {/* ── Tab: Files ─────────────────────────────────────────────────── */}
        {activeTab === 'files' && (
          <View style={styles.tabContent}>
            {proposal.attachments && proposal.attachments.length > 0 ? (
              <SectionCard
                title={`Attachments (${proposal.attachments.length})`}
                colors={colors as any}
              >
                <ProposalAttachmentList
                  attachments={proposal.attachments}
                  canDelete={false}
                />
              </SectionCard>
            ) : (
              <View style={styles.emptyFiles}>
                <Text style={styles.emptyFilesIcon}>📂</Text>
                <Text style={[styles.emptyFilesText, { color: colors.textMuted }]}>
                  No attachments uploaded
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Tab: History ───────────────────────────────────────────────── */}
        {activeTab === 'history' && (
          <View style={styles.tabContent}>
            {proposal.auditLog && proposal.auditLog.length > 0 ? (
              <SectionCard title="Activity Log" colors={colors as any}>
                {[...proposal.auditLog].reverse().map((entry, i) => (
                  <View key={i} style={styles.auditRow}>
                    <View style={[styles.auditDot, { backgroundColor: '#F1BB03' }]} />
                    <View style={styles.auditContent}>
                      <Text style={[styles.auditAction, { color: colors.text }]}>
                        {String(entry.action ?? '').replace(/_/g, ' ')}
                      </Text>
                      {entry.performedAt && (
                        <Text style={[styles.auditDate, { color: colors.textMuted }]}>
                          {formatDateTime(entry.performedAt)}
                        </Text>
                      )}
                      {entry.note ? (
                        <Text style={[styles.auditNote, { color: colors.textMuted }]}>
                          "{entry.note}"
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </SectionCard>
            ) : (
              <View style={styles.emptyFiles}>
                <Text style={styles.emptyFilesIcon}>📋</Text>
                <Text style={[styles.emptyFilesText, { color: colors.textMuted }]}>
                  No activity recorded yet
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  errorContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  errorText: { fontSize: 17, fontWeight: '700' },
  backLink: { color: '#F1BB03', fontSize: 15, fontWeight: '600' },

  // Hero
  heroCard: { borderRadius: 18, borderWidth: 1.5, overflow: 'hidden' },
  accentStrip: { height: 4, width: '100%' },
  awardedBanner: { backgroundColor: '#10B981', paddingHorizontal: 16, paddingVertical: 6 },
  awardedText: { color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
  shortlistedBanner: { paddingHorizontal: 16, paddingVertical: 5 },
  shortlistedText: { fontSize: 11, fontWeight: '700' },
  heroBody: { padding: 16, gap: 12 },
  heroTopRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', gap: 10,
  },
  freelancerPreview: { flex: 1, flexDirection: 'row', gap: 10, alignItems: 'center' },
  heroAvatar: { width: 44, height: 44, borderRadius: 22, flexShrink: 0 },
  heroAvatarFallback: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  heroAvatarInitials: { fontSize: 16, fontWeight: '800' },
  heroFreelancerInfo: { flex: 1, gap: 1 },
  heroFreelancerName: { fontSize: 15, fontWeight: '700' },
  heroFreelancerHeadline: { fontSize: 12, lineHeight: 16 },
  heroLocation: { fontSize: 11 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metaItem: { fontSize: 12 },
  interviewBox: {
    borderWidth: 1, borderRadius: 12, padding: 12, gap: 4,
  },
  interviewTitle: { fontSize: 13, fontWeight: '700' },
  interviewNotes: { fontSize: 12, lineHeight: 18 },
  awardedDate: { fontSize: 12, fontWeight: '600' },

  // Actions
  actionRow: { gap: 8 },
  shortlistBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderWidth: 1.5, borderRadius: 14, paddingVertical: 11,
  },
  shortlistIcon: { fontSize: 16 },
  shortlistText: { fontSize: 14, fontWeight: '600' },
  actionBtn: {
    borderRadius: 14, paddingVertical: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  actionBtnText: { fontSize: 14, fontWeight: '700' },

  // Tabs
  tabBar: {
    borderRadius: 14, borderWidth: 1, overflow: 'hidden',
  },
  tab: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabText: { fontSize: 13, fontWeight: '500' },
  tabTextActive: { fontWeight: '700' },
  tabContent: { gap: 12 },

  // Content
  bodyText: { fontSize: 14, lineHeight: 22 },
  linkRow: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 10,
    borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 8,
  },
  linkIcon: { fontSize: 14 },
  linkPlatform: { fontSize: 12, fontWeight: '600', width: 70 },
  linkText: { fontSize: 12 },
  linkArrow: { fontSize: 14, flexShrink: 0 },

  // Freelancer tab
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 999, borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: '500' },
  perfGrid: { flexDirection: 'row', gap: 10 },
  perfItem: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    borderRadius: 12, borderWidth: 1, gap: 4,
  },
  perfValue: { fontSize: 18, fontWeight: '800' },
  perfLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },

  // History / audit
  auditRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  auditDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0 },
  auditContent: { flex: 1, gap: 2 },
  auditAction: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  auditDate: { fontSize: 11 },
  auditNote: { fontSize: 12, fontStyle: 'italic' },

  // Empty states
  emptyFiles: { paddingVertical: 40, alignItems: 'center', gap: 10 },
  emptyFilesIcon: { fontSize: 40 },
  emptyFilesText: { fontSize: 14 },

  bottomSpacer: { height: 24 },
});

export default CompanyProposalDetailScreen;