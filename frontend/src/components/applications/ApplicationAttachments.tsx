// components/attachments/ApplicationAttachments.tsx
import React, { ReactNode, useMemo, useCallback } from 'react';
import { Application, Reference, WorkExperience, Attachment, CV } from '@/services/applicationService';
import { applicationService } from '@/services/applicationService';

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
}

export interface AttachmentHandlers {
    onView: (attachment: NormalizedAttachment) => void;
    onDownload: (attachment: NormalizedAttachment) => void;
    onDownloadAll: () => void;
}

export interface ApplicationAttachmentsProps {
    application: Application;
    children: (attachments: NormalizedAttachment[], handlers: AttachmentHandlers) => ReactNode;
}

const getFileIcon = (fileType: string): string => {
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
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'Image';
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

export const ApplicationAttachments: React.FC<ApplicationAttachmentsProps> = ({
    application,
    children
}) => {
    const normalizedAttachments = useMemo<NormalizedAttachment[]>(() => {
        const attachments: NormalizedAttachment[] = [];

        // 1. Process selected CVs
        if (application.selectedCVs && application.selectedCVs.length > 0) {
            application.selectedCVs.forEach((cv, index) => {
                const plainCV = convertMongooseToPlain(cv);
                const size = plainCV.size || 0;

                attachments.push({
                    id: `cv-${plainCV.cvId || plainCV._id || index}`,
                    name: plainCV.originalName || plainCV.filename || 'CV',
                    originalName: plainCV.originalName || plainCV.filename || 'CV',
                    file: plainCV,
                    category: 'CV',
                    description: `Curriculum Vitae ${index + 1}`,
                    downloadType: 'cv',
                    canView: applicationService.canViewInline(plainCV),
                    sizeLabel: applicationService.getFileSize(plainCV),
                    fileType: getFileType(plainCV.mimetype || '', plainCV.filename || ''),
                    fileIcon: getFileIcon(plainCV.mimetype || ''),
                    uploadedAt: plainCV.uploadedAt || application.createdAt
                });
            });
        }

        // 2. Process reference documents (only if providedAsDocument is true)
        if (application.references && application.references.length > 0) {
            application.references.forEach((ref: Reference, index) => {
                if (ref.providedAsDocument && ref.document) {
                    const plainDoc = convertMongooseToPlain(ref.document);
                    const size = plainDoc.size || 0;

                    attachments.push({
                        id: `ref-${plainDoc._id || index}`,
                        name: plainDoc.originalName || plainDoc.filename || `Reference ${index + 1}`,
                        originalName: plainDoc.originalName || plainDoc.filename || `Reference ${index + 1}`,
                        file: plainDoc,
                        category: 'Reference',
                        description: `Reference from ${ref.name || 'Unknown'}`,
                        downloadType: 'references',
                        canView: applicationService.canViewInline(plainDoc),
                        sizeLabel: applicationService.getFileSize(plainDoc),
                        fileType: getFileType(plainDoc.mimetype || '', plainDoc.filename || ''),
                        fileIcon: getFileIcon(plainDoc.mimetype || ''),
                        uploadedAt: plainDoc.uploadedAt || application.createdAt
                    });
                }
            });
        }

        // 3. Process experience documents (only if providedAsDocument is true)
        if (application.workExperience && application.workExperience.length > 0) {
            application.workExperience.forEach((exp: WorkExperience, index) => {
                if (exp.providedAsDocument && exp.document) {
                    const plainDoc = convertMongooseToPlain(exp.document);
                    const size = plainDoc.size || 0;

                    attachments.push({
                        id: `exp-${plainDoc._id || index}`,
                        name: plainDoc.originalName || plainDoc.filename || `Experience ${index + 1}`,
                        originalName: plainDoc.originalName || plainDoc.filename || `Experience ${index + 1}`,
                        file: plainDoc,
                        category: 'Experience',
                        description: `Experience at ${exp.company || 'Unknown Company'}`,
                        downloadType: 'experience',
                        canView: applicationService.canViewInline(plainDoc),
                        sizeLabel: applicationService.getFileSize(plainDoc),
                        fileType: getFileType(plainDoc.mimetype || '', plainDoc.filename || ''),
                        fileIcon: getFileIcon(plainDoc.mimetype || ''),
                        uploadedAt: plainDoc.uploadedAt || application.createdAt
                    });
                }
            });
        }

        // 4. Process other attachments
        const allAttachments = applicationService.getAllAttachments(application);
        allAttachments.forEach((attachment: Attachment, index) => {
            const plainAtt = convertMongooseToPlain(attachment);
            const size = plainAtt.size || 0;

            attachments.push({
                id: `att-${plainAtt._id || index}`,
                name: plainAtt.originalName || plainAtt.filename || `Attachment ${index + 1}`,
                originalName: plainAtt.originalName || plainAtt.filename || `Attachment ${index + 1}`,
                file: plainAtt,
                category: 'Other',
                description: plainAtt.description || 'Additional document',
                downloadType: 'applications',
                canView: applicationService.canViewInline(plainAtt),
                sizeLabel: applicationService.getFileSize(plainAtt),
                fileType: getFileType(plainAtt.mimetype || '', plainAtt.filename || ''),
                fileIcon: getFileIcon(plainAtt.mimetype || ''),
                uploadedAt: plainAtt.uploadedAt || application.createdAt
            });
        });

        return attachments;
    }, [application]);

    const handleView = useCallback(async (attachment: NormalizedAttachment) => {
        try {
            await applicationService.viewFile(attachment.file, attachment.downloadType);
        } catch (error) {
            console.error('Failed to view attachment:', error);
            throw error;
        }
    }, []);

    const handleDownload = useCallback(async (attachment: NormalizedAttachment) => {
        try {
            await applicationService.downloadFile(attachment.file, attachment.downloadType);
        } catch (error) {
            console.error('Failed to download attachment:', error);
            throw error;
        }
    }, []);

    const handleDownloadAll = useCallback(async () => {
        try {
            for (const attachment of normalizedAttachments) {
                await applicationService.downloadFile(attachment.file, attachment.downloadType);
                // Small delay to prevent overwhelming the browser
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        } catch (error) {
            console.error('Failed to download all attachments:', error);
            throw error;
        }
    }, [normalizedAttachments]);

    const handlers: AttachmentHandlers = {
        onView: handleView,
        onDownload: handleDownload,
        onDownloadAll: handleDownloadAll
    };

    return <>{children(normalizedAttachments, handlers)}</>;
};

// Helper hook for direct usage (CORRECTED)
export const useApplicationAttachments = (application: Application) => {
    const normalizedAttachments = useMemo(() => {
        // Move the normalization logic here
        const attachments: NormalizedAttachment[] = [];

        // 1. Process selected CVs
        if (application.selectedCVs && application.selectedCVs.length > 0) {
            application.selectedCVs.forEach((cv, index) => {
                const plainCV = convertMongooseToPlain(cv);
                const size = plainCV.size || 0;

                attachments.push({
                    id: `cv-${plainCV.cvId || plainCV._id || index}`,
                    name: plainCV.originalName || plainCV.filename || 'CV',
                    originalName: plainCV.originalName || plainCV.filename || 'CV',
                    file: plainCV,
                    category: 'CV',
                    description: `Curriculum Vitae ${index + 1}`,
                    downloadType: 'cv',
                    canView: applicationService.canViewInline(plainCV),
                    sizeLabel: applicationService.getFileSize(plainCV),
                    fileType: getFileType(plainCV.mimetype || '', plainCV.filename || ''),
                    fileIcon: getFileIcon(plainCV.mimetype || ''),
                    uploadedAt: plainCV.uploadedAt || application.createdAt
                });
            });
        }

        // 2. Process reference documents
        if (application.references && application.references.length > 0) {
            application.references.forEach((ref: Reference, index) => {
                if (ref.providedAsDocument && ref.document) {
                    const plainDoc = convertMongooseToPlain(ref.document);
                    const size = plainDoc.size || 0;

                    attachments.push({
                        id: `ref-${plainDoc._id || index}`,
                        name: plainDoc.originalName || plainDoc.filename || `Reference ${index + 1}`,
                        originalName: plainDoc.originalName || plainDoc.filename || `Reference ${index + 1}`,
                        file: plainDoc,
                        category: 'Reference',
                        description: `Reference from ${ref.name || 'Unknown'}`,
                        downloadType: 'references',
                        canView: applicationService.canViewInline(plainDoc),
                        sizeLabel: applicationService.getFileSize(plainDoc),
                        fileType: getFileType(plainDoc.mimetype || '', plainDoc.filename || ''),
                        fileIcon: getFileIcon(plainDoc.mimetype || ''),
                        uploadedAt: plainDoc.uploadedAt || application.createdAt
                    });
                }
            });
        }

        // 3. Process experience documents
        if (application.workExperience && application.workExperience.length > 0) {
            application.workExperience.forEach((exp: WorkExperience, index) => {
                if (exp.providedAsDocument && exp.document) {
                    const plainDoc = convertMongooseToPlain(exp.document);
                    const size = plainDoc.size || 0;

                    attachments.push({
                        id: `exp-${plainDoc._id || index}`,
                        name: plainDoc.originalName || plainDoc.filename || `Experience ${index + 1}`,
                        originalName: plainDoc.originalName || plainDoc.filename || `Experience ${index + 1}`,
                        file: plainDoc,
                        category: 'Experience',
                        description: `Experience at ${exp.company || 'Unknown Company'}`,
                        downloadType: 'experience',
                        canView: applicationService.canViewInline(plainDoc),
                        sizeLabel: applicationService.getFileSize(plainDoc),
                        fileType: getFileType(plainDoc.mimetype || '', plainDoc.filename || ''),
                        fileIcon: getFileIcon(plainDoc.mimetype || ''),
                        uploadedAt: plainDoc.uploadedAt || application.createdAt
                    });
                }
            });
        }

        // 4. Process other attachments
        const allAttachments = applicationService.getAllAttachments(application);
        allAttachments.forEach((attachment: Attachment, index) => {
            const plainAtt = convertMongooseToPlain(attachment);
            const size = plainAtt.size || 0;

            attachments.push({
                id: `att-${plainAtt._id || index}`,
                name: plainAtt.originalName || plainAtt.filename || `Attachment ${index + 1}`,
                originalName: plainAtt.originalName || plainAtt.filename || `Attachment ${index + 1}`,
                file: plainAtt,
                category: 'Other',
                description: plainAtt.description || 'Additional document',
                downloadType: 'applications',
                canView: applicationService.canViewInline(plainAtt),
                sizeLabel: applicationService.getFileSize(plainAtt),
                fileType: getFileType(plainAtt.mimetype || '', plainAtt.filename || ''),
                fileIcon: getFileIcon(plainAtt.mimetype || ''),
                uploadedAt: plainAtt.uploadedAt || application.createdAt
            });
        });

        return attachments;
    }, [application]);

    const handleView = useCallback(async (attachment: NormalizedAttachment) => {
        try {
            await applicationService.viewFile(attachment.file, attachment.downloadType);
        } catch (error) {
            console.error('Failed to view attachment:', error);
            throw error;
        }
    }, []);

    const handleDownload = useCallback(async (attachment: NormalizedAttachment) => {
        try {
            await applicationService.downloadFile(attachment.file, attachment.downloadType);
        } catch (error) {
            console.error('Failed to download attachment:', error);
            throw error;
        }
    }, []);

    const handleDownloadAll = useCallback(async () => {
        try {
            for (const attachment of normalizedAttachments) {
                await applicationService.downloadFile(attachment.file, attachment.downloadType);
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        } catch (error) {
            console.error('Failed to download all attachments:', error);
            throw error;
        }
    }, [normalizedAttachments]);

    return {
        attachments: normalizedAttachments,
        handlers: {
            onView: handleView,
            onDownload: handleDownload,
            onDownloadAll: handleDownloadAll
        }
    };
};

// Alternative export for the normalization logic alone
export const normalizeApplicationAttachments = (application: Application): NormalizedAttachment[] => {
    const attachments: NormalizedAttachment[] = [];

    // 1. Process selected CVs
    if (application.selectedCVs && application.selectedCVs.length > 0) {
        application.selectedCVs.forEach((cv, index) => {
            const plainCV = convertMongooseToPlain(cv);
            const size = plainCV.size || 0;

            attachments.push({
                id: `cv-${plainCV.cvId || plainCV._id || index}`,
                name: plainCV.originalName || plainCV.filename || 'CV',
                originalName: plainCV.originalName || plainCV.filename || 'CV',
                file: plainCV,
                category: 'CV',
                description: `Curriculum Vitae ${index + 1}`,
                downloadType: 'cv',
                canView: applicationService.canViewInline(plainCV),
                sizeLabel: applicationService.getFileSize(plainCV),
                fileType: getFileType(plainCV.mimetype || '', plainCV.filename || ''),
                fileIcon: getFileIcon(plainCV.mimetype || ''),
                uploadedAt: plainCV.uploadedAt || application.createdAt
            });
        });
    }

    // 2. Process reference documents
    if (application.references && application.references.length > 0) {
        application.references.forEach((ref: Reference, index) => {
            if (ref.providedAsDocument && ref.document) {
                const plainDoc = convertMongooseToPlain(ref.document);
                const size = plainDoc.size || 0;

                attachments.push({
                    id: `ref-${plainDoc._id || index}`,
                    name: plainDoc.originalName || plainDoc.filename || `Reference ${index + 1}`,
                    originalName: plainDoc.originalName || plainDoc.filename || `Reference ${index + 1}`,
                    file: plainDoc,
                    category: 'Reference',
                    description: `Reference from ${ref.name || 'Unknown'}`,
                    downloadType: 'references',
                    canView: applicationService.canViewInline(plainDoc),
                    sizeLabel: applicationService.getFileSize(plainDoc),
                    fileType: getFileType(plainDoc.mimetype || '', plainDoc.filename || ''),
                    fileIcon: getFileIcon(plainDoc.mimetype || ''),
                    uploadedAt: plainDoc.uploadedAt || application.createdAt
                });
            }
        });
    }

    // 3. Process experience documents
    if (application.workExperience && application.workExperience.length > 0) {
        application.workExperience.forEach((exp: WorkExperience, index) => {
            if (exp.providedAsDocument && exp.document) {
                const plainDoc = convertMongooseToPlain(exp.document);
                const size = plainDoc.size || 0;

                attachments.push({
                    id: `exp-${plainDoc._id || index}`,
                    name: plainDoc.originalName || plainDoc.filename || `Experience ${index + 1}`,
                    originalName: plainDoc.originalName || plainDoc.filename || `Experience ${index + 1}`,
                    file: plainDoc,
                    category: 'Experience',
                    description: `Experience at ${exp.company || 'Unknown Company'}`,
                    downloadType: 'experience',
                    canView: applicationService.canViewInline(plainDoc),
                    sizeLabel: applicationService.getFileSize(plainDoc),
                    fileType: getFileType(plainDoc.mimetype || '', plainDoc.filename || ''),
                    fileIcon: getFileIcon(plainDoc.mimetype || ''),
                    uploadedAt: plainDoc.uploadedAt || application.createdAt
                });
            }
        });
    }

    // 4. Process other attachments
    const allAttachments = applicationService.getAllAttachments(application);
    allAttachments.forEach((attachment: Attachment, index) => {
        const plainAtt = convertMongooseToPlain(attachment);
        const size = plainAtt.size || 0;

        attachments.push({
            id: `att-${plainAtt._id || index}`,
            name: plainAtt.originalName || plainAtt.filename || `Attachment ${index + 1}`,
            originalName: plainAtt.originalName || plainAtt.filename || `Attachment ${index + 1}`,
            file: plainAtt,
            category: 'Other',
            description: plainAtt.description || 'Additional document',
            downloadType: 'applications',
            canView: applicationService.canViewInline(plainAtt),
            sizeLabel: applicationService.getFileSize(plainAtt),
            fileType: getFileType(plainAtt.mimetype || '', plainAtt.filename || ''),
            fileIcon: getFileIcon(plainAtt.mimetype || ''),
            uploadedAt: plainAtt.uploadedAt || application.createdAt
        });
    });

    return attachments;
};