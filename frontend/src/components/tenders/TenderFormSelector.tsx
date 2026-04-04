// src/components/tender/TenderFormSelector.tsx
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Button } from '@/components/social/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  CheckCircle2,
  Briefcase,
  Building2,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Zap,
  Target,
  Scale,
  Rocket,
  Star,
  Award,
  Timer,
  ShieldCheck,
  FileCheck,
  BarChart3,
  Users2,
  Globe2,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';

interface TenderFormSelectorProps {
  onSelect?: (type: 'freelance' | 'professional') => void;
}

// Static data - memoized to prevent re-renders
const COMPARISON_ROWS = [
  {
    feature: 'Target Audience',
    freelance: 'Individual freelancers & small teams',
    freelanceIcon: '👥',
    professional: 'Registered companies only',
    professionalIcon: '🏢'
  },
  {
    feature: 'Project Duration',
    freelance: 'Hours to weeks (quick turnaround)',
    freelanceIcon: '⚡',
    professional: 'Weeks to years (long-term contracts)',
    professionalIcon: '📅'
  },
  {
    feature: 'Budget Range',
    freelance: '$100 - $50,000+ (flexible pricing)',
    freelanceIcon: '💰',
    professional: '$10,000 - Millions (large budgets)',
    professionalIcon: '💎'
  },
  {
    feature: 'Legal Requirements',
    freelance: 'Basic terms & conditions',
    freelanceIcon: '📝',
    professional: 'Full legal compliance & contracts',
    professionalIcon: '⚖️'
  },
  {
    feature: 'Evaluation Process',
    freelance: 'Simple rating & review system',
    freelanceIcon: '⭐',
    professional: 'Formal committee evaluation',
    professionalIcon: '🏛️'
  },
  {
    feature: 'Payment Terms',
    freelance: 'Flexible (milestones, hourly)',
    freelanceIcon: '💳',
    professional: 'Strict (invoices, milestones)',
    professionalIcon: '📊'
  },
  {
    feature: 'Time to Launch',
    freelance: '5-15 minutes (quick setup)',
    freelanceIcon: '🚀',
    professional: '1-3 days (thorough review)',
    professionalIcon: '🔄'
  }
];

const FREELANCE_REQUIREMENTS = [
  { text: 'Project title and detailed description', icon: '📝' },
  { text: 'Budget range and timeline', icon: '💰' },
  { text: 'Required skills and experience level', icon: '🎯' },
  { text: 'Optional screening questions', icon: '❓' }
];

const PROFESSIONAL_REQUIREMENTS = [
  { text: 'Detailed project specifications', icon: '📋' },
  { text: 'Legal and compliance documents', icon: '⚖️' },
  { text: 'Evaluation criteria and weights', icon: '📊' },
  { text: 'Project timeline and milestones', icon: '📅' }
];

// Helper component for features
const FeatureItem = ({
  icon,
  text,
  description,
  type = 'freelance'
}: {
  icon: React.ReactNode;
  text: string;
  description?: string;
  type?: 'freelance' | 'professional';
}) => (
  <div className="flex items-start gap-3">
    <div className={cn(
      "rounded-full p-2 shrink-0 mt-0.5",
      type === 'freelance'
        ? colorClasses.bg.emeraldLight
        : colorClasses.bg.blueLight
    )}>
      <div className={cn(
        "w-4 h-5",
        type === 'freelance'
          ? colorClasses.text.emerald
          : colorClasses.text.blue
      )}>
        {icon}
      </div>
    </div>
    <div>
      <p className={cn(
        "font-medium text-sm",
        colorClasses.text.primary
      )}>
        {text}
      </p>
      {description && (
        <p className={cn(
          "text-xs mt-1",
          colorClasses.text.muted
        )}>
          {description}
        </p>
      )}
    </div>
  </div>
);

