// src/components/tender/freelance/FreelanceTenderApplicationForm.tsx
'use client';
import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useSubmitApplication } from '@/hooks/useFreelanceTender';
import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import type { FreelanceTender } from '@/types/tender.types';

interface FreelanceTenderApplicationFormProps {
  tender: FreelanceTender;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormValues {
  coverLetter: string;
  proposedRate: number;
  proposedRateCurrency: string;
  estimatedTimeline: { duration: number; unit: string };
  portfolioLinks: { url: string }[];
  screeningAnswers: { answer: string }[];
}

const inputClass = `
  w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition
  focus:ring-2 focus:ring-[#F1BB03] focus:border-[#F1BB03]
`;
const labelClass = `block text-sm font-medium mb-1 ${colorClasses.text.secondary}`;
const CURRENCIES = ['ETB', 'USD', 'EUR', 'GBP', 'SAR', 'AED'];
const TIMELINE_UNITS = ['hours', 'days', 'weeks', 'months'];

export default function FreelanceTenderApplicationForm({
  tender,
  isOpen,
  onClose,
  onSuccess,
}: FreelanceTenderApplicationFormProps) {
  const { breakpoint } = useResponsive();
  const isMobile = breakpoint === 'mobile';
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);

  const { mutateAsync, isPending } = useSubmitApplication();

