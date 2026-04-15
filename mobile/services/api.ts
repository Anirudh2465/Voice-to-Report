import axios from 'axios';
import SecureStore from './secureStorage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — clear tokens and redirect to login
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      // AuthStore will detect the missing token and redirect
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; password: string; full_name: string; institution?: string; designation?: string }) =>
    api.post('/auth/register', data),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  pinLogin: (email: string, pin: string) =>
    api.post('/auth/pin/login', { email, pin }),
  setupPin: (pin: string) =>
    api.post('/auth/pin/setup', { pin }),
  me: () =>
    api.get('/auth/me'),
};

// ── Transcription ─────────────────────────────────────────────────────────────
export const transcribeApi = {
  transcribe: (audioUri: string, modality: string, reportId?: string) => {
    const form = new FormData();
    form.append('audio', { uri: audioUri, name: 'recording.m4a', type: 'audio/m4a' } as any);
    form.append('modality', modality);
    if (reportId) form.append('report_id', reportId);
    return api.post('/transcribe', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

// ── Correction ────────────────────────────────────────────────────────────────
export const correctApi = {
  correct: (rawText: string, modality: string, reportId?: string) =>
    api.post('/correct', { raw_text: rawText, modality, report_id: reportId }),
};

// ── Suggestions ───────────────────────────────────────────────────────────────
export const suggestionsApi = {
  getSuggestions: (correctedText: string, modality: string, reportContent?: Record<string, string>) =>
    api.post('/suggestions', { corrected_text: correctedText, modality, report_content: reportContent }),
};

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportsApi = {
  create: (data: { modality: string; patient_name?: string; patient_id?: string; template_id?: string }) =>
    api.post('/reports', data),
  list: (params?: { modality?: string; status?: string; search?: string; skip?: number; limit?: number }) =>
    api.get('/reports', { params }),
  get: (id: string) =>
    api.get(`/reports/${id}`),
  update: (id: string, data: Partial<{ patient_name: string; patient_id: string; report_content: Record<string, string>; status: string }>) =>
    api.patch(`/reports/${id}`, data),
  delete: (id: string) =>
    api.delete(`/reports/${id}`),
};

// ── Templates ─────────────────────────────────────────────────────────────────
export const templatesApi = {
  list: () => api.get('/templates'),
  get: (id: string) => api.get(`/templates/${id}`),
};

// ── Export ────────────────────────────────────────────────────────────────────
export const exportApi = {
  export: (reportId: string, format: 'pdf' | 'docx' | 'txt') =>
    api.post('/export', { report_id: reportId, format }),
};
