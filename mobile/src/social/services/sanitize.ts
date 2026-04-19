import type { Post, Profile } from '../types';

/**
 * Sanitizers ensure that any nested object returned by the API is coerced into
 * the shape the UI expects. Guards against "Object as React child" crashes
 * when fields arrive as unexpected shapes (e.g. populated vs unpopulated refs).
 */
export const sanitizeSocialData = {
  post: (raw: any): Post => ({
    ...raw,
    _id: String(raw?._id ?? ''),
    content: String(raw?.content ?? ''),
    type: raw?.type ?? 'text',
    visibility: raw?.visibility ?? 'public',
    status: raw?.status ?? 'active',
    authorModel: raw?.authorModel ?? 'User',
    allowComments: raw?.allowComments ?? true,
    allowSharing: raw?.allowSharing ?? true,
    pinned: Boolean(raw?.pinned),
    stats: {
      likes: Number(raw?.stats?.likes ?? 0),
      dislikes: Number(raw?.stats?.dislikes ?? 0),
      comments: Number(raw?.stats?.comments ?? 0),
      shares: Number(raw?.stats?.shares ?? 0),
      views: Number(raw?.stats?.views ?? 0),
      saves: Number(raw?.stats?.saves ?? 0),
    },
    author: {
      _id: String(raw?.author?._id ?? ''),
      name: String(raw?.author?.name ?? 'Unknown'),
      avatar: raw?.author?.avatar ?? undefined,
      role: raw?.author?.role ?? 'candidate',
      headline: raw?.author?.headline ?? undefined,
      verificationStatus: raw?.author?.verificationStatus ?? undefined,
      username: raw?.author?.username ?? undefined,
    },
    media: Array.isArray(raw?.media) ? raw.media : [],
    hashtags: Array.isArray(raw?.hashtags) ? raw.hashtags : [],
    isSaved: Boolean(raw?.isSaved),
    hasLiked: Boolean(raw?.hasLiked),
    hasDisliked: Boolean(raw?.hasDisliked),
    canEdit: Boolean(raw?.canEdit),
    canDelete: Boolean(raw?.canDelete),
    createdAt: String(raw?.createdAt ?? ''),
    updatedAt: String(raw?.updatedAt ?? ''),
  }),

  posts: (raws: any[]): Post[] =>
    Array.isArray(raws) ? raws.map((r) => sanitizeSocialData.post(r)) : [],

  profile: (raw: any): Profile =>
    ({
      ...raw,
      socialStats: {
        followerCount: Number(raw?.socialStats?.followerCount ?? 0),
        followingCount: Number(raw?.socialStats?.followingCount ?? 0),
        postCount: Number(raw?.socialStats?.postCount ?? 0),
        profileViews: Number(raw?.socialStats?.profileViews ?? 0),
        connectionCount: Number(raw?.socialStats?.connectionCount ?? 0),
        engagementRate: Number(raw?.socialStats?.engagementRate ?? 0),
        averageResponseTime: Number(raw?.socialStats?.averageResponseTime ?? 0),
        endorsementCount: Number(raw?.socialStats?.endorsementCount ?? 0),
      },
      roleSpecific: {
        skills: Array.isArray(raw?.roleSpecific?.skills)
          ? raw.roleSpecific.skills
          : [],
        education: Array.isArray(raw?.roleSpecific?.education)
          ? raw.roleSpecific.education
          : [],
        experience: Array.isArray(raw?.roleSpecific?.experience)
          ? raw.roleSpecific.experience
          : [],
        certifications: Array.isArray(raw?.roleSpecific?.certifications)
          ? raw.roleSpecific.certifications
          : [],
        portfolio: Array.isArray(raw?.roleSpecific?.portfolio)
          ? raw.roleSpecific.portfolio
          : [],
        companyInfo: raw?.roleSpecific?.companyInfo ?? undefined,
      },
      socialLinks: raw?.socialLinks ?? {},
      languages: Array.isArray(raw?.languages) ? raw.languages : [],
      interests: Array.isArray(raw?.interests) ? raw.interests : [],
      awards: Array.isArray(raw?.awards) ? raw.awards : [],
      volunteerExperience: Array.isArray(raw?.volunteerExperience)
        ? raw.volunteerExperience
        : [],
    } as Profile),
};
