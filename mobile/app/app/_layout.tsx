import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="dictate" />
      <Stack.Screen name="results" />
      <Stack.Screen name="editor" />
      <Stack.Screen name="export" />
      <Stack.Screen name="history" />
    </Stack>
  );
}
