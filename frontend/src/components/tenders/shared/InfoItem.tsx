// src/components/tenders/shared/InfoItem.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import { colorClasses } from '@/utils/color';
import { InfoItemProps } from '@/types/tender.types';

export const InfoItem: React.FC<InfoItemProps> = ({
    label,
    value,
    icon,
    badge = false,
    className
}) => (
    <div className={cn("space-y-1", className)}>
        <div className={cn(
            "flex items-center gap-1.5 text-sm",
            colorClasses.text.muted
        )}>
            {icon && <span className="w-4 h-4">{icon}</span>}
            <span>{label}</span>
        </div>
        <div className={cn(
            "font-medium",
            badge && "inline-flex"
        )}>
            {badge ? (
                <span className={cn(
                    "px-2.5 py-1 text-xs rounded-full",
                    colorClasses.bg.secondary,
                    colorClasses.text.primary
                )}>
                    {value}
                </span>
            ) : (
                <span className={colorClasses.text.primary}>{value}</span>
            )}
        </div>
    </div>
);