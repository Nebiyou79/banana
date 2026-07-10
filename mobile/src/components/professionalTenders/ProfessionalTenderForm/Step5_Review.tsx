// src/components/professionalTenders/ProfessionalTenderForm/Step5_Review.tsx
// FULLY REFACTORED: Premium Mint-themed review with SummaryCard, proper theming

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

import { useTheme } from '../../../hooks/useTheme';
import { useCompaniesByIds } from '../../../hooks/useProfessionalTender';
import ProfessionalTenderWorkflowBadge from '../ProfessionalTenderWorkflowBadge';
import type { StagedFile } from './Step4_DatesDocuments';
import type { ProfessionalTenderFormValues } from './formSchema';

// ═════════════════════════════════════════════════════════════════════════════
// SUMMARY CARD
// ═════════════════════════════════════════════════════════════════════════════

const SummaryCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}> = ({ icon, title, children }) => {
  const { colors, spacing, radius, shadows } = useTheme();

  return (
    <View
      style={[
        cardStyles.card,
        {
          backgroundColor: colors.bgCard,
          borderColor: colors.border,
          borderRadius: radius.lg,
          ...shadows.sm,
        },
      ]}
    >
      <View
        style={[
          cardStyles.cardHead,
          {
            borderBottomColor: colors.border,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
          },
        ]}
      >
        <View
          style={[
            cardStyles.cardIcon,
            {
              backgroundColor: `${colors.primary}15`,
              borderRadius: radius.sm,
            },
          ]}
        >
          {icon}
        </View>
        <Text style={[cardStyles.cardTitle, { color: colors.text }]}>
          {title}
        </Text>
      </View>
      <View style={[cardStyles.cardBody, { padding: spacing.lg }]}>
        {children}
      </View>
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// ROW
// ═════════════════════════════════════════════════════════════════════════════

const Row: React.FC<{
  label: string;
  value?: React.ReactNode;
  muted?: boolean;
}> = ({ label, value, muted }) => {
  const { colors, spacing } = useTheme();
  const display =
    value === undefined || value === null || value === '' ? (
      <Text
        style={[rowStyles.value, { color: colors.textMuted, fontStyle: 'italic' }]}
      >
        Not provided
      </Text>
    ) : typeof value === 'string' || typeof value === 'number' ? (
      <Text style={[rowStyles.value, { color: muted ? colors.textMuted : colors.text }]}>
        {value}
      </Text>
    ) : (
      value
    );
  return (
    <View style={[rowStyles.row, { paddingVertical: spacing.sm }]}>
      <Text style={[rowStyles.label, { color: colors.textMuted }]}>{label}</Text>
      <View style={rowStyles.valueWrap}>{display}</View>
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═════════════════════════════════════════════════════════════════════════════

const formatDate = (iso?: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const TENDER_TYPE_LABELS: Record<string, string> = {
  works: 'Works',
  goods: 'Goods',
  services: 'Services',
  consultancy: 'Consultancy',
};
const PROC_METHOD_LABELS: Record<string, string> = {
  open_tender: 'Open Tender',
  restricted: 'Restricted',
  sealed_bid: 'Sealed Bid',
  direct: 'Direct',
  framework: 'Framework',
  negotiated: 'Negotiated',
};
const EVAL_METHOD_LABELS: Record<string, string> = {
  combined: 'Combined (Technical + Financial)',
  technical_only: 'Technical Only',
  financial_only: 'Financial Only',
};

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

export interface Step5_ReviewProps {
  files: StagedFile[];
}

const Step5_Review: React.FC<Step5_ReviewProps> = ({ files }) => {
  const { colors, spacing, radius } = useTheme();
  const {
    control,
    formState: { isValid, errors },
  } = useFormContext<ProfessionalTenderFormValues>();
  const values = useWatch({ control }) as Partial<ProfessionalTenderFormValues>;

  const invitedIds = values.invitedCompanies ?? [];
  const { data: invitedProfiles = [] } = useCompaniesByIds(invitedIds, {
    enabled: invitedIds.length > 0,
  });

  const errorCount = useMemo(() => {
    let n = 0;
    const visit = (e: any) => {
      if (!e) return;
      if (
        typeof e === 'object' &&
        'message' in e &&
        typeof e.message === 'string'
      ) {
        n++;
        return;
      }
      if (typeof e === 'object') Object.values(e).forEach(visit);
    };
    visit(errors);
    return n;
  }, [errors]);

  const tenderType = values.tenderType ?? 'services';
  const proc = values.procurement;
  const elig = values.eligibility;
  const evaln = values.evaluation;
  const pbm = values.preBidMeeting;
  const certs = elig?.requiredCertifications ?? [];

  return (
    <View style={{ gap: spacing.lg }}>
      {/* Status Banner */}
      {isValid && errorCount === 0 ? (
        <View
          style={[
            reviewStyles.statusBanner,
            {
              backgroundColor: `${colors.success}15`,
              borderColor: `${colors.success}30`,
              borderRadius: radius.md,
              padding: spacing.lg,
            },
          ]}
        >
          <CheckCircle2 size={18} color={colors.success} strokeWidth={2.5} />
          <View style={{ flex: 1 }}>
            <Text style={[reviewStyles.statusTitle, { color: colors.success }]}>
              Ready to submit
            </Text>
            <Text style={[reviewStyles.statusDesc, { color: colors.success }]}>
              All required fields are filled in. Save as draft or publish below.
            </Text>
          </View>
        </View>
      ) : (
        <View
          style={[
            reviewStyles.statusBanner,
            {
              backgroundColor: `${colors.danger}15`,
              borderColor: `${colors.danger}30`,
              borderRadius: radius.md,
              padding: spacing.lg,
            },
          ]}
        >
          <Text style={{ color: colors.danger, fontSize: 18, fontWeight: '900' }}>
            !
          </Text>
          <View style={{ flex: 1 }}>
            <Text style={[reviewStyles.statusTitle, { color: colors.danger }]}>
              {errorCount > 0
                ? `${errorCount} issue${errorCount === 1 ? '' : 's'} to fix`
                : 'Form not yet valid'}
            </Text>
            <Text style={[reviewStyles.statusDesc, { color: colors.danger }]}>
              Go back and complete the highlighted fields before submitting.
            </Text>
          </View>
        </View>
      )}

      {/* Identity */}
      <SummaryCard
        icon={<FileText size={16} color={colors.primary} strokeWidth={2.4} />}
        title="Identity"
      >
        <Row label="Title" value={values.title} />
        <Row label="Brief" value={values.briefDescription} />
        <Row label="Category" value={values.procurementCategory} />
        <Row label="Type" value={TENDER_TYPE_LABELS[tenderType] ?? tenderType} />
        <Row
          label="Workflow"
          value={
            values.workflowType ? (
              <ProfessionalTenderWorkflowBadge
                workflowType={values.workflowType}
                size="md"
              />
            ) : null
          }
        />
        <Row
          label="Visibility"
          value={
            <View style={reviewStyles.inlineIcon}>
              {values.visibilityType === 'invite_only' ? (
                <ShieldCheck size={14} color={colors.textMuted} strokeWidth={2.2} />
              ) : (
                <Globe size={14} color={colors.textMuted} strokeWidth={2.2} />
              )}
              <Text style={[rowStyles.value, { color: colors.text }]}>
                {values.visibilityType === 'invite_only' ? 'Invite Only' : 'Public'}
              </Text>
            </View>
          }
        />
        {!!values.referenceNumber && (
          <Row label="Reference" value={values.referenceNumber} />
        )}
      </SummaryCard>

      {/* Invited Companies */}
      {values.visibilityType === 'invite_only' && (
        <SummaryCard
          icon={<Users size={16} color={colors.primary} strokeWidth={2.4} />}
          title={`Invited Companies (${invitedIds.length})`}
        >
          {invitedIds.length === 0 ? (
            <Text style={[reviewStyles.emptyNote, { color: colors.textMuted }]}>
              No companies invited
            </Text>
          ) : (
            <View style={reviewStyles.chipsRow}>
              {invitedProfiles.map((p) => (
                <View
                  key={p._id}
                  style={[
                    reviewStyles.chip,
                    {
                      backgroundColor: `${colors.primary}12`,
                      borderColor: `${colors.primary}25`,
                      borderRadius: radius.full,
                    },
                  ]}
                >
                  <Text
                    style={[reviewStyles.chipText, { color: colors.primary }]}
                    numberOfLines={1}
                  >
                    {p.name}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </SummaryCard>
      )}

      {/* Procurement */}
      <SummaryCard
        icon={<Building2 size={16} color={colors.primary} strokeWidth={2.4} />}
        title="Procurement"
      >
        <Row label="Procuring Entity" value={proc?.procuringEntity} />
        <Row
          label="Method"
          value={
            proc?.procurementMethod
              ? PROC_METHOD_LABELS[proc.procurementMethod]
              : ''
          }
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
        {(proc?.contactPerson?.name ||
          proc?.contactPerson?.email ||
          proc?.contactPerson?.phone) && (
          <View style={reviewStyles.subBlock}>
            <Text style={[reviewStyles.subHead, { color: colors.textMuted }]}>
              CONTACT
            </Text>
            {!!proc?.contactPerson?.name && (
              <View style={reviewStyles.inlineIcon}>
                <User size={13} color={colors.textMuted} strokeWidth={2.2} />
                <Text style={[rowStyles.value, { color: colors.text }]}>
                  {proc.contactPerson.name}
                </Text>
              </View>
            )}
            {!!proc?.contactPerson?.email && (
              <View style={reviewStyles.inlineIcon}>
                <Mail size={13} color={colors.textMuted} strokeWidth={2.2} />
                <Text style={[rowStyles.value, { color: colors.text }]}>
                  {proc.contactPerson.email}
                </Text>
              </View>
            )}
            {!!proc?.contactPerson?.phone && (
              <View style={reviewStyles.inlineIcon}>
                <Phone size={13} color={colors.textMuted} strokeWidth={2.2} />
                <Text style={[rowStyles.value, { color: colors.text }]}>
                  {proc.contactPerson.phone}
                </Text>
              </View>
            )}
          </View>
        )}
      </SummaryCard>

      {/* CPO */}
      {values.cpoRequired && (
        <SummaryCard
          icon={<Award size={16} color={colors.primary} strokeWidth={2.4} />}
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
            <View style={reviewStyles.subBlock}>
              <Text style={[reviewStyles.subHead, { color: colors.textMuted }]}>
                DESCRIPTION
              </Text>
              <Text style={[reviewStyles.scopeText, { color: colors.text }]}>
                {values.cpoDescription}
              </Text>
            </View>
          )}
        </SummaryCard>
      )}

      {/* Eligibility & Scope */}
      <SummaryCard
        icon={<ShieldCheck size={16} color={colors.primary} strokeWidth={2.4} />}
        title="Eligibility & Scope"
      >
        <Row
          label="Min. Experience"
          value={
            elig?.minimumExperience !== undefined && elig?.minimumExperience !== null
              ? `${elig.minimumExperience} years`
              : ''
          }
        />
        <Row
          label="Legal Registration"
          value={elig?.legalRegistrationRequired ? 'Required' : 'Not required'}
        />
        <Row
          label="Certifications"
          value={
            certs.length === 0 ? (
              ''
            ) : (
              <View style={reviewStyles.chipsRow}>
                {certs.map((c) => (
                  <View
                    key={c}
                    style={[
                      reviewStyles.chip,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        borderRadius: radius.full,
                      },
                    ]}
                  >
                    <Text style={[reviewStyles.chipText, { color: colors.text }]}>
                      {c}
                    </Text>
                  </View>
                ))}
              </View>
            )
          }
        />
        <View style={reviewStyles.subBlock}>
          <Text style={[reviewStyles.subHead, { color: colors.textMuted }]}>
            SCOPE OF WORK
          </Text>
          <Text style={[reviewStyles.scopeText, { color: colors.text }]}>
            {values.scope?.description || 'Not provided'}
          </Text>
        </View>
      </SummaryCard>

      {/* Evaluation */}
      <SummaryCard
        icon={<Award size={16} color={colors.primary} strokeWidth={2.4} />}
        title="Evaluation"
      >
        <Row
          label="Method"
          value={
            evaln?.evaluationMethod
              ? EVAL_METHOD_LABELS[evaln.evaluationMethod]
              : ''
          }
        />
        <Row
          label="Technical Weight"
          value={
            evaln?.technicalWeight !== undefined ? `${evaln.technicalWeight}%` : ''
          }
        />
        <Row
          label="Financial Weight"
          value={
            evaln?.financialWeight !== undefined ? `${evaln.financialWeight}%` : ''
          }
        />
        {!!evaln?.criteria && (
          <View style={reviewStyles.subBlock}>
            <Text style={[reviewStyles.subHead, { color: colors.textMuted }]}>
              CRITERIA
            </Text>
            <Text style={[reviewStyles.scopeText, { color: colors.text }]}>
              {evaln.criteria}
            </Text>
          </View>
        )}
      </SummaryCard>

      {/* Dates */}
      <SummaryCard
        icon={<Calendar size={16} color={colors.primary} strokeWidth={2.4} />}
        title="Dates"
      >
        <Row label="Submission Deadline" value={formatDate(values.deadline)} />
        <Row label="Bid Opening" value={formatDate(values.bidOpeningDate)} />
        <Row
          label="Clarification Deadline"
          value={formatDate(values.clarificationDeadline)}
        />
        {pbm?.enabled && (
          <View style={reviewStyles.subBlock}>
            <Text style={[reviewStyles.subHead, { color: colors.textMuted }]}>
              PRE-BID MEETING
            </Text>
            <Row label="When" value={formatDate(pbm?.date)} />
            {!!pbm?.location && (
              <View style={reviewStyles.inlineIcon}>
                <MapPin size={13} color={colors.textMuted} strokeWidth={2.2} />
                <Text style={[rowStyles.value, { color: colors.text }]}>
                  {pbm.location}
                </Text>
              </View>
            )}
            {!!pbm?.onlineLink && (
              <View style={reviewStyles.inlineIcon}>
                <Globe size={13} color={colors.textMuted} strokeWidth={2.2} />
                <Text style={[rowStyles.value, { color: colors.text }]}>
                  {pbm.onlineLink}
                </Text>
              </View>
            )}
            <Text style={[reviewStyles.emptyNote, { color: colors.textMuted }]}>
              Attendance {pbm?.mandatory ? 'mandatory' : 'optional'}
            </Text>
          </View>
        )}
      </SummaryCard>

      {/* Documents */}
      <SummaryCard
        icon={<Briefcase size={16} color={colors.primary} strokeWidth={2.4} />}
        title="Documents"
      >
        {files.length === 0 ? (
          <Text style={[reviewStyles.emptyNote, { color: colors.textMuted }]}>
            No documents attached
          </Text>
        ) : (
          <View style={{ gap: spacing.xs }}>
            {files.map((f, i) => (
              <View key={`${f.uri}-${i}`} style={reviewStyles.fileRow}>
                <FileText size={13} color={colors.textMuted} strokeWidth={2.2} />
                <Text
                  style={[reviewStyles.fileName, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {f.name}
                </Text>
              </View>
            ))}
          </View>
        )}
      </SummaryCard>

      {/* Footnote */}
      <View style={reviewStyles.footnote}>
        <Lock size={12} color={colors.textMuted} strokeWidth={2.4} />
        <Text style={[reviewStyles.footnoteText, { color: colors.textMuted }]}>
          Once published, this tender cannot be edited directly. Use the{' '}
          <Text style={{ fontWeight: '700' }}>Addendum</Text> system for any changes
          after publication.
        </Text>
      </View>
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// STYLES
// ═════════════════════════════════════════════════════════════════════════════

const cardStyles = StyleSheet.create({
  card: { borderWidth: 1, overflow: 'hidden' },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cardIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 14, fontWeight: '700' },
  cardBody: { gap: 4 },
});

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, minHeight: 22 },
  label: {
    width: 110,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    paddingTop: 2,
  },
  valueWrap: { flex: 1 },
  value: { fontSize: 13, lineHeight: 18 },
});

const reviewStyles = StyleSheet.create({
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
  },
  statusTitle: { fontSize: 13, fontWeight: '700' },
  statusDesc: { fontSize: 12, lineHeight: 16 },

  inlineIcon: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    maxWidth: 220,
  },
  chipText: { fontSize: 11, fontWeight: '600' },
  subBlock: { gap: 4, marginTop: 8 },
  subHead: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  scopeText: { fontSize: 12, lineHeight: 17 },
  emptyNote: { fontSize: 11, fontStyle: 'italic' },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fileName: { flex: 1, fontSize: 12 },
  footnote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 4,
  },
  footnoteText: { flex: 1, fontSize: 11, lineHeight: 16 },
});

export default Step5_Review;