// components/social/profile/AvatarUploader.tsx - IMPROVED VERSION
import React, { useRef, useState } from 'react';
import { profileService } from '@/services/profileService';
import { Camera, Upload, Loader2, X, Image as ImageIcon, User, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AvatarUploaderProps {
  currentAvatar?: string;
  currentCover?: string;
  onAvatarComplete: (avatarUrl: string) => void;
  onCoverComplete: (coverUrl: string) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  type?: 'avatar' | 'cover' | 'both';
  showHelperText?: boolean;
  maxFileSize?: number;
  allowedTypes?: string[];
  aspectRatio?: {
    avatar?: '1:1' | '3:4' | '4:3';
    cover?: '16:9' | '3:1' | '2:1';
  };
}

export const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  currentAvatar,
  currentCover,
  onAvatarComplete,
  onCoverComplete,
  size = 'lg',
  type = 'both',
  showHelperText = true,
  maxFileSize = 5,
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  aspectRatio = {
    avatar: '1:1',
    cover: '16:9'
  }
}) => {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<'avatar' | 'cover' | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const avatarSize = {
    sm: 'h-20 w-20',
    md: 'h-28 w-28',
    lg: 'h-36 w-36',
    xl: 'h-44 w-44',
  }[size];

  const coverHeight = {
    sm: 'h-32',
    md: 'h-40',
    lg: 'h-48',
    xl: 'h-56',
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

  const validateFile = (file: File, fileType: 'avatar' | 'cover'): Promise<boolean> => {
    return new Promise((resolve) => {
      console.log(`Validating ${fileType} file:`, {
        name: file.name,
        type: file.type,
        size: file.size,
        isValidType: allowedTypes.includes(file.type),
        isWithinSize: file.size <= maxFileSize * 1024 * 1024
      });

      // Check file type
      if (!allowedTypes.includes(file.type)) {
        const errorMsg = `Invalid file type. Please select ${allowedTypes.map(t => t.split('/')[1]).join(', ').toUpperCase()} files only.`;
        toast.error(errorMsg);
        resolve(false);
        return;
      }

      // Check file size
      const maxSize = maxFileSize * 1024 * 1024;
      if (file.size > maxSize) {
        const errorMsg = `File is too large. Maximum size is ${maxFileSize}MB.`;
        toast.error(errorMsg);
        resolve(false);
        return;
      }

      if (file.size === 0) {
        toast.error('File is empty');
        resolve(false);
        return;
      }

      // Create image element to check dimensions
      const img = new Image();
      img.src = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(img.src);

        if (fileType === 'avatar') {
          // Avatar specific validations
          if (img.width < 100 || img.height < 100) {
            toast.error('Profile picture should be at least 100x100 pixels');
            resolve(false);
            return;
          }

          const aspectRatio = img.width / img.height;
          if (aspectRatio < 0.8 || aspectRatio > 1.2) {
            toast.warning('Profile picture should be close to square (1:1 ratio)');
            // Not blocking, just warning
          }
        } else {
          // Cover specific validations
          if (img.width < 1200 || img.height < 300) {
            toast.warning('Cover photo should be at least 1200x300 pixels for best quality');
            // Not blocking, just warning
          }
        }

        resolve(true);
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        toast.error('Invalid image file. Please try another image.');
        resolve(false);
      };
    });
  };

  const handleFileSelect = async (file: File, fileType: 'avatar' | 'cover') => {
    if (!file) return;

    try {
      console.log(`${fileType} file selected:`, {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      });

      const isValid = await validateFile(file, fileType);
      if (!isValid) {
        // Reset input
        if (fileType === 'avatar' && avatarInputRef.current) {
          avatarInputRef.current.value = '';
        } else if (fileType === 'cover' && coverInputRef.current) {
          coverInputRef.current.value = '';
        }
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (fileType === 'avatar') {
          setAvatarPreview(e.target?.result as string);
        } else {
          setCoverPreview(e.target?.result as string);
        }
      };
      reader.readAsDataURL(file);

      await uploadFile(file, fileType);
    } catch (error) {
      console.error(`Error handling ${fileType} file:`, error);
      toast.error(`Error processing ${fileType === 'avatar' ? 'profile picture' : 'cover photo'}. Please try another file.`);
    }
  };

  const uploadFile = async (file: File, fileType: 'avatar' | 'cover') => {
    setUploadError(null);
    setUploadSuccess(false);

    try {
      setUploading(fileType);
      setUploadProgress(10);

      console.log(`Starting ${fileType} upload:`, {
        name: file.name,
        size: file.size,
        type: file.type
      });

      // Real progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) { // Stop at 90% for actual upload
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);

      let result;
      if (fileType === 'avatar') {
        console.log('Calling profileService.uploadAvatar...');
        result = await profileService.uploadAvatar(file);
        console.log('Avatar upload result:', result);

        if (!result || !result.avatarUrl) {
          throw new Error('Avatar URL not received from server');
        }

        // Notify parent component
        onAvatarComplete(result.avatarUrl);

        console.log('Avatar upload completed successfully');

      } else {
        console.log('Calling profileService.uploadCoverPhoto...');
        result = await profileService.uploadCoverPhoto(file);
        console.log('Cover photo upload result:', result);

        if (!result || !result.coverPhotoUrl) {
          throw new Error('Cover photo URL not received from server');
        }

        // Notify parent component
        onCoverComplete(result.coverPhotoUrl);

        console.log('Cover photo upload completed successfully');
      }

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadSuccess(true);

      // Clear preview and reset after delay
      setTimeout(() => {
        if (fileType === 'avatar') {
          setAvatarPreview(null);
        } else {
          setCoverPreview(null);
        }
        setUploading(null);
        setUploadProgress(0);
        setUploadSuccess(false);
      }, 2000);

    } catch (error: any) {
      console.error(`${fileType} upload failed:`, error);

      let errorMessage = error.message || `Failed to upload ${fileType === 'avatar' ? 'profile picture' : 'cover photo'}`;

      // Parse error messages
      if (error.message?.includes('network') || error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message?.includes('size') || error.message?.includes('large')) {
        errorMessage = `File is too large. Maximum size is ${maxFileSize}MB.`;
      } else if (error.message?.includes('type') || error.message?.includes('format')) {
        errorMessage = 'Invalid file format. Please use JPG, PNG, or WebP images.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      setUploadError(errorMessage);
      toast.error(errorMessage);

      // Reset upload state
      cancelUpload(fileType);
    } finally {
      // Always reset file inputs
      if (fileType === 'avatar' && avatarInputRef.current) {
        avatarInputRef.current.value = '';
      } else if (fileType === 'cover' && coverInputRef.current) {
        coverInputRef.current.value = '';
      }
    }
  };

  const handleAvatarClick = () => avatarInputRef.current?.click();
  const handleCoverClick = () => coverInputRef.current?.click();

  const cancelUpload = (fileType: 'avatar' | 'cover') => {
    console.log(`Cancelling ${fileType} upload`);

    if (fileType === 'avatar') {
      setAvatarPreview(null);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    } else {
      setCoverPreview(null);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
    setUploading(null);
    setUploadProgress(0);
    setUploadSuccess(false);
    setUploadError(null);
  };

  const getDisplayUrl = (type: 'avatar' | 'cover'): string => {
    if (type === 'avatar') {
      // Priority: preview → current avatar → fallback
      if (avatarPreview) return avatarPreview;
      return currentAvatar || '';
    } else {
      // Priority: preview → current cover → fallback
      if (coverPreview) return coverPreview;
      return currentCover || '';
    }
  };

  const getStatusText = (fileType: 'avatar' | 'cover') => {
    if (uploading === fileType) {
      if (uploadSuccess) return 'Upload successful!';
      if (uploadError) return uploadError;
      return `Uploading... ${uploadProgress}%`;
    }
    return '';
  };

  const renderUploadStatus = (fileType: 'avatar' | 'cover') => {
    if (uploading !== fileType) return null;

    if (uploadError) {
      return (
        <div className="absolute inset-0 bg-red-50/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-10 rounded-lg">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3 mx-auto">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-sm font-medium text-red-700 mb-1">Upload Failed</p>
            <p className="text-xs text-red-600 mb-4 max-w-xs">{uploadError}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => cancelUpload(fileType)}
                className="text-xs text-gray-700 hover:text-gray-900 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setUploadError(null);
                  // Re-trigger file selection
                  if (fileType === 'avatar') {
                    handleAvatarClick();
                  } else {
                    handleCoverClick();
                  }
                }}
                className="text-xs text-blue-700 hover:text-blue-800 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 rounded transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (uploadSuccess) {
      return (
        <div className="absolute inset-0 bg-green-50/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-10 rounded-lg">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3 mx-auto">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm font-medium text-green-700">Upload Successful!</p>
            <p className="text-xs text-green-600 mt-1">Your {fileType === 'avatar' ? 'profile picture' : 'cover photo'} has been updated.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-10 rounded-lg">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3 mx-auto" />
          <p className="text-sm font-medium text-gray-700 mb-2">
            Uploading {fileType === 'avatar' ? 'Profile Picture' : 'Cover Photo'}...
          </p>
          <div className="w-48 bg-gray-200 rounded-full overflow-hidden mb-2">
            <div
              className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mb-3">
            {uploadProgress}% • Please don't close this window
          </p>
          <button
            type="button"
            onClick={() => cancelUpload(fileType)}
            className="text-xs text-red-600 hover:text-red-700 px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded transition-colors"
          >
            Cancel Upload
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Cover Photo Uploader */}
      {(type === 'cover' || type === 'both') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Cover Photo</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Recommended: 1500×500px (16:9 ratio) • Max {maxFileSize}MB • JPG, PNG, WebP
              </p>
            </div>
            <button
              onClick={handleCoverClick}
              disabled={uploading === 'cover'}
              type="button"
              className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {currentCover ? 'Change Cover' : 'Upload Cover'}
            </button>
          </div>

          <div className={`relative ${getAspectRatioClass('cover')} rounded-xl overflow-hidden border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors bg-gradient-to-br from-gray-50 to-gray-100 group`}>
            <div className="absolute inset-0">
              {getDisplayUrl('cover') ? (
                <img
                  src={getDisplayUrl('cover')}
                  alt="Cover"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Cover image failed to load:', getDisplayUrl('cover'));
                    e.currentTarget.src = '';
                    e.currentTarget.classList.add('hidden');
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-4">
                  <ImageIcon className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-sm font-medium">No cover photo</p>
                  <p className="text-xs mt-1">Click to upload a cover photo</p>
                </div>
              )}
            </div>

            {renderUploadStatus('cover')}

            {/* Upload overlay button */}
            {!uploading && (
              <button
                type="button"
                onClick={handleCoverClick}
                disabled={uploading === 'cover'}
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 backdrop-blur-[1px]"
              >
                <div className="px-4 py-2.5 bg-white/95 backdrop-blur-sm text-gray-900 text-sm font-medium rounded-lg shadow-lg hover:bg-white transition-colors flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  {currentCover ? 'Change Cover Photo' : 'Upload Cover Photo'}
                </div>
              </button>
            )}

            <input
              ref={coverInputRef}
              type="file"
              accept={allowedTypes.join(',')}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileSelect(file, 'cover');
                }
                // Clear input for same file selection
                e.target.value = '';
              }}
              className="hidden"
              disabled={uploading === 'cover'}
            />
          </div>

          {getStatusText('cover') && (
            <div className={`px-3 py-2 rounded-lg text-sm ${uploadSuccess ? 'bg-green-50 text-green-700 border border-green-200' : uploadError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
              <div className="flex items-center gap-2">
                {uploadSuccess ? <Check className="w-4 h-4" /> : uploadError ? <AlertCircle className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{getStatusText('cover')}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Avatar Uploader */}
      {(type === 'avatar' || type === 'both') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Profile Picture</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Square image recommended • Max {maxFileSize}MB • JPG, PNG, WebP
              </p>
            </div>
            <button
              onClick={handleAvatarClick}
              disabled={uploading === 'avatar'}
              type="button"
              className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              {currentAvatar ? 'Change Photo' : 'Upload Photo'}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="relative flex-shrink-0">
              <div className={`${avatarSize} rounded-full overflow-hidden border-4 border-white shadow-xl ${getAspectRatioClass('avatar')} bg-gradient-to-br from-blue-50 to-purple-50`}>
                {getDisplayUrl('avatar') ? (
                  <img
                    src={getDisplayUrl('avatar')}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Avatar image failed to load:', getDisplayUrl('avatar'));
                      e.currentTarget.src = '';
                      e.currentTarget.classList.add('hidden');
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                )}

                {renderUploadStatus('avatar')}
              </div>

              {/* Camera icon overlay */}
              {!uploading && (
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  disabled={uploading === 'avatar'}
                  className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                  title="Change profile picture"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>

            {showHelperText && (
              <div className="flex-1">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="font-medium text-gray-700 mb-2">Best practices for profile pictures:</p>
                  <ul className="text-xs text-gray-600 space-y-1.5">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
                      <span>Use a clear, high-resolution photo (at least 400×400 pixels)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
                      <span>Face should be clearly visible and well-lit</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
                      <span>Square or nearly square images work best (1:1 ratio)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
                      <span>Professional or friendly expression recommended</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <input
            ref={avatarInputRef}
            type="file"
            accept={allowedTypes.join(',')}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileSelect(file, 'avatar');
              }
              // Clear input for same file selection
              e.target.value = '';
            }}
            className="hidden"
            disabled={uploading === 'avatar'}
          />

          {getStatusText('avatar') && (
            <div className={`px-3 py-2 rounded-lg text-sm ${uploadSuccess ? 'bg-green-50 text-green-700 border border-green-200' : uploadError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
              <div className="flex items-center gap-2">
                {uploadSuccess ? <Check className="w-4 h-4" /> : uploadError ? <AlertCircle className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{getStatusText('avatar')}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Combined Tips Section */}
      {type === 'both' && showHelperText && (
        <div className="pt-6 border-t border-gray-200">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-xl p-4">
            <p className="font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Check className="w-4 h-4 text-blue-600" />
              Quick Tips for Best Results:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
                <span>Profile picture: Use 1:1 ratio (square) for best appearance</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
                <span>Cover photo: 16:9 ratio works best (e.g., 1500×500px)</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
                <span>Use high-quality, well-lit images for professional appearance</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
                <span>Both images will be automatically optimized and cropped</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug Information (visible in development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs text-gray-600">
          <p className="font-medium mb-1">Debug Information:</p>
          <p>Current Avatar: {currentAvatar ? 'Set' : 'Not set'}</p>
          <p>Current Cover: {currentCover ? 'Set' : 'Not set'}</p>
          <p>Uploading: {uploading || 'None'}</p>
          <p>Upload Progress: {uploadProgress}%</p>
        </div>
      )}
    </div>
  );
};

export default AvatarUploader;