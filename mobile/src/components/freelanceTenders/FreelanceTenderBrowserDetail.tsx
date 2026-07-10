// ─────────────────────────────────────────────────────────────────────────────
//  src/components/freelanceTenders/FreelanceTenderBrowserDetail.tsx
//  Freelancer (browser) detail view — 4 tabs:
//    Overview · Details · Attachments · Apply
// ─────────────────────────────────────────────────────────────────────────────

import React, { memo, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Animated, Pressable, ScrollView, StyleSheet, Text, View,
  TouchableOpacity, ActivityIndicator, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import CompanyAvatar from '../shared/CompanyAvatar';
import FreelanceTenderStatusBadge from './FreelanceTenderStatusBadge';
import FreelanceTenderDeadlineTimer from './FreelanceTenderDeadlineTimer';
import FreelanceTenderBudgetTag from './FreelanceTenderBudgetTag';
import FreelanceTenderSkillTags from './FreelanceTenderSkillTags';
import FreelanceTenderSkeleton from './FreelanceTenderSkeleton';
import {
  useFreelanceTender,
  useSaveUnsaveTender,
} from '../../hooks/useFreelanceTender';
import type { TenderAttachment } from '../../types/freelanceTender';

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview',     label: 'Overview',     icon: 'grid-outline'          },
  { id: 'details',      label: 'Details',      icon: 'document-text-outline' },
  { id: 'attachments',  label: 'Files',        icon: 'attach-outline'        },
  { id: 'apply',        label: 'Apply',        icon: 'flash-outline'         },
] as const;

