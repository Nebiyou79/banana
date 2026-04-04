import { useState, useCallback } from 'react';
import { UploadedFile } from '@/types/fileUpload';
import { DOCUMENT_TYPES } from '@/services/tenderService';

// Format file size helper
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const useFileUpload = (maxFiles: number = 10) => {
    const [files, setFiles] = useState<UploadedFile[]>([]);

    const clearFiles = useCallback(() => {
        // Clean up preview URLs
        files.forEach(file => {
            if (file.preview) {
                URL.revokeObjectURL(file.preview);
            }
        });
        setFiles([]);
    }, [files]);

    const getFilesForSubmission = useCallback(() => {
        // Filter only files that are ready (no errors)
        const readyFiles = files.filter(f => !f.error);

        return {
            files: readyFiles.map(f => f.file),
            fileDescriptions: readyFiles.map(f => f.description),
            fileTypes: readyFiles.map(f => {
                const validTypes = DOCUMENT_TYPES as readonly string[];
                return validTypes.includes(f.documentType) ? f.documentType : 'other';
            }),
        };
    }, [files]);

    const getFileStats = useCallback(() => {
        const totalSize = files.reduce((sum, f) => sum + (f.file?.size || 0), 0);
        const errorCount = files.filter(f => f.error).length;
        const readyCount = files.filter(f => !f.error).length;

        return {
            total: files.length,
            totalSize,
            errorCount,
            readyCount,
            formattedTotalSize: formatFileSize(totalSize),
        };
    }, [files]);

    return {
        files,
        setFiles,
        clearFiles,
        getFilesForSubmission,
        getFileStats,
    };
};