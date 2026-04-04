/* eslint-disable @typescript-eslint/no-explicit-any */
// components/social/comments/CommentComposer.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/social/ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/social/ui/Avatar';
import { Paperclip, Smile, X, Image as ImageIcon, Video, FileText, Loader2 } from 'lucide-react';
import { commentService, CreateCommentData } from '@/services/commentService';
import { profileService } from '@/services/profileService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export interface CommentComposerProps {
  postId: string;
  parentCommentId?: string;
  onAdded: (comment: any) => void;
  placeholder?: string;
  autoFocus?: boolean;
  showAvatar?: boolean;
  submitLabel?: string;
  compact?: boolean;
  onCancel?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
  initialContent?: string;
  maxLength?: number;
  minHeight?: number;
  maxHeight?: number;
  variant?: 'default' | 'minimal';
}

export const CommentComposer: React.FC<CommentComposerProps> = ({
  postId,
  parentCommentId,
  onAdded,
  placeholder = 'Write a comment...',
  autoFocus = false,
  showAvatar = true,
  submitLabel = 'Post',
  compact = false,
  onCancel,
  onFocus,
  onBlur,
  className = '',
  initialContent = '',
  maxLength = 2000,
  minHeight = 40,
  maxHeight = 200,
  variant = 'default'
}) => {
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(autoFocus);
  const [isFocused, setIsFocused] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const characterCount = content.length;
  const isContentValid = content.trim().length > 0 && content.trim().length <= maxLength;
  const shouldShowActions = isExpanded || content.trim() || attachments.length > 0 || parentCommentId;

  // Load current user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const profile = await profileService.getProfile();
        setCurrentUser(profile.user);
      } catch (error) {
        console.error('Failed to load user profile:', error);
        toast({
          title: 'Profile Error',
          description: 'Failed to load user profile',
          variant: 'destructive'
        });
      }
    };
    loadUser();
  }, [toast]);

  // Auto-focus
  useEffect(() => {
    if (autoFocus && textareaRef.current && !isFocused) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [autoFocus, isFocused]);

  // Handle submit
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const validation = commentService.utils.validateContent(content);
    if (!validation.isValid) {
      validation.errors.forEach(error => 
        toast({
          title: 'Validation Error',
          description: error,
          variant: 'destructive'
        })
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const commentData: CreateCommentData = {
        content: content.trim(),
        mentions: commentService.utils.extractMentions(content),
        hashtags: commentService.utils.extractHashtags(content),
        parentType: parentCommentId ? 'Comment' : 'Post',
        parentId: parentCommentId || postId
      };

      const newComment = await commentService.addComment(postId, commentData);

      setContent('');
      setAttachments([]);
      setIsExpanded(false);
      setIsFocused(false);

      onAdded?.(newComment);

      toast({
        title: parentCommentId ? 'Reply Posted' : 'Comment Posted',
        description: parentCommentId ? 'Your reply has been posted successfully' : 'Your comment has been posted successfully',
      });

      textareaRef.current?.blur();

    } catch (error: any) {
      console.error('Failed to add comment:', error);

      if (error.message?.includes('Authentication')) {
        toast({
          title: 'Authentication Required',
          description: 'Please login to comment',
          variant: 'destructive'
        });
      } else if (error.message?.includes('Maximum reply depth')) {
        toast({
          title: 'Reply Limit',
          description: 'Maximum reply depth reached',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Failed to post comment',
          variant: 'destructive'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [content, postId, parentCommentId, onAdded, toast]);

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      if (isContentValid && !isSubmitting) {
        handleSubmit();
      }
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      if (onCancel) {
        onCancel();
      } else if (!content.trim() && !parentCommentId) {
        setIsExpanded(false);
        setIsFocused(false);
        textareaRef.current?.blur();
      }
    }
  };

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
    setIsExpanded(true);
    onFocus?.();
  };

  // Handle blur
  const handleBlur = () => {
    if (!content.trim() && !parentCommentId) {
      setIsFocused(false);
      setIsExpanded(false);
    }
    onBlur?.();
  };

  // Handle cancel
  const handleCancel = () => {
    setContent('');
    setAttachments([]);
    setIsExpanded(false);
    setIsFocused(false);
    onCancel?.();
  };

  // Handle file selection
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 5 * 1024 * 1024; // 5MB

    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        toast({
          title: 'File Too Large',
          description: `${file.name} exceeds 5MB limit`,
          variant: 'destructive'
        });
        return false;
      }
      return true;
    });

    setAttachments(prev => [...prev, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Get placeholder text
  const getPlaceholder = () => {
    if (parentCommentId) return 'Write a reply...';
    if (currentUser?.name) return `Comment as ${currentUser.name.split(' ')[0]}...`;
    return placeholder;
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight));
      textarea.style.height = `${newHeight}px`;
    }
  }, [content, minHeight, maxHeight]);

  // Render attachments preview
  const renderAttachments = () => {
    if (attachments.length === 0) return null;

    return (
      <AnimatePresence>
        <div className="mt-3 flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <motion.div
              key={`attachment-${file.name}-${index}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative group flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 pr-8 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                {file.type.startsWith('image/') ? (
                  <ImageIcon size={14} className="text-gray-500 dark:text-gray-400 shrink-0" />
                ) : file.type.startsWith('video/') ? (
                  <Video size={14} className="text-gray-500 dark:text-gray-400 shrink-0" />
                ) : (
                  <FileText size={14} className="text-gray-500 dark:text-gray-400 shrink-0" />
                )}
                <span className="text-xs text-gray-700 dark:text-gray-300 truncate max-w-30">
                  {file.name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  ({(file.size / 1024).toFixed(1)}KB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeAttachment(index)}
                className="absolute -right-2 -top-2 p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                aria-label={`Remove ${file.name}`}
              >
                <X size={12} className="text-gray-500 dark:text-gray-400" />
              </button>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    );
  };

  return (
    <div className={cn("w-full", className)}>
      <form onSubmit={handleSubmit} noValidate>
        <div className={cn("flex", compact ? "items-start gap-2" : "items-start gap-3")}>
          {/* Avatar */}
          {showAvatar && currentUser && variant === 'default' && (
            <div className="shrink-0 pt-1">
              <Avatar 
                className={cn(
                  compact ? "h-7 w-7" : "h-9 w-9",
                  "ring-1 ring-gray-200 dark:ring-gray-700 shadow-sm"
                )}
              >
                <AvatarImage
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-600 dark:text-blue-400 text-sm">
                  {currentUser.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Textarea Container */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => {
                  if (e.target.value.length <= maxLength) {
                    setContent(e.target.value);
                  }
                }}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={getPlaceholder()}
                rows={1}
                disabled={isSubmitting}
                className={cn(
                  "w-full px-4 py-3 bg-white dark:bg-gray-800 border rounded-xl resize-none",
                  "text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  "text-sm transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500",
                  "disabled:bg-gray-50 dark:disabled:bg-gray-800/50 disabled:cursor-not-allowed",
                  "scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600",
                  isFocused 
                    ? "border-blue-300 dark:border-blue-600 shadow-sm" 
                    : "border-gray-300 dark:border-gray-600"
                )}
                style={{
                  minHeight: `${minHeight}px`,
                  maxHeight: `${maxHeight}px`,
                  lineHeight: '1.5'
                }}
                aria-label="Comment input"
                aria-describedby={characterCount > 0 ? "character-counter" : undefined}
              />

              {/* Character Counter */}
              {characterCount > 0 && (
                <div className="absolute bottom-2 right-2">
                  <span
                    id="character-counter"
                    className={cn(
                      "text-xs px-1.5 py-0.5 rounded-full",
                      characterCount > maxLength
                        ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                        : characterCount > maxLength * 0.9
                        ? "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                    )}
                  >
                    {characterCount}/{maxLength}
                  </span>
                </div>
              )}
            </div>

            {/* Attachments Preview */}
            {renderAttachments()}

            {/* Action Bar */}
            <AnimatePresence>
              {shouldShowActions && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center justify-between mt-3"
                >
                  {/* Left Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleFileSelect}
                      disabled={isSubmitting}
                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Attach file"
                      aria-label="Attach file"
                    >
                      <Paperclip size={16} />
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Add emoji"
                      aria-label="Add emoji"
                    >
                      <Smile size={16} />
                    </button>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      multiple
                      accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                      aria-label="File upload"
                    />
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2">
                    {(onCancel || parentCommentId) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 px-3 text-sm"
                      >
                        Cancel
                      </Button>
                    )}

                    <Button
                      type="submit"
                      variant="default"
                      size="sm"
                      disabled={!isContentValid || isSubmitting}
                      className={cn(
                        "px-4 font-medium text-sm transition-all duration-200",
                        "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800",
                        "text-white shadow-sm hover:shadow"
                      )}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        submitLabel
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Minimal Actions (when not expanded) */}
            {!shouldShowActions && variant === 'default' && !parentCommentId && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 text-sm">
                  <button
                    type="button"
                    onClick={handleFileSelect}
                    className="flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    aria-label="Attach file"
                  >
                    <Paperclip size={14} />
                    <span>Attach</span>
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    aria-label="Add emoji"
                  >
                    <Smile size={14} />
                    <span>Emoji</span>
                  </button>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => textareaRef.current?.focus()}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  aria-label="Add comment"
                >
                  Add comment
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};