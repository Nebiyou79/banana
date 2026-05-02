// ─────────────────────────────────────────────────────────────────────────────
//  src/components/professionalTenders/ProfessionalTenderForm/formSchema.ts
// ─────────────────────────────────────────────────────────────────────────────
//  Single source of truth for the now-5-step ProfessionalTenderForm.
//
//  STEP MAP (post-refactor):
//    1. Basic Info      title, brief, description, category, type, workflow,
//                       visibility, ref-number, **invitedCompanies** (when invite-only)
//    2. Procurement     procurement.* + **CPO subsection**
//    3. Eligibility &   eligibility.* + scope.description + evaluation.*
//       Evaluation      (was Step 3 + Step 4)
//    4. Dates &         deadline, bidOpeningDate, clarificationDeadline,
//       Documents       preBidMeeting (ROOT), staged files
//                       (was Step 5 + Step 6)
//    5. Review          composes prior steps
//
//  Bug fixes still enforced:
//   • P-01  workflowType = 'open' | 'closed'  (never 'sealed')
//   • P-14  preBidMeeting at ROOT level
//   • Evaluation weights sum to 100
// ─────────────────────────────────────────────────────────────────────────────

import { z } from 'zod';

// ═════════════════════════════════════════════════════════════════════════════
//  PRIMITIVES
// ═════════════════════════════════════════════════════════════════════════════

const isoDateString = z
  .string()
  .min(1, 'Required')
  .refine((v) => !isNaN(new Date(v).getTime()), 'Invalid date');

const optionalIsoDate = z
  .string()
  .optional()
  .refine((v) => !v || !isNaN(new Date(v).getTime()), 'Invalid date');

const positiveNumberOrUndefined = z
  .union([z.coerce.number().min(0), z.literal(''), z.nan()])
  .optional()
  .transform((v) => {
    if (v === '' || v === undefined) return undefined;
    if (typeof v === 'number' && isNaN(v)) return undefined;
    return v as number;
  });

const nonNegativeIntOrUndefined = z
  .union([z.coerce.number().int().min(0), z.literal(''), z.nan()])
  .optional()
  .transform((v) => {
    if (v === '' || v === undefined) return undefined;
    if (typeof v === 'number' && isNaN(v)) return undefined;
    return v as number;
  });

// ═════════════════════════════════════════════════════════════════════════════
//  PER-STEP SCHEMAS — used for step-by-step trigger() validation
// ═════════════════════════════════════════════════════════════════════════════

export const step1Schema = z
  .object({
    title:               z.string().trim().min(5, 'Title must be at least 5 characters').max(200),
    briefDescription:    z.string().trim().min(1, 'Brief description is required').max(500),
    description:         z.string().trim().min(50, 'Description must be at least 50 characters'),
    procurementCategory: z.string().trim().min(1, 'Category is required'),
    tenderType:          z.enum(['works', 'goods', 'services', 'consultancy']),
    workflowType:        z.enum(['open', 'closed']),
    visibilityType:      z.enum(['public', 'invite_only']),
    referenceNumber:     z.string().optional(),
    invitedCompanies:    z.array(z.string().trim().min(1)).default([]),
  })
  .refine(
    (v) => v.visibilityType !== 'invite_only' || v.invitedCompanies.length > 0,
    {
      message: 'Invite at least one company to receive bids',
      path: ['invitedCompanies'],
    },
  );

export const step2Schema = z
  .object({
    procurement: z.object({
      procuringEntity:     z.string().trim().min(1, 'Procuring entity is required'),
      procurementMethod:   z.enum(['open_tender', 'restricted', 'sealed_bid', 'direct', 'framework', 'negotiated']),
      fundingSource:       z.string().trim().optional(),
      bidSecurityAmount:   positiveNumberOrUndefined,
      bidSecurityCurrency: z.enum(['ETB', 'USD', 'EUR', 'GBP']).default('ETB'),
      contactPerson: z.object({
        name:     z.string().trim().optional(),
        email:    z.string().trim().email('Invalid email').optional().or(z.literal('')),
        phone:    z.string().trim().optional(),
        position: z.string().trim().optional(),
      }).optional(),
    }),
    cpoRequired:    z.boolean().default(false),
    cpoDescription: z.string().trim().max(1000).optional(),
    cpoAmount:      positiveNumberOrUndefined,
    cpoCurrency:    z.enum(['ETB', 'USD', 'EUR', 'GBP']).default('ETB'),
  })
  .refine(
    (v) => !v.cpoRequired || (v.cpoDescription?.trim()?.length ?? 0) >= 5,
    {
      message: 'Describe the CPO requirement (at least 5 characters)',
      path: ['cpoDescription'],
    },
  );

