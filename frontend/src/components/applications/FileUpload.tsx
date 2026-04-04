/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/social/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useToast } from '@/hooks/use-toast';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useTheme } from '@/hooks/use-theme';
import { colorClasses } from '@/utils/color';
import { applicationService } from '@/services/applicationService';
import { FileText, Loader2, Pause, CheckCircle, AlertCircle, Shield, Zap, FileImage, FileSpreadsheet, GripVertical, X, Plus, RotateCcw, Play, ChevronUp, ChevronDown, Trash2, CheckSquare, Square, Download, Camera, List, Grid, UploadCloud, Upload, Info, File } from 'lucide-react';
import { FileUploadOff } from '@mui/icons-material';


// ==================== Types ====================

export type FileCategory = 'CV' | 'Reference' | 'Experience' | 'Portfolio' | 'Other';
export type UploadStatus = 'idle' | 'uploading' | 'paused' | 'completed' | 'error' | 'validating' | 'processing';

export interface UploadedFile {
  id: string;
  tempId: string;
  file: File;
  progress: number;
  status: UploadStatus;
  error?: string;
  url?: string;
  category: FileCategory;
  description?: string;
  tags?: string[];
  version?: number;
  thumbnail?: string;
  uploadSpeed?: number;
  timeRemaining?: number;
  retryCount?: number;
  isSelected?: boolean;
}

export interface FileUploadProps {
  onFileUpload: (files: UploadedFile[]) => void;
  onFileRemove?: (fileId: string) => void;
  onFileRetry?: (file: UploadedFile) => void;
  onFilePause?: (file: UploadedFile) => void;
  onFileResume?: (file: UploadedFile) => void;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number; // in bytes
  minSize?: number; // in bytes
  label?: string;
  description?: string;
  multiple?: boolean;
  showPreview?: boolean;
  showThumbnails?: boolean;
  enableCategorization?: boolean;
  enableTags?: boolean;
  enableDescriptions?: boolean;
  enableDragAndDrop?: boolean;
  chunkSize?: number; // in bytes
  concurrentUploads?: number;
  autoUpload?: boolean;
  validateBeforeUpload?: boolean;
  allowedCategories?: FileCategory[];
  defaultCategory?: FileCategory;
  endpoint?: string;
  headers?: Record<string, string>;
  withCredentials?: boolean;
  onUploadStart?: (files: UploadedFile[]) => void;
  onUploadProgress?: (file: UploadedFile, progress: number) => void;
  onUploadComplete?: (file: UploadedFile, response: any) => void;
  onUploadError?: (file: UploadedFile, error: Error) => void;
  onBatchComplete?: (files: UploadedFile[]) => void;
  className?: string;
}

interface UploadQueue {
  files: UploadedFile[];
  activeUploads: number;
  totalProgress: number;
}

interface Chunk {
  data: Blob;
  index: number;
  total: number;
}

// ==================== Constants ====================

const DEFAULT_ACCEPT = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
};

const CATEGORY_OPTIONS: { value: FileCategory; label: string; color: string; icon: React.ReactNode }[] = [
  { value: 'CV', label: 'CV / Resume', color: 'blue', icon: <FileText className="h-4 w-4" /> },
  { value: 'Reference', label: 'Reference Letter', color: 'purple', icon: <FileText className="h-4 w-4" /> },
  { value: 'Experience', label: 'Experience Document', color: 'emerald', icon: <FileText className="h-4 w-4" /> },
  { value: 'Portfolio', label: 'Portfolio', color: 'amber', icon: <FileText className="h-4 w-4" /> },
  { value: 'Other', label: 'Other Document', color: 'slate', icon: <FileText className="h-4 w-4" /> }
];

const STATUS_COLORS: Record<UploadStatus, string> = {
  idle: 'text-gray-400',
  uploading: 'text-blue-500',
  paused: 'text-amber-500',
  completed: 'text-emerald-500',
  error: 'text-rose-500',
  validating: 'text-purple-500',
  processing: 'text-orange-500'
};

