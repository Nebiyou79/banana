// src/components/tenders/shared/SectionCard.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import { colorClasses } from '@/utils/color';
import { SectionCardProps } from '@/types/tender.types';

export const SectionCard: React.FC<SectionCardProps> = ({
    title,
    description,
    icon,
    children,
    action,
    className
}) => (
    <div className={cn(
        "rounded-xl border overflow-hidden",
        colorClasses.bg.primary,
        colorClasses.border.gray100,
        "shadow-sm",
        className
    )}>
        <div className={cn(
            "px-4 md:px-6 py-4 border-b flex items-start justify-between",
            colorClasses.border.gray100,
            colorClasses.bg.secondary
        )}>
            <div className="flex items-start gap-3">
                <div className={cn("p-2 rounded-lg shrink-0", colorClasses.bg.primary)}>
                    {icon}
                </div>
                <div>
                    <h3 className={cn("font-semibold", colorClasses.text.primary)}>
                        {title}
                    </h3>
                    {description && (
                        <p className={cn("text-sm mt-1", colorClasses.text.muted)}>
                            {description}
                        </p>
                    )}
                </div>
            </div>
            {action && <div>{action}</div>}
        </div>
        <div className="p-4 md:p-6">
            {children}
        </div>
    </div>
);