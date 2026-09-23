import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import { colors } from '@rakshak/game-ui';
import { writeNormalizedStick, type VirtualStickState } from '@rakshak/input';

const SIZE = 120;
const KNOB = 44;
const MAX = (SIZE - KNOB) / 2;

export function VirtualStick({
  onChange,
}: {
  onChange: (dx: number, dy: number, active: boolean) => void;
}) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const emit = useMemo(() => (dx: number, dy: number, active: boolean) => onChange(dx, dy, active), [onChange]);

  const gesture = Gesture.Pan()
    .onBegin(() => {
      runOnJS(emit)(0, 0, true);
    })
    .onUpdate((e) => {
      const nx = Math.max(-MAX, Math.min(MAX, e.translationX));
      const ny = Math.max(-MAX, Math.min(MAX, e.translationY));
      x.value = nx;
      y.value = ny;
      runOnJS(emit)(nx / MAX, ny / MAX, true);
    })
    .onEnd(() => {
      x.value = 0;
      y.value = 0;
      runOnJS(emit)(0, 0, false);
    })
    .onFinalize(() => {
      x.value = 0;
      y.value = 0;
      runOnJS(emit)(0, 0, false);
    });

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.base} accessibilityLabel="Movement stick">
        <Animated.View style={[styles.knob, knobStyle]} />
      </View>
    </GestureDetector>
  );
}

const stickSample = { moveX: 0, moveY: 0, pause: false, confirm: false, cancel: false };

export function sampleStick(state: VirtualStickState) {
  return writeNormalizedStick(stickSample, state);
}

const styles = StyleSheet.create({
  base: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 2,
    borderColor: colors.indigo600,
    backgroundColor: 'rgba(25, 27, 43, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: colors.monsoon400,
    opacity: 0.85,
  },
});
