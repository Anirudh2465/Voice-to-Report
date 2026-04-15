import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useReportStore } from '../../store/reportStore';

export default function ResultsScreen() {
  const { reportId, modality } = useLocalSearchParams<{ reportId: string; modality: string }>();
  const { currentReport } = useReportStore();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Dictate Again</Text>
        </TouchableOpacity>
        <Text style={styles.modalityBadge}>{modality}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Transcription Results</Text>

        {/* Raw Transcription */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>🎙 Raw Transcription</Text>
          <Text style={styles.cardSubLabel}>What Whisper heard</Text>
          <Text style={styles.cardText}>
            {currentReport?.raw_transcription || 'No transcription available.'}
          </Text>
        </View>

        {/* AI Corrected */}
        <View style={[styles.card, styles.correctedCard]}>
          <Text style={styles.cardLabel}>✨ AI Corrected</Text>
          <Text style={styles.cardSubLabel}>Indian accent + medical terminology corrected by Claude</Text>
          <Text style={styles.cardText}>
            {currentReport?.corrected_transcription || 'No correction available.'}
          </Text>
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push({ pathname: '/app/editor', params: { reportId, modality } })}
          testID="continue-to-editor-btn"
        >
          <Text style={styles.primaryBtnText}>Continue to Report Editor →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push({ pathname: '/app/dictate', params: { reportId, modality } })}
        >
          <Text style={styles.secondaryBtnText}>Re-record</Text>
        </TouchableOpacity>
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
  },
  backBtn: { padding: 8 },
  backText: { color: '#90cdf4', fontSize: 14 },
  modalityBadge: {
    backgroundColor: '#1a365d',
    color: '#63b3ed',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    fontSize: 13,
    fontWeight: '700',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 20 },
  card: {
    backgroundColor: '#1a365d',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2b6cb0',
  },
  correctedCard: {
    borderColor: '#2c7a7b',
    backgroundColor: '#0e2b2b',
  },
  cardLabel: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 4 },
  cardSubLabel: { fontSize: 12, color: '#718096', marginBottom: 12 },
  cardText: { fontSize: 14, color: '#e2e8f0', lineHeight: 22 },
  primaryBtn: {
    backgroundColor: '#3182ce',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryBtn: {
    backgroundColor: '#1a365d',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#2b6cb0',
  },
  secondaryBtnText: { color: '#90cdf4', fontWeight: '600', fontSize: 14 },
});
