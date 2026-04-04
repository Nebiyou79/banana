/* eslint-disable @typescript-eslint/no-explicit-any */
// components/applications/AttachmentList.tsx
import React, { useState, useMemo } from 'react';
import { NormalizedAttachment } from '@/components/applications/ApplicationAttachments';
import {
  FileText,
  Eye,
  Download,
  Calendar,
  File,
  DownloadCloud,
  FileImage,
  FileSpreadsheet,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import { useMediaQuery } from '@/hooks/use-media-query';
import { colorClasses } from '@/utils/color';
import { motion, AnimatePresence } from 'framer-motion';

// ==================== Types ====================

interface ExtendedAttachment extends NormalizedAttachment {
  progress?: number;
  hasFailed?: boolean;
  thumbnailUrl?: string;
}

interface AttachmentListProps {
  attachments: ExtendedAttachment[];
  onView: (attachment: ExtendedAttachment) => void;
  onDownload: (attachment: ExtendedAttachment) => void;
  onDownloadAll?: () => void;
  title?: string;
  description?: string;
  emptyMessage?: string;
}

// ==================== File Icon Component ====================

const FileTypeIcon: React.FC<{ fileType: string; className?: string }> = ({ fileType, className }) => {
  const type = fileType.toLowerCase();

  if (type.includes('pdf')) {
    return <FileText className={`${colorClasses.text.blue} ${className || 'h-5 w-5'}`} />;
  }
  if (type.includes('word') || type.includes('doc')) {
    return <FileText className={`${colorClasses.text.amber} ${className || 'h-5 w-5'}`} />;
  }
  if (type.includes('image')) {
    return <FileImage className={`${colorClasses.text.emerald} ${className || 'h-5 w-5'}`} />;
  }
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) {
    return <FileSpreadsheet className={`${colorClasses.text.purple} ${className || 'h-5 w-5'}`} />;
  }
  return <File className={`${colorClasses.text.muted} ${className || 'h-5 w-5'}`} />;
};

// ==================== Mobile Attachment Card (compact, 2-per-row grid) ====================

const MobileAttachmentCard: React.FC<{
  attachment: ExtendedAttachment;
  onView: () => void;
  onDownload: () => void;
}> = ({ attachment, onView, onDownload }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${colorClasses.bg.primary} border ${colorClasses.border.gray400} rounded-xl overflow-hidden flex flex-col`}
    >
      {/* File info */}
      <div className="p-2.5 flex flex-col gap-1.5 flex-1">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClasses.bg.gray100}`}>
          <FileTypeIcon fileType={attachment.fileType} className="h-4 w-4" />
        </div>
        <p className={`font-medium ${colorClasses.text.primary} text-[11px] leading-tight line-clamp-2`}>
          {attachment.name}
        </p>
        <p className={`text-[10px] ${colorClasses.text.muted}`}>
          {attachment.sizeLabel}
        </p>
      </div>

      {/* Action buttons */}
      <div className={`flex border-t ${colorClasses.border.gray400}`}>
        {attachment.canView && (
          <button
            onClick={onView}
            className={`flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-medium ${colorClasses.text.muted} border-r ${colorClasses.border.gray400} active:opacity-70`}
          >
            <Eye className="h-3 w-3 shrink-0" />
            View
          </button>
        )}
        <button
          onClick={onDownload}
          className={`flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-medium ${colorClasses.text.blue} active:opacity-70`}
        >
          <Download className="h-3 w-3 shrink-0" />
          Download
        </button>
      </div>
    </motion.div>
  );
};

// ==================== Desktop Attachment Card ====================

const DesktopAttachmentCard: React.FC<{
  attachment: ExtendedAttachment;
  onView: () => void;
  onDownload: () => void;
}> = ({ attachment, onView, onDownload }) => {
  const uploadedDate = new Date(attachment.uploadedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        flex items-center justify-between p-4 w-full
        ${colorClasses.bg.primary} border ${colorClasses.border.gray400}
        rounded-xl hover:shadow-sm transition-all duration-200
      `}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Icon */}
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center shrink-0
          ${colorClasses.bg.gray100}
        `}>
          <FileTypeIcon fileType={attachment.fileType} className="h-5 w-5" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h4 className={`font-medium ${colorClasses.text.primary} truncate`}>
              {attachment.name}
            </h4>
            <Badge 
              variant="outline" 
              className={`${colorClasses.border.gray400} ${colorClasses.text.muted} text-xs px-2 py-0.5 shrink-0`}
            >
              {attachment.category}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className={`${colorClasses.text.muted} truncate`}>{attachment.fileType}</span>
            <span className={`${colorClasses.text.muted} shrink-0`}>•</span>
            <span className={`${colorClasses.text.muted} shrink-0`}>{attachment.sizeLabel}</span>
            <span className={`${colorClasses.text.muted} shrink-0`}>•</span>
            <span className={`flex items-center gap-1 ${colorClasses.text.muted} shrink-0`}>
              <Calendar className="h-3 w-3 shrink-0" />
              <span className="truncate">{uploadedDate}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 ml-4">
        {attachment.canView && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onView}
                className={`h-9 w-9 p-0 ${colorClasses.text.primary} hover:${colorClasses.bg.gray100} rounded-lg shrink-0`}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>View</TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDownload}
              className={`h-9 w-9 p-0 ${colorClasses.text.primary} hover:${colorClasses.bg.gray100} rounded-lg shrink-0`}
            >
              <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Download</TooltipContent>
        </Tooltip>
      </div>
    </motion.div>
  );
};

// ==================== Main Component ====================

export const AttachmentList: React.FC<AttachmentListProps> = ({
  attachments,
  onView,
  onDownload,
  onDownloadAll,
  title = 'Application Attachments',
  description = 'All files submitted with this application',
  emptyMessage = 'No attachments found'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    CV: true,
    Reference: true,
    Experience: true,
    Other: true
  });

  // Use 640px (Tailwind sm) so mobile cards appear on phones, desktop on sm+
  const isMobile = useMediaQuery('(max-width: 640px)');

  // Group attachments by category
  const attachmentsByCategory = useMemo(() => {
    const categories: Record<string, ExtendedAttachment[]> = {
      CV: [],
      Reference: [],
      Experience: [],
      Other: []
    };

    attachments.forEach(attachment => {
      if (attachment.category in categories) {
        categories[attachment.category].push(attachment);
      } else {
        categories.Other.push(attachment);
      }
    });

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      Object.keys(categories).forEach(key => {
        categories[key] = categories[key].filter(item =>
          item.name.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query)
        );
      });
    }

    return categories;
  }, [attachments, searchQuery]);

  const totalFiles = attachments.length;
  const filteredTotal = Object.values(attachmentsByCategory).reduce((acc, items) => acc + items.length, 0);

  const toggleSection = (category: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Empty state
  if (attachments.length === 0) {
    return (
      <Card className={`border ${colorClasses.border.gray400} shadow-sm rounded-xl w-full overflow-hidden`}>
        <CardHeader>
          <CardTitle className={colorClasses.text.primary}>{title}</CardTitle>
          <CardDescription className={colorClasses.text.muted}>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`text-center py-12 ${colorClasses.text.muted}`}>
            <FileText className={`h-16 w-16 mx-auto mb-4 ${colorClasses.text.muted} opacity-50`} />
            <p className="font-medium text-lg">{emptyMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className={`border ${colorClasses.border.gray400} shadow-sm rounded-xl overflow-hidden min-w-0 w-full`}>

        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <CardHeader className={`${colorClasses.bg.secondary} border-b ${colorClasses.border.gray400} p-3 sm:p-4 md:p-6 space-y-3 overflow-hidden w-full min-w-0`}>

          {/* Row 1: title + count badge + Download All (icon-only on mobile) */}
          <div className="flex items-start justify-between gap-2 min-w-0 w-full">
            <div className="min-w-0 flex-1">
              <CardTitle className={`${colorClasses.text.primary} text-base sm:text-lg font-bold flex items-center gap-2 flex-wrap`}>
                <span className="truncate">{title}</span>
                <Badge variant="outline" className={`${colorClasses.border.gray400} ${colorClasses.text.muted} shrink-0 text-xs`}>
                  {filteredTotal}/{totalFiles}
                </Badge>
              </CardTitle>
              <CardDescription className={`${colorClasses.text.muted} text-xs sm:text-sm mt-0.5 truncate`}>
                {description}
              </CardDescription>
            </div>

            {onDownloadAll && totalFiles > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDownloadAll}
                className={`shrink-0 h-9 px-2.5 sm:px-3 rounded-xl ${colorClasses.border.gray400} ${colorClasses.text.primary} flex items-center gap-1.5`}
              >
                <DownloadCloud className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline text-xs font-medium">Download All</span>
              </Button>
            )}
          </div>

          {/* Row 2: search — always full width */}
          <div className="relative w-full">
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-9 h-9 w-full rounded-xl text-sm ${colorClasses.bg.primary} border ${colorClasses.border.gray400} ${colorClasses.text.primary}`}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className={`absolute right-3 top-1/2 -translate-y-1/2 ${colorClasses.text.muted}`}>
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Row 3: category chips — scroll horizontally on mobile, wrap on sm+ */}
          {Object.values(attachmentsByCategory).some(items => items.length > 0) && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide sm:flex-wrap sm:overflow-visible w-full">
              {Object.entries(attachmentsByCategory).map(([category, items]) => {
                if (items.length === 0) return null;
                return (
                  <button
                    key={category}
                    onClick={() => toggleSection(category)}
                    className={`flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${colorClasses.bg.primary} border ${colorClasses.border.gray400} hover:shadow-sm`}
                  >
                    <span className={`font-bold ${colorClasses.text.primary}`}>{items.length}</span>
                    <span className={colorClasses.text.muted}>{category}{items.length !== 1 ? 's' : ''}</span>
                  </button>
                );
              })}
            </div>
          )}
        </CardHeader>

        {/* ── CONTENT ─────────────────────────────────────────────────── */}
        <CardContent className="p-2 sm:p-4 md:p-6 w-full min-w-0 overflow-hidden">
          <div className="space-y-4 w-full min-w-0">
            {Object.entries(attachmentsByCategory).map(([category, items]) => {
              if (items.length === 0) return null;
              return (
                <div key={category} className="space-y-2 w-full min-w-0">
                  {/* Section toggle */}
                  <button
                    onClick={() => toggleSection(category)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl ${colorClasses.bg.gray100} hover:opacity-90 transition-opacity`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorClasses.bg.primary} border ${colorClasses.border.gray400}`}>
                        <File className={`h-4 w-4 ${colorClasses.text.primary}`} />
                      </div>
                      <div className="text-left min-w-0">
                        <h3 className={`font-semibold ${colorClasses.text.primary} text-sm truncate`}>
                          {category === 'CV' ? 'CVs' : `${category}s`}
                        </h3>
                        <p className={`text-xs ${colorClasses.text.muted} truncate`}>
                          {items.length} file{items.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    {expandedSections[category]
                      ? <ChevronUp className={`h-5 w-5 shrink-0 ${colorClasses.text.muted}`} />
                      : <ChevronDown className={`h-5 w-5 shrink-0 ${colorClasses.text.muted}`} />
                    }
                  </button>

                  {/* File items */}
                  <AnimatePresence>
                    {expandedSections[category] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={isMobile ? "grid grid-cols-2 gap-2 w-full" : "space-y-2 overflow-hidden w-full"}
                      >
                        {items.map((attachment) => (
                          isMobile ? (
                            <MobileAttachmentCard
                              key={attachment.id}
                              attachment={attachment}
                              onView={() => onView(attachment)}
                              onDownload={() => onDownload(attachment)}
                            />
                          ) : (
                            <DesktopAttachmentCard
                              key={attachment.id}
                              attachment={attachment}
                              onView={() => onView(attachment)}
                              onDownload={() => onDownload(attachment)}
                            />
                          )
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* No search results */}
          {filteredTotal === 0 && searchQuery && (
            <div className={`text-center py-10 ${colorClasses.text.muted}`}>
              <p className="font-medium text-sm">No matching files</p>
              <p className="text-xs mt-1">Try adjusting your search</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className={`mt-4 text-xs ${colorClasses.text.primary}`}
              >
                Clear Search
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};