  const screeningQuestions: any[] =
    (tender.details?.screeningQuestions as any[]) ?? [];

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      coverLetter: '',
      proposedRate: undefined,
      proposedRateCurrency: 'ETB',
      estimatedTimeline: { duration: undefined as any, unit: 'weeks' },
      portfolioLinks: [],
      screeningAnswers: screeningQuestions.map(() => ({ answer: '' })),
    },
  });

  const {
    fields: linkFields,
    append: appendLink,
    remove: removeLink,
  } = useFieldArray({ control, name: 'portfolioLinks' });

  const watchCoverLetter = watch('coverLetter') ?? '';

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    try {
      const data: any = {
        coverLetter: values.coverLetter,
        proposedRate: values.proposedRate,
        proposedRateCurrency: values.proposedRateCurrency,
      };

      if (values.estimatedTimeline?.duration) {
        data.estimatedTimeline = values.estimatedTimeline;
      }

      if (values.portfolioLinks.length > 0) {
        data.portfolioLinks = values.portfolioLinks.map((l) => l.url).join(',');
      }

      if (screeningQuestions.length > 0) {
        data.screeningAnswers = JSON.stringify(
          screeningQuestions.map((q, i) => ({
            question: typeof q === 'string' ? q : q.text,
            answer: values.screeningAnswers[i]?.answer ?? '',
          }))
        );
      }

      await mutateAsync({ tenderId: tender._id, data, cvFile: cvFile ?? undefined });
      setSubmitted(true);
      onSuccess();
    } catch (err: any) {
      setSubmitError(
        err.response?.data?.message || err.message || 'Failed to submit application'
      );
    }
  };

  if (!isOpen) return null;

  // ── Overlay backdrop
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`
          fixed z-50 flex flex-col
          ${colorClasses.bg.primary}
          shadow-2xl
          ${isMobile
            ? 'inset-x-0 bottom-0 rounded-t-2xl max-h-[92vh]'
            : 'top-0 right-0 h-full w-[480px] rounded-l-2xl'}
        `}
        suppressHydrationWarning
      >
        {/* ── Header ── */}
        <div
          className={`
            flex items-start justify-between gap-3 px-6 py-5 border-b shrink-0
            ${colorClasses.border.primary}
          `}
        >
          <div>
            <p className={`text-xs font-medium uppercase tracking-wide ${colorClasses.text.secondary}`}>
              Apply
            </p>
            <h2 className={`text-base font-semibold mt-0.5 line-clamp-2 ${colorClasses.text.primary}`}>
              {tender.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`shrink-0 p-1.5 rounded-full ${colorClasses.text.secondary} hover:${colorClasses.bg.secondary}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Success state ── */}
        {submitted ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 py-12 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${colorClasses.bg.emeraldLight}`}>
              <svg className={`w-8 h-8 ${colorClasses.text.emerald}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className={`text-lg font-bold ${colorClasses.text.primary}`}>Application Submitted!</h3>
            <p className={`text-sm ${colorClasses.text.secondary}`}>
              Your application for <strong>{tender.title}</strong> has been submitted. The client will review it shortly.
            </p>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${colorClasses.text.amber} ${colorClasses.bg.amberLight}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              Pending Review
            </span>
            <button
              type="button"
              onClick={onClose}
              className={`mt-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white ${colorClasses.bg.darkNavy} hover:opacity-90`}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* ── Scrollable body ── */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                {/* Cover Letter */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={labelClass}>Cover Letter *</label>
                    <span className={`text-xs ${watchCoverLetter.length > 1900 ? colorClasses.text.red : colorClasses.text.secondary}`}>
                      {watchCoverLetter.length}/2000
                    </span>
                  </div>
                  <textarea
                    {...register('coverLetter', {
                      required: 'Cover letter is required',
                      minLength: { value: 100, message: 'At least 100 characters required' },
                      maxLength: { value: 2000, message: 'Max 2000 characters' },
                    })}
                    rows={8}
                    className={`${inputClass} resize-none ${colorClasses.bg.primary} ${colorClasses.border.primary} ${colorClasses.text.primary}`}
                    placeholder="Introduce yourself and explain why you're the best fit for this project..."
                  />
                  {errors.coverLetter && (
                    <p className={`text-xs mt-1 ${colorClasses.text.red}`}>{errors.coverLetter.message}</p>
                  )}
                </div>

                {/* Proposed Rate */}
                <div>
                  <label className={labelClass}>
                    {(tender as any).budget?.type === 'fixed' ? 'Bid Amount' : 'Proposed Rate'} *
                  </label>
                  <div className="flex gap-2">
                    <Controller
                      name="proposedRateCurrency"
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          className={`${inputClass} w-24 ${colorClasses.bg.primary} ${colorClasses.border.primary} ${colorClasses.text.primary}`}
                        >
                          {CURRENCIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      )}
                    />
                    <input
                      {...register('proposedRate', {
                        required: 'Rate is required',
                        min: { value: 1, message: 'Must be greater than 0' },
                        valueAsNumber: true,
                      })}
                      type="number"
                      className={`${inputClass} flex-1 ${colorClasses.bg.primary} ${colorClasses.border.primary} ${colorClasses.text.primary}`}
                      placeholder="e.g. 50000"
                    />
                  </div>
                  {errors.proposedRate && (
                    <p className={`text-xs mt-1 ${colorClasses.text.red}`}>{errors.proposedRate.message}</p>
                  )}
                </div>

                {/* Timeline */}
                <div>
                  <label className={labelClass}>Estimated Timeline (optional)</label>
                  <div className="flex gap-3">
                    <input
                      {...register('estimatedTimeline.duration', { min: 1, valueAsNumber: true })}
                      type="number"
                      className={`${inputClass} w-24 ${colorClasses.bg.primary} ${colorClasses.border.primary} ${colorClasses.text.primary}`}
                      placeholder="4"
                    />
                    <Controller
                      name="estimatedTimeline.unit"
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          className={`${inputClass} flex-1 ${colorClasses.bg.primary} ${colorClasses.border.primary} ${colorClasses.text.primary}`}
                        >
                          {TIMELINE_UNITS.map((u) => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      )}
                    />
                  </div>
                </div>

                {/* Portfolio Links */}
                <div>
                  <label className={labelClass}>Portfolio Links (optional)</label>
                  <div className="space-y-2">
                    {linkFields.map((field, index) => (
                      <div key={field.id} className="flex gap-2">
                        <input
                          {...register(`portfolioLinks.${index}.url`, {
                            pattern: { value: /^https?:\/\/.+/, message: 'Must be a valid URL' },
                          })}
                          className={`${inputClass} flex-1 ${colorClasses.bg.primary} ${colorClasses.border.primary} ${colorClasses.text.primary}`}
                          placeholder="https://github.com/you/project"
                        />
                        <button
                          type="button"
                          onClick={() => removeLink(index)}
                          className={`shrink-0 p-2 rounded-xl ${colorClasses.text.red} hover:${colorClasses.bg.redLight}`}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    {linkFields.length < 5 && (
                      <button
                        type="button"
                        onClick={() => appendLink({ url: '' })}
                        className={`flex items-center gap-1.5 text-sm font-medium ${colorClasses.text.indigo} hover:opacity-80`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Link
                      </button>
                    )}
                  </div>
                </div>

                {/* CV Upload */}
                <div>
                  <label className={labelClass}>CV / Resume (optional)</label>
                  <div
                    className={`
                      relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer
                      transition-colors ${cvFile ? 'border-[#F1BB03]' : `${colorClasses.border.primary}`}
                      ${colorClasses.bg.secondary}
                    `}
                  >
                    {cvFile ? (
                      <div className="flex items-center gap-3">
                        <span className="text-lg">📄</span>
                        <span className={`flex-1 text-sm text-left truncate ${colorClasses.text.primary}`}>{cvFile.name}</span>
                        <button
                          type="button"
                          onClick={() => setCvFile(null)}
                          className={`text-xs ${colorClasses.text.red} hover:opacity-70`}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className={`text-sm ${colorClasses.text.secondary}`}>PDF, DOC, or DOCX</p>
                        <p className={`text-xs mt-1 ${colorClasses.text.secondary}`}>Single file</p>
                      </>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
                    />
                  </div>
                </div>

                {/* Screening Answers */}
                {screeningQuestions.length > 0 && (
                  <div className="space-y-4">
                    <p className={`text-sm font-semibold ${colorClasses.text.primary}`}>
                      Screening Questions
                    </p>
                    {screeningQuestions.map((q: any, i) => {
                      const questionText = typeof q === 'string' ? q : q.text;
                      const isRequired = typeof q === 'object' && q.required;
                      return (
                        <div key={i}>
                          <label className={labelClass}>
                            {i + 1}. {questionText}{isRequired && <span className={colorClasses.text.red}> *</span>}
                          </label>
                          <textarea
                            {...register(`screeningAnswers.${i}.answer`, {
                              required: isRequired ? 'This answer is required' : false,
                            })}
                            rows={3}
                            className={`${inputClass} resize-none ${colorClasses.bg.primary} ${colorClasses.border.primary} ${colorClasses.text.primary}`}
                            placeholder="Your answer..."
                          />
                          {(errors.screeningAnswers as any)?.[i]?.answer && (
                            <p className={`text-xs mt-1 ${colorClasses.text.red}`}>
                              {(errors.screeningAnswers as any)[i].answer.message}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Sticky footer ── */}
              <div
                className={`
                  shrink-0 flex items-center justify-between gap-3
                  px-6 py-4 border-t ${colorClasses.border.primary}
                  ${colorClasses.bg.primary}
                `}
              >
                <button
                  type="button"
                  onClick={onClose}
                  className={`text-sm font-medium ${colorClasses.text.secondary} hover:${colorClasses.text.primary}`}
                >
                  Cancel
                </button>

                <div className="flex flex-col items-end gap-1">
                  {submitError && (
                    <p className={`text-xs ${colorClasses.text.red}`}>{submitError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={isPending}
                    className={`
                      flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white
                      ${colorClasses.bg.darkNavy}
                      hover:opacity-90 active:scale-95 transition-all
                      disabled:opacity-50
                    `}
                  >
                    {isPending ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Submitting…
                      </>
                    ) : (
                      'Submit Application'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </>
        )}
      </aside>
    </>
  );
}