/* eslint-disable @typescript-eslint/no-explicit-any */
// components/applications/ApplicationAttachments.tsx
import React, { ReactNode, useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { Application, Reference, WorkExperience } from '@/services/applicationService';
import { applicationService } from '@/services/applicationService';
import { colorClasses } from '@/utils/color';
import { FileViewer } from '@/components/files/FileViewer';
import { useToast } from '@/hooks/use-toast';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Skeleton } from '@/components/ui/Skeleton';
import api from '@/lib/axios';

export type AttachmentCategory = 'CV' | 'Reference' | 'Experience' | 'Other';
export type DownloadType = 'cv' | 'references' | 'experience' | 'applications';

export interface NormalizedAttachment {
    id: string;
    name: string;
    originalName: string;
    file: any;
    category: AttachmentCategory;
    description: string;
    downloadType: DownloadType;
    canView: boolean;
    sizeLabel: string;
    fileType: string;
    fileIcon: string;
    uploadedAt: string;
    categoryColor: string;
    categoryBg: string;
    categoryBorder: string;
    fileId: string;
    realFileId: string;
    applicationId?: string;
    downloadUrl?: string;
    fileUrl?: string;
    fileName?: string;
    _id?: string;
    thumbnailUrl?: string;
    progress?: number;
    hasFailed?: boolean;
}

export interface AttachmentHandlers {
    onView: (attachment: NormalizedAttachment) => void;
    onDownload: (attachment: NormalizedAttachment) => void;
    onDownloadAll: () => void;
    onRetry?: (attachment: NormalizedAttachment) => void;
}

export interface ApplicationAttachmentsProps {
    application: Application;
    children: (attachments: NormalizedAttachment[], handlers: AttachmentHandlers, viewer: ReactNode) => ReactNode;
    enableCache?: boolean;
    enableAnalytics?: boolean;
    onAttachmentsChange?: (attachments: NormalizedAttachment[]) => void;
}

const getFileIcon = (fileType: string, fileUrl?: string): string => {
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('doc')) return '📝';
    if (type.includes('image')) return '🖼️';
    if (type.includes('text')) return '📃';
    return '📎';
};

const getFileType = (mimetype: string, filename: string): string => {
    if (mimetype) {
        if (mimetype.includes('pdf')) return 'PDF Document';
        if (mimetype.includes('word') || mimetype.includes('doc')) return 'Word Document';
        if (mimetype.includes('image')) return 'Image';
        if (mimetype.includes('text')) return 'Text File';
    }

    if (filename) {
        const ext = filename.toLowerCase().split('.').pop();
        if (ext === 'pdf') return 'PDF Document';
        if (['doc', 'docx'].includes(ext || '')) return 'Word Document';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return 'Image';
        if (ext === 'txt') return 'Text File';
    }

    return 'Document';
};

const convertMongooseToPlain = (doc: any): any => {
    if (!doc) return doc;
    if (doc._doc && typeof doc._doc === 'object') return { ...doc._doc };
    if (typeof doc.toObject === 'function') return doc.toObject();
    return doc;
};

const getCategoryStyle = (category: AttachmentCategory) => {
    switch (category) {
        case 'CV':
            return {
                color: 'text-blue-600 dark:text-blue-400',
                bg: 'bg-blue-50 dark:bg-blue-900/20',
                border: 'border-blue-200 dark:border-blue-800'
            };
        case 'Reference':
            return {
                color: 'text-purple-600 dark:text-purple-400',
                bg: 'bg-purple-50 dark:bg-purple-900/20',
                border: 'border-purple-200 dark:border-purple-800'
            };
        case 'Experience':
            return {
                color: 'text-emerald-600 dark:text-emerald-400',
                bg: 'bg-emerald-50 dark:bg-emerald-900/20',
                border: 'border-emerald-200 dark:border-emerald-800'
            };
        case 'Other':
            return {
                color: 'text-slate-600 dark:text-slate-400',
                bg: 'bg-slate-50 dark:bg-slate-900/20',
                border: 'border-slate-200 dark:border-slate-800'
            };
        default:
            return {
                color: 'text-slate-600 dark:text-slate-400',
                bg: 'bg-slate-50 dark:bg-slate-900/20',
                border: 'border-slate-200 dark:border-slate-800'
            };
    }
};

