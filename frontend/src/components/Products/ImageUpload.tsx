/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Reorder } from "framer-motion";
import { cn } from "@/lib/utils";
import { productToast, productService } from "@/services/productService";
import { colors, getTheme } from "@/utils/color";
import {
  Loader2,
  Upload,
  Image as ImageIcon,
  Star,
  Trash2,
  X,
  Cloud,
  Check,
  AlertCircle,
  Eye,
  GripVertical,
} from "lucide-react";

export interface ExistingImage {
  secure_url: string;
  public_id?: string;
  altText?: string;
  isPrimary?: boolean;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
  uploaded_at?: string | Date;
}

export interface UploadedFile {
  file: File;
  preview: string;
  id: string;
  altText: string;
  isPrimary: boolean;
  order: number;
  error?: string;
}

interface ImageUploaderProps {
  // Form state
  existingImages: ExistingImage[];
  imagesToDelete: string[];
  primaryImageIndex: number;

  // Form state handlers
  onExistingImagesChange: (images: ExistingImage[]) => void;
  onImagesToDeleteChange: (publicIds: string[]) => void;
  onPrimaryImageIndexChange: (index: number) => void;

  // New images
  newImages: File[];
  onNewImagesChange: (files: File[]) => void;

  // UI props
  maxImages?: number;
  multiple?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  theme?: 'light' | 'dark';
  label?: string;
  description?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  // Form state
  existingImages = [],
  imagesToDelete = [],
  primaryImageIndex = 0,

  // Form state handlers
  onExistingImagesChange,
  onImagesToDeleteChange,
  onPrimaryImageIndexChange,

  // New images
  newImages = [],
  onNewImagesChange,

