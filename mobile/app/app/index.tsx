import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useReportStore } from '../../store/reportStore';
import { ModalityCard } from '../../components/ModalityCard';

const MODALITIES = [
  { id: 'USG',  label: 'Ultrasound',  emoji: '🔊', color: '#2b6cb0', desc: 'Abdomen, Pelvis, Thyroid, Obstetric' },
  { id: 'CT',   label: 'CT Scan',     emoji: '🌀', color: '#6b46c1', desc: 'Chest, Abdomen, Brain, Spine' },
  { id: 'MRI',  label: 'MRI',         emoji: '🧲', color: '#2c7a7b', desc: 'Brain, Spine, Joints, Abdomen' },
  { id: 'XRAY', label: 'X-Ray',       emoji: '🦴', color: '#744210', desc: 'Chest, Bones, Abdomen' },
];

export default function ModalitySelectorScreen() {
  const { user, logout } = useAuthStore();
  const { createReport } = useReportStore();
  const router = useRouter();

  const handleSelectModality = async (modalityId: string) => {
    const report = await createReport(modalityId);
    router.push({ pathname: '/app/dictate', params: { reportId: report.id, modality: modalityId } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good Morning 👋</Text>
            <Text style={styles.name}>Dr. {user?.full_name}</Text>
            <Text style={styles.institution}>{user?.institution}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Select Modality */}
        <Text style={styles.sectionTitle}>Select Modality</Text>
        <Text style={styles.sectionSub}>Choose the type of imaging study to begin dictation</Text>

        <View style={styles.grid}>
          {MODALITIES.map((m) => (
            <ModalityCard
              key={m.id}
              id={m.id}
              label={m.label}
              emoji={m.emoji}
              color={m.color}
              desc={m.desc}
              onPress={() => handleSelectModality(m.id)}
            />
          ))}
        </View>

        {/* Quick Access */}
        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => router.push('/app/history')}
          testID="history-btn"
        >
          <Text style={styles.historyBtnText}>📋 View Report History</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f2440' },
  scroll: { padding: 24, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 36,
  },
  greeting: { fontSize: 14, color: '#90cdf4' },
  name: { fontSize: 22, fontWeight: '700', color: '#fff', marginTop: 2 },
  institution: { fontSize: 13, color: '#718096', marginTop: 2 },
  logoutBtn: { backgroundColor: '#1a365d', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  logoutText: { color: '#90cdf4', fontSize: 13 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 6 },
  sectionSub: { fontSize: 13, color: '#718096', marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  historyBtn: {
    marginTop: 32,
    backgroundColor: '#1a365d',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2b6cb0',
  },
  historyBtnText: { color: '#90cdf4', fontSize: 15, fontWeight: '600' },
});
