/* eslint-disable @typescript-eslint/no-explicit-any */
// components/social/post/PostComposer.tsx
import React, { useState, useRef, useEffect } from 'react';
import { X, Image, Link2, Smile, UserPlus, Globe, Lock, Users, Send, Video, Play } from 'lucide-react';
import { Button } from '@/components/social/ui/Button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/social/ui/Avatar';
import { Badge } from '@/components/social/ui/Badge';
import { postService } from '@/services/postService';
import { profileService } from '@/services/profileService';
import { useToast } from '@/hooks/use-toast';

export interface PostCreatePayload {
  content: string;
  type?: 'text' | 'image' | 'video' | 'link' | 'achievement';
  media?: any[];
  mediaFiles?: File[];
  visibility?: 'public' | 'connections' | 'private';
  allowComments?: boolean;
  allowSharing?: boolean;
  hashtags?: string[];
  mentions?: string[];
  location?: any;
}

interface PostComposerProps {
  onPostCreated?: (post: any) => void;
  onClose?: () => void;
  initial?: Partial<PostCreatePayload>;
  roleContext?: 'candidate' | 'company' | 'freelancer' | 'organization' | 'admin';
  mode?: 'create' | 'edit';
  postId?: string;
}

export const PostComposer: React.FC<PostComposerProps> = ({
  onPostCreated,
  onClose,
  initial,
  roleContext = 'candidate',
  mode = 'create',
  postId
}) => {
  const [content, setContent] = useState(initial?.content || '');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [privacy, setPrivacy] = useState<'public' | 'connections' | 'private'>(
    initial?.visibility || 'public'
  );
  const [showPrivacyMenu, setShowPrivacyMenu] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await profileService.getProfile();
        setUserProfile(profile);
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024;
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4'];

      if (file.size > maxSize) {
        toast({
          variant: "warning",
          title: "File too large",
          description: `${file.name} exceeds 10MB limit`
        });
        return false;
      }

      if (!validTypes.includes(file.type)) {
        toast({
          variant: "warning",
          title: "Unsupported file type",
          description: `${file.name} is not supported`
        });
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;
    const filesToAdd = validFiles.slice(0, 4 - attachments.length);

    setAttachments(prev => [...prev, ...filesToAdd]);

    filesToAdd.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaPreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && attachments.length === 0) {
      toast({
        variant: "warning",
        title: "Content required",
        description: "Post content or media is required"
      });
      return;
    }

    setUploading(true);

    try {
      const postData: PostCreatePayload = {
        content: content.trim(),
        type: attachments.length > 0 ? (attachments[0].type.startsWith('video') ? 'video' : 'image') : 'text',
        visibility: privacy,
        allowComments: true,
        allowSharing: true,
        hashtags: postService.extractHashtags(content),
        mentions: postService.extractMentions(content),
        mediaFiles: attachments.length > 0 ? attachments : undefined
      };

      let result;
      if (mode === 'edit' && postId) {
        result = await postService.updatePost(postId, postData);
        toast({ variant: "success", title: "Success", description: "Post updated successfully" });
      } else {
        result = await postService.createPost(postData);
        toast({ variant: "success", title: "Success", description: "Post created successfully" });
      }

      if (mode === 'create') {
        setContent('');
        setAttachments([]);
        setMediaPreviews([]);
      }

      if (onPostCreated) onPostCreated(result);
      if (onClose) onClose();

    } catch (error: any) {
      console.error('Failed to submit post:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || 'Failed to submit post'
      });
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content, attachments, privacy, toast]);

  const privacyOptions = [
    { value: 'public', label: 'Public', icon: Globe, description: 'Anyone can see' },
    { value: 'connections', label: 'Connections', icon: Users, description: 'Connections only' },
    { value: 'private', label: 'Private', icon: Lock, description: 'Only you' }
  ];

  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Compact Header */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 text-sm">
            {mode === 'edit' ? 'Edit Post' : 'Create Post'}
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* User info row */}
        <div className="flex gap-2 mb-3">
          <Avatar className="h-8 w-8">
            {userProfile?.user?.avatar ? (
              <AvatarImage src={userProfile.user.avatar} alt={userProfile.user.name} />
            ) : (
              <AvatarFallback className="text-xs">
                {profileService.getInitials(userProfile?.user?.name || 'U')}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 text-sm">
                {userProfile?.user?.name || 'User'}
              </span>
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                {roleContext}
              </Badge>
            </div>

            {/* Privacy selector */}
            <div className="relative mt-0.5">
              <button
                onClick={() => setShowPrivacyMenu(!showPrivacyMenu)}
                className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900"
              >
                {privacyOptions.find(p => p.value === privacy)?.icon &&
                  React.createElement(privacyOptions.find(p => p.value === privacy)!.icon, { className: "w-3 h-3" })
                }
                <span>{privacyOptions.find(p => p.value === privacy)?.label}</span>
              </button>

              {showPrivacyMenu && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-10">
                  {privacyOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setPrivacy(option.value as any);
                        setShowPrivacyMenu(false);
                      }}
                      className={`flex items-start gap-2 w-full p-2 text-left hover:bg-gray-50 text-sm ${privacy === option.value ? 'bg-blue-50' : ''}`}
                    >
                      <option.icon className="w-3 h-3 mt-0.5 text-gray-600 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-gray-900">{option.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`What's on your mind, ${userProfile?.user?.name?.split(' ')[0] || 'there'}?`}
          className="w-full min-h-[80px] resize-none border-0 focus:ring-0 focus:outline-none text-gray-900 placeholder-gray-500 text-sm p-0"
          rows={2}
        />

        {/* Media previews - Grid */}
        {mediaPreviews.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {mediaPreviews.map((preview, index) => (
              <div key={index} className="relative rounded-lg overflow-hidden group">
                {attachments[index].type.startsWith('video') ? (
                  <div className="relative">
                    <video
                      src={preview}
                      className="w-full h-24 object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                  </div>
                ) : (
                  <img
                    src={preview}
                    alt={`Attachment ${index + 1}`}
                    className="w-full h-24 object-cover"
                  />
                )}
                <button
                  onClick={() => removeAttachment(index)}
                  className="absolute top-1 right-1 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Actions */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept="image/*,video/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
              title="Add media"
            >
              <Image className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
              title="Add link"
            >
              <Link2 className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
              title="Tag people"
            >
              <UserPlus className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
              title="Add emoji"
            >
              <Smile className="w-4 h-4" />
            </button>
          </div>

          <Button
            onClick={handleSubmit}
            loading={uploading}
            disabled={(!content.trim() && attachments.length === 0) || uploading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm px-3 py-1.5"
          >
            <Send className="w-3 h-3 mr-1" />
            {mode === 'edit' ? 'Update' : 'Post'}
          </Button>
        </div>

        {/* Helper text */}
        <div className="mt-2 text-xs text-gray-500 text-center">
          Press Ctrl+Enter to post • Max 4 files • 10MB each
        </div>
      </div>
    </div>
  );
};