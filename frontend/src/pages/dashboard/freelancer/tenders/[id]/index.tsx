// pages/dashboard/freelance/tenders/[id].tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TenderHeader } from '@/components/tenders/TenderHeader';
import { TenderDetails } from '@/components/tenders/TenderDetails';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft,
  CheckCircle,
  Share2,
  Users,
  Clock,
  DollarSign,
  Award,
  Zap,
  AlertCircle,
  ChevronRight,
  Bookmark,
} from 'lucide-react';
import { useTender, useToggleSaveTender, useTenders } from '@/hooks/useTenders';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export default function FreelanceTenderDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();

  const { tender, isLoading, error, refetch } = useTender(id as string);
  const { mutate: toggleSave } = useToggleSaveTender();
  
  // Get similar tenders for suggestions at bottom
  const { tenders: similarTenders } = useTenders({
    page: 1,
    limit: 3,
    tenderCategory: 'freelance',
    status: 'published',
    procurementCategory: tender?.procurementCategory,
  });

  const [activeTab, setActiveTab] = useState('overview');

  // Calculate compatibility score
  const calculateCompatibilityScore = () => {
    if (!tender || !user) return 0;

    let score = 0;
    const userSkills = user.skills || [];
    const requiredSkills = tender.skillsRequired || [];

    // Skill matching (40%)
    const matchedSkills = requiredSkills.filter(skill =>
      userSkills.some(userSkill =>
        userSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(userSkill.toLowerCase())
      )
    );
    score += (matchedSkills.length / Math.max(requiredSkills.length, 1)) * 40;

    // Experience level (20%)
    if (tender.freelanceSpecific?.experienceLevel) {
      const userExpLevel = typeof user.experience === 'string' ? user.experience : 'intermediate';
      const requiredExpLevel = tender.freelanceSpecific.experienceLevel;

      const levels = ['entry', 'intermediate', 'expert'];
      const userLevelIndex = levels.indexOf(userExpLevel);
      const requiredLevelIndex = levels.indexOf(requiredExpLevel);

      if (userLevelIndex >= 0 && requiredLevelIndex >= 0) {
        if (userLevelIndex >= requiredLevelIndex) {
          score += 20;
        } else {
          score += (userLevelIndex / Math.max(requiredLevelIndex, 1)) * 20;
        }
      } else {
        score += 10;
      }
    } else {
      score += 20;
    }

    // Budget matching (20%)
    if (tender.freelanceSpecific?.budget && user.hourlyRate) {
      const hourlyRate = user.hourlyRate;
      const projectBudget = tender.freelanceSpecific.budget;
      const estimatedHours = projectBudget.max / hourlyRate;

      if (estimatedHours >= 20 && estimatedHours <= 200) {
        score += 20;
      } else {
        score += 10;
      }
    } else {
      score += 20;
    }

    // Location/timezone (10%)
    if (!tender.freelanceSpecific?.timezonePreference ||
      tender.freelanceSpecific.timezonePreference === 'flexible') {
      score += 10;
    } else {
      score += 5;
    }

    return Math.min(Math.round(score), 100);
  };

  const compatibilityScore = calculateCompatibilityScore();
  const isSaved = tender?.metadata?.savedBy?.includes(user?.id || '') || false;

  const handleShare = async () => {
    try {
      const url = window.location.href;
      if (navigator.share) {
        await navigator.share({
          title: tender?.title,
          text: tender?.description?.substring(0, 100),
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        // Show success toast here
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleApply = () => {
    // Navigate to application page or open modal
    router.push(`/dashboard/freelance/tenders/${id}/apply`);
  };

  if (isLoading) {
    return (
      <DashboardLayout requiredRole="freelancer">
        <div className="min-h-screen bg-white dark:bg-slate-950">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 border-4 border-emerald-200 dark:border-emerald-800 border-t-emerald-600 dark:border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
                <p className="text-slate-600 dark:text-slate-400">Loading project details...</p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !tender) {
    return (
      <DashboardLayout requiredRole="freelancer">
        <div className="min-h-screen bg-white dark:bg-slate-950">
          <div className="container mx-auto px-4 py-8">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-6 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>

            <Card className="border border-slate-200 dark:border-slate-800">
              <CardContent className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  Project Not Found
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                  The project you`re looking for doesn`t exist or has been removed.
                </p>
                <Button
                  onClick={() => router.push('/dashboard/freelance/tenders')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Browse Projects
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Head>
        <title>{tender.title} | Freelance Project</title>
        <meta name="description" content={tender.description.substring(0, 160)} />
      </Head>

      <DashboardLayout requiredRole="freelancer">
        <div className="min-h-screen bg-white dark:bg-slate-950">
          <div className="container mx-auto px-4 py-8">
            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-6 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>

            {/* Tender Header */}
            <div className="mb-8">
              <TenderHeader
                tender={tender}
                userRole="freelancer"
                onShare={handleShare}
                condensed={false}
              />
            </div>

            {/* Compatibility Banner */}
            <Card className={cn(
              "mb-8 border-l-4",
              compatibilityScore >= 90
                ? "border-emerald-500 bg-gradient-to-r from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-slate-900"
                : compatibilityScore >= 75
                ? "border-blue-500 bg-gradient-to-r from-blue-50/50 to-white dark:from-blue-950/20 dark:to-slate-900"
                : compatibilityScore >= 50
                ? "border-amber-500 bg-gradient-to-r from-amber-50/50 to-white dark:from-amber-950/20 dark:to-slate-900"
                : "border-slate-500 bg-gradient-to-r from-slate-50/50 to-white dark:from-slate-950/20 dark:to-slate-900"
            )}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border-4 border-white dark:border-slate-800 shadow-lg">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-slate-900 dark:text-white">
                            {compatibilityScore}%
                          </div>
                          {/* <div className="text-xs text-slate-600 dark:text-slate-400">Match</div> */}
                        </div>
                      </div>
                      <Badge className={cn(
                        "absolute -top-2 -right-2 px-3 py-1 font-semibold",
                        compatibilityScore >= 90
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                          : compatibilityScore >= 75
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : compatibilityScore >= 50
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                          : "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200"
                      )}>
                        {compatibilityScore >= 90 ? 'Perfect Fit' : 
                         compatibilityScore >= 75 ? 'Great Match' :
                         compatibilityScore >= 50 ? 'Good Match' : 'Fair Match'}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                        {compatibilityScore >= 90 ? 'Excellent match!' :
                         compatibilityScore >= 75 ? 'Great match!' :
                         compatibilityScore >= 50 ? 'Good match!' : 'Fair match'}
                      </h2>
                      <p className="text-slate-600 dark:text-slate-400">
                        Your skills and experience align well with this project`s requirements.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button
                      size="lg"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/25"
                      onClick={handleApply}
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Apply Now
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                        onClick={() => toggleSave(tender._id)}
                      >
                        <Bookmark className={cn(
                          "h-4 w-4 mr-2",
                          isSaved && "fill-emerald-500 text-emerald-500"
                        )} />
                        {isSaved ? 'Saved' : 'Save'}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                        onClick={handleShare}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="border border-slate-200 dark:border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                      <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Budget</div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {tender.freelanceSpecific?.budget 
                          ? `${tender.freelanceSpecific.budget.currency} ${tender.freelanceSpecific.budget.min.toLocaleString()}-${tender.freelanceSpecific.budget.max.toLocaleString()}`
                          : 'Negotiable'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 dark:border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Deadline</div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {new Date(tender.deadline).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 dark:border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                      <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Level</div>
                      <div className="font-semibold text-slate-900 dark:text-white capitalize">
                        {tender.freelanceSpecific?.experienceLevel || 'Any'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 dark:border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Proposals</div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {tender.metadata?.totalApplications || 0}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Tender Details Component (Full Width) */}
            <div className="mb-12">
              <TenderDetails
                tender={tender}
                userRole="freelancer"
                userId={user?.id}
                onApply={handleApply}
                onShare={handleShare}
              />
            </div>

            {/* Similar Projects Section */}
            {similarTenders.length > 0 && (
              <div className="mt-12">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                      Similar Projects You Might Like
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                      Based on this project`s category and requirements
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/dashboard/freelance/tenders')}
                    className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                  >
                    View All
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {similarTenders.slice(0, 3).map((similarTender) => (
                    <Card
                      key={similarTender._id}
                      className="border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow cursor-pointer group"
                      onClick={() => router.push(`/dashboard/freelance/tenders/${similarTender._id}`)}
                    >
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                {similarTender.title}
                              </h4>
                              <Badge variant="outline" className="mt-2 text-xs">
                                {similarTender.procurementCategory}
                              </Badge>
                            </div>
                            {similarTender.freelanceSpecific?.urgency === 'urgent' && (
                              <Badge className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                                <Zap className="h-3 w-3 mr-1" />
                                Urgent
                              </Badge>
                            )}
                          </div>

                          <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2">
                            {similarTender.description}
                          </p>

                          <div className="space-y-2">
                            {similarTender.freelanceSpecific?.budget && (
                              <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                <DollarSign className="h-4 w-4" />
                                <span>
                                  {similarTender.freelanceSpecific.budget.currency}{' '}
                                  {similarTender.freelanceSpecific.budget.min.toLocaleString()}-
                                  {similarTender.freelanceSpecific.budget.max.toLocaleString()}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <Clock className="h-4 w-4" />
                              <span>
                                {new Date(similarTender.deadline).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            className="w-full border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Sticky Apply Button for Mobile */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-lg z-40">
              <div className="container mx-auto">
                <Button
                  size="lg"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/25"
                  onClick={handleApply}
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Apply Now ({compatibilityScore}% Match)
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}