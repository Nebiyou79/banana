/**
 * src/components/application/CandidateApplicationDetails.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Candidate-facing application detail view.
 *
 * FIXED: Now displays company/organization avatar in Job Details section
 * using the shared Avatar component with proper entity resolution.
 *
 * REFACTOR NOTES (spec compliance):
 *  ✅ useTheme() replaces `colors: any` prop threading through sub-components.
 *  ✅ withAlpha() replaces all hex-string concatenation.
 *  ✅ SectionCard / InfoRow / TabBar extracted as stable React.memo components.
 *  ✅ StyleSheet memoised with useMemo.
 *  ✅ All touch targets ≥ 44 pt.
 *  ✅ No emoji icons.
 *  ✅ No `any` prop types on public API.
 *  ✅ Company avatar displays correctly with proper fallback.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { withAlpha, formatShortDate } from '../../theme/utils';
import { SPACING, RADIUS } from '../../theme/tokens';
import type { ThemeColors } from '../../theme/color';
import {
  Application,
  buildAttachments,
} from '../../services/applicationService';
import { AttachmentsTab } from './AttachmentsTab';
import { StatusTab } from './StatusTab';
import { Avatar } from '../shared/Avatar';
import {
  SectionCard,
  InfoRow,
  TabBar,
  ExpCard,
  RefCard,
  type TabConfig,
} from './ApplicationSharedComponents';

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Helpers ─────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build an Avatar entity for the company/organization owner.
 * Tries all possible field names the backend might return for logo/image URLs.
 */
