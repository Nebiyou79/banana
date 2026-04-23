/**
 * frontend/src/components/social/chat/ContactCard.tsx
 * ────────────────────────────────────────────────────────────────────────────
 * BananaLink Social System v2.0 — Contact Card (web, NEW)
 *
 * Renders a single conversation row in the ConversationsPanel list.
 *
 * Layout:
 *   [Avatar 🟢]  Name · role                    2m  (timestamp)
 *                Last message preview…          (2) (unread badge)
 *                                         [Follow btn]
 * ────────────────────────────────────────────────────────────────────────────
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { cn } from '@/lib/utils';
import OnlineStatusDot from './OnlineStatusDot';
import type {
  Conversation,
  ConversationParticipant,
} from '@/services/conversationService';

interface ContactCardProps {
  conversation: Conversation;
  currentUserId: string;
  isActive?: boolean;
  onClick?: (conversation: Conversation) => void;
  className?: string;
}

function getAvatarUrl(avatar: any): string | undefined {
  if (!avatar) return undefined;
  if (typeof avatar === 'string') return avatar;
  return avatar.secure_url || avatar.url;
}

function formatRelative(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diffMs = Date.now() - d.getTime();
  const min = Math.floor(diffMs / 60_000);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);

  if (min < 1) return 'now';
  if (min < 60) return `${min}m`;
  if (hr < 24) return `${hr}h`;
  if (day < 7) return `${day}d`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function truncate(text: string | null | undefined, max: number): string {
  if (!text) return '';
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

function lastMessagePreview(
  conv: Conversation,
  currentUserId: string
): string {
  const lm = conv.lastMessage;
  if (!lm) return 'No messages yet';
  if (lm.type === 'deleted' || lm.deletedAt) return 'Message deleted';

  const senderId =
    typeof lm.sender === 'string' ? lm.sender : lm.sender?._id;
  const prefix = senderId === currentUserId ? 'You: ' : '';
  return prefix + truncate(lm.content || '', 40);
}

function roleBadge(role?: string): { label: string; color: string } | null {
  if (!role) return null;
  const map: Record<string, { label: string; color: string }> = {
    candidate: { label: 'Candidate', color: '#3B82F6' },
    freelancer: { label: 'Freelancer', color: '#8B5CF6' },
    company: { label: 'Company', color: '#10B981' },
    organization: { label: 'Org', color: '#F59E0B' },
    admin: { label: 'Admin', color: '#EF4444' },
  };
  return map[role.toLowerCase()] || null;
}

const ContactCard: React.FC<ContactCardProps> = ({
  conversation,
  currentUserId,
  isActive = false,
  onClick,
  className = '',
}) => {
  const { colors } = useRoleTheme() as any;

  const other: ConversationParticipant | null =
    conversation.otherParticipant ||
    conversation.participants?.find(
      (p) => p._id?.toString() !== currentUserId
    ) ||
    null;

  if (!other) return null;

  const avatarUrl = getAvatarUrl(other.avatar);
  const badge = roleBadge(other.role);
  const unread = conversation.unreadCount || 0;
  const preview = lastMessagePreview(conversation, currentUserId);
  const time = formatRelative(
    conversation.lastMessage?.createdAt || conversation.lastMessageAt
  );

  return (
    <button
      type="button"
      onClick={() => onClick?.(conversation)}
      className={cn(
        'w-full flex items-start gap-3 px-3 py-3 text-left transition-all duration-200 border-l-2',
        isActive
          ? 'bg-gray-100 dark:bg-gray-800 border-l-current'
          : 'hover:bg-gray-50 dark:hover:bg-gray-900/40 border-l-transparent',
        className
      )}
      style={isActive ? { borderLeftColor: colors?.primary } : undefined}
    >
      {/* Avatar w/ presence dot */}
      <div className="relative shrink-0">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={other.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm font-medium text-gray-500">
              {(other.name?.[0] || '?').toUpperCase()}
            </div>
          )}
        </div>
        <span className="absolute bottom-0 right-0">
          <OnlineStatusDot
            lastSeen={other.lastSeen}
            isOnline={other.isOnline}
            size={12}
            showBorder
          />
        </span>
      </div>

      {/* Main */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={cn(
                'text-sm font-semibold truncate',
                unread > 0
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-800 dark:text-gray-100'
              )}
            >
              {other.name}
            </span>
            {badge && (
              <span
                className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white"
                style={{ backgroundColor: badge.color }}
              >
                {badge.label}
              </span>
            )}
          </div>
          <span className="shrink-0 text-[11px] text-gray-500 dark:text-gray-400">
            {time}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p
            className={cn(
              'text-xs truncate',
              unread > 0
                ? 'text-gray-900 dark:text-gray-100 font-medium'
                : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {preview}
          </p>
          {unread > 0 && (
            <span
              className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold text-white flex items-center justify-center"
              style={{ backgroundColor: colors?.primary || '#E63946' }}
            >
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>

        {conversation.status === 'request' && (
          <p className="mt-1 text-[10px] italic text-amber-600 dark:text-amber-400">
            Message request
          </p>
        )}
      </div>
    </button>
  );
};

export default ContactCard;

function useRoleTheme(): any {
    throw new Error('Function not implemented.');
}
