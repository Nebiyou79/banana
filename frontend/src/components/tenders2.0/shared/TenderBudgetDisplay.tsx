// src/components/tender/shared/TenderBudgetDisplay.tsx
import { colorClasses } from '@/utils/color';

interface BudgetProps {
  min?: number;
  max?: number;
  currency: string;
  type: 'fixed' | 'range' | 'negotiable';
  fixedAmount?: number;
}

interface TenderBudgetDisplayProps {
  budget: BudgetProps;
  className?: string;
}

function formatAmount(value: number): string {
  return value.toLocaleString();
}

export default function TenderBudgetDisplay({
  budget,
  className = '',
}: TenderBudgetDisplayProps) {
  const { currency, type, fixedAmount, min, max } = budget;

  const renderAmount = () => {
    if (type === 'negotiable') {
      return (
        <span className={`text-sm ${colorClasses.text.secondary}`}>
          Budget:{' '}
          <span className={`font-semibold ${colorClasses.text.primary}`}>
            Negotiable
          </span>
        </span>
      );
    }

    if (type === 'fixed' && fixedAmount != null) {
      return (
        <span className={`text-sm ${colorClasses.text.primary}`}>
          <span className={`text-xs mr-0.5 ${colorClasses.text.secondary}`}>
            {currency}
          </span>
          <span className="font-bold">{formatAmount(fixedAmount)}</span>
        </span>
      );
    }

    if (type === 'range' && min != null && max != null) {
      return (
        <span className={`text-sm ${colorClasses.text.primary}`}>
          <span className={`text-xs mr-0.5 ${colorClasses.text.secondary}`}>
            {currency}
          </span>
          <span className="font-bold">{formatAmount(min)}</span>
          <span className={`mx-1 ${colorClasses.text.secondary}`}>–</span>
          <span className="font-bold">{formatAmount(max)}</span>
        </span>
      );
    }

    return (
      <span className={`text-sm ${colorClasses.text.muted}`}>—</span>
    );
  };

  return (
    <div className={`inline-flex items-center ${className}`}>
      {renderAmount()}
    </div>
  );
}
