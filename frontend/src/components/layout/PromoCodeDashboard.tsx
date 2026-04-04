// src/components/dashboard/PromoCodeDashboard.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { usePromoCode } from '@/hooks/usePromoCode';
import { useAuth } from '@/hooks/useAuth';
import {
  Copy, Share2, Users, Gift, TrendingUp, Award, Clock,
  CheckCircle, XCircle, RefreshCw, Mail, MessageCircle, Send, Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/hooks/useResponsive';

interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  successRate: string;
  rewardPoints: number;
  rewardBalance: number;
  totalRewardsEarned: number;
}

interface ReferralActivity {
  id: string;
  user: string;
  email: string;
  status: 'pending' | 'email_verified' | 'completed' | 'cancelled';
  date: string;
  rewardEarned: number;
}

interface ShareableLinks {
  link: string;
  text: string;
  emailSubject: string;
  emailBody: string;
  telegramMessage: string;
  whatsappMessage: string;
}

export const PromoCodeDashboard = () => {
  const { user } = useAuth();
  const {
    getStats,
    generateCode,
    copyToClipboard,
    shareable,
    loading
  } = usePromoCode();

  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'referrals' | 'rewards'>('overview');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [referralPage, setReferralPage] = useState(1);
  const [hasMoreReferrals, setHasMoreReferrals] = useState(true);

  const { breakpoint, isTouch, getTouchTargetSize } = useResponsive();

  useEffect(() => {
    loadStats();
  }, [referralPage]);

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const data = await getStats(referralPage);
      if (data) {
        setStats(data);
        setHasMoreReferrals(data.pagination?.hasNext || false);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleGenerateCode = async () => {
    setGeneratingCode(true);
    try {
      const data = await generateCode();
      if (data) {
        await loadStats();
      }
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleCopy = async (text: string, field: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
        icon: Clock,
        text: 'Pending'
      },
      email_verified: {
        color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
        icon: CheckCircle,
        text: 'Email Verified'
      },
      completed: {
        color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
        icon: Award,
        text: 'Completed'
      },
      cancelled: {
        color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
        icon: XCircle,
        text: 'Cancelled'
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={cn(
        "inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-xs font-medium border",
        config.color
      )}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  if (loadingStats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-emerald-600 dark:text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={cn(
            "font-bold",
            "text-xl sm:text-2xl",
            "text-gray-900 dark:text-white"
          )}>
            Referral Program
          </h1>
          <p className={cn(
            "text-sm sm:text-base",
            "text-gray-600 dark:text-gray-400"
          )}>
            Invite friends and earn rewards
          </p>
        </div>
        {stats?.referralCode?.code ? (
          <button
            onClick={() => setShowShareModal(true)}
            className={cn(
              "flex items-center justify-center",
              "px-4 py-2 sm:px-6 sm:py-3",
              "text-sm sm:text-base",
              "bg-emerald-600 hover:bg-emerald-700",
              "text-white rounded-xl font-semibold",
              "transition-colors shadow-lg hover:shadow-xl",
              getTouchTargetSize?.('md') || "min-h-[44px] min-w-[44px]"
            )}
          >
            <Share2 className="w-4 h-4 mr-2" />
            {breakpoint === 'mobile' ? 'Share' : 'Share Your Code'}
          </button>
        ) : (
          <button
            onClick={handleGenerateCode}
            disabled={generatingCode}
            className={cn(
              "flex items-center justify-center",
              "px-4 py-2 sm:px-6 sm:py-3",
              "text-sm sm:text-base",
              "bg-emerald-600 hover:bg-emerald-700",
              "text-white rounded-xl font-semibold",
              "disabled:opacity-50 transition-colors",
              "shadow-lg hover:shadow-xl",
              getTouchTargetSize?.('md') || "min-h-[44px] min-w-[44px]"
            )}
          >
            {generatingCode ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Gift className="w-4 h-4 mr-2" />
            )}
            {breakpoint === 'mobile' ? 'Generate' : 'Generate Code'}
          </button>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            icon={Users}
            label="Referrals"
            value={stats.stats.totalReferrals}
            color="blue"
          />
          <StatCard
            icon={CheckCircle}
            label="Completed"
            value={stats.stats.completedReferrals}
            color="green"
            subtext={`${stats.stats.successRate}%`}
          />
          <StatCard
            icon={Award}
            label="Points"
            value={stats.stats.rewardPoints}
            color="purple"
            subtext={`$${stats.stats.rewardBalance}`}
          />
          <StatCard
            icon={TrendingUp}
            label="Usage"
            value={`${stats.referralCode.usedCount || 0}/${stats.referralCode.maxUses || 100}`}
            color="orange"
            progress={((stats.referralCode.usedCount || 0) / (stats.referralCode.maxUses || 100)) * 100}
          />
        </div>
      )}

      {/* Referral Code Display */}
      {stats?.referralCode?.code && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-xl p-4 sm:p-6",
            "bg-gradient-to-r",
            "from-emerald-600 to-emerald-700",
            "dark:from-emerald-800 dark:to-emerald-900",
            "text-white"
          )}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className={cn(
                "text-xs sm:text-sm",
                "text-emerald-100 dark:text-emerald-200 mb-1 sm:mb-2"
              )}>
                Your Referral Code
              </p>
              <div className="flex items-center space-x-2 sm:space-x-4">
                <span className={cn(
                  "font-mono font-bold tracking-wider",
                  "text-2xl sm:text-3xl lg:text-4xl"
                )}>
                  {stats.referralCode.code}
                </span>
                <button
                  onClick={() => handleCopy(stats.referralCode.code, 'code')}
                  className={cn(
                    "p-2 rounded-lg transition-colors relative",
                    "hover:bg-emerald-500 dark:hover:bg-emerald-700",
                    getTouchTargetSize?.('sm') || "min-h-[36px] min-w-[36px]"
                  )}
                >
                  <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                  {copiedField === 'code' && (
                    <span className={cn(
                      "absolute -top-8 left-1/2 transform -translate-x-1/2",
                      "bg-gray-800 text-white text-xs px-2 py-1 rounded",
                      "whitespace-nowrap"
                    )}>
                      Copied!
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Share buttons - hidden on mobile, shown in modal */}
            <div className="hidden sm:flex space-x-2">
              <ShareButton
                platform="whatsapp"
                url={shareable(stats.referralCode.code, 'whatsapp')}
                icon={MessageCircle}
                color="bg-emerald-500 hover:bg-emerald-600"
              />
              <ShareButton
                platform="telegram"
                url={shareable(stats.referralCode.code, 'telegram')}
                icon={Send}
                color="bg-blue-500 hover:bg-blue-600"
              />
              <ShareButton
                platform="email"
                url={shareable(stats.referralCode.code, 'email')}
                icon={Mail}
                color="bg-purple-500 hover:bg-purple-600"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto">
          <TabButton
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            icon={TrendingUp}
            label="Overview"
            getTouchTargetSize={getTouchTargetSize}
          />
          <TabButton
            active={activeTab === 'referrals'}
            onClick={() => setActiveTab('referrals')}
            icon={Users}
            label="Referrals"
            badge={stats?.stats?.pendingReferrals}
            getTouchTargetSize={getTouchTargetSize}
          />
          <TabButton
            active={activeTab === 'rewards'}
            onClick={() => setActiveTab('rewards')}
            icon={Gift}
            label="Rewards"
            getTouchTargetSize={getTouchTargetSize}
          />
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4 sm:space-y-6"
          >
            <OverviewTab stats={stats} breakpoint={breakpoint} />
          </motion.div>
        )}

        {activeTab === 'referrals' && (
          <motion.div
            key="referrals"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <ReferralsTab
              referrals={stats?.recentActivity || []}
              getStatusBadge={getStatusBadge}
              hasMore={hasMoreReferrals}
              onLoadMore={() => setReferralPage(prev => prev + 1)}
              breakpoint={breakpoint}
            />
          </motion.div>
        )}

        {activeTab === 'rewards' && (
          <motion.div
            key="rewards"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <RewardsTab stats={stats} breakpoint={breakpoint} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      {showShareModal && stats?.referralCode?.code && (
        <ShareModal
          code={stats.referralCode.code}
          shareable={stats.shareable}
          onClose={() => setShowShareModal(false)}
          onCopy={handleCopy}
          copiedField={copiedField}
          breakpoint={breakpoint}
          getTouchTargetSize={getTouchTargetSize}
        />
      )}
    </div>
  );
};

// Stat Card Component - Enhanced for better theming
const StatCard = ({ icon: Icon, label, value, color, subtext, progress }: any) => {
  const colors = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-600 dark:text-blue-400',
      progress: 'bg-blue-600 dark:bg-blue-400'
    },
    green: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      text: 'text-emerald-600 dark:text-emerald-400',
      progress: 'bg-emerald-600 dark:bg-emerald-400'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      text: 'text-purple-600 dark:text-purple-400',
      progress: 'bg-purple-600 dark:bg-purple-400'
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      text: 'text-orange-600 dark:text-orange-400',
      progress: 'bg-orange-600 dark:bg-orange-400'
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={cn(
        "rounded-xl p-3 sm:p-4 lg:p-6",
        "bg-white dark:bg-gray-800",
        "border border-gray-200 dark:border-gray-700",
        "shadow-sm hover:shadow-md transition-all"
      )}
    >
      <div className="flex items-start justify-between">
        <div className={cn("p-2 sm:p-3 rounded-lg", colors[color as keyof typeof colors].bg)}>
          <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6", colors[color as keyof typeof colors].text)} />
        </div>
      </div>
      <div className="mt-2 sm:mt-3 lg:mt-4">
        <p className={cn(
          "text-xs sm:text-sm",
          "text-gray-600 dark:text-gray-400"
        )}>{label}</p>
        <p className={cn(
          "font-bold",
          "text-base sm:text-lg lg:text-2xl",
          "text-gray-900 dark:text-white"
        )}>{value}</p>
        {subtext && (
          <p className={cn(
            "text-xs",
            "text-gray-500 dark:text-gray-400",
            "mt-1"
          )}>{subtext}</p>
        )}
        {progress !== undefined && (
          <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 sm:h-2">
            <div
              className={cn("h-1.5 sm:h-2 rounded-full", colors[color as keyof typeof colors].progress)}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Tab Button Component - Fixed to accept getTouchTargetSize prop
const TabButton = ({ active, onClick, icon: Icon, label, badge, getTouchTargetSize }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center py-3 sm:py-4 px-1",
      "border-b-2 font-medium text-xs sm:text-sm",
      "transition-colors relative whitespace-nowrap",
      active
        ? 'border-emerald-600 dark:border-emerald-400 text-emerald-600 dark:text-emerald-400'
        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600',
      getTouchTargetSize?.('sm') || "min-h-[36px] min-w-[36px]"
    )}
  >
    <Icon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
    {label}
    {badge > 0 && (
      <span className={cn(
        "ml-1 sm:ml-2",
        "px-1.5 py-0.5 rounded-full text-xs",
        "bg-amber-100 dark:bg-amber-900/30",
        "text-amber-700 dark:text-amber-400"
      )}>
        {badge}
      </span>
    )}
  </button>
);

// Share Button Component
const ShareButton = ({ platform, url, icon: Icon, color }: any) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className={cn(
      "p-2 sm:p-3 rounded-lg",
      color,
      "text-white transition-colors",
      "hover:shadow-md"
    )}
  >
    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
  </a>
);

// Overview Tab
const OverviewTab = ({ stats, breakpoint }: any) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
    <div className={cn(
      "rounded-xl p-4 sm:p-6",
      "bg-white dark:bg-gray-800",
      "border border-gray-200 dark:border-gray-700",
      "shadow-sm"
    )}>
      <h3 className={cn(
        "font-semibold mb-4",
        "text-base sm:text-lg",
        "text-gray-900 dark:text-white"
      )}>
        Referral Performance
      </h3>
      <div className="space-y-3 sm:space-y-4">
        <div className="flex justify-between items-center">
          <span className={cn(
            "text-xs sm:text-sm",
            "text-gray-600 dark:text-gray-400"
          )}>Conversion Rate</span>
          <span className={cn(
            "font-semibold",
            "text-sm sm:text-base",
            "text-gray-900 dark:text-white"
          )}>{stats?.stats.successRate}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-emerald-600 dark:bg-emerald-400 h-2 rounded-full"
            style={{ width: `${stats?.stats.successRate}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4">
          <div className={cn(
            "text-center p-3 sm:p-4 rounded-lg",
            "bg-gray-50 dark:bg-gray-900"
          )}>
            <p className={cn(
              "font-bold",
              "text-lg sm:text-xl lg:text-2xl",
              "text-amber-600 dark:text-amber-400"
            )}>{stats?.stats.pendingReferrals}</p>
            <p className={cn(
              "text-xs sm:text-sm",
              "text-gray-600 dark:text-gray-400"
            )}>Pending</p>
          </div>
          <div className={cn(
            "text-center p-3 sm:p-4 rounded-lg",
            "bg-gray-50 dark:bg-gray-900"
          )}>
            <p className={cn(
              "font-bold",
              "text-lg sm:text-xl lg:text-2xl",
              "text-emerald-600 dark:text-emerald-400"
            )}>{stats?.stats.completedReferrals}</p>
            <p className={cn(
              "text-xs sm:text-sm",
              "text-gray-600 dark:text-gray-400"
            )}>Completed</p>
          </div>
        </div>
      </div>
    </div>

    <div className={cn(
      "rounded-xl p-4 sm:p-6",
      "bg-white dark:bg-gray-800",
      "border border-gray-200 dark:border-gray-700",
      "shadow-sm"
    )}>
      <h3 className={cn(
        "font-semibold mb-4",
        "text-base sm:text-lg",
        "text-gray-900 dark:text-white"
      )}>
        How It Works
      </h3>
      <div className="space-y-3 sm:space-y-4">
        <Step
          number={1}
          title="Share Your Code"
          description="Share with friends"
          breakpoint={breakpoint}
        />
        <Step
          number={2}
          title="Friend Registers"
          description="They sign up using your code"
          breakpoint={breakpoint}
        />
        <Step
          number={3}
          title="Get Rewarded"
          description="Earn points when they verify"
          breakpoint={breakpoint}
        />
      </div>
    </div>
  </div>
);

// Step Component
const Step = ({ number, title, description, breakpoint }: any) => (
  <div className="flex items-start space-x-2 sm:space-x-3">
    <div className={cn(
      "shrink-0",
      "bg-emerald-600 dark:bg-emerald-500",
      "text-white rounded-full flex items-center justify-center",
      "w-5 h-5 sm:w-6 sm:h-6",
      "text-xs sm:text-sm font-bold"
    )}>
      {number}
    </div>
    <div>
      <h4 className={cn(
        "font-medium",
        "text-sm sm:text-base",
        "text-gray-900 dark:text-white"
      )}>{title}</h4>
      {breakpoint !== 'mobile' && (
        <p className={cn(
          "text-xs sm:text-sm",
          "text-gray-600 dark:text-gray-400"
        )}>{description}</p>
      )}
    </div>
  </div>
);

// Referrals Tab
const ReferralsTab = ({ referrals, getStatusBadge, hasMore, onLoadMore, breakpoint }: any) => (
  <div className={cn(
    "rounded-xl",
    "bg-white dark:bg-gray-800",
    "border border-gray-200 dark:border-gray-700",
    "shadow-sm overflow-hidden"
  )}>
    {referrals.length === 0 ? (
      <div className="text-center py-8 sm:py-12">
        <Users className={cn(
          "mx-auto mb-3 sm:mb-4",
          "w-10 h-10 sm:w-12 sm:h-12",
          "text-gray-400 dark:text-gray-600"
        )} />
        <h3 className={cn(
          "font-medium mb-1 sm:mb-2",
          "text-sm sm:text-base lg:text-lg",
          "text-gray-900 dark:text-white"
        )}>
          No referrals yet
        </h3>
        <p className={cn(
          "text-xs sm:text-sm",
          "text-gray-600 dark:text-gray-400"
        )}>
          Share your code and start earning!
        </p>
      </div>
    ) : (
      <>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={cn(
              "bg-gray-50 dark:bg-gray-900"
            )}>
              <tr>
                <th className={cn(
                  "px-3 sm:px-6 py-2 sm:py-3 text-left",
                  "text-xs font-medium uppercase tracking-wider",
                  "text-gray-500 dark:text-gray-400"
                )}>
                  User
                </th>
                <th className={cn(
                  "px-3 sm:px-6 py-2 sm:py-3 text-left",
                  "text-xs font-medium uppercase tracking-wider",
                  "text-gray-500 dark:text-gray-400"
                )}>
                  Status
                </th>
                {breakpoint !== 'mobile' && (
                  <th className={cn(
                    "px-3 sm:px-6 py-2 sm:py-3 text-left",
                    "text-xs font-medium uppercase tracking-wider",
                    "text-gray-500 dark:text-gray-400"
                  )}>
                    Date
                  </th>
                )}
                <th className={cn(
                  "px-3 sm:px-6 py-2 sm:py-3 text-left",
                  "text-xs font-medium uppercase tracking-wider",
                  "text-gray-500 dark:text-gray-400"
                )}>
                  Reward
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {referrals.map((ref: any) => (
                <tr key={ref.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                  <td className="px-3 sm:px-6 py-2 sm:py-4">
                    <div>
                      <p className={cn(
                        "font-medium",
                        "text-xs sm:text-sm",
                        "text-gray-900 dark:text-white"
                      )}>{ref.user}</p>
                      {breakpoint !== 'mobile' && (
                        <p className={cn(
                          "text-xs",
                          "text-gray-500 dark:text-gray-400"
                        )}>{ref.email}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-2 sm:py-4">
                    {getStatusBadge(ref.status)}
                  </td>
                  {breakpoint !== 'mobile' && (
                    <td className="px-3 sm:px-6 py-2 sm:py-4">
                      <p className={cn(
                        "text-xs sm:text-sm",
                        "text-gray-500 dark:text-gray-400"
                      )}>
                        {formatDistanceToNow(new Date(ref.date), { addSuffix: true })}
                      </p>
                    </td>
                  )}
                  <td className="px-3 sm:px-6 py-2 sm:py-4">
                    <span className={cn(
                      "font-medium",
                      "text-xs sm:text-sm",
                      "text-emerald-600 dark:text-emerald-400"
                    )}>
                      +{ref.rewardEarned}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {hasMore && (
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onLoadMore}
              className={cn(
                "flex items-center",
                "text-xs sm:text-sm",
                "text-emerald-600 dark:text-emerald-400",
                "hover:text-emerald-700 dark:hover:text-emerald-300"
              )}
            >
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Load More
            </button>
          </div>
        )}
      </>
    )}
  </div>
);

// Rewards Tab
const RewardsTab = ({ stats, breakpoint }: any) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
    <div className={cn(
      "rounded-xl p-4 sm:p-6",
      "bg-white dark:bg-gray-800",
      "border border-gray-200 dark:border-gray-700",
      "shadow-sm"
    )}>
      <h3 className={cn(
        "font-semibold mb-4",
        "text-base sm:text-lg",
        "text-gray-900 dark:text-white"
      )}>
        Reward Summary
      </h3>
      <div className="space-y-3 sm:space-y-4">
        <div className="flex justify-between items-center pb-2 sm:pb-3 border-b border-gray-200 dark:border-gray-700">
          <span className={cn(
            "text-xs sm:text-sm",
            "text-gray-600 dark:text-gray-400"
          )}>Total Points Earned</span>
          <span className={cn(
            "font-bold",
            "text-lg sm:text-xl lg:text-2xl",
            "text-blue-600 dark:text-blue-400"
          )}>
            {stats?.stats.totalRewardsEarned}
          </span>
        </div>
        <div className="flex justify-between items-center pb-2 sm:pb-3 border-b border-gray-200 dark:border-gray-700">
          <span className={cn(
            "text-xs sm:text-sm",
            "text-gray-600 dark:text-gray-400"
          )}>Available Points</span>
          <span className={cn(
            "font-bold",
            "text-lg sm:text-xl lg:text-2xl",
            "text-emerald-600 dark:text-emerald-400"
          )}>
            {stats?.stats.rewardPoints}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className={cn(
            "text-xs sm:text-sm",
            "text-gray-600 dark:text-gray-400"
          )}>Cash Balance</span>
          <span className={cn(
            "font-bold",
            "text-lg sm:text-xl lg:text-2xl",
            "text-purple-600 dark:text-purple-400"
          )}>
            ${stats?.stats.rewardBalance}
          </span>
        </div>
      </div>
    </div>

    <div className={cn(
      "rounded-xl p-4 sm:p-6",
      "bg-gradient-to-br",
      "from-purple-600 to-emerald-600",
      "dark:from-purple-800 dark:to-emerald-800",
      "text-white"
    )}>
      <h3 className={cn(
        "font-semibold mb-3 sm:mb-4",
        "text-base sm:text-lg",
        "text-white"
      )}>
        Next Reward Level
      </h3>
      <div className="space-y-3 sm:space-y-4">
        <p className={cn(
          "text-xs sm:text-sm",
          "text-purple-100"
        )}>
          Refer {5 - (stats?.stats.completedReferrals || 0)} more friends
        </p>
        <ul className="space-y-1 sm:space-y-2">
          <li className="flex items-center text-xs sm:text-sm">
            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            $50 Cash Bonus
          </li>
          <li className="flex items-center text-xs sm:text-sm">
            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            500 Extra Points
          </li>
          <li className="flex items-center text-xs sm:text-sm">
            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Premium Badge
          </li>
        </ul>
      </div>
    </div>
  </div>
);

// Share Modal
const ShareModal = ({ code, shareable, onClose, onCopy, copiedField, breakpoint, getTouchTargetSize }: any) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ y: breakpoint === 'mobile' ? 100 : 0, scale: breakpoint === 'mobile' ? 1 : 0.9 }}
      animate={{ y: 0, scale: 1 }}
      exit={{ y: breakpoint === 'mobile' ? 100 : 0, scale: breakpoint === 'mobile' ? 1 : 0.9 }}
      className={cn(
        "bg-white dark:bg-gray-800",
        "rounded-t-xl sm:rounded-xl",
        "max-w-md w-full p-4 sm:p-6",
        breakpoint === 'mobile' ? "mt-auto" : ""
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className={cn(
        "font-bold mb-4",
        "text-lg sm:text-xl",
        "text-gray-900 dark:text-white"
      )}>
        Share Your Code
      </h3>

      <div className="space-y-3 sm:space-y-4">
        <div>
          <label className={cn(
            "block font-medium mb-1 sm:mb-2",
            "text-xs sm:text-sm",
            "text-gray-700 dark:text-gray-300"
          )}>
            Your Code
          </label>
          <div className="flex items-center space-x-2">
            <code className={cn(
              "flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg",
              "bg-gray-100 dark:bg-gray-900",
              "font-mono",
              "text-sm sm:text-base",
              "text-gray-900 dark:text-white"
            )}>
              {code}
            </code>
            <button
              onClick={() => onCopy(code, 'modal-code')}
              className={cn(
                "p-2 sm:p-3 rounded-lg transition-colors relative",
                "bg-gray-100 dark:bg-gray-900",
                "hover:bg-gray-200 dark:hover:bg-gray-700",
                getTouchTargetSize?.('sm') || "min-h-[36px] min-w-[36px]"
              )}
            >
              <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
              {copiedField === 'modal-code' && (
                <span className={cn(
                  "absolute -top-8 left-1/2 transform -translate-x-1/2",
                  "bg-gray-800 text-white text-xs px-2 py-1 rounded",
                  "whitespace-nowrap"
                )}>
                  Copied!
                </span>
              )}
            </button>
          </div>
        </div>

        <div>
          <label className={cn(
            "block font-medium mb-1 sm:mb-2",
            "text-xs sm:text-sm",
            "text-gray-700 dark:text-gray-300"
          )}>
            Share Link
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={shareable.link}
              className={cn(
                "flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg",
                "bg-gray-100 dark:bg-gray-900",
                "text-xs sm:text-sm",
                "text-gray-900 dark:text-white"
              )}
            />
            <button
              onClick={() => onCopy(shareable.link, 'modal-link')}
              className={cn(
                "p-2 sm:p-3 rounded-lg transition-colors relative",
                "bg-gray-100 dark:bg-gray-900",
                "hover:bg-gray-200 dark:hover:bg-gray-700",
                getTouchTargetSize?.('sm') || "min-h-[36px] min-w-[36px]"
              )}
            >
              <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
              {copiedField === 'modal-link' && (
                <span className={cn(
                  "absolute -top-8 left-1/2 transform -translate-x-1/2",
                  "bg-gray-800 text-white text-xs px-2 py-1 rounded",
                  "whitespace-nowrap"
                )}>
                  Copied!
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 sm:pt-4">
          <a
            href={shareable.whatsappMessage}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex flex-col items-center p-3 sm:p-4 rounded-lg",
              "bg-emerald-500 hover:bg-emerald-600",
              "text-white transition-colors",
              getTouchTargetSize?.('md') || "min-h-[44px] min-w-[44px]"
            )}
          >
            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
            <span className="text-xs">WhatsApp</span>
          </a>
          <a
            href={shareable.telegramMessage}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex flex-col items-center p-3 sm:p-4 rounded-lg",
              "bg-blue-500 hover:bg-blue-600",
              "text-white transition-colors",
              getTouchTargetSize?.('md') || "min-h-[44px] min-w-[44px]"
            )}
          >
            <Send className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
            <span className="text-xs">Telegram</span>
          </a>
          <a
            href={`mailto:?subject=${encodeURIComponent(shareable.emailSubject)}&body=${encodeURIComponent(shareable.emailBody)}`}
            className={cn(
              "flex flex-col items-center p-3 sm:p-4 rounded-lg",
              "bg-purple-500 hover:bg-purple-600",
              "text-white transition-colors",
              getTouchTargetSize?.('md') || "min-h-[44px] min-w-[44px]"
            )}
          >
            <Mail className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
            <span className="text-xs">Email</span>
          </a>
        </div>
      </div>

      <button
        onClick={onClose}
        className={cn(
          "mt-4 sm:mt-6 w-full",
          "px-4 py-2 sm:py-3 rounded-lg",
          "text-sm sm:text-base",
          "bg-gray-100 dark:bg-gray-900",
          "text-gray-700 dark:text-gray-300",
          "hover:bg-gray-200 dark:hover:bg-gray-700",
          "transition-colors",
          getTouchTargetSize?.('md') || "min-h-[44px] min-w-[44px]"
        )}
      >
        Close
      </button>
    </motion.div>
  </motion.div>
);

export default PromoCodeDashboard;