const STATUS_ICONS: Record<UploadStatus, React.ReactNode> = {
  idle: <File className="h-4 w-4" />,
  uploading: <Loader2 className="h-4 w-4 animate-spin" />,
  paused: <Pause className="h-4 w-4" />,
  completed: <CheckCircle className="h-4 w-4" />,
  error: <AlertCircle className="h-4 w-4" />,
  validating: <Shield className="h-4 w-4 animate-pulse" />,
  processing: <Zap className="h-4 w-4 animate-pulse" />
};

// ==================== Utility Functions ====================

const generateTempId = (): string => {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileTypeIcon = (file: File, fileType?: string): React.ReactNode => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const mimeType = file.type.toLowerCase();

  if (mimeType.includes('pdf') || extension === 'pdf') {
    return <FileUploadOff className="h-5 w-5 text-rose-500" />;
  }
  if (mimeType.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
    return <FileImage className="h-5 w-5 text-emerald-500" />;
  }
  if (mimeType.includes('spreadsheet') || ['xls', 'xlsx', 'csv'].includes(extension || '')) {
    return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
  }
  if (mimeType.includes('word') || ['doc', 'docx'].includes(extension || '')) {
    return <FileText className="h-5 w-5 text-blue-500" />;
  }
  return <File className="h-5 w-5 text-gray-500" />;
};

const generateThumbnail = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Not an image'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, 100, 100);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const validateFile = async (
  file: File,
  maxSize: number,
  minSize: number,
  accept: Record<string, string[]>
): Promise<{ valid: boolean; error?: string }> => {
  // Check size
  if (file.size > maxSize) {
    return { valid: false, error: `File size exceeds ${formatFileSize(maxSize)}` };
  }
  if (file.size < minSize) {
    return { valid: false, error: `File size is less than ${formatFileSize(minSize)}` };
  }

  // Check type
  const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
  const acceptedExtensions = Object.values(accept).flat();
  
  if (!acceptedExtensions.includes(extension) && !Object.keys(accept).includes(file.type)) {
    return { valid: false, error: 'File type not accepted' };
  }

  // Additional validation (virus scan, etc.) would go here
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate validation

  return { valid: true };
};

// ==================== Sub-components ====================

