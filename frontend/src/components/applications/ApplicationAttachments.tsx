/* eslint-disable @typescript-eslint/no-explicit-any */
// components/applications/ApplicationAttachments.tsx
import React, { ReactNode, useMemo, useCallback } from 'react';
import { Application, Reference, WorkExperience, Attachment } from '@/services/applicationService';
import { applicationService } from '@/services/applicationService';
import { colorClasses } from '@/utils/color';

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
                const categoryStyle = getCategoryStyle('CV');

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
                    uploadedAt: plainCV.uploadedAt || application.createdAt,
                    categoryColor: categoryStyle.color,
                    categoryBg: categoryStyle.bg,
                    categoryBorder: categoryStyle.border
                });
            });
        }

        // 2. Process references - FIXED: Check for document attachments
        if (application.references && application.references.length > 0) {
            application.references.forEach((ref: Reference, index) => {
                // Check if reference has a document (either in document field OR in references array with providedAsDocument)
                if (ref.document) {
                    const plainDoc = convertMongooseToPlain(ref.document);
                    const categoryStyle = getCategoryStyle('Reference');

                    attachments.push({
                        id: `ref-${plainDoc._id || index}`,
                        name: plainDoc.originalName || plainDoc.filename || `Reference ${index + 1}`,
                        originalName: plainDoc.originalName || plainDoc.filename || `Reference ${index + 1}`,
                        file: plainDoc,
                        category: 'Reference',
                        description: `Reference from ${ref.name || 'Reference ' + (index + 1)}`,
                        downloadType: 'references',
                        canView: applicationService.canViewInline(plainDoc),
                        sizeLabel: applicationService.getFileSize(plainDoc),
                        fileType: getFileType(plainDoc.mimetype || '', plainDoc.filename || ''),
                        fileIcon: getFileIcon(plainDoc.mimetype || ''),
                        uploadedAt: plainDoc.uploadedAt || application.createdAt,
                        categoryColor: categoryStyle.color,
                        categoryBg: categoryStyle.bg,
                        categoryBorder: categoryStyle.border
                    });
                }
            });
        }

        // 3. Process work experience - FIXED: Check for document attachments
        if (application.workExperience && application.workExperience.length > 0) {
            application.workExperience.forEach((exp: WorkExperience, index) => {
                // Check if experience has a document
                if (exp.document) {
                    const plainDoc = convertMongooseToPlain(exp.document);
                    const categoryStyle = getCategoryStyle('Experience');

                    attachments.push({
                        id: `exp-${plainDoc._id || index}`,
                        name: plainDoc.originalName || plainDoc.filename || `Experience ${index + 1}`,
                        originalName: plainDoc.originalName || plainDoc.filename || `Experience ${index + 1}`,
                        file: plainDoc,
                        category: 'Experience',
                        description: `Work experience at ${exp.company || 'Company ' + (index + 1)}`,
                        downloadType: 'experience',
                        canView: applicationService.canViewInline(plainDoc),
                        sizeLabel: applicationService.getFileSize(plainDoc),
                        fileType: getFileType(plainDoc.mimetype || '', plainDoc.filename || ''),
                        fileIcon: getFileIcon(plainDoc.mimetype || ''),
                        uploadedAt: plainDoc.uploadedAt || application.createdAt,
                        categoryColor: categoryStyle.color,
                        categoryBg: categoryStyle.bg,
                        categoryBorder: categoryStyle.border
                    });
                }
            });
        }

        // 4. Process attachments from the application.attachments object
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

                attachments.push({
                    id: `att-${plainAtt._id || index}`,
                    name: plainAtt.originalName || plainAtt.filename || `Attachment ${index + 1}`,
                    originalName: plainAtt.originalName || plainAtt.filename || `Attachment ${index + 1}`,
                    file: plainAtt,
                    category: category,
                    description: plainAtt.description || 'Additional document',
                    downloadType: 'applications',
                    canView: applicationService.canViewInline(plainAtt),
                    sizeLabel: applicationService.getFileSize(plainAtt),
                    fileType: getFileType(plainAtt.mimetype || '', plainAtt.filename || ''),
                    fileIcon: getFileIcon(plainAtt.mimetype || ''),
                    uploadedAt: plainAtt.uploadedAt || application.createdAt,
                    categoryColor: categoryStyle.color,
                    categoryBg: categoryStyle.bg,
                    categoryBorder: categoryStyle.border
                });
            });
        }

        // 5. Fallback: Check for documents in references and experience arrays (legacy format)
        if (application.references) {
            application.references.forEach((ref, index) => {
                if (ref.document && !attachments.find(a => a.id.includes(`ref-${ref.document?._id || index}`))) {
                    const plainDoc = convertMongooseToPlain(ref.document);
                    const categoryStyle = getCategoryStyle('Reference');

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
                        uploadedAt: plainDoc.uploadedAt || application.createdAt,
                        categoryColor: categoryStyle.color,
                        categoryBg: categoryStyle.bg,
                        categoryBorder: categoryStyle.border
                    });
                }
            });
        }

        if (application.workExperience) {
            application.workExperience.forEach((exp, index) => {
                if (exp.document && !attachments.find(a => a.id.includes(`exp-${exp.document?._id || index}`))) {
                    const plainDoc = convertMongooseToPlain(exp.document);
                    const categoryStyle = getCategoryStyle('Experience');

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
                        uploadedAt: plainDoc.uploadedAt || application.createdAt,
                        categoryColor: categoryStyle.color,
                        categoryBg: categoryStyle.bg,
                        categoryBorder: categoryStyle.border
                    });
                }
            });
        }

        console.log('📁 Normalized Attachments:', attachments);
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

    const handlers: AttachmentHandlers = {
        onView: handleView,
        onDownload: handleDownload,
        onDownloadAll: handleDownloadAll
    };

    return <>{children(normalizedAttachments, handlers)}</>;
};

