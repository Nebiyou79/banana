// src/components/proposals/shared/ProposalTabPanel.tsx
// 4-tab panel used in pages 1.3, 2.2, 3.2.
// Tabs: Overview | Details | Attachments | Actions
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { colorClasses } from '@/utils/color';

export type ProposalTab = 'overview' | 'details' | 'attachments' | 'actions';

interface TabDef {
  id:    ProposalTab;
  label: string;
  badge?: number;
}

interface Props {
  tabs:           TabDef[];
  defaultTab?:    ProposalTab;
  children:       (activeTab: ProposalTab) => React.ReactNode;
  accentColor?:   string;
}

export function ProposalTabPanel({
  tabs, defaultTab, children, accentColor = '#F1BB03',
}: Props) {
  const [active, setActive] = useState<ProposalTab>(defaultTab ?? tabs[0]?.id ?? 'overview');

  return (
    <div className="space-y-4">
      {/* Tab bar — horizontal scroll on mobile */}
      <div
        className={cn('flex gap-1 border-b overflow-x-auto', colorClasses.border.gray200)}
        style={{ scrollbarWidth: 'none' }}
      >
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-3 text-sm font-semibold shrink-0 whitespace-nowrap transition-all border-b-2 -mb-px',
                isActive
                  ? colorClasses.text.primary
                  : cn(colorClasses.text.muted, 'border-transparent hover:' + colorClasses.text.secondary),
              )}
              style={isActive ? { borderBottomColor: accentColor } : undefined}
            >
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={cn(
                  'inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold',
                  isActive ? 'bg-[#F1BB03] text-[#0A2540]' : cn(colorClasses.bg.secondary, colorClasses.text.muted),
                )}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div>{children(active)}</div>
    </div>
  );
}
