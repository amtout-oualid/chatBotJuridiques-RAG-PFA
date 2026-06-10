/**
 * endpoints.js — Constant file for all API paths.
 * Matches roots.txt exactly.
 */
export const ENDPOINTS = {
  // 1. Auth & Users
  AUTH_SYNC:       '/auth/sync',
  USERS_ME:        '/users/me',
  USERS_SETTINGS:  '/users/settings',

  // 2. AI Chat
  CHATS:           '/chats',
  CHATS_SEARCH:    '/chats/search',
  CHAT_BY_ID:      (id) => `/chats/${id}`,
  CHAT_MESSAGES:   (id) => `/chats/${id}/messages`,

  // 3. Files (DMS)
  FILES:           '/files',
  FILES_UPLOAD:    '/files/upload',
  FILES_SEARCH:    '/files/search',
  FILE_BY_ID:      (id) => `/files/${id}`,

  // 4. Editor
  TEMPLATES:       '/editor/templates',
  COMPILE:         '/editor/compile',
  DOCS:            '/editor/docs',
  DOC_BY_ID:       (id) => `/editor/docs/${id}`,
  AI_SUGGEST:      '/editor/ai-suggest',
  DOC_FILES:       (id) => `/editor/docs/${id}/files`,
  DOC_FILE_BY_ID:  (docId, fileId) => `/editor/docs/${docId}/files/${fileId}`,
  DOC_FILE_RENAME: (docId, fileId) => `/editor/docs/${docId}/files/${fileId}/rename`,

  // 5. Lawyers
  LAWYERS:         '/lawyers',
  LAWYER_BY_ID:    (id) => `/lawyers/${id}`,
};
