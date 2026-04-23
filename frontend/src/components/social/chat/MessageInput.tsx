/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * frontend/src/components/social/chat/MessageInput.tsx
 * ────────────────────────────────────────────────────────────────────────────
 * BananaLink Social System v2.0 — Message Input (web, NEW)
 *
 * Behavior:
 *  - Auto-expanding textarea (up to 4 lines).
 *  - Enter = send (Shift+Enter = newline).
 *  - Emoji button opens a lightweight native picker (no extra dependency).
 *  - Emits `chat:typing_start` on first keypress, debounced `chat:typing_stop`
 *    2 seconds after the user stops typing.
 *  - Disabled if parent passes `disabled`.
 * ────────────────────────────────────────────────────────────────────────────
 */
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  KeyboardEvent,
} from 'react';
import { Send, Smile, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { emit } from '@/lib/socket';

interface MessageInputProps {
  conversationId: string;
  onSend: (content: string) => Promise<void> | void;
  disabled?: boolean;
  isSending?: boolean;
  placeholder?: string;
  className?: string;
}

const EMOJI_SET = [
  '😀','😂','😊','😍','🥰','😎','🤔','😢','😭','😡',
  '👍','👎','❤️','🔥','🎉','✨','💯','🙏','👋','🤝',
  '✅','❌','⭐','💡','📌','📎','🚀','⏰','📅','💬',
];

const MessageInput: React.FC<MessageInputProps> = ({
  conversationId,
  onSend,
  disabled = false,
  isSending = false,
  placeholder = 'Type a message…',
  className = '',
}) => {
  const { colors } = useRoleTheme() as any;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const typingIdleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasEmittedTypingStart = useRef(false);

  /* ── Auto-resize textarea ────────────────────────────────────────── */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const MAX_H = 4 * 24; // ~4 lines at 24px line-height
    el.style.height = `${Math.min(el.scrollHeight, MAX_H)}px`;
  }, [value]);

  /* ── Typing emitter ──────────────────────────────────────────────── */
  const emitTypingStart = useCallback(() => {
    if (hasEmittedTypingStart.current) return;
    emit('chat:typing_start', { conversationId });
    hasEmittedTypingStart.current = true;
  }, [conversationId]);

  const emitTypingStop = useCallback(() => {
    if (!hasEmittedTypingStart.current) return;
    emit('chat:typing_stop', { conversationId });
    hasEmittedTypingStart.current = false;
  }, [conversationId]);

  const scheduleTypingStop = useCallback(() => {
    if (typingIdleTimer.current) clearTimeout(typingIdleTimer.current);
    typingIdleTimer.current = setTimeout(() => {
      emitTypingStop();
    }, 2000);
  }, [emitTypingStop]);

  useEffect(() => {
    return () => {
      if (typingIdleTimer.current) clearTimeout(typingIdleTimer.current);
      emitTypingStop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  /* ── Submit ──────────────────────────────────────────────────────── */
  const handleSubmit = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed || disabled || isSending) return;
    const toSend = trimmed;

    // Clear first for snappy UX.
    setValue('');
    emitTypingStop();

    try {
      await onSend(toSend);
    } catch {
      // Restore on failure so the user doesn't lose their draft.
      setValue(toSend);
    }
  }, [value, disabled, isSending, onSend, emitTypingStop]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    if (e.target.value.length > 0) {
      emitTypingStart();
      scheduleTypingStop();
    } else {
      emitTypingStop();
    }
  };

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current;
    if (!el) {
      setValue((v) => v + emoji);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + emoji + value.slice(end);
    setValue(next);
    // Put caret after inserted emoji on next tick.
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const canSend = value.trim().length > 0 && !disabled && !isSending;

  return (
    <div
      className={cn(
        'relative border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2',
        className
      )}
    >
      {emojiOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setEmojiOpen(false)}
          />
          <div className="absolute bottom-full left-2 z-20 mb-2 p-2 w-[280px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg grid grid-cols-8 gap-1">
            {EMOJI_SET.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => {
                  insertEmoji(e);
                  setEmojiOpen(false);
                }}
                className="text-xl rounded hover:bg-gray-100 dark:hover:bg-gray-800 p-1 transition"
              >
                {e}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => setEmojiOpen((v) => !v)}
          disabled={disabled}
          className="shrink-0 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition disabled:opacity-40"
          aria-label="Insert emoji"
        >
          <Smile className="w-5 h-5" />
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={disabled}
          maxLength={2000}
          className={cn(
            'flex-1 resize-none px-3 py-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition disabled:opacity-60',
            'focus:border-transparent'
          )}
          style={{
            lineHeight: '1.5',
            maxHeight: `${4 * 24}px`,
            ['--tw-ring-color' as any]: colors?.primary || '#E63946',
          }}
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSend}
          className={cn(
            'shrink-0 p-2.5 rounded-full text-white transition-all',
            canSend
              ? 'shadow-md hover:shadow-lg hover:scale-105 active:scale-95'
              : 'opacity-40 cursor-not-allowed'
          )}
          style={{ backgroundColor: colors?.primary || '#E63946' }}
          aria-label="Send"
        >
          {isSending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      {value.length > 1800 && (
        <div className="pl-12 pr-4 pt-1 text-[11px] text-gray-400 dark:text-gray-500">
          {2000 - value.length} characters remaining
        </div>
      )}
    </div>
  );
};

export default MessageInput;

function useRoleTheme(): any {
    throw new Error('Function not implemented.');
}
