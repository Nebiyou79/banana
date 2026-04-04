// components/ui/Progress.tsx
import React from 'react';

interface ProgressProps {
  value: number;
  className?: string;
  style?: React.CSSProperties;
  indicatorStyle?: React.CSSProperties;
}

export function Progress({ value, className = '', style, indicatorStyle }: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, value));

  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`} style={style}>
      <div
        className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${percentage}%`, ...indicatorStyle }}
      />
    </div>
  );
}