/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef, useState } from 'react';
import { type CloudinaryImage, profileService } from '@/services/profileService';
import { Camera, Upload, Loader2, Image as ImageIcon, User, Check, AlertCircle, Cloud, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface AvatarUploaderProps {
  currentAvatar?: string | CloudinaryImage | null;
  currentCover?: string | CloudinaryImage | null;
  onAvatarComplete: (avatar: CloudinaryImage, thumbnailUrl?: string) => void;
  onCoverComplete: (cover: CloudinaryImage, thumbnailUrl?: string) => void;
  onAvatarDelete?: () => void;
  onCoverDelete?: () => void;
  onError?: (type: 'avatar' | 'cover', error: any) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  type?: 'avatar' | 'cover' | 'both';
  showHelperText?: boolean;
  showDeleteButtons?: boolean;
  maxFileSize?: {
    avatar?: number; // in MB
    cover?: number; // in MB
  };
  allowedTypes?: string[];
  aspectRatio?: {
    avatar?: '1:1' | '3:4' | '4:3';
    cover?: '16:9' | '3:1' | '2:1';
  };
  userId?: string;
  className?: string;
  // ADD THIS PROP
  preventFormSubmission?: boolean;
}

export const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  currentAvatar,
  currentCover,
  onAvatarComplete,
  onCoverComplete,
  onAvatarDelete,
  onCoverDelete,
  onError,
  size = 'lg',
  type = 'both',
  showHelperText = true,
  showDeleteButtons = true,
  maxFileSize = {
    avatar: 5, // 5MB for avatars (matches backend)
    cover: 10  // 10MB for covers (matches backend)
  },
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  aspectRatio = {
    avatar: '1:1',
    cover: '16:9'
  },
  userId,
  className = '',
  // ADD THIS DEFAULT VALUE
  preventFormSubmission = false
}) => {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<'avatar' | 'cover' | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<'avatar' | 'cover' | null>(null);

  const avatarSize = {
    sm: 'h-20 w-20',
    md: 'h-28 w-28',
    lg: 'h-36 w-36',
    xl: 'h-44 w-44',
  }[size];

  const getAspectRatioClass = (type: 'avatar' | 'cover') => {
    if (type === 'avatar') {
      switch (aspectRatio.avatar) {
        case '1:1': return 'aspect-square';
        case '3:4': return 'aspect-[3/4]';
        case '4:3': return 'aspect-[4/3]';
        default: return 'aspect-square';
      }
    } else {
      switch (aspectRatio.cover) {
        case '16:9': return 'aspect-video';
        case '3:1': return 'aspect-[3/1]';
        case '2:1': return 'aspect-[2/1]';
        default: return 'aspect-video';
      }
    }
  };

  const getDisplayUrl = (image: string | CloudinaryImage | null | undefined): string => {
    if (!image) return '';
    if (typeof image === 'string') return image;
    if (image && 'secure_url' in image) return image.secure_url;
    return '';
  };

  const validateFile = (file: File, fileType: 'avatar' | 'cover'): { valid: boolean; error?: string } => {
    console.log(`🔍 Validating ${fileType} file:`, {
      name: file.name,
      size: file.size,
      type: file.type,
      allowedTypes,
      maxSize: maxFileSize[fileType]
    });

    // Check file type
    const normalizedFileType = file.type.toLowerCase();
    const normalizedAllowedTypes = allowedTypes.map(t => t.toLowerCase());

    if (!normalizedAllowedTypes.includes(normalizedFileType)) {
      const error = `Invalid file type. Please select ${allowedTypes.map(t => t.split('/')[1]).join(', ').toUpperCase()} files only.`;
      console.error('❌ File type validation failed:', error);
      return { valid: false, error };
    }

    // Check file size
    const maxSize = (fileType === 'avatar' ? maxFileSize.avatar! : maxFileSize.cover!) * 1024 * 1024;
    if (file.size > maxSize) {
      const error = `File is too large. Maximum size is ${fileType === 'avatar' ? maxFileSize.avatar : maxFileSize.cover}MB.`;
      console.error('❌ File size validation failed:', error);
      return { valid: false, error };
    }

    if (file.size === 0) {
      const error = 'File is empty. Please select a valid image file.';
      console.error('❌ File empty validation failed');
      return { valid: false, error };
    }

    return { valid: true };
  };

  const validateImageDimensions = (file: File, fileType: 'avatar' | 'cover'): Promise<{ valid: boolean; error?: string }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(img.src);

        let warning = '';
        if (fileType === 'avatar') {
          if (img.width < 100 || img.height < 100) {
            warning = 'Low resolution profile picture - recommended minimum 100x100px';
            console.warn('⚠️ Low resolution avatar detected');
          }
        } else {
          if (img.width < 1200 || img.height < 300) {
            warning = 'Low resolution cover photo - recommended minimum 1200x300px';
            console.warn('⚠️ Low resolution cover detected');
          }
        }

        if (warning) {
          toast.warning(warning, { duration: 5000 });
        }

        resolve({ valid: true });
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        const error = 'Invalid image file. The selected file may be corrupted.';
        console.error('❌ Image load error:', error);
        resolve({ valid: false, error });
      };
    });
  };

  const handleFileSelect = async (file: File, fileType: 'avatar' | 'cover') => {
    if (!file) {
      console.error('❌ No file selected');
      return;
    }

    console.log(`📁 File selected for ${fileType}:`, {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    });

    // Create preview immediately for better UX
    const reader = new FileReader();
    reader.onload = (e) => {
      if (fileType === 'avatar') {
        setAvatarPreview(e.target?.result as string);
      } else {
        setCoverPreview(e.target?.result as string);
      }
    };
    reader.onerror = () => {
      console.error('❌ Error reading file for preview');
      toast.error('Failed to read image file');
    };
    reader.readAsDataURL(file);

    // Validate file
    const basicValidation = validateFile(file, fileType);
    if (!basicValidation.valid) {
      toast.error(basicValidation.error || 'Invalid file');
      clearPreview(fileType);
      return;
    }

    // Validate image dimensions
    const dimensionValidation = await validateImageDimensions(file, fileType);
    if (!dimensionValidation.valid) {
      toast.error(dimensionValidation.error || 'Invalid image');
      clearPreview(fileType);
      return;
    }

    // Start upload
    await uploadFile(file, fileType);
  };

  const uploadFile = async (file: File, fileType: 'avatar' | 'cover') => {
    console.log(`🚀 Starting ${fileType} upload...`);

    setUploadError(null);
    setUploadSuccess(false);
    setUploading(fileType);
    setUploadProgress(0);

    try {
      let result;
      const progressHandler = (progressEvent: any) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
          console.log(`📊 ${fileType} upload progress: ${percentCompleted}%`);
        }
      };

      if (fileType === 'avatar') {
        console.log('📤 Calling profileService.uploadAvatar...');
        result = await profileService.uploadAvatar(file, progressHandler);
        console.log('✅ Avatar upload service call successful:', result);
        onAvatarComplete(result.avatar, result.thumbnailUrl);
      } else {
        console.log('📤 Calling profileService.uploadCoverPhoto...');
        result = await profileService.uploadCoverPhoto(file, progressHandler);
        console.log('✅ Cover upload service call successful:', result);
        onCoverComplete(result.cover, result.thumbnailUrl);
      }

      setUploadProgress(100);
      setUploadSuccess(true);

      toast.success(`${fileType === 'avatar' ? 'Profile picture' : 'Cover photo'} updated successfully!`, {
        icon: <Cloud className="w-5 h-5 text-blue-500" />,
        duration: 4000,
      });

      console.log(`✅ ${fileType} upload completed successfully`);

      // Clear states after success
      setTimeout(() => {
        clearPreview(fileType);
        setUploading(null);
        setUploadProgress(0);
        setUploadSuccess(false);

        // Clear file input
        const fileInput = fileType === 'avatar' ? avatarInputRef.current : coverInputRef.current;
        if (fileInput) {
          fileInput.value = '';
          console.log(`🧹 Cleared ${fileType} file input`);
        }
      }, 2000);

    } catch (error: any) {
      console.error(`❌ ${fileType} upload failed:`, {
        error: error.message,
        code: error.code,
        name: error.name,
        stack: error.stack
      });

      const errorMessage = error.message || "Upload failed. Please try again.";
      setUploadError(errorMessage);

      toast.error(errorMessage, {
        duration: 5000,
        icon: <AlertCircle className="w-5 h-5 text-red-500" />,
      });

      if (onError) {
        onError(fileType, error);
      }

      // Keep preview so user can retry with same file
    } finally {
      console.log(`🏁 ${fileType} upload process completed`);
    }
  };

  const handleDelete = async (type: 'avatar' | 'cover') => {
    if (deleting) return;

    const confirmMessage = type === 'avatar'
      ? 'Are you sure you want to remove your profile picture?'
      : 'Are you sure you want to remove your cover photo?';

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setDeleting(type);

    try {
      if (type === 'avatar') {
        await profileService.deleteAvatar();
        if (onAvatarDelete) onAvatarDelete();
        toast.success('Profile picture removed successfully');
      } else {
        await profileService.deleteCoverPhoto();
        if (onCoverDelete) onCoverDelete();
        toast.success('Cover photo removed successfully');
      }
    } catch (error: any) {
      console.error(`❌ ${type} delete failed:`, error);
      toast.error(`Failed to remove ${type === 'avatar' ? 'profile picture' : 'cover photo'}`);
    } finally {
      setDeleting(null);
    }
  };

  const clearPreview = (fileType: 'avatar' | 'cover') => {
    if (fileType === 'avatar') {
      setAvatarPreview(null);
    } else {
      setCoverPreview(null);
    }
  };

  const cancelUpload = (fileType: 'avatar' | 'cover') => {
    console.log(`❌ Cancelling ${fileType} upload`);
    clearPreview(fileType);
    setUploading(null);
    setUploadProgress(0);
    setUploadSuccess(false);
    setUploadError(null);

    const fileInput = fileType === 'avatar' ? avatarInputRef.current : coverInputRef.current;
    if (fileInput) {
      fileInput.value = '';
    }

    toast.info(`${fileType === 'avatar' ? 'Profile picture' : 'Cover photo'} upload cancelled`);
  };

  const getDisplayImageUrl = (type: 'avatar' | 'cover'): string => {
    if (type === 'avatar') return avatarPreview || getDisplayUrl(currentAvatar);
    return coverPreview || getDisplayUrl(currentCover);
  };

  const renderUploadStatus = (fileType: 'avatar' | 'cover') => {
    if (uploading !== fileType) return null;

    if (uploadError) {
      return (
        <div className="absolute inset-0 bg-red-50/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-20 rounded-lg">
          <AlertCircle className="w-8 h-8 text-red-600 mb-2" />
          <p className="text-xs text-red-600 text-center mb-3 px-2 line-clamp-2">{uploadError}</p>
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                if (preventFormSubmission) {
                  e.preventDefault();
                  e.stopPropagation();
                }
                cancelUpload(fileType);
              }}
              className="text-[10px] bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-50 transition-colors flex items-center gap-1"
              disabled={!!deleting}
              type="button"
            >
              <X className="w-3 h-3" />
              Cancel
            </button>
            <button
              onClick={(e) => {
                if (preventFormSubmission) {
                  e.preventDefault();
                  e.stopPropagation();
                }
                setUploadError(null);
                const fileInput = fileType === 'avatar' ? avatarInputRef.current : coverInputRef.current;
                if (fileInput?.files?.[0]) {
                  uploadFile(fileInput.files[0], fileType);
                }
              }}
              className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
              disabled={!!deleting}
              type="button"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        </div>
      );
    }

    if (uploadSuccess) {
      return (
        <div className="absolute inset-0 bg-green-50/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-20 rounded-lg">
          <Check className="w-8 h-8 text-green-600 mb-1" />
          <p className="text-xs font-medium text-green-700">Upload Complete!</p>
          <p className="text-[10px] text-green-600 mt-1">Synced to Cloudinary</p>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-20 rounded-lg">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <div className="w-32 bg-gray-200 rounded-full h-1.5 mb-2">
          <div
            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
        <p className="text-[10px] text-gray-500">
          {uploadProgress}% - {uploadProgress < 100 ? 'Uploading to Cloudinary...' : 'Processing...'}
        </p>
        <button
          onClick={(e) => {
            if (preventFormSubmission) {
              e.preventDefault();
              e.stopPropagation();
            }
            cancelUpload(fileType);
          }}
          className="text-[10px] text-gray-500 hover:text-gray-700 mt-2 flex items-center gap-1"
          type="button"
        >
          <X className="w-3 h-3" />
          Cancel
        </button>
      </div>
    );
  };

  const renderDeleteButton = (fileType: 'avatar' | 'cover', hasImage: boolean) => {
    if (!showDeleteButtons || !hasImage || uploading || deleting) return null;

    return (
      <button
        onClick={(e) => {
          if (preventFormSubmission) {
            e.preventDefault();
            e.stopPropagation();
          }
          handleDelete(fileType);
        }}
        disabled={!!deleting}
        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
        title={`Remove ${fileType === 'avatar' ? 'profile picture' : 'cover photo'}`}
        type="button"
      >
        {deleting === fileType ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <X className="w-3.5 h-3.5" />
        )}
      </button>
    );
  };

  const hasAvatar = !!getDisplayImageUrl('avatar');
  const hasCover = !!getDisplayImageUrl('cover');

  // ADD THIS HANDLER TO PREVENT FORM SUBMISSION
  const handleClick = (e: React.MouseEvent, action: () => void) => {
    if (preventFormSubmission) {
      e.preventDefault();
      e.stopPropagation();
    }
    action();
  };

  return (
    <div className={`space-y-8 ${className}`} onClick={(e) => preventFormSubmission && e.stopPropagation()}>
      {/* Cover Photo Section */}
      {(type === 'cover' || type === 'both') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={(e) => handleClick(e, () => coverInputRef.current?.click())}
              disabled={!!uploading || !!deleting}
              type="button"
              className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-3.5 h-3.5" />
              {hasCover ? 'Change Cover' : 'Upload Cover'}
            </button>
          </div>

          <div className={`relative ${getAspectRatioClass('cover')} rounded-xl overflow-hidden border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors bg-gray-50 group`}>
            {getDisplayImageUrl('cover') ? (
              <>
                <img
                  src={getDisplayImageUrl('cover')}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
                {renderDeleteButton('cover', hasCover)}
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                <ImageIcon className="w-10 h-10 mb-2" />
                <p className="text-xs">No cover photo</p>
              </div>
            )}
            {renderUploadStatus('cover')}

            {/* Upload Overlay */}
            {!uploading && !hasCover && (
              <div 
                className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 cursor-pointer"
                onClick={(e) => handleClick(e, () => coverInputRef.current?.click())}
              >
                <Upload className="w-8 h-8 text-gray-500 mb-1" />
                <p className="text-xs text-gray-600">Click to upload cover</p>
                <p className="text-[10px] text-gray-500">Max {maxFileSize.cover}MB</p>
              </div>
            )}

            <input
              ref={coverInputRef}
              type="file"
              accept={allowedTypes.join(',')}
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileSelect(e.target.files[0], 'cover');
                }
              }}
              className="hidden"
              disabled={!!uploading || !!deleting}
              aria-label="Upload cover photo"
            />

            {/* Hidden label for better accessibility */}
            <label
              htmlFor="cover-upload"
              className="absolute inset-0 cursor-pointer"
              aria-label="Upload cover photo"
            />
          </div>
        </div>
      )}

      {/* Avatar Section */}
      {(type === 'avatar' || type === 'both') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Profile Picture</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Max {maxFileSize.avatar}MB • Recommended: 300x300px
              </p>
            </div>
            <button
              onClick={(e) => handleClick(e, () => avatarInputRef.current?.click())}
              disabled={!!uploading || !!deleting}
              type="button"
              className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera className="w-3.5 h-3.5" />
              {hasAvatar ? 'Change Photo' : 'Upload Photo'}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="relative shrink-0">
              <div className={`${avatarSize} rounded-full overflow-hidden border-4 border-white shadow-xl bg-gray-100 relative`}>
                {getDisplayImageUrl('avatar') ? (
                  <>
                    <img
                      src={getDisplayImageUrl('avatar')}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                    {renderDeleteButton('avatar', hasAvatar)}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <User className="w-10 h-10" />
                  </div>
                )}
                {renderUploadStatus('avatar')}
              </div>
              <button
                onClick={(e) => handleClick(e, () => avatarInputRef.current?.click())}
                disabled={!!uploading || !!deleting}
                className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2.5 rounded-full shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
                title="Change profile picture"
                type="button"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept={allowedTypes.join(',')}
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleFileSelect(e.target.files[0], 'avatar');
              }
            }}
            className="hidden"
            disabled={!!uploading || !!deleting}
            aria-label="Upload profile picture"
          />

          {/* Hidden label for better accessibility */}
          <label
            htmlFor="avatar-upload"
            className="hidden"
            aria-label="Upload profile picture"
          />
        </div>
      )}
    </div>
  );
};

export default AvatarUploader;