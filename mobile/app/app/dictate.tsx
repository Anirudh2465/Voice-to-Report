import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert, Animated
} from 'react-native';
import { Audio } from 'expo-av';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useReportStore } from '../../store/reportStore';
import { AudioWaveform } from '../../components/AudioWaveform';

type RecordingStatus = 'idle' | 'recording' | 'processing' | 'done' | 'error';

export default function DictateScreen() {
  const { reportId, modality } = useLocalSearchParams<{ reportId: string; modality: string }>();
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const { transcribeAndCorrect } = useReportStore();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) Alert.alert('Permission Required', 'Microphone access is needed for dictation.');
    })();
    return () => { recordingRef.current?.stopAndUnloadAsync(); };
  }, []);

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  };

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (update) => {
          if (update.metering !== undefined) {
            // Normalize metering from dBFS (-160 to 0) to 0-1
            setAudioLevel(Math.max(0, (update.metering + 160) / 160));
          }
        },
        100
      );
      recordingRef.current = recording;
      setStatus('recording');
      startPulse();
    } catch (e) {
      Alert.alert('Error', 'Could not start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
    
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      setRecordingUri(uri);
      recordingRef.current = null;
      setStatus('processing');

      // Transcribe and correct
      await transcribeAndCorrect(uri!, modality, reportId);
      setStatus('done');
      router.push({ pathname: '/app/results', params: { reportId, modality } });
    } catch (e: any) {
      setStatus('error');
      Alert.alert('Processing Failed', e.message || 'Please try again.');
    }
  };

  const MODALITY_COLORS: Record<string, string> = {
    USG: '#2b6cb0', CT: '#6b46c1', MRI: '#2c7a7b', XRAY: '#744210'
  };
  const accentColor = MODALITY_COLORS[modality] || '#3182ce';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.modalityBadge}>{modality}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>
          {status === 'idle' ? 'Ready to Dictate' :
           status === 'recording' ? 'Recording...' :
           status === 'processing' ? 'Processing...' :
           status === 'error' ? 'Error' : 'Done!'}
        </Text>
        <Text style={styles.hint}>
          {status === 'idle' ? 'Tap the microphone to start dictating your report' :
           status === 'recording' ? 'Speak clearly. Tap again to stop.' :
           status === 'processing' ? 'Transcribing and correcting your dictation...' : ''}
        </Text>

        {/* Waveform */}
        <View style={styles.waveformContainer}>
          <AudioWaveform isActive={status === 'recording'} level={audioLevel} color={accentColor} />
        </View>

        {/* Record Button */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[styles.micBtn, { backgroundColor: accentColor },
              status === 'recording' && styles.micBtnRecording,
              (status === 'processing' || status === 'done') && styles.micBtnDisabled
            ]}
            onPress={status === 'idle' ? startRecording : status === 'recording' ? stopRecording : undefined}
            disabled={status === 'processing' || status === 'done'}
            testID="record-btn"
          >
            <Text style={styles.micIcon}>
              {status === 'recording' ? '⏹' : status === 'processing' ? '⏳' : '🎙'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.statusText}>
          {status === 'recording' ? '● REC' : status === 'processing' ? 'Processing...' : ''}
        </Text>
      </View>
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
  backText: { color: '#90cdf4', fontSize: 15 },
  modalityBadge: {
    backgroundColor: '#1a365d',
    color: '#63b3ed',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    fontSize: 13,
    fontWeight: '700',
  },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  title: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 8 },
  hint: { fontSize: 14, color: '#90cdf4', textAlign: 'center', marginBottom: 40 },
  waveformContainer: { width: '100%', height: 80, marginBottom: 40 },
  micBtn: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#3182ce',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  micBtnRecording: { opacity: 0.9 },
  micBtnDisabled: { opacity: 0.5 },
  micIcon: { fontSize: 40 },
  statusText: { color: '#fc8181', fontSize: 14, fontWeight: '700', marginTop: 20 },
});