const buildOwnerAvatarEntity = (application: Application) => {
  const isOrg = application.job?.jobType === 'organization';
  const owner = isOrg
    ? (application.job?.organization as any)
    : (application.job?.company as any);

  if (!owner) {
    return {
      type: (isOrg ? 'organization' : 'company') as 'organization' | 'company',
      name: isOrg ? 'Organization' : 'Company',
    };
  }

  // Try all possible logo/image URL fields in priority order
  const logoUrl = 
    owner.logoUrl || 
    owner.logo || 
    owner.avatarUrl || 
    owner.avatar || 
    owner.imageUrl || 
    owner.profileImage;

  return {
    type: (isOrg ? 'organization' : 'company') as 'organization' | 'company',
    name: owner.name || (isOrg ? 'Organization' : 'Company'),
    logoUrl: typeof logoUrl === 'string' && logoUrl.startsWith('http') ? logoUrl : undefined,
    logo: typeof logoUrl === 'string' && logoUrl.startsWith('http') ? logoUrl : undefined,
    verified: owner.verified || false,
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── CandidateApplicationDetails ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

type CandidateTabId = 'info' | 'attachments' | 'status';

const CANDIDATE_TABS: TabConfig[] = [
  { id: 'info',        label: 'Information', icon: 'information-circle-outline' },
  { id: 'attachments', label: 'Attachments', icon: 'folder-open-outline' },
  { id: 'status',      label: 'Status',      icon: 'git-branch-outline' },
];

interface CandidateApplicationDetailsProps {
  application: Application;
  /** Kept for API compat — internally we use useTheme() */
  colors?: ThemeColors;
  onUpdated?: (app: Application) => void;
}

export const CandidateApplicationDetails: React.FC<CandidateApplicationDetailsProps> = ({
  application,
  onUpdated,
}) => {
  const { colors: c, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<CandidateTabId>('info');

  const attachments = useMemo(() => buildAttachments(application), [application]);

  const isOrg = application.job?.jobType === 'organization';
  const owner = isOrg
    ? (application.job?.organization as any)
    : (application.job?.company as any);

  const ownerEntity = useMemo(
    () => buildOwnerAvatarEntity(application),
    [application]
  );

  const badgeCounts = useMemo(
    () => ({ attachments: attachments.length }),
    [attachments.length],
  );

  // ── Memoised styles ────────────────────────────────────────────────────────
  const styles = useMemo(
    () =>
      StyleSheet.create({
        body:    { fontSize: 13, lineHeight: 20 },
        chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
        chip: {
          paddingHorizontal: SPACING.sm,
          paddingVertical: 3,
          borderRadius: RADIUS.full,
          borderWidth: 1,
        },
        chipText: { fontSize: 12, fontWeight: '600' },
        fileRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.sm,
          padding: SPACING.sm,
          borderRadius: RADIUS.sm,
          borderWidth: 1,
          marginBottom: 4,
        },
        fileText: { fontSize: 13, flex: 1 },

        // Company info styles
        companyRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 14,
          paddingBottom: 12,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: c.border,
        },
        companyInfo: {
          flex: 1,
          marginLeft: 12,
        },
        companyName: {
          fontSize: 15,
          fontWeight: '700',
          color: c.text,
        },
        companyIndustry: {
          fontSize: 12,
          color: c.textMuted,
          marginTop: 2,
        },
        companyVerified: {
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 3,
          gap: 4,
        },
        companyVerifiedText: {
          fontSize: 11,
          color: c.success,
          fontWeight: '600',
        },
      }),
    [c, isDark],
  );

  return (
    <View style={{ flex: 1 }}>
      <TabBar
        tabs={CANDIDATE_TABS}
        activeId={activeTab}
        onSelect={(id) => setActiveTab(id as CandidateTabId)}
        badgeCounts={badgeCounts}
        c={c}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === 'info' && (
          <View style={{ gap: 12 }}>
            {/* Contact info */}
            <SectionCard title="Your Contact Info" icon="call-outline" iconColor={c.info} c={c}>
              {application.contactInfo?.email && (
                <InfoRow
                  icon="mail-outline"
                  label="Email"
                  value={application.contactInfo.email}
                  c={c}
                />
              )}
              {application.contactInfo?.phone && (
                <InfoRow
                  icon="call-outline"
                  label="Phone"
                  value={application.contactInfo.phone}
                  c={c}
                />
              )}
              {application.contactInfo?.location && (
                <InfoRow
                  icon="location-outline"
                  label="Location"
                  value={application.contactInfo.location}
                  c={c}
                />
              )}
              {application.contactInfo?.telegram && (
                <InfoRow
                  icon="paper-plane-outline"
                  label="Telegram"
                  value={application.contactInfo.telegram}
                  c={c}
                />
              )}
            </SectionCard>

            {/* ✅ FIXED: Job Details with company avatar */}
            <SectionCard title="Job Details" icon="briefcase-outline" iconColor={c.success} c={c}>
              {/* Company/Organization info with avatar */}
              {owner && (
                <View style={styles.companyRow}>
                  <Avatar
                    entity={ownerEntity}
                    size={48}
                    borderRadius={RADIUS.md}
                    verified={owner.verified}
                  />
                  <View style={styles.companyInfo}>
                    <Text style={styles.companyName} numberOfLines={1}>
                      {owner.name || (isOrg ? 'Organization' : 'Company')}
                    </Text>
                    {owner.industry && (
                      <Text style={styles.companyIndustry} numberOfLines={1}>
                        {owner.industry}
                      </Text>
                    )}
                    {owner.verified && (
                      <View style={styles.companyVerified}>
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color={c.success}
                        />
                        <Text style={styles.companyVerifiedText}>
                          Verified {isOrg ? 'Organization' : 'Company'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              <InfoRow
                icon="document-text-outline"
                label="Position"
                value={application.job?.title ?? 'Not specified'}
                c={c}
              />
              {application.job?.jobType && (
                <InfoRow
                  icon="briefcase-outline"
                  label="Type"
                  value={application.job.jobType}
                  c={c}
                />
              )}
              {application.job?.location?.region && (
                <InfoRow
                  icon="location-outline"
                  label="Region"
                  value={application.job.location.region}
                  c={c}
                />
              )}
              <InfoRow
                icon="calendar-outline"
                label="Applied"
                value={formatShortDate(application.createdAt)}
                c={c}
              />
            </SectionCard>

            {/* Cover letter */}
            {application.coverLetter && (
              <SectionCard title="Cover Letter" icon="document-text-outline" iconColor={c.primary} c={c}>
                <Text style={[styles.body, { color: c.textSecondary }]}>
                  {application.coverLetter}
                </Text>
              </SectionCard>
            )}

            {/* Skills */}
            {(application.skills ?? []).length > 0 && (
              <SectionCard title="Skills" icon="flash-outline" iconColor={c.warning} c={c}>
                <View style={styles.chipRow}>
                  {application.skills.map((sk, i) => (
                    <View
                      key={i}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: withAlpha(c.warning, 0.13),
                          borderColor: withAlpha(c.warning, 0.40),
                        },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: c.warning }]}>{sk}</Text>
                    </View>
                  ))}
                </View>
              </SectionCard>
            )}

            {/* CVs */}
            {(application.selectedCVs ?? []).length > 0 && (
              <SectionCard
                title={`CVs Submitted (${application.selectedCVs.length})`}
                icon="document-outline"
                iconColor={c.danger}
                c={c}
              >
                {application.selectedCVs.map((cv, i) => (
                  <View
                    key={i}
                    style={[
                      styles.fileRow,
                      { backgroundColor: c.bg, borderColor: c.border },
                    ]}
                  >
                    <Ionicons name="document-text" size={18} color={c.danger} />
                    <Text
                      style={[styles.fileText, { color: c.text }]}
                      numberOfLines={1}
                    >
                      {cv.originalName ?? (cv as any).filename ?? 'CV Document'}
                    </Text>
                  </View>
                ))}
              </SectionCard>
            )}

            {/* Work experience */}
            {(application.workExperience ?? []).length > 0 && (
              <SectionCard
                title={`Work Experience (${application.workExperience.length})`}
                icon="briefcase-outline"
                iconColor={c.info}
                c={c}
              >
                {application.workExperience.map((exp, i) => (
                  <ExpCard key={i} exp={exp} c={c} />
                ))}
              </SectionCard>
            )}

            {/* References */}
            {(application.references ?? []).length > 0 && (
              <SectionCard
                title={`References (${application.references.length})`}
                icon="people-outline"
                iconColor={c.primary}
                c={c}
              >
                {application.references.map((ref, i) => (
                  <RefCard key={i} ref={ref} c={c} />
                ))}
              </SectionCard>
            )}

            {/* Application timeline info */}
            {application.statusHistory && application.statusHistory.length > 0 && (
              <SectionCard title="Application Timeline" icon="time-outline" iconColor={c.info} c={c}>
                {application.statusHistory.map((entry: any, i: number) => (
                  <View
                    key={i}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      gap: 10,
                      marginBottom: 8,
                    }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: c.primary,
                        marginTop: 4,
                      }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: c.text }}>
                        {entry.status || 'Status Update'}
                      </Text>
                      {entry.note && (
                        <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>
                          {entry.note}
                        </Text>
                      )}
                      {entry.changedAt && (
                        <Text style={{ fontSize: 10, color: c.textMuted, marginTop: 2 }}>
                          {formatShortDate(entry.changedAt)}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </SectionCard>
            )}
          </View>
        )}

        {activeTab === 'attachments' && (
          <AttachmentsTab
            attachments={attachments}
            showDownloadAll={attachments.length > 1}
            colors={c as any}
          />
        )}

        {activeTab === 'status' && (
          <StatusTab
            application={application}
            role="candidate"
            colors={c as any}
            onUpdated={onUpdated}
          />
        )}
      </ScrollView>
    </View>
  );
};