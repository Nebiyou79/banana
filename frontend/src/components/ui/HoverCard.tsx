/* eslint-disable @typescript-eslint/no-explicit-any */
// components/ui/HoverCard.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colorClasses } from '@/utils/color';
import applicationService from '@/services/applicationService';
import { Download, Eye, FileText } from 'lucide-react';
import { Button } from '../social/ui/Button';

interface HoverCardProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  openDelay?: number;
  closeDelay?: number;
}

interface HoverCardTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

interface HoverCardContentProps {
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  alignOffset?: number;
  className?: string;
}

// ==================== Context ====================

interface HoverCardContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLDivElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  openDelay: number;
  closeDelay: number;
  side: 'top' | 'right' | 'bottom' | 'left';
  align: 'start' | 'center' | 'end';
  sideOffset: number;
  alignOffset: number;
}

const HoverCardContext = React.createContext<HoverCardContextValue | null>(null);

const useHoverCard = () => {
  const context = React.useContext(HoverCardContext);
  if (!context) {
    throw new Error('HoverCard components must be used within HoverCard');
  }
  return context;
};

// ==================== Main Component ====================

export const HoverCard: React.FC<HoverCardProps> = ({
  children,
  open: controlledOpen,
  onOpenChange,
  openDelay = 300,
  closeDelay = 150,
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const openTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (value: boolean) => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(value);
    }
    onOpenChange?.(value);
  };

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    openTimeoutRef.current = setTimeout(() => setOpen(true), openDelay);
  };

  const handleMouseLeave = () => {
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => setOpen(false), closeDelay);
  };

  React.useEffect(() => {
    return () => {
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  // Handle click outside
  React.useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, setOpen]);

  return (
    <HoverCardContext.Provider
      value={{
        open,
        setOpen,
        triggerRef,
        contentRef,
        openDelay,
        closeDelay,
        side: 'bottom',
        align: 'center',
        sideOffset: 8,
        alignOffset: 0,
      }}
    >
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block"
      >
        {children}
      </div>
    </HoverCardContext.Provider>
  );
};

// ==================== Trigger Component ====================

export const HoverCardTrigger: React.FC<HoverCardTriggerProps> = ({
  children,
  asChild = false,
  className = '',
}) => {
  const { triggerRef, open } = useHoverCard();

  const child = asChild && React.isValidElement(children) ? (
    React.cloneElement(
      children,
      {
        ...('ref' in children ? {} : { ref: triggerRef }),
        className: `${((children as React.ReactElement<any, any>).props?.className || '')} ${className}`,
        'data-state': open ? 'open' : 'closed',
      } as any
    )
  ) : (
    <div
      ref={triggerRef}
      data-state={open ? 'open' : 'closed'}
      className={`cursor-pointer ${className}`}
    >
      {children}
    </div>
  );

  return child;
};

// ==================== Content Component ====================