export const step3Schema = z
  .object({
    eligibility: z.object({
      minimumExperience:         nonNegativeIntOrUndefined,
      requiredCertifications:    z.array(z.string().trim().min(1)).default([]),
      legalRegistrationRequired: z.boolean().default(false),
    }),
    scope: z.object({
      description: z.string().trim().min(1, 'Scope description is required'),
    }),
    evaluation: z.object({
      evaluationMethod: z.enum(['technical_only', 'financial_only', 'combined']),
      technicalWeight:  z.coerce.number().min(0).max(100),
      financialWeight:  z.coerce.number().min(0).max(100),
      criteria:         z.string().trim().optional(),
    }),
  })
  .refine(
    (v) => v.evaluation.technicalWeight + v.evaluation.financialWeight === 100,
    {
      message: 'Technical + Financial weights must sum to exactly 100',
      path: ['evaluation', 'financialWeight'],
    },
  );

export const step4Schema = z
  .object({
    deadline:              isoDateString,
    bidOpeningDate:        optionalIsoDate,
    clarificationDeadline: optionalIsoDate,
    preBidMeeting: z.object({
      enabled:    z.boolean().default(false),
      date:       optionalIsoDate,
      location:   z.string().trim().optional(),
      onlineLink: z.string().trim().url('Invalid URL').optional().or(z.literal('')),
      mandatory:  z.boolean().default(false),
    }),
  })
  .refine(
    (v) => {
      if (!v.preBidMeeting.enabled) return true;
      return !!(v.preBidMeeting.date || v.preBidMeeting.location || v.preBidMeeting.onlineLink);
    },
    {
      message: 'Provide a date, location, or online link for the pre-bid meeting',
      path: ['preBidMeeting', 'date'],
    },
  )
  .refine(
    (v) => {
      if (!v.bidOpeningDate || !v.deadline) return true;
      return new Date(v.bidOpeningDate) >= new Date(v.deadline);
    },
    {
      message: 'Bid opening date must be on or after the deadline',
      path: ['bidOpeningDate'],
    },
  )
  .refine(
    (v) => {
      if (!v.clarificationDeadline || !v.deadline) return true;
      return new Date(v.clarificationDeadline) <= new Date(v.deadline);
    },
    {
      message: 'Clarification deadline must be on or before the submission deadline',
      path: ['clarificationDeadline'],
    },
  );

export const step5Schema = z.object({}).passthrough();

// ═════════════════════════════════════════════════════════════════════════════
//  FULL FORM SCHEMA
// ═════════════════════════════════════════════════════════════════════════════

export const professionalTenderFormSchema = z.object({
  title:               z.string().trim().min(5).max(200),
  briefDescription:    z.string().trim().min(1).max(500),
  description:         z.string().trim().min(50),
  procurementCategory: z.string().trim().min(1),
  tenderType:          z.enum(['works', 'goods', 'services', 'consultancy']),
  workflowType:        z.enum(['open', 'closed']),
  visibilityType:      z.enum(['public', 'invite_only']).default('public'),
  referenceNumber:     z.string().optional(),
  invitedCompanies:    z.array(z.string().trim().min(1)).default([]),

  procurement: z.object({
    procuringEntity:     z.string().trim().min(1),
    procurementMethod:   z.enum(['open_tender', 'restricted', 'sealed_bid', 'direct', 'framework', 'negotiated']),
    fundingSource:       z.string().trim().optional(),
    bidSecurityAmount:   positiveNumberOrUndefined,
    bidSecurityCurrency: z.enum(['ETB', 'USD', 'EUR', 'GBP']).default('ETB'),
    contactPerson: z.object({
      name:     z.string().trim().optional(),
      email:    z.string().trim().email().optional().or(z.literal('')),
      phone:    z.string().trim().optional(),
      position: z.string().trim().optional(),
    }).optional(),
  }),
  cpoRequired:    z.boolean().default(false),
  cpoDescription: z.string().trim().max(1000).optional(),
  cpoAmount:      positiveNumberOrUndefined,
  cpoCurrency:    z.enum(['ETB', 'USD', 'EUR', 'GBP']).default('ETB'),

  eligibility: z.object({
    minimumExperience:         nonNegativeIntOrUndefined,
    requiredCertifications:    z.array(z.string().trim().min(1)).default([]),
    legalRegistrationRequired: z.boolean().default(false),
  }),
  scope: z.object({
    description: z.string().trim().min(1),
  }),
  evaluation: z.object({
    evaluationMethod: z.enum(['technical_only', 'financial_only', 'combined']).default('combined'),
    technicalWeight:  z.coerce.number().min(0).max(100).default(70),
    financialWeight:  z.coerce.number().min(0).max(100).default(30),
    criteria:         z.string().trim().optional(),
  }),

  deadline:              isoDateString,
  bidOpeningDate:        optionalIsoDate,
  clarificationDeadline: optionalIsoDate,
  preBidMeeting: z.object({
    enabled:    z.boolean().default(false),
    date:       optionalIsoDate,
    location:   z.string().trim().optional(),
    onlineLink: z.string().trim().url().optional().or(z.literal('')),
    mandatory:  z.boolean().default(false),
  }),
});

