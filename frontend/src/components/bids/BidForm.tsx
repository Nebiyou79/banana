/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/bids/BidForm.tsx
// ══════════════════════════════════════════════════════════════════════
// FIXES IN THIS VERSION
// ══════════════════════════════════════════════════════════════════════
//  FIX-F1  CPO inputs lose focus after every keystroke.
//          Root cause: CPOFields was a function component defined INSIDE
//          renderStep4's closure, so React recreated the component type
//          on every render and unmounted/remounted it — wiping focus.
//          Solution: hoist CPOFields to module level and pass all needed
//          values as props so it is a stable reference.
//
//  FIX-F2  Empty financial breakdown rows (blank description) crash the
//          backend Mongoose validation.
//          Solution: filter out blank items before submit AND add a UI
//          guard so FinancialBreakdownTable can't produce blank rows.
//
//  FIX-F3  Review step (Step 5) now shows every file name and type that
//          will be submitted, so the user can verify before hitting Submit.
//
//  FIX-F4  Files cleared + form reset on successful submission (BUG-4b).
//
//  BUG-C1/C3/M2/M4/L1 fixes from prior version are all preserved.
// ══════════════════════════════════════════════════════════════════════

import React, { useCallback, useState } from 'react';
import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import { useSubmitBid, useUpdateBid } from '@/hooks/useBid';
import type { ProfessionalTender } from '@/types/tender.types';
import type {
  Bid,
  BidCoverSheet,
  BidCurrency,
  BidDocumentType,
  FinancialBreakdown,
  SubmitBidData,
} from '@/services/bidService';
import FinancialBreakdownTable from './FinancialBreakdownTable';
import FileUploadRow, { FileEntry } from './FileUploadRow';

const uid = () => Math.random().toString(36).slice(2, 10);

