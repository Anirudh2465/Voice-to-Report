import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';

interface ModalityCardProps {
  id: string;
  label: string;
  emoji: string;
  color: string;
  desc: string;
  onPress: () => void;
}

export function ModalityCard({ id, label, emoji, color, desc, onPress }: ModalityCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, { borderColor: color }]}
      onPress={onPress}
      testID={`modality-card-${id}`}
      activeOpacity={0.8}
    >
      <View style={[styles.iconBadge, { backgroundColor: color + '30' }]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.desc}>{desc}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '47%',
    backgroundColor: '#1a365d',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    gap: 8,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emoji: { fontSize: 24 },
  label: { fontSize: 16, fontWeight: '700', color: '#fff' },
  desc: { fontSize: 11, color: '#718096', lineHeight: 15 },
});
