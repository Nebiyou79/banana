// ─────────────────────────────────────────────────────────────────────────────
//  src/components/professionalTenders/TenderInfoComponents.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  Read-only info display components used by both OwnerTenderDetails and
//  BrowseTenderDetails. All share the SectionCard/InfoRow pattern from _shared.
//
//  Components:
//   • TenderProcurementInfo  — procurement.* + CPO requirement summary
//   • TenderEligibilityInfo  — eligibility.* + scope.description
//   • TenderEvaluationInfo   — evaluation.* with read-only weight bar
//   • TenderDatesInfo        — deadline + preBidMeeting (P-14 root)
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { Chip, InfoRow, SectionCard } from './_shared';
import type { ProfessionalTender } from '../../types/professionalTender';

// ═════════════════════════════════════════════════════════════════════════════
//  HELPERS
// ═════════════════════════════════════════════════════════════════════════════

const PROC_METHOD_LABELS: Record<string, string> = {
  open_tender: 'Open Tender',
  restricted:  'Restricted',
  sealed_bid:  'Sealed Bid',
  direct:      'Direct',
  framework:   'Framework',
  negotiated:  'Negotiated',
};

const EVAL_METHOD_LABELS: Record<string, string> = {
  combined:       'Combined (Technical + Financial)',
  technical_only: 'Technical Only',
  financial_only: 'Financial Only',
};

const formatMoney = (amount?: number, currency: string = 'ETB'): string | undefined => {
  if (amount === undefined || amount === null) return undefined;
  return `${amount.toLocaleString()} ${currency}`;
};

const formatDateTime = (iso?: string): string | undefined => {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return undefined;
  return d.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
};

// ═════════════════════════════════════════════════════════════════════════════
//  THEMED TEXT HELPERS
// ═════════════════════════════════════════════════════════════════════════════

const SubHead: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isDark = useThemeStore((s) => s.theme.isDark);
  return (
    <Text style={[styles.subHead, { color: isDark ? '#94A3B8' : '#64748B' }]}>
      {children}
    </Text>
  );
};

const BodyText: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => {
  const isDark = useThemeStore((s) => s.theme.isDark);
  return (
    <Text style={[styles.bodyText, { color: isDark ? '#F1F5F9' : '#0F172A' }, style]}>
      {children}
    </Text>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  TENDER PROCUREMENT INFO  (+ CPO summary nested inside)
// ═════════════════════════════════════════════════════════════════════════════

export const TenderProcurementInfo: React.FC<{ tender: ProfessionalTender }> = ({ tender }) => {
  const proc = tender.procurement;

  return (
    <View style={styles.stack}>
      <SectionCard icon="business-outline" title="Procurement">
        <InfoRow label="Procuring Entity" value={proc?.procuringEntity} />
        <InfoRow
          label="Method"
          value={proc?.procurementMethod ? PROC_METHOD_LABELS[proc.procurementMethod] : undefined}
        />
        <InfoRow label="Funding Source" value={proc?.fundingSource} />
        <InfoRow
          label="Bid Security"
          value={formatMoney(proc?.bidSecurityAmount, proc?.bidSecurityCurrency ?? 'ETB')}
        />
        {(proc?.contactPerson?.name || proc?.contactPerson?.email || proc?.contactPerson?.phone) && (
          <View style={styles.contactBlock}>
            <SubHead>CONTACT</SubHead>
            {!!proc?.contactPerson?.name && (
              <InfoRow label="Name" value={proc.contactPerson.name} />
            )}
            {!!proc?.contactPerson?.email && (
              <InfoRow label="Email" value={proc.contactPerson.email} />
            )}
            {!!proc?.contactPerson?.phone && (
              <InfoRow label="Phone" value={proc.contactPerson.phone} />
            )}
            {!!proc?.contactPerson?.position && (
              <InfoRow label="Position" value={proc.contactPerson.position} />
            )}
          </View>
        )}
      </SectionCard>

      {/* CPO subsection — only when required */}
      {tender.cpoRequired && (
        <SectionCard icon="ribbon-outline" title="CPO Requirement" accent>
          <InfoRow label="Status" value="Required" />
          <InfoRow
            label="Indicative Amount"
            value={formatMoney(
              (tender as any).cpoAmount,
              (tender as any).cpoCurrency ?? 'ETB',
            )}
          />
          {!!tender.cpoDescription && (
            <View style={styles.descBlock}>
              <SubHead>DESCRIPTION</SubHead>
              <BodyText>{tender.cpoDescription}</BodyText>
            </View>
          )}
        </SectionCard>
      )}
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  TENDER ELIGIBILITY INFO  (+ scope nested inside)
// ═════════════════════════════════════════════════════════════════════════════

export const TenderEligibilityInfo: React.FC<{ tender: ProfessionalTender }> = ({ tender }) => {
  const elig = tender.eligibility;
  const certs = elig?.requiredCertifications ?? [];
  const scope = tender.scope?.description;

  return (
    <View style={styles.stack}>
      <SectionCard icon="shield-checkmark-outline" title="Eligibility Criteria">
        <InfoRow
          label="Min. Experience"
          value={
            elig?.minimumExperience !== undefined && elig?.minimumExperience !== null
              ? `${elig.minimumExperience} years`
              : undefined
          }
        />
        <InfoRow
          label="Legal Registration"
          value={elig?.legalRegistrationRequired ? 'Required' : 'Not required'}
        />
        <InfoRow label="Certifications">
          {certs.length === 0 ? null : (
            <View style={styles.chipsRow}>
              {certs.map((c) => <Chip key={c} label={c} />)}
            </View>
          )}
        </InfoRow>
      </SectionCard>

      {!!scope && (
        <SectionCard icon="reader-outline" title="Scope of Work">
          <BodyText>{scope}</BodyText>
        </SectionCard>
      )}
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  TENDER EVALUATION INFO  (read-only weight bar)
// ═════════════════════════════════════════════════════════════════════════════

const ReadOnlyWeightBar: React.FC<{ technical: number; financial: number }> = ({
  technical,
  financial,
}) => {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const palette = isDark
    ? { trackBg: '#0F172A', techBg: '#3B82F6', finBg: '#A855F7', text: '#F1F5F9', subText: '#94A3B8' }
    : { trackBg: '#F1F5F9', techBg: '#3B82F6', finBg: '#A855F7', text: '#0F172A', subText: '#475569' };

  const safeTech = Math.max(0, Math.min(100, technical));
  const safeFin = Math.max(0, Math.min(100, financial));

  return (
    <View style={{ gap: 10 }}>
      <View style={[styles.weightBar, { backgroundColor: palette.trackBg }]}>
        <View style={[styles.weightBarFill, { width: `${safeTech}%`, backgroundColor: palette.techBg }]} />
      </View>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: palette.techBg }]} />
          <Text style={[styles.legendLabel, { color: palette.subText }]}>Technical</Text>
        </View>
        <Text style={[styles.legendValue, { color: palette.text }]}>{safeTech}%</Text>
      </View>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: palette.finBg }]} />
          <Text style={[styles.legendLabel, { color: palette.subText }]}>Financial</Text>
        </View>
        <Text style={[styles.legendValue, { color: palette.text }]}>{safeFin}%</Text>
      </View>
    </View>
  );
};

