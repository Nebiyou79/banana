/* eslint-disable @typescript-eslint/no-explicit-any */
// components/social/post/PostActions.tsx
import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Flag, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { likeService, ReactionType } from '@/services/likeService';
import { useToast } from '@/hooks/use-toast';

interface PostActionsProps {
    post: any;
    onLike?: (reaction?: ReactionType) => void;
    onComment?: () => void;
    onShare?: () => void;
    onSave?: () => void;
    isLiked?: boolean;
    likeCount?: number;
    commentCount?: number;
    shareCount?: number;
    currentReaction?: ReactionType | null;
}

export const PostActions: React.FC<PostActionsProps> = ({
    post,
    onLike,
    onComment,
    onShare,
    isLiked = false,
    likeCount = 0,
    commentCount = 0,
    shareCount = 0,
    currentReaction = null
}) => {
    const [showReactions, setShowReactions] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [showReportDialog, setShowReportDialog] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const { toast } = useToast();

    const handleReactionClick = (reaction: ReactionType) => {
        if (onLike) onLike(reaction);
        setShowReactions(false);
    };

    const handleLikeClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onLike) onLike('like');
    };

    const handleCommentClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onComment) onComment();
    };

    const handleShareClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setShowShareMenu(!showShareMenu);
    };

    const handleSaveClick = async () => {
        setIsSaved(!isSaved);
        toast({
            variant: isSaved ? "info" : "success",
            title: isSaved ? "Unsaved" : "Saved",
            description: isSaved
                ? "Post removed from saved"
                : "Post saved to collection"
        });
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`);
        setShowShareMenu(false);
        toast({
            variant: "success",
            title: "Link copied",
            description: "Post link copied to clipboard"
        });
    };

    const handleReport = async (reason: string) => {
        console.log('Reporting post:', post._id, 'Reason:', reason);
        setShowReportDialog(false);
        toast({
            variant: "success",
            title: "Report submitted",
            description: "Our team will review it."
        });
    };

    const getCurrentReactionEmoji = () => {
        if (currentReaction) return likeService.getReactionEmoji(currentReaction);
        return isLiked ? '❤️' : '🤍';
    };

    return (
        <div className="px-2 py-1.5 border-t border-gray-100">
            <div className="flex items-center justify-between">
                {/* Left Actions */}
                <div className="flex items-center gap-0.5">
                    {/* Reaction button */}
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowReactions(!showReactions);
                            }}
                            className={`p-1.5 rounded-lg hover:bg-gray-100 ${currentReaction || isLiked ? 'text-red-600 hover:text-red-700' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            <span className="text-lg">{getCurrentReactionEmoji()}</span>
                        </button>

                        {showReactions && (
                            <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1.5 flex gap-1 z-20">
                                {likeService.getAllReactionTypes().map(({ type, emoji, label }) => (
                                    <button
                                        key={type}
                                        onClick={() => handleReactionClick(type)}
                                        className="p-1 hover:bg-gray-100 rounded-full hover:scale-125 transition-transform"
                                        title={label}
                                    >
                                        <span className="text-xl">{emoji}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Comment button */}
                    <button
                        onClick={handleCommentClick}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                    >
                        <MessageCircle className="w-5 h-5" />
                    </button>

                    {/* Share button */}
                    <div className="relative">
                        <button
                            onClick={handleShareClick}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                        >
                            <Share2 className="w-5 h-5" />
                        </button>

                        {showShareMenu && (
                            <div className="absolute bottom-full left-0 mb-1 w-40 bg-white rounded-lg border border-gray-200 shadow-lg z-10">
                                <button
                                    onClick={() => {
                                        if (onShare) onShare();
                                        setShowShareMenu(false);
                                    }}
                                    className="flex items-center gap-2 w-full px-2 py-1.5 text-left hover:bg-gray-50 rounded-t-lg text-sm"
                                >
                                    <Share2 className="w-3 h-3" />
                                    <span>Share to Feed</span>
                                </button>
                                <button
                                    onClick={handleCopyLink}
                                    className="flex items-center gap-2 w-full px-2 py-1.5 text-left hover:bg-gray-50 rounded-b-lg text-sm"
                                >
                                    <Share2 className="w-3 h-3" />
                                    <span>Copy Link</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-0.5">
                    {/* Save button */}
                    <button
                        onClick={handleSaveClick}
                        className={`p-1.5 rounded-lg hover:bg-gray-100 ${isSaved ? 'text-blue-600 hover:text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                    </button>

                    {/* More options */}
                    <button
                        onClick={() => setShowReportDialog(true)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                    >
                        <MoreVertical className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Report Dialog */}
            <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
                <DialogContent className="sm:max-w-[350px]">
                    <DialogHeader>
                        <DialogTitle className="text-lg">Report Post</DialogTitle>
                        <DialogDescription className="text-sm">
                            Select a reason for reporting
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-1">
                        {[
                            "Spam",
                            "Inappropriate Content",
                            "Harassment",
                            "False Information",
                            "Violence",
                            "Other",
                        ].map((reason) => (
                            <button
                                key={reason}
                                onClick={() => handleReport(reason)}
                                className="w-full px-3 py-2 text-left hover:bg-gray-50 rounded text-sm"
                            >
                                {reason}
                            </button>
                        ))}
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200">
                        <Button
                            variant="outline"
                            onClick={() => setShowReportDialog(false)}
                            className="w-full text-sm"
                        >
                            Cancel
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};