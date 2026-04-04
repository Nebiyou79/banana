// src/components/tenders/shared/PageTabs.tsx
'use client';
import React from 'react';
import { cn } from '@/lib/utils';

export type TabTint = 'blue' | 'emerald' | 'amber' | 'navy' | 'teal' | 'purple';

export interface Tab {
    id: string;
    label: string;
    count?: number;
    tint?: TabTint;
}

interface PageTabsProps {
    tabs: Tab[];
    activeTab: string;
    onChange: (id: string) => void;
}

const TINT_PANEL: Record<TabTint, string> = {
    blue: 'bg-blue-50/30 dark:bg-blue-950/10',
    emerald: 'bg-emerald-50/50 dark:bg-emerald-950/10',
    amber: 'bg-amber-50/40 dark:bg-amber-950/10',
    navy: 'bg-[#0A2540]/3 dark:bg-[#0A2540]/15',
    teal: 'bg-teal-50/30 dark:bg-teal-950/8',
    purple: 'bg-purple-50/30 dark:bg-purple-950/8',
};

export function PageTabs({ tabs, activeTab, onChange }: PageTabsProps) {
    const activeTabObj = tabs.find(t => t.id === activeTab);
    const panelTint = activeTabObj?.tint ? TINT_PANEL[activeTabObj.tint] : '';

    return (
        <div>
            {/* Tab bar */}
            <div className="flex border-b border-[#E5E5E5] dark:border-[#4B5563] bg-white dark:bg-[#0A1628] sticky top-0 z-10 overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => {
                    const isActive = tab.id === activeTab;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => onChange(tab.id)}
                            className={cn(
                                'relative px-5 py-3 text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-all duration-150',
                                isActive
                                    ? 'text-[#B45309] dark:text-[#F1BB03] bg-[#F1BB03]/8 border-b-2 border-[#F1BB03]'
                                    : 'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#374151] dark:hover:text-[#E5E5E5] hover:bg-[#F9FAFB] dark:hover:bg-[#1F2937]'
                            )}
                        >
                            {tab.label}
                            {tab.count != null && (
                                <span className={cn(
                                    'inline-flex items-center justify-center rounded-full text-[10px] font-bold px-1.5 py-0.5 min-w-[18px]',
                                    isActive
                                        ? 'bg-[#F1BB03] text-[#0A2540]'
                                        : 'bg-[#E5E5E5] dark:bg-[#374151] text-[#6B7280] dark:text-[#9CA3AF]'
                                )}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Panel tint indicator */}
            {panelTint && (
                <div className={cn('h-1 w-full', panelTint)} />
            )}
        </div>
    );
}