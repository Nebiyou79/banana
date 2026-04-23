/**
 * frontend/src/pages/dashboard/[role]/social/messages.tsx
 * ────────────────────────────────────────────────────────────────────────────
 * BananaLink Social System v2.0 — Messages Page (web, NEW)
 *
 * Two-column chat layout inside SocialDashboardLayout:
 *   - Left:  ConversationsPanel (320px, fixed)
 *   - Right: ChatWindow or empty state
 *
 * Query params supported:
 *   ?userId=<id>  → auto-open a DM with this user (creates if missing).
 *   ?convId=<id>  → select an existing conversation on load.
 *
 * Mobile (< md): shows the list, then swaps to a full-screen ChatWindow
 * once a conversation is selected. "Back" returns to the list.
 * ────────────────────────────────────────────────────────────────────────────
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare } from 'lucide-react';
import ConversationsPanel from '@/components/social/chat/ConversationsPanel';
import ChatWindow from '@/components/social/chat/ChatWindow';
import {
  conversationService,
  type Conversation,
} from '@/services/conversationService';
import { SocialDashboardLayout } from '@/components/social/layout/SocialDashboard';

function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('userId');
}

const MessagesPage: React.FC = () => {
  const router = useRouter();
  const qc = useQueryClient();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  useEffect(() => {
    setCurrentUserId(getCurrentUserId());
  }, []);

  /* ── Auto-open via ?userId query ────────────────────────────────── */
  const openWithUser = useMutation({
    mutationFn: (userId: string) => conversationService.getOrCreate(userId),
    onSuccess: (res) => {
      const conv = res.data?.data;
      if (conv) {
        setActiveConv(conv);
        setMobileShowChat(true);
        qc.invalidateQueries({ queryKey: ['social', 'conversations'] });
      }
    },
  });

  useEffect(() => {
    if (!router.isReady) return;
    const { userId, convId } = router.query;
    if (typeof userId === 'string' && userId) {
      openWithUser.mutate(userId);
      // clean the url so a refresh doesn't re-open.
      const nextQuery = { ...router.query };
      delete nextQuery.userId;
      router.replace({ pathname: router.pathname, query: nextQuery }, undefined, {
        shallow: true,
      });
    } else if (typeof convId === 'string' && convId) {
      // Lazy lookup (user clicked a notification).
      conversationService
        .getById(convId)
        .then((res) => {
          if (res.data?.data) {
            setActiveConv(res.data.data);
            setMobileShowChat(true);
          }
        })
        .catch(() => null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  /* ── Requests preview (counted by ConversationsPanel already) ───── */
  const handleViewRequests = () => {
    router.push(
      `/dashboard/${router.query.role || 'candidate'}/social/messages/requests`
    );
  };

  if (!currentUserId) {
    return (
      <SocialDashboardLayout>
        <div className="flex items-center justify-center h-[60vh] text-sm text-gray-500">
          Loading…
        </div>
      </SocialDashboardLayout>
    );
  }

  return (
    <SocialDashboardLayout>
      <div className="h-[calc(100vh-120px)] flex rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        {/* LEFT — conversations panel */}
        <div
          className={
            'w-full md:w-[320px] md:shrink-0 ' +
            (mobileShowChat ? 'hidden md:flex' : 'flex')
          }
        >
          <ConversationsPanel
            currentUserId={currentUserId}
            activeConversationId={activeConv?._id ?? null}
            onSelectConversation={(c) => {
              setActiveConv(c);
              setMobileShowChat(true);
            }}
            onViewRequests={handleViewRequests}
            className="flex-1"
          />
        </div>

        {/* RIGHT — chat window or empty state */}
        <div
          className={
            'flex-1 min-w-0 ' +
            (mobileShowChat ? 'flex' : 'hidden md:flex')
          }
        >
          {activeConv ? (
            <ChatWindow
              conversation={activeConv}
              currentUserId={currentUserId}
              onBack={() => setMobileShowChat(false)}
              className="flex-1"
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center px-6">
                <MessageSquare className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">
                  Your messages
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1 max-w-xs">
                  Select a conversation or start one from any profile.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </SocialDashboardLayout>
  );
};

export default MessagesPage;