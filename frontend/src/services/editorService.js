import api from '../api/axiosInstance';
import { ENDPOINTS } from '../api/endpoints';

export const editorService = {
  /** GET /editor/templates — list templates */
  listTemplates: () => api.get(ENDPOINTS.TEMPLATES),

  /** POST /editor/compile — compile LaTeX */
  compileLaTeX: (latexCode, documentId = null) =>
    api.post(ENDPOINTS.COMPILE, { latex_code: latexCode, document_id: documentId }),

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
  aiSuggest: (latexCode, prompt, documentId = null) =>
    api.post(ENDPOINTS.AI_SUGGEST, { latex_code: latexCode, prompt, document_id: documentId }),

  /** GET /editor/docs/{id}/files — list project files */
  listProjectFiles: (docId) => api.get(ENDPOINTS.DOC_FILES(docId)),

  /** POST /editor/docs/{id}/files — upload project file */
  uploadProjectFile: (docId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(ENDPOINTS.DOC_FILES(docId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  /** PUT /editor/docs/{id}/files/{fileId}/rename — rename project file */
  renameProjectFile: (docId, fileId, newName) => 
    api.put(ENDPOINTS.DOC_FILE_RENAME(docId, fileId), { nouveau_nom: newName }),

  /** DELETE /editor/docs/{id}/files/{fileId} — delete project file */
  deleteProjectFile: (docId, fileId) =>
    api.delete(ENDPOINTS.DOC_FILE_BY_ID(docId, fileId)),
};
