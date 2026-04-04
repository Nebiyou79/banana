/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/forms/tenders/ProfessionalTenderForm.tsx
'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import {
    Loader2, Trash2, CheckCircle, FileText, Settings, Scale,
    Clock, FileCheck, Shield, Globe, Lock, Calendar,
    Building, Hash, Target, RefreshCw, Check, AlertCircle,
    ArrowRight, ArrowLeft, Save, Send, Upload, ChevronDown, ChevronUp,
    Copy, Edit3, FileStack, Award, Trophy, Users2,
} from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import {
    useCreateProfessionalTender,
    useUpdateProfessionalTender,
    useProfessionalTenderCategories,
    useGenerateReferenceNumber,
    useInviteCompanies,
    useProfessionalTenderEditData,
} from '@/hooks/useProfessionalTender';
import { useAuth } from '@/hooks/useAuth';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';
import CompanyInvitationSelector, { type StagedInvitation } from '@/components/tenders2.0/CompanyInvitationSelector';

// ─────────────────────────────────────────────────────────────────────────────
// ZOD SCHEMA
// FIX P-01: workflowType ('open'|'closed') — NOT biddingType ('open'|'sealed')
// FIX P-16: briefDescription added
// FIX P-02: evaluationCriteria is an object with weights, not an array
// FIX P-05: deliverables as { title, description, deadline }
// FIX P-14: preBidMeeting at root level — NOT inside procurement
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// SCHEMA — no .default() on enum/boolean/number fields.
// .default() on those types makes Zod mark the input as optional, which causes
// the inferred type to disagree with the explicit FormValues interface below.
// All runtime defaults live in useForm({ defaultValues }) instead.
// ─────────────────────────────────────────────────────────────────────────────
const formSchema = z.object({
    // ── Step 1: Basic Info ──
    title:               z.string().min(5,   'Title must be at least 5 characters').max(200),
    briefDescription:    z.string().min(1,   'Brief description is required').max(500, 'Max 500 characters'),
    // Rich text: value is HTML. Validate visible text length (strip tags) not raw HTML bytes.
    description: z.string().refine(
        html => {
            if (!html) return false;
            // Strip HTML tags to get visible text length
            const text = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
            return text.length >= 100;
        },
        { message: 'Description must be at least 100 characters' }
    ),
    procurementCategory: z.string().min(1,   'Category is required'),
    // No .default() — keeps the inferred type as the literal union, not union | undefined
    tenderType:    z.enum(['works', 'goods', 'services', 'consultancy']),
    workflowType:  z.enum(['open', 'closed']),   // FIX P-01
    visibilityType:z.enum(['public', 'invite_only']),
    referenceNumber: z.string().optional(),
    deadline:        z.string().min(1, 'Deadline is required'),

    // ── Step 2: Procurement Details ──
    // Use z.coerce for optional numbers — coerces empty string/NaN → 0 then .optional()
    // wraps 0 into undefined via the transform below. This avoids z.preprocess type issues.
    procurement: z.object({
        procuringEntity:     z.string().min(1, 'Procuring entity is required'),
        procurementMethod:   z.enum(['open_tender', 'restricted', 'sealed_bid', 'direct', 'framework', 'negotiated']),
        fundingSource:       z.string().optional(),
        bidSecurityAmount:   z.union([z.coerce.number().min(0), z.literal(''), z.nan()]).optional().transform(v => (v === '' || (typeof v === 'number' && isNaN(v as number))) ? undefined : (v as number)),
        bidSecurityCurrency: z.string().optional(),
        bidValidityPeriod:   z.union([z.coerce.number().min(1), z.literal(''), z.nan()]).optional().transform(v => (v === '' || (typeof v === 'number' && isNaN(v as number))) ? undefined : (v as number)),
        contactPerson: z.object({
            name:  z.string().optional(),
            email: z.string().email().optional().or(z.literal('')),
            phone: z.string().optional(),
        }).optional(),
        // NOTE: preBidMeeting intentionally NOT here — it lives at root (FIX P-14)
    }),

    // ── FIX P-14: preBidMeeting at root, NOT inside procurement ──
    preBidMeeting: z.object({
        enabled:    z.boolean(),
        date:       z.string().optional(),
        location:   z.string().optional(),
        onlineLink: z.string().optional(),
        mandatory:  z.boolean(),
    }),

    // ── Step 3: Scope & Deliverables ──
    scope: z.object({
        projectObjectives: z.string().optional(),
        timeline: z.object({
            startDate: z.string().optional(),
            endDate:   z.string().optional(),
            duration: z.object({
                value: z.number().min(1).optional(),
                unit:  z.enum(['days', 'weeks', 'months', 'years']).optional(),
            }).optional(),
        }).optional(),
    }).optional(),

    // FIX P-05: deliverables as full objects
    deliverables: z.array(z.object({
        title:       z.string().min(1, 'Title required'),
        description: z.string().optional(),
        deadline:    z.string().optional(),
    })),

    milestones: z.array(z.object({
        title:             z.string().min(1, 'Title required'),
        description:       z.string().optional(),
        dueDate:           z.string().optional(),
        paymentPercentage: z.number().min(0).max(100).optional(),
    })),

    performanceBond: z.object({
        required:   z.boolean(),
        percentage: z.union([z.coerce.number().min(0).max(100), z.literal(''), z.nan()]).optional().transform(v => (v === '' || (typeof v === 'number' && isNaN(v as number))) ? undefined : (v as number)),
        amount:     z.union([z.coerce.number().min(0), z.literal(''), z.nan()]).optional().transform(v => (v === '' || (typeof v === 'number' && isNaN(v as number))) ? undefined : (v as number)),
        currency:   z.string().optional(),
    }),

    // ── Step 4: Eligibility & Evaluation ──
    eligibility: z.object({
        minimumExperience:          z.union([z.coerce.number().min(0), z.literal(''), z.nan()]).transform(v => (v === '' || (typeof v === 'number' && isNaN(v as number))) ? 0 : (v as number)),
        requiredCertifications:     z.array(z.string()),
        legalRegistrationRequired:  z.boolean(),
        financialCapacity: z.object({
            minAnnualTurnover: z.union([z.coerce.number().min(0), z.literal(''), z.nan()]).optional().transform(v => (v === '' || (typeof v === 'number' && isNaN(v as number))) ? undefined : (v as number)),
            currency:          z.string().optional(),
        }).optional(),
        pastProjectReferences: z.object({
            minCount:             z.union([z.coerce.number().min(0), z.literal(''), z.nan()]).transform(v => (v === '' || (typeof v === 'number' && isNaN(v as number))) ? 0 : (v as number)),
            similarValueProjects: z.boolean(),
        }).optional(),
        geographicPresence: z.string().optional(),
    }),

    // FIX P-02: evaluation is an object with weights — NOT an array
    evaluation: z.object({
        evaluationMethod: z.enum(['technical_only', 'financial_only', 'combined']),
        technicalWeight:  z.coerce.number().min(0).max(100),
        financialWeight:  z.coerce.number().min(0).max(100),
    }),

    clarificationDeadline: z.string().optional(),
    cpoRequired:    z.boolean(),
    cpoDescription: z.string().max(1000).optional(),
});

// Derive the form values type from the schema
type FormValues = z.infer<typeof formSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3 | 4 | 5;

interface UploadFile {
    id: string;
    file: File;
    docType: string;
    description: string;
    progress: number;
    ready: boolean;
}

interface Props {
    /** Called with the saved tender _id after successful create or update */
    onSuccess: (_id: string) => void;
    /** Called when the user clicks Cancel/Back */
    onCancel: () => void;
    /** Present in edit mode — triggers internal data fetch via useProfessionalTenderEditData */
    tenderId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const STEPS = [
    { id: 1, label: 'Overview',   icon: FileText  },
    { id: 2, label: 'Procurement',icon: Building  },
    { id: 3, label: 'Scope',      icon: Target    },
    { id: 4, label: 'Evaluation', icon: Scale     },
    { id: 5, label: 'Review',     icon: CheckCircle },
] as const;

const STEP_FIELDS: Record<number, (keyof FormValues)[]> = {
    1: ['title', 'briefDescription', 'description', 'procurementCategory', 'tenderType', 'workflowType', 'deadline'],
    2: ['procurement'],
    3: [],
    4: [],
    5: [],
};

const CURRENCIES = ['ETB', 'USD', 'EUR', 'GBP'];

const PROCUREMENT_METHODS = [
    { value: 'open_tender',  label: 'Open Tender' },
    { value: 'restricted',   label: 'Restricted Tender' },
    { value: 'sealed_bid',   label: 'Sealed Bid' },
    { value: 'direct',       label: 'Direct Procurement' },
    { value: 'framework',    label: 'Framework Agreement' },
    { value: 'negotiated',   label: 'Negotiated' },
];

const DOC_TYPES = [
    { value: 'terms_of_reference',      label: 'Terms of Reference' },
    { value: 'technical_specifications', label: 'Technical Specifications' },
    { value: 'bill_of_quantities',       label: 'Bill of Quantities' },
    { value: 'drawings',                 label: 'Drawings' },
    { value: 'statement_of_work',        label: 'Statement of Work' },
    { value: 'nda',                      label: 'NDA' },
    { value: 'other',                    label: 'Other' },
];

// ─────────────────────────────────────────────────────────────────────────────
// SHARED PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────
const fieldCls = cn(
    'w-full rounded-lg border px-3 py-2 text-sm transition-all duration-150',
    'bg-white dark:bg-[#1C2333]',
    'border-gray-200 dark:border-[#2D3748]',
    'text-gray-900 dark:text-gray-100',
    'placeholder:text-gray-400 dark:placeholder:text-gray-500',
    'focus:outline-none focus:ring-2 focus:ring-[#F1BB03]/50 focus:border-[#F1BB03]'
);

const cardCls = cn(
    'rounded-xl border shadow-sm',
    'bg-white dark:bg-[#161B27]',
    'border-gray-100 dark:border-[#2D3748]'
);

// ─────────────────────────────────────────────────────────────────────────────
// SMALL COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const Field = ({
    label, helper, error, required, icon, children,
}: {
    label?: string; helper?: string; error?: { message?: string };
    required?: boolean; icon?: React.ReactNode; children: React.ReactNode;
}) => (
    <div className="space-y-1.5">
        {label && (
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                {icon && <span className="text-[#F1BB03]">{icon}</span>}
                {label}{required && <span className="text-red-500">*</span>}
            </label>
        )}
        {children}
        {helper && !error && <p className="text-xs text-gray-400 dark:text-gray-500">{helper}</p>}
        {error?.message && (
            <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />{error.message}
            </p>
        )}
    </div>
);

const SectionCard = ({
    title, icon, description, badge, children, collapsible, defaultOpen = true,
}: {
    title: string; icon: React.ReactNode; description?: string;
    badge?: React.ReactNode; children: React.ReactNode;
    collapsible?: boolean; defaultOpen?: boolean;
}) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className={cardCls}>
            <div
                className={cn(
                    'flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-[#2D3748]',
                    collapsible && 'cursor-pointer select-none'
                )}
                onClick={collapsible ? () => setOpen(v => !v) : undefined}
            >
                <span className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 bg-[#F1BB03]/10">
                    {React.cloneElement(icon as React.ReactElement<any>, { className: 'h-4 w-4 text-[#F1BB03]' })}
                </span>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
                    {description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{description}</p>}
                </div>
                {badge}
                {collapsible && (
                    open ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
                         : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                )}
            </div>
            {(!collapsible || open) && <div className="p-5">{children}</div>}
        </div>
    );
};

