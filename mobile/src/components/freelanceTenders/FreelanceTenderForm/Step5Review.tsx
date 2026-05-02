// mobile/src/components/freelanceTenders/FreelanceTenderForm/Step5Review.tsx

import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useThemeStore } from '../../../store/themeStore';
import type { FreelanceTenderFormData } from '../../../types/freelanceTender';

export interface Step5ReviewProps {
  data: FreelanceTenderFormData;
  description: string;
  attachmentFiles: Array<{ name: string; mimeType: string; size?: number }>;
  onEditStep: (step: number) => void;
}

function fmtEngagement(e: string): string {
  switch (e) {
    case 'fixed_price': return 'Fixed Price';
    case 'hourly': return 'Hourly Rate';
    case 'fixed_salary': return 'Fixed Salary';
    case 'negotiable': return 'Negotiable';
    default: return e;
  }
}

function fmtBudget(data: FreelanceTenderFormData): string {
  const d = data.details;
  if (d.engagementType === 'negotiable') return 'Negotiable';
  if (d.engagementType === 'fixed_salary' && d.salaryRange) {
    const { min, max, currency, period } = d.salaryRange;
    return `${currency} ${min?.toLocaleString() ?? 0} – ${max?.toLocaleString() ?? 0} / ${period}`;
  }
  if (d.budget) {
    const { min, max, currency } = d.budget;
    return `${currency} ${min?.toLocaleString() ?? 0} – ${max?.toLocaleString() ?? 0}`;
  }
  return '—';
}

function fmtTimeline(data: FreelanceTenderFormData): string {
  const t = data.details.estimatedTimeline;
  if (!t) return '—';
  return `${t.value} ${t.unit}`;
}

function fmtDeadline(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const diff = Math.ceil((d.getTime() - Date.now()) / 86_400_000);
  const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return diff > 0 ? `${label} (${diff}d left)` : label;
}

