/**
 * frontend/src/components/social/chat/MessageRequestBanner.tsx
 * ────────────────────────────────────────────────────────────────────────────
 * BananaLink Social System v2.0 — Message Request Banner (web, NEW)
 *
 * Shown at the top of ChatWindow when conversation.status === 'request' AND
 * the current user is NOT the requester. Offers Accept / Decline buttons.
 *
 * If the current user IS the requester, we show a passive "Request sent"
 * notice instead (no action buttons).
 * ────────────────────────────────────────────────────────────────────────────
 */
import React from 'react';
import { Check, X, Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/social/ui/Button';
import { cn } from '@/lib/utils';

interface MessageRequestBannerProps {
  otherUserName: string;
  isRequester: boolean; // true if the CURRENT user sent the request
  onAccept: () => void;
  onDecline: () => void;
  isLoading?: boolean;
  className?: string;
}

const MessageRequestBanner: React.FC<MessageRequestBannerProps> = ({
  otherUserName,
  isRequester,
  onAccept,
  onDecline,
  isLoading = false,
  className = '',
}) => {
  if (isRequester) {
    return (
      <div
        className={cn(
          'flex items-start gap-3 px-4 py-3 border-b border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20',
          className
        )}
      >
        <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900 dark:text-amber-100">
          <p className="font-medium">Message request sent</p>
          <p className="text-amber-700 dark:text-amber-300 mt-0.5">
            Waiting for {otherUserName} to accept. They`ll see your
            messages once they reply.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 border-b border-blue-200 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/20',
        className
      )}
    >
      <div className="flex-1 text-sm text-blue-900 dark:text-blue-100">
        <p className="font-medium">{otherUserName} wants to message you</p>
        <p className="text-blue-700 dark:text-blue-300 mt-0.5 text-xs">
          Accept to chat freely. Replying will also accept.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          variant="outline"
          onClick={onDecline}
          disabled={isLoading}
          className="gap-1.5"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <X className="w-3.5 h-3.5" />
          )}
          Decline
        </Button>
        <Button
          size="sm"
          onClick={onAccept}
          disabled={isLoading}
          className="gap-1.5"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
          Accept
        </Button>
      </div>
    </div>
  );
};

export default MessageRequestBanner;