/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Upload, FileText, Download, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { CV } from '@/services/candidateService';
import { applyBgColor, applyBorderColor } from '@/utils/color';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { useToast } from '@/hooks/use-toast';

interface CVUploadCardProps {
  cvs: CV[];
  onUpload: (files: File[]) => Promise<void>;
  onSetPrimary: (cvId: string) => Promise<void>;
  onDelete: (cvId: string) => Promise<void>;
  onDownload: (cv: CV) => void;
  isUploading?: boolean;
}

const CVUploadCard: React.FC<CVUploadCardProps> = ({
  cvs,
  onUpload,
  onSetPrimary,
  onDelete,
  onDownload,
  isUploading = false
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; cvId: string | null; cvName: string }>({
    isOpen: false,
    cvId: null,
    cvName: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (files: FileList): File[] => {
    const validFiles: File[] = [];
    
    Array.from(files).forEach(file => {
      try {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (!['pdf', 'doc', 'docx'].includes(fileExtension || '')) {
          toast({
            title: 'Invalid File Type',
            description: 'Please upload only PDF, DOC, or DOCX files',
            variant: 'destructive',
          });
          return;
        }

        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: 'File Too Large',
            description: 'File size must be less than 10MB',
            variant: 'destructive',
          });
          return;
        }

        validFiles.push(file);
      } catch (error) {
        console.error('File validation error:', error);
        toast({
          title: 'File Error',
          description: 'Error validating file',
          variant: 'destructive',
        });
      }
    });

    return validFiles;
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const files = event.target.files;
      if (files && files.length > 0) {
        const validFiles = handleFileSelect(files);
        if (validFiles.length > 0) {
          setSelectedFiles(validFiles);
        }
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

  const handleSelectFileClick = () => {
    try {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    } catch (error) {
      console.error('Select file click error:', error);
      toast({
        title: 'Error',
        description: 'Failed to open file selector',
        variant: 'destructive',
      });
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    try {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(true);
    } catch (error) {
      console.error('Drag over error:', error);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    try {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
    } catch (error) {
      console.error('Drag leave error:', error);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    try {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const validFiles = handleFileSelect(files);
        if (validFiles.length > 0) {
          setSelectedFiles(validFiles);
        }
      }
    } catch (error) {
      console.error('Drop error:', error);
      toast({
        title: 'Error',
        description: 'Failed to process dropped files',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const removeSelectedFile = (index: number) => {
    try {
      setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error('Remove file error:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove file',
        variant: 'destructive',
      });
    }
  };

  const uploadSelectedFiles = async () => {
    if (selectedFiles.length > 0) {
      try {
        await onUpload(selectedFiles);
        setSelectedFiles([]);
      } catch (error) {
        // Error is already handled by the service, just reset files
        setSelectedFiles([]);
      }
    }
  };

  const handleDeleteClick = (cvId: string, cvName: string) => {
    try {
      setDeleteModal({
        isOpen: true,
        cvId,
        cvName
      });
    } catch (error) {
      console.error('Delete click error:', error);
      toast({
        title: 'Error',
        description: 'Failed to initiate delete',
        variant: 'destructive',
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteModal.cvId) {
      try {
        await onDelete(deleteModal.cvId);
      } catch (error) {
        // Error is already handled by the service
      }
    }
    setDeleteModal({ isOpen: false, cvId: null, cvName: '' });
  };

  const handleCancelDelete = () => {
    try {
      setDeleteModal({ isOpen: false, cvId: null, cvName: '' });
    } catch (error) {
      console.error('Cancel delete error:', error);
    }
  };

  const handleSetPrimary = async (cvId: string) => {
    try {
      await onSetPrimary(cvId);
    } catch (error) {
      // Error is already handled by the service
    }
  };

  const handleDownload = (cv: CV) => {
    try {
      onDownload(cv);
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download Error',
        description: 'Failed to download CV',
        variant: 'destructive',
      });
    }
  };

  const primaryCv = cvs.find(cv => cv.isPrimary);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>CV/Resume</CardTitle>
          <CardDescription>Upload your latest CVs (max 5)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drag & Drop Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragOver 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            
            {selectedFiles.length > 0 ? (
              <div className="space-y-3">
                {selectedFiles.map((file, index) => (
                  <div 
                    key={`selected-file-${index}-${file.name}-${file.size}`}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium truncate">
                          {file.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        onClick={() => removeSelectedFile(index)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex space-x-2">
                  <button
                    onClick={uploadSelectedFiles}
                    disabled={isUploading}
                    className="flex-1 px-4 py-2 text-white rounded-lg font-medium transition-all disabled:opacity-50"
                    style={applyBgColor('gold')}
                  >
                    {isUploading ? 'Uploading...' : 'Upload All'}
                  </button>
                  <button
                    onClick={() => setSelectedFiles([])}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <React.Fragment key="drag-drop-content">
                <p className="text-sm text-gray-600 mb-4">
                  Drag & drop your CVs here or click to browse
                </p>
                <button 
                  onClick={handleSelectFileClick}
                  disabled={isUploading}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  style={applyBorderColor('gold')}
                >
                  <Upload className="w-4 h-4 mr-2 inline" />
                  Select Files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleFileInputChange}
                  disabled={isUploading}
                  multiple
                />
                <p className="text-xs text-gray-500 mt-2">
                  PDF, DOC, or DOCX files (max 10MB each)
                </p>
              </React.Fragment>
            )}
          </div>

          {/* Current CVs */}
          {cvs.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Your CVs</h3>
              {cvs.map((cv) => (
                <div 
                  key={`cv-${cv._id}-${cv.originalName}`}
                  className={`border rounded-lg p-4 ${cv.isPrimary ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">{cv.originalName}</p>
                        <p className="text-sm text-gray-600">
                          Uploaded: {new Date(cv.uploadedAt).toLocaleDateString()}
                          {cv.isPrimary && <span className="ml-2 text-blue-600 font-semibold">• Primary</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {!cv.isPrimary && (
                        <button
                          onClick={() => handleSetPrimary(cv._id)}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                          style={applyBorderColor('gold')}
                        >
                          Set Primary
                        </button>
                      )}
                      <button
                        onClick={() => handleDownload(cv)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(cv._id, cv.originalName)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Status Messages */}
          {cvs.length === 0 && selectedFiles.length === 0 && (
            <div key="no-cvs-warning" className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">No CVs Uploaded</p>
                  <p className="text-sm text-yellow-600">
                    Upload your CV to apply for jobs
                  </p>
                </div>
              </div>
            </div>
          )}

          {primaryCv && (
            <div key="primary-cv-success" className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Primary CV Set</p>
                  <p className="text-sm text-green-600">
                    {primaryCv.originalName} is your primary CV for job applications
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
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete CV"
        message={`Are you sure you want to delete "${deleteModal.cvName}"? This action cannot be undone.`}
        confirmText="Delete CV"
        cancelText="Keep CV"
        variant="danger"
      />
    </>
  );
};

export default CVUploadCard;