// components/social/post/EditablePostCard.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
    Edit2, Trash2, Pin, Eye, EyeOff,
    MoreVertical, AlertCircle,
    Globe, Users, Lock, X
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/social/ui/Avatar';
import { Badge } from '@/components/social/ui/Badge';
import { Button } from '@/components/social/ui/Button';
import { PostGallery } from '@/components/social/post/PostGallery';
import { postService, Post, Media, UpdatePostData } from '@/services/postService';
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
import profileService from '@/services/profileService';
import { Dialog, DialogContent, DialogHeader } from '@/components/social/ui/Dialog';
import { Textarea } from '@/components/social/ui/Textarea';

interface EditablePostCardProps {
    post: Post;
    currentUserId: string;
    onUpdate: (updatedPost: Post) => void;
    onDelete: (postId: string) => void;
    className?: string;
}

interface EditState {
    content: string;
    media: Media[];
    mediaToRemove: string[];
    mediaFiles: File[];
}

export const EditablePostCard: React.FC<EditablePostCardProps> = ({
    post,
    currentUserId,
    onUpdate,
    onDelete,
    className = ''
}) => {
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [editState, setEditState] = useState<EditState>({
        content: post.content,
        media: [...post.media],
        mediaToRemove: [],
        mediaFiles: []
    });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const formattedDate = postService.formatPostDate(post.createdAt);

    const PrivacyIcon = {
        public: Globe,
        connections: Users,
        private: Lock
    }[post.visibility];

    const privacyLabel = {
        public: 'Public',
        connections: 'Connections Only',
        private: 'Only Me'
    }[post.visibility];

    const handlePinToggle = async () => {
        setLoading(true);
        try {
            const updatedPost = await postService.updatePost(post._id, {
                pinned: !post.pinned
            });
            onUpdate(updatedPost);
            toast({
                variant: "success",
                title: post.pinned ? "Post Unpinned" : "Post Pinned",
                description: post.pinned
                    ? "Post removed from your profile"
                    : "Post pinned to your profile"
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || 'Failed to update post'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleVisibilityToggle = async () => {
        setLoading(true);
        try {
            const newVisibility = post.visibility === 'public' ? 'private' : 'public';
            const updatedPost = await postService.updatePost(post._id, {
                visibility: newVisibility
            });
            onUpdate(updatedPost);
            toast({
                variant: "success",
                title: "Visibility Updated",
                description: `Post is now ${newVisibility}`
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || 'Failed to update visibility'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        try {
            await postService.deletePost(post._id);
            onDelete(post._id);
            toast({
                variant: "success",
                title: "Post Deleted",
                description: "Your post has been deleted"
            });
            setShowDeleteDialog(false);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || 'Failed to delete post'
            });
        } finally {
            setLoading(false);
        }
    };

    // Reset edit state when modal opens
    useEffect(() => {
        if (showEditModal) {
            setEditState({
                content: post.content,
                media: [...post.media],
                mediaToRemove: [],
                mediaFiles: []
            });
        }
    }, [showEditModal, post]);

    const handleRemoveMedia = (mediaId?: string) => {
        if (mediaId) {
            // Mark existing media for removal
            setEditState(prev => ({
                ...prev,
                media: prev.media.filter(m => m._id !== mediaId),
                mediaToRemove: [...prev.mediaToRemove, mediaId]
            }));
        } else {
            // Remove newly added file
            setEditState(prev => ({
                ...prev,
                media: prev.media.slice(0, -1),
                mediaFiles: prev.mediaFiles.slice(0, -1)
            }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        const fileUrl = URL.createObjectURL(file);

        const newMedia: Media = {
            url: fileUrl,
            type: file.type.startsWith('image/') ? 'image' :
                file.type.startsWith('video/') ? 'video' : 'document',
            thumbnail: file.type.startsWith('image/') ? fileUrl : undefined,
            originalName: file.name,
            size: file.size,
            mimeType: file.type
        };

        setEditState(prev => ({
            ...prev,
            media: [...prev.media, newMedia],
            mediaFiles: [...prev.mediaFiles, file]
        }));
    };

    const handleUpdatePost = async () => {
        if (!editState.content.trim() && editState.media.length === 0) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Post cannot be empty"
            });
            return;
        }

        setEditLoading(true);
        try {
            const updateData: UpdatePostData = {
                content: editState.content,
                mediaToRemove: editState.mediaToRemove,
                mediaFiles: editState.mediaFiles.length > 0 ? editState.mediaFiles : undefined
            };

            const updatedPost = await postService.updatePost(post._id, updateData);
            onUpdate(updatedPost);
            setShowEditModal(false);

            toast({
                variant: "success",
                title: "Post Updated",
                description: "Your post has been updated successfully"
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || 'Failed to update post'
            });
        } finally {
            setEditLoading(false);
        }
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setEditState(prev => ({ ...prev, content: e.target.value }));
    };

    return (
        <>
            <div className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group ${className}`}>
                {/* Header */}
                <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10 ring-2 ring-gray-100">
                                {post.author.avatar ? (
                                    <AvatarImage
                                        src={post.author.avatar}
                                        alt={post.author.name}
                                        className="object-cover"
                                    />
                                ) : (
                                    <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-blue-600">
                                        {profileService.getInitials(post.author.name)}
                                    </AvatarFallback>
                                )}
                            </Avatar>
                            <div>
                                <h4 className="font-semibold text-gray-900 text-sm">{post.author.name}</h4>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <PrivacyIcon className="w-3 h-3" />
                                        <span>{privacyLabel}</span>
                                    </div>
                                    <span>•</span>
                                    <span>{formattedDate}</span>
                                    {post.pinned && (
                                        <Badge variant="premium" size="sm" className="text-xs">
                                            📌 Pinned
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Edit Controls */}
                        <div className="flex items-center gap-1">
                            {/* Quick Actions */}
                            <div className="hidden group-hover:flex items-center gap-1 mr-2">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setShowEditModal(true)}
                                    className="h-7 px-2 text-xs hover:bg-blue-50 hover:text-blue-600"
                                    disabled={loading}
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                </Button>

                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handlePinToggle}
                                    className="h-7 px-2 text-xs hover:bg-amber-50 hover:text-amber-600"
                                    disabled={loading}
                                >
                                    <Pin className={`w-3.5 h-3.5 ${post.pinned ? 'fill-current text-amber-600' : ''}`} />
                                </Button>
                            </div>

                            {/* More Menu */}
                            <div className="relative">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                                    className="h-7 w-7 p-0 hover:bg-gray-100"
                                    disabled={loading}
                                >
                                    <MoreVertical className="w-4 h-4" />
                                </Button>

                                {showMoreMenu && (
                                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-50 py-1">
                                        <button
                                            onClick={() => {
                                                setShowEditModal(true);
                                                setShowMoreMenu(false);
                                            }}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-50 text-sm text-gray-700"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                            <span>Edit Post</span>
                                        </button>

                                        <button
                                            onClick={() => {
                                                handlePinToggle();
                                                setShowMoreMenu(false);
                                            }}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-50 text-sm text-gray-700"
                                        >
                                            <Pin className={`w-4 h-4 ${post.pinned ? 'fill-current text-amber-600' : ''}`} />
                                            <span>{post.pinned ? 'Unpin Post' : 'Pin to Profile'}</span>
                                        </button>

                                        <button
                                            onClick={() => {
                                                handleVisibilityToggle();
                                                setShowMoreMenu(false);
                                            }}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-50 text-sm text-gray-700"
                                        >
                                            {post.visibility === 'public' ? (
                                                <>
                                                    <EyeOff className="w-4 h-4" />
                                                    <span>Make Private</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Eye className="w-4 h-4" />
                                                    <span>Make Public</span>
                                                </>
                                            )}
                                        </button>

                                        <div className="border-t border-gray-200 my-1">
                                            <button
                                                onClick={() => {
                                                    setShowDeleteDialog(true);
                                                    setShowMoreMenu(false);
                                                }}
                                                className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-red-50 text-sm text-red-600"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                <span>Delete Post</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4">
                    <p className="text-gray-900 text-sm whitespace-pre-line">
                        {post.content}
                    </p>

                    {/* Hashtags */}
                    {post.hashtags?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                            {post.hashtags.map((tag: string) => (
                                <span
                                    key={tag}
                                    className="text-blue-600 hover:text-blue-700 hover:underline text-xs cursor-pointer"
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Media Gallery */}
                    {post.media?.length > 0 && (
                        <div className="mt-3">
                            <PostGallery images={post.media} />
                        </div>
                    )}
                </div>

                {/* Stats */}
                <div className="px-4 py-2 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-4">
                            <span>{post.stats?.likes || 0} likes</span>
                            <span>{post.stats?.comments || 0} comments</span>
                            <span>{post.stats?.shares || 0} shares</span>
                        </div>
                        <span>{post.stats?.views || 0} views</span>
                    </div>
                </div>

                {/* Post Status Indicators */}
                <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3 text-xs">
                        {post.status !== 'active' && (
                            <div className="flex items-center gap-1 text-amber-600">
                                <AlertCircle className="w-3 h-3" />
                                <span className="capitalize">{post.status}</span>
                            </div>
                        )}

                        {post.visibility !== 'public' && (
                            <div className="flex items-center gap-1 text-gray-600">
                                <PrivacyIcon className="w-3 h-3" />
                                <span className="capitalize">{privacyLabel}</span>
                            </div>
                        )}

                        {post.pinned && (
                            <div className="flex items-center gap-1 text-blue-600">
                                <Pin className="w-3 h-3" />
                                <span>Pinned to Profile</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Clean Professional Edit Modal */}
            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent className="sm:max-w-2xl p-0 gap-0 bg-white rounded-xl overflow-hidden">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Edit Post</h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowEditModal(false)}
                                className="h-8 w-8 p-0"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </DialogHeader>

                    <div className="max-h-[70vh] overflow-y-auto">
                        {/* User Info */}
                        <div className="px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10">
                                    {post.author.avatar ? (
                                        <AvatarImage
                                            src={post.author.avatar}
                                            alt={post.author.name}
                                            className="object-cover"
                                        />
                                    ) : (
                                        <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-blue-600">
                                            {profileService.getInitials(post.author.name)}
                                        </AvatarFallback>
                                    )}
                                </Avatar>
                                <div>
                                    <h4 className="font-semibold text-gray-900 text-sm">{post.author.name}</h4>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <PrivacyIcon className="w-3 h-3" />
                                        <span>{privacyLabel}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content Editor */}
                        <div className="px-6 py-4">
                            <Textarea
                                value={editState.content}
                                onChange={handleContentChange}
                                placeholder="What would you like to update?"
                                className="min-h-[120px] text-sm border-0 focus-visible:ring-0 p-0 resize-none text-gray-900"
                                autoFocus
                            />

                            {/* Current Media Preview with Remove Options */}
                            {editState.media.length > 0 && (
                                <div className="mt-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-medium text-gray-700">Media</h4>
                                        <span className="text-xs text-gray-500">
                                            Click × to remove
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {editState.media.map((media, index) => (
                                            <div key={media._id || `new-${index}`} className="relative group">
                                                {media.type === 'image' ? (
                                                    <img
                                                        src={media.url}
                                                        alt={media.description || 'Post media'}
                                                        className="w-full h-32 object-cover rounded-lg"
                                                    />
                                                ) : media.type === 'video' ? (
                                                    <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                                                        <div className="text-center">
                                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                                                <span className="text-blue-600 text-sm">▶</span>
                                                            </div>
                                                            <span className="text-xs text-gray-600">Video</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                                                        <div className="text-center">
                                                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                                                                <span className="text-gray-600 text-sm">📄</span>
                                                            </div>
                                                            <span className="text-xs text-gray-600">Document</span>
                                                        </div>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => handleRemoveMedia(media._id)}
                                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Add New Media */}
                            <div className="mt-4">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/*,video/*"
                                    className="hidden"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-xs"
                                >
                                    + Add Photo/Video
                                </Button>
                                <p className="text-xs text-gray-500 mt-1">
                                    You can add new media or remove existing ones
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowEditModal(false)}
                                    className="text-sm"
                                >
                                    Cancel
                                </Button>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-500">
                                    {editState.content.length}/2000
                                </span>
                                <Button
                                    onClick={handleUpdatePost}
                                    disabled={editLoading || (!editState.content.trim() && editState.media.length === 0)}
                                    className="bg-blue-600 hover:bg-blue-700 text-sm px-4"
                                >
                                    {editLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                            Updating...
                                        </>
                                    ) : (
                                        'Update Post'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent className="sm:max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg">Delete Post?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-600">
                            This action cannot be undone. This will permanently delete your post
                            and remove it from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="sm:justify-end">
                        <AlertDialogCancel
                            disabled={loading}
                            className="border-gray-300 hover:bg-gray-50 text-sm"
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={loading}
                            className="bg-red-600 hover:bg-red-700 text-sm"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Deleting...
                                </>
                            ) : (
                                'Delete Post'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};