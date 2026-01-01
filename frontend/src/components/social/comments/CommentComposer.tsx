// components/social/comments/CommentComposer.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/social/ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/social/ui/Avatar';
import { Paperclip, Smile, X, Send, Image as ImageIcon, Video, FileText } from 'lucide-react';
import { commentService, CreateCommentData } from '@/services/commentService';
import { profileService } from '@/services/profileService';
import { toast } from 'sonner';

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
  maxHeight = 200
}) => {
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(autoFocus);
  const [isFocused, setIsFocused] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [characterCount, setCharacterCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load current user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const profile = await profileService.getProfile();
        setCurrentUser(profile.user);
      } catch (error) {
        console.error('Failed to load user profile:', error);
        toast.error('Failed to load user profile');
      }
    };
    loadUser();
  }, []);

  // Auto-focus
  useEffect(() => {
    if (autoFocus && textareaRef.current && !isFocused) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [autoFocus, isFocused]);

  // Update character count
  useEffect(() => {
    setCharacterCount(content.length);
  }, [content]);

  // Handle content changes
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      setContent(newValue);
    }
  };

  // Handle submit
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    // Validate content
    const validation = commentService.utils.validateContent(content);
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Submitting comment:', {
        postId,
        parentCommentId,
        contentLength: content.length
      });

      // Prepare comment data
      const commentData: CreateCommentData = {
        content: content.trim(),
        mentions: commentService.utils.extractMentions(content),
        hashtags: commentService.utils.extractHashtags(content),
        parentType: parentCommentId ? 'Comment' : 'Post',
        parentId: parentCommentId || postId
      };

      console.log('Comment data:', commentData);

      // Submit comment
      const newComment = await commentService.addComment(postId, commentData);

      console.log('Comment created:', newComment);

      // Reset form
      setContent('');
      setAttachments([]);
      setIsExpanded(false);
      setIsFocused(false);

      // Notify parent
      if (onAdded) {
        onAdded(newComment);
      }

      // Show success message
      toast.success(parentCommentId ? 'Reply posted successfully' : 'Comment posted successfully');

      // Blur textarea
      if (textareaRef.current) {
        textareaRef.current.blur();
      }

    } catch (error: any) {
      console.error('Failed to add comment:', error);

      if (error.message?.includes('Authentication')) {
        toast.error('Please login to comment');
      } else if (error.message?.includes('Maximum reply depth')) {
        toast.error('Maximum reply depth reached');
      } else {
        toast.error(error.message || 'Failed to post comment');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [content, postId, parentCommentId, onAdded]);

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }

    // Cancel on Escape
    if (e.key === 'Escape') {
      e.preventDefault();
      if (onCancel) {
        onCancel();
      } else if (content.trim() === '') {
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
    if (content.trim() === '' && !parentCommentId) {
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

    // Validate files
    const validFiles = files.filter(file => {
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error(`${file.name} exceeds 5MB limit`);
        return false;
      }
      return true;
    });

    setAttachments(prev => [...prev, ...validFiles]);

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
      <div className="mt-2 flex flex-wrap gap-2">
        {attachments.map((file, index) => (
          <div
            key={index}
            className="relative group flex items-center gap-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2"
          >
            <div className="flex items-center gap-2">
              {file.type.startsWith('image/') ? (
                <ImageIcon size={14} className="text-gray-500 dark:text-gray-400" />
              ) : file.type.startsWith('video/') ? (
                <Video size={14} className="text-gray-500 dark:text-gray-400" />
              ) : (
                <FileText size={14} className="text-gray-500 dark:text-gray-400" />
              )}
              <span className="text-xs text-gray-700 dark:text-gray-300 truncate max-w-[120px]">
                {file.name}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({(file.size / 1024).toFixed(1)}KB)
              </span>
            </div>
            <button
              type="button"
              onClick={() => removeAttachment(index)}
              className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X size={12} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`w-full ${className}`}>
      <form onSubmit={handleSubmit} noValidate>
        <div className={`flex ${compact ? 'items-start gap-2' : 'items-start gap-3'}`}>
          {/* Avatar */}
          {showAvatar && currentUser && (
            <div className="flex-shrink-0 pt-1">
              <Avatar className={`${compact ? "h-7 w-7" : "h-9 w-9"} ring-1 ring-gray-200 dark:ring-gray-700`}>
                <AvatarImage
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-600 dark:text-blue-400 text-sm">
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
                onChange={handleContentChange}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={getPlaceholder()}
                rows={1}
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl resize-none text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 disabled:bg-gray-50 dark:disabled:bg-gray-800/50 disabled:cursor-not-allowed"
                style={{
                  minHeight: `${minHeight}px`,
                  maxHeight: `${maxHeight}px`,
                  lineHeight: '1.5',
                  scrollbarWidth: 'thin'
                }}
              />

              {/* Character Counter */}
              {characterCount > 0 && (
                <div className="absolute bottom-2 right-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${characterCount > maxLength * 0.9
                    ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    : characterCount > maxLength * 0.75
                      ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                    }`}>
                    {characterCount}/{maxLength}
                  </span>
                </div>
              )}
            </div>

            {/* Attachments Preview */}
            {renderAttachments()}

            {/* Action Bar (Visible when focused or has content) */}
            {(isExpanded || content.trim() || attachments.length > 0) && (
              <div className="flex items-center justify-between mt-3">
                {/* Left Actions */}
                <div className="flex items-center gap-1">
                  {/* File Attachment */}
                  <button
                    type="button"
                    onClick={handleFileSelect}
                    disabled={isSubmitting}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Attach file"
                  >
                    <Paperclip size={16} />
                  </button>

                  {/* Emoji Picker (Placeholder) */}
                  <button
                    type="button"
                    disabled={isSubmitting}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Add emoji"
                  >
                    <Smile size={16} />
                  </button>

                  {/* Hidden File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                    accept="image/*,video/*,.pdf,.doc,.docx,.txt"
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
                    loading={isSubmitting}
                    disabled={!content.trim() || isSubmitting || characterCount > maxLength}
                    className="px-4 font-medium bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white text-sm"
                  >
                    {submitLabel}
                  </Button>
                </div>
              </div>
            )}

            {/* Quick Actions (when not focused and no content) */}
            {!isExpanded && !content.trim() && attachments.length === 0 && !parentCommentId && (
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 text-sm">
                  <button
                    type="button"
                    onClick={handleFileSelect}
                    className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <Paperclip size={14} />
                    <span>Attach</span>
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300"
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
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
                >
                  Add comment
                </Button>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};