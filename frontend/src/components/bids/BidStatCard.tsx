// src/components/bids/BidStatCard.tsx
import React from 'react';

interface BidStatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  colorScheme: 'emerald' | 'blue' | 'amber' | 'purple' | 'gold';
  trend?: string;
  /** Optional small text below value, e.g. "of 47 total" or "this page" */
  subtitle?: string;
}

const schemeStyles: Record<
  BidStatCardProps['colorScheme'],
  { bg: string; textValue: string; textLabel: string }
> = {
  emerald: { bg: 'bg-[#059669]', textValue: 'text-white', textLabel: 'text-white/80' },
  blue: { bg: 'bg-[#2563EB]', textValue: 'text-white', textLabel: 'text-white/80' },
  amber: { bg: 'bg-[#D97706]', textValue: 'text-white', textLabel: 'text-white/80' },
  purple: { bg: 'bg-[#7C3AED]', textValue: 'text-white', textLabel: 'text-white/80' },
  gold: { bg: 'bg-[#F1BB03]', textValue: 'text-[#0A2540]', textLabel: 'text-[#0A2540]/70' },
};

export const BidStatCard = ({
  label,
  value,
  icon,
  colorScheme,
  trend,
  subtitle,
}: BidStatCardProps) => {
  const styles = schemeStyles[colorScheme];

  return (
    <div
      className={`${styles.bg} rounded-2xl p-5 relative overflow-hidden shadow-md flex flex-col justify-between min-h-[120px]`}
    >
      {/* Label top-left */}
      <p className={`${styles.textLabel} text-xs font-medium uppercase tracking-wide`}>
        {label}
      </p>

      {/* Bottom row: value + trend left, icon right */}
      <div className="flex items-end justify-between mt-3">
        <div>
          <p className={`${styles.textValue} text-3xl font-bold leading-none`}>{value}</p>
          {subtitle && (
            <p className={`${styles.textLabel} text-xs mt-0.5 opacity-70`}>{subtitle}</p>
          )}
          {trend && (
            <p className={`${styles.textLabel} text-xs mt-1 font-medium`}>{trend}</p>
          )}
        </div>

        {/* Large semi-transparent icon bottom-right */}
        <div
          className={`${colorScheme === 'gold' ? 'text-[#0A2540]/20' : 'text-white/20'
            } text-5xl leading-none select-none`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

export default BidStatCard;