  // UI props
  maxImages = 5,
  multiple = true,
  disabled = false,
  required = true,
  className,
  theme = 'light',
  label = "Product Images",
  description = "Upload high-quality product images",
}) => {
  const currentTheme = getTheme(theme);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState<string | null>(null);

  // Initialize uploadedFiles from newImages prop
  useEffect(() => {
    const files = newImages.map((file, index) => {
      const preview = URL.createObjectURL(file);
      const isPrimary = existingImages.length === 0 && uploadedFiles.length === 0 && index === 0;

      return {
        file,
        preview,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        altText: `Product image ${existingImages.length + index + 1}`,
        isPrimary,
        order: existingImages.length + index,
      };
    });

    setUploadedFiles(files);
  }, [newImages, existingImages.length]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      uploadedFiles.forEach(file => {
        URL.revokeObjectURL(file.preview);
      });
    };
  }, [uploadedFiles]);

  // Validate files
  const validateFiles = (files: File[]): { valid: File[]; errors: string[] } => {
    const errors: string[] = [];
    const validFiles: File[] = [];

    // Check total image count
    const totalImages = existingImages.length + uploadedFiles.length + files.length - imagesToDelete.length;
    if (totalImages > maxImages) {
      errors.push(`Maximum ${maxImages} images allowed. You have ${existingImages.length - imagesToDelete.length} existing and ${uploadedFiles.length} new images.`);
      return { valid: [], errors };
    }

    files.forEach(file => {
      // Check file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        errors.push(`"${file.name}" must be JPEG, PNG, WEBP, or GIF`);
        return;
      }

      // Check file size (20MB)
      const maxSize = 20 * 1024 * 1024;
      if (file.size > maxSize) {
        errors.push(`"${file.name}" must be less than 20MB`);
        return;
      }

      // Check if file is empty
      if (file.size === 0) {
        errors.push(`"${file.name}" is empty`);
        return;
      }

      validFiles.push(file);
    });

    return { valid: validFiles, errors };
  };

  // Handle file selection
  const handleFilesSelected = useCallback((files: File[]) => {
    if (disabled) return;
    setError(null);

    const { valid, errors } = validateFiles(files);

    if (errors.length > 0) {
      const errorMsg = errors.slice(0, 3).join(', ');
      setError(errorMsg);
      productToast.error(errorMsg);
      return;
    }

    if (valid.length === 0) return;

    // Create new uploaded file objects
    const newUploadedFiles: UploadedFile[] = valid.map((file, index) => {
      const preview = URL.createObjectURL(file);
      const isPrimary = existingImages.length === 0 && uploadedFiles.length === 0 && newImages.length === 0 && index === 0;

      return {
        file,
        preview,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        altText: `Product image ${existingImages.length + newImages.length + index + 1}`,
        isPrimary,
        order: existingImages.length + newImages.length + index,
      };
    });

    const updatedFiles = [...uploadedFiles, ...newUploadedFiles];

    // Ensure only one primary image exists
    const hasPrimary = updatedFiles.some(file => file.isPrimary) || existingImages.some(img => img.isPrimary);
    if (!hasPrimary && updatedFiles.length > 0) {
      updatedFiles[0].isPrimary = true;
    }

    setUploadedFiles(updatedFiles);

    // Update newImages prop through parent
    const allRawFiles = updatedFiles.map(uf => uf.file);
    onNewImagesChange(allRawFiles);

    if (valid.length > 0) {
      productToast.success(`${valid.length} image(s) added successfully`);
    }
  }, [disabled, existingImages, uploadedFiles, newImages, maxImages, onNewImagesChange]);

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFilesSelected,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    onDropAccepted: () => setIsDragging(false),
    maxSize: 20 * 1024 * 1024, // 20MB
    maxFiles: multiple ? maxImages - (existingImages.length + newImages.length - imagesToDelete.length) : 1,
    disabled: disabled || isLoading,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif']
    },
    multiple,
  });

  // Remove uploaded file
  const removeUploadedFile = (id: string) => {
    const fileToRemove = uploadedFiles.find(file => file.id === id);
    if (!fileToRemove) return;

    // Clean up object URL
    URL.revokeObjectURL(fileToRemove.preview);

    const updatedFiles = uploadedFiles.filter(file => file.id !== id);

    // If we removed the primary image and there are other images, make the first one primary
    if (fileToRemove.isPrimary && updatedFiles.length > 0) {
      updatedFiles[0].isPrimary = true;
    }

    setUploadedFiles(updatedFiles);

    // Update newImages prop through parent
    const rawFiles = updatedFiles.map(uf => uf.file);
    onNewImagesChange(rawFiles);

    productToast.info('Image removed');
  };

  // Handle image order change
  const handleImageOrderChange = (reorderedFiles: UploadedFile[]) => {
    const orderedWithPrimary = reorderedFiles.map((file, index) => ({
      ...file,
      isPrimary: index === 0, // First image is always primary
      order: index
    }));

    setUploadedFiles(orderedWithPrimary);

    // Update newImages prop through parent
    const rawFiles = orderedWithPrimary.map(uf => uf.file);
    onNewImagesChange(rawFiles);

    // Update primary image index if it changed
    if (orderedWithPrimary[0]?.id !== reorderedFiles[0]?.id) {
      onPrimaryImageIndexChange(0);
    }

    productToast.info('Image order updated');
  };

  // Mark existing image for deletion
  const markImageForDeletion = (publicId: string) => {
    if (!publicId) return;

    // Show confirmation for existing images
    setIsConfirmingDelete(publicId);
  };

  // Confirm deletion
  const confirmDelete = (publicId: string) => {
    if (!publicId) return;

    // Add to imagesToDelete
    const updatedDeleteList = [...imagesToDelete, publicId];
    onImagesToDeleteChange(updatedDeleteList);

    // Update existing images (remove isPrimary flag if deleted)
    const updatedExistingImages = existingImages.map(img =>
      img.public_id === publicId
        ? { ...img, isPrimary: false }
        : img
    );

    // If we're deleting the primary image, set a new primary
    const deletedImage = existingImages.find(img => img.public_id === publicId);
    if (deletedImage?.isPrimary) {
      // Try to find another existing image that's not being deleted
      const newPrimaryImage = updatedExistingImages
        .filter(img => !updatedDeleteList.includes(img.public_id!))
        .find((_, index) => index === 0);

      if (newPrimaryImage) {
        const finalImages = updatedExistingImages.map(img =>
          img.public_id === newPrimaryImage.public_id
            ? { ...img, isPrimary: true }
            : img
        );
        onExistingImagesChange(finalImages);
        onPrimaryImageIndexChange(0);
      } else if (uploadedFiles.length > 0) {
        // No existing images left, set first uploaded file as primary
        const updatedFiles = uploadedFiles.map((file, index) => ({
          ...file,
          isPrimary: index === 0
        }));
        setUploadedFiles(updatedFiles);
      }
    } else {
      onExistingImagesChange(updatedExistingImages);
    }

    setIsConfirmingDelete(null);
    productToast.info('Image marked for deletion');
  };

  // Cancel deletion
  const cancelDelete = () => {
    setIsConfirmingDelete(null);
  };

  // Set image as primary
  const setImageAsPrimary = (type: 'existing' | 'uploaded', id: string, index?: number) => {
    if (type === 'uploaded') {
      // Update uploaded files
      const updatedFiles = uploadedFiles.map(file => ({
        ...file,
        isPrimary: file.id === id
      }));
      setUploadedFiles(updatedFiles);

      // Update primary image index
      const fileIndex = uploadedFiles.findIndex(file => file.id === id);
      if (fileIndex !== -1) {
        onPrimaryImageIndexChange(existingImages.length + fileIndex);
      }

      // Clear primary flag from existing images
      const updatedExistingImages = existingImages.map(img => ({
        ...img,
        isPrimary: false
      }));
      onExistingImagesChange(updatedExistingImages);

      productToast.info('Primary image set');
    } else if (type === 'existing' && index !== undefined) {
      // Update existing images
      const updatedExistingImages = existingImages.map((img, idx) => ({
        ...img,
        isPrimary: idx === index
      }));
      onExistingImagesChange(updatedExistingImages);

      // Update primary image index
      onPrimaryImageIndexChange(index);

      // Clear primary flag from uploaded files
      const updatedFiles = uploadedFiles.map(file => ({
        ...file,
        isPrimary: false
      }));
      setUploadedFiles(updatedFiles);

      productToast.info('Primary image set');
    }
  };

  // Update alt text for uploaded files
  const updateAltText = (type: 'existing' | 'uploaded', id: string, altText: string) => {
    if (type === 'uploaded') {
      setUploadedFiles(prev => prev.map(file =>
        file.id === id ? { ...file, altText } : file
      ));
    }
  };

  // Get optimized image URL
  const getOptimizedUrl = (url: string, options?: any) => {
    if (url.includes('cloudinary.com')) {
      return productService.getImageUrl(url, options);
    }
    return url;
  };

  // Get thumbnail URL
  const getThumbnailUrl = (url: string) => {
    return getOptimizedUrl(url, { width: 200, height: 200, crop: 'fill', quality: 'auto' });
  };

  // Handle manual file input click
  const handleManualUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Calculate remaining slots
  const remainingSlots = maxImages - (existingImages.length + newImages.length - imagesToDelete.length);
  const hasImages = existingImages.length > 0 || newImages.length > 0;
  const totalImages = existingImages.length + newImages.length - imagesToDelete.length;
  const hasPrimary = uploadedFiles.some(f => f.isPrimary) || existingImages.some(img => img.isPrimary);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-lg" style={{ color: currentTheme.text.primary }}>
              {label}
            </h3>
            {description && (
              <p className="text-sm mt-1" style={{ color: currentTheme.text.secondary }}>
                {description}
              </p>
            )}
          </div>

          {hasImages && (
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: currentTheme.text.secondary }}>
                {totalImages}/{maxImages} images
              </span>
              {!hasPrimary && totalImages > 0 && (
                <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                  Set primary image
                </span>
              )}
            </div>
          )}
        </div>

        {required && totalImages === 0 && (
          <div className="flex items-center gap-2 text-sm" style={{ color: currentTheme.text.error }}>
            <AlertCircle className="h-4 w-4" />
            <span>At least one image is required</span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="p-4 rounded-lg border flex items-start gap-3"
          style={{
            backgroundColor: `${currentTheme.bg.orange}10`,
            borderColor: currentTheme.border.orange
          }}
        >
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: currentTheme.text.error }} />
          <div className="space-y-1">
            <p className="font-medium text-sm" style={{ color: currentTheme.text.error }}>
              Upload Error
            </p>
            <p className="text-sm" style={{ color: currentTheme.text.error }}>
              {error}
            </p>
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-auto"
            style={{ color: currentTheme.text.error }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Upload Dropzone */}
      {(!multiple || remainingSlots > 0) && (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-xl p-8",
            "flex flex-col items-center justify-center text-center",
            "transition-all duration-200 cursor-pointer",
            "hover:border-goldenMustard hover:bg-goldenMustard/5",
            (disabled || isLoading) && "opacity-50 cursor-not-allowed",
            isDragActive && "border-goldenMustard bg-goldenMustard/10",
            isDragging && "border-solid"
          )}
          style={{
            backgroundColor: currentTheme.bg.gray100,
            borderColor: isDragActive || isDragging ? colors.goldenMustard : currentTheme.border.gray400
          }}
        >
          <input {...getInputProps()} ref={fileInputRef} />

          {isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 animate-spin" style={{ color: colors.goldenMustard }} />
              <p style={{ color: currentTheme.text.secondary }}>Processing images...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3">
                <div
                  className="p-4 rounded-full"
                  style={{ backgroundColor: `${colors.goldenMustard}20` }}
                >
                  <Upload className="w-8 h-8" style={{ color: colors.goldenMustard }} />
                </div>
                <div className="space-y-2">
                  <h4
                    className="font-semibold text-lg"
                    style={{ color: currentTheme.text.primary }}
                  >
                    {isDragActive ? "Drop images here…" : "Drag & drop images here"}
                  </h4>
                  <p
                    className="text-sm"
                    style={{ color: currentTheme.text.secondary }}
                  >
                    or{" "}
                    <button
                      type="button"
                      onClick={handleManualUpload}
                      className="font-medium hover:underline focus:outline-none focus:underline"
                      style={{ color: colors.goldenMustard }}
                    >
                      click to browse
                    </button>
                  </p>
                </div>
              </div>

              <div
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-left max-w-md mx-auto"
                style={{ color: currentTheme.text.secondary }}
              >
                <div className="space-y-1">
                  <p className="font-medium">Requirements:</p>
                  <ul className="space-y-0.5">
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3" style={{ color: colors.green }} />
                      <span>JPEG, PNG, WEBP, GIF</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3" style={{ color: colors.green }} />
                      <span>Max 20MB per image</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3" style={{ color: colors.green }} />
                      <span>{remainingSlots} image{remainingSlots !== 1 ? 's' : ''} remaining</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Tips:</p>
                  <ul className="space-y-0.5">
                    <li>• First image is primary by default</li>
                    <li>• Use high-quality images</li>
                    <li>• Square images work best</li>
                    <li>• Show product from multiple angles</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Images Grid */}
      {hasImages && (
        <div className="space-y-4">
          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <Cloud className="h-4 w-4" style={{ color: currentTheme.text.blue }} />
                  <span style={{ color: currentTheme.text.primary }}>
                    Existing Images ({existingImages.length - imagesToDelete.length})
                  </span>
                </h4>
                <span className="text-xs" style={{ color: currentTheme.text.secondary }}>
                  Stored in Cloudinary
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {existingImages.map((image, index) => {
                  const isMarkedForDeletion = imagesToDelete.includes(image.public_id!);
                  if (isMarkedForDeletion) return null;

                  return (
                    <div
                      key={image.public_id || `existing-${index}`}
                      className={cn(
                        "group relative rounded-lg overflow-hidden border shadow-sm",
                        image.isPrimary && "ring-2 ring-offset-2 ring-goldenMustard",
                        isConfirmingDelete === image.public_id && "ring-2 ring-red-500"
                      )}
                      style={{
                        backgroundColor: currentTheme.bg.white,
                        borderColor: image.isPrimary ? colors.goldenMustard : currentTheme.border.gray400,
                      }}
                    >
                      {/* Image */}
                      <div className="aspect-square overflow-hidden">
                        <img
                          src={getThumbnailUrl(image.secure_url)}
                          alt={image.altText || `Product image ${index + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/product-placeholder.jpg';
                          }}
                        />

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col gap-2 justify-center items-center p-3">
                          <button
                            type="button"
                            onClick={() => window.open(image.secure_url, '_blank')}
                            className="flex items-center gap-2 bg-white/20 text-white px-3 py-2 text-xs rounded-lg hover:bg-white/30 transition w-full max-w-[140px] justify-center"
                          >
                            <Eye className="h-3 w-3" /> View Full
                          </button>

                          {!image.isPrimary && (
                            <button
                              type="button"
                              onClick={() => setImageAsPrimary('existing', image.public_id!, index)}
                              className="flex items-center gap-2 bg-white/20 text-white px-3 py-2 text-xs rounded-lg hover:bg-white/30 transition w-full max-w-[140px] justify-center"
                            >
                              <Star className="h-3 w-3" /> Set Primary
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => markImageForDeletion(image.public_id!)}
                            className="flex items-center gap-2 bg-red-500/80 text-white px-3 py-2 text-xs rounded-lg hover:bg-red-600 transition w-full max-w-[140px] justify-center"
                          >
                            <Trash2 className="h-3 w-3" /> Delete
                          </button>
                        </div>

                        {/* Primary Badge */}
                        {image.isPrimary && (
                          <div
                            className="absolute top-2 left-2 px-2 py-1 text-xs rounded-lg shadow flex items-center gap-1"
                            style={{
                              backgroundColor: colors.goldenMustard,
                              color: colors.white
                            }}
                          >
                            <Star className="h-3 w-3 fill-current" /> Primary
                          </div>
                        )}

                        {/* Cloudinary Badge */}
                        <div className="absolute top-2 right-2 bg-blue-500/90 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Cloud className="h-2 w-2" /> Cloud
                        </div>
                      </div>

                      {/* Image Info */}
                      <div className="p-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs truncate" style={{ color: currentTheme.text.secondary }}>
                            {image.altText?.substring(0, 20) || `Image ${index + 1}`}
                          </span>
                          {image.isPrimary && (
                            <button
                              type="button"
                              className="text-xs px-2 py-1 rounded bg-goldenMustard/10 text-goldenMustard"
                            >
                              Primary
                            </button>
                          )}
                        </div>

                        {/* Delete Confirmation */}
                        {isConfirmingDelete === image.public_id && (
                          <div className="absolute inset-0 bg-black/80 flex flex-col gap-2 justify-center items-center p-3 z-10">
                            <p className="text-sm text-white text-center">Delete this image?</p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => confirmDelete(image.public_id!)}
                                className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition"
                              >
                                Delete
                              </button>
                              <button
                                type="button"
                                onClick={cancelDelete}
                                className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* New Images */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <Upload className="h-4 w-4" style={{ color: colors.green }} />
                  <span style={{ color: currentTheme.text.primary }}>
                    New Images ({uploadedFiles.length})
                  </span>
                </h4>
                <span className="text-xs" style={{ color: currentTheme.text.secondary }}>
                  Will be uploaded with product
                </span>
              </div>

              <Reorder.Group
                values={uploadedFiles}
                onReorder={handleImageOrderChange}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
              >
                {uploadedFiles.map((file, index) => (
                  <Reorder.Item
                    key={file.id}
                    value={file}
                    className={cn(
                      "group relative rounded-lg overflow-hidden border shadow-sm cursor-move",
                      file.isPrimary && "ring-2 ring-offset-2 ring-goldenMustard"
                    )}
                    style={{
                      backgroundColor: currentTheme.bg.white,
                      borderColor: file.isPrimary ? colors.goldenMustard : currentTheme.border.gray400,
                    }}
                  >
                    {/* Drag Handle */}
                    <div className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing">
                      <GripVertical className="h-4 w-4" style={{ color: currentTheme.text.secondary }} />
                    </div>

                    {/* Image */}
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={file.preview}
                        alt={file.altText}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col gap-2 justify-center items-center p-3">
                        {!file.isPrimary && (
                          <button
                            type="button"
                            onClick={() => setImageAsPrimary('uploaded', file.id)}
                            className="flex items-center gap-2 bg-white/20 text-white px-3 py-2 text-xs rounded-lg hover:bg-white/30 transition w-full max-w-[140px] justify-center"
                          >
                            <Star className="h-3 w-3" /> Set Primary
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => removeUploadedFile(file.id)}
                          className="flex items-center gap-2 bg-red-500/80 text-white px-3 py-2 text-xs rounded-lg hover:bg-red-600 transition w-full max-w-[140px] justify-center"
                        >
                          <Trash2 className="h-3 w-3" /> Remove
                        </button>
                      </div>

                      {/* Primary Badge */}
                      {file.isPrimary && (
                        <div
                          className="absolute top-2 right-2 px-2 py-1 text-xs rounded-lg shadow flex items-center gap-1"
                          style={{
                            backgroundColor: colors.goldenMustard,
                            color: colors.white
                          }}
                        >
                          <Star className="h-3 w-3 fill-current" /> Primary
                        </div>
                      )}

                      {/* Order Badge */}
                      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                        {index + 1}
                      </div>

                      {/* New Badge */}
                      <div className="absolute bottom-2 left-2 bg-green-500/90 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Upload className="h-2 w-2" /> New
                      </div>
                    </div>

                    {/* Image Info */}
                    <div className="p-2 space-y-2">
                      <input
                        type="text"
                        value={file.altText}
                        onChange={(e) => updateAltText('uploaded', file.id, e.target.value)}
                        placeholder="Add description..."
                        className="w-full text-xs bg-transparent outline-none border rounded px-2 py-1.5 focus:ring-2 focus:ring-goldenMustard/50"
                        style={{
                          backgroundColor: currentTheme.bg.gray100,
                          borderColor: currentTheme.border.gray400,
                          color: currentTheme.text.primary,
                        }}
                        maxLength={100}
                      />

                      <div className="flex items-center justify-between text-[10px]">
                        <span style={{ color: currentTheme.text.secondary }}>
                          {productService.formatFileSize(file.file.size)}
                        </span>
                        <span style={{ color: currentTheme.text.secondary }}>
                          {file.file.type.split('/')[1].toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>

              {/* Reorder Instructions */}
              {uploadedFiles.length > 1 && (
                <div className="flex items-center gap-2 text-xs" style={{ color: currentTheme.text.secondary }}>
                  <GripVertical className="h-3 w-3" />
                  <span>Drag to reorder • First image will be primary</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {hasImages && (
        <div
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: currentTheme.bg.gray100,
            borderColor: currentTheme.border.gray400
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium" style={{ color: currentTheme.text.primary }}>
                Summary
              </p>
              <p className="text-sm" style={{ color: currentTheme.text.secondary }}>
                {totalImages} image{totalImages !== 1 ? 's' : ''} selected
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium" style={{ color: currentTheme.text.primary }}>
                Existing Images
              </p>
              <p className="text-sm flex items-center gap-1" style={{ color: currentTheme.text.secondary }}>
                <Cloud className="h-3 w-3" />
                {existingImages.length - imagesToDelete.length} in Cloudinary
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium" style={{ color: currentTheme.text.primary }}>
                New Images
              </p>
              <p className="text-sm flex items-center gap-1" style={{ color: colors.green }}>
                <Upload className="h-3 w-3" />
                {uploadedFiles.length} to upload
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {required && totalImages === 0 && !isLoading && (
        <div
          className="p-4 rounded-lg border flex items-start gap-3"
          style={{
            backgroundColor: `${currentTheme.bg.orange}10`,
            borderColor: currentTheme.border.orange
          }}
        >
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: currentTheme.text.error }} />
          <div className="space-y-1">
            <p className="font-medium text-sm" style={{ color: currentTheme.text.error }}>
              Images Required
            </p>
            <p className="text-sm" style={{ color: currentTheme.text.error }}>
              Please upload at least one product image
            </p>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!hasImages && !isLoading && (
        <div
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: currentTheme.bg.gray100,
            borderColor: currentTheme.border.gray400
          }}
        >
          <div className="flex items-start gap-3">
            <ImageIcon className="h-5 w-5 mt-0.5" style={{ color: currentTheme.text.gold }} />
            <div className="space-y-2">
              <h4 className="text-sm font-medium" style={{ color: currentTheme.text.gold }}>
                Best Practices
              </h4>
              <ul className="text-xs space-y-1" style={{ color: currentTheme.text.gold }}>
                <li>• Upload high-quality images (minimum 800x800px)</li>
                <li>• Use natural lighting for better clarity</li>
                <li>• Show product from multiple angles</li>
                <li>• Include close-ups of important details</li>
                <li>• Use a clean, uncluttered background</li>
                <li>• Square images work best for thumbnails</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};