/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/forms/tenders/ProfessionalTenderForm.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/social/ui/Button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import {
  Loader2,
  Plus,
  Trash2,
  CheckCircle,
  FileText,
  Settings,
  Award,
  Clock,
  FileCheck,
  DollarSign,
  Shield,
  Briefcase,
  Globe,
  Lock,
  Calendar,
  Building,
  Hash,
  Target,
  Trophy,
  Scale,
  FileStack,
  RefreshCw,
  Edit3,
  Check,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Save,
  Send,
  Image as ImageIcon,
  File as FileIcon,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  Upload,
  FileSpreadsheet,
  Presentation,
  FileJson,
  FileCode,
  FileArchive,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProfessionalTenderForm } from '@/hooks/useTenders';
import { useCreateProfessionalTender } from '@/hooks/useTenders';
import { useTenderValidation } from '@/hooks/useTenders';
import { useTenderUtils } from '@/hooks/useTenders';
import { useTenderConstants } from '@/hooks/useTenders';
import { useTenderCategories } from '@/hooks/useTenders';
import { useAuth } from '@/hooks/useAuth';
import { useResponsive } from '@/hooks/useResponsive';
import { format } from 'date-fns';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { professionalTenderSchema, DOCUMENT_TYPES, CreateProfessionalTenderData } from '@/services/tenderService';
import { colorClasses } from '@/utils/color';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================
type FormStep = 'basic' | 'requirements' | 'evaluation' | 'workflow' | 'review';

// Extended schema to include briefDescription
const extendedProfessionalTenderSchema = professionalTenderSchema.extend({
  briefDescription: z.string()
    .min(1, 'Brief description is required')
    .max(500, 'Brief description cannot exceed 500 characters'),
});

type FormValues = z.infer<typeof extendedProfessionalTenderSchema>;

// File upload type
interface UploadedFile {
  id: string;
  file: File;
  description: string;
  documentType: string;
  progress?: number;
  error?: string;
  uploaded?: boolean;
  preview?: string;
}

// ============================================
// STEP INDICATOR COMPONENT
// ============================================
const StepIndicator = ({
  currentStep,
  steps,
  isMobile
}: {
  currentStep: FormStep;
  steps: Array<{ id: FormStep; label: string; icon: React.ReactNode }>;
  isMobile: boolean;
}) => {
  const stepIndex = steps.findIndex(step => step.id === currentStep);

  if (isMobile) {
    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center flex-1">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                index === stepIndex
                  ? `${colorClasses.bg.darkNavy} text-white ring-2 ring-offset-2 ${colorClasses.ring.darkNavy}`
                  : index < stepIndex
                    ? `${colorClasses.bg.goldenMustard} text-white`
                    : `${colorClasses.bg.gray100} ${colorClasses.text.gray400}`
              )}>
                {index < stepIndex ? (
                  <Check className="h-4 w-4" />
                ) : (
                  React.cloneElement(step.icon as React.ReactElement<any, any>, { className: "h-4 w-4" })
                )}
              </div>
              <span className={cn(
                "mt-1 text-[10px] font-medium text-center",
                index === stepIndex
                  ? colorClasses.text.darkNavy
                  : index < stepIndex
                    ? colorClasses.text.goldenMustard
                    : colorClasses.text.gray400
              )}>
                Step {index + 1}
              </span>
            </div>
          ))}
        </div>
        <div className="relative h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn(
              "absolute top-0 left-0 h-full transition-all duration-300",
              colorClasses.bg.goldenMustard
            )}
            style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between relative">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center relative z-10">
              <div className={cn(
                "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                index === stepIndex
                  ? `${colorClasses.bg.darkNavy} ${colorClasses.border.darkNavy} text-white scale-110 shadow-lg`
                  : index < stepIndex
                    ? `${colorClasses.bg.goldenMustard} ${colorClasses.border.goldenMustard} text-white`
                    : `${colorClasses.bg.white} dark:bg-gray-800 ${colorClasses.border.gray200} dark:border-gray-700 ${colorClasses.text.gray400}`
              )}>
                {index < stepIndex ? (
                  <Check className="h-5 w-5 md:h-6 md:w-6" />
                ) : (
                  React.cloneElement(step.icon as React.ReactElement<any, any>, { className: "h-5 w-5 md:h-6 md:w-6" })
                )}
              </div>
              <span className={cn(
                "mt-2 md:mt-3 text-xs md:text-sm font-medium transition-colors",
                index === stepIndex
                  ? colorClasses.text.darkNavy + ' font-semibold'
                  : index < stepIndex
                    ? colorClasses.text.goldenMustard
                    : colorClasses.text.gray400
              )}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 mx-2 rounded-full",
                index < stepIndex ? colorClasses.bg.goldenMustard : 'bg-gray-200 dark:bg-gray-700'
              )} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// ============================================
// SECTION HEADER COMPONENT
// ============================================
const SectionHeader = ({
  title,
  description,
  icon,
  badge,
  isMobile
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  isMobile?: boolean;
}) => (
  <div className={cn(
    "flex flex-col gap-3 mb-4",
    !isMobile && "md:flex-row md:items-start md:justify-between"
  )}>
    <div className="flex items-start gap-3">
      <div className={cn(
        "rounded-xl shrink-0",
        colorClasses.bg.darkNavy,
        "text-white shadow-md",
        isMobile ? "p-2" : "p-3"
      )}>
        {React.cloneElement(icon as React.ReactElement<any, any>, {
          className: isMobile ? "h-5 w-5" : "h-6 w-6"
        })}
      </div>
      <div>
        <h3 className={cn(
          "font-semibold tracking-tight",
          colorClasses.text.primary,
          isMobile ? "text-lg" : "text-xl"
        )}>
          {title}
        </h3>
        <p className={cn(
          "mt-1",
          colorClasses.text.muted,
          isMobile ? "text-xs" : "text-sm"
        )}>
          {description}
        </p>
      </div>
    </div>
    {badge && !isMobile && <div className="md:self-center">{badge}</div>}
  </div>
);

// ============================================
// CPO TOGGLE SECTION
// ============================================
const CPOToggleSection = ({
  cpoRequired,
  cpoDescription,
  onToggleCPO,
  onUpdateCPODescription,
  errors,
  isMobile
}: {
  cpoRequired: boolean;
  cpoDescription?: string;
  onToggleCPO: (required: boolean) => void;
  onUpdateCPODescription: (description: string) => void;
  errors?: any;
  isMobile: boolean;
}) => {
  return (
    <Card className={cn(
      "border-2 transition-all duration-300",
      colorClasses.bg.white,
      "dark:bg-gray-800",
      cpoRequired
        ? `${colorClasses.border.goldenMustard} shadow-md`
        : `${colorClasses.border.gray200} dark:border-gray-700`
    )}>
      <CardHeader className={isMobile ? "p-4 pb-2" : "pb-3"}>
        <CardTitle className={cn(
          "flex items-center gap-2",
          isMobile ? "text-base" : "text-lg",
          colorClasses.text.primary
        )}>
          <Shield className={cn(
            colorClasses.text.goldenMustard,
            isMobile ? "h-4 w-4" : "h-5 w-5"
          )} />
          Certificate of Payment Obligation (CPO)
        </CardTitle>
        <CardDescription className={cn(
          colorClasses.text.muted,
          isMobile ? "text-xs" : "text-sm"
        )}>
          Financial guarantee requirement for bid security
        </CardDescription>
      </CardHeader>

      <CardContent className={cn("space-y-4", isMobile ? "p-4 pt-0" : "")}>
        <div className={cn(
          "flex flex-col gap-4 p-3 md:p-5 rounded-xl",
          cpoRequired
            ? `${colorClasses.bg.goldenMustard} bg-opacity-10 dark:bg-opacity-20 border ${colorClasses.border.goldenMustard}`
            : 'bg-muted/30 border border-gray-200 dark:border-gray-700'
        )}>
          <div className="space-y-1">
            <Label className={cn(
              "font-medium flex items-center gap-2",
              colorClasses.text.primary,
              isMobile ? "text-sm" : "text-base"
            )}>
              <Shield className={cn(
                cpoRequired ? colorClasses.text.goldenMustard : colorClasses.text.muted,
                isMobile ? "h-3.5 w-3.5" : "h-4 w-4"
              )} />
              Require CPO
            </Label>
            <p className={cn(
              colorClasses.text.muted,
              isMobile ? "text-xs" : "text-sm"
            )}>
              Enable if financial guarantee is mandatory for bidders
            </p>
          </div>

          <div className="flex items-center justify-between sm:justify-start gap-3">
            {cpoRequired && (
              <Badge className={cn(
                colorClasses.bg.goldenMustard,
                "text-white",
                isMobile ? "text-xs px-2 py-0.5" : ""
              )}>
                Required
              </Badge>
            )}
            <Switch
              checked={cpoRequired}
              onCheckedChange={onToggleCPO}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>
        </div>

        {cpoRequired && (
          <div className={cn(
            "space-y-3 p-3 md:p-5 rounded-xl border-2",
            "bg-emerald-50 dark:bg-emerald-950/20",
            "border-emerald-200 dark:border-emerald-800",
            "bg-linear-to-br from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-gray-800"
          )}>
            <div className="space-y-2">
              <Label htmlFor="cpo-description" className={cn(
                "flex items-center gap-2 font-medium",
                colorClasses.text.primary,
                isMobile ? "text-sm" : "text-base"
              )}>
                <FileCheck className={cn(
                  colorClasses.text.emerald,
                  isMobile ? "h-3.5 w-3.5" : "h-4 w-4"
                )} />
                CPO Requirements Description <span className="text-destructive">*</span>
              </Label>

              <Textarea
                id="cpo-description"
                placeholder="Specify CPO requirements: minimum amount, validity period, acceptable issuing banks, format requirements, submission deadline, etc."
                value={cpoDescription || ''}
                onChange={(e) => onUpdateCPODescription(e.target.value)}
                rows={isMobile ? 4 : 5}
                className={cn(
                  "resize-y",
                  "bg-white dark:bg-gray-700",
                  colorClasses.text.primary,
                  "border-gray-300 dark:border-gray-600",
                  "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                  isMobile ? "min-h-25 text-sm" : "min-h-[120px]",
                  errors?.cpoDescription
                    ? 'border-destructive focus-visible:ring-destructive'
                    : 'focus-visible:ring-emerald-500'
                )}
              />

              {errors?.cpoDescription && (
                <p className={cn(
                  "text-destructive flex items-center gap-1",
                  isMobile ? "text-xs" : "text-sm"
                )}>
                  <AlertCircle className="h-3 w-3" />
                  {errors.cpoDescription.message}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================
// EVALUATION CRITERIA SLIDER
// ============================================
const EvaluationCriteriaSlider = ({
  control,
  setValue,
  watch,
  error,
  isMobile
}: {
  control: any;
  setValue: any;
  watch: any;
  error?: any;
  isMobile: boolean;
}) => {
  const technicalWeight = watch('evaluationCriteria.technicalWeight') || 70;
  const financialWeight = watch('evaluationCriteria.financialWeight') || 30;

  const handleTechnicalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tech = parseInt(e.target.value);
    setValue('evaluationCriteria.technicalWeight', tech, { shouldValidate: true, shouldDirty: true });
    setValue('evaluationCriteria.financialWeight', 100 - tech, { shouldValidate: true, shouldDirty: true });
  };

  const handleFinancialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fin = parseInt(e.target.value);
    setValue('evaluationCriteria.financialWeight', fin, { shouldValidate: true, shouldDirty: true });
    setValue('evaluationCriteria.technicalWeight', 100 - fin, { shouldValidate: true, shouldDirty: true });
  };

  const total = technicalWeight + financialWeight;

  return (
    <div className={cn(
      "space-y-4 p-3 md:p-5 rounded-xl border",
      "bg-white dark:bg-gray-700",
      colorClasses.border.gray200,
      "dark:border-gray-600"
    )}>
      <div className="flex items-center justify-between">
        <Label className={cn(
          "font-medium",
          colorClasses.text.primary,
          isMobile ? "text-sm" : "text-base"
        )}>
          Evaluation Weight Distribution
        </Label>
        <Badge variant="outline" className={cn(
          total === 100 ? 'text-green-600' : 'text-destructive',
          "dark:text-white dark:border-gray-600",
          isMobile ? "text-xs" : ""
        )}>
          Total: {total}%
        </Badge>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className={cn(
              "font-medium flex items-center gap-2",
              colorClasses.text.primary,
              isMobile ? "text-xs" : "text-sm"
            )}>
              <div className={cn(
                "rounded-full",
                colorClasses.bg.darkNavy,
                isMobile ? "w-2 h-2" : "w-3 h-3"
              )} />
              Technical Score
            </span>
            <span className={cn(
              "font-mono px-2 py-1 rounded",
              "bg-gray-100 dark:bg-gray-600",
              colorClasses.text.primary,
              isMobile ? "text-xs" : "text-sm"
            )}>
              {technicalWeight}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={technicalWeight}
            onChange={handleTechnicalChange}
            className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-darkNavy"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className={cn(
              "font-medium flex items-center gap-2",
              colorClasses.text.primary,
              isMobile ? "text-xs" : "text-sm"
            )}>
              <div className={cn(
                "rounded-full",
                colorClasses.bg.goldenMustard,
                isMobile ? "w-2 h-2" : "w-3 h-3"
              )} />
              Financial Score
            </span>
            <span className={cn(
              "font-mono px-2 py-1 rounded",
              "bg-gray-100 dark:bg-gray-600",
              colorClasses.text.primary,
              isMobile ? "text-xs" : "text-sm"
            )}>
              {financialWeight}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={financialWeight}
            onChange={handleFinancialChange}
            className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-goldenMustard"
          />
        </div>
      </div>

      {total !== 100 && (
        <p className={cn(
          "text-destructive flex items-center gap-1",
          isMobile ? "text-xs" : "text-sm"
        )}>
          <AlertCircle className="h-3 w-3" />
          Weights must total 100% (currently {total}%)
        </p>
      )}
    </div>
  );
};

// ============================================
// DATE INPUT COMPONENT
// ============================================
const DateInput = ({
  id,
  label,
  value,
  onChange,
  error,
  required = false,
  icon,
  isMobile,
  showDaysRemaining = false,
  daysRemaining = null
}: {
  id: string;
  label: string;
  value?: string;
  onChange: (value: string) => void;
  error?: any;
  required?: boolean;
  icon: React.ReactNode;
  isMobile: boolean;
  showDaysRemaining?: boolean;
  daysRemaining?: number | null;
}) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle click outside to close calendar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className={cn(
        "font-medium flex items-center gap-2",
        colorClasses.text.primary,
        isMobile ? "text-sm" : "text-base"
      )}>
        {icon}
        {label} {required && <span className="text-destructive">*</span>}
      </Label>

      <div className={cn(
        "flex gap-3",
        isMobile ? "flex-col" : "flex-col sm:flex-row"
      )}>
        <div className="relative flex-1">
          <input
            ref={inputRef}
            id={id}
            type="datetime-local"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setShowCalendar(true)}
            className={cn(
              "w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 appearance-none",
              "bg-white dark:bg-gray-700",
              colorClasses.text.primary,
              "border-gray-300 dark:border-gray-600",
              error ? 'border-destructive focus:ring-destructive' : 'focus:ring-blue-400',
              isMobile ? "text-sm" : "text-base"
            )}
          />

          {/* Custom calendar styling for mobile */}
          <style jsx>{`
            input[type="datetime-local"]::-webkit-calendar-picker-indicator {
              background: transparent;
              bottom: 0;
              color: transparent;
              cursor: pointer;
              height: auto;
              left: 0;
              position: absolute;
              right: 0;
              top: 0;
              width: auto;
              opacity: 0;
            }
            
            @media (max-width: 640px) {
              input[type="datetime-local"] {
                font-size: 16px; /* Prevents zoom on mobile */
              }
            }
          `}</style>
        </div>

        {showDaysRemaining && daysRemaining !== null && value && (
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg border shrink-0",
            "bg-gray-100 dark:bg-gray-600",
            colorClasses.border.gray200,
            "dark:border-gray-600",
            isMobile ? "justify-center" : ""
          )}>
            <Clock className={cn(
              colorClasses.text.muted,
              isMobile ? "h-3.5 w-3.5" : "h-4 w-4"
            )} />
            <span className={cn(
              "font-medium whitespace-nowrap",
              colorClasses.text.primary,
              isMobile ? "text-xs" : "text-sm"
            )}>
              {daysRemaining} days left
            </span>
          </div>
        )}
      </div>

      {error && (
        <p className={cn(
          "text-destructive flex items-center gap-1",
          isMobile ? "text-xs" : "text-sm"
        )}>
          <AlertCircle className="h-3 w-3" />
          {error.message}
        </p>
      )}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
