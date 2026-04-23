/**
 * frontend/src/components/social/chat/ChatWindow.tsx
 * ────────────────────────────────────────────────────────────────────────────
 * BananaLink Social System v2.0 — Chat Window (web, NEW)
 *
 * Right pane of the Messages page.
 *
 * Responsibilities:
 *   - Header: avatar + name + presence label.
 *   - MessageRequestBanner if conversation.status === 'request'.
 *   - Scrollable messages list (newest at bottom, auto-scroll on new).
 *   - Load-older on scroll to top (infinite up).
 *   - Date dividers ("Today", "Yesterday", "Mar 12").
 *   - TypingIndicator when other user emits chat:typing.
 *   - MessageInput at bottom.
 *   - Socket.IO join/leave room on mount/unmount.
 *   - Mark as read on open + when new messages arrive while focused.
 * ────────────────────────────────────────────────────────────────────────────
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { ArrowLeft, Loader2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/services/conversationService';
import { conversationService } from '@/services/conversationService';
import {
  messageService,
  type Message,
} from '@/services/messageService';
import { useSocket } from '@/hooks/useSocket';
import OnlineStatusDot, {
  getPresenceLabel,
} from './OnlineStatusDot';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import MessageRequestBanner from './MessageRequestBanner';

interface ChatWindowProps {
  conversation: Conversation;
  currentUserId: string;
  onBack?: () => void;
  className?: string;
}

function getAvatarUrl(avatar: any): string | undefined {
  if (!avatar) return undefined;
  if (typeof avatar === 'string') return avatar;
  return avatar.secure_url || avatar.url;
}

function dateDividerLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return 'Today';
  if (sameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year:
      date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  currentUserId,
  onBack,
  className = '',
}) => {
  const qc = useQueryClient();
  const { socket } = useSocket();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const otherUser =
    conversation.otherParticipant ||
    conversation.participants?.find(
      (p) => p._id?.toString() !== currentUserId
    ) ||
    null;

  /* ── Messages (infinite paginated) ───────────────────────────────── */
  const msgQ = useInfiniteQuery({
    queryKey: ['social', 'messages', conversation._id] as const,
    queryFn: async ({ pageParam = 1 }) => {
      const res = await messageService.getMessages(conversation._id, {
        page: pageParam as number,
        limit: 30,
      });
      return {
        data: res.data?.data ?? [],
        pagination: res.data?.pagination,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const { page, pages } = last.pagination ?? ({} as any);
      return page && pages && page < pages ? page + 1 : undefined;
    },
    staleTime: 0,
  });

  // Oldest-first for display (backend returns newest-first).
  const messages: Message[] = useMemo(() => {
    const all = msgQ.data?.pages.flatMap((p) => p.data) ?? [];
    return [...all].reverse();
  }, [msgQ.data]);

  /* ── Send message ────────────────────────────────────────────────── */
  const sendM = useMutation({
    mutationFn: (content: string) =>
      messageService.send({
        conversationId: conversation._id,
        content,
        type: 'text',
      }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ['social', 'messages', conversation._id],
      });
      qc.invalidateQueries({ queryKey: ['social', 'conversations'] });
    },
  });

  /* ── Delete message ──────────────────────────────────────────────── */
  const deleteM = useMutation({
    mutationFn: ({
      messageId,
      deleteFor,
    }: {
      messageId: string;
      deleteFor: 'me' | 'everyone';
    }) => messageService.delete(messageId, deleteFor),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ['social', 'messages', conversation._id],
      });
    },
  });

  /* ── Accept / decline request ────────────────────────────────────── */
  const acceptM = useMutation({
    mutationFn: () => conversationService.accept(conversation._id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['social', 'conversations'] });
    },
  });
  const declineM = useMutation({
    mutationFn: () => conversationService.decline(conversation._id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['social', 'conversations'] });
    },
  });

  /* ── Socket: join/leave conversation room + listen for updates ──── */
  useEffect(() => {
    if (!socket) return;
    const convId = conversation._id;

    socket.emit('chat:join_room', { conversationId: convId });

    const onNewMessage = (payload: {
      message: Message;
      conversationId: string;
    }) => {
      if (payload.conversationId !== convId) return;
      qc.invalidateQueries({
        queryKey: ['social', 'messages', convId],
      });
    };

    const onDeleted = (payload: {
      messageId: string;
      conversationId: string;
    }) => {
      if (payload.conversationId !== convId) return;
      qc.invalidateQueries({
        queryKey: ['social', 'messages', convId],
      });
    };

    const onTyping = (payload: {
      conversationId: string;
      userId: string;
      isTyping: boolean;
    }) => {
      if (payload.conversationId !== convId) return;
      if (payload.userId === currentUserId) return;
      setOtherIsTyping(!!payload.isTyping);

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (payload.isTyping) {
        // Safety: clear after 5s in case we miss the stop event.
        typingTimeoutRef.current = setTimeout(() => {
          setOtherIsTyping(false);
        }, 5000);
      }
    };

    const onRead = (payload: {
      conversationId: string;
      readerId: string;
    }) => {
      if (payload.conversationId !== convId) return;
      if (payload.readerId === currentUserId) return;
      qc.invalidateQueries({
        queryKey: ['social', 'messages', convId],
      });
    };

    socket.on('chat:new_message', onNewMessage);
    socket.on('chat:message_deleted', onDeleted);
    socket.on('chat:typing', onTyping);
    socket.on('chat:messages_read', onRead);

    return () => {
      socket.emit('chat:leave_room', { conversationId: convId });
      socket.off('chat:new_message', onNewMessage);
      socket.off('chat:message_deleted', onDeleted);
      socket.off('chat:typing', onTyping);
      socket.off('chat:messages_read', onRead);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [socket, conversation._id, currentUserId, qc]);

  /* ── Mark as read on mount + whenever messages refresh ──────────── */
  useEffect(() => {
    if (!conversation._id) return;
    conversationService.markRead(conversation._id).catch(() => null);
    socket?.emit('chat:mark_read', { conversationId: conversation._id });
    qc.invalidateQueries({ queryKey: ['social', 'conversations'] });
  }, [conversation._id, messages.length, socket, qc]);

  /* ── Auto-scroll to bottom on new messages ───────────────────────── */
  const prevMsgCountRef = useRef(0);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (messages.length === 0) return;

    const prev = prevMsgCountRef.current;
    const isInitial = prev === 0;
    const grew = messages.length > prev;
    prevMsgCountRef.current = messages.length;

    if (isInitial) {
      // jump without animation
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
      return;
    }

    // Only auto-scroll if the user was already near the bottom.
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (grew && nearBottom) {
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, [messages.length]);

  /* ── Load older on scroll to top ─────────────────────────────────── */
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop < 80 && msgQ.hasNextPage && !msgQ.isFetchingNextPage) {
      const prevHeight = el.scrollHeight;
      msgQ.fetchNextPage().then(() => {
        requestAnimationFrame(() => {
          if (!scrollRef.current) return;
          const next = scrollRef.current.scrollHeight;
          scrollRef.current.scrollTop = next - prevHeight;
        });
      });
    }
  }, [msgQ]);

  /* ── Handlers ────────────────────────────────────────────────────── */
  const handleSend = useCallback(
    async (content: string) => {
      await sendM.mutateAsync(content);
    },
    [sendM]
  );

  const handleDelete = useCallback(
    (messageId: string, deleteFor: 'me' | 'everyone') => {
      deleteM.mutate({ messageId, deleteFor });
    },
    [deleteM]
  );

  /* ── Grouped messages with date dividers ─────────────────────────── */
  type Row =
    | { kind: 'divider'; key: string; label: string }
    | {
        kind: 'message';
        key: string;
        message: Message;
        showAvatar: boolean;
        isOwn: boolean;
      };

  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    let lastDay = '';
    let lastSenderId: string | null = null;

    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      const d = new Date(m.createdAt);
      const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

      if (dayKey !== lastDay) {
        out.push({
          kind: 'divider',
          key: `d-${dayKey}`,
          label: dateDividerLabel(d),
        });
        lastDay = dayKey;
        lastSenderId = null;
      }

      const senderId =
        typeof m.sender === 'string' ? m.sender : m.sender?._id;
      const isOwn = senderId === currentUserId;
      const showAvatar = !isOwn && senderId !== lastSenderId;

      out.push({
        kind: 'message',
        key: m._id,
        message: m,
        showAvatar,
        isOwn,
      });

      lastSenderId = senderId;
    }
    return out;
  }, [messages, currentUserId]);

  /* ── Render ──────────────────────────────────────────────────────── */
  if (!otherUser) {
    return (
      <div
        className={cn(
          'flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900',
          className
        )}
      >
        <div className="text-center text-gray-500">
          <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Conversation unavailable</p>
        </div>
      </div>
    );
  }

  const avatarUrl = getAvatarUrl(otherUser.avatar);
  const presenceLabel = getPresenceLabel(
    otherUser.lastSeen,
    otherUser.isOnline
  );
  const isRequester =
    conversation.status === 'request' &&
    conversation.requestedBy?.toString() === currentUserId;
  const isRequestOpenForMe =
    conversation.status === 'request' &&
    conversation.requestedBy?.toString() !== currentUserId;

  return (
    <section
      className={cn(
        'flex-1 flex flex-col h-full bg-white dark:bg-gray-950',
        className
      )}
    >
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="md:hidden p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        )}

        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={otherUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-medium text-gray-500">
                {(otherUser.name?.[0] || '?').toUpperCase()}
              </div>
            )}
          </div>
          <span className="absolute bottom-0 right-0">
            <OnlineStatusDot
              lastSeen={otherUser.lastSeen}
              isOnline={otherUser.isOnline}
              size={10}
              showBorder
            />
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {otherUser.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {presenceLabel}
          </p>
        </div>
      </header>

      {/* Request banner */}
      {(isRequester || isRequestOpenForMe) && (
        <MessageRequestBanner
          otherUserName={otherUser.name}
          isRequester={isRequester}
          onAccept={() => acceptM.mutate()}
          onDecline={() => declineM.mutate()}
          isLoading={acceptM.isPending || declineM.isPending}
        />
      )}

      {/* Messages list */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3 bg-gray-50/50 dark:bg-gray-900/30"
      >
        {msgQ.isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {msgQ.isFetchingNextPage && (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            )}

            {rows.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Say hi to {otherUser.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Your conversation starts here.
                </p>
              </div>
            )}

            {rows.map((row) =>
              row.kind === 'divider' ? (
                <div
                  key={row.key}
                  className="flex items-center justify-center py-3"
                >
                  <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 px-3 py-1 rounded-full bg-white dark:bg-gray-900 shadow-sm">
                    {row.label}
                  </span>
                </div>
              ) : (
                <MessageBubble
                  key={row.key}
                  message={row.message}
                  isOwnMessage={row.isOwn}
                  showAvatar={row.showAvatar}
                  onDelete={handleDelete}
                />
              )
            )}

            {otherIsTyping && <TypingIndicator name={otherUser.name} />}

            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <MessageInput
        conversationId={conversation._id}
        onSend={handleSend}
        isSending={sendM.isPending}
        disabled={
          conversation.status === 'declined' ||
          (isRequestOpenForMe && !acceptM.isSuccess)
        }
        placeholder={
          isRequestOpenForMe
            ? 'Accept the request to reply…'
            : 'Type a message…'
        }
      />
    </section>
  );
};

export default ChatWindow;