export const HoverCardContent: React.FC<HoverCardContentProps> = ({
  children,
  side = 'bottom',
  align = 'center',
  sideOffset = 8,
  alignOffset = 0,
  className = '',
}) => {
  const { open, contentRef, triggerRef } = useHoverCard();
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [placement, setPlacement] = useState(side);

  // Calculate position
  React.useEffect(() => {
    if (!open || !triggerRef.current) return;

    const calculatePosition = () => {
      const trigger = triggerRef.current?.getBoundingClientRect();
      if (!trigger) return;

      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      
      let top = 0;
      let left = 0;
      let finalPlacement = side;

      // Check if there's enough space for the chosen side
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const estimatedHeight = 200; // Approximate, can be adjusted
      const estimatedWidth = 300; // Approximate, can be adjusted

      const spaceAbove = trigger.top;
      const spaceBelow = viewportHeight - trigger.bottom;
      const spaceLeft = trigger.left;
      const spaceRight = viewportWidth - trigger.right;

      // Adjust placement based on available space
      if (side === 'top' && spaceAbove < estimatedHeight && spaceBelow > estimatedHeight) {
        finalPlacement = 'bottom';
      } else if (side === 'bottom' && spaceBelow < estimatedHeight && spaceAbove > estimatedHeight) {
        finalPlacement = 'top';
      } else if (side === 'left' && spaceLeft < estimatedWidth && spaceRight > estimatedWidth) {
        finalPlacement = 'right';
      } else if (side === 'right' && spaceRight < estimatedWidth && spaceLeft > estimatedWidth) {
        finalPlacement = 'left';
      } else {
        finalPlacement = side;
      }

      // Calculate position based on final placement
      switch (finalPlacement) {
        case 'top':
          top = trigger.top + scrollY - sideOffset;
          left = trigger.left + scrollX + trigger.width / 2;
          break;
        case 'bottom':
          top = trigger.bottom + scrollY + sideOffset;
          left = trigger.left + scrollX + trigger.width / 2;
          break;
        case 'left':
          top = trigger.top + scrollY + trigger.height / 2;
          left = trigger.left + scrollX - sideOffset;
          break;
        case 'right':
          top = trigger.top + scrollY + trigger.height / 2;
          left = trigger.right + scrollX + sideOffset;
          break;
      }

      // Apply alignment offset
      if (finalPlacement === 'top' || finalPlacement === 'bottom') {
        if (align === 'start') {
          left = trigger.left + scrollX + alignOffset;
        } else if (align === 'end') {
          left = trigger.right + scrollX - alignOffset;
        }
      } else {
        if (align === 'start') {
          top = trigger.top + scrollY + alignOffset;
        } else if (align === 'end') {
          top = trigger.bottom + scrollY - alignOffset;
        }
      }

      setPosition({ top, left });
      setPlacement(finalPlacement);
    };

    calculatePosition();
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition);

    return () => {
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition);
    };
  }, [open, triggerRef, side, align, sideOffset, alignOffset]);

  // Animation variants
  const variants = {
    top: {
      initial: { opacity: 0, y: 10, x: '-50%' },
      animate: { opacity: 1, y: 0, x: '-50%' },
      exit: { opacity: 0, y: 10, x: '-50%' },
    },
    bottom: {
      initial: { opacity: 0, y: -10, x: '-50%' },
      animate: { opacity: 1, y: 0, x: '-50%' },
      exit: { opacity: 0, y: -10, x: '-50%' },
    },
    left: {
      initial: { opacity: 0, x: 10, y: '-50%' },
      animate: { opacity: 1, x: 0, y: '-50%' },
      exit: { opacity: 0, x: 10, y: '-50%' },
    },
    right: {
      initial: { opacity: 0, x: -10, y: '-50%' },
      animate: { opacity: 1, x: 0, y: '-50%' },
      exit: { opacity: 0, x: -10, y: '-50%' },
    },
  };

  const currentVariant = variants[placement as keyof typeof variants] || variants.bottom;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={contentRef}
          initial={currentVariant.initial}
          animate={currentVariant.animate}
          exit={currentVariant.exit}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            top: position.top,
            left: position.left,
            zIndex: 50,
          }}
          className={`
            min-w-[200px] max-w-[300px]
            ${colorClasses.bg.white} 
            dark:${colorClasses.bg.darkNavy}
            border ${colorClasses.border.gray400}
            rounded-xl shadow-2xl
            backdrop-blur-sm
            ${className}
          `}
        >
          {/* Arrow */}
          <div
            className={`
              absolute w-3 h-3
              ${colorClasses.bg.white}
              dark:${colorClasses.bg.darkNavy}
              border-l ${colorClasses.border.gray400}
              border-t ${colorClasses.border.gray400}
              transform rotate-45
              ${placement === 'top' ? '-bottom-1.5 left-1/2 -translate-x-1/2' : ''}
              ${placement === 'bottom' ? '-top-1.5 left-1/2 -translate-x-1/2' : ''}
              ${placement === 'left' ? '-right-1.5 top-1/2 -translate-y-1/2' : ''}
              ${placement === 'right' ? '-left-1.5 top-1/2 -translate-y-1/2' : ''}
            `}
          />
          
          {/* Content */}
          <div className="relative z-10 p-4">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ==================== Preset Hover Cards ====================

