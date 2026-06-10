import api from '../api/axiosInstance';
import { ENDPOINTS } from '../api/endpoints';

export const authService = {
  /** POST /auth/sync — sync Clerk user to DB */
  syncUser: (data) => api.post(ENDPOINTS.AUTH_SYNC, data),

  /** GET /users/me — get current user profile */
  getMe: () => api.get(ENDPOINTS.USERS_ME),

  /** PUT /users/settings — update preferences */
  updateSettings: (data) => api.put(ENDPOINTS.USERS_SETTINGS, data),
};

export const lawyerService = {
  /** GET /lawyers — list lawyers with filters */
  listLawyers: (params = {}) => api.get(ENDPOINTS.LAWYERS, { params }),

  /** GET /lawyers/{id} — full lawyer profile */
  getLawyer: (id) => api.get(ENDPOINTS.LAWYER_BY_ID(id)),
};
