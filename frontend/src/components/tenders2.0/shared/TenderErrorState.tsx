// src/components/tender/shared/TenderErrorState.tsx
import { colorClasses } from '@/utils/color';

interface TenderErrorStateProps {
  error: string;
  onRetry: () => void;
}

export default function TenderErrorState({ error, onRetry }: TenderErrorStateProps) {
  return (
    <div
      className={`
        flex flex-col items-center justify-center
        gap-4 py-16 px-6 text-center rounded-xl
        border ${colorClasses.border.primary}
        ${colorClasses.bg.primary}
      `}
    >
      {/* Error icon */}
      <div
        className={`
          w-14 h-14 rounded-full flex items-center justify-center
          ${colorClasses.bg.redLight}
        `}
      >
        <svg
          className={`w-7 h-7 ${colorClasses.text.red}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
      </div>

      <p className={`text-sm font-medium max-w-xs ${colorClasses.text.red}`}>
        {error}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className={`
          flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold
          transition-opacity hover:opacity-90 active:scale-95
          ${colorClasses.bg.darkNavy}
          text-white
        `}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Try Again
      </button>
    </div>
  );
}
