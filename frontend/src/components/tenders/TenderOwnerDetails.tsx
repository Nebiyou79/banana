/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/tenders/owner/OwnerTenderDetails.tsx
import React, { useState, useMemo, Suspense } from 'react';
import {
    FileText,
    Download,
    Eye,
    Users,
    Calendar,
    Lock,
    Globe,
    Settings,
    Share2,
    Trash2,
    Send,
    Mail,
    Copy,
    CheckCircle,
    AlertTriangle,
    BarChart3,
    Building,
    Shield,
    Zap,
    Edit,
    Plus,
    BookmarkCheck,
    Loader2,
    ChevronRight,
    Info,
    FolderOpen
} from 'lucide-react';
import { Button } from '@/components/social/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent } from '@/components/ui/Tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/social/ui/Alert-Dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useResponsive } from '@/hooks/useResponsive';
import {
    useOwnerTender,
    useTenderStats,
    useDeleteTender,
    usePublishTender,
    useRevealProposals,
    useInviteUsersToTender,
    useCPOUtils,
} from '@/hooks/useTenders';
import {
    Tender,
    TenderStatus,
    formatFileSize,
    isTenderActive,
    calculateProgress,
    TENDER_STATUSES,
    ENGAGEMENT_TYPES,
    EXPERIENCE_LEVELS,
    PROJECT_TYPES,
    PROCUREMENT_METHODS,
    EVALUATION_METHODS,
} from '@/services/tenderService';
import FileAttachmentsList from '@/components/tenders/TenderAttachmentList';
import { colorClasses } from '@/utils/color';
import { TabNavigation } from '@/components/tenders/shared/TabNavigation';
import { InfoItem } from '@/components/tenders/shared/InfoItem';
import { SectionCard } from '@/components/tenders/shared/SectionCard';

// ============ FALLBACK COMPONENTS ============
const TabFallback: React.FC = () => (
    <div className="space-y-4 p-4">
        <Skeleton className={cn("h-8 w-3/4", colorClasses.bg.secondary)} />
        <Skeleton className={cn("h-32 w-full", colorClasses.bg.secondary)} />
        <Skeleton className={cn("h-32 w-full", colorClasses.bg.secondary)} />
    </div>
);

// ============ HELPER COMPONENTS ============

interface StatusBadgeProps {
    status: TenderStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const getStatusColor = () => {
        switch (status) {
            case 'draft':
                return colorClasses.bg.secondary;
            case 'published':
                return colorClasses.bg.emerald;
            case 'locked':
                return colorClasses.bg.blue;
            case 'deadline_reached':
                return colorClasses.bg.amber;
            case 'revealed':
                return colorClasses.bg.purple;
            case 'closed':
                return colorClasses.bg.indigo;
            case 'cancelled':
                return colorClasses.bg.red;
            default:
                return colorClasses.bg.secondary;
        }
    };

    const getStatusLabel = () => {
        return TENDER_STATUSES.find(s => s.value === status)?.label || status;
    };

    return (
        <Badge className={cn("px-3 py-1.5", getStatusColor(), colorClasses.text.white)}>
            {getStatusLabel()}
        </Badge>
    );
};

// ============ INVITE DIALOG ============

interface InviteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tenderId: string;
    onInvite: (data: { users?: string[]; companies?: string[]; emails?: string[] }) => void;
    isInviting: boolean;
}