// Helper function to encode filename for URLs
const encodeFilename = (filename: string): string => {
    if (!filename) return '';
    return encodeURIComponent(filename);
};

// ============ UNIVERSAL DOWNLOAD PATTERN FOR ALL ATTACHMENTS ============
const downloadFileWithAuth = async (
    attachment: NormalizedAttachment,
    applicationId: string,
    fileId: string,
    filename: string
): Promise<void> => {
    try {
        console.log(`📥 Downloading file with auth: ${filename}, fileId: ${fileId}`);

        // Use the authenticated endpoint for ALL files (including CVs)
        const endpoint = `/applications/${applicationId}/files/${fileId}/download`;

        const response = await api.get(endpoint, {
            responseType: 'blob',
            timeout: 120000, // 2 minutes for large files
        });

        const blob = new Blob([response.data], {
            type: response.headers['content-type'] || 'application/octet-stream',
        });

        // Get filename from Content-Disposition header or use provided filename
        let finalFilename = filename;
        const contentDisposition = response.headers['content-disposition'];
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename\*?=['"]?(?:UTF-8'')?([^'";]*)['"]?/i);
            if (filenameMatch && filenameMatch[1]) {
                finalFilename = decodeURIComponent(filenameMatch[1]);
            }
        }

        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = finalFilename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
    } catch (error) {
        console.error('❌ Error downloading file:', error);
        throw error;
    }
};

// ============ UNIVERSAL VIEW PATTERN FOR ALL ATTACHMENTS ============
const viewFileWithAuth = async (
    attachment: NormalizedAttachment,
    applicationId: string,
    fileId: string,
    filename: string
): Promise<void> => {
    try {
        console.log(`👁️ Viewing file with auth: ${filename}, fileId: ${fileId}`);

        // Use the authenticated endpoint for ALL files (including CVs)
        const endpoint = `/applications/${applicationId}/files/${fileId}/view`;

        const response = await api.get(endpoint, {
            responseType: 'blob',
            timeout: 60000, // 1 minute for viewing
        });

        const blob = new Blob([response.data], {
            type: response.headers['content-type'] || 'application/octet-stream',
        });

        const blobUrl = window.URL.createObjectURL(blob);
        const tab = window.open(blobUrl, '_blank', 'noopener,noreferrer');

        if (!tab) {
            // Fallback if popup blocked
            window.location.href = blobUrl;
        }

        // Clean up
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
        console.error('❌ Error viewing file:', error);
        throw error;
    }
};

// File cache manager
class FileCache {
    private static instance: FileCache;
    private cache: Map<string, { blob: Blob; timestamp: number }> = new Map();
    private maxAge = 5 * 60 * 1000; // 5 minutes

    static getInstance(): FileCache {
        if (!FileCache.instance) {
            FileCache.instance = new FileCache();
        }
        return FileCache.instance;
    }

    set(key: string, blob: Blob): void {
        this.cache.set(key, { blob, timestamp: Date.now() });
    }

    get(key: string): Blob | null {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() - item.timestamp > this.maxAge) {
            this.cache.delete(key);
            return null;
        }
        
        return item.blob;
    }

    clear(): void {
        this.cache.clear();
    }
}

// Analytics tracker
const trackFileAction = (action: 'view' | 'download' | 'download_all', attachment: NormalizedAttachment, success: boolean) => {
    if (process.env.NODE_ENV === 'production') {
        console.log('📊 Analytics:', { action, category: attachment.category, fileName: attachment.name, success });
    }
};

