// components/posts/PostComposer.tsx
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Image as ImageIcon,
  Video as VideoIcon,
  File as FileIcon,
  Link,
  MapPin,
  Smile,
  Hash,
  Globe,
  Users,
  Lock,
  Calendar,
  BarChart,
  Send,
  Plus,
  Trash2,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { postService, CreatePostData, Poll } from '@/services/postService';
import { useDropzone } from 'react-dropzone';
import { colorClasses } from '@/utils/color';

interface PostComposerProps {
  onPostCreated?: (post: any) => void;
  onCancel?: () => void;
  isModal?: boolean;
  placeholder?: string;
  className?: string;
  initialContent?: string;
  editMode?: boolean;
  postId?: string;
}

interface MediaFileWithPreview {
  file: File;
  preview?: string;
  description: string;
  type: 'image' | 'video' | 'document';
  error?: string;
  uploadId?: string; // Unique ID for tracking uploads
  uploadProgress?: number;
  uploadError?: string;
}

const PostComposer: React.FC<PostComposerProps> = ({
  onPostCreated,
  onCancel,
  isModal = false,
  placeholder = "Share your professional insights...",
  className = "",
  initialContent = "",
  editMode = false,
  postId
}) => {
  const [content, setContent] = useState(initialContent);
  const [mediaFiles, setMediaFiles] = useState<MediaFileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<'public' | 'connections' | 'private'>('public');
  const [allowComments, setAllowComments] = useState(true);
  const [allowSharing, setAllowSharing] = useState(true);
  const [poll, setPoll] = useState<Omit<Poll, 'totalVotes'> | null>(null);
  const [showPollForm, setShowPollForm] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollDays, setPollDays] = useState(7);
  const [multipleChoice, setMultipleChoice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<File[]>([]);
  const [completedUploads, setCompletedUploads] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const uploadAbortController = useRef<AbortController | null>(null);

  // Handle click on photo/video button
  const handleMediaButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file selection via input
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(Array.from(files));
      // Reset file input to allow selecting same file again
      e.target.value = '';
    }
  };

  // Setup dropzone for Cloudinary-compatible files
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm']
    },
    maxSize: 200 * 1024 * 1024, // 200MB for videos, 20MB for images (Cloudinary limits)
    maxFiles: 10,
    onDrop: (acceptedFiles) => {
      handleFiles(acceptedFiles);
    },
    onDropRejected: (rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        const firstError = rejectedFiles[0].errors[0];
        if (firstError.code === 'file-too-large') {
          setError('File is too large. Maximum size is 200MB for videos, 20MB for images');
        } else if (firstError.code === 'file-invalid-type') {
          setError('File type not supported. Supported: images (JPG, PNG, GIF, WebP, SVG) and videos (MP4, MOV, AVI, MKV, WebM)');
        } else {
          setError('Cannot upload this file');
        }
      }
    },
    noClick: true,
    noKeyboard: true
  });

  const getFileType = (file: File): 'image' | 'video' | 'document' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    return 'document';
  };

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    // Cloudinary specific validations
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'];

    const isImage = allowedImageTypes.includes(file.type);
    const isVideo = allowedVideoTypes.includes(file.type);

    if (!isImage && !isVideo) {
      return {
        isValid: false,
        error: `File type "${file.type}" is not supported`
      };
    }

    // Cloudinary size limits
    const maxImageSize = 20 * 1024 * 1024; // 20MB
    const maxVideoSize = 200 * 1024 * 1024; // 200MB
    const maxSize = isImage ? maxImageSize : maxVideoSize;

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File "${file.name}" exceeds ${maxSize / (1024 * 1024)}MB limit for ${isImage ? 'images' : 'videos'}`
      };
    }

    // Prevent duplicate uploads
    const existingFile = mediaFiles.find(mf =>
      mf.file.name === file.name &&
      mf.file.size === file.size &&
      mf.file.type === file.type
    );

    if (existingFile) {
      return {
        isValid: false,
        error: `File "${file.name}" is already added`
      };
    }

    return { isValid: true };
  };

  const handleFiles = (files: File[]) => {
    if (files.length === 0) return;

    // Check total files
    const totalFiles = mediaFiles.length + files.length;
    if (totalFiles > 10) {
      setError('Maximum 10 files allowed');
      return;
    }

    // Validate each file
    const validatedFiles: MediaFileWithPreview[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      const validation = validateFile(file);
      if (!validation.isValid) {
        errors.push(validation.error || `File "${file.name}" is invalid`);
      } else {
        const uploadId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const mediaFile: MediaFileWithPreview = {
          file,
          description: '',
          type: getFileType(file),
          preview: undefined,
          uploadId,
          uploadProgress: 0
        };

        // Create preview for images
        if (mediaFile.type === 'image') {
          const reader = new FileReader();
          reader.onload = (e) => {
            mediaFile.preview = e.target?.result as string;
            setMediaFiles(prev => prev.map(mf =>
              mf.uploadId === uploadId ? { ...mf, preview: mediaFile.preview } : mf
            ));
          };
          reader.readAsDataURL(file);
        }
        // Create preview for videos (first frame if possible)
        else if (mediaFile.type === 'video') {
          // Create a video element to capture first frame
          const video = document.createElement('video');
          video.preload = 'metadata';

          video.onloadedmetadata = () => {
            // Set video to first frame
            video.currentTime = 0.1;
          };

          video.onseeked = () => {
            // Create canvas to capture frame
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              mediaFile.preview = canvas.toDataURL('image/jpeg');
              setMediaFiles(prev => prev.map(mf =>
                mf.uploadId === uploadId ? { ...mf, preview: mediaFile.preview } : mf
              ));
            }
          };

          video.onerror = () => {
            // If can't get preview, use placeholder
            mediaFile.preview = '/video-placeholder.png';
            setMediaFiles(prev => prev.map(mf =>
              mf.uploadId === uploadId ? { ...mf, preview: mediaFile.preview } : mf
            ));
          };

          const videoUrl = URL.createObjectURL(file);
          video.src = videoUrl;
        }

        validatedFiles.push(mediaFile);
      }
    });

    if (errors.length > 0) {
      setError(errors.join(', '));
    }

    if (validatedFiles.length > 0) {
      setMediaFiles(prev => [...prev, ...validatedFiles]);
      setError(null);

      // Clear any existing poll when adding media
      if (validatedFiles.length > 0 && poll) {
        setPoll(null);
        setShowPollForm(false);
      }
    }
  };

  const removeFile = (uploadId: string) => {
    const fileToRemove = mediaFiles.find(mf => mf.uploadId === uploadId);
    if (!fileToRemove) return;

    // Clean up blob URLs
    if (fileToRemove.preview?.startsWith('blob:') || fileToRemove.preview?.startsWith('data:')) {
      URL.revokeObjectURL(fileToRemove.preview);
    }

    // Remove from media files
    setMediaFiles(prev => prev.filter(mf => mf.uploadId !== uploadId));

    // Remove from completed uploads if it was uploaded
    setCompletedUploads(prev => prev.filter(id => id !== uploadId));
  };

  const updateMediaDescription = (uploadId: string, description: string) => {
    setMediaFiles(prev =>
      prev.map(mf => mf.uploadId === uploadId ? { ...mf, description } : mf)
    );
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
  };

  const addPollOption = () => {
    if (pollOptions.length < 10) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      const newOptions = [...pollOptions];
      newOptions.splice(index, 1);
      setPollOptions(newOptions);
    }
  };

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const createPoll = () => {
    const validOptions = pollOptions.filter(opt => opt.trim() !== '');
    if (validOptions.length < 2) {
      setError('Poll must have at least 2 options');
      return;
    }

    const pollData: Omit<Poll, 'totalVotes'> = {
      question: content || 'Poll',
      options: validOptions.map(opt => ({
        text: opt,
        votes: 0,
        voters: []
      })),
      endsAt: new Date(Date.now() + pollDays * 24 * 60 * 60 * 1000).toISOString(),
      multipleChoice
    };

    setPoll(pollData);
    setShowPollForm(false);
    setSuccess('Poll created successfully');
    // Clear media files when creating poll
    setMediaFiles([]);
  };

  const validatePostData = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!content.trim() && mediaFiles.length === 0 && !poll) {
      errors.push('Post must contain content, media, or a poll');
    }

    if (content.length > 10000) {
      errors.push('Content cannot exceed 10000 characters');
    }

    if (mediaFiles.length > 10) {
      errors.push('Maximum 10 files allowed');
    }

    // Check for any upload errors
    const uploadErrors = mediaFiles.filter(mf => mf.uploadError);
    if (uploadErrors.length > 0) {
      errors.push(...uploadErrors.map(mf => `Failed to upload: ${mf.file.name}`));
    }

    // Check for ongoing uploads
    const uploadingFiles = mediaFiles.filter(mf =>
      mf.uploadProgress !== undefined &&
      mf.uploadProgress < 100 &&
      !mf.uploadError
    );
    if (uploadingFiles.length > 0) {
      errors.push('Please wait for all files to finish uploading');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Simulate upload progress (in real app, this would be real upload)
  const simulateUpload = useCallback((uploadId: string) => {
    const interval = setInterval(() => {
      setMediaFiles(prev =>
        prev.map(mf => {
          if (mf.uploadId === uploadId && (mf.uploadProgress || 0) < 100) {
            const newProgress = Math.min((mf.uploadProgress || 0) + 10, 100);
            if (newProgress === 100) {
              setCompletedUploads(prev => [...prev, uploadId]);
            }
            return { ...mf, uploadProgress: newProgress };
          }
          return mf;
        })
      );
    }, 200);

    return () => clearInterval(interval);
  }, []);

  // Handle file uploads
  useEffect(() => {
    // Find files that need to be uploaded (not in completedUploads)
    const filesToUpload = mediaFiles.filter(mf =>
      !completedUploads.includes(mf.uploadId!) &&
      !mf.uploadError &&
      (mf.uploadProgress === 0 || mf.uploadProgress === undefined)
    );

    if (filesToUpload.length > 0) {
      setIsUploading(true);

      filesToUpload.forEach(mf => {
        // In a real app, you would upload to Cloudinary here
        // For now, we simulate the upload
        const cleanup = simulateUpload(mf.uploadId!);

        // Simulate potential upload error (10% chance for demo)
        if (Math.random() < 0.1) {
          setTimeout(() => {
            setMediaFiles(prev =>
              prev.map(item =>
                item.uploadId === mf.uploadId
                  ? { ...item, uploadError: 'Upload failed. Please try again.' }
                  : item
              )
            );
            cleanup();
          }, 1000);
        } else {
          // Auto-cleanup after "upload" completes
          setTimeout(() => cleanup(), 2200);
        }
      });
    }

    // Check if all uploads are complete
    const allUploaded = mediaFiles.length > 0 &&
      mediaFiles.every(mf =>
        mf.uploadProgress === 100 ||
        mf.uploadError ||
        completedUploads.includes(mf.uploadId!)
      );

    if (allUploaded) {
      setIsUploading(false);
    }
  }, [mediaFiles, completedUploads, simulateUpload]);

  const handleSubmit = async () => {
    // Validate post data
    const validation = validatePostData();
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Check if there are files still uploading
      const uploadingFiles = mediaFiles.filter(mf =>
        mf.uploadProgress !== undefined &&
        mf.uploadProgress < 100 &&
        !mf.uploadError
      );

      if (uploadingFiles.length > 0) {
        throw new Error('Please wait for all files to finish uploading');
      }

      // Prepare post data
      const postData: CreatePostData = {
        content: content.trim(),
        type: mediaFiles.length > 0 ?
          (mediaFiles.some(m => m.type === 'video') ? 'video' : 'image') :
          poll ? 'poll' : 'text',
        visibility,
        allowComments,
        allowSharing,
        mediaFiles: mediaFiles.map(mf => mf.file), // Send files for Cloudinary upload
      };

      // If there are media files, include descriptions
      if (mediaFiles.length > 0) {
        const descriptions = mediaFiles.map(mf => mf.description).filter(desc => desc.trim() !== '');
        if (descriptions.length > 0) {
          postData.mediaDescription = descriptions.join('|');
        }
      }

      // Include poll if exists
      if (poll) {
        postData.poll = poll;
      }

      console.log('Submitting post data:', {
        contentLength: postData.content.length,
        mediaFiles: postData.mediaFiles?.length || 0,
        hasPoll: !!postData.poll,
        type: postData.type,
        editMode,
        postId
      });

      // Create or update post using postService
      let createdPost;
      if (editMode && postId) {
        createdPost = await postService.updatePost(postId, postData);
        setSuccess('Post updated successfully!');
      } else {
        createdPost = await postService.createPost(postData);
        setSuccess('Post created successfully!');
      }

      // Reset form
      setContent('');
      setMediaFiles([]);
      setPoll(null);
      setPollOptions(['', '']);
      setShowPollForm(false);
      setCompletedUploads([]);

      if (onPostCreated) {
        onPostCreated(createdPost);
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);

    } catch (err: any) {
      console.error('Error creating post:', err);
      setError(err.message || 'Failed to create post. Please try again.');

      // Preserve form data on error
      if (editMode) {
        setSuccess('Your draft has been preserved. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      mediaFiles.forEach(mediaFile => {
        if (mediaFile.preview?.startsWith('blob:') || mediaFile.preview?.startsWith('data:')) {
          URL.revokeObjectURL(mediaFile.preview);
        }
      });

      // Abort any ongoing uploads
      if (uploadAbortController.current) {
        uploadAbortController.current.abort();
      }
    };
  }, [mediaFiles]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Get file type icon
  const getFileIcon = (type: string) => {
    if (type === 'image') {
      return <ImageIcon className="w-5 h-5 text-blue-500" />;
    } else if (type === 'video') {
      return <VideoIcon className="w-5 h-5 text-purple-500" />;
    } else {
      return <FileIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Render upload status
  const renderUploadStatus = (mediaFile: MediaFileWithPreview) => {
    if (mediaFile.uploadError) {
      return (
        <div className={`text-xs mt-1 ${colorClasses.text.orange} flex items-center gap-1`}>
          <AlertCircle className="w-3 h-3" />
          {mediaFile.uploadError}
        </div>
      );
    }

    if (mediaFile.uploadProgress === 100 || completedUploads.includes(mediaFile.uploadId!)) {
      return (
        <div className={`text-xs mt-1 ${colorClasses.text.teal} flex items-center gap-1`}>
          <CheckCircle className="w-3 h-3" />
          Uploaded
        </div>
      );
    }

    if (mediaFile.uploadProgress && mediaFile.uploadProgress > 0) {
      return (
        <div className="text-xs mt-1">
          <div className="flex items-center justify-between mb-1">
            <span className={colorClasses.text.blue}>Uploading...</span>
            <span className={colorClasses.text.blue}>{mediaFile.uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${mediaFile.uploadProgress}%` }}
            />
          </div>
        </div>
      );
    }

    return null;
  };

  // Render media preview
  const renderMediaPreview = (mediaFile: MediaFileWithPreview) => {
    if (mediaFile.type === 'image' && mediaFile.preview) {
      return (
        <div className="aspect-square relative">
          <img
            src={mediaFile.preview}
            alt={`Preview`}
            className="w-full h-full object-cover rounded"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
        </div>
      );
    } else if (mediaFile.type === 'video') {
      return (
        <div className="aspect-square relative bg-gray-900">
          {mediaFile.preview ? (
            <img
              src={mediaFile.preview}
              alt={`Video preview`}
              className="w-full h-full object-cover rounded"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <VideoIcon className="w-12 h-12 text-white opacity-50" />
              <span className="text-white text-sm mt-2 opacity-75">Video</span>
            </div>
          )}
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {formatFileSize(mediaFile.file.size)}
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
        </div>
      );
    } else {
      return (
        <div className="aspect-square flex flex-col items-center justify-center p-4 bg-gray-100 rounded">
          <div className="mb-2">
            {getFileIcon(mediaFile.type)}
          </div>
          <p className={`text-xs ${colorClasses.text.gray800} text-center truncate w-full px-2`}>
            {mediaFile.file.name}
          </p>
          <p className={`text-xs ${colorClasses.text.gray400} mt-1`}>
            {formatFileSize(mediaFile.file.size)}
          </p>
        </div>
      );
    }
  };

  const canSubmit = !isSubmitting &&
    (content.trim().length > 0 || mediaFiles.length > 0 || poll) &&
    !mediaFiles.some(mf => mf.uploadError) &&
    mediaFiles.every(mf =>
      mf.uploadProgress === 100 ||
      mf.uploadError ||
      completedUploads.includes(mf.uploadId!) ||
      mf.uploadProgress === undefined
    );

  return (
    <div className={`rounded-lg ${colorClasses.bg.white} border ${colorClasses.border.gray400} p-4 ${className}`}>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        className="hidden"
        accept="image/*,video/mp4,video/mov,video/avi,video/mkv,video/webm"
        multiple
      />

      {/* Dropzone overlay */}
      <div {...getRootProps()} className="relative">
        <input {...getInputProps()} />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${colorClasses.text.darkNavy}`}>
            {editMode ? 'Edit Post' : 'Create Post'}
          </h3>
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              type="button"
              aria-label="Cancel"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Content Input */}
        <div className="mb-4">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            placeholder={placeholder}
            className={`w-full border-0 focus:ring-0 resize-none min-h-[100px] ${colorClasses.text.darkNavy} placeholder:${colorClasses.text.gray400} bg-transparent`}
            maxLength={10000}
            aria-label="Post content"
          />
          <div className="flex justify-between text-sm mt-1">
            <span className={`${colorClasses.text.gray400}`}>
              {content.length}/10000
            </span>
            <div className="flex gap-2">
              <span className={`px-2 py-1 rounded ${colorClasses.bg.gray100} ${colorClasses.text.gray800}`}>
                Hashtags: {postService.extractHashtags(content).length}
              </span>
              <span className={`px-2 py-1 rounded ${colorClasses.bg.gray100} ${colorClasses.text.gray800}`}>
                Mentions: {postService.extractMentions(content).length}
              </span>
            </div>
          </div>
        </div>

        {/* Media Previews */}
        {mediaFiles.length > 0 && (
          <div className="mb-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {mediaFiles.map((mediaFile) => (
                <div key={mediaFile.uploadId} className="relative group">
                  <div className={`rounded-lg border ${colorClasses.border.gray400} overflow-hidden`}>
                    {renderMediaPreview(mediaFile)}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(mediaFile.uploadId!);
                    }}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg hover:bg-red-600"
                    type="button"
                    aria-label={`Remove ${mediaFile.file.name}`}
                    disabled={isSubmitting}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <input
                    type="text"
                    value={mediaFile.description || ''}
                    onChange={(e) => updateMediaDescription(mediaFile.uploadId!, e.target.value)}
                    placeholder="Add description..."
                    className={`w-full mt-2 text-sm border ${colorClasses.border.gray400} rounded px-2 py-1.5 ${colorClasses.text.darkNavy} focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Description for ${mediaFile.file.name}`}
                    disabled={isSubmitting}
                  />
                  {renderUploadStatus(mediaFile)}
                </div>
              ))}
            </div>
            <div className={`text-sm mt-2 ${colorClasses.text.gray400} flex items-center justify-between`}>
              <span>
                {mediaFiles.length} file{mediaFiles.length !== 1 ? 's' : ''} •
                Max 10 files • Images: 20MB • Videos: 200MB
              </span>
              {isUploading && (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Uploading...</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Poll Form */}
        {showPollForm && (
          <div className={`mb-4 p-4 rounded-lg border ${colorClasses.border.gray400} ${colorClasses.bg.gray100}`}>
            <div className="flex justify-between items-center mb-3">
              <h4 className={`font-medium ${colorClasses.text.darkNavy}`}>Create Poll</h4>
              <button
                onClick={() => setShowPollForm(false)}
                className="text-gray-500 hover:text-gray-700"
                type="button"
                aria-label="Close poll form"
                disabled={isSubmitting}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {pollOptions.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updatePollOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className={`flex-1 border ${colorClasses.border.gray400} rounded px-3 py-2 ${colorClasses.text.darkNavy} focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    aria-label={`Poll option ${index + 1}`}
                    disabled={isSubmitting}
                  />
                  {pollOptions.length > 2 && (
                    <button
                      onClick={() => removePollOption(index)}
                      className="p-2 text-red-500 hover:text-red-700 disabled:opacity-50"
                      type="button"
                      aria-label={`Remove option ${index + 1}`}
                      disabled={isSubmitting}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              {pollOptions.length < 10 && (
                <button
                  onClick={addPollOption}
                  className={`text-sm flex items-center gap-1 ${colorClasses.text.blue} hover:underline disabled:opacity-50`}
                  type="button"
                  aria-label="Add poll option"
                  disabled={isSubmitting}
                >
                  <Plus className="w-3 h-3" />
                  Add option
                </button>
              )}
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="multipleChoice"
                  checked={multipleChoice}
                  onChange={(e) => setMultipleChoice(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  aria-label="Allow multiple choices"
                  disabled={isSubmitting}
                />
                <label htmlFor="multipleChoice" className={`text-sm ${colorClasses.text.darkNavy} select-none`}>
                  Allow multiple choices
                </label>
              </div>

              <div>
                <label className={`block text-sm mb-1 ${colorClasses.text.darkNavy}`}>
                  Poll duration (days)
                </label>
                <select
                  value={pollDays}
                  onChange={(e) => setPollDays(Number(e.target.value))}
                  className={`w-full border ${colorClasses.border.gray400} rounded px-3 py-2 ${colorClasses.text.darkNavy} focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50`}
                  aria-label="Poll duration"
                  disabled={isSubmitting}
                >
                  <option value={1}>1 day</option>
                  <option value={3}>3 days</option>
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                </select>
              </div>
            </div>

            <button
              onClick={createPoll}
              className={`mt-4 w-full py-2 rounded-lg font-medium ${colorClasses.bg.goldenMustard} ${colorClasses.text.darkNavy} hover:opacity-90 transition-opacity disabled:opacity-50`}
              type="button"
              aria-label="Create poll"
              disabled={isSubmitting}
            >
              Create Poll
            </button>
          </div>
        )}

        {/* Existing Poll Preview */}
        {poll && !showPollForm && (
          <div className={`mb-4 p-4 rounded-lg border ${colorClasses.border.gray400} ${colorClasses.bg.gray100}`}>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <BarChart className="w-5 h-5 text-gray-500" />
                <span className={`font-medium ${colorClasses.text.darkNavy}`}>Poll</span>
              </div>
              <button
                onClick={() => setPoll(null)}
                className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                type="button"
                aria-label="Remove poll"
                disabled={isSubmitting}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className={`mb-3 ${colorClasses.text.darkNavy}`}>{poll.question}</p>
            <div className="space-y-2">
              {poll.options.map((option, index) => (
                <div key={index} className={`p-2 rounded ${colorClasses.bg.white} border ${colorClasses.border.gray400}`}>
                  {option.text}
                </div>
              ))}
            </div>
            <div className={`text-sm mt-2 ${colorClasses.text.gray400}`}>
              Poll ends {new Date(poll.endsAt || '').toLocaleDateString()} • {multipleChoice ? 'Multiple choice' : 'Single choice'}
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className={`py-3 border-t ${colorClasses.border.gray400}`}>
          <div className="flex flex-wrap gap-2 mb-3">
            {/* Photo/Video Button */}
            <button
              onClick={handleMediaButtonClick}
              type="button"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg ${colorClasses.bg.gray100} ${colorClasses.text.darkNavy} hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label="Add photos or videos"
              disabled={mediaFiles.length >= 10 || isSubmitting}
            >
              <ImageIcon className="w-5 h-5" />
              <span>Photo/Video</span>
            </button>

            <button
              onClick={() => setShowPollForm(true)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg ${colorClasses.bg.gray100} ${colorClasses.text.darkNavy} hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
              type="button"
              aria-label="Create poll"
              disabled={mediaFiles.length > 0 || isSubmitting}
            >
              <BarChart className="w-5 h-5" />
              <span>Poll</span>
            </button>

            <button
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg ${colorClasses.bg.gray100} ${colorClasses.text.darkNavy} hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
              type="button"
              aria-label="Add hashtag"
              disabled={isSubmitting}
            >
              <Hash className="w-5 h-5" />
              <span>Hashtag</span>
            </button>

            <button
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg ${colorClasses.bg.gray100} ${colorClasses.text.darkNavy} hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
              type="button"
              aria-label="Add emoji"
              disabled={isSubmitting}
            >
              <Smile className="w-5 h-5" />
              <span>Emoji</span>
            </button>
          </div>

          {/* Privacy Settings */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Privacy Select */}
              <div className="relative">
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as any)}
                  className={`text-sm border ${colorClasses.border.gray400} rounded pl-8 pr-8 py-1.5 ${colorClasses.text.darkNavy} appearance-none bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50`}
                  aria-label="Post visibility"
                  disabled={isSubmitting}
                >
                  <option value="public">Public</option>
                  <option value="connections">Connections Only</option>
                  <option value="private">Private</option>
                </select>
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  {visibility === 'public' && <Globe className="w-4 h-4 text-gray-500" />}
                  {visibility === 'connections' && <Users className="w-4 h-4 text-gray-500" />}
                  {visibility === 'private' && <Lock className="w-4 h-4 text-gray-500" />}
                </div>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowComments}
                    onChange={(e) => setAllowComments(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                    aria-label="Allow comments"
                    disabled={isSubmitting}
                  />
                  <span className={`text-sm ${colorClasses.text.darkNavy} select-none`}>Comments</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowSharing}
                    onChange={(e) => setAllowSharing(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                    aria-label="Allow sharing"
                    disabled={isSubmitting}
                  />
                  <span className={`text-sm ${colorClasses.text.darkNavy} select-none`}>Sharing</span>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {error && (
                <div className={`text-sm px-3 py-1 rounded ${colorClasses.bg.orange} bg-opacity-10 ${colorClasses.text.orange} flex items-center gap-1`}>
                  <AlertCircle className="w-3 h-3" />
                  {error}
                </div>
              )}

              {success && (
                <div className={`text-sm px-3 py-1 rounded ${colorClasses.bg.teal} bg-opacity-10 ${colorClasses.text.teal} flex items-center gap-1`}>
                  <CheckCircle className="w-3 h-3" />
                  {success}
                </div>
              )}

              {onCancel && (
                <button
                  onClick={onCancel}
                  className={`px-4 py-2 rounded-lg border ${colorClasses.border.gray400} ${colorClasses.text.darkNavy} hover:bg-gray-50 transition-colors disabled:opacity-50`}
                  type="button"
                  aria-label="Cancel"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              )}

              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all
                  ${!canSubmit
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : `${colorClasses.bg.goldenMustard} ${colorClasses.text.darkNavy} hover:opacity-90 active:scale-95 shadow-sm`
                  }`}
                type="button"
                aria-label={isSubmitting ? "Posting..." : editMode ? "Update Post" : "Post"}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>{editMode ? 'Updating...' : 'Posting...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{editMode ? 'Update' : 'Post'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Drag & Drop Overlay */}
      {isDragActive && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className={`p-8 rounded-xl ${colorClasses.bg.white} text-center max-w-md mx-4 shadow-2xl`}>
            <div className="text-5xl mb-4">📁</div>
            <h3 className={`text-2xl font-bold mb-3 ${colorClasses.text.darkNavy}`}>
              Drop files here
            </h3>
            <p className={`text-lg mb-2 ${colorClasses.text.gray800}`}>
              Upload images or videos for Cloudinary
            </p>
            <p className={`text-sm ${colorClasses.text.gray400}`}>
              Maximum 10 files • Images: 20MB • Videos: 200MB
            </p>
            <div className="mt-6 flex items-center justify-center gap-2">
              <Upload className="w-5 h-5 animate-bounce" />
              <span className="text-sm text-blue-500">Release to upload</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostComposer;