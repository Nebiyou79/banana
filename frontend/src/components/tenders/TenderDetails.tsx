// components/tender/TenderDetails.tsx
import React, { useState, useMemo } from 'react';
import { 
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Users,
  CheckCircle,
  Lock,
  Eye,
  Download,
  ExternalLink,
  Briefcase,
  Award,
  Target,
  Building,
  Globe,
  Shield,
  FileCheck,
  Zap,
  Package,
  Banknote,
  FileBarChart,
  ShieldCheck,
  AlertTriangle,
  Share2,
  Cpu,
  HardDrive,
  UserCheck,
  CreditCard,
  FileSpreadsheet,
  File as FileIcon,
  Settings,
  XSquare,
  Receipt,
  Scale,
  Wallet,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/social/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/Accordian';
import { 
  Tender,  
  calculateProgress, 
  getEditRestrictionReason,
  TENDER_STATUSES,
  WORKFLOW_TYPES,
  VISIBILITY_TYPES,
  ENGAGEMENT_TYPES,
  EXPERIENCE_LEVELS,
  PROJECT_TYPES,
  PROCUREMENT_METHODS,
  EVALUATION_METHODS,
  formatFileSize,
  isTenderActive,
  canEditTender,
  canViewProposals,
} from '@/services/tenderService';
import { useRevealProposals, usePublishTender } from '@/hooks/useTenders';
import { cn } from '@/lib/utils';
import { TenderAttachmentList } from './TenderAttachmentList';

interface TenderDetailsProps {
  tender: Tender;
  userRole: 'freelancer' | 'company' | 'organization' | 'admin' | 'owner' | 'guest';
  userId?: string;
  onApply?: () => void;
  onEdit?: () => void;
  onShare?: () => void;
  onViewProposals?: () => void;
}

export const TenderDetails: React.FC<TenderDetailsProps> = ({
  tender,
  userRole,
  userId,
  onApply,
  onEdit,
  onShare,
  onViewProposals
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const { mutate: revealProposals } = useRevealProposals();
  const { mutate: publishTender } = usePublishTender();
  
  const isOwner = userRole === 'owner' || userRole === 'admin' || 
    (userId && tender.owner._id === userId);
  const canApply = (userRole === 'freelancer' && tender.tenderCategory === 'freelance') ||
                   (userRole === 'company' && tender.tenderCategory === 'professional');
  const isActive = isTenderActive(tender);
  const canViewAllProposals = canViewProposals(tender);
  const editRestrictionReason = getEditRestrictionReason(tender);
  const canEdit = canEditTender(tender, userId || '');
  
  // Calculate deadline information
  const deadlineInfo = useMemo(() => {
    const deadline = new Date(tender.deadline);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    
    if (diffMs <= 0) {
      return {
        text: 'Deadline passed',
        color: 'text-red-600 dark:text-red-400',
        urgency: 'expired',
        days: 0,
        hours: 0
      };
    }
    
    if (diffDays === 0 && diffHours <= 24) {
      return {
        text: `Ends in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`,
        color: 'text-amber-600 dark:text-amber-400',
        urgency: 'urgent',
        days: 0,
        hours: diffHours
      };
    }
    
    if (diffDays <= 7) {
      return {
        text: `Ends in ${diffDays} day${diffDays !== 1 ? 's' : ''}`,
        color: 'text-amber-600 dark:text-amber-400',
        urgency: 'soon',
        days: diffDays,
        hours: diffHours
      };
    }
    
    return {
      text: `Ends ${deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      color: 'text-slate-600 dark:text-slate-400',
      urgency: 'normal',
      days: diffDays,
      hours: diffHours
    };
  }, [tender.deadline]);
  
  const progress = calculateProgress(tender);
  
  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Format duration
  const formatDuration = (value: number, unit: string) => {
    return `${value} ${unit}${value !== 1 ? 's' : ''}`;
  };
  
  // Handle reveal proposals
  const handleRevealProposals = () => {
    if (window.confirm('Are you sure you want to reveal all proposals? This action cannot be undone.')) {
      revealProposals(tender._id);
    }
  };
  
  // Handle publish tender
  const handlePublishTender = () => {
    if (window.confirm('Are you sure you want to publish this tender? It will become visible to eligible users.')) {
      publishTender(tender._id);
    }
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    const statusItem = TENDER_STATUSES.find(s => s.value === status);
    return statusItem?.color || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };
  
  // Get workflow type label
  const getWorkflowLabel = (workflowType: string) => {
    const workflow = WORKFLOW_TYPES.find(w => w.value === workflowType);
    return workflow?.label || workflowType;
  };
  
  // Get visibility type label
  const getVisibilityLabel = (visibilityType: string) => {
    const visibility = VISIBILITY_TYPES.find(v => v.value === visibilityType);
    return visibility?.label || visibilityType;
  };
  
  // Get procurement method label
  const getProcurementMethodLabel = (method?: string) => {
    if (!method) return 'Not specified';
    const procurement = PROCUREMENT_METHODS.find(p => p.value === method);
    return procurement?.label || method.replace('_', ' ');
  };
  
  // Get evaluation method label
  const getEvaluationMethodLabel = (method?: string) => {
    if (!method) return 'Not specified';
    const evaluation = EVALUATION_METHODS.find(e => e.value === method);
    return evaluation?.label || method.replace('_', ' ');
  };
  
  // Get experience level label
  const getExperienceLevelLabel = (level?: string) => {
    if (!level) return 'Not specified';
    const experience = EXPERIENCE_LEVELS.find(e => e.value === level);
    return experience?.label || level;
  };
  
  // Get engagement type label
  const getEngagementTypeLabel = (type?: string) => {
    if (!type) return 'Not specified';
    const engagement = ENGAGEMENT_TYPES.find(e => e.value === type);
    return engagement?.label || type.replace('_', ' ');
  };
  
  // Get project type label
  const getProjectTypeLabel = (type?: string) => {
    if (!type) return 'Not specified';
    const project = PROJECT_TYPES.find(p => p.value === type);
    return project?.label || type.replace('_', ' ');
  };
  
  // Render action bar
  const renderActionBar = () => (
    <Card className="mb-6 border-slate-200 dark:border-slate-800 shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          {/* Left Section */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Workflow Badge with Tooltip */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 cursor-help",
                      tender.workflowType === 'open' 
                        ? "border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20"
                        : "border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20"
                    )}
                  >
                    {tender.workflowType === 'open' ? (
                      <>
                        <Globe className="w-3.5 h-3.5" />
                        Open Tender
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        Sealed Bid
                      </>
                    )}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p className="font-medium mb-1">
                    {getWorkflowLabel(tender.workflowType)}
                  </p>
                  <p className="text-sm">
                    {tender.workflowType === 'open' 
                      ? 'Proposals are visible immediately upon submission. This encourages transparent competition among applicants.'
                      : 'Proposals are encrypted and sealed until the deadline. No one can view proposals until they are officially revealed.'
                    }
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Tender Type Badge */}
            <Badge 
              variant="outline" 
              className={cn(
                "px-3 py-1.5",
                tender.tenderCategory === 'freelance'
                  ? "border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300"
                  : "border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"
              )}
            >
              {tender.tenderCategory === 'freelance' ? 'Freelance' : 'Professional'}
            </Badge>
            
            {/* Status Badge */}
            <Badge className={getStatusColor(tender.status)}>
              {TENDER_STATUSES.find(s => s.value === tender.status)?.label || tender.status}
            </Badge>
            
            {/* Deadline Countdown */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className={cn("text-sm font-medium", deadlineInfo.color)}>
                {deadlineInfo.text}
              </span>
              
              {deadlineInfo.urgency === 'urgent' && (
                <Badge variant="destructive" className="animate-pulse">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Urgent
                </Badge>
              )}
            </div>
            
            {/* Progress Bar */}
            {isActive && (
              <div className="hidden lg:flex items-center gap-3">
                <div className="w-32">
                  <Progress 
                    value={progress} 
                    className="h-2 bg-slate-200 dark:bg-slate-800"
                  />
                </div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {progress}% complete
                </span>
              </div>
            )}
          </div>
          
          {/* Right Section - Actions */}
          <div className="flex flex-wrap gap-2">
            {/* Owner Actions */}
            {isOwner && (
              <>
                {/* Publish Button (for draft tenders) */}
                {tender.status === 'draft' && (
                  <Button 
                    size="sm" 
                    onClick={handlePublishTender}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Publish
                  </Button>
                )}
                
                {/* Update Button */}
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onEdit}
                    disabled={!!editRestrictionReason}
                    title={editRestrictionReason || "Edit tender details"}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
                
                {/* Reveal Proposals Button (for closed workflow) */}
                {tender.workflowType === 'closed' && 
                 tender.status === 'deadline_reached' && 
                 !tender.revealedAt && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleRevealProposals}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Reveal Proposals
                  </Button>
                )}
              </>
            )}
            
            {/* Apply Button (for eligible users) */}
            {canApply && isActive && (
              <Button size="sm" onClick={onApply} className="bg-blue-600 hover:bg-blue-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                Apply Now
              </Button>
            )}
            
            {/* Share Button */}
            <Button variant="outline" size="sm" onClick={onShare}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Share
            </Button>
            
            {/* View Proposals Button (if accessible) */}
            {canViewAllProposals && tender.metadata.visibleApplications > 0 && (
              <Button variant="outline" size="sm" onClick={onViewProposals}>
                <Users className="w-4 h-4 mr-2" />
                View Proposals ({tender.metadata.visibleApplications})
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
  
  // Render overview tab
  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Budget Card */}
        {tender.tenderCategory === 'freelance' && tender.freelanceSpecific?.budget && (
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Budget Range</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(tender.freelanceSpecific.budget.min, tender.freelanceSpecific.budget.currency)} - 
                    {formatCurrency(tender.freelanceSpecific.budget.max, tender.freelanceSpecific.budget.currency)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
       
        {/* Experience Level Card */}
        {tender.tenderCategory === 'freelance' && tender.freelanceSpecific?.experienceLevel && (
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                  <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Experience Level</p>
                  <p className="text-lg font-semibold capitalize">
                    {getExperienceLevelLabel(tender.freelanceSpecific.experienceLevel)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Procurement Method Card */}
        {tender.tenderCategory === 'professional' && tender.professionalSpecific?.procurementMethod && (
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                  <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Procurement Method</p>
                  <p className="text-lg font-semibold">
                    {getProcurementMethodLabel(tender.professionalSpecific.procurementMethod)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Key Information Card */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Tender Information
          </CardTitle>
          <CardDescription>
            Key details about this tender
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Basic Information */}
            <div className="space-y-3">
              <h4 className="font-medium text-slate-700 dark:text-slate-300">Basic Details</h4>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-slate-500 dark:text-slate-400">Tender ID</dt>
                  <dd className="font-medium">{tender.tenderId || tender._id.substring(0, 12)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500 dark:text-slate-400">Reference Number</dt>
                  <dd className="font-medium">
                    {tender.professionalSpecific?.referenceNumber || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500 dark:text-slate-400">Category</dt>
                  <dd className="font-medium">{tender.procurementCategory}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500 dark:text-slate-400">Created</dt>
                  <dd className="font-medium">
                    {new Date(tender.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </dd>
                </div>
              </dl>
            </div>
            
            {/* Workflow & Visibility */}
            <div className="space-y-3">
              <h4 className="font-medium text-slate-700 dark:text-slate-300">Workflow & Access</h4>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-slate-500 dark:text-slate-400">Workflow Type</dt>
                  <dd className="font-medium">{getWorkflowLabel(tender.workflowType)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500 dark:text-slate-400">Visibility</dt>
                  <dd className="font-medium">{getVisibilityLabel(tender.visibility.visibilityType)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500 dark:text-slate-400">Proposals</dt>
                  <dd className="font-medium">
                    {tender.metadata.totalApplications || 0} submitted
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500 dark:text-slate-400">Views</dt>
                  <dd className="font-medium">{tender.metadata.views || 0}</dd>
                </div>
              </dl>
            </div>
            
            {/* Financial Information */}
            <div className="space-y-3">
              <h4 className="font-medium text-slate-700 dark:text-slate-300">Financial Details</h4>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-slate-500 dark:text-slate-400">Currency</dt>
                  <dd className="font-medium">
                    {tender.freelanceSpecific?.budget?.currency || 
                     tender.professionalSpecific?.financialCapacity?.currency || 
                     'Not specified'}
                  </dd>
                </div>
                {tender.professionalSpecific?.financialCapacity && (
                  <div>
                    <dt className="text-sm text-slate-500 dark:text-slate-400">Min. Annual Turnover</dt>
                    <dd className="font-medium">
                      {formatCurrency(
                        tender.professionalSpecific.financialCapacity.minAnnualTurnover,
                        tender.professionalSpecific.financialCapacity.currency
                      )}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-slate-500 dark:text-slate-400">Evaluation Method</dt>
                  <dd className="font-medium">
                    {getEvaluationMethodLabel(tender.professionalSpecific?.evaluationMethod)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Description Card */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Project Description
          </CardTitle>
          <CardDescription>
            Overview of the project requirements and objectives
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-slate dark:prose-invert max-w-none">
            {tender.description.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-4 last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Skills & Requirements Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills Required */}
        {tender.skillsRequired && tender.skillsRequired.length > 0 && (
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Required Skills
              </CardTitle>
              <CardDescription>
                Technical skills and competencies needed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tender.skillsRequired.map((skill, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary"
                    className="px-3 py-1.5 text-sm"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Owner Information */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Procuring Entity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <Building className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <h4 className="font-semibold">{tender.ownerEntity.name}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {tender.professionalSpecific?.procuringEntity || tender.ownerEntity.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                {tender.ownerEntity.industry && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-slate-500" />
                    <span>{tender.ownerEntity.industry}</span>
                  </div>
                )}
                {tender.ownerEntity.verified && (
                  <Badge variant="outline" className="border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
  
  // Render details tab with ALL data
  const renderDetailsTab = () => (
    <div className="space-y-6">
      <Accordion type="multiple" defaultValue={["description", "technical", "skills", "compliance"]} className="space-y-4">
        {/* Full Description */}
        <AccordionItem value="description" className="border-slate-200 dark:border-slate-800">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-lg font-semibold">Full Description & Objectives</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <div className="space-y-6">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <h4 className="text-lg font-semibold mb-3">Complete Description</h4>
                {tender.description.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-3 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
              
              {/* Project Objectives */}
              {(tender.professionalSpecific?.projectObjectives || 
                tender.freelanceSpecific?.projectType) && (
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-700 dark:text-slate-300">Project Objectives</h4>
                  <div className="space-y-3">
                    {tender.professionalSpecific?.projectObjectives ? (
                      <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                        <p className="text-slate-600 dark:text-slate-400">
                          {tender.professionalSpecific.projectObjectives}
                        </p>
                      </div>
                    ) : tender.freelanceSpecific?.projectType && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="px-3 py-1.5">
                          {getProjectTypeLabel(tender.freelanceSpecific.projectType)}
                        </Badge>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          Project Type
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Technical Requirements */}
        <AccordionItem value="technical" className="border-slate-200 dark:border-slate-800">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3">
              <Cpu className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="text-lg font-semibold">Technical Requirements</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <div className="space-y-6">
              {/* Engagement Details */}
              {tender.tenderCategory === 'freelance' && tender.freelanceSpecific && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium text-slate-700 dark:text-slate-300">Engagement Type</h4>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "capitalize px-3 py-1.5",
                          tender.freelanceSpecific.engagementType === 'fixed_price'
                            ? "border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                            : "border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                        )}
                      >
                        {getEngagementTypeLabel(tender.freelanceSpecific.engagementType)}
                      </Badge>
                      {tender.freelanceSpecific.engagementType === 'hourly' && tender.freelanceSpecific.weeklyHours && (
                        <Badge variant="secondary" className="ml-2">
                          {tender.freelanceSpecific.weeklyHours} hours/week
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {tender.freelanceSpecific.budget && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-slate-700 dark:text-slate-300">Budget Details</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-500 dark:text-slate-400">Minimum</span>
                          <span className="font-medium">
                            {formatCurrency(tender.freelanceSpecific.budget.min, tender.freelanceSpecific.budget.currency)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-500 dark:text-slate-400">Maximum</span>
                          <span className="font-medium">
                            {formatCurrency(tender.freelanceSpecific.budget.max, tender.freelanceSpecific.budget.currency)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-500 dark:text-slate-400">Currency</span>
                          <Badge variant="outline">{tender.freelanceSpecific.budget.currency}</Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Professional Tender Specific */}
              {tender.tenderCategory === 'professional' && tender.professionalSpecific && (
                <div className="space-y-6">
                  {/* Procurement Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-medium text-slate-700 dark:text-slate-300">Procurement Details</h4>
                      <dl className="space-y-2">
                        <div>
                          <dt className="text-sm text-slate-500 dark:text-slate-400">Method</dt>
                          <dd className="font-medium">
                            {getProcurementMethodLabel(tender.professionalSpecific.procurementMethod)}
                          </dd>
                        </div>
                        {tender.professionalSpecific.fundingSource && (
                          <div>
                            <dt className="text-sm text-slate-500 dark:text-slate-400">Funding Source</dt>
                            <dd className="font-medium">{tender.professionalSpecific.fundingSource}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium text-slate-700 dark:text-slate-300">Bid Validity</h4>
                      <dl className="space-y-2">
                        {tender.professionalSpecific.bidValidityPeriod && (
                          <div>
                            <dt className="text-sm text-slate-500 dark:text-slate-400">Period</dt>
                            <dd className="font-medium">
                              {formatDuration(
                                tender.professionalSpecific.bidValidityPeriod.value,
                                tender.professionalSpecific.bidValidityPeriod.unit
                              )}
                            </dd>
                          </div>
                        )}
                        {tender.professionalSpecific.clarificationDeadline && (
                          <div>
                            <dt className="text-sm text-slate-500 dark:text-slate-400">Clarification Deadline</dt>
                            <dd className="font-medium">
                              {new Date(tender.professionalSpecific.clarificationDeadline).toLocaleDateString()}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  </div>
                  
                  {/* Timeline */}
                  {tender.professionalSpecific.timeline && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-slate-700 dark:text-slate-300">Project Timeline</h4>
                      <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <span className="text-sm text-slate-500 dark:text-slate-400">Start Date</span>
                            <p className="font-medium">
                              {new Date(tender.professionalSpecific.timeline.startDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-sm text-slate-500 dark:text-slate-400">End Date</span>
                            <p className="font-medium">
                              {new Date(tender.professionalSpecific.timeline.endDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-sm text-slate-500 dark:text-slate-400">Duration</span>
                            <p className="font-medium">
                              {formatDuration(
                                tender.professionalSpecific.timeline.duration.value,
                                tender.professionalSpecific.timeline.duration.unit
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Language & Timezone Preferences */}
              {tender.freelanceSpecific?.languagePreference || tender.freelanceSpecific?.timezonePreference ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {tender.freelanceSpecific.languagePreference && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-slate-700 dark:text-slate-300">Language Preference</h4>
                      <div className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                        <p className="text-slate-600 dark:text-slate-400">
                          {tender.freelanceSpecific.languagePreference}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {tender.freelanceSpecific.timezonePreference && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-slate-700 dark:text-slate-300">Timezone Preference</h4>
                      <div className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                        <p className="text-slate-600 dark:text-slate-400">
                          {tender.freelanceSpecific.timezonePreference}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Skills & Human Resources */}
        <AccordionItem value="skills" className="border-slate-200 dark:border-slate-800">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-lg font-semibold">Skills & Human Resources</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <div className="space-y-6">
              {/* Skills Required */}
              {tender.skillsRequired && tender.skillsRequired.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-700 dark:text-slate-300">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {tender.skillsRequired.map((skill, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary"
                        className="px-3 py-1.5 text-sm"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Experience Level */}
              {tender.freelanceSpecific?.experienceLevel && (
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-700 dark:text-slate-300">Experience Level</h4>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className="px-3 py-1.5"
                    >
                      {getExperienceLevelLabel(tender.freelanceSpecific.experienceLevel)}
                    </Badge>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      Required experience level for this project
                    </span>
                  </div>
                </div>
              )}
              
              {/* Screening Questions */}
              {tender.freelanceSpecific?.screeningQuestions && 
               tender.freelanceSpecific.screeningQuestions.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-700 dark:text-slate-300">Screening Questions</h4>
                  <div className="space-y-3">
                    {tender.freelanceSpecific.screeningQuestions.map((q, idx) => (
                      <div key={idx} className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">Question {idx + 1}</span>
                          {q.required && (
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        <p className="text-slate-600 dark:text-slate-400">{q.question}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Minimum Experience */}
              {tender.professionalSpecific?.minimumExperience && (
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-700 dark:text-slate-300">Minimum Experience Required</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="px-3 py-1.5">
                      {tender.professionalSpecific.minimumExperience} years
                    </Badge>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      Minimum years of relevant experience required
                    </span>
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Compliance & Eligibility */}
        <AccordionItem value="compliance" className="border-slate-200 dark:border-slate-800">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span className="text-lg font-semibold">Compliance & Eligibility</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <div className="space-y-6">
              {/* Legal Registration */}
              {tender.professionalSpecific?.legalRegistrationRequired !== undefined && (
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-700 dark:text-slate-300">Legal Registration</h4>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      tender.professionalSpecific.legalRegistrationRequired 
                        ? "bg-emerald-100 dark:bg-emerald-900/30" 
                        : "bg-slate-100 dark:bg-slate-800"
                    )}>
                      {tender.professionalSpecific.legalRegistrationRequired ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <XSquare className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className={tender.professionalSpecific.legalRegistrationRequired ? "font-medium" : "text-slate-500 dark:text-slate-400"}>
                        {tender.professionalSpecific.legalRegistrationRequired 
                          ? 'Legal registration is required' 
                          : 'Legal registration is not required'}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Companies must provide valid registration documents
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Required Certifications */}
              {tender.professionalSpecific?.requiredCertifications && 
               tender.professionalSpecific.requiredCertifications.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-700 dark:text-slate-300">Required Certifications</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {tender.professionalSpecific.requiredCertifications.map((cert, idx) => (
                      <div key={idx} className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-2 mb-1">
                          <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="font-medium">{cert.name}</span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Issuing Authority: {cert.issuingAuthority}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Financial Capacity */}
              {tender.professionalSpecific?.financialCapacity && (
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-700 dark:text-slate-300">Financial Capacity Requirements</h4>
                  <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Minimum Annual Turnover</p>
                        <p className="text-xl font-bold">
                          {formatCurrency(
                            tender.professionalSpecific.financialCapacity.minAnnualTurnover,
                            tender.professionalSpecific.financialCapacity.currency
                          )}
                        </p>
                      </div>
                      <Badge variant="outline">{tender.professionalSpecific.financialCapacity.currency}</Badge>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Past Project References */}
              {tender.professionalSpecific?.pastProjectReferences && (
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-700 dark:text-slate-300">Past Project References</h4>
                  <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Minimum Projects</span>
                        <span className="font-medium">
                          {tender.professionalSpecific.pastProjectReferences.minCount} projects
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Similar Value Projects</span>
                        <span className="font-medium">
                          {tender.professionalSpecific.pastProjectReferences.similarValueProjects 
                            ? 'Required' 
                            : 'Not required'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Portfolio & NDA Requirements */}
              {(tender.freelanceSpecific?.portfolioRequired !== undefined || 
                tender.freelanceSpecific?.ndaRequired !== undefined) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {tender.freelanceSpecific?.portfolioRequired !== undefined && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-slate-700 dark:text-slate-300">Portfolio Requirement</h4>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          tender.freelanceSpecific.portfolioRequired 
                            ? "bg-emerald-100 dark:bg-emerald-900/30" 
                            : "bg-slate-100 dark:bg-slate-800"
                        )}>
                          {tender.freelanceSpecific.portfolioRequired ? (
                            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <XSquare className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className={tender.freelanceSpecific.portfolioRequired ? "font-medium" : "text-slate-500 dark:text-slate-400"}>
                            {tender.freelanceSpecific.portfolioRequired 
                              ? 'Portfolio submission is required' 
                              : 'Portfolio submission is optional'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {tender.freelanceSpecific?.ndaRequired !== undefined && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-slate-700 dark:text-slate-300">NDA Requirement</h4>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          tender.freelanceSpecific.ndaRequired 
                            ? "bg-emerald-100 dark:bg-emerald-900/30" 
                            : "bg-slate-100 dark:bg-slate-800"
                        )}>
                          {tender.freelanceSpecific.ndaRequired ? (
                            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <XSquare className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className={tender.freelanceSpecific.ndaRequired ? "font-medium" : "text-slate-500 dark:text-slate-400"}>
                            {tender.freelanceSpecific.ndaRequired 
                              ? 'NDA agreement is required' 
                              : 'No NDA required'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Workflow & Evaluation */}
        <AccordionItem value="workflow" className="border-slate-200 dark:border-slate-800">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="text-lg font-semibold">Workflow & Evaluation</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <div className="space-y-6">
              {/* Workflow Explanation */}
              <div className={cn(
                "p-4 rounded-lg border",
                tender.workflowType === 'closed' 
                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                  : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
              )}>
                <div className="flex items-center gap-3 mb-3">
                  {tender.workflowType === 'closed' ? (
                    <>
                      <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      <div>
                        <h4 className="font-semibold text-blue-700 dark:text-blue-300">Sealed Bid (Closed Tender)</h4>
                        <p className="text-sm text-blue-600 dark:text-blue-400">Maximum security & fairness</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Globe className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <h4 className="font-semibold text-emerald-700 dark:text-emerald-300">Open Tender</h4>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">Transparent competition</p>
                      </div>
                    </>
                  )}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  {tender.workflowType === 'closed' 
                    ? 'All proposals are encrypted using military-grade encryption. No one, including the tender owner, can view proposal contents until the official reveal time after the deadline. This ensures complete fairness and prevents any tampering or bias.'
                    : 'Proposals are visible immediately upon submission. This encourages transparent competition and allows applicants to see what others are proposing. The tender owner can review proposals as they come in.'
                  }
                </p>
              </div>
              
              {/* Evaluation Criteria */}
              {tender.professionalSpecific?.evaluationCriteria && (
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-700 dark:text-slate-300">Evaluation Criteria</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-6">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-1">
                          <span>Technical Score</span>
                          <span>{tender.professionalSpecific.evaluationCriteria.technicalWeight}%</span>
                        </div>
                        <Progress 
                          value={tender.professionalSpecific.evaluationCriteria.technicalWeight} 
                          className="h-2"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-1">
                          <span>Financial Score</span>
                          <span>{tender.professionalSpecific.evaluationCriteria.financialWeight}%</span>
                        </div>
                        <Progress 
                          value={tender.professionalSpecific.evaluationCriteria.financialWeight} 
                          className="h-2"
                        />
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Evaluation Method: {getEvaluationMethodLabel(tender.professionalSpecific.evaluationMethod)}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Deliverables */}
              {tender.professionalSpecific?.deliverables && 
               tender.professionalSpecific.deliverables.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-700 dark:text-slate-300">Project Deliverables</h4>
                  <div className="space-y-3">
                    {tender.professionalSpecific.deliverables.map((deliverable, idx) => (
                      <div key={idx} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              <span className="font-medium">{deliverable.title}</span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{deliverable.description}</p>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(deliverable.deadline).toLocaleDateString()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Milestones */}
              {tender.professionalSpecific?.milestones && 
               tender.professionalSpecific.milestones.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-700 dark:text-slate-300">Payment Milestones</h4>
                  <div className="space-y-3">
                    {tender.professionalSpecific.milestones.map((milestone, idx) => (
                      <div key={idx} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-green-600 dark:text-green-400" />
                              <span className="font-medium">{milestone.title}</span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{milestone.description}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant="outline" className="ml-2">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(milestone.dueDate).toLocaleDateString()}
                            </Badge>
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                              {milestone.paymentPercentage}%
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Payment & Budget */}
        <AccordionItem value="payment" className="border-slate-200 dark:border-slate-800">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-lg font-semibold">Payment & Budget Details</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <div className="space-y-6">
              {/* Budget Details */}
              {tender.tenderCategory === 'freelance' && tender.freelanceSpecific?.budget && (
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-700 dark:text-slate-300">Budget Information</h4>
                  <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-sm text-slate-500 dark:text-slate-400">Budget Range</span>
                          <p className="text-xl font-bold">
                            {formatCurrency(tender.freelanceSpecific.budget.min, tender.freelanceSpecific.budget.currency)} - 
                            {formatCurrency(tender.freelanceSpecific.budget.max, tender.freelanceSpecific.budget.currency)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-sm text-slate-500 dark:text-slate-400">Currency</span>
                          <p className="text-xl font-bold">{tender.freelanceSpecific.budget.currency}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="px-3 py-1.5">
                          {getEngagementTypeLabel(tender.freelanceSpecific.engagementType)}
                        </Badge>
                        {tender.freelanceSpecific.engagementType === 'hourly' && tender.freelanceSpecific.weeklyHours && (
                          <Badge variant="secondary">
                            {tender.freelanceSpecific.weeklyHours} hours/week
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Estimated Duration */}
              {(tender.freelanceSpecific?.estimatedDuration || tender.professionalSpecific?.timeline) && (
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-700 dark:text-slate-300">Timeline & Duration</h4>
                  <div className="p-4 border rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Start Date</span>
                        <p className="font-medium">
                          {tender.professionalSpecific?.timeline?.startDate 
                            ? new Date(tender.professionalSpecific.timeline.startDate).toLocaleDateString()
                            : 'Upon agreement'
                          }
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Duration</span>
                        <p className="font-medium">
                          {tender.tenderCategory === 'freelance' && tender.freelanceSpecific?.estimatedDuration
                            ? formatDuration(
                                tender.freelanceSpecific.estimatedDuration.value,
                                tender.freelanceSpecific.estimatedDuration.unit
                              )
                            : tender.professionalSpecific?.timeline
                              ? formatDuration(
                                  tender.professionalSpecific.timeline.duration.value,
                                  tender.professionalSpecific.timeline.duration.unit
                                )
                              : 'Not specified'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* CPO Requirements */}
              {tender.tenderCategory === 'professional' && tender.professionalSpecific?.cpoRequired && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Banknote className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <h4 className="font-medium text-slate-700 dark:text-slate-300">CPO Requirements</h4>
                    <Badge variant="default" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                      Required
                    </Badge>
                  </div>
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
                      A Certified Payment Order (CPO) is required for this tender. 
                      The CPO must be issued by a recognized commercial bank and cover the full bid amount.
                    </p>
                    {tender.professionalSpecific.cpoDescription && (
                      <div className="mt-2 p-3 bg-white dark:bg-slate-900 rounded border">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {tender.professionalSpecific.cpoDescription}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Financial Terms */}
              <div className="space-y-3">
                <h4 className="font-medium text-slate-700 dark:text-slate-300">Financial Terms</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Receipt className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-500 dark:text-slate-400">Tax Obligation</span>
                    </div>
                    <p className="font-medium">Bidder`s responsibility</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Scale className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-500 dark:text-slate-400">Payment Terms</span>
                    </div>
                    <p className="font-medium">As per contract agreement</p>
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Additional Information */}
        <AccordionItem value="additional" className="border-slate-200 dark:border-slate-800">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <span className="text-lg font-semibold">Additional Information</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <div className="space-y-6">
              {/* Industry & Urgency */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tender.freelanceSpecific?.industry && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-slate-700 dark:text-slate-300">Industry</h4>
                    <div className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                      <p className="text-slate-600 dark:text-slate-400">{tender.freelanceSpecific.industry}</p>
                    </div>
                  </div>
                )}
                
                {tender.freelanceSpecific?.urgency && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-slate-700 dark:text-slate-300">Project Urgency</h4>
                    <div className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            tender.freelanceSpecific.urgency === 'urgent'
                              ? "border-red-200 text-red-700 dark:border-red-800 dark:text-red-300"
                              : "border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-300"
                          )}
                        >
                          {tender.freelanceSpecific.urgency === 'urgent' ? 'Urgent' : 'Normal'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* File Upload Constraints */}
              <div className="space-y-3">
                <h4 className="font-medium text-slate-700 dark:text-slate-300">File Upload Constraints</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <HardDrive className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-500 dark:text-slate-400">Max File Size</span>
                    </div>
                    <p className="font-medium">{formatFileSize(tender.maxFileSize)}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <FileIcon className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-500 dark:text-slate-400">Max File Count</span>
                    </div>
                    <p className="font-medium">{tender.maxFileCount} files</p>
                  </div>
                </div>
              </div>
              
              {/* Audit Information */}
              {isOwner && (
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-700 dark:text-slate-300">Audit Information</h4>
                  <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Created</span>
                        <span className="font-medium">
                          {new Date(tender.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {tender.metadata.lastUpdatedAt && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-500 dark:text-slate-400">Last Updated</span>
                          <span className="font-medium">
                            {new Date(tender.metadata.lastUpdatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Update Count</span>
                        <Badge variant="outline">{tender.metadata.updateCount || 0}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Tender ID</span>
                        <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                          {tender._id}
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
  
  // Render proposals tab
  const renderProposalsTab = () => {
    const isSealed = tender.workflowType === 'closed' && !tender.revealedAt;
    const deadlinePassed = new Date(tender.deadline) < new Date();
    
    return (
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5" />
              <span>Proposals</span>
            </div>
            <Badge variant="outline" className="ml-2">
              {tender.metadata.visibleApplications || 0} submitted
            </Badge>
          </CardTitle>
          <CardDescription>
            {isSealed 
              ? 'Proposals are sealed until the official reveal time'
              : tender.workflowType === 'open' ? 'Visible proposals' : 'Proposal submission status'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          {isSealed ? (
            // Sealed workflow - Show countdown and explanation
            <div className="text-center py-12">
              <div className="inline-flex flex-col items-center max-w-lg mx-auto">
                <div className="p-6 rounded-full bg-slate-100 dark:bg-slate-800 mb-6">
                  <Lock className="w-16 h-16 text-slate-400 dark:text-slate-500" />
                </div>
                
                <h3 className="text-2xl font-bold mb-3">Proposals Are Sealed</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-8">
                  This is a sealed bid tender. All proposals are encrypted and securely stored.
                  No one can view proposal contents until the official reveal time after the deadline.
                </p>
                
                {/* Countdown Timer */}
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6 mb-6">
                  <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    {deadlinePassed 
                      ? 'Proposals will be revealed shortly'
                      : 'Proposals will be revealed after deadline'
                    }
                  </div>
                  
                  <div className="flex items-center justify-center gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {deadlineInfo.days}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Days</div>
                    </div>
                    <div className="text-2xl text-slate-300 dark:text-slate-600">:</div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {deadlineInfo.hours % 24}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Hours</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                    {deadlinePassed 
                      ? 'Evaluation in progress'
                      : `Until ${new Date(tender.deadline).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}`
                    }
                  </div>
                </div>
                
                {/* Security Information */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h4 className="font-medium text-blue-700 dark:text-blue-300">Security & Trust Guarantee</h4>
                  </div>
                  <ul className="text-sm text-blue-600 dark:text-blue-400 text-left space-y-1">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Military-grade AES-256 encryption</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Zero-knowledge proof system</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Immutable audit trail</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>No one can view or modify proposals before reveal</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          ) : tender.workflowType === 'open' ? (
            // Open workflow - Show proposal count
            <div className="text-center py-12">
              <div className="inline-flex flex-col items-center max-w-md mx-auto">
                <div className="p-6 rounded-full bg-slate-100 dark:bg-slate-800 mb-6">
                  <Globe className="w-16 h-16 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Open Tender</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  This is an open tender. Proposals are visible to the tender owner immediately upon submission.
                </p>
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                  <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                    {tender.metadata.visibleApplications || 0}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Proposals Submitted</div>
                  {canApply && isActive && (
                    <Button className="mt-4" onClick={onApply}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Submit Proposal
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Closed but revealed or no access
            <div className="text-center py-12">
              <div className="inline-flex flex-col items-center max-w-md mx-auto">
                <div className="p-6 rounded-full bg-slate-100 dark:bg-slate-800 mb-6">
                  <EyeOff className="w-16 h-16 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Proposal Access Restricted</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  You don`t have permission to view proposals for this tender.
                  {isOwner ? ' As the tender owner, you can view proposals once they are revealed.' : ''}
                </p>
                {isOwner && tender.status === 'draft' && (
                  <Button onClick={handlePublishTender}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Publish Tender to Receive Proposals
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
        
        {isOwner && canViewAllProposals && tender.metadata.visibleApplications > 0 && (
          <CardFooter className="border-t border-slate-200 dark:border-slate-800 pt-4">
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Showing {tender.metadata.visibleApplications} of {tender.metadata.totalApplications} proposals
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export All
                </Button>
                <Button variant="outline" size="sm">
                  <FileBarChart className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
    );
  };
  
  return (
    <div className="bg-white dark:bg-slate-950 rounded-b-2xl border-x border-b border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 md:px-6 py-6">
        {/* Action Bar */}
        {renderActionBar()}
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-800 rounded"
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">View</span>
            </TabsTrigger>
            <TabsTrigger 
              value="details" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-800 rounded"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Details</span>
              <span className="sm:hidden">Details</span>
            </TabsTrigger>
            <TabsTrigger 
              value="attachments" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-800 rounded"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Attachments</span>
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                {tender.attachments.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="proposals" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-800 rounded"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Proposals</span>
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                {tender.metadata.visibleApplications || 0}
              </Badge>
            </TabsTrigger>
          </TabsList>
          
          {/* Tab Contents */}
          <TabsContent value="overview" className="space-y-6 animate-in fade-in duration-300">
            {renderOverviewTab()}
          </TabsContent>
          
          <TabsContent value="details" className="animate-in fade-in duration-300">
            {renderDetailsTab()}
          </TabsContent>
          
          <TabsContent value="attachments" className="animate-in fade-in duration-300">
            <TenderAttachmentList 
              tender={tender} 
              canDownload={true}
              showPreview={true}
              className="border-slate-200 dark:border-slate-800"
            />
          </TabsContent>
          
          <TabsContent value="proposals" className="animate-in fade-in duration-300">
            {renderProposalsTab()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};