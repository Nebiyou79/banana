/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @typescript-eslint/no-explicit-any */
// components/tender/TenderAttachmentList.tsx
import React, { useState, useEffect } from 'react';
import {
  Download,
  Eye,
  FileText,
  File,
  Image,
  FileSpreadsheet,
  Presentation,
  Film,
  Music,
  Code,
  FileCode,
  FileArchive,
  X,
  Search,
  SortAsc,
  Info,
  Shield,
  Lock,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  ExternalLink,
  Loader2,
  Upload,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/social/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Separator } from '@/components/ui/Separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/social/ui/Alert-Dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/Progress';
import {
  Tender,
  TenderAttachment,
  formatFileSize,
  tenderService
} from '@/services/tenderService';
import {
  useDownloadAttachment,
  useDeleteAttachment,
  useUploadAttachments,
  useAttachmentPreview
} from '@/hooks/useTenders';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TenderAttachmentListProps {
  tender: Tender;
  canDownload: boolean;
  canDelete?: boolean;
  canUpload?: boolean;
  showPreview?: boolean;
  showSecurity?: boolean;
  maxHeight?: string;
  className?: string;
  onAttachmentsChange?: () => void;
}

type FileCategory = 'all' | 'documents' | 'images' | 'spreadsheets' | 'presentations' | 'archives' | 'other';