// Info Hover Card
export const InfoHoverCard: React.FC<{
  children: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}> = ({ children, content, side = 'top' }) => {
  return (
    <HoverCard>
      <HoverCardTrigger>
        {children}
      </HoverCardTrigger>
      <HoverCardContent side={side}>
        <div className="text-sm">
          {content}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

// Preview Hover Card (for CVs, images, etc.)
export const PreviewHoverCard: React.FC<{
  trigger: React.ReactNode;
  title: string;
  description?: string;
  image?: string;
  metadata?: Array<{ label: string; value: string }>;
  actions?: React.ReactNode;
}> = ({ trigger, title, description, image, metadata, actions }) => {
  return (
    <HoverCard openDelay={500} closeDelay={200}>
      <HoverCardTrigger>
        {trigger}
      </HoverCardTrigger>
      <HoverCardContent side="right" className="w-80">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start gap-3">
            {image && (
              <img
                src={image}
                alt={title}
                className="w-12 h-12 rounded-lg object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <h4 className={`font-semibold ${colorClasses.text.gray800} dark:${colorClasses.text.white} truncate`}>
                {title}
              </h4>
              {description && (
                <p className={`text-sm ${colorClasses.text.gray600} line-clamp-2`}>
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Metadata */}
          {metadata && metadata.length > 0 && (
            <div className="space-y-1">
              {metadata.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className={colorClasses.text.gray1000}>{item.label}:</span>
                  <span className={`font-medium ${colorClasses.text.gray700}`}>{item.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          {actions && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              {actions}
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

// Status Hover Card (for application status details)
export const StatusHoverCard: React.FC<{
  children: React.ReactNode;
  status: string;
  updatedAt: string;
  updatedBy: string;
  message?: string;
}> = ({ children, status, updatedAt, updatedBy, message }) => {
  const statusColors: Record<string, string> = {
    'applied': colorClasses.bg.blueLight,
    'under-review': colorClasses.bg.amberLight,
    'shortlisted': colorClasses.bg.greenLight,
    'interview-scheduled': colorClasses.bg.purpleLight,
    'rejected': colorClasses.bg.redLight,
    'withdrawn': colorClasses.bg.gray100,
  };

  return (
    <HoverCard>
      <HoverCardTrigger>
        {children}
      </HoverCardTrigger>
      <HoverCardContent side="top" className="w-64">
        <div className="space-y-2">
          <div className={`p-2 rounded-lg ${statusColors[status] || colorClasses.bg.gray100}`}>
            <p className={`font-medium ${colorClasses.text.gray800}`}>
              Status: {applicationService.getStatusLabel(status)}
            </p>
          </div>
          
          <div className="text-sm space-y-1">
            <p className={colorClasses.text.gray600}>
              Updated: {new Date(updatedAt).toLocaleString()}
            </p>
            <p className={colorClasses.text.gray600}>
              By: {updatedBy}
            </p>
          </div>

          {message && (
            <div className={`p-2 rounded-lg ${colorClasses.bg.gray100} text-sm`}>
              <p className={colorClasses.text.gray700}>{message}</p>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

// Document Hover Card
export const DocumentHoverCard: React.FC<{
  children: React.ReactNode;
  document: any;
  onView?: () => void;
  onDownload?: () => void;
}> = ({ children, document, onView, onDownload }) => {
  const fileSize = applicationService.getFileSize(document.size || 0);
  const uploadedDate = new Date(document.uploadedAt).toLocaleDateString();

  return (
    <HoverCard openDelay={400} closeDelay={200}>
      <HoverCardTrigger>
        {children}
      </HoverCardTrigger>
      <HoverCardContent side="right" className="w-72">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <FileText className={`h-8 w-8 ${colorClasses.text.blue}`} />
            <div className="flex-1 min-w-0">
              <p className={`font-medium ${colorClasses.text.gray800} truncate`}>
                {document.originalName || document.filename}
              </p>
              <p className={`text-xs ${colorClasses.text.gray600}`}>
                {document.fileType} • {fileSize}
              </p>
            </div>
          </div>

          <div className={`text-xs ${colorClasses.text.gray1000}`}>
            Uploaded: {uploadedDate}
          </div>

          {(onView || onDownload) && (
            <div className="flex gap-2 pt-2">
              {onView && (
                <Button size="sm" variant="outline" onClick={onView} className="flex-1">
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
              )}
              {onDownload && (
                <Button size="sm" variant="outline" onClick={onDownload} className="flex-1">
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              )}
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default HoverCard;