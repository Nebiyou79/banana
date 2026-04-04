/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Upload, FileText, Download, Trash2, CheckCircle, AlertCircle, HardDrive, Eye, X, Star, Loader2 } from 'lucide-react';
import { CV, candidateService, validateCVFile, formatFileSize } from '@/services/candidateService';
import { colorClasses, getTheme, ThemeMode } from '@/utils/color';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '../ui/Progress';

interface CVUploadCardProps {
  cvs: CV[];
  onUpload: (files: File[]) => Promise<void>;
  onSetPrimary: (cvId: string) => Promise<void>;
  onDelete: (cvId: string) => Promise<void>;
  isUploading?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
  themeMode?: ThemeMode;
  uploadProgress?: number;
}

const CVUploadCard: React.FC<CVUploadCardProps> = ({
  cvs,
  onUpload,
  onSetPrimary,
  onDelete,
  isUploading = false,
  maxFiles = 10,
  maxSizeMB = 100,
  themeMode: externalThemeMode,
  uploadProgress = 0
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; cvId: string | null; cvName: string }>({
    isOpen: false,
    cvId: null,
    cvName: ''
  });
  const [internalThemeMode, setInternalThemeMode] = useState<ThemeMode>('light');
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: string]: number }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Use external theme mode if provided, otherwise detect internally
  const themeMode = externalThemeMode || internalThemeMode;

  // Check theme on component mount
  useEffect(() => {
    if (externalThemeMode) return;

    const checkTheme = () => {
      if (typeof window !== 'undefined') {
        const isDark = document.documentElement.classList.contains('dark');
        setInternalThemeMode(isDark ? 'dark' : 'light');
      }
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, [externalThemeMode]);

  // Generate unique key for each CV
  const generateCVKey = (cv: CV, index: number): string => {
    return `cv-${cv._id || cv.fileName || `unknown-${index}-${Date.now()}`}`;
  };

  // Enhanced file validation using service
  const handleFileSelect = (files: FileList): File[] => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Calculate available slots
    const availableSlots = Math.max(0, maxFiles - cvs.length);
    const filesToProcess = Array.from(files).slice(0, availableSlots);

    if (filesToProcess.length === 0) {
      toast({
        title: 'Maximum CVs Reached',
        description: `You have reached the maximum of ${maxFiles} CVs.`,
        variant: 'destructive',
      });
      return [];
    }

    filesToProcess.forEach(file => {
      const maxSizeBytes = maxSizeMB * 1024 * 1024;

      // Check file size
      if (file.size > maxSizeBytes) {
        errors.push(`${file.name}: File size exceeds ${maxSizeMB}MB limit`);
        return;
      }

      // Check file type by extension
      const fileExtension = `.${file.name.toLowerCase().split('.').pop()}`;
      const allowedExtensions = ['.pdf', '.doc', '.docx', '.odt', '.txt', '.rtf'];

      if (!allowedExtensions.includes(fileExtension)) {
        errors.push(`${file.name}: File type not supported. Allowed: PDF, DOC, DOCX, ODT, TXT, RTF`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      toast({
        title: 'Validation Errors',
        description: errors.slice(0, 3).join(', ') + (errors.length > 3 ? ` and ${errors.length - 3} more...` : ''),
        variant: 'destructive',
      });
    }

    if (files.length > availableSlots) {
      toast({
        title: 'Maximum Files Exceeded',
        description: `Maximum ${maxFiles} CVs allowed. Selected ${availableSlots} available files.`,
        variant: 'default',
      });
    }

    return validFiles;
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const files = event.target.files;
      if (files && files.length > 0) {
        const validFiles = handleFileSelect(files);
        if (validFiles.length > 0) {
          setSelectedFiles(prev => [...prev, ...validFiles].slice(0, maxFiles - cvs.length));
        }
      }
      // Reset input to allow selecting same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('File input change error:', error);
      toast({
        title: 'Error',
        description: 'Failed to process files',
        variant: 'destructive',
      });
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const validFiles = handleFileSelect(files);
      if (validFiles.length > 0) {
        setSelectedFiles(prev => [...prev, ...validFiles].slice(0, maxFiles - cvs.length));
      }
    }
  }, [maxFiles, cvs.length]);

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

const uploadSelectedFiles = async () => {
  if (selectedFiles.length > 0 && !isUploading) {
    try {
      // Set uploading state for each file
      const uploadStates: { [key: string]: number } = {};
      selectedFiles.forEach(file => {
        uploadStates[file.name] = 10;
      });
      setUploadingFiles(uploadStates);

      // Upload files using the service
      await onUpload(selectedFiles);
      setSelectedFiles([]);

      // Clear upload states after successful upload
      setTimeout(() => setUploadingFiles({}), 1000);

    } catch (error) {
      console.error('Upload failed in component:', error);
      setUploadingFiles({});
    }
  }
};

  const handleDeleteClick = (cvId: string | null, cvName: string) => {
    if (!cvId) {
      toast({
        title: 'Error',
        description: 'Cannot delete CV: Invalid CV ID',
        variant: 'destructive',
      });
      return;
    }

    setDeleteModal({
      isOpen: true,
      cvId,
      cvName
    });
  };

  const handleConfirmDelete = async () => {
    if (deleteModal.cvId) {
      try {
        await onDelete(deleteModal.cvId);
        toast({
          title: 'Success',
          description: 'CV deleted successfully from local storage',
          variant: 'default',
        });
      } catch (error: any) {
        console.error('Delete failed:', error);
        toast({
          title: 'Delete Error',
          description: error.message || 'Failed to delete CV',
          variant: 'destructive',
        });
      }
    }
    setDeleteModal({ isOpen: false, cvId: null, cvName: '' });
  };

  // Handle CV preview
  const handlePreview = async (cv: CV) => {
    try {
      await candidateService.viewCV(cv._id);
    } catch (error: any) {
      console.error('Preview failed:', error);
      toast({
        title: 'Preview Failed',
        description: error.message || 'Unable to preview CV at this time',
        variant: 'destructive',
      });
    }
  };

  // Handle download
  const handleDownload = async (cv: CV) => {
    try {
      await candidateService.downloadCV(cv._id, cv.originalName);
    } catch (error: any) {
      console.error('Download failed:', error);
      toast({
        title: 'Download Failed',
        description: error.message || 'Failed to download CV',
        variant: 'destructive',
      });
    }
  };

  // Handle set primary
  const handleSetPrimary = async (cv: CV) => {
    try {
      if (!cv._id) {
        toast({
          title: 'Error',
          description: 'Cannot set as primary: Invalid CV ID',
          variant: 'destructive',
        });
        return;
      }

      await onSetPrimary(cv._id);

      toast({
        title: 'Primary CV Updated',
        description: `${cv.originalName || 'CV'} is now your primary CV`,
        variant: 'default',
      });

    } catch (error: any) {
      console.error('Set primary CV error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to set primary CV',
        variant: 'destructive',
      });
    }
  };

  const primaryCv = cvs.find(cv => cv.isPrimary);

  return (
    <>
      <Card className={`w-full ${colorClasses.bg[themeMode === 'dark' ? 'gray800' : 'white']} border-0 shadow-sm overflow-hidden`}>
        <CardHeader className={`border-b ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'gray100']} bg-opacity-50 p-4 sm:p-6`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2">
              <HardDrive className={`h-5 w-5 ${colorClasses.text.blue} mt-1 shrink-0`} />
              <div>
                <CardTitle className={`text-lg ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}>
                  CV Management
                </CardTitle>
                <CardDescription className={`text-sm ${colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray800']}`}>
                  Upload and manage your CVs
                </CardDescription>
              </div>
            </div>
            <div className={`text-xs px-2 py-1 rounded-full ${colorClasses.bg.blue} bg-opacity-10 whitespace-nowrap`}>
              {cvs.length}/{maxFiles}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* Upload Area */}
          <div
            className={`
              border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer
              ${dragOver
                ? `${colorClasses.border.blue} ${colorClasses.bg[themeMode === 'dark' ? 'gray800' : 'blue']} bg-opacity-10`
                : `${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']}`
              }
              hover:border-blue-400
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.odt,.txt,.rtf"
              className="hidden"
              onChange={handleFileInputChange}
              disabled={isUploading || cvs.length >= maxFiles}
              multiple
            />
            
            {selectedFiles.length > 0 ? (
              <div className="space-y-3">
                <p className={`text-sm font-medium ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}>
                  {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={`selected-${index}`}
                      className={`flex items-center justify-between p-2 rounded-lg text-sm ${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'gray100']}`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                        <span className="truncate max-w-[150px] sm:max-w-[200px]">{file.name}</span>
                        <span className="text-xs text-gray-500 shrink-0">({formatFileSize(file.size)})</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSelectedFile(index);
                        }}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full"
                      >
                        <X className="h-3 w-3 text-gray-500 hover:text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>

                {isUploading && uploadProgress > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray800']}>Uploading...</span>
                      <span className={colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      uploadSelectedFiles();
                    }}
                    disabled={isUploading}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${colorClasses.bg.gold} ${colorClasses.text[themeMode === 'dark' ? 'darkNavy' : 'darkNavy']} hover:opacity-90 disabled:opacity-50 flex items-center justify-center`}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload {selectedFiles.length > 1 ? 'All' : ''}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFiles([]);
                    }}
                    disabled={isUploading}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']} hover:bg-gray-100 dark:hover:bg-gray-700`}
                  >
                    Clear
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-4">
                <Upload className={`h-8 w-8 mx-auto mb-2 ${colorClasses.text[themeMode === 'dark' ? 'gray400' : 'gray400']}`} />
                <p className={`text-sm font-medium ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}>
                  {isUploading ? 'Uploading...' : 'Drop files here or click to browse'}
                </p>
                <p className={`text-xs mt-1 ${colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray800']}`}>
                  PDF, DOC, DOCX, ODT, TXT, RTF (Max {maxSizeMB}MB)
                </p>
                {cvs.length >= maxFiles && (
                  <p className={`text-xs mt-2 ${colorClasses.text.red}`}>
                    Maximum {maxFiles} CVs reached
                  </p>
                )}
              </div>
            )}
          </div>

          {/* CV List */}
          {cvs.length > 0 && (
            <div className="space-y-3">
              <h3 className={`text-sm font-medium ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}>
                Your CVs ({cvs.length}/{maxFiles})
              </h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {cvs.map((cv, index) => {
                  const hasValidId = !!cv._id;
                  const fileSize = candidateService.getCVFileSize(cv);
                  
                  return (
                    <div
                      key={generateCVKey(cv, index)}
                      className={`
                        p-3 rounded-lg border transition-all
                        ${cv.isPrimary
                          ? `${colorClasses.border.blue} ${colorClasses.bg[themeMode === 'dark' ? 'blue' : 'blue']} bg-opacity-5`
                          : `${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'gray100']}`
                        }
                      `}
                    >
                      <div className="flex items-start space-x-2">
                        <FileText className={`h-4 w-4 ${colorClasses.text.blue} mt-1 shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-1">
                            <p className={`text-sm font-medium truncate ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}>
                              {cv.originalName || 'Untitled'}
                            </p>
                            {cv.isPrimary && (
                              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 shrink-0" />
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                            <span className={`text-xs ${colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray800']}`}>
                              {cv.uploadedAt ? new Date(cv.uploadedAt).toLocaleDateString() : 'Unknown date'}
                            </span>
                            <span className={`text-xs ${colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray800']}`}>
                              • {fileSize}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons - Fixed layout for all screen sizes */}
                      <div className="flex flex-wrap items-center gap-1 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        {!cv.isPrimary && hasValidId && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(cv)}
                            disabled={isUploading}
                            className={`flex-1 min-w-[80px] px-2 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-center
                              ${colorClasses.bg[themeMode === 'dark' ? 'gray800' : 'white']}
                              ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']}
                              ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}
                              hover:bg-gray-100 dark:hover:bg-gray-700 border
                            `}
                          >
                            <Star className="h-3 w-3 mr-1" />
                            Primary
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handlePreview(cv)}
                          disabled={isUploading || !hasValidId}
                          className={`flex-1 min-w-[60px] px-2 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-center
                            ${colorClasses.bg[themeMode === 'dark' ? 'gray800' : 'white']}
                            ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']}
                            ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}
                            hover:bg-gray-100 dark:hover:bg-gray-700 border
                          `}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownload(cv)}
                          disabled={isUploading || !hasValidId}
                          className={`flex-1 min-w-[70px] px-2 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-center
                            ${colorClasses.bg[themeMode === 'dark' ? 'gray800' : 'white']}
                            ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']}
                            ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}
                            hover:bg-gray-100 dark:hover:bg-gray-700 border
                          `}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </button>
                        {hasValidId && (
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(cv._id!, cv.originalName || 'CV')}
                            disabled={isUploading}
                            className={`flex-1 min-w-[60px] px-2 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-center
                              ${colorClasses.bg[themeMode === 'dark' ? 'gray800' : 'white']}
                              border border-red-200 dark:border-red-900
                              ${colorClasses.text.red}
                              hover:bg-red-50 dark:hover:bg-red-900/20
                            `}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {cvs.length === 0 && selectedFiles.length === 0 && !isUploading && (
            <div className={`p-4 rounded-lg ${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'gray100']} text-center`}>
              <AlertCircle className={`h-8 w-8 mx-auto mb-2 ${colorClasses.text[themeMode === 'dark' ? 'gray400' : 'gray400']}`} />
              <p className={`text-sm font-medium ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}>
                No CVs uploaded yet
              </p>
              <p className={`text-xs mt-1 ${colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray800']}`}>
                Upload your first CV to get started
              </p>
            </div>
          )}

          {/* Primary CV Message */}
          {primaryCv && (
            <div className={`p-3 rounded-lg ${colorClasses.bg.green} bg-opacity-10 border border-green-200 dark:border-green-900`}>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className={`text-xs font-medium ${colorClasses.text.green}`}>
                    Primary CV: {primaryCv.originalName}
                  </p>
                  <p className={`text-xs ${colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray800']} mt-0.5`}>
                    This CV will be used for job applications
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, cvId: null, cvName: '' })}
        onConfirm={handleConfirmDelete}
        title="Delete CV"
        message={`Are you sure you want to delete "${deleteModal.cvName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
};

export default CVUploadCard;