export const TenderEvaluationInfo: React.FC<{ tender: ProfessionalTender }> = ({ tender }) => {
  const evaln = tender.evaluation;
  if (!evaln) return null;

  return (
    <SectionCard icon="trophy-outline" title="Evaluation">
      <InfoRow
        label="Method"
        value={EVAL_METHOD_LABELS[evaln.evaluationMethod] ?? evaln.evaluationMethod}
      />
      <View style={{ marginTop: 4 }}>
        <ReadOnlyWeightBar
          technical={evaln.technicalWeight ?? 0}
          financial={evaln.financialWeight ?? 0}
        />
      </View>
      {!!evaln.criteria && (
        <View style={styles.descBlock}>
          <SubHead>CRITERIA</SubHead>
          <BodyText>{evaln.criteria}</BodyText>
        </View>
      )}
    </SectionCard>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  TENDER DATES INFO  (+ preBidMeeting at ROOT — P-14)
// ═════════════════════════════════════════════════════════════════════════════

export const TenderDatesInfo: React.FC<{ tender: ProfessionalTender }> = ({ tender }) => {
  const pbm = tender.preBidMeeting;

  return (
    <View style={styles.stack}>
      <SectionCard icon="calendar-outline" title="Key Dates">
        <InfoRow label="Submission Deadline" value={formatDateTime(tender.deadline)} />
        <InfoRow label="Bid Opening" value={formatDateTime(tender.bidOpeningDate)} />
        <InfoRow label="Clarification Deadline" value={formatDateTime(tender.clarificationDeadline)} />
        {!!tender.bidValidityPeriod && (
          <InfoRow label="Bid Validity" value={`${tender.bidValidityPeriod} days`} />
        )}
      </SectionCard>

      {/* P-14: preBidMeeting is at ROOT level on the tender, NOT inside procurement */}
      {!!pbm && (pbm.date || pbm.location || pbm.onlineLink) && (
        <SectionCard icon="people-outline" title="Pre-Bid Meeting">
          <InfoRow label="When" value={formatDateTime(pbm.date)} />
          <InfoRow label="Location" value={pbm.location} />
          <InfoRow label="Online Link" value={pbm.onlineLink} />
          <InfoRow
            label="Attendance"
            value={pbm.mandatory ? 'Mandatory' : 'Optional'}
          />
        </SectionCard>
      )}
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  STYLES
// ═════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  stack: { gap: 12 },

  contactBlock: { marginTop: 6, gap: 6 },
  descBlock: { marginTop: 6, gap: 4 },
  subHead: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bodyText: { fontSize: 13, lineHeight: 19 },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },

  weightBar: {
    height: 12,
    borderRadius: 999,
    overflow: 'hidden',
  },
  weightBarFill: { height: '100%' },
  legendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot:  { width: 10, height: 10, borderRadius: 999 },
  legendLabel: { fontSize: 13, fontWeight: '500' },
  legendValue: { fontSize: 14, fontWeight: '700' },
});