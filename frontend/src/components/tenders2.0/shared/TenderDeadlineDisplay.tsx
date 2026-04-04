// src/components/tender/shared/TenderDeadlineDisplay.tsx
import { colorClasses } from '@/utils/color';

interface TenderDeadlineDisplayProps {
  deadline: string; // ISO date string
  showCountdown?: boolean;
  className?: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getCountdownConfig(daysRemaining: number): {
  label: string;
  className: string;
} {
  if (daysRemaining <= 0) {
    return {
      label: 'Deadline passed',
      className: colorClasses.text.red,
    };
  }
  if (daysRemaining <= 3) {
    return {
      label: `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining!`,
      className: `${colorClasses.text.red} font-bold`,
    };
  }
  if (daysRemaining <= 7) {
    return {
      label: `${daysRemaining} days remaining`,
      className: colorClasses.text.amber,
    };
  }
  return {
    label: `${daysRemaining} days remaining`,
    className: colorClasses.text.green,
  };
}

export default function TenderDeadlineDisplay({
  deadline,
  showCountdown = true,
  className = '',
}: TenderDeadlineDisplayProps) {
  const daysRemaining = Math.ceil(
    (new Date(deadline).getTime() - Date.now()) / 86400000
  );

  const { label, className: countdownClass } = getCountdownConfig(daysRemaining);

  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      {showCountdown && (
        <span className={`text-xs font-medium ${countdownClass}`}>{label}</span>
      )}
      <span className={`text-xs ${colorClasses.text.secondary}`}>
        {formatDate(deadline)}
      </span>
    </div>
  );
}
