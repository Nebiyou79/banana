// ─────────────────────────────────────────────────────────────────────────────
//  src/components/professionalTenders/ProfessionalTenderForm/Step5_Review.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  Step 5 (final) — read-only summary across all prior steps + form-validity
//  status banner. Submission buttons live in the shell footer, not here.
//
//  P-14: preBidMeeting block reads from ROOT (`useWatch('preBidMeeting')`).
//  CPO summary appears only when cpoRequired === true.
//  Invitee summary appears only when visibilityType === 'invite_only'.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFormContext, useWatch } from 'react-hook-form';
import {
  Award,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  FileText,
  Globe,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Users,
  User,
} from 'lucide-react-native';

import { useThemeStore } from '../../../store/themeStore';
import { useCompaniesByIds } from '../../../hooks/useProfessionalTender';
import ProfessionalTenderWorkflowBadge from '../ProfessionalTenderWorkflowBadge';
import type { StagedFile } from './Step4_DatesDocuments';
import type { ProfessionalTenderFormValues } from './formSchema';

// ═════════════════════════════════════════════════════════════════════════════
//  CARD WRAPPER
// ═════════════════════════════════════════════════════════════════════════════

const SummaryCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}> = ({ icon, title, children }) => {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const palette = isDark
    ? { bg: '#1E293B', border: '#334155', text: '#F1F5F9', muted: '#94A3B8' }
    : { bg: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', muted: '#64748B' };
  return (
    <View style={[styles.card, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <View style={styles.cardHead}>
        <View style={[styles.cardIcon, { backgroundColor: isDark ? '#0F172A' : '#F1F5F9' }]}>
          {icon}
        </View>
        <Text style={[styles.cardTitle, { color: palette.text }]}>{title}</Text>
      </View>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
};

const Row: React.FC<{ label: string; value?: React.ReactNode; muted?: boolean }> = ({
  label,
  value,
  muted,
}) => {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const palette = isDark
    ? { label: '#94A3B8', value: '#F1F5F9', valueMuted: '#64748B' }
    : { label: '#64748B', value: '#0F172A', valueMuted: '#94A3B8' };
  const display = value === undefined || value === null || value === ''
    ? <Text style={[styles.rowValue, { color: palette.valueMuted, fontStyle: 'italic' }]}>Not provided</Text>
    : typeof value === 'string' || typeof value === 'number'
      ? <Text style={[styles.rowValue, { color: muted ? palette.valueMuted : palette.value }]}>{value}</Text>
      : value;
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: palette.label }]}>{label}</Text>
      <View style={styles.rowValueWrap}>{display}</View>
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  HELPERS
// ═════════════════════════════════════════════════════════════════════════════

const formatDate = (iso?: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
};

const TENDER_TYPE_LABELS: Record<string, string> = {
  works: 'Works', goods: 'Goods', services: 'Services', consultancy: 'Consultancy',
};
const PROC_METHOD_LABELS: Record<string, string> = {
  open_tender: 'Open Tender', restricted: 'Restricted',
  sealed_bid: 'Sealed Bid',  direct: 'Direct',
  framework: 'Framework',     negotiated: 'Negotiated',
};
const EVAL_METHOD_LABELS: Record<string, string> = {
  combined: 'Combined (Technical + Financial)',
  technical_only: 'Technical Only',
  financial_only: 'Financial Only',
};

// ═════════════════════════════════════════════════════════════════════════════
//  COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

export interface Step5_ReviewProps {
  files: StagedFile[];
}

const Step5_Review: React.FC<Step5_ReviewProps> = ({ files }) => {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const { control, formState: { isValid, errors } } = useFormContext<ProfessionalTenderFormValues>();
  const values = useWatch({ control }) as Partial<ProfessionalTenderFormValues>;

  // Hydrate invited company profiles for display
  const invitedIds = values.invitedCompanies ?? [];
  const { data: invitedProfiles = [] } = useCompaniesByIds(invitedIds, {
    enabled: invitedIds.length > 0,
  });

  const errorCount = useMemo(() => {
    let n = 0;
    const visit = (e: any) => {
      if (!e) return;
      if (typeof e === 'object' && 'message' in e && typeof e.message === 'string') { n++; return; }
      if (typeof e === 'object') Object.values(e).forEach(visit);
    };
    visit(errors);
    return n;
  }, [errors]);

  const palette = isDark
    ? {
        statusOkBg:   'rgba(34,197,94,0.12)',
        statusOkBd:   'rgba(34,197,94,0.40)',
        statusOkFg:   '#34D399',
        statusErrBg:  'rgba(248,113,113,0.12)',
        statusErrBd:  'rgba(248,113,113,0.40)',
        statusErrFg:  '#F87171',
        text:         '#F1F5F9',
        muted:        '#94A3B8',
        iconColor:    '#60A5FA',
        chipBg:       '#1E3A5F',
        chipFg:       '#93C5FD',
      }
    : {
        statusOkBg:   '#F0FDF4',
        statusOkBd:   '#BBF7D0',
        statusOkFg:   '#15803D',
        statusErrBg:  '#FEF2F2',
        statusErrBd:  '#FECACA',
        statusErrFg:  '#B91C1C',
        text:         '#0F172A',
        muted:        '#64748B',
        iconColor:    '#2563EB',
        chipBg:       '#DBEAFE',
        chipFg:       '#1D4ED8',
      };

  const tenderType = values.tenderType ?? 'services';
  const proc = values.procurement;
  const elig = values.eligibility;
  const evaln = values.evaluation;
  const pbm = values.preBidMeeting;
  const certs = elig?.requiredCertifications ?? [];

  return (
    <View style={styles.root}>
      {/* ─── Status banner ─────────────────────────────────────────────── */}
      {isValid && errorCount === 0 ? (
        <View
          style={[
            styles.statusBanner,
            { backgroundColor: palette.statusOkBg, borderColor: palette.statusOkBd },
          ]}
        >
          <CheckCircle2 size={18} color={palette.statusOkFg} strokeWidth={2.5} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.statusTitle, { color: palette.statusOkFg }]}>Ready to submit</Text>
            <Text style={[styles.statusDesc, { color: palette.statusOkFg }]}>
              All required fields are filled in. Save as draft or publish below.
            </Text>
          </View>
        </View>
      ) : (
        <View
          style={[
            styles.statusBanner,
            { backgroundColor: palette.statusErrBg, borderColor: palette.statusErrBd },
          ]}
        >
          <Text style={{ color: palette.statusErrFg, fontSize: 18, fontWeight: '900' }}>!</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.statusTitle, { color: palette.statusErrFg }]}>
              {errorCount > 0 ? `${errorCount} issue${errorCount === 1 ? '' : 's'} to fix` : 'Form not yet valid'}
            </Text>
            <Text style={[styles.statusDesc, { color: palette.statusErrFg }]}>
              Go back and complete the highlighted fields before submitting.
            </Text>
          </View>
        </View>
      )}

      {/* ─── 1. Identity ──────────────────────────────────────────────── */}
      <SummaryCard
        icon={<FileText size={16} color={palette.iconColor} strokeWidth={2.4} />}
        title="Identity"
      >
        <Row label="Title" value={values.title} />
        <Row label="Brief" value={values.briefDescription} />
        <Row label="Category" value={values.procurementCategory} />
        <Row label="Type" value={TENDER_TYPE_LABELS[tenderType] ?? tenderType} />
        <View style={styles.workflowRow}>
          <Text style={[styles.rowLabel, { color: palette.muted }]}>Workflow</Text>
          {values.workflowType && (
            <ProfessionalTenderWorkflowBadge workflowType={values.workflowType} size="md" />
          )}
        </View>
        <Row
          label="Visibility"
          value={
            <View style={styles.inlineIcon}>
              {values.visibilityType === 'invite_only' ? (
                <ShieldCheck size={14} color={palette.muted} strokeWidth={2.2} />
              ) : (
                <Globe size={14} color={palette.muted} strokeWidth={2.2} />
              )}
              <Text style={[styles.rowValue, { color: palette.text }]}>
                {values.visibilityType === 'invite_only' ? 'Invite Only' : 'Public'}
              </Text>
            </View>
          }
        />
        {!!values.referenceNumber && <Row label="Reference" value={values.referenceNumber} />}
      </SummaryCard>

      {/* ─── 1b. Invited Companies (only when invite-only) ───────────── */}
      {values.visibilityType === 'invite_only' && (
        <SummaryCard
          icon={<Users size={16} color={palette.iconColor} strokeWidth={2.4} />}
          title={`Invited Companies (${invitedIds.length})`}
        >
          {invitedIds.length === 0 ? (
            <Text style={[styles.smallNote, { color: palette.muted, fontStyle: 'italic' }]}>
              No companies invited
            </Text>
          ) : (
            <View style={styles.chipsRow}>
              {invitedProfiles.map((p) => (
                <View key={p._id} style={[styles.chip, { backgroundColor: palette.chipBg }]}>
                  <Text style={[styles.chipText, { color: palette.chipFg }]} numberOfLines={1}>
                    {p.name}
                  </Text>
                </View>
              ))}
              {/* Show ids that haven't loaded yet */}
              {invitedIds.length > invitedProfiles.length && (
                <View style={[styles.chip, { backgroundColor: palette.chipBg }]}>
                  <Text style={[styles.chipText, { color: palette.chipFg }]}>
                    +{invitedIds.length - invitedProfiles.length} loading…
                  </Text>
                </View>
              )}
            </View>
          )}
        </SummaryCard>
      )}

      {/* ─── 2. Procurement ────────────────────────────────────────────── */}
      <SummaryCard
        icon={<Building2 size={16} color={palette.iconColor} strokeWidth={2.4} />}
        title="Procurement"
      >
        <Row label="Procuring Entity" value={proc?.procuringEntity} />
        <Row
          label="Method"
          value={proc?.procurementMethod ? PROC_METHOD_LABELS[proc.procurementMethod] : ''}
        />
        <Row label="Funding Source" value={proc?.fundingSource} />
        <Row
          label="Bid Security"
          value={
            proc?.bidSecurityAmount !== undefined && proc?.bidSecurityAmount !== null
              ? `${proc.bidSecurityAmount.toLocaleString()} ${proc.bidSecurityCurrency ?? 'ETB'}`
              : ''
          }
        />
        {(proc?.contactPerson?.name || proc?.contactPerson?.email || proc?.contactPerson?.phone) && (
          <View style={styles.contactBlock}>
            <Text style={[styles.subHead, { color: palette.muted }]}>CONTACT</Text>
            {!!proc?.contactPerson?.name && (
              <View style={styles.inlineIcon}>
                <User size={13} color={palette.muted} strokeWidth={2.2} />
                <Text style={[styles.rowValue, { color: palette.text }]}>{proc.contactPerson.name}</Text>
              </View>
            )}
            {!!proc?.contactPerson?.email && (
              <View style={styles.inlineIcon}>
                <Mail size={13} color={palette.muted} strokeWidth={2.2} />
                <Text style={[styles.rowValue, { color: palette.text }]}>{proc.contactPerson.email}</Text>
              </View>
            )}
            {!!proc?.contactPerson?.phone && (
              <View style={styles.inlineIcon}>
                <Phone size={13} color={palette.muted} strokeWidth={2.2} />
                <Text style={[styles.rowValue, { color: palette.text }]}>{proc.contactPerson.phone}</Text>
              </View>
            )}
          </View>
        )}
      </SummaryCard>

      {/* ─── 2b. CPO (only when required) ────────────────────────────── */}
      {values.cpoRequired && (
        <SummaryCard
          icon={<Award size={16} color={palette.iconColor} strokeWidth={2.4} />}
          title="CPO Requirement"
        >
          <Row label="Status" value="Required" />
          {values.cpoAmount !== undefined && values.cpoAmount !== null && (
            <Row
              label="Indicative Amount"
              value={`${Number(values.cpoAmount).toLocaleString()} ${values.cpoCurrency ?? 'ETB'}`}
            />
          )}
          {!!values.cpoDescription && (
            <View style={styles.scopeBlock}>
              <Text style={[styles.subHead, { color: palette.muted }]}>DESCRIPTION</Text>
              <Text style={[styles.scopeText, { color: palette.text }]}>{values.cpoDescription}</Text>
            </View>
          )}
        </SummaryCard>
      )}

      {/* ─── 3. Eligibility & Scope ──────────────────────────────────── */}
      <SummaryCard
        icon={<ShieldCheck size={16} color={palette.iconColor} strokeWidth={2.4} />}
        title="Eligibility & Scope"
      >
        <Row label="Min. Experience" value={
          elig?.minimumExperience !== undefined && elig?.minimumExperience !== null
            ? `${elig.minimumExperience} years` : ''
        } />
        <Row label="Legal Registration" value={elig?.legalRegistrationRequired ? 'Required' : 'Not required'} />
        <Row
          label="Certifications"
          value={
            certs.length === 0 ? '' : (
              <View style={styles.chipsRow}>
                {certs.map((c) => (
                  <View
                    key={c}
                    style={[
                      styles.chip,
                      { backgroundColor: isDark ? '#0F172A' : '#F1F5F9', borderColor: isDark ? '#334155' : '#E2E8F0' },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: palette.text }]}>{c}</Text>
                  </View>
                ))}
              </View>
            )
          }
        />
        <View style={styles.scopeBlock}>
          <Text style={[styles.subHead, { color: palette.muted }]}>SCOPE OF WORK</Text>
          <Text style={[styles.scopeText, { color: palette.text }]}>
            {values.scope?.description || 'Not provided'}
          </Text>
        </View>
      </SummaryCard>

      {/* ─── 4. Evaluation ────────────────────────────────────────────── */}
      <SummaryCard
        icon={<Award size={16} color={palette.iconColor} strokeWidth={2.4} />}
        title="Evaluation"
      >
        <Row label="Method" value={evaln?.evaluationMethod ? EVAL_METHOD_LABELS[evaln.evaluationMethod] : ''} />
        <Row label="Technical Weight" value={evaln?.technicalWeight !== undefined ? `${evaln.technicalWeight}%` : ''} />
        <Row label="Financial Weight" value={evaln?.financialWeight !== undefined ? `${evaln.financialWeight}%` : ''} />
        {!!evaln?.criteria && (
          <View style={styles.scopeBlock}>
            <Text style={[styles.subHead, { color: palette.muted }]}>CRITERIA</Text>
            <Text style={[styles.scopeText, { color: palette.text }]}>{evaln.criteria}</Text>
          </View>
        )}
      </SummaryCard>

      {/* ─── 5. Dates ─────────────────────────────────────────────────── */}
      <SummaryCard
        icon={<Calendar size={16} color={palette.iconColor} strokeWidth={2.4} />}
        title="Dates"
      >
        <Row label="Submission Deadline" value={formatDate(values.deadline)} />
        <Row label="Bid Opening" value={formatDate(values.bidOpeningDate)} />
        <Row label="Clarification Deadline" value={formatDate(values.clarificationDeadline)} />

        {pbm?.enabled && (
          <View style={styles.contactBlock}>
            <Text style={[styles.subHead, { color: palette.muted }]}>PRE-BID MEETING</Text>
            <Row label="When" value={formatDate(pbm?.date)} />
            {!!pbm?.location && (
              <View style={styles.inlineIcon}>
                <MapPin size={13} color={palette.muted} strokeWidth={2.2} />
                <Text style={[styles.rowValue, { color: palette.text }]}>{pbm.location}</Text>
              </View>
            )}
            {!!pbm?.onlineLink && (
              <View style={styles.inlineIcon}>
                <Globe size={13} color={palette.muted} strokeWidth={2.2} />
                <Text style={[styles.rowValue, { color: palette.text }]}>{pbm.onlineLink}</Text>
              </View>
            )}
            <Text style={[styles.smallNote, { color: palette.muted }]}>
              Attendance {pbm?.mandatory ? 'mandatory' : 'optional'}
            </Text>
          </View>
        )}
      </SummaryCard>

      {/* ─── 6. Documents ─────────────────────────────────────────────── */}
      <SummaryCard
        icon={<Briefcase size={16} color={palette.iconColor} strokeWidth={2.4} />}
        title="Documents"
      >
        {files.length === 0 ? (
          <Text style={[styles.smallNote, { color: palette.muted, fontStyle: 'italic' }]}>
            No documents attached
          </Text>
        ) : (
          <View style={styles.fileList}>
            {files.map((f, i) => (
              <View key={`${f.uri}-${i}`} style={styles.fileRow}>
                <FileText size={13} color={palette.muted} strokeWidth={2.2} />
                <Text style={[styles.fileName, { color: palette.text }]} numberOfLines={1}>
                  {f.name}
                </Text>
              </View>
            ))}
          </View>
        )}
      </SummaryCard>

      {/* Footnote */}
      <View style={styles.footnote}>
        <Lock size={12} color={palette.muted} strokeWidth={2.4} />
        <Text style={[styles.footnoteText, { color: palette.muted }]}>
          Once published, this tender cannot be edited directly.
          Use the <Text style={{ fontWeight: '700' }}>Addendum</Text> system for any
          changes after publication.
        </Text>
      </View>
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  STYLES
// ═════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  root: { gap: 14 },

  statusBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusTitle: { fontSize: 13, fontWeight: '700' },
  statusDesc:  { fontSize: 12, lineHeight: 16 },

  card: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  cardHead: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  cardIcon: {
    width: 28, height: 28,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 8,
  },
  cardTitle: { fontSize: 14, fontWeight: '700' },
  cardBody: { paddingHorizontal: 14, paddingBottom: 14, gap: 8 },

  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, minHeight: 22 },
  rowLabel: {
    width: 110,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    paddingTop: 2,
  },
  rowValueWrap: { flex: 1 },
  rowValue: { fontSize: 13, lineHeight: 18 },

  workflowRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  inlineIcon: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  chip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, borderWidth: 1, maxWidth: 220 },
  chipText: { fontSize: 11, fontWeight: '600' },

  scopeBlock: { gap: 4, marginTop: 4 },
  scopeText: { fontSize: 12, lineHeight: 17 },
  subHead: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  contactBlock: { gap: 6, marginTop: 4 },
  fileList: { gap: 4 },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fileName: { flex: 1, fontSize: 12 },

  smallNote: { fontSize: 11 },

  footnote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  footnoteText: { flex: 1, fontSize: 11, lineHeight: 16 },
});

export default Step5_Review;