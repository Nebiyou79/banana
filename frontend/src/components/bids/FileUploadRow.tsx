// src/components/bids/FileUploadRow.tsx
import { useRef, useState, DragEvent } from 'react';
import { colorClasses } from '@/utils/color';
import type { BidDocumentType } from '@/services/bidService';

export interface FileEntry {
  file: File;
  documentType: BidDocumentType;
  id: string;
  preview?: string;
  sizeFormatted: string;
}

interface FileUploadRowProps {
  documentType: BidDocumentType;
  label: string;
  description?: string;
  required?: boolean;
  file?: FileEntry;
  onFile: (entry: FileEntry) => void;
  onRemove: () => void;
  accept?: string;
  maxSizeMB?: number;
}

const DOC_ICONS: Record<string, string> = {
  business_license: '🏢',
  tin_certificate: '🔢',
  vat_certificate: '📋',
  tax_clearance: '✅',
  trade_registration: '📝',
  company_profile: '🏗️',
  technical_proposal: '📐',
  financial_proposal: '💰',
  financial_breakdown: '📊',
  cpo_document: '🏦',
  opening_page: '📋',
  default: '📄',
};

const DOC_COLORS: Record<string, string> = {
  business_license: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  tin_certificate: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  vat_certificate: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
  tax_clearance: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  trade_registration: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  company_profile: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
  technical_proposal: 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400',
  financial_proposal: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
  financial_breakdown: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  cpo_document: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  opening_page: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  default: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const nanoid = () => Math.random().toString(36).slice(2, 10);

export const FileUploadRow = ({
  documentType,
  label,
  description,
  required = false,
  file,
  onFile,
  onRemove,
  accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx',
  maxSizeMB = 10,
}: FileUploadRowProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [sizeError, setSizeError] = useState('');

  const icon = DOC_ICONS[documentType] ?? DOC_ICONS.default;
  const iconColor = DOC_COLORS[documentType] ?? DOC_COLORS.default;

  const handleFile = (f: File) => {
    setSizeError('');
    if (f.size > maxSizeMB * 1024 * 1024) {
      setSizeError(`File exceeds ${maxSizeMB} MB limit`);
      return;
    }
    const preview = f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined;
    onFile({
      file: f,
      documentType,
      id: nanoid(),
      preview,
      sizeFormatted: formatBytes(f.size),
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = '';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  return (
    <div
      className={[
        'flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-xl border transition-all',
        dragOver
          ? 'border-[#F1BB03] bg-[#F1BB03]/5'
          : `${colorClasses.border.secondary} ${colorClasses.bg.primary}`,
      ].join(' ')}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${iconColor}`}>
        {icon}
      </div>

      {/* Label + desc */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-semibold ${colorClasses.text.primary}`}>{label}</span>
          {required ? (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#EF4444]/10 text-[#EF4444]">Required</span>
          ) : (
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${colorClasses.bg.secondary} ${colorClasses.text.muted}`}>Optional</span>
          )}
        </div>
        {description && (
          <p className={`text-xs mt-0.5 ${colorClasses.text.muted}`}>{description}</p>
        )}
        {sizeError && (
          <p className="text-xs mt-0.5 text-[#EF4444]" role="alert">{sizeError}</p>
        )}
      </div>

      {/* Action: file chip or choose button */}
      <div className="shrink-0">
        {file ? (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${colorClasses.border.secondary} ${colorClasses.bg.surface} max-w-[200px]`}>
            {file.preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={file.preview} alt="" className="w-6 h-6 rounded object-cover" />
            ) : (
              <span className="text-sm">📄</span>
            )}
            <span className={`text-xs truncate max-w-[110px] ${colorClasses.text.secondary}`} title={file.file.name}>
              {file.file.name}
            </span>
            <span className={`text-[10px] ${colorClasses.text.muted} whitespace-nowrap`}>{file.sizeFormatted}</span>
            <button
              type="button"
              onClick={onRemove}
              className={`text-[#EF4444] hover:opacity-70 transition-opacity shrink-0 min-h-[28px] min-w-[28px] flex items-center justify-center`}
              aria-label={`Remove ${label}`}
            >
              ✕
            </button>
          </div>
        ) : (
          <>
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              onChange={handleInputChange}
              className="hidden"
              aria-label={`Upload ${label}`}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className={`text-xs font-semibold px-4 py-2 rounded-lg border ${colorClasses.border.goldenMustard} text-[#F1BB03] hover:bg-[#F1BB03] hover:text-[#0A2540] transition-all min-h-[36px]`}
            >
              Choose File
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default FileUploadRow;