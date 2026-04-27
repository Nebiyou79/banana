import axios from "axios";

const BASE_URL = '/api/v1/messages';

export const messageService = {
  // ✅ Send message
  sendMessage: (data: {
    conversationId: string;
    content: string;
    attachments?: any[];
  }) =>
    axios.post(BASE_URL, data),

  // ✅ Get messages for conversation
  getMessages: (conversationId: string, params?: { page?: number; limit?: number }) =>
    axios.get(`${BASE_URL}/${conversationId}`, { params }),

  // ✅ Delete message
  deleteMessage: (messageId: string) =>
    axios.delete(`${BASE_URL}/${messageId}`),
};