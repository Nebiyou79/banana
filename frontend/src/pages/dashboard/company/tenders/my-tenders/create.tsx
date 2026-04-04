'use client';
// pages/dashboard/company/tenders/my-tenders/create.tsx
// ─── Page 1.3 — Company: My Tenders Create ───────────────────────────────────
// Two-step flow: (1) select tender type via large visual cards,
// (2) render the appropriate form (FreelanceTenderForm | ProfessionalTenderForm).
// Type synced to URL: ?type=freelance | ?type=professional for deep-linking.

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { colorClasses } from '@/utils/color';
import FreelanceTenderForm from '@/components/tenders2.0/FreelanceTenderForm';
import ProfessionalTenderForm from '@/components/tenders2.0/ProfessionalTenderForm';
import TenderDashboardLayout from '@/components/tenders2.0/layout/TenderDashboardLayout';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type TenderType = 'freelance' | 'professional';

// ─────────────────────────────────────────────
// Step 1 — Type Selector Card
// ─────────────────────────────────────────────
interface TypeCardProps {
  type: TenderType;
  selected: boolean;
  onSelect: (t: TenderType) => void;
}

const TYPE_CARD_DATA: Record<TenderType, {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
  accentBg: string;
  accentBorder: string;
  bullets: string[];
}> = {
  freelance: {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Freelance Tender',
    description: 'Find individual professionals or small teams for project-based work. Publish immediately and receive applications.',
    badge: 'Always Editable',
    badgeColor: `${colorClasses.bg.emeraldLight} ${colorClasses.text.emerald}`,
    accentBg: 'bg-[#E0E7FF] dark:bg-[#1E1B4B]',
    accentBorder: 'border-[#6366F1] dark:border-[#818CF8]',
    bullets: [
      'Instant publishing, no approval needed',
      'Accept applications from freelancers',
      'Edit or delete at any time',
      'Set skills, budget, and screening questions',
    ],
  },
  professional: {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    title: 'Professional / Procurement Tender',
    description: 'Formal procurement process with sealed or open bidding, CPO requirements, and deadline-based reveal.',
    badge: 'Draft → Published → Closed',
    badgeColor: `${colorClasses.bg.blueLight} ${colorClasses.text.blue600}`,
    accentBg: 'bg-[#DBEAFE] dark:bg-[#1E3A5F]',
    accentBorder: 'border-[#2563EB] dark:border-[#60A5FA]',
    bullets: [
      '5-step structured configuration wizard',
      'Sealed or open bidding with CPO support',
      'Invite-only or public access control',
      'Evaluation criteria & scoring matrix',
    ],
  },
};

