// components/tenders/freelance/FreelancerTenderCard.tsx
import React, { useMemo } from 'react';
import {
  Clock,
  DollarSign,
  MapPin,
  Globe,
  Bookmark,
  Eye,
  Zap,
  Award,
  Users,
  Briefcase,
  Shield,
  FileText,
  Calendar,
  Hourglass,
  TrendingUp,
} from 'lucide-react';
import { Tender } from '@/services/tenderService';
import { formatDeadline, getStatusColor, isTenderActive } from '@/services/tenderService';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/social/ui/Button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils';
import { colors, colorClasses } from '@/utils/color';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface FreelancerTenderCardProps {
  tender: Tender;
  variant?: 'grid' | 'list';
  size?: 'small' | 'medium' | 'large';
  isSaved?: boolean;
  onToggleSave?: () => void;
  className?: string;
}

const FreelancerTenderCard: React.FC<FreelancerTenderCardProps> = ({
  tender,
  variant = 'grid',
  size = 'medium',
  isSaved = false,
  onToggleSave,
  className
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const isActive = isTenderActive(tender);
  const spec = tender.freelanceSpecific;

  const handleViewDetails = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/dashboard/freelancer/tenders/${tender._id}`);
  };

  // Format budget based on engagement type
  const formatBudget = useMemo(() => {
    if (!spec) return 'Budget not specified';

    if (spec.engagementType === 'fixed_price' && spec.budget) {
      const minFormatted = spec.budget.min.toLocaleString();
      const maxFormatted = spec.budget.max.toLocaleString();
      return (
        <div className="space-y-0.5">
          <div className="font-semibold">
            {spec.budget.currency} {minFormatted} - {maxFormatted}
          </div>
          <div className="text-xs text-muted-foreground">Fixed Price</div>
        </div>
      );
    } else if (spec.engagementType === 'hourly' && spec.weeklyHours) {
      const hourlyRate = spec.budget
        ? `${spec.budget.currency} ${spec.budget.min}/hr`
        : 'Rate negotiable';
      return (
        <div className="space-y-0.5">
          <div className="font-semibold">{hourlyRate}</div>
          <div className="text-xs text-muted-foreground">{spec.weeklyHours} hrs/week • Hourly</div>
        </div>
      );
    }

    return 'Contact for price';
  }, [spec]);

  // Format estimated duration
  const formatDuration = useMemo(() => {
    if (!spec?.estimatedDuration) return null;
    const { value, unit } = spec.estimatedDuration;
    return `${value} ${unit}`;
  }, [spec?.estimatedDuration]);

  // Calculate days remaining
  const daysRemaining = useMemo(() => {
    const deadline = new Date(tender.deadline);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [tender.deadline]);

  // Get match score (mock for now - would come from ML in production)
  const matchScore = useMemo(() => Math.floor(Math.random() * 30) + 70, []);

  // Get badge classes
  const getUrgencyBadgeClasses = () => {
    return cn(
      colorClasses.bg.amber,
      colorClasses.text.gray800,
      colorClasses.border.amber
    );
  };

  const getDaysRemainingBadgeClasses = () => {
    if (daysRemaining <= 3) {
      return cn(
        colorClasses.bg.amber,
        colorClasses.text.gray800,
        colorClasses.border.amber
      );
    }
    return cn(
      colorClasses.bg.gold,
      colorClasses.text.darkNavy,
      colorClasses.border.gold
    );
  };

  const getEngagementTypeBadgeClasses = () => {
    return spec?.engagementType === 'fixed_price'
      ? cn(colorClasses.bg.emeraldLight, colorClasses.text.emerald, colorClasses.border.emerald)
      : cn(colorClasses.bg.blueLight, colorClasses.text.blue, colorClasses.border.blue);
  };

  const getExperienceLevelBadgeClasses = () => {
    const level = spec?.experienceLevel;
    if (level === 'entry') return cn(colorClasses.bg.greenLight, colorClasses.text.green, colorClasses.border.green);
    if (level === 'intermediate') return cn(colorClasses.bg.blueLight, colorClasses.text.blue, colorClasses.border.blue);
    if (level === 'expert') return cn(colorClasses.bg.purpleLight, colorClasses.text.purple, colorClasses.border.purple);
    return cn(colorClasses.bg.gray200, colorClasses.text.gray700, colorClasses.border.gray200);
  };

  const getProjectTypeBadgeClasses = () => {
    const type = spec?.projectType;
    if (type === 'one_time') return cn(colorClasses.bg.amberLight, colorClasses.text.amber, colorClasses.border.amber);
    if (type === 'ongoing') return cn(colorClasses.bg.tealLight, colorClasses.text.teal, colorClasses.border.teal);
    if (type === 'complex') return cn(colorClasses.bg.roseLight, colorClasses.text.rose, colorClasses.border.rose);
    return cn(colorClasses.bg.gray200, colorClasses.text.gray700, colorClasses.border.gray200);
  };

  // Size-based styling
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'p-3';
      case 'large':
        return 'p-5';
      default:
        return 'p-4';
    }
  };

  // Grid View
  if (variant === 'grid') {
    return (
      <Card className={cn(
        "overflow-hidden border transition-all duration-300 hover:shadow-lg group",
        colorClasses.border.secondary,
        "hover:border-emerald-300 dark:hover:border-emerald-700",
        size === 'large' ? 'h-full' : '',
        className
      )}>
        {/* Gradient Header with Match Score */}
        <div className="relative">
          <div
            className="h-2 w-full"
            style={{
              background: `linear-gradient(90deg, ${colors.teal}20 0%, ${colors.blue}20 100%)`
            }}
          />
          {user && (
            <div className="absolute top-2 right-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1",
                      colorClasses.bg.emerald600,
                      "text-white"
                    )}>
                      <TrendingUp className="h-3 w-3" />
                      {matchScore}% Match
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Based on your skills and profile</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>

        <CardHeader className={cn("pb-2", getSizeClasses())}>
          <div className="flex justify-between items-start gap-2">
            <div className="space-y-1 flex-1 min-w-0">
              <h3 className={cn(
                "font-semibold line-clamp-2 pr-8",
                colorClasses.text.primary,
                size === 'small' ? 'text-base' : 'text-lg',
                size === 'large' ? 'text-xl' : ''
              )}>
                {tender.title}
              </h3>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className={cn("text-xs", getEngagementTypeBadgeClasses())}>
                  {spec?.engagementType === 'fixed_price' ? 'Fixed Price' : 'Hourly'}
                </Badge>
                {spec?.experienceLevel && (
                  <Badge variant="outline" className={cn("text-xs", getExperienceLevelBadgeClasses())}>
                    <Award className="h-3 w-3 mr-1" />
                    {spec.experienceLevel}
                  </Badge>
                )}
                {spec?.projectType && (
                  <Badge variant="outline" className={cn("text-xs", getProjectTypeBadgeClasses())}>
                    <Briefcase className="h-3 w-3 mr-1" />
                    {spec.projectType === 'one_time' && 'One-time'}
                    {spec.projectType === 'ongoing' && 'Ongoing'}
                    {spec.projectType === 'complex' && 'Complex'}
                  </Badge>
                )}
              </div>
            </div>
            {onToggleSave && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleSave();
                }}
                className={cn(
                  "h-8 w-8 shrink-0",
                  isSaved ? colorClasses.text.amber : colorClasses.text.gray300,
                  "hover:text-emerald-600 dark:hover:text-emerald-400"
                )}
              >
                <Bookmark className={cn(
                  "h-4 w-4",
                  isSaved && "fill-current"
                )} />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className={cn("space-y-3", getSizeClasses())}>
          {/* Budget & Timeline */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className={cn("flex items-center gap-1 text-xs", colorClasses.text.muted)}>
                <DollarSign className="h-3 w-3" />
                <span>Budget</span>
              </div>
              <div className="text-sm font-medium">
                {formatBudget}
              </div>
            </div>

            <div className="space-y-1">
              <div className={cn("flex items-center gap-1 text-xs", colorClasses.text.muted)}>
                <Clock className="h-3 w-3" />
                <span>Deadline</span>
              </div>
              <div className={cn(
                "text-sm font-medium",
                daysRemaining <= 3 && daysRemaining > 0 && colorClasses.text.amber,
                daysRemaining <= 0 && colorClasses.text.red
              )}>
                {formatDeadline(tender.deadline)}
              </div>
            </div>
          </div>

          {/* Skills */}
          {tender.skillsRequired && tender.skillsRequired.length > 0 && (
            <div className="space-y-1.5">
              <p className={cn("text-xs font-medium", colorClasses.text.muted)}>Required Skills</p>
              <div className="flex flex-wrap gap-1">
                {tender.skillsRequired.slice(0, size === 'small' ? 2 : 3).map((skill, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className={cn("text-xs py-0.5", colorClasses.bg.secondary, colorClasses.text.primary)}
                  >
                    {skill}
                  </Badge>
                ))}
                {tender.skillsRequired.length > (size === 'small' ? 2 : 3) && (
                  <Badge variant="outline" className={cn("text-xs py-0.5", colorClasses.text.muted)}>
                    +{tender.skillsRequired.length - (size === 'small' ? 2 : 3)}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Additional Freelance Details */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Estimated Duration */}
            {formatDuration && (
              <div className={cn("flex items-center gap-1", colorClasses.text.secondary)}>
                <Hourglass className="h-3 w-3" />
                <span>{formatDuration}</span>
              </div>
            )}

            {/* Weekly Hours (for hourly) */}
            {spec?.engagementType === 'hourly' && spec?.weeklyHours && (
              <div className={cn("flex items-center gap-1", colorClasses.text.secondary)}>
                <Calendar className="h-3 w-3" />
                <span>{spec.weeklyHours} hrs/wk</span>
              </div>
            )}

            {/* Language Preference */}
            {spec?.languagePreference && (
              <div className={cn("flex items-center gap-1", colorClasses.text.secondary)}>
                <Globe className="h-3 w-3" />
                <span>{spec.languagePreference}</span>
              </div>
            )}

            {/* Timezone Preference */}
            {spec?.timezonePreference && (
              <div className={cn("flex items-center gap-1", colorClasses.text.secondary)}>
                <MapPin className="h-3 w-3" />
                <span>{spec.timezonePreference}</span>
              </div>
            )}
          </div>

          {/* Requirements Icons */}
          <div className="flex items-center gap-2 pt-1">
            {spec?.ndaRequired && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn("p-1 rounded-full", colorClasses.bg.amberLight)}>
                      <Shield className={cn("h-3 w-3", colorClasses.text.amber)} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>NDA Required</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {spec?.portfolioRequired && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn("p-1 rounded-full", colorClasses.bg.blueLight)}>
                      <FileText className={cn("h-3 w-3", colorClasses.text.blue)} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Portfolio Required</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {spec?.urgency === 'urgent' && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn("p-1 rounded-full", colorClasses.bg.amberLight)}>
                      <Zap className={cn("h-3 w-3", colorClasses.text.amber)} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Urgent Project</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {spec?.screeningQuestions && spec.screeningQuestions.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn("p-1 rounded-full", colorClasses.bg.purpleLight)}>
                      <Users className={cn("h-3 w-3", colorClasses.text.purple)} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{spec.screeningQuestions.length} screening question(s)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {isActive && daysRemaining >= 0 && (
              <Badge
                variant={daysRemaining <= 3 ? 'destructive' : 'outline'}
                className={cn("text-xs py-0.5", getDaysRemainingBadgeClasses())}
              >
                <Clock className="h-3 w-3 mr-1" />
                {daysRemaining === 0 ? 'Today' : `${daysRemaining}d left`}
              </Badge>
            )}
            <Badge className={cn("text-xs py-0.5", getStatusColor(tender.status))}>
              {tender.status.replace('_', ' ')}
            </Badge>
            {tender.metadata?.totalApplications > 0 && (
              <Badge variant="outline" className={cn("text-xs py-0.5", colorClasses.text.muted)}>
                <Users className="h-3 w-3 mr-1" />
                {tender.metadata.totalApplications} bid{tender.metadata.totalApplications !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {/* Progress Bar (optional) */}
          {isActive && daysRemaining > 0 && daysRemaining < 14 && (
            <Progress
              value={Math.min(100, (14 - daysRemaining) * 7.14)}
              className="h-1"
            />
          )}
        </CardContent>

        <CardFooter className={cn("pt-2 border-t", colorClasses.border.secondary, getSizeClasses())}>
          <Button
            onClick={handleViewDetails}
            className={cn(
              "w-full text-white group-hover:shadow-md transition-shadow",
              colorClasses.bg.emerald600,
              "hover:bg-emerald-700 dark:hover:bg-emerald-600"
            )}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // List View
  return (
    <Card className={cn(
      "w-full border transition-all duration-300 hover:shadow-md group",
      colorClasses.border.secondary,
      "hover:border-emerald-300 dark:hover:border-emerald-700",
      className
    )}>
      <CardContent className={cn("p-4 sm:p-5", getSizeClasses())}>
        <div className="flex flex-col md:flex-row md:items-start gap-4">
          {/* Left Section - Main Info */}
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className={cn(
                    "font-semibold text-base sm:text-lg line-clamp-1",
                    colorClasses.text.primary
                  )}>
                    {tender.title}
                  </h3>
                  {spec?.urgency === 'urgent' && (
                    <Badge className={getUrgencyBadgeClasses()}>
                      <Zap className="h-3 w-3 mr-1" />
                      Urgent
                    </Badge>
                  )}
                  {user && (
                    <Badge className={cn(
                      "ml-auto md:ml-0",
                      colorClasses.bg.emerald600,
                      "text-white"
                    )}>
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {matchScore}% Match
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={getEngagementTypeBadgeClasses()}>
                    {spec?.engagementType === 'fixed_price' ? 'Fixed Price' : 'Hourly'}
                  </Badge>
                  {spec?.experienceLevel && (
                    <Badge variant="outline" className={getExperienceLevelBadgeClasses()}>
                      <Award className="h-3 w-3 mr-1" />
                      {spec.experienceLevel}
                    </Badge>
                  )}
                  {spec?.projectType && (
                    <Badge variant="outline" className={getProjectTypeBadgeClasses()}>
                      <Briefcase className="h-3 w-3 mr-1" />
                      {spec.projectType === 'one_time' && 'One-time'}
                      {spec.projectType === 'ongoing' && 'Ongoing'}
                      {spec.projectType === 'complex' && 'Complex'}
                    </Badge>
                  )}
                </div>
              </div>

              {onToggleSave && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleSave();
                  }}
                  className={cn(
                    "h-8 w-8 shrink-0",
                    isSaved ? colorClasses.text.amber : colorClasses.text.muted,
                    "hover:text-emerald-600 dark:hover:text-emerald-400"
                  )}
                >
                  <Bookmark className={cn(
                    "h-4 w-4",
                    isSaved && "fill-current"
                  )} />
                </Button>
              )}
            </div>

            <p className={cn("text-sm line-clamp-2", colorClasses.text.secondary)}>
              {tender.description}
            </p>

            {/* Skills */}
            {tender.skillsRequired && tender.skillsRequired.length > 0 && (
              <div className="space-y-1.5">
                <p className={cn("text-xs font-medium", colorClasses.text.muted)}>Required Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {tender.skillsRequired.slice(0, 8).map((skill, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className={cn("text-xs py-0.5", colorClasses.bg.secondary, colorClasses.text.primary)}
                    >
                      {skill}
                    </Badge>
                  ))}
                  {tender.skillsRequired.length > 8 && (
                    <Badge variant="outline" className={cn("text-xs py-0.5", colorClasses.text.muted)}>
                      +{tender.skillsRequired.length - 8}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Additional Details Row */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {/* Estimated Duration */}
              {formatDuration && (
                <div className={cn("flex items-center gap-1", colorClasses.text.secondary)}>
                  <Hourglass className="h-3 w-3" />
                  <span>{formatDuration}</span>
                </div>
              )}

              {/* Weekly Hours */}
              {spec?.engagementType === 'hourly' && spec?.weeklyHours && (
                <div className={cn("flex items-center gap-1", colorClasses.text.secondary)}>
                  <Calendar className="h-3 w-3" />
                  <span>{spec.weeklyHours} hrs/wk</span>
                </div>
              )}

              {/* Language */}
              {spec?.languagePreference && (
                <div className={cn("flex items-center gap-1", colorClasses.text.secondary)}>
                  <Globe className="h-3 w-3" />
                  <span>{spec.languagePreference}</span>
                </div>
              )}

              {/* Timezone */}
              {spec?.timezonePreference && (
                <div className={cn("flex items-center gap-1", colorClasses.text.secondary)}>
                  <MapPin className="h-3 w-3" />
                  <span>{spec.timezonePreference}</span>
                </div>
              )}

              {/* NDA */}
              {spec?.ndaRequired && (
                <div className={cn("flex items-center gap-1", colorClasses.text.amber)}>
                  <Shield className="h-3 w-3" />
                  <span>NDA</span>
                </div>
              )}

              {/* Portfolio */}
              {spec?.portfolioRequired && (
                <div className={cn("flex items-center gap-1", colorClasses.text.blue)}>
                  <FileText className="h-3 w-3" />
                  <span>Portfolio</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Section - Stats & Actions */}
          <div className="md:w-64 space-y-3">
            {/* Budget */}
            <div className="p-3 rounded-lg border bg-gray-50 dark:bg-gray-800/50">
              <div className="text-xs text-muted-foreground mb-1">Budget</div>
              <div className="font-semibold text-lg">
                {formatBudget}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-2 rounded-lg border">
                <div className={cn("text-xs", colorClasses.text.muted)}>Deadline</div>
                <div className={cn(
                  "font-medium text-sm",
                  daysRemaining <= 3 && daysRemaining > 0 && colorClasses.text.amber,
                  daysRemaining <= 0 && colorClasses.text.red
                )}>
                  {formatDeadline(tender.deadline)}
                </div>
              </div>

              <div className="text-center p-2 rounded-lg border">
                <div className={cn("text-xs", colorClasses.text.muted)}>Proposals</div>
                <div className="font-medium text-sm">
                  {tender.metadata?.totalApplications || 0}
                </div>
              </div>
            </div>

            {/* Days Remaining Badge */}
            {isActive && daysRemaining >= 0 && (
              <Badge
                variant={daysRemaining <= 3 ? 'destructive' : 'outline'}
                className={cn("w-full justify-center py-1.5", getDaysRemainingBadgeClasses())}
              >
                <Clock className="h-3 w-3 mr-1" />
                {daysRemaining === 0 ? 'Ends Today' : `${daysRemaining} days left`}
              </Badge>
            )}

            {/* Action Button */}
            <Button
              onClick={handleViewDetails}
              className={cn(
                "w-full text-white group-hover:shadow-md transition-shadow",
                colorClasses.bg.emerald600,
                "hover:bg-emerald-700 dark:hover:bg-emerald-600"
              )}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FreelancerTenderCard;