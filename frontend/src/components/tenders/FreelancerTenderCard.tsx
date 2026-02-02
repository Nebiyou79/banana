// components/tenders/freelance/FreelanceTenderCard.tsx
import React from 'react';
import { Clock, DollarSign, MapPin, Globe, Save, Eye, Zap, Award, Users, Briefcase } from 'lucide-react';
import { Tender } from '@/services/tenderService';
import { useToggleSaveTender } from '@/hooks/useTenders';
import { formatDeadline, getStatusColor } from '@/services/tenderService';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/social/ui/Button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { colors } from '@/utils/color';

interface FreelanceTenderCardProps {
  tender: Tender;
  variant?: 'grid' | 'list';
  size?: 'small' | 'medium' | 'large';
  showActions?: boolean;
  className?: string;
}

const FreelanceTenderCard: React.FC<FreelanceTenderCardProps> = ({
  tender,
  variant = 'grid',
  size = 'medium',
  showActions = true,
  className
}) => {
  const { mutate: toggleSave } = useToggleSaveTender();
  const isActive = new Date(tender.deadline) > new Date();

  const handleSaveToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSave(tender._id);
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = `/dashboard/freelancer/tenders/${tender._id}`;
  };

  // Format budget
  const formatBudget = () => {
    if (!tender.freelanceSpecific) return 'Budget not specified';

    const { engagementType, budget, weeklyHours } = tender.freelanceSpecific;

    if (engagementType === 'fixed_price' && budget) {
      return `${budget.currency} ${budget.min.toLocaleString()} - ${budget.max.toLocaleString()}`;
    } else if (engagementType === 'hourly' && weeklyHours) {
      return `Hourly • ${weeklyHours} hrs/week`;
    }

    return 'Contact for price';
  };

  // Calculate days remaining
  const calculateDaysRemaining = () => {
    const deadline = new Date(tender.deadline);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysRemaining = calculateDaysRemaining();
  const isSaved = tender.metadata?.savedBy?.length > 0;

  // Size-based styling
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'p-3 sm:p-4';
      case 'large':
        return 'p-5 sm:p-6';
      default:
        return 'p-4 sm:p-5';
    }
  };

  // Variant-based rendering
  if (variant === 'list') {
    return (
      <Card className={cn(
        "w-full border border-border-secondary hover:border-green-300 dark:hover:border-green-700 transition-all duration-300 hover:shadow-md",
        className
      )}>
        <CardContent className={cn("p-4 sm:p-6", getSizeClasses())}>
          <div className="flex flex-col md:flex-row md:items-start gap-4 sm:gap-6">
            {/* Left Section - Main Info */}
            <div className="flex-1 space-y-3 sm:space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1 sm:space-y-2">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <h3 className="font-semibold text-base sm:text-lg text-text-primary line-clamp-1">
                      {tender.title}
                    </h3>
                    {tender.freelanceSpecific?.urgency === 'urgent' && (
                      <Badge className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                        <Zap className="h-3 w-3 mr-1" />
                        Urgent
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                      {tender.procurementCategory}
                    </Badge>
                    <Badge variant={tender.workflowType === 'open' ? 'default' : 'secondary'} className="text-xs">
                      {tender.workflowType === 'open' ? 'Open' : 'Closed'} Workflow
                    </Badge>
                    {tender.freelanceSpecific?.experienceLevel && (
                      <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                        <Award className="h-3 w-3 mr-1" />
                        {tender.freelanceSpecific.experienceLevel}
                      </Badge>
                    )}
                  </div>
                </div>

                {showActions && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSaveToggle}
                    className="text-text-muted hover:text-emerald-600 dark:hover:text-emerald-400"
                  >
                    <Save className={cn(
                      "h-4 w-4 sm:h-5 sm:w-5",
                      isSaved && "fill-emerald-500 text-emerald-500 dark:fill-emerald-400 dark:text-emerald-400"
                    )} />
                  </Button>
                )}
              </div>

              <p className="text-text-secondary text-sm line-clamp-2">
                {tender.description}
              </p>

              {/* Skills */}
              {tender.skillsRequired && tender.skillsRequired.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-text-primary">Required Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {tender.skillsRequired.slice(0, 5).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="bg-bg-secondary text-text-primary">
                        {skill}
                      </Badge>
                    ))}
                    {tender.skillsRequired.length > 5 && (
                      <Badge variant="outline" className="text-text-muted">
                        +{tender.skillsRequired.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Section - Stats & Actions */}
            <div className="md:w-56 lg:w-64 space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Budget</span>
                  </div>
                  <p className="font-medium text-text-primary text-sm sm:text-base">{formatBudget()}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Deadline</span>
                  </div>
                  <p className="font-medium text-text-primary text-sm sm:text-base">{formatDeadline(tender.deadline)}</p>
                </div>
              </div>

              {/* Language & Timezone */}
              {(tender.freelanceSpecific?.languagePreference || tender.freelanceSpecific?.timezonePreference) && (
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm">
                  {tender.freelanceSpecific.languagePreference && (
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>{tender.freelanceSpecific.languagePreference}</span>
                    </div>
                  )}
                  {tender.freelanceSpecific.timezonePreference && (
                    <div className="flex items-center gap-2 text-text-secondary">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>{tender.freelanceSpecific.timezonePreference}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Countdown & Status */}
              <div className="flex flex-wrap items-center gap-2">
                {isActive && daysRemaining >= 0 && (
                  <Badge
                    variant={daysRemaining <= 3 ? 'destructive' : 'outline'}
                    className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {daysRemaining === 0 ? 'Ends Today' : `${daysRemaining} days left`}
                  </Badge>
                )}
                <Badge className={getStatusColor(tender.status)}>
                  {tender.status.replace('_', ' ')}
                </Badge>
              </div>

              {showActions && (
                <Button
                  onClick={handleViewDetails}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid View (default)
  return (
    <Card className={cn(
      "overflow-hidden border border-border-secondary hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-300 hover:shadow-lg",
      size === 'large' ? 'h-full' : '',
      className
    )}>
      {/* Gradient Header */}
      <div
        className="h-2 w-full"
        style={{
          background: `linear-gradient(90deg, ${colors.teal}20 0%, ${colors.blue}20 100%)`
        }}
      />

      <CardHeader className={cn("pb-3", getSizeClasses())}>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className={cn(
              "font-semibold text-text-primary line-clamp-2",
              size === 'small' ? 'text-base' : 'text-lg',
              size === 'large' ? 'text-xl' : ''
            )}>
              {tender.title}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                {tender.procurementCategory}
              </Badge>
              {tender.freelanceSpecific?.urgency === 'urgent' && (
                <Badge className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                  <Zap className="h-3 w-3 mr-1" />
                  Urgent
                </Badge>
              )}
            </div>
          </div>
          {showActions && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSaveToggle}
              className="text-text-muted hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              <Save className={cn(
                "h-4 w-4 sm:h-5 sm:w-5",
                isSaved && "fill-emerald-500 text-emerald-500 dark:fill-emerald-400 dark:text-emerald-400"
              )} />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className={cn("space-y-3 sm:space-y-4", getSizeClasses())}>
        {/* Budget & Timeline */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Budget</span>
            </div>
            <p className="font-medium text-text-primary text-sm sm:text-base">{formatBudget()}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Deadline</span>
            </div>
            <p className="font-medium text-text-primary text-sm sm:text-base">{formatDeadline(tender.deadline)}</p>
          </div>
        </div>

        {/* Skills */}
        {tender.skillsRequired && tender.skillsRequired.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-text-primary">Required Skills</p>
            <div className="flex flex-wrap gap-2">
              {tender.skillsRequired.slice(0, 3).map((skill, index) => (
                <Badge key={index} variant="secondary" className="bg-bg-secondary text-text-primary">
                  {skill}
                </Badge>
              ))}
              {tender.skillsRequired.length > 3 && (
                <Badge variant="outline" className="text-text-muted">
                  +{tender.skillsRequired.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Experience Level */}
        {tender.freelanceSpecific?.experienceLevel && (
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Award className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="capitalize">{tender.freelanceSpecific.experienceLevel} Level</span>
          </div>
        )}

        {/* Language & Timezone */}
        {tender.freelanceSpecific?.languagePreference && (
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm">
            <div className="flex items-center gap-2 text-text-secondary">
              <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>{tender.freelanceSpecific.languagePreference}</span>
            </div>
            {tender.freelanceSpecific.timezonePreference && (
              <div className="flex items-center gap-2 text-text-secondary">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{tender.freelanceSpecific.timezonePreference}</span>
              </div>
            )}
          </div>
        )}

        {/* Countdown Badge */}
        {isActive && daysRemaining >= 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={daysRemaining <= 3 ? 'destructive' : 'outline'}
              className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
            >
              <Clock className="h-3 w-3 mr-1" />
              {daysRemaining === 0 ? 'Ends Today' : `${daysRemaining} days left`}
            </Badge>
            <Badge className={getStatusColor(tender.status)}>
              {tender.status.replace('_', ' ')}
            </Badge>
          </div>
        )}
      </CardContent>

      {showActions && (
        <CardFooter className={cn("pt-3 sm:pt-4 border-t border-border-secondary", getSizeClasses())}>
          <Button
            onClick={handleViewDetails}
            className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default FreelanceTenderCard;