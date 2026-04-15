import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  Alert, ActivityIndicator, Linking
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { exportApi } from '../../services/api';

type ExportFormat = 'pdf' | 'docx' | 'txt';

const FORMATS: { id: ExportFormat; label: string; emoji: string; desc: string }[] = [
  { id: 'pdf',  label: 'PDF',  emoji: '📄', desc: 'For sharing, printing, and archiving' },
  { id: 'docx', label: 'Word', emoji: '📝', desc: 'Editable document for further editing' },
  { id: 'txt',  label: 'Text', emoji: '📋', desc: 'Plain text for EMR copy-paste' },
];

export default function ExportScreen() {
  const { reportId, modality } = useLocalSearchParams<{ reportId: string; modality: string }>();
  const [selected, setSelected] = useState<ExportFormat>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const router = useRouter();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await exportApi.export(reportId, selected);
      const { download_url } = res.data;

      // Open download URL in browser / share sheet
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Linking.openURL(download_url);
      } else {
        Alert.alert('Download Ready', `Your ${selected.toUpperCase()} report is ready. Opening download link...`);
        await Linking.openURL(download_url);
      }
    } catch (e: any) {
      Alert.alert('Export Failed', e.response?.data?.detail || e.message || 'Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Editor</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>Export Report</Text>
        <Text style={styles.subtitle}>Choose your preferred format</Text>

        {FORMATS.map((fmt) => (
          <TouchableOpacity
            key={fmt.id}
            style={[styles.formatCard, selected === fmt.id && styles.formatCardSelected]}
            onPress={() => setSelected(fmt.id)}
            testID={`format-${fmt.id}`}
          >
            <Text style={styles.formatEmoji}>{fmt.emoji}</Text>
            <View style={styles.formatInfo}>
              <Text style={styles.formatLabel}>{fmt.label}</Text>
              <Text style={styles.formatDesc}>{fmt.desc}</Text>
            </View>
            {selected === fmt.id && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.exportBtn, isExporting && styles.exportBtnDisabled]}
          onPress={handleExport}
          disabled={isExporting}
          testID="export-btn"
        >
          {isExporting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.exportBtnText}>Download {selected.toUpperCase()} Report</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => router.replace('/app')}
          testID="done-btn"
        >
          <Text style={styles.doneBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f2440' },
  header: { padding: 20, paddingBottom: 0 },
  backBtn: { padding: 8, alignSelf: 'flex-start' },
  backText: { color: '#90cdf4', fontSize: 14 },
  body: { flex: 1, padding: 24 },
  title: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#718096', marginBottom: 28 },
  formatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a365d',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#2b6cb0',
    gap: 16,
  },
  formatCardSelected: { borderColor: '#63b3ed', backgroundColor: '#1e4a7a' },
  formatEmoji: { fontSize: 28 },
  formatInfo: { flex: 1 },
  formatLabel: { fontSize: 16, fontWeight: '700', color: '#fff' },
  formatDesc: { fontSize: 12, color: '#718096', marginTop: 2 },
  checkmark: { fontSize: 20, color: '#63b3ed' },
  exportBtn: {
    backgroundColor: '#3182ce',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
  },
  exportBtnDisabled: { opacity: 0.6 },
  exportBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  doneBtn: {
    alignItems: 'center',
    padding: 16,
    marginTop: 12,
  },
  doneBtnText: { color: '#718096', fontSize: 14 },
});