export const TenderAttachmentList: React.FC<TenderAttachmentListProps> = ({
  tender,
  canDownload,
  canDelete = false,
  canUpload = false,
  showPreview = false,
  showSecurity = true,
  maxHeight = '500px',
  className = '',
  onAttachmentsChange
}) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FileCategory>('all');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [previewAttachment, setPreviewAttachment] = useState<TenderAttachment | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<TenderAttachment | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Use the hooks
  const downloadMutation = useDownloadAttachment();
  const deleteMutation = useDeleteAttachment();
  const uploadMutation = useUploadAttachments();
  const previewMutation = useAttachmentPreview();

  // Load preview URL when preview attachment changes
  useEffect(() => {
    if (previewAttachment) {
      loadPreviewUrl();
    } else {
      setPreviewUrl(null);
      setPreviewLoading(false);
    }
  }, [previewAttachment]);

  const loadPreviewUrl = async () => {
    if (!previewAttachment) return;

    setPreviewLoading(true);
    try {
      const url = await previewMutation.mutateAsync({
        tenderId: tender._id,
        attachmentId: previewAttachment._id
      });
      setPreviewUrl(url);
    } catch (error) {
      console.error('Failed to load preview:', error);
      setPreviewUrl(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Get file icon based on type
  const getFileIcon = (fileType: string, documentType?: string) => {
    if (fileType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500 dark:text-red-400" />;
    if (fileType.includes('image')) return <Image className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />;
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return <FileSpreadsheet className="w-5 h-5 text-green-500 dark:text-green-400" />;
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return <Presentation className="w-5 h-5 text-orange-500 dark:text-orange-400" />;
    if (fileType.includes('word') || fileType.includes('document')) return <FileText className="w-5 h-5 text-blue-500 dark:text-blue-400" />;
    if (fileType.includes('zip') || fileType.includes('archive') || fileType.includes('rar')) return <FileArchive className="w-5 h-5 text-purple-500 dark:text-purple-400" />;
    if (fileType.includes('video')) return <Film className="w-5 h-5 text-pink-500 dark:text-pink-400" />;
    if (fileType.includes('audio')) return <Music className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />;
    if (fileType.includes('text') || fileType.includes('code')) return <Code className="w-5 h-5 text-amber-500 dark:text-amber-400" />;

    // Check document type
    if (documentType) {
      switch (documentType) {
        case 'technical_specifications': return <FileCode className="w-5 h-5 text-blue-500 dark:text-blue-400" />;
        case 'drawings': return <Image className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />;
        case 'bill_of_quantities': return <FileSpreadsheet className="w-5 h-5 text-green-500 dark:text-green-400" />;
        case 'reference_designs': return <Presentation className="w-5 h-5 text-orange-500 dark:text-orange-400" />;
        case 'brand_guidelines': return <FileText className="w-5 h-5 text-purple-500 dark:text-purple-400" />;
        case 'nda': return <Lock className="w-5 h-5 text-red-500 dark:text-red-400" />;
        case 'terms_of_reference': return <FileText className="w-5 h-5 text-amber-500 dark:text-amber-400" />;
        case 'statement_of_work': return <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
        case 'compliance_template': return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
        case 'sample_data': return <FileCode className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />;
        case 'wireframes': return <FileCode className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />;
        default: return <File className="w-5 h-5 text-slate-500 dark:text-slate-400" />;
      }
    }

    return <File className="w-5 h-5 text-slate-500 dark:text-slate-400" />;
  };

  // Get document type label
  const getDocumentTypeLabel = (documentType?: string) => {
    if (!documentType) return 'Document';

    const labels: Record<string, string> = {
      'terms_of_reference': 'Terms of Reference',
      'technical_specifications': 'Technical Specifications',
      'statement_of_work': 'Statement of Work',
      'drawings': 'Drawings & Schematics',
      'bill_of_quantities': 'Bill of Quantities',
      'compliance_template': 'Compliance Template',
      'reference_designs': 'Reference Designs',
      'nda': 'Non-Disclosure Agreement',
      'design_references': 'Design References',
      'sample_data': 'Sample Data',
      'brand_guidelines': 'Brand Guidelines',
      'wireframes': 'Wireframes',
      'other': 'Other Document'
    };

    return labels[documentType] || documentType.replace('_', ' ');
  };

  // Get file category
  const getFileCategory = (fileType: string, documentType?: string): FileCategory => {
    if (fileType.includes('pdf') || fileType.includes('word') || fileType.includes('document') || fileType.includes('text')) {
      return 'documents';
    }
    if (fileType.includes('image')) return 'images';
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return 'spreadsheets';
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return 'presentations';
    if (fileType.includes('zip') || fileType.includes('archive') || fileType.includes('rar')) return 'archives';
    return 'other';
  };

  // Filter and sort attachments
  const filteredAttachments = React.useMemo(() => {
    let filtered = [...tender.attachments];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(attachment =>
        attachment.originalName.toLowerCase().includes(query) ||
        attachment.description?.toLowerCase().includes(query) ||
        attachment.documentType?.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(attachment =>
        getFileCategory(attachment.fileType, attachment.documentType) === selectedCategory
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.originalName.localeCompare(b.originalName);
          break;
        case 'size':
          comparison = a.fileSize - b.fileSize;
          break;
        case 'date':
          comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [tender.attachments, searchQuery, selectedCategory, sortBy, sortOrder]);

  // Get file statistics
  const fileStats = React.useMemo(() => {
    const stats = {
      totalFiles: tender.attachments.length,
      totalSize: tender.attachments.reduce((sum, file) => sum + file.fileSize, 0),
      byCategory: {
        documents: tender.attachments.filter(f => getFileCategory(f.fileType, f.documentType) === 'documents').length,
        images: tender.attachments.filter(f => getFileCategory(f.fileType, f.documentType) === 'images').length,
        spreadsheets: tender.attachments.filter(f => getFileCategory(f.fileType, f.documentType) === 'spreadsheets').length,
        presentations: tender.attachments.filter(f => getFileCategory(f.fileType, f.documentType) === 'presentations').length,
        archives: tender.attachments.filter(f => getFileCategory(f.fileType, f.documentType) === 'archives').length,
        other: tender.attachments.filter(f => getFileCategory(f.fileType, f.documentType) === 'other').length,
      },
      byDocumentType: {} as Record<string, number>
    };

    // Count by document type
    tender.attachments.forEach(attachment => {
      if (attachment.documentType) {
        stats.byDocumentType[attachment.documentType] = (stats.byDocumentType[attachment.documentType] || 0) + 1;
      }
    });

    return stats;
  }, [tender.attachments]);

const handleDownload = async (attachment: TenderAttachment) => {
  if (!canDownload) {
    toast({
      title: 'Permission Denied',
      description: 'You do not have permission to download this file',
      variant: 'destructive',
    });
    return;
  }

  try {
    const blob = await downloadMutation.mutateAsync({
      tenderId: tender._id,
      attachmentId: attachment._id
    });

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', attachment.originalName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Download Started',
      description: `${attachment.originalName} is being downloaded`,
      variant: 'success',
    });
  } catch (error: any) {
    console.error('Download failed:', error);
    
    // FIXED: Use correct URL path
    const downloadUrl = `/api/v1/tender/${tender._id}/attachments/${attachment._id}/download`;
    
    // Try to download using window.open
    const downloadWindow = window.open(downloadUrl, '_blank');
    
    if (!downloadWindow) {
      toast({
        title: 'Pop-up Blocked',
        description: 'Please allow pop-ups to download the file or try again.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Download Started',
      description: 'File download started in new window',
      variant: 'default',
    });
  }
};

  // Handle delete confirmation
  const handleDeleteClick = (attachment: TenderAttachment) => {
    if (!canDelete) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to delete this file',
        variant: 'destructive',
      });
      return;
    }

    setAttachmentToDelete(attachment);
    setDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!attachmentToDelete) return;

    try {
      await deleteMutation.mutateAsync({
        tenderId: tender._id,
        attachmentId: attachmentToDelete._id
      });

      // Call the change callback if provided
      if (onAttachmentsChange) {
        onAttachmentsChange();
      }
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setDeleteDialogOpen(false);
      setAttachmentToDelete(null);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploadingFiles(true);

    try {
      await uploadMutation.mutateAsync({
        tenderId: tender._id,
        files: files,
        descriptions: files.map(() => ''),
        types: files.map(() => 'other')
      });

      // Call the change callback if provided
      if (onAttachmentsChange) {
        onAttachmentsChange();
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploadingFiles(false);
      // Clear the file input
      event.target.value = '';
    }
  };

  // Handle preview
  const handlePreview = (attachment: TenderAttachment) => {
    setPreviewAttachment(attachment);
  };

  // Format date
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Render category filter buttons
  const renderCategoryFilter = () => (
    <div className="flex flex-wrap gap-2 mb-4">
      <Button
        variant={selectedCategory === 'all' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setSelectedCategory('all')}
        className="gap-2 h-8 px-3"
      >
        <File className="w-3.5 h-3.5" />
        All Files ({tender.attachments.length})
      </Button>

      {Object.entries(fileStats.byCategory).map(([category, count]) => {
        if (count === 0) return null;

        const icons = {
          documents: <FileText className="w-3.5 h-3.5" />,
          images: <Image className="w-3.5 h-3.5" />,
          spreadsheets: <FileSpreadsheet className="w-3.5 h-3.5" />,
          presentations: <Presentation className="w-3.5 h-3.5" />,
          archives: <FileArchive className="w-3.5 h-3.5" />,
          other: <File className="w-3.5 h-3.5" />
        };

        return (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category as FileCategory)}
            className="gap-2 capitalize h-8 px-3"
          >
            {icons[category as keyof typeof icons]}
            {category} ({count})
          </Button>
        );
      })}
    </div>
  );

  // Render file list
  const renderFileList = () => (
    <ScrollArea className="w-full" style={{ maxHeight }}>
      <div className="space-y-2 pr-4">
        {filteredAttachments.map((attachment) => (
          <div
            key={attachment._id}
            className={cn(
              "flex items-center justify-between p-3 border rounded-lg",
              "hover:bg-slate-50 dark:hover:bg-slate-900/50",
              "transition-all duration-200 group",
              "border-slate-200 dark:border-slate-800"
            )}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                {getFileIcon(attachment.fileType, attachment.documentType)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="font-medium truncate text-sm md:text-base text-slate-900 dark:text-slate-100">
                          {attachment.originalName}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-slate-900 dark:text-slate-100">{attachment.originalName}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {attachment.documentType && (
                    <Badge variant="outline" className="text-xs border-slate-300 dark:border-slate-700">
                      {getDocumentTypeLabel(attachment.documentType)}
                    </Badge>
                  )}

                  {attachment.version > 1 && (
                    <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                      v{attachment.version}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <File className="w-3 h-3" />
                    {formatFileSize(attachment.fileSize)}
                  </span>
                  <span>•</span>
                  <span className="truncate">{attachment.fileType}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(attachment.uploadedAt)}
                  </span>
                  {attachment.uploadedBy && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {attachment.uploadedBy}
                      </span>
                    </>
                  )}
                </div>

                {attachment.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-1">
                    {attachment.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 ml-4">
              {showPreview && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreview(attachment)}
                        className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-slate-900 dark:text-slate-100">Preview file</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {canDownload && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(attachment)}
                        disabled={downloadMutation.isPending}
                        className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        {downloadMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-slate-900 dark:text-slate-100">Download file</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {canDelete && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(attachment)}
                        disabled={deleteMutation.isPending}
                        className="h-8 w-8 p-0 text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        {deleteMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-slate-900 dark:text-slate-100">Delete file</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );

  // Render empty state
  const renderEmptyState = () => (
    <div className="text-center py-8">
      <div className="inline-flex flex-col items-center max-w-md mx-auto">
        <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
          <File className="w-12 h-12 text-slate-400 dark:text-slate-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">No Attachments Found</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          {searchQuery || selectedCategory !== 'all'
            ? 'No files match your current filters. Try adjusting your search or filters.'
            : 'This tender doesn\'t have any attached documents yet.'
          }
        </p>
        {(searchQuery || selectedCategory !== 'all') && (
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );

  // Render security info
  const renderSecurityInfo = () => (
    <Card className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200">
          <Shield className="w-4 h-4" />
          File Security & Integrity
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mt-0.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-medium text-sm text-slate-800 dark:text-slate-200">End-to-end Encryption</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                All files are encrypted using AES-256 encryption
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 mt-0.5">
              <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-sm text-slate-800 dark:text-slate-200">File Integrity Check</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                SHA-256 hashes verify file integrity and prevent tampering
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 mt-0.5">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="font-medium text-sm text-slate-800 dark:text-slate-200">Audit Trail</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                All downloads are logged and tracked for security purposes
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Render file statistics
  const renderFileStats = () => (
    <Card className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200">
          <Info className="w-4 h-4" />
          File Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Total Files</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{fileStats.totalFiles}</span>
            </div>
            <Progress value={100} className="h-1.5 bg-slate-300 dark:bg-slate-700" />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Total Size</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{formatFileSize(fileStats.totalSize)}</span>
            </div>
            <Progress
              value={Math.min((fileStats.totalSize / (50 * 1024 * 1024)) * 100, 100)}
              className="h-1.5 bg-slate-300 dark:bg-slate-700"
            />
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Max: {formatFileSize(50 * 1024 * 1024)}
            </p>
          </div>

          <Separator className="bg-slate-300 dark:bg-slate-700" />

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">File Types</p>
            {Object.entries(fileStats.byCategory).map(([category, count]) => (
              count > 0 && (
                <div key={category} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400 capitalize">{category}</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{count}</span>
                </div>
              )
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Preview dialog component
  const PreviewDialog = () => {
    if (!previewAttachment) return null;

    return (
      <Dialog open={!!previewAttachment} onOpenChange={() => setPreviewAttachment(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              {getFileIcon(previewAttachment.fileType, previewAttachment.documentType)}
              {previewAttachment.originalName}
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              {getDocumentTypeLabel(previewAttachment.documentType)} • {formatFileSize(previewAttachment.fileSize)}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {/* Preview area */}
            <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-900/50 h-96 flex items-center justify-center border-slate-200 dark:border-slate-800">
              {previewLoading ? (
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">Loading preview...</p>
                </div>
              ) : previewAttachment.fileType.includes('pdf') ? (
                <div className="w-full h-full">
                  {previewUrl ? (
                    <iframe
                      src={previewUrl}
                      title={previewAttachment.originalName}
                      className="w-full h-full border-0"
                      onError={() => {
                        // If iframe fails, show download option
                        const container = document.querySelector('.preview-container');
                        if (container) {
                          container.innerHTML = `
                            <div class="text-center">
                              <FileText class="w-16 h-16 text-red-500 mx-auto mb-4" />
                              <p class="text-slate-600">PDF preview failed. Please download the file.</p>
                              <button class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" onclick="document.querySelector('button[data-download]').click()">
                                Download PDF
                              </button>
                            </div>
                          `;
                        }
                      }}
                    />
                  ) : (
                    <div className="text-center">
                      <FileText className="w-16 h-16 text-red-500 mx-auto mb-4" />
                      <p className="text-slate-600 dark:text-slate-400">PDF preview not available</p>
                    </div>
                  )}
                </div>
              ) : previewAttachment.fileType.includes('image') ? (
                <div className="max-h-80 overflow-auto">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={previewAttachment.originalName}
                      className="max-w-full max-h-80 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="text-center">
                              <FileText class="w-16 h-16 text-slate-400 mx-auto mb-4" />
                              <p class="text-slate-600">Image preview not available</p>
                            </div>
                          `;
                        }
                      }}
                    />
                  ) : (
                    <div className="text-center">
                      <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600 dark:text-slate-400">Image preview not available</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  {getFileIcon(previewAttachment.fileType, previewAttachment.documentType)}
                  <p className="text-slate-600 dark:text-slate-400 mt-2">
                    Preview not available for this file type
                  </p>
                </div>
              )}
            </div>

            {/* File details */}
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-slate-900 dark:text-slate-100">File Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">File Name</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{previewAttachment.originalName}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">File Size</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{formatFileSize(previewAttachment.fileSize)}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">File Type</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{previewAttachment.fileType}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Document Type</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{getDocumentTypeLabel(previewAttachment.documentType)}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Uploaded By</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{previewAttachment.uploadedBy || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Upload Date</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{formatDate(previewAttachment.uploadedAt)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-600 dark:text-slate-400">Description</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {previewAttachment.description || 'No description provided'}
                    </p>
                  </div>
                  {previewAttachment.fileHash && (
                    <div className="col-span-2">
                      <p className="text-slate-600 dark:text-slate-400">File Hash (SHA-256)</p>
                      <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded block truncate text-slate-900 dark:text-slate-100">
                        {previewAttachment.fileHash}
                      </code>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action buttons */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setPreviewAttachment(null)}
                className="border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Close
              </Button>
              {canDownload && (
                <Button
                  onClick={() => handleDownload(previewAttachment)}
                  disabled={downloadMutation.isPending}
                  data-download
                >
                  {downloadMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download File
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Delete confirmation dialog
  const DeleteDialog = () => (
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-slate-900 dark:text-slate-100">
            Delete Attachment
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
            Are you sure you want to delete `{attachmentToDelete?.originalName}`? This action cannot be undone and the file will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            disabled={deleteMutation.isPending}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteConfirm}
            disabled={deleteMutation.isPending}
            className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (tender.attachments.length === 0) {
    return (
      <>
        <Card className={cn("border-slate-200 dark:border-slate-800", className)}>
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <div className="inline-flex p-4 rounded-full bg-slate-100 dark:bg-slate-800">
                <File className="w-12 h-12 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">No Attachments</h3>
              <p className="text-slate-600 dark:text-slate-400">
                This tender doesn`t have any attached documents.
              </p>
              {canUpload && (
                <div className="mt-4">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploadingFiles || uploadMutation.isPending}
                  />
                  <label htmlFor="file-upload">
                    <Button
                      asChild
                      disabled={uploadingFiles || uploadMutation.isPending}
                    >
                      <span>
                        {uploadingFiles || uploadMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Files
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <Card className={cn("border-slate-200 dark:border-slate-800", className)}>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <FileText className="w-5 h-5" />
                Tender Attachments
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                {tender.attachments.length} file{tender.attachments.length !== 1 ? 's' : ''} • {formatFileSize(fileStats.totalSize)}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              {/* Upload button */}
              {canUpload && (
                <>
                  <input
                    type="file"
                    id="file-upload-bulk"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploadingFiles || uploadMutation.isPending}
                  />
                  <label htmlFor="file-upload-bulk">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      disabled={uploadingFiles || uploadMutation.isPending}
                      className="gap-2 h-9 border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <span>
                        {uploadingFiles || uploadMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">Upload</span>
                      </span>
                    </Button>
                  </label>
                </>
              )}

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <Input
                  placeholder="Search files..."
                  className="pl-9 w-40 sm:w-48 h-9 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Sort */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (sortBy === 'name') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('name');
                          setSortOrder('asc');
                        }
                      }}
                      className="gap-2 h-9 border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <SortAsc className="w-4 h-4" />
                      <span className="hidden sm:inline">Sort</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-slate-900 dark:text-slate-100">
                      Sort by: {sortBy} ({sortOrder})
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Bulk Download */}
              {canDownload && filteredAttachments.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 h-9 border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  onClick={() => {
                    // Download all filtered files
                    filteredAttachments.forEach((attachment) => {
                      handleDownload(attachment);
                    });

                    toast({
                      title: 'Bulk Download Started',
                      description: `Downloading ${filteredAttachments.length} file(s)...`,
                      variant: 'success',
                    });
                  }}
                  disabled={downloadMutation.isPending}
                >
                  {downloadMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Download All</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Category filters */}
          {renderCategoryFilter()}

          {/* File list */}
          {filteredAttachments.length > 0 ? (
            renderFileList()
          ) : (
            renderEmptyState()
          )}
        </CardContent>

        {/* Footer with stats */}
        {filteredAttachments.length > 0 && (
          <CardFooter className="border-t border-slate-200 dark:border-slate-800 pt-4">
            <div className="flex items-center justify-between w-full text-sm text-slate-600 dark:text-slate-400">
              <span>
                Showing {filteredAttachments.length} of {tender.attachments.length} files
              </span>
              <span>
                {formatFileSize(filteredAttachments.reduce((sum, f) => sum + f.fileSize, 0))}
              </span>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Sidebar with stats and security (optional) */}
      {showSecurity && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          <div className="lg:col-span-2">
            {renderFileStats()}
          </div>
          <div>
            {renderSecurityInfo()}
          </div>
        </div>
      )}

      {/* Preview Dialog */}
      <PreviewDialog />

      {/* Delete Confirmation Dialog */}
      <DeleteDialog />
    </>
  );
};