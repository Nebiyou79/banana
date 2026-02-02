// components/tenders/professional/ProfessionalTenderCard.tsx
import React from 'react';
import {
  Building,
  FileText,
  Clock,
  Shield,
  Users,
  Save,
  Eye,
  Banknote,
  Briefcase
} from 'lucide-react';
import { Tender } from '@/services/tenderService';
import { useToggleSaveTender } from '@/hooks/useTenders';
import { formatDeadline, getStatusColor } from '@/services/tenderService';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/social/ui/Button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/Card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils';
import { colors } from '@/utils/color';

interface ProfessionalTenderCardProps {
  tender: Tender;
}

const ProfessionalTenderCard: React.FC<ProfessionalTenderCardProps> = ({ tender }) => {
  const { mutate: toggleSave } = useToggleSaveTender();
  const isActive = new Date(tender.deadline) > new Date();

  const handleSaveToggle = () => {
    toggleSave(tender._id);
  };

  const handleViewDetails = () => {
    window.location.href = `/dashboard/company/tenders/${tender._id}`;
  };

  // Format eligibility summary
  const formatEligibility = () => {
    const spec = tender.professionalSpecific;
    if (!spec) return 'Open to qualified companies';

    const parts = [];
    if (spec.minimumExperience) parts.push(`${spec.minimumExperience}+ years`);
    if (spec.legalRegistrationRequired) parts.push('Registered');
    if (spec.financialCapacity) parts.push('Financial capacity');

    return parts.length > 0 ? parts.join(' • ') : 'All qualified companies';
  };

  // Format procurement method
  const formatProcurementMethod = () => {
    return tender.professionalSpecific?.procurementMethod?.replace('_', ' ') || 'Open Tender';
  };

  // Check CPO requirement
  const hasCPO = tender.professionalSpecific?.cpoRequired;

  // Calculate days remaining
  const calculateDaysRemaining = () => {
    const deadline = new Date(tender.deadline);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysRemaining = calculateDaysRemaining();

  return (
    <Card className={cn(
      "overflow-hidden border border-border-secondary hover:border-blue-300 transition-all duration-300 hover:shadow-lg",
      "bg-bg-primary dark:bg-bg-surface"
    )}>
      {/* Gradient Header */}
      <div
        className="h-2 w-full"
        style={{
          background: `linear-gradient(90deg, ${colors.blue}20 0%, ${colors.blue}30 100%)`
        }}
      />

      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div className="space-y-1">
                <h3 className="font-semibold text-lg text-text-primary line-clamp-2">{tender.title}</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                    {tender.tenderId || `REF-${tender._id.slice(-8).toUpperCase()}`}
                  </Badge>
                  <Badge variant={tender.workflowType === 'open' ? 'default' : 'secondary'}>
                    {tender.workflowType === 'open' ? 'Open' : 'Sealed'} Bid
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSaveToggle}
                className="text-text-muted hover:text-blue-600 dark:hover:text-blue-400 self-start sm:self-auto"
              >
                <Save className={cn(
                  "h-5 w-5",
                  tender.metadata?.savedBy?.length && 'fill-blue-500 text-blue-500 dark:fill-blue-400 dark:text-blue-400'
                )} />
              </Button>
            </div>

            {/* Entity & Procurement */}
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-4 text-sm text-text-secondary">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <span className="font-medium">{tender.professionalSpecific?.procuringEntity || 'Not specified'}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>{formatProcurementMethod()}</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Eligibility & CPO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Shield className="h-4 w-4" />
              <span>Eligibility</span>
            </div>
            <p className="font-medium text-text-primary text-sm">{formatEligibility()}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Clock className="h-4 w-4" />
              <span>Deadline</span>
            </div>
            <p className="font-medium text-text-primary">{formatDeadline(tender.deadline)}</p>
          </div>
        </div>

        {/* Visibility & Contract Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Users className="h-4 w-4" />
              <span>Visibility</span>
            </div>
            <Badge variant="outline" className="capitalize bg-bg-secondary text-text-primary">
              {tender.visibility.visibilityType?.replace('_', ' ')}
            </Badge>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Briefcase className="h-4 w-4" />
              <span>Category</span>
            </div>
            <p className="font-medium text-text-primary text-sm">{tender.procurementCategory}</p>
          </div>
        </div>

        {/* Status & CPO Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={getStatusColor(tender.status)}>
            {tender.status.replace('_', ' ')}
          </Badge>

          {hasCPO && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                    <Banknote className="h-3 w-3 mr-1" />
                    CPO Required
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm max-w-xs">Certificate of Payment Obligation required</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {isActive && daysRemaining >= 0 && (
            <Badge
              variant={daysRemaining <= 3 ? 'destructive' : 'outline'}
              className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
            >
              <Clock className="h-3 w-3 mr-1" />
              {daysRemaining === 0 ? 'Ends Today' : `${daysRemaining} days left`}
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t border-border-secondary">
        <Button
          onClick={handleViewDetails}
          className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white"
        >
          <Eye className="h-4 w-4 mr-2" />
          View Details & Apply
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProfessionalTenderCard;