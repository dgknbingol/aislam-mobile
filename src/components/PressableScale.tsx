import { type ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '../theme/colors';

interface PressableScaleProps {
  onPress: () => void;
  onLongPress?: () => void;
  delayLongPress?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  baseColor?: string;
  pressedColor?: string;
  accessibilityLabel?: string;
  accessibilityRole?: 'button';
}

export default function PressableScale({
  onPress,
  onLongPress,
  delayLongPress,
  children,
  style,
  contentStyle,
  baseColor = 'transparent',
  pressedColor = colors.inputField,
  accessibilityLabel,
  accessibilityRole = 'button',
}: PressableScaleProps) {
  const pressed = useSharedValue(0);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolateColor(pressed.value, [0, 1], [baseColor, pressedColor]),
  }));

  const handlePressIn = () => {
    pressed.value = withTiming(1, { duration: 80 });
    scale.value = withSpring(0.97, { damping: 15, stiffness: 350 });
  };

  const handlePressOut = () => {
    pressed.value = withTiming(0, { duration: 120 });
    scale.value = withSpring(1, { damping: 14, stiffness: 280 });
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={delayLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={style}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
    >
      <Animated.View style={[styles.content, contentStyle, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
