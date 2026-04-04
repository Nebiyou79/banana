import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    Upload,
    FileText,
    AlertCircle,
    CheckCircle,
    Loader2,
    Trash2,
    Eye,
    Download,
    Image as ImageIcon,
    File as FileIcon,
    FileJson,
    FileCode,
    FileArchive,
    FileSpreadsheet,
    Presentation,
} from 'lucide-react';
import { Button } from '@/components/social/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { DOCUMENT_TYPES } from '@/services/tenderService';
import { UploadedFile } from '@/types/fileUpload';

// ============ FILE UPLOAD CONSTANTS ============
const FILE_UPLOAD_CONSTRAINTS = {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxFileCount: 20,
    allowedTypes: [
        'image/*',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'application/zip',
    ]
};

// ============ FORMAT FILE SIZE ============
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// ============ FILE ICON MAPPER ============
const getFileIcon = (mimeType: string, fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();

    if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
        return <ImageIcon className="h-5 w-5 text-blue-500" />;
    }
    if (mimeType === 'application/pdf' || ext === 'pdf') {
        return <FileText className="h-5 w-5 text-red-500" />;
    }
    if (mimeType.includes('word') || ['doc', 'docx'].includes(ext || '')) {
        return <FileText className="h-5 w-5 text-blue-600" />;
    }
    if (mimeType.includes('excel') || ['xls', 'xlsx', 'csv'].includes(ext || '')) {
        return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
    }
    if (mimeType.includes('powerpoint') || ['ppt', 'pptx'].includes(ext || '')) {
        return <Presentation className="h-5 w-5 text-orange-500" />;
    }
    return <FileIcon className="h-5 w-5 text-gray-500" />;
};