export const ProfessionalTenderForm: React.FC = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { breakpoint, isTouch, getTouchTargetSize } = useResponsive();
  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet';

  const [currentStep, setCurrentStep] = useState<FormStep>('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // ============ FILE UPLOAD STATE ============
  const [uploadFiles, setUploadFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hooks from useTenders
  const {
    formData,
    isCPORequired,
    toggleCPORequired,
    updateCPODescription,
    resetForm: resetHookForm
  } = useProfessionalTenderForm();

  const createMutation = useCreateProfessionalTender();
  const validation = useTenderValidation();
  const utils = useTenderUtils();
  const constants = useTenderConstants();
  const { categoryOptions, isLoading: categoriesLoading } = useTenderCategories('professional');

  // Form setup with extended schema
  const form = useForm<FormValues>({
    resolver: zodResolver(extendedProfessionalTenderSchema),
    defaultValues: {
      tenderCategory: 'professional',
      status: 'draft',
      workflowType: 'open',
      visibilityType: 'public',
      procurementMethod: 'open_tender',
      minimumExperience: 0,
      legalRegistrationRequired: true,
      evaluationMethod: 'combined',
      evaluationCriteria: {
        technicalWeight: 70,
        financialWeight: 30
      },
      bidValidityPeriod: {
        value: 30,
        unit: 'days'
      },
      cpoRequired: false,
      skillsRequired: [],
      requiredCertifications: [],
      deliverables: [],
      milestones: [],
      maxFileSize: constants.fileUploadConstraints.maxFileSize,
      maxFileCount: 10,
      sealedBidConfirmation: false,
      briefDescription: '',
    },
    mode: 'onChange'
  });

  const {
    watch,
    setValue,
    control,
    formState: { errors }
  } = form;

  // Watch values
  const watchedWorkflowType = watch('workflowType');
  const watchedProcurementMethod = watch('procurementMethod');
  const watchedEvaluationMethod = watch('evaluationMethod');
  const watchedDeadline = watch('deadline');
  const watchedBriefDescription = watch('briefDescription');
  const watchedDescription = watch('description');

  // Field arrays
  const {
    fields: skillFields,
    append: appendSkill,
    remove: removeSkill
  } = useFieldArray<FormValues, 'skillsRequired'>({
    control,
    name: 'skillsRequired'
  });

  const {
    fields: certificationFields,
    append: appendCertification,
    remove: removeCertification
  } = useFieldArray<FormValues, 'requiredCertifications'>({
    control,
    name: 'requiredCertifications'
  });

  const {
    fields: deliverableFields,
    append: appendDeliverable,
    remove: removeDeliverable
  } = useFieldArray<FormValues, 'deliverables'>({
    control,
    name: 'deliverables'
  });

  const {
    fields: milestoneFields,
    append: appendMilestone,
    remove: removeMilestone
  } = useFieldArray<FormValues, 'milestones'>({
    control,
    name: 'milestones'
  });

  // Update form data when hook formData changes
  useEffect(() => {
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== undefined) {
        setValue(key as any, value as any);
      }
    });
  }, [formData, setValue]);

  // Clean up previews on unmount
  useEffect(() => {
    return () => {
      uploadFiles.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [uploadFiles]);

  // Handle sealed bid confirmation
  useEffect(() => {
    if (watchedWorkflowType === 'closed') {
      setValue('sealedBidConfirmation', true, { shouldValidate: true });
    } else {
      setValue('sealedBidConfirmation', false, { shouldValidate: true });
    }
  }, [watchedWorkflowType, setValue]);

  // Generate Tender ID
  const generateTenderId = useCallback(() => {
    const prefix = watchedProcurementMethod === 'direct' ? 'DT' :
      watchedProcurementMethod === 'framework' ? 'FA' : 'PT';
    const currentYear = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const newId = `${prefix}-${currentYear}-${randomNum}`;
    setValue('referenceNumber', newId, { shouldValidate: true, shouldDirty: true });
  }, [watchedProcurementMethod, setValue]);

  // Steps definition
  const steps: Array<{ id: FormStep; label: string; icon: React.ReactNode }> = [
    { id: 'basic', label: isMobile ? 'Basic' : 'Basic Information', icon: <FileText /> },
    { id: 'requirements', label: isMobile ? 'Requirements' : 'Requirements', icon: <Target /> },
    { id: 'evaluation', label: isMobile ? 'Evaluation' : 'Evaluation & CPO', icon: <Scale /> },
    { id: 'workflow', label: isMobile ? 'Workflow' : 'Workflow & Documents', icon: <Settings /> },
    { id: 'review', label: isMobile ? 'Review' : 'Review & Submit', icon: <CheckCircle /> },
  ];

  const stepIndex = steps.findIndex(step => step.id === currentStep);

  // Navigation handlers
  const goToNextStep = () => {
    const currentStepIndex = steps.findIndex(step => step.id === currentStep);
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPrevStep = () => {
    const currentStepIndex = steps.findIndex(step => step.id === currentStep);
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Get owner navigation path
  const getOwnerNavigationPath = useCallback((tenderId: string) => {
    if (!user) return '/dashboard';
    if (user.role === 'organization') {
      return `/dashboard/organization/tenders/${tenderId}`;
    } else if (user.role === 'company') {
      return `/dashboard/company/tenders/my-tenders/${tenderId}`;
    }
    return `/dashboard/tenders/${tenderId}`;
  }, [user]);

  // Step validation
  const validateCurrentStep = (): boolean => {
    const errors = form.formState.errors;
    const values = form.getValues();

    switch (currentStep) {
      case 'basic':
        return !errors.title && !errors.briefDescription && !errors.description &&
          !errors.procurementCategory && !errors.referenceNumber &&
          !errors.procuringEntity && !errors.deadline;
      case 'requirements':
        return !errors.minimumExperience && !errors.legalRegistrationRequired;
      case 'evaluation':
        const evaluationValid = !errors.evaluationCriteria;
        const cpoValid = !isCPORequired || !errors.cpoDescription;
        return evaluationValid && cpoValid;
      case 'workflow':
        return !errors.workflowType && !errors.visibilityType && !errors.procurementMethod;
      default:
        return true;
    }
  };

  // Format days remaining
  const getDaysRemaining = useCallback((deadline: string | undefined) => {
    if (!deadline) return null;
    const diffTime = new Date(deadline).getTime() - Date.now();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }, []);

  // ============ FILE UPLOAD UTILITIES ============
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
      return <ImageIcon className={cn(isMobile ? "h-4 w-4" : "h-5 w-5", "text-blue-500")} />;
    }
    if (file.type === 'application/pdf' || ext === 'pdf') {
      return <FileText className={cn(isMobile ? "h-4 w-4" : "h-5 w-5", "text-red-500")} />;
    }
    if (file.type.includes('word') || ['doc', 'docx'].includes(ext || '')) {
      return <FileText className={cn(isMobile ? "h-4 w-4" : "h-5 w-5", "text-blue-600")} />;
    }
    if (file.type.includes('excel') || file.type.includes('spreadsheet') || ['xls', 'xlsx', 'csv'].includes(ext || '')) {
      return <FileSpreadsheet className={cn(isMobile ? "h-4 w-4" : "h-5 w-5", "text-green-600")} />;
    }
    if (file.type.includes('powerpoint') || file.type.includes('presentation') || ['ppt', 'pptx'].includes(ext || '')) {
      return <Presentation className={cn(isMobile ? "h-4 w-4" : "h-5 w-5", "text-orange-500")} />;
    }
    if (file.type === 'text/plain' || ext === 'txt') {
      return <FileText className={cn(isMobile ? "h-4 w-4" : "h-5 w-5", "text-gray-500")} />;
    }
    if (file.type === 'application/json' || ext === 'json') {
      return <FileJson className={cn(isMobile ? "h-4 w-4" : "h-5 w-5", "text-yellow-500")} />;
    }
    if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'py', 'java', 'c', 'cpp'].includes(ext || '')) {
      return <FileCode className={cn(isMobile ? "h-4 w-4" : "h-5 w-5", "text-purple-500")} />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) {
      return <FileArchive className={cn(isMobile ? "h-4 w-4" : "h-5 w-5", "text-amber-500")} />;
    }
    return <FileIcon className={cn(isMobile ? "h-4 w-4" : "h-5 w-5", "text-gray-500")} />;
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `${file.name} exceeds maximum file size of 50MB`,
      };
    }

    const allowedTypes = [
      'image/*',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'application/zip',
    ];

    const isAllowed = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        const category = type.split('/')[0];
        return file.type.startsWith(category + '/');
      }
      return file.type === type;
    });

    if (!isAllowed) {
      return {
        valid: false,
        error: `${file.name} has unsupported file type.`,
      };
    }

    return { valid: true };
  };

  // ============ FILE HANDLERS ============
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];

    const maxFileCount = 20;
    if (uploadFiles.length + selectedFiles.length > maxFileCount) {
      toast({
        title: 'Too many files',
        description: `Maximum ${maxFileCount} files allowed`,
        variant: 'destructive',
      });
      return;
    }

    const validFiles: UploadedFile[] = [];
    const errors: string[] = [];

    selectedFiles.forEach(file => {
      const validation = validateFile(file);
      if (validation.valid) {
        let preview: string | undefined;
        if (file.type.startsWith('image/')) {
          preview = URL.createObjectURL(file);
        }

        validFiles.push({
          id: `file-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          file,
          description: '',
          documentType: 'other',
          progress: 0,
          uploaded: false,
          preview,
        });
      } else {
        errors.push(validation.error!);
      }
    });

    errors.forEach(error => {
      toast({
        title: 'File Error',
        description: error,
        variant: 'destructive',
      });
    });

    if (validFiles.length > 0) {
      setUploadFiles(prev => [...prev, ...validFiles]);
      simulateUploadProgress(validFiles);
    }

    e.target.value = '';
  };

  const simulateUploadProgress = (newFiles: UploadedFile[]) => {
    setIsUploading(true);

    newFiles.forEach(file => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 25;

        setUploadFiles(prev =>
          prev.map(f =>
            f.id === file.id
              ? { ...f, progress: Math.min(progress, 100) }
              : f
          )
        );

        if (progress >= 100) {
          clearInterval(interval);
          setUploadFiles(prev =>
            prev.map(f =>
              f.id === file.id
                ? { ...f, uploaded: true, progress: 100 }
                : f
            )
          );
        }
      }, 150);
    });

    setTimeout(() => {
      setIsUploading(false);
    }, 1000);
  };

  const removeFile = (id: string) => {
    const file = uploadFiles.find(f => f.id === id);
    if (file?.preview) {
      URL.revokeObjectURL(file.preview);
    }
    setUploadFiles(prev => prev.filter(f => f.id !== id));
  };

  const updateFileDescription = (id: string, description: string) => {
    setUploadFiles(prev =>
      prev.map(f => (f.id === id ? { ...f, description } : f))
    );
  };

  const updateFileType = (id: string, documentType: string) => {
    const validTypes = DOCUMENT_TYPES as readonly string[];
    const validType = validTypes.includes(documentType as any) ? documentType : 'other';
    setUploadFiles(prev =>
      prev.map(f => (f.id === id ? { ...f, documentType: validType } : f))
    );
  };

  const getFilesForSubmission = () => {
    const readyFiles = uploadFiles.filter(f => !f.error);

    return {
      files: readyFiles.map(f => f.file),
      fileDescriptions: readyFiles.map(f => f.description),
      fileTypes: readyFiles.map(f => {
        const validTypes = DOCUMENT_TYPES as readonly string[];
        const type = validTypes.includes(f.documentType as any) ? f.documentType : 'other';
        return type;
      }),
    };
  };

  const clearFiles = () => {
    uploadFiles.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setUploadFiles([]);
  };

  // Handle form submission
  const handleSubmit = async (status: 'draft' | 'published') => {
    setIsSubmitting(true);

    try {
      const formValues = form.getValues();

      const { files: fileList, fileDescriptions, fileTypes } = getFilesForSubmission();

      const tenderData: CreateProfessionalTenderData = {
        tenderCategory: 'professional',
        title: formValues.title || '',
        description: formValues.description || '',
        procurementCategory: formValues.procurementCategory || '',
        deadline: formValues.deadline ? new Date(formValues.deadline).toISOString() : '',
        referenceNumber: formValues.referenceNumber || '',
        procuringEntity: formValues.procuringEntity || '',
        workflowType: formValues.workflowType || 'open',
        status: status,
        visibilityType: formValues.visibilityType || 'public',
        procurementMethod: formValues.procurementMethod,
        fundingSource: formValues.fundingSource,
        skillsRequired: formValues.skillsRequired || [],
        minimumExperience: formValues.minimumExperience || 0,
        requiredCertifications: formValues.requiredCertifications || [],
        legalRegistrationRequired: formValues.legalRegistrationRequired !== false,
        financialCapacity: formValues.financialCapacity,
        pastProjectReferences: formValues.pastProjectReferences,
        projectObjectives: formValues.projectObjectives,
        deliverables: formValues.deliverables || [],
        milestones: formValues.milestones || [],
        timeline: formValues.timeline,
        evaluationMethod: formValues.evaluationMethod,
        evaluationCriteria: formValues.evaluationCriteria || {
          technicalWeight: 70,
          financialWeight: 30
        },
        bidValidityPeriod: formValues.bidValidityPeriod || {
          value: 30,
          unit: 'days'
        },
        clarificationDeadline: formValues.clarificationDeadline,
        preBidMeeting: formValues.preBidMeeting,
        sealedBidConfirmation: formValues.workflowType === 'closed',
        maxFileSize: formValues.maxFileSize || constants.fileUploadConstraints.maxFileSize,
        maxFileCount: formValues.maxFileCount || 10,
        allowedCompanies: formValues.allowedCompanies,
        allowedUsers: formValues.allowedUsers,
        cpoRequired: formValues.cpoRequired || false,
        cpoDescription: formValues.cpoRequired ? (formValues.cpoDescription || '') : undefined,
        fileDescriptions: fileList.length > 0 ? fileDescriptions : undefined,
        fileTypes: fileList.length > 0 ? fileTypes : undefined,
      };

      const result = await createMutation.mutateAsync({
        data: tenderData,
        files: fileList.length > 0 ? fileList : undefined
      });

      clearFiles();

      toast({
        title: status === 'published' ? 'Tender Published!' : 'Draft Saved',
        description: status === 'published'
          ? 'Your professional tender has been published successfully.'
          : 'Tender has been saved as draft.',
        variant: 'default',
        className: `${colorClasses.bg.green} text-white`,
      });

      const redirectPath = getOwnerNavigationPath(result.tender._id);
      router.push(redirectPath);

    } catch (error: any) {
      console.error('❌ Error submitting tender:', error.response?.data || error.message);

      let errorMessage = 'Failed to submit tender';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: 'Submission Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

// ============================================================

const renderStepContent = () => {
  const values = form.getValues();

  // ─── Shared design tokens ───
  const fieldBase = cn(
    "w-full rounded-lg border px-3 py-2 text-sm transition-all duration-150",
    "bg-white dark:bg-[#1C2333]",
    "border-gray-200 dark:border-[#2D3748]",
    colorClasses.text.primary,
    "placeholder:text-gray-400 dark:placeholder:text-gray-500",
    "focus:outline-none focus:ring-2 focus:ring-[#F1BB03]/60 focus:border-[#F1BB03]",
    "disabled:opacity-50 disabled:cursor-not-allowed"
  );

  const cardBase = cn(
    "rounded-xl border shadow-sm overflow-hidden",
    "bg-white dark:bg-[#161B27]",
    "border-gray-100 dark:border-[#2D3748]"
  );

  const sectionHeaderBase = cn(
    "flex items-center gap-2 pb-4 mb-1",
    "border-b border-gray-100 dark:border-[#2D3748]"
  );

  const labelBase = cn(
    "text-xs font-semibold uppercase tracking-widest",
    "text-gray-400 dark:text-gray-500"
  );

  const fieldLabel = cn(
    "text-sm font-medium",
    colorClasses.text.primary
  );

  const helperText = cn(
    "text-xs mt-0.5",
    colorClasses.text.muted
  );

  const errorText = cn(
    "text-xs mt-1 flex items-center gap-1 text-red-500 dark:text-red-400"
  );

  const stepBadge = (step: string) => (
    <span className={cn(
      "ml-auto text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full",
      "bg-[#F1BB03]/10 dark:bg-[#F1BB03]/15",
      "text-[#B45309] dark:text-[#F1BB03]",
      "border border-[#F1BB03]/20"
    )}>
      {step}
    </span>
  );

  // ─── Reusable FieldWrapper ───
  const Field = ({
    label,
    helper,
    error,
    required,
    icon,
    children,
  }: {
    label?: string;
    helper?: string;
    error?: { message?: string };
    required?: boolean;
    icon?: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div className="space-y-1.5">
      {label && (
        <label className={cn(fieldLabel, "flex items-center gap-1.5")}>
          {icon && <span className="text-[#F1BB03]">{icon}</span>}
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {helper && !error && <p className={helperText}>{helper}</p>}
      {error?.message && (
        <p className={errorText}>
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error.message}
        </p>
      )}
    </div>
  );

  // ─── Section wrapper ───
  const Section = ({
    title,
    description,
    icon,
    badge,
    children,
    noPad,
  }: {
    title: string;
    description?: string;
    icon: React.ReactNode;
    badge?: React.ReactNode;
    children: React.ReactNode;
    noPad?: boolean;
  }) => (
    <div className={cn(cardBase, noPad ? "" : "p-6")}>
      <div className={cn(noPad ? "px-6 pt-6 pb-4" : "", sectionHeaderBase)}>
        <span className={cn(
          "flex items-center justify-center w-8 h-8 rounded-lg shrink-0",
          "bg-[#F1BB03]/10 dark:bg-[#F1BB03]/15"
        )}>
          {React.cloneElement(icon as React.ReactElement<any,any>, {
            className: "h-4 w-4 text-[#F1BB03]"
          })}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className={cn("text-base font-semibold leading-tight", colorClasses.text.primary)}>
            {title}
          </h3>
          {description && (
            <p className={cn("text-xs mt-0.5", colorClasses.text.muted)}>{description}</p>
          )}
        </div>
        {badge}
      </div>
      <div className={cn(noPad ? "px-6 pb-6" : "")}>
        {children}
      </div>
    </div>
  );

  // ─── Mini card for nested sub-sections ───
  const SubCard = ({
    title,
    icon,
    action,
    children,
    collapsed,
    onToggle,
  }: {
    title: string;
    icon: React.ReactNode;
    action?: React.ReactNode;
    children: React.ReactNode;
    collapsed?: boolean;
    onToggle?: () => void;
  }) => (
    <div className={cn(
      "rounded-lg border",
      "bg-gray-50/60 dark:bg-[#1C2333]",
      "border-gray-100 dark:border-[#2D3748]",
      "overflow-hidden"
    )}>
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-3",
          "border-b border-gray-100 dark:border-[#2D3748]",
          onToggle ? "cursor-pointer select-none" : ""
        )}
        onClick={onToggle}
      >
        <span className="text-[#F1BB03]">{React.cloneElement(icon as React.ReactElement<any,any>, { className: "h-4 w-4" })}</span>
        <span className={cn("text-sm font-semibold flex-1", colorClasses.text.primary)}>{title}</span>
        {action}
        {onToggle && (
          <span className={colorClasses.text.muted}>
            {collapsed
              ? <ChevronDown className="h-4 w-4" />
              : <ChevronUp className="h-4 w-4" />}
          </span>
        )}
      </div>
      {!collapsed && <div className="p-4">{children}</div>}
    </div>
  );

  // ─── Input with icon overlay ───
  const IconInput = ({
    icon,
    error,
    className,
    ...props
  }: React.InputHTMLAttributes<HTMLInputElement> & {
    icon?: React.ReactNode;
    error?: boolean;
  }) => (
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {icon}
        </span>
      )}
      <input
        className={cn(
          fieldBase,
          icon ? "pl-9" : "",
          error ? "border-red-400 dark:border-red-500 focus:ring-red-400/40 focus:border-red-400" : "",
          isMobile ? "h-10" : "h-11",
          className
        )}
        {...props}
      />
    </div>
  );

  // ─────────────────────────────────────────────────────────
  // STEP RENDERS
  // ─────────────────────────────────────────────────────────

  switch (currentStep) {

    // ════════════════════════════════════════════════════════
    // STEP 1 — BASIC INFORMATION
    // ════════════════════════════════════════════════════════
    case 'basic':
      return (
        <div className="space-y-5">

{/* ── Step 1 Header — Amber/Gold ── */}
<div className={cn(
  "flex items-center gap-3 px-5 py-4 rounded-xl",
  "bg-[#FFFBEB] dark:bg-[#78350F]",
  "border border-[#F59E0B] dark:border-[#D97706]"
)}>
  <span className={cn(
    "flex items-center justify-center w-9 h-9 rounded-lg shrink-0",
    "bg-[#F1BB03] shadow-sm shadow-[#F1BB03]/40"
  )}>
    <FileText className="h-4 w-4 text-[#0A2540]" />
  </span>
  <div className="flex-1">
    <p className="text-[10px] font-bold uppercase tracking-widest text-[#B45309] dark:text-[#FCD34D]">
      Step 1 of 5
    </p>
    <h2 className="text-lg font-bold leading-tight text-[#0A2540] dark:text-[#FEF3C7]">
      Tender Overview
    </h2>
    <p className="text-xs mt-0.5 text-[#D97706] dark:text-[#FCD34D]">
      Define the core details of your tender
    </p>
  </div>
</div>

          {/* ── Identity block ── */}
          <div className={cn(cardBase, "p-6 space-y-5")}>
            <p className={labelBase}>Identification</p>

            {/* Title */}
            <Field
              label="Tender Title"
              required
              icon={<FileText className="h-3.5 w-3.5" />}
              error={errors.title}
              helper="A concise, descriptive title for listings and search results"
            >
              <IconInput
                id="title"
                {...form.register('title')}
                icon={<FileText className="h-3.5 w-3.5" />}
                error={!!errors.title}
                placeholder="e.g., Website Development Project for E-commerce Platform"
              />
            </Field>

            {/* Tender ID + Generate */}
            <Field
              label="Tender ID"
              required
              icon={<Hash className="h-3.5 w-3.5" />}
              error={errors.referenceNumber}
              helper="Unique reference number — auto-generate or enter manually"
            >
              <div className="relative flex items-center gap-2">
                <input
                  id="referenceNumber"
                  {...form.register('referenceNumber')}
                  placeholder="PT-2024-0001"
                  className={cn(
                    fieldBase,
                    "flex-1 font-mono",
                    errors.referenceNumber ? "border-red-400 dark:border-red-500" : "",
                    isMobile ? "h-10" : "h-11"
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateTenderId}
                  className={cn(
                    "shrink-0 h-9 px-3 text-xs font-semibold rounded-lg",
                    "bg-white dark:bg-[#1C2333]",
                    "border-gray-200 dark:border-[#2D3748]",
                    colorClasses.text.primary,
                    "hover:bg-[#F1BB03]/8 hover:border-[#F1BB03]/40",
                    "transition-all duration-150"
                  )}
                >
                  <RefreshCw className="h-3 w-3 mr-1.5" />
                  Generate
                </Button>
              </div>
            </Field>

            {/* Category + Entity grid */}
            <div className={cn("grid gap-4", isMobile ? "grid-cols-1" : "grid-cols-2")}>
              <Field
                label="Procurement Category"
                required
                icon={<Target className="h-3.5 w-3.5" />}
                error={errors.procurementCategory}
              >
                <Select
                  value={values.procurementCategory}
                  onValueChange={(value) => setValue('procurementCategory', value, { shouldValidate: true, shouldDirty: true })}
                >
                  <SelectTrigger className={cn(
                    fieldBase,
                    isMobile ? "h-10" : "h-11",
                    errors.procurementCategory ? "border-red-400 dark:border-red-500" : ""
                  )}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className={cn(
                    "rounded-xl shadow-xl border",
                    "bg-white dark:bg-[#1C2333]",
                    "border-gray-100 dark:border-[#2D3748]",
                    isMobile ? "max-w-[90vw]" : ""
                  )}>
                    {categoryOptions.map(option => {
                      if (option.group === 'header') {
                        return (
                          <div
                            key={option.value}
                            className={cn(
                              "sticky top-0 z-10 px-3 py-2 text-[10px] font-bold uppercase tracking-widest",
                              "bg-gray-50 dark:bg-[#161B27]",
                              colorClasses.text.muted,
                              "border-b border-gray-100 dark:border-[#2D3748]"
                            )}
                          >
                            {option.label}
                          </div>
                        );
                      }
                      return (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className={cn(
                            "text-sm py-2.5 pl-6 cursor-pointer",
                            "hover:bg-[#F1BB03]/8 dark:hover:bg-[#F1BB03]/10",
                            colorClasses.text.primary
                          )}
                        >
                          {option.label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </Field>

              <Field
                label="Procuring Entity"
                required
                icon={<Building className="h-3.5 w-3.5" />}
                error={errors.procuringEntity}
              >
                <IconInput
                  id="procuringEntity"
                  {...form.register('procuringEntity')}
                  icon={<Building className="h-3.5 w-3.5" />}
                  error={!!errors.procuringEntity}
                  placeholder="Your company / organization name"
                />
              </Field>
            </div>

            {/* Deadline */}
            <DateInput
              id="deadline"
              label="Submission Deadline"
              value={watchedDeadline}
              onChange={(value) => setValue('deadline', value, { shouldValidate: true })}
              error={errors.deadline}
              required={true}
              icon={<Calendar className="h-3.5 w-3.5 text-[#F1BB03]" />}
              isMobile={isMobile}
              showDaysRemaining={true}
              daysRemaining={getDaysRemaining(watchedDeadline)}
            />
          </div>

          {/* ── Descriptions block ── */}
          <div className={cn(cardBase, "p-6 space-y-5")}>
            <p className={labelBase}>Content</p>

            {/* Brief description */}
            <div className="space-y-1.5">
              <label className={cn(fieldLabel, "flex items-center gap-1.5")}>
                <span className="text-[#F1BB03]"><FileText className="h-3.5 w-3.5" /></span>
                Brief Description
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <Textarea
                id="briefDescription"
                {...form.register('briefDescription')}
                placeholder="A concise summary for listings and cards (max 500 characters)"
                rows={3}
                className={cn(
                  fieldBase,
                  "resize-none block w-full",
                  errors.briefDescription ? "border-red-400 dark:border-red-500" : ""
                )}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-transparent select-none">_</span>
                <span className={cn(
                  "text-[11px] font-mono tabular-nums",
                  (watchedBriefDescription?.length || 0) > 450
                    ? "text-amber-500" : colorClasses.text.muted
                )}>
                  {watchedBriefDescription?.length || 0}/500
                </span>
              </div>
              {errors.briefDescription?.message && (
                <p className={errorText}>
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {errors.briefDescription.message}
                </p>
              )}
            </div>

            {/* Detailed description */}
            <div className="space-y-1.5">
              <label className={cn(fieldLabel, "flex items-center gap-1.5")}>
                <span className="text-[#F1BB03]"><FileText className="h-3.5 w-3.5" /></span>
                Detailed Description
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <Textarea
                id="description"
                {...form.register('description')}
                placeholder={"Provide comprehensive description including:\n• Project background and objectives\n• Scope of work\n• Technical requirements\n• Expected outcomes\n• Any specific constraints or considerations"}
                rows={isMobile ? 6 : 8}
                className={cn(
                  fieldBase,
                  "resize-y block w-full",
                  errors.description ? "border-red-400 dark:border-red-500" : ""
                )}
              />
              <div className="flex items-center justify-between">
                <p className={helperText}>
                  Minimum 200 characters — cover background, scope, requirements, and constraints
                </p>
                <span className={cn("text-[11px] font-mono tabular-nums shrink-0 ml-3", colorClasses.text.muted)}>
                  {watchedDescription?.length || 0}/20,000
                </span>
              </div>
              {errors.description?.message && (
                <p className={errorText}>
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>

        </div>
      );


    // ════════════════════════════════════════════════════════
    // STEP 2 — REQUIREMENTS
    // ════════════════════════════════════════════════════════
    case 'requirements':
      return (
        <div className="space-y-5">

{/* ── Step 2 Header — Blue ── */}
<div className={cn(
  "flex items-center gap-3 px-5 py-4 rounded-xl",
  "bg-[#DBEAFE] dark:bg-[#1E3A8A]",
  "border border-[#2563EB] dark:border-[#3B82F6]"
)}>
  <span className={cn(
    "flex items-center justify-center w-9 h-9 rounded-lg shrink-0",
    "bg-[#2563EB] shadow-sm shadow-[#2563EB]/40"
  )}>
    <Target className="h-4 w-4 text-white" />
  </span>
  <div className="flex-1">
    <p className="text-[10px] font-bold uppercase tracking-widest text-[#1D4ED8] dark:text-[#93C5FD]">
      Step 2 of 5
    </p>
    <h2 className="text-lg font-bold leading-tight text-[#1E3A8A] dark:text-[#DBEAFE]">
      Bidder Requirements
    </h2>
    <p className="text-xs mt-0.5 text-[#2563EB] dark:text-[#93C5FD]">
      Eligibility criteria and required qualifications
    </p>
  </div>
</div>

          {/* ── Skills ── */}
          <SubCard
            title="Technical Skills & Expertise"
            icon={<Award />}
            collapsed={expandedSections.skills === false}
            onToggle={() => toggleSection('skills')}
          >
            <div className="space-y-3">
              {skillFields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <input
                    {...form.register(`skillsRequired.${index}`)}
                    placeholder="e.g., React.js, Python Django, AWS, Agile Methodology"
                    className={cn(fieldBase, "flex-1", isMobile ? "h-10" : "h-11")}
                  />
                  <button
                    type="button"
                    onClick={() => removeSkill(index)}
                    className={cn(
                      "shrink-0 rounded-lg border flex items-center justify-center transition-all duration-150",
                      "bg-white dark:bg-[#1C2333]",
                      "border-gray-200 dark:border-[#2D3748]",
                      "text-gray-400 hover:text-red-500 hover:border-red-300 dark:hover:border-red-700",
                      isMobile ? "h-10 w-10" : "h-11 w-11",
                      getTouchTargetSize('md')
                    )}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => appendSkill('')}
                className={cn(
                  "w-full rounded-lg border-2 border-dashed py-2.5 text-sm font-medium transition-all duration-150",
                  "border-gray-200 dark:border-[#2D3748]",
                  colorClasses.text.muted,
                  "hover:border-[#F1BB03]/50 hover:text-[#F1BB03]",
                  "flex items-center justify-center gap-1.5",
                  getTouchTargetSize('md')
                )}
              >
                <Plus className="h-4 w-4" />
                Add Skill Requirement
              </button>
            </div>
          </SubCard>

          {/* ── Experience & Certifications grid ── */}
          <div className={cn("grid gap-4", isMobile ? "grid-cols-1" : "grid-cols-2")}>

            {/* Experience */}
            <SubCard
              title="Experience"
              icon={<Briefcase />}
              collapsed={expandedSections.experience === false}
              onToggle={() => toggleSection('experience')}
            >
              <div className="space-y-4">
                <Field
                  label="Minimum Experience (Years)"
                  error={errors.minimumExperience}
                >
                  <div className="relative">
                    <input
                      id="minimumExperience"
                      type="number"
                      min="0"
                      step="0.5"
                      {...form.register('minimumExperience', { valueAsNumber: true })}
                      className={cn(fieldBase, isMobile ? "h-10 pr-14" : "h-11 pr-14")}
                    />
                    <span className={cn("absolute right-3 top-1/2 -translate-y-1/2 text-xs", colorClasses.text.muted)}>
                      years
                    </span>
                  </div>
                </Field>

                <div className="space-y-1.5">
                  <label className={fieldLabel}>Past Project References</label>
                  <div className={cn("grid gap-2", isMobile ? "grid-cols-1" : "grid-cols-2")}>
                    <input
                      type="number"
                      min="0"
                      placeholder="Min count"
                      className={cn(fieldBase, isMobile ? "h-10" : "h-11")}
                      {...form.register('pastProjectReferences.minCount', { valueAsNumber: true })}
                    />
                    <div className={cn(
                      "flex items-center gap-2 px-3 rounded-lg border",
                      "bg-white dark:bg-[#1C2333]",
                      "border-gray-200 dark:border-[#2D3748]",
                      isMobile ? "h-10" : "h-11"
                    )}>
                      <Switch
                        id="similarValueProjects"
                        {...form.register('pastProjectReferences.similarValueProjects')}
                      />
                      <Label htmlFor="similarValueProjects" className={cn("cursor-pointer text-sm", colorClasses.text.primary)}>
                        Similar value
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </SubCard>

            {/* Certifications */}
            <SubCard
              title="Certifications"
              icon={<Shield />}
              collapsed={expandedSections.certifications === false}
              onToggle={() => toggleSection('certifications')}
              action={
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); appendCertification({ name: '', issuingAuthority: '' }); }}
                  className={cn(
                    "text-xs font-semibold px-2.5 py-1 rounded-md transition-all duration-150",
                    "bg-[#F1BB03]/10 text-[#B45309] dark:text-[#F1BB03]",
                    "hover:bg-[#F1BB03]/20",
                    getTouchTargetSize('sm')
                  )}
                >
                  + Add
                </button>
              }
            >
              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                {certificationFields.map((field, index) => (
                  <div key={field.id} className={cn(
                    "p-3 rounded-lg border space-y-2",
                    "bg-white dark:bg-[#161B27]",
                    "border-gray-100 dark:border-[#2D3748]"
                  )}>
                    <input
                      {...form.register(`requiredCertifications.${index}.name`)}
                      placeholder="Certification name (e.g., PMP, ISO 9001)"
                      className={cn(fieldBase, "h-9")}
                    />
                    <input
                      {...form.register(`requiredCertifications.${index}.issuingAuthority`)}
                      placeholder="Issuing authority (e.g., PMI, ISO)"
                      className={cn(fieldBase, "h-9")}
                    />
                    <button
                      type="button"
                      onClick={() => removeCertification(index)}
                      className={cn(
                        "w-full text-xs font-medium py-1.5 rounded-md border transition-all duration-150",
                        "text-red-500 border-red-200 dark:border-red-800/60",
                        "hover:bg-red-50 dark:hover:bg-red-900/20"
                      )}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              {/* Legal registration toggle */}
              <div className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-lg border mt-3",
                "bg-white dark:bg-[#161B27]",
                "border-gray-100 dark:border-[#2D3748]"
              )}>
                <label htmlFor="legalRegistrationRequired" className={cn("cursor-pointer text-sm font-medium", colorClasses.text.primary)}>
                  Legal registration required
                </label>
                <Switch
                  id="legalRegistrationRequired"
                  checked={values.legalRegistrationRequired}
                  onCheckedChange={(checked) => setValue('legalRegistrationRequired', checked, { shouldValidate: true })}
                />
              </div>
            </SubCard>
          </div>

          {/* ── Financial Capacity ── */}
          <SubCard
            title="Financial Capacity"
            icon={<DollarSign />}
            collapsed={expandedSections.financial === false}
            onToggle={() => toggleSection('financial')}
          >
            <div className={cn("grid gap-4", isMobile ? "grid-cols-1" : "grid-cols-2")}>
              <Field label="Minimum Annual Turnover">
                <div className="flex gap-2">
                  <input
                    id="minAnnualTurnover"
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="Amount"
                    {...form.register('financialCapacity.minAnnualTurnover', { valueAsNumber: true })}
                    className={cn(fieldBase, "flex-1", isMobile ? "h-10" : "h-11")}
                  />
                  <Select
                    value={values.financialCapacity?.currency || 'USD'}
                    onValueChange={(value) => setValue('financialCapacity.currency', value, { shouldValidate: true })}
                  >
                    <SelectTrigger className={cn(
                      fieldBase,
                      "w-24 shrink-0",
                      isMobile ? "h-10" : "h-11"
                    )}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={cn(
                      "rounded-xl shadow-xl border",
                      "bg-white dark:bg-[#1C2333]",
                      "border-gray-100 dark:border-[#2D3748]"
                    )}>
                      {constants.currencies.map(currency => (
                        <SelectItem
                          key={currency.value}
                          value={currency.value}
                          className={cn("text-sm cursor-pointer", colorClasses.text.primary)}
                        >
                          {currency.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </Field>
            </div>
          </SubCard>

          {/* ── Project Objectives ── */}
          <SubCard
            title="Project Objectives"
            icon={<Target />}
            collapsed={expandedSections.objectives === false}
            onToggle={() => toggleSection('objectives')}
          >
            <Textarea
              id="projectObjectives"
              {...form.register('projectObjectives')}
              placeholder="Describe the main objectives and expected outcomes of the project..."
              rows={isMobile ? 3 : 4}
              className={cn(fieldBase, "resize-y min-h-[90px]")}
            />
          </SubCard>

        </div>
      );


    // ════════════════════════════════════════════════════════
    // STEP 3 — EVALUATION & CPO
    // ════════════════════════════════════════════════════════
    case 'evaluation':
      return (
        <div className="space-y-5">

{/* ── Step 3 Header — Purple ── */}
<div className={cn(
  "flex items-center gap-3 px-5 py-4 rounded-xl",
  "bg-[#EDE9FE] dark:bg-[#4C1D95]",
  "border border-[#8B5CF6] dark:border-[#A78BFA]"
)}>
  <span className={cn(
    "flex items-center justify-center w-9 h-9 rounded-lg shrink-0",
    "bg-[#8B5CF6] shadow-sm shadow-[#8B5CF6]/40"
  )}>
    <Scale className="h-4 w-4 text-white" />
  </span>
  <div className="flex-1">
    <p className="text-[10px] font-bold uppercase tracking-widest text-[#6D28D9] dark:text-[#C4B5FD]">
      Step 3 of 5
    </p>
    <h2 className="text-lg font-bold leading-tight text-[#4C1D95] dark:text-[#EDE9FE]">
      Evaluation & CPO
    </h2>
    <p className="text-xs mt-0.5 text-[#7C3AED] dark:text-[#C4B5FD]">
      Scoring criteria and financial guarantee requirements
    </p>
  </div>
</div>


          {/* Evaluation method */}
          <SubCard title="Evaluation Methodology" icon={<Trophy />}>
            <div className={cn("grid gap-4 mb-5", isMobile ? "grid-cols-1" : "grid-cols-2")}>
              <Field label="Evaluation Method">
                <Select
                  value={watchedEvaluationMethod || 'combined'}
                  onValueChange={(value: any) => setValue('evaluationMethod', value, { shouldValidate: true, shouldDirty: true })}
                >
                  <SelectTrigger className={cn(fieldBase, isMobile ? "h-10" : "h-11")}>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent className={cn(
                    "rounded-xl shadow-xl border",
                    "bg-white dark:bg-[#1C2333]",
                    "border-gray-100 dark:border-[#2D3748]"
                  )}>
                    {constants.evaluationMethods.map(method => (
                      <SelectItem
                        key={method.value}
                        value={method.value}
                        className={cn("text-sm cursor-pointer py-2.5", colorClasses.text.primary)}
                      >
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Current Distribution">
                <div className={cn(
                  "flex items-center justify-between px-4 rounded-lg border",
                  "bg-gray-50 dark:bg-[#161B27]",
                  "border-gray-100 dark:border-[#2D3748]",
                  isMobile ? "h-10 text-sm" : "h-11"
                )}>
                  <span className={cn("text-sm font-medium", colorClasses.text.primary)}>
                    Technical: <span className="text-[#F1BB03]">{values.evaluationCriteria?.technicalWeight || 70}%</span>
                  </span>
                  <span className={cn("text-xs", colorClasses.text.muted)}>·</span>
                  <span className={cn("text-sm font-medium", colorClasses.text.primary)}>
                    Financial: <span className="text-blue-500">{values.evaluationCriteria?.financialWeight || 30}%</span>
                  </span>
                </div>
              </Field>
            </div>

            <EvaluationCriteriaSlider
              control={control}
              setValue={setValue}
              watch={watch}
              error={errors.evaluationCriteria}
              isMobile={isMobile}
            />
          </SubCard>

          {/* CPO */}
          <CPOToggleSection
            cpoRequired={isCPORequired}
            cpoDescription={values.cpoDescription}
            onToggleCPO={(required) => {
              toggleCPORequired(required);
              setValue('cpoRequired', required, { shouldValidate: true });
            }}
            onUpdateCPODescription={(description) => {
              updateCPODescription(description);
              setValue('cpoDescription', description, { shouldValidate: true });
            }}
            errors={errors}
            isMobile={isMobile}
          />

          {/* Deliverables & Milestones */}
          <div className={cn("grid gap-4", isMobile ? "grid-cols-1" : "grid-cols-2")}>

            {/* Deliverables */}
            <SubCard
              title="Key Deliverables"
              icon={<FileCheck />}
              action={
                <button
                  type="button"
                  onClick={() => appendDeliverable({ title: '', description: '', deadline: '' })}
                  className={cn(
                    "text-xs font-semibold px-2.5 py-1 rounded-md transition-all duration-150",
                    "bg-[#F1BB03]/10 text-[#B45309] dark:text-[#F1BB03]",
                    "hover:bg-[#F1BB03]/20",
                    getTouchTargetSize('sm')
                  )}
                >
                  + Add
                </button>
              }
            >
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {deliverableFields.length === 0 ? (
                  <div className={cn(
                    "text-center py-8 rounded-lg border-2 border-dashed",
                    "border-gray-150 dark:border-[#2D3748]"
                  )}>
                    <FileText className={cn("mx-auto h-7 w-7 mb-2", colorClasses.text.muted, "opacity-40")} />
                    <p className={cn("text-sm", colorClasses.text.muted)}>No deliverables added</p>
                    <button
                      type="button"
                      onClick={() => appendDeliverable({ title: '', description: '', deadline: '' })}
                      className="mt-2 text-xs font-semibold text-[#F1BB03] hover:underline"
                    >
                      Add your first deliverable
                    </button>
                  </div>
                ) : (
                  deliverableFields.map((field, index) => (
                    <div key={field.id} className={cn(
                      "p-3 rounded-lg border space-y-2",
                      "bg-white dark:bg-[#161B27]",
                      "border-gray-100 dark:border-[#2D3748]"
                    )}>
                      <input
                        {...form.register(`deliverables.${index}.title`)}
                        placeholder="Deliverable title"
                        className={cn(fieldBase, "h-9")}
                      />
                      <Textarea
                        {...form.register(`deliverables.${index}.description`)}
                        placeholder="Detailed description"
                        rows={2}
                        className={cn(fieldBase, "resize-none min-h-[56px]")}
                      />
                      <div className="space-y-1">
                        <label className={cn("text-xs font-medium", colorClasses.text.muted)}>Deadline</label>
                        <input
                          type="date"
                          {...form.register(`deliverables.${index}.deadline`)}
                          className={cn(fieldBase, "h-9")}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDeliverable(index)}
                        className="w-full text-xs font-medium py-1.5 rounded-md text-red-500 border border-red-200 dark:border-red-800/60 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </SubCard>

            {/* Milestones */}
            <SubCard
              title="Project Milestones"
              icon={<Clock />}
              action={
                <button
                  type="button"
                  onClick={() => appendMilestone({ title: '', description: '', dueDate: '', paymentPercentage: 0 })}
                  className={cn(
                    "text-xs font-semibold px-2.5 py-1 rounded-md transition-all duration-150",
                    "bg-[#F1BB03]/10 text-[#B45309] dark:text-[#F1BB03]",
                    "hover:bg-[#F1BB03]/20",
                    getTouchTargetSize('sm')
                  )}
                >
                  + Add
                </button>
              }
            >
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {milestoneFields.length === 0 ? (
                  <div className={cn(
                    "text-center py-8 rounded-lg border-2 border-dashed",
                    "border-gray-150 dark:border-[#2D3748]"
                  )}>
                    <Clock className={cn("mx-auto h-7 w-7 mb-2", colorClasses.text.muted, "opacity-40")} />
                    <p className={cn("text-sm", colorClasses.text.muted)}>No milestones added</p>
                    <button
                      type="button"
                      onClick={() => appendMilestone({ title: '', description: '', dueDate: '', paymentPercentage: 0 })}
                      className="mt-2 text-xs font-semibold text-[#F1BB03] hover:underline"
                    >
                      Add your first milestone
                    </button>
                  </div>
                ) : (
                  milestoneFields.map((field, index) => (
                    <div key={field.id} className={cn(
                      "p-3 rounded-lg border space-y-2",
                      "bg-white dark:bg-[#161B27]",
                      "border-gray-100 dark:border-[#2D3748]"
                    )}>
                      <input
                        {...form.register(`milestones.${index}.title`)}
                        placeholder="Milestone title"
                        className={cn(fieldBase, "h-9")}
                      />
                      <div className={cn("grid gap-2", isMobile ? "grid-cols-1" : "grid-cols-2")}>
                        <div className="space-y-1">
                          <label className={cn("text-xs font-medium", colorClasses.text.muted)}>Due Date</label>
                          <input
                            type="date"
                            {...form.register(`milestones.${index}.dueDate`)}
                            className={cn(fieldBase, "h-9")}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className={cn("text-xs font-medium", colorClasses.text.muted)}>Payment %</label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              {...form.register(`milestones.${index}.paymentPercentage`, { valueAsNumber: true })}
                              className={cn(fieldBase, "h-9 pr-7")}
                            />
                            <span className={cn("absolute right-2.5 top-1/2 -translate-y-1/2 text-xs", colorClasses.text.muted)}>%</span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMilestone(index)}
                        className="w-full text-xs font-medium py-1.5 rounded-md text-red-500 border border-red-200 dark:border-red-800/60 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </SubCard>
          </div>

        </div>
      );


    // ════════════════════════════════════════════════════════
    // STEP 4 — WORKFLOW & DOCUMENTS
    // ════════════════════════════════════════════════════════
    case 'workflow':
      return (
        <div className="space-y-5">

{/* ── Step 4 Header — Emerald ── */}
<div className={cn(
  "flex items-center gap-3 px-5 py-4 rounded-xl",
  "bg-[#D1FAE5] dark:bg-[#064E3B]",
  "border border-[#059669] dark:border-[#10B981]"
)}>
  <span className={cn(
    "flex items-center justify-center w-9 h-9 rounded-lg shrink-0",
    "bg-[#059669] shadow-sm shadow-[#059669]/40"
  )}>
    <Settings className="h-4 w-4 text-white" />
  </span>
  <div className="flex-1">
    <p className="text-[10px] font-bold uppercase tracking-widest text-[#047857] dark:text-[#6EE7B7]">
      Step 4 of 5
    </p>
    <h2 className="text-lg font-bold leading-tight text-[#064E3B] dark:text-[#D1FAE5]">
      Workflow & Documents
    </h2>
    <p className="text-xs mt-0.5 text-[#059669] dark:text-[#6EE7B7]">
      Configure visibility, workflow, and attach supporting files
    </p>
  </div>
</div>

          {/* Workflow + Visibility grid */}
          <div className={cn("grid gap-4", isMobile ? "grid-cols-1" : "grid-cols-2")}>

            {/* Workflow type */}
            <SubCard title="Tender Workflow" icon={<Settings />}>
              <div className="space-y-4">
                <Field
                  label="Workflow Type"
                  required
                  error={errors.workflowType}
                >
                  <Select
                    value={watchedWorkflowType || 'open'}
                    onValueChange={(value: 'open' | 'closed') => setValue('workflowType', value, { shouldValidate: true, shouldDirty: true })}
                  >
                    <SelectTrigger className={cn(fieldBase, isMobile ? "h-10" : "h-11")}>
                      <SelectValue placeholder="Select workflow" />
                    </SelectTrigger>
                    <SelectContent className={cn(
                      "rounded-xl shadow-xl border",
                      "bg-white dark:bg-[#1C2333]",
                      "border-gray-100 dark:border-[#2D3748]"
                    )}>
                      {constants.workflowTypes.map(workflow => (
                        <SelectItem key={workflow.value} value={workflow.value} className="py-3">
                          <div>
                            <div className={cn("text-sm font-semibold", colorClasses.text.primary)}>{workflow.label}</div>
                            <div className={cn("text-xs mt-0.5", colorClasses.text.muted)}>{workflow.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                {watchedWorkflowType === 'closed' && (
                  <div className={cn(
                    "flex items-start gap-3 px-4 py-3 rounded-lg border",
                    "bg-blue-50 dark:bg-blue-950/20",
                    "border-blue-200 dark:border-blue-800/50"
                  )}>
                    <Lock className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Sealed Bid Workflow</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                        All bids will be sealed until the tender deadline. Bidders cannot see other submissions.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </SubCard>

            {/* Visibility & procurement */}
            <SubCard title="Visibility & Status" icon={<Globe />}>
              <div className="space-y-4">
                <Field label="Visibility" required error={errors.visibilityType}>
                  <Select
                    value={values.visibilityType || 'public'}
                    onValueChange={(value: any) => setValue('visibilityType', value, { shouldValidate: true, shouldDirty: true })}
                  >
                    <SelectTrigger className={cn(fieldBase, isMobile ? "h-10" : "h-11",
                      errors.visibilityType ? "border-red-400 dark:border-red-500" : "")}>
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent className={cn(
                      "rounded-xl shadow-xl border",
                      "bg-white dark:bg-[#1C2333]",
                      "border-gray-100 dark:border-[#2D3748]"
                    )}>
                      {constants.visibilityTypes
                        .filter(v => v.value !== 'freelancers_only')
                        .map(visibility => (
                          <SelectItem key={visibility.value} value={visibility.value}
                            className={cn("text-sm cursor-pointer py-2.5", colorClasses.text.primary)}>
                            {visibility.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Procurement Method" required error={errors.procurementMethod}>
                  <Select
                    value={watchedProcurementMethod || 'open_tender'}
                    onValueChange={(value: any) => setValue('procurementMethod', value, { shouldValidate: true, shouldDirty: true })}
                  >
                    <SelectTrigger className={cn(fieldBase, isMobile ? "h-10" : "h-11",
                      errors.procurementMethod ? "border-red-400 dark:border-red-500" : "")}>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent className={cn(
                      "rounded-xl shadow-xl border",
                      "bg-white dark:bg-[#1C2333]",
                      "border-gray-100 dark:border-[#2D3748]"
                    )}>
                      {constants.procurementMethods.map(method => (
                        <SelectItem key={method.value} value={method.value}
                          className={cn("text-sm cursor-pointer py-2.5", colorClasses.text.primary)}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </SubCard>
          </div>

          {/* Advanced config */}
          <SubCard
            title="Advanced Configuration"
            icon={<Settings />}
            collapsed={expandedSections.advanced === false}
            onToggle={() => toggleSection('advanced')}
          >
            <div className="space-y-4">
              <div className={cn("grid gap-4", isMobile ? "grid-cols-1" : "grid-cols-2")}>
                <Field label="Funding Source">
                  <input
                    id="fundingSource"
                    {...form.register('fundingSource')}
                    placeholder="e.g., Internal budget, Grant funding, World Bank"
                    className={cn(fieldBase, isMobile ? "h-10" : "h-11")}
                  />
                </Field>

                <Field label="Bid Validity Period">
                  <div className="flex gap-2">
                    <input
                      id="bidValidityPeriod"
                      type="number"
                      min="1"
                      {...form.register('bidValidityPeriod.value', { valueAsNumber: true })}
                      placeholder="30"
                      className={cn(fieldBase, "flex-1", isMobile ? "h-10" : "h-11")}
                    />
                    <Select
                      value={values.bidValidityPeriod?.unit || 'days'}
                      onValueChange={(value) => setValue('bidValidityPeriod.unit', value as any, { shouldValidate: true })}
                    >
                      <SelectTrigger className={cn(fieldBase, "w-28 shrink-0", isMobile ? "h-10" : "h-11")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={cn(
                        "rounded-xl shadow-xl border",
                        "bg-white dark:bg-[#1C2333]",
                        "border-gray-100 dark:border-[#2D3748]"
                      )}>
                        <SelectItem value="days" className={cn("text-sm cursor-pointer", colorClasses.text.primary)}>Days</SelectItem>
                        <SelectItem value="weeks" className={cn("text-sm cursor-pointer", colorClasses.text.primary)}>Weeks</SelectItem>
                        <SelectItem value="months" className={cn("text-sm cursor-pointer", colorClasses.text.primary)}>Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </Field>
              </div>

              <Field label="Clarification Deadline">
                <DateInput
                  id="clarificationDeadline"
                  label=""
                  value={values.clarificationDeadline}
                  onChange={(value) => setValue('clarificationDeadline', value, { shouldValidate: true })}
                  error={errors.clarificationDeadline}
                  icon={<Calendar className="h-3.5 w-3.5 text-[#F1BB03]" />}
                  isMobile={isMobile}
                />
              </Field>
            </div>
          </SubCard>

          {/* ── File Upload ── */}
          <div className={cn(cardBase, "overflow-hidden")}>
            {/* Header */}
            <div className={cn(
              "flex items-center gap-3 px-6 py-4 border-b",
              "border-gray-100 dark:border-[#2D3748]"
            )}>
              <span className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg shrink-0",
                "bg-[#F1BB03]/10 dark:bg-[#F1BB03]/15"
              )}>
                <FileStack className="h-4 w-4 text-[#F1BB03]" />
              </span>
              <div>
                <h3 className={cn("text-sm font-semibold", colorClasses.text.primary)}>Supporting Documents</h3>
                <p className={cn("text-xs", colorClasses.text.muted)}>Upload all necessary tender documents and specifications</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Drop zone */}
              <div
                className={cn(
                  "relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer group",
                  "border-gray-200 dark:border-[#2D3748]",
                  isUploading && "opacity-50 pointer-events-none",
                  "hover:border-[#F1BB03]/60 hover:bg-[#F1BB03]/3 dark:hover:bg-[#F1BB03]/5"
                )}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('border-[#F1BB03]/60', 'bg-[#F1BB03]/3');
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-[#F1BB03]/60', 'bg-[#F1BB03]/3');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-[#F1BB03]/60', 'bg-[#F1BB03]/3');
                  if (!isUploading) {
                    const droppedFiles = Array.from(e.dataTransfer.files);
                    handleFileSelect({ target: { files: droppedFiles } } as any);
                  }
                }}
              >
                <input
                  ref={fileInputRef}
                  id="professional-file-upload"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                  accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,application/zip"
                />

                {isUploading ? (
                  <div className="space-y-2">
                    <Loader2 className={cn("mx-auto animate-spin text-[#F1BB03]", isMobile ? "h-6 w-6" : "h-8 w-8")} />
                    <p className={cn("text-sm font-medium", colorClasses.text.primary)}>Processing files…</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className={cn(
                      "mx-auto w-12 h-12 rounded-xl flex items-center justify-center",
                      "bg-gray-100 dark:bg-[#2D3748]",
                      "group-hover:bg-[#F1BB03]/15 transition-colors duration-200"
                    )}>
                      <Upload className={cn("h-5 w-5", colorClasses.text.muted, "group-hover:text-[#F1BB03] transition-colors")} />
                    </div>
                    <div>
                      <p className={cn("text-sm font-semibold", colorClasses.text.primary)}>
                        Drag & drop or <span className="text-[#F1BB03] underline underline-offset-2 cursor-pointer">browse</span>
                      </p>
                      <p className={cn("text-xs mt-1", colorClasses.text.muted)}>Max 20 files · up to 50 MB each</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {['PDF', 'DOC/DOCX', 'XLS/XLSX', 'PPT/PPTX', 'Images', 'ZIP'].map(fmt => (
                        <span key={fmt} className={cn(
                          "text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full",
                          "bg-gray-100 dark:bg-[#2D3748]",
                          colorClasses.text.muted
                        )}>
                          {fmt}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* File list */}
              {uploadFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={cn("text-sm font-semibold", colorClasses.text.primary)}>
                      {uploadFiles.length} file{uploadFiles.length !== 1 ? 's' : ''}
                    </span>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      "bg-gray-100 dark:bg-[#2D3748]",
                      colorClasses.text.muted
                    )}>
                      {formatFileSize(uploadFiles.reduce((sum, f) => sum + f.file.size, 0))} total
                    </span>
                  </div>

                  <div className={cn(
                    "space-y-2 overflow-y-auto pr-1",
                    isMobile ? "max-h-[320px]" : "max-h-[380px]"
                  )}>
                    {uploadFiles.map((uploadedFile) => (
                      <div
                        key={uploadedFile.id}
                        className={cn(
                          "flex flex-col gap-2 p-3 rounded-lg border transition-all duration-150",
                          "bg-white dark:bg-[#161B27]",
                          "border-gray-100 dark:border-[#2D3748]",
                          uploadedFile.uploaded && "border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/10",
                          uploadedFile.error && "border-red-200 dark:border-red-800/60 bg-red-50/50 dark:bg-red-950/10"
                        )}
                      >
                        {/* Top row: icon + name + actions */}
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Icon */}
                          <div className={cn(
                            "rounded-lg shrink-0 p-2",
                            uploadedFile.uploaded ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-gray-100 dark:bg-[#2D3748]"
                          )}>
                            {uploadedFile.preview ? (
                              <img src={uploadedFile.preview} alt="Preview" className="h-6 w-6 object-cover rounded" />
                            ) : (
                              getFileIcon(uploadedFile.file)
                            )}
                          </div>

                          {/* Name + size */}
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <p className={cn("text-sm font-medium truncate w-full", colorClasses.text.primary)} title={uploadedFile.file.name}>
                              {uploadedFile.file.name}
                            </p>
                            <p className={cn("text-xs", colorClasses.text.muted)}>{formatFileSize(uploadedFile.file.size)}</p>
                          </div>

                          {/* Action buttons — always shrink-0 */}
                          <div className="flex items-center gap-1 shrink-0">
                            {uploadedFile.preview && (
                              <button
                                type="button"
                                onClick={() => window.open(uploadedFile.preview, '_blank')}
                                className={cn(
                                  "rounded-md flex items-center justify-center transition-all duration-150",
                                  "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200",
                                  "hover:bg-gray-100 dark:hover:bg-[#2D3748]",
                                  "h-7 w-7",
                                  getTouchTargetSize('sm')
                                )}
                                title="Preview"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeFile(uploadedFile.id)}
                              className={cn(
                                "rounded-md flex items-center justify-center transition-all duration-150",
                                "text-red-400 hover:text-red-600",
                                "hover:bg-red-50 dark:hover:bg-red-950/30",
                                "h-7 w-7",
                                getTouchTargetSize('sm')
                              )}
                              title="Remove"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Progress */}
                        {uploadedFile.progress !== undefined && uploadedFile.progress < 100 && (
                          <div className="space-y-1">
                            <Progress value={uploadedFile.progress} className="h-1" />
                            <p className={cn("text-xs", colorClasses.text.muted)}>Processing… {uploadedFile.progress}%</p>
                          </div>
                        )}

                        {/* Success badge */}
                        {uploadedFile.uploaded && !uploadedFile.error && (
                          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs">
                            <CheckCircle className="h-3 w-3" />
                            <span>Ready for submission</span>
                          </div>
                        )}

                        {/* Description + type — always stacked, full width */}
                        <input
                          placeholder="File description (optional)"
                          value={uploadedFile.description}
                          onChange={(e) => updateFileDescription(uploadedFile.id, e.target.value)}
                          className={cn(fieldBase, "h-8 text-xs w-full")}
                        />
                        <Select
                          value={uploadedFile.documentType}
                          onValueChange={(value) => updateFileType(uploadedFile.id, value)}
                        >
                          <SelectTrigger className={cn(fieldBase, "h-8 text-xs w-full")}>
                            <SelectValue placeholder="Document type" />
                          </SelectTrigger>
                          <SelectContent className={cn(
                            "rounded-xl shadow-xl border",
                            "bg-white dark:bg-[#1C2333]",
                            "border-gray-100 dark:border-[#2D3748]"
                          )}>
                            {constants.documentTypes.map((type) => (
                              <SelectItem key={type} value={type} className={cn("text-xs cursor-pointer", colorClasses.text.primary)}>
                                {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                              </SelectItem>
                            ))}
                            </SelectContent>
                          </Select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      );


    // ════════════════════════════════════════════════════════
    // STEP 5 — REVIEW & SUBMIT
    // ════════════════════════════════════════════════════════
    case 'review': {
      const formValues = form.getValues();
      const daysRemaining = getDaysRemaining(formValues.deadline);

      const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'Copied!', description: 'Tender ID copied to clipboard', variant: 'default' });
      };

      // ── Review row ──
      const ReviewRow = ({ label, value, icon, full }: {
        label: string;
        value: React.ReactNode;
        icon?: React.ReactNode;
        full?: boolean;
      }) => (
        <div className={cn("space-y-0.5", full ? "col-span-full" : "")}>
          <p className={cn(
            "flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest",
            colorClasses.text.muted
          )}>
            {icon && <span className="opacity-70">{icon}</span>}
            {label}
          </p>
          <div className={cn("text-sm font-medium", colorClasses.text.primary)}>{value || <span className={colorClasses.text.muted}>—</span>}</div>
        </div>
      );

      // ── Review card ──
      const ReviewCard = ({ title, icon, onEdit, cols = 2, children }: {
        title: string;
        icon: React.ReactNode;
        onEdit: () => void;
        cols?: number;
        children: React.ReactNode;
      }) => (
        <div className={cn(cardBase, "overflow-hidden")}>
          <div className={cn(
            "flex items-center gap-3 px-5 py-3.5 border-b",
            "border-gray-100 dark:border-[#2D3748]"
          )}>
            <span className="text-[#F1BB03]">{React.cloneElement(icon as React.ReactElement<any,any>, { className: "h-4 w-4" })}</span>
            <span className={cn("text-sm font-semibold flex-1", colorClasses.text.primary)}>{title}</span>
            <button
              type="button"
              onClick={onEdit}
              className={cn(
                "text-xs font-semibold px-2.5 py-1 rounded-md transition-all duration-150",
                "bg-gray-100 dark:bg-[#2D3748]",
                colorClasses.text.muted,
                "hover:text-[#F1BB03] hover:bg-[#F1BB03]/10",
                getTouchTargetSize('sm')
              )}
            >
              <Edit3 className="h-3 w-3 inline mr-1" />
              Edit
            </button>
          </div>
          <div className={cn(
            "p-5 grid gap-x-6 gap-y-4",
            cols === 2 ? (isMobile ? "grid-cols-1" : "grid-cols-2") : (isMobile ? "grid-cols-2" : "grid-cols-4")
          )}>
            {children}
          </div>
        </div>
      );

      return (
        <div className="space-y-5">

          {/* Step header */}
          <div className={cn(
            "flex items-center gap-3 px-5 py-4 rounded-xl",
            "bg-gradient-to-r from-[#0A2540]/5 via-transparent to-transparent dark:from-white/3",
            "border border-gray-200/60 dark:border-[#2D3748]"
          )}>
            <span className={cn(
              "flex items-center justify-center w-9 h-9 rounded-lg shrink-0",
              "bg-[#0A2540] dark:bg-white shadow-sm"
            )}>
              <CheckCircle className="h-4 w-4 text-white dark:text-[#0A2540]" />
            </span>
            <div className="flex-1">
              <p className={cn("text-[10px] font-bold uppercase tracking-widest", colorClasses.text.muted)}>Step 5 of 5</p>
              <h2 className={cn("text-lg font-bold leading-tight", colorClasses.text.primary)}>Review & Submit</h2>
              <p className={cn("text-xs mt-0.5", colorClasses.text.muted)}>Review all information before publishing your tender</p>
            </div>
          </div>

          {/* Readiness banner */}
          <div className={cn(
            "flex items-start gap-3 px-5 py-4 rounded-xl",
            "bg-emerald-50 dark:bg-emerald-950/20",
            "border border-emerald-200 dark:border-emerald-800/50"
          )}>
            <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Ready to Submit</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                Review carefully — you can go back to edit any section before submitting.
              </p>
            </div>
          </div>

          {/* Basic Info */}
          <ReviewCard
            title="Basic Information"
            icon={<FileText />}
            onEdit={() => setCurrentStep('basic')}
            cols={2}
          >
            <ReviewRow
              label="Tender ID"
              icon={<Hash className="h-3 w-3" />}
              value={
                formValues.referenceNumber ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{formValues.referenceNumber}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(formValues.referenceNumber!)}
                      className={cn("text-gray-400 hover:text-[#F1BB03] transition-colors", getTouchTargetSize('sm'))}
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                ) : null
              }
            />
            <ReviewRow label="Procuring Entity" icon={<Building className="h-3 w-3" />} value={formValues.procuringEntity} />
            <ReviewRow label="Title" icon={<FileText className="h-3 w-3" />} value={
              <span className="line-clamp-2">{formValues.title}</span>
            } />
            <ReviewRow label="Category" value={formValues.procurementCategory} />
            <ReviewRow label="Brief Description" full value={
              <span className={cn("text-sm line-clamp-2", colorClasses.text.secondary)}>{formValues.briefDescription}</span>
            } />
            <ReviewRow label="Full Description" full value={
              <span className={cn("text-sm line-clamp-3", colorClasses.text.secondary)}>{formValues.description}</span>
            } />
            <ReviewRow
              label="Deadline"
              icon={<Calendar className="h-3 w-3" />}
              value={
                formValues.deadline ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span>{format(new Date(formValues.deadline), 'PPP p')}</span>
                    {daysRemaining !== null && (
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-semibold",
                        daysRemaining <= 7
                          ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                          : daysRemaining <= 30
                            ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                            : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                      )}>
                        {daysRemaining}d remaining
                      </span>
                    )}
                  </div>
                ) : null
              }
            />
          </ReviewCard>

          {/* Requirements */}
          <ReviewCard
            title="Bidder Requirements"
            icon={<Target />}
            onEdit={() => setCurrentStep('requirements')}
            cols={2}
          >
            <ReviewRow label="Min. Experience" value={`${formValues.minimumExperience || 0} years`} />
            <ReviewRow label="Legal Registration" value={
              <span className={cn(
                "text-xs font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full",
                formValues.legalRegistrationRequired
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                  : "bg-gray-100 dark:bg-[#2D3748] text-gray-500"
              )}>
                {formValues.legalRegistrationRequired ? 'Required' : 'Not Required'}
              </span>
            } />
            <ReviewRow label="Min. Annual Turnover" value={
              formValues.financialCapacity?.minAnnualTurnover
                ? `${formValues.financialCapacity.minAnnualTurnover.toLocaleString()} ${formValues.financialCapacity.currency}`
                : null
            } />
            <ReviewRow label="Skills Required" full value={
              (formValues.skillsRequired || []).length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-0.5">
                  {(formValues.skillsRequired || []).map((skill, i) => (
                    <span key={i} className={cn(
                      "text-xs px-2.5 py-0.5 rounded-full font-medium",
                      "bg-[#F1BB03]/10 dark:bg-[#F1BB03]/15",
                      "text-[#B45309] dark:text-[#F1BB03]"
                    )}>
                      {skill}
                    </span>
                  ))}
                </div>
              ) : null
            } />
            {(formValues.requiredCertifications || []).length > 0 && (
              <ReviewRow label="Certifications" full value={
                <div className="space-y-1.5 mt-0.5">
                  {(formValues.requiredCertifications || []).map((cert, i) => (
                    <div key={i} className={cn("text-sm", colorClasses.text.secondary)}>
                      <span className="font-medium">{cert.name}</span>
                      {cert.issuingAuthority && (
                        <span className={cn("ml-1.5 text-xs", colorClasses.text.muted)}>({cert.issuingAuthority})</span>
                      )}
                    </div>
                  ))}
                </div>
              } />
            )}
          </ReviewCard>

          {/* Evaluation */}
          <ReviewCard
            title="Evaluation & CPO"
            icon={<Scale />}
            onEdit={() => setCurrentStep('evaluation')}
            cols={2}
          >
            <ReviewRow label="Evaluation Method" value={
              constants.evaluationMethods.find(e => e.value === formValues.evaluationMethod)?.label || 'Combined'
            } />
            <ReviewRow label="Weight Distribution" value={
              <div className="flex items-center gap-3 mt-0.5">
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-[#2D3748] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0A2540] dark:bg-white rounded-full"
                    style={{ width: `${formValues.evaluationCriteria?.technicalWeight || 70}%` }}
                  />
                </div>
                <span className={cn("text-xs font-mono shrink-0", colorClasses.text.muted)}>
                  T:{formValues.evaluationCriteria?.technicalWeight || 70}% · F:{formValues.evaluationCriteria?.financialWeight || 30}%
                </span>
              </div>
            } />
            {isCPORequired && (
              <ReviewRow label="CPO" full value={
                <div className={cn(
                  "flex items-start gap-2 px-3 py-2 rounded-lg border mt-0.5",
                  "bg-emerald-50 dark:bg-emerald-950/20",
                  "border-emerald-200 dark:border-emerald-800/50"
                )}>
                  <Shield className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  <span className={cn("text-xs", colorClasses.text.secondary)}>
                    {formValues.cpoDescription || 'Required'}
                  </span>
                </div>
              } />
            )}
            {formValues.deliverables && formValues.deliverables.length > 0 && (
              <ReviewRow label={`Deliverables (${formValues.deliverables.length})`} full value={
                <div className="space-y-1 mt-0.5">
                  {formValues.deliverables.slice(0, 3).map((del, i) => (
                    <div key={i} className={cn("text-xs flex items-center gap-2", colorClasses.text.secondary)}>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F1BB03] shrink-0" />
                      <span className="font-medium">{del.title}</span>
                      {del.deadline && (
                        <span className={colorClasses.text.muted}>· {format(new Date(del.deadline), 'MMM d, yyyy')}</span>
                      )}
                    </div>
                  ))}
                  {formValues.deliverables.length > 3 && (
                    <p className={cn("text-xs pl-3.5", colorClasses.text.muted)}>+{formValues.deliverables.length - 3} more</p>
                  )}
                </div>
              } />
            )}
          </ReviewCard>

          {/* Workflow */}
          <ReviewCard
            title="Workflow Configuration"
            icon={<Settings />}
            onEdit={() => setCurrentStep('workflow')}
            cols={4}
          >
            <ReviewRow label="Workflow" value={
              <span className={cn(
                "text-xs font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full",
                formValues.workflowType === 'closed'
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                  : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
              )}>
                {constants.workflowTypes.find(w => w.value === formValues.workflowType)?.label || 'Open'}
              </span>
            } />
            <ReviewRow label="Visibility" value={
              constants.visibilityTypes.find(v => v.value === formValues.visibilityType)?.label || 'Public'
            } />
            <ReviewRow label="Procurement" value={
              constants.procurementMethods.find(m => m.value === formValues.procurementMethod)?.label || 'Open Tender'
            } />
            <ReviewRow label="Bid Validity" value={
              formValues.bidValidityPeriod?.value
                ? `${formValues.bidValidityPeriod.value} ${formValues.bidValidityPeriod.unit}`
                : '—'
            } />
          </ReviewCard>

          {/* Documents */}
          <ReviewCard
            title={`Documents (${uploadFiles.length})`}
            icon={<FileStack />}
            onEdit={() => setCurrentStep('workflow')}
            cols={2}
          >
            {uploadFiles.length > 0 ? (
              <div className={cn("col-span-full space-y-2", isMobile ? "max-h-[140px]" : "max-h-[180px]", "overflow-y-auto")}>
                {uploadFiles.map((file, i) => (
                  <div key={i} className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg",
                    "bg-gray-50 dark:bg-[#1C2333]"
                  )}>
                    <FileText className={cn("h-3.5 w-3.5 shrink-0", colorClasses.text.muted)} />
                    <span className={cn("truncate flex-1 text-sm", colorClasses.text.primary)}>{file.file.name}</span>
                    <span className={cn("shrink-0 text-xs", colorClasses.text.muted)}>{formatFileSize(file.file.size)}</span>
                    {file.documentType !== 'other' && (
                      <span className={cn(
                        "shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full",
                        "bg-gray-200 dark:bg-[#2D3748]",
                        colorClasses.text.muted
                      )}>
                        {file.documentType.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={cn("col-span-full text-center py-5", colorClasses.text.muted, "text-sm")}>
                No files attached
              </div>
            )}
          </ReviewCard>

          {/* Submission summary */}
          <div className={cn(
            "grid gap-4 px-5 py-4 rounded-xl border",
            "bg-gray-50 dark:bg-[#1C2333]",
            "border-gray-200 dark:border-[#2D3748]",
            isMobile ? "grid-cols-2" : "grid-cols-4"
          )}>
            {[
              {
                label: 'Status',
                value: (
                  <span className={cn(
                    "text-xs font-bold uppercase tracking-wide",
                    formValues.status === 'published'
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  )}>
                    {formValues.status === 'published' ? '→ Will publish' : '→ Save as draft'}
                  </span>
                )
              },
              { label: 'Files', value: `${uploadFiles.length} attached` },
              { label: 'Total Size', value: formatFileSize(uploadFiles.reduce((acc, f) => acc + f.file.size, 0)) },
              { label: 'CPO', value: isCPORequired ? 'Required' : 'Not required' },
            ].map(({ label, value }) => (
              <div key={label}>
                <span className={cn("block text-[10px] font-bold uppercase tracking-widest mb-1", colorClasses.text.muted)}>
                  {label}
                </span>
                <div className={cn("text-sm font-semibold", colorClasses.text.primary)}>{value}</div>
              </div>
            ))}
          </div>

        </div>
      );
    }

    default:
      return null;
  }
};



  // ============================================
  // MAIN RENDER - Simplified containers
  // ============================================
  // ============================================================
  // formShell.tsx
  // DROP-IN REPLACEMENT for the return(...) block of
  // ProfessionalTenderForm.tsx
  //
  // ✅ ALL logic, handlers, validation preserved
  // ✅ Uses colorClasses + useResponsive
  // ✅ Light & Dark mode
  // ✅ Stripe / Linear aesthetic
  // ============================================================

  return (
    <form onSubmit={form.handleSubmit(() => { })} className="w-full space-y-0">

      {/* ═══════════════════════════════════════════════════════
        STEP PROGRESS RAIL
    ═══════════════════════════════════════════════════════ */}
      <div className={cn(
        "rounded-xl border mb-5 overflow-hidden",
        "bg-white dark:bg-[#161B27]",
        "border-gray-100 dark:border-[#2D3748]",
        "shadow-sm"
      )}>
        {/* Label row */}
        <div className={cn(
          "hidden sm:flex items-stretch",
          "border-b border-gray-100 dark:border-[#2D3748]"
        )}>
          {steps.map((step, i) => {
            const isActive = i === stepIndex;
            const isComplete = i < stepIndex;
            const isLast = i === steps.length - 1;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => isComplete ? setCurrentStep(step.id as FormStep) : undefined}
                disabled={!isComplete && !isActive}
                className={cn(
                  "flex-1 flex items-center gap-2.5 px-4 py-3 transition-all duration-200 text-left",
                  "border-r last:border-r-0 border-gray-100 dark:border-[#2D3748]",
                  isActive
                    ? "bg-[#F1BB03]/6 dark:bg-[#F1BB03]/8 cursor-default"
                    : isComplete
                      ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1C2333]"
                      : "cursor-not-allowed opacity-50"
                )}
              >
                {/* Step number / check */}
                <span className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 transition-all duration-200",
                  isComplete
                    ? "bg-emerald-500 text-white"
                    : isActive
                      ? "bg-[#F1BB03] text-[#0A2540]"
                      : "bg-gray-100 dark:bg-[#2D3748] text-gray-400 dark:text-gray-500"
                )}>
                  {isComplete ? <Check className="h-3 w-3" /> : i + 1}
                </span>

                {/* Label */}
                <span className={cn(
                  "text-xs font-semibold leading-tight transition-colors duration-200",
                  isActive
                    ? "text-[#B45309] dark:text-[#F1BB03]"
                    : isComplete
                      ? colorClasses.text.primary
                      : colorClasses.text.muted
                )}>
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mobile: single step indicator */}
        <div className={cn(
          "flex sm:hidden items-center gap-3 px-4 py-3",
          "border-b border-gray-100 dark:border-[#2D3748]"
        )}>
          <span className={cn(
            "flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0",
            "bg-[#F1BB03] text-[#0A2540]"
          )}>
            {stepIndex + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className={cn("text-xs font-bold", colorClasses.text.primary)}>
              {steps[stepIndex].label}
            </p>
            <p className={cn("text-[10px]", colorClasses.text.muted)}>
              Step {stepIndex + 1} of {steps.length}
            </p>
          </div>
          <span className={cn(
            "text-xs font-bold tabular-nums",
            "text-[#B45309] dark:text-[#F1BB03]"
          )}>
            {Math.round(((stepIndex + 1) / steps.length) * 100)}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100 dark:bg-[#2D3748]">
          <div
            className="h-full bg-[#F1BB03] transition-all duration-500 ease-out rounded-r-full"
            style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>


      {/* ═══════════════════════════════════════════════════════
        STEP CONTENT
    ═══════════════════════════════════════════════════════ */}
      <div className="mb-5">
        {renderStepContent()}
      </div>


      {/* ═══════════════════════════════════════════════════════
        VALIDATION ERRORS
    ═══════════════════════════════════════════════════════ */}
      {Object.keys(form.formState.errors).length > 0 && (
        <div className={cn(
          "flex items-start gap-3 px-4 py-3.5 rounded-xl border mb-5",
          "bg-red-50 dark:bg-red-950/20",
          "border-red-200 dark:border-red-800/50"
        )}>
          <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-700 dark:text-red-300 mb-1.5">
              Please fix the following errors
            </p>
            <ul className={cn(
              "space-y-0.5 overflow-y-auto",
              isMobile ? "max-h-[120px]" : "max-h-40"
            )}>
              {Object.entries(form.formState.errors).map(([field, error]: [string, any]) => (
                <li key={field} className="flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-red-400 dark:bg-red-500 mt-1.5 shrink-0" />
                  <span className="text-xs text-red-600 dark:text-red-400">
                    <span className="font-semibold">{field}:</span>{' '}
                    {error.message || 'Invalid value'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}


      {/* ═══════════════════════════════════════════════════════
        NAVIGATION FOOTER
    ═══════════════════════════════════════════════════════ */}
      <div className={cn(
        "flex items-center gap-3",
        "pt-4 border-t border-gray-100 dark:border-[#2D3748]",
        isMobile ? "flex-col" : "flex-row"
      )}>

        {/* ── Back ── */}
        <Button
          type="button"
          variant="outline"
          onClick={goToPrevStep}
          disabled={stepIndex === 0 || isSubmitting}
          className={cn(
            "flex items-center gap-2 font-semibold rounded-lg transition-all duration-150",
            "bg-white dark:bg-[#1C2333]",
            "border-gray-200 dark:border-[#2D3748]",
            colorClasses.text.primary,
            "hover:bg-gray-50 dark:hover:bg-[#2D3748]",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            isMobile ? "w-full h-11 text-sm justify-center order-2" : "h-11 px-5 text-sm order-1",
            getTouchTargetSize('md')
          )}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Previous
        </Button>

        {/* ── Spacer (desktop) ── */}
        {!isMobile && <div className="flex-1" />}

        {/* ── Forward actions ── */}
        <div className={cn(
          "flex gap-3",
          isMobile ? "w-full flex-col order-1" : "order-2"
        )}>

          {currentStep !== 'review' ? (

            /* Continue */
            <Button
              type="button"
              onClick={goToNextStep}
              disabled={!validateCurrentStep() || isSubmitting}
              className={cn(
                "flex items-center gap-2 font-semibold rounded-lg transition-all duration-150",
                "bg-[#0A2540] dark:bg-white",
                "text-white dark:text-[#0A2540]",
                "hover:bg-[#0A2540]/90 dark:hover:bg-white/90",
                "shadow-sm shadow-[#0A2540]/20 dark:shadow-white/10",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                isMobile ? "w-full h-11 text-sm justify-center" : "h-11 px-7 text-sm",
                getTouchTargetSize('md')
              )}
            >
              Continue
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Button>

          ) : (
            <>
              {/* Save Draft */}
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSubmit('draft')}
                disabled={isSubmitting}
                className={cn(
                  "flex items-center gap-2 font-semibold rounded-lg transition-all duration-150",
                  "bg-white dark:bg-[#1C2333]",
                  "border-gray-200 dark:border-[#2D3748]",
                  colorClasses.text.primary,
                  "hover:bg-gray-50 dark:hover:bg-[#2D3748]",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                  isMobile ? "w-full h-11 text-sm justify-center" : "h-11 px-5 text-sm",
                  getTouchTargetSize('md')
                )}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                ) : (
                  <Save className="h-4 w-4 shrink-0" />
                )}
                Save Draft
              </Button>

              {/* Publish */}
              <Button
                type="button"
                onClick={() => handleSubmit('published')}
                disabled={isSubmitting || !validateCurrentStep()}
                className={cn(
                  "flex items-center gap-2 font-bold rounded-lg transition-all duration-150",
                  "bg-[#F1BB03] hover:bg-[#D97706]",
                  "text-[#0A2540]",
                  "shadow-md shadow-[#F1BB03]/30",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                  isMobile ? "w-full h-11 text-sm justify-center" : "h-11 px-7 text-sm",
                  getTouchTargetSize('md')
                )}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                ) : (
                  <Send className="h-4 w-4 shrink-0" />
                )}
                Publish Tender
              </Button>
            </>
          )}
        </div>
      </div>

    </form>
  );
};

export default ProfessionalTenderForm;

