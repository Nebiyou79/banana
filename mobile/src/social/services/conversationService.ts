import axios from "axios";

const BASE_URL = '/api/v1/conversations';

export const conversationService = {
  // ✅ Get all conversations
  getConversations: (params?: { page?: number; limit?: number }) =>
    axios.get(BASE_URL, { params }),

  // ✅ Message requests
  getRequests: () =>
    axios.get(`${BASE_URL}/requests`),

  // ✅ Online contacts
  getOnlineContacts: () =>
    axios.get(`${BASE_URL}/contacts/online`),

  // ✅ Get or create conversation with user
  getOrCreate: (userId: string) =>
    axios.post(`${BASE_URL}/with/${userId}`),

  // ✅ Get single conversation
  getById: (id: string) =>
    axios.get(`${BASE_URL}/${id}`),

  // ✅ Accept request
  accept: (id: string) =>
    axios.put(`${BASE_URL}/${id}/accept`),

  // ✅ Decline request
  decline: (id: string) =>
    axios.put(`${BASE_URL}/${id}/decline`),

  // ✅ Mark as read
  markAsRead: (id: string) =>
    axios.put(`${BASE_URL}/${id}/read`),

  // ✅ Delete conversation
  delete: (id: string) =>
    axios.delete(`${BASE_URL}/${id}`),
};