export const useApplicationAttachments = (application: Application) => {
    const normalizedAttachments = useMemo(() => {
        // Reuse the same logic from ApplicationAttachments component
        const attachments: NormalizedAttachment[] = [];
        
        // 1. Process selected CVs
        if (application.selectedCVs && application.selectedCVs.length > 0) {
            application.selectedCVs.forEach((cv, index) => {
                const plainCV = convertMongooseToPlain(cv);
                const categoryStyle = getCategoryStyle('CV');

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
                    uploadedAt: plainCV.uploadedAt || application.createdAt,
                    categoryColor: categoryStyle.color,
                    categoryBg: categoryStyle.bg,
                    categoryBorder: categoryStyle.border
                });
            });
        }

        // 2. Process references
        if (application.references && application.references.length > 0) {
            application.references.forEach((ref: Reference, index) => {
                if (ref.document) {
                    const plainDoc = convertMongooseToPlain(ref.document);
                    const categoryStyle = getCategoryStyle('Reference');

                    attachments.push({
                        id: `ref-${plainDoc._id || index}`,
                        name: plainDoc.originalName || plainDoc.filename || `Reference ${index + 1}`,
                        originalName: plainDoc.originalName || plainDoc.filename || `Reference ${index + 1}`,
                        file: plainDoc,
                        category: 'Reference',
                        description: `Reference from ${ref.name || 'Reference ' + (index + 1)}`,
                        downloadType: 'references',
                        canView: applicationService.canViewInline(plainDoc),
                        sizeLabel: applicationService.getFileSize(plainDoc),
                        fileType: getFileType(plainDoc.mimetype || '', plainDoc.filename || ''),
                        fileIcon: getFileIcon(plainDoc.mimetype || ''),
                        uploadedAt: plainDoc.uploadedAt || application.createdAt,
                        categoryColor: categoryStyle.color,
                        categoryBg: categoryStyle.bg,
                        categoryBorder: categoryStyle.border
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

                    attachments.push({
                        id: `exp-${plainDoc._id || index}`,
                        name: plainDoc.originalName || plainDoc.filename || `Experience ${index + 1}`,
                        originalName: plainDoc.originalName || plainDoc.filename || `Experience ${index + 1}`,
                        file: plainDoc,
                        category: 'Experience',
                        description: `Work experience at ${exp.company || 'Company ' + (index + 1)}`,
                        downloadType: 'experience',
                        canView: applicationService.canViewInline(plainDoc),
                        sizeLabel: applicationService.getFileSize(plainDoc),
                        fileType: getFileType(plainDoc.mimetype || '', plainDoc.filename || ''),
                        fileIcon: getFileIcon(plainDoc.mimetype || ''),
                        uploadedAt: plainDoc.uploadedAt || application.createdAt,
                        categoryColor: categoryStyle.color,
                        categoryBg: categoryStyle.bg,
                        categoryBorder: categoryStyle.border
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

                attachments.push({
                    id: `att-${plainAtt._id || index}`,
                    name: plainAtt.originalName || plainAtt.filename || `Attachment ${index + 1}`,
                    originalName: plainAtt.originalName || plainAtt.filename || `Attachment ${index + 1}`,
                    file: plainAtt,
                    category: category,
                    description: plainAtt.description || 'Additional document',
                    downloadType: 'applications',
                    canView: applicationService.canViewInline(plainAtt),
                    sizeLabel: applicationService.getFileSize(plainAtt),
                    fileType: getFileType(plainAtt.mimetype || '', plainAtt.filename || ''),
                    fileIcon: getFileIcon(plainAtt.mimetype || ''),
                    uploadedAt: plainAtt.uploadedAt || application.createdAt,
                    categoryColor: categoryStyle.color,
                    categoryBg: categoryStyle.bg,
                    categoryBorder: categoryStyle.border
                });
            });
        }

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