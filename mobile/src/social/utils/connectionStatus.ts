/**
 * Connection status — derives the FollowButton UI state from backend truth.
 * -----------------------------------------------------------------------------
 * Rule precedence:
 *   1. self       — target is current user
 *   2. blocked    — either side has status 'blocked'
 *   3. connected  — I follow them AND they follow me (mutual)
 *   4. following  — I follow them, they do NOT follow me
 *   5. follow_back — they follow me, I do NOT follow them  ← critical case
 *   6. none       — neither follows the other
 *
 * No bugs found. File is correct as-is.
 */

import type { ConnectionStatus } from '../types/follow';

export interface ConnectionStatusInput {
  /** Is the viewer looking at their own profile? */
  isSelf?: boolean;
  /** Me → target follow relationship */
  iFollow: boolean;
  /** Target → me follow relationship */
  theyFollow: boolean;
  /** Either side has blocked the other */
  isBlocked?: boolean;
}

export const deriveConnectionStatus = ({
  isSelf,
  iFollow,
  theyFollow,
  isBlocked,
}: ConnectionStatusInput): ConnectionStatus => {
  if (isSelf) return 'self';
  if (isBlocked) return 'blocked';
  if (iFollow && theyFollow) return 'connected';
  if (iFollow) return 'following';
  if (theyFollow) return 'follow_back';
  return 'none';
};

/** True when starting a chat is allowed (not blocked, not self). */
export const canChat = (status: ConnectionStatus): boolean =>
  status !== 'blocked' && status !== 'self';

/**
 * True when "Start Chat" opens a direct conversation.
 * False means it's a Message Request (following but not mutual).
 */
export const isDirectChat = (status: ConnectionStatus): boolean =>
  status === 'connected';