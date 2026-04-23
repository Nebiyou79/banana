/**
 * frontend/src/components/social/chat/TypingIndicator.tsx
 * ────────────────────────────────────────────────────────────────────────────
 * BananaLink Social System v2.0 — Typing indicator (web, NEW)
 *
 * Small chat bubble with three bouncing dots. Appears left-aligned below
 * the most recent "their" message when otherUser emits chat:typing.
 * ────────────────────────────────────────────────────────────────────────────
 */
import React from 'react';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  name?: string;
  className?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  name,
  className = '',
}) => {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 animate-in fade-in duration-200',
        className
      )}
    >
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-gray-100 dark:bg-gray-800 px-3 py-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-gray-400 animate-bounce" />
      </div>
      {name && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {name} is typing…
        </span>
      )}
    </div>
  );
};

export default TypingIndicator;