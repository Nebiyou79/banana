export interface UploadedFile {
    id: string;
    file: File;
    description: string;
    documentType: string;
    progress?: number;
    error?: string;
    uploaded?: boolean;
    preview?: string;
}