function formatBytes(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Section component ────────────────────────────────────────────────────────

interface ReviewSectionProps {
  title: string;
  stepNumber: number;
  onEdit: (step: number) => void;
  children: React.ReactNode;
  primaryColor: string;
  textColor: string;
  mutedColor: string;
  surfaceColor: string;
  borderColor: string;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({
  title,
  stepNumber,
  onEdit,
  children,
  primaryColor,
  textColor,
  mutedColor,
  surfaceColor,
  borderColor,
}) => (
  <View style={[styles.section, { backgroundColor: surfaceColor, borderColor }]}>
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: textColor }]}>{title}</Text>
      <TouchableOpacity
        onPress={() => onEdit(stepNumber)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${title}`}
        style={styles.editBtn}
      >
        <Text style={[styles.editBtnText, { color: primaryColor }]}>Edit</Text>
      </TouchableOpacity>
    </View>
    <View style={[styles.divider, { backgroundColor: borderColor }]} />
    {children}
  </View>
);

// ─── Row ──────────────────────────────────────────────────────────────────────

const Row: React.FC<{ label: string; value: string; textColor: string; mutedColor: string }> = ({
  label,
  value,
  textColor,
  mutedColor,
}) => (
  <View style={styles.row}>
    <Text style={[styles.rowLabel, { color: mutedColor }]}>{label}</Text>
    <Text style={[styles.rowValue, { color: textColor }]} numberOfLines={3}>
      {value || '—'}
    </Text>
  </View>
);

// ─── Main component ───────────────────────────────────────────────────────────

const Step5Review: React.FC<Step5ReviewProps> = memo(
  ({ data, description, attachmentFiles, onEditStep }) => {
    const { theme } = useThemeStore();
    const c = theme.colors;

    const rowProps = { textColor: c.text, mutedColor: c.textMuted };
    const sectionProps = {
      onEdit: onEditStep,
      primaryColor: c.primary,
      textColor: c.text,
      mutedColor: c.textMuted,
      surfaceColor: c.surface ?? c.card,
      borderColor: c.border ?? c.textMuted + '33',
    };

    const d = data.details;

    return (
      <View style={styles.container}>
        {/* Ready banner */}
        <View style={[styles.banner, { backgroundColor: c.success + '18', borderColor: c.success + '44' }]}>
          <Text style={[styles.bannerText, { color: c.success }]}>
            ✓ Ready to publish — review your tender below.
          </Text>
        </View>

        {/* Section 1: Basics */}
        <ReviewSection title="Basics & Category" stepNumber={1} {...sectionProps}>
          <Row label="Title" value={data.title} {...rowProps} />
          <Row label="Category" value={data.procurementCategory} {...rowProps} />
          <Row label="Brief" value={data.briefDescription ?? ''} {...rowProps} />
          <Row label="Deadline" value={fmtDeadline(data.deadline)} {...rowProps} />
          {data.maxApplications != null && (
            <Row label="Max Applications" value={String(data.maxApplications)} {...rowProps} />
          )}
        </ReviewSection>

        {/* Section 2: Details */}
        <ReviewSection title="Project Details & Budget" stepNumber={2} {...sectionProps}>
          <Row label="Engagement" value={fmtEngagement(d.engagementType)} {...rowProps} />
          <Row label="Budget" value={fmtBudget(data)} {...rowProps} />
          <Row label="Experience" value={d.experienceLevel} {...rowProps} />
          <Row label="Project Type" value={d.projectType.replace(/_/g, ' ')} {...rowProps} />
          <Row label="Location" value={d.locationType.replace(/_/g, ' ')} {...rowProps} />
          <Row label="Timeline" value={fmtTimeline(data)} {...rowProps} />
          <Row label="Positions" value={String(d.numberOfPositions ?? 1)} {...rowProps} />
          <Row label="Urgency" value={d.urgency} {...rowProps} />
          {d.weeklyHours != null && (
            <Row label="Weekly Hours" value={`${d.weeklyHours} hrs/wk`} {...rowProps} />
          )}
          {d.languagePreference && (
            <Row label="Language" value={d.languagePreference} {...rowProps} />
          )}
          {(d.ndaRequired || d.portfolioRequired) && (
            <Row
              label="Requirements"
              value={[d.ndaRequired && 'NDA', d.portfolioRequired && 'Portfolio'].filter(Boolean).join(', ')}
              {...rowProps}
            />
          )}
        </ReviewSection>

        {/* Section 3: Description */}
        <ReviewSection title="Description & Screening" stepNumber={3} {...sectionProps}>
          <Text style={[styles.descPreview, { color: c.text }]} numberOfLines={5}>
            {description.replace(/<[^>]+>/g, ' ').trim().slice(0, 400) || '(empty)'}
            {description.length > 400 ? '…' : ''}
          </Text>
          {(d.screeningQuestions?.length ?? 0) > 0 && (
            <Text style={[styles.qCount, { color: c.textMuted }]}>
              {d.screeningQuestions!.length} screening question
              {d.screeningQuestions!.length !== 1 ? 's' : ''}
            </Text>
          )}
        </ReviewSection>

        {/* Section 4: Skills & Attachments */}
        <ReviewSection title="Skills & Attachments" stepNumber={4} {...sectionProps}>
          {data.skillsRequired.length > 0 ? (
            <Text style={[styles.skillsList, { color: c.text }]}>
              {data.skillsRequired.join(' · ')}
            </Text>
          ) : (
            <Text style={[styles.emptyNote, { color: c.textMuted }]}>No skills added</Text>
          )}
          {attachmentFiles.length > 0 && (
            <View style={styles.attachSummary}>
              {attachmentFiles.map((f, i) => (
                <View key={i} style={[styles.attachItem, { backgroundColor: c.primary + '10', borderColor: c.primary + '33' }]}>
                  <Text style={[styles.attachName, { color: c.primary }]} numberOfLines={1}>
                    📎 {f.name}
                    {f.size ? ` (${formatBytes(f.size)})` : ''}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ReviewSection>

        <View style={styles.bottomNote}>
          <Text style={[styles.bottomNoteText, { color: c.textMuted }]}>
            Tap "Save as Draft" to save without publishing, or "Publish" to go live immediately.
          </Text>
        </View>
      </View>
    );
  }
);

Step5Review.displayName = 'Step5Review';

const styles = StyleSheet.create({
  container: { gap: 16 },
  banner: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
  },
  bannerText: { fontSize: 14, fontWeight: '600' },
  section: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  editBtn: { minWidth: 44, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' },
  editBtnText: { fontSize: 13, fontWeight: '600' },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  rowLabel: { fontSize: 12, fontWeight: '600', width: 110, paddingTop: 1 },
  rowValue: { flex: 1, fontSize: 14 },
  descPreview: { fontSize: 13, lineHeight: 20, padding: 16 },
  qCount: { fontSize: 12, paddingHorizontal: 16, paddingBottom: 12 },
  skillsList: { fontSize: 13, lineHeight: 20, padding: 16 },
  emptyNote: { fontSize: 13, padding: 16, fontStyle: 'italic' },
  attachSummary: { gap: 6, paddingHorizontal: 16, paddingBottom: 14 },
  attachItem: { borderWidth: 1, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  attachName: { fontSize: 12, fontWeight: '600' },
  bottomNote: { paddingVertical: 8 },
  bottomNoteText: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
});

export default Step5Review;