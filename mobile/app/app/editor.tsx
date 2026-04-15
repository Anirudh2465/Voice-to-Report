import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useReportStore } from '../../store/reportStore';
import { suggestionsApi } from '../../services/api';
import { SuggestionPanel } from '../../components/SuggestionPanel';

const SECTIONS = ['clinical_history', 'technique', 'findings', 'impression', 'recommendations'];
const SECTION_LABELS: Record<string, string> = {
  clinical_history: 'Clinical History',
  technique: 'Technique',
  findings: 'Findings',
  impression: 'Impression',
  recommendations: 'Recommendations',
};

export default function EditorScreen() {
  const { reportId, modality } = useLocalSearchParams<{ reportId: string; modality: string }>();
  const { currentReport, updateReport } = useReportStore();
  const router = useRouter();

  const [content, setContent] = useState<Record<string, string>>(() => {
    if (currentReport?.report_content) return currentReport.report_content;
    // Pre-fill findings with corrected transcription
    return { findings: currentReport?.corrected_transcription || '' };
  });
  const [suggestions, setSuggestions] = useState<Array<{ section: string; suggestion: string; reason: string }>>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    if (!currentReport?.corrected_transcription) return;
    setLoadingSuggestions(true);
    try {
      const res = await suggestionsApi.getSuggestions(
        currentReport.corrected_transcription, modality, content
      );
      setSuggestions(res.data.suggestions || []);
    } catch {
      // Non-critical — fail silently
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateReport(reportId, { report_content: content, status: 'completed' });
      router.push({ pathname: '/app/export', params: { reportId, modality } });
    } catch (e: any) {
      Alert.alert('Save Failed', e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Results</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn} disabled={isSaving} testID="save-report-btn">
          {isSaving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save & Export →</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Report Editor</Text>
        <Text style={styles.pageSubtitle}>{modality} Report</Text>

        {/* AI Suggestions Panel */}
        <SuggestionPanel
          suggestions={suggestions}
          isLoading={loadingSuggestions}
          onApply={(suggestion, section) => {
            setContent((prev) => ({
              ...prev,
              [section]: prev[section] ? `${prev[section]}\n\n${suggestion}` : suggestion,
            }));
          }}
        />

        {/* Editable Sections */}
        {SECTIONS.map((key) => (
          <View key={key} style={styles.section}>
            <Text style={styles.sectionLabel}>{SECTION_LABELS[key]}</Text>
            <TextInput
              style={styles.sectionInput}
              value={content[key] || ''}
              onChangeText={(text) => setContent((prev) => ({ ...prev, [key]: text }))}
              placeholder={`Enter ${SECTION_LABELS[key].toLowerCase()}...`}
              placeholderTextColor="#4a5568"
              multiline
              textAlignVertical="top"
              testID={`section-input-${key}`}
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f2440' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 12,
  },
  backBtn: { padding: 8 },
  backText: { color: '#90cdf4', fontSize: 14 },
  saveBtn: {
    backgroundColor: '#3182ce',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#718096', marginBottom: 20 },
  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#63b3ed',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  sectionInput: {
    backgroundColor: '#1a365d',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#e2e8f0',
    borderWidth: 1,
    borderColor: '#2b6cb0',
    minHeight: 90,
    lineHeight: 22,
  },
});