export const ApplicationAttachments: React.FC<ApplicationAttachmentsProps> = ({
    application,
    children,
    enableCache = true,
    enableAnalytics = true,
    onAttachmentsChange
}) => {
    const [viewerOpen, setViewerOpen] = useState(false);
    const [selectedAttachment, setSelectedAttachment] = useState<NormalizedAttachment | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
    const [failedDownloads, setFailedDownloads] = useState<Record<string, boolean>>({});
    
    const { toast } = useToast();
    const isMobile = useMediaQuery('(max-width: 640px)');
    const fileCache = useRef(FileCache.getInstance());
    const abortControllers = useRef<Map<string, AbortController>>(new Map());

    // Cleanup abort controllers on unmount
    useEffect(() => {
        return () => {
            abortControllers.current.forEach(controller => controller.abort());
        };
    }, []);

    const normalizedAttachments = useMemo<NormalizedAttachment[]>(() => {
        const attachments: NormalizedAttachment[] = [];

        // Get backend URL for making absolute URLs
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

        // 1. Process selected CVs
        if (application.selectedCVs && application.selectedCVs.length > 0) {
            application.selectedCVs.forEach((cv, index) => {
                const plainCV = convertMongooseToPlain(cv);
                const categoryStyle = getCategoryStyle('CV');

                const realCvId = plainCV.cvId?.toString() ||
                                 plainCV._id?.toString() ||
                                 (plainCV as any).id?.toString();

                const filename = plainCV.filename || plainCV.fileName;
                const originalName = plainCV.originalName || plainCV.filename || 'CV';

                const displayId = realCvId ? `cv-${realCvId}` : `cv-${index}`;
                
                const encodedFilename = encodeFilename(filename || originalName);

                const fileUrl = filename ? `/uploads/cv/${encodedFilename}` : plainCV.fileUrl || plainCV.url;
                const downloadUrl = filename ? `/uploads/download/cv/${encodedFilename}` : plainCV.downloadUrl;

                const absoluteFileUrl = fileUrl?.startsWith('/') ? `${backendUrl}${fileUrl}` : fileUrl;
                const absoluteDownloadUrl = downloadUrl?.startsWith('/') ? `${backendUrl}${downloadUrl}` : downloadUrl;

                const fileSize = plainCV.size || 0;
                const sizeLabel = fileSize > 0 ? applicationService.getFileSize(fileSize) : 'Unknown size';

                attachments.push({
                    id: displayId,
                    name: originalName,
                    originalName: originalName,
                    file: plainCV,
                    category: 'CV',
                    description: `Curriculum Vitae ${index + 1}`,
                    downloadType: 'cv',
                    canView: applicationService.canViewInline(plainCV),
                    sizeLabel: sizeLabel,
                    fileType: getFileType(plainCV.mimetype || '', filename || ''),
                    fileIcon: getFileIcon(plainCV.mimetype || '', absoluteFileUrl),
                    uploadedAt: plainCV.uploadedAt || application.createdAt,
                    categoryColor: categoryStyle.color,
                    categoryBg: categoryStyle.bg,
                    categoryBorder: categoryStyle.border,
                    fileId: displayId,
                    realFileId: realCvId || '',
                    applicationId: application._id,
                    thumbnailUrl: plainCV.mimetype?.includes('image') ? absoluteFileUrl : undefined,
                    downloadUrl: absoluteDownloadUrl || absoluteFileUrl,
                    fileUrl: absoluteFileUrl,
                    fileName: filename,
                    _id: realCvId
                });
            });
        }

        // 2. Process references
        if (application.references && application.references.length > 0) {
            application.references.forEach((ref: Reference, index) => {
                if (ref.document) {
                    const plainDoc = convertMongooseToPlain(ref.document);
                    const categoryStyle = getCategoryStyle('Reference');

                    const realDocId = plainDoc._id;
                    const displayId = realDocId ? `ref-${realDocId}` : `ref-${index}`;
                    
                    const fileSize = plainDoc.size || 0;
                    const sizeLabel = fileSize > 0 ? applicationService.getFileSize(fileSize) : 'Unknown size';

                    attachments.push({
                        id: displayId,
                        name: plainDoc.originalName || plainDoc.filename || `Reference ${index + 1}`,
                        originalName: plainDoc.originalName || plainDoc.filename || `Reference ${index + 1}`,
                        file: plainDoc,
                        category: 'Reference',
                        description: `Reference from ${ref.name || 'Reference ' + (index + 1)}`,
                        downloadType: 'references',
                        canView: applicationService.canViewInline(plainDoc),
                        sizeLabel: sizeLabel,
                        fileType: getFileType(plainDoc.mimetype || '', plainDoc.filename || ''),
                        fileIcon: getFileIcon(plainDoc.mimetype || ''),
                        uploadedAt: plainDoc.uploadedAt || application.createdAt,
                        categoryColor: categoryStyle.color,
                        categoryBg: categoryStyle.bg,
                        categoryBorder: categoryStyle.border,
                        fileId: displayId,
                        realFileId: realDocId || '',
                        applicationId: application._id,
                        thumbnailUrl: plainDoc.mimetype?.includes('image') ? plainDoc.url : undefined
                    });
                }
            });
        }

        // 3. Process work experience
        if (application.workExperience && application.workExperience.length > 0) {
            application.workExperience.forEach((exp: WorkExperience, index) => {
                if (exp.document) {
                    const plainDoc = convertMongooseToPlain(exp.document);
                    const categoryStyle = getCategoryStyle('Experience');

                    const realDocId = plainDoc._id;
                    const displayId = realDocId ? `exp-${realDocId}` : `exp-${index}`;
                    
                    const fileSize = plainDoc.size || 0;
                    const sizeLabel = fileSize > 0 ? applicationService.getFileSize(fileSize) : 'Unknown size';

                    attachments.push({
                        id: displayId,
                        name: plainDoc.originalName || plainDoc.filename || `Experience ${index + 1}`,
                        originalName: plainDoc.originalName || plainDoc.filename || `Experience ${index + 1}`,
                        file: plainDoc,
                        category: 'Experience',
                        description: `Work experience at ${exp.company || 'Company ' + (index + 1)}`,
                        downloadType: 'experience',
                        canView: applicationService.canViewInline(plainDoc),
                        sizeLabel: sizeLabel,
                        fileType: getFileType(plainDoc.mimetype || '', plainDoc.filename || ''),
                        fileIcon: getFileIcon(plainDoc.mimetype || ''),
                        uploadedAt: plainDoc.uploadedAt || application.createdAt,
                        categoryColor: categoryStyle.color,
                        categoryBg: categoryStyle.bg,
                        categoryBorder: categoryStyle.border,
                        fileId: displayId,
                        realFileId: realDocId || '',
                        applicationId: application._id,
                        thumbnailUrl: plainDoc.mimetype?.includes('image') ? plainDoc.url : undefined
                    });
                }
            });
        }

        // 4. Process other attachments
        if (application.attachments) {
            const attachmentArrays = [
                ...(application.attachments.referenceDocuments || []),
                ...(application.attachments.experienceDocuments || []),
                ...(application.attachments.portfolioFiles || []),
                ...(application.attachments.otherDocuments || [])
            ];

            attachmentArrays.forEach((attachment, index) => {
                const plainAtt = convertMongooseToPlain(attachment);
                const category = plainAtt._id?.includes('ref') ? 'Reference' :
                    plainAtt._id?.includes('exp') ? 'Experience' : 'Other';
                const categoryStyle = getCategoryStyle(category);

                const realDocId = plainAtt._id;
                const displayId = realDocId ? `att-${realDocId}` : `att-${index}`;
                
                const fileSize = plainAtt.size || 0;
                const sizeLabel = fileSize > 0 ? applicationService.getFileSize(fileSize) : 'Unknown size';

                attachments.push({
                    id: displayId,
                    name: plainAtt.originalName || plainAtt.filename || `Attachment ${index + 1}`,
                    originalName: plainAtt.originalName || plainAtt.filename || `Attachment ${index + 1}`,
                    file: plainAtt,
                    category: category,
                    description: plainAtt.description || 'Additional document',
                    downloadType: 'applications',
                    canView: applicationService.canViewInline(plainAtt),
                    sizeLabel: sizeLabel,
                    fileType: getFileType(plainAtt.mimetype || '', plainAtt.filename || ''),
                    fileIcon: getFileIcon(plainAtt.mimetype || ''),
                    uploadedAt: plainAtt.uploadedAt || application.createdAt,
                    categoryColor: categoryStyle.color,
                    categoryBg: categoryStyle.bg,
                    categoryBorder: categoryStyle.border,
                    fileId: displayId,
                    realFileId: realDocId || '',
                    applicationId: application._id,
                    thumbnailUrl: plainAtt.mimetype?.includes('image') ? plainAtt.url : undefined
                });
            });
        }

        return attachments;
    }, [application]);

    // Notify parent when attachments change
    useEffect(() => {
        if (onAttachmentsChange) {
            onAttachmentsChange(normalizedAttachments);
        }
    }, [normalizedAttachments, onAttachmentsChange]);

    // FIX: Move setIsLoading to useEffect
    useEffect(() => {
        setIsLoading(false);
    }, [normalizedAttachments]);

    // FIXED: handleView now uses realFileId
    const handleView = useCallback(async (attachment: NormalizedAttachment) => {
        try {
            setDownloadProgress(prev => ({ ...prev, [attachment.id]: 0 }));
            
            console.log('👁️ Viewing attachment:', {
                id: attachment.id,
                realFileId: attachment.realFileId,
                category: attachment.category,
                name: attachment.name
            });

            if (!attachment.applicationId) {
                throw new Error('Application ID is required');
            }

            if (!attachment.realFileId) {
                throw new Error('No valid file ID found for this attachment');
            }

            // Check cache first
            if (enableCache) {
                const cacheKey = `${attachment.applicationId}_${attachment.realFileId}_view`;
                const cachedBlob = fileCache.current.get(cacheKey);
                if (cachedBlob) {
                    const url = URL.createObjectURL(cachedBlob);
                    window.open(url, '_blank', 'noopener,noreferrer');
                    setTimeout(() => URL.revokeObjectURL(url), 60000);
                    
                    if (enableAnalytics) trackFileAction('view', attachment, true);
                    setDownloadProgress(prev => ({ ...prev, [attachment.id]: 100 }));
                    return;
                }
            }

            // Create abort controller
            const controller = new AbortController();
            abortControllers.current.set(attachment.id, controller);

            // Use authenticated view endpoint with REAL file ID
            await viewFileWithAuth(
                attachment,
                attachment.applicationId,
                attachment.realFileId,
                attachment.originalName || attachment.name
            );

            setDownloadProgress(prev => ({ ...prev, [attachment.id]: 100 }));
            if (enableAnalytics) trackFileAction('view', attachment, true);
            
        } catch (error) {
            console.error('Failed to view attachment:', error);
            setFailedDownloads(prev => ({ ...prev, [attachment.id]: true }));
            
            toast({
                title: 'View Failed',
                description: error instanceof Error ? error.message : 'Failed to view file',
                variant: 'destructive',
            });
            
            if (enableAnalytics) trackFileAction('view', attachment, false);
        } finally {
            abortControllers.current.delete(attachment.id);
            setTimeout(() => {
                setDownloadProgress(prev => {
                    const newProgress = { ...prev };
                    delete newProgress[attachment.id];
                    return newProgress;
                });
                setFailedDownloads(prev => {
                    const newFailed = { ...prev };
                    delete newFailed[attachment.id];
                    return newFailed;
                });
            }, 3000);
        }
    }, [enableCache, enableAnalytics, toast]);

    const handleDownload = useCallback(async (attachment: NormalizedAttachment) => {
        try {
            setDownloadProgress(prev => ({ ...prev, [attachment.id]: 0 }));
            
            console.log('📥 Downloading attachment:', {
                id: attachment.id,
                realFileId: attachment.realFileId,
                category: attachment.category,
                name: attachment.name,
                fileName: attachment.fileName
            });

            if (!attachment.applicationId) {
                throw new Error('Application ID is required');
            }

            // Create abort controller
            const controller = new AbortController();
            abortControllers.current.set(attachment.id, controller);

            // Simulate progress for better UX
            const progressInterval = setInterval(() => {
                setDownloadProgress(prev => ({
                    ...prev,
                    [attachment.id]: Math.min((prev[attachment.id] || 0) + 20, 90)
                }));
            }, 200);

            try {
                if (attachment.category === 'CV') {
                    if (attachment.realFileId) {
                        // PRIMARY PATH: application files endpoint
                        console.log('📥 Using application endpoint with realFileId:', attachment.realFileId);
                        await downloadFileWithAuth(
                            attachment,
                            attachment.applicationId,
                            attachment.realFileId,
                            attachment.originalName || attachment.name
                        );
                    } else {
                        // FALLBACK: direct candidate CV endpoint
                        console.log('📥 Using fallback CV endpoint');
                        
                        // Get CV ID from various possible sources
                        const cvId = attachment.file?.cvId?.toString() ||
                                     attachment.file?._id?.toString() ||
                                     attachment._id?.toString();
                        
                        if (!cvId) {
                            throw new Error("No valid CV ID found. Please re-apply to refresh this CV.");
                        }
                        
                        console.log('📥 Using CV ID for fallback:', cvId);
                        
                        const response = await api.get(`/candidate/cv/${cvId}/download`, {
                            responseType: "blob",
                            timeout: 120000,
                        });
                        
                        const blob = new Blob([response.data], {
                            type: response.headers["content-type"] || "application/octet-stream"
                        });
                        
                        const blobUrl = window.URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = blobUrl;
                        link.download = attachment.originalName || attachment.name;
                        link.style.display = "none";
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
                    }
                } else {
                    // For non-CV files, we must have realFileId
                    if (!attachment.realFileId) {
                        throw new Error('No valid file ID found for this attachment');
                    }
                    
                    await downloadFileWithAuth(
                        attachment,
                        attachment.applicationId,
                        attachment.realFileId,
                        attachment.originalName || attachment.name
                    );
                }

                clearInterval(progressInterval);
                setDownloadProgress(prev => ({ ...prev, [attachment.id]: 100 }));
                
                if (enableAnalytics) trackFileAction('download', attachment, true);

            } catch (error) {
                clearInterval(progressInterval);
                throw error;
            }

        } catch (error) {
            console.error('Failed to download attachment:', error);
            setFailedDownloads(prev => ({ ...prev, [attachment.id]: true }));
            
            toast({
                title: 'Download Failed',
                description: error instanceof Error ? error.message : 'Failed to download file',
                variant: 'destructive',
            });
            
            if (enableAnalytics) trackFileAction('download', attachment, false);
        } finally {
            abortControllers.current.delete(attachment.id);
            setTimeout(() => {
                setDownloadProgress(prev => {
                    const newProgress = { ...prev };
                    delete newProgress[attachment.id];
                    return newProgress;
                });
                setFailedDownloads(prev => {
                    const newFailed = { ...prev };
                    delete newFailed[attachment.id];
                    return newFailed;
                });
            }, 3000);
        }
    }, [enableAnalytics, toast]);

    const handleRetry = useCallback((attachment: NormalizedAttachment) => {
        setFailedDownloads(prev => {
            const newFailed = { ...prev };
            delete newFailed[attachment.id];
            return newFailed;
        });
        handleDownload(attachment);
    }, [handleDownload]);

    const handleDownloadAll = useCallback(async () => {
        try {
            let successCount = 0;
            let failCount = 0;

            toast({
                title: 'Download Started',
                description: `Downloading ${normalizedAttachments.length} files...`,
                variant: 'default',
            });

            for (const attachment of normalizedAttachments) {
                try {
                    if (!attachment.applicationId || !attachment.realFileId) continue;

                    await downloadFileWithAuth(
                        attachment,
                        attachment.applicationId,
                        attachment.realFileId,
                        attachment.originalName || attachment.name
                    );
                    
                    successCount++;
                    await new Promise(resolve => setTimeout(resolve, 300));
                } catch (error) {
                    console.error(`Failed to download ${attachment.name}:`, error);
                    failCount++;
                }
            }

            toast({
                title: 'Download Complete',
                description: `Successfully downloaded ${successCount} files${failCount > 0 ? `, ${failCount} failed` : ''}`,
                variant: failCount > 0 ? 'destructive' : 'default',
            });

            if (enableAnalytics) trackFileAction('download_all', {} as NormalizedAttachment, failCount === 0);

        } catch (error) {
            console.error('Failed to download all attachments:', error);
            toast({
                title: 'Download Failed',
                description: 'Failed to download all files',
                variant: 'destructive',
            });
        }
    }, [normalizedAttachments, enableAnalytics, toast]);

    const handleSwipe = useCallback((direction: 'left' | 'right') => {
        if (!selectedAttachment || !viewerOpen) return;
        
        const currentIndex = normalizedAttachments.findIndex(a => a.id === selectedAttachment.id);
        if (currentIndex === -1) return;
        
        const nextIndex = direction === 'right' 
            ? (currentIndex + 1) % normalizedAttachments.length
            : (currentIndex - 1 + normalizedAttachments.length) % normalizedAttachments.length;
        
        setSelectedAttachment(normalizedAttachments[nextIndex]);
    }, [selectedAttachment, viewerOpen, normalizedAttachments]);

    const handlers: AttachmentHandlers = {
        onView: handleView,
        onDownload: handleDownload,
        onDownloadAll: handleDownloadAll,
        onRetry: handleRetry
    };

    // Loading skeletons
    if (isLoading) {
        return (
            <div className="space-y-4 w-full min-w-0">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4 w-full min-w-0">
                        <Skeleton className={`h-12 w-12 rounded-lg ${colorClasses.bg.gray100} shrink-0`} />
                        <div className="space-y-2 flex-1 min-w-0">
                            <Skeleton className={`h-4 w-3/4 ${colorClasses.bg.gray100}`} />
                            <Skeleton className={`h-3 w-1/2 ${colorClasses.bg.gray100}`} />
                        </div>
                        <Skeleton className={`h-8 w-8 rounded ${colorClasses.bg.gray100} shrink-0`} />
                        <Skeleton className={`h-8 w-8 rounded ${colorClasses.bg.gray100} shrink-0`} />
                    </div>
                ))}
            </div>
        );
    }

    // File Viewer component
    const fileViewer = selectedAttachment && selectedAttachment.category !== 'CV' && (
        <FileViewer
            applicationId={selectedAttachment.applicationId || ''}
            fileId={selectedAttachment.realFileId}
            fileName={selectedAttachment.name}
            fileType={selectedAttachment.fileType}
            isOpen={viewerOpen}
            onClose={() => {
                setViewerOpen(false);
                setSelectedAttachment(null);
            }}
            onDownload={() => handleDownload(selectedAttachment)}
            category={selectedAttachment.category}
        />
    );

    return (
        <div className="w-full min-w-0 overflow-hidden">
            {children(
                normalizedAttachments.map(att => ({
                    ...att,
                    progress: downloadProgress[att.id],
                    hasFailed: failedDownloads[att.id]
                })),
                handlers,
                fileViewer
            )}
        </div>
    );
};