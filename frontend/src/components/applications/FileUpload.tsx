/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { 
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
  url?: string;
}

interface FileUploadProps {
  onFileUpload: (files: File[]) => void;
  accept?: string;
  maxFiles?: number;
  maxSize?: number; // in bytes
  label?: string;
  description?: string;
  multiple?: boolean;
  showPreview?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png',
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  label = 'Upload files',
  description = 'Drag & drop files here, or click to select',
  multiple = true,
  showPreview = true
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach((rejected) => {
        rejected.errors.forEach((error: any) => {
          if (error.code === 'file-too-large') {
            toast({
              title: 'File too large',
              description: `${rejected.file.name} exceeds the maximum file size.`,
              variant: 'destructive',
            });
          } else if (error.code === 'file-invalid-type') {
            toast({
              title: 'Invalid file type',
              description: `${rejected.file.name} is not a supported file type.`,
              variant: 'destructive',
            });
          }
        });
      });
    }

    // Handle accepted files
    if (acceptedFiles.length > 0) {
      const newFiles = acceptedFiles.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        progress: 0,
        status: 'uploading' as const
      }));

      setUploadedFiles(prev => {
        const updated = [...prev, ...newFiles];
        // Limit to maxFiles
        return updated.slice(-maxFiles);
      });

      // Simulate file upload progress
      newFiles.forEach(newFile => {
        simulateUpload(newFile.id);
      });

      // Call the parent callback with all accepted files
      onFileUpload(acceptedFiles);
    }
  }, [maxFiles, onFileUpload, toast]);

  const simulateUpload = (fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, progress: 100, status: 'completed' }
            : f
        ));
      } else {
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, progress } : f
        ));
      }
    }, 200);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: accept ? {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    } : undefined,
    maxSize,
    multiple,
    noClick: true,
    noKeyboard: true
  });

  const getFileIcon = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-8 w-8 text-blue-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <FileText className="h-8 w-8 text-green-500" />;
      default:
        return <FileText className="h-8 w-8 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <Card>
        <CardContent className="pt-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }
            `}
          >
            <input {...getInputProps()} />
            
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {label}
            </h3>
            
            <p className="text-gray-500 mb-4">
              {description}
            </p>

            <div className="text-xs text-gray-400 mb-4">
              Supported formats: {accept.replace(/\./g, '').replace(/,/g, ', ')}
              <br />
              Maximum size: {formatFileSize(maxSize)}
              {maxFiles > 1 && ` • Maximum files: ${maxFiles}`}
            </div>

            <Button type="button" onClick={open} variant="outline">
              Select Files
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files List */}
      {showPreview && uploadedFiles.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h4 className="font-semibold text-gray-700 mb-4">
              Uploaded Files ({uploadedFiles.length}/{maxFiles})
            </h4>
            
            <div className="space-y-3">
              {uploadedFiles.map((uploadedFile) => (
                <div
                  key={uploadedFile.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getFileIcon(uploadedFile.file)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-medium text-sm truncate">
                          {uploadedFile.file.name}
                        </p>
                        {getStatusIcon(uploadedFile.status)}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{formatFileSize(uploadedFile.file.size)}</span>
                        <Badge 
                          variant="outline" 
                          className={`
                            ${uploadedFile.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                            ${uploadedFile.status === 'uploading' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                            ${uploadedFile.status === 'error' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                          `}
                        >
                          {uploadedFile.status.charAt(0).toUpperCase() + uploadedFile.status.slice(1)}
                        </Badge>
                      </div>

                      {uploadedFile.status === 'uploading' && (
                        <Progress 
                          value={uploadedFile.progress} 
                          className="h-1 mt-2"
                        />
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(uploadedFile.id)}
                    disabled={uploadedFile.status === 'uploading'}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Upload Progress Summary */}
            {isUploading && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-700">
                    Uploading files...
                  </span>
                  <span className="text-sm text-blue-600">
                    {uploadedFiles.filter(f => f.status === 'completed').length} / {uploadedFiles.length}
                  </span>
                </div>
                <Progress 
                  value={
                    (uploadedFiles.filter(f => f.status === 'completed').length / uploadedFiles.length) * 100
                  } 
                  className="h-2"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* File Type Help */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-gray-700 mb-3">Supported File Types</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-red-500" />
              <span>PDF Documents</span>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <span>Word Documents</span>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-green-500" />
              <span>Images (JPG, PNG)</span>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <span>Other Documents</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};