/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/Card';
import { Button } from '@/components/social/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/Form';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/Accordian';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { CalendarIcon, Upload, X, Plus, Globe, Clock, Briefcase, DollarSign, FileText, Users, Zap, ChevronLeft, ChevronRight, HelpCircle, CheckCircle, AlertCircle, Eye, EyeOff, Lock, Unlock, Star, Target, Timer, MapPin, Mail, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import RichTextEditor from '@/components/ui/RichTextEditor';
import {
  ENGAGEMENT_TYPES,
  EXPERIENCE_LEVELS,
  PROJECT_TYPES,
  CURRENCIES,
  TIME_UNITS,
  FILE_UPLOAD_CONSTRAINTS,
  DOCUMENT_TYPES,
  formatFileSize,
  CreateFreelanceTenderData,
  Tender
} from '@/services/tenderService';
import { useCreateFreelanceTender, useTenderValidation, useTenderUtils, useTenderCategories } from '@/hooks/useTenders';
import { Progress } from '@/components/ui/Progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import { Slider } from '@/components/ui/Slider';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';

// ============ TYPE DEFINITIONS ============
interface Skill {
  id: string;
  name: string;
  isRequired: boolean;
}

interface ScreeningQuestion {
  id: string;
  question: string;
  required: boolean;
}

interface Attachment {
  file: File;
  description: string;
  documentType: string;
}

interface FreelanceTenderFormProps {
  defaultConfig?: {
    workflowType?: 'open' | 'closed';
    status?: 'draft' | 'published';
  };
  onSuccess?: (tender: Tender) => void;
  tenderId?: string;
}

// ============ VALIDATION SCHEMA ============
const freelanceTenderFormSchema = z.object({
  tenderCategory: z.literal('freelance'),
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title cannot exceed 200 characters'),
  description: z.string()
    .min(1, 'Description is required')
    .max(20000, 'Description cannot exceed 20000 characters'),
  procurementCategory: z.string().min(1, 'Category is required'),
  deadlineDate: z.date().refine((date) => date.getTime() > Date.now(), {
    message: 'Deadline must be in the future'
  }),
  shortDescription: z.string()
    .min(1, 'Short description is required')
    .max(200, 'Cannot exceed 200 characters'),
  skills: z.array(z.object({
    id: z.string(),
    name: z.string(),
    isRequired: z.boolean()
  })).min(1, 'At least one skill is required'),
  screeningQuestionsForm: z.array(z.object({
    id: z.string(),
    question: z.string(),
    required: z.boolean()
  })).optional(),
  workflowType: z.enum(['open', 'closed']),
  status: z.enum(['draft', 'published']),
  engagementType: z.enum(['fixed_price', 'hourly']),
  weeklyHours: z.number().min(1, 'Weekly hours must be at least 1').optional(),
  budget: z.object({
    min: z.number().min(0, 'Minimum budget must be 0 or greater'),
    max: z.number().min(0, 'Maximum budget must be 0 or greater'),
    currency: z.enum(['USD', 'EUR', 'GBP', 'ETB'])
  }).optional(),
  projectType: z.enum(['one_time', 'ongoing', 'complex']),
  estimatedDuration: z.object({
    value: z.number().min(1, 'Duration must be at least 1'),
    unit: z.enum(['hours', 'days', 'weeks', 'months'])
  }),
  experienceLevel: z.enum(['entry', 'intermediate', 'expert']),
  portfolioRequired: z.boolean(),
  languagePreference: z.string().optional(),
  timezonePreference: z.string().optional(),
  ndaRequired: z.boolean(),
  urgency: z.enum(['normal', 'urgent']),
  industry: z.string().optional(),
  sealedBidConfirmation: z.boolean(),
  maxFileSize: z.number()
    .min(1024 * 1024, 'Minimum file size is 1MB')
    .max(100 * 1024 * 1024, 'Maximum file size is 100MB'),
  maxFileCount: z.number()
    .min(1, 'Minimum 1 file')
    .max(20, 'Maximum 20 files'),
}).superRefine((data, ctx) => {
  if (data.engagementType === 'hourly' && !data.weeklyHours) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Weekly hours is required for hourly engagements',
      path: ['weeklyHours']
    });
  }
  if (data.engagementType === 'fixed_price' && !data.budget) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Budget is required for fixed price engagements',
      path: ['budget']
    });
  }
  if (data.workflowType === 'closed' && !data.sealedBidConfirmation) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Sealed bid confirmation is required for closed workflow',
      path: ['sealedBidConfirmation']
    });
  }
});

type FreelanceTenderFormValues = z.infer<typeof freelanceTenderFormSchema>;

// ============ COMPONENTS ============

