// src/components/tenders/TenderAttachmentList.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Download,
  Eye,
  Trash2,
  Loader2,
  Image as ImageIcon,
  File as FileIcon,
  FileJson,
  FileCode,
  FileArchive,
  FileSpreadsheet,
  Presentation,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  MoreVertical,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/social/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import { tenderService, type TenderAttachment } from '@/services/tenderService';
import { useLocalFileUtils, useAttachmentPreview } from '@/hooks/useTenders';

// ============ TYPES ============
export type AttachmentVariant = 'mobile' | 'tablet' | 'desktop';

export interface FileAttachmentsListProps {
  tenderId: string;
  attachments: TenderAttachment[];
  isOwner?: boolean;
  onDelete?: (attachmentId: string) => void;
  className?: string;
  maxHeight?: string;
  showPreview?: boolean;
  allowDownload?: boolean;
  allowDelete?: boolean;
  variant?: AttachmentVariant;
}

// ============ CUSTOM HOOK FOR VARIANT DETECTION ============
const useAttachmentVariant = (): AttachmentVariant => {
  const { breakpoint } = useResponsive();
  const containerRef = useRef<HTMLDivElement>(null);
  const [variant, setVariant] = useState<AttachmentVariant>('desktop');

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width;
      if (width < 400) setVariant('mobile');
      else if (width < 640) setVariant('tablet');
      else setVariant('desktop');
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Fallback to breakpoint if container sizing fails
  useEffect(() => {
    if (breakpoint === 'mobile') setVariant('mobile');
    else if (breakpoint === 'tablet') setVariant('tablet');
  }, [breakpoint]);

  return variant;
};

// ============ FILE ICON MAPPER (THEME AWARE) ============
const getFileIcon = (mimetype: string, fileName: string, size: 'sm' | 'md' | 'lg' = 'md') => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const iconSize = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-8 w-8'
  }[size];

  // Images
  if (mimetype?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
    return <ImageIcon className={cn(iconSize, colorClasses.text.blue)} />;
  }

  // PDF
  if (mimetype === 'application/pdf' || ext === 'pdf') {
    return <FileText className={cn(iconSize, colorClasses.text.red)} />;
  }

  // Word documents
  if (mimetype?.includes('word') || ['doc', 'docx'].includes(ext || '')) {
    return <FileText className={cn(iconSize, colorClasses.text.blue)} />;
  }

  // Excel spreadsheets
  if (mimetype?.includes('excel') || mimetype?.includes('spreadsheet') || ['xls', 'xlsx', 'csv'].includes(ext || '')) {
    return <FileSpreadsheet className={cn(iconSize, colorClasses.text.emerald)} />;
  }

  // PowerPoint presentations
  if (mimetype?.includes('powerpoint') || mimetype?.includes('presentation') || ['ppt', 'pptx'].includes(ext || '')) {
    return <Presentation className={cn(iconSize, colorClasses.text.orange)} />;
  }

  // Text files
  if (mimetype === 'text/plain' || ext === 'txt') {
    return <FileText className={cn(iconSize, colorClasses.text.muted)} />;
  }

  // JSON
  if (mimetype === 'application/json' || ext === 'json') {
    return <FileJson className={cn(iconSize, colorClasses.text.amber)} />;
  }

  // Code files
  if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'py', 'java', 'c', 'cpp'].includes(ext || '')) {
    return <FileCode className={cn(iconSize, colorClasses.text.purple)} />;
  }

  // Archives
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) {
    return <FileArchive className={cn(iconSize, colorClasses.text.amber)} />;
  }

  // Default
  return <FileIcon className={cn(iconSize, colorClasses.text.muted)} />;
};

// ============ FORMAT FILE SIZE ============
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// ============ FORMAT DATE ============
const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  const now = new Date();
  const diffTime = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// ============ FILE PREVIEW MODAL ============
