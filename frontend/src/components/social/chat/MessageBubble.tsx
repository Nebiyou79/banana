/**
 * frontend/src/components/social/chat/MessageBubble.tsx
 * ────────────────────────────────────────────────────────────────────────────
 * BananaLink Social System v2.0 — Message Bubble (web, NEW)
 *
 * Variants:
 *   - Own message (right-aligned, primary color background, white text)
 *   - Their message (left-aligned, gray/card background)
 *   - Deleted (italic, no background, muted)
 *
 * Features:
 *   - Timestamp below bubble
 *   - Read receipts for own messages: ✓ sent, ✓✓ delivered (gray), ✓✓ read (blue)
 *   - Reply preview (when message.replyTo is set)
 *   - Right-click / long-press menu: Copy, Delete (if own + within 2h window)
 * ────────────────────────────────────────────────────────────────────────────
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Check, CheckCheck, Copy, Trash2, Flag, CornerDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message } from '@/services/messageService';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar?: boolean;
  onDelete?: (messageId: string, deleteFor: 'me' | 'everyone') => void;
  onReport?: (messageId: string) => void;
  className?: string;
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

function getAvatarUrl(avatar: any): string | undefined {
  if (!avatar) return undefined;
  if (typeof avatar === 'string') return avatar;
  return avatar.secure_url || avatar.url;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  showAvatar = false,
  onDelete,
  onReport,
  className = '',
}) => {
  const { colors } = useRoleTheme() as any;
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const bubbleRef = useRef<HTMLDivElement>(null);

  const isDeleted = message.type === 'deleted' || !!message.deletedAt;

  const canDeleteForEveryone = useCallback(() => {
    if (!isOwnMessage) return false;
    if (isDeleted) return false;
    if (!message.canDeleteUntil) return false;
    return Date.now() < new Date(message.canDeleteUntil).getTime();
  }, [isOwnMessage, isDeleted, message.canDeleteUntil]);

  /* ── Context menu (right-click / long-press) ─────────────────────── */
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (isDeleted) return;
      e.preventDefault();
      setMenuPos({ x: e.clientX, y: e.clientY });
      setMenuOpen(true);
    },
    [isDeleted]
  );

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    document.addEventListener('click', close);
    document.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('scroll', close, true);
    };
  }, [menuOpen]);

  const handleCopy = () => {
    if (message.content) {
      navigator.clipboard?.writeText(message.content).catch(() => {});
    }
    setMenuOpen(false);
  };

  const handleDeleteForMe = () => {
    onDelete?.(message._id, 'me');
    setMenuOpen(false);
  };

  const handleDeleteForEveryone = () => {
    onDelete?.(message._id, 'everyone');
    setMenuOpen(false);
  };

  const handleReport = () => {
    onReport?.(message._id);
    setMenuOpen(false);
  };

  /* ── Status ticks (own messages) ─────────────────────────────────── */
  const renderStatusTick = () => {
    if (!isOwnMessage) return null;
    if (message.status === 'read') {
      return <CheckCheck className="w-3.5 h-3.5 text-blue-400" />;
    }
    if (message.status === 'delivered') {
      return <CheckCheck className="w-3.5 h-3.5 text-gray-400" />;
    }
    return <Check className="w-3.5 h-3.5 text-gray-400" />;
  };

  const avatarUrl = showAvatar
    ? getAvatarUrl((message.sender as any)?.avatar)
    : undefined;

  /* ── Deleted ─────────────────────────────────────────────────────── */
  if (isDeleted) {
    return (
      <div
        className={cn(
          'flex w-full mb-1',
          isOwnMessage ? 'justify-end' : 'justify-start',
          className
        )}
      >
        <div className="max-w-[75%] px-3 py-2 text-xs italic text-gray-400 dark:text-gray-500 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
          This message was deleted
        </div>
      </div>
    );
  }

  /* ── Normal ──────────────────────────────────────────────────────── */
  return (
    <>
      <div
        className={cn(
          'flex w-full mb-1 group',
          isOwnMessage ? 'justify-end' : 'justify-start items-end gap-2',
          className
        )}
      >
        {!isOwnMessage && showAvatar && (
          <div className="shrink-0 w-7 h-7 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={message.sender?.name || ''}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                {(message.sender?.name?.[0] || '?').toUpperCase()}
              </div>
            )}
          </div>
        )}
        {!isOwnMessage && !showAvatar && <div className="w-7 shrink-0" />}

        <div
          className={cn(
            'flex flex-col max-w-[75%]',
            isOwnMessage ? 'items-end' : 'items-start'
          )}
        >
          {/* Reply preview */}
          {message.replyTo && (
            <div
              className={cn(
                'mb-1 pl-2 pr-3 py-1 text-xs border-l-2 rounded-r max-w-full',
                isOwnMessage
                  ? 'border-white/50 bg-white/10'
                  : 'border-gray-400 bg-gray-50 dark:bg-gray-800'
              )}
              style={
                isOwnMessage
                  ? { color: 'rgba(255,255,255,0.85)' }
                  : undefined
              }
            >
              <div className="flex items-center gap-1 opacity-70">
                <CornerDownRight className="w-3 h-3" />
                <span className="font-medium truncate">
                  {message.replyTo.sender?.name || 'Unknown'}
                </span>
              </div>
              <p className="truncate max-w-[260px]">
                {message.replyTo.content ||
                  (message.replyTo.type === 'deleted'
                    ? 'Deleted message'
                    : '')}
              </p>
            </div>
          )}

          {/* Bubble */}
          <div
            ref={bubbleRef}
            onContextMenu={handleContextMenu}
            className={cn(
              'px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words shadow-sm cursor-default transition-all duration-150',
              isOwnMessage
                ? 'rounded-tr-sm text-white'
                : 'rounded-tl-sm bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
            )}
            style={
              isOwnMessage
                ? { backgroundColor: colors?.primary || '#E63946' }
                : undefined
            }
          >
            {message.content}
          </div>

          {/* Meta row: time + status */}
          <div
            className={cn(
              'flex items-center gap-1 mt-0.5 px-1 text-[11px] text-gray-500 dark:text-gray-400',
              isOwnMessage ? 'flex-row-reverse' : ''
            )}
          >
            <span>{formatTime(message.createdAt)}</span>
            {renderStatusTick()}
          </div>
        </div>
      </div>

      {/* Context menu */}
      {menuOpen && (
        <div
          className="fixed z-50 min-w-[180px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1 animate-in fade-in zoom-in-95 duration-100"
          style={{
            top: Math.min(menuPos.y, window.innerHeight - 200),
            left: Math.min(menuPos.x, window.innerWidth - 200),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Copy className="w-4 h-4" />
            Copy
          </button>
          {isOwnMessage && (
            <>
              <button
                onClick={handleDeleteForMe}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Trash2 className="w-4 h-4" />
                Delete for me
              </button>
              {canDeleteForEveryone() && (
                <button
                  onClick={handleDeleteForEveryone}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete for everyone
                </button>
              )}
            </>
          )}
          {!isOwnMessage && (
            <button
              onClick={handleReport}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Flag className="w-4 h-4" />
              Report
            </button>
          )}
        </div>
      )}
    </>
  );
};

export default MessageBubble;

function useRoleTheme(): any {
    throw new Error('Function not implemented.');
}
