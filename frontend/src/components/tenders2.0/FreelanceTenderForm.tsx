/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/tender/freelance/FreelanceTenderForm.tsx
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import {
    useCreateFreelanceTender,
    useUpdateFreelanceTender,
    useFreelanceTenderEditData,
    useFreelanceTenderCategories,
    usePublishFreelanceTender,
    useDeleteFreelanceAttachment,
} from '@/hooks/useFreelanceTender';
import { colorClasses } from '@/utils/color';
import type { CreateFreelanceTenderData } from '@/types/tender.types';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';

// ─── Quill (SSR-safe) ─────────────────────────────────────────────────────────
const ReactQuill = dynamic(
    async () => {
        await import('react-quill-new/dist/quill.snow.css');
        const mod = await import('react-quill-new');
        return mod.default;
    },
    {
        ssr: false,
        loading: () => (
            <div className={`h-64 rounded-xl border animate-pulse ${colorClasses.bg.secondary} ${colorClasses.border.primary}`} />
        ),
    }
);

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface FreelanceTenderFormProps {
    tenderId?: string;
    onSuccess: (id: string) => void;
    onCancel: () => void;
}

type EngagementType = 'fixed_price' | 'hourly' | 'fixed_salary' | 'negotiable';
type ExperienceLevel = 'entry' | 'intermediate' | 'expert';
type ProjectType = 'one_time' | 'ongoing' | 'complex';
type LocationType = 'remote' | 'on_site' | 'hybrid' | 'flexible';
type SalaryPeriod = 'monthly' | 'yearly';
type Currency = 'ETB' | 'USD' | 'EUR' | 'GBP';
type TimelineUnit = 'hours' | 'days' | 'weeks' | 'months';
type SubmitAction = 'draft' | 'publish';

interface ScreeningQuestion {
    text: string;
    required: boolean;
}

interface FormValues {
    // Step 1 — Basics
    title: string;
    briefDescription: string;
    procurementCategory: string;
    procurementSubcategory: string;
    deadline: string;
    maxApplications?: number;
    // Step 2 — Details
    engagementType: EngagementType;
    budget: { min?: number; max?: number; currency: Currency };
    salaryRange: { min?: number; max?: number; currency: Currency; period: SalaryPeriod };
    weeklyHours?: number;
    experienceLevel: ExperienceLevel;
    projectType: ProjectType;
    locationType: LocationType;
    estimatedTimeline: { value: number; unit: TimelineUnit };
    numberOfPositions: number;
    skillsRequired: string[];
    languagePreference: string;
    ndaRequired: boolean;
    portfolioRequired: boolean;
    // Step 3 — Description & Screening
    description: string;
    screeningQuestions: ScreeningQuestion[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CURRENCIES: Currency[] = ['ETB', 'USD', 'EUR', 'GBP'];
const SALARY_PERIODS: { value: SalaryPeriod; label: string }[] = [
    { value: 'monthly', label: 'per month' },
    { value: 'yearly', label: 'per year' },
];
const TIMELINE_UNITS: TimelineUnit[] = ['hours', 'days', 'weeks', 'months'];
const ACCEPTED_FILES = '.pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.webp';
const MAX_DESCRIPTION_CHARS = 10_000;
const MAX_BRIEF_CHARS = 500;

const STEPS = [
    {
        id: 1,
        label: 'Basics',
        title: 'Basics & Category',
        subtitle: 'Title, summary, category and deadline',
        accentColor: 'from-indigo-600 to-indigo-500',
        dotColor: 'bg-indigo-500',
    },
    {
        id: 2,
        label: 'Details',
        title: 'Project Details & Budget',
        subtitle: 'Engagement type, budget, skills and requirements',
        accentColor: 'from-emerald-600 to-emerald-500',
        dotColor: 'bg-emerald-500',
    },
    {
        id: 3,
        label: 'Description',
        title: 'Description & Screening',
        subtitle: 'Full description, questions and file attachments',
        accentColor: 'from-purple-600 to-purple-500',
        dotColor: 'bg-purple-500',
    },
    {
        id: 4,
        label: 'Review',
        title: 'Review & Publish',
        subtitle: 'Check everything before publishing',
        accentColor: 'from-[#0A2540] to-[#1a3a5c]',
        dotColor: 'bg-[#0A2540]',
    },
] as const;

const FILE_TYPE_COLORS: Record<string, string> = {
    pdf: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    doc: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    docx: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    xls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    xlsx: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    txt: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    png: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    jpg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    jpeg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    gif: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    webp: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
};

const QUILL_MODULES = {
    toolbar: [
        [{ header: [1, 2, false] }],
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'unordered' }],
        ['blockquote', 'code-block', 'link'],
        ['clean'],
    ],
};
const QUILL_FORMATS = [
    'header', 'bold', 'italic', 'underline', 'list', 'blockquote', 'code-block', 'link',
];

// ─── Style helpers ────────────────────────────────────────────────────────────
const inputBase =
    `w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all duration-150
   focus:ring-2 focus:ring-[#F1BB03]/60 focus:border-[#F1BB03] placeholder:opacity-50`;

const getInputClass = () =>
    `${inputBase} ${colorClasses.bg.primary} ${colorClasses.border.primary} ${colorClasses.text.primary}`;

const labelClass = `block text-sm font-medium mb-1.5 ${colorClasses.text.secondary}`;
const errorClass = `text-xs mt-1.5 text-red-500 flex items-center gap-1`;
const hintClass = `text-xs mt-1.5 ${colorClasses.text.muted}`;