export type ProfessionalTenderFormValues = z.infer<typeof professionalTenderFormSchema>;

// ═════════════════════════════════════════════════════════════════════════════
//  CLIENT-SIDE REFERENCE NUMBER GENERATOR (1.2)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Generates a preview reference number client-side. Format: PT-YYYY-XXXX
 *
 * NOTE: The backend assigns the *real* sequential reference number on publish.
 * This is a preview to help the user see the format. If kept and published,
 * the backend either honors it (if available) or reassigns sequentially.
 */
export const generateReferenceNumber = (): string => {
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 9000) + 1000; // 1000–9999
  return `PT-${year}-${seq}`;
};

// ═════════════════════════════════════════════════════════════════════════════
//  DEFAULTS
// ═════════════════════════════════════════════════════════════════════════════

export const buildEmptyFormValues = (): ProfessionalTenderFormValues => ({
  title: '',
  briefDescription: '',
  description: '',
  procurementCategory: '',
  tenderType: 'services',
  workflowType: 'open',
  visibilityType: 'public',
  referenceNumber: '',
  invitedCompanies: [],

  procurement: {
    procuringEntity: '',
    procurementMethod: 'open_tender',
    fundingSource: '',
    bidSecurityAmount: undefined,
    bidSecurityCurrency: 'ETB',
    contactPerson: { name: '', email: '', phone: '', position: '' },
  },
  cpoRequired: false,
  cpoDescription: '',
  cpoAmount: undefined,
  cpoCurrency: 'ETB',

  eligibility: {
    minimumExperience: undefined,
    requiredCertifications: [],
    legalRegistrationRequired: false,
  },
  scope: { description: '' },

  evaluation: {
    evaluationMethod: 'combined',
    technicalWeight: 70,
    financialWeight: 30,
    criteria: '',
  },

  deadline: '',
  bidOpeningDate: '',
  clarificationDeadline: '',
  preBidMeeting: {
    enabled: false,
    date: '',
    location: '',
    onlineLink: '',
    mandatory: false,
  },
});

// ═════════════════════════════════════════════════════════════════════════════
//  PAYLOAD MAPPING
// ═════════════════════════════════════════════════════════════════════════════

export const toCreatePayload = (values: ProfessionalTenderFormValues) => {
  const payload: Record<string, any> = { ...values };

  const cp = payload.procurement?.contactPerson;
  if (cp && !cp.name && !cp.email && !cp.phone && !cp.position) {
    payload.procurement = { ...payload.procurement };
    delete payload.procurement.contactPerson;
  }

  // P-14: preBidMeeting at root
  if (!values.preBidMeeting.enabled) {
    delete payload.preBidMeeting;
  } else {
    const { enabled: _enabled, ...rest } = values.preBidMeeting;
    payload.preBidMeeting = rest;
  }

  for (const key of ['bidOpeningDate', 'clarificationDeadline']) {
    if (payload[key] === '') delete payload[key];
  }

  if (values.visibilityType !== 'invite_only') {
    delete payload.invitedCompanies;
  }

  if (!values.cpoRequired) {
    delete payload.cpoDescription;
    delete payload.cpoAmount;
    delete payload.cpoCurrency;
  } else if (payload.cpoAmount === undefined) {
    delete payload.cpoAmount;
  }

  return payload;
};

// ═════════════════════════════════════════════════════════════════════════════
//  STEP METADATA
// ═════════════════════════════════════════════════════════════════════════════

export type StepIndex = 1 | 2 | 3 | 4 | 5;

export const STEP_DEFINITIONS: ReadonlyArray<{
  index: StepIndex;
  title: string;
  shortTitle: string;
}> = [
  { index: 1, title: 'Basic Info',                 shortTitle: 'Basics' },
  { index: 2, title: 'Procurement & CPO',          shortTitle: 'Procurement' },
  { index: 3, title: 'Eligibility & Evaluation',   shortTitle: 'Scoring' },
  { index: 4, title: 'Dates & Documents',          shortTitle: 'Dates' },
  { index: 5, title: 'Review & Submit',            shortTitle: 'Review' },
] as const;

export const STEP_FIELDS: Record<StepIndex, ReadonlyArray<keyof ProfessionalTenderFormValues>> = {
  1: ['title', 'briefDescription', 'description', 'procurementCategory', 'tenderType', 'workflowType', 'visibilityType', 'invitedCompanies'],
  2: ['procurement', 'cpoRequired', 'cpoDescription', 'cpoAmount', 'cpoCurrency'],
  3: ['eligibility', 'scope', 'evaluation'],
  4: ['deadline', 'bidOpeningDate', 'clarificationDeadline', 'preBidMeeting'],
  5: [],
};