const StepIndicator: React.FC<{ currentStep: number; totalSteps: number }> = ({
  currentStep,
  totalSteps
}) => {
  const steps = [
    { number: 1, label: 'Project Basics', icon: Briefcase },
    { number: 2, label: 'Engagement & Budget', icon: DollarSign },
    { number: 3, label: 'Requirements', icon: Target },
    { number: 4, label: 'Workflow & Settings', icon: Lock },
    { number: 5, label: 'Review & Publish', icon: CheckCircle }
  ];

  return (
    <div className="w-full mb-8">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="px-3 py-1.5 border-gray-200 text-gray-700 bg-white">
              Step {currentStep} of {totalSteps}
            </Badge>
            <span className="text-sm font-medium text-gray-900">
              {steps[currentStep - 1].label}
            </span>
          </div>
          <div className="h-2 w-24 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>
        <Progress value={(currentStep / totalSteps) * 100} className="h-2 bg-gray-100" />
      </div>

      <div className="hidden md:flex items-center justify-between mt-6">
        {steps.map((step) => (
          <div key={step.number} className="flex flex-col items-center">
            <div className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all mb-2",
              currentStep >= step.number
                ? "bg-emerald-500 border-emerald-500 text-white"
                : currentStep === step.number
                  ? "bg-emerald-100 border-emerald-500 text-emerald-700"
                  : "bg-gray-100 border-gray-300 text-gray-400"
            )}>
              <step.icon className="h-5 w-5" />
            </div>
            <span className={cn(
              "text-sm font-medium",
              currentStep >= step.number ? "text-gray-900" : "text-gray-500"
            )}>
              {step.label}
            </span>
            <span className="text-xs text-gray-500 mt-1">Step {step.number}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const SkillInput: React.FC<{
  skills: Skill[];
  onSkillsChange: (skills: Skill[]) => void;
}> = ({ skills, onSkillsChange }) => {
  const [input, setInput] = useState('');
  const [isRequired, setIsRequired] = useState(true);
  const [suggestions] = useState([
    'React', 'TypeScript', 'Node.js', 'UI/UX', 'GraphQL', 'Python',
    'AWS', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL', 'Next.js',
    'Tailwind CSS', 'Figma', 'Adobe XD', 'SEO', 'Content Writing'
  ]);

  const handleAddSkill = () => {
    if (!input.trim()) return;

    const newSkill: Skill = {
      id: Date.now().toString(),
      name: input.trim(),
      isRequired
    };

    onSkillsChange([...skills, newSkill]);
    setInput('');
  };

  const handleRemoveSkill = (id: string) => {
    onSkillsChange(skills.filter(skill => skill.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddSkill();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add required skills (e.g., React, Node.js, UI/UX)"
              className="pr-10 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 bg-white"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-emerald-50 rounded text-emerald-600"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-sm text-gray-500 mr-2">Suggestions:</span>
            {suggestions.map((suggestion) => (
              <Badge
                key={suggestion}
                variant="outline"
                className="cursor-pointer border-gray-200 text-gray-700 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 transition-colors bg-white"
                onClick={() => {
                  setInput(suggestion);
                  setTimeout(() => {
                    const newSkill: Skill = {
                      id: Date.now().toString(),
                      name: suggestion,
                      isRequired
                    };
                    onSkillsChange([...skills, newSkill]);
                  }, 100);
                }}
              >
                {suggestion}
                <Plus className="h-3 w-3 ml-1" />
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg border border-emerald-100 bg-white">
        <div className="flex items-center space-x-2">
          <Switch
            checked={isRequired}
            onCheckedChange={setIsRequired}
            id="skill-required"
            className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-gray-300"
          />
          <Label htmlFor="skill-required" className="text-sm font-medium text-gray-700">
            Required skill
          </Label>
        </div>
        <span className="text-xs text-gray-500">
          Press Enter to add
        </span>
      </div>

      {skills.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-700">
              Skills Required ({skills.length})
            </Label>
            <Badge variant="outline" className="text-xs border-gray-200 text-gray-700">
              {skills.filter(s => s.isRequired).length} required, {skills.filter(s => !s.isRequired).length} optional
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-gray-100 bg-white">
            {skills.map((skill) => (
              <Badge
                key={skill.id}
                variant={skill.isRequired ? "default" : "secondary"}
                className={cn(
                  "px-3 py-1.5 gap-2 group transition-all",
                  skill.isRequired
                    ? "bg-emerald-500 text-white hover:bg-emerald-600"
                    : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                )}
              >
                {skill.name}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs opacity-70">
                        {skill.isRequired ? 'Required' : 'Optional'}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-900 text-white">
                      {skill.isRequired ? 'Required skill' : 'Optional skill'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill.id)}
                  className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ScreeningQuestionInput: React.FC<{
  questions: ScreeningQuestion[];
  onQuestionsChange: (questions: ScreeningQuestion[]) => void;
}> = ({ questions, onQuestionsChange }) => {
  const [question, setQuestion] = useState('');
  const [isRequired, setIsRequired] = useState(true);

  const handleAddQuestion = () => {
    if (!question.trim()) return;

    const newQuestion: ScreeningQuestion = {
      id: Date.now().toString(),
      question: question.trim(),
      required: isRequired
    };

    onQuestionsChange([...questions, newQuestion]);
    setQuestion('');
  };

  const handleRemoveQuestion = (id: string) => {
    onQuestionsChange(questions.filter(q => q.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddQuestion();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What is your experience with similar projects? How would you approach this task?"
            rows={3}
            className="resize-none pr-10 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 bg-white"
          />
          <button
            type="button"
            onClick={handleAddQuestion}
            className="absolute right-2 top-2 p-1 hover:bg-emerald-50 rounded text-emerald-600"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg border border-emerald-100 bg-white">
        <div className="flex items-center space-x-2">
          <Switch
            checked={isRequired}
            onCheckedChange={setIsRequired}
            id="question-required"
            className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-gray-300"
          />
          <Label htmlFor="question-required" className="text-sm font-medium text-gray-700">
            Required answer
          </Label>
        </div>
        <span className="text-xs text-gray-500">
          Helps filter applicants
        </span>
      </div>

      {questions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-700">
              Screening Questions ({questions.length})
            </Label>
            <Badge variant="outline" className="text-xs border-gray-200 text-gray-700">
              {questions.filter(q => q.required).length} required, {questions.filter(q => !q.required).length} optional
            </Badge>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {questions.map((q) => (
              <div key={q.id} className="group flex items-start justify-between p-4 rounded-lg border border-gray-200 hover:border-emerald-200 transition-colors bg-white">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "h-6 w-6 rounded-full flex items-center justify-center text-xs mt-0.5",
                      q.required ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-600"
                    )}>
                      {q.required ? "R" : "O"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{q.question}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {q.required ? 'Required answer' : 'Optional answer'}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(q.id)}
                  className="p-2 hover:bg-red-50 hover:text-red-600 rounded transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const FileUpload: React.FC<{
  files: Attachment[];
  onFilesChange: (files: Attachment[]) => void;
  maxFileSize: number;
  maxFileCount: number;
}> = ({ files, onFilesChange, maxFileSize, maxFileCount }) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (selectedFiles: FileList | File[]) => {
    const fileList = Array.isArray(selectedFiles)
      ? selectedFiles
      : Array.from(selectedFiles);

    if (files.length + fileList.length > maxFileCount) {
      toast({
        title: 'File limit exceeded',
        description: `Maximum ${maxFileCount} files allowed. You can add ${maxFileCount - files.length} more.`,
        variant: 'destructive',
      });
      return;
    }

    const validFiles: Attachment[] = [];
    const errors: string[] = [];

    fileList.forEach((file) => {
      if (file.size > maxFileSize) {
        errors.push(`${file.name} exceeds maximum file size of ${formatFileSize(maxFileSize)}`);
        return;
      }

      const isAllowedType = FILE_UPLOAD_CONSTRAINTS.allowedTypes.some((type) => {
        if (type.endsWith('/*')) {
          const category = type.split('/')[0];
          return file.type.startsWith(category + '/');
        }
        return file.type === type;
      });

      if (!isAllowedType) {
        errors.push(`${file.name} has unsupported file type: ${file.type}`);
        return;
      }

      validFiles.push({
        file,
        description: '',
        documentType: 'other'
      });
    });

    if (errors.length > 0) {
      errors.forEach((error) => {
        toast({
          title: 'File Error',
          description: error,
          variant: 'destructive',
        });
      });
    }

    if (validFiles.length > 0) {
      onFilesChange([...files, ...validFiles]);
      toast({
        title: 'Files added',
        description: `Added ${validFiles.length} file(s)`,
        variant: 'success',
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileChange(e.target.files);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files) {
      handleFileChange(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = [...files];
    const removedFile = newFiles.splice(index, 1)[0];
    onFilesChange(newFiles);

    toast({
      title: 'File removed',
      description: `${removedFile.file.name} has been removed`,
      variant: 'default',
    });
  };

  const handleDescriptionChange = (index: number, description: string) => {
    const newFiles = [...files];
    newFiles[index].description = description;
    onFilesChange(newFiles);
  };

  const handleTypeChange = (index: number, type: string) => {
    const newFiles = [...files];
    newFiles[index].documentType = type;
    onFilesChange(newFiles);
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleInputChange}
        className="hidden"
        accept={FILE_UPLOAD_CONSTRAINTS.allowedTypes.join(',')}
      />

      <div
        className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-emerald-300 transition-colors bg-gray-50 cursor-pointer"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
      >
        <div className="h-16 w-16 mx-auto mb-4 bg-emerald-50 rounded-full flex items-center justify-center">
          <Upload className="h-8 w-8 text-emerald-500" />
        </div>
        <p className="text-lg font-semibold mb-2 text-gray-900">
          Click to upload or drag and drop
        </p>
        <p className="text-sm text-gray-600 mb-4">
          Maximum {maxFileCount} files • Up to {formatFileSize(maxFileSize)} each
        </p>
        <div className="flex flex-wrap justify-center gap-2 text-xs mb-4">
          {['PDF', 'DOC', 'XLS', 'PPT', 'Images', 'ZIP'].map((type) => (
            <Badge key={type} variant="outline" className="px-2 py-1 border-gray-200 text-gray-700 bg-white">
              {type}
            </Badge>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 text-gray-700 bg-white"
          onClick={(e) => {
            e.stopPropagation();
            handleBrowseClick();
          }}
        >
          Browse Files
        </Button>
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-700">
              Attachments ({files.length}/{maxFileCount})
            </Label>
            <Badge variant="outline" className="text-xs border-gray-200 text-gray-700 bg-white">
              Total: {formatFileSize(files.reduce((acc, f) => acc + f.file.size, 0))}
            </Badge>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {files.map((attachment, index) => (
              <div
                key={`${attachment.file.name}-${index}`}
                className="p-4 border border-gray-200 rounded-lg hover:border-emerald-200 transition-colors bg-white"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 bg-emerald-50 rounded flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {attachment.file.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatFileSize(attachment.file.size)} •
                        {attachment.file.type.split('/')[1]?.toUpperCase() || 'File'}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(index)}
                    className="p-2 hover:bg-red-50 hover:text-red-600 text-gray-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label htmlFor={`description-${index}`} className="text-xs mb-2 block text-gray-700">
                      Description
                    </Label>
                    <Input
                      id={`description-${index}`}
                      value={attachment.description}
                      onChange={(e) => handleDescriptionChange(index, e.target.value)}
                      placeholder="Brief description of this file"
                      className="text-sm border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 bg-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`type-${index}`} className="text-xs mb-2 block text-gray-700">
                      Document Type
                    </Label>
                    <Select
                      value={attachment.documentType}
                      onValueChange={(value) => handleTypeChange(index, value)}
                    >
                      <SelectTrigger
                        id={`type-${index}`}
                        className="text-sm border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 bg-white"
                      >
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200 shadow-lg">
                        {DOCUMENT_TYPES.map((type) => (
                          <SelectItem key={type} value={type} className="capitalize hover:bg-gray-50 focus:bg-gray-50">
                            {type.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============ DATE PICKER COMPONENT ============
const DatePicker: React.FC<{
  value: Date;
  onChange: (date: Date) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder = "Pick a date" }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal border-gray-200 hover:border-emerald-500 hover:bg-emerald-50",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
<PopoverContent
  align="start"
  className="
    w-72
    p-4
    rounded-xl
    bg-gradient-to-br from-slate-900 to-indigo-900
    text-white
    shadow-xl
    border border-white/10
  "
>
  <div className="space-y-2">
    <p className="text-sm text-slate-200">Select date</p>

    <Input
      type="date"
      value={value ? format(value, "yyyy-MM-dd") : ""}
      min={new Date().toISOString().split("T")[0]}
      onChange={(e) => {
        if (e.target.value) {
          onChange(new Date(e.target.value));
        }
      }}
      className="
        w-full
        bg-white/10
        border-white/20
        text-white
        focus:ring-2
        focus:ring-indigo-400
      "
    />
  </div>
</PopoverContent>

    </Popover>
  );
};

// ============ MAIN FORM COMPONENT ============

const FreelanceTenderForm: React.FC<FreelanceTenderFormProps> = ({ 
  defaultConfig, 
  onSuccess,
  tenderId 
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [questions, setQuestions] = useState<ScreeningQuestion[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [workflowWarning, setWorkflowWarning] = useState<string | null>(null);

  const { toast } = useToast();
  const { categoryOptions, isLoading: categoriesLoading, error: categoriesError } = useTenderCategories('freelance');
  const createTender = useCreateFreelanceTender();
  const { checkFileUpload } = useTenderUtils();

  const form = useForm<FreelanceTenderFormValues>({
    resolver: zodResolver(freelanceTenderFormSchema) as unknown as Resolver<FreelanceTenderFormValues>,
    defaultValues: {
      tenderCategory: 'freelance',
      title: '',
      procurementCategory: '',
      shortDescription: '',
      description: '',
      languagePreference: 'English',
      workflowType: defaultConfig?.workflowType || 'open',
      status: defaultConfig?.status || 'draft',
      engagementType: 'fixed_price',
      budget: { min: 100, max: 1000, currency: 'USD' },
      weeklyHours: 20,
      projectType: 'one_time',
      estimatedDuration: { value: 30, unit: 'days' },
      experienceLevel: 'intermediate',
      portfolioRequired: false,
      ndaRequired: false,
      urgency: 'normal',
      sealedBidConfirmation: false,
      maxFileSize: FILE_UPLOAD_CONSTRAINTS.maxFileSize,
      maxFileCount: 10,
      deadlineDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      skills: [],
      screeningQuestionsForm: [],
    },
    mode: 'onChange',
  });

  const {
    watch,
    setValue,
    handleSubmit,
    trigger,
    formState: { errors }
  } = form;

  const engagementType = watch('engagementType');
  const workflowType = watch('workflowType');
  const budget = watch('budget');
  const deadlineDate = watch('deadlineDate');
  const sealedBidConfirmation = watch('sealedBidConfirmation');
  const status = watch('status');

  // Update workflow warning when workflowType changes
  useEffect(() => {
    if (workflowType === 'closed') {
      setWorkflowWarning("Once published, this tender cannot be edited. Proposals will be sealed until the deadline.");
    } else {
      setWorkflowWarning(null);
    }
  }, [workflowType]);

  // Update sealedBidConfirmation when workflowType changes
  useEffect(() => {
    if (workflowType === 'closed') {
      setValue('sealedBidConfirmation', false);
    }
  }, [workflowType, setValue]);

  const handleNextStep = async () => {
    setSubmitError(null);

    try {
      // Validate current step fields
      const fieldsToValidate: (keyof FreelanceTenderFormValues)[][] = [
        ['title', 'procurementCategory', 'shortDescription', 'description'],
        ['engagementType', 'projectType', 'budget', 'weeklyHours', 'estimatedDuration'],
        ['skills', 'experienceLevel', 'portfolioRequired', 'ndaRequired'],
        ['workflowType', 'sealedBidConfirmation', 'maxFileSize', 'maxFileCount'],
        ['deadlineDate', 'status']
      ];

      const currentStepFields = fieldsToValidate[currentStep - 1] || [];
      const isValid = await trigger(currentStepFields as any);

      if (!isValid) {
        const firstError = Object.values(errors)[0];
        setSubmitError(firstError?.message || 'Please fill all required fields correctly');
        return;
      }

      // Custom validation for step 2
      if (currentStep === 2) {
        if (engagementType === 'hourly' && !watch('weeklyHours')) {
          setSubmitError('Weekly hours is required for hourly engagements');
          return;
        }
        if (engagementType === 'fixed_price' && (!budget?.min || !budget?.max)) {
          setSubmitError('Budget is required for fixed price engagements');
          return;
        }
      }

      // Custom validation for step 3
      if (currentStep === 3 && skills.length === 0) {
        setSubmitError('At least one skill is required');
        return;
      }

      // Custom validation for step 4
      if (currentStep === 4 && workflowType === 'closed' && !sealedBidConfirmation) {
        setSubmitError('You must confirm sealed bid workflow before proceeding');
        return;
      }

      // Check file uploads for step 4
      if (currentStep === 4 && attachments.length > 0) {
        const files = attachments.map(a => a.file);
        if (!checkFileUpload(files)) {
          return;
        }
      }

      if (currentStep < 5) {
        setCurrentStep(currentStep + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      setSubmitError('Validation failed. Please check your inputs.');
    }
  };

  const handlePrevStep = () => {
    setSubmitError(null);
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const onSubmit = async (data: FreelanceTenderFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Transform skills to the correct format
      const skillsRequired = skills.map(skill => skill.name);
      
      // Transform questions to the correct format
      const screeningQuestions = questions.map(q => ({
        question: q.question,
        required: q.required
      }));

      // Prepare tender data - match the Postman structure
      const tenderData: CreateFreelanceTenderData = {
        tenderCategory: 'freelance',
        title: data.title,
        description: data.description,
        procurementCategory: data.procurementCategory,
        deadline: data.deadlineDate.toISOString(),
        workflowType: data.workflowType,
        status: data.status,
        engagementType: data.engagementType,
        projectType: data.projectType,
        estimatedDuration: data.estimatedDuration,
        experienceLevel: data.experienceLevel,
        portfolioRequired: data.portfolioRequired,
        ndaRequired: data.ndaRequired,
        urgency: data.urgency,
        skillsRequired: skillsRequired,
        maxFileSize: data.maxFileSize,
        maxFileCount: data.maxFileCount,
        sealedBidConfirmation: data.sealedBidConfirmation,
      };

      // Add optional fields
      if (data.languagePreference) {
        tenderData.languagePreference = data.languagePreference;
      }
      
      if (data.timezonePreference) {
        tenderData.timezonePreference = data.timezonePreference;
      }
      
      if (data.industry) {
        tenderData.industry = data.industry;
      }
      
      // Add screening questions
      if (questions.length > 0) {
        tenderData.screeningQuestions = screeningQuestions;
      }

      // Add budget for fixed price engagements
      if (data.engagementType === 'fixed_price' && data.budget) {
        tenderData.budget = data.budget;
      }

      // Add weekly hours for hourly engagements
      if (data.engagementType === 'hourly' && data.weeklyHours) {
        tenderData.weeklyHours = data.weeklyHours;
      }

      // Add short description to the main description
      if (data.shortDescription) {
        tenderData.description = `## Project Overview\n${data.shortDescription}\n\n${tenderData.description}`;
      }

      // Simple validation
      const missingFields = [];
      if (!tenderData.title || tenderData.title.trim() === '') missingFields.push('Title');
      if (!tenderData.description || tenderData.description.trim() === '') missingFields.push('Description');
      if (!tenderData.procurementCategory) missingFields.push('Category');
      if (!tenderData.skillsRequired || tenderData.skillsRequired.length === 0) missingFields.push('Skills');
      
      if (missingFields.length > 0) {
        setSubmitError(`Missing required fields: ${missingFields.join(', ')}`);
        setIsSubmitting(false);
        return;
      }
      
      // Check conditional requirements
      if (tenderData.engagementType === 'hourly' && !tenderData.weeklyHours) {
        setSubmitError('Weekly hours is required for hourly engagements');
        setIsSubmitting(false);
        return;
      }
      
      if (tenderData.engagementType === 'fixed_price' && !tenderData.budget) {
        setSubmitError('Budget is required for fixed price engagements');
        setIsSubmitting(false);
        return;
      }
      
      if (tenderData.workflowType === 'closed' && !tenderData.sealedBidConfirmation) {
        setSubmitError('Sealed bid confirmation is required for closed workflow');
        setIsSubmitting(false);
        return;
      }
      
      // Validate deadline
      const deadlineDate = new Date(tenderData.deadline);
      if (deadlineDate <= new Date()) {
        setSubmitError('Deadline must be in the future');
        setIsSubmitting(false);
        return;
      }

      // Prepare files and file metadata
      const files = attachments.map(a => a.file);
      const fileDescriptions = attachments.map(a => a.description);
      const fileTypes = attachments.map(a => a.documentType);

      // Add file metadata to form data
      if (files.length > 0) {
        tenderData.fileDescriptions = fileDescriptions;
        tenderData.fileTypes = fileTypes;
      }

      console.log('Submitting tender data:', { 
        title: tenderData.title,
        skillsCount: tenderData.skillsRequired?.length,
        hasFiles: files.length > 0,
        tenderId 
      });

      // Call the mutation
      await createTender.mutateAsync({
        data: tenderData,
        files: files.length > 0 ? files : undefined
      }, {
        onSuccess: (result) => {
          toast({
            title: 'Success!',
            description: `Tender ${data.status === 'published' ? 'published' : 'saved as draft'} successfully`,
            variant: 'success',
          });

          // Reset form on success
          form.reset();
          setAttachments([]);
          setSkills([]);
          setQuestions([]);
          setCurrentStep(1);
          setSubmitError(null);

          // Redirect based on user role
          const userRole = localStorage.getItem('userRole') || 'organization';
          const redirectPath = userRole === 'company' 
            ? '/dashboard/company/my-tenders'
            : '/dashboard/organization/tenders';
          
          // Navigate to the correct page
          window.location.href = redirectPath;

          if (onSuccess && result) {
            onSuccess(result.tender);
          }
        },
        onError: (error: any) => {
          console.error('Mutation error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
          });
          const errorMessage = error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            'Failed to create tender';
          setSubmitError(errorMessage);

          toast({
            title: 'Error creating tender',
            description: errorMessage,
            variant: 'destructive',
          });
        }
      });

    } catch (error: any) {
      console.error('Error creating tender:', error);
      const errorMessage = error.response?.data?.message ||
        error.message ||
        'Failed to create tender. Please try again.';
      setSubmitError(errorMessage);

      toast({
        title: 'Error creating tender',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1: Project Basics
  const renderStep1 = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-emerald-50 to-sky-50 rounded-xl p-6 border border-emerald-100">
        <h3 className="text-2xl font-bold flex items-center gap-3 mb-3 text-gray-900">
          <Briefcase className="h-7 w-7 text-emerald-500" />
          Project Basics
        </h3>
        <p className="text-gray-600">
          Start with the basics. A clear title and description help attract the right freelancers.
        </p>
      </div>

      <div className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                Project Title
                <Badge variant="destructive" className="text-xs bg-red-500">Required</Badge>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Website Redesign for E-commerce Store"
                  {...field}
                  className="h-12 text-base border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 bg-white"
                />
              </FormControl>
              <FormDescription className="text-gray-600">
                Be specific and clear about what you need. Good titles get more attention.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="procurementCategory"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                Category
                <Badge variant="destructive" className="text-xs bg-red-500">Required</Badge>
              </FormLabel>
              {categoriesLoading ? (
                <div className="space-y-2">
                  <div className="h-12 bg-gray-100 animate-pulse rounded-lg"></div>
                  <FormDescription>Loading categories...</FormDescription>
                </div>
              ) : categoriesError ? (
                <Alert variant="destructive" className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-600">
                    Failed to load categories. Please try again.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      if (!value.startsWith('group_')) {
                        field.onChange(value);
                      }
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className="h-12 text-base border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 bg-white">
                        <SelectValue placeholder="Select a category">
                          {field.value ? (
                            <span className="text-gray-900">
                              {(() => {
                                const category = categoryOptions.find(opt => opt.value === field.value);
                                return category?.label?.replace(/^\s+/, '') || 'Select a category';
                              })()}
                            </span>
                          ) : (
                            'Select a category'
                          )}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white border-gray-200 shadow-lg max-h-96">
                      {categoryOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          disabled={option.group === 'header'}
                          className={option.group === 'header'
                            ? 'font-semibold text-gray-500 bg-gray-50 cursor-default'
                            : 'pl-4 hover:bg-gray-50 focus:bg-gray-50'
                          }
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-gray-600">
                    Choose the most relevant category for your project
                  </FormDescription>
                </>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="shortDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                Short Description
                <Badge variant="destructive" className="text-xs bg-red-500">Required</Badge>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Brief summary of your project (max 200 characters)"
                  maxLength={200}
                  rows={3}
                  className="resize-none text-base border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 bg-white"
                  {...field}
                />
              </FormControl>
              <div className="flex justify-between items-center">
                <FormDescription className="text-gray-600">
                  This will be displayed in search results and lists
                </FormDescription>
                <span className="text-xs text-gray-500">
                  {field.value?.length || 0}/200
                </span>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="languagePreference"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-gray-700">
                  <Globe className="h-4 w-4 text-sky-500" />
                  Language Preference
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 bg-white">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    {['English', 'Spanish', 'French', 'German', 'Chinese', 'Arabic', 'Portuguese', 'Russian'].map((lang) => (
                      <SelectItem key={lang} value={lang} className="hover:bg-gray-50 focus:bg-gray-50">
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-gray-600">
                  Preferred language for communication
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                Detailed Description
                <Badge variant="destructive" className="text-xs bg-red-500">Required</Badge>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-gray-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs bg-gray-900 text-white">
                      <p>Include: Objectives, Scope, Deliverables, Success Criteria, Timeline, and Specific Requirements</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </FormLabel>
              <FormControl>
                <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white">
                  <RichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Describe your project in detail..."
                    minHeight={400}
                    label=""
                    showToolbar={true}
                    theme="light"
                  />
                </div>
              </FormControl>
              <FormDescription className="text-gray-600">
                Be detailed. Include objectives, scope, deliverables, and any specific requirements.
                The more detailed your description, the better quality proposals you`ll receive.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  // Step 2: Engagement & Budget
  const renderStep2 = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-emerald-50 to-sky-50 rounded-xl p-6 border border-emerald-100">
        <h3 className="text-2xl font-bold flex items-center gap-3 mb-3 text-gray-900">
          <DollarSign className="h-7 w-7 text-emerald-500" />
          Engagement & Budget
        </h3>
        <p className="text-gray-600">
          Define how you want to engage freelancers and set your budget expectations.
        </p>
      </div>

      <div className="space-y-6">
        <FormField
          control={form.control}
          name="engagementType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <DollarSign className="h-5 w-5 text-emerald-500" />
                Engagement Type
                <Badge variant="destructive" className="text-xs bg-red-500">Required</Badge>
              </FormLabel>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="space-y-3"
              >
                {ENGAGEMENT_TYPES.map((type) => (
                  <div key={type.value} className="flex items-center space-x-3">
                    <RadioGroupItem
                      value={type.value}
                      id={`engagement-type-${type.value}`}
                      className="border-gray-300 text-emerald-500"
                    />
                    <Label htmlFor={`engagement-type-${type.value}`} className="flex-1 cursor-pointer">
                      <div className={cn(
                        "p-4 border rounded-lg transition-colors bg-white",
                        field.value === type.value
                          ? "border-emerald-500 bg-emerald-50/20"
                          : "border-gray-200 hover:border-emerald-300"
                      )}>
                        <div className="font-medium text-gray-900">{type.label}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {type.value === 'hourly'
                            ? 'Pay by the hour'
                            : 'Fixed price for the entire project'}
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <FormDescription className="text-gray-600">
                Choose how you want to pay for this project
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {engagementType === 'fixed_price' ? (
          <div className="space-y-4 p-6 rounded-xl border border-emerald-100 bg-white">
            <Label className="text-lg font-semibold flex items-center gap-2 text-gray-900">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              Budget Range
              <Badge variant="destructive" className="text-xs bg-red-500">Required</Badge>
            </Label>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="budget.min"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-gray-700">Minimum</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            $
                          </span>
                          <Input
                            type="number"
                            min="0"
                            step="100"
                            placeholder="Min"
                            value={field.value || ''}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              field.onChange(isNaN(value) ? 0 : value);
                            }}
                            className="pl-8 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 bg-white"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="budget.max"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-gray-700">Maximum</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            $
                          </span>
                          <Input
                            type="number"
                            min="0"
                            step="100"
                            placeholder="Max"
                            value={field.value || ''}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              field.onChange(isNaN(value) ? 0 : value);
                            }}
                            className="pl-8 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 bg-white"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="budget.currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-gray-700">Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white border-gray-200 shadow-lg">
                        {CURRENCIES.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value} className="hover:bg-gray-50 focus:bg-gray-50">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{currency.value}</span>
                              <span className="text-gray-600 text-xs">{currency.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {budget && budget.min > 0 && budget.max > 0 && (
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100 mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {budget.currency} {budget.min?.toLocaleString()} - {budget.max?.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Estimated project cost
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <FormField
            control={form.control}
            name="weeklyHours"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                  <Clock className="h-5 w-5 text-emerald-500" />
                  Weekly Hours
                  <Badge variant="destructive" className="text-xs bg-red-500">Required</Badge>
                </FormLabel>
                <div className="space-y-4">
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="40"
                      placeholder="Estimated hours per week"
                      value={field.value || ''}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        field.onChange(isNaN(value) ? undefined : value);
                      }}
                      className="h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 bg-white"
                    />
                  </FormControl>
                  <div className="px-2">
                    <Slider
                      value={[field.value || 20]}
                      min={1}
                      max={40}
                      step={1}
                      onValueChange={(value) => field.onChange(value[0])}
                      className="py-2"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                      <span>1 hour</span>
                      <span>40 hours (full-time)</span>
                    </div>
                  </div>
                </div>
                <FormDescription className="text-gray-600">
                  Estimated number of hours needed per week
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="projectType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-semibold text-gray-900">Project Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 bg-white">
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    {PROJECT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="py-3 hover:bg-gray-50 focus:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <Briefcase className="h-4 w-4 text-emerald-500" />
                          <div>
                            <div className="font-medium text-gray-900">{type.label}</div>
                            <div className="text-xs text-gray-600">
                              {type.value === 'one_time' ? 'One-time project' :
                               type.value === 'ongoing' ? 'Ongoing work' :
                               'Complex project'}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-gray-600">
                  Select the type of project you`re posting
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="estimatedDuration.value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                    <Timer className="h-5 w-5 text-emerald-500" />
                    Estimated Duration
                  </FormLabel>
                  <div className="flex gap-3">
                    <FormControl className="flex-1">
                      <Input
                        type="number"
                        min="1"
                        placeholder="Duration"
                        value={field.value}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          field.onChange(isNaN(value) ? 0 : value);
                        }}
                        className="h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 bg-white"
                      />
                    </FormControl>
                    <FormField
                      control={form.control}
                      name="estimatedDuration.unit"
                      render={({ field: unitField }) => (
                        <Select onValueChange={unitField.onChange} defaultValue={unitField.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 bg-white">
                              <SelectValue placeholder="Unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white border-gray-200 shadow-lg">
                            {TIME_UNITS.filter(unit =>
                              ['hours', 'days', 'weeks', 'months'].includes(unit.value)
                            ).map((unit) => (
                              <SelectItem key={unit.value} value={unit.value} className="py-3 hover:bg-gray-50 focus:bg-gray-50">
                                {unit.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <FormDescription className="text-gray-600">
                    Estimated project duration
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Step 3: Requirements
  const renderStep3 = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-emerald-50 to-sky-50 rounded-xl p-6 border border-emerald-100">
        <h3 className="text-2xl font-bold flex items-center gap-3 mb-3 text-gray-900">
          <Target className="h-7 w-7 text-emerald-500" />
          Requirements & Qualifications
        </h3>
        <p className="text-gray-600">
          Specify what you`re looking for in a freelancer to get the best matches.
        </p>
      </div>

      <div className="space-y-6">
        <FormField
          control={form.control}
          name="skills"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                <Target className="h-5 w-5 text-emerald-500" />
                Required Skills
                <Badge variant="destructive" className="text-xs bg-red-500">Required</Badge>
              </FormLabel>
              <FormControl>
                <SkillInput skills={skills} onSkillsChange={(newSkills) => {
                  setSkills(newSkills);
                  field.onChange(newSkills);
                }} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="experienceLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-semibold text-gray-900">Experience Level</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 bg-white">
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white border-gray-200 shadow-lg">
                  {EXPERIENCE_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value} className="py-3 hover:bg-gray-50 focus:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-3 w-3 rounded-full",
                          level.value === 'entry' ? "bg-emerald-500" :
                            level.value === 'intermediate' ? "bg-yellow-500" :
                              "bg-red-500"
                        )} />
                        <div>
                          <div className="font-medium text-gray-900">{level.label}</div>
                          <div className="text-xs text-gray-600">
                            {level.value === 'entry' ? '0-2 years experience' :
                              level.value === 'intermediate' ? '2-5 years experience' :
                                '5+ years experience'}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription className="text-gray-600">
                Minimum required experience level
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="portfolioRequired"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-xl border border-gray-200 p-6 hover:border-emerald-300 transition-colors bg-white">
                <div className="space-y-1">
                  <FormLabel className="text-base font-semibold text-gray-900">
                    Portfolio Required
                  </FormLabel>
                  <FormDescription className="text-sm text-gray-600">
                    Ask freelancers to submit their portfolio
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-gray-300"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ndaRequired"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-xl border border-gray-200 p-6 hover:border-emerald-300 transition-colors bg-white">
                <div className="space-y-1">
                  <FormLabel className="text-base font-semibold text-gray-900">
                    NDA Required
                  </FormLabel>
                  <FormDescription className="text-sm text-gray-600">
                    Non-disclosure agreement
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-gray-300"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-gray-700">
                  <Briefcase className="h-4 w-4 text-emerald-500" />
                  Industry (Optional)
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 bg-white">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    {[
                      'Technology',
                      'Healthcare',
                      'Finance',
                      'Education',
                      'E-commerce',
                      'Media & Entertainment',
                      'Real Estate',
                      'Manufacturing',
                      'Other'
                    ].map((industry) => (
                      <SelectItem key={industry} value={industry} className="hover:bg-gray-50 focus:bg-gray-50">
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-gray-600">
                  Your business industry
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="urgency"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">Urgency</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 bg-white">
                      <SelectValue placeholder="Select urgency level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    <SelectItem value="normal" className="hover:bg-gray-50 focus:bg-gray-50">
                      <div className="flex items-center gap-3 py-2">
                        <div className="h-3 w-3 rounded-full bg-emerald-500" />
                        <div>
                          <div className="font-medium text-gray-900">Normal Priority</div>
                          <div className="text-xs text-gray-600">
                            Standard response time
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="urgent" className="hover:bg-gray-50 focus:bg-gray-50">
                      <div className="flex items-center gap-3 py-2">
                        <div className="h-3 w-3 rounded-full bg-yellow-500" />
                        <div>
                          <div className="font-medium text-gray-900">Urgent Priority</div>
                          <div className="text-xs text-gray-600">
                            Fast-track responses
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription className="text-gray-600">
                  How quickly do you need this project completed?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="screeningQuestionsForm"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                <HelpCircle className="h-5 w-5 text-emerald-500" />
                Screening Questions
                <Badge variant="outline" className="text-xs border-emerald-500 text-emerald-500">Recommended</Badge>
              </FormLabel>
              <FormControl>
                <ScreeningQuestionInput questions={questions} onQuestionsChange={(newQuestions) => {
                  setQuestions(newQuestions);
                  field.onChange(newQuestions);
                }} />
              </FormControl>
              <FormDescription className="text-gray-600">
                Add questions to screen applicants. Good questions help identify the best candidates.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  // Step 4: Workflow & Settings
  const renderStep4 = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-emerald-50 to-sky-50 rounded-xl p-6 border border-emerald-100">
        <h3 className="text-2xl font-bold flex items-center gap-3 mb-3 text-gray-900">
          <Lock className="h-7 w-7 text-emerald-500" />
          Workflow & Settings
        </h3>
        <p className="text-gray-600">
          Configure how proposals are submitted and manage attachments.
        </p>
      </div>

      <div className="space-y-6">
        <FormField
          control={form.control}
          name="workflowType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Lock className="h-5 w-5 text-emerald-500" />
                Bidding Workflow
              </FormLabel>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem
                    value="open"
                    id="workflow-open"
                    className="border-gray-300 text-emerald-500"
                  />
                  <Label htmlFor="workflow-open" className="flex-1 cursor-pointer">
                    <div className={cn(
                      "p-4 border rounded-lg transition-colors bg-white",
                      field.value === 'open'
                        ? "border-emerald-500 bg-emerald-50/20"
                        : "border-gray-200 hover:border-emerald-300"
                    )}>
                      <div className="flex items-center gap-3">
                        <Eye className="h-5 w-5 text-emerald-500" />
                        <div>
                          <div className="font-medium text-gray-900">Open Tender</div>
                          <div className="text-sm text-gray-600">
                            Proposals visible immediately
                          </div>
                        </div>
                      </div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem
                    value="closed"
                    id="workflow-closed"
                    className="border-gray-300 text-emerald-500"
                  />
                  <Label htmlFor="workflow-closed" className="flex-1 cursor-pointer">
                    <div className={cn(
                      "p-4 border rounded-lg transition-colors bg-white",
                      field.value === 'closed'
                        ? "border-emerald-500 bg-emerald-50/20"
                        : "border-gray-200 hover:border-emerald-300"
                    )}>
                      <div className="flex items-center gap-3">
                        <Lock className="h-5 w-5 text-emerald-500" />
                        <div>
                          <div className="font-medium text-gray-900">Sealed Bid</div>
                          <div className="text-sm text-gray-600">
                            Proposals sealed until deadline
                          </div>
                        </div>
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
              <FormDescription className="text-gray-600">
                {workflowType === 'open'
                  ? 'Freelancers can see each other\'s proposals'
                  : 'Proposals remain confidential until deadline'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {workflowType === 'closed' && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="sealedBidConfirmation"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-xl border border-gray-200 p-6 hover:border-emerald-300 transition-colors bg-white">
                  <div className="space-y-1">
                    <FormLabel className="text-base font-semibold flex items-center gap-2 text-gray-900">
                      <Lock className="h-4 w-4 text-emerald-500" />
                      Sealed Bid Confirmation
                    </FormLabel>
                    <FormDescription className="text-sm text-gray-600">
                      I understand that proposals will be sealed until the deadline
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-gray-300"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {workflowWarning && (
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-600">
                  {workflowWarning}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="space-y-4">
          <Label className="text-lg font-semibold text-gray-900">File Upload Settings</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="maxFileSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Max File Size</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 bg-white">
                        <SelectValue placeholder="Max file size" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white border-gray-200 shadow-lg">
                      {[10, 25, 50, 100, 200].map((size) => (
                        <SelectItem key={size} value={(size * 1024 * 1024).toString()} className="hover:bg-gray-50 focus:bg-gray-50">
                          {size} MB
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-gray-600">
                    Maximum size for each file
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxFileCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Max Files</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 bg-white">
                        <SelectValue placeholder="Max files" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white border-gray-200 shadow-lg">
                      {[5, 10, 15, 20, 30].map((count) => (
                        <SelectItem key={count} value={count.toString()} className="hover:bg-gray-50 focus:bg-gray-50">
                          {count} files
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-gray-600">
                    Maximum number of files allowed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-lg font-semibold text-gray-900">Attachments (Optional)</Label>
          <FileUpload
            files={attachments}
            onFilesChange={setAttachments}
            maxFileSize={watch('maxFileSize')}
            maxFileCount={watch('maxFileCount')}
          />
          <FormDescription className="text-gray-600">
            Add supporting documents like specifications, designs, or reference materials
          </FormDescription>
        </div>

        <FormField
          control={form.control}
          name="timezonePreference"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-gray-700">
                <Clock className="h-4 w-4 text-emerald-500" />
                Timezone Preference (Optional)
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 bg-white">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white border-gray-200 shadow-lg">
                  {[
                    'Any timezone',
                    'UTC-12 to UTC-5 (Americas)',
                    'UTC-1 to UTC+2 (Europe/Africa)',
                    'UTC+3 to UTC+12 (Asia/Pacific)',
                    'Specific timezone overlap required'
                  ].map((tz) => (
                    <SelectItem key={tz} value={tz} className="hover:bg-gray-50 focus:bg-gray-50">
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription className="text-gray-600">
                Preferred working hours overlap
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  // Step 5: Review & Publish
  const renderStep5 = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-emerald-50 to-sky-50 rounded-xl p-6 border border-emerald-100">
        <h3 className="text-2xl font-bold flex items-center gap-3 mb-3 text-gray-900">
          <CheckCircle className="h-7 w-7 text-emerald-500" />
          Review & Publish
        </h3>
        <p className="text-gray-600">
          Review your tender details, set the deadline, and publish your project.
        </p>
      </div>

      <div className="space-y-6">
        <FormField
          control={form.control}
          name="deadlineDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                <CalendarIcon className="h-5 w-5 text-emerald-500" />
                Deadline
                <Badge variant="destructive" className="text-xs bg-red-500">Required</Badge>
              </FormLabel>
              <DatePicker
                value={field.value}
                onChange={field.onChange}
                placeholder="Pick a deadline date"
              />
              <FormDescription className="text-gray-600">
                Applications will close at 11:59 PM on this date
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4 p-6 rounded-xl border border-emerald-100 bg-white">
          <Label className="text-lg font-semibold text-gray-900">Publication Status</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              type="button"
              variant={status === 'draft' ? 'default' : 'outline'}
              size="lg"
              onClick={() => setValue('status', 'draft')}
              className={cn(
                "h-16 flex-col gap-1",
                status === 'draft'
                  ? "bg-gray-100 text-gray-900 border-gray-200 hover:bg-gray-200"
                  : "border-gray-200 hover:border-emerald-500 hover:bg-emerald-50"
              )}
            >
              <div className="flex items-center gap-2">
                <EyeOff className="h-5 w-5" />
                <span className="font-semibold">Save as Draft</span>
              </div>
              <span className="text-xs opacity-70">Save privately for later</span>
            </Button>
            <Button
              type="button"
              variant={status === 'published' ? 'default' : 'outline'}
              size="lg"
              onClick={() => setValue('status', 'published')}
              className={cn(
                "h-16 flex-col gap-1",
                status === 'published'
                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                  : "border-gray-200 hover:border-emerald-500 hover:bg-emerald-50"
              )}
            >
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                <span className="font-semibold">Publish Now</span>
              </div>
              <span className="text-xs opacity-70">Make visible to freelancers</span>
            </Button>
          </div>
          <p className="text-sm text-center text-gray-600 mt-2">
            {status === 'draft'
              ? 'Your tender will be saved privately and can be published later'
              : 'Your tender will be immediately visible to eligible freelancers'}
          </p>
        </div>

        {/* Summary Preview */}
        <div className="border border-gray-200 rounded-xl p-6 space-y-6 bg-gradient-to-br from-white to-emerald-50/20">
          <h4 className="text-2xl font-bold flex items-center gap-3 text-gray-900">
            <Star className="h-7 w-7 text-emerald-500" />
            Summary Preview
          </h4>
          
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Title</p>
              <p className="font-semibold text-lg text-gray-900 truncate">{watch('title') || 'Not set'}</p>
            </div>
            
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Category</p>
              <p className="font-semibold text-lg text-gray-900 truncate">
                {(() => {
                  const categoryId = watch('procurementCategory');
                  if (!categoryId) return 'Not set';
                  const category = categoryOptions.find(opt => opt.value === categoryId);
                  return category?.label?.replace(/^\s+/, '') || 'Not set';
                })()}
              </p>
            </div>
            
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Engagement</p>
              <p className="font-semibold text-lg text-gray-900">
                {ENGAGEMENT_TYPES.find(t => t.value === engagementType)?.label || 'Not set'}
              </p>
            </div>
            
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Deadline</p>
              <p className="font-semibold text-lg text-gray-900">
                {deadlineDate ? format(deadlineDate, 'MMM dd, yyyy') : 'Not set'}
              </p>
            </div>
            
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Skills</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {skills.slice(0, 5).map(skill => (
                  <Badge key={skill.id} variant={skill.isRequired ? "default" : "secondary"}
                    className={cn(
                      "text-xs",
                      skill.isRequired ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-700 border-gray-200"
                    )}>
                    {skill.name}
                  </Badge>
                ))}
                {skills.length > 5 && (
                  <Badge variant="outline" className="text-xs border-gray-200 text-gray-700">+{skills.length - 5} more</Badge>
                )}
              </div>
            </div>
            
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Attachments</p>
              <p className="font-semibold text-lg text-gray-900">
                {attachments.length} files ({formatFileSize(attachments.reduce((acc, f) => acc + f.file.size, 0))})
              </p>
            </div>
          </div>
          
          {engagementType === 'fixed_price' && budget && budget.min > 0 && budget.max > 0 && (
            <div className="p-6 bg-emerald-50 rounded-lg border border-emerald-100">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600 mb-2">
                  {budget.currency} {budget.min.toLocaleString()} - {budget.max.toLocaleString()}
                </div>
                <p className="text-gray-600">Estimated Project Budget</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <Card className="border border-gray-200 shadow-sm overflow-hidden bg-white">
        <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-sky-50 p-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Create Freelance Tender
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Post a project and find the perfect freelancer for your needs.
                  <span className="text-red-500 ml-1">*</span> indicates required fields.
                </CardDescription>
              </div>
            </div>
            {tenderId && (
              <Badge variant="outline" className="w-fit border-emerald-200 text-emerald-700 bg-emerald-50">
                ID: {tenderId}
              </Badge>
            )}
          </div>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="pt-6 px-6">
              <StepIndicator currentStep={currentStep} totalSteps={5} />

              {submitError && (
                <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              <div className="min-h-[600px]">
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
                {currentStep === 4 && renderStep4()}
                {currentStep === 5 && renderStep5()}
              </div>
            </CardContent>

            <CardFooter className="border-t border-gray-200 bg-gray-50 p-6">
              <div className="flex w-full flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevStep}
                      disabled={currentStep === 1 || isSubmitting || createTender.isPending}
                      className="gap-2 border-gray-300 hover:border-emerald-500 hover:bg-emerald-50 text-gray-700"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>

                    <div className="text-sm text-gray-500 hidden md:block">
                      Step {currentStep} of 5
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {currentStep < 5 ? (
                      <Button
                        type="button"
                        onClick={handleNextStep}
                        size="lg"
                        className="gap-2 px-8 bg-emerald-500 hover:bg-emerald-600 text-white"
                        disabled={isSubmitting || createTender.isPending}
                      >
                        Next Step
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <div className="flex flex-col md:flex-row gap-4">
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          onClick={() => {
                            setValue('status', 'draft');
                            handleSubmit(onSubmit)();
                          }}
                          disabled={isSubmitting || createTender.isPending}
                          className="gap-2 px-8 border-gray-300 hover:border-gray-400 hover:bg-gray-100 text-gray-700"
                        >
                          {isSubmitting && status === 'draft' ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-4 w-4" />
                              Save as Draft
                            </>
                          )}
                        </Button>
                        <Button
                          type="submit"
                          size="lg"
                          onClick={() => {
                            setValue('status', 'published');
                          }}
                          disabled={isSubmitting || createTender.isPending}
                          className="gap-2 px-8 bg-emerald-500 hover:bg-emerald-600 text-white"
                        >
                          {isSubmitting && status === 'published' ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                              Publishing...
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4" />
                              Publish Tender
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((step) => (
                      <button
                        key={step}
                        type="button"
                        onClick={() => setCurrentStep(step)}
                        className={cn(
                          "h-2 w-2 rounded-full transition-all",
                          currentStep === step ? "bg-emerald-500 w-8" : "bg-gray-300 hover:bg-gray-400"
                        )}
                        disabled={isSubmitting || createTender.isPending}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {/* Help Accordion */}
      <Accordion type="single" collapsible className="mt-8">
        <AccordionItem value="help" className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50 text-gray-900">
            <div className="flex items-center gap-3">
              <HelpCircle className="h-5 w-5 text-emerald-500" />
              <span className="text-lg font-semibold">Need help creating your tender?</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 py-4 bg-gray-50">
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-lg flex items-center gap-2 text-gray-900">
                  <FileText className="h-5 w-5 text-emerald-500" />
                  Writing Tips
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 mt-2" />
                    <span className="text-sm text-gray-700">Be specific about deliverables and timeline</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 mt-2" />
                    <span className="text-sm text-gray-700">Include measurable success criteria</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 mt-2" />
                    <span className="text-sm text-gray-700">Mention required skills clearly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 mt-2" />
                    <span className="text-sm text-gray-700">Set realistic deadlines and budgets</span>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-lg flex items-center gap-2 text-gray-900">
                  <DollarSign className="h-5 w-5 text-emerald-500" />
                  Budget Guidance
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 mt-2" />
                    <span className="text-sm text-gray-700">Research market rates for similar projects</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 mt-2" />
                    <span className="text-sm text-gray-700">Consider experience level required</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 mt-2" />
                    <span className="text-sm text-gray-700">Factor in project complexity and scope</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 mt-2" />
                    <span className="text-sm text-gray-700">Include budget for revisions and changes</span>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-lg flex items-center gap-2 text-gray-900">
                  <Star className="h-5 w-5 text-emerald-500" />
                  Best Practices
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 mt-2" />
                    <span className="text-sm text-gray-700">Respond to applicant questions promptly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 mt-2" />
                    <span className="text-sm text-gray-700">Review portfolios and work samples carefully</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 mt-2" />
                    <span className="text-sm text-gray-700">Use screening questions to filter candidates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 mt-2" />
                    <span className="text-sm text-gray-700">Provide clear feedback to all applicants</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <Alert className="mt-6 bg-emerald-50 border-emerald-100">
              <Mail className="h-4 w-4 text-emerald-500" />
              <AlertDescription className="text-sm text-gray-700">
                Need personalized assistance? Contact our support team at
                <a href="mailto:support@bananalink.com" className="text-emerald-600 font-semibold ml-1">
                  support@bananalink.com
                </a>
              </AlertDescription>
            </Alert>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default FreelanceTenderForm;