import api from '../api/axiosInstance';
import { ENDPOINTS } from '../api/endpoints';

export const chatService = {
  /** GET /chats — list all sessions */
  listSessions: () => api.get(ENDPOINTS.CHATS),

  /** GET /chats/search — search titles and message content */
  searchSessions: (query) =>
    api.get(ENDPOINTS.CHATS_SEARCH, { params: { query } }),

  /** POST /chats — create new session */
  createSession: (titre) =>
    api.post(ENDPOINTS.CHATS, { titre: titre || 'Nouvelle Discussion' }),

  /** GET /chats/{id} — get session messages */
  getSession: (id, limit = 50, offset = 0) =>
    api.get(ENDPOINTS.CHAT_BY_ID(id), { params: { limit, offset } }),

  /** POST /chats/{id}/messages — send a message (optional file_id for RAG context) */
  sendMessage: (id, contenu, fileId = null, model = 'gemini') =>
    api.post(ENDPOINTS.CHAT_MESSAGES(id), {
      contenu,
      ...(fileId ? { file_id: fileId } : {}),
      model,
    }),

  /** PATCH /chats/{id} — update session metadata */
  updateSession: (id, data) => api.patch(ENDPOINTS.CHAT_BY_ID(id), data),

  /** DELETE /chats/{id} — soft-delete session */
  deleteSession: (id) => api.delete(ENDPOINTS.CHAT_BY_ID(id)),
};