// ============ PROPS ============
export interface FileUploadZoneProps {
    files: UploadedFile[];
    onFilesChange: (files: UploadedFile[]) => void;
    maxFiles?: number;
    maxFileSize?: number;
    allowedTypes?: string[];
    fieldName?: string;
    className?: string;
    showPreview?: boolean;
    showDescription?: boolean;
    showDocumentType?: boolean;
    disabled?: boolean;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
    files,
    onFilesChange,
    maxFiles = 10,
    maxFileSize = FILE_UPLOAD_CONSTRAINTS.maxFileSize,
    allowedTypes = FILE_UPLOAD_CONSTRAINTS.allowedTypes,
    fieldName = 'documents',
    className,
    showPreview = true,
    showDescription = true,
    showDocumentType = true,
    disabled = false,
}) => {
    const { toast } = useToast();
    const [isDragging, setIsDragging] = useState(false);
    const [totalSize, setTotalSize] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const size = files.reduce((acc, curr) => acc + (curr.file?.size || 0), 0);
        setTotalSize(size);
    }, [files]);

    // ============ FILE VALIDATION ============
    const validateFile = (file: File): { valid: boolean; error?: string } => {
        if (file.size > maxFileSize) {
            return {
                valid: false,
                error: `${file.name} exceeds maximum file size of ${formatFileSize(maxFileSize)}`,
            };
        }

        const isAllowed = allowedTypes.some(type => {
            if (type.endsWith('/*')) {
                const category = type.split('/')[0];
                return file.type.startsWith(category + '/');
            }
            return file.type === type;
        });

        if (!isAllowed && allowedTypes.length > 0) {
            return {
                valid: false,
                error: `${file.name} has unsupported file type.`,
            };
        }

        return { valid: true };
    };

    // ============ FILE HANDLING ============
    const handleFiles = useCallback((newFiles: File[]) => {
        if (disabled) return;

        if (files.length + newFiles.length > maxFiles) {
            toast({
                title: 'Too many files',
                description: `Maximum ${maxFiles} files allowed`,
                variant: 'destructive',
            });
            return;
        }

        const validFiles: UploadedFile[] = [];
        const errors: string[] = [];

        newFiles.forEach(file => {
            const validation = validateFile(file);
            if (validation.valid) {
                let preview: string | undefined;
                if (file.type.startsWith('image/')) {
                    preview = URL.createObjectURL(file);
                }

                validFiles.push({
                    id: `file-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                    file,
                    description: '',
                    documentType: 'other',
                    progress: 0,
                    uploaded: true, // Mark as ready immediately
                    preview,
                });
            } else {
                errors.push(validation.error!);
            }
        });

        errors.forEach(error => {
            toast({
                title: 'File Error',
                description: error,
                variant: 'destructive',
            });
        });

        if (validFiles.length > 0) {
            onFilesChange([...files, ...validFiles]);
        }
    }, [files, maxFiles, maxFileSize, allowedTypes, toast, disabled, onFilesChange]);

    // ============ DRAG & DROP ============
    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (disabled) return;
        const droppedFiles = Array.from(e.dataTransfer.files);
        handleFiles(droppedFiles);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (disabled) return;
        const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
        handleFiles(selectedFiles);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // ============ FILE MANAGEMENT ============
    const removeFile = (id: string) => {
        const file = files.find(f => f.id === id);
        if (file?.preview) {
            URL.revokeObjectURL(file.preview);
        }
        onFilesChange(files.filter(f => f.id !== id));
    };

    const updateFileDescription = (id: string, description: string) => {
        onFilesChange(files.map(f => f.id === id ? { ...f, description } : f));
    };

    const updateFileType = (id: string, documentType: string) => {
        const validType = DOCUMENT_TYPES.includes(documentType as any) ? documentType : 'other';
        onFilesChange(files.map(f => f.id === id ? { ...f, documentType: validType } : f));
    };

    const openPreview = (file: UploadedFile) => {
        if (file.preview) {
            window.open(file.preview, '_blank');
        } else if (file.file.type === 'application/pdf') {
            const url = URL.createObjectURL(file.file);
            window.open(url, '_blank');
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
    };

    const downloadFile = (file: UploadedFile) => {
        const url = URL.createObjectURL(file.file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // ============ RENDER ============
    return (
        <div className={cn("space-y-4", className)}>
            {/* Upload Area */}
            <div
                className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center transition-colors relative",
                    isDragging && "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20",
                    disabled && "opacity-50 cursor-not-allowed bg-muted",
                    !disabled && "hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 cursor-pointer"
                )}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => !disabled && fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={disabled}
                    accept={allowedTypes.join(',')}
                />

                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">
                    Drag & drop files here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    Max {maxFiles} files, up to {formatFileSize(maxFileSize)} each
                </p>
                <div className="flex flex-wrap gap-1 justify-center mt-2">
                    <Badge variant="outline" className="text-xs">PDF</Badge>
                    <Badge variant="outline" className="text-xs">DOC/DOCX</Badge>
                    <Badge variant="outline" className="text-xs">XLS/XLSX</Badge>
                    <Badge variant="outline" className="text-xs">Images</Badge>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                    Field: <code className="bg-muted px-1 py-0.5 rounded">{fieldName}</code>
                </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                            {files.length} file{files.length !== 1 ? 's' : ''} • {formatFileSize(totalSize)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            Max {maxFiles} files
                        </span>
                    </div>
                    <Progress value={(files.length / maxFiles) * 100} className="h-1.5" />

                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {files.map((file) => (
                            <div key={file.id} className="flex items-start gap-3 p-3 border rounded-lg bg-background">
                                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 shrink-0">
                                    {file.preview && showPreview ? (
                                        <img src={file.preview} alt="Preview" className="h-8 w-8 object-cover rounded" />
                                    ) : (
                                        getFileIcon(file.file.type, file.file.name)
                                    )}
                                </div>

                                <div className="flex-1 min-w-0 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-medium text-sm truncate" title={file.file.name}>
                                                {file.file.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatFileSize(file.file.size)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            {showPreview && (file.preview || file.file.type === 'application/pdf') && (
                                                <Button type="button" variant="ghost" size="icon" onClick={() => openPreview(file)} className="h-7 w-7">
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                            <Button type="button" variant="ghost" size="icon" onClick={() => downloadFile(file)} className="h-7 w-7">
                                                <Download className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeFile(file.id)} className="h-7 w-7 text-red-500">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {showDescription && (
                                        <Input
                                            placeholder="File description (optional)"
                                            value={file.description}
                                            onChange={(e) => updateFileDescription(file.id, e.target.value)}
                                            className="text-sm h-8"
                                        />
                                    )}

                                    {showDocumentType && (
                                        <Select value={file.documentType} onValueChange={(value) => updateFileType(file.id, value)}>
                                            <SelectTrigger className="h-8 text-sm">
                                                <SelectValue placeholder="Document type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {DOCUMENT_TYPES.map((type) => (
                                                    <SelectItem key={type} value={type}>
                                                        {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <Alert className="bg-blue-50 border-blue-200">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertTitle className="text-blue-800 text-sm">Files Ready</AlertTitle>
                        <AlertDescription className="text-blue-700 text-xs">
                            Files will be uploaded when you submit the form using the <code className="bg-blue-100 px-1 py-0.5 rounded">'{fieldName}'</code> field.
                        </AlertDescription>
                    </Alert>
                </div>
            )}
        </div>
    );
};

export default FileUploadZone;