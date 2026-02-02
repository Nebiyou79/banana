// components/social/post/EditablePostCard.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Edit2, Trash2, Pin, Eye, EyeOff,
  MoreVertical, AlertCircle,
  Globe, Users, Lock, X,
  Image as ImageIcon, Video, FileText, Upload,
  Save, XCircle, Calendar, MapPin, Sparkles,
  Building, Crown, Star, Heart, MessageCircle,
  Share2, Bookmark, EyeIcon, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/social/ui/Avatar';
import { Badge } from '@/components/social/ui/Badge';
import { Button } from '@/components/social/ui/Button';
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
import { profileService } from '@/services/profileService';
import PostGallery from '@/components/social/post/PostGallery';

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editState, setEditState] = useState<EditState>({
    content: post.content,
    media: [...post.media],
    mediaToRemove: [],
    mediaFiles: []
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  // Get author badge based on verification and premium status
  const getAuthorBadge = () => {
    const { verificationStatus, role } = post.author;

    if (role === 'admin') {
      return {
        icon: <Crown className="w-3 h-3" />,
        label: "Admin",
        variant: "premium" as const,
        className: "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"
      };
    }

    if (verificationStatus === 'verified') {
      return {
        icon: <Star className="w-3 h-3" />,
        label: "Verified",
        variant: "success" as const,
        className: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
      };
    }

    return null;
  };

  const authorBadge = getAuthorBadge();

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

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }
  }, [isEditing]);

  // Reset edit state when post changes
  useEffect(() => {
    if (!isEditing) {
      setEditState({
        content: post.content,
        media: [...post.media],
        mediaToRemove: [],
        mediaFiles: []
      });
    }
  }, [post, isEditing]);

  const handleRemoveMedia = (mediaId?: string, index?: number) => {
    if (mediaId) {
      // Mark existing media for removal
      setEditState(prev => ({
        ...prev,
        media: prev.media.filter(m => m._id !== mediaId),
        mediaToRemove: [...prev.mediaToRemove, mediaId]
      }));

      toast({
        variant: "default",
        title: "Media Marked for Removal",
        description: "This media will be deleted when you save changes"
      });
    } else if (index !== undefined) {
      // Remove newly added media (not yet uploaded to Cloudinary)
      const newMediaFiles = [...editState.mediaFiles];
      const newMedia = [...editState.media];

      // Find the media item at this index
      const mediaItem = newMedia[index];

      // Revoke object URL if it's a blob
      if (mediaItem.url?.startsWith('blob:')) {
        URL.revokeObjectURL(mediaItem.url);
      }

      newMediaFiles.splice(index, 1);
      newMedia.splice(index, 1);
      setEditState(prev => ({
        ...prev,
        media: newMedia,
        mediaFiles: newMediaFiles
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const newMedia: Media[] = [];

    // Validate files before adding
    newFiles.forEach(file => {
      // Validate file type and size
      const validation = postService.validatePostData({
        mediaFiles: [file]
      } as any);

      if (!validation.isValid) {
        toast({
          variant: "destructive",
          title: "Invalid File",
          description: validation.errors[0] || "File is not valid"
        });
        return;
      }

      const fileUrl = URL.createObjectURL(file);
      const mediaType = postService.getMediaType(file.type);

      newMedia.push({
        url: fileUrl,
        secure_url: fileUrl,
        type: mediaType,
        public_id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        resource_type: mediaType === 'image' ? 'image' : mediaType === 'video' ? 'video' : 'raw',
        thumbnail: mediaType === 'image' ? fileUrl : undefined,
        originalName: file.name,
        size: file.size,
        mimeType: file.type,
        description: ''
      });
    });

    if (newMedia.length > 0) {
      setEditState(prev => ({
        ...prev,
        media: [...prev.media, ...newMedia],
        mediaFiles: [...prev.mediaFiles, ...newFiles]
      }));
    }

    // Reset file input
    e.target.value = '';
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

    setLoading(true);
    try {
      const updateData: UpdatePostData = {
        content: editState.content.trim(),
        mediaToRemove: editState.mediaToRemove,
        mediaFiles: editState.mediaFiles.length > 0 ? editState.mediaFiles : undefined
      };

      // Prepare existing media metadata (for reordering, descriptions, etc.)
      const existingMedia = editState.media
        .filter(item => item._id && !editState.mediaToRemove.includes(item._id))
        .map(item => ({
          ...item,
          _id: item._id!,
          description: item.description || '',
          order: item.order || 0
        }));

      if (existingMedia.length > 0) {
        updateData.media = existingMedia;
      }

      const updatedPost = await postService.updatePost(post._id, updateData);
      onUpdate(updatedPost);
      setIsEditing(false);

      toast({
        variant: "success",
        title: "Post Updated",
        description: "Your post has been updated successfully"
      });
    } catch (error: any) {
      console.error('Update post error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || 'Failed to update post'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditState(prev => ({ ...prev, content: e.target.value }));
  };

  const getMediaIcon = (type: 'image' | 'video' | 'document') => {
    switch (type) {
      case 'image': return <ImageIcon className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'document': return <FileText className="w-4 h-4" />;
    }
  };

  // Render editing interface
  const renderEditMode = () => {
    return (
      <div className="space-y-6">
        {/* Content Editor */}
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-xl" />
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Post Content
            </label>
            <textarea
              ref={textareaRef}
              value={editState.content}
              onChange={handleContentChange}
              placeholder="What would you like to update?"
              className="w-full min-h-[150px] text-sm border border-gray-300/80 dark:border-gray-700/80 rounded-xl p-4 resize-none text-gray-900 dark:text-gray-100 bg-white/80 dark:bg-gray-900/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all backdrop-blur-sm"
              maxLength={10000}
            />
            <div className="flex justify-between items-center mt-2">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {editState.content.length}/10000 characters
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {editState.content.trim().length > 0 ? `${editState.content.trim().split(/\s+/).length} words` : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Media Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Media ({editState.media.length})
            </label>
            {editState.mediaToRemove.length > 0 && (
              <span className="text-xs bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                {editState.mediaToRemove.length} marked for removal
              </span>
            )}
          </div>

          {/* Add Media Button */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,video/mp4,video/mov,video/avi,video/mkv,video/webm"
              className="hidden"
              multiple
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="border-gray-300/80 dark:border-gray-700/80 hover:bg-gray-50/80 dark:hover:bg-gray-800/80 hover:border-gray-400 dark:hover:border-gray-600 rounded-full bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50 backdrop-blur-sm"
            >
              <Upload className="w-4 h-4 mr-2" />
              Add Photo/Video
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Max 10 files • Images: 20MB • Videos: 200MB • Supports: JPEG, PNG, GIF, WebP, MP4, MOV, AVI, MKV
            </p>
          </div>

          {/* Media Preview */}
          {editState.media.length > 0 && (
            <div className="space-y-4">
              {/* PostGallery for editing mode - EXACTLY like PostCard */}
              <div className="rounded-xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50 bg-gray-50/30 dark:bg-gray-800/30">
                <PostGallery
                  media={editState.media}
                  maxHeight={400}
                  showCaptions={false}
                  interactive={false} // Disable double-click and zoom in edit mode
                  lightboxEnabled={false} // Disable lightbox in edit mode
                  autoplayVideos={false}
                  mutedVideos={true}
                  className=""
                />
              </div>

              {/* Media Management */}
              <div className="border border-gray-200/80 dark:border-gray-800/80 rounded-xl p-4 bg-gradient-to-br from-gray-50/30 to-white/30 dark:from-gray-800/30 dark:to-gray-900/30 backdrop-blur-sm">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Manage Media
                </h4>
                <div className="space-y-3">
                  {editState.media.map((media, index) => (
                    <div
                      key={media._id || `new-${index}`}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${editState.mediaToRemove.includes(media._id || '')
                        ? 'bg-gradient-to-r from-red-50/80 to-rose-50/80 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200/50 dark:border-red-800/50'
                        : 'bg-gradient-to-r from-gray-50/50 to-blue-50/50 dark:from-gray-800/30 dark:to-blue-900/20 border border-gray-200/50 dark:border-gray-700/50'
                        }`}
                    >
                      <div className="flex-shrink-0">
                        {media.type === 'image' ? (
                          <div className="w-12 h-12 relative rounded-lg overflow-hidden border border-gray-200/50 dark:border-gray-700/50">
                            <img
                              src={media.secure_url || media.url}
                              alt={media.description || ''}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : media.type === 'video' ? (
                          <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700/50 flex items-center justify-center">
                            <Video className="w-6 h-6 text-gray-400" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg border border-gray-300/50 dark:border-gray-600/50 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                            {getMediaIcon(media.type)}
                            <span className="capitalize">{media.type}</span>
                          </span>
                          {!media._id && (
                            <span className="text-xs bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200/50 dark:border-blue-800/50">
                              New
                            </span>
                          )}
                          {editState.mediaToRemove.includes(media._id || '') && (
                            <span className="text-xs bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 text-red-800 dark:text-red-300 px-2 py-0.5 rounded-full border border-red-200/50 dark:border-red-800/50">
                              To be removed
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={media.description || ''}
                          onChange={(e) => {
                            const newMedia = [...editState.media];
                            newMedia[index] = { ...newMedia[index], description: e.target.value };
                            setEditState(prev => ({ ...prev, media: newMedia }));
                          }}
                          placeholder="Add description..."
                          className="w-full text-sm border border-gray-300/50 dark:border-gray-700/50 rounded-lg px-3 py-1.5 bg-white/80 dark:bg-gray-900/80 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 backdrop-blur-sm"
                        />
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-3">
                          <span className="font-medium truncate">{media.originalName || 'Untitled'}</span>
                          {media.size && (
                            <span>{postService.formatFileSize(media.size)}</span>
                          )}
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMedia(media._id, index)}
                        className={`flex-shrink-0 rounded-full ${editState.mediaToRemove.includes(media._id || '')
                          ? 'text-red-600 dark:text-red-400 hover:bg-red-100/80 dark:hover:bg-red-900/30'
                          : 'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/80 dark:hover:bg-red-900/20'
                          } backdrop-blur-sm`}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Edit Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200/80 dark:border-gray-800/80">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Confirm cancel if there are changes
                if (editState.content !== post.content ||
                  editState.media.length !== post.media.length ||
                  editState.mediaToRemove.length > 0 ||
                  editState.mediaFiles.length > 0) {
                  if (window.confirm('Discard all changes?')) {
                    setIsEditing(false);
                  }
                } else {
                  setIsEditing(false);
                }
              }}
              className="border-gray-300/80 dark:border-gray-700/80 hover:bg-gray-50/80 dark:hover:bg-gray-800/80 rounded-full backdrop-blur-sm"
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {editState.content !== post.content ||
                editState.media.length !== post.media.length ||
                editState.mediaToRemove.length > 0 ||
                editState.mediaFiles.length > 0
                ? '✎ Unsaved changes' : '✓ No changes'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleUpdatePost}
              disabled={loading || (!editState.content.trim() && editState.media.length === 0)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-sm px-5 min-w-[130px] rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-200 border-0"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Render read-only view with stats - EXACTLY like PostCard
  const renderViewMode = () => {
    return (
      <>
        {/* Content */}
        <div className="px-6 py-2">
          <div className="relative">
            <p className="text-gray-900 dark:text-gray-100 text-base leading-relaxed whitespace-pre-line font-medium">
              {post.content}
            </p>
            {/* Subtle Gradient Underline */}
            <div className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200/50 to-transparent dark:via-gray-700/50" />
          </div>

          {/* Hashtags */}
          {post.hashtags?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.hashtags.map((tag: string) => (
                <button
                  key={tag}
                  className="text-sm font-medium px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-400 hover:from-blue-200 hover:to-purple-200 dark:hover:from-blue-800/50 dark:hover:to-purple-800/50 transition-all duration-200 hover:scale-105"
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* Media Gallery - EXACTLY like PostCard */}
          {post.media?.length > 0 && (
            <div className="mt-4">
              <div className="rounded-xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50">
                <PostGallery
                  media={post.media}
                  maxHeight={500}
                  showCaptions={true}
                  interactive={true} // Enable double-click and zoom in view mode
                  lightboxEnabled={true} // Enable lightbox in view mode
                  autoplayVideos={false}
                  mutedVideos={true}
                  className=""
                />
              </div>
            </div>
          )}
        </div>

        {/* Post Stats - DISPLAY ONLY (Same styling as PostCard) */}
        <div className="px-6 py-3 border-t border-gray-100/80 dark:border-gray-800/80">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5" />
                <span>{post.stats?.likes || 0}</span>
              </div>
              {post.stats?.dislikes > 0 && (
                <div className="flex items-center gap-1">
                  <ThumbsDown className="w-3.5 h-3.5" />
                  <span>{post.stats?.dislikes || 0}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{post.stats?.comments || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Share2 className="w-3.5 h-3.5" />
                <span>{post.stats?.shares || 0}</span>
              </div>
              {post.stats?.saves > 0 && (
                <div className="flex items-center gap-1">
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{post.stats?.saves}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <EyeIcon className="w-3.5 h-3.5" />
              <span>{post.stats?.views || 0} views</span>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="px-6 py-3 border-t border-gray-100/80 dark:border-gray-800/80 bg-gradient-to-b from-gray-50/30 to-transparent dark:from-gray-900/20 dark:to-transparent">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span className="font-medium">Posted {formattedDate}</span>
              </div>
              {post.lastEditedAt && (
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <Edit2 className="w-3.5 h-3.5" />
                  <span className="font-medium">Edited {postService.formatPostDate(post.lastEditedAt)}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
                <PrivacyIcon className="w-3.5 h-3.5" />
                <span className="font-medium">{privacyLabel}</span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      <article className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800/80 shadow-lg dark:shadow-gray-900/50 hover:shadow-xl dark:hover:shadow-gray-900/70 transition-all duration-300 ${className}`}>
        {/* Premium Header with Gradient Border Effect */}
        <div className="relative p-6 pb-4">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5" />

          <div className="relative flex items-start justify-between">
            {/* Author Info with Premium Styling */}
            <div className="flex items-start gap-4 flex-1 min-w-0">
              {/* Premium Avatar with Ring */}
              <div className="flex-shrink-0">
                <Avatar className="w-12 h-12 md:w-14 md:h-14 ring-2 ring-white dark:ring-gray-800">
                  {post.author.avatar ? (
                    <AvatarImage
                      src={post.author.avatar}
                      alt={post.author.name}
                      className="object-cover"
                    />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 text-blue-600 dark:text-blue-400 font-semibold">
                      {profileService.getInitials(post.author.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>

              {/* Author Details */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <div className="font-bold text-gray-900 dark:text-white text-base md:text-lg truncate">
                    {post.author.name}
                  </div>

                  {/* Editing Badge */}
                  {isEditing && (
                    <Badge
                      variant="premium"
                      size="sm"
                      className="px-2.5 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 dark:border-blue-500/20"
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Editing post
                    </Badge>
                  )}

                  {/* Premium Badge */}
                  {authorBadge && (
                    <Badge
                      variant={authorBadge.variant}
                      size="sm"
                      className={`px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1.5 ${authorBadge.className}`}
                    >
                      {authorBadge.icon}
                      <span>{authorBadge.label}</span>
                    </Badge>
                  )}
                </div>

                {/* Premium Metadata */}
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  {/* Company */}
                  {post.author.company && (
                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
                      <Building className="w-3.5 h-3.5" />
                      <span className="font-medium">{post.author.company}</span>
                    </div>
                  )}

                  {/* Headline */}
                  {post.author.headline && (
                    <div className="text-gray-500 dark:text-gray-400 font-medium">
                      {post.author.headline}
                    </div>
                  )}

                  {/* Divider */}
                  <span className="text-gray-300 dark:text-gray-600">•</span>

                  {/* Privacy & Time */}
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <PrivacyIcon className="w-3.5 h-3.5" />
                      <span className="font-medium">{privacyLabel}</span>
                    </div>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="font-medium">{formattedDate}</span>
                    </div>
                  </div>

                  {/* Location */}
                  {post.location?.name && (
                    <>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2.5 py-1 rounded-full">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="font-medium">{post.location.name}</span>
                      </div>
                    </>
                  )}

                  {/* Pinned Badge */}
                  {post.pinned && (
                    <Badge
                      variant="premium"
                      size="sm"
                      className="px-2.5 py-1 text-xs rounded-full bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      📌 Pinned
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Premium More Menu */}
            <div className="relative ml-2">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-xl transition-all duration-200 hover:scale-110"
                aria-label="More options"
              >
                <MoreVertical className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
              </button>

              {showMoreMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMoreMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl z-50 overflow-hidden backdrop-blur-sm bg-white/95 dark:bg-gray-800/95">
                    <div className="p-1">
                      {!isEditing ? (
                        <>
                          <button
                            onClick={() => {
                              setIsEditing(true);
                              setShowMoreMenu(false);
                            }}
                            className="flex items-center gap-3 w-full px-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-900 dark:text-gray-100 rounded-lg transition-colors group"
                          >
                            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                              <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">Edit Post</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Update content and media</div>
                            </div>
                          </button>

                          <button
                            onClick={() => {
                              handlePinToggle();
                              setShowMoreMenu(false);
                            }}
                            className="flex items-center gap-3 w-full px-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-900 dark:text-gray-100 rounded-lg transition-colors group"
                          >
                            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 group-hover:bg-amber-200 dark:group-hover:bg-amber-800/50 transition-colors">
                              <Pin className={`w-4 h-4 ${post.pinned ? 'text-amber-600 dark:text-amber-400 fill-current' : 'text-amber-600 dark:text-amber-400'}`} />
                            </div>
                            <div>
                              <div className="font-medium text-sm">{post.pinned ? 'Unpin Post' : 'Pin to Profile'}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {post.pinned ? 'Remove from profile' : 'Feature on your profile'}
                              </div>
                            </div>
                          </button>

                          <button
                            onClick={() => {
                              handleVisibilityToggle();
                              setShowMoreMenu(false);
                            }}
                            className="flex items-center gap-3 w-full px-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-900 dark:text-gray-100 rounded-lg transition-colors group"
                          >
                            <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 group-hover:bg-purple-200 dark:group-hover:bg-purple-800/50 transition-colors">
                              {post.visibility === 'public' ? (
                                <EyeOff className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              ) : (
                                <Eye className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-sm">
                                {post.visibility === 'public' ? 'Make Private' : 'Make Public'}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Change post visibility
                              </div>
                            </div>
                          </button>

                          <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

                          <button
                            onClick={() => {
                              setShowDeleteDialog(true);
                              setShowMoreMenu(false);
                            }}
                            className="flex items-center gap-3 w-full px-3 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg transition-colors group"
                          >
                            <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 group-hover:bg-red-200 dark:group-hover:bg-red-800/50 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">Delete Post</div>
                              <div className="text-xs text-red-500/70 dark:text-red-400/70">Permanently remove this post</div>
                            </div>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setShowMoreMenu(false);
                          }}
                          className="flex items-center gap-3 w-full px-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-900 dark:text-gray-100 rounded-lg transition-colors group"
                        >
                          <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
                            <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">Exit Edit Mode</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Return to view mode</div>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content Area - Switches between edit and view modes */}
        <div className="relative">
          <div className="px-6 py-4">
            {isEditing ? renderEditMode() : renderViewMode()}
          </div>
        </div>

        {/* Post Status Footer */}
        <div className="px-6 py-3 border-t border-gray-100/80 dark:border-gray-800/80 bg-gradient-to-b from-gray-50/30 to-transparent dark:from-gray-900/20 dark:to-transparent">
          <div className="flex items-center gap-3 text-xs">
            {post.status !== 'active' && (
              <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 rounded-full">
                <AlertCircle className="w-3 h-3" />
                <span className="font-medium capitalize">{post.status}</span>
              </div>
            )}

            {post.visibility !== 'public' && (
              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
                <PrivacyIcon className="w-3 h-3" />
                <span className="font-medium">{privacyLabel}</span>
              </div>
            )}

            {post.pinned && (
              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2.5 py-1 rounded-full">
                <Pin className="w-3 h-3" />
                <span className="font-medium">Pinned</span>
              </div>
            )}

            {post.lastEditedAt && (
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
                <Edit2 className="w-3 h-3" />
                <span className="font-medium">Edited</span>
              </div>
            )}
          </div>
        </div>

        {/* Premium Footer Gradient */}
        <div className="h-1 rounded-b-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 hover:opacity-100 transition-opacity duration-300" />
      </article>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="sm:max-md rounded-2xl border border-gray-200/80 dark:border-gray-800/80 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5" />
          <div className="relative">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg text-gray-900 dark:text-white">
                Delete Post?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-gray-600 dark:text-gray-400">
                This action cannot be undone. This will permanently delete your post
                and all associated media from Cloudinary.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:justify-end">
              <AlertDialogCancel
                disabled={loading}
                className="border-gray-300/80 dark:border-gray-700/80 hover:bg-gray-50/80 dark:hover:bg-gray-800/80 text-sm rounded-full backdrop-blur-sm"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={loading}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-sm rounded-full font-medium shadow-lg hover:shadow-xl border-0"
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
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};