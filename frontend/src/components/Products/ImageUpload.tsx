/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, Reorder } from "framer-motion";
import { cn } from "@/lib/utils";
import { productToast } from "@/services/productService";
import {
  Loader2,
  Upload,
  Image as ImageIcon,
  Star,
  Trash2,
} from "lucide-react";

export interface UploadedImage {
  url: string;
  altText: string;
  isPrimary: boolean;
  order: number;
  _id?: string;
  id?: string;
  file?: File;
}

interface ImageUploadProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  maxSize?: number;
  accept?: string;
  disabled?: boolean;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onImagesChange,
  maxImages = 12,
  maxSize = 15 * 1024 * 1024,
  accept = "image/jpeg,image/jpg,image/png,image/webp,image/gif,image/svg+xml",
  disabled = false,
  className,
}) => {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (disabled) return;

      if (rejectedFiles.length > 0) {
        const errors = rejectedFiles.flatMap(({ errors }) =>
          errors.map((error: any) => {
            if (error.code === "file-too-large") {
              return `File must be less than ${maxSize / 1024 / 1024}MB`;
            }
            if (error.code === "file-invalid-type") {
              return "Invalid image type";
            }
            return error.message;
          })
        );

        errors.forEach((msg: string) => productToast.error(msg));
        return;
      }

      if (images.length + acceptedFiles.length > maxImages) {
        productToast.error(`Maximum ${maxImages} images allowed`);
        return;
      }

      setUploading(true);
      try {
        const newImgs: UploadedImage[] = acceptedFiles.map((file, i) => ({
          url: URL.createObjectURL(file),
          altText: file.name.split(".")[0] || "Product image",
          isPrimary: images.length === 0 && i === 0,
          order: images.length + i,
          file,
        }));

        onImagesChange([...images, ...newImgs]);
      } catch {
        productToast.error("Failed to process images");
      } finally {
        setUploading(false);
      }
    },
    [images, maxImages, maxSize, disabled, onImagesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize,
    maxFiles: maxImages - images.length,
    disabled: disabled || uploading,
  });

  // Remove image
  const removeImage = (index: number) => {
    const list = images.filter((_, i) => i !== index);
    const updated = list.map((img, i) => ({
      ...img,
      order: i,
      isPrimary: i === 0,
    }));
    onImagesChange(updated);
  };

  // Set image as primary
  const setPrimary = (index: number) => {
    const updated = images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    // reorder so primary becomes 0
    const primary = updated[index];
    const reordered = [primary, ...updated.filter((_, i) => i !== index)];
    onImagesChange(
      reordered.map((img, i) => ({
        ...img,
        order: i,
        isPrimary: i === 0,
      }))
    );
  };

  // Alt text update
  const updateAlt = (i: number, val: string) => {
    onImagesChange(
      images.map((img, idx) => (idx === i ? { ...img, altText: val } : img))
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-200 bg-muted/30",
          "hover:border-primary/70 hover:bg-primary/5",
          isDragActive && "border-primary bg-primary/10",
          disabled && "opacity-50 cursor-not-allowed",
          "cursor-pointer"
        )}
      >
        <input {...getInputProps()} />

        {uploading ? (
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        ) : (
          <Upload className="w-10 h-10 text-muted-foreground" />
        )}

        <h4 className="font-semibold text-sm mt-3">
          {isDragActive ? "Drop images here…" : "Click to upload images"}
        </h4>
        <p className="text-xs text-muted-foreground">
          Drag & drop or browse • {maxImages - images.length} remaining
        </p>
      </div>

      {/* Images Grid */}
      {images.length > 0 ? (
        <Reorder.Group
        //   axis="xy"
          values={images}
          onReorder={(newOrder: UploadedImage[]) =>
            onImagesChange(
              newOrder.map((img, i) => ({
                ...img,
                order: i,
                isPrimary: i === 0 ? true : img.isPrimary,
              }))
            )
          }
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
        >
          {images.map((img, index) => (
            <Reorder.Item
              value={img}
              key={img.order}
              className="relative group rounded-xl overflow-hidden shadow-sm bg-card"
            >
              {/* Image */}
              <motion.div
                layout
                className="relative aspect-square bg-muted overflow-hidden"
              >
                <img
                  src={img.url}
                  alt={img.altText}
                  className="object-cover h-full w-full"
                />

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col gap-2 justify-center items-center p-3 transition-opacity">
                  {!img.isPrimary && (
                    <button
                      onClick={() => setPrimary(index)}
                      className="flex items-center gap-1 bg-white/20 text-white px-3 py-1 text-xs rounded-lg hover:bg-white/30 transition"
                    >
                      <Star className="w-4 h-4" /> Set Primary
                    </button>
                  )}

                  <button
                    onClick={() => removeImage(index)}
                    className="flex items-center gap-1 bg-red-500/60 text-white px-3 py-1 text-xs rounded-lg hover:bg-red-500 transition"
                  >
                    <Trash2 className="w-4 h-4" /> Remove
                  </button>
                </div>

                {/* Primary Badge */}
                {img.isPrimary && (
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 text-xs rounded-lg shadow">
                    Primary
                  </div>
                )}
              </motion.div>

              {/* Alt Input */}
              <div className="p-2 border-t bg-muted/20">
                <input
                  className="w-full text-xs bg-transparent outline-none border rounded px-2 py-1 focus:ring-2 focus:ring-primary/40"
                  value={img.altText}
                  onChange={(e) => updateAlt(index, e.target.value)}
                  placeholder="Alt text"
                />
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          No product images uploaded yet.
        </p>
      )}
    </div>
  );
};
