import api from '../../lib/api';
import type { SocialLinks } from '../types';

export interface ProfileUpdateData {
  headline?: string;
  bio?: string;
  location?: string;
  website?: string;
}

export interface PopularProfilesParams {
  page?: number;
  limit?: number;
  role?: 'candidate' | 'freelancer' | 'company' | 'organization';
}

export const profileSocialService = {
  // GET /profile/
  getProfile: () => api.get('/profile/'),

  // PUT /profile/
  updateProfile: (data: ProfileUpdateData) => api.put('/profile/', data),

  // GET /profile/public/:userId
  getPublicProfile: (userId: string) => api.get(`/profile/public/${userId}`),

  // POST /profile/avatar — multipart/form-data, field "avatar"
  uploadAvatar: (uri: string, type: string, name: string) => {
    const form = new FormData();
    form.append('avatar', { uri, type, name } as any);
    return api.post('/profile/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // POST /profile/cover — multipart/form-data, field "cover"
  uploadCover: (uri: string, type: string, name: string) => {
    const form = new FormData();
    form.append('cover', { uri, type, name } as any);
    return api.post('/profile/cover', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // DELETE /profile/avatar
  deleteAvatar: () => api.delete('/profile/avatar'),

  // DELETE /profile/cover
  deleteCover: () => api.delete('/profile/cover'),

  // PUT /profile/social-links
  updateSocialLinks: (links: SocialLinks) =>
    api.put('/profile/social-links', { socialLinks: links }),

  // PUT /profile/professional-info
  updateProfessionalInfo: (info: Record<string, unknown>) =>
    api.put('/profile/professional-info', info),

  // GET /profile/completion
  getProfileCompletion: () => api.get('/profile/completion'),

  // PUT /profile/privacy-settings
  updatePrivacySettings: (settings: Record<string, unknown>) =>
    api.put('/profile/privacy-settings', settings),

  // PUT /profile/notification-preferences
  updateNotificationPreferences: (prefs: Record<string, unknown>) =>
    api.put('/profile/notification-preferences', prefs),

  // GET /profile/summary
  getProfileSummary: () => api.get('/profile/summary'),

  // GET /profile/popular
  getPopularProfiles: (params: PopularProfilesParams = {}) =>
    api.get('/profile/popular', { params: { limit: 10, ...params } }),
};

export default profileSocialService;
