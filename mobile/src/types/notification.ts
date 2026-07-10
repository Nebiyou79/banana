// src/types/notification.ts

export type NotificationPriority = 'critical' | 'high' | 'normal' | 'low';

export type NotificationType =
  // Social
  | 'new_follower' | 'new_connection' | 'post_liked' | 'post_reacted'
  | 'post_comment' | 'comment_reply' | 'post_mentioned' | 'comment_mentioned' | 'post_shared'
  // Messaging
  | 'new_message' | 'message_request' | 'message_request_accepted'
  // Jobs
  | 'new_job_match' | 'application_received' | 'application_status'
  | 'application_shortlisted' | 'application_rejected' | 'offer_made'
  // Tenders/Bids
  | 'bid_received' | 'bid_status_changed' | 'bid_shortlisted'
  | 'bid_awarded' | 'bid_rejected' | 'bid_revealed' | 'tender_addendum' | 'tender_invited'
  // Proposals
  | 'proposal_received' | 'proposal_status' | 'proposal_shortlisted'
  | 'proposal_awarded' | 'proposal_rejected'
  // Verification
  | 'verification_submitted' | 'verification_status'
  | 'verification_approved' | 'verification_rejected'
  // Appointments
  | 'appointment_confirmed' | 'appointment_reminder'
  | 'appointment_cancelled' | 'new_appointment_admin'
  // Referrals
  | 'referral_signup' | 'referral_completed' | 'reward_earned'
  // System
  | 'system_announcement' | 'profile_view';

export type NotificationCategory =
  | 'social' | 'messaging' | 'jobs' | 'tenders'
  | 'proposals' | 'verification' | 'appointments' | 'referrals' | 'system';

export interface NotificationActor {
  _id: string;
  name: string;
  avatar?: string;
  role?: string;
}

export interface NotificationData {
  entityType: string | null;
  entityId: string | null;
  screen: string | null;
  params: Record<string, unknown>;
}

export interface Notification {
  _id: string;
  recipient: string;
  actor: NotificationActor | null;
  type: NotificationType;
  title: string;
  body: string;
  data: NotificationData;
  channels: {
    inApp: boolean;
    push: boolean;
    email: boolean;
  };
  read: boolean;
  readAt: string | null;
  priority: NotificationPriority;
  groupKey: string | null;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    unreadCount: number;
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface ChannelSettings {
  inApp: boolean;
  push: boolean;
  email: boolean;
}

export interface NotificationPreferences {
  _id: string;
  user: string;
  globalEnabled: boolean;
  categories: {
    social: ChannelSettings;
    messaging: ChannelSettings;
    jobs: ChannelSettings;
    tenders: ChannelSettings;
    proposals: ChannelSettings;
    verification: ChannelSettings;
    appointments: ChannelSettings;
    referrals: ChannelSettings;
    system: ChannelSettings;
  };
  quietHours: {
    enabled: boolean;
    startHour: number;
    endHour: number;
    timezone: string;
  };
  emailDigest: {
    enabled: boolean;
    frequency: 'daily' | 'weekly';
    hour: number;
  };
}