// File Thumbnail Component
const FileThumbnail: React.FC<{ file: UploadedFile; onClick?: () => void }> = ({ file, onClick }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (file.thumbnail && !hasError) {
    return (
      <div
        className="relative w-12 h-12 rounded-lg overflow-hidden cursor-pointer"
        onClick={onClick}
      >
        <img
          src={file.thumbnail}
          alt={file.file.name}
          className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-gray-800">
      {getFileTypeIcon(file.file)}
    </div>
  );
};

// Upload Progress Component
const UploadProgress: React.FC<{ progress: number; status: UploadStatus; speed?: number; timeRemaining?: number }> = ({
  progress,
  status,
  speed,
  timeRemaining
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'uploading': return 'bg-blue-500';
      case 'paused': return 'bg-amber-500';
      case 'completed': return 'bg-emerald-500';
      case 'error': return 'bg-rose-500';
      case 'validating': return 'bg-purple-500';
      case 'processing': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className={STATUS_COLORS[status]}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
        <span className="text-gray-600 dark:text-gray-400">
          {progress}%
          {speed && ` • ${formatFileSize(speed)}/s`}
        </span>
      </div>
      <Progress value={progress} className={`h-1.5 ${getStatusColor()}`} />
      {timeRemaining !== undefined && timeRemaining > 0 && (
        <p className="text-xs text-gray-500">
          {Math.ceil(timeRemaining / 1000)}s remaining
        </p>
      )}
    </div>
  );
};

// File Card Component
const FileCard: React.FC<{
  file: UploadedFile;
  index: number;
  onRemove: () => void;
  onRetry: () => void;
  onPause: () => void;
  onResume: () => void;
  onCategoryChange: (category: FileCategory) => void;
  onDescriptionChange: (description: string) => void;
  onTagsChange: (tags: string[]) => void;
  onSelect?: () => void;
  isSelected?: boolean;
  showThumbnails?: boolean;
  enableCategorization?: boolean;
  enableDescriptions?: boolean;
  enableTags?: boolean;
}> = ({
  file,
  index,
  onRemove,
  onRetry,
  onPause,
  onResume,
  onCategoryChange,
  onDescriptionChange,
  onTagsChange,
  onSelect,
  isSelected,
  showThumbnails = true,
  enableCategorization = true,
  enableDescriptions = true,
  enableTags = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const isMobile = useMediaQuery('(max-width: 640px)');

  const categoryColor = CATEGORY_OPTIONS.find(c => c.value === file.category)?.color || 'gray';
  const categoryBgMap: Record<string, string> = {
    blue: colorClasses.bg.blueLight,
    purple: colorClasses.bg.purpleLight,
    emerald: colorClasses.bg.emeraldLight,
    amber: colorClasses.bg.amberLight,
    slate: colorClasses.bg.tealLight,
    gray: colorClasses.bg.gray100,
  };
  const categoryBg = categoryBgMap[categoryColor] || colorClasses.bg.gray100;
  const categoryBorder = colorClasses.border[categoryColor as keyof typeof colorClasses.border] || colorClasses.border.gray400;

  const handleAddTag = () => {
    if (tagInput.trim() && !file.tags?.includes(tagInput.trim())) {
      onTagsChange([...(file.tags || []), tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    onTagsChange(file.tags?.filter(t => t !== tag) || []);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: index * 0.05 }}
      className={`
        relative p-4 rounded-xl border-2 transition-all
        ${file.status === 'error' ? 'border-rose-300 bg-rose-50/50 dark:border-rose-800 dark:bg-rose-900/10' : ''}
        ${file.status === 'completed' ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/10' : ''}
        ${file.status === 'uploading' ? 'border-blue-300 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10' : ''}
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        hover:shadow-md transition-shadow
      `}
      onClick={onSelect}
    >
      <div className="flex items-start gap-4">
        {/* Drag Handle */}
        <div className="cursor-grab active:cursor-grabbing mt-2">
          <GripVertical className="h-5 w-5 text-gray-400" />
        </div>

        {/* Thumbnail */}
        {showThumbnails && (
          <FileThumbnail file={file} onClick={() => setIsExpanded(!isExpanded)} />
        )}

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className={`font-medium truncate ${colorClasses.text.gray800} dark:${colorClasses.text.white}`}>
                  {file.file.name}
                </p>
                {file.version && (
                  <Badge variant="outline" className="text-xs">
                    v{file.version}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{formatFileSize(file.file.size)}</span>
                <span>•</span>
                <span>{file.file.type || 'Unknown type'}</span>
                {file.retryCount ? <span>• Retry {file.retryCount}</span> : null}
              </div>
            </div>

            {/* Status Icon */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={STATUS_COLORS[file.status]}>
                  {STATUS_ICONS[file.status]}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{file.status}</p>
                {file.error && <p className="text-xs text-rose-500">{file.error}</p>}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Progress Bar */}
          {file.status !== 'completed' && file.status !== 'error' && (
            <div className="mt-2">
              <UploadProgress
                progress={file.progress}
                status={file.status}
                speed={file.uploadSpeed}
                timeRemaining={file.timeRemaining}
              />
            </div>
          )}

          {/* Error Message */}
          {file.error && (
            <p className="mt-2 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {file.error}
            </p>
          )}

          {/* Category Badge */}
          {enableCategorization && file.category && (
            <div className="mt-2">
              <Badge className={`${categoryBg} ${colorClasses.text[categoryColor as keyof typeof colorClasses.text]} border ${categoryBorder}`}>
                {CATEGORY_OPTIONS.find(c => c.value === file.category)?.label || file.category}
              </Badge>
            </div>
          )}

          {/* Tags */}
          {enableTags && file.tags && file.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {file.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveTag(tag);
                    }}
                    className="ml-1 hover:text-rose-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Description */}
          {enableDescriptions && file.description && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {file.description}
            </p>
          )}

          {/* Expanded Options */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-3 overflow-hidden"
              >
                {/* Category Selector */}
                {enableCategorization && (
                  <Select
                    value={file.category}
                    onValueChange={(value) => onCategoryChange(value as FileCategory)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            {option.icon}
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Description Input */}
                {enableDescriptions && (
                  <Textarea
                    placeholder="Add a description..."
                    value={file.description || ''}
                    onChange={(e) => onDescriptionChange(e.target.value)}
                    rows={2}
                  />
                )}

                {/* Tags Input */}
                {enableTags && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add tags..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    />
                    <Button size="sm" onClick={handleAddTag}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {file.status === 'error' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRetry();
                  }}
                  className="h-10 w-10 p-0 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Retry upload</TooltipContent>
            </Tooltip>
          )}

          {file.status === 'uploading' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPause();
                  }}
                  className="h-10 w-10 p-0 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                >
                  <Pause className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Pause upload</TooltipContent>
            </Tooltip>
          )}

          {file.status === 'paused' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onResume();
                  }}
                  className="h-10 w-10 p-0 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <Play className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Resume upload</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="h-10 w-10 p-0"
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isExpanded ? 'Less options' : 'More options'}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="h-10 w-10 p-0 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remove file</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </motion.div>
  );
};