function tomorrowMin(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setSeconds(0, 0);
    return d.toISOString().slice(0, 16);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Vertical progress stepper — Upwork-style */
function ProgressStepper({
    currentStep,
    completedSteps,
    onStepClick,
}: {
    currentStep: number;
    completedSteps: Set<number>;
    onStepClick: (step: number) => void;
}) {
    return (
        <div className="hidden lg:flex flex-col gap-2 w-52 shrink-0">
            {STEPS.map((s, idx) => {
                const isDone = completedSteps.has(s.id);
                const isActive = currentStep === s.id;
                const isClickable = isDone || s.id < currentStep;

                return (
                    <button
                        key={s.id}
                        type="button"
                        disabled={!isClickable}
                        onClick={() => isClickable && onStepClick(s.id)}
                        className={`
              group flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-200
              ${isActive
                                ? `${colorClasses.bg.primary} shadow-sm ring-2 ring-[#F1BB03]/30`
                                : isClickable
                                    ? `${colorClasses.bg.secondary} hover:${colorClasses.bg.primary} hover:shadow-sm cursor-pointer`
                                    : `${colorClasses.bg.secondary} cursor-default opacity-50`
                            }
            `}
                    >
                        {/* Step circle */}
                        <div className={`
              shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
              ${isDone
                                ? 'bg-[#F1BB03] text-[#0A2540]'
                                : isActive
                                    ? 'bg-[#0A2540] text-white ring-2 ring-[#F1BB03]/40 ring-offset-2'
                                    : `${colorClasses.bg.secondary} ${colorClasses.text.muted} border ${colorClasses.border.primary}`
                            }
            `}>
                            {isDone ? (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            ) : s.id}
                        </div>

                        {/* Label */}
                        <div className="min-w-0 pt-0.5">
                            <p className={`text-xs font-semibold leading-tight ${isActive ? colorClasses.text.primary : colorClasses.text.secondary}`}>
                                {s.label}
                            </p>
                            <p className={`text-[10px] leading-tight mt-0.5 truncate ${colorClasses.text.muted}`}>
                                {s.subtitle.split(',')[0]}
                            </p>
                        </div>
                    </button>
                );
            })}

            {/* Connector lines */}
            <style dangerouslySetInnerHTML={{
                __html: `
          .step-connector { position: absolute; left: 19px; top: 40px; width: 2px; height: calc(100% - 40px); }
        `
            }} />
        </div>
    );
}

/** Mobile horizontal step bar */
function MobileStepBar({ currentStep, completedSteps }: { currentStep: number; completedSteps: Set<number> }) {
    return (
        <div className="flex items-center justify-between mb-6">
            {STEPS.map((s, idx) => {
                const isDone = completedSteps.has(s.id);
                const isActive = currentStep === s.id;
                return (
                    <div key={s.id} className="flex items-center flex-1">
                        <div className="flex flex-col items-center gap-1">
                            <div className={`
                w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${isDone ? 'bg-[#F1BB03] text-[#0A2540]' : isActive ? 'bg-[#0A2540] text-white ring-2 ring-[#F1BB03]/40 ring-offset-1' : `border-2 ${colorClasses.border.primary} ${colorClasses.text.muted}`}
              `}>
                                {isDone ? (
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : s.id}
                            </div>
                            <span className={`text-[9px] font-medium hidden sm:block ${isActive ? colorClasses.text.primary : colorClasses.text.muted}`}>
                                {s.label}
                            </span>
                        </div>
                        {idx < STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-1.5 mb-3 sm:mb-4 transition-colors ${isDone ? 'bg-[#F1BB03]' : colorClasses.border.primary}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/** Step header bar */
function StepHeader({ step }: { step: (typeof STEPS)[number] }) {
    return (
        <div className={`-mx-6 -mt-6 mb-6 px-6 py-5 rounded-t-2xl bg-gradient-to-r ${step.accentColor}`}>
            <div className="flex items-center gap-2 mb-1">
                <span className="text-white/60 text-xs font-semibold uppercase tracking-widest">
                    Step {step.id} of {STEPS.length}
                </span>
                <div className="flex gap-1 ml-auto">
                    {STEPS.map((s) => (
                        <div
                            key={s.id}
                            className={`h-1.5 rounded-full transition-all duration-300 ${s.id <= step.id ? 'bg-white/80 w-6' : 'bg-white/25 w-3'}`}
                        />
                    ))}
                </div>
            </div>
            <h2 className="text-white text-lg font-bold leading-tight">{step.title}</h2>
            <p className="text-white/70 text-xs mt-0.5">{step.subtitle}</p>
        </div>
    );
}

/** Reusable form field wrapper */
function Field({
    label,
    error,
    hint,
    required,
    children,
    className,
}: {
    label: string;
    error?: string;
    hint?: string;
    required?: boolean;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={className}>
            <label className={labelClass}>
                {label}
                {required && <span className="text-red-400 ml-0.5">*</span>}
            </label>
            {children}
            {hint && !error && <p className={hintClass}>{hint}</p>}
            {error && (
                <p className={errorClass}>
                    <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                </p>
            )}
        </div>
    );
}

/** Animated toggle switch */
function ToggleSwitch({
    value,
    onChange,
    label,
    description,
    disabled,
}: {
    value: boolean;
    onChange: (v: boolean) => void;
    label: string;
    description?: string;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={value}
            disabled={disabled}
            onClick={() => onChange(!value)}
            className={`
        group flex items-center justify-between w-full p-4 rounded-xl border-2 transition-all duration-200 text-left
        ${value
                    ? 'border-[#F1BB03]/60 bg-[#FFFBEB] dark:bg-[#1a1600]'
                    : `${colorClasses.border.primary} ${colorClasses.bg.secondary}`
                }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[#F1BB03]/40'}
      `}
        >
            <div className="min-w-0 pr-3">
                <p className={`text-sm font-semibold ${colorClasses.text.primary}`}>{label}</p>
                {description && (
                    <p className={`text-xs mt-0.5 leading-relaxed ${colorClasses.text.muted}`}>{description}</p>
                )}
            </div>
            {/* Track */}
            <div
                className={`
          relative shrink-0 w-12 h-6 rounded-full transition-colors duration-300 border
          ${value ? 'bg-[#F1BB03] border-[#F1BB03]' : `${colorClasses.bg.primary} ${colorClasses.border.primary}`}
        `}
            >
                {/* Thumb */}
                <span
                    className={`
            absolute top-0.5 w-5 h-5 rounded-full shadow-sm transition-all duration-300
            ${value ? 'translate-x-6 bg-[#0A2540]' : 'translate-x-0.5 bg-white dark:bg-gray-300'}
          `}
                />
            </div>
        </button>
    );
}

/** Pill group selector */
function PillGroup<T extends string>({
    value,
    onChange,
    options,
}: {
    value: T;
    onChange: (v: T) => void;
    options: { value: T; label: string; icon?: React.ReactNode }[];
}) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map((opt) => (
                <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange(opt.value)}
                    className={`
            inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150
            ${value === opt.value
                            ? 'bg-[#F1BB03] border-[#F1BB03] text-[#0A2540] shadow-sm shadow-[#F1BB03]/30'
                            : `${colorClasses.border.primary} ${colorClasses.text.secondary} hover:border-[#F1BB03]/60 ${colorClasses.bg.secondary}`
                        }
          `}
                >
                    {opt.icon}
                    {opt.label}
                </button>
            ))}
        </div>
    );
}

/** Engagement type card selector */
function EngagementTypeSelector({
    value,
    onChange,
}: {
    value: EngagementType;
    onChange: (v: EngagementType) => void;
}) {
    const cards: {
        value: EngagementType;
        icon: React.ReactNode;
        title: string;
        desc: string;
        tag: string;
    }[] = [
            {
                value: 'fixed_price',
                icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                ),
                title: 'Fixed Price',
                desc: 'One total payment for the entire project',
                tag: 'Project-based',
            },
            {
                value: 'hourly',
                icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                ),
                title: 'Hourly Rate',
                desc: 'Pay based on time tracked',
                tag: 'Time-based',
            },
            {
                value: 'fixed_salary',
                icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                ),
                title: 'Fixed Salary',
                desc: 'Monthly or yearly salary role',
                tag: 'Long-term',
            },
            {
                value: 'negotiable',
                icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                ),
                title: 'Negotiable',
                desc: 'Budget discussed with applicant',
                tag: 'Flexible',
            },
        ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {cards.map((card) => {
                const isSelected = value === card.value;
                return (
                    <button
                        key={card.value}
                        type="button"
                        onClick={() => onChange(card.value)}
                        className={`
              flex flex-col gap-3 p-4 rounded-2xl border-2 text-left transition-all duration-200
              ${isSelected
                                ? 'border-[#F1BB03] bg-[#FFFBEB] dark:bg-[#1a1600] shadow-md shadow-[#F1BB03]/10'
                                : `${colorClasses.border.primary} ${colorClasses.bg.secondary} hover:border-[#F1BB03]/50 hover:shadow-sm`
                            }
            `}
                    >
                        <div className={`
              p-2.5 rounded-xl w-fit transition-colors
              ${isSelected ? 'bg-[#F1BB03] text-[#0A2540]' : `${colorClasses.bg.primary} ${colorClasses.text.muted}`}
            `}>
                            {card.icon}
                        </div>
                        <div>
                            <p className={`font-semibold text-sm ${colorClasses.text.primary}`}>{card.title}</p>
                            <p className={`text-xs mt-0.5 leading-relaxed ${colorClasses.text.muted}`}>{card.desc}</p>
                        </div>
                        <span className={`
              text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide w-fit
              ${isSelected ? 'bg-[#F1BB03]/20 text-[#0A2540] dark:text-[#F1BB03]' : `${colorClasses.bg.primary} ${colorClasses.text.muted}`}
            `}>
                            {card.tag}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

/** Skills chip input */
function SkillsInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
    const [input, setInput] = useState('');
    const ref = useRef<HTMLInputElement>(null);

    const add = useCallback((raw: string) => {
        const skill = raw.trim().replace(/,+$/, '');
        if (!skill || value.includes(skill) || value.length >= 20) return;
        onChange([...value, skill]);
        setInput('');
    }, [value, onChange]);

    const remove = (s: string) => onChange(value.filter((v) => v !== s));

    return (
        <div
            onClick={() => ref.current?.focus()}
            className={`
        flex flex-wrap gap-2 p-2.5 rounded-xl border min-h-[52px] cursor-text transition-all duration-150
        ${colorClasses.bg.primary} ${colorClasses.border.primary}
        focus-within:ring-2 focus-within:ring-[#F1BB03]/60 focus-within:border-[#F1BB03]
      `}
        >
            {value.map((s) => (
                <span
                    key={s}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                >
                    {s}
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); remove(s); }}
                        className="hover:opacity-70 ml-0.5 text-indigo-500"
                        aria-label={`Remove ${s}`}
                    >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </span>
            ))}
            {value.length < 20 && (
                <input
                    ref={ref}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input); }
                        else if (e.key === 'Backspace' && !input && value.length) remove(value[value.length - 1]);
                    }}
                    onBlur={() => input.trim() && add(input)}
                    placeholder={value.length === 0 ? 'Type a skill, then press Enter…' : ''}
                    className={`flex-1 min-w-[160px] bg-transparent outline-none text-sm py-0.5 px-1 ${colorClasses.text.primary} placeholder:${colorClasses.text.muted}`}
                />
            )}
        </div>
    );
}

/** Drag-and-drop file zone */
function FileDropzone({
    files,
    onAdd,
    onRemove,
}: {
    files: File[];
    onAdd: (f: File[]) => void;
    onRemove: (i: number) => void;
}) {
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFiles = (list: FileList | null) => {
        if (!list) return;
        const valid = Array.from(list).filter((f) => f.size <= 10 * 1024 * 1024);
        onAdd(valid.slice(0, 20 - files.length));
    };

    const ext = (f: File) => f.name.split('.').pop()?.toLowerCase() ?? '';
    const fmtSize = (b: number) =>
        b >= 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.round(b / 1000)} KB`;

    return (
        <div className="space-y-3">
            <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
                onClick={() => inputRef.current?.click()}
                className={`
          border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200
          ${dragging
                        ? 'border-[#F1BB03] bg-[#FFFBEB] dark:bg-[#1a1600] scale-[1.01]'
                        : `${colorClasses.border.primary} ${colorClasses.bg.secondary} hover:border-[#F1BB03]/60 hover:bg-opacity-80`
                    }
        `}
            >
                <div className={`
          w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-colors
          ${dragging ? 'bg-[#F1BB03]/20' : colorClasses.bg.primary}
        `}>
                    <svg
                        className={`w-6 h-6 transition-colors ${dragging ? 'text-[#F1BB03]' : colorClasses.text.muted}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                </div>
                <p className={`text-sm font-semibold ${colorClasses.text.primary}`}>
                    Drop files or{' '}
                    <span className="text-[#F1BB03] underline underline-offset-2">browse</span>
                </p>
                <p className={`text-xs mt-1.5 ${colorClasses.text.muted}`}>
                    PDF, DOC, XLS, TXT, JPG, PNG — max 10 MB · up to 20 files
                </p>
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept={ACCEPTED_FILES}
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                />
            </div>

            {files.length > 0 && (
                <ul className="space-y-2">
                    {files.map((f, i) => {
                        const fileExt = ext(f);
                        const colorClass =
                            FILE_TYPE_COLORS[fileExt] ??
                            `${colorClasses.bg.secondary} ${colorClasses.text.muted}`;
                        return (
                            <li
                                key={i}
                                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm
                  ${colorClasses.border.primary} ${colorClasses.bg.primary}
                `}
                            >
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg ${colorClass}`}>
                                    {fileExt}
                                </span>
                                <span className={`flex-1 truncate ${colorClasses.text.primary}`}>{f.name}</span>
                                <span className={`text-xs shrink-0 ${colorClasses.text.muted}`}>{fmtSize(f.size)}</span>
                                <button
                                    type="button"
                                    onClick={() => onRemove(i)}
                                    aria-label="Remove file"
                                    className="shrink-0 text-red-400 hover:text-red-600 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

/** Inline section divider */
function SectionDivider({ title, description }: { title: string; description?: string }) {
    return (
        <div className="flex items-start gap-3 pt-2">
            <div className="shrink-0 w-1 h-full min-h-[20px] rounded-full bg-[#F1BB03] self-stretch" />
            <div>
                <h3 className={`text-sm font-semibold ${colorClasses.text.primary}`}>{title}</h3>
                {description && (
                    <p className={`text-xs mt-0.5 ${colorClasses.text.muted}`}>{description}</p>
                )}
            </div>
        </div>
    );
}

/** Card wrapper for grouped settings */
function SettingsCard({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={`
        p-4 rounded-2xl border space-y-4
        ${colorClasses.border.primary} ${colorClasses.bg.secondary}
        ${className ?? ''}
      `}
        >
            {children}
        </div>
    );
}

/** Submit button with loading spinner */
function SubmitButton({
    action,
    isLoading,
    loadingText,
    children,
    variant,
    onClick,
    disabled,
}: {
    action: SubmitAction;
    isLoading: boolean;
    loadingText: string;
    children: React.ReactNode;
    variant: 'primary' | 'secondary';
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            disabled={disabled || isLoading}
            onClick={onClick}
            className={`
        inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold
        transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed
        ${variant === 'primary'
                    ? 'bg-[#0A2540] text-white hover:bg-[#0A2540]/90 shadow-sm shadow-[#0A2540]/20'
                    : `border-2 ${colorClasses.border.primary} ${colorClasses.text.secondary} hover:${colorClasses.bg.secondary}`
                }
      `}
        >
            {isLoading ? (
                <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    {loadingText}
                </>
            ) : children}
        </button>
    );
}

const QUILL_CSS = `
  .ql-toolbar.ql-snow {
    border-radius: 12px 12px 0 0;
    border: 1px solid var(--ql-border);
    background: var(--ql-toolbar-bg);
    padding: 8px 12px;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .ql-container.ql-snow {
    border-radius: 0 0 12px 12px;
    border: 1px solid var(--ql-border);
    background: var(--ql-bg);
    font-size: 14px;
    font-family: inherit;
  }

  .ql-editor {
    min-height: 260px;
    line-height: 1.7;
    padding: 16px;
    color: var(--ql-text);
  }

  .ql-editor.ql-blank::before {
    color: var(--ql-placeholder);
    font-style: normal;
  }

  /* Toolbar buttons */
  .ql-snow .ql-toolbar button {
    transition: all 0.2s ease;
  }

  .ql-snow .ql-toolbar button:hover,
  .ql-snow .ql-toolbar button.ql-active {
    color: #F1BB03;
  }

  .ql-snow .ql-toolbar button:hover .ql-stroke,
  .ql-snow .ql-toolbar button.ql-active .ql-stroke {
    stroke: #F1BB03;
  }

  .ql-snow .ql-toolbar button:hover .ql-fill,
  .ql-snow .ql-toolbar button.ql-active .ql-fill {
    fill: #F1BB03;
  }
`;

// ─── Main Form ────────────────────────────────────────────────────────────────
export default function FreelanceTenderForm({
    tenderId,
    onSuccess,
    onCancel,
}: FreelanceTenderFormProps) {
    const isEdit = !!tenderId;

    const [step, setStep] = useState(1);
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
    const [newFiles, setNewFiles] = useState<File[]>([]);
    // FIX: Track which submit action is currently in flight — no async state bug
    const [pendingAction, setPendingAction] = useState<SubmitAction | null>(null);
const { breakpoint, getTouchTargetSize } = useResponsive();
    const { data: categories = [] } = useFreelanceTenderCategories();
    const { data: editData } = useFreelanceTenderEditData(tenderId ?? '', { enabled: isEdit });

    const createMutation = useCreateFreelanceTender();
    const updateMutation = useUpdateFreelanceTender();
    const publishMutation = usePublishFreelanceTender();
    const deleteAttachment = useDeleteFreelanceAttachment();

    const isCreating = createMutation.isPending;
    const isUpdating = updateMutation.isPending;
    const isPublishing = publishMutation.isPending;
    const isMutating = isCreating || isUpdating || isPublishing;

    const {
        register,
        handleSubmit,
        control,
        watch,
        reset,
        trigger,
        formState: { errors },
    } = useForm<FormValues>({
        defaultValues: {
            title: '',
            briefDescription: '',
            procurementCategory: '',
            procurementSubcategory: '',
            deadline: '',
            engagementType: 'fixed_price',
            budget: { currency: 'ETB' },
            salaryRange: { currency: 'ETB', period: 'monthly' },
            experienceLevel: 'intermediate',
            projectType: 'one_time',
            locationType: 'remote',
            estimatedTimeline: { value: 1, unit: 'weeks' },
            numberOfPositions: 1,
            skillsRequired: [],
            languagePreference: '',
            ndaRequired: false,
            portfolioRequired: false,
            description: '',
            screeningQuestions: [],
        },
    });

    // Populate form in edit mode
    useEffect(() => {
        if (!editData) return;
        const sq = ((editData.details as any)?.screeningQuestions ?? []).map((q: any) =>
            typeof q === 'string'
                ? { text: q, required: false }
                : { text: q.text ?? q.question ?? '', required: Boolean(q.required) }
        );
        const cat = (editData as any).procurementCategory ?? '';
        const [mainCat, subCat] = cat.includes(' — ') ? cat.split(' — ') : [cat, ''];

        reset({
            title: editData.title ?? '',
            briefDescription: (editData as any).briefDescription ?? '',
            procurementCategory: mainCat,
            procurementSubcategory: subCat,
            deadline: editData.deadline
                ? new Date(editData.deadline).toISOString().slice(0, 16)
                : '',
            maxApplications: (editData as any).maxApplications,
            engagementType: (editData.details?.engagementType as EngagementType) ?? 'fixed_price',
            budget: {
                min: editData.details?.budget?.min,
                max: editData.details?.budget?.max,
                currency: (editData.details?.budget?.currency as Currency) ?? 'ETB',
            },
            salaryRange: {
                min: (editData.details as any)?.salaryRange?.min,
                max: (editData.details as any)?.salaryRange?.max,
                currency: (editData.details as any)?.salaryRange?.currency ?? 'ETB',
                period: (editData.details as any)?.salaryRange?.period ?? 'monthly',
            },
            weeklyHours: editData.details?.weeklyHours,
            experienceLevel: (editData.details?.experienceLevel as ExperienceLevel) ?? 'intermediate',
            projectType: (editData.details?.projectType as ProjectType) ?? 'one_time',
            locationType: ((editData.details as any)?.locationType as LocationType) ?? 'remote',
            estimatedTimeline: {
                value: (editData.details as any)?.estimatedTimeline?.value ?? 1,
                unit: ((editData.details as any)?.estimatedTimeline?.unit as TimelineUnit) ?? 'weeks',
            },
            numberOfPositions: editData.details?.numberOfPositions ?? 1,
            skillsRequired: (editData as any).skillsRequired ?? [],
            languagePreference: editData.details?.languagePreference ?? '',
            ndaRequired: editData.details?.ndaRequired ?? false,
            portfolioRequired: editData.details?.portfolioRequired ?? false,
            description: editData.description ?? '',
            screeningQuestions: sq,
        });
    }, [editData, reset]);

    const { fields: questionFields, append: appendQuestion, remove: removeQuestion } =
        useFieldArray({ control, name: 'screeningQuestions' });

    const watchEngagement = watch('engagementType');
    const watchCategory = watch('procurementCategory');
    const watchDescription = watch('description') ?? '';
    const watchBriefDescription = watch('briefDescription') ?? '';
    const descCharCount = watchDescription.replace(/<[^>]+>/g, '').length;

    const subcategories =
        categories.find((c) => c.category === watchCategory)?.subcategories ?? [];

    // Per-step validation fields
    const STEP_FIELDS: Record<number, (keyof FormValues)[]> = {
        1: ['title', 'briefDescription', 'procurementCategory', 'procurementSubcategory', 'deadline'],
        2: ['engagementType', 'experienceLevel', 'projectType', 'locationType'],
        3: ['description'],
        4: [],
    };

    const goNext = async () => {
        const valid = await trigger(STEP_FIELDS[step]);
        if (!valid) return;
        setCompletedSteps((prev) => new Set(prev).add(step));
        setStep((s) => Math.min(s + 1, STEPS.length));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const goBack = () => {
        setStep((s) => Math.max(s - 1, 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const goToStep = (targetStep: number) => {
        if (completedSteps.has(targetStep) || targetStep < step) {
            setStep(targetStep);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // ── FIX: action is passed directly — no async publishAfterSave state race
    const onSubmit = async (values: FormValues, action: SubmitAction) => {
        setPendingAction(action);

        // ── Normalize helper: safely convert any value to a plain string
        const safe = (v: unknown): string | undefined => {
            if (v === null || v === undefined) return undefined;
            if (typeof v === 'object') return JSON.stringify(v);
            return String(v);
        };

        const data: CreateFreelanceTenderData = {
            title: values.title,
            briefDescription: values.briefDescription,
            description: values.description,
            procurementCategory: values.procurementSubcategory
                ? `${values.procurementCategory} — ${values.procurementSubcategory}`
                : values.procurementCategory,
            deadline: new Date(values.deadline).toISOString(),
            skillsRequired: values.skillsRequired,
            ...(values.maxApplications ? { maxApplications: values.maxApplications } : {}),
            details: {
                engagementType: values.engagementType,
                // Budget: only for fixed_price
                ...(values.engagementType === 'fixed_price' && {
                    budget: {
                        min: values.budget.min,
                        max: values.budget.max,
                        currency: values.budget.currency || 'ETB',
                    },
                }),
                // Budget: also passed for hourly as rate range
                ...(values.engagementType === 'hourly' && {
                    budget: {
                        min: values.budget.min,
                        max: values.budget.max,
                        currency: values.budget.currency || 'ETB',
                    },
                }),
                // Salary range: only for fixed_salary
                ...(values.engagementType === 'fixed_salary' && {
                    salaryRange: {
                        min: values.salaryRange.min,
                        max: values.salaryRange.max,
                        currency: values.salaryRange.currency || 'ETB',
                        period: values.salaryRange.period || 'monthly',
                    },
                }),
                // Weekly hours: only for hourly
                ...(values.engagementType === 'hourly' && values.weeklyHours
                    ? { weeklyHours: values.weeklyHours }
                    : {}),
                // isNegotiable flag — backend also sets this, but we pass it explicitly
                ...(values.engagementType === 'negotiable' && { isNegotiable: true }),
                experienceLevel: values.experienceLevel,
                projectType: values.projectType,
                locationType: values.locationType,
                // FIX: normalizeTimeline — guard against [object Object] rendering
                estimatedTimeline:
                    values.estimatedTimeline.value && values.estimatedTimeline.unit
                        ? { value: Number(values.estimatedTimeline.value), unit: values.estimatedTimeline.unit }
                        : undefined,
                numberOfPositions: values.numberOfPositions || 1,
                languagePreference: values.languagePreference || undefined,
                ndaRequired: values.ndaRequired,
                // FIX: normalizePortfolio — just a boolean, no risk of object
                portfolioRequired: values.portfolioRequired,
                screeningQuestions: values.screeningQuestions.map((q) => ({
                    question: q.text,
                    required: q.required,
                })),
            },
        } as any;

        try {
            let resultId: string;
            if (isEdit && tenderId) {
                const result = await updateMutation.mutateAsync({
                    id: tenderId,
                    data: data as any,
                    files: newFiles.length ? newFiles : undefined,
                });
                resultId = result._id;
            } else {
                const result = await createMutation.mutateAsync({
                    data,
                    files: newFiles.length ? newFiles : undefined,
                });
                resultId = result._id;
            }

            // FIX: publish is called AFTER create/update completes, using the resolved id
            if (action === 'publish') {
                await publishMutation.mutateAsync(resultId);
            }

            setPendingAction(null);
            onSuccess(resultId);
        } catch {
            setPendingAction(null);
            // Errors handled by each mutation's onError callback
        }
    };

    const currentStep = STEPS[step - 1];

    // ─── Step 1: Basics ────────────────────────────────────────────────────────
    const renderStep1 = () => (
        <div className="space-y-5">
            <Field label="Job Title" required error={errors.title?.message}>
                <input
                    {...register('title', {
                        required: 'Title is required',
                        maxLength: { value: 200, message: 'Max 200 characters' },
                    })}
                    className={getInputClass()}
                    placeholder="e.g. React Developer for SaaS Dashboard"
                    autoFocus
                />
            </Field>

            <Field
                label="Brief Description"
                required
                error={errors.briefDescription?.message}
                hint={`${watchBriefDescription.length} / ${MAX_BRIEF_CHARS} characters — shown on listing cards`}
            >
                <textarea
                    {...register('briefDescription', {
                        required: 'Brief description is required',
                        maxLength: { value: MAX_BRIEF_CHARS, message: `Max ${MAX_BRIEF_CHARS} characters` },
                    })}
                    rows={3}
                    className={`${getInputClass()} resize-none`}
                    placeholder="One or two sentences summarising the project…"
                />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Category" required error={errors.procurementCategory?.message}>
                    <Controller
                        name="procurementCategory"
                        control={control}
                        rules={{ required: 'Category is required' }}
                        render={({ field }) => (
                            <select {...field} className={getInputClass()}>
                                <option value="">Select category…</option>
                                {categories.map((c) => (
                                    <option key={c.category} value={c.category}>{c.category}</option>
                                ))}
                            </select>
                        )}
                    />
                </Field>

                <Field label="Subcategory" required error={errors.procurementSubcategory?.message}>
                    <Controller
                        name="procurementSubcategory"
                        control={control}
                        rules={{ required: 'Subcategory is required' }}
                        render={({ field }) => (
                            <select
                                {...field}
                                className={`${getInputClass()} ${!watchCategory ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={!watchCategory}
                            >
                                <option value="">Select subcategory…</option>
                                {subcategories.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        )}
                    />
                </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                    label="Application Deadline"
                    required
                    error={errors.deadline?.message}
                    hint="Applicants must submit before this date"
                >
                    <input
                        {...register('deadline', { required: 'Deadline is required' })}
                        type="datetime-local"
                        min={tomorrowMin()}
                        className={getInputClass()}
                    />
                    {/* Remaining days countdown */}
                    {watch('deadline') && (() => {
                        const diff = new Date(watch('deadline')).getTime() - Date.now();
                        const days = Math.ceil(diff / 86_400_000);
                        if (days <= 0) return null;
                        return (
                            <p className={`text-xs mt-1.5 font-medium ${days <= 3 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {days === 1 ? '1 day remaining' : `${days} days remaining`}
                            </p>
                        );
                    })()}
                </Field>

                <Field
                    label="Max Applications"
                    hint="Leave blank for unlimited"
                    error={errors.maxApplications?.message}
                >
                    <input
                        {...register('maxApplications', {
                            min: { value: 1, message: 'Minimum 1' },
                            valueAsNumber: true,
                        })}
                        type="number"
                        className={getInputClass()}
                        placeholder="e.g. 50"
                    />
                </Field>
            </div>
        </div>
    );

    // ─── Step 2: Details & Budget ──────────────────────────────────────────────
    const renderStep2 = () => (
        <div className="space-y-6">
            {/* Engagement Type */}
            <div>
                <SectionDivider
                    title="Engagement Type"
                    description="How would you like to pay for this work?"
                />
                <div className="mt-3">
                    <Controller
                        name="engagementType"
                        control={control}
                        render={({ field }) => (
                            <EngagementTypeSelector value={field.value} onChange={field.onChange} />
                        )}
                    />
                </div>
            </div>

            {/* Fixed Price Budget */}
            {watchEngagement === 'fixed_price' && (
                <SettingsCard>
                    <SectionDivider
                        title="Project Budget"
                        description="Set the total budget range for the project"
                    />
                    <div className="grid grid-cols-3 gap-3">
                        <Field label="Min Amount (ETB)" error={(errors.budget as any)?.min?.message}>
                            <input
                                {...register('budget.min', {
                                    required: 'Min amount required',
                                    min: { value: 0, message: 'Must be ≥ 0' },
                                    valueAsNumber: true,
                                })}
                                type="number"
                                className={getInputClass()}
                                placeholder="0"
                            />
                        </Field>
                        <Field label="Max Amount" error={(errors.budget as any)?.max?.message}>
                            <input
                                {...register('budget.max', {
                                    required: 'Max amount required',
                                    min: { value: 0, message: 'Must be ≥ 0' },
                                    valueAsNumber: true,
                                    validate: (v, form) =>
                                        !form.budget.min || !v || Number(v) >= Number(form.budget.min) || 'Must be ≥ min',
                                })}
                                type="number"
                                className={getInputClass()}
                                placeholder="0"
                            />
                        </Field>
                        <Field label="Currency">
                            <Controller
                                name="budget.currency"
                                control={control}
                                render={({ field }) => (
                                    <select {...field} className={getInputClass()}>
                                        {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                )}
                            />
                        </Field>
                    </div>
                </SettingsCard>
            )}

            {/* Hourly Rate */}
            {watchEngagement === 'hourly' && (
                <SettingsCard>
                    <SectionDivider
                        title="Hourly Rate"
                        description="Set the rate range you expect to pay per hour"
                    />
                    <div className="grid grid-cols-3 gap-3">
                        <Field label="Min Rate / hr" error={(errors.budget as any)?.min?.message}>
                            <input
                                {...register('budget.min', {
                                    required: 'Min rate required',
                                    min: { value: 0, message: 'Must be ≥ 0' },
                                    valueAsNumber: true,
                                })}
                                type="number"
                                className={getInputClass()}
                                placeholder="0"
                            />
                        </Field>
                        <Field label="Max Rate / hr" error={(errors.budget as any)?.max?.message}>
                            <input
                                {...register('budget.max', {
                                    required: 'Max rate required',
                                    min: { value: 0, message: 'Must be ≥ 0' },
                                    valueAsNumber: true,
                                    validate: (v, form) =>
                                        !form.budget.min || !v || Number(v) >= Number(form.budget.min) || 'Must be ≥ min',
                                })}
                                type="number"
                                className={getInputClass()}
                                placeholder="0"
                            />
                        </Field>
                        <Field label="Currency">
                            <Controller
                                name="budget.currency"
                                control={control}
                                render={({ field }) => (
                                    <select {...field} className={getInputClass()}>
                                        {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                )}
                            />
                        </Field>
                    </div>
                    <Field
                        label="Weekly Hours (optional)"
                        hint="Estimated hours per week — leave blank if flexible"
                        error={errors.weeklyHours?.message}
                    >
                        <input
                            {...register('weeklyHours', {
                                min: { value: 1, message: 'Minimum 1 hour' },
                                valueAsNumber: true,
                            })}
                            type="number"
                            className={`${getInputClass()} sm:max-w-[160px]`}
                            placeholder="e.g. 20"
                        />
                    </Field>
                </SettingsCard>
            )}

            {/* Fixed Salary */}
            {watchEngagement === 'fixed_salary' && (
                <SettingsCard>
                    <SectionDivider
                        title="Salary Range"
                        description="Set the expected salary range for this position"
                    />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <Field label="Min Salary" error={(errors.salaryRange as any)?.min?.message}>
                            <input
                                {...register('salaryRange.min', {
                                    required: 'Min salary required',
                                    min: { value: 0, message: 'Must be ≥ 0' },
                                    valueAsNumber: true,
                                })}
                                type="number"
                                className={getInputClass()}
                                placeholder="0"
                            />
                        </Field>
                        <Field label="Max Salary" error={(errors.salaryRange as any)?.max?.message}>
                            <input
                                {...register('salaryRange.max', {
                                    required: 'Max salary required',
                                    min: { value: 0, message: 'Must be ≥ 0' },
                                    valueAsNumber: true,
                                    validate: (v, form) =>
                                        !form.salaryRange.min || !v || Number(v) >= Number(form.salaryRange.min) || 'Must be ≥ min',
                                })}
                                type="number"
                                className={getInputClass()}
                                placeholder="0"
                            />
                        </Field>
                        <Field label="Currency">
                            <Controller
                                name="salaryRange.currency"
                                control={control}
                                render={({ field }) => (
                                    <select {...field} className={getInputClass()}>
                                        {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                )}
                            />
                        </Field>
                        <Field label="Period">
                            <Controller
                                name="salaryRange.period"
                                control={control}
                                render={({ field }) => (
                                    <select {...field} className={getInputClass()}>
                                        {SALARY_PERIODS.map((p) => (
                                            <option key={p.value} value={p.value}>{p.label}</option>
                                        ))}
                                    </select>
                                )}
                            />
                        </Field>
                    </div>
                </SettingsCard>
            )}

            {/* Negotiable info */}
            {watchEngagement === 'negotiable' && (
                <div className="flex items-start gap-3 p-4 rounded-2xl border-2 border-[#F1BB03]/40 bg-[#FFFBEB] dark:bg-[#1a1600]">
                    <div className="p-2 rounded-xl bg-[#F1BB03]/20 shrink-0">
                        <svg className="w-4 h-4 text-[#F1BB03]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Negotiable Budget</p>
                        <p className={`text-sm mt-0.5 ${colorClasses.text.muted}`}>
                            Freelancers will propose their own rates. You negotiate final terms with shortlisted candidates.
                        </p>
                    </div>
                </div>
            )}

            {/* Requirements */}
            <div>
                <SectionDivider
                    title="Requirements"
                    description="Specify what kind of freelancer you need"
                />
                <div className="mt-3 space-y-5">
                    <Field label="Experience Level">
                        <div className="mt-1">
                            <Controller
                                name="experienceLevel"
                                control={control}
                                render={({ field }) => (
                                    <PillGroup
                                        value={field.value}
                                        onChange={field.onChange}
                                        options={[
                                            { value: 'entry', label: 'Entry Level' },
                                            { value: 'intermediate', label: 'Intermediate' },
                                            { value: 'expert', label: 'Expert' },
                                        ]}
                                    />
                                )}
                            />
                        </div>
                    </Field>

                    <Field label="Project Type">
                        <div className="mt-1">
                            <Controller
                                name="projectType"
                                control={control}
                                render={({ field }) => (
                                    <PillGroup
                                        value={field.value}
                                        onChange={field.onChange}
                                        options={[
                                            { value: 'one_time', label: 'One-time' },
                                            { value: 'ongoing', label: 'Ongoing' },
                                            { value: 'complex', label: 'Complex / Enterprise' },
                                        ]}
                                    />
                                )}
                            />
                        </div>
                    </Field>

                    <Field label="Location Type">
                        <div className="mt-1">
                            <Controller
                                name="locationType"
                                control={control}
                                render={({ field }) => (
                                    <PillGroup
                                        value={field.value}
                                        onChange={field.onChange}
                                        options={[
                                            { value: 'remote', label: 'Remote' },
                                            { value: 'on_site', label: 'On-site' },
                                            { value: 'hybrid', label: 'Hybrid' },
                                            { value: 'flexible', label: 'Flexible' },
                                        ]}
                                    />
                                )}
                            />
                        </div>
                    </Field>
                </div>
            </div>

            {/* Scope */}
            <div>
                <SectionDivider title="Project Scope" description="Timeline, positions and skills" />
                <div className="mt-3 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Estimated Timeline">
                            <div className="flex gap-2">
                                <input
                                    {...register('estimatedTimeline.value', {
                                        min: { value: 1, message: 'Min 1' },
                                        valueAsNumber: true,
                                    })}
                                    type="number"
                                    className={`${getInputClass()} w-24 shrink-0`}
                                    placeholder="4"
                                />
                                <Controller
                                    name="estimatedTimeline.unit"
                                    control={control}
                                    render={({ field }) => (
                                        <select {...field} className={`${getInputClass()} flex-1`}>
                                            {TIMELINE_UNITS.map((u) => (
                                                <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>
                                            ))}
                                        </select>
                                    )}
                                />
                            </div>
                        </Field>

                        <Field
                            label="Number of Positions"
                            hint="How many people do you need?"
                            error={errors.numberOfPositions?.message}
                        >
                            <input
                                {...register('numberOfPositions', {
                                    min: { value: 1, message: 'Min 1' },
                                    max: { value: 50, message: 'Max 50' },
                                    valueAsNumber: true,
                                })}
                                type="number"
                                className={getInputClass()}
                                placeholder="1"
                                min={1}
                                max={50}
                            />
                        </Field>
                    </div>

                    <Field
                        label="Required Skills"
                        hint="Type a skill and press Enter or comma to add. Up to 20 skills."
                    >
                        <Controller
                            name="skillsRequired"
                            control={control}
                            render={({ field }) => (
                                <SkillsInput value={field.value} onChange={field.onChange} />
                            )}
                        />
                    </Field>

                    <Field label="Language Preference (optional)">
                        <input
                            {...register('languagePreference')}
                            className={getInputClass()}
                            placeholder="e.g. English, Amharic"
                        />
                    </Field>
                </div>
            </div>

            {/* Settings toggles */}
            <div>
                <SectionDivider title="Additional Settings" />
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Controller
                        name="ndaRequired"
                        control={control}
                        render={({ field }) => (
                            <ToggleSwitch
                                value={field.value}
                                onChange={field.onChange}
                                label="NDA Required"
                                description="Freelancer must sign NDA before starting"
                            />
                        )}
                    />
                    <Controller
                        name="portfolioRequired"
                        control={control}
                        render={({ field }) => (
                            <ToggleSwitch
                                value={field.value}
                                onChange={field.onChange}
                                label="Portfolio Required"
                                description="Applicants must include portfolio samples"
                            />
                        )}
                    />
                </div>
            </div>
        </div>
    );

    // ─── Step 3: Description & Screening ──────────────────────────────────────
    const renderStep3 = () => (
        <div className="space-y-6">
            {/* Quill styles injected once */}
            <style dangerouslySetInnerHTML={{ __html: QUILL_CSS }} />

            {/* Full description */}
            <Field
                label="Full Project Description"
                required
                error={errors.description?.message}
                hint={`${descCharCount.toLocaleString()} / ${MAX_DESCRIPTION_CHARS.toLocaleString()} characters`}
            >
<div
  className={cn(
    "rounded-xl overflow-hidden border transition-all duration-150",
    colorClasses.bg.surface,
    colorClasses.border.primary,
    errors.description
      ? "ring-2 ring-red-400 border-red-400"
      : "focus-within:ring-2 focus-within:ring-[#F1BB03]/60 focus-within:border-[#F1BB03]"
  )}
  style={{
    // Light mode (aligned with your system)
    ['--ql-bg' as any]: '#ffffff',
    ['--ql-toolbar-bg' as any]: '#F9FAFB',
    ['--ql-text' as any]: '#0A2540',
    ['--ql-placeholder' as any]: '#A0A0A0',
    ['--ql-border' as any]: '#A0A0A0',

    // Dark mode (MATCHES your color.ts)
    ...(typeof document !== 'undefined' &&
      document.documentElement.classList.contains('dark') && {
        ['--ql-bg' as any]: '#1C3558',     // bg.surface dark
        ['--ql-toolbar-bg' as any]: '#0A2540',
        ['--ql-text' as any]: '#F5F5F5',
        ['--ql-placeholder' as any]: '#6B7280',
        ['--ql-border' as any]: '#2D4A6B',
      }),
  }}
>
                    <Controller
                        name="description"
                        control={control}
                        rules={{
                            required: 'Description is required',
                            validate: (v) => {
                                const text = v?.replace(/<[^>]+>/g, '') ?? '';
                                if (text.length < 100) return 'At least 100 characters required';
                                if (text.length > MAX_DESCRIPTION_CHARS)
                                    return `Max ${MAX_DESCRIPTION_CHARS.toLocaleString()} characters`;
                                return true;
                            },
                        }}
                        render={({ field }) => (
                            <ReactQuill
                                theme="snow"
                                value={field.value}
                                onChange={field.onChange}
                                modules={QUILL_MODULES}
                                formats={QUILL_FORMATS}
                                placeholder="Describe deliverables, context, tools used and what success looks like…"
                            />
                        )}
                    />
                </div>
            </Field>

            {/* Screening questions */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <SectionDivider
                        title="Screening Questions"
                        description="Optional questions applicants must answer"
                    />
                    <span className={`text-xs font-medium ${colorClasses.text.muted}`}>
                        {questionFields.length} / 10
                    </span>
                </div>

                <div className="space-y-2">
                    {questionFields.map((f, i) => (
                        <div
                            key={f.id}
                            className={`
                flex gap-3 items-start p-3.5 rounded-xl border
                ${colorClasses.border.primary} ${colorClasses.bg.secondary}
              `}
                        >
                            <span className={`text-xs font-bold mt-3 shrink-0 w-6 text-center ${colorClasses.text.muted}`}>
                                Q{i + 1}
                            </span>
                            <div className="flex-1 space-y-2">
                                <input
                                    {...register(`screeningQuestions.${i}.text`, {
                                        required: 'Question text is required',
                                    })}
                                    className={getInputClass()}
                                    placeholder="Enter your screening question…"
                                />
                                <label className={`flex items-center gap-2 text-xs cursor-pointer select-none ${colorClasses.text.muted}`}>
                                    <input
                                        type="checkbox"
                                        {...register(`screeningQuestions.${i}.required`)}
                                        className="rounded accent-[#F1BB03] w-3.5 h-3.5"
                                    />
                                    Required answer
                                </label>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeQuestion(i)}
                                aria-label="Remove question"
                                className="mt-2.5 text-red-400 hover:text-red-600 transition-colors shrink-0"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>

                {questionFields.length < 10 && (
                    <button
                        type="button"
                        onClick={() => appendQuestion({ text: '', required: false })}
                        className={`
              flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg transition-colors
              text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20
            `}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Question
                    </button>
                )}
            </div>

            {/* Existing attachments in edit mode */}
            {isEdit && editData?.attachments && editData.attachments.length > 0 && (
                <div className="space-y-3">
                    <SectionDivider title="Existing Attachments" />
                    <ul className="space-y-2">
                        {editData.attachments.map((att: any) => (
                            <li
                                key={att._id}
                                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm
                  ${colorClasses.border.primary} ${colorClasses.bg.secondary}
                `}
                            >
                                <span className="text-lg shrink-0">📎</span>
                                <span className={`flex-1 truncate ${colorClasses.text.primary}`}>
                                    {att.originalName ?? att.fileName}
                                </span>
                                <button
                                    type="button"
                                    onClick={() =>
                                        deleteAttachment.mutate({ id: tenderId!, attachmentId: att._id })
                                    }
                                    className="text-xs text-red-500 hover:text-red-600 transition-colors shrink-0 font-medium"
                                >
                                    Remove
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* New file uploads */}
            <div className="space-y-3">
                <SectionDivider
                    title="Attach Documents"
                    description="Project brief, specs, reference files — max 10 MB each"
                />
                <FileDropzone
                    files={newFiles}
                    onAdd={(f) => setNewFiles((prev) => [...prev, ...f])}
                    onRemove={(i) => setNewFiles((prev) => prev.filter((_, idx) => idx !== i))}
                />
            </div>
        </div>
    );

    // ─── Step 4: Review & Submit ──────────────────────────────────────────────
    const renderStep4 = () => {
        const values = watch();
        const deadline = values.deadline ? new Date(values.deadline) : null;
        const daysLeft = deadline ? Math.ceil((deadline.getTime() - Date.now()) / 86_400_000) : null;

        const engagementLabels: Record<EngagementType, string> = {
            fixed_price: 'Fixed Price',
            hourly: 'Hourly Rate',
            fixed_salary: 'Fixed Salary',
            negotiable: 'Negotiable',
        };

        const ReviewRow = ({ label, value }: { label: string; value?: string | null }) => {
            if (!value) return null;
            return (
                <div className="flex items-start justify-between gap-4 py-2.5 border-b last:border-0" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                    <span className={`text-xs font-medium shrink-0 ${colorClasses.text.muted}`}>{label}</span>
                    <span className={`text-sm font-semibold text-right break-words ${colorClasses.text.primary}`}>{value}</span>
                </div>
            );
        };

        const ReviewSection = ({ title, icon, children, onEdit, stepNum }: {
            title: string; icon: React.ReactNode; children: React.ReactNode; onEdit: () => void; stepNum: number;
        }) => (
            <div className={`rounded-2xl border overflow-hidden ${colorClasses.bg.primary} ${colorClasses.border.primary}`}>
                <div className={`flex items-center justify-between px-5 py-3.5 border-b ${colorClasses.border.primary} ${colorClasses.bg.secondary}`}>
                    <div className="flex items-center gap-2.5">
                        <span className={`text-sm ${colorClasses.text.muted}`}>{icon}</span>
                        <h3 className={`text-sm font-bold ${colorClasses.text.primary}`}>{title}</h3>
                    </div>
                    <button
                        type="button"
                        onClick={onEdit}
                        className="text-xs font-semibold text-[#F1BB03] hover:underline flex items-center gap-1"
                    >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                    </button>
                </div>
                <div className="px-5 py-1">{children}</div>
            </div>
        );

        const budgetSummary = () => {
            if (values.engagementType === 'fixed_price' || values.engagementType === 'hourly') {
                const min = values.budget?.min;
                const max = values.budget?.max;
                const cur = values.budget?.currency ?? 'ETB';
                if (min || max) return `${cur} ${min?.toLocaleString() ?? '0'} – ${max?.toLocaleString() ?? '0'}`;
            }
            if (values.engagementType === 'fixed_salary') {
                const min = values.salaryRange?.min;
                const max = values.salaryRange?.max;
                const cur = values.salaryRange?.currency ?? 'ETB';
                const per = values.salaryRange?.period ?? 'monthly';
                if (min || max) return `${cur} ${min?.toLocaleString() ?? '0'} – ${max?.toLocaleString() ?? '0'} / ${per}`;
            }
            if (values.engagementType === 'negotiable') return 'Negotiable (open to proposals)';
            return null;
        };

        return (
            <div className="space-y-4">
                {/* Publish readiness banner */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                    <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Ready to publish</p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                            Review your tender below. Click <strong>Save &amp; Publish</strong> to go live, or <strong>Save as Draft</strong> to continue editing later.
                        </p>
                    </div>
                </div>

                {/* Step 1 Summary */}
                <ReviewSection title="Basics & Category" icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                } onEdit={() => goToStep(1)} stepNum={1}>
                    <ReviewRow label="Title" value={values.title} />
                    <ReviewRow label="Summary" value={values.briefDescription} />
                    <ReviewRow
                        label="Category"
                        value={[values.procurementCategory, values.procurementSubcategory].filter(Boolean).join(' › ')}
                    />
                    <ReviewRow
                        label="Deadline"
                        value={deadline
                            ? `${deadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}${daysLeft && daysLeft > 0 ? ` · ${daysLeft} days left` : ''}`
                            : null}
                    />
                    {values.maxApplications && (
                        <ReviewRow label="Max Applications" value={String(values.maxApplications)} />
                    )}
                </ReviewSection>

                {/* Step 2 Summary */}
                <ReviewSection title="Project Details & Budget" icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                } onEdit={() => goToStep(2)} stepNum={2}>
                    <ReviewRow label="Engagement" value={engagementLabels[values.engagementType]} />
                    <ReviewRow label="Budget" value={budgetSummary()} />
                    {values.engagementType === 'hourly' && values.weeklyHours && (
                        <ReviewRow label="Weekly Hours" value={`${values.weeklyHours} hrs/week`} />
                    )}
                    <ReviewRow
                        label="Experience"
                        value={values.experienceLevel ? values.experienceLevel.charAt(0).toUpperCase() + values.experienceLevel.slice(1) : null}
                    />
                    <ReviewRow label="Project Type" value={values.projectType?.replace(/_/g, ' ')} />
                    <ReviewRow label="Location" value={values.locationType?.replace(/_/g, ' ')} />
                    <ReviewRow
                        label="Timeline"
                        value={values.estimatedTimeline?.value
                            ? `${values.estimatedTimeline.value} ${values.estimatedTimeline.unit}`
                            : null}
                    />
                    <ReviewRow
                        label="Positions"
                        value={values.numberOfPositions ? String(values.numberOfPositions) : null}
                    />
                    {values.skillsRequired?.length > 0 && (
                        <div className="py-2.5 border-b last:border-0" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                            <p className={`text-xs font-medium mb-2 ${colorClasses.text.muted}`}>Required Skills</p>
                            <div className="flex flex-wrap gap-1.5">
                                {values.skillsRequired.map((s) => (
                                    <span key={s} className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#F1BB03]/15 text-[#0A2540] dark:text-[#F1BB03] border border-[#F1BB03]/30">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {(values.ndaRequired || values.portfolioRequired) && (
                        <div className="flex gap-2 flex-wrap py-2.5">
                            {values.ndaRequired && (
                                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-semibold">NDA Required</span>
                            )}
                            {values.portfolioRequired && (
                                <span className="text-xs px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 font-semibold">Portfolio Required</span>
                            )}
                        </div>
                    )}
                </ReviewSection>

                {/* Step 3 Summary */}
                <ReviewSection title="Description & Screening" icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                } onEdit={() => goToStep(3)} stepNum={3}>
                    {values.description && (
                        <div className="py-2.5 border-b last:border-0" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                            <p className={`text-xs font-medium mb-1.5 ${colorClasses.text.muted}`}>Description preview</p>
                            <p className={`text-sm leading-relaxed line-clamp-4 ${colorClasses.text.secondary}`}>
                                {values.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}
                            </p>
                        </div>
                    )}
                    {values.screeningQuestions?.length > 0 && (
                        <div className="py-2.5">
                            <p className={`text-xs font-medium mb-2 ${colorClasses.text.muted}`}>
                                {values.screeningQuestions.length} screening question{values.screeningQuestions.length !== 1 ? 's' : ''}
                            </p>
                            <ol className="space-y-1">
                                {values.screeningQuestions.slice(0, 3).map((q, i) => (
                                    <li key={i} className={`text-xs flex items-start gap-2 ${colorClasses.text.secondary}`}>
                                        <span className="shrink-0 w-4 h-4 rounded-full bg-[#F1BB03]/20 text-[#0A2540] dark:text-[#F1BB03] text-[9px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                                        <span className="line-clamp-1">{q.text}</span>
                                    </li>
                                ))}
                                {values.screeningQuestions.length > 3 && (
                                    <li className={`text-xs ${colorClasses.text.muted}`}>+ {values.screeningQuestions.length - 3} more…</li>
                                )}
                            </ol>
                        </div>
                    )}
                    {newFiles.length > 0 && (
                        <ReviewRow label="Attachments" value={`${newFiles.length} file${newFiles.length !== 1 ? 's' : ''} staged`} />
                    )}
                    {isEdit && watchDescription && !newFiles.length && (
                        <p className={`text-xs py-2 ${colorClasses.text.muted}`}>Existing attachments will be kept.</p>
                    )}
                </ReviewSection>
            </div>
        );
    };

    // ─── Render ────────────────────────────────────────────────────────────────
    return (
        <div className={isMutating ? 'opacity-60 pointer-events-none select-none' : ''}>

            {/* Step bar — mobile and desktop top bar (no sidebar) */}
            <MobileStepBar currentStep={step} completedSteps={completedSteps} />

            {/* Form card — full width on all screen sizes */}
            <div className={`w-full rounded-2xl border shadow-sm ${colorClasses.bg.primary} ${colorClasses.border.primary}`}>
                <div className="p-6">
                    <StepHeader step={currentStep} />

                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                    {step === 4 && renderStep4()}
                </div>

                    {/* ── Sticky footer navigation ── */}
                    <div className={`
            sticky bottom-0 flex items-center justify-between
            px-6 py-4 border-t rounded-b-2xl
            ${colorClasses.border.primary} ${colorClasses.bg.primary}
            backdrop-blur-sm bg-opacity-95
          `}>
                        {/* Left: Back / Cancel */}
                        <div>
                            {step > 1 ? (
                                <button
                                    type="button"
                                    onClick={goBack}
                                    className={`
                    inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
                    border transition-all duration-150
                    ${colorClasses.border.primary} ${colorClasses.text.secondary}
                    hover:${colorClasses.bg.secondary}
                  `}
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Back
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    className={`
                    px-5 py-2.5 rounded-xl text-sm font-medium border transition-all duration-150
                    ${colorClasses.border.primary} ${colorClasses.text.muted}
                    hover:${colorClasses.bg.secondary}
                  `}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>

                        {/* Right: Next / Continue / Submit */}
                        <div className="flex items-center gap-3">
                            {step < STEPS.length ? (
                                /* Steps 1-3: Continue button */
                                <button
                                    type="button"
                                    onClick={goNext}
                                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0A2540] hover:bg-[#0A2540]/90 transition-colors shadow-sm"
                                >
                                    {step === 3 ? 'Review →' : 'Continue'}
                                    {step < 3 && (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                        </svg>
                                    )}
                                </button>
                            ) : (
                                /* Step 4: Save Draft + Publish */
                                <>
                                    <SubmitButton
                                        action="draft"
                                        variant="secondary"
                                        isLoading={pendingAction === 'draft' && (isCreating || isUpdating)}
                                        loadingText="Saving…"
                                        disabled={isMutating}
                                        onClick={() => handleSubmit((values) => onSubmit(values, 'draft'))()}
                                    >
                                        Save as Draft
                                    </SubmitButton>

                                    <SubmitButton
                                        action="publish"
                                        variant="primary"
                                        isLoading={pendingAction === 'publish' && isMutating}
                                        loadingText="Publishing…"
                                        disabled={isMutating}
                                        onClick={() => handleSubmit((values) => onSubmit(values, 'publish'))()}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
                                        </svg>
                                        Save &amp; Publish
                                    </SubmitButton>
                                </>
                            )}
                        </div>
                    </div>
                </div>
        </div>
    );
}