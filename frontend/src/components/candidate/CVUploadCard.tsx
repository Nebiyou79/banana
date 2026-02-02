/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Upload, FileText, Download, Trash2, CheckCircle, AlertCircle, HardDrive, Eye, ExternalLink, X, Star, Loader2 } from 'lucide-react';
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

  // Responsive design classes
  const responsiveClasses = {
    card: 'w-full max-w-6xl mx-auto',
    dragArea: 'p-4 md:p-6 lg:p-8',
    buttonGroup: 'flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2',
    fileList: 'grid grid-cols-1 md:grid-cols-2 gap-3',
    cvItem: 'flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4',
    iconSize: 'h-4 w-4 md:h-5 md:w-5',
    largeIcon: 'h-10 w-10 md:h-12 md:w-12'
  };

  // Generate unique key for each CV
  const generateCVKey = (cv: CV, index: number): string => {
    return `cv-${cv._id || cv.fileName || `unknown-${index}-${Date.now()}`}`;
  };

  // ✅ UPDATED: Enhanced file validation using service
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
        variant: 'warning',
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
          uploadStates[file.name] = 10; // Start at 10%
        });
        setUploadingFiles(uploadStates);

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

  // ✅ UPDATED: Handle CV preview using candidateService.viewCV()
  const handlePreview = (cv: CV) => {
    try {
      candidateService.viewCV(cv._id)
        .then(() => {
          console.log('Preview opened for:', cv.originalName);
        })
        .catch((error: any) => {
          console.error('Preview failed:', error);
          toast({
            title: 'Preview Failed',
            description: error.message || 'Unable to preview CV at this time',
            variant: 'destructive',
          });
        });
    } catch (error: any) {
      console.error('Preview CV error:', error);
      toast({
        title: 'Preview Error',
        description: error.message || 'Unable to preview CV at this time',
        variant: 'destructive',
      });
    }
  };

  // ✅ UPDATED: Handle download using candidateService.downloadCV()
  const handleDownload = (cv: CV) => {
    try {
      candidateService.downloadCV(cv._id, cv.originalName)
        .then(() => {
          console.log('Download initiated for:', cv.originalName);
        })
        .catch((error: any) => {
          console.error('Download failed:', error);
          toast({
            title: 'Download Failed',
            description: error.message || 'Failed to download CV',
            variant: 'destructive',
          });
        });
    } catch (error: any) {
      console.error('Download CV error:', error);
      toast({
        title: 'Download Error',
        description: error.message || 'Failed to download CV',
        variant: 'destructive',
      });
    }
  };

  // ✅ UPDATED: Handle set primary - with proper error handling
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
      <Card className={`${responsiveClasses.card} ${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'white']} ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={`${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']} text-xl md:text-2xl font-bold`}>
                CV/Resume Management
              </CardTitle>
              <CardDescription className={`${colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray800']} text-sm md:text-base`}>
                Upload and manage your CVs in local storage (max {maxFiles} files, {maxSizeMB}MB each)
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <HardDrive className="h-5 w-5 text-blue-500" />
              <span className="text-xs text-gray-500">Local Storage</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className={`space-y-4 md:space-y-6 ${responsiveClasses.dragArea}`}>
          {/* Local Storage Upload Area */}
          <div
            className={`
              border-2 border-dashed rounded-lg p-4 md:p-6 text-center transition-all cursor-pointer
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
            <div className="flex flex-col items-center justify-center space-y-3 md:space-y-4">
              <div className="relative">
                <HardDrive className={`${responsiveClasses.largeIcon} ${colorClasses.text[themeMode === 'dark' ? 'gray400' : 'gray400']}`} />
                <Upload className="absolute -bottom-1 -right-1 h-5 w-5 md:h-6 md:w-6 text-blue-500" />
              </div>

              {selectedFiles.length > 0 ? (
                <div className="w-full space-y-3">
                  <h3 className={`font-medium ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}>
                    Selected Files ({selectedFiles.length})
                  </h3>
                  <div className={responsiveClasses.fileList}>
                    {selectedFiles.map((file, index) => {
                      const fileUploadProgress = uploadingFiles[file.name] || 0;
                      const isThisFileUploading = fileUploadProgress > 0 && fileUploadProgress < 100;

                      return (
                        <div
                          key={`selected-file-${index}-${file.name}-${file.size}`}
                          className={`rounded-lg p-3 ${colorClasses.bg[themeMode === 'dark' ? 'gray800' : 'gray100']} ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 truncate">
                              <FileText className={`${responsiveClasses.iconSize} flex-shrink-0 text-blue-600`} />
                              <div className="truncate">
                                <p className={`text-sm font-medium truncate ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}>
                                  {file.name}
                                </p>
                                <p className={`text-xs ${colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray600']}`}>
                                  {formatFileSize(file.size)}
                                </p>
                              </div>
                            </div>
                            {isThisFileUploading ? (
                              <div className="flex items-center">
                                <Loader2 className="h-4 w-4 animate-spin text-blue-500 mr-2" />
                                <span className="text-xs">{fileUploadProgress}%</span>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeSelectedFile(index);
                                }}
                                className="text-gray-400 hover:text-red-500 flex-shrink-0 ml-2"
                                disabled={isUploading}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          {isThisFileUploading && (
                            <div className="mt-2">
                              <Progress value={fileUploadProgress} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Overall upload progress */}
                  {isUploading && uploadProgress > 0 && (
                    <div className="w-full">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Overall Progress</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} />
                    </div>
                  )}

                  <div className={responsiveClasses.buttonGroup}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        uploadSelectedFiles();
                      }}
                      disabled={isUploading || selectedFiles.length === 0}
                      className={`
                        px-4 py-2 md:px-6 md:py-3 text-white rounded-lg font-medium 
                        transition-all disabled:opacity-50 flex-1
                        ${colorClasses.bg.gold} ${colorClasses.text.darkNavy}
                        hover:opacity-90 hover:shadow-md disabled:cursor-not-allowed
                      `}
                    >
                      {isUploading ? (
                        <span className="flex items-center justify-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading to Server...
                        </span>
                      ) : (
                        `Upload ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFiles([]);
                      }}
                      disabled={isUploading}
                      className={`px-4 py-2 md:px-6 md:py-3 border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                        ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']}
                        ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}
                        hover:${colorClasses.bg[themeMode === 'dark' ? 'gray800' : 'gray100']}
                      `}
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className={`text-sm md:text-base ${colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray800']}`}>
                    Drag & drop your CVs here or click to browse
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.odt,.txt,.rtf"
                    className="hidden"
                    onChange={handleFileInputChange}
                    disabled={isUploading || cvs.length >= maxFiles}
                    multiple
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    disabled={isUploading || cvs.length >= maxFiles}
                    className={`
                      px-4 py-2 md:px-6 md:py-3 text-white rounded-lg font-medium 
                      transition-all disabled:opacity-50 flex-1 min-h-[44px] flex items-center justify-center
                      ${colorClasses.bg.gold} ${colorClasses.text.darkNavy}
                      hover:opacity-90 hover:shadow-md disabled:cursor-not-allowed
                    `}
                  >
                    {isUploading ? (
                      <span className="flex items-center justify-center">
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Uploading...
                      </span>
                    ) : cvs.length >= maxFiles ? (
                      `Maximum ${maxFiles} CVs Reached`
                    ) : (
                      'Browse Files'
                    )}
                  </button>
                  <p className={`text-xs md:text-sm ${colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray600']}`}>
                    Supported: PDF, DOC, DOCX, ODT, TXT, RTF • Max {maxSizeMB}MB each
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Current CVs from Local Storage */}
          {cvs.length > 0 && (
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center justify-between">
                <h3 className={`font-medium text-lg ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}>
                  Your CVs ({cvs.length}/{maxFiles})
                </h3>
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <HardDrive className="h-3 w-3" />
                  <span>Stored on Server</span>
                </div>
              </div>
              <div className="space-y-3">
                {cvs.map((cv, index) => {
                  const fileExtension = candidateService.getCVFileExtension(cv);
                  const fileSize = candidateService.getCVFileSize(cv);
                  const cvKey = generateCVKey(cv, index);
                  const hasValidId = !!cv._id;
                  const previewUrl = candidateService.getCVPreviewUrl(cv);
                  const downloadUrl = candidateService.getCVDownloadUrl(cv);
                  const hasValidUrls = candidateService.isCVUrlValid(cv);

                  return (
                    <div
                      key={cvKey}
                      className={`
                        rounded-lg p-4 transition-all ${responsiveClasses.cvItem}
                        ${cv.isPrimary
                          ? `border-2 border-blue-300 ${colorClasses.bg[themeMode === 'dark' ? 'blue' : 'blue']} bg-opacity-10`
                          : `${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']}`
                        }
                        ${colorClasses.bg[themeMode === 'dark' ? 'gray800' : 'gray100']}
                      `}
                    >
                      <div className="flex items-start space-x-3 mb-3 sm:mb-0">
                        <FileText className={`${responsiveClasses.iconSize} md:h-6 md:w-6 text-blue-600 flex-shrink-0`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <p className={`font-medium truncate ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}>
                              {cv.originalName || 'Untitled CV'}
                            </p>
                            {cv.isPrimary && (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className={`text-xs md:text-sm ${colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray600']}`}>
                              {cv.uploadedAt ? new Date(cv.uploadedAt).toLocaleDateString() : 'Unknown date'}
                            </span>
                            {hasValidUrls && (
                              <span className={`text-xs px-2 py-1 rounded-full flex items-center
                                ${colorClasses.bg[themeMode === 'dark' ? 'gray800' : 'gray100']}
                                ${colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray800']}
                              `}>
                                <HardDrive className="h-3 w-3 mr-1" />
                                Server Storage
                              </span>
                            )}
                            {!hasValidId && (
                              <span className={`text-xs px-2 py-1 rounded-full
                                ${colorClasses.bg[themeMode === 'dark' ? 'orange' : 'orange']} bg-opacity-20
                                ${colorClasses.text[themeMode === 'dark' ? 'orange' : 'orange']}
                              `}>
                                • ID Issue
                              </span>
                            )}
                          </div>
                          <p className={`text-xs ${colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray600']} mt-1`}>
                            Format: {fileExtension} • Size: {fileSize}
                          </p>
                          {(cv.downloadCount || cv.viewCount) && (
                            <p className={`text-xs mt-1 ${colorClasses.text[themeMode === 'dark' ? 'gray400' : 'gray600']}`}>
                              {cv.downloadCount ? `Downloads: ${cv.downloadCount}` : ''}
                              {cv.downloadCount && cv.viewCount ? ' • ' : ''}
                              {cv.viewCount ? `Views: ${cv.viewCount}` : ''}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mt-3 sm:mt-0">
                        {!cv.isPrimary && hasValidId && (
                          <button
                            onClick={() => handleSetPrimary(cv)}
                            disabled={isUploading}
                            className={`px-3 py-1 text-sm border rounded-lg transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed
                              ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']}
                              ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}
                              hover:${colorClasses.bg[themeMode === 'dark' ? 'gray800' : 'gray100']}
                            `}
                            title="Set as primary CV"
                          >
                            <Star className="h-3 w-3 mr-1" />
                            Set Primary
                          </button>
                        )}
                        <button
                          onClick={() => handlePreview(cv)}
                          disabled={!previewUrl || isUploading || !hasValidUrls}
                          className={`p-2 transition-colors ${colorClasses.text[themeMode === 'dark' ? 'gray400' : 'gray400']} hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed`}
                          title="Preview CV in browser"
                        >
                          <Eye className={`${responsiveClasses.iconSize}`} />
                        </button>
                        {/* Download button - uses candidateService.downloadCV() */}
                        <button
                          onClick={() => handleDownload(cv)}
                          disabled={!downloadUrl || isUploading || !hasValidUrls}
                          className={`p-2 transition-colors ${colorClasses.text[themeMode === 'dark' ? 'gray400' : 'gray400']} hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed`}
                          title="Download CV"
                        >
                          <Download className={`${responsiveClasses.iconSize}`} />
                        </button>
                        {hasValidId && (
                          <button
                            onClick={() => handleDeleteClick(cv._id!, cv.originalName || 'CV')}
                            disabled={isUploading}
                            className={`p-2 transition-colors ${colorClasses.text[themeMode === 'dark' ? 'gray400' : 'gray400']} hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed`}
                            title="Delete CV from server"
                          >
                            <Trash2 className={`${responsiveClasses.iconSize}`} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Status Messages */}
          {cvs.length === 0 && selectedFiles.length === 0 && !isUploading && (
            <div className={`rounded-lg p-4 ${colorClasses.bg[themeMode === 'dark' ? 'gray800' : 'gray100']} ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']}`}>
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-6 w-6 md:h-8 md:w-8 text-yellow-600" />
                <div>
                  <p className={`font-medium ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}>
                    No CVs Uploaded
                  </p>
                  <p className={`text-sm ${colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray600']}`}>
                    Upload your CV to apply for jobs. Your CVs are securely stored on our server.
                  </p>
                </div>
              </div>
            </div>
          )}

          {primaryCv && (
            <div className={`rounded-lg p-4 ${colorClasses.bg.teal} bg-opacity-10 border border-teal-200 dark:border-teal-800`}>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-300">
                    Primary CV Set
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    {primaryCv.originalName} is your primary CV for job applications
                  </p>
                  {/* Show storage status for primary CV */}
                  {candidateService.isCVUrlValid(primaryCv) && (
                    <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                      Stored on server: {primaryCv.fileName || 'Unknown filename'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Local Storage Info */}
          <div className={`rounded-lg p-4 ${colorClasses.bg[themeMode === 'dark' ? 'gray800' : 'gray100']} ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']}`}>
            <div className="flex items-center space-x-2">
              <HardDrive className="h-5 w-5 text-blue-500" />
              <span className={`text-sm font-medium ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}>
                Local Storage Features
              </span>
            </div>
            <p className={`text-xs ${colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray600']} mt-2`}>
              Your CVs are securely stored on our server with direct file access. All uploaded files are processed through our backend system with optimized URLs for download and preview.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className={`text-xs px-2 py-1 rounded-full ${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'white']} border ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']}`}>
                Max {maxSizeMB}MB per file
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'white']} border ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']}`}>
                6 file types supported
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'white']} border ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']}`}>
                Direct file access
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'white']} border ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']}`}>
                Instant preview & download
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, cvId: null, cvName: '' })}
        onConfirm={handleConfirmDelete}
        title="Delete CV from Server"
        message={`Are you sure you want to delete "${deleteModal.cvName}"? This will permanently remove the file from server storage.`}
        confirmText="Delete CV"
        cancelText="Keep CV"
        variant="danger"
      />
    </>
  );
};

export default CVUploadCard;