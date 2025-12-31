// src/components/tender/TenderFormSelector.tsx
'use client';

import { useState } from 'react';
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
  Check,
  X,
  Timer,
  ShieldCheck,
  FileCheck,
  BarChart3,
  Users2,
  Globe2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TenderFormSelectorProps {
  onSelect?: (type: 'freelance' | 'professional') => void;
}

export function TenderFormSelector({ onSelect }: TenderFormSelectorProps) {
  const [selectedType, setSelectedType] = useState<'freelance' | 'professional' | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const router = useRouter();

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

  const renderFeature = (icon: React.ReactNode, text: string, description?: string, color: 'success' | 'primary' = 'success') => (
    <div className="flex items-start gap-3">
      <div className={cn(
        "rounded-full p-2 mt-0.5",
        color === 'success' ? 'bg-[#0F766E]/10 text-[#0F766E]' : 'bg-[#1E40AF]/10 text-[#1E40AF]'
      )}>
        <div>{icon}</div>
      </div>
      <div>
        <p className="font-medium text-gray-900">{text}</p>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center space-y-8 mb-16 relative">
          <div className="relative">
            <div className="absolute -top-8 -left-8 w-32 h-32 bg-gradient-to-br from-[#0F766E]/20 to-[#1E40AF]/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-gradient-to-tr from-[#1E40AF]/20 to-[#F59E0B]/20 rounded-full blur-2xl" />

            <div className="relative">
              <Badge className="mb-6 bg-gradient-to-r from-[#0F766E] to-[#1E40AF] text-white border-0 px-4 py-1.5">
                <Sparkles className="h-3 w-3 mr-2" />
                NEW • Streamlined Creation Process
              </Badge>

              <h1 className="text-5xl font-bold tracking-tight mb-6 text-gray-900">
                Create Your Perfect Tender
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Choose the tender type that matches your project requirements. Each option is designed
                for specific needs with tailored workflows and target audiences.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Badge variant="outline" className="gap-2 px-4 py-1.5 border-[#E5E7EB] text-gray-700">
              <Timer className="h-4 w-4 text-[#0F766E]" />
              <span className="font-medium">Average setup: 5-15 minutes</span>
            </Badge>
            <Badge variant="outline" className="gap-2 px-4 py-1.5 border-[#E5E7EB] text-gray-700">
              <Target className="h-4 w-4 text-[#1E40AF]" />
              <span className="font-medium">98% satisfaction rate</span>
            </Badge>
            <Badge variant="outline" className="gap-2 px-4 py-1.5 border-[#E5E7EB] text-gray-700">
              <Award className="h-4 w-4 text-[#F59E0B]" />
              <span className="font-medium">Industry-leading features</span>
            </Badge>
          </div>
        </div>

        {/* Tender Type Cards */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {/* Freelance Tender Card */}
          <Card className="relative overflow-hidden border border-[#E5E7EB] hover:border-[#0F766E] transition-all duration-300 hover:shadow-lg bg-white">
            {/* Corner Ribbon */}
            <div className="absolute top-0 right-0">
              <div className="bg-gradient-to-br from-[#0F766E] to-[#1E40AF] text-white px-6 py-2 rounded-bl-lg">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <Rocket className="h-4 w-4" />
                  MOST POPULAR
                </div>
              </div>
            </div>

            <CardHeader className="pb-4 relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="rounded-lg bg-[#0F766E] p-3">
                  <Briefcase className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold text-gray-900">
                    Freelance Tender
                  </CardTitle>
                  <CardDescription className="text-base text-gray-600">
                    Perfect for quick projects with individual contributors
                  </CardDescription>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center gap-6 mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#0F766E]">24H</div>
                  <div className="text-xs text-[#0F766E]">First Response</div>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#0F766E]">95%</div>
                  <div className="text-xs text-[#0F766E]">Fill Rate</div>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#0F766E]">$50K</div>
                  <div className="text-xs text-[#0F766E]">Avg. Project</div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pb-6 relative z-10">
              <div className="space-y-6">
                {/* Features */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm uppercase tracking-wider text-[#0F766E]">
                    🚀 Key Features
                  </h4>
                  <div className="space-y-4">
                    {renderFeature(
                      <Zap className="h-5 w-5" />,
                      "Lightning-Fast Setup",
                      "Get your tender live in minutes with our simplified form",
                      'success'
                    )}
                    {renderFeature(
                      <Users2 className="h-5 w-5" />,
                      "Global Talent Pool",
                      "Access millions of skilled freelancers worldwide",
                      'success'
                    )}
                    {renderFeature(
                      <Globe2 className="h-5 w-5" />,
                      "Flexible Work Models",
                      "Hourly, fixed-price, or milestone-based payments",
                      'success'
                    )}
                    {renderFeature(
                      <Zap className="h-5 w-5" />,
                      "Quick Turnaround",
                      "Projects completed in hours to weeks",
                      'success'
                    )}
                  </div>
                </div>

                <Separator className="border-[#E5E7EB]" />

                {/* Best For */}
                <Alert className="bg-[#0F766E]/5 border-[#0F766E]/20">
                  <CheckCircle2 className="h-5 w-5 text-[#0F766E]" />
                  <AlertTitle className="text-[#0F766E] font-bold">
                    💡 Perfect For These Projects
                  </AlertTitle>
                  <AlertDescription className="text-[#0F766E]">
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        <span>Web Development</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        <span>Logo Design</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        <span>Content Writing</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        <span>Social Media</span>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>

            <CardFooter className="relative z-10">
              <Button
                onClick={() => handleSelect('freelance')}
                className="w-full h-14 text-lg font-bold gap-4 bg-[#0F766E] hover:bg-[#0F766E]/90 text-white"
              >
                <Briefcase className="h-6 w-6" />
                Create Freelance Tender
                <ChevronRight className="h-6 w-6" />
              </Button>
            </CardFooter>
          </Card>

          {/* Professional Tender Card */}
          <Card className="relative overflow-hidden border border-[#E5E7EB] hover:border-[#1E40AF] transition-all duration-300 hover:shadow-lg bg-white">
            {/* Corner Ribbon */}
            <div className="absolute top-0 right-0">
              <div className="bg-gradient-to-br from-[#1E40AF] to-[#0F766E] text-white px-6 py-2 rounded-bl-lg">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <ShieldCheck className="h-4 w-4" />
                  ENTERPRISE GRADE
                </div>
              </div>
            </div>

            <CardHeader className="pb-4 relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="rounded-lg bg-[#1E40AF] p-3">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold text-gray-900">
                    Professional Tender
                  </CardTitle>
                  <CardDescription className="text-base text-gray-600">
                    For complex projects requiring formal procurement
                  </CardDescription>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center gap-6 mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#1E40AF]">$100K+</div>
                  <div className="text-xs text-[#1E40AF]">Avg. Value</div>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#1E40AF]">30D+</div>
                  <div className="text-xs text-[#1E40AF]">Duration</div>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#1E40AF]">99.9%</div>
                  <div className="text-xs text-[#1E40AF]">Compliance</div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pb-6 relative z-10">
              <div className="space-y-6">
                {/* Features */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm uppercase tracking-wider text-[#1E40AF]">
                    🏢 Enterprise Features
                  </h4>
                  <div className="space-y-4">
                    {renderFeature(
                      <ShieldCheck className="h-5 w-5" />,
                      "Full Legal Compliance",
                      "Built-in regulatory and compliance requirements",
                      'primary'
                    )}
                    {renderFeature(
                      <FileCheck className="h-5 w-5" />,
                      "Comprehensive Documentation",
                      "Detailed specifications and formal requirements",
                      'primary'
                    )}
                    {renderFeature(
                      <BarChart3 className="h-5 w-5" />,
                      "Advanced Analytics",
                      "Detailed reporting and evaluation metrics",
                      'primary'
                    )}
                    {renderFeature(
                      <Scale className="h-5 w-5" />,
                      "Formal Procurement",
                      "Strict bidding process with evaluation committees",
                      'primary'
                    )}
                  </div>
                </div>

                <Separator className="border-[#E5E7EB]" />

                {/* Important Notes */}
                <Alert className="bg-[#1E40AF]/5 border-[#1E40AF]/20">
                  <AlertCircle className="h-5 w-5 text-[#1E40AF]" />
                  <AlertTitle className="text-[#1E40AF] font-bold">
                    ⚠️ Important Considerations
                  </AlertTitle>
                  <AlertDescription className="text-[#1E40AF]">
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center gap-2">
                        <X className="h-4 w-4 text-[#DC2626]" />
                        <span>Cannot be edited after publication</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <X className="h-4 w-4 text-[#DC2626]" />
                        <span>Requires comprehensive documentation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-[#0F766E]" />
                        <span>Formal evaluation process</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-[#0F766E]" />
                        <span>Legal protection and compliance</span>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>

            <CardFooter className="relative z-10">
              <Button
                onClick={() => handleSelect('professional')}
                className="w-full h-14 text-lg font-bold gap-4 bg-[#1E40AF] hover:bg-[#1E40AF]/90 text-white"
              >
                <Building2 className="h-6 w-6" />
                Create Professional Tender
                <ChevronRight className="h-6 w-6" />
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Comparison Section */}
        <Card className="mb-16 border border-[#E5E7EB] shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-8">
            <CardTitle className="text-3xl font-bold text-white text-center">
              Detailed Comparison Matrix
            </CardTitle>
            <CardDescription className="text-gray-300 text-center text-lg mt-2">
              Make an informed decision with our detailed feature comparison
            </CardDescription>
          </div>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E5E7EB]">
                    <th className="text-left p-6 font-bold text-lg bg-[#F8FAFC] text-gray-900">
                      Comparison Criteria
                    </th>
                    <th className="text-left p-6 font-bold text-lg bg-[#0F766E]/10 text-[#0F766E]">
                      Freelance Tender
                    </th>
                    <th className="text-left p-6 font-bold text-lg bg-[#1E40AF]/10 text-[#1E40AF]">
                      Professional Tender
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
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
                  ].map((row, index) => (
                    <tr key={index} className={cn(
                      "border-b border-[#E5E7EB] hover:bg-[#F8FAFC] transition-colors",
                      index % 2 === 0 && "bg-[#F8FAFC]/50"
                    )}>
                      <td className="p-6 font-bold text-gray-700">
                        {row.feature}
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{row.freelanceIcon}</div>
                          <div>
                            <div className="font-medium text-[#0F766E]">
                              {row.freelance}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{row.professionalIcon}</div>
                          <div>
                            <div className="font-medium text-[#1E40AF]">
                              {row.professional}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
          <CardFooter className="bg-[#F8FAFC] p-6 border-t border-[#E5E7EB]">
            <div className="w-full text-center">
              <p className="text-gray-600">
                Still unsure? <Button variant="link" className="text-lg font-bold text-[#0F766E]">Contact our team</Button> for personalized guidance
              </p>
            </div>
          </CardFooter>
        </Card>

        {/* Help Section */}
        <div className="text-center p-8 rounded-lg bg-gradient-to-r from-[#F8FAFC] to-white border border-[#E5E7EB]">
          <div className="max-w-2xl mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#1E40AF] flex items-center justify-center">
              <Star className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900">
              Need Expert Guidance?
            </h3>
            <p className="text-gray-600 mb-6">
              Our tender specialists are here to help you choose the right option
              and optimize your tender for maximum success.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-[#1E40AF] hover:bg-[#1E40AF]/90 text-white">
                Schedule Consultation
              </Button>
              <Button variant="outline" className="border-[#E5E7EB] text-gray-700 hover:bg-[#F8FAFC] hover:border-[#1E40AF]">
                View Success Stories
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md border-[#E5E7EB]">
          <div className="absolute top-0 right-0">
            {selectedType === 'freelance' ? (
              <div className="bg-[#0F766E] text-white px-4 py-2 rounded-bl-lg">
                <Briefcase className="h-5 w-5" />
              </div>
            ) : (
              <div className="bg-[#1E40AF] text-white px-4 py-2 rounded-bl-lg">
                <Building2 className="h-5 w-5" />
              </div>
            )}
          </div>

          <DialogHeader className="pt-8">
            <div className="flex items-center gap-3 mb-4">
              {selectedType === 'freelance' ? (
                <div className="rounded-lg bg-[#0F766E] p-3">
                  <Briefcase className="h-8 w-8 text-white" />
                </div>
              ) : (
                <div className="rounded-lg bg-[#1E40AF] p-3">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
              )}
              <DialogTitle className="text-2xl font-bold text-gray-900">
                {selectedType === 'freelance' ? 'Create Freelance Tender' : 'Create Professional Tender'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-lg text-gray-600">
              You`re about to create a{' '}
              <span className={cn(
                "font-bold",
                selectedType === 'freelance' ? "text-[#0F766E]" : "text-[#1E40AF]"
              )}>
                {selectedType === 'freelance' ? 'Freelance' : 'Professional'}
              </span>{' '}
              tender. Ready to proceed?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <Alert className={cn(
              "border",
              selectedType === 'freelance'
                ? "bg-[#0F766E]/5 border-[#0F766E]/20"
                : "bg-[#1E40AF]/5 border-[#1E40AF]/20"
            )}>
              {selectedType === 'freelance' ? (
                <CheckCircle2 className="h-5 w-5 text-[#0F766E]" />
              ) : (
                <AlertCircle className="h-5 w-5 text-[#1E40AF]" />
              )}
              <AlertTitle className={cn(
                "font-bold",
                selectedType === 'freelance' ? "text-[#0F766E]" : "text-[#1E40AF]"
              )}>
                {selectedType === 'freelance' ? 'Best Practice' : 'Important Notice'}
              </AlertTitle>
              <AlertDescription className={selectedType === 'freelance' ? "text-[#0F766E]" : "text-[#1E40AF]"}>
                {selectedType === 'freelance'
                  ? 'For best results, provide clear deliverables and acceptance criteria.'
                  : 'This tender type cannot be edited after publication. Please ensure all details are accurate.'
                }
              </AlertDescription>
            </Alert>

            <div className="rounded-lg border border-[#E5E7EB] p-4">
              <h4 className="font-bold text-lg mb-3 text-gray-900">📋 What You`ll Need:</h4>
              <ul className="space-y-2">
                {(
                  selectedType === 'freelance' ? [
                    { text: 'Project title and detailed description', icon: '📝' },
                    { text: 'Budget range and timeline', icon: '💰' },
                    { text: 'Required skills and experience level', icon: '🎯' },
                    { text: 'Optional screening questions', icon: '❓' }
                  ] : [
                    { text: 'Detailed project specifications', icon: '📋' },
                    { text: 'Legal and compliance documents', icon: '⚖️' },
                    { text: 'Evaluation criteria and weights', icon: '📊' },
                    { text: 'Project timeline and milestones', icon: '📅' }
                  ]
                ).map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-gray-700">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="flex-1 border-[#E5E7EB] hover:bg-[#F8FAFC]"
            >
              Go Back
            </Button>
            <Button
              onClick={handleConfirm}
              className={cn(
                "flex-1 text-white font-bold",
                selectedType === 'freelance'
                  ? "bg-[#0F766E] hover:bg-[#0F766E]/90"
                  : "bg-[#1E40AF] hover:bg-[#1E40AF]/90"
              )}
            >
              {selectedType === 'freelance' ? (
                <>
                  <Briefcase className="h-5 w-5 mr-2" />
                  Create Freelance Tender
                </>
              ) : (
                <>
                  <Building2 className="h-5 w-5 mr-2" />
                  Create Professional Tender
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}