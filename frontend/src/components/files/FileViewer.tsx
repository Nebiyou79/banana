// components/files/FileViewer.tsx
import React, { useState, useEffect } from 'react';
import { applicationService } from '@/services/applicationService';
import { Button } from '@/components/social/ui/Button';
import { X, Download, ZoomIn, ZoomOut, RotateCw, Loader2, AlertCircle, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';

interface FileViewerProps {
  applicationId?: string; // Optional for CVs
  fileId: string;
  fileName: string;
  fileType: string;
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  category?: 'CV' | 'Reference' | 'Experience' | 'Other';
}

export const FileViewer: React.FC<FileViewerProps> = ({
  applicationId,
  fileId,
  fileName,
  fileType,
  isOpen,
  onClose,
  onDownload,
  category = 'Other'
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  // Clean file ID (remove prefixes)
  const cleanFileId = fileId.replace(/^(cv-|ref-|exp-|att-)/, '');

  useEffect(() => {
    if (isOpen && cleanFileId) {
      loadFile();
    }

    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
    };
  }, [isOpen, cleanFileId, applicationId, retryCount]);

  const loadFile = async () => {
    try {
      setLoading(true);
      setError(null);
      setBlobUrl(null);

      console.log('📥 Loading file for viewing:', {
        applicationId: applicationId || 'N/A (CV)',
        fileId: cleanFileId,
        fileName,
        category
      });

      let blob;

      // Handle different file types
      if (category === 'CV' || !applicationId) {
        // This is a CV - use CV endpoint
        console.log('📄 Loading CV file...');
        blob = await applicationService.viewCVFile(cleanFileId);
      } else {
        // This is an application file
        console.log('📎 Loading application file...');
        blob = await applicationService.viewApplicationFile(applicationId, cleanFileId);
      }

      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      console.log('✅ File loaded successfully');
    } catch (err: any) {
      console.error('❌ Failed to load file:', err);

      // More specific error messages
      if (err.message?.includes('401') || err.message?.includes('Authentication')) {
        setError('Authentication required. Please log in again.');
      } else if (err.message?.includes('403') || err.message?.includes('permission')) {
        setError('You do not have permission to view this file.');
      } else if (err.message?.includes('404') || err.message?.includes('not found')) {
        setError('File not found. It may have been moved or deleted.');
      } else if (err.message?.includes('400') || err.message?.includes('inline')) {
        setError('This file type cannot be viewed inline. Please download it.');
      } else {
        setError(err.message || 'Failed to load file. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleRetry = () => setRetryCount(prev => prev + 1);

  const canViewInline = () => {
    const inlineTypes = [
      'PDF Document',
      'Image',
      'Text File',
      'application/pdf',
      'image/',
      'text/'
    ];

    return inlineTypes.some(type =>
      fileType?.includes(type) ||
      fileType?.toLowerCase().includes(type.toLowerCase())
    );
  };

  const renderFileContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-96">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-600 font-medium">Loading file...</p>
          <p className="text-gray-500 text-sm mt-2 max-w-md text-center">
            {fileName}
          </p>
          <p className="text-gray-400 text-xs mt-4">
            This may take a few seconds
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 p-8">
          <div className="bg-red-50 rounded-full p-4 mb-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <p className="text-red-600 font-semibold text-center mb-2">Failed to Load File</p>
          <p className="text-gray-600 text-sm text-center mb-6 max-w-md">
            {error}
          </p>
          <p className="text-gray-500 text-xs text-center mb-6">
            File: {fileName} • {fileType || 'Unknown type'}
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleRetry}
              className="flex items-center gap-2"
            >
              <Loader2 className="h-4 w-4" />
              Retry
            </Button>
            <Button
              onClick={onDownload}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              Download Instead
            </Button>
          </div>
        </div>
      );
    }

    if (!blobUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-96">
          <div className="bg-gray-100 rounded-full p-4 mb-4">
            <FileText className="h-12 w-12 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium mb-2">No file loaded</p>
          <Button
            variant="outline"
            onClick={handleRetry}
            className="mt-4"
          >
            Load File
          </Button>
        </div>
      );
    }

    // PDF Viewer
    if (fileType?.includes('pdf') || fileType?.includes('PDF') || fileName?.toLowerCase().endsWith('.pdf')) {
      return (
        <div className="h-full w-full flex flex-col">
          <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden">
            <iframe
              src={`${blobUrl}#toolbar=0&navpanes=0`}
              title={fileName}
              className="w-full h-full border-0"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: '0 0',
                width: zoom > 1 ? `${100 / zoom}%` : '100%',
                height: zoom > 1 ? `${100 / zoom}%` : '100%'
              }}
            />
          </div>
        </div>
      );
    }

    // Image Viewer
    if (fileType?.includes('image') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName)) {
      return (
        <div className="flex items-center justify-center h-full overflow-auto bg-gray-100 rounded-lg p-4">
          <img
            src={blobUrl}
            alt={fileName}
            className="max-w-full max-h-full object-contain transition-all duration-200"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center'
            }}
          />
        </div>
      );
    }

    // Text File Viewer
    if (fileType?.includes('text') || /\.(txt|html|css|js|json|xml|md)$/i.test(fileName)) {
      return (
        <div className="h-full w-full bg-white rounded-lg border">
          <iframe
            src={blobUrl}
            title={fileName}
            className="w-full h-full border-0"
          />
        </div>
      );
    }

    // Default/unknown file type
    return (
      <div className="flex flex-col items-center justify-center h-96 p-8">
        <div className="bg-yellow-50 rounded-full p-4 mb-4">
          <FileText className="h-12 w-12 text-yellow-500" />
        </div>
        <p className="text-gray-800 font-semibold text-center mb-2">
          Preview Not Available
        </p>
        <p className="text-gray-600 text-sm text-center mb-6 max-w-md">
          This file type ({fileType || 'Unknown'}) cannot be previewed in the browser.
        </p>
        <Button
          onClick={onDownload}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          <Download className="h-5 w-5" />
          Download File
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl w-full h-[90vh] p-0 flex flex-col gap-0">
        <DialogHeader className="p-4 border-b shrink-0 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-semibold truncate pr-4">
                {fileName}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-1">
                {category} • {fileType || 'Document'} • {applicationId ? 'Application File' : 'CV'}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {/* Controls - Only show for PDFs and Images */}
              {(fileType?.includes('pdf') || fileType?.includes('image')) && blobUrl && !loading && !error && (
                <div className="flex items-center gap-1 mr-4 border-r pr-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.5}
                    title="Zoom Out"
                    className="h-8 w-8"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-600 min-w-12 text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomIn}
                    disabled={zoom >= 3}
                    title="Zoom In"
                    className="h-8 w-8"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleResetZoom}
                    title="Reset Zoom"
                    className="h-8 w-8"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>

                  {fileType?.includes('image') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRotate}
                      title="Rotate"
                      className="h-8 w-8 ml-1"
                    >
                      <RotateCw className="h-4 w-4 rotate-90" />
                    </Button>
                  )}
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={onDownload}
                className="mr-2 flex items-center gap-2"
                disabled={loading}
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                title="Close"
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-4 bg-gray-50">
          {renderFileContent()}
        </div>

        {blobUrl && !loading && !error && (
          <div className="p-3 border-t bg-gray-50 text-xs text-gray-500 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-4">
              <span>✓ File loaded successfully</span>
              <span className="text-gray-300">|</span>
              <span className="font-mono">{fileName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRetry}
                className="h-7 text-xs"
              >
                Reload
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};