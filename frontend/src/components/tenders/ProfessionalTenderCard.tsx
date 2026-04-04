/* eslint-disable @typescript-eslint/no-explicit-any */
// components/tenders/professional/ProfessionalTenderCard.tsx
import React, { useMemo } from 'react';
import {
  Building,
  FileText,
  Clock,
  Shield,
  Users,
  Save,
  Eye,
  Banknote,
  Briefcase,
  Award,
  Calendar,
  MapPin,
  Globe,
  Hash,
  Tag,
  DollarSign,
  FolderOpen,
  ListChecks,
  ChevronRight,
} from 'lucide-react';
import { Tender, formatDeadline, getStatusColor, isTenderActive } from '@/services/tenderService';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/social/ui/Button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/Card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { Progress } from '@/components/ui/Progress';
import { Separator } from '@/components/ui/Separator';
import { cn } from '@/lib/utils';
import { colors, colorClasses } from '@/utils/color';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface ProfessionalTenderCardProps {
  tender: Tender;
  onToggleSave?: (tenderId: string) => void;
  isSaved?: boolean;
  variant?: 'grid' | 'list';
}

const ProfessionalTenderCard: React.FC<ProfessionalTenderCardProps> = ({
  tender,
  onToggleSave,
  isSaved = false,
  variant = 'grid',
}) => {
  const router = useRouter();
  const isActive = isTenderActive(tender);
  const spec = tender.professionalSpecific;

  // Calculate days remaining
  const daysRemaining = useMemo(() => {
    const deadline = new Date(tender.deadline);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [tender.deadline]);

  // Format budget range
  const budgetRange = useMemo(() => {
    if (!spec?.financialCapacity?.minAnnualTurnover) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: spec.financialCapacity.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(spec.financialCapacity.minAnnualTurnover);
  }, [spec?.financialCapacity]);

  // Get procurement method label
  const procurementMethodLabel = useMemo(() => {
    const methods: Record<string, string> = {
      open_tender: 'Open Tender',
      restricted: 'Restricted',
      direct: 'Direct',
      framework: 'Framework',
    };
    return methods[spec?.procurementMethod || 'open_tender'] || 'Open Tender';
  }, [spec?.procurementMethod]);

  // Format eligibility summary
  const eligibilitySummary = useMemo(() => {
    const parts = [];
    if (spec?.minimumExperience) {
      parts.push(`${spec.minimumExperience}+ years`);
    }
    if (spec?.requiredCertifications?.length) {
      parts.push(`${spec.requiredCertifications.length} certifications`);
    }
    if (spec?.legalRegistrationRequired) {
      parts.push('Registered');
    }
    if (spec?.financialCapacity) {
      parts.push('Financial capacity');
    }
    return parts.length > 0 ? parts.join(' • ') : 'All qualified companies';
  }, [spec]);

  // Get urgency color
  const getUrgencyColor = () => {
    if (!isActive) return colorClasses.text.muted;
    if (daysRemaining <= 3) return colorClasses.text.red;
    if (daysRemaining <= 7) return colorClasses.text.amber;
    return colorClasses.text.green;
  };

  // Handle view details
  const handleViewDetails = () => {
    router.push(`/dashboard/company/tenders/tenders/${tender._id}`);
  };

  // Handle save toggle
  const handleSaveToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleSave) {
      onToggleSave(tender._id);
    }
  };

  // Grid View
  if (variant === 'grid') {
    return (
      <Card className={cn(
        "overflow-hidden border transition-all duration-300 hover:shadow-lg h-full flex flex-col",
        colorClasses.border.secondary,
        colorClasses.bg.primary,
        "hover:border-blue-300 dark:hover:border-blue-700"
      )}>
        {/* Status Bar */}
        <div
          className="h-2 w-full"
          style={{
            background: `linear-gradient(90deg, ${colors.blue}20 0%, ${colors.blue}60 100%)`
          }}
        />

        <CardHeader className="pb-2">
          <div className="flex justify-between items-start gap-2">
            <div className="space-y-2 flex-1 min-w-0">
              {/* Title */}
              <h3 className={cn(
                "font-semibold text-base sm:text-lg line-clamp-2",
                colorClasses.text.primary
              )}>
                {tender.title}
              </h3>

              {/* Reference Number & Entity */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Hash className={cn("h-3 w-3 shrink-0", colorClasses.text.muted)} />
                  <span className={cn("text-xs font-mono truncate", colorClasses.text.secondary)}>
                    {spec?.referenceNumber || `REF-${tender._id.slice(-8).toUpperCase()}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className={cn("h-3 w-3 shrink-0", colorClasses.text.muted)} />
                  <span className={cn("text-xs truncate", colorClasses.text.secondary)}>
                    {spec?.procuringEntity || 'Not specified'}
                  </span>
                </div>
              </div>
            </div>

            {/* Save Button */}
            {onToggleSave && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSaveToggle}
                className={cn(
                  "h-8 w-8 shrink-0",
                  colorClasses.text.muted,
                  "hover:text-blue-600 dark:hover:text-blue-400"
                )}
              >
                <Save className={cn(
                  "h-4 w-4",
                  isSaved && cn(
                    colorClasses.text.blue,
                    "fill-blue-500 dark:fill-blue-400"
                  )
                )} />
              </Button>
            )}
          </div>

          {/* Badge Row */}
          <div className="flex flex-wrap gap-2 mt-2">
            {/* Status Badge */}
            <Badge className={cn(
              "text-xs",
              getStatusColor(tender.status)
            )}>
              {tender.status.replace('_', ' ')}
            </Badge>

            {/* CPO Badge */}
            {spec?.cpoRequired && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs gap-1",
                        colorClasses.border.rose,
                        colorClasses.text.rose
                      )}
                    >
                      <Banknote className="h-3 w-3" />
                      CPO Required
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className={cn("text-xs max-w-xs", colorClasses.text.primary)}>
                      {spec.cpoDescription || 'Certificate of Payment Obligation required'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Workflow Badge */}
            <Badge
              variant="outline"
              className={cn(
                "text-xs gap-1",
                tender.workflowType === 'closed'
                  ? cn(colorClasses.border.purple, colorClasses.text.purple)
                  : cn(colorClasses.border.blue, colorClasses.text.blue)
              )}
            >
              <Shield className="h-3 w-3" />
              {tender.workflowType === 'closed' ? 'Sealed Bid' : 'Open Bid'}
            </Badge>

            {/* Urgency Badge */}
            {isActive && daysRemaining <= 7 && (
              <Badge
                variant={daysRemaining <= 3 ? 'destructive' : 'outline'}
                className={cn(
                  "text-xs gap-1",
                  daysRemaining <= 3
                    ? "bg-red-100 text-red-800 border-red-200"
                    : cn(colorClasses.border.amber, colorClasses.text.amber)
                )}
              >
                <Clock className="h-3 w-3" />
                {daysRemaining === 0 ? 'Ends Today' : `${daysRemaining} days left`}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 space-y-3">
          {/* Procurement Method & Category */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <div className={cn("flex items-center gap-1 text-xs", colorClasses.text.muted)}>
                <FileText className="h-3 w-3" />
                <span>Method</span>
              </div>
              <p className={cn("text-xs font-medium", colorClasses.text.primary)}>
                {procurementMethodLabel}
              </p>
            </div>
            <div className="space-y-1">
              <div className={cn("flex items-center gap-1 text-xs", colorClasses.text.muted)}>
                <Tag className="h-3 w-3" />
                <span>Category</span>
              </div>
              <p className={cn("text-xs font-medium truncate", colorClasses.text.primary)}>
                {tender.procurementCategory}
              </p>
            </div>
          </div>

          {/* Eligibility Summary */}
          <div className="space-y-1">
            <div className={cn("flex items-center gap-1 text-xs", colorClasses.text.muted)}>
              <Award className="h-3 w-3" />
              <span>Eligibility</span>
            </div>
            <p className={cn("text-xs", colorClasses.text.secondary)}>
              {eligibilitySummary}
            </p>
          </div>

          {/* Financial Capacity */}
          {budgetRange && (
            <div className="space-y-1">
              <div className={cn("flex items-center gap-1 text-xs", colorClasses.text.muted)}>
                <DollarSign className="h-3 w-3" />
                <span>Min. Annual Turnover</span>
              </div>
              <p className={cn("text-xs font-medium", colorClasses.text.primary)}>
                {budgetRange}
              </p>
            </div>
          )}

          {/* Milestones & Deliverables */}
          <div className="grid grid-cols-2 gap-2">
            {spec?.milestones && spec.milestones.length > 0 && (
              <div className="space-y-1">
                <div className={cn("flex items-center gap-1 text-xs", colorClasses.text.muted)}>
                  <ListChecks className="h-3 w-3" />
                  <span>Milestones</span>
                </div>
                <p className={cn("text-xs font-medium", colorClasses.text.primary)}>
                  {spec.milestones.length}
                </p>
              </div>
            )}
            {spec?.deliverables && spec.deliverables.length > 0 && (
              <div className="space-y-1">
                <div className={cn("flex items-center gap-1 text-xs", colorClasses.text.muted)}>
                  <FolderOpen className="h-3 w-3" />
                  <span>Deliverables</span>
                </div>
                <p className={cn("text-xs font-medium", colorClasses.text.primary)}>
                  {spec.deliverables.length}
                </p>
              </div>
            )}
          </div>

          {/* Deadline */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Calendar className={cn("h-3 w-3", getUrgencyColor())} />
              <span className={cn("text-xs", getUrgencyColor())}>
                {formatDeadline(tender.deadline)}
              </span>
            </div>
            <span className={cn("text-xs", colorClasses.text.muted)}>
              {new Date(tender.deadline).toLocaleDateString()}
            </span>
          </div>

          {/* Bid Validity */}
          {spec?.bidValidityPeriod && (
            <div className="flex items-center gap-1">
              <Clock className={cn("h-3 w-3", colorClasses.text.muted)} />
              <span className={cn("text-xs", colorClasses.text.muted)}>
                Bid valid: {spec.bidValidityPeriod.value} {spec.bidValidityPeriod.unit}
              </span>
            </div>
          )}

          {/* Progress Bar */}
          {isActive && (
            <Progress
              value={Math.min(100, (daysRemaining > 0 ? (30 - daysRemaining) / 30 * 100 : 100))}
              className="h-1 mt-2"
            />
          )}
        </CardContent>

        <CardFooter className={cn("pt-3 border-t", colorClasses.border.secondary)}>
          <Button
            onClick={handleViewDetails}
            className={cn(
              "w-full text-white gap-2",
              colorClasses.bg.blue600,
              "hover:bg-blue-700 dark:hover:bg-blue-600"
            )}
          >
            <Eye className="h-4 w-4" />
            View Details
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // List View
  return (
    <Card className={cn(
      "border transition-all duration-300 hover:shadow-md",
      colorClasses.border.secondary,
      colorClasses.bg.primary,
      "hover:border-blue-300 dark:hover:border-blue-700"
    )}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left Section - Main Info */}
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <h3 className={cn("font-semibold text-lg", colorClasses.text.primary)}>
                  {tender.title}
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Hash className={cn("h-3 w-3", colorClasses.text.muted)} />
                    <span className={cn("text-xs font-mono", colorClasses.text.secondary)}>
                      {spec?.referenceNumber || `REF-${tender._id.slice(-8).toUpperCase()}`}
                    </span>
                  </div>
                  <Separator orientation="vertical" className="h-3" />
                  <div className="flex items-center gap-1">
                    <Building className={cn("h-3 w-3", colorClasses.text.muted)} />
                    <span className={cn("text-xs", colorClasses.text.secondary)}>
                      {spec?.procuringEntity || 'Not specified'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Status Badge */}
                <Badge className={getStatusColor(tender.status)}>
                  {tender.status.replace('_', ' ')}
                </Badge>

                {/* Save Button */}
                {onToggleSave && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSaveToggle}
                    className={cn(
                      "h-8 w-8",
                      colorClasses.text.muted,
                      "hover:text-blue-600 dark:hover:text-blue-400"
                    )}
                  >
                    <Save className={cn(
                      "h-4 w-4",
                      isSaved && cn(
                        colorClasses.text.blue,
                        "fill-blue-500 dark:fill-blue-400"
                      )
                    )} />
                  </Button>
                )}
              </div>
            </div>

            {/* Badge Row */}
            <div className="flex flex-wrap gap-2">
              {spec?.cpoRequired && (
                <Badge
                  variant="outline"
                  className={cn(
                    "gap-1",
                    colorClasses.border.rose,
                    colorClasses.text.rose
                  )}
                >
                  <Banknote className="h-3 w-3" />
                  CPO Required
                </Badge>
              )}

              <Badge
                variant="outline"
                className={cn(
                  "gap-1",
                  tender.workflowType === 'closed'
                    ? cn(colorClasses.border.purple, colorClasses.text.purple)
                    : cn(colorClasses.border.blue, colorClasses.text.blue)
                )}
              >
                <Shield className="h-3 w-3" />
                {tender.workflowType === 'closed' ? 'Sealed Bid' : 'Open Bid'}
              </Badge>

              <Badge
                variant="outline"
                className={cn(
                  "gap-1",
                  colorClasses.border.emerald,
                  colorClasses.text.emerald
                )}
              >
                <Tag className="h-3 w-3" />
                {tender.procurementCategory}
              </Badge>
            </div>

            {/* Description */}
            <p className={cn("text-sm line-clamp-2", colorClasses.text.secondary)}>
              {tender.description}
            </p>

            {/* Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div>
                <div className={cn("text-xs", colorClasses.text.muted)}>Method</div>
                <div className={cn("text-sm font-medium", colorClasses.text.primary)}>
                  {procurementMethodLabel}
                </div>
              </div>
              <div>
                <div className={cn("text-xs", colorClasses.text.muted)}>Eligibility</div>
                <div className={cn("text-sm font-medium truncate", colorClasses.text.primary)}>
                  {spec?.minimumExperience ? `${spec.minimumExperience}+ years` : 'Open'}
                </div>
              </div>
              <div>
                <div className={cn("text-xs", colorClasses.text.muted)}>Milestones</div>
                <div className={cn("text-sm font-medium", colorClasses.text.primary)}>
                  {spec?.milestones?.length || 0}
                </div>
              </div>
              <div>
                <div className={cn("text-xs", colorClasses.text.muted)}>Deliverables</div>
                <div className={cn("text-sm font-medium", colorClasses.text.primary)}>
                  {spec?.deliverables?.length || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Deadline & Action */}
          <div className="lg:w-64 space-y-3 lg:border-l lg:pl-4">
            <div className="text-center lg:text-left">
              <div className={cn("text-sm", colorClasses.text.muted)}>Deadline</div>
              <div className={cn("text-lg font-bold", getUrgencyColor())}>
                {formatDeadline(tender.deadline)}
              </div>
              <div className={cn("text-xs mt-1", colorClasses.text.muted)}>
                {format(new Date(tender.deadline), 'PPP')}
              </div>
            </div>

            {isActive && (
              <div className="space-y-2">
                <Progress
                  value={Math.min(100, (daysRemaining > 0 ? (30 - daysRemaining) / 30 * 100 : 100))}
                  className="h-1.5"
                />
                <div className={cn("text-xs text-center", colorClasses.text.muted)}>
                  {daysRemaining} days remaining
                </div>
              </div>
            )}

            <Button
              onClick={handleViewDetails}
              className={cn(
                "w-full text-white gap-2",
                colorClasses.bg.blue600,
                "hover:bg-blue-700 dark:hover:bg-blue-600"
              )}
            >
              <Eye className="h-4 w-4" />
              View Details
              <ChevronRight className="h-4 w-4 ml-auto" />
            </Button>

            {spec?.bidValidityPeriod && (
              <div className={cn("text-xs text-center", colorClasses.text.muted)}>
                Bid valid for {spec.bidValidityPeriod.value} {spec.bidValidityPeriod.unit}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfessionalTenderCard;