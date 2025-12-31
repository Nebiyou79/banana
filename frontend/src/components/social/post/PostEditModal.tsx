// components/social/post/PostEditModal.tsx
import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle, Upload, Trash2 } from 'lucide-react';
import { Button } from '@/components/social/ui/Button';
import { PostComposer } from '@/components/social/post/PostComposer';
import { postService } from '@/services/postService';
import { useToast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/social/ui/Alert-Dialog";

interface PostEditModalProps {
    post: any;
    onClose: () => void;
    onUpdate: (updatedPost: any) => void;
}

export const PostEditModal: React.FC<PostEditModalProps> = ({
    post,
    onClose,
    onUpdate
}) => {
    const [hasChanges, setHasChanges] = useState(false);
    const [showConfirmClose, setShowConfirmClose] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    // Prepare initial data for PostComposer
    const initialData = {
        _id: post._id,
        content: post.content,
        visibility: post.visibility,
        media: post.media || [],
        hashtags: post.hashtags || [],
        mentions: post.mentions || [],
        allowComments: post.allowComments !== false,
        allowSharing: post.allowSharing !== false
    };

    const handlePostUpdated = (updatedPost: any) => {
        onUpdate(updatedPost);
        onClose();
    };

    const handleClose = () => {
        if (hasChanges) {
            setShowConfirmClose(true);
        } else {
            onClose();
        }
    };

    const handleDeleteMedia = async (mediaId: string) => {
        if (!mediaId) return;

        try {
            setLoading(true);
            const updatedPost = await postService.updatePost(post._id, {
                mediaToRemove: [mediaId]
            });
            onUpdate(updatedPost);
            toast({
                variant: "success",
                title: "Media Removed",
                description: "The media has been removed from your post"
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || 'Failed to remove media'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Modal Overlay */}
            <div
                className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
                onClick={handleClose}
            >
                <div
                    className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-semibold text-gray-900">Edit Post</h2>
                            {hasChanges && (
                                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                    Unsaved changes
                                </span>
                            )}
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Close"
                            disabled={loading}
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Current Media Preview with Delete Options */}
                    {post.media?.length > 0 && (
                        <div className="px-4 pt-4">
                            <div className="mb-3">
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Current Media</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {post.media.map((media: any) => (
                                        <div key={media._id} className="relative group">
                                            {media.type === 'image' ? (
                                                <img
                                                    src={postService.getFullImageUrl(media.url)}
                                                    alt="Post media"
                                                    className="w-full h-24 object-cover rounded-lg"
                                                />
                                            ) : (
                                                <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                                                    <span className="text-xs text-gray-500">Video</span>
                                                </div>
                                            )}
                                            <button
                                                onClick={() => handleDeleteMedia(media._id)}
                                                disabled={loading}
                                                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                                aria-label="Remove media"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Post Composer */}
                    <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
                        <PostComposer
                            initial={initialData}
                            onPostCreated={handlePostUpdated}
                            onClose={onClose}
                        />
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>Last edited: {postService.formatPostDate(post.updatedAt)}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleClose}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <span className="text-xs text-gray-400">Changes are saved automatically</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirm Discard Dialog */}
            <AlertDialog open={showConfirmClose} onOpenChange={setShowConfirmClose}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You have unsaved changes. Are you sure you want to discard them?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={onClose}>
                            Discard Changes
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};