interface BidFormProps {
  tenderId: string;
  tender: ProfessionalTender;
  existingBid?: Bid | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// BUG-L1 FIX: renamed from FormData → BidFormState
interface BidFormState {
  coverSheet: BidCoverSheet;
  technicalProposal: string;
  financialProposal: string;
  financialBreakdown: FinancialBreakdown;
  bidAmount: number;
  currency: BidCurrency;
  bidSecurityType: 'cpo' | 'bank_guarantee' | 'insurance_bond';
  cpoNumber: string;
  cpoAmount: number;
  cpoCurrency: BidCurrency;
  cpoIssuingBank: string;
  cpoIssueDate: string;
  cpoExpiryDate: string;
}

const STEPS = [
  { id: 1, icon: '🏢', label: 'Company' },
  { id: 2, icon: '📄', label: 'Technical' },
  { id: 3, icon: '💰', label: 'Financial' },
  { id: 4, icon: '🔒', label: 'Security' },
  { id: 5, icon: '✅', label: 'Review' },
];

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

const fmt = (n?: number, currency = 'ETB') =>
  n != null
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(n)
    : '—';

// ── Shared style constants ────────────────────────────────────────────────────
const inputClass = [
  'w-full rounded-xl text-sm px-4 py-2.5',
  'border', colorClasses.border.secondary,
  colorClasses.bg.surface,
  colorClasses.text.primary,
  'focus:outline-none focus:ring-2 focus:ring-[#F1BB03]/40 focus:border-[#F1BB03]',
  'transition-all',
].join(' ');

const labelClass = `block text-sm font-semibold ${colorClasses.text.primary} mb-1.5`;
const reqMark = <span className="text-[#EF4444] ml-0.5">*</span>;

const sectionTitle = (text: string) => (
  <h3 className={`text-base font-bold ${colorClasses.text.primary} mb-1`}>{text}</h3>
);
const sectionSub = (text: string) => (
  <p className={`text-xs ${colorClasses.text.muted} mb-4`}>{text}</p>
);

// ── Step Indicator ────────────────────────────────────────────────────────────
const StepIndicator = ({ step, breakpoint }: { step: number; breakpoint: string }) => {
  if (breakpoint === 'mobile') {
    return (
      <div className="mb-6 px-5 pt-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className={`text-xs ${colorClasses.text.muted}`}>Step {step} of 5</span>
          <span className={`text-xs font-semibold ${colorClasses.text.primary}`}>{STEPS[step - 1].label}</span>
        </div>
        <div className={`w-full h-1.5 rounded-full ${colorClasses.bg.secondary}`}>
          <div
            className="h-full rounded-full bg-[#F1BB03] transition-all duration-500"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center mb-8 px-6 pt-5">
      {STEPS.map((s, i) => (
        <React.Fragment key={s.id}>
          <div className="flex flex-col items-center gap-1.5">
            <div className={[
              'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all',
              i + 1 < step
                ? `${colorClasses.bg.emeraldLight} ${colorClasses.text.emerald}`
                : i + 1 === step
                ? 'bg-[#F1BB03] text-[#0A2540]'
                : `${colorClasses.bg.surface} ${colorClasses.text.muted} border ${colorClasses.border.secondary}`,
            ].join(' ')}>
              {i + 1 < step ? '✓' : s.icon}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i + 1 === step ? 'text-[#F1BB03]' : colorClasses.text.muted}`}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 transition-colors ${i + 1 < step ? 'bg-[#F1BB03]' : colorClasses.bg.secondary}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// ── Error Callout ─────────────────────────────────────────────────────────────
const ErrorCallout = ({ errors }: { errors: string[] }) => {
  if (!errors.length) return null;
  return (
    <div className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/5 p-4 mt-4" role="alert">
      <p className="text-xs font-bold text-[#EF4444] mb-2">Please fix the following:</p>
      <ul className="space-y-1">
        {errors.map((e) => (
          <li key={e} className="text-xs text-[#EF4444] flex gap-1.5"><span>•</span>{e}</li>
        ))}
      </ul>
    </div>
  );
};

// ── FIX-F1: CPOFields hoisted to MODULE level ─────────────────────────────────
// Previously defined inside renderStep4's closure which caused a new component
// type on every render → React would unmount/remount it → focus lost after 1 char.
// Now it is a stable top-level component that receives all values as props.
interface CPOFieldsProps {
  required: boolean;
  formData: BidFormState;
  patchForm: <K extends keyof BidFormState>(key: K, val: BidFormState[K]) => void;
  getFile: (type: BidDocumentType) => FileEntry | undefined;
  setFile: (entry: FileEntry) => void;
  removeFile: (type: BidDocumentType) => void;
  existingBid?: Bid | null;
  inputClass: string;
  labelClass: string;
  gridClass: string;
}

const CPOFields: React.FC<CPOFieldsProps> = ({
  required,
  formData,
  patchForm,
  getFile,
  setFile,
  removeFile,
  existingBid,
  inputClass: ic,
  labelClass: lc,
  gridClass,
}) => {
  const securityTypeLabels: Record<string, string> = {
    cpo: 'CPO',
    bank_guarantee: 'Bank Guarantee',
    insurance_bond: 'Insurance Bond',
  };
  const securityLabel = securityTypeLabels[formData.bidSecurityType] ?? 'CPO';
  const institutionLabel = formData.bidSecurityType === 'cpo' ? 'Issuing Bank' : 'Issuing Institution';

  return (
    <>
      <div className={gridClass}>
        <div>
          <label className={lc}>{securityLabel} Number {required && <span className="text-[#EF4444] ml-0.5">*</span>}</label>
          <input
            type="text"
            className={`${ic} uppercase`}
            value={formData.cpoNumber}
            onChange={(e) => patchForm('cpoNumber', e.target.value)}
          />
        </div>
        <div>
          <label className={lc}>Security Amount {required && <span className="text-[#EF4444] ml-0.5">*</span>}</label>
          <input
            type="number"
            min={0}
            className={ic}
            value={formData.cpoAmount || ''}
            onChange={(e) => patchForm('cpoAmount', Number(e.target.value))}
          />
        </div>
        <div>
          <label className={lc}>Currency {required && <span className="text-[#EF4444] ml-0.5">*</span>}</label>
          <select
            className={ic}
            value={formData.cpoCurrency}
            onChange={(e) => patchForm('cpoCurrency', e.target.value as BidCurrency)}
          >
            {(['ETB', 'USD', 'EUR', 'GBP'] as BidCurrency[]).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={lc}>{institutionLabel} {required && <span className="text-[#EF4444] ml-0.5">*</span>}</label>
          <input
            type="text"
            className={ic}
            value={formData.cpoIssuingBank}
            onChange={(e) => patchForm('cpoIssuingBank', e.target.value)}
            placeholder="Commercial Bank of Ethiopia"
          />
        </div>
        <div>
          <label className={lc}>Issue Date {required && <span className="text-[#EF4444] ml-0.5">*</span>}</label>
          <input
            type="date"
            className={ic}
            value={formData.cpoIssueDate}
            onChange={(e) => patchForm('cpoIssueDate', e.target.value)}
          />
        </div>
        <div>
          <label className={lc}>Expiry Date {required && <span className="text-[#EF4444] ml-0.5">*</span>}</label>
          <input
            type="date"
            className={ic}
            value={formData.cpoExpiryDate}
            onChange={(e) => patchForm('cpoExpiryDate', e.target.value)}
          />
          <p className={`text-xs mt-1 ${colorClasses.text.muted}`}>Must be after the tender deadline</p>
        </div>
      </div>

      <FileUploadRow
        documentType="cpo_document"
        label="Security Document"
        required={required}
        description={
          existingBid?.cpo?.documentPath
            ? 'Leave empty to keep the existing document, or upload a new one to replace it'
            : 'Upload your CPO, bank guarantee, or insurance bond'
        }
        file={getFile('cpo_document')}
        onFile={setFile}
        onRemove={() => removeFile('cpo_document')}
      />

      {existingBid?.cpo?.documentPath && !getFile('cpo_document') && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${colorClasses.border.secondary} ${colorClasses.bg.surface} text-xs ${colorClasses.text.secondary}`}>
          <span>📄</span>
          <span>Existing CPO document on file — will be kept unless you upload a replacement.</span>
        </div>
      )}

      <div className={`rounded-xl px-4 py-3 ${colorClasses.bg.amberLight} border border-amber-200 dark:border-amber-800`}>
        <p className={`text-xs font-semibold ${colorClasses.text.amber700} mb-1`}>⚠️ Ethiopian Procurement Law</p>
        <p className={`text-xs ${colorClasses.text.amber700}`}>
          CPO/bid security documents must be returned to unsuccessful bidders after contract award.
        </p>
      </div>
    </>
  );
};

// ── Main BidForm component ────────────────────────────────────────────────────

export const BidForm = ({ tenderId, tender, existingBid, onSuccess, onCancel }: BidFormProps) => {
  const { breakpoint, isTouch, getTouchTargetSize } = useResponsive();
  const isMobile = breakpoint === 'mobile';

  const { mutate: submitBid, isPending } = useSubmitBid();
  const { mutate: updateBid, isPending: isUpdating } = useUpdateBid();
  const isLoading = isPending || isUpdating;

  const isSealed = tender.workflowType === 'closed';
  const cpoRequired = (tender as any).cpoRequired === true;

  const [showOptionalCPO, setShowOptionalCPO] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [stepErrors, setStepErrors] = useState<string[]>([]);
  const [finalDeclaration, setFinalDeclaration] = useState(false);

  const initialCurrency: BidCurrency = existingBid?.currency ?? 'ETB';

  const [formData, setFormData] = useState<BidFormState>({
    coverSheet: {
      companyName: existingBid?.coverSheet?.companyName ?? '',
      authorizedRepresentative: existingBid?.coverSheet?.authorizedRepresentative ?? '',
      representativeTitle: existingBid?.coverSheet?.representativeTitle ?? '',
      companyEmail: existingBid?.coverSheet?.companyEmail ?? '',
      companyPhone: existingBid?.coverSheet?.companyPhone ?? '',
      companyAddress: existingBid?.coverSheet?.companyAddress ?? '',
      tinNumber: existingBid?.coverSheet?.tinNumber ?? '',
      licenseNumber: existingBid?.coverSheet?.licenseNumber ?? '',
      totalBidValue: existingBid?.coverSheet?.totalBidValue ?? 0,
      currency: initialCurrency,
      bidValidityPeriod: existingBid?.coverSheet?.bidValidityPeriod,
      declarationAccepted: existingBid?.coverSheet?.declarationAccepted ?? false,
    },
    technicalProposal: existingBid?.technicalProposal ?? '',
    financialProposal: existingBid?.financialProposal ?? '',
    financialBreakdown: existingBid?.financialBreakdown ?? { items: [], currency: initialCurrency },
    bidAmount: existingBid?.bidAmount ?? 0,
    currency: initialCurrency,
    bidSecurityType: existingBid?.cpo?.bidSecurityType ?? 'cpo',
    cpoAmount: existingBid?.cpo?.amount ?? (tender as any).procurement?.bidSecurityAmount ?? 0,
    cpoCurrency: existingBid?.cpo?.currency ?? 'ETB',
    cpoNumber: existingBid?.cpo?.cpoNumber ?? '',
    cpoIssuingBank: existingBid?.cpo?.issuingBank ?? '',
    cpoIssueDate: existingBid?.cpo?.issueDate ?? '',
    cpoExpiryDate: existingBid?.cpo?.expiryDate ?? '',
  });

  // ── File state ───────────────────────────────────────────────────────────
  const [files, setFiles] = useState<Record<BidDocumentType, FileEntry | undefined>>(
    {} as Record<BidDocumentType, FileEntry | undefined>
  );

  const setFile = useCallback((entry: FileEntry) => {
    setFiles((prev) => ({ ...prev, [entry.documentType]: entry }));
  }, []);

  const removeFile = useCallback((type: BidDocumentType) => {
    setFiles((prev) => ({ ...prev, [type]: undefined }));
  }, []);

  const getFile = (type: BidDocumentType) => files[type];

  const patchForm = useCallback(<K extends keyof BidFormState>(key: K, value: BidFormState[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const patchCoverSheet = <K extends keyof BidCoverSheet>(key: K, value: BidCoverSheet[K]) =>
    setFormData((prev) => ({
      ...prev,
      coverSheet: { ...prev.coverSheet, [key]: value },
    }));

  // BUG-M2 FIX: single currency keeps bid + coverSheet in sync
  const setCurrency = (c: BidCurrency) => {
    setFormData((prev) => ({
      ...prev,
      currency: c,
      coverSheet: { ...prev.coverSheet, currency: c },
    }));
  };

  const gridClass = `grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`;

  // ── Validation ────────────────────────────────────────────────────────────
  const validateStep = (s: number): string[] => {
    const errs: string[] = [];
    if (s === 1) {
      if (!formData.coverSheet.companyName.trim())               errs.push('Company name is required');
      if (!formData.coverSheet.authorizedRepresentative.trim())  errs.push('Authorized representative is required');
      if (!formData.coverSheet.companyEmail.trim() || !isValidEmail(formData.coverSheet.companyEmail))
        errs.push('Valid company email is required');
      if (!formData.coverSheet.companyPhone.trim())              errs.push('Company phone is required');
      if (!formData.coverSheet.declarationAccepted)              errs.push('You must accept the declaration');
      if (!getFile('business_license'))                          errs.push('Business License document is required');
    }
    if (s === 3) {
      if (!formData.bidAmount || formData.bidAmount <= 0) errs.push('Bid amount must be greater than zero');
    }
    if (s === 4) {
      const includesCPO = cpoRequired || showOptionalCPO;
      if (includesCPO) {
        if (!formData.cpoNumber.trim())      errs.push('Security document number is required');
        if (!formData.cpoAmount || formData.cpoAmount <= 0) errs.push('Security amount is required');
        if (!formData.cpoIssuingBank.trim()) errs.push('Issuing institution is required');
        if (!formData.cpoIssueDate)          errs.push('Issue date is required');
        if (!formData.cpoExpiryDate)         errs.push('Expiry date is required');
        if (!getFile('cpo_document') && !existingBid?.cpo?.documentPath) {
          errs.push('Security document file is required');
        }
      }
    }
    return errs;
  };

  const goNext = () => {
    const errs = validateStep(step);
    if (errs.length) { setStepErrors(errs); return; }
    setStepErrors([]);
    setStep((s) => Math.min(5, s + 1) as typeof step);
  };

  const goBack = () => {
    setStepErrors([]);
    setStep((s) => Math.max(1, s - 1) as typeof step);
  };

  // ── FIX-F2: filter blank financial breakdown items before submit ────────────
  const getCleanBreakdown = (): FinancialBreakdown | undefined => {
    const bd = formData.financialBreakdown;
    if (!bd || !bd.items) return undefined;
    const clean = {
      ...bd,
      items: bd.items.filter(
        (item) => item && typeof item.description === 'string' && item.description.trim().length > 0
      ),
    };
    return clean.items.length > 0 ? clean : undefined;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!finalDeclaration) return;
    const includesCPO = cpoRequired || showOptionalCPO;

    const data: SubmitBidData = {
      bidAmount: formData.bidAmount,
      currency: formData.currency,
      technicalProposal: formData.technicalProposal || undefined,
      financialProposal: formData.financialProposal || undefined,
      financialBreakdown: getCleanBreakdown(),
      coverSheet: {
        ...formData.coverSheet,
        currency: formData.currency,
        totalBidValue: formData.bidAmount,
      },
      ...(includesCPO && {
        bidSecurityType: formData.bidSecurityType,
        cpoNumber: formData.cpoNumber,
        cpoAmount: formData.cpoAmount,
        cpoCurrency: formData.cpoCurrency,
        cpoIssuingBank: formData.cpoIssuingBank,
        cpoIssueDate: formData.cpoIssueDate,
        cpoExpiryDate: formData.cpoExpiryDate,
      }),
    };

    const fileEntries = Object.values(files)
      .filter(Boolean)
      .map((f) => ({ file: f!.file, documentType: f!.documentType }));

    // FIX-F4: clear form state on success
    const handleFormSuccess = () => {
      setFiles({} as Record<BidDocumentType, FileEntry | undefined>);
      setStep(1);
      setFinalDeclaration(false);
      setStepErrors([]);
      onSuccess?.();
    };

    if (existingBid) {
      updateBid({ tenderId, bidId: existingBid._id, data, files: fileEntries }, { onSuccess: handleFormSuccess });
    } else {
      submitBid({ tenderId, data, files: fileEntries }, { onSuccess: handleFormSuccess });
    }
  };

  const navBtnBase = 'px-6 py-2.5 rounded-xl text-sm font-semibold transition-all min-h-[44px]';

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1 — Company Cover Sheet
  // ─────────────────────────────────────────────────────────────────────────
  const renderStep1 = () => (
    <div className="space-y-5">
      {sectionTitle('🏢 Company Information')}
      {sectionSub('Provide your company and representative details.')}

      <div className={gridClass}>
        {([
          { label: 'Company Name',              key: 'companyName',              required: true },
          { label: 'Authorized Representative', key: 'authorizedRepresentative', required: true },
          { label: 'Representative Title',      key: 'representativeTitle' },
          { label: 'Company Email',             key: 'companyEmail',             required: true, type: 'email' },
          { label: 'Company Phone',             key: 'companyPhone',             required: true, type: 'tel' },
          { label: 'Company Address',           key: 'companyAddress' },
          { label: 'TIN Number',                key: 'tinNumber' },
          { label: 'Business License Number',   key: 'licenseNumber' },
          { label: 'Bid Validity Period (days)',key: 'bidValidityPeriod',        type: 'number' },
        ] as Array<{ label: string; key: keyof BidCoverSheet; required?: boolean; type?: string }>)
          .map(({ label, key, required, type }) => (
            <div key={key as string}>
              <label className={labelClass}>{label} {required && reqMark}</label>
              <input
                type={type ?? 'text'}
                className={inputClass}
                value={String(formData.coverSheet[key] ?? '')}
                onChange={(e) => {
                  const val = type === 'number' ? (Number(e.target.value) || undefined) : e.target.value;
                  patchCoverSheet(key, val as BidCoverSheet[typeof key]);
                }}
              />
            </div>
          ))}
      </div>

      {/* Compliance documents */}
      <div>
        <h4 className={`text-sm font-bold ${colorClasses.text.primary} mb-3`}>📎 Compliance Documents</h4>
        <div className="space-y-3">
          {([
            { type: 'business_license' as BidDocumentType, label: 'Business License', required: true, description: 'Valid business registration certificate' },
            { type: 'tin_certificate' as BidDocumentType, label: 'TIN Certificate' },
            { type: 'vat_certificate' as BidDocumentType, label: 'VAT Certificate' },
            { type: 'tax_clearance' as BidDocumentType, label: 'Tax Clearance Certificate' },
            { type: 'trade_registration' as BidDocumentType, label: 'Trade Registration' },
            { type: 'company_profile' as BidDocumentType, label: 'Company Profile' },
          ]).map(({ type, label, required, description }) => (
            <FileUploadRow
              key={type}
              documentType={type}
              label={label}
              description={description}
              required={required}
              file={getFile(type)}
              onFile={setFile}
              onRemove={() => removeFile(type)}
            />
          ))}
        </div>
      </div>

      {/* Declaration */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.coverSheet.declarationAccepted}
          onChange={(e) => patchCoverSheet('declarationAccepted', e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[#F1BB03]"
        />
        <span className={`text-sm ${colorClasses.text.secondary}`}>
          I confirm that all information provided is accurate and complete, and I authorise this submission on behalf of my company. {reqMark}
        </span>
      </label>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2 — Technical Proposal
  // ─────────────────────────────────────────────────────────────────────────
  const renderStep2 = () => (
    <div className="space-y-5">
      {sectionTitle('📄 Technical Proposal')}
      {sectionSub('Describe your technical approach, methodology, and qualifications.')}

      <div>
        <label className={labelClass}>Technical Proposal</label>
        <textarea
          rows={10}
          className={`${inputClass} resize-none`}
          value={formData.technicalProposal}
          onChange={(e) => patchForm('technicalProposal', e.target.value)}
          placeholder="Describe your technical approach, team qualifications, timeline, and methodology…"
        />
      </div>

      <FileUploadRow
        documentType="technical_proposal"
        label="Technical Proposal Document"
        description="PDF or Word document of your full technical proposal"
        file={getFile('technical_proposal')}
        onFile={setFile}
        onRemove={() => removeFile('technical_proposal')}
      />

      {isSealed && (
        <div className="flex items-start gap-3 rounded-xl bg-[#DBEAFE] dark:bg-[#1E3A5F] border border-[#2563EB]/30 px-4 py-3">
          <span className="text-base mt-0.5 flex-shrink-0">🔒</span>
          <p className={`text-xs ${colorClasses.text.blue600}`}>
            This is a <strong>sealed tender</strong>. Your technical proposal will be kept confidential until the tender owner reveals bids.
          </p>
        </div>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3 — Financial Proposal
  // ─────────────────────────────────────────────────────────────────────────
  const renderStep3 = () => (
    <div className="space-y-5">
      {sectionTitle('💰 Financial Proposal')}
      {sectionSub('Enter your bid amount and detailed financial breakdown.')}

      <div className={gridClass}>
        <div>
          <label className={labelClass}>Total Bid Amount {reqMark}</label>
          <input
            type="number"
            min={0}
            step="0.01"
            className={inputClass}
            value={formData.bidAmount || ''}
            onChange={(e) => {
              const v = Number(e.target.value);
              patchForm('bidAmount', v);
              patchCoverSheet('totalBidValue', v);
            }}
            placeholder="0.00"
          />
        </div>
        <div>
          <label className={labelClass}>Currency</label>
          <select
            className={inputClass}
            value={formData.currency}
            onChange={(e) => setCurrency(e.target.value as BidCurrency)}
          >
            {(['ETB', 'USD', 'EUR', 'GBP'] as BidCurrency[]).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Financial Breakdown (Optional)</label>
        <p className={`text-xs ${colorClasses.text.muted} mb-2`}>
          Add line items with descriptions. Rows with empty descriptions will be ignored.
        </p>
        <FinancialBreakdownTable
          breakdown={formData.financialBreakdown}
          editable
          onChange={(b) => patchForm('financialBreakdown', b)}
        />
      </div>

      <div>
        <label className={labelClass}>Financial Proposal Narrative</label>
        <textarea
          rows={5}
          className={`${inputClass} resize-none`}
          value={formData.financialProposal}
          onChange={(e) => patchForm('financialProposal', e.target.value)}
          placeholder="Explain your pricing strategy, payment terms, and any relevant financial notes…"
        />
      </div>

      <FileUploadRow
        documentType="financial_proposal"
        label="Financial Proposal Document"
        description="Excel or PDF with detailed line items"
        file={getFile('financial_proposal')}
        onFile={setFile}
        onRemove={() => removeFile('financial_proposal')}
      />
      <FileUploadRow
        documentType="financial_breakdown"
        label="Financial Breakdown Sheet"
        description="Detailed BOQ / price schedule"
        file={getFile('financial_breakdown')}
        onFile={setFile}
        onRemove={() => removeFile('financial_breakdown')}
      />
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 4 — Bid Security
  // FIX-F1: CPOFields is now a stable top-level component, not a closure
  // ─────────────────────────────────────────────────────────────────────────
  const renderStep4 = () => {
    const includesCPO = cpoRequired || showOptionalCPO;

    const tenderRFQUrl = `${(process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://localhost:4000')}/api/v1/professional-tenders/${tenderId}/public-rfq`;

    const securityTypeLabels: Record<string, string> = {
      cpo: 'CPO',
      bank_guarantee: 'Bank Guarantee',
      insurance_bond: 'Insurance Bond',
    };

    return (
      <div className="space-y-6">
        {sectionTitle('🔒 Bid Security')}
        {sectionSub('Submit the required bid security documentation.')}

        {/* Section A — CPO */}
        <div>
          <h4 className={`text-sm font-bold ${colorClasses.text.primary} mb-1`}>🏦 Bid Security / CPO</h4>

          {cpoRequired ? (
            <div className="space-y-4">
              <div className="rounded-xl px-4 py-3 bg-[#FEF3C7] dark:bg-[#78350F]/40 border border-amber-300 dark:border-amber-700 flex items-start gap-3">
                <span className="text-base flex-shrink-0">⚠️</span>
                <div>
                  <p className={`text-xs font-bold ${colorClasses.text.amber700}`}>Bid Security Required</p>
                  <p className={`text-xs ${colorClasses.text.amber700} mt-0.5`}>
                    This tender requires a bid security document.
                    {(tender as any).procurement?.bidSecurityAmount
                      ? ` Required amount: ${fmt((tender as any).procurement.bidSecurityAmount, 'ETB')}`
                      : ''}
                  </p>
                </div>
              </div>

              <div>
                <label className={labelClass}>Security Type {reqMark}</label>
                <div className="flex flex-wrap gap-2">
                  {(['cpo', 'bank_guarantee', 'insurance_bond'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => patchForm('bidSecurityType', type)}
                      className={[
                        'px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all',
                        formData.bidSecurityType === type
                          ? 'border-[#F1BB03] bg-[#F1BB03]/10 text-[#F1BB03]'
                          : `${colorClasses.border.secondary} ${colorClasses.text.muted}`,
                      ].join(' ')}
                    >
                      {securityTypeLabels[type]}
                    </button>
                  ))}
                </div>
              </div>

              {/* FIX-F1: stable CPOFields component */}
              <CPOFields
                required
                formData={formData}
                patchForm={patchForm}
                getFile={getFile}
                setFile={setFile}
                removeFile={removeFile}
                existingBid={existingBid}
                inputClass={inputClass}
                labelClass={labelClass}
                gridClass={gridClass}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`rounded-xl px-4 py-3 ${colorClasses.bg.emeraldLight} border border-emerald-200 dark:border-emerald-800 flex items-center gap-3`}>
                <span>✅</span>
                <p className={`text-sm font-medium ${colorClasses.text.emerald}`}>
                  No bid security required for this tender.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowOptionalCPO((v) => !v)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-dashed transition-all ${
                  showOptionalCPO
                    ? 'border-[#F1BB03] bg-[#F1BB03]/5'
                    : `${colorClasses.border.secondary} ${colorClasses.bg.surface}`
                }`}
              >
                <span className={`text-sm font-semibold ${showOptionalCPO ? 'text-[#F1BB03]' : colorClasses.text.secondary}`}>
                  {showOptionalCPO ? '− Hide' : '+ Include'} CPO / Bid Security (optional)
                </span>
                <span className={`text-xs ${colorClasses.text.muted}`}>{showOptionalCPO ? 'collapse' : 'expand'}</span>
              </button>

              {showOptionalCPO && (
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Security Type</label>
                    <div className="flex flex-wrap gap-2">
                      {(['cpo', 'bank_guarantee', 'insurance_bond'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => patchForm('bidSecurityType', type)}
                          className={[
                            'px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all',
                            formData.bidSecurityType === type
                              ? 'border-[#F1BB03] bg-[#F1BB03]/10 text-[#F1BB03]'
                              : `${colorClasses.border.secondary} ${colorClasses.text.muted}`,
                          ].join(' ')}
                        >
                          {securityTypeLabels[type]}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* FIX-F1: stable CPOFields component */}
                  <CPOFields
                    required={false}
                    formData={formData}
                    patchForm={patchForm}
                    getFile={getFile}
                    setFile={setFile}
                    removeFile={removeFile}
                    existingBid={existingBid}
                    inputClass={inputClass}
                    labelClass={labelClass}
                    gridClass={gridClass}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section B — RFQ document */}
        <div>
          <h4 className={`text-sm font-bold ${colorClasses.text.primary} mb-1`}>📋 Request for Quote (RFQ)</h4>
          <p className={`text-xs ${colorClasses.text.muted} mb-4`}>
            Upload your official quotation document. This will be downloadable by the tender owner.
          </p>
          <FileUploadRow
            documentType="opening_page"
            label="Quote / RFQ Document"
            description="Strongly recommended — PDF or Word"
            file={getFile('opening_page')}
            onFile={setFile}
            onRemove={() => removeFile('opening_page')}
            accept=".pdf,.doc,.docx,.xlsx,.jpg,.jpeg,.png"
          />
          <div className={`mt-3 flex items-center gap-3 rounded-xl px-4 py-3 ${colorClasses.bg.surface} border ${colorClasses.border.secondary}`}>
            <span className="text-lg">📋</span>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold ${colorClasses.text.primary}`}>Tender`s Bidding Process Document</p>
              <p className={`text-xs ${colorClasses.text.muted}`}>Download the official RFQ requirements from the tender owner</p>
            </div>
            <a
              href={tenderRFQUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg ${colorClasses.bg.blueLight} ${colorClasses.text.blue600} hover:opacity-80 transition-all`}
            >
              📥 Download
            </a>
          </div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 5 — Review & Submit
  // FIX-F3: shows every file name with its type before submission
  // ─────────────────────────────────────────────────────────────────────────
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 1: true, 2: true, 3: true, 4: true });
  const toggleSection = (n: number) => setExpanded((p) => ({ ...p, [n]: !p[n] }));

  const AccordionSection = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
    <div className={`rounded-xl border ${colorClasses.border.secondary} overflow-hidden`}>
      <button
        type="button"
        onClick={() => toggleSection(n)}
        className={`w-full flex items-center justify-between px-4 py-3 ${colorClasses.bg.surface} ${colorClasses.text.primary} font-semibold text-sm`}
      >
        <span>{title}</span>
        <span className={`text-xs ${colorClasses.text.muted} transition-transform ${expanded[n] ? 'rotate-180' : ''}`}>▲</span>
      </button>
      {expanded[n] && <div className={`p-4 ${colorClasses.bg.primary}`}>{children}</div>}
    </div>
  );

  const InfoRow = ({ label, value }: { label: string; value?: string | number | boolean | null }) => (
    <div className="flex justify-between gap-4 py-1">
      <p className={`text-xs ${colorClasses.text.muted}`}>{label}</p>
      <p className={`text-sm font-medium ${colorClasses.text.primary} text-right`}>{String(value ?? '—')}</p>
    </div>
  );

  // FIX-F3: FileChip shows actual file name and document type
  const docTypeLabel: Partial<Record<BidDocumentType, string>> = {
    business_license: 'Business License',
    tin_certificate: 'TIN Certificate',
    vat_certificate: 'VAT Certificate',
    tax_clearance: 'Tax Clearance',
    trade_registration: 'Trade Registration',
    company_profile: 'Company Profile',
    technical_proposal: 'Technical Proposal',
    financial_proposal: 'Financial Proposal',
    financial_breakdown: 'Financial Breakdown',
    cpo_document: 'CPO / Security',
    opening_page: 'RFQ / Quotation',
    other: 'Other',
  };

  const allFilesToSubmit = Object.values(files).filter(Boolean) as FileEntry[];

  const renderStep5 = () => (
    <div className="space-y-4">
      {sectionTitle('✅ Review & Submit')}
      {sectionSub('Review your bid carefully before submitting. All items below will be included.')}

      <AccordionSection n={1} title="🏢 Company Information">
        <div className={`grid gap-2 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
          <InfoRow label="Company" value={formData.coverSheet.companyName} />
          <InfoRow label="Representative" value={formData.coverSheet.authorizedRepresentative} />
          <InfoRow label="Email" value={formData.coverSheet.companyEmail} />
          <InfoRow label="Phone" value={formData.coverSheet.companyPhone} />
          <InfoRow label="TIN" value={formData.coverSheet.tinNumber} />
          <InfoRow label="Bid Value" value={fmt(formData.bidAmount, formData.currency)} />
        </div>
      </AccordionSection>

      <AccordionSection n={2} title="📄 Technical Proposal">
        <div className={`max-h-32 overflow-y-auto rounded-lg p-3 text-sm ${colorClasses.bg.surface} ${colorClasses.text.secondary}`}>
          {formData.technicalProposal || <span className={colorClasses.text.muted}>Not provided</span>}
        </div>
      </AccordionSection>

      <AccordionSection n={3} title="💰 Financial">
        <InfoRow label="Total Bid Amount" value={fmt(formData.bidAmount, formData.currency)} />
        {getCleanBreakdown()?.items && getCleanBreakdown()!.items.length > 0 && (
          <div className="mt-2">
            <p className={`text-xs font-semibold ${colorClasses.text.muted} mb-1`}>Breakdown items: {getCleanBreakdown()!.items.length}</p>
            {getCleanBreakdown()!.items.map((item, i) => (
              <div key={i} className={`flex justify-between text-xs py-0.5 ${colorClasses.text.secondary}`}>
                <span className="truncate flex-1">{item.description}</span>
                <span className="ml-4 font-medium">{fmt(item.totalPrice, formData.currency)}</span>
              </div>
            ))}
          </div>
        )}
      </AccordionSection>

      {/* FIX-F3: All files listed with real names */}
      <AccordionSection n={4} title={`📎 Documents to Submit (${allFilesToSubmit.length} file${allFilesToSubmit.length !== 1 ? 's' : ''})`}>
        {allFilesToSubmit.length === 0 ? (
          <p className={`text-sm ${colorClasses.text.muted} italic`}>No files attached (only text proposals will be submitted).</p>
        ) : (
          <div className="space-y-2">
            {allFilesToSubmit.map((entry) => (
              <div
                key={entry.documentType}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border ${colorClasses.border.secondary} ${colorClasses.bg.surface}`}
              >
                <span className="text-lg flex-shrink-0">📄</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${colorClasses.text.primary} truncate`}>
                    {entry.file.name}
                  </p>
                  <p className={`text-xs ${colorClasses.text.muted}`}>
                    {docTypeLabel[entry.documentType] ?? entry.documentType.replace(/_/g, ' ')}
                    {' · '}
                    {entry.file.size < 1024 * 1024
                      ? `${(entry.file.size / 1024).toFixed(1)} KB`
                      : `${(entry.file.size / 1024 / 1024).toFixed(1)} MB`}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colorClasses.bg.tealLight} ${colorClasses.text.teal} flex-shrink-0`}>
                  ✓
                </span>
              </div>
            ))}
          </div>
        )}
      </AccordionSection>

      {/* Bid summary banner */}
      <div className="rounded-2xl bg-[#0A2540] dark:bg-[#F1BB03]/10 p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm opacity-70 mb-1">Total Bid Value</p>
            <p className="text-3xl font-bold text-[#F1BB03]">{fmt(formData.bidAmount, formData.currency)}</p>
          </div>
          <div className="space-y-1 text-sm">
            <p><span className="opacity-70">Tender: </span><span className="font-semibold">{tender.title}</span></p>
            <p>
              <span className="opacity-70">Type: </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${isSealed ? 'bg-purple-500/20 text-purple-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                {isSealed ? '🔒 Sealed' : '🔓 Open'}
              </span>
            </p>
          </div>
        </div>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={finalDeclaration}
          onChange={(e) => setFinalDeclaration(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[#F1BB03]"
        />
        <span className={`text-sm ${colorClasses.text.secondary}`}>
          I confirm this bid is complete and accurate, and I authorize its submission on behalf of my company.
        </span>
      </label>
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  const stepContent = { 1: renderStep1, 2: renderStep2, 3: renderStep3, 4: renderStep4, 5: renderStep5 }[step];

  return (
    <div className="flex flex-col min-h-0">
      <StepIndicator step={step} breakpoint={breakpoint} />

      <div className="px-5 sm:px-6 pb-4 flex-1">
        {stepContent?.()}
        <ErrorCallout errors={stepErrors} />
      </div>

      <div className={`sticky bottom-0 ${colorClasses.bg.primary} border-t ${colorClasses.border.secondary} px-5 sm:px-6 py-4 flex gap-3 ${isMobile ? 'flex-col-reverse' : 'justify-between items-center'}`}>
        {step > 1 ? (
          <button
            type="button"
            onClick={goBack}
            disabled={isLoading}
            className={`${navBtnBase} border ${colorClasses.border.secondary} ${colorClasses.text.primary} ${colorClasses.bg.surface} hover:opacity-80 disabled:opacity-40 ${isMobile ? 'w-full' : ''}`}
          >
            ← Back
          </button>
        ) : (
          <button
            type="button"
            onClick={onCancel}
            className={`${navBtnBase} border ${colorClasses.border.secondary} ${colorClasses.text.muted} ${isMobile ? 'w-full' : ''}`}
          >
            Cancel
          </button>
        )}

        {step < 5 ? (
          <button
            type="button"
            onClick={goNext}
            disabled={isLoading}
            className={`${navBtnBase} bg-[#F1BB03] text-[#0A2540] hover:opacity-90 disabled:opacity-40 ${isMobile ? 'w-full' : ''}`}
          >
            Continue →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!finalDeclaration || isLoading}
            className={`${navBtnBase} bg-[#F1BB03] text-[#0A2540] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${isMobile ? 'w-full' : ''}`}
          >
            {isLoading ? (
              <><span className="animate-spin text-base">⏳</span>{existingBid ? 'Updating…' : 'Submitting…'}</>
            ) : (
              existingBid ? 'Update Bid' : 'Submit Bid 🚀'
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default BidForm;