// Batch Operations Bar
const BatchOperationsBar: React.FC<{
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onDeleteSelected: () => void;
  onDownloadSelected: () => void;
  onCategoryChange: (category: FileCategory) => void;
  isAllSelected: boolean;
}> = ({
  selectedCount,
  totalCount,
  onClearSelection,
  onSelectAll,
  onDeleteSelected,
  onDownloadSelected,
  onCategoryChange,
  isAllSelected
}) => {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-white dark:bg-darkNavy rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-4 min-w-[300px]"
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSelectAll}
            className="h-8 px-2"
          >
            {isAllSelected ? (
              <CheckSquare className="h-4 w-4 mr-1" />
            ) : (
              <Square className="h-4 w-4 mr-1" />
            )}
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </Button>
          <Badge variant="outline" className="px-3 py-1">
            {selectedCount} selected
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Select onValueChange={(value) => onCategoryChange(value as FileCategory)}>
            <SelectTrigger className="h-8 w-32">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onDownloadSelected}
                className="h-8"
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download Selected</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onDeleteSelected}
                className="h-8 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/20"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete Selected</TooltipContent>
          </Tooltip>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// Camera Capture Modal
const CameraCapture: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCapture: (blob: Blob) => void;
}> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
          setStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          setError('Could not access camera');
          console.error(err);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen]);

  const handleCapture = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) {
        onCapture(blob);
        onClose();
      }
    }, 'image/jpeg', 0.9);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Capture Document">
      <div className="space-y-4">
        {error ? (
          <div className="text-center p-8">
            <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
            <p className="text-rose-600">{error}</p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg bg-black"
            />
            <div className="flex gap-3">
              <Button onClick={handleCapture} className="flex-1">
                <Camera className="h-4 w-4 mr-2" />
                Capture
              </Button>
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
};

// ==================== Main Component ====================

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  onFileRemove,
  onFileRetry,
  onFilePause,
  onFileResume,
  accept = DEFAULT_ACCEPT,
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024, // 50MB
  minSize = 0,
  label = 'Upload files',
  description = 'Drag & drop files here, or click to select',
  multiple = true,
  showPreview = true,
  showThumbnails = true,
  enableCategorization = true,
  enableTags = true,
  enableDescriptions = true,
  enableDragAndDrop = true,
  chunkSize = 1024 * 1024, // 1MB chunks
  concurrentUploads = 3,
  autoUpload = true,
  validateBeforeUpload = true,
  allowedCategories,
  defaultCategory = 'Other',
  endpoint = '/api/upload',
  headers = {},
  withCredentials = true,
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  onBatchComplete,
  className = ''
}) => {
  // ==================== State ====================
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploadQueue, setUploadQueue] = useState<UploadQueue>({
    files: [],
    activeUploads: 0,
    totalProgress: 0
  });
  const [isDragging, setIsDragging] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [isProcessing, setIsProcessing] = useState(false);

  // ==================== Hooks ====================
  const { toast } = useToast();
  const { theme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 640px)');
  const abortControllers = useRef<Map<string, AbortController>>(new Map());
  const chunkQueues = useRef<Map<string, Chunk[]>>(new Map());

  // ==================== Computed Values ====================
  const selectedCount = Object.values(selectedFiles).filter(Boolean).length;
  const isAllSelected = selectedCount === files.length && files.length > 0;
  const completedCount = files.filter(f => f.status === 'completed').length;
  const errorCount = files.filter(f => f.status === 'error').length;
  const uploadingCount = files.filter(f => f.status === 'uploading').length;

  // ==================== Dropzone Configuration ====================
  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach((rejected) => {
        rejected.errors.forEach((error: any) => {
          toast({
            title: 'Upload Error',
            description: `${rejected.file.name}: ${error.message}`,
            variant: 'destructive',
          });
        });
      });
    }

    // Handle accepted files
    if (acceptedFiles.length > 0) {
      // Check max files limit
      if (files.length + acceptedFiles.length > maxFiles) {
        toast({
          title: 'Too Many Files',
          description: `You can only upload up to ${maxFiles} files`,
          variant: 'destructive',
        });
        return;
      }

      setIsProcessing(true);

      // Process each file
      const newFiles: UploadedFile[] = [];

      for (const file of acceptedFiles) {
        const tempId = applicationService.generateTempId?.() || generateTempId();
        
        // Validate file
        if (validateBeforeUpload) {
          const validation = await validateFile(file, maxSize, minSize, accept);
          if (!validation.valid) {
            toast({
              title: 'Invalid File',
              description: `${file.name}: ${validation.error}`,
              variant: 'destructive',
            });
            continue;
          }
        }

        // Generate thumbnail for images
        let thumbnail: string | undefined;
        if (showThumbnails && file.type.startsWith('image/')) {
          try {
            thumbnail = await generateThumbnail(file);
          } catch (error) {
            console.error('Failed to generate thumbnail:', error);
          }
        }

        const uploadedFile: UploadedFile = {
          id: tempId,
          tempId,
          file,
          progress: 0,
          status: autoUpload ? 'uploading' : 'idle',
          category: defaultCategory,
          thumbnail,
          retryCount: 0
        };

        newFiles.push(uploadedFile);
      }

      setFiles(prev => [...prev, ...newFiles]);
      
      // Auto-upload if enabled
      if (autoUpload) {
        newFiles.forEach(file => {
          startUpload(file);
        });
      }

      onFileUpload(newFiles);
      onUploadStart?.(newFiles);

      setIsProcessing(false);

      // Haptic feedback for mobile
      if (isMobile && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }
  }, [files.length, maxFiles, validateBeforeUpload, maxSize, minSize, accept, autoUpload, showThumbnails, isMobile, onFileUpload, onUploadStart, toast]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple,
    noClick: true,
    noKeyboard: true,
    disabled: files.length >= maxFiles
  });

  // ==================== Upload Handlers ====================

  const uploadChunk = async (
    file: UploadedFile,
    chunk: Blob,
    chunkIndex: number,
    totalChunks: number,
    controller: AbortController
  ): Promise<boolean> => {
    const formData = new FormData();
    formData.append('file', chunk);
    formData.append('tempId', file.tempId);
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('totalChunks', totalChunks.toString());
    formData.append('fileName', file.file.name);
    formData.append('fileSize', file.file.size.toString());
    formData.append('category', file.category);

    try {
      const response = await fetch(`${endpoint}/chunk`, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
        credentials: withCredentials ? 'include' : 'omit'
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Upload aborted');
        return false;
      }
      throw error;
    }
  };

  const startUpload = async (uploadedFile: UploadedFile) => {
    if (uploadedFile.status === 'completed' || uploadedFile.status === 'uploading') return;

    // Create abort controller
    const controller = new AbortController();
    abortControllers.current.set(uploadedFile.id, controller);

    // Update status
    setFiles(prev =>
      prev.map(f =>
        f.id === uploadedFile.id
          ? { ...f, status: 'uploading', progress: 0 }
          : f
      )
    );

    // Calculate chunks
    const chunks: Chunk[] = [];
    let start = 0;
    while (start < uploadedFile.file.size) {
      const end = Math.min(start + chunkSize, uploadedFile.file.size);
      chunks.push({
        data: uploadedFile.file.slice(start, end),
        index: chunks.length,
        total: Math.ceil(uploadedFile.file.size / chunkSize)
      });
      start = end;
    }

    chunkQueues.current.set(uploadedFile.id, chunks);

    let uploadedChunks = 0;
    const startTime = Date.now();

    try {
      // Upload chunks with concurrency control
      for (let i = 0; i < chunks.length; i += concurrentUploads) {
        const batch = chunks.slice(i, i + concurrentUploads);
        await Promise.all(
          batch.map(async (chunk) => {
            const success = await uploadChunk(
              uploadedFile,
              chunk.data,
              chunk.index,
              chunks.length,
              controller
            );

            if (success) {
              uploadedChunks++;
              const progress = Math.round((uploadedChunks / chunks.length) * 100);
              
              // Calculate speed and time remaining
              const elapsed = Date.now() - startTime;
              const speed = (uploadedFile.file.size * (progress / 100)) / (elapsed / 1000);
              const timeRemaining = ((chunks.length - uploadedChunks) * chunkSize) / speed * 1000;

              setFiles(prev =>
                prev.map(f =>
                  f.id === uploadedFile.id
                    ? {
                        ...f,
                        progress,
                        uploadSpeed: speed,
                        timeRemaining
                      }
                    : f
                )
              );

              onUploadProgress?.(uploadedFile, progress);
            }
          })
        );

        // Check if aborted
        if (controller.signal.aborted) {
          setFiles(prev =>
            prev.map(f =>
              f.id === uploadedFile.id
                ? { ...f, status: 'paused', progress: Math.round((uploadedChunks / chunks.length) * 100) }
                : f
            )
          );
          return;
        }
      }

      // Complete upload
      const completeFormData = new FormData();
      completeFormData.append('tempId', uploadedFile.tempId);
      completeFormData.append('fileName', uploadedFile.file.name);
      completeFormData.append('fileSize', uploadedFile.file.size.toString());
      completeFormData.append('category', uploadedFile.category);
      if (uploadedFile.description) {
        completeFormData.append('description', uploadedFile.description);
      }
      if (uploadedFile.tags) {
        completeFormData.append('tags', JSON.stringify(uploadedFile.tags));
      }

      const response = await fetch(`${endpoint}/complete`, {
        method: 'POST',
        headers,
        body: completeFormData,
        signal: controller.signal,
        credentials: withCredentials ? 'include' : 'omit'
      });

      if (!response.ok) {
        throw new Error('Failed to complete upload');
      }

      const data = await response.json();

      // Update file as completed
      setFiles(prev =>
        prev.map(f =>
          f.id === uploadedFile.id
            ? {
                ...f,
                status: 'completed',
                progress: 100,
                url: data.url,
                version: data.version
              }
            : f
        )
      );

      onUploadComplete?.(uploadedFile, data);

      // Check if all files are complete
      const allComplete = files.every(f => 
        f.id === uploadedFile.id || f.status === 'completed'
      );
      if (allComplete) {
        onBatchComplete?.(files);
      }

      // Haptic feedback for mobile
      if (isMobile && window.navigator.vibrate) {
        window.navigator.vibrate([50, 50, 50]);
      }

      toast({
        title: 'Upload Complete',
        description: `${uploadedFile.file.name} uploaded successfully`,
      });

    } catch (error) {
      console.error('Upload error:', error);

      const retryCount = (uploadedFile.retryCount || 0) + 1;
      
      setFiles(prev =>
        prev.map(f =>
          f.id === uploadedFile.id
            ? {
                ...f,
                status: 'error',
                error: error instanceof Error ? error.message : 'Upload failed',
                retryCount
              }
            : f
        )
      );

      onUploadError?.(uploadedFile, error as Error);

      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload file',
        variant: 'destructive',
      });

    } finally {
      abortControllers.current.delete(uploadedFile.id);
      chunkQueues.current.delete(uploadedFile.id);
    }
  };

  const pauseUpload = (file: UploadedFile) => {
    const controller = abortControllers.current.get(file.id);
    if (controller) {
      controller.abort();
      setFiles(prev =>
        prev.map(f =>
          f.id === file.id
            ? { ...f, status: 'paused' }
            : f
        )
      );
      onFilePause?.(file);
    }
  };

  const resumeUpload = (file: UploadedFile) => {
    if (file.status === 'paused') {
      startUpload(file);
      onFileResume?.(file);
    }
  };

  const retryUpload = (file: UploadedFile) => {
    setFiles(prev =>
      prev.map(f =>
        f.id === file.id
          ? { ...f, status: 'uploading', error: undefined, progress: 0 }
          : f
      )
    );
    startUpload(file);
    onFileRetry?.(file);
  };

  const removeFile = (fileId: string) => {
    // Abort any ongoing upload
    const controller = abortControllers.current.get(fileId);
    if (controller) {
      controller.abort();
    }

    setFiles(prev => prev.filter(f => f.id !== fileId));
    setSelectedFiles(prev => {
      const newSelected = { ...prev };
      delete newSelected[fileId];
      return newSelected;
    });

    onFileRemove?.(fileId);
  };

  const updateFileCategory = (fileId: string, category: FileCategory) => {
    setFiles(prev =>
      prev.map(f =>
        f.id === fileId ? { ...f, category } : f
      )
    );
  };

  const updateFileDescription = (fileId: string, description: string) => {
    setFiles(prev =>
      prev.map(f =>
        f.id === fileId ? { ...f, description } : f
      )
    );
  };

  const updateFileTags = (fileId: string, tags: string[]) => {
    setFiles(prev =>
      prev.map(f =>
        f.id === fileId ? { ...f, tags } : f
      )
    );
  };

  // ==================== Batch Operations ====================

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedFiles({});
    } else {
      const newSelected: Record<string, boolean> = {};
      files.forEach(f => {
        newSelected[f.id] = true;
      });
      setSelectedFiles(newSelected);
    }
  };

  const handleClearSelection = () => {
    setSelectedFiles({});
  };

  const handleDeleteSelected = () => {
    const selectedIds = Object.keys(selectedFiles).filter(id => selectedFiles[id]);
    selectedIds.forEach(id => removeFile(id));
    handleClearSelection();

    toast({
      title: 'Files Removed',
      description: `Removed ${selectedIds.length} file(s)`,
    });
  };

  const handleDownloadSelected = () => {
    const selected = files.filter(f => selectedFiles[f.id] && f.url);
    selected.forEach(f => {
      if (f.url) {
        window.open(f.url, '_blank');
      }
    });
  };

  const handleBatchCategoryChange = (category: FileCategory) => {
    const selectedIds = Object.keys(selectedFiles).filter(id => selectedFiles[id]);
    setFiles(prev =>
      prev.map(f =>
        selectedIds.includes(f.id) ? { ...f, category } : f
      )
    );
  };

  // ==================== Cleanup ====================
  useEffect(() => {
    return () => {
      abortControllers.current.forEach(controller => controller.abort());
    };
  }, []);

  // ==================== Render ====================

  return (
    <TooltipProvider>
      <div className={`space-y-4 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-lg font-semibold ${colorClasses.text.gray800} dark:${colorClasses.text.white}`}>
              {label}
            </h3>
            <p className={`text-sm ${colorClasses.text.gray600}`}>
              {description}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Camera capture for mobile */}
            {isMobile && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCamera(true)}
                    className="h-10 w-10 p-0"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Take photo</TooltipContent>
              </Tooltip>
            )}

            {/* View mode toggle */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('list')}
                className={`h-8 w-8 p-0 ${viewMode === 'list' ? 'bg-white dark:bg-darkNavy shadow-sm' : ''}`}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('grid')}
                className={`h-8 w-8 p-0 ${viewMode === 'grid' ? 'bg-white dark:bg-darkNavy shadow-sm' : ''}`}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Dropzone */}
        <Card>
          <CardContent className="pt-6">
            <div
              {...getRootProps()}
              className={`
                relative border-2 border-dashed rounded-xl p-8 text-center
                transition-all duration-300 cursor-pointer
                ${isDragActive || isDragging
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 scale-105'
                  : `${colorClasses.border.gray400} hover:${colorClasses.border.gray600} hover:bg-gray-50/50 dark:hover:bg-gray-800/50`
                }
                ${files.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              onDragEnter={() => setIsDragging(true)}
              onDragLeave={() => setIsDragging(false)}
            >
              <input {...getInputProps()} disabled={files.length >= maxFiles} />

              {/* Animated overlay */}
              <AnimatePresence>
                {isDragActive && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute inset-0 flex items-center justify-center bg-blue-500/10 backdrop-blur-sm rounded-xl"
                  >
                    <div className="text-center">
                      <UploadCloud className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                      <p className="text-blue-600 font-medium">Drop to upload</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              
              <h4 className={`text-lg font-semibold ${colorClasses.text.gray700} mb-2`}>
                {label}
              </h4>
              
              <p className={`text-sm ${colorClasses.text.gray1000} mb-4`}>
                {description}
              </p>

              <div className={`text-xs ${colorClasses.text.gray400} mb-4 space-y-1`}>
                <p>Supported formats: {Object.values(accept).flat().join(', ')}</p>
                <p>Max size: {formatFileSize(maxSize)} • Max files: {maxFiles}</p>
              </div>

              <div className="flex items-center justify-center gap-3">
                <Button
                  type="button"
                  onClick={open}
                  disabled={files.length >= maxFiles}
                  variant="outline"
                >
                  Browse Files
                </Button>
                {isMobile && (
                  <Button
                    type="button"
                    onClick={() => setShowCamera(true)}
                    variant="outline"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Camera
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Queue Summary */}
        {files.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className={`font-semibold ${colorClasses.text.gray700}`}>
                  Upload Queue ({files.length}/{maxFiles})
                </h4>
                
                <div className="flex items-center gap-3 text-sm">
                  <span className={`${colorClasses.text.emerald}`}>✓ {completedCount}</span>
                  <span className={`${colorClasses.text.blue}`}>↑ {uploadingCount}</span>
                  {errorCount > 0 && (
                    <span className={`${colorClasses.text.rose}`}>! {errorCount}</span>
                  )}
                </div>
              </div>

              {/* Global Progress */}
              {uploadingCount > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className={colorClasses.text.gray600}>Overall Progress</span>
                    <span className={colorClasses.text.gray600}>
                      {Math.round((completedCount / files.length) * 100)}%
                    </span>
                  </div>
                  <Progress value={(completedCount / files.length) * 100} className="h-2" />
                </div>
              )}

              {/* File List */}
              <Reorder.Group
                axis="y"
                values={files}
                onReorder={setFiles}
                className="space-y-3"
              >
                <AnimatePresence initial={false}>
                  {files.map((file, index) => (
                    <Reorder.Item key={file.id} value={file}>
                      <FileCard
                        file={file}
                        index={index}
                        onRemove={() => removeFile(file.id)}
                        onRetry={() => retryUpload(file)}
                        onPause={() => pauseUpload(file)}
                        onResume={() => resumeUpload(file)}
                        onCategoryChange={(category) => updateFileCategory(file.id, category)}
                        onDescriptionChange={(description) => updateFileDescription(file.id, description)}
                        onTagsChange={(tags) => updateFileTags(file.id, tags)}
                        onSelect={() => {
                          setSelectedFiles(prev => ({
                            ...prev,
                            [file.id]: !prev[file.id]
                          }));
                        }}
                        isSelected={!!selectedFiles[file.id]}
                        showThumbnails={showThumbnails}
                        enableCategorization={enableCategorization}
                        enableDescriptions={enableDescriptions}
                        enableTags={enableTags}
                      />
                    </Reorder.Item>
                  ))}
                </AnimatePresence>
              </Reorder.Group>
            </CardContent>
          </Card>
        )}

        {/* File Type Help */}
        <Card className={`${colorClasses.bg.gray100} dark:${colorClasses.bg.gray800}`}>
          <CardContent className="pt-6">
            <h4 className={`font-semibold ${colorClasses.text.gray700} mb-3 flex items-center gap-2`}>
              <Info className="h-4 w-4" />
              Supported File Types
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <FileUploadOff className="h-4 w-4 text-rose-500" />
                <span className={colorClasses.text.gray600}>PDF Documents</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <span className={colorClasses.text.gray600}>Word Documents</span>
              </div>
              <div className="flex items-center gap-2">
                <FileImage className="h-4 w-4 text-emerald-500" />
                <span className={colorClasses.text.gray600}>Images (JPG, PNG)</span>
              </div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-green-500" />
                <span className={colorClasses.text.gray600}>Spreadsheets</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Batch Operations Bar */}
        {selectedCount > 0 && (
          <BatchOperationsBar
            selectedCount={selectedCount}
            totalCount={files.length}
            onClearSelection={handleClearSelection}
            onSelectAll={handleSelectAll}
            onDeleteSelected={handleDeleteSelected}
            onDownloadSelected={handleDownloadSelected}
            onCategoryChange={handleBatchCategoryChange}
            isAllSelected={isAllSelected}
          />
        )}
      </div>
    </TooltipProvider>
  );
};