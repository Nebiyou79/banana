// src/screens/company/bids/SubmitBidScreen.tsx
//
// CREATE mode: no existing bid → fresh form, header 'Submit Bid'
// UPDATE mode: bid exists + status='submitted' → pre-populate form, header 'Update Bid'
// REDIRECT: bid exists + status !== 'submitted' → navigate to MyBidDetailScreen
//
// Layout: KeyboardAwareScrollView → SealedBidBanner → Section cards in order:
//   1. Cover Sheet  2. Technical Proposal  3. Financial Breakdown  4. Documents
// Sticky bottom bar: total amount preview + Submit/Update CTA.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';

import { useThemeStore } from '../../../store/themeStore';
import { useGetMyBid, useSubmitBid, useUpdateBid } from '../../../hooks/useBid';
import { useProfessionalTender } from '../../../hooks/useProfessionalTender';
import SealedBidBanner from '../../../components/professionalTenders/SealedBidBanner';
import { BidCoverSheetForm, CoverSheetFormValues } from '../../../components/bids/BidCoverSheetForm';
import { BidTechnicalProposalForm, TechnicalProposalFormValues } from '../../../components/bids/BidTechnicalProposalForm';
import {
  BidFinancialBreakdownForm, LineItemDraft, draftToLineItem, lineItemToDraft, emptyDraft,
} from '../../../components/bids/BidFinancialBreakdownForm';
import { BidDocumentUploadSection, FileEntry } from '../../../components/bids/BidDocumentUploadSection';
import { BidStatus, BidCurrency, BidDocumentType } from '../../../types/bid';

// ── Route params ──────────────────────────────────────────────────────────────

interface RouteParams {
  tenderId: string;
}

// ── Form types ────────────────────────────────────────────────────────────────

// Combined form — react-hook-form manages coverSheet + technical; breakdown + docs are local state
type CoverSheetValues = CoverSheetFormValues;
type TechnicalValues  = TechnicalProposalFormValues;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const EMPTY_COVER: CoverSheetValues = {
  companyName:          '',
  representative:       '',
  representativeTitle:  '',
  companyEmail:         '',
  companyPhone:         '',
  companyAddress:       '',
  tinNumber:            '',
  licenseNumber:        '',
  totalBidValue:        '',
  currency:             'ETB' as BidCurrency,
  bidValidityPeriod:    '',
  declarationAccepted:  false,
};

const EMPTY_TECH: TechnicalValues = { technicalProposal: '' };

// ── Component ─────────────────────────────────────────────────────────────────

const SubmitBidScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { tenderId } = route.params as RouteParams;

  const isDark = useThemeStore((s) => s.theme.isDark);

  const palette = {
    bg:            isDark ? '#0F172A' : '#F8FAFC',
    card:          isDark ? '#1E293B' : '#FFFFFF',
    border:        isDark ? '#334155' : '#E2E8F0',
    text:          isDark ? '#F1F5F9' : '#0F172A',
    muted:         isDark ? '#94A3B8' : '#64748B',
    headerBg:      isDark ? '#1E293B' : '#FFFFFF',
    headerBorder:  isDark ? '#334155' : '#E2E8F0',
    accent:        '#F1BB03',
    accentDark:    '#0A2540',
    primary:       '#0A2540',
    primaryFg:     '#FFFFFF',
    required:      '#EF4444',
    bidNumBg:      isDark ? '#162032' : '#EFF6FF',
    bidNumBorder:  isDark ? '#1E40AF' : '#BFDBFE',
    bidNumText:    isDark ? '#93C5FD' : '#1E40AF',
    bottomBar:     isDark ? '#1E293B' : '#FFFFFF',
    bottomBorder:  isDark ? '#334155' : '#E2E8F0',
    amountBg:      isDark ? '#0F172A' : '#F8FAFC',
    amountBorder:  isDark ? '#334155' : '#E2E8F0',
    amountText:    isDark ? '#F1BB03' : '#0A2540',
    disabledBg:    isDark ? '#334155' : '#CBD5E1',
  };

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: tender, isLoading: tenderLoading } = useProfessionalTender(tenderId);
  const { data: existingBid, hasBid, isLoading: bidLoading } = useGetMyBid(tenderId);

  // Determine mode
  const isUpdateMode = hasBid && existingBid?.status === BidStatus.Submitted;
  const isLoading = tenderLoading || bidLoading;

  // ── Redirect if bid exists but not submittable ─────────────────────────────
  useEffect(() => {
    if (!bidLoading && hasBid && existingBid && existingBid.status !== BidStatus.Submitted) {
      navigation.replace('MyBidDetail', {
        tenderId,
        bidId: existingBid._id,
      });
    }
  }, [bidLoading, hasBid, existingBid, tenderId, navigation]);

  // ── react-hook-form ────────────────────────────────────────────────────────
  const coverForm = useForm<CoverSheetValues>({ defaultValues: EMPTY_COVER });
  const techForm  = useForm<TechnicalValues>({ defaultValues: EMPTY_TECH });

  // ── Local state for breakdown + documents ──────────────────────────────────
  const [lineItems, setLineItems] = useState<LineItemDraft[]>([emptyDraft()]);
  const [docEntries, setDocEntries] = useState<FileEntry[]>([]);
  const [breakdownError, setBreakdownError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  // ── Populate form if in update mode ───────────────────────────────────────
  const populated = useRef(false);
  useEffect(() => {
    if (!existingBid || !isUpdateMode || populated.current) return;
    populated.current = true;

    const cs = existingBid.coverSheet;
    coverForm.reset({
      companyName:         cs.companyName ?? '',
      representative:      cs.representative ?? '',
      representativeTitle: cs.representativeTitle ?? '',
      companyEmail:        cs.companyEmail ?? '',
      companyPhone:        cs.companyPhone ?? '',
      companyAddress:      cs.companyAddress ?? '',
      tinNumber:           cs.tinNumber ?? '',
      licenseNumber:       cs.licenseNumber ?? '',
      totalBidValue:       String(cs.totalBidValue ?? ''),
      currency:            cs.currency ?? 'ETB',
      bidValidityPeriod:   String(cs.bidValidityPeriod ?? ''),
      declarationAccepted: cs.declarationAccepted ?? false,
    });

    techForm.reset({
      technicalProposal: existingBid.technicalProposal ?? '',
    });

    if (existingBid.financialBreakdown?.length) {
      setLineItems(existingBid.financialBreakdown.map(lineItemToDraft));
    }
    // Note: existing files are not pre-populated (re-upload if needed)
  }, [existingBid, isUpdateMode, coverForm, techForm]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const { mutate: submitBid } = useSubmitBid();
  const { mutate: updateBid } = useUpdateBid();

  // ── Derived amounts ────────────────────────────────────────────────────────
  const watchedBidValue = parseFloat(coverForm.watch('totalBidValue') || '0') || 0;
  const watchedCurrency = coverForm.watch('currency');
  const grandTotal = lineItems.reduce((s, r) => s + (r.totalPrice || 0), 0);
  const displayTotal = grandTotal > 0 ? grandTotal : watchedBidValue;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAddDoc = useCallback((entry: FileEntry) => {
    setDocEntries((prev) => {
      const filtered = prev.filter((e) => e.documentType !== entry.documentType);
      return [...filtered, entry];
    });
  }, []);

  const handleRemoveDoc = useCallback((type: BidDocumentType) => {
    setDocEntries((prev) => prev.filter((e) => e.documentType !== type));
  }, []);

  const handleSubmit = useCallback(async () => {
    // Trigger validation on both sub-forms simultaneously
    const [coverValid, techValid] = await Promise.all([
      coverForm.trigger(),
      techForm.trigger(),
    ]);

    // Validate financial breakdown
    const validRows = lineItems.filter((r) => r.description.trim().length > 0);
    if (validRows.length === 0) {
      setBreakdownError('At least one line item with a description is required');
      return;
    }
    setBreakdownError(undefined);

    if (!coverValid || !techValid) {
      Alert.alert('Incomplete Form', 'Please fix the highlighted errors before submitting.');
      return;
    }

    const coverValues = coverForm.getValues();
    const techValues  = techForm.getValues();

    const payload = {
      coverSheet: {
        companyName:          coverValues.companyName,
        representative:       coverValues.representative,
        representativeTitle:  coverValues.representativeTitle || undefined,
        companyEmail:         coverValues.companyEmail,
        companyPhone:         coverValues.companyPhone,
        companyAddress:       coverValues.companyAddress || undefined,
        tinNumber:            coverValues.tinNumber || undefined,
        licenseNumber:        coverValues.licenseNumber || undefined,
        totalBidValue:        parseFloat(coverValues.totalBidValue) || 0,
        currency:             coverValues.currency,
        bidValidityPeriod:    coverValues.bidValidityPeriod ? parseInt(coverValues.bidValidityPeriod) : undefined,
        declarationAccepted:  coverValues.declarationAccepted,
        declarationAcceptedAt: new Date().toISOString(),
      },
      technicalProposal: techValues.technicalProposal || undefined,
      financialBreakdown: validRows.map(draftToLineItem),
      currency: coverValues.currency,
    };

    setSubmitting(true);

    if (isUpdateMode && existingBid) {
      updateBid(
        { tenderId, bidId: existingBid._id, data: payload, files: docEntries },
        {
          onSuccess: () => {
            setSubmitting(false);
            navigation.replace('MyBidDetail', { tenderId, bidId: existingBid._id });
          },
          onError: () => setSubmitting(false),
        },
      );
    } else {
      submitBid(
        { tenderId, data: payload, files: docEntries },
        {
          onSuccess: (newBid) => {
            setSubmitting(false);
            navigation.replace('MyBidDetail', {
              tenderId,
              bidId: (newBid as any)?._id ?? '',
            });
          },
          onError: () => setSubmitting(false),
        },
      );
    }
  }, [
    coverForm, techForm, lineItems, docEntries,
    isUpdateMode, existingBid, tenderId, submitBid, updateBid, navigation,
  ]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[styles.fullCenter, { backgroundColor: palette.bg }]}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const isSealed = tender?.workflowType === 'closed';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.bg }]} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={88}
      >
        {/* ── Custom header ── */}
        <View style={[styles.header, { backgroundColor: palette.headerBg, borderBottomColor: palette.headerBorder }]}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={22} color={palette.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: palette.text }]}>
              {isUpdateMode ? 'Update Bid' : 'Submit Bid'}
            </Text>
            {!!tender?.referenceNumber && (
              <Text style={[styles.headerSub, { color: palette.muted }]} numberOfLines={1}>
                {tender.referenceNumber}
              </Text>
            )}
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.scrollContent, { backgroundColor: palette.bg }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Sealed bid banner ── */}
          {isSealed && tender && (
            <SealedBidBanner
              workflowType={tender.workflowType}
              status={tender.status}
              isRevealed={false}
              deadline={tender.deadline}
              isOwner={false}
            />
          )}

          {/* ── Bid number banner (update mode) ── */}
          {isUpdateMode && existingBid?.bidNumber && (
            <View style={[styles.bidNumBanner, { backgroundColor: palette.bidNumBg, borderColor: palette.bidNumBorder }]}>
              <Ionicons name="document-text-outline" size={14} color={palette.bidNumText} />
              <Text style={[styles.bidNumLabel, { color: palette.bidNumText }]}>Bid Number</Text>
              <Text style={[styles.bidNum, { color: palette.bidNumText }]}>
                {existingBid.bidNumber}
              </Text>
            </View>
          )}

          {/* ── Tender title context ── */}
          {tender && (
            <View style={[styles.tenderContext, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <Text style={[styles.tenderLabel, { color: palette.muted }]}>Submitting for</Text>
              <Text style={[styles.tenderTitle, { color: palette.text }]} numberOfLines={2}>
                {tender.title}
              </Text>
            </View>
          )}

          {/* ── Section 1: Cover Sheet ── */}
          <BidCoverSheetForm
            control={coverForm.control}
            errors={coverForm.formState.errors}
            setValue={coverForm.setValue}
          />

          {/* ── Section 2: Technical Proposal ── */}
          <BidTechnicalProposalForm
            control={techForm.control}
            errors={techForm.formState.errors}
          />

          {/* ── Section 3: Financial Breakdown ── */}
          <BidFinancialBreakdownForm
            items={lineItems}
            onChange={setLineItems}
            currency={watchedCurrency}
            error={breakdownError}
          />

          {/* ── Section 4: Documents ── */}
          <BidDocumentUploadSection
            entries={docEntries}
            onAdd={handleAddDoc}
            onRemove={handleRemoveDoc}
          />

          {/* Bottom padding for sticky bar */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* ── Sticky bottom bar ── */}
        <View style={[styles.bottomBar, { backgroundColor: palette.bottomBar, borderTopColor: palette.bottomBorder }]}>
          {/* Amount preview */}
          <View style={[styles.amountPreview, { backgroundColor: palette.amountBg, borderColor: palette.amountBorder }]}>
            <Text style={[styles.amountLabel, { color: palette.muted }]}>Total</Text>
            <Text style={[styles.amountValue, { color: palette.amountText }]} numberOfLines={1}>
              {displayTotal > 0
                ? formatCurrency(displayTotal, watchedCurrency)
                : '—'}
            </Text>
          </View>

          {/* Submit / Update button */}
          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={({ pressed }) => [
              styles.submitBtn,
              {
                backgroundColor: submitting ? palette.disabledBg : palette.primary,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={isUpdateMode ? 'Update bid' : 'Submit bid'}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons
                  name={isUpdateMode ? 'refresh-circle-outline' : 'paper-plane-outline'}
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.submitBtnText}>
                  {isUpdateMode ? 'Update Bid' : 'Submit Bid'}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  fullCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 11,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },

  scrollContent: {
    padding: 14,
    gap: 14,
  },

  // ── Bid number banner
  bidNumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  bidNumLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    flex: 1,
  },
  bidNum: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },

  // ── Tender context
  tenderContext: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 3,
  },
  tenderLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  tenderTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },

  // ── Bottom bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  amountPreview: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 1,
    minWidth: 120,
  },
  amountLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  submitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    minHeight: 48,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});

export default SubmitBidScreen;
