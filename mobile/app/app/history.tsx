import { useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { useReportStore } from '../../store/reportStore';

const STATUS_COLORS: Record<string, string> = {
  draft: '#744210',
  completed: '#2c7a7b',
  exported: '#276749',
};

export default function HistoryScreen() {
  const { reports, fetchReports, isLoading, setCurrentReport } = useReportStore();
  const router = useRouter();

  useEffect(() => {
    fetchReports();
  }, []);

  const handleOpen = (report: any) => {
    setCurrentReport(report);
    router.push({ pathname: '/app/editor', params: { reportId: report.id, modality: report.modality } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Home</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Report History</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#63b3ed" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyText}>No reports yet</Text>
              <Text style={styles.emptySubText}>Start dictating to create your first report</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => handleOpen(item)}
              testID={`report-card-${item.id}`}
            >
              <View style={styles.cardLeft}>
                <View style={[styles.modalityBadge, { backgroundColor: '#1a365d' }]}>
                  <Text style={styles.modalityText}>{item.modality}</Text>
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.patientName}>{item.patient_name || 'Unnamed Patient'}</Text>
                  <Text style={styles.patientId}>ID: {item.patient_id || '—'}</Text>
                  <Text style={styles.date}>
                    {new Date(item.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </Text>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] || '#1a365d' }]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f2440' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  backBtn: { padding: 8 },
  backText: { color: '#90cdf4', fontSize: 14 },
  title: { fontSize: 20, fontWeight: '700', color: '#fff' },
  list: { padding: 20, gap: 12 },
  card: {
    backgroundColor: '#1a365d',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#2b6cb0',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  modalityBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2b6cb0',
  },
  modalityText: { color: '#63b3ed', fontSize: 11, fontWeight: '700' },
  cardContent: { flex: 1 },
  patientName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  patientId: { color: '#718096', fontSize: 12, marginTop: 2 },
  date: { color: '#4a5568', fontSize: 11, marginTop: 4 },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  emptySubText: { fontSize: 13, color: '#718096', marginTop: 6, textAlign: 'center' },
});