function TypeCard({ type, selected, onSelect }: TypeCardProps) {
  const d = TYPE_CARD_DATA[type];
  return (
    <button
      type="button"
      onClick={() => onSelect(type)}
      className={`
        group relative w-full text-left rounded-2xl border-2 p-7
        transition-all duration-200 outline-none
        focus-visible:ring-4 focus-visible:ring-[#F1BB03] focus-visible:ring-offset-2
        ${selected
          ? `${d.accentBorder} ${d.accentBg} shadow-lg scale-[1.01]`
          : `${colorClasses.border.secondary} ${colorClasses.bg.primary}
             hover:border-[#F1BB03] hover:shadow-md hover:-translate-y-0.5`
        }
      `}
    >
      {/* Selected checkmark */}
      {selected && (
        <div className="absolute top-5 right-5">
          <div className={`
            flex h-6 w-6 items-center justify-center rounded-full
            bg-[#F1BB03] text-[#0A2540]
          `}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}

      {/* Icon */}
      <div className={`
        inline-flex h-14 w-14 items-center justify-center rounded-2xl mb-5
        transition-colors
        ${selected ? `bg-white/60 dark:bg-white/10 ${type === 'freelance' ? colorClasses.text.indigo : colorClasses.text.blue600}` : `${colorClasses.bg.surface} ${colorClasses.text.muted} group-hover:${colorClasses.text.primary}`}
      `}>
        {d.icon}
      </div>

      {/* Badge */}
      <div className="mb-3">
        <span className={`
          inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold
          ${d.badgeColor}
        `}>
          {d.badge}
        </span>
      </div>

      {/* Title */}
      <h3 className={`text-xl font-bold mb-2 ${colorClasses.text.primary}`}>
        {d.title}
      </h3>

      {/* Description */}
      <p className={`text-sm leading-relaxed mb-5 ${colorClasses.text.secondary}`}>
        {d.description}
      </p>

      {/* Bullets */}
      <ul className="space-y-2">
        {d.bullets.map((b) => (
          <li key={b} className={`flex items-start gap-2.5 text-sm ${colorClasses.text.secondary}`}>
            <svg className={`w-4 h-4 mt-0.5 shrink-0 ${selected ? colorClasses.text.emerald : colorClasses.text.muted}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {b}
          </li>
        ))}
      </ul>

      {/* CTA arrow */}
      <div className={`
        mt-6 flex items-center gap-2 text-sm font-semibold
        transition-colors
        ${selected
          ? type === 'freelance' ? colorClasses.text.indigo : colorClasses.text.blue600
          : `${colorClasses.text.muted} group-hover:${colorClasses.text.primary}`
        }
      `}>
        {selected ? 'Selected — click Continue below' : 'Select this type'}
        <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────
// Breadcrumb / Back navigation
// ─────────────────────────────────────────────
function Breadcrumb({ steps }: { steps: { label: string; active?: boolean }[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-xs mb-8">
      {steps.map((step, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <svg className={`w-3.5 h-3.5 shrink-0 ${colorClasses.text.muted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          )}
          <span className={`font-medium ${step.active ? colorClasses.text.primary : colorClasses.text.muted}`}>
            {step.label}
          </span>
        </React.Fragment>
      ))}
    </nav>
  );
}

// ─────────────────────────────────────────────
// Confirm type-change dialog
// ─────────────────────────────────────────────
function ChangeTypeDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className={`
        relative z-10 w-full max-w-sm rounded-2xl p-6 shadow-2xl
        ${colorClasses.bg.primary} border ${colorClasses.border.secondary}
      `}>
        <div className={`
          mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-2xl
          ${colorClasses.bg.amberLight}
        `}>
          ⚠️
        </div>
        <h3 className={`text-center text-lg font-bold mb-2 ${colorClasses.text.primary}`}>
          Change Tender Type?
        </h3>
        <p className={`text-center text-sm mb-6 ${colorClasses.text.secondary}`}>
          Switching tender type will clear all the data you`ve entered in the current form.
          This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className={`
              flex-1 rounded-xl border py-2.5 text-sm font-medium
              transition-opacity hover:opacity-70
              ${colorClasses.border.primary} ${colorClasses.text.primary}
            `}
          >
            Keep Editing
          </button>
          <button
            onClick={onConfirm}
            className={`
              flex-1 rounded-xl py-2.5 text-sm font-semibold
              transition-opacity hover:opacity-90
              ${colorClasses.bg.darkNavy} ${colorClasses.text.inverse}
            `}
          >
            Change Type
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Step 2 header — shows selected type with change link
// ─────────────────────────────────────────────
function FormHeader({
  type,
  formTouched,
  onChangeType,
}: {
  type: TenderType;
  formTouched: boolean;
  onChangeType: () => void;
}) {
  const d = TYPE_CARD_DATA[type];
  return (
    <div className={`
      flex items-center justify-between gap-4 rounded-2xl border p-4 mb-6
      ${colorClasses.bg.primary} ${colorClasses.border.secondary}
    `}>
      <div className="flex items-center gap-3">
        {/* Type icon pill */}
        <div className={`
          inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm
          ${type === 'freelance'
            ? `${colorClasses.bg.indigoLight} ${colorClasses.text.indigo}`
            : `${colorClasses.bg.blueLight} ${colorClasses.text.blue600}`
          }
        `}>
          {type === 'freelance' ? '🧑‍💻' : '🏢'}
        </div>
        <div>
          <p className={`text-xs font-medium ${colorClasses.text.muted}`}>Creating a</p>
          <p className={`text-sm font-bold ${colorClasses.text.primary}`}>{d.title}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onChangeType}
        className={`
          flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold
          transition-all hover:opacity-80
          ${colorClasses.border.primary} ${colorClasses.text.secondary}
        `}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
        </svg>
        Change type
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function CreateTenderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read type from URL on mount for deep-link support
  const urlType = searchParams?.get('type') as TenderType | null;
  const [selectedType, setSelectedType] = useState<TenderType | null>(
    urlType === 'freelance' || urlType === 'professional' ? urlType : null
  );
  const [step, setStep] = useState<1 | 2>(
    urlType === 'freelance' || urlType === 'professional' ? 2 : 1
  );
  const [formTouched, setFormTouched] = useState(false);
  const [showChangeDialog, setShowChangeDialog] = useState(false);
  const [pendingType, setPendingType] = useState<TenderType | null>(null);

  // Sync type to URL
  useEffect(() => {
    if (selectedType) {
      const params = new URLSearchParams(searchParams?.toString() ?? '');
      params.set('type', selectedType);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, [selectedType]); // eslint-disable-line

  // Step 1 card click
  const handleTypeSelect = (type: TenderType) => {
    setSelectedType(type);
  };

  // Advance to step 2
  const handleContinue = () => {
    if (!selectedType) return;
    setStep(2);
    setFormTouched(false);
  };

  // Change type request from step 2 header
  const handleChangeTypeRequest = () => {
    if (formTouched) {
      setShowChangeDialog(true);
    } else {
      doChangeType();
    }
  };

  const doChangeType = () => {
    setStep(1);
    setSelectedType(null);
    setFormTouched(false);
    setShowChangeDialog(false);
    setPendingType(null);
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.delete('type');
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  // On success: navigate to list
  const handleSuccess = useCallback((_id: string) => {
    router.push('/dashboard/company/tenders/my-tenders');
  }, [router]);

  // Cancel: navigate back
  const handleCancel = useCallback(() => {
    router.push('/dashboard/company/tenders/my-tenders');
  }, [router]);

  // Mark form as touched on any interaction
  const handleFormTouch = useCallback(() => {
    setFormTouched(true);
  }, []);

  // ─────────────────────────────────────────────
  // Breadcrumb steps
  // ─────────────────────────────────────────────
  const breadcrumbs = [
    { label: 'My Tenders' },
    { label: 'Create Tender' },
    ...(step === 2 && selectedType
      ? [{ label: TYPE_CARD_DATA[selectedType].title, active: true }]
      : [{ label: 'Select Type', active: true }]
    ),
  ];

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <TenderDashboardLayout>
      <div className={`min-h-screen ${colorClasses.bg.surface}`}>
        <div className={`mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 ${step === 2 ? 'max-w-4xl' : 'max-w-5xl'}`}>

          {/* Breadcrumb */}
          <button
            type="button"
            onClick={handleCancel}
            className={`inline-flex items-center gap-2 text-sm font-medium mb-6 transition-colors ${colorClasses.text.muted} hover:${colorClasses.text.primary}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to My Tenders
          </button>

          <Breadcrumb steps={breadcrumbs} />

          {/* ═══ STEP 1 — TYPE SELECTOR ═══════════════════════════════════════ */}
          {step === 1 && (
            <>
              {/* Header */}
              <div className="mb-10 text-center">
                <div className={`
                inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-4
                ${colorClasses.bg.amberLight} text-[#B45309] dark:text-[#D97706]
              `}>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F1BB03] inline-block" />
                  Step 1 of 2 — Choose Type
                </div>
                <h1 className={`text-3xl sm:text-4xl font-bold tracking-tight mb-3 ${colorClasses.text.primary}`}>
                  What type of tender are you creating?
                </h1>
                <p className={`text-base max-w-xl mx-auto ${colorClasses.text.secondary}`}>
                  Choose the format that best fits your procurement need. You can always switch before submitting.
                </p>
              </div>

              {/* Cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
                <TypeCard
                  type="freelance"
                  selected={selectedType === 'freelance'}
                  onSelect={handleTypeSelect}
                />
                <TypeCard
                  type="professional"
                  selected={selectedType === 'professional'}
                  onSelect={handleTypeSelect}
                />
              </div>

              {/* Continue button */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={!selectedType}
                  className={`
                  inline-flex items-center gap-2.5 rounded-2xl px-8 py-4 text-base font-bold
                  transition-all duration-200
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none
                  ${selectedType
                      ? `${colorClasses.bg.darkNavy} ${colorClasses.text.inverse} hover:opacity-90 hover:-translate-y-0.5 shadow-lg hover:shadow-xl`
                      : `${colorClasses.bg.secondary} ${colorClasses.text.muted}`
                    }
                `}
                >
                  Continue
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Helper note */}
              <p className={`text-center text-xs mt-4 ${colorClasses.text.muted}`}>
                Not sure? You can read our{' '}
                <a href="#" className="underline underline-offset-2 hover:opacity-80">tender type guide</a>{' '}
                for more details.
              </p>
            </>
          )}

          {/* ═══ STEP 2 — FORM ════════════════════════════════════════════════ */}
          {step === 2 && selectedType && (
            <div onClickCapture={handleFormTouch}>
              {/* Step label */}
              <div className="mb-6 text-center sm:text-left">
                <div className={`
                inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-3
                ${colorClasses.bg.amberLight} text-[#B45309] dark:text-[#D97706]
              `}>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F1BB03] inline-block" />
                  Step 2 of 2 — Fill in Details
                </div>
                <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${colorClasses.text.primary}`}>
                  {TYPE_CARD_DATA[selectedType].title}
                </h1>
              </div>

              {/* Type header with change link */}
              <FormHeader
                type={selectedType}
                formTouched={formTouched}
                onChangeType={handleChangeTypeRequest}
              />

              {/* The actual form */}
              {selectedType === 'freelance' ? (
                <FreelanceTenderForm
                  onSuccess={handleSuccess}
                  onCancel={handleCancel}
                />
              ) : (
                <ProfessionalTenderForm
                  onSuccess={handleSuccess}
                  onCancel={handleCancel}
                />
              )}
            </div>
          )}
        </div>

        {/* Confirm change-type dialog */}
        {showChangeDialog && (
          <ChangeTypeDialog
            onConfirm={doChangeType}
            onCancel={() => setShowChangeDialog(false)}
          />
        )}
      </div>
    </TenderDashboardLayout>
  );
}