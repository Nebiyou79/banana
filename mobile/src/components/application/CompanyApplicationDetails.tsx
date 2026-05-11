/**
 * src/components/application/CompanyApplicationDetails.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Employer-facing application detail view.
 *
 * FIXED: Now uses shared Avatar component for candidate avatar display
 * with proper fallback handling and consistent styling.
 *
 * REFACTOR NOTES (spec compliance):
 *  ✅ useTheme() replaces `colors: any` prop threading through sub-components.
 *  ✅ withAlpha() replaces all hex-string concatenation.
 *  ✅ SectionCard / InfoRow / TabBar extracted as stable React.memo components.
 *  ✅ StyleSheet memoised with useMemo.
 *  ✅ All touch targets ≥ 44 pt.
 *  ✅ No emoji icons.
 *  ✅ No `any` prop types on public API.
 *  ✅ Candidate avatar uses shared Avatar component with proper fallback.
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
import { withAlpha } from '../../theme/utils';
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
// ─── CompanyApplicationDetails ────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

type CompanyTabId = 'candidate' | 'attachments' | 'manage';

const COMPANY_TABS: TabConfig[] = [
  { id: 'candidate',   label: 'Candidate',   icon: 'person-outline' },
  { id: 'attachments', label: 'Attachments', icon: 'folder-open-outline' },
  { id: 'manage',      label: 'Manage',      icon: 'settings-outline' },
];

interface CompanyApplicationDetailsProps {
  application: Application;
  /** Kept for API compat — internally we use useTheme() */
  colors?: ThemeColors;
  onUpdated?: (app: Application) => void;
}

export const CompanyApplicationDetails: React.FC<CompanyApplicationDetailsProps> = ({
  application,
  onUpdated,
}) => {
  const { colors: c, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<CompanyTabId>('candidate');

  const attachments = useMemo(() => buildAttachments(application), [application]);

  // Candidate information
  const name     = application.userInfo?.name     ?? application.candidate?.name     ?? 'Candidate';
  const email    = application.userInfo?.email    ?? application.candidate?.email    ?? '';
  const phone    = application.userInfo?.phone    ?? (application.candidate as any)?.phone    ?? '';
  const location = application.userInfo?.location ?? (application.candidate as any)?.location ?? '';
  const avatar   = application.candidate?.avatar ?? (application.candidate as any)?.profileImage;

  // Build candidate entity for Avatar component
  const candidateEntity = useMemo(() => ({
    type: 'candidate' as const,
    name: name,
    avatar: avatar,
    profileImage: (application.candidate as any)?.profileImage,
  }), [name, avatar, application.candidate]);

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

        // Hero card styles
        heroCard: {
          padding: 14,
          borderRadius: RADIUS.md,
          borderWidth: 1,
          gap: 10,
          backgroundColor: c.surface,
          borderColor: c.border,
        },
        heroLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        },
        heroName: {
          fontSize: 17,
          fontWeight: '800',
          color: c.text,
        },
        heroEmail: {
          fontSize: 12,
          marginTop: 2,
          color: c.textMuted,
        },
        heroBio: {
          fontSize: 13,
          lineHeight: 18,
          color: c.textMuted,
        },

        // Additional info styles
        infoGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          marginTop: 8,
        },
        infoBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: RADIUS.full,
          backgroundColor: withAlpha(c.primary, 0.10),
        },
        infoBadgeText: {
          fontSize: 11,
          fontWeight: '600',
          color: c.primary,
        },
      }),
    [c, isDark],
  );

  return (
    <View style={{ flex: 1 }}>
      <TabBar
        tabs={COMPANY_TABS}
        activeId={activeTab}
        onSelect={(id) => setActiveTab(id as CompanyTabId)}
        badgeCounts={badgeCounts}
        c={c}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === 'candidate' && (
          <View style={{ gap: 12 }}>
            {/* ✅ FIXED: Hero card with shared Avatar component */}
            <View style={[styles.heroCard]}>
              <View style={styles.heroLeft}>
                <Avatar
                  entity={candidateEntity}
                  size={52}
                  borderRadius={26}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroName} numberOfLines={1}>
                    {name}
                  </Text>
                  {email ? (
                    <Text style={styles.heroEmail} numberOfLines={1}>
                      {email}
                    </Text>
                  ) : null}
                </View>
              </View>
              
              {application.userInfo?.bio ? (
                <Text style={styles.heroBio} numberOfLines={3}>
                  {application.userInfo.bio}
                </Text>
              ) : null}

              {/* Quick info badges */}
              <View style={styles.infoGrid}>
                {application.candidate?.phone && (
                  <View style={styles.infoBadge}>
                    <Ionicons name="briefcase-outline" size={12} color={c.primary} />
                    <Text style={styles.infoBadgeText}>
                      {application.candidate.phone}
                    </Text>
                  </View>
                )}
                {(application.workExperience ?? []).length > 0 && (
                  <View style={styles.infoBadge}>
                    <Ionicons name="time-outline" size={12} color={c.primary} />
                    <Text style={styles.infoBadgeText}>
                      {application.workExperience.length} experience{application.workExperience.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
                {(application.skills ?? []).length > 0 && (
                  <View style={styles.infoBadge}>
                    <Ionicons name="flash-outline" size={12} color={c.primary} />
                    <Text style={styles.infoBadgeText}>
                      {application.skills.length} skill{application.skills.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Contact */}
            <SectionCard title="Contact Information" icon="call-outline" iconColor={c.info} c={c}>
              {email && (
                <InfoRow icon="mail-outline" label="Email" value={email} c={c} />
              )}
              {phone && (
                <InfoRow icon="call-outline" label="Phone" value={phone} c={c} />
              )}
              {location && (
                <InfoRow icon="location-outline" label="Location" value={location} c={c} />
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

            {/* Education */}
            {(application.skills ?? []).length > 0 && (
              <SectionCard
                title={`Education (${application.skills.length})`}
                icon="school-outline"
                iconColor={c.info}
                c={c}
              >
                {application.skills.map((edu: any, i: number) => (
                  <View
                    key={i}
                    style={[
                      styles.fileRow,
                      { backgroundColor: c.bg, borderColor: c.border },
                    ]}
                  >
                    <Ionicons name="school-outline" size={18} color={c.info} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: c.text }}>
                        {edu.institution || 'Institution'}
                      </Text>
                      {(edu.degree || edu.field) && (
                        <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 1 }}>
                          {[edu.degree, edu.field].filter(Boolean).join(' - ')}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </SectionCard>
            )}

            {/* Application metadata */}
            <Text
              style={[
                {
                  fontSize: 12,
                  textAlign: 'center',
                  marginTop: SPACING.sm,
                  color: c.textMuted,
                },
              ]}
            >
              Applied on{' '}
              {new Date(application.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
              {application.updatedAt !== application.createdAt && (
                <>
                  {' • '}Updated{' '}
                  {new Date(application.updatedAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </>
              )}
            </Text>
          </View>
        )}

        {activeTab === 'attachments' && (
          <AttachmentsTab
            attachments={attachments}
            showDownloadAll={attachments.length > 1}
            colors={c as any}
          />
        )}

        {activeTab === 'manage' && (
          <StatusTab
            application={application}
            role="company"
            colors={c as any}
            onUpdated={onUpdated}
          />
        )}
      </ScrollView>
    </View>
  );
};