interface FilePreviewModalProps {
  attachment: TenderAttachment;
  isOpen: boolean;
  onClose: () => void;
  tenderId: string;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  attachment,
  isOpen,
  onClose,
  tenderId
}) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getPreviewUrl } = useAttachmentPreview();
  const previewUrl = getPreviewUrl(attachment);

  const isImage = attachment.mimetype?.startsWith('image/');
  const isPdf = attachment.mimetype === 'application/pdf';

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "sm:max-w-4xl p-0 overflow-hidden",
        colorClasses.bg.primary
      )}>
        <DialogHeader className={cn(
          "p-4 border-b flex flex-row items-center justify-between",
          colorClasses.border.gray100
        )}>
          <DialogTitle className={cn("text-lg truncate pr-4", colorClasses.text.primary)}>
            {attachment.originalName}
          </DialogTitle>
          <div className="flex items-center gap-2">
            {isImage && (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleZoomOut}
                        disabled={scale <= 0.5}
                        className="h-8 w-8"
                      >
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Zoom Out</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleZoomIn}
                        disabled={scale >= 3}
                        className="h-8 w-8"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Zoom In</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleRotate}
                        className="h-8 w-8"
                      >
                        <RotateCw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Rotate</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className={cn(
          "relative p-4 min-h-[300px] max-h-[70vh] overflow-auto",
          "flex items-center justify-center",
          colorClasses.bg.secondary
        )}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className={cn("h-8 w-8 animate-spin", colorClasses.text.primary)} />
            </div>
          )}

          {error ? (
            <div className="text-center">
              <AlertTriangle className={cn("h-12 w-12 mx-auto mb-3", colorClasses.text.red)} />
              <p className={cn("text-sm", colorClasses.text.muted)}>{error}</p>
            </div>
          ) : (
            <>
              {isImage && (
                <img
                  src={previewUrl}
                  alt={attachment.originalName}
                  style={{
                    transform: `scale(${scale}) rotate(${rotation}deg)`,
                    transition: 'transform 0.2s ease'
                  }}
                  className="max-w-full max-h-[60vh] object-contain"
                  onLoad={() => setLoading(false)}
                  onError={() => {
                    setLoading(false);
                    setError('Failed to load image');
                  }}
                />
              )}

              {isPdf && (
                <iframe
                  src={`${previewUrl}#toolbar=0`}
                  className="w-full h-[60vh] rounded-lg"
                  title={attachment.originalName}
                  onLoad={() => setLoading(false)}
                  onError={() => {
                    setLoading(false);
                    setError('Failed to load PDF');
                  }}
                />
              )}

              {!isImage && !isPdf && (
                <div className="text-center">
                  {getFileIcon(attachment.mimetype, attachment.originalName, 'lg')}
                  <p className={cn("mt-3 text-sm", colorClasses.text.muted)}>
                    Preview not available for this file type
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ============ MOBILE ATTACHMENT CARD ============
interface MobileAttachmentCardProps {
  attachment: TenderAttachment;
  tenderId: string;
  isOwner?: boolean;
  allowDownload?: boolean;
  allowDelete?: boolean;
  onDelete?: (id: string) => void;
  onPreview?: (attachment: TenderAttachment) => void;
}

const MobileAttachmentCard: React.FC<MobileAttachmentCardProps> = ({
  attachment,
  tenderId,
  isOwner,
  allowDownload,
  allowDelete,
  onDelete,
  onPreview
}) => {
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const { toast } = useToast();
  const { getTouchTargetSize } = useResponsive();
  const { downloadAttachment } = useLocalFileUtils();

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await downloadAttachment(tenderId, attachment._id);
    } catch (error) {
      toast({
        title: 'Download failed',
        description: error instanceof Error ? error.message : 'Failed to download file',
        variant: 'destructive'
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this file?')) return;
    try {
      setDeleting(true);
      await tenderService.deleteAttachment(tenderId, attachment._id);
      onDelete?.(attachment._id);
      toast({
        title: 'File deleted',
        description: attachment.originalName,
        variant: 'success'
      });
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Failed to delete file',
        variant: 'destructive'
      });
    } finally {
      setDeleting(false);
    }
  };

  const canPreview = attachment.mimetype?.startsWith('image/') || attachment.mimetype === 'application/pdf';

  return (
    <div className={cn(
      "p-4 rounded-xl border",
      colorClasses.border.gray100,
      colorClasses.bg.primary,
      "shadow-sm"
    )}>
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg shrink-0", colorClasses.bg.secondary)}>
          {getFileIcon(attachment.mimetype, attachment.originalName, 'lg')}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h4 className={cn("font-medium truncate max-w-[180px]", colorClasses.text.primary)}>
                {attachment.originalName}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn("text-xs", colorClasses.text.muted)}>
                  {formatFileSize(attachment.size)}
                </span>
                <span className={cn("text-xs", colorClasses.text.muted)}>•</span>
                <span className={cn("text-xs", colorClasses.text.muted)}>
                  {formatDate(attachment.uploadedAt)}
                </span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowActions(!showActions)}
              className={cn(getTouchTargetSize('md'), "shrink-0")}
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>

          {attachment.description && (
            <p className={cn("text-sm mt-2 line-clamp-2", colorClasses.text.muted)}>
              {attachment.description}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2 mt-4">
            {allowDownload && (
              <Button
                onClick={handleDownload}
                disabled={downloading}
                className={cn(
                  "w-full",
                  getTouchTargetSize('lg'),
                  colorClasses.bg.blue,
                  colorClasses.text.white
                )}
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Download
              </Button>
            )}

            {canPreview && allowDownload && (
              <Button
                variant="outline"
                onClick={() => onPreview?.(attachment)}
                className={cn(
                  "w-full",
                  getTouchTargetSize('lg'),
                  colorClasses.border.gray100
                )}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            )}

            {allowDelete && isOwner && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
                className={cn(
                  "w-full col-span-2",
                  getTouchTargetSize('lg')
                )}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete File
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============ TABLET ATTACHMENT GRID ============
interface TabletAttachmentCardProps {
  attachment: TenderAttachment;
  tenderId: string;
  isOwner?: boolean;
  allowDownload?: boolean;
  allowDelete?: boolean;
  onDelete?: (id: string) => void;
  onPreview?: (attachment: TenderAttachment) => void;
}

const TabletAttachmentCard: React.FC<TabletAttachmentCardProps> = ({
  attachment,
  tenderId,
  isOwner,
  allowDownload,
  allowDelete,
  onDelete,
  onPreview
}) => {
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();
  const { getTouchTargetSize } = useResponsive();
  const { downloadAttachment } = useLocalFileUtils();

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await downloadAttachment(tenderId, attachment._id);
    } catch (error) {
      toast({
        title: 'Download failed',
        description: error instanceof Error ? error.message : 'Failed to download file',
        variant: 'destructive'
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this file?')) return;
    try {
      setDeleting(true);
      await tenderService.deleteAttachment(tenderId, attachment._id);
      onDelete?.(attachment._id);
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Failed to delete file',
        variant: 'destructive'
      });
    } finally {
      setDeleting(false);
    }
  };

  const canPreview = attachment.mimetype?.startsWith('image/') || attachment.mimetype === 'application/pdf';

  return (
    <div className={cn(
      "group relative p-4 rounded-xl border",
      colorClasses.border.gray100,
      colorClasses.bg.primary,
      "hover:shadow-md transition-all"
    )}>
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", colorClasses.bg.secondary)}>
          {getFileIcon(attachment.mimetype, attachment.originalName, 'md')}
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn("font-medium truncate", colorClasses.text.primary)}>
            {attachment.originalName}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn("text-xs", colorClasses.text.muted)}>
              {formatFileSize(attachment.size)}
            </span>
          </div>
        </div>
      </div>

      {/* Hover actions for tablet */}
      <div className={cn(
        "absolute inset-0 bg-black/50",
        "opacity-0 group-hover:opacity-100 group-active:opacity-100",
        "transition-opacity rounded-xl",
        "flex items-center justify-center gap-2"
      )}>
        {canPreview && (
          <Button
            variant="secondary"
            size="icon"
            onClick={() => onPreview?.(attachment)}
            className={cn(getTouchTargetSize('md'), colorClasses.bg.primary)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}

        {allowDownload && (
          <Button
            variant="secondary"
            size="icon"
            onClick={handleDownload}
            disabled={downloading}
            className={cn(getTouchTargetSize('md'), colorClasses.bg.primary)}
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        )}

        {allowDelete && isOwner && (
          <Button
            variant="destructive"
            size="icon"
            onClick={handleDelete}
            disabled={deleting}
            className={getTouchTargetSize('md')}
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

// ============ DESKTOP ATTACHMENT LIST ============
interface DesktopAttachmentItemProps {
  attachment: TenderAttachment;
  tenderId: string;
  isOwner?: boolean;
  allowDownload?: boolean;
  allowDelete?: boolean;
  showPreview?: boolean;
  onDelete?: (id: string) => void;
  onPreview?: (attachment: TenderAttachment) => void;
}

const DesktopAttachmentItem: React.FC<DesktopAttachmentItemProps> = ({
  attachment,
  tenderId,
  isOwner,
  allowDownload,
  allowDelete,
  showPreview,
  onDelete,
  onPreview
}) => {
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();
  const { downloadAttachment } = useLocalFileUtils();

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await downloadAttachment(tenderId, attachment._id);
    } catch (error) {
      toast({
        title: 'Download failed',
        description: error instanceof Error ? error.message : 'Failed to download file',
        variant: 'destructive'
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this file?')) return;
    try {
      setDeleting(true);
      await tenderService.deleteAttachment(tenderId, attachment._id);
      onDelete?.(attachment._id);
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Failed to delete file',
        variant: 'destructive'
      });
    } finally {
      setDeleting(false);
    }
  };

  const canPreview = showPreview && (attachment.mimetype?.startsWith('image/') || attachment.mimetype === 'application/pdf');

  return (
    <div className={cn(
      "flex items-start gap-4 p-4 rounded-lg border",
      colorClasses.border.gray100,
      colorClasses.bg.primary,
      "hover:bg-opacity-80 transition-colors"
    )}>
      <div className={cn("p-2 rounded-lg shrink-0", colorClasses.bg.secondary)}>
        {getFileIcon(attachment.mimetype, attachment.originalName, 'md')}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={cn("font-medium", colorClasses.text.primary)}>
              {attachment.originalName}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn("text-sm", colorClasses.text.muted)}>
                {formatFileSize(attachment.size)}
              </span>
              <span className={cn("text-sm", colorClasses.text.muted)}>•</span>
              <span className={cn("text-sm", colorClasses.text.muted)}>
                {formatDate(attachment.uploadedAt)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canPreview && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPreview?.(attachment)}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Preview
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Preview file</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {allowDownload && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                      disabled={downloading}
                      className="gap-2"
                    >
                      {downloading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      Download
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download file</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {allowDelete && isOwner && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDelete}
                      disabled={deleting}
                      className={cn("gap-2", colorClasses.text.red)}
                    >
                      {deleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Delete
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete file</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {attachment.description && (
          <p className={cn("text-sm mt-2", colorClasses.text.muted)}>
            {attachment.description}
          </p>
        )}

        {attachment.documentType && attachment.documentType !== 'other' && (
          <Badge variant="outline" className="mt-2">
            {attachment.documentType.split('_').map(word =>
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ')}
          </Badge>
        )}
      </div>
    </div>
  );
};

// ============ MAIN COMPONENT ============
export const FileAttachmentsList: React.FC<FileAttachmentsListProps> = ({
  tenderId,
  attachments,
  isOwner = false,
  onDelete,
  className,
  maxHeight = '400px',
  showPreview = true,
  allowDownload = true,
  allowDelete = false,
  variant: propVariant
}) => {
  const [previewAttachment, setPreviewAttachment] = useState<TenderAttachment | null>(null);
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const { breakpoint } = useResponsive();
  const containerVariant = useAttachmentVariant();
  const variant = propVariant || containerVariant;

  if (attachments.length === 0) {
    return (
      <div className={cn(
        "text-center py-12 border-2 border-dashed rounded-xl",
        colorClasses.border.gray100,
        className
      )}>
        <FileText className={cn("h-12 w-12 mx-auto mb-3", colorClasses.text.muted)} />
        <p className={cn("text-sm", colorClasses.text.muted)}>No attachments yet</p>
      </div>
    );
  }

  // Mobile variant
  if (variant === 'mobile') {
    return (
      <>
        <div className={cn("space-y-3", className)}>
          {attachments.map((attachment) => (
            <MobileAttachmentCard
              key={attachment._id}
              attachment={attachment}
              tenderId={tenderId}
              isOwner={isOwner}
              allowDownload={allowDownload}
              allowDelete={allowDelete}
              onDelete={onDelete}
              onPreview={setPreviewAttachment}
            />
          ))}
        </div>

        {previewAttachment && (
          <FilePreviewModal
            attachment={previewAttachment}
            isOpen={!!previewAttachment}
            onClose={() => setPreviewAttachment(null)}
            tenderId={tenderId}
          />
        )}
      </>
    );
  }

  // Tablet variant
  if (variant === 'tablet') {
    return (
      <>
        <div className={cn(
          "grid grid-cols-2 gap-3",
          className
        )}>
          {attachments.map((attachment) => (
            <TabletAttachmentCard
              key={attachment._id}
              attachment={attachment}
              tenderId={tenderId}
              isOwner={isOwner}
              allowDownload={allowDownload}
              allowDelete={allowDelete}
              onDelete={onDelete}
              onPreview={setPreviewAttachment}
            />
          ))}
        </div>

        {previewAttachment && (
          <FilePreviewModal
            attachment={previewAttachment}
            isOpen={!!previewAttachment}
            onClose={() => setPreviewAttachment(null)}
            tenderId={tenderId}
          />
        )}
      </>
    );
  }

  // Desktop variant
  return (
    <>
      <div
        className={cn("space-y-3 overflow-y-auto pr-2", className)}
        style={{ maxHeight }}
      >
        {attachments.map((attachment) => (
          <DesktopAttachmentItem
            key={attachment._id}
            attachment={attachment}
            tenderId={tenderId}
            isOwner={isOwner}
            allowDownload={allowDownload}
            allowDelete={allowDelete}
            showPreview={showPreview}
            onDelete={onDelete}
            onPreview={setPreviewAttachment}
          />
        ))}
      </div>

      {previewAttachment && (
        <FilePreviewModal
          attachment={previewAttachment}
          isOpen={!!previewAttachment}
          onClose={() => setPreviewAttachment(null)}
          tenderId={tenderId}
        />
      )}
    </>
  );
};

// Export grid variant for backward compatibility
export const FileAttachmentsGrid: React.FC<FileAttachmentsListProps> = (props) => (
  <FileAttachmentsList {...props} variant="tablet" />
);

export default FileAttachmentsList;