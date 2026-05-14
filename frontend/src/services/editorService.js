import api from '../api/axiosInstance';
import { ENDPOINTS } from '../api/endpoints';

export const editorService = {
  /** GET /editor/templates — list templates */
  listTemplates: () => api.get(ENDPOINTS.TEMPLATES),

  /** POST /editor/compile — compile LaTeX */
  compileLaTeX: (latexCode) =>
    api.post(ENDPOINTS.COMPILE, { latex_code: latexCode }),

  /** GET /editor/docs — list user documents */
  listDocuments: () => api.get(ENDPOINTS.DOCS),

  /** POST /editor/docs — create a new document */
  createDocument: (data) => api.post(ENDPOINTS.DOCS, data),

  /** GET /editor/docs/{id} — get document detail */
  getDocument: (id) => api.get(ENDPOINTS.DOC_BY_ID(id)),

  /** PUT /editor/docs/{id} — auto-save changes */
  updateDocument: (id, data) => api.put(ENDPOINTS.DOC_BY_ID(id), data),

  /** DELETE /editor/docs/{id} — delete document */
  deleteDocument: (id) => api.delete(ENDPOINTS.DOC_BY_ID(id)),

  /** POST /editor/ai-suggest — get AI suggestions */
  aiSuggest: (latexCode, prompt) =>
    api.post(ENDPOINTS.AI_SUGGEST, { latex_code: latexCode, prompt }),
};
