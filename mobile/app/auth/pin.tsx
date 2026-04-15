import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../../store/authStore';

export default function PINScreen() {
  const [pin, setPin] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const inputs = useRef<TextInput[]>([]);
  const { pinLogin } = useAuthStore();
  const router = useRouter();

  const handleChange = (text: string, index: number) => {
    const newPin = [...pin];
    newPin[index] = text;
    setPin(newPin);

    if (text && index < 3) {
      inputs.current[index + 1]?.focus();
    }

    // Auto-submit when all 4 digits entered
    if (newPin.every((d) => d !== '') && text) {
      handleSubmit(newPin.join(''));
    }
  };

  const handleSubmit = async (pinCode: string) => {
    setIsLoading(true);
    try {
      const email = await SecureStore.getItemAsync('last_email');
      if (!email) {
        Alert.alert('Error', 'Please log in with email and password first.');
        router.replace('/auth/login');
        return;
      }
      await pinLogin(email, pinCode);
      router.replace('/app');
    } catch {
      Alert.alert('Invalid PIN', 'Incorrect PIN. Please try again.');
      setPin(['', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.logo}>🔐</Text>
        <Text style={styles.title}>Enter PIN</Text>
        <Text style={styles.subtitle}>Use your 4-digit PIN to sign in quickly</Text>

        <View style={styles.pinRow}>
          {pin.map((digit, i) => (
            <TextInput
              key={i}
              ref={(ref) => { if (ref) inputs.current[i] = ref; }}
              style={[styles.pinInput, digit ? styles.pinFilled : null]}
              value={digit}
              onChangeText={(t) => handleChange(t.replace(/[^0-9]/g, ''), i)}
              keyboardType="numeric"
              maxLength={1}
              secureTextEntry
              testID={`pin-input-${i}`}
            />
          ))}
        </View>

        {isLoading && <ActivityIndicator color="#63b3ed" style={{ marginTop: 20 }} />}

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace('/auth/login')}
        >
          <Text style={styles.backBtnText}>← Back to email login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f2440' },
  inner: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 },
  logo: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: 14, color: '#90cdf4', marginTop: 8, textAlign: 'center' },
  pinRow: { flexDirection: 'row', gap: 16, marginTop: 48 },
  pinInput: {
    width: 64,
    height: 72,
    backgroundColor: '#1a365d',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2b6cb0',
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  pinFilled: { borderColor: '#63b3ed', backgroundColor: '#1e4a7a' },
  backBtn: { marginTop: 40 },
  backBtnText: { color: '#63b3ed', fontSize: 14 },
});
