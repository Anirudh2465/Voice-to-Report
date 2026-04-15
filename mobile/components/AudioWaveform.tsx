import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface AudioWaveformProps {
  isActive: boolean;
  level: number;   // 0 to 1
  color?: string;
  barCount?: number;
}

export function AudioWaveform({ isActive, level, color = '#3182ce', barCount = 20 }: AudioWaveformProps) {
  const animations = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(0.1))
  ).current;

  useEffect(() => {
    if (isActive) {
      const anims = animations.map((anim, i) => {
        const height = Math.max(0.1, level * (0.3 + 0.7 * Math.sin(i * 0.8 + Date.now() * 0.001)));
        return Animated.timing(anim, {
          toValue: height,
          duration: 150,
          useNativeDriver: false,
        });
      });
      Animated.parallel(anims).start();
    } else {
      Animated.parallel(
        animations.map((a) => Animated.timing(a, { toValue: 0.1, duration: 300, useNativeDriver: false }))
      ).start();
    }
  }, [isActive, level]);

  return (
    <View style={styles.container}>
      {animations.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              backgroundColor: color,
              height: anim.interpolate({ inputRange: [0, 1], outputRange: ['5%', '100%'] }),
              opacity: isActive ? 1 : 0.3,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  bar: {
    width: 4,
    borderRadius: 2,
    minHeight: 4,
  },
});