type TabId = typeof TABS[number]['id'];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface FreelanceTenderBrowserDetailProps {
  tenderId:     string;
  onApplyPress: (tenderId: string) => void;
  onBack?:      () => void;
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────

const TabBar: React.FC<{
  active: TabId;
  onChange: (t: TabId) => void;
  attachmentCount: number;
  hasApplied: boolean;
}> = memo(({ active, onChange, attachmentCount, hasApplied }) => {
  const { colors, radius } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[tabStyles.bar, { borderBottomColor: colors.border, backgroundColor: colors.bgCard }]}
      contentContainerStyle={tabStyles.barContent}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        const badge =
          tab.id === 'attachments' && attachmentCount > 0
            ? String(attachmentCount)
            : tab.id === 'apply' && hasApplied
            ? '✓'
            : null;

        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={[
              tabStyles.tab,
              isActive && [
                tabStyles.tabActive,
                { borderBottomColor: colors.primary },
              ],
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Ionicons
              name={tab.icon as any}
              size={16}
              color={isActive ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                tabStyles.tabLabel,
                { color: isActive ? colors.primary : colors.textMuted },
              ]}
            >
              {tab.label}
            </Text>
            {badge && (
              <View
                style={[
                  tabStyles.badge,
                  { backgroundColor: isActive ? colors.primary : colors.textMuted },
                ]}
              >
                <Text style={tabStyles.badgeText}>{badge}</Text>
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
  children: React.ReactNode;
  iconColor?: string;
}> = memo(({ icon, title, children, iconColor }) => {
  const { colors, type, radius, spacing } = useTheme();
  return (
    <View
      style={[
        sectionStyles.card,
        {
          backgroundColor: colors.bgCard,
          borderColor:     colors.border,
          borderRadius:    radius.lg,
        },
      ]}
    >
      <View style={sectionStyles.header}>
        <Ionicons name={icon as any} size={16} color={iconColor ?? colors.primary} />
        <Text style={[type.bodySm, { color: colors.text, fontWeight: '700', marginLeft: 8 }]}>
          {title}
        </Text>
      </View>
      <View style={sectionStyles.body}>{children}</View>
    </View>
  );
});

// ─── Info Row ─────────────────────────────────────────────────────────────────

const InfoRow: React.FC<{ label: string; value: string; icon?: string }> = memo(
  ({ label, value, icon }) => {
    const { colors, type, radius } = useTheme();
    return (
      <View style={[infoStyles.row, { borderBottomColor: withAlpha(colors.border, 0.6) }]}>
        <View style={infoStyles.labelRow}>
          {icon && (
            <Ionicons name={icon as any} size={13} color={colors.textMuted} style={{ marginRight: 5 }} />
          )}
          <Text style={[type.caption, { color: colors.textMuted }]}>{label}</Text>
        </View>
        <Text style={[type.caption, { color: colors.text, fontWeight: '600', flex: 1, textAlign: 'right' }]}>
          {value}
        </Text>
      </View>
    );
  },
);

// ─── Attachment Row ───────────────────────────────────────────────────────────

const AttachmentRow: React.FC<{
  attachment: TenderAttachment;
  onDownload?: () => void;
}> = memo(({ attachment, onDownload }) => {
  const { colors, type, radius } = useTheme();
  const ext = attachment.fileName?.split('.').pop()?.toUpperCase() ?? 'FILE';

  return (
    <View
      style={[
        attStyles.row,
        {
          backgroundColor: withAlpha(colors.primary, 0.05),
          borderColor:     withAlpha(colors.primary, 0.15),
          borderRadius:    radius.md,
        },
      ]}
    >
      <View style={[attStyles.extBadge, { backgroundColor: withAlpha(colors.primary, 0.14), borderRadius: 6 }]}>
        <Text style={[type.caption, { color: colors.primary, fontWeight: '800', fontSize: 9 }]}>
          {ext}
        </Text>
      </View>
      <View style={attStyles.info}>
        <Text style={[type.caption, { color: colors.text, fontWeight: '600' }]} numberOfLines={1}>
          {attachment.fileName ?? 'Attachment'}
        </Text>
        {attachment.documentType && (
          <Text style={[type.caption, { color: colors.textMuted, fontSize: 10 }]}>
            {attachment.documentType}
          </Text>
        )}
      </View>
      {onDownload && (
        <TouchableOpacity onPress={onDownload} hitSlop={8} accessibilityLabel="Download file">
          <Ionicons name="download-outline" size={18} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
});

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────

const OverviewTab: React.FC<{
  tender: any;
  onSaveToggle: () => void;
  onApplyPress: () => void;
}> = memo(({ tender, onSaveToggle, onApplyPress }) => {
  const { colors, type, radius, spacing } = useTheme();
  const ownerEntity = tender.ownerEntity as any;
  const owner       = tender.owner as any;
  const deadlinePassed = tender.deadline ? new Date(tender.deadline) < new Date() : false;

  const ownerName   = ownerEntity?.name ?? owner?.name ?? '';
  const ownerLogo   = ownerEntity?.avatarUrl ?? ownerEntity?.logo ?? owner?.avatar?.secure_url ?? null;
  const ownerType   = ownerEntity?.type === 'organization' ? 'organization' : 'company';
  const ownerVerify = ownerEntity?.verified ?? false;

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Title + save */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
        <Text style={[type.h3, { color: colors.text, fontWeight: '800', flex: 1, lineHeight: 26 }]}>
          {tender.title}
        </Text>
        <TouchableOpacity onPress={onSaveToggle} hitSlop={10} accessibilityLabel="Toggle save">
          <Ionicons
            name={tender.isSaved ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={tender.isSaved ? colors.primary : colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* Badges row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <FreelanceTenderStatusBadge status={tender.status} />
          {tender.procurementCategory && (
            <View style={[badgeStyles.chip, { backgroundColor: withAlpha(colors.info, 0.1), borderColor: withAlpha(colors.info, 0.2), borderRadius: radius.full }]}>
              <Text style={[type.caption, { color: colors.info, fontWeight: '600' }]}>{tender.procurementCategory}</Text>
            </View>
          )}
          {tender.urgency && tender.urgency !== 'normal' && (
            <View style={[badgeStyles.chip, { backgroundColor: withAlpha(colors.warning, 0.1), borderColor: withAlpha(colors.warning, 0.2), borderRadius: radius.full }]}>
              <Ionicons name="flash" size={10} color={colors.warning} />
              <Text style={[type.caption, { color: colors.warning, fontWeight: '600', marginLeft: 3 }]}>
                {tender.urgency}
              </Text>
            </View>
          )}
          {tender.experienceLevel && (
            <View style={[badgeStyles.chip, { backgroundColor: withAlpha(colors.candidate, 0.1), borderColor: withAlpha(colors.candidate, 0.2), borderRadius: radius.full }]}>
              <Text style={[type.caption, { color: colors.candidate, fontWeight: '600' }]}>{tender.experienceLevel}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Budget card */}
      <SectionCard icon="cash-outline" title="Budget">
        <FreelanceTenderBudgetTag details={tender.details} />
        {tender.engagementType && (
          <Text style={[type.caption, { color: colors.textMuted, marginTop: 6 }]}>
            {tender.engagementType === 'fixed_price' ? 'Fixed price project'
              : tender.engagementType === 'hourly' ? 'Per hour'
              : tender.engagementType === 'fixed_salary' ? 'Fixed salary'
              : 'Negotiable'}
          </Text>
        )}
      </SectionCard>

      {/* Deadline */}
      <View style={{ marginTop: 10 }}>
        <SectionCard icon="time-outline" title="Deadline" iconColor={deadlinePassed ? colors.danger : colors.warning}>
          <FreelanceTenderDeadlineTimer deadline={tender.deadline} />
        </SectionCard>
      </View>

      {/* Brief description */}
      {tender.briefDescription && (
        <View style={{ marginTop: 10 }}>
          <SectionCard icon="document-text-outline" title="About this Tender" iconColor={colors.textMuted}>
            <Text style={[type.body, { color: colors.textSecondary, lineHeight: 22 }]}>
              {tender.briefDescription}
            </Text>
          </SectionCard>
        </View>
      )}

      {/* Skills */}
      {tender.skillsRequired?.length > 0 && (
        <View style={{ marginTop: 10 }}>
          <SectionCard icon="code-slash-outline" title="Required Skills" iconColor={colors.success}>
            <FreelanceTenderSkillTags skills={tender.skillsRequired} variant="wrap" />
          </SectionCard>
        </View>
      )}

      {/* Posted by */}
      {ownerName ? (
        <View style={{ marginTop: 10 }}>
          <SectionCard icon="business-outline" title="Posted By" iconColor={colors.textMuted}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <CompanyAvatar
                preview={{ type: ownerType as any, name: ownerName, logoUrl: ownerLogo, verified: ownerVerify }}
                size={44}
                borderRadius={10}
              />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[type.bodySm, { color: colors.text, fontWeight: '700' }]}>
                    {ownerName}
                  </Text>
                  {ownerVerify && (
                    <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                  )}
                </View>
                {ownerEntity?.industry && (
                  <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]}>
                    {ownerEntity.industry}
                  </Text>
                )}
              </View>
            </View>
          </SectionCard>
        </View>
      ) : null}

      {/* CTA */}
      {!deadlinePassed && !tender.hasApplied && (
        <TouchableOpacity
          onPress={onApplyPress}
          style={[
            ctaStyles.btn,
            { backgroundColor: colors.primary, borderRadius: radius.lg, marginTop: 20 },
          ]}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Apply for this tender"
        >
          <Ionicons name="flash" size={18} color="#fff" />
          <Text style={[type.body, { color: '#fff', fontWeight: '800', marginLeft: 8 }]}>
            Apply Now
          </Text>
        </TouchableOpacity>
      )}

      {tender.hasApplied && (
        <View style={[ctaStyles.appliedBox, { backgroundColor: withAlpha(colors.success, 0.10), borderRadius: radius.lg, borderColor: withAlpha(colors.success, 0.25), marginTop: 20 }]}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <Text style={[type.body, { color: colors.success, fontWeight: '700', marginLeft: 8 }]}>
            You've Applied
          </Text>
        </View>
      )}
    </ScrollView>
  );
});

// ─── DETAILS TAB ──────────────────────────────────────────────────────────────

const DetailsTab: React.FC<{ tender: any }> = memo(({ tender }) => {
  const { colors, type } = useTheme();

  const formatDate = (d?: string | Date) =>
    d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Full description */}
      {tender.description && (
        <SectionCard icon="document-text-outline" title="Project Description" iconColor={colors.textMuted}>
          <Text style={[type.body, { color: colors.textSecondary, lineHeight: 23 }]}>
            {typeof tender.description === 'string' && tender.description.startsWith('<')
              ? tender.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
              : tender.description}
          </Text>
        </SectionCard>
      )}

      {/* Project scope */}
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
          {tender.locationType && <InfoRow label="Location" value={tender.locationType} icon="location-outline" />}
          {tender.language && <InfoRow label="Language" value={tender.language} icon="globe-outline" />}
          {tender.estimatedTimeline && <InfoRow label="Est. Timeline" value={String(tender.estimatedTimeline)} icon="time-outline" />}
          {(tender.positions ?? tender.positionsAvailable) && (
            <InfoRow label="Positions" value={String(tender.positions ?? tender.positionsAvailable)} icon="people-outline" />
          )}
          {tender.maxApplications && (
            <InfoRow label="Max Applications" value={String(tender.maxApplications)} icon="person-add-outline" />
          )}
        </SectionCard>
      </View>

      {/* Timeline */}
      <View style={{ marginTop: 12 }}>
        <SectionCard icon="calendar-outline" title="Timeline" iconColor={colors.warning}>
          {tender.estimatedTimeline && <InfoRow label="Duration" value={String(tender.estimatedTimeline)} />}
          {tender.deadline && <InfoRow label="Deadline" value={formatDate(tender.deadline)} />}
          {tender.createdAt && <InfoRow label="Posted" value={formatDate(tender.createdAt)} />}
        </SectionCard>
      </View>

      {/* Requirements */}
      {(tender.requiresNDA || tender.requiresPortfolio || tender.screeningQuestions?.length > 0) && (
        <View style={{ marginTop: 12 }}>
          <SectionCard icon="shield-checkmark-outline" title="Requirements" iconColor={colors.warning}>
            {tender.requiresNDA && (
              <View style={reqStyles.pill}>
                <Text style={[type.caption, { color: colors.warning, fontWeight: '700' }]}>🔏 NDA Required</Text>
              </View>
            )}
            {tender.requiresPortfolio && (
              <View style={[reqStyles.pill, { marginTop: 6 }]}>
                <Text style={[type.caption, { color: colors.candidate, fontWeight: '700' }]}>🖼 Portfolio Required</Text>
              </View>
            )}
            {tender.screeningQuestions?.length > 0 && (
              <View style={{ marginTop: 10 }}>
                <Text style={[type.caption, { color: colors.textMuted, marginBottom: 8, fontWeight: '700', textTransform: 'uppercase' }]}>
                  Screening Questions
                </Text>
                {tender.screeningQuestions.map((q: any, i: number) => (
                  <View key={i} style={[reqStyles.qRow, { backgroundColor: withAlpha(colors.text, 0.04), borderRadius: 8, marginBottom: 6 }]}>
                    <Text style={[type.caption, { color: colors.primary, fontWeight: '800', marginRight: 6 }]}>{i + 1}.</Text>
                    <Text style={[type.caption, { color: colors.text, flex: 1 }]}>
                      {typeof q === 'string' ? q : q?.question ?? String(q)}
                    </Text>
                    {q?.required && (
                      <Text style={[type.caption, { color: colors.danger, fontWeight: '700', marginLeft: 6 }]}>*</Text>
                    )}
                  </View>
                ))}
              </View>
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
}> = memo(({ attachments, tenderId }) => {
  const { colors, type, spacing } = useTheme();

  if (!attachments?.length) {
    return (
      <View style={emptyStyles.wrap}>
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
          />
        </View>
      ))}
    </ScrollView>
  );
});

// ─── APPLY TAB ────────────────────────────────────────────────────────────────

const ApplyTab: React.FC<{
  tender: any;
  onApplyPress: () => void;
}> = memo(({ tender, onApplyPress }) => {
  const { colors, type, radius } = useTheme();
  const deadlinePassed = tender.deadline ? new Date(tender.deadline) < new Date() : false;
  const myApp = tender.myApplication;

  const statusColors: Record<string, string> = {
    submitted:          colors.info,
    under_review:       colors.warning,
    accepted:           colors.success,
    rejected:           colors.danger,
    shortlisted:        colors.success,
    interview_scheduled: colors.candidate,
    awarded:            colors.success,
  };

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {deadlinePassed && (
        <View style={[applyStyles.alert, { backgroundColor: withAlpha(colors.warning, 0.10), borderColor: withAlpha(colors.warning, 0.25), borderRadius: radius.lg }]}>
          <Ionicons name="warning-outline" size={20} color={colors.warning} />
          <Text style={[type.bodySm, { color: colors.warning, flex: 1, marginLeft: 10, lineHeight: 20 }]}>
            The deadline has passed. Applications are no longer being accepted.
          </Text>
        </View>
      )}

      {!deadlinePassed && tender.hasApplied && myApp && (
        <SectionCard icon="checkmark-circle-outline" title="Your Application" iconColor={colors.success}>
          <View style={applyStyles.statusRow}>
            <Text style={[type.caption, { color: colors.textMuted }]}>Status</Text>
            <View style={[applyStyles.statusChip, { backgroundColor: withAlpha(statusColors[myApp.status] ?? colors.textMuted, 0.12), borderRadius: radius.full }]}>
              <Text style={[type.caption, { color: statusColors[myApp.status] ?? colors.textMuted, fontWeight: '700' }]}>
                {myApp.status?.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>
          {myApp.proposedRate && (
            <View style={[applyStyles.statusRow, { marginTop: 8 }]}>
              <Text style={[type.caption, { color: colors.textMuted }]}>Proposed Rate</Text>
              <Text style={[type.caption, { color: colors.text, fontWeight: '700' }]}>
                {myApp.proposedRateCurrency ?? ''} {myApp.proposedRate}
              </Text>
            </View>
          )}
          {myApp.createdAt && (
            <View style={[applyStyles.statusRow, { marginTop: 8 }]}>
              <Text style={[type.caption, { color: colors.textMuted }]}>Submitted</Text>
              <Text style={[type.caption, { color: colors.textMuted }]}>
                {new Date(myApp.createdAt).toLocaleDateString()}
              </Text>
            </View>
          )}
          {myApp.coverLetter && (
            <View style={{ marginTop: 12 }}>
              <Text style={[type.caption, { color: colors.textMuted, marginBottom: 4, fontWeight: '700', textTransform: 'uppercase' }]}>Cover Letter</Text>
              <Text style={[type.bodySm, { color: colors.textSecondary, lineHeight: 20 }]} numberOfLines={4}>
                {myApp.coverLetter}
              </Text>
            </View>
          )}
        </SectionCard>
      )}

      {!deadlinePassed && !tender.hasApplied && (
        <>
          <SectionCard icon="flash-outline" title="Apply for This Tender" iconColor={colors.primary}>
            <View style={{ gap: 10 }}>
              <FreelanceTenderBudgetTag details={tender.details} />
              <FreelanceTenderDeadlineTimer deadline={tender.deadline} compact />
              {tender.skillsRequired?.length > 0 && (
                <FreelanceTenderSkillTags skills={tender.skillsRequired} variant="wrap" maxVisible={6} />
              )}
            </View>
          </SectionCard>

          <TouchableOpacity
            onPress={onApplyPress}
            style={[
              ctaStyles.btn,
              { backgroundColor: colors.primary, borderRadius: radius.lg, marginTop: 16 },
            ]}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Ionicons name="flash" size={18} color="#fff" />
            <Text style={[type.body, { color: '#fff', fontWeight: '800', marginLeft: 8 }]}>
              Apply Now
            </Text>
          </TouchableOpacity>

          <Text style={[type.caption, { color: colors.textMuted, textAlign: 'center', marginTop: 10 }]}>
            You'll be taken to the full application form
          </Text>
        </>
      )}
    </ScrollView>
  );
});

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const FreelanceTenderBrowserDetail: React.FC<FreelanceTenderBrowserDetailProps> = ({
  tenderId, onApplyPress, onBack,
}) => {
  const { colors, type, spacing } = useTheme();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const { data: tender, isLoading, error, refetch } = useFreelanceTender(tenderId);
  const saveMutation = useSaveUnsaveTender();

  const handleSave = useCallback(() => {
    saveMutation.mutate(tenderId);
  }, [tenderId, saveMutation]);

  const handleApply = useCallback(() => {
    onApplyPress(tenderId);
  }, [tenderId, onApplyPress]);

  const attachments: TenderAttachment[] = (tender as any)?.attachments ?? [];

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <FreelanceTenderSkeleton count={3} />
      </View>
    );
  }

  if (error || !tender) {
    return (
      <View style={[emptyStyles.wrap, { backgroundColor: colors.bg }]}>
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

  const t = tender as any;

  return (
    <View style={[{ flex: 1, backgroundColor: colors.bg }]}>
      {/* Header */}
      {onBack && (
        <View style={[headerStyles.bar, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onBack} style={headerStyles.backBtn} accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[type.bodySm, { color: colors.text, fontWeight: '700', flex: 1 }]} numberOfLines={1}>
            {t.title}
          </Text>
        </View>
      )}

      {/* Tab bar */}
      <TabBar
        active={activeTab}
        onChange={setActiveTab}
        attachmentCount={attachments.length}
        hasApplied={!!t.hasApplied}
      />

      {/* Tab content */}
      {activeTab === 'overview' && (
        <OverviewTab tender={t} onSaveToggle={handleSave} onApplyPress={handleApply} />
      )}
      {activeTab === 'details' && <DetailsTab tender={t} />}
      {activeTab === 'attachments' && (
        <AttachmentsTab attachments={attachments} tenderId={tenderId} />
      )}
      {activeTab === 'apply' && <ApplyTab tender={t} onApplyPress={handleApply} />}
    </View>
  );
};

export default FreelanceTenderBrowserDetail;

// ─── Styles ───────────────────────────────────────────────────────────────────

const tabStyles = StyleSheet.create({
  bar:         { borderBottomWidth: StyleSheet.hairlineWidth },
  barContent:  { paddingHorizontal: 12, height: 48 },
  tab:         { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive:   { borderBottomWidth: 2 },
  tabLabel:    { fontSize: 13, fontWeight: '600' },
  badge:       { minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  badgeText:   { color: '#fff', fontSize: 9, fontWeight: '800' },
});

const sectionStyles = StyleSheet.create({
  card:   { borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.05)' },
  body:   { padding: 14 },
});

const infoStyles = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  labelRow: { flexDirection: 'row', alignItems: 'center' },
});

const attStyles = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, gap: 10 },
  extBadge: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  info:     { flex: 1 },
});

const badgeStyles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
});

const reqStyles = StyleSheet.create({
  pill:  { paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start', borderRadius: 20 },
  qRow:  { flexDirection: 'row', alignItems: 'flex-start', padding: 10 },
});

const ctaStyles = StyleSheet.create({
  btn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52 },
  appliedBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, borderWidth: 1 },
});

const applyStyles = StyleSheet.create({
  alert:     { flexDirection: 'row', alignItems: 'flex-start', padding: 14, borderWidth: 1, marginBottom: 16 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusChip:{ paddingHorizontal: 10, paddingVertical: 4 },
});

const emptyStyles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
});

const headerStyles = StyleSheet.create({
  bar:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 52, borderBottomWidth: StyleSheet.hairlineWidth, gap: 8 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
