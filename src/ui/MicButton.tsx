import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

interface Props {
  testID: string;
  color: string;
  listening: boolean;
  label: string;
  onPress: () => void;
}

const SIZE = 96;

export function MicButton({ testID, color, listening, label, onPress }: Props) {
  const press = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReduceMotion();

  // Squeeze on touch, so the tap is visible before anything else happens.
  const squeeze = (to: number) =>
    Animated.spring(press, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 8 }).start();

  useEffect(() => {
    if (!listening || reduceMotion) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [listening, reduceMotion, pulse]);

  const ring = (offset: number) => {
    const t = Animated.modulo(Animated.add(pulse, offset), 1);
    return (
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ring,
          { borderColor: color },
          {
            opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
            transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }],
          },
        ]}
      />
    );
  };

  return (
    <View style={styles.wrap}>
      {listening && !reduceMotion && ring(0)}
      {listening && !reduceMotion && ring(0.5)}
      <Pressable
        testID={testID}
        onPress={onPress}
        onPressIn={() => squeeze(0.88)}
        onPressOut={() => squeeze(1)}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ busy: listening }}
      >
        {({ pressed }) => (
          <Animated.View
            style={[
              styles.button,
              { backgroundColor: color, transform: [{ scale: press }] },
              listening && styles.listening,
              pressed && styles.pressed,
            ]}
          >
            {listening ? <View style={styles.stop} /> : <MicGlyph />}
          </Animated.View>
        )}
      </Pressable>
    </View>
  );
}

function MicGlyph() {
  return (
    <View style={styles.glyph}>
      <View style={styles.capsule} />
      <View style={styles.cradle} />
      <View style={styles.stem} />
    </View>
  );
}

function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderWidth: 3 },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  // Pressed reads as pushed into the table: flatter shadow, slightly darker.
  pressed: { shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, opacity: 0.9 },
  listening: { borderWidth: 4, borderColor: '#fff' },
  stop: { width: 26, height: 26, borderRadius: 6, backgroundColor: '#fff' },
  glyph: { alignItems: 'center' },
  capsule: { width: 18, height: 30, borderRadius: 9, backgroundColor: '#fff' },
  cradle: {
    width: 30,
    height: 16,
    marginTop: -10,
    borderWidth: 3,
    borderTopWidth: 0,
    borderColor: '#fff',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  stem: { width: 3, height: 7, backgroundColor: '#fff' },
});
