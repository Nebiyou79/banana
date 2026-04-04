// src/components/tenders/shared/PageStatsBar.tsx
'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { colors, colorClasses } from '@/utils/color';
import { cn } from '@/lib/utils';

type ColorScheme = 'blue' | 'emerald' | 'amber' | 'purple' | 'red';

interface StatCard {
    label: string;
    value: string | number;
    subValue?: string;
    colorScheme: ColorScheme;
    icon: React.ReactNode;
}

interface PageStatsBarProps {
    stats: StatCard[];
    isLoading?: boolean;
}

const SCHEME_COLORS: Record<ColorScheme, string> = {
    blue: colors.blue,
    emerald: colors.emerald,
    amber: colors.amber,
    purple: colors.purple,
    red: colors.red,
};

const SCHEME_BG: Record<ColorScheme, string> = {
    blue: colorClasses.bg.blueLight,
    emerald: colorClasses.bg.emeraldLight,
    amber: colorClasses.bg.amberLight,
    purple: colorClasses.bg.purpleLight,
    red: colorClasses.bg.redLight,
};

const SCHEME_TEXT: Record<ColorScheme, string> = {
    blue: colorClasses.text.blue,
    emerald: colorClasses.text.emerald,
    amber: colorClasses.text.amber,
    purple: colorClasses.text.purple,
    red: colorClasses.text.red,
};

export function PageStatsBar({ stats, isLoading }: PageStatsBarProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={cn('p-4 rounded-xl border animate-pulse', colorClasses.bg.primary, colorClasses.border.secondary)}>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2" />
                        <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {stats.map((stat, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    whileHover={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    className={cn(
                        'p-4 rounded-xl border border-l-4 transition-all duration-200',
                        colorClasses.bg.primary,
                        colorClasses.border.secondary
                    )}
                    style={{ borderLeftColor: SCHEME_COLORS[stat.colorScheme] }}
                >
                    <div className="flex items-center justify-between">
                        <div className="min-w-0">
                            <p className={cn('text-xs font-medium', colorClasses.text.muted)}>{stat.label}</p>
                            <p className={cn('text-xl font-bold mt-0.5', colorClasses.text.primary)}>{stat.value}</p>
                            {stat.subValue && (
                                <p className={cn('text-xs mt-1', colorClasses.text.muted)}>{stat.subValue}</p>
                            )}
                        </div>
                        <div className={cn('p-2 rounded-lg shrink-0', SCHEME_BG[stat.colorScheme])}>
                            <div className={cn('h-5 w-5', SCHEME_TEXT[stat.colorScheme])}>
                                {stat.icon}
                            </div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}