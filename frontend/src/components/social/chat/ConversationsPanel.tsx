/**
 * frontend/src/components/social/chat/ConversationsPanel.tsx
 * ────────────────────────────────────────────────────────────────────────────
 * BananaLink Social System v2.0 — Conversations Panel (web, NEW)
 *
 * Left pane of the Messages page.
 *
 * Features:
 *   - Search bar (filters by participant name).
 *   - Filter tabs: All | Candidates | Freelancers | Companies.
 *   - Scrollable list of ContactCard rows (pull data via useQuery).
 *   - Requests banner at the bottom — clicks switch to the 'request' tab.
 *   - Real-time updates via Socket.IO (invalidates TanStack Query cache).
 * ────────────────────────────────────────────────────────────────────────────
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { Search, Loader2, Mail, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  conversationService,
  type Conversation,
} from '@/services/conversationService';
import ContactCard from './ContactCard';
import { useSocket } from '@/hooks/useSocket';

type FilterTab = 'all' | 'candidate' | 'freelancer' | 'company';

interface ConversationsPanelProps {
  currentUserId: string;
  activeConversationId?: string | null;
  onSelectConversation: (conv: Conversation) => void;
  onViewRequests: () => void;
  className?: string;
}

const TAB_LABELS: Record<FilterTab, string> = {
  all: 'All',
  candidate: 'Candidates',
  freelancer: 'Freelancers',
  company: 'Companies',
};

const ConversationsPanel: React.FC<ConversationsPanelProps> = ({
  currentUserId,
  activeConversationId,
  onSelectConversation,
  onViewRequests,
  className = '',
}) => {
  const qc = useQueryClient();
  const { socket } = useSocket();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<FilterTab>('all');

  /* ── Conversations (active) ──────────────────────────────────────── */
  const convQ = useInfiniteQuery({
    queryKey: ['social', 'conversations', 'active'] as const,
    queryFn: async ({ pageParam = 1 }) => {
      const res = await conversationService.getMyConversations({
        page: pageParam as number,
        limit: 20,
        status: 'active',
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
    staleTime: 1000 * 30,
  });

  /* ── Requests count (for banner) ─────────────────────────────────── */
  const requestsCountQ = useQuery({
    queryKey: ['social', 'conversations', 'requests', 'count'] as const,
    queryFn: async () => {
      const res = await conversationService.getRequests({
        page: 1,
        limit: 1,
      });
      return res.data?.pagination?.total ?? 0;
    },
    staleTime: 1000 * 30,
  });

  /* ── Socket updates ──────────────────────────────────────────────── */
  useEffect(() => {
    if (!socket) return;

    const invalidate = () => {
      qc.invalidateQueries({ queryKey: ['social', 'conversations'] });
    };

    socket.on('chat:new_message', invalidate);
    socket.on('chat:conversation_created', invalidate);
    socket.on('chat:conversation_updated', invalidate);
    socket.on('chat:request_accepted', invalidate);

    return () => {
      socket.off('chat:new_message', invalidate);
      socket.off('chat:conversation_created', invalidate);
      socket.off('chat:conversation_updated', invalidate);
      socket.off('chat:request_accepted', invalidate);
    };
  }, [socket, qc]);

  const allConversations: Conversation[] = useMemo(
    () => convQ.data?.pages.flatMap((p) => p.data) ?? [],
    [convQ.data]
  );

  /* ── Filter locally by name + role tab ───────────────────────────── */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allConversations.filter((c) => {
      const other =
        c.otherParticipant ||
        c.participants?.find((p) => p._id?.toString() !== currentUserId);
      if (!other) return false;

      if (tab !== 'all' && other.role?.toLowerCase() !== tab) return false;
      if (q && !other.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allConversations, search, tab, currentUserId]);

  const requestsCount = requestsCountQ.data ?? 0;

  return (
    <aside
      className={cn(
        'flex flex-col h-full border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950',
        className
      )}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Messages
        </h2>

        {/* Search */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-900 border border-transparent focus:border-gray-300 dark:focus:border-gray-700 focus:outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-3 overflow-x-auto scrollbar-none">
          {(Object.keys(TAB_LABELS) as FilterTab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'shrink-0 px-3 py-1 text-xs font-medium rounded-full transition-colors',
                tab === t
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {convQ.isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <Inbox className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {search ? 'No matches' : 'No messages yet'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {search
                ? 'Try a different search'
                : 'Start a chat from any profile'}
            </p>
          </div>
        ) : (
          <>
            {filtered.map((conv) => (
              <ContactCard
                key={conv._id}
                conversation={conv}
                currentUserId={currentUserId}
                isActive={conv._id === activeConversationId}
                onClick={onSelectConversation}
              />
            ))}

            {convQ.hasNextPage && (
              <div className="p-3">
                <button
                  type="button"
                  onClick={() => convQ.fetchNextPage()}
                  disabled={convQ.isFetchingNextPage}
                  className="w-full py-2 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {convQ.isFetchingNextPage ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Requests banner */}
      {requestsCount > 0 && (
        <button
          type="button"
          onClick={onViewRequests}
          className="flex items-center gap-3 px-4 py-3 border-t border-gray-200 dark:border-gray-800 bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition"
        >
          <Mail className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
              Message Requests
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {requestsCount} waiting for review
            </p>
          </div>
          <span className="min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold bg-amber-500 text-white flex items-center justify-center">
            {requestsCount > 99 ? '99+' : requestsCount}
          </span>
        </button>
      )}
    </aside>
  );
};

export default ConversationsPanel;