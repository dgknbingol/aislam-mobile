import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';

import { colors } from '../../theme/colors';

const SIZE = 280;
const CENTER = SIZE / 2;
const RADIUS = SIZE / 2 - 20;

interface QiblaCompassProps {
  qiblaBearing: number;
  headingSV: SharedValue<number>;
  hasHeading: boolean;
}

function bearingToRad(bearing: number): number {
  return ((bearing - 90) * Math.PI) / 180;
}

export default function QiblaCompass({
  qiblaBearing,
  headingSV,
  hasHeading,
}: QiblaCompassProps) {
  const dialStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-headingSV.value}deg` }],
  }));

  const kaabaUprightStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${headingSV.value - qiblaBearing}deg` }],
  }));

  return (
    <View style={styles.wrapper}>
      <View style={[styles.compass, { width: SIZE, height: SIZE }]}>
        <View style={styles.topPointer} pointerEvents="none">
          <View style={styles.topPointerTriangle} />
        </View>

        <Animated.View style={[styles.dial, dialStyle]}>
          <Svg width={SIZE} height={SIZE}>
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              stroke={colors.barBorder}
              strokeWidth={3}
              fill="#FFFDF6"
            />
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS - 14}
              stroke="rgba(2, 23, 52, 0.08)"
              strokeWidth={1}
              fill="transparent"
            />

            {(['K', 'D', 'G', 'B'] as const).map((label, index) => {
              const angle = index * 90;
              const rad = bearingToRad(angle);
              const x = CENTER + (RADIUS - 28) * Math.cos(rad);
              const y = CENTER + (RADIUS - 28) * Math.sin(rad);
              return (
                <SvgText
                  key={label}
                  x={x}
                  y={y + 5}
                  fill={label === 'K' ? colors.gold : colors.textMutedOnLight}
                  fontSize={label === 'K' ? 18 : 14}
                  fontWeight="700"
                  textAnchor="middle"
                >
                  {label}
                </SvgText>
              );
            })}

            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
              const rad = bearingToRad(angle);
              const inner = RADIUS - (angle % 90 === 0 ? 18 : 10);
              const outer = RADIUS - 4;
              return (
                <Line
                  key={angle}
                  x1={CENTER + inner * Math.cos(rad)}
                  y1={CENTER + inner * Math.sin(rad)}
                  x2={CENTER + outer * Math.cos(rad)}
                  y2={CENTER + outer * Math.sin(rad)}
                  stroke="rgba(2, 23, 52, 0.2)"
                  strokeWidth={angle % 90 === 0 ? 2 : 1}
                />
              );
            })}

            <Circle cx={CENTER} cy={CENTER} r={8} fill={colors.bar} />
            <Circle cx={CENTER} cy={CENTER} r={3} fill={colors.gold} />
          </Svg>

          <View
            style={[styles.qiblaArm, { transform: [{ rotate: `${qiblaBearing}deg` }] }]}
            pointerEvents="none"
          >
            <View style={styles.qiblaMarker}>
              <Animated.Text style={[styles.qiblaEmoji, kaabaUprightStyle]}>🕋</Animated.Text>
            </View>
          </View>
        </Animated.View>
      </View>

      <View style={styles.kaabaBadge}>
        <Text style={styles.kaabaEmoji}>🕋</Text>
        <Text style={styles.kaabaLabel}>
          {hasHeading ? 'Üst işaret ile hizalayın' : 'Pusula kalibre ediliyor…'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  compass: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topPointer: {
    position: 'absolute',
    top: 4,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  topPointerTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderBottomWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.bar,
  },
  dial: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
  },
  qiblaArm: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
  },
  qiblaMarker: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  qiblaEmoji: {
    fontSize: 28,
  },
  kaabaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#FFFDF6',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(2, 23, 52, 0.1)',
  },
  kaabaEmoji: {
    fontSize: 20,
  },
  kaabaLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textOnLight,
  },
});