const InviteDialog: React.FC<InviteDialogProps> = ({
    open,
    onOpenChange,
    onInvite,
    isInviting
}) => {
    const [emails, setEmails] = useState('');
    const [message, setMessage] = useState('');
    const { getTouchTargetSize } = useResponsive();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const emailList = emails.split(',').map(email => email.trim()).filter(Boolean);
        if (emailList.length > 0) {
            onInvite({ emails: emailList });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn(
                "sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto",
                colorClasses.bg.primary
            )}>
                <DialogHeader>
                    <DialogTitle className={colorClasses.text.primary}>Invite to Tender</DialogTitle>
                    <DialogDescription className={colorClasses.text.muted}>
                        Send email invitations to potential bidders
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="emails" className={colorClasses.text.primary}>
                                Email Addresses
                            </Label>
                            <Textarea
                                id="emails"
                                placeholder="Enter email addresses separated by commas"
                                value={emails}
                                onChange={(e) => setEmails(e.target.value)}
                                disabled={isInviting}
                                rows={3}
                                className={cn(
                                    colorClasses.bg.secondary,
                                    colorClasses.text.primary,
                                    colorClasses.border.gray100
                                )}
                            />
                            <p className={cn("text-xs", colorClasses.text.muted)}>
                                Multiple emails can be separated by commas
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="message" className={colorClasses.text.primary}>
                                Personal Message (Optional)
                            </Label>
                            <Textarea
                                id="message"
                                placeholder="Add a personal message to the invitation"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                disabled={isInviting}
                                rows={2}
                                className={cn(
                                    colorClasses.bg.secondary,
                                    colorClasses.text.primary,
                                    colorClasses.border.gray100
                                )}
                            />
                        </div>
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isInviting}
                            className={cn("w-full sm:w-auto", getTouchTargetSize('lg'))}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!emails.trim() || isInviting}
                            className={cn(
                                "w-full sm:w-auto",
                                colorClasses.bg.blue,
                                colorClasses.text.white,
                                getTouchTargetSize('lg')
                            )}
                        >
                            {isInviting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" />
                                    Send Invitations
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

// ============ MAIN COMPONENT ============

interface OwnerTenderDetailsProps {
    tenderId: string;
    userRole: 'organization' | 'company';
    onEdit?: () => void;
    onShare?: () => void;
    onPublish?: () => void;
    onDelete?: () => void;
    onRevealProposals?: () => void;
    onInviteUsers?: () => void;
    className?: string;
}

export const OwnerTenderDetails: React.FC<OwnerTenderDetailsProps> = ({
    tenderId,
    userRole,
    onEdit,
    onShare,
    onPublish,
    onDelete,
    onRevealProposals,
    onInviteUsers,
    className = ''
}) => {
    const { toast } = useToast();
    const { user } = useAuth();
    const { breakpoint, getTouchTargetSize } = useResponsive();
    const [activeTab, setActiveTab] = useState('overview');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showPublishDialog, setShowPublishDialog] = useState(false);
    const [showRevealDialog, setShowRevealDialog] = useState(false);
    const [showInviteDialog, setShowInviteDialog] = useState(false);

    // Hooks
    const {
        tender,
        canViewProposals,
        isOwner,
        canEdit,
        isLoading,
        error,
        refetch
    } = useOwnerTender(tenderId);

    const { data: statsData, isLoading: statsLoading } = useTenderStats(tenderId);
    const deleteTender = useDeleteTender();
    const publishTender = usePublishTender();
    const revealProposals = useRevealProposals();
    const inviteUsers = useInviteUsersToTender();
    const cpoUtils = useCPOUtils();

    // Derived state
    const isActive = useMemo(() => {
        return tender ? isTenderActive(tender) : false;
    }, [tender]);

    const progress = useMemo(() => {
        return tender ? calculateProgress(tender) : 0;
    }, [tender]);

    const deadlineInfo = useMemo(() => {
        if (!tender) return null;

        const deadline = new Date(tender.deadline);
        const now = new Date();
        const diffMs = deadline.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

        if (diffMs <= 0) {
            return {
                text: 'Deadline passed',
                color: colorClasses.text.red,
                urgency: 'expired' as const,
                days: 0,
                hours: 0
            };
        }

        if (diffDays === 0 && diffHours <= 24) {
            return {
                text: `Ends in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`,
                color: colorClasses.text.amber,
                urgency: 'urgent' as const,
                days: 0,
                hours: diffHours
            };
        }

        if (diffDays <= 7) {
            return {
                text: `Ends in ${diffDays} day${diffDays !== 1 ? 's' : ''}`,
                color: colorClasses.text.amber,
                urgency: 'soon' as const,
                days: diffDays,
                hours: diffHours
            };
        }

        return {
            text: `Ends ${deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
            color: colorClasses.text.muted,
            urgency: 'normal' as const,
            days: diffDays,
            hours: diffHours
        };
    }, [tender]);

    const cpoInfo = useMemo(() => {
        return tender ? cpoUtils.getCPOInfo(tender) : { required: false, description: '', hasDescription: false };
    }, [tender, cpoUtils]);

    // Format currency
    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Format date
    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Handle copy link
    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        toast({
            title: 'Link copied',
            description: 'Tender link copied to clipboard',
            variant: 'success',
        });
    };

    // Handle publish
    const handlePublish = async () => {
        try {
            await publishTender.mutateAsync(tenderId);
            setShowPublishDialog(false);
            refetch();
            onPublish?.();
            toast({
                title: 'Success',
                description: 'Tender published successfully',
                variant: 'success',
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to publish tender',
                variant: 'destructive',
            });
        }
    };

    // Handle delete
    const handleDelete = async () => {
        try {
            await deleteTender.mutateAsync(tenderId);
            setShowDeleteDialog(false);
            onDelete?.();
            toast({
                title: 'Success',
                description: 'Tender deleted successfully',
                variant: 'success',
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete tender',
                variant: 'destructive',
            });
        }
    };

    // Handle reveal proposals
    const handleRevealProposals = async () => {
        try {
            await revealProposals.mutateAsync(tenderId);
            setShowRevealDialog(false);
            refetch();
            onRevealProposals?.();
            toast({
                title: 'Success',
                description: 'Proposals revealed successfully',
                variant: 'success',
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to reveal proposals',
                variant: 'destructive',
            });
        }
    };

    // Handle invite
    const handleInvite = async (data: { users?: string[]; companies?: string[]; emails?: string[] }) => {
        try {
            await inviteUsers.mutateAsync({ id: tenderId, data });
            setShowInviteDialog(false);
            onInviteUsers?.();
            toast({
                title: 'Success',
                description: 'Invitations sent successfully',
                variant: 'success',
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to send invitations',
                variant: 'destructive',
            });
        }
    };

    // Define tabs
    const tabs = useMemo(() => {
        if (!tender) return [];

        return [
            {
                id: 'overview',
                label: 'Overview',
                icon: <Eye className="w-4 h-4" />,
                mobileIcon: <Eye className="w-5 h-5" />,
                content: (
                    <Suspense fallback={<TabFallback />}>
                        <OwnerOverviewTabContent
                            tender={tender}
                            deadlineInfo={deadlineInfo}
                            statsData={statsData}
                            formatCurrency={formatCurrency}
                            formatDate={formatDate}
                            onViewDetails={() => setActiveTab('details')}
                        />
                    </Suspense>
                )
            },
            {
                id: 'details',
                label: 'Details',
                icon: <FileText className="w-4 h-4" />,
                mobileIcon: <FileText className="w-5 h-5" />,
                content: (
                    <Suspense fallback={<TabFallback />}>
                        <OwnerDetailsTabContent
                            tender={tender}
                            cpoInfo={cpoInfo}
                            formatCurrency={formatCurrency}
                            formatDate={formatDate}
                        />
                    </Suspense>
                )
            },
            {
                id: 'attachments',
                label: 'Attachments',
                icon: <FolderOpen className="w-4 h-4" />,
                mobileIcon: <FolderOpen className="w-5 h-5" />,
                badge: tender.attachments?.length || 0,
                content: (
                    <Suspense fallback={<TabFallback />}>
                        <OwnerAttachmentsTabContent
                            tenderId={tender._id}
                            attachments={tender.attachments || []}
                            isOwner={true}
                            allowDelete={tender.status === 'draft'}
                            onDelete={refetch}
                            breakpoint={breakpoint}
                        />
                    </Suspense>
                )
            },
            {
                id: 'proposals',
                label: 'Proposals',
                icon: <Users className="w-4 h-4" />,
                mobileIcon: <Users className="w-5 h-5" />,
                badge: tender.metadata?.totalApplications || 0,
                content: (
                    <Suspense fallback={<TabFallback />}>
                        <OwnerProposalsTabContent
                            tender={tender}
                            onReveal={() => setShowRevealDialog(true)}
                            isRevealing={revealProposals.status === 'pending'}
                        />
                    </Suspense>
                )
            },
            {
                id: 'stats',
                label: 'Stats',
                icon: <BarChart3 className="w-4 h-4" />,
                mobileIcon: <BarChart3 className="w-5 h-5" />,
                content: (
                    <Suspense fallback={<TabFallback />}>
                        <OwnerStatsTabContent
                            statsData={statsData}
                            isLoading={statsLoading}
                        />
                    </Suspense>
                )
            },
            {
                id: 'config',
                label: 'Config',
                icon: <Settings className="w-4 h-4" />,
                mobileIcon: <Settings className="w-5 h-5" />,
                content: (
                    <Suspense fallback={<TabFallback />}>
                        <OwnerConfigTabContent
                            tender={tender}
                            onEdit={onEdit}
                            onPublish={() => setShowPublishDialog(true)}
                            onInvite={() => setShowInviteDialog(true)}
                            onDelete={() => setShowDeleteDialog(true)}
                            isPublishing={publishTender.status === 'pending'}
                            isDeleting={deleteTender.status === 'pending'}
                        />
                    </Suspense>
                )
            }
        ];
    }, [tender, deadlineInfo, statsData, statsLoading, cpoInfo, breakpoint]);

    // Loading state
    if (isLoading) {
        return (
            <div className={cn("container mx-auto px-4 md:px-6 py-6", className)}>
                <LoadingState />
            </div>
        );
    }

    // Error state
    if (error || !tender) {
        const errorMessage = error?.message || 'Failed to load tender';
        const is403 = errorMessage.includes('Access denied') || errorMessage.includes('403');

        return (
            <div className={cn("container mx-auto px-4 md:px-6 py-6", className)}>
                <ErrorState
                    message={is403 ? 'You do not have permission to view this tender' : errorMessage}
                    onRetry={refetch}
                />
            </div>
        );
    }

    return (
        <div className={cn(
            colorClasses.bg.primary,
            "rounded-2xl border",
            colorClasses.border.gray100,
            "shadow-sm",
            className
        )}>
            {/* Header */}
            <div className={cn(
                "px-4 md:px-6 py-4 border-b sticky top-0 z-10 backdrop-blur-sm",
                colorClasses.border.gray100,
                colorClasses.bg.primary,
                "bg-opacity-95"
            )}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="w-full md:w-auto">
                        <h1 className={cn("text-xl md:text-2xl font-bold", colorClasses.text.primary)}>
                            {tender.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            <StatusBadge status={tender.status} />
                            <Badge
                                variant="outline"
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5",
                                    tender.workflowType === 'open'
                                        ? cn(colorClasses.border.emerald, colorClasses.text.emerald)
                                        : cn(colorClasses.border.blue, colorClasses.text.blue),
                                    getTouchTargetSize('sm')
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
                            <Badge
                                variant="outline"
                                className={cn(
                                    "px-3 py-1.5",
                                    tender.tenderCategory === 'freelance'
                                        ? cn(colorClasses.border.purple, colorClasses.text.purple)
                                        : cn(colorClasses.border.amber, colorClasses.text.amber),
                                    getTouchTargetSize('sm')
                                )}
                            >
                                {tender.tenderCategory === 'freelance' ? 'Freelance' : 'Professional'}
                            </Badge>
                        </div>
                    </div>

                    {/* Header Actions - Desktop */}
                    {breakpoint !== 'mobile' && (
                        <div className="flex flex-wrap gap-2">
                            {tender.status === 'draft' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onEdit}
                                    className={cn("gap-2", getTouchTargetSize('md'))}
                                >
                                    <Edit className="w-4 h-4" />
                                    Edit
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCopyLink}
                                className={cn("gap-2", getTouchTargetSize('md'))}
                            >
                                <Copy className="w-4 h-4" />
                                Copy Link
                            </Button>
                            {onShare && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onShare}
                                    className={cn("gap-2", getTouchTargetSize('md'))}
                                >
                                    <Share2 className="w-4 h-4" />
                                    Share
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                {isActive && (
                    <div className="mt-4 flex items-center gap-4">
                        <div className="flex-1">
                            <Progress
                                value={progress}
                                className={cn("h-2", colorClasses.bg.secondary)}
                                indicatorStyle={{ backgroundColor: '#3B82F6' }}
                            />
                        </div>
                        <span className={cn("text-sm font-medium", deadlineInfo?.color || colorClasses.text.muted)}>
                            {deadlineInfo?.text}
                        </span>
                    </div>
                )}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                {/* Tab Navigation */}
                <div className={cn(
                    "px-4 md:px-6 pt-4",
                    breakpoint === 'mobile' && "pb-20"
                )}>
                    <TabNavigation
                        tabs={tabs}
                        activeTab={activeTab}
                        onChange={setActiveTab}
                    />
                </div>

                {/* Tab Content */}
                <div className="p-4 md:p-6">
                    {tabs.map(tab => (
                        <TabsContent key={tab.id} value={tab.id} className="mt-0">
                            {tab.content}
                        </TabsContent>
                    ))}
                </div>
            </Tabs>

            {/* Mobile Floating Action Buttons */}
            {breakpoint === 'mobile' && (
                <div className={cn(
                    "fixed bottom-20 left-4 right-4 z-40",
                    "flex flex-col gap-2",
                    "animate-slide-up"
                )}>
                    {tender.status === 'draft' && (
                        <Button
                            variant="outline"
                            onClick={onEdit}
                            className={cn(
                                "w-full",
                                colorClasses.bg.primary,
                                getTouchTargetSize('lg')
                            )}
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Tender
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        onClick={handleCopyLink}
                        className={cn(
                            "w-full",
                            colorClasses.bg.primary,
                            getTouchTargetSize('lg')
                        )}
                    >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                    </Button>
                </div>
            )}

            {/* Dialogs */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent className={cn(
                    "w-[95vw] max-w-md",
                    colorClasses.bg.primary
                )}>
                    <AlertDialogHeader>
                        <AlertDialogTitle className={colorClasses.text.primary}>
                            Are you sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription className={colorClasses.text.muted}>
                            This action cannot be undone. This will permanently delete the tender
                            and all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel className={cn("w-full sm:w-auto", getTouchTargetSize('lg'))}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className={cn(
                                "w-full sm:w-auto",
                                colorClasses.bg.red,
                                colorClasses.text.white,
                                getTouchTargetSize('lg')
                            )}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
                <AlertDialogContent className={cn(
                    "w-[95vw] max-w-md",
                    colorClasses.bg.primary
                )}>
                    <AlertDialogHeader>
                        <AlertDialogTitle className={colorClasses.text.primary}>
                            Publish Tender
                        </AlertDialogTitle>
                        <AlertDialogDescription className={colorClasses.text.muted}>
                            Are you sure you want to publish this tender? Once published,
                            it will be visible to applicants and cannot be edited (depending on workflow type).
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel className={cn("w-full sm:w-auto", getTouchTargetSize('lg'))}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handlePublish}
                            className={cn(
                                "w-full sm:w-auto",
                                colorClasses.bg.emerald,
                                colorClasses.text.white,
                                getTouchTargetSize('lg')
                            )}
                        >
                            Publish
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showRevealDialog} onOpenChange={setShowRevealDialog}>
                <AlertDialogContent className={cn(
                    "w-[95vw] max-w-md",
                    colorClasses.bg.primary
                )}>
                    <AlertDialogHeader>
                        <AlertDialogTitle className={colorClasses.text.primary}>
                            Reveal Proposals
                        </AlertDialogTitle>
                        <AlertDialogDescription className={colorClasses.text.muted}>
                            Are you sure you want to reveal all proposals? This action will
                            decrypt and make all proposals visible. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel className={cn("w-full sm:w-auto", getTouchTargetSize('lg'))}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRevealProposals}
                            className={cn(
                                "w-full sm:w-auto",
                                colorClasses.bg.blue,
                                colorClasses.text.white,
                                getTouchTargetSize('lg')
                            )}
                        >
                            Reveal
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <InviteDialog
                open={showInviteDialog}
                onOpenChange={setShowInviteDialog}
                tenderId={tenderId}
                onInvite={handleInvite}
                isInviting={inviteUsers.status === 'pending'}
            />
        </div>
    );
};

// ============ TAB CONTENT COMPONENTS (INLINE FOR SIMPLICITY) ============

interface OwnerOverviewTabContentProps {
    tender: Tender;
    deadlineInfo: any;
    statsData: any;
    formatCurrency: (amount: number, currency: string) => string;
    formatDate: (date: Date | string) => string;
    onViewDetails: () => void;
}

const OwnerOverviewTabContent: React.FC<OwnerOverviewTabContentProps> = ({
    tender,
    deadlineInfo,
    statsData,
    formatCurrency,
    formatDate,
    onViewDetails
}) => {
    const { getTouchTargetSize } = useResponsive();

    return (
        <div className="space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <Card className={cn(colorClasses.bg.primary, colorClasses.border.gray100)}>
                    <CardContent className="p-3 md:p-4">
                        <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-lg", colorClasses.bg.blueLight)}>
                                <Users className={cn("w-5 h-5", colorClasses.text.blue)} />
                            </div>
                            <div className="min-w-0">
                                <p className={cn("text-sm", colorClasses.text.muted)}>Applications</p>
                                <p className={cn("text-xl md:text-2xl font-bold", colorClasses.text.primary)}>
                                    {tender.metadata?.totalApplications || 0}
                                </p>
                                <p className={cn("text-xs", colorClasses.text.muted)}>
                                    {tender.metadata?.visibleApplications || 0} visible
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={cn(colorClasses.bg.primary, colorClasses.border.gray100)}>
                    <CardContent className="p-3 md:p-4">
                        <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-lg", colorClasses.bg.amberLight)}>
                                <Eye className={cn("w-5 h-5", colorClasses.text.amber)} />
                            </div>
                            <div className="min-w-0">
                                <p className={cn("text-sm", colorClasses.text.muted)}>Views</p>
                                <p className={cn("text-xl md:text-2xl font-bold", colorClasses.text.primary)}>
                                    {tender.metadata?.views || 0}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={cn(colorClasses.bg.primary, colorClasses.border.gray100)}>
                    <CardContent className="p-3 md:p-4">
                        <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-lg", colorClasses.bg.emeraldLight)}>
                                <Calendar className={cn("w-5 h-5", colorClasses.text.emerald)} />
                            </div>
                            <div className="min-w-0">
                                <p className={cn("text-sm", colorClasses.text.muted)}>Days Remaining</p>
                                <p className={cn("text-xl md:text-2xl font-bold", deadlineInfo?.color || colorClasses.text.primary)}>
                                    {deadlineInfo?.days || 0}
                                </p>
                                <p className={cn("text-xs", colorClasses.text.muted)}>
                                    {deadlineInfo?.urgency === 'urgent' ? 'Urgent' : 'days'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={cn(colorClasses.bg.primary, colorClasses.border.gray100)}>
                    <CardContent className="p-3 md:p-4">
                        <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-lg", colorClasses.bg.purpleLight)}>
                                <BookmarkCheck className={cn("w-5 h-5", colorClasses.text.purple)} />
                            </div>
                            <div className="min-w-0">
                                <p className={cn("text-sm", colorClasses.text.muted)}>Saved</p>
                                <p className={cn("text-xl md:text-2xl font-bold", colorClasses.text.primary)}>
                                    {tender.metadata?.savedCount || 0}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Basic Information */}
            <SectionCard
                title="Basic Information"
                icon={<FileText className={cn("w-5 h-5", colorClasses.text.blue)} />}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <InfoItem
                        label="Tender ID"
                        value={tender.tenderId || tender._id.substring(0, 12)}
                    />
                    <InfoItem
                        label="Reference Number"
                        value={tender.professionalSpecific?.referenceNumber || 'N/A'}
                    />
                    <InfoItem
                        label="Category"
                        value={tender.procurementCategory}
                    />
                    <InfoItem
                        label="Created"
                        value={formatDate(tender.createdAt)}
                    />
                    <InfoItem
                        label="Deadline"
                        value={deadlineInfo?.text || formatDate(tender.deadline)}
                    />
                    <InfoItem
                        label="Status"
                        value={<StatusBadge status={tender.status} />}
                        badge
                    />
                </div>
            </SectionCard>

            {/* Description Preview */}
            <SectionCard
                title="Project Description"
                icon={<FileText className={cn("w-5 h-5", colorClasses.text.emerald)} />}
                action={
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onViewDetails}
                        className={cn("gap-1", getTouchTargetSize('md'))}
                    >
                        View Full Details
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                }
            >
                <p className={cn("line-clamp-3", colorClasses.text.primary)}>
                    {tender.description}
                </p>
            </SectionCard>

            {/* Skills & Owner Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {tender.skillsRequired && tender.skillsRequired.length > 0 && (
                    <SectionCard
                        title="Required Skills"
                        icon={<Zap className={cn("w-5 h-5", colorClasses.text.amber)} />}
                    >
                        <div className="flex flex-wrap gap-2">
                            {tender.skillsRequired.map((skill, index) => (
                                <Badge
                                    key={index}
                                    variant="secondary"
                                    className={cn(
                                        "px-3 py-1.5 text-sm",
                                        colorClasses.bg.secondary,
                                        colorClasses.text.primary
                                    )}
                                >
                                    {skill}
                                </Badge>
                            ))}
                        </div>
                    </SectionCard>
                )}

                <SectionCard
                    title="Procuring Entity"
                    icon={<Building className={cn("w-5 h-5", colorClasses.text.indigo)} />}
                >
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                                colorClasses.bg.secondary
                            )}>
                                <Building className={cn("w-6 h-6", colorClasses.text.muted)} />
                            </div>
                            <div className="min-w-0">
                                <h4 className={cn("font-semibold", colorClasses.text.primary)}>
                                    {tender.ownerEntity?.name}
                                </h4>
                                <p className={cn("text-sm", colorClasses.text.muted)}>
                                    {tender.professionalSpecific?.procuringEntity || tender.ownerEntity?.description}
                                </p>
                            </div>
                        </div>
                        {tender.ownerEntity?.verified && (
                            <Badge variant="outline" className={cn(colorClasses.border.emerald, colorClasses.text.emerald)}>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Verified
                            </Badge>
                        )}
                    </div>
                </SectionCard>
            </div>
        </div>
    );
};

interface OwnerDetailsTabContentProps {
    tender: Tender;
    cpoInfo: any;
    formatCurrency: (amount: number, currency: string) => string;
    formatDate: (date: Date | string) => string;
}

const OwnerDetailsTabContent: React.FC<OwnerDetailsTabContentProps> = ({
    tender,
    cpoInfo,
    formatCurrency,
    formatDate
}) => {
    return (
        <div className="space-y-6">
            {/* Full Description */}
            <SectionCard
                title="Full Description & Objectives"
                icon={<FileText className={cn("w-5 h-5", colorClasses.text.blue)} />}
            >
                <div className="prose max-w-none">
                    {tender.description.split('\n').map((paragraph, index) => (
                        <p key={index} className={cn("mb-3 last:mb-0", colorClasses.text.primary)}>
                            {paragraph}
                        </p>
                    ))}
                </div>
            </SectionCard>

            {/* Technical Requirements */}
            <SectionCard
                title="Technical Requirements"
                icon={<Settings className={cn("w-5 h-5", colorClasses.text.purple)} />}
            >
                {tender.tenderCategory === 'freelance' && tender.freelanceSpecific && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <h4 className={cn("font-medium", colorClasses.text.primary)}>Engagement Type</h4>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "px-3 py-1.5",
                                        tender.freelanceSpecific.engagementType === 'fixed_price'
                                            ? cn(colorClasses.border.emerald, colorClasses.text.emerald)
                                            : cn(colorClasses.border.blue, colorClasses.text.blue)
                                    )}
                                >
                                    {ENGAGEMENT_TYPES.find(e => e.value === tender.freelanceSpecific?.engagementType)?.label ||
                                        tender.freelanceSpecific.engagementType}
                                </Badge>
                            </div>

                            {tender.freelanceSpecific.budget && (
                                <div className="space-y-3">
                                    <h4 className={cn("font-medium", colorClasses.text.primary)}>Budget</h4>
                                    <p className={cn("text-lg font-semibold", colorClasses.text.primary)}>
                                        {formatCurrency(tender.freelanceSpecific.budget.min, tender.freelanceSpecific.budget.currency)} -
                                        {formatCurrency(tender.freelanceSpecific.budget.max, tender.freelanceSpecific.budget.currency)}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <InfoItem
                                label="Experience Level"
                                value={EXPERIENCE_LEVELS.find(e => e.value === tender.freelanceSpecific?.experienceLevel)?.label ||
                                    tender.freelanceSpecific?.experienceLevel || 'N/A'}
                            />
                            <InfoItem
                                label="Project Type"
                                value={PROJECT_TYPES.find(p => p.value === tender.freelanceSpecific?.projectType)?.label ||
                                    tender.freelanceSpecific?.projectType || 'N/A'}
                            />
                            <InfoItem
                                label="Portfolio Required"
                                value={tender.freelanceSpecific?.portfolioRequired ? 'Yes' : 'No'}
                            />
                        </div>
                    </div>
                )}

                {tender.tenderCategory === 'professional' && tender.professionalSpecific && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <h4 className={cn("font-medium", colorClasses.text.primary)}>Procurement Method</h4>
                                <Badge variant="outline" className={cn("px-3 py-1.5", colorClasses.border.blue, colorClasses.text.blue)}>
                                    {PROCUREMENT_METHODS.find(p => p.value === tender.professionalSpecific?.procurementMethod)?.label ||
                                        tender.professionalSpecific?.procurementMethod || 'N/A'}
                                </Badge>
                            </div>

                            {tender.professionalSpecific.fundingSource && (
                                <div className="space-y-3">
                                    <h4 className={cn("font-medium", colorClasses.text.primary)}>Funding Source</h4>
                                    <p className={colorClasses.text.primary}>{tender.professionalSpecific.fundingSource}</p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <InfoItem
                                label="Minimum Experience"
                                value={`${tender.professionalSpecific.minimumExperience || 0} years`}
                            />
                            <InfoItem
                                label="Legal Registration"
                                value={tender.professionalSpecific.legalRegistrationRequired ? 'Required' : 'Not Required'}
                            />
                            <InfoItem
                                label="Evaluation Method"
                                value={EVALUATION_METHODS.find(e => e.value === tender.professionalSpecific?.evaluationMethod)?.label ||
                                    tender.professionalSpecific?.evaluationMethod || 'N/A'}
                            />
                        </div>

                        {tender.professionalSpecific.timeline && (
                            <div className="space-y-3">
                                <h4 className={cn("font-medium", colorClasses.text.primary)}>Project Timeline</h4>
                                <div className={cn("p-4 border rounded-lg", colorClasses.bg.secondary, colorClasses.border.gray100)}>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <p className={cn("text-sm", colorClasses.text.muted)}>Start Date</p>
                                            <p className={cn("font-medium", colorClasses.text.primary)}>
                                                {formatDate(tender.professionalSpecific.timeline.startDate)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className={cn("text-sm", colorClasses.text.muted)}>End Date</p>
                                            <p className={cn("font-medium", colorClasses.text.primary)}>
                                                {formatDate(tender.professionalSpecific.timeline.endDate)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className={cn("text-sm", colorClasses.text.muted)}>Duration</p>
                                            <p className={cn("font-medium", colorClasses.text.primary)}>
                                                {tender.professionalSpecific.timeline.duration.value} {tender.professionalSpecific.timeline.duration.unit}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </SectionCard>

            {/* Compliance & Eligibility */}
            <SectionCard
                title="Compliance & Eligibility"
                icon={<Shield className={cn("w-5 h-5", colorClasses.text.amber)} />}
            >
                {tender.tenderCategory === 'professional' && tender.professionalSpecific && (
                    <div className="space-y-6">
                        {tender.professionalSpecific.requiredCertifications &&
                            tender.professionalSpecific.requiredCertifications.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className={cn("font-medium", colorClasses.text.primary)}>Required Certifications</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {tender.professionalSpecific.requiredCertifications.map((cert, idx) => (
                                            <div key={idx} className={cn("p-3 border rounded-lg", colorClasses.bg.secondary, colorClasses.border.gray100)}>
                                                <p className={cn("font-medium", colorClasses.text.primary)}>{cert.name}</p>
                                                <p className={cn("text-sm", colorClasses.text.muted)}>Issuer: {cert.issuingAuthority}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        {tender.professionalSpecific.financialCapacity && (
                            <div className="space-y-3">
                                <h4 className={cn("font-medium", colorClasses.text.primary)}>Financial Capacity</h4>
                                <div className={cn("p-4 border rounded-lg", colorClasses.bg.secondary, colorClasses.border.gray100)}>
                                    <p className={cn("text-lg font-semibold", colorClasses.text.primary)}>
                                        {formatCurrency(
                                            tender.professionalSpecific.financialCapacity.minAnnualTurnover,
                                            tender.professionalSpecific.financialCapacity.currency
                                        )}
                                    </p>
                                    <p className={cn("text-sm", colorClasses.text.muted)}>Minimum Annual Turnover</p>
                                </div>
                            </div>
                        )}

                        {cpoInfo.required && (
                            <div className="space-y-3">
                                <h4 className={cn("font-medium", colorClasses.text.primary)}>CPO Requirements</h4>
                                <Alert className={cn(colorClasses.bg.amberLight, colorClasses.border.amber)}>
                                    <Shield className={cn("h-4 w-4", colorClasses.text.amber)} />
                                    <AlertTitle className={colorClasses.text.amber}>CPO Required</AlertTitle>
                                    <AlertDescription className={colorClasses.text.amber}>
                                        {cpoInfo.description || 'A Certified Payment Order (CPO) is required for this tender.'}
                                    </AlertDescription>
                                </Alert>
                            </div>
                        )}
                    </div>
                )}
            </SectionCard>
        </div>
    );
};

interface OwnerAttachmentsTabContentProps {
    tenderId: string;
    attachments: any[];
    isOwner: boolean;
    allowDelete: boolean;
    onDelete: () => void;
    breakpoint: string;
}

const OwnerAttachmentsTabContent: React.FC<OwnerAttachmentsTabContentProps> = ({
    tenderId,
    attachments,
    isOwner,
    allowDelete,
    onDelete,
    breakpoint
}) => {
    const variant = breakpoint === 'mobile' ? 'mobile' : breakpoint === 'tablet' ? 'tablet' : 'desktop';

    return (
        <FileAttachmentsList
            tenderId={tenderId}
            attachments={attachments}
            isOwner={isOwner}
            allowDownload={true}
            allowDelete={allowDelete}
            showPreview={true}
            variant={variant}
            onDelete={onDelete}
        />
    );
};

interface OwnerProposalsTabContentProps {
    tender: Tender;
    onReveal: () => void;
    isRevealing: boolean;
}

const OwnerProposalsTabContent: React.FC<OwnerProposalsTabContentProps> = ({
    tender,
    onReveal,
    isRevealing
}) => {
    const { getTouchTargetSize } = useResponsive();
    const isSealed = tender.workflowType === 'closed' && !tender.revealedAt;
    const deadlinePassed = new Date(tender.deadline) < new Date();

    return (
        <Card className={cn(colorClasses.bg.primary, colorClasses.border.gray100)}>
            <CardHeader>
                <CardTitle className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <Users className={cn("w-5 h-5", colorClasses.text.primary)} />
                        <span className={colorClasses.text.primary}>Proposals</span>
                    </div>
                    <Badge variant="outline" className={cn("ml-2", colorClasses.border.gray100)}>
                        {tender.metadata?.totalApplications || 0} total
                    </Badge>
                </CardTitle>
                <CardDescription className={colorClasses.text.muted}>
                    {isSealed
                        ? 'Proposals are sealed until the official reveal time'
                        : tender.workflowType === 'open' ? 'Visible proposals' : 'Proposal submission status'}
                </CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
                {isSealed ? (
                    <div className="text-center py-8 md:py-12">
                        <div className="inline-flex flex-col items-center max-w-lg mx-auto">
                            <div className={cn("p-6 rounded-full mb-6", colorClasses.bg.secondary)}>
                                <Lock className={cn("w-12 h-12 md:w-16 md:h-16", colorClasses.text.muted)} />
                            </div>

                            <h3 className={cn("text-xl md:text-2xl font-bold mb-3", colorClasses.text.primary)}>
                                Proposals Are Sealed
                            </h3>
                            <p className={cn("mb-8 px-4", colorClasses.text.muted)}>
                                This is a sealed bid tender. All proposals are encrypted and securely stored.
                                You can reveal proposals after the deadline.
                            </p>

                            <div className={cn(
                                "rounded-lg p-4 w-full",
                                colorClasses.bg.blueLight,
                                colorClasses.border.blue
                            )}>
                                <div className="flex items-center gap-3 mb-2">
                                    <Shield className={cn("w-5 h-5", colorClasses.text.blue)} />
                                    <h4 className={cn("font-medium", colorClasses.text.blue)}>Security Information</h4>
                                </div>
                                <ul className={cn("text-sm text-left space-y-1", colorClasses.text.blue)}>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                        <span>{tender.metadata?.sealedProposals || 0} sealed proposals submitted</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                        <span>Proposals encrypted with AES-256</span>
                                    </li>
                                </ul>
                            </div>

                            {deadlinePassed && (
                                <div className="mt-8 w-full">
                                    <Button
                                        onClick={onReveal}
                                        className={cn(
                                            "w-full sm:w-auto",
                                            colorClasses.bg.blue,
                                            colorClasses.text.white,
                                            getTouchTargetSize('lg')
                                        )}
                                        disabled={isRevealing}
                                    >
                                        {isRevealing ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Revealing...
                                            </>
                                        ) : (
                                            <>
                                                <Eye className="mr-2 h-4 w-4" />
                                                Reveal Proposals
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            <Card className={colorClasses.bg.secondary}>
                                <CardContent className="p-4">
                                    <p className={cn("text-sm", colorClasses.text.muted)}>Total Applications</p>
                                    <p className={cn("text-2xl md:text-3xl font-bold", colorClasses.text.primary)}>
                                        {tender.metadata?.totalApplications || 0}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className={colorClasses.bg.secondary}>
                                <CardContent className="p-4">
                                    <p className={cn("text-sm", colorClasses.text.muted)}>Visible</p>
                                    <p className={cn("text-2xl md:text-3xl font-bold", colorClasses.text.primary)}>
                                        {tender.metadata?.visibleApplications || 0}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className={colorClasses.bg.secondary}>
                                <CardContent className="p-4">
                                    <p className={cn("text-sm", colorClasses.text.muted)}>Sealed</p>
                                    <p className={cn("text-2xl md:text-3xl font-bold", colorClasses.text.primary)}>
                                        {tender.metadata?.sealedProposals || 0}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {tender.metadata?.visibleApplications > 0 && (
                            <div className="flex flex-col sm:flex-row justify-end gap-2">
                                <Button variant="outline" size="sm" className={cn("gap-2", getTouchTargetSize('md'))}>
                                    <Download className="w-4 h-4" />
                                    Export All
                                </Button>
                                <Button variant="outline" size="sm" className={cn("gap-2", getTouchTargetSize('md'))}>
                                    <BarChart3 className="w-4 h-4" />
                                    View Analytics
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

interface OwnerStatsTabContentProps {
    statsData: any;
    isLoading: boolean;
}

const OwnerStatsTabContent: React.FC<OwnerStatsTabContentProps> = ({
    statsData,
    isLoading
}) => {
    const stats = statsData?.stats;

    if (isLoading) {
        return <LoadingState type="compact" />;
    }

    if (!stats) {
        return (
            <p className={cn("text-center py-8", colorClasses.text.muted)}>
                No statistics available yet
            </p>
        );
    }

    return (
        <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <Card className={colorClasses.bg.primary}>
                    <CardContent className="p-3 md:p-4">
                        <p className={cn("text-sm", colorClasses.text.muted)}>Views</p>
                        <p className={cn("text-xl md:text-2xl font-bold", colorClasses.text.primary)}>
                            {stats.basic?.views || 0}
                        </p>
                        <p className={cn("text-xs", colorClasses.text.muted)}>Total views</p>
                    </CardContent>
                </Card>

                <Card className={colorClasses.bg.primary}>
                    <CardContent className="p-3 md:p-4">
                        <p className={cn("text-sm", colorClasses.text.muted)}>Applications</p>
                        <p className={cn("text-xl md:text-2xl font-bold", colorClasses.text.primary)}>
                            {stats.applications?.totalApplications || 0}
                        </p>
                        <p className={cn("text-xs", colorClasses.text.muted)}>
                            {stats.applications?.visibleApplications || 0} visible
                        </p>
                    </CardContent>
                </Card>

                <Card className={colorClasses.bg.primary}>
                    <CardContent className="p-3 md:p-4">
                        <p className={cn("text-sm", colorClasses.text.muted)}>Conversion Rate</p>
                        <p className={cn("text-xl md:text-2xl font-bold", colorClasses.text.primary)}>
                            {stats.basic?.views > 0
                                ? Math.round((stats.applications?.totalApplications / stats.basic.views) * 100)
                                : 0}%
                        </p>
                        <p className={cn("text-xs", colorClasses.text.muted)}>Views to applications</p>
                    </CardContent>
                </Card>

                <Card className={colorClasses.bg.primary}>
                    <CardContent className="p-3 md:p-4">
                        <p className={cn("text-sm", colorClasses.text.muted)}>Saved</p>
                        <p className={cn("text-xl md:text-2xl font-bold", colorClasses.text.primary)}>
                            {stats.basic?.savedCount || 0}
                        </p>
                        <p className={cn("text-xs", colorClasses.text.muted)}>Users saved this tender</p>
                    </CardContent>
                </Card>
            </div>

            {/* Application Status Breakdown */}
            <SectionCard
                title="Application Status"
                icon={<Users className={cn("w-5 h-5", colorClasses.text.blue)} />}
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className={cn("text-sm", colorClasses.text.muted)}>Submitted</span>
                            <span className={cn("font-medium", colorClasses.text.primary)}>
                                {stats.applications?.submitted || 0}
                            </span>
                        </div>
                        <Progress
                            value={stats.applications?.totalApplications > 0
                                ? ((stats.applications?.submitted || 0) / stats.applications.totalApplications) * 100
                                : 0}
                            className={cn("h-2", colorClasses.bg.secondary)}
                            indicatorStyle={{ backgroundColor: '#3B82F6' }}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className={cn("text-sm", colorClasses.text.muted)}>Under Review</span>
                            <span className={cn("font-medium", colorClasses.text.primary)}>
                                {stats.applications?.underReview || 0}
                            </span>
                        </div>
                        <Progress
                            value={stats.applications?.totalApplications > 0
                                ? ((stats.applications?.underReview || 0) / stats.applications.totalApplications) * 100
                                : 0}
                            className={cn("h-2", colorClasses.bg.secondary)}
                            indicatorStyle={{ backgroundColor: '#F59E0B' }}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className={cn("text-sm", colorClasses.text.muted)}>Shortlisted</span>
                            <span className={cn("font-medium", colorClasses.text.primary)}>
                                {stats.applications?.shortlisted || 0}
                            </span>
                        </div>
                        <Progress
                            value={stats.applications?.totalApplications > 0
                                ? ((stats.applications?.shortlisted || 0) / stats.applications.totalApplications) * 100
                                : 0}
                            className={cn("h-2", colorClasses.bg.secondary)}
                            indicatorStyle={{ backgroundColor: '#10B981' }}
                        />
                    </div>
                </div>
            </SectionCard>

            {/* Invitation Stats */}
            {stats.invitations && (
                <SectionCard
                    title="Invitations"
                    icon={<Mail className={cn("w-5 h-5", colorClasses.text.purple)} />}
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className={cn("text-sm", colorClasses.text.muted)}>Total</p>
                            <p className={cn("text-lg md:text-xl font-bold", colorClasses.text.primary)}>
                                {stats.invitations.totalInvited}
                            </p>
                        </div>
                        <div>
                            <p className={cn("text-sm", colorClasses.text.muted)}>Accepted</p>
                            <p className={cn("text-lg md:text-xl font-bold", colorClasses.text.emerald)}>
                                {stats.invitations.accepted}
                            </p>
                        </div>
                        <div>
                            <p className={cn("text-sm", colorClasses.text.muted)}>Pending</p>
                            <p className={cn("text-lg md:text-xl font-bold", colorClasses.text.amber)}>
                                {stats.invitations.pending}
                            </p>
                        </div>
                        <div>
                            <p className={cn("text-sm", colorClasses.text.muted)}>Declined</p>
                            <p className={cn("text-lg md:text-xl font-bold", colorClasses.text.red)}>
                                {stats.invitations.declined}
                            </p>
                        </div>
                    </div>
                </SectionCard>
            )}
        </div>
    );
};

interface OwnerConfigTabContentProps {
    tender: Tender;
    onEdit?: () => void;
    onPublish: () => void;
    onInvite: () => void;
    onDelete: () => void;
    isPublishing: boolean;
    isDeleting: boolean;
}

const OwnerConfigTabContent: React.FC<OwnerConfigTabContentProps> = ({
    tender,
    onEdit,
    onPublish,
    onInvite,
    onDelete,
    isPublishing,
    isDeleting
}) => {
    const { getTouchTargetSize } = useResponsive();

    return (
        <div className="space-y-6">
            {/* Draft Mode Banner */}
            {tender.status === 'draft' && (
                <Alert className={cn(colorClasses.bg.amberLight, colorClasses.border.amber)}>
                    <Info className={cn("h-4 w-4", colorClasses.text.amber)} />
                    <AlertTitle className={colorClasses.text.amber}>Draft Mode</AlertTitle>
                    <AlertDescription className={colorClasses.text.amber}>
                        This tender is in draft mode and not visible to the public.
                        Publish it to start accepting applications.
                    </AlertDescription>
                </Alert>
            )}

            {/* Publish Section */}
            {tender.status === 'draft' && (
                <SectionCard
                    title="Publish Tender"
                    icon={<Send className={cn("w-5 h-5", colorClasses.text.emerald)} />}
                >
                    <div className="space-y-4">
                        <p className={cn("text-sm", colorClasses.text.muted)}>
                            Publishing will make this tender visible to eligible applicants.
                        </p>
                        <Button
                            onClick={onPublish}
                            className={cn(
                                "w-full sm:w-auto",
                                colorClasses.bg.emerald,
                                colorClasses.text.white,
                                getTouchTargetSize('lg')
                            )}
                            disabled={isPublishing}
                        >
                            {isPublishing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Publishing...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" />
                                    Publish Tender
                                </>
                            )}
                        </Button>
                    </div>
                </SectionCard>
            )}

            {/* Invitations Section */}
            <SectionCard
                title="Invitations"
                description="Invite specific users or companies to this tender"
                icon={<Mail className={cn("w-5 h-5", colorClasses.text.blue)} />}
                action={
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onInvite}
                        className={cn("gap-2", getTouchTargetSize('md'))}
                        disabled={tender.status === 'draft'}
                    >
                        <Plus className="w-4 h-4" />
                        Invite
                    </Button>
                }
            >
                <div className="space-y-3">
                    <p className={cn("text-sm", colorClasses.text.muted)}>
                        Send email invitations to potential bidders.
                    </p>
                    {tender.invitations && tender.invitations.length > 0 && (
                        <div className="space-y-2">
                            <p className={cn("text-sm font-medium", colorClasses.text.primary)}>
                                Recent Invitations: {tender.invitations.length}
                            </p>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                {tender.invitations.slice(0, 3).map((invite) => (
                                    <div key={invite._id} className="flex items-center gap-2 text-sm">
                                        <Mail className="w-3 h-3 shrink-0" />
                                        <span className={cn("truncate", colorClasses.text.primary)}>
                                            {invite.email || 'Invited User'}
                                        </span>
                                        <Badge variant="outline" className="ml-auto text-xs">
                                            {invite.invitationStatus}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </SectionCard>

            {/* Tender Information */}
            <SectionCard
                title="Tender Information"
                icon={<FileText className={cn("w-5 h-5", colorClasses.text.muted)} />}
            >
                <div className="space-y-3">
                    <div className="flex justify-between">
                        <span className={cn("text-sm", colorClasses.text.muted)}>Created</span>
                        <span className={cn("text-sm font-medium", colorClasses.text.primary)}>
                            {new Date(tender.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className={cn("text-sm", colorClasses.text.muted)}>Last Updated</span>
                        <span className={cn("text-sm font-medium", colorClasses.text.primary)}>
                            {new Date(tender.updatedAt).toLocaleDateString()}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className={cn("text-sm", colorClasses.text.muted)}>Update Count</span>
                        <span className={cn("text-sm font-medium", colorClasses.text.primary)}>
                            {tender.metadata?.updateCount || 0}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className={cn("text-sm", colorClasses.text.muted)}>Max File Size</span>
                        <span className={cn("text-sm font-medium", colorClasses.text.primary)}>
                            {formatFileSize(tender.maxFileSize)}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className={cn("text-sm", colorClasses.text.muted)}>Max File Count</span>
                        <span className={cn("text-sm font-medium", colorClasses.text.primary)}>
                            {tender.maxFileCount}
                        </span>
                    </div>
                </div>
            </SectionCard>

            {/* Danger Zone */}
            <SectionCard
                title="Danger Zone"
                icon={<AlertTriangle className={cn("w-5 h-5", colorClasses.text.red)} />}
            >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <p className={cn("font-medium", colorClasses.text.primary)}>Delete Tender</p>
                        <p className={cn("text-sm", colorClasses.text.muted)}>
                            Once deleted, this tender cannot be recovered.
                        </p>
                    </div>
                    <Button
                        variant="destructive"
                        onClick={onDelete}
                        disabled={isDeleting}
                        className={cn("w-full sm:w-auto", getTouchTargetSize('lg'))}
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </>
                        )}
                    </Button>
                </div>
            </SectionCard>
        </div>
    );
};

// ============ LOADING AND ERROR STATES ============

interface LoadingStateProps {
    type?: 'full' | 'compact';
}

const LoadingState: React.FC<LoadingStateProps> = ({ type = 'full' }) => (
    <div className="space-y-4">
        {type === 'full' ? (
            <>
                <Skeleton className={cn("h-12 w-full", colorClasses.bg.secondary)} />
                <Skeleton className={cn("h-64 w-full", colorClasses.bg.secondary)} />
                <Skeleton className={cn("h-96 w-full", colorClasses.bg.secondary)} />
            </>
        ) : (
            <div className="space-y-3">
                <Skeleton className={cn("h-8 w-3/4", colorClasses.bg.secondary)} />
                <Skeleton className={cn("h-8 w-1/2", colorClasses.bg.secondary)} />
                <Skeleton className={cn("h-8 w-2/3", colorClasses.bg.secondary)} />
            </div>
        )}
    </div>
);

interface ErrorStateProps {
    message: string;
    onRetry: () => void;
    onBack?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry, onBack }) => {
    const { getTouchTargetSize } = useResponsive();

    return (
        <Alert variant="destructive" className="my-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <span>{message}</span>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    {onBack && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onBack}
                            className={cn("w-full sm:w-auto", getTouchTargetSize('md'))}
                        >
                            Go Back
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRetry}
                        className={cn("w-full sm:w-auto", getTouchTargetSize('md'))}
                    >
                        Retry
                    </Button>
                </div>
            </AlertDescription>
        </Alert>
    );
};

export default OwnerTenderDetails;