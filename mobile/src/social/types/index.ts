/**
 * Banana Social — Type Definitions Barrel
 *
 * Source of truth for every type consumed by services, hooks, and components.
 * Import like: `import type { Post, Profile, UserRole } from '../types';`
 */

// ── 1. Primitives ────────────────────────────────────────────────────
export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';
export type InteractionType = 'reaction' | 'dislike';
export type PostVisibility = 'public' | 'connections' | 'private';
export type PostType =
  | 'text'
  | 'image'
  | 'video'
  | 'link'
  | 'poll'
  | 'job'
  | 'achievement';
export type PostStatus = 'active' | 'hidden' | 'deleted';
export type TargetType = 'Post' | 'Comment';
export type FollowTargetType = 'User' | 'Company' | 'Organization';
export type UserRole =
  | 'candidate'
  | 'freelancer'
  | 'company'
  | 'organization';
export type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';

// ── 2. Media ─────────────────────────────────────────────────────────
export interface MediaDimensions {
  width?: number;
  height?: number;
}

export interface PostMedia {
  _id?: string;
  type: 'image' | 'video' | 'document';
  public_id: string;
  secure_url: string;
  resource_type: 'image' | 'video' | 'raw';
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
  duration?: number;
  url: string;
  thumbnail?: string;
  description?: string;
  order?: number;
  originalName?: string;
  size?: number;
  mimeType?: string;
  dimensions?: MediaDimensions;
  created_at?: string;
  tags?: string[];
}

// ── 3. Post ──────────────────────────────────────────────────────────
export interface PostStats {
  likes: number;
  dislikes: number;
  comments: number;
  shares: number;
  views: number;
  saves: number;
}

export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  domain?: string;
}

export interface PollOption {
  _id?: string;
  text: string;
  votes: number;
}

export interface Poll {
  question: string;
  options: PollOption[];
  totalVotes: number;
  expiresAt?: string;
  allowMultiple: boolean;
}

export interface PostLocation {
  name?: string;
  coordinates?: [number, number];
}

export interface PostAuthor {
  _id: string;
  name: string;
  avatar?: string;
  role?: UserRole;
  headline?: string;
  verificationStatus?: VerificationStatus;
  username?: string;
}

export interface UserInteraction {
  interactionType: InteractionType;
  value: ReactionType | 'dislike';
  emoji?: string;
}

export interface Post {
  _id: string;
  author: PostAuthor;
  authorModel: 'User' | 'Company' | 'Organization';
  content: string;
  type: PostType;
  media: PostMedia[];
  stats: PostStats;
  visibility: PostVisibility;
  status: PostStatus;
  hashtags: string[];
  allowComments: boolean;
  allowSharing: boolean;
  pinned: boolean;
  pinnedUntil?: string;
  linkPreview?: LinkPreview;
  poll?: Poll;
  location?: PostLocation;
  expiresAt?: string;
  originalPost?: string;
  originalAuthor?: PostAuthor;
  userReaction?: ReactionType;
  userInteraction?: UserInteraction;
  hasLiked?: boolean;
  hasDisliked?: boolean;
  isSaved?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  lastEditedAt?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ── 4. Create / Update Post ──────────────────────────────────────────
export interface CreatePostData {
  content: string;
  type?: PostType;
  visibility?: PostVisibility;
  allowComments?: boolean;
  allowSharing?: boolean;
  pinned?: boolean;
  location?: PostLocation;
  expiresAt?: string;
  linkPreview?: LinkPreview;
  poll?: Omit<Poll, 'totalVotes'>;
  job?: string;
  mediaFiles?: { uri: string; type: string; name: string }[];
  mediaDescription?: string;
}

export interface UpdatePostData extends Partial<CreatePostData> {
  hashtags?: string[];
  mediaToRemove?: string[];
  media?: Partial<PostMedia>[];
}

// ── 5. API Wrappers ──────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext?: boolean;
  };
  message?: string;
  code?: string;
}

export type PostResponse = ApiResponse<Post>;
export type PostsResponse = PaginatedResponse<Post>;

// ── 6. Comment ───────────────────────────────────────────────────────
export interface CommentAuthor {
  _id: string;
  name: string;
  avatar?: string;
  role?: UserRole;
  headline?: string;
}

export interface CommentMention {
  user: string;
  username: string;
}

export interface CommentMetadata {
  depth: number;
  replyCount: number;
  hasReplies: boolean;
}

export interface Comment {
  _id: string;
  author: CommentAuthor;
  parentType: 'Post' | 'Comment';
  parentId: string;
  content: string;
  media?: PostMedia[];
  mentions?: CommentMention[];
  hashtags?: string[];
  likes: number;
  isLiked?: boolean;
  metadata: CommentMetadata;
  moderation: {
    status: 'active' | 'hidden' | 'deleted';
  };
  createdAt: string;
  updatedAt: string;
}

export interface AddCommentData {
  content: string;
  parentType?: 'Post' | 'Comment';
  media?: { uri: string; type: string; name: string }[];
  mentions?: string[];
  hashtags?: string[];
}

