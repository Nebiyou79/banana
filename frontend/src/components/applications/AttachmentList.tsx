// components/attachments/AttachmentList.tsx
import React from 'react';
import { NormalizedAttachment } from './ApplicationAttachments';
import { FileText, Eye, Download, Calendar, File } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';

export interface AttachmentListProps {
    attachments: NormalizedAttachment[];
    onView: (attachment: NormalizedAttachment) => void;
    onDownload: (attachment: NormalizedAttachment) => void;
    onDownloadAll?: () => void;
    showDownloadAll?: boolean;
    title?: string;
    description?: string;
    emptyMessage?: string;
}

const getCategoryColor = (category: NormalizedAttachment['category']): string => {
    switch (category) {
        case 'CV':
            return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'Reference':
            return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'Experience':
            return 'bg-violet-100 text-violet-800 border-violet-200';
        case 'Other':
            return 'bg-slate-100 text-slate-800 border-slate-200';
        default:
            return 'bg-slate-100 text-slate-800 border-slate-200';
    }
};

export const AttachmentList: React.FC<AttachmentListProps> = ({
    attachments,
    onView,
    onDownload,
    onDownloadAll,
    showDownloadAll = true,
    title = 'Application Attachments',
    description = 'All files submitted with this application',
    emptyMessage = 'No attachments found'
}) => {
    if (attachments.length === 0) {
        return (
            <Card className="border-slate-200">
                <CardHeader>
                    <CardTitle className="text-slate-900">{title}</CardTitle>
                    <CardDescription className="text-slate-600">{description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-slate-500">
                        <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="font-medium">{emptyMessage}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const categories = ['CV', 'Reference', 'Experience', 'Other'] as const;
    const attachmentsByCategory = categories.reduce((acc, category) => {
        acc[category] = attachments.filter(a => a.category === category);
        return acc;
    }, {} as Record<NormalizedAttachment['category'], NormalizedAttachment[]>);

    return (
        <Card className="border-slate-200">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-slate-900">{title}</CardTitle>
                        <CardDescription className="text-slate-600">
                            {description} • {attachments.length} files
                        </CardDescription>
                    </div>
                    {showDownloadAll && onDownloadAll && attachments.length > 1 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onDownloadAll}
                            className="border-slate-300 text-slate-700"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Download All
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {categories.map(category => {
                    const categoryAttachments = attachmentsByCategory[category];
                    if (categoryAttachments.length === 0) return null;

                    return (
                        <div key={category} className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-medium text-slate-900">{category}s</h3>
                                <Badge variant="outline" className={getCategoryColor(category)}>
                                    {categoryAttachments.length} file{categoryAttachments.length !== 1 ? 's' : ''}
                                </Badge>
                            </div>
                            <div className="space-y-3">
                                {categoryAttachments.map(attachment => (
                                    <AttachmentCard
                                        key={attachment.id}
                                        attachment={attachment}
                                        onView={onView}
                                        onDownload={onDownload}
                                    />
                                ))}
                            </div>
                            {category !== 'Other' && <Separator />}
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
};

// Optional atom component for individual attachment cards
const AttachmentCard: React.FC<{
    attachment: NormalizedAttachment;
    onView: (attachment: NormalizedAttachment) => void;
    onDownload: (attachment: NormalizedAttachment) => void;
}> = ({ attachment, onView, onDownload }) => {
    const uploadedDate = new Date(attachment.uploadedAt).toLocaleDateString();

    return (
        <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
            <div className="flex items-center space-x-4 flex-1 min-w-0">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">{attachment.fileIcon}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                        <p className="font-medium text-slate-900 truncate">{attachment.name}</p>
                        <Badge variant="outline" className={getCategoryColor(attachment.category)}>
                            {attachment.category}
                        </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-slate-500">
                        <span>{attachment.sizeLabel}</span>
                        <span>•</span>
                        <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {uploadedDate}
                        </span>
                        <span>•</span>
                        <span>{attachment.fileType}</span>
                    </div>
                    {attachment.description && (
                        <p className="text-sm text-slate-600 mt-1 truncate">{attachment.description}</p>
                    )}
                </div>
            </div>
            <div className="flex space-x-2 flex-shrink-0 ml-4">
                {attachment.canView && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onView(attachment)}
                        className="border-slate-300 text-slate-700"
                        title="View file"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                )}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDownload(attachment)}
                    className="border-slate-300 text-slate-700"
                    title="Download file"
                >
                    <Download className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};