// Linked evaluation weight sliders
const EvalSliders = ({ watch, setValue }: { watch: any; setValue: any }) => {
    const techW = watch('evaluation.technicalWeight') ?? 70;
    const finW  = watch('evaluation.financialWeight') ?? 30;
    const total = techW + finW;

    const handleTech = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseInt(e.target.value);
        setValue('evaluation.technicalWeight', v, { shouldValidate: true });
        setValue('evaluation.financialWeight', 100 - v, { shouldValidate: true });
    };
    const handleFin = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseInt(e.target.value);
        setValue('evaluation.financialWeight', v, { shouldValidate: true });
        setValue('evaluation.technicalWeight', 100 - v, { shouldValidate: true });
    };

    return (
        <div className="space-y-4 p-4 rounded-lg border border-gray-100 dark:border-[#2D3748] bg-gray-50 dark:bg-[#1C2333]">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Weight Distribution</span>
                <span className={cn('text-xs font-mono px-2 py-0.5 rounded-full border', total === 100 ? 'text-emerald-600 border-emerald-300' : 'text-red-500 border-red-300')}>
                    {total}%
                </span>
            </div>
            {[
                { label: 'Technical Score', value: techW, onChange: handleTech, color: '#0A2540' },
                { label: 'Financial Score', value: finW,  onChange: handleFin,  color: '#F1BB03' },
            ].map(({ label, value, onChange, color }) => (
                <div key={label} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                            {label}
                        </span>
                        <span className="text-xs font-mono bg-white dark:bg-[#161B27] px-2 py-0.5 rounded border border-gray-200 dark:border-[#2D3748] text-gray-700 dark:text-gray-300">
                            {value}%
                        </span>
                    </div>
                    <input type="range" min="0" max="100" value={value} onChange={onChange}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                        style={{ accentColor: color }}
                    />
                </div>
            ))}
            {total !== 100 && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />Weights must total 100% (currently {total}%)
                </p>
            )}
        </div>
    );
};

// Chip input for certifications / skills
const ChipInput = ({
    placeholder, chips, onAdd, onRemove,
}: {
    placeholder: string; chips: string[];
    onAdd: (v: string) => void; onRemove: (i: number) => void;
}) => {
    const [val, setVal] = useState('');
    const add = () => { const t = val.trim(); if (t) { onAdd(t); setVal(''); } };
    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <input
                    value={val}
                    onChange={e => setVal(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
                    placeholder={placeholder}
                    className={cn(fieldCls, 'flex-1 h-9')}
                />
                <button type="button" onClick={add}
                    className="shrink-0 h-9 px-3 rounded-lg border border-gray-200 dark:border-[#2D3748] text-xs font-semibold text-gray-600 dark:text-gray-400 hover:border-[#F1BB03]/50 hover:text-[#F1BB03] transition-all">
                    + Add
                </button>
            </div>
            {chips.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {chips.map((chip, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#F1BB03]/10 text-[#B45309] dark:text-[#F1BB03] border border-[#F1BB03]/20">
                            {chip}
                            <button type="button" onClick={() => onRemove(i)} className="hover:text-red-500 transition-colors">
                                ×
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// SEARCHABLE CATEGORY DROPDOWN
// Keeps all existing optgroup grouping. Adds a search input that filters
// subcategories live while preserving the category → subcategory structure.
// ─────────────────────────────────────────────────────────────────────────────
const SearchableCategory = ({
    groups,
    value,
    onChange,
    error,
}: {
    groups: { category: string; subcategories: string[] }[];
    value: string;
    onChange: (v: string) => void;
    error?: boolean;
}) => {
    const [open, setOpen]   = useState(false);
    const [query, setQuery] = useState('');
    const wrapRef           = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Filter groups by query
    const q = query.toLowerCase().trim();
    const filtered = q
        ? groups
            .map(g => ({
                category: g.category,
                subcategories: g.subcategories.filter(s => s.toLowerCase().includes(q) || g.category.toLowerCase().includes(q)),
            }))
            .filter(g => g.subcategories.length > 0)
        : groups;

    // Derive display label from stored value (format: "Category – Sub")
    const displayLabel = value
        ? value.split(' – ')[1] || value
        : '';

    return (
        <div ref={wrapRef} className="relative">
            {/* Trigger button */}
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className={cn(
                    fieldCls,
                    'h-11 flex items-center justify-between text-left cursor-pointer',
                    error && 'border-red-400 focus:ring-red-400/40',
                    !value && 'text-gray-400 dark:text-gray-500'
                )}
            >
                <span className="truncate">{value ? displayLabel : 'Select a category…'}</span>
                <ChevronDown className={cn('h-4 w-4 shrink-0 text-gray-400 transition-transform duration-150', open && 'rotate-180')} />
            </button>

            {/* Dropdown panel */}
            {open && (
                <div className={cn(
                    'absolute z-50 left-0 right-0 mt-1 rounded-xl border shadow-xl overflow-hidden',
                    'bg-white dark:bg-[#1C2333]',
                    'border-gray-100 dark:border-[#2D3748]'
                )}>
                    {/* Search input */}
                    <div className="p-2 border-b border-gray-100 dark:border-[#2D3748]">
                        <div className="relative">
                            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                autoFocus={typeof window !== 'undefined' && window.innerWidth > 640}
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Search categories…"
                                className={cn(
                                    'w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border',
                                    'bg-gray-50 dark:bg-[#161B27]',
                                    'border-gray-200 dark:border-[#2D3748]',
                                    'text-gray-700 dark:text-gray-300',
                                    'placeholder:text-gray-400',
                                    'focus:outline-none focus:ring-1 focus:ring-[#F1BB03]/50 focus:border-[#F1BB03]'
                                )}
                            />
                            {query && (
                                <button type="button" onClick={() => setQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Options list */}
                    <div className="max-h-64 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <div className="px-4 py-6 text-center text-sm text-gray-400">
                                No categories match `{query}`
                            </div>
                        ) : filtered.map(({ category, subcategories }) => (
                            <div key={category}>
                                {/* Group header */}
                                <div className="sticky top-0 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-[#161B27] border-b border-gray-100 dark:border-[#2D3748]">
                                    {category}
                                </div>
                                {/* Subcategory options */}
                                {subcategories.map(sub => {
                                    const optValue = `${category} – ${sub}`;
                                    const isSelected = value === optValue;
                                    return (
                                        <button
                                            key={sub}
                                            type="button"
                                            onClick={() => { onChange(optValue); setOpen(false); setQuery(''); }}
                                            className={cn(
                                                'w-full text-left px-5 py-2.5 text-sm transition-colors duration-100',
                                                isSelected
                                                    ? 'bg-[#F1BB03]/10 text-[#B45309] dark:text-[#F1BB03] font-medium'
                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2D3748]'
                                            )}
                                        >
                                            <span className="flex items-center gap-2">
                                                {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-[#F1BB03]" />}
                                                {!isSelected && <span className="w-3.5 shrink-0" />}
                                                {sub}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// RICH TEXT EDITOR
// Zero-dependency contenteditable editor. Stores output as HTML string via
// setValue() so it integrates directly with react-hook-form.
// Toolbar: Bold, Italic, Underline, Strikethrough, H1, H2, UL, OL, Blockquote,
//          Link, Clear formatting, Undo, Redo
// Character counter counts visible text (not HTML tags).
// ─────────────────────────────────────────────────────────────────────────────
const RichTextEditor = ({
    value,
    onChange,
    error,
    minLength = 100,
}: {
    value: string;
    onChange: (html: string) => void;
    error?: { message?: string };
    minLength?: number;
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [visibleLength, setVisibleLength] = useState(0);
    const MAX = 100000;
    // Track if we've done the initial content set
    const initialised = useRef(false);

    // Sync external value → editor.
    // Re-runs when 'value' changes from outside (e.g. editData loads async).
    // Guard prevents clobbering user's own edits: only sync when editor is empty
    // or when the incoming value is substantially different (edit mode pre-fill).
    useEffect(() => {
        if (!editorRef.current) return;
        const currentHTML = editorRef.current.innerHTML;
        // Only sync if: never initialised, or editor is blank, or value changed from empty to something
        if (!initialised.current || (!currentHTML && value)) {
            editorRef.current.innerHTML = value || '';
            updateCount();
            initialised.current = true;
        }
    }, [value]);

    const updateCount = () => {
        if (editorRef.current) {
            setVisibleLength(editorRef.current.innerText.replace(/\n/g, ' ').trim().length);
        }
    };

    const exec = (cmd: string, val?: string) => {
        editorRef.current?.focus();
        document.execCommand(cmd, false, val);
        emitChange();
    };

    const emitChange = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
            updateCount();
        }
    };

    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');

    const insertLink = () => {
        // Save selection before showing input
        setShowLinkInput(true);
        setLinkUrl('https://');
    };

    const confirmLink = () => {
        if (linkUrl && linkUrl !== 'https://') exec('createLink', linkUrl);
        setShowLinkInput(false);
        setLinkUrl('');
    };

    type ToolbarBtn = {
        cmd?: string; val?: string; icon: string; title: string;
        action?: () => void; active?: () => boolean;
    };

    const toolbarGroups: ToolbarBtn[][] = [
        [
            { cmd: 'undo',   icon: '↩', title: 'Undo' },
            { cmd: 'redo',   icon: '↪', title: 'Redo' },
        ],
        [
            { cmd: 'bold',          icon: 'B',  title: 'Bold' },
            { cmd: 'italic',        icon: 'I',  title: 'Italic' },
            { cmd: 'underline',     icon: 'U',  title: 'Underline' },
            { cmd: 'strikeThrough', icon: 'S̶', title: 'Strikethrough' },
        ],
        [
            { cmd: 'formatBlock', val: 'h2', icon: 'H1', title: 'Heading 1' },
            { cmd: 'formatBlock', val: 'h3', icon: 'H2', title: 'Heading 2' },
        ],
        [
            { cmd: 'insertUnorderedList', icon: '≡', title: 'Bullet list' },
            { cmd: 'insertOrderedList',   icon: '1.', title: 'Numbered list' },
            { cmd: 'formatBlock', val: 'blockquote', icon: '❝', title: 'Blockquote' },
        ],
        [
            { action: insertLink, icon: '🔗', title: 'Insert link' },
            { cmd: 'removeFormat', icon: '✕', title: 'Clear formatting' },
        ],
    ];

    return (
        <div className={cn(
            'rounded-lg border overflow-hidden transition-all',
            'bg-white dark:bg-[#1C2333]',
            error ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-[#2D3748]',
            'focus-within:ring-2 focus-within:ring-[#F1BB03]/50 focus-within:border-[#F1BB03]'
        )}>
            {/* Toolbar */}
            <div className={cn(
                'flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b',
                'bg-gray-50 dark:bg-[#161B27]',
                'border-gray-100 dark:border-[#2D3748]'
            )}>
                {toolbarGroups.map((group, gi) => (
                    <React.Fragment key={gi}>
                        {gi > 0 && <span className="w-px h-5 bg-gray-200 dark:bg-[#2D3748] mx-1 shrink-0" />}
                        {group.map(btn => (
                            <button
                                key={btn.title}
                                type="button"
                                title={btn.title}
                                onMouseDown={e => {
                                    e.preventDefault(); // prevent blur
                                    if (btn.action) btn.action();
                                    else exec(btn.cmd!, btn.val);
                                }}
                                className={cn(
                                    'px-2 py-1 rounded text-xs font-medium transition-all duration-100 min-w-7 text-center',
                                    'text-gray-600 dark:text-gray-400',
                                    'hover:bg-[#F1BB03]/15 hover:text-[#B45309] dark:hover:text-[#F1BB03]',
                                    btn.cmd === 'bold' && 'font-bold',
                                    btn.cmd === 'italic' && 'italic',
                                    btn.cmd === 'underline' && 'underline',
                                )}
                            >
                                {btn.icon}
                            </button>
                        ))}
                    </React.Fragment>
                ))}
            </div>

            {/* Inline link input (shows when inserting a link) */}
            {showLinkInput && (
                <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 dark:border-[#2D3748] bg-blue-50 dark:bg-blue-950/20">
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-400 shrink-0">URL:</span>
                    <input
                        autoFocus
                        value={linkUrl}
                        onChange={e => setLinkUrl(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') confirmLink(); if (e.key === 'Escape') setShowLinkInput(false); }}
                        placeholder="https://example.com"
                        className="flex-1 px-2 py-1 text-xs rounded border border-blue-200 dark:border-blue-700 bg-white dark:bg-[#1C2333] text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    <button type="button" onMouseDown={e => { e.preventDefault(); confirmLink(); }}
                        className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                        Insert
                    </button>
                    <button type="button" onClick={() => setShowLinkInput(false)}
                        className="text-xs text-gray-400 hover:text-gray-600">
                        ✕
                    </button>
                </div>
            )}

            {/* Editable area */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={emitChange}
                onBlur={emitChange}
                className={cn(
                    'min-h-45 max-h-120 overflow-y-auto px-4 py-3 text-sm outline-none',
                    'text-gray-800 dark:text-gray-200',
                    'prose prose-sm dark:prose-invert max-w-none',
                    '[&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1',
                    '[&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1',
                    '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1',
                    '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1',
                    '[&_blockquote]:border-l-4 [&_blockquote]:border-[#F1BB03] [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-gray-500 [&_blockquote]:dark:text-gray-400',
                    '[&_a]:text-[#F1BB03] [&_a]:underline',
                    'empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:dark:text-gray-500 empty:before:pointer-events-none'
                )}
                data-placeholder={"Full tender description including: • Background and objectives• Scope of work• Technical requirements• Expected outcomes"}
            />

            {/* Footer: char count */}
            <div className={cn(
                'flex items-center justify-between px-3 py-1.5 border-t text-[11px]',
                'bg-gray-50 dark:bg-[#161B27]',
                'border-gray-100 dark:border-[#2D3748]'
            )}>
                {error?.message ? (
                    <span className="text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />{error.message}
                    </span>
                ) : (
                    <span className={cn(
                        visibleLength < minLength ? 'text-amber-500' : 'text-gray-400'
                    )}>
                        {visibleLength < minLength ? `${minLength - visibleLength} more characters required` : 'Minimum length met ✓'}
                    </span>
                )}
                <span className={cn(
                    'font-mono tabular-nums',
                    visibleLength > MAX * 0.9 ? 'text-red-500' : 'text-gray-400'
                )}>
                    {visibleLength.toLocaleString()}/{MAX.toLocaleString()}
                </span>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN FORM
// ─────────────────────────────────────────────────────────────────────────────
export const ProfessionalTenderForm: React.FC<Props> = ({ tenderId, onSuccess, onCancel }) => {
    const router   = useRouter();
    const { toast }  = useToast();
    const { user }   = useAuth();
    const { isMobile } = useResponsive() as any;
    const isEdit   = !!tenderId;

    const [step, setStep]         = useState<Step>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadFiles, setUploadFiles]   = useState<UploadFile[]>([]);
    // certInput removed — ChipInput manages its own state internally
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Hooks
    const createMutation    = useCreateProfessionalTender();
    const updateMutation    = useUpdateProfessionalTender();
    const { mutateAsync: generateRef, isPending: genRefPending } = useGenerateReferenceNumber();
    const { data: categoryGroups = [] } = useProfessionalTenderCategories();
    const { mutateAsync: sendInvitations } = useInviteCompanies();

    // FIX: Fetch edit data internally when in edit mode.
    // The pages only pass tenderId — they never pass editData as a prop.
    const { data: editDataRaw, isLoading: editLoading } = useProfessionalTenderEditData(
        tenderId ?? '',
        { enabled: isEdit }
    );

    // Invitation state — controlled here, rendered by CompanyInvitationSelector in Step 1
    const [invitations, setInvitations] = useState<StagedInvitation[]>([]);

    // ── React Hook Form ──
    const { register, control, watch, setValue, trigger, getValues, reset, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            title:               '',
            briefDescription:    '',
            description:         '',
            procurementCategory: '',
            tenderType:          'services',
            workflowType:        'open',
            visibilityType:      'public',
            referenceNumber:     '',
            deadline:            '',
            procurement: {
                procuringEntity:     '',
                procurementMethod:   'open_tender',
                fundingSource:       '',
                bidSecurityAmount:   undefined,
                bidSecurityCurrency: 'ETB',
                bidValidityPeriod:   undefined,
                contactPerson:       { name: '', email: '', phone: '' },
            },
            preBidMeeting: {
                enabled:    false,
                date:       '',
                location:   '',
                onlineLink: '',
                mandatory:  false,
            },
            scope: {
                projectObjectives: '',
                timeline: {
                    startDate: '',
                    endDate:   '',
                    duration: { value: undefined, unit: 'days' },
                },
            },
            deliverables:    [],
            milestones:      [],
            performanceBond: { required: false, currency: 'ETB' },
            eligibility: {
                minimumExperience:         0,
                requiredCertifications:    [],
                legalRegistrationRequired: true,
                financialCapacity:         { currency: 'ETB' },
                pastProjectReferences:     { minCount: 0, similarValueProjects: false },
                geographicPresence:        '',
            },
            evaluation: {
                evaluationMethod: 'combined',
                technicalWeight:  70,
                financialWeight:  30,
            },
            clarificationDeadline: '',
            cpoRequired:    false,
            cpoDescription: '',
        },
        mode: 'onChange',
    });

    // FIX: Once edit data arrives from the API, populate all form fields via reset().
    // This handles the "empty form on edit" bug — defaultValues can't be async.
    useEffect(() => {
        if (!isEdit || !editDataRaw) return;
        const d = editDataRaw as any;
        reset({
            title:               d.title               ?? '',
            briefDescription:    d.briefDescription    ?? '',
            description:         d.description         ?? '',
            procurementCategory: d.procurementCategory ?? '',
            tenderType:          d.tenderType          ?? 'services',
            workflowType:        (d.workflowType === 'sealed' ? 'closed' : d.workflowType) ?? 'open',
            visibilityType:      d.visibilityType ?? d.visibility?.visibilityType ?? 'public',
            referenceNumber:     d.professionalSpecific?.referenceNumber ?? d.referenceNumber ?? '',
            deadline:            d.deadline ? new Date(d.deadline).toISOString().slice(0, 16) : '',
            procurement: {
                procuringEntity:     d.professionalSpecific?.procuringEntity     ?? d.procurement?.procuringEntity     ?? '',
                procurementMethod:   d.professionalSpecific?.procurementMethod   ?? d.procurement?.procurementMethod   ?? 'open_tender',
                fundingSource:       d.professionalSpecific?.fundingSource        ?? d.procurement?.fundingSource       ?? '',
                bidSecurityAmount:   d.professionalSpecific?.bidSecurityAmount   ?? d.procurement?.bidSecurityAmount,
                bidSecurityCurrency: d.professionalSpecific?.bidSecurityCurrency ?? d.procurement?.bidSecurityCurrency ?? 'ETB',
                bidValidityPeriod:   d.professionalSpecific?.bidValidityPeriod   ?? d.procurement?.bidValidityPeriod,
                contactPerson:       d.professionalSpecific?.contactPerson       ?? d.procurement?.contactPerson       ?? { name: '', email: '', phone: '' },
            },
            preBidMeeting: {
                enabled:    !!(d.preBidMeeting?.date || d.professionalSpecific?.preBidMeeting?.date),
                date:       (d.preBidMeeting?.date || d.professionalSpecific?.preBidMeeting?.date)
                                ? new Date(d.preBidMeeting?.date ?? d.professionalSpecific?.preBidMeeting?.date).toISOString().slice(0, 16)
                                : '',
                location:   d.preBidMeeting?.location   ?? d.professionalSpecific?.preBidMeeting?.location   ?? '',
                onlineLink: d.preBidMeeting?.onlineLink  ?? d.professionalSpecific?.preBidMeeting?.onlineLink ?? '',
                mandatory:  d.preBidMeeting?.mandatory   ?? d.professionalSpecific?.preBidMeeting?.mandatory  ?? false,
            },
            scope: {
                projectObjectives: d.scope?.projectObjectives ?? d.professionalSpecific?.scope?.projectObjectives ?? '',
                timeline: {
                    startDate: d.scope?.timeline?.startDate ?? '',
                    endDate:   d.scope?.timeline?.endDate   ?? '',
                    duration: {
                        value: d.scope?.timeline?.duration?.value  ?? undefined,
                        unit:  d.scope?.timeline?.duration?.unit   ?? 'days',
                    },
                },
            },
            deliverables: (d.professionalSpecific?.deliverables ?? d.scope?.deliverables ?? []).map((item: any) =>
                typeof item === 'string'
                    ? { title: item, description: '', deadline: '' }
                    : { title: item.title ?? item.text ?? '', description: item.description ?? '', deadline: item.deadline ? new Date(item.deadline).toISOString().slice(0, 10) : '' }
            ),
            milestones: (d.professionalSpecific?.milestones ?? d.scope?.milestones ?? []).map((m: any) => ({
                title:             m.title       ?? '',
                description:       m.description ?? '',
                dueDate:           m.dueDate     ? new Date(m.dueDate).toISOString().slice(0, 10) : '',
                paymentPercentage: m.paymentPercentage ?? 0,
            })),
            performanceBond: d.performanceBond ?? { required: false, currency: 'ETB' },
            eligibility: {
                minimumExperience:         d.eligibility?.minimumExperience         ?? d.professionalSpecific?.eligibility?.minimumExperience         ?? 0,
                requiredCertifications:    d.eligibility?.requiredCertifications    ?? d.professionalSpecific?.eligibility?.requiredCertifications    ?? [],
                legalRegistrationRequired: d.eligibility?.legalRegistrationRequired ?? d.professionalSpecific?.eligibility?.legalRegistrationRequired ?? true,
                financialCapacity:         d.eligibility?.financialCapacity         ?? d.professionalSpecific?.eligibility?.financialCapacity         ?? { currency: 'ETB' },
                pastProjectReferences:     d.eligibility?.pastProjectReferences     ?? d.professionalSpecific?.eligibility?.pastProjectReferences     ?? { minCount: 0, similarValueProjects: false },
                geographicPresence:        d.eligibility?.geographicPresence        ?? d.professionalSpecific?.eligibility?.geographicPresence        ?? '',
            },
            evaluation: {
                evaluationMethod: d.evaluation?.evaluationMethod ?? d.professionalSpecific?.evaluation?.evaluationMethod ?? 'combined',
                technicalWeight:  d.evaluation?.technicalWeight  ?? d.professionalSpecific?.evaluation?.technicalWeight  ?? 70,
                financialWeight:  d.evaluation?.financialWeight  ?? d.professionalSpecific?.evaluation?.financialWeight  ?? 30,
            },
            clarificationDeadline: d.clarificationDeadline ? new Date(d.clarificationDeadline).toISOString().slice(0, 16) : '',
            cpoRequired:    d.cpoRequired    ?? false,
            cpoDescription: d.cpoDescription ?? '',
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEdit, editDataRaw]);

    // Field arrays
    const { fields: deliverableFields, append: addDeliverable, remove: removeDeliverable } =
        useFieldArray({ control, name: 'deliverables' });

    const { fields: milestoneFields, append: addMilestone, remove: removeMilestone } =
        useFieldArray({ control, name: 'milestones' });

    // Watched values
    const watchedWorkflow          = watch('workflowType');
    const watchedEvalMethod        = watch('evaluation.evaluationMethod');
    const watchedCpoRequired       = watch('cpoRequired');
    const watchedPerformanceBond   = watch('performanceBond.required');
    const watchedPreBidEnabled     = watch('preBidMeeting.enabled');
    const watchedDeadline          = watch('deadline');
    const watchedBriefDesc         = watch('briefDescription');
    // watchedDesc not needed — RichTextEditor manages its own visible-character counter
    const watchedCerts             = watch('eligibility.requiredCertifications') ?? [];

    // FIX P-04: auto-set sealed bid on workflow change
    useEffect(() => {
        // no-op — handled in onSubmit via workflowType directly
    }, [watchedWorkflow]);

    const getDaysRemaining = useCallback((d?: string) => {
        if (!d) return null;
        const diff = new Date(d).getTime() - Date.now();
        const days = Math.ceil(diff / 86400000);
        return days > 0 ? days : 0;
    }, []);

    const stepIndex = step - 1;

    // ── Navigation ──
    const goNext = async () => {
        const fields = STEP_FIELDS[step];
        const valid  = fields.length ? await trigger(fields as any) : true;
        if (valid) { setStep(s => Math.min(s + 1, 5) as Step); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    };

    const goPrev = () => { setStep(s => Math.max(s - 1, 1) as Step); window.scrollTo({ top: 0, behavior: 'smooth' }); };

    // ── File upload ──
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files || []);
        if (uploadFiles.length + selected.length > 20) {
            toast({ title: 'Too many files', description: 'Maximum 20 files allowed', variant: 'destructive' });
            return;
        }
        const newFiles: UploadFile[] = selected.map(file => ({
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            file, docType: 'other', description: '', progress: 0, ready: false,
        }));
        setUploadFiles(prev => [...prev, ...newFiles]);
        // simulate progress
        newFiles.forEach(uf => {
            let p = 0;
            const iv = setInterval(() => {
                p += 25;
                setUploadFiles(prev => prev.map(f => f.id === uf.id ? { ...f, progress: Math.min(p, 100), ready: p >= 100 } : f));
                if (p >= 100) clearInterval(iv);
            }, 120);
        });
        e.target.value = '';
    };

    const formatBytes = (b: number) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

    // ── Submit ──
    const handleSubmit = async (status: 'draft' | 'published') => {
        setIsSubmitting(true);
        try {
            const vals = getValues();

            // FIX P-15: bidSecurityCurrency is in procurement sub-doc — NOT estimatedValue/currency
            const submitData: any = {
                title:               vals.title,
                briefDescription:    vals.briefDescription,
                description:         vals.description,
                procurementCategory: vals.procurementCategory,
                tenderType:          vals.tenderType,
                workflowType:        vals.workflowType,          // FIX P-01
                visibilityType:      vals.visibilityType,
                referenceNumber:     vals.referenceNumber || undefined,
                deadline:            new Date(vals.deadline).toISOString(),
                status,
                procurement: {
                    procuringEntity:     vals.procurement.procuringEntity,
                    procurementMethod:   vals.procurement.procurementMethod,
                    fundingSource:       vals.procurement.fundingSource,
                    bidSecurityAmount:   vals.procurement.bidSecurityAmount,
                    bidSecurityCurrency: vals.procurement.bidSecurityCurrency || 'ETB',
                    contactPerson:       vals.procurement.contactPerson,
                },
                // FIX P-14: preBidMeeting at root
                preBidMeeting: vals.preBidMeeting?.enabled ? {
                    date:       vals.preBidMeeting.date,
                    location:   vals.preBidMeeting.location,
                    onlineLink: vals.preBidMeeting.onlineLink,
                    mandatory:  vals.preBidMeeting.mandatory,
                } : undefined,
                // FIX P-05: deliverables as { title, description, deadline }
                scope: {
                    ...vals.scope,
                    deliverables: vals.deliverables.map(d => ({
                        title:       d.title,
                        description: d.description || '',
                        deadline:    d.deadline || undefined,
                    })),
                    milestones: vals.milestones.map(m => ({
                        title: m.title, description: m.description,
                        dueDate: m.dueDate, paymentPercentage: m.paymentPercentage,
                    })),
                },
                // FIX P-02: evaluation object
                evaluation: vals.evaluation,
                eligibility: vals.eligibility,
                performanceBond: vals.performanceBond,
                clarificationDeadline: vals.clarificationDeadline || undefined,
                cpoRequired:    vals.cpoRequired,
                cpoDescription: vals.cpoRequired ? vals.cpoDescription : undefined,
                // FIX P-04: sealedBidConfirmation auto-set (also handled in service)
                ...(vals.workflowType === 'closed' ? { sealedBidConfirmation: 'true' } : {}),
            };

            if (vals.procurement.bidValidityPeriod) {
                submitData.bidValidityPeriod = vals.procurement.bidValidityPeriod;
            }

            const files = uploadFiles.map(f => f.file);

            let result: any;
            if (isEdit && tenderId) {
                result = await updateMutation.mutateAsync({ id: tenderId, data: submitData, files: files.length ? files : undefined });
            } else {
                result = await createMutation.mutateAsync({ data: submitData, files: files.length ? files : undefined });
            }

            // ── Send queued invitations if this is an invite_only tender ──
            const savedId: string | undefined = result?._id || result?.tender?._id || result?.data?._id;
            if (savedId && vals.visibilityType === 'invite_only' && invitations.length > 0) {
                try {
                    const companies = invitations
                        .filter(i => i.type === 'company' && i.companyId)
                        .map(i => ({ companyId: i.companyId!, message: i.message || undefined }));
                    const emails = invitations
                        .filter(i => i.type === 'email' && i.email)
                        .map(i => i.email!);
                    if (companies.length > 0 || emails.length > 0) {
                        await sendInvitations({ id: savedId, companies, emails });
                    }
                } catch {
                    // Non-fatal — tender was saved; just warn about invitations
                    toast({
                        title: 'Tender saved',
                        description: 'Tender saved, but some invitations could not be sent. You can resend from the tender dashboard.',
                        variant: 'destructive',
                    });
                }
            }

            toast({
                title: status === 'published' ? '🎉 Tender Published!' : 'Draft Saved',
                description: status === 'published' ? 'Your tender is now live.' : 'Saved as draft.',
            });

            // FIX: call onSuccess with the saved ID — parent page controls navigation
            const id = result?._id || result?.tender?._id || result?.data?._id;
            if (id) onSuccess(id);
        } catch (err: any) {
            toast({ title: 'Error', description: err?.response?.data?.message || err.message || 'Failed to submit', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // FIX: While fetching edit data, show a skeleton so the form doesn't flash empty
    if (isEdit && editLoading) {
        return (
            <div className="space-y-5 animate-pulse">
                <div className="h-12 bg-gray-100 dark:bg-[#2D3748] rounded-xl" />
                <div className="h-1 bg-gray-100 dark:bg-[#2D3748] rounded-full" />
                <div className="h-40 bg-gray-100 dark:bg-[#2D3748] rounded-xl" />
                <div className="h-40 bg-gray-100 dark:bg-[#2D3748] rounded-xl" />
                <div className="h-40 bg-gray-100 dark:bg-[#2D3748] rounded-xl" />
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP HEADER BANNERS
    // ─────────────────────────────────────────────────────────────────────────
    const STEP_HEADERS = [
        { step: 1, bg: 'bg-[#FFFBEB] dark:bg-[#78350F]', border: 'border-[#F59E0B]', icon: <FileText />, iconBg: 'bg-[#F1BB03]', iconColor: 'text-[#0A2540]', label: 'Tender Overview', sub: 'Core details, descriptions, and deadline', labelColor: 'text-[#B45309] dark:text-[#FCD34D]', textColor: 'text-[#0A2540] dark:text-[#FEF3C7]', subColor: 'text-[#D97706] dark:text-[#FCD34D]' },
        { step: 2, bg: 'bg-[#DBEAFE] dark:bg-[#1E3A8A]', border: 'border-[#2563EB]', icon: <Building />, iconBg: 'bg-[#2563EB]', iconColor: 'text-white', label: 'Procurement Details', sub: 'Entity, method, security and contact', labelColor: 'text-[#1D4ED8] dark:text-[#93C5FD]', textColor: 'text-[#1E3A8A] dark:text-[#DBEAFE]', subColor: 'text-[#2563EB] dark:text-[#93C5FD]' },
        { step: 3, bg: 'bg-[#D1FAE5] dark:bg-[#064E3B]', border: 'border-[#059669]', icon: <Target />,   iconBg: 'bg-[#059669]', iconColor: 'text-white', label: 'Scope & Deliverables', sub: 'Objectives, timelines, milestones', labelColor: 'text-[#047857] dark:text-[#6EE7B7]', textColor: 'text-[#064E3B] dark:text-[#D1FAE5]', subColor: 'text-[#059669] dark:text-[#6EE7B7]' },
        { step: 4, bg: 'bg-[#EDE9FE] dark:bg-[#4C1D95]', border: 'border-[#8B5CF6]', icon: <Scale />,    iconBg: 'bg-[#8B5CF6]', iconColor: 'text-white', label: 'Eligibility & Evaluation', sub: 'Requirements, scoring, CPO', labelColor: 'text-[#6D28D9] dark:text-[#C4B5FD]', textColor: 'text-[#4C1D95] dark:text-[#EDE9FE]', subColor: 'text-[#7C3AED] dark:text-[#C4B5FD]' },
        { step: 5, bg: 'bg-gray-50 dark:bg-[#1C2333]', border: 'border-gray-200 dark:border-[#2D3748]', icon: <CheckCircle />, iconBg: 'bg-[#0A2540] dark:bg-white', iconColor: 'text-white dark:text-[#0A2540]', label: 'Review & Submit', sub: 'Final check before publishing', labelColor: 'text-gray-400 dark:text-gray-500', textColor: 'text-gray-900 dark:text-gray-100', subColor: 'text-gray-400 dark:text-gray-500' },
    ] as const;

    const sh = STEP_HEADERS[step - 1];

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER STEPS
    // ─────────────────────────────────────────────────────────────────────────
    const renderStep = () => {
        const vals = getValues();

        switch (step) {

            // ══════════════════════════════════════════════════════════════════
            // STEP 1 — BASIC INFO
            // ══════════════════════════════════════════════════════════════════
            case 1:
                return (
                    <div className="space-y-5">
                        <SectionCard title="Identification" icon={<Hash />} description="Reference and category">
                            <div className="space-y-4">
                                {/* Title */}
                                <Field label="Tender Title" required icon={<FileText className="h-3.5 w-3.5" />} error={errors.title}>
                                    <input {...register('title')} placeholder="e.g., Supply of Medical Equipment for District Hospitals"
                                        className={cn(fieldCls, 'h-11', errors.title && 'border-red-400 focus:ring-red-400/40')} />
                                </Field>

                                {/* Reference number + generate */}
                                <Field label="Reference Number" icon={<Hash className="h-3.5 w-3.5" />} error={errors.referenceNumber}
                                    helper="Leave blank to auto-generate on creation">
                                    <div className="flex gap-2">
                                        <input {...register('referenceNumber')} placeholder="BANANA/PROC/2026/0001"
                                            className={cn(fieldCls, 'flex-1 h-11 font-mono')} />
                                        <button type="button" disabled={genRefPending}
                                            onClick={async () => {
                                                try {
                                                    const ref = await generateRef();
                                                    setValue('referenceNumber', ref, { shouldValidate: true });
                                                } catch { /* handled by hook */ }
                                            }}
                                            className="shrink-0 h-11 px-4 rounded-lg border border-gray-200 dark:border-[#2D3748] text-sm font-semibold text-gray-700 dark:text-gray-300 hover:border-[#F1BB03]/60 hover:text-[#F1BB03] transition-all disabled:opacity-50 flex items-center gap-2 bg-white dark:bg-[#1C2333]">
                                            {genRefPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                                            Generate
                                        </button>
                                    </div>
                                </Field>

                                {/* Tender type — 4 card buttons */}
                                <Field label="Tender Type" required>
                                    <Controller name="tenderType" control={control} render={({ field }) => (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {(['works', 'goods', 'services', 'consultancy'] as const).map(t => (
                                                <button key={t} type="button" onClick={() => field.onChange(t)}
                                                    className={cn(
                                                        'relative p-3 rounded-xl border-2 text-center transition-all duration-150 flex flex-col items-center gap-1.5',
                                                        field.value === t
                                                            ? 'border-[#F1BB03] bg-[#F1BB03]/8 dark:bg-[#F1BB03]/12'
                                                            : 'border-gray-200 dark:border-[#2D3748] hover:border-[#F1BB03]/40 bg-white dark:bg-[#1C2333]'
                                                    )}>
                                                    <span className="text-xs font-semibold capitalize text-gray-700 dark:text-gray-300">{t}</span>
                                                    {field.value === t && (
                                                        <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#F1BB03] flex items-center justify-center">
                                                            <Check className="h-2.5 w-2.5 text-[#0A2540]" />
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )} />
                                </Field>

                                {/* Category — Searchable grouped dropdown (FIX P-08) */}
                                <Field label="Procurement Category" required icon={<Target className="h-3.5 w-3.5" />} error={errors.procurementCategory}>
                                    <Controller name="procurementCategory" control={control} render={({ field }) => (
                                        <SearchableCategory
                                            groups={categoryGroups}
                                            value={field.value}
                                            onChange={field.onChange}
                                            error={!!errors.procurementCategory}
                                        />
                                    )} />
                                </Field>

                                {/* Workflow type — 2 card buttons */}
                                <Field label="Bidding Workflow" required error={errors.workflowType}>
                                    <Controller name="workflowType" control={control} render={({ field }) => (
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { value: 'open',   label: 'Open Bidding',   icon: <Globe className="h-5 w-5" />,   desc: 'All bids are visible in real time' },
                                                { value: 'closed', label: 'Sealed Bidding', icon: <Lock className="h-5 w-5" />,    desc: 'Bids hidden until you reveal them after deadline' },
                                            ].map(opt => (
                                                <button key={opt.value} type="button" onClick={() => field.onChange(opt.value)}
                                                    className={cn(
                                                        'p-4 rounded-xl border-2 text-left transition-all duration-150',
                                                        field.value === opt.value
                                                            ? 'border-[#F1BB03] bg-[#F1BB03]/8 dark:bg-[#F1BB03]/12'
                                                            : 'border-gray-200 dark:border-[#2D3748] hover:border-[#F1BB03]/40 bg-white dark:bg-[#1C2333]'
                                                    )}>
                                                    <div className={cn('mb-2', field.value === opt.value ? 'text-[#F1BB03]' : 'text-gray-400')}>{opt.icon}</div>
                                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{opt.label}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{opt.desc}</p>
                                                </button>
                                            ))}
                                        </div>
                                    )} />
                                    {watchedWorkflow === 'closed' && (
                                        <div className="flex items-start gap-2 mt-2 px-3 py-2.5 rounded-lg border border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-950/20">
                                            <Shield className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                                            <p className="text-xs text-amber-700 dark:text-amber-400">
                                                Sealed bid tender — all submitted bids will remain hidden until you manually reveal them after the deadline.
                                            </p>
                                        </div>
                                    )}
                                </Field>

                                {/* Visibility */}
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Visibility" required>
                                        <Controller name="visibilityType" control={control} render={({ field }) => (
                                            <select {...field} className={cn(fieldCls, 'h-11')}>
                                                <option value="public">Public</option>
                                                <option value="invite_only">Invite Only</option>
                                            </select>
                                        )} />
                                    </Field>
                                    <Field label="Submission Deadline" required icon={<Calendar className="h-3.5 w-3.5" />} error={errors.deadline}>
                                        <div className="space-y-1.5">
                                            <input type="datetime-local" {...register('deadline')}
                                                className={cn(fieldCls, 'h-11', errors.deadline && 'border-red-400')} />
                                            {watchedDeadline && (
                                                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                    <Clock className="h-3 w-3" />
                                                    {getDaysRemaining(watchedDeadline)} days remaining
                                                </div>
                                            )}
                                        </div>
                                    </Field>
                                </div>

                                {/* Invite-only company selector — shown only when visibilityType is invite_only */}
                                {watch('visibilityType') === 'invite_only' && (
                                    <div className={cn(
                                        'rounded-xl border-2 border-dashed border-[#F1BB03]/40 p-4 space-y-3',
                                        'bg-[#FFFBEB]/50 dark:bg-[#78350F]/10'
                                    )}>
                                        <div className="flex items-center gap-2">
                                            <Users2 className="h-4 w-4 text-[#F1BB03] shrink-0" />
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                                    Queue Company Invitations
                                                </p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                                    Invitations are sent when you save or publish. You can add more later from the tender dashboard.
                                                </p>
                                            </div>
                                        </div>
                                        <CompanyInvitationSelector
                                            alreadyInvitedIds={editDataRaw?.invitations
                                                ?.filter((inv: any) => inv.invitedCompany)
                                                ?.map((inv: any) => inv.invitedCompany?.toString() || inv.invitedCompany) ?? []}
                                            value={invitations}
                                            onChange={setInvitations}
                                        />
                                    </div>
                                )}
                            </div>
                        </SectionCard>

                        <SectionCard title="Descriptions" icon={<FileText />} description="Brief summary and full details">
                            <div className="space-y-4">
                                {/* Brief description — P-16 */}
                                <Field label="Brief Description" required icon={<FileText className="h-3.5 w-3.5" />} error={errors.briefDescription}
                                    helper="Short summary shown in listings and cards (max 500 chars)">
                                    <textarea {...register('briefDescription')} rows={3} placeholder="Concise summary for listing cards…"
                                        className={cn(fieldCls, 'resize-none', errors.briefDescription && 'border-red-400')} />
                                    <div className="text-right">
                                        <span className={cn('text-[11px] font-mono', (watchedBriefDesc?.length ?? 0) > 450 ? 'text-amber-500' : 'text-gray-400')}>
                                            {watchedBriefDesc?.length ?? 0}/500
                                        </span>
                                    </div>
                                </Field>

                                {/* Detailed description — Rich text editor */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                        <span className="text-[#F1BB03]"><FileText className="h-3.5 w-3.5" /></span>
                                        Detailed Description
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <Controller
                                        name="description"
                                        control={control}
                                        render={({ field }) => (
                                            <RichTextEditor
                                                value={field.value}
                                                onChange={field.onChange}
                                                error={errors.description}
                                                minLength={100}
                                            />
                                        )}
                                    />
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                        Cover background, scope, requirements and constraints (min 100 characters)
                                    </p>
                                </div>
                            </div>
                        </SectionCard>
                    </div>
                );

            // ══════════════════════════════════════════════════════════════════
            // STEP 2 — PROCUREMENT DETAILS
            // ══════════════════════════════════════════════════════════════════
            case 2:
                return (
                    <div className="space-y-5">
                        <SectionCard title="Procuring Entity & Method" icon={<Building />}>
                            <div className="space-y-4">
                                <Field label="Procuring Entity Name" required icon={<Building className="h-3.5 w-3.5" />} error={errors.procurement?.procuringEntity}>
                                    <input {...register('procurement.procuringEntity')} placeholder="Organization issuing this tender"
                                        className={cn(fieldCls, 'h-11', errors.procurement?.procuringEntity && 'border-red-400')} />
                                </Field>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field label="Procurement Method" required>
                                        <Controller name="procurement.procurementMethod" control={control} render={({ field }) => (
                                            <select {...field} className={cn(fieldCls, 'h-11')}>
                                                {PROCUREMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                            </select>
                                        )} />
                                    </Field>
                                    <Field label="Funding Source" helper="e.g., World Bank, GoE Budget, GEF">
                                        <input {...register('procurement.fundingSource')} placeholder="Optional"
                                            className={cn(fieldCls, 'h-11')} />
                                    </Field>
                                </div>
                            </div>
                        </SectionCard>

                        <SectionCard title="Bid Security" icon={<Shield />} collapsible>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="Bid Security Amount">
                                    <div className="flex gap-2">
                                        <input type="number" min="0" step="100" placeholder="Amount"
                                            {...register('procurement.bidSecurityAmount', { setValueAs: v => v === '' ? undefined : parseFloat(v) })}
                                            className={cn(fieldCls, 'flex-1 h-11')} />
                                        <Controller name="procurement.bidSecurityCurrency" control={control} render={({ field }) => (
                                            <select {...field} className={cn(fieldCls, 'w-24 h-11 shrink-0')}>
                                                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        )} />
                                    </div>
                                </Field>
                                <Field label="Bid Validity Period (days)">
                                    <input type="number" min="1" placeholder="e.g., 90"
                                        {...register('procurement.bidValidityPeriod', { setValueAs: v => v === '' ? undefined : parseInt(v) })}
                                        className={cn(fieldCls, 'h-11')} />
                                </Field>
                            </div>
                        </SectionCard>

                        <SectionCard title="Contact Person" icon={<Award />} collapsible>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {[
                                    { name: 'procurement.contactPerson.name' as const,  label: 'Name',  type: 'text',  placeholder: 'Full name' },
                                    { name: 'procurement.contactPerson.email' as const, label: 'Email', type: 'email', placeholder: 'email@example.com' },
                                    { name: 'procurement.contactPerson.phone' as const, label: 'Phone', type: 'tel',   placeholder: '+251…' },
                                ].map(f => (
                                    <Field key={f.name} label={f.label}>
                                        <input type={f.type} placeholder={f.placeholder} {...register(f.name)}
                                            className={cn(fieldCls, 'h-11')} />
                                    </Field>
                                ))}
                            </div>
                        </SectionCard>

                        {/* FIX P-14: preBidMeeting at root level */}
                        <SectionCard title="Pre-Bid Meeting" icon={<Calendar />} collapsible>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Controller name="preBidMeeting.enabled" control={control} render={({ field }) => (
                                        <button type="button" onClick={() => field.onChange(!field.value)}
                                            className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors', field.value ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-[#2D3748]')}>
                                            <span className={cn('h-4 w-4 rounded-full bg-white shadow transition-transform', field.value ? 'translate-x-6' : 'translate-x-1')} />
                                        </button>
                                    )} />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Pre-Bid Meeting</span>
                                </div>

                                {watchedPreBidEnabled && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                        <Field label="Meeting Date & Time">
                                            <input type="datetime-local" {...register('preBidMeeting.date')} className={cn(fieldCls, 'h-11')} />
                                        </Field>
                                        <Field label="Location">
                                            <input {...register('preBidMeeting.location')} placeholder="Physical address or 'Online'" className={cn(fieldCls, 'h-11')} />
                                        </Field>
                                        <Field label="Online Meeting Link">
                                            <input {...register('preBidMeeting.onlineLink')} placeholder="Zoom/Teams/Meet URL" className={cn(fieldCls, 'h-11')} />
                                        </Field>
                                        <Field label="Mandatory">
                                            <div className="flex items-center gap-3 h-11">
                                                <Controller name="preBidMeeting.mandatory" control={control} render={({ field }) => (
                                                    <button type="button" onClick={() => field.onChange(!field.value)}
                                                        className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors', field.value ? 'bg-[#F1BB03]' : 'bg-gray-300 dark:bg-[#2D3748]')}>
                                                        <span className={cn('h-4 w-4 rounded-full bg-white shadow transition-transform', field.value ? 'translate-x-6' : 'translate-x-1')} />
                                                    </button>
                                                )} />
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Attendance required</span>
                                            </div>
                                        </Field>
                                    </div>
                                )}
                            </div>
                        </SectionCard>

                        <SectionCard title="Advanced" icon={<Settings />} collapsible defaultOpen={false}>
                            <Field label="Clarification Deadline" helper="Deadline for submitting questions/clarifications">
                                <input type="datetime-local" {...register('clarificationDeadline')} className={cn(fieldCls, 'h-11')} />
                            </Field>
                        </SectionCard>
                    </div>
                );

            // ══════════════════════════════════════════════════════════════════
            // STEP 3 — SCOPE & DELIVERABLES
            // ══════════════════════════════════════════════════════════════════
            case 3:
                return (
                    <div className="space-y-5">
                        <SectionCard title="Project Objectives" icon={<Target />} collapsible>
                            <textarea {...register('scope.projectObjectives')} rows={4} placeholder="Describe the main objectives and expected outcomes…"
                                className={cn(fieldCls, 'resize-y min-h-25')} />
                        </SectionCard>

                        <SectionCard title="Timeline" icon={<Clock />} collapsible>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <Field label="Start Date">
                                    <input type="date" {...register('scope.timeline.startDate')} className={cn(fieldCls, 'h-11')} />
                                </Field>
                                <Field label="End Date">
                                    <input type="date" {...register('scope.timeline.endDate')} className={cn(fieldCls, 'h-11')} />
                                </Field>
                                <Field label="Duration">
                                    <div className="flex gap-2">
                                        <input type="number" min="1" placeholder="Value" {...register('scope.timeline.duration.value', { setValueAs: v => v === '' ? undefined : parseInt(v) })}
                                            className={cn(fieldCls, 'flex-1 h-11')} />
                                        <Controller name="scope.timeline.duration.unit" control={control} render={({ field }) => (
                                            <select {...field} value={field.value ?? 'days'} className={cn(fieldCls, 'w-28 h-11 shrink-0')}>
                                                {['days', 'weeks', 'months', 'years'].map(u => <option key={u} value={u} className="capitalize">{u}</option>)}
                                            </select>
                                        )} />
                                    </div>
                                </Field>
                            </div>
                        </SectionCard>

                        {/* FIX P-05: Deliverables as { title, description, deadline } */}
                        <SectionCard title="Key Deliverables" icon={<FileCheck />}
                            badge={
                                <button type="button" onClick={() => addDeliverable({ title: '', description: '', deadline: '' })}
                                    className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#F1BB03]/10 text-[#B45309] dark:text-[#F1BB03] hover:bg-[#F1BB03]/20 transition-all">
                                    + Add
                                </button>
                            }>
                            <div className="space-y-3">
                                {deliverableFields.length === 0 ? (
                                    <div className="text-center py-8 rounded-lg border-2 border-dashed border-gray-200 dark:border-[#2D3748]">
                                        <FileCheck className="mx-auto h-7 w-7 mb-2 text-gray-300 dark:text-gray-600" />
                                        <p className="text-sm text-gray-400">No deliverables yet</p>
                                        <button type="button" onClick={() => addDeliverable({ title: '', description: '', deadline: '' })}
                                            className="mt-2 text-xs font-semibold text-[#F1BB03] hover:underline">Add first deliverable</button>
                                    </div>
                                ) : deliverableFields.map((field, i) => (
                                    <div key={field.id} className="p-4 rounded-lg border border-gray-100 dark:border-[#2D3748] bg-gray-50 dark:bg-[#1C2333] space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-[#F1BB03]/20 text-[#F1BB03] text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                                            <input {...register(`deliverables.${i}.title`)} placeholder="Deliverable title (required)"
                                                className={cn(fieldCls, 'flex-1 h-9')} />
                                            <button type="button" onClick={() => removeDeliverable(i)}
                                                className="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-[#2D3748] text-gray-400 hover:text-red-500 hover:border-red-300 transition-all">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                        <textarea {...register(`deliverables.${i}.description`)} placeholder="Description (optional)" rows={2}
                                            className={cn(fieldCls, 'resize-none min-h-14')} />
                                        <Field label="Deadline">
                                            <input type="date" {...register(`deliverables.${i}.deadline`)} className={cn(fieldCls, 'h-9')} />
                                        </Field>
                                    </div>
                                ))}
                            </div>
                        </SectionCard>

                        {/* Milestones */}
                        <SectionCard title="Project Milestones" icon={<Clock />}
                            badge={
                                <button type="button" onClick={() => addMilestone({ title: '', description: '', dueDate: '', paymentPercentage: 0 })}
                                    className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#F1BB03]/10 text-[#B45309] dark:text-[#F1BB03] hover:bg-[#F1BB03]/20 transition-all">
                                    + Add
                                </button>
                            }>
                            <div className="space-y-3">
                                {milestoneFields.length === 0 ? (
                                    <div className="text-center py-8 rounded-lg border-2 border-dashed border-gray-200 dark:border-[#2D3748]">
                                        <Clock className="mx-auto h-7 w-7 mb-2 text-gray-300 dark:text-gray-600" />
                                        <p className="text-sm text-gray-400">No milestones yet</p>
                                        <button type="button" onClick={() => addMilestone({ title: '', description: '', dueDate: '', paymentPercentage: 0 })}
                                            className="mt-2 text-xs font-semibold text-[#F1BB03] hover:underline">Add first milestone</button>
                                    </div>
                                ) : milestoneFields.map((field, i) => (
                                    <div key={field.id} className="p-4 rounded-lg border border-gray-100 dark:border-[#2D3748] bg-gray-50 dark:bg-[#1C2333] space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                                            <input {...register(`milestones.${i}.title`)} placeholder="Milestone title"
                                                className={cn(fieldCls, 'flex-1 h-9')} />
                                            <button type="button" onClick={() => removeMilestone(i)}
                                                className="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-[#2D3748] text-gray-400 hover:text-red-500 hover:border-red-300 transition-all">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Field label="Due Date">
                                                <input type="date" {...register(`milestones.${i}.dueDate`)} className={cn(fieldCls, 'h-9')} />
                                            </Field>
                                            <Field label="Payment %">
                                                <div className="relative">
                                                    <input type="number" min="0" max="100"
                                                        {...register(`milestones.${i}.paymentPercentage`, { setValueAs: v => v === '' ? undefined : parseFloat(v) })}
                                                        className={cn(fieldCls, 'h-9 pr-6')} />
                                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                                                </div>
                                            </Field>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </SectionCard>

                        {/* Performance Bond */}
                        <SectionCard title="Performance Bond" icon={<Shield />} collapsible defaultOpen={false}
                            description="Required for ERA, EEP and major Works contracts">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Controller name="performanceBond.required" control={control} render={({ field }) => (
                                        <button type="button" onClick={() => field.onChange(!field.value)}
                                            className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors', field.value ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-[#2D3748]')}>
                                            <span className={cn('h-4 w-4 rounded-full bg-white shadow transition-transform', field.value ? 'translate-x-6' : 'translate-x-1')} />
                                        </button>
                                    )} />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Performance bond required</span>
                                </div>
                                {watchedPerformanceBond && (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <Field label="Percentage (%)">
                                            <div className="relative">
                                                <input type="number" min="0" max="100" step="0.5"
                                                    {...register('performanceBond.percentage', { setValueAs: v => v === '' ? undefined : parseFloat(v) })}
                                                    className={cn(fieldCls, 'h-11 pr-6')} />
                                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                                            </div>
                                        </Field>
                                        <Field label="Fixed Amount">
                                            <input type="number" min="0" placeholder="Optional"
                                                {...register('performanceBond.amount', { setValueAs: v => v === '' ? undefined : parseFloat(v) })}
                                                className={cn(fieldCls, 'h-11')} />
                                        </Field>
                                        <Field label="Currency">
                                            <Controller name="performanceBond.currency" control={control} render={({ field }) => (
                                                <select {...field} className={cn(fieldCls, 'h-11')}>
                                                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            )} />
                                        </Field>
                                    </div>
                                )}
                            </div>
                        </SectionCard>
                    </div>
                );

            // ══════════════════════════════════════════════════════════════════
            // STEP 4 — ELIGIBILITY & EVALUATION
            // ══════════════════════════════════════════════════════════════════
            case 4:
                return (
                    <div className="space-y-5">
                        <SectionCard title="Eligibility Requirements" icon={<Award />}>
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field label="Minimum Years of Experience" error={errors.eligibility?.minimumExperience}>
                                        <div className="relative">
                                            <input type="number" min="0" step="0.5"
                                                {...register('eligibility.minimumExperience', { setValueAs: v => v === '' ? 0 : parseFloat(v) })}
                                                className={cn(fieldCls, 'h-11 pr-14')} />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">years</span>
                                        </div>
                                    </Field>
                                    <Field label="Geographic Presence">
                                        <input {...register('eligibility.geographicPresence')} placeholder="e.g., Addis Ababa, Nationwide, East Africa"
                                            className={cn(fieldCls, 'h-11')} />
                                    </Field>
                                </div>

                                {/* Legal registration toggle */}
                                <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-gray-100 dark:border-[#2D3748] bg-gray-50 dark:bg-[#1C2333]">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Legal registration required</span>
                                    <Controller name="eligibility.legalRegistrationRequired" control={control} render={({ field }) => (
                                        <button type="button" onClick={() => field.onChange(!field.value)}
                                            className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors', field.value ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-[#2D3748]')}>
                                            <span className={cn('h-4 w-4 rounded-full bg-white shadow transition-transform', field.value ? 'translate-x-6' : 'translate-x-1')} />
                                        </button>
                                    )} />
                                </div>

                                {/* Required certifications — chip input */}
                                <Field label="Required Certifications">
                                    <ChipInput
                                        placeholder="Type certification name and press Enter or + Add"
                                        chips={watchedCerts}
                                        onAdd={v => setValue('eligibility.requiredCertifications', [...watchedCerts, v], { shouldValidate: true })}
                                        onRemove={i => setValue('eligibility.requiredCertifications', watchedCerts.filter((_, idx) => idx !== i), { shouldValidate: true })}
                                    />
                                </Field>

                                {/* Financial capacity */}
                                <Field label="Minimum Annual Turnover">
                                    <div className="flex gap-2">
                                        <input type="number" min="0" step="1000" placeholder="Amount"
                                            {...register('eligibility.financialCapacity.minAnnualTurnover', { setValueAs: v => v === '' ? undefined : parseFloat(v) })}
                                            className={cn(fieldCls, 'flex-1 h-11')} />
                                        <Controller name="eligibility.financialCapacity.currency" control={control} render={({ field }) => (
                                            <select {...field} className={cn(fieldCls, 'w-24 h-11 shrink-0')}>
                                                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        )} />
                                    </div>
                                </Field>

                                {/* Past projects */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field label="Minimum Past Projects Count">
                                        <input type="number" min="0"
                                            {...register('eligibility.pastProjectReferences.minCount', { setValueAs: v => v === '' ? 0 : parseInt(v) })}
                                            className={cn(fieldCls, 'h-11')} />
                                    </Field>
                                    <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-gray-100 dark:border-[#2D3748] bg-gray-50 dark:bg-[#1C2333] h-13 mt-6.5">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Similar value projects</span>
                                        <Controller name="eligibility.pastProjectReferences.similarValueProjects" control={control} render={({ field }) => (
                                            <button type="button" onClick={() => field.onChange(!field.value)}
                                                className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors', field.value ? 'bg-[#F1BB03]' : 'bg-gray-300 dark:bg-[#2D3748]')}>
                                                <span className={cn('h-4 w-4 rounded-full bg-white shadow transition-transform', field.value ? 'translate-x-6' : 'translate-x-1')} />
                                            </button>
                                        )} />
                                    </div>
                                </div>
                            </div>
                        </SectionCard>

                        {/* FIX P-02: Evaluation as object with weights */}
                        <SectionCard title="Evaluation Methodology" icon={<Trophy />}>
                            <div className="space-y-4">
                                <Field label="Evaluation Method">
                                    <Controller name="evaluation.evaluationMethod" control={control} render={({ field }) => (
                                        <div className="grid grid-cols-3 gap-2">
                                            {([
                                                { value: 'technical_only', label: 'Technical Only' },
                                                { value: 'financial_only', label: 'Financial Only' },
                                                { value: 'combined',       label: 'Combined' },
                                            ] as const).map(opt => (
                                                <button key={opt.value} type="button" onClick={() => field.onChange(opt.value)}
                                                    className={cn(
                                                        'py-2.5 px-3 rounded-lg border-2 text-xs font-semibold transition-all',
                                                        field.value === opt.value
                                                            ? 'border-[#F1BB03] bg-[#F1BB03]/8 text-[#B45309] dark:text-[#F1BB03]'
                                                            : 'border-gray-200 dark:border-[#2D3748] text-gray-600 dark:text-gray-400 hover:border-[#F1BB03]/40 bg-white dark:bg-[#1C2333]'
                                                    )}>
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    )} />
                                </Field>
                                {watchedEvalMethod === 'combined' && (
                                    <EvalSliders watch={watch} setValue={setValue} />
                                )}
                            </div>
                        </SectionCard>

                        {/* CPO */}
                        <SectionCard title="Certificate of Payment Obligation (CPO)" icon={<Shield />}
                            description="Financial guarantee requirement for bid security">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-4 py-3.5 rounded-xl border border-gray-100 dark:border-[#2D3748] bg-gray-50 dark:bg-[#1C2333]">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Require CPO from bidders</p>
                                        <p className="text-xs text-gray-400 mt-0.5">Bidders must submit a CPO document to participate</p>
                                    </div>
                                    <Controller name="cpoRequired" control={control} render={({ field }) => (
                                        <button type="button" onClick={() => field.onChange(!field.value)}
                                            className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0', field.value ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-[#2D3748]')}>
                                            <span className={cn('h-4 w-4 rounded-full bg-white shadow transition-transform', field.value ? 'translate-x-6' : 'translate-x-1')} />
                                        </button>
                                    )} />
                                </div>

                                {watchedCpoRequired && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                            <FileCheck className="h-3.5 w-3.5 text-[#F1BB03]" />
                                            CPO Requirements Description
                                            <span className="text-red-500">*</span>
                                        </label>
                                        <textarea {...register('cpoDescription')} rows={4}
                                            placeholder="Specify CPO requirements: minimum amount, validity period, acceptable issuing banks, submission deadline…"
                                            className={cn(fieldCls, 'resize-y min-h-[100px]', errors.cpoDescription && 'border-red-400')} />
                                        {errors.cpoDescription && (
                                            <p className="text-xs text-red-500 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />{errors.cpoDescription.message}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </SectionCard>

                        {/* File uploads */}
                        <SectionCard title="Supporting Documents" icon={<FileStack />}
                            description="Attach Terms of Reference, BoQ, drawings, and other tender documents">
                            <div className="space-y-4">
                                {/* Drop zone */}
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-[#F1BB03]/60', 'bg-[#F1BB03]/3'); }}
                                    onDragLeave={e => { e.preventDefault(); e.currentTarget.classList.remove('border-[#F1BB03]/60', 'bg-[#F1BB03]/3'); }}
                                    onDrop={e => {
                                        e.preventDefault();
                                        e.currentTarget.classList.remove('border-[#F1BB03]/60', 'bg-[#F1BB03]/3');
                                        const dropped = Array.from(e.dataTransfer.files);
                                        handleFileSelect({ target: { files: dropped } } as any);
                                    }}
                                    className="border-2 border-dashed border-gray-200 dark:border-[#2D3748] rounded-xl p-8 text-center cursor-pointer hover:border-[#F1BB03]/60 hover:bg-[#F1BB03]/3 transition-all group">
                                    <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect}
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.zip" />
                                    <div className="mx-auto w-12 h-12 rounded-xl bg-gray-100 dark:bg-[#2D3748] group-hover:bg-[#F1BB03]/15 transition-colors flex items-center justify-center mb-3">
                                        <Upload className="h-5 w-5 text-gray-400 group-hover:text-[#F1BB03] transition-colors" />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Drag & drop or <span className="text-[#F1BB03] underline underline-offset-2">browse files</span>
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">PDF, DOC, XLS, PPT, Images, ZIP · Max 20 files · 50 MB each</p>
                                </div>

                                {/* File list */}
                                {uploadFiles.length > 0 && (
                                    <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                                        {uploadFiles.map(uf => (
                                            <div key={uf.id} className={cn(
                                                'p-3 rounded-lg border transition-all',
                                                'bg-white dark:bg-[#161B27]',
                                                uf.ready ? 'border-emerald-200 dark:border-emerald-800/50' : 'border-gray-100 dark:border-[#2D3748]'
                                            )}>
                                                {/* Row 1: icon + name + remove */}
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className={cn('rounded-lg p-1.5 shrink-0', uf.ready ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-100 dark:bg-[#2D3748]')}>
                                                        <FileText className="h-4 w-4 text-gray-500" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{uf.file.name}</p>
                                                        <p className="text-xs text-gray-400">{formatBytes(uf.file.size)}</p>
                                                    </div>
                                                    {uf.ready && <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />}
                                                    <button type="button" onClick={() => setUploadFiles(prev => prev.filter(f => f.id !== uf.id))}
                                                        className="shrink-0 h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                                {/* Progress */}
                                                {!uf.ready && uf.progress < 100 && (
                                                    <div className="mt-2 space-y-1">
                                                        <div className="h-1 bg-gray-200 dark:bg-[#2D3748] rounded-full overflow-hidden">
                                                            <div className="h-full bg-[#F1BB03] transition-all" style={{ width: `${uf.progress}%` }} />
                                                        </div>
                                                        <p className="text-xs text-gray-400">Processing… {uf.progress}%</p>
                                                    </div>
                                                )}
                                                {/* Doc type + description */}
                                                <div className="mt-2.5 grid grid-cols-2 gap-2">
                                                    <select value={uf.docType} onChange={e => setUploadFiles(prev => prev.map(f => f.id === uf.id ? { ...f, docType: e.target.value } : f))}
                                                        className={cn(fieldCls, 'h-8 text-xs')}>
                                                        {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                                    </select>
                                                    <input value={uf.description} onChange={e => setUploadFiles(prev => prev.map(f => f.id === uf.id ? { ...f, description: e.target.value } : f))}
                                                        placeholder="Description (optional)" className={cn(fieldCls, 'h-8 text-xs')} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </SectionCard>
                    </div>
                );

            // ══════════════════════════════════════════════════════════════════
            // STEP 5 — REVIEW & SUBMIT
            // ══════════════════════════════════════════════════════════════════
            case 5: {
                const fv = getValues();
                const daysLeft = getDaysRemaining(fv.deadline);

                const ReviewRow = ({ label, value, full }: { label: string; value: React.ReactNode; full?: boolean }) => (
                    <div className={cn('space-y-0.5', full && 'col-span-full')}>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">{label}</p>
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{value ?? <span className="text-gray-400">—</span>}</div>
                    </div>
                );

                const ReviewCard = ({ title, icon, onEdit, cols = 2, children }: {
                    title: string; icon: React.ReactNode; onEdit: () => void; cols?: number; children: React.ReactNode;
                }) => (
                    <div className={cardCls}>
                        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 dark:border-[#2D3748]">
                            <span className="text-[#F1BB03]">{React.cloneElement(icon as React.ReactElement<any>, { className: 'h-4 w-4' })}</span>
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex-1">{title}</span>
                            <button type="button" onClick={onEdit}
                                className="text-xs font-semibold px-2.5 py-1 rounded-md bg-gray-100 dark:bg-[#2D3748] text-gray-500 hover:text-[#F1BB03] hover:bg-[#F1BB03]/10 transition-all">
                                <Edit3 className="h-3 w-3 inline mr-1" />Edit
                            </button>
                        </div>
                        <div className={cn('p-5 grid gap-x-6 gap-y-4', cols === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-4')}>
                            {children}
                        </div>
                    </div>
                );

                return (
                    <div className="space-y-4">
                        {/* Readiness */}
                        <div className="flex items-start gap-3 px-5 py-4 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/20">
                            <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Ready to submit</p>
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                                    Review each section carefully — you can go back to edit before publishing.
                                </p>
                            </div>
                        </div>

                        {/* Basic info */}
                        <ReviewCard title="Overview" icon={<FileText />} onEdit={() => setStep(1)}>
                            <ReviewRow label="Tender ID" value={
                                fv.referenceNumber ? (
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono">{fv.referenceNumber}</span>
                                        <button type="button" onClick={() => navigator.clipboard.writeText(fv.referenceNumber!).then(() => toast({ title: 'Copied!' }))}
                                            className="text-gray-400 hover:text-[#F1BB03] transition-colors">
                                            <Copy className="h-3 w-3" />
                                        </button>
                                    </div>
                                ) : <span className="text-xs text-amber-500">Will be auto-generated</span>
                            } />
                            <ReviewRow label="Procuring Entity" value={fv.procurement?.procuringEntity} />
                            <ReviewRow label="Title" full value={<span className="line-clamp-2">{fv.title}</span>} />
                            <ReviewRow label="Category" value={fv.procurementCategory} />
                            <ReviewRow label="Tender Type" value={<span className="capitalize">{fv.tenderType}</span>} />
                            <ReviewRow label="Deadline" value={
                                fv.deadline ? (
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span>{format(new Date(fv.deadline), 'PPP p')}</span>
                                        {daysLeft !== null && (
                                            <span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold',
                                                daysLeft <= 7 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                                                daysLeft <= 30 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400')}>
                                                {daysLeft}d left
                                            </span>
                                        )}
                                    </div>
                                ) : null
                            } />
                            <ReviewRow label="Brief Description" full value={<span className="line-clamp-2 text-gray-500 dark:text-gray-400">{fv.briefDescription}</span>} />
                        </ReviewCard>

                        {/* Workflow */}
                        <ReviewCard title="Workflow" icon={<Settings />} onEdit={() => setStep(1)} cols={4}>
                            <ReviewRow label="Workflow" value={
                                <span className={cn('text-xs font-bold uppercase px-2.5 py-0.5 rounded-full',
                                    fv.workflowType === 'closed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400')}>
                                    {fv.workflowType === 'closed' ? 'Sealed' : 'Open'}
                                </span>
                            } />
                            <ReviewRow label="Visibility" value={fv.visibilityType === 'invite_only' ? 'Invite Only' : 'Public'} />
                            <ReviewRow label="Procurement Method" value={PROCUREMENT_METHODS.find(m => m.value === fv.procurement?.procurementMethod)?.label ?? '—'} />
                            <ReviewRow label="CPO" value={fv.cpoRequired ? <span className="text-xs text-emerald-600 font-semibold">Required</span> : 'Not required'} />
                        </ReviewCard>

                        {/* Evaluation */}
                        <ReviewCard title="Evaluation" icon={<Scale />} onEdit={() => setStep(4)}>
                            <ReviewRow label="Method" value={
                                fv.evaluation?.evaluationMethod === 'combined' ? 'Combined' :
                                fv.evaluation?.evaluationMethod === 'technical_only' ? 'Technical Only' : 'Financial Only'
                            } />
                            <ReviewRow label="Weight Distribution" value={
                                fv.evaluation?.evaluationMethod === 'combined' ? (
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-[#2D3748] rounded-full overflow-hidden">
                                            <div className="h-full bg-[#0A2540] dark:bg-white rounded-full" style={{ width: `${fv.evaluation.technicalWeight}%` }} />
                                        </div>
                                        <span className="text-xs font-mono text-gray-400">T:{fv.evaluation.technicalWeight}% · F:{fv.evaluation.financialWeight}%</span>
                                    </div>
                                ) : '—'
                            } />
                        </ReviewCard>

                        {/* Documents */}
                        <ReviewCard title={`Documents (${uploadFiles.length})`} icon={<FileStack />} onEdit={() => setStep(4)}>
                            <div className="col-span-full">
                                {uploadFiles.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-4">No files attached</p>
                                ) : (
                                    <div className="space-y-2 max-h-[160px] overflow-y-auto">
                                        {uploadFiles.map((f, i) => (
                                            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#1C2333]">
                                                <FileText className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{f.file.name}</span>
                                                <span className="text-xs text-gray-400 shrink-0">{formatBytes(f.file.size)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </ReviewCard>

                        {/* Summary stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-5 py-4 rounded-xl border border-gray-200 dark:border-[#2D3748] bg-gray-50 dark:bg-[#1C2333]">
                            {[
                                { label: 'Files',        value: `${uploadFiles.length}` },
                                { label: 'Deliverables', value: `${fv.deliverables?.length ?? 0}` },
                                { label: 'Milestones',   value: `${fv.milestones?.length ?? 0}` },
                                { label: 'CPO',          value: fv.cpoRequired ? 'Required' : 'Optional' },
                            ].map(({ label, value }) => (
                                <div key={label}>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{label}</p>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            }

            default: return null;
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // MAIN RENDER
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <form onSubmit={e => e.preventDefault()} className="w-full space-y-0">

            {/* ── Step progress rail ── */}
            <div className={cn(cardCls, 'mb-5 overflow-hidden shadow-sm')}>
                {/* Desktop step tabs */}
                <div className="hidden sm:flex items-stretch border-b border-gray-100 dark:border-[#2D3748]">
                    {STEPS.map((s, i) => {
                        const isActive   = i === stepIndex;
                        const isComplete = i < stepIndex;
                        const Icon       = s.icon;
                        return (
                            <button key={s.id} type="button"
                                onClick={() => isComplete ? setStep(s.id as Step) : undefined}
                                disabled={!isComplete && !isActive}
                                className={cn(
                                    'flex-1 flex items-center gap-2.5 px-4 py-3 text-left border-r last:border-r-0 border-gray-100 dark:border-[#2D3748] transition-all duration-200',
                                    isActive   ? 'bg-[#F1BB03]/6 dark:bg-[#F1BB03]/8 cursor-default' :
                                    isComplete ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1C2333]' :
                                    'cursor-not-allowed opacity-40'
                                )}>
                                <span className={cn(
                                    'flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 transition-all',
                                    isComplete ? 'bg-emerald-500 text-white' :
                                    isActive   ? 'bg-[#F1BB03] text-[#0A2540]' :
                                    'bg-gray-100 dark:bg-[#2D3748] text-gray-400'
                                )}>
                                    {isComplete ? <Check className="h-3 w-3" /> : i + 1}
                                </span>
                                <div className="min-w-0">
                                    <span className={cn('text-xs font-semibold block',
                                        isActive   ? 'text-[#B45309] dark:text-[#F1BB03]' :
                                        isComplete ? 'text-gray-700 dark:text-gray-300' :
                                        'text-gray-400'
                                    )}>
                                        {s.label}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Mobile indicator */}
                <div className="flex sm:hidden items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-[#2D3748]">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#F1BB03] text-[#0A2540] text-xs font-bold">{step}</span>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{STEPS[stepIndex].label}</p>
                        <p className="text-[10px] text-gray-400">Step {step} of {STEPS.length}</p>
                    </div>
                    <span className="text-xs font-bold text-[#B45309] dark:text-[#F1BB03]">{Math.round((step / STEPS.length) * 100)}%</span>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-gray-100 dark:bg-[#2D3748]">
                    <div className="h-full bg-[#F1BB03] transition-all duration-500 ease-out rounded-r-full"
                        style={{ width: `${(step / STEPS.length) * 100}%` }} />
                </div>
            </div>

            {/* ── Step header banner ── */}
            <div className={cn('flex items-center gap-3 px-5 py-4 rounded-xl border mb-5', sh.bg, sh.border)}>
                <span className={cn('flex items-center justify-center w-9 h-9 rounded-lg shrink-0 shadow-sm', sh.iconBg)}>
                    {React.cloneElement(sh.icon as React.ReactElement<any>, { className: `h-4 w-4 ${sh.iconColor}` })}
                </span>
                <div className="flex-1">
                    <p className={cn('text-[10px] font-bold uppercase tracking-widest', sh.labelColor)}>Step {step} of {STEPS.length}</p>
                    <h2 className={cn('text-lg font-bold leading-tight', sh.textColor)}>{sh.label}</h2>
                    <p className={cn('text-xs mt-0.5', sh.subColor)}>{sh.sub}</p>
                </div>
            </div>

            {/* ── Step content ── */}
            <div className="mb-5">{renderStep()}</div>

            {/* ── Validation errors ── */}
            {Object.keys(errors).length > 0 && (
                <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/20 mb-5">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-red-700 dark:text-red-300 mb-1">Please fix the following:</p>
                        <ul className="space-y-0.5 max-h-[100px] overflow-y-auto">
                            {Object.entries(errors).map(([field, err]: [string, any]) => (
                                <li key={field} className="flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400">
                                    <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5 shrink-0" />
                                    <span><span className="font-semibold">{field}:</span> {err?.message ?? 'Invalid value'}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* ── Navigation footer ── */}
            <div className={cn('flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-[#2D3748]', isMobile ? 'flex-col' : 'flex-row')}>

                {/* Back / Cancel */}
                <button type="button"
                    onClick={step === 1 ? onCancel : goPrev}
                    disabled={isSubmitting}
                    className={cn(
                        'flex items-center gap-2 font-semibold rounded-lg transition-all duration-150 border',
                        'bg-white dark:bg-[#1C2333] border-gray-200 dark:border-[#2D3748] text-gray-700 dark:text-gray-300',
                        'hover:bg-gray-50 dark:hover:bg-[#2D3748]',
                        'disabled:opacity-40 disabled:cursor-not-allowed',
                        isMobile ? 'w-full h-11 text-sm justify-center order-2' : 'h-11 px-5 text-sm order-1'
                    )}>
                    <ArrowLeft className="h-4 w-4" />{step === 1 ? 'Cancel' : 'Previous'}
                </button>

                {!isMobile && <div className="flex-1" />}

                <div className={cn('flex gap-3', isMobile ? 'w-full flex-col order-1' : 'order-2')}>
                    {step !== 5 ? (
                        <button type="button" onClick={goNext} disabled={isSubmitting}
                            className={cn(
                                'flex items-center gap-2 font-semibold rounded-lg transition-all duration-150',
                                'bg-[#0A2540] dark:bg-white text-white dark:text-[#0A2540]',
                                'hover:bg-[#0A2540]/90 dark:hover:bg-white/90 shadow-sm',
                                'disabled:opacity-40 disabled:cursor-not-allowed',
                                isMobile ? 'w-full h-11 text-sm justify-center' : 'h-11 px-7 text-sm'
                            )}>
                            Continue<ArrowRight className="h-4 w-4" />
                        </button>
                    ) : (
                        <>
                            {/* Save Draft */}
                            <button type="button" onClick={() => handleSubmit('draft')} disabled={isSubmitting}
                                className={cn(
                                    'flex items-center gap-2 font-semibold rounded-lg transition-all border',
                                    'bg-white dark:bg-[#1C2333] border-gray-200 dark:border-[#2D3748] text-gray-700 dark:text-gray-300',
                                    'hover:bg-gray-50 dark:hover:bg-[#2D3748]',
                                    'disabled:opacity-40 disabled:cursor-not-allowed',
                                    isMobile ? 'w-full h-11 text-sm justify-center' : 'h-11 px-5 text-sm'
                                )}>
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Save Draft
                            </button>

                            {/* Publish */}
                            <button type="button" onClick={() => handleSubmit('published')} disabled={isSubmitting}
                                className={cn(
                                    'flex items-center gap-2 font-bold rounded-lg transition-all',
                                    'bg-[#F1BB03] hover:bg-[#D97706] text-[#0A2540]',
                                    'shadow-md shadow-[#F1BB03]/30',
                                    'disabled:opacity-40 disabled:cursor-not-allowed',
                                    isMobile ? 'w-full h-11 text-sm justify-center' : 'h-11 px-7 text-sm'
                                )}>
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                {isEdit ? 'Save & Publish' : 'Publish Tender'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </form>
    );
};

export default ProfessionalTenderForm;