// ── 7. Follow ────────────────────────────────────────────────────────
export interface FollowTarget {
  _id: string;
  name: string;
  avatar?: string;
  headline?: string;
  role?: UserRole;
  verificationStatus?: VerificationStatus;
}

export interface Follow {
  _id: string;
  follower: string | FollowTarget;
  targetType: FollowTargetType;
  targetId: string | FollowTarget;
  followSource?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface FollowStats {
  followers: number;
  following: number;
  totalConnections: number;
}

export interface FollowStatus {
  following: boolean;
  followId?: string;
  status?: string;
}

export interface BulkFollowStatus {
  [userId: string]: FollowStatus;
}

// ── 8. Profile ───────────────────────────────────────────────────────
export interface SocialStats {
  followerCount: number;
  followingCount: number;
  postCount: number;
  profileViews: number;
  connectionCount: number;
  engagementRate: number;
  averageResponseTime: number;
  endorsementCount: number;
}

export interface SocialLinks {
  linkedin?: string;
  github?: string;
  twitter?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  portfolio?: string;
}

export interface ProfileAvatar {
  public_id?: string;
  secure_url?: string;
  url?: string;
}

export interface Skill {
  name?: string;
  level?: string;
}

export interface Education {
  _id?: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  grade?: string;
  activities?: string;
  description?: string;
}

export interface Experience {
  _id?: string;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
  employmentType?: string;
  location?: string;
}

export interface Certification {
  _id?: string;
  name: string;
  issuer: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  skills?: string[];
}

export interface PortfolioItem {
  _id?: string;
  title: string;
  description?: string;
  url?: string;
  images?: string[];
  technologies?: string[];
  budget?: number;
  duration?: string;
  client?: string;
  completionDate?: string;
  teamSize?: number;
  role?: string;
}

export interface CompanyInfo {
  size?: string;
  industry?: string;
  companyType?: string;
  foundedYear?: number;
  mission?: string;
  website?: string;
  tagline?: string;
}

export interface ProfileCompletion {
  percentage: number;
  completedSections: string[];
  lastUpdated: string;
  requiredFields: string[];
  completedFields: string[];
}

export interface Profile {
  _id: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
    role: UserRole;
    email?: string;
    verificationStatus?: VerificationStatus;
  };
  headline?: string;
  bio?: string;
  location?: string;
  website?: string;
  socialLinks: SocialLinks;
  avatar?: ProfileAvatar;
  coverPhoto?: ProfileAvatar;
  roleSpecific: {
    skills: (string | Skill)[];
    education: Education[];
    experience: Experience[];
    certifications: Certification[];
    portfolio: PortfolioItem[];
    companyInfo?: CompanyInfo;
  };
  socialStats: SocialStats;
  profileCompletion: ProfileCompletion;
  verificationStatus: VerificationStatus;
  languages: { language: string; proficiency: string }[];
  interests: string[];
  awards: {
    title: string;
    issuer: string;
    date?: string;
    description?: string;
  }[];
  volunteerExperience: {
    organization: string;
    role: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }[];
  featured?: boolean;
  lastActive?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicProfile extends Profile {
  isFollowing?: boolean;
  isMutualFollow?: boolean;
}

// ── 9. Search ────────────────────────────────────────────────────────
export type SearchType =
  | 'all'
  | 'candidate'
  | 'freelancer'
  | 'company'
  | 'organization';
export type SearchSortBy =
  | 'relevance'
  | 'followers'
  | 'recent'
  | 'alphabetical';

export interface SearchParams {
  q: string;
  type?: SearchType;
  industry?: string;
  location?: string;
  skills?: string | string[];
  minFollowers?: number;
  maxFollowers?: number;
  verificationStatus?: string;
  page?: number;
  limit?: number;
  sortBy?: SearchSortBy;
}

export interface SearchResult {
  _id: string;
  name: string;
  avatar?: string;
  role: UserRole;
  headline?: string;
  location?: string;
  followerCount?: number;
  verificationStatus?: VerificationStatus;
  isFollowing?: boolean;
  industry?: string;
  skills?: string[];
}

export interface SearchResponse {
  results: SearchResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  total: number;
}

// ── 10. Ads ──────────────────────────────────────────────────────────
export type AdPlacement =
  | 'feed'
  | 'myPosts'
  | 'savedPosts'
  | 'network'
  | 'search'
  | 'profile'
  | 'editProfile';

export interface AdConfig {
  id: string;
  role: UserRole;
  placement: AdPlacement[];
  title: string;
  subtitle: string;
  ctaText: string;
  ctaRoute?: string;
  icon: string;
  backgroundColor?: string;
}

// ── 11. Interaction Stats ────────────────────────────────────────────
export interface InteractionStats {
  reactions: {
    total: number;
    breakdown: Record<ReactionType, number>;
  };
  dislikes: {
    total: number;
  };
  summary: {
    totalInteractions: number;
    engagementRate: number;
  };
}