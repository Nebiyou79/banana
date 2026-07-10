// src/components/bids/BidForm.tsx
// 5-step bid submission wizard matching web BidForm
// Steps: Company → Technical → Financial → Security → Review
// ─────────────────────────────────────────────────────────────────────────────
// FIXED: Removed duplicate header styles
// FIXED: Simplified canProceed validation
// FIXED: Added safe currency fallback in Footer
// FIXED: Memoized StepIndicator and Footer with useMemo to prevent re-creation
// FIXED: Added RFQ document upload section in Step 4 (matching web)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useSubmitBid, useUpdateBid, BidFileEntry } from '../../hooks/useBid';
import { BidDocumentType, BidCurrency, BidFinancialLineItem } from '../../types/bid';
import { BidCoverSheetForm, CoverSheetFormValues } from './BidCoverSheetForm';
import { BidTechnicalProposalForm, TechnicalProposalFormValues } from './BidTechnicalProposalForm';
import { BidFinancialBreakdownForm, LineItemDraft, draftToLineItem, emptyDraft } from './BidFinancialBreakdownForm';
import { BidDocumentUploadSection, DocSlot, FileEntry } from './BidDocumentUploadSection';
import { BidCPOForm, CPOFormValues } from './BidCPOForm';
import { BidReviewStep } from './BidReviewStep';

// ─── Types ──────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5;

interface StepConfig {
  key: Step;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

const STEPS: StepConfig[] = [
  { key: 1, title: 'Company', icon: 'business-outline', description: 'Cover sheet & company details' },
  { key: 2, title: 'Technical', icon: 'document-text-outline', description: 'Technical proposal' },
  { key: 3, title: 'Financial', icon: 'cash-outline', description: 'Price breakdown' },
  { key: 4, title: 'Security', icon: 'shield-checkmark-outline', description: 'Bid security / CPO' },
  { key: 5, title: 'Review', icon: 'checkmark-circle-outline', description: 'Review & submit' },
];

// ─── Default document slots ─────────────────────────────────────────────────

const DOCUMENT_SLOTS: DocSlot[] = [
  { documentType: BidDocumentType.BusinessLicense, label: 'Business License', required: true, description: 'Valid business registration certificate' },
  { documentType: BidDocumentType.TechnicalProposal, label: 'Technical Proposal Doc', description: 'PDF of your technical proposal' },
  { documentType: BidDocumentType.FinancialProposal, label: 'Financial Proposal Doc', description: 'Pricing details document' },
  { documentType: BidDocumentType.FinancialBreakdown, label: 'Financial Breakdown Sheet', description: 'Detailed BOQ or price schedule' },
  { documentType: BidDocumentType.TinCertificate, label: 'TIN Certificate', description: 'Tax Identification Number certificate' },
  { documentType: BidDocumentType.VatCertificate, label: 'VAT Certificate', description: 'VAT registration certificate' },
  { documentType: BidDocumentType.TaxClearance, label: 'Tax Clearance', description: 'Tax compliance clearance' },
  { documentType: BidDocumentType.TradeRegistration, label: 'Trade Registration', description: 'Commerce registration' },
  { documentType: BidDocumentType.CompanyProfile, label: 'Company Profile', description: 'Company capabilities document' },
  { documentType: BidDocumentType.CpoDocument, label: 'CPO / Bid Security', description: 'Bid security bond document' },
];

// ─── RFQ document slot ──────────────────────────────────────────────────────

const RFQ_SLOT: DocSlot = {
  documentType: BidDocumentType.OpeningPage,
  label: 'Quote / RFQ Document',
  required: false,
  description: 'Strongly recommended — PDF or Word',
};

// ─── Component ─────────────────────────────────────────────────────────────

interface Props {
  tenderId: string;
  tenderCurrency?: BidCurrency;
  isEditMode?: boolean;
  existingBidId?: string;
  initialCoverSheet?: Partial<CoverSheetFormValues>;
  initialTechnical?: string;
  initialFinancial?: BidFinancialLineItem[];
  initialCPO?: Partial<CPOFormValues>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const BidForm: React.FC<Props> = ({
  tenderId,
  tenderCurrency = 'ETB',
  isEditMode = false,
  existingBidId,
  initialCoverSheet,
  initialTechnical,
  initialFinancial,
  initialCPO,
  onSuccess,
  onCancel,
}) => {
  const { colors, spacing, radius } = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  // ── Mutations ──────────────────────────────────────────────────────────
  const { mutate: submitBid, isPending: isSubmitting } = useSubmitBid();
  const { mutate: updateBid, isPending: isUpdating } = useUpdateBid();
  const isPending = isSubmitting || isUpdating;

  // ── Step state ─────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set());

  // ── Form data ──────────────────────────────────────────────────────────
  const [coverSheetData, setCoverSheetData] = useState<CoverSheetFormValues | null>(
    initialCoverSheet as CoverSheetFormValues | null
  );
  const [technicalData, setTechnicalData] = useState<TechnicalProposalFormValues | null>(
    initialTechnical ? { technicalProposal: initialTechnical } : null
  );
  const [financialItems, setFinancialItems] = useState<LineItemDraft[]>(() => {
    if (initialFinancial && Array.isArray(initialFinancial) && initialFinancial.length > 0) {
      return initialFinancial.map((item) => ({
        description: item.description ?? '',
        quantity: String(item.quantity ?? ''),
        unit: item.unit ?? '',
        unitPrice: String(item.unitPrice ?? ''),
        totalPrice: item.totalPrice ?? 0,
        category: (item.category as any) ?? 'other',
      }));
    }
    return [emptyDraft()];
  });
  const [cpoData, setCpoData] = useState<CPOFormValues | null>(
    initialCPO as CPOFormValues | null
  );
  const [documentEntries, setDocumentEntries] = useState<FileEntry[]>([]);

  // ── Validation state ───────────────────────────────────────────────────
  const [coverSheetValid, setCoverSheetValid] = useState(false);
  const [technicalValid, setTechnicalValid] = useState(false);
  const [financialValid, setFinancialValid] = useState(false);
  const [cpoValid, setCpoValid] = useState(false);

  // ── Progress ───────────────────────────────────────────────────────────
  const progress = ((currentStep - 1) / STEPS.length) * 100;
  const isLastStep = currentStep === 5;
  const isFirstStep = currentStep === 1;

  // ── Navigation ─────────────────────────────────────────────────────────
  const goToStep = useCallback((step: Step) => {
    setCurrentStep(step);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const handleNext = useCallback(() => {
    setCompletedSteps((prev) => new Set(prev).add(currentStep));
    if (currentStep < 5) {
      goToStep((currentStep + 1) as Step);
    }
  }, [currentStep, goToStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      goToStep((currentStep - 1) as Step);
    } else {
      onCancel?.();
    }
  }, [currentStep, goToStep, onCancel]);

  // ── Can proceed check ──────────────────────────────────────────────────
  const canProceed = useCallback((): boolean => {
    switch (currentStep) {
      case 1: return coverSheetValid;
      case 2: return technicalValid;
      case 3: return financialItems.some((item) => 
        item.description && item.description.trim().length > 0
      );
      case 4: return true; // CPO and RFQ are optional
      case 5: return true;
      default: return false;
    }
  }, [currentStep, coverSheetValid, technicalValid, financialItems]);

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    if (!coverSheetData || !technicalData) {
      Alert.alert('Error', 'Please complete all required steps.');
      return;
    }

    const bidAmount = parseFloat(coverSheetData.totalBidValue);
    
    if (isNaN(bidAmount) || bidAmount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid bid amount greater than 0.');
      return;
    }

    const currency = coverSheetData.currency || tenderCurrency;
    const cpoAmountNumber = cpoData?.cpoAmount ? parseFloat(cpoData.cpoAmount) : undefined;

    const fileEntries: BidFileEntry[] = documentEntries.map((entry) => ({
      file: entry.file,
      documentType: entry.documentType,
    }));

    const cleanFinancialItems = financialItems
      .filter((item) => item.description.trim())
      .map(draftToLineItem);

    const submitData: any = {
      bidAmount: bidAmount,
      currency: currency,
      technicalProposal: technicalData.technicalProposal,
      financialBreakdown: cleanFinancialItems,
      coverSheet: {
        companyName: coverSheetData.companyName,
        representative: coverSheetData.representative,
        authorizedRepresentative: coverSheetData.representative,
        representativeTitle: coverSheetData.representativeTitle || '',
        companyEmail: coverSheetData.companyEmail,
        companyPhone: coverSheetData.companyPhone,
        companyAddress: coverSheetData.companyAddress || '',
        tinNumber: coverSheetData.tinNumber || '',
        licenseNumber: coverSheetData.licenseNumber || '',
        totalBidValue: bidAmount,
        currency: currency,
        bidValidityPeriod: coverSheetData.bidValidityPeriod 
          ? parseInt(coverSheetData.bidValidityPeriod, 10) 
          : undefined,
        declarationAccepted: true,
        declarationAcceptedAt: new Date().toISOString(),
      },
    };

    if (cpoData?.cpoNumber?.trim()) {
      submitData.bidSecurityType = cpoData.bidSecurityType;
      submitData.cpoNumber = cpoData.cpoNumber;
      if (cpoAmountNumber !== undefined) {
        submitData.cpoAmount = cpoAmountNumber;
      }
      submitData.cpoCurrency = cpoData.cpoCurrency || currency;
      submitData.cpoIssuingBank = cpoData.cpoIssuingBank || '';
      submitData.cpoIssueDate = cpoData.cpoIssueDate || undefined;
      submitData.cpoExpiryDate = cpoData.cpoExpiryDate || undefined;
    }

    if (isEditMode && existingBidId) {
      updateBid(
        { tenderId, bidId: existingBidId, data: submitData, files: fileEntries },
        { 
          onSuccess: () => {
            Alert.alert('Success', 'Bid updated successfully!');
            onSuccess?.();
          },
          onError: (error: any) => {
            const msg = error?.response?.data?.error || error?.message || 'Failed to update bid';
            if (error?.response?.data?.fieldErrors) {
              const fields = Object.entries(error.response.data.fieldErrors)
                .map(([f, e]) => `• ${f}: ${e}`)
                .join('\n');
              Alert.alert('Cover Sheet Validation Failed', fields);
              return;
            }
            Alert.alert('Error', msg);
          }
        }
      );
    } else {
      submitBid(
        { tenderId, data: submitData, files: fileEntries },
        { 
          onSuccess: () => {
            Alert.alert('Success', 'Bid submitted successfully!');
            onSuccess?.();
          },
          onError: (error: any) => {
            const msg = error?.response?.data?.error || error?.message || 'Failed to submit bid';
            if (error?.response?.data?.fieldErrors) {
              const fields = Object.entries(error.response.data.fieldErrors)
                .map(([f, e]) => `• ${f}: ${e}`)
                .join('\n');
              Alert.alert('Cover Sheet Validation Failed', fields);
              return;
            }
            Alert.alert('Error', msg);
          }
        }
      );
    }
  }, [
    coverSheetData, technicalData, financialItems, cpoData,
    documentEntries, tenderId, isEditMode, existingBidId, tenderCurrency,
    submitBid, updateBid, onSuccess,
  ]);

  // ── StepIndicator ──────────────────────────────────────────────────────
  const stepIndicatorNode = useMemo(() => (
    <View style={[stepStyles.container, { backgroundColor: colors.bgCard }]}>
      <View style={[stepStyles.progressTrack, { backgroundColor: colors.border }]}>
        <View
          style={[stepStyles.progressFill, {
            backgroundColor: colors.primary,
            width: `${progress}%`,
          }]}
        />
      </View>

      <View style={stepStyles.dotsRow}>
        {STEPS.map((step) => {
          const isActive = step.key === currentStep;
          const isDone = completedSteps.has(step.key) && step.key < currentStep;
          const isPast = step.key < currentStep;

          return (
            <Pressable
              key={step.key}
              onPress={() => {
                if (completedSteps.has(step.key) || step.key < currentStep) {
                  goToStep(step.key);
                }
              }}
              style={stepStyles.dotWrap}
              accessibilityLabel={`Step ${step.key}: ${step.title}`}
            >
              <View
                style={[stepStyles.dot, {
                  backgroundColor: isActive ? colors.primary : isDone ? colors.success : colors.surface,
                  borderColor: isActive ? colors.primary : isDone ? colors.success : colors.border,
                }]}
              >
                {isDone ? (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                ) : (
                  <Text style={[stepStyles.dotText, {
                    color: isActive ? colors.textInverse : isPast ? colors.textMuted : colors.textMuted,
                  }]}>
                    {step.key}
                  </Text>
                )}
              </View>
              <Text
                style={[stepStyles.dotLabel, {
                  color: isActive ? colors.primary : isPast ? colors.text : colors.textMuted,
                  fontWeight: isActive ? '700' : '500',
                }]}
                numberOfLines={1}
              >
                {step.title}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[stepStyles.description, { color: colors.textMuted }]}>
        {STEPS[currentStep - 1].description}
      </Text>
    </View>
  ), [colors, progress, currentStep, completedSteps, goToStep]);

  // ── Footer ─────────────────────────────────────────────────────────────
  const footerNode = useMemo(() => {
    const totalAmount = financialItems.reduce((sum, item) => {
      const itemTotal = typeof item.totalPrice === 'number' && !isNaN(item.totalPrice) 
        ? item.totalPrice : 0;
      return sum + itemTotal;
    }, 0);

    const currency = coverSheetData?.currency ?? tenderCurrency;

    return (
      <View style={[footerStyles.container, {
        backgroundColor: colors.bgCard,
        borderTopColor: colors.border,
        paddingBottom: Platform.OS === 'ios' ? 20 : spacing.md,
      }]}>
        {currentStep >= 3 && totalAmount > 0 && (
          <View style={[footerStyles.totalRow, { backgroundColor: colors.primaryBg }]}>
            <Text style={[footerStyles.totalLabel, { color: colors.textMuted }]}>
              Total Bid Value
            </Text>
            <Text style={[footerStyles.totalAmount, { color: colors.primary }]}>
              {currency}{' '}
              {totalAmount.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>
        )}

        <View style={footerStyles.buttonsRow}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              footerStyles.backBtn,
              { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="arrow-back" size={18} color={colors.text} />
            <Text style={[footerStyles.backText, { color: colors.text }]}>
              {isFirstStep ? 'Cancel' : 'Back'}
            </Text>
          </Pressable>

          {isLastStep ? (
            <Pressable
              onPress={handleSubmit}
              disabled={isPending || !canProceed()}
              style={({ pressed }) => [
                footerStyles.submitBtn,
                { backgroundColor: colors.primary, opacity: pressed || isPending ? 0.7 : 1 },
              ]}
            >
              {isPending ? (
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={18} color={colors.textInverse} />
                  <Text style={[footerStyles.submitText, { color: colors.textInverse }]}>
                    {isEditMode ? 'Update Bid' : 'Submit Bid'}
                  </Text>
                </>
              )}
            </Pressable>
          ) : (
            <Pressable
              onPress={handleNext}
              disabled={!canProceed()}
              style={({ pressed }) => [
                footerStyles.nextBtn,
                { backgroundColor: canProceed() ? colors.primary : colors.textDisabled, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={[footerStyles.nextText, { color: canProceed() ? colors.textInverse : colors.textMuted }]}>
                Continue
              </Text>
              <Ionicons name="arrow-forward" size={18} color={canProceed() ? colors.textInverse : colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>
    );
  }, [
    financialItems, coverSheetData, tenderCurrency, colors, spacing,
    currentStep, handleBack, handleSubmit, handleNext,
    isFirstStep, isLastStep, isPending, canProceed, isEditMode,
  ]);

  // ── Render step content ────────────────────────────────────────────────
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BidCoverSheetForm
            onValidChange={setCoverSheetValid}
            onDataChange={setCoverSheetData}
            initialValues={coverSheetData}
            tenderCurrency={tenderCurrency}
          />
        );
      case 2:
        return (
          <BidTechnicalProposalForm
            onValidChange={setTechnicalValid}
            onDataChange={setTechnicalData}
            initialValue={technicalData?.technicalProposal}
          />
        );
      case 3:
        return (
          <View style={{ gap: spacing.lg }}>
            <BidFinancialBreakdownForm
              items={financialItems}
              onChange={setFinancialItems}
              currency={coverSheetData?.currency ?? tenderCurrency}
            />
            <BidDocumentUploadSection
              slots={DOCUMENT_SLOTS}
              entries={documentEntries}
              onAdd={(entry) =>
                setDocumentEntries((prev) => {
                  const filtered = prev.filter((e) => e.documentType !== entry.documentType);
                  return [...filtered, entry];
                })
              }
              onRemove={(type) =>
                setDocumentEntries((prev) => prev.filter((e) => e.documentType !== type))
              }
            />
          </View>
        );
      case 4:
        return (
          <View style={{ gap: spacing.lg }}>
            {/* CPO / Bid Security Section */}
            <BidCPOForm
              onValidChange={setCpoValid}
              onDataChange={setCpoData}
              initialValues={cpoData}
              currency={coverSheetData?.currency ?? tenderCurrency}
            />

            {/* ═══ RFQ DOCUMENT SECTION (matching web) ═══ */}
            <View style={[rfqStyles.card, {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
              borderRadius: radius.xl,
            }]}>
              <View style={[rfqStyles.header, {
                backgroundColor: colors.surface,
                borderBottomColor: colors.border,
              }]}>
                <Ionicons name="document-text-outline" size={16} color={colors.primary} />
                <Text style={[rfqStyles.title, { color: colors.text }]}>
                  Request for Quote (RFQ)
                </Text>
              </View>

              <View style={rfqStyles.body}>
                <Text style={[rfqStyles.hint, { color: colors.textMuted }]}>
                  Upload your official quotation document. This will be downloadable by the tender owner.
                </Text>

                <BidDocumentUploadSection
                  slots={[RFQ_SLOT]}
                  entries={documentEntries.filter(e => e.documentType === BidDocumentType.OpeningPage)}
                  onAdd={(entry) =>
                    setDocumentEntries((prev) => {
                      const filtered = prev.filter((e) => e.documentType !== entry.documentType);
                      return [...filtered, entry];
                    })
                  }
                  onRemove={(type) =>
                    setDocumentEntries((prev) => prev.filter((e) => e.documentType !== type))
                  }
                />
              </View>
            </View>
            {/* ═══ END RFQ SECTION ═══ */}
          </View>
        );
      case 5:
        return (
          <BidReviewStep
            coverSheet={coverSheetData}
            technical={technicalData}
            financial={financialItems}
            cpo={cpoData}
            documents={documentEntries}
            currency={coverSheetData?.currency ?? tenderCurrency}
          />
        );
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {stepIndicatorNode}

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>

      {footerNode}
    </KeyboardAvoidingView>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
});

const stepStyles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingVertical: 16, gap: 12 },
  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  dotsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dotWrap: { alignItems: 'center', gap: 6, flex: 1 },
  dot: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dotText: { fontSize: 13, fontWeight: '700' },
  dotLabel: { fontSize: 10, textAlign: 'center' },
  description: { fontSize: 12, textAlign: 'center', marginTop: 2 },
});

const footerStyles = StyleSheet.create({
  container: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 20, paddingTop: 12, gap: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  totalLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  totalAmount: { fontSize: 18, fontWeight: '800' },
  buttonsRow: { flexDirection: 'row', gap: 12 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, borderWidth: 1, minHeight: 52 },
  backText: { fontSize: 15, fontWeight: '600' },
  nextBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 14, minHeight: 52 },
  nextText: { fontSize: 15, fontWeight: '700' },
  submitBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, minHeight: 52 },
  submitText: { fontSize: 15, fontWeight: '700' },
});

// ─── RFQ Section Styles ──────────────────────────────────────────────────────

const rfqStyles = StyleSheet.create({
  card: { borderWidth: 1, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  title: { fontSize: 15, fontWeight: '800' },
  body: { padding: 16, gap: 12 },
  hint: { fontSize: 13, lineHeight: 19 },
});

export default BidForm;