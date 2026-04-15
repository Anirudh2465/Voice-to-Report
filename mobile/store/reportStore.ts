import { create } from 'zustand';
import { reportsApi, transcribeApi, correctApi } from '../services/api';

interface Report {
  id: string;
  patient_name?: string;
  patient_id?: string;
  modality: string;
  status: string;
  raw_transcription?: string;
  corrected_transcription?: string;
  ai_suggestions?: Array<{ section: string; suggestion: string; reason: string }>;
  report_content?: Record<string, string>;
  created_at: string;
  updated_at: string;
}

interface ReportState {
  reports: Report[];
  currentReport: Report | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchReports: (params?: { modality?: string; search?: string }) => Promise<void>;
  createReport: (modality: string, patientName?: string, patientId?: string) => Promise<Report>;
  updateReport: (id: string, data: Partial<Report>) => Promise<void>;
  setCurrentReport: (report: Report | null) => void;
  transcribeAndCorrect: (audioUri: string, modality: string, reportId: string) => Promise<{
    raw: string;
    corrected: string;
  }>;
  clearError: () => void;
}

export const useReportStore = create<ReportState>((set, get) => ({
  reports: [],
  currentReport: null,
  isLoading: false,
  error: null,

  fetchReports: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const res = await reportsApi.list(params);
      set({ reports: res.data });
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },

  createReport: async (modality, patientName, patientId) => {
    const res = await reportsApi.create({
      modality,
      patient_name: patientName,
      patient_id: patientId,
    });
    const newReport: Report = res.data;
    set((state) => ({ reports: [newReport, ...state.reports], currentReport: newReport }));
    return newReport;
  },

  updateReport: async (id, data) => {
    const res = await reportsApi.update(id, data);
    const updated: Report = res.data;
    set((state) => ({
      reports: state.reports.map((r) => (r.id === id ? updated : r)),
      currentReport: state.currentReport?.id === id ? updated : state.currentReport,
    }));
  },

  setCurrentReport: (report) => set({ currentReport: report }),

  transcribeAndCorrect: async (audioUri, modality, reportId) => {
    // Step 1: Transcribe
    const transcribeRes = await transcribeApi.transcribe(audioUri, modality, reportId);
    const rawText: string = transcribeRes.data.raw_transcription;

    // Step 2: Correct
    const correctRes = await correctApi.correct(rawText, modality, reportId);
    const correctedText: string = correctRes.data.corrected_transcription;

    // Update local state
    set((state) => ({
      currentReport: state.currentReport
        ? { ...state.currentReport, raw_transcription: rawText, corrected_transcription: correctedText }
        : null,
    }));

    return { raw: rawText, corrected: correctedText };
  },

  clearError: () => set({ error: null }),
}));