export function TenderFormSelector({ onSelect }: TenderFormSelectorProps) {
  const [selectedType, setSelectedType] = useState<'freelance' | 'professional' | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const router = useRouter();
  const { breakpoint, isTouch, getTouchTargetSize } = useResponsive();

  // Derived breakpoint checks
  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet';

  // Touch target size for interactive elements
  const touchTargetSize = getTouchTargetSize('lg');

  const handleSelect = (type: 'freelance' | 'professional') => {
    setSelectedType(type);
    setShowConfirmDialog(true);
  };

  const handleConfirm = () => {
    if (selectedType && onSelect) {
      onSelect(selectedType);
    } else if (selectedType) {
      router.push(`/tenders/create/${selectedType}`);
    }
    setShowConfirmDialog(false);
  };

  return (
    <div className={cn(
      "min-h-screen",
      colorClasses.bg.secondary
    )}>
      <div className={cn(
        "container mx-auto px-4",
        isMobile ? "py-6" : "py-8 md:py-12",
        "max-w-6xl"
      )}>
        {/* Hero Section */}
        <div className={cn(
          "text-center",
          isMobile ? "space-y-4 mb-8" : "space-y-6 md:space-y-8 mb-12 md:mb-16"
        )}>
          <div className="relative">
            {/* Background blur effects - hidden on mobile */}
            {!isMobile && (
              <>
                <div className="absolute -top-8 -left-8 w-32 h-32 bg-linear-to-br from-emerald-500/20 to-blue-500/20 rounded-full blur-2xl" />
                <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-linear-to-tr from-blue-500/20 to-amber-500/20 rounded-full blur-2xl" />
              </>
            )}

            <div className="relative">
              <Badge className={cn(
                "mb-4 border-0 px-4 py-1.5",
                "bg-linear-to-r from-emerald-600 to-blue-600",
                colorClasses.text.white,
                "mx-auto w-fit"
              )}>
                <Sparkles className="h-3 w-3 mr-2" />
                <span className="text-xs">NEW • Streamlined Creation Process</span>
              </Badge>

              <h1 className={cn(
                "font-bold tracking-tight mb-4",
                isMobile ? "text-2xl" : "text-3xl sm:text-4xl md:text-5xl",
                colorClasses.text.primary
              )}>
                Create Your Perfect Tender
              </h1>
              <p className={cn(
                "mx-auto",
                isMobile ? "text-sm max-w-full" : "text-base md:text-lg lg:text-xl max-w-3xl",
                colorClasses.text.muted
              )}>
                Choose the tender type that matches your project requirements. Each option is designed
                for specific needs with tailored workflows and target audiences.
              </p>
            </div>
          </div>

          {/* Stats badges */}
          <div className={cn(
            "flex gap-2",
            isMobile ? "flex-col" : "flex-row items-center justify-center"
          )}>
            <Badge variant="outline" className={cn(
              "gap-2 px-4 py-2",
              "w-full sm:w-auto justify-center",
              colorClasses.border.gray100,
              colorClasses.text.secondary
            )}>
              <Timer className={cn("h-3 w-4", colorClasses.text.emerald)} />
              <span className="text-xs font-medium">Average setup: 5-15 minutes</span>
            </Badge>
            <Badge variant="outline" className={cn(
              "gap-2 px-4 py-2",
              "w-full sm:w-auto justify-center",
              colorClasses.border.gray100,
              colorClasses.text.secondary
            )}>
              <Target className={cn("h-3 w-4", colorClasses.text.blue)} />
              <span className="text-xs font-medium">98% satisfaction rate</span>
            </Badge>
            <Badge variant="outline" className={cn(
              "gap-2 px-4 py-2",
              "w-full sm:w-auto justify-center",
              colorClasses.border.gray100,
              colorClasses.text.secondary
            )}>
              <Award className={cn("h-3 w-4", colorClasses.text.amber)} />
              <span className="text-xs font-medium">Industry-leading features</span>
            </Badge>
          </div>
        </div>

        {/* Tender Type Cards */}
        <div className={cn(
          "grid gap-4",
          isMobile ? "grid-cols-1" : "lg:grid-cols-2 md:gap-6 lg:gap-8",
          isMobile ? "mb-8" : "mb-12 md:mb-16"
        )}>
          {/* Freelance Tender Card */}
          <Card className={cn(
            "relative overflow-hidden",
            colorClasses.bg.primary,
            colorClasses.border.gray100,
            "hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          )}>
            {/* Corner Ribbon */}
            <div className="absolute top-0 right-0 z-10">
              <div className={cn(
                "text-white px-3 py-1.5 rounded-bl-lg text-xs font-bold",
                "bg-linear-to-br from-emerald-600 to-blue-600"
              )}>
                <div className="flex items-center gap-1">
                  <Rocket className="h-3 w-3" />
                  <span>MOST POPULAR</span>
                </div>
              </div>
            </div>

            <CardHeader className={cn(
              "p-4 pb-2",
              !isMobile && "md:p-6 md:pb-4"
            )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "rounded-lg p-2",
                  colorClasses.bg.emerald
                )}>
                  <Briefcase className={cn(
                    "text-white",
                    isMobile ? "h-5 w-5" : "h-6 w-6 md:h-8 md:w-8"
                  )} />
                </div>
                <div>
                  <CardTitle className={cn(
                    "font-bold",
                    isMobile ? "text-lg" : "text-xl md:text-2xl lg:text-3xl",
                    colorClasses.text.primary
                  )}>
                    Freelance Tender
                  </CardTitle>
                  <CardDescription className={cn(
                    isMobile ? "text-xs" : "text-sm md:text-base",
                    colorClasses.text.muted
                  )}>
                    Perfect for quick projects with individual contributors
                  </CardDescription>
                </div>
              </div>

              {/* Quick Stats */}
              <div className={cn(
                "flex mt-4",
                isMobile ? "flex-wrap gap-3" : "flex-row items-center gap-4 md:gap-6"
              )}>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "font-bold",
                    isMobile ? "text-lg" : "text-xl md:text-2xl",
                    colorClasses.text.emerald
                  )}>
                    24H
                  </div>
                  <div className={cn("text-xs", colorClasses.text.emerald)}>First Response</div>
                </div>
                {!isMobile && <Separator orientation="vertical" className="h-8" />}
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "font-bold",
                    isMobile ? "text-lg" : "text-xl md:text-2xl",
                    colorClasses.text.emerald
                  )}>
                    95%
                  </div>
                  <div className={cn("text-xs", colorClasses.text.emerald)}>Fill Rate</div>
                </div>
                {!isMobile && <Separator orientation="vertical" className="h-8" />}
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "font-bold",
                    isMobile ? "text-lg" : "text-xl md:text-2xl",
                    colorClasses.text.emerald
                  )}>
                    $50K
                  </div>
                  <div className={cn("text-xs", colorClasses.text.emerald)}>Avg. Project</div>
                </div>
              </div>
            </CardHeader>

            <CardContent className={cn(
              "p-4 pt-0",
              !isMobile && "md:p-6 md:pt-0"
            )}>
              <div className="space-y-3">
                <h4 className={cn(
                  "font-semibold text-xs uppercase tracking-wider",
                  colorClasses.text.emerald
                )}>
                  🚀 Key Features
                </h4>
                <div className="space-y-3">
                  <FeatureItem
                    icon={<Zap className="h-4 w-4" />}
                    text="Lightning-Fast Setup"
                    description="Get your tender live in minutes with our simplified form"
                    type="freelance"
                  />
                  <FeatureItem
                    icon={<Users2 className="h-4 w-4" />}
                    text="Global Talent Pool"
                    description="Access millions of skilled freelancers worldwide"
                    type="freelance"
                  />
                  <FeatureItem
                    icon={<Globe2 className="h-4 w-4" />}
                    text="Flexible Work Models"
                    description="Hourly, fixed-price, or milestone-based payments"
                    type="freelance"
                  />
                  <FeatureItem
                    icon={<Clock className="h-4 w-4" />}
                    text="Quick Turnaround"
                    description="Projects completed in hours to weeks"
                    type="freelance"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className={cn(
              "p-4 pt-0",
              !isMobile && "md:p-6 md:pt-0"
            )}>
              <Button
                onClick={() => handleSelect('freelance')}
                className={cn(
                  "w-full font-bold gap-2",
                  colorClasses.bg.emerald,
                  colorClasses.text.white,
                  "hover:bg-emerald-700 dark:hover:bg-emerald-600",
                  touchTargetSize,
                  isMobile ? "text-sm" : "text-base md:text-lg"
                )}
              >
                <Briefcase className={isMobile ? "h-4 w-4" : "h-5 w-5"} />
                <span>Create Freelance Tender</span>
                <ChevronRight className={isMobile ? "h-4 w-4" : "h-5 w-5"} />
              </Button>
            </CardFooter>
          </Card>

          {/* Professional Tender Card */}
          <Card className={cn(
            "relative overflow-hidden",
            colorClasses.bg.primary,
            colorClasses.border.gray100,
            "hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          )}>
            {/* Corner Ribbon */}
            <div className="absolute top-0 right-0 z-10">
              <div className={cn(
                "text-white px-3 py-1.5 rounded-bl-lg text-xs font-bold",
                "bg-linear-to-br from-blue-600 to-emerald-600"
              )}>
                <div className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  <span>ENTERPRISE GRADE</span>
                </div>
              </div>
            </div>

            <CardHeader className={cn(
              "p-4 pb-2",
              !isMobile && "md:p-6 md:pb-4"
            )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "rounded-lg p-2",
                  colorClasses.bg.blue
                )}>
                  <Building2 className={cn(
                    "text-white",
                    isMobile ? "h-5 w-5" : "h-6 w-6 md:h-8 md:w-8"
                  )} />
                </div>
                <div>
                  <CardTitle className={cn(
                    "font-bold",
                    isMobile ? "text-lg" : "text-xl md:text-2xl lg:text-3xl",
                    colorClasses.text.primary
                  )}>
                    Professional Tender
                  </CardTitle>
                  <CardDescription className={cn(
                    isMobile ? "text-xs" : "text-sm md:text-base",
                    colorClasses.text.muted
                  )}>
                    For complex projects requiring formal procurement
                  </CardDescription>
                </div>
              </div>

              {/* Quick Stats */}
              <div className={cn(
                "flex mt-4",
                isMobile ? "flex-wrap gap-3" : "flex-row items-center gap-4 md:gap-6"
              )}>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "font-bold",
                    isMobile ? "text-lg" : "text-xl md:text-2xl",
                    colorClasses.text.blue
                  )}>
                    $100K+
                  </div>
                  <div className={cn("text-xs", colorClasses.text.blue)}>Avg. Value</div>
                </div>
                {!isMobile && <Separator orientation="vertical" className="h-8" />}
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "font-bold",
                    isMobile ? "text-lg" : "text-xl md:text-2xl",
                    colorClasses.text.blue
                  )}>
                    30D+
                  </div>
                  <div className={cn("text-xs", colorClasses.text.blue)}>Duration</div>
                </div>
                {!isMobile && <Separator orientation="vertical" className="h-8" />}
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "font-bold",
                    isMobile ? "text-lg" : "text-xl md:text-2xl",
                    colorClasses.text.blue
                  )}>
                    99.9%
                  </div>
                  <div className={cn("text-xs", colorClasses.text.blue)}>Compliance</div>
                </div>
              </div>
            </CardHeader>

            <CardContent className={cn(
              "p-4 pt-0",
              !isMobile && "md:p-6 md:pt-0"
            )}>
              <div className="space-y-3">
                <h4 className={cn(
                  "font-semibold text-xs uppercase tracking-wider",
                  colorClasses.text.blue
                )}>
                  🏢 Enterprise Features
                </h4>
                <div className="space-y-3">
                  <FeatureItem
                    icon={<ShieldCheck className="h-4 w-4" />}
                    text="Full Legal Compliance"
                    description="Built-in regulatory and compliance requirements"
                    type="professional"
                  />
                  <FeatureItem
                    icon={<FileCheck className="h-4 w-4" />}
                    text="Comprehensive Documentation"
                    description="Detailed specifications and formal requirements"
                    type="professional"
                  />
                  <FeatureItem
                    icon={<BarChart3 className="h-4 w-4" />}
                    text="Advanced Analytics"
                    description="Detailed reporting and evaluation metrics"
                    type="professional"
                  />
                  <FeatureItem
                    icon={<Scale className="h-4 w-4" />}
                    text="Formal Procurement"
                    description="Strict bidding process with evaluation committees"
                    type="professional"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className={cn(
              "p-4 pt-0",
              !isMobile && "md:p-6 md:pt-0"
            )}>
              <Button
                onClick={() => handleSelect('professional')}
                className={cn(
                  "w-full font-bold gap-2",
                  colorClasses.bg.blue,
                  colorClasses.text.white,
                  "hover:bg-blue-700 dark:hover:bg-blue-600",
                  touchTargetSize,
                  isMobile ? "text-sm" : "text-base md:text-lg"
                )}
              >
                <Building2 className={isMobile ? "h-4 w-4" : "h-5 w-5"} />
                <span>Create Professional Tender</span>
                <ChevronRight className={isMobile ? "h-4 w-4" : "h-5 w-5"} />
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Comparison Section */}
        <Card className={cn(
          "mb-8 md:mb-16 border overflow-hidden",
          colorClasses.bg.primary,
          colorClasses.border.gray100,
          "shadow-sm"
        )}>
          <div className={cn(
            "bg-linear-to-r from-gray-900 to-gray-800",
            isMobile ? "p-4" : "p-6 md:p-8"
          )}>
            <CardTitle className={cn(
              "font-bold text-center",
              isMobile ? "text-xl" : "text-2xl md:text-3xl",
              colorClasses.text.white
            )}>
              Detailed Comparison Matrix
            </CardTitle>
            <CardDescription className={cn(
              "text-center mt-2",
              isMobile ? "text-sm" : "text-base md:text-lg",
              "text-gray-300"
            )}>
              Make an informed decision with our detailed feature comparison
            </CardDescription>
          </div>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className={cn(
                        isMobile ? "px-3 py-2 text-xs" : "px-4 py-3 md:px-6 md:py-4 text-xs md:text-sm",
                        "text-left font-semibold",
                        colorClasses.text.primary
                      )}>
                        Comparison Criteria
                      </th>
                      <th className={cn(
                        isMobile ? "px-3 py-2 text-xs" : "px-4 py-3 md:px-6 md:py-4 text-xs md:text-sm",
                        "text-left font-semibold",
                        colorClasses.text.emerald
                      )}>
                        Freelance Tender
                      </th>
                      <th className={cn(
                        isMobile ? "px-3 py-2 text-xs" : "px-4 py-3 md:px-6 md:py-4 text-xs md:text-sm",
                        "text-left font-semibold",
                        colorClasses.text.blue
                      )}>
                        Professional Tender
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {COMPARISON_ROWS.map((row, index) => (
                      <tr
                        key={index}
                        className={cn(
                          "hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
                          index % 2 === 0 ? colorClasses.bg.secondary : colorClasses.bg.primary
                        )}
                      >
                        <td className={cn(
                          isMobile ? "px-3 py-2 text-xs" : "px-4 py-3 md:px-6 md:py-4 text-xs md:text-sm",
                          "font-medium",
                          colorClasses.text.primary
                        )}>
                          {row.feature}
                        </td>
                        <td className={cn(
                          isMobile ? "px-3 py-2" : "px-4 py-3 md:px-6 md:py-4"
                        )}>
                          <div className="flex items-center gap-2">
                            <span className={isMobile ? "text-base" : "text-lg md:text-xl"}>{row.freelanceIcon}</span>
                            <span className={cn(
                              isMobile ? "text-xs" : "text-xs md:text-sm",
                              colorClasses.text.secondary
                            )}>
                              {row.freelance}
                            </span>
                          </div>
                        </td>
                        <td className={cn(
                          isMobile ? "px-3 py-2" : "px-4 py-3 md:px-6 md:py-4"
                        )}>
                          <div className="flex items-center gap-2">
                            <span className={isMobile ? "text-base" : "text-lg md:text-xl"}>{row.professionalIcon}</span>
                            <span className={cn(
                              isMobile ? "text-xs" : "text-xs md:text-sm",
                              colorClasses.text.secondary
                            )}>
                              {row.professional}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Horizontal scroll indicator for mobile */}
            {isMobile && (
              <p className={cn(
                "text-xs text-center mt-2 pb-2",
                colorClasses.text.muted
              )}>
                ← Scroll to see full comparison →
              </p>
            )}
          </CardContent>
          <CardFooter className={cn(
            "p-4 border-t",
            !isMobile && "md:p-6",
            colorClasses.bg.secondary,
            colorClasses.border.gray100
          )}>
            <div className="w-full text-center">
              <p className={cn(
                isMobile ? "text-xs" : "text-sm md:text-base",
                colorClasses.text.muted
              )}>
                Still unsure?{' '}
                <Button
                  variant="link"
                  className={cn(
                    "font-bold p-0 h-auto",
                    isMobile ? "text-xs" : "text-sm md:text-base",
                    colorClasses.text.emerald
                  )}
                >
                  Contact our team
                </Button>{' '}
                for personalized guidance
              </p>
            </div>
          </CardFooter>
        </Card>

        {/* Help Section */}
        <div className={cn(
          "text-center rounded-lg",
          "bg-linear-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800",
          colorClasses.border.gray100,
          "border",
          isMobile ? "p-4" : "p-6 md:p-8"
        )}>
          <div className="max-w-2xl mx-auto">
            <div className={cn(
              "mx-auto mb-4 rounded-full",
              colorClasses.bg.blue,
              "flex items-center justify-center",
              isMobile ? "w-12 h-12" : "w-16 h-16 md:w-20 md:h-20"
            )}>
              <Star className={cn(
                "text-white",
                isMobile ? "h-6 w-6" : "h-8 w-8 md:h-10 md:w-10"
              )} />
            </div>
            <h3 className={cn(
              "font-bold mb-3",
              isMobile ? "text-lg" : "text-xl md:text-2xl",
              colorClasses.text.primary
            )}>
              Need Expert Guidance?
            </h3>
            <p className={cn(
              "mb-4",
              isMobile ? "text-sm" : "text-sm md:text-base",
              colorClasses.text.muted
            )}>
              Our tender specialists are here to help you choose the right option
              and optimize your tender for maximum success.
            </p>
            <div className={cn(
              "flex gap-3 justify-center",
              isMobile ? "flex-col" : "flex-row"
            )}>
              <Button
                className={cn(
                  colorClasses.bg.blue,
                  colorClasses.text.white,
                  "hover:bg-blue-700 dark:hover:bg-blue-600",
                  touchTargetSize,
                  isMobile ? "w-full text-sm" : "w-auto"
                )}
              >
                Schedule Consultation
              </Button>
              <Button
                variant="outline"
                className={cn(
                  colorClasses.border.gray100,
                  colorClasses.text.secondary,
                  "hover:bg-gray-50 dark:hover:bg-gray-800",
                  touchTargetSize,
                  isMobile ? "w-full text-sm" : "w-auto"
                )}
              >
                View Success Stories
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className={cn(
          "w-[95vw] max-w-md rounded-lg",
          isMobile ? "p-4" : "p-4 md:p-6",
          colorClasses.bg.primary
        )}>
          <div className="absolute top-0 right-0">
            {selectedType === 'freelance' ? (
              <div className={cn(
                "text-white px-3 py-1.5 rounded-bl-lg",
                colorClasses.bg.emerald
              )}>
                <Briefcase className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
              </div>
            ) : (
              <div className={cn(
                "text-white px-3 py-1.5 rounded-bl-lg",
                colorClasses.bg.blue
              )}>
                <Building2 className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
              </div>
            )}
          </div>

          <DialogHeader className={cn(
            "space-y-3",
            isMobile ? "pt-6" : "pt-6 md:pt-8"
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                "rounded-lg p-2",
                selectedType === 'freelance' ? colorClasses.bg.emerald : colorClasses.bg.blue
              )}>
                {selectedType === 'freelance' ? (
                  <Briefcase className={cn("text-white", isMobile ? "h-4 w-4" : "h-5 w-5 md:h-6 md:w-6")} />
                ) : (
                  <Building2 className={cn("text-white", isMobile ? "h-4 w-4" : "h-5 w-5 md:h-6 md:w-6")} />
                )}
              </div>
              <DialogTitle className={cn(
                "font-bold",
                isMobile ? "text-base" : "text-lg md:text-xl",
                colorClasses.text.primary
              )}>
                {selectedType === 'freelance' ? 'Create Freelance Tender' : 'Create Professional Tender'}
              </DialogTitle>
            </div>
            <DialogDescription className={cn(
              isMobile ? "text-sm" : "text-sm md:text-base",
              colorClasses.text.muted
            )}>
              You`re about to create a{' '}
              <span className={cn(
                "font-bold",
                selectedType === 'freelance' ? colorClasses.text.emerald : colorClasses.text.blue
              )}>
                {selectedType === 'freelance' ? 'Freelance' : 'Professional'}
              </span>{' '}
              tender. Ready to proceed?
            </DialogDescription>
          </DialogHeader>

          <div className={cn(
            "space-y-4",
            isMobile ? "py-2" : "py-2 md:py-4"
          )}>
            <Alert className={cn(
              "border",
              selectedType === 'freelance'
                ? colorClasses.bg.emeraldLight
                : colorClasses.bg.blueLight,
              selectedType === 'freelance'
                ? colorClasses.border.emerald
                : colorClasses.border.blue
            )}>
              {selectedType === 'freelance' ? (
                <CheckCircle2 className={cn("h-4 w-4", colorClasses.text.emerald)} />
              ) : (
                <AlertCircle className={cn("h-4 w-4", colorClasses.text.blue)} />
              )}
              <AlertTitle className={cn(
                "text-sm font-bold",
                selectedType === 'freelance' ? colorClasses.text.emerald : colorClasses.text.blue
              )}>
                {selectedType === 'freelance' ? 'Best Practice' : 'Important Notice'}
              </AlertTitle>
              <AlertDescription className={cn(
                isMobile ? "text-xs" : "text-xs md:text-sm",
                selectedType === 'freelance' ? colorClasses.text.emerald : colorClasses.text.blue
              )}>
                {selectedType === 'freelance'
                  ? 'For best results, provide clear deliverables and acceptance criteria.'
                  : 'This tender type cannot be edited after publication. Please ensure all details are accurate.'
                }
              </AlertDescription>
            </Alert>

            <div className={cn(
              "rounded-lg border p-3",
              !isMobile && "md:p-4",
              colorClasses.border.gray100
            )}>
              <h4 className={cn(
                "font-bold mb-2",
                isMobile ? "text-sm" : "text-sm md:text-base",
                colorClasses.text.primary
              )}>
                📋 What You`ll Need:
              </h4>
              <ul className="space-y-1.5">
                {(selectedType === 'freelance' ? FREELANCE_REQUIREMENTS : PROFESSIONAL_REQUIREMENTS).map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className={isMobile ? "text-base" : "text-base md:text-lg shrink-0"}>{item.icon}</span>
                    <span className={cn(
                      isMobile ? "text-xs" : "text-xs md:text-sm",
                      colorClasses.text.secondary
                    )}>
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <DialogFooter className={cn(
            "flex gap-2 mt-2",
            isMobile ? "flex-col" : "flex-row sm:flex-row"
          )}>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className={cn(
                colorClasses.border.gray100,
                colorClasses.text.amber,
                "hover:bg-gray-50 dark:hover:bg-gray-800",
                touchTargetSize,
                isMobile ? "w-full text-sm" : "w-auto"
              )}
            >
              Go Back
            </Button>
            <Button
              onClick={handleConfirm}
              className={cn(
                "font-bold",
                selectedType === 'freelance'
                  ? colorClasses.bg.emerald
                  : colorClasses.bg.blue,
                colorClasses.text.white,
                "hover:bg-opacity-90",
                touchTargetSize,
                isMobile ? "w-full text-sm" : "w-auto"
              )}
            >
              {selectedType === 'freelance' ? (
                <>
                  <Briefcase className={isMobile ? "h-3 w-3 mr-1" : "h-4 w-4 md:h-5 md:w-5 mr-2"} />
                  Create Freelance
                </>
              ) : (
                <>
                  <Building2 className={isMobile ? "h-3 w-3 mr-1" : "h-4 w-4 md:h-5 md:w-5 mr-2"} />
                  Create Professional
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}