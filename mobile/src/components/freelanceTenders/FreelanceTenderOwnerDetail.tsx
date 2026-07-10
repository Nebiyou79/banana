// ─────────────────────────────────────────────────────────────────────────────
//  src/components/freelanceTenders/FreelanceTenderOwnerDetail.tsx
//  Company / Organization owner detail view — 4 tabs:
//    Overview & Actions · Details · Attachments · Proposals
// ─────────────────────────────────────────────────────────────────────────────

import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import {
  Alert,
  Animated,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import FreelanceTenderStatusBadge from './FreelanceTenderStatusBadge';
import FreelanceTenderDeadlineTimer from './FreelanceTenderDeadlineTimer';
import FreelanceTenderBudgetTag from './FreelanceTenderBudgetTag';
import FreelanceTenderSkillTags from './FreelanceTenderSkillTags';
import FreelanceTenderSkeleton from './FreelanceTenderSkeleton';
import {
  useFreelanceTender,
  usePublishFreelanceTender,
  useCloseFreelanceTender,
  useDeleteFreelanceTender,
  useFreelanceTenderApplications,
} from '../../hooks/useFreelanceTender';
import type { TenderAttachment, FreelanceTenderApplication } from '../../types/freelanceTender';

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview',    label: 'Overview',    icon: 'grid-outline'          },
  { id: 'details',     label: 'Details',     icon: 'document-text-outline' },
  { id: 'attachments', label: 'Files',       icon: 'attach-outline'        },
  { id: 'proposals',   label: 'Proposals',   icon: 'people-outline'        },
] as const;

type TabId = typeof TABS[number]['id'];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface FreelanceTenderOwnerDetailProps {
  tenderId:           string;
  role:               'company' | 'organization';
  onEdit:             (tenderId: string) => void;
  onViewProposals:    (tenderId: string) => void;
  onViewApplications: (tenderId: string) => void;
  onDeleted?:         () => void;
  onBack?:            () => void;
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────

const TabBar: React.FC<{
  active: TabId;
  onChange: (t: TabId) => void;
  attachmentCount: number;
  proposalCount: number;
}> = memo(({ active, onChange, attachmentCount, proposalCount }) => {
  const { colors } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[tabS.bar, { borderBottomColor: colors.border, backgroundColor: colors.bgCard }]}
      contentContainerStyle={tabS.content}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        const badge =
          tab.id === 'attachments' && attachmentCount > 0
            ? String(attachmentCount)
            : tab.id === 'proposals' && proposalCount > 0
            ? String(proposalCount)
            : null;
        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={[tabS.tab, isActive && [tabS.activeTab, { borderBottomColor: colors.primary }]]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Ionicons
              name={tab.icon as any}
              size={16}
              color={isActive ? colors.primary : colors.textMuted}
            />
            <Text style={[tabS.label, { color: isActive ? colors.primary : colors.textMuted }]}>
              {tab.label}
            </Text>
            {badge && (
              <View style={[tabS.badge, { backgroundColor: isActive ? colors.primary : colors.textMuted }]}>
                <Text style={tabS.badgeText}>{badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
});

// ─── Section Card ─────────────────────────────────────────────────────────────

const SectionCard: React.FC<{
  icon: string;
  title: string;
  iconColor?: string;
  children: React.ReactNode;
}> = memo(({ icon, title, iconColor, children }) => {
  const { colors, type, radius } = useTheme();
  return (
    <View style={[secS.card, { backgroundColor: colors.bgCard, borderColor: colors.border, borderRadius: radius.lg }]}>
      <View style={[secS.head, { borderBottomColor: withAlpha(colors.border, 0.5) }]}>
        <Ionicons name={icon as any} size={15} color={iconColor ?? colors.primary} />
        <Text style={[type.bodySm, { color: colors.text, fontWeight: '700', marginLeft: 8 }]}>{title}</Text>
      </View>
      <View style={secS.body}>{children}</View>
    </View>
  );
});

// ─── Info Row ─────────────────────────────────────────────────────────────────

const InfoRow: React.FC<{ label: string; value: string; icon?: string }> = memo(
  ({ label, value, icon }) => {
    const { colors, type } = useTheme();
    return (
      <View style={[infoS.row, { borderBottomColor: withAlpha(colors.border, 0.5) }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {icon && <Ionicons name={icon as any} size={12} color={colors.textMuted} style={{ marginRight: 5 }} />}
          <Text style={[type.caption, { color: colors.textMuted }]}>{label}</Text>
        </View>
        <Text style={[type.caption, { color: colors.text, fontWeight: '600', flex: 1, textAlign: 'right' }]}>{value}</Text>
      </View>
    );
  },
);

// ─── Stat Pill ────────────────────────────────────────────────────────────────

const StatPill: React.FC<{ icon: string; value: string | number; label: string; color: string }> = memo(
  ({ icon, value, label, color }) => {
    const { colors, type, radius } = useTheme();
    return (
      <View style={[statS.pill, { backgroundColor: withAlpha(color, 0.09), borderColor: withAlpha(color, 0.20), borderRadius: radius.lg }]}>
        <Ionicons name={icon as any} size={18} color={color} />
        <Text style={[type.h3, { color, fontWeight: '800', marginTop: 6 }]}>{value}</Text>
        <Text style={[type.caption, { color: colors.textMuted, marginTop: 2, textAlign: 'center' }]}>{label}</Text>
      </View>
    );
  },
);

// ─── Application Row ──────────────────────────────────────────────────────────

const statusColor = (status: string, colors: any) =>
  status === 'accepted'  || status === 'awarded'      ? colors.success
  : status === 'rejected'                             ? colors.danger
  : status === 'shortlisted'                          ? colors.primary
  : status === 'under_review' || status === 'interview_scheduled' ? colors.warning
  : colors.info;

const ApplicationRow: React.FC<{
  app: FreelanceTenderApplication;
  onPress: () => void;
}> = memo(({ app, onPress }) => {
  const { colors, type, radius } = useTheme();
  const sColor = statusColor(app.status, colors);
  const applicant = (app as any).applicant;
  const name = applicant?.name ?? applicant?.firstName ?? 'Applicant';

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: withAlpha(colors.primary, 0.08) }}
      style={[appS.row, { backgroundColor: colors.bgCard, borderColor: colors.border, borderRadius: radius.md }]}
    >
      <View style={[appS.avatar, { backgroundColor: withAlpha(colors.primary, 0.14), borderRadius: 10 }]}>
        <Text style={[type.bodySm, { color: colors.primary, fontWeight: '800' }]}>
          {name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[type.bodySm, { color: colors.text, fontWeight: '700' }]} numberOfLines={1}>{name}</Text>
        {(app as any).proposedRate != null && (
          <Text style={[type.caption, { color: colors.textMuted }]}>
            Rate: {(app as any).proposedRateCurrency ?? ''} {(app as any).proposedRate}
          </Text>
        )}
      </View>
      <View style={[appS.chip, { backgroundColor: withAlpha(sColor, 0.12), borderRadius: radius.full }]}>
        <Text style={[type.caption, { color: sColor, fontWeight: '700' }]}>
          {app.status?.replace(/_/g, ' ')}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color={colors.textMuted} style={{ marginLeft: 4 }} />
    </Pressable>
  );
});

// ─── Attachment Row ───────────────────────────────────────────────────────────

const AttachmentRow: React.FC<{
  attachment: TenderAttachment;
  onDownload?: () => void;
  onDelete?: () => void;
  isOwner?: boolean;
}> = memo(({ attachment, onDownload, onDelete, isOwner }) => {
  const { colors, type, radius } = useTheme();
  const ext = attachment.fileName?.split('.').pop()?.toUpperCase() ?? 'FILE';
  return (
    <View style={[attS.row, { backgroundColor: withAlpha(colors.primary, 0.05), borderColor: withAlpha(colors.primary, 0.15), borderRadius: radius.md }]}>
      <View style={[attS.badge, { backgroundColor: withAlpha(colors.primary, 0.14), borderRadius: 6 }]}>
        <Text style={[type.caption, { color: colors.primary, fontWeight: '800', fontSize: 9 }]}>{ext}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[type.caption, { color: colors.text, fontWeight: '600' }]} numberOfLines={1}>
          {attachment.fileName ?? 'Attachment'}
        </Text>
        {attachment.documentType && (
          <Text style={[type.caption, { color: colors.textMuted, fontSize: 10 }]}>{attachment.documentType}</Text>
        )}
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {onDownload && (
          <TouchableOpacity onPress={onDownload} hitSlop={8}>
            <Ionicons name="download-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
        {isOwner && onDelete && (
          <TouchableOpacity onPress={onDelete} hitSlop={8}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

const ConfirmDialog: React.FC<{
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = memo(({ visible, title, message, confirmLabel, confirmColor, onConfirm, onCancel }) => {
  const { colors, type, radius } = useTheme();
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <Pressable style={dlgS.overlay} onPress={onCancel} />
      <View style={dlgS.centerer}>
        <View style={[dlgS.box, { backgroundColor: colors.bgCard, borderColor: colors.border, borderRadius: radius.xl }]}>
          <Text style={[type.h3, { color: colors.text, fontWeight: '800', marginBottom: 8 }]}>{title}</Text>
          <Text style={[type.body, { color: colors.textSecondary, lineHeight: 22, marginBottom: 20 }]}>{message}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              onPress={onCancel}
              style={[dlgS.btn, { flex: 1, borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <Text style={[type.bodySm, { color: colors.textMuted, fontWeight: '700' }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              style={[dlgS.btn, { flex: 1, backgroundColor: confirmColor }]}
            >
              <Text style={[type.bodySm, { color: '#fff', fontWeight: '800' }]}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

// ─── OVERVIEW & ACTIONS TAB ───────────────────────────────────────────────────

const OverviewActionsTab: React.FC<{
  tender: any;
  role: 'company' | 'organization';
  onEdit: () => void;
  onPublish: () => void;
  onClose: () => void;
  onDelete: () => void;
  onViewApplications: () => void;
  onViewProposals: () => void;
  isPublishing: boolean;
  isClosing: boolean;
  isDeleting: boolean;
}> = memo(({
  tender, role, onEdit, onPublish, onClose, onDelete,
  onViewApplications, onViewProposals,
  isPublishing, isClosing, isDeleting,
}) => {
  const { colors, type, radius, spacing } = useTheme();
  const appCount = tender.metadata?.totalApplications ?? (tender as any).applicationCount ?? 0;
  const saveCount = tender.metadata?.totalSaves ?? 0;
  const viewCount = tender.metadata?.totalViews ?? 0;

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Title + status */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={[type.h3, { color: colors.text, fontWeight: '800', lineHeight: 26 }]}>
            {tender.title}
          </Text>
          <Text style={[type.caption, { color: colors.textMuted, marginTop: 3 }]}>
            {tender.procurementCategory}
          </Text>
        </View>
        <FreelanceTenderStatusBadge status={tender.status} />
      </View>

      {/* Budget + deadline row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <FreelanceTenderBudgetTag details={tender.details} />
        <View style={{ flex: 1 }} />
        <FreelanceTenderDeadlineTimer deadline={tender.deadline} compact />
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        <StatPill icon="people-outline"   value={appCount}  label="Applications" color={colors.primary}   />
        <StatPill icon="bookmark-outline" value={saveCount} label="Saves"        color={colors.warning}   />
        <StatPill icon="eye-outline"      value={viewCount} label="Views"        color={colors.textMuted} />
      </View>

      {/* Skills */}
      {tender.skillsRequired?.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <FreelanceTenderSkillTags skills={tender.skillsRequired} variant="wrap" maxVisible={6} />
        </View>
      )}

      {/* ── ACTION BUTTONS ── */}

      {/* View Applications */}
      <SectionCard icon="people-outline" title="Applications & Proposals" iconColor={colors.primary}>
        <View style={{ gap: 10 }}>
          <TouchableOpacity
            onPress={onViewApplications}
            style={[actS.btn, { backgroundColor: withAlpha(colors.primary, 0.10), borderColor: withAlpha(colors.primary, 0.25), borderRadius: radius.md }]}
          >
            <Ionicons name="people" size={16} color={colors.primary} />
            <Text style={[type.bodySm, { color: colors.primary, fontWeight: '700', flex: 1, marginLeft: 10 }]}>
              View Applications
            </Text>
            <View style={[actS.countBadge, { backgroundColor: colors.primary }]}>
              <Text style={actS.countText}>{appCount}</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} style={{ marginLeft: 4 }} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onViewProposals}
            style={[actS.btn, { backgroundColor: withAlpha(colors.info, 0.10), borderColor: withAlpha(colors.info, 0.25), borderRadius: radius.md }]}
          >
            <Ionicons name="document-text" size={16} color={colors.info} />
            <Text style={[type.bodySm, { color: colors.info, fontWeight: '700', flex: 1, marginLeft: 10 }]}>
              View Proposals
            </Text>
            <Ionicons name="chevron-forward" size={14} color={colors.info} />
          </TouchableOpacity>
        </View>
      </SectionCard>

      {/* Manage tender */}
      <View style={{ marginTop: 12 }}>
        <SectionCard icon="settings-outline" title="Manage Tender" iconColor={colors.textMuted}>
          <View style={{ gap: 10 }}>
            {/* Edit */}
            <TouchableOpacity
              onPress={onEdit}
              style={[actS.btn, { backgroundColor: withAlpha(colors.text, 0.05), borderColor: withAlpha(colors.border, 0.8), borderRadius: radius.md }]}
            >
              <Ionicons name="create-outline" size={16} color={colors.text} />
              <Text style={[type.bodySm, { color: colors.text, fontWeight: '700', flex: 1, marginLeft: 10 }]}>
                Edit Tender
              </Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Publish (only draft) */}
            {tender.status === 'draft' && (
              <TouchableOpacity
                onPress={onPublish}
                disabled={isPublishing}
                style={[actS.btn, { backgroundColor: withAlpha(colors.success, 0.10), borderColor: withAlpha(colors.success, 0.25), borderRadius: radius.md }]}
              >
                {isPublishing
                  ? <ActivityIndicator size="small" color={colors.success} />
                  : <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
                }
                <Text style={[type.bodySm, { color: colors.success, fontWeight: '700', flex: 1, marginLeft: 10 }]}>
                  {isPublishing ? 'Publishing…' : 'Publish Tender'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Close (only published) */}
            {tender.status === 'published' && (
              <TouchableOpacity
                onPress={onClose}
                disabled={isClosing}
                style={[actS.btn, { backgroundColor: withAlpha(colors.warning, 0.10), borderColor: withAlpha(colors.warning, 0.25), borderRadius: radius.md }]}
              >
                {isClosing
                  ? <ActivityIndicator size="small" color={colors.warning} />
                  : <Ionicons name="lock-closed-outline" size={16} color={colors.warning} />
                }
                <Text style={[type.bodySm, { color: colors.warning, fontWeight: '700', flex: 1, marginLeft: 10 }]}>
                  {isClosing ? 'Closing…' : 'Close Tender'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Delete */}
            <TouchableOpacity
              onPress={onDelete}
              disabled={isDeleting}
              style={[actS.btn, { backgroundColor: withAlpha(colors.danger, 0.08), borderColor: withAlpha(colors.danger, 0.22), borderRadius: radius.md }]}
            >
              {isDeleting
                ? <ActivityIndicator size="small" color={colors.danger} />
                : <Ionicons name="trash-outline" size={16} color={colors.danger} />
              }
              <Text style={[type.bodySm, { color: colors.danger, fontWeight: '700', flex: 1, marginLeft: 10 }]}>
                {isDeleting ? 'Deleting…' : 'Delete Tender'}
              </Text>
            </TouchableOpacity>
          </View>
        </SectionCard>
      </View>
    </ScrollView>
  );
});

// ─── DETAILS TAB ──────────────────────────────────────────────────────────────

const DetailsTab: React.FC<{ tender: any }> = memo(({ tender }) => {
  const { colors, type } = useTheme();
  const fmt = (d?: string | Date) =>
    d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {tender.description && (
        <SectionCard icon="document-text-outline" title="Project Description" iconColor={colors.textMuted}>
          <Text style={[type.body, { color: colors.textSecondary, lineHeight: 23 }]}>
            {typeof tender.description === 'string' && tender.description.startsWith('<')
              ? tender.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
              : tender.description}
          </Text>
        </SectionCard>
      )}

      <View style={{ marginTop: 12 }}>
        <SectionCard icon="briefcase-outline" title="Project Scope">
          {tender.engagementType && (
            <InfoRow label="Engagement" value={
              tender.engagementType === 'fixed_price' ? 'Fixed Price'
              : tender.engagementType === 'hourly' ? 'Hourly'
              : tender.engagementType === 'fixed_salary' ? 'Fixed Salary'
              : 'Negotiable'
            } icon="repeat-outline" />
          )}
          {tender.projectType && <InfoRow label="Project Type" value={tender.projectType} icon="layers-outline" />}
          {tender.experienceLevel && <InfoRow label="Experience Level" value={tender.experienceLevel} icon="star-outline" />}
          {tender.urgency && <InfoRow label="Urgency" value={tender.urgency} icon="flash-outline" />}
          {tender.locationType && <InfoRow label="Location Type" value={tender.locationType} icon="location-outline" />}
          {tender.language && <InfoRow label="Language" value={tender.language} icon="globe-outline" />}
          {tender.estimatedTimeline && <InfoRow label="Est. Timeline" value={String(tender.estimatedTimeline)} icon="time-outline" />}
          {(tender.positions ?? tender.positionsAvailable) != null && (
            <InfoRow label="Positions" value={String(tender.positions ?? tender.positionsAvailable)} icon="people-outline" />
          )}
          {tender.maxApplications && <InfoRow label="Max Applications" value={String(tender.maxApplications)} icon="person-add-outline" />}
        </SectionCard>
      </View>

      <View style={{ marginTop: 12 }}>
        <SectionCard icon="calendar-outline" title="Timeline" iconColor={colors.warning}>
          {tender.estimatedTimeline && <InfoRow label="Duration" value={String(tender.estimatedTimeline)} />}
          <InfoRow label="Deadline" value={fmt(tender.deadline)} />
          {tender.createdAt && <InfoRow label="Posted" value={fmt(tender.createdAt)} />}
          {tender.updatedAt && <InfoRow label="Updated" value={fmt(tender.updatedAt)} />}
        </SectionCard>
      </View>

      {tender.skillsRequired?.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <SectionCard icon="code-slash-outline" title="Required Skills" iconColor={colors.success}>
            <FreelanceTenderSkillTags skills={tender.skillsRequired} variant="wrap" />
          </SectionCard>
        </View>
      )}

      {(tender.requiresNDA || tender.requiresPortfolio || tender.screeningQuestions?.length > 0) && (
        <View style={{ marginTop: 12 }}>
          <SectionCard icon="shield-checkmark-outline" title="Requirements" iconColor={colors.warning}>
            {tender.requiresNDA && (
              <Text style={[type.caption, { color: colors.warning, fontWeight: '700', marginBottom: 6 }]}>🔏 NDA Required</Text>
            )}
            {tender.requiresPortfolio && (
              <Text style={[type.caption, { color: colors.candidate, fontWeight: '700', marginBottom: 6 }]}>🖼 Portfolio Required</Text>
            )}
            {tender.screeningQuestions?.length > 0 && (
              <>
                <Text style={[type.caption, { color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase', marginTop: 8, marginBottom: 8 }]}>
                  Screening Questions ({tender.screeningQuestions.length})
                </Text>
                {tender.screeningQuestions.map((q: any, i: number) => (
                  <View key={i} style={[{ flexDirection: 'row', alignItems: 'flex-start', padding: 10, backgroundColor: withAlpha(colors.text, 0.04), borderRadius: 8, marginBottom: 6 }]}>
                    <Text style={[type.caption, { color: colors.primary, fontWeight: '800', marginRight: 6 }]}>{i + 1}.</Text>
                    <Text style={[type.caption, { color: colors.text, flex: 1 }]}>
                      {typeof q === 'string' ? q : q?.question ?? String(q)}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </SectionCard>
        </View>
      )}
    </ScrollView>
  );
});

// ─── ATTACHMENTS TAB ──────────────────────────────────────────────────────────

const AttachmentsTab: React.FC<{
  attachments: TenderAttachment[];
  tenderId: string;
  onDeleteAttachment: (attachmentId: string) => void;
}> = memo(({ attachments, tenderId, onDeleteAttachment }) => {
  const { colors, type } = useTheme();

  if (!attachments?.length) {
    return (
      <View style={emptyS.wrap}>
        <Ionicons name="attach-outline" size={40} color={colors.textMuted} />
        <Text style={[type.bodySm, { color: colors.textMuted, marginTop: 12, textAlign: 'center' }]}>
          No attachments on this tender
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[type.caption, { color: colors.textMuted, marginBottom: 12, fontWeight: '700', textTransform: 'uppercase' }]}>
        {attachments.length} File{attachments.length !== 1 ? 's' : ''}
      </Text>
      {attachments.map((att, i) => (
        <View key={att._id ?? i} style={{ marginBottom: 8 }}>
          <AttachmentRow
            attachment={att}
            onDownload={async () => att.fileUrl && Linking.openURL(await att.fileUrl)}
            onDelete={() => onDeleteAttachment(att._id ?? '')}
            isOwner
          />
        </View>
      ))}
    </ScrollView>
  );
});

// ─── PROPOSALS TAB ────────────────────────────────────────────────────────────

const ProposalsTab: React.FC<{
  tenderId: string;
  onViewAll: () => void;
}> = memo(({ tenderId, onViewAll }) => {
  const { colors, type, radius } = useTheme();
  const { data, isLoading } = useFreelanceTenderApplications(tenderId, { limit: 10 });
  const applications: FreelanceTenderApplication[] = (data as any)?.applications ?? [];
  const total = (data as any)?.pagination?.total ?? applications.length;

  if (isLoading) {
    return (
      <View style={emptyS.wrap}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!applications.length) {
    return (
      <View style={emptyS.wrap}>
        <Ionicons name="people-outline" size={40} color={colors.textMuted} />
        <Text style={[type.bodySm, { color: colors.textMuted, marginTop: 12, textAlign: 'center' }]}>
          No applications yet
        </Text>
        <Text style={[type.caption, { color: colors.textMuted, marginTop: 6, textAlign: 'center' }]}>
          Applications will appear here once freelancers apply.
        </Text>
      </View>
    );
  }

  // Quick status counts
  const counts = applications.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Summary chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {Object.entries(counts).map(([status, count]) => {
            const c = statusColor(status, colors);
            return (
              <View key={status} style={[{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full, backgroundColor: withAlpha(c, 0.1), borderWidth: 1, borderColor: withAlpha(c, 0.2) }]}>
                <Text style={[type.caption, { color: c, fontWeight: '700' }]}>{count}</Text>
                <Text style={[type.caption, { color: c }]}>{status.replace(/_/g, ' ')}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Application list preview */}
      {applications.slice(0, 5).map((app, i) => (
        <View key={app._id ?? i} style={{ marginBottom: 8 }}>
          <ApplicationRow app={app} onPress={onViewAll} />
        </View>
      ))}

      {/* View all */}
      <TouchableOpacity
        onPress={onViewAll}
        style={[
          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: withAlpha(colors.primary, 0.3), backgroundColor: withAlpha(colors.primary, 0.07), marginTop: 4 },
        ]}
        accessibilityRole="button"
      >
        <Ionicons name="people" size={16} color={colors.primary} />
        <Text style={[type.bodySm, { color: colors.primary, fontWeight: '700', marginLeft: 8 }]}>
          View All {total} Applications
        </Text>
        <Ionicons name="chevron-forward" size={14} color={colors.primary} style={{ marginLeft: 4 }} />
      </TouchableOpacity>
    </ScrollView>
  );
});

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const FreelanceTenderOwnerDetail: React.FC<FreelanceTenderOwnerDetailProps> = ({
  tenderId, role, onEdit, onViewProposals, onViewApplications, onDeleted, onBack,
}) => {
  const { colors, type } = useTheme();
  const [activeTab, setActiveTab]       = useState<TabId>('overview');
  const [showDeleteDlg, setShowDeleteDlg] = useState(false);
  const [showCloseDlg, setShowCloseDlg]  = useState(false);

  const { data: tender, isLoading, error, refetch } = useFreelanceTender(tenderId);
  const publishMut = usePublishFreelanceTender();
  const closeMut   = useCloseFreelanceTender();
  const deleteMut  = useDeleteFreelanceTender();

  const handlePublish = useCallback(() => {
    publishMut.mutate(tenderId);
  }, [tenderId, publishMut]);

  const handleCloseConfirm = useCallback(() => {
    setShowCloseDlg(false);
    closeMut.mutate(tenderId);
  }, [tenderId, closeMut]);

  const handleDeleteConfirm = useCallback(() => {
    setShowDeleteDlg(false);
    deleteMut.mutate(tenderId, { onSuccess: () => onDeleted?.() });
  }, [tenderId, deleteMut, onDeleted]);

  const handleDeleteAttachment = useCallback((attachmentId: string) => {
    Alert.alert('Delete Attachment', 'Remove this file from the tender?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {} },
    ]);
  }, []);

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }}><FreelanceTenderSkeleton count={3} /></View>;
  }

  if (error || !tender) {
    return (
      <View style={[emptyS.wrap, { backgroundColor: colors.bg }]}>
        <Ionicons name="alert-circle-outline" size={44} color={colors.danger} />
        <Text style={[type.bodySm, { color: colors.textMuted, marginTop: 12, textAlign: 'center' }]}>
          Could not load tender
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
          style={{ marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: 10 }}
        >
          <Text style={[type.bodySm, { color: '#fff', fontWeight: '700' }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const t           = tender as any;
  const attachments = t.attachments ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      {onBack && (
        <View style={[hdrS.bar, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onBack} style={hdrS.back} accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[type.bodySm, { color: colors.text, fontWeight: '700', flex: 1 }]} numberOfLines={1}>
            {t.title}
          </Text>
          <TouchableOpacity onPress={() => onEdit(tenderId)} style={hdrS.back} accessibilityLabel="Edit tender">
            <Ionicons name="create-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Tab bar */}
      <TabBar
        active={activeTab}
        onChange={setActiveTab}
        attachmentCount={attachments.length}
        proposalCount={t.metadata?.totalApplications ?? 0}
      />

      {/* Tab content */}
      {activeTab === 'overview' && (
        <OverviewActionsTab
          tender={t}
          role={role}
          onEdit={() => onEdit(tenderId)}
          onPublish={handlePublish}
          onClose={() => setShowCloseDlg(true)}
          onDelete={() => setShowDeleteDlg(true)}
          onViewApplications={() => onViewApplications(tenderId)}
          onViewProposals={() => onViewProposals(tenderId)}
          isPublishing={publishMut.isPending}
          isClosing={closeMut.isPending}
          isDeleting={deleteMut.isPending}
        />
      )}
      {activeTab === 'details'     && <DetailsTab tender={t} />}
      {activeTab === 'attachments' && (
        <AttachmentsTab
          attachments={attachments}
          tenderId={tenderId}
          onDeleteAttachment={handleDeleteAttachment}
        />
      )}
      {activeTab === 'proposals' && (
        <ProposalsTab
          tenderId={tenderId}
          onViewAll={() => onViewProposals(tenderId)}
        />
      )}

      {/* Close confirmation */}
      <ConfirmDialog
        visible={showCloseDlg}
        title="Close Tender?"
        message="This will stop accepting new applications. Existing applications will not be affected."
        confirmLabel="Close Tender"
        confirmColor={colors.warning}
        onConfirm={handleCloseConfirm}
        onCancel={() => setShowCloseDlg(false)}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        visible={showDeleteDlg}
        title="Delete Tender?"
        message="This action cannot be undone. The tender and all applications will be permanently removed."
        confirmLabel="Delete"
        confirmColor={colors.danger}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteDlg(false)}
      />
    </View>
  );
};

export default FreelanceTenderOwnerDetail;

// ─── Styles ───────────────────────────────────────────────────────────────────

const tabS = StyleSheet.create({
  bar:       { borderBottomWidth: StyleSheet.hairlineWidth },
  content:   { paddingHorizontal: 12, height: 48 },
  tab:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomWidth: 2 },
  label:     { fontSize: 13, fontWeight: '600' },
  badge:     { minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
});

const secS = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  head: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth },
  body: { padding: 14 },
});

const infoS = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
});

const statS = StyleSheet.create({
  pill: { flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8, borderWidth: StyleSheet.hairlineWidth },
});

const actS = StyleSheet.create({
  btn:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1, minHeight: 48 },
  countBadge: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  countText:  { color: '#fff', fontSize: 11, fontWeight: '800' },
});

const appS = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderWidth: StyleSheet.hairlineWidth },
  avatar: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  chip:   { paddingHorizontal: 8, paddingVertical: 3 },
});

const attS = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, gap: 10 },
  badge: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
});

const dlgS = StyleSheet.create({
  overlay:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  centerer: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: 24 },
  box:      { width: '100%', maxWidth: 380, padding: 24, borderWidth: StyleSheet.hairlineWidth },
  btn:      { height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1 },
});

const hdrS = StyleSheet.create({
  bar:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 52, borderBottomWidth: StyleSheet.hairlineWidth, gap: 8 },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});

const emptyS = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
});
