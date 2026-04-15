import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';

interface Suggestion {
  section: string;
  suggestion: string;
  reason: string;
}

interface SuggestionPanelProps {
  suggestions: Suggestion[];
  isLoading: boolean;
  onApply: (suggestion: string, section: string) => void;
}

export function SuggestionPanel({ suggestions, isLoading, onApply }: SuggestionPanelProps) {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#63b3ed" />
        <Text style={styles.loadingText}>Generating AI suggestions...</Text>
      </View>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>✨ AI Suggestions</Text>
      <Text style={styles.subtitle}>Claude has identified items to enhance completeness</Text>
      {suggestions.map((s, i) => (
        <View key={i} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.section}>{s.section}</Text>
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => onApply(s.suggestion, s.section.toLowerCase().replace(/ /g, '_'))}
              testID={`apply-suggestion-${i}`}
            >
              <Text style={styles.applyBtnText}>+ Apply</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.suggestionText}>{s.suggestion}</Text>
          <Text style={styles.reason}>💡 {s.reason}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0e2b2b',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2c7a7b',
  },
  loadingText: { color: '#90cdf4', fontSize: 13, marginTop: 8, textAlign: 'center' },
  title: { color: '#81e6d9', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: '#4a9999', fontSize: 12, marginBottom: 12 },
  card: {
    backgroundColor: '#0d2222',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#234e52',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  section: { color: '#81e6d9', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  applyBtn: {
    backgroundColor: '#2c7a7b',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  applyBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  suggestionText: { color: '#e2e8f0', fontSize: 13, lineHeight: 20, marginBottom: 6 },
  reason: { color: '#4a9999', fontSize: 11 },
});
