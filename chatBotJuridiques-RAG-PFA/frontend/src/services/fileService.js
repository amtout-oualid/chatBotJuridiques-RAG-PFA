import api from '../api/axiosInstance';
import { ENDPOINTS } from '../api/endpoints';

export const fileService = {
  /** GET /files — list all user files */
  listFiles: () => api.get(ENDPOINTS.FILES),

  /** POST /files/upload — upload a document */
  uploadFile: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(ENDPOINTS.FILES_UPLOAD, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
  },

  /** GET /files/search — semantic search */
  searchFiles: (query) =>
    api.get(ENDPOINTS.FILES_SEARCH, { params: { q: query } }),

  /** DELETE /files/{id} — remove a file */
  deleteFile: (id) => api.delete(ENDPOINTS.FILE_BY_ID(id)),

  /** PATCH /files/{id}/rename — rename a file */
  renameFile: (id, newName) => api.patch(`${ENDPOINTS.FILE_BY_ID(id)}/rename`, { nouveau_nom: newName }),
};
