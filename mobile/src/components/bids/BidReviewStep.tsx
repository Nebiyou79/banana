// src/components/bids/BidReviewStep.tsx
// Review step showing summary of all previous steps before submission
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { BidCurrency } from '../../types/bid';
import { CoverSheetFormValues } from './BidCoverSheetForm';
import { TechnicalProposalFormValues } from './BidTechnicalProposalForm';
import { LineItemDraft } from './BidFinancialBreakdownForm';
import { CPOFormValues } from './BidCPOForm';
import { FileEntry } from './BidDocumentUploadSection';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Props {
  coverSheet: CoverSheetFormValues | null;
  technical: TechnicalProposalFormValues | null;
  financial: LineItemDraft[];
  cpo: CPOFormValues | null;
  documents: FileEntry[];
  currency: BidCurrency;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtCurrency(value: number, currency: BidCurrency): string {
  return `${currency} ${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Section component ──────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  status: 'complete' | 'incomplete' | 'skipped';
  children: React.ReactNode;
  colors: ReturnType<typeof useTheme>['colors'];
}

const Section: React.FC<SectionProps> = ({ title, icon, status, children, colors }) => {
  const statusConfig = {
    complete: { bg: colors.successBg, color: colors.success, label: 'Complete' },
    incomplete: { bg: colors.warningBg, color: colors.warning, label: 'Incomplete' },
    skipped: { bg: colors.surface, color: colors.textMuted, label: 'Skipped' },
  }[status];

  return (
    <View style={[styles.section, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <Ionicons name={icon} size={18} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
          <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
        </View>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
};

// ─── Info row component ─────────────────────────────────────────────────────

const InfoRow: React.FC<{ label: string; value: string; colors: ReturnType<typeof useTheme>['colors'] }> = ({
  label,
  value,
  colors,
}) => (
  <View style={styles.infoRow}>
    <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
    <Text style={[styles.infoValue, { color: colors.text }]}>{value || '—'}</Text>
  </View>
);

// ─── Main component ─────────────────────────────────────────────────────────

export const BidReviewStep: React.FC<Props> = ({
  coverSheet,
  technical,
  financial,
  cpo,
  documents,
  currency,
}) => {
  const { colors, spacing } = useTheme();

  const financialTotal = financial
    .filter((item) => item.description.trim())
    .reduce((sum, item) => sum + item.totalPrice, 0);

  const documentTypes: Record<string, string> = {
    business_license: 'Business License',
    technical_proposal: 'Technical Proposal',
    financial_proposal: 'Financial Proposal',
    financial_breakdown: 'Financial Breakdown',
    tin_certificate: 'TIN Certificate',
    vat_certificate: 'VAT Certificate',
    tax_clearance: 'Tax Clearance',
    trade_registration: 'Trade Registration',
    company_profile: 'Company Profile',
    cpo_document: 'CPO Document',
  };

  return (
    <ScrollView style={{ gap: spacing.lg }} showsVerticalScrollIndicator={false}>
      {/* Company */}
      <Section title="Company Details" icon="business-outline" status={coverSheet ? 'complete' : 'incomplete'} colors={colors}>
        {coverSheet ? (
          <>
            <InfoRow label="Company Name" value={coverSheet.companyName} colors={colors} />
            <InfoRow label="Representative" value={coverSheet.representative} colors={colors} />
            {coverSheet.representativeTitle ? (
              <InfoRow label="Title" value={coverSheet.representativeTitle} colors={colors} />
            ) : null}
            <InfoRow label="Email" value={coverSheet.companyEmail} colors={colors} />
            <InfoRow label="Phone" value={coverSheet.companyPhone} colors={colors} />
            {coverSheet.companyAddress ? (
              <InfoRow label="Address" value={coverSheet.companyAddress} colors={colors} />
            ) : null}
            {coverSheet.tinNumber ? (
              <InfoRow label="TIN" value={coverSheet.tinNumber} colors={colors} />
            ) : null}
            {coverSheet.licenseNumber ? (
              <InfoRow label="License" value={coverSheet.licenseNumber} colors={colors} />
            ) : null}
            <View style={[styles.highlightRow, { backgroundColor: colors.primaryBg }]}>
              <Text style={[styles.highlightLabel, { color: colors.textMuted }]}>Total Bid Value</Text>
              <Text style={[styles.highlightValue, { color: colors.primary }]}>
                {coverSheet.currency} {parseFloat(coverSheet.totalBidValue || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            {coverSheet.bidValidityPeriod ? (
              <InfoRow label="Bid Validity" value={`${coverSheet.bidValidityPeriod} days`} colors={colors} />
            ) : null}
            <View style={[styles.declarationRow, { backgroundColor: coverSheet.declarationAccepted ? colors.successBg : colors.dangerBg }]}>
              <Ionicons
                name={coverSheet.declarationAccepted ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={coverSheet.declarationAccepted ? colors.success : colors.danger}
              />
              <Text style={{ color: coverSheet.declarationAccepted ? colors.success : colors.danger, fontSize: 12, fontWeight: '600' }}>
                {coverSheet.declarationAccepted ? 'Declaration accepted' : 'Declaration not accepted'}
              </Text>
            </View>
          </>
        ) : (
          <Text style={[styles.missingText, { color: colors.textMuted }]}>Company details not completed.</Text>
        )}
      </Section>

      {/* Technical */}
      <Section title="Technical Proposal" icon="document-text-outline" status={technical?.technicalProposal ? 'complete' : 'incomplete'} colors={colors}>
        {technical?.technicalProposal ? (
          <View style={[styles.proposalBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.proposalText, { color: colors.text }]} numberOfLines={8}>
              {technical.technicalProposal}
            </Text>
          </View>
        ) : (
          <Text style={[styles.missingText, { color: colors.textMuted }]}>Technical proposal not provided.</Text>
        )}
      </Section>

      {/* Financial */}
      <Section
        title="Financial Breakdown"
        icon="cash-outline"
        status={financial.some((f) => f.description.trim()) ? 'complete' : 'incomplete'}
        colors={colors}
      >
        {financial.some((f) => f.description.trim()) ? (
          <>
            {financial.filter((f) => f.description.trim()).map((item, idx) => (
              <View key={idx} style={[styles.finRow, { borderBottomColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.finDesc, { color: colors.text }]}>{item.description}</Text>
                  <Text style={[styles.finMeta, { color: colors.textMuted }]}>
                    {item.quantity} × {item.unit} @ {item.unitPrice}
                  </Text>
                </View>
                <Text style={[styles.finTotal, { color: colors.text }]}>
                  {fmtCurrency(item.totalPrice, currency)}
                </Text>
              </View>
            ))}
            <View style={[styles.highlightRow, { backgroundColor: colors.primaryBg, marginTop: 8 }]}>
              <Text style={[styles.highlightLabel, { color: colors.textMuted }]}>Grand Total</Text>
              <Text style={[styles.highlightValue, { color: colors.primary }]}>
                {fmtCurrency(financialTotal, currency)}
              </Text>
            </View>
          </>
        ) : (
          <Text style={[styles.missingText, { color: colors.textMuted }]}>No line items added.</Text>
        )}
      </Section>

      {/* CPO / Security */}
      <Section title="Bid Security" icon="shield-checkmark-outline" status={cpo?.cpoNumber ? 'complete' : 'skipped'} colors={colors}>
        {cpo?.cpoNumber ? (
          <>
            <InfoRow label="Type" value={cpo.bidSecurityType?.replace('_', ' ') ?? '—'} colors={colors} />
            <InfoRow label="Reference" value={cpo.cpoNumber} colors={colors} />
            <InfoRow label="Amount" value={cpo.cpoAmount ? `${cpo.cpoCurrency} ${parseFloat(cpo.cpoAmount).toLocaleString()}` : '—'} colors={colors} />
            {cpo.cpoIssuingBank ? <InfoRow label="Issuer" value={cpo.cpoIssuingBank} colors={colors} /> : null}
          </>
        ) : (
          <Text style={[styles.missingText, { color: colors.textMuted }]}>No bid security details provided (optional).</Text>
        )}
      </Section>

      {/* Documents */}
      <Section
        title="Attached Documents"
        icon="attach-outline"
        status={documents.length > 0 ? 'complete' : 'incomplete'}
        colors={colors}
      >
        {documents.length > 0 ? (
          documents.map((entry, idx) => (
            <View key={idx} style={[styles.docRow, { borderBottomColor: colors.border }]}>
              <Ionicons name="document-attach-outline" size={18} color={colors.success} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.docName, { color: colors.text }]} numberOfLines={1}>
                  {entry.pickedFile.name}
                </Text>
                <Text style={[styles.docMeta, { color: colors.textMuted }]}>
                  {documentTypes[entry.documentType] || entry.documentType} · {formatBytes(entry.pickedFile.size)}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={[styles.missingText, { color: colors.textMuted }]}>No documents attached.</Text>
        )}
      </Section>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  section: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  sectionBody: {
    padding: 16,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(148,163,184,0.15)',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  highlightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  highlightLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  highlightValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  declarationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  proposalBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  proposalText: {
    fontSize: 13,
    lineHeight: 19,
  },
  finRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  finDesc: {
    fontSize: 13,
    fontWeight: '600',
  },
  finMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  finTotal: {
    fontSize: 13,
    fontWeight: '700',
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  docName: {
    fontSize: 13,
    fontWeight: '600',
  },
  docMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  missingText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
});

export default BidReviewStep;