import { Ionicons } from '@expo/vector-icons';
import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Line } from 'react-native-svg';

const SIZE = 320;
const CENTER = SIZE / 2;
const RADIUS = SIZE / 2 - 12;
const TICK_OUTER = RADIUS;
const LABEL_R = RADIUS - 34;
const DEGREE_R = RADIUS - 56;

export type TurnHint = 'left' | 'right' | 'aligned' | 'calibrating';

interface QiblaCompassProps {
  qiblaBearing: number;
  headingSV: SharedValue<number>;
  heading: number | null;
  isAligned: boolean;
  turnHint: TurnHint;
  distanceKm: number | null;
}

function bearingToRad(bearing: number): number {
  return ((bearing - 90) * Math.PI) / 180;
}

/** Pusula üzerinde durur; yazı her zaman dik (ters dönmez). */
function UprightLabel({
  bearing,
  headingSV,
  radius,
  children,
  fontSize,
  color,
  fontWeight,
}: {
  bearing: number;
  headingSV: SharedValue<number>;
  radius: number;
  children: string;
  fontSize: number;
  color: string;
  fontWeight: '600' | '700';
}) {
  const style = useAnimatedStyle(() => {
    const angleRad = ((bearing - headingSV.value) * Math.PI) / 180;
    const x = Math.sin(angleRad) * radius;
    const y = -Math.cos(angleRad) * radius;
    return {
      transform: [{ translateX: x }, { translateY: y }],
    };
  });

  return (
    <Animated.View style={[styles.labelAnchor, style]} pointerEvents="none">
      <Text style={{ fontSize, color, fontWeight, textAlign: 'center' }}>{children}</Text>
    </Animated.View>
  );
}

function QiblaCompass({
  qiblaBearing,
  headingSV,
  heading,
  isAligned,
  turnHint,
  distanceKm,
}: QiblaCompassProps) {
  const dialStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-headingSV.value}deg` }],
  }));

  const kaabaUprightStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${headingSV.value - qiblaBearing}deg` }],
  }));

  const ticks = useMemo(() => {
    const items: { angle: number; major: boolean }[] = [];
    for (let angle = 0; angle < 360; angle += 5) {
      items.push({ angle, major: angle % 30 === 0 });
    }
    return items;
  }, []);

  const degreeLabels = [30, 60, 120, 150, 210, 240, 300, 330];
  const cardinals = [
    { bearing: 0, label: 'N' },
    { bearing: 90, label: 'E' },
    { bearing: 180, label: 'S' },
    { bearing: 270, label: 'W' },
  ] as const;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.compass, { width: SIZE, height: SIZE }]}>
        <View style={styles.topPointer} pointerEvents="none">
          <View style={styles.topPointerLine} />
        </View>

        {/* Sadece çizgiler + Kabe döner */}
        <Animated.View
          style={[styles.dial, dialStyle]}
          shouldRasterizeIOS
          renderToHardwareTextureAndroid
        >
          <Svg width={SIZE} height={SIZE}>
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              stroke="rgba(245, 240, 230, 0.22)"
              strokeWidth={1.5}
              fill="transparent"
            />

            {ticks.map(({ angle, major }) => {
              const rad = bearingToRad(angle);
              const inner = major ? TICK_OUTER - 16 : TICK_OUTER - 9;
              return (
                <Line
                  key={angle}
                  x1={CENTER + inner * Math.cos(rad)}
                  y1={CENTER + inner * Math.sin(rad)}
                  x2={CENTER + TICK_OUTER * Math.cos(rad)}
                  y2={CENTER + TICK_OUTER * Math.sin(rad)}
                  stroke="rgba(245, 240, 230, 0.75)"
                  strokeWidth={major ? 2 : 1}
                />
              );
            })}
          </Svg>

          <View
            style={[styles.qiblaArm, { transform: [{ rotate: `${qiblaBearing}deg` }] }]}
            pointerEvents="none"
          >
            <View style={styles.qiblaOuter}>
              <View style={styles.qiblaRedTip} />
              <View style={styles.qiblaBadge}>
                <Animated.Text style={[styles.qiblaEmoji, kaabaUprightStyle]}>🕋</Animated.Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Yazılar ayrı katman — her zaman düz */}
        <View style={styles.labelsLayer} pointerEvents="none">
          {cardinals.map(({ bearing, label }) => (
            <UprightLabel
              key={label}
              bearing={bearing}
              headingSV={headingSV}
              radius={LABEL_R}
              fontSize={20}
              color="#F5F0E6"
              fontWeight="700"
            >
              {label}
            </UprightLabel>
          ))}
          {degreeLabels.map((angle) => (
            <UprightLabel
              key={angle}
              bearing={angle}
              headingSV={headingSV}
              radius={DEGREE_R}
              fontSize={11}
              color="rgba(245, 240, 230, 0.55)"
              fontWeight="600"
            >
              {String(angle)}
            </UprightLabel>
          ))}
        </View>

        <View style={styles.centerGuide} pointerEvents="none">
          {isAligned || turnHint === 'aligned' ? (
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={36} color="#FFFFFF" />
            </View>
          ) : turnHint === 'calibrating' ? (
            <View style={styles.hintCircle}>
              <Ionicons name="compass-outline" size={28} color="#FFFFFF" />
            </View>
          ) : (
            <>
              <View style={styles.hintCircle}>
                <Ionicons
                  name={turnHint === 'right' ? 'arrow-forward' : 'arrow-back'}
                  size={28}
                  color="#FFFFFF"
                />
              </View>
              <Text style={styles.hintText}>
                {turnHint === 'right' ? 'Sağa Dön' : 'Sola Dön'}
              </Text>
            </>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.headingHuge} numberOfLines={1}>
          {heading != null ? `${Math.round(heading)}°` : '—°'}
        </Text>
        <View style={styles.footerMeta}>
          <Text style={styles.metaLine}>Kıble Açısı : {Math.round(qiblaBearing)}°</Text>
          {distanceKm != null ? (
            <Text style={styles.metaLine}>
              Uzaklık :{' '}
              {distanceKm >= 100
                ? `${Math.round(distanceKm).toLocaleString('tr-TR')} km`
                : `${distanceKm.toFixed(1)} km`}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default memo(QiblaCompass);

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  compass: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topPointer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 4,
  },
  topPointerLine: {
    width: 3,
    height: 28,
    backgroundColor: '#E53935',
    borderRadius: 2,
  },
  dial: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
  },
  labelsLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  labelAnchor: {
    position: 'absolute',
    left: CENTER - 20,
    top: CENTER - 12,
    width: 40,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qiblaArm: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
  },
  qiblaOuter: {
    position: 'absolute',
    top: 4,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  qiblaRedTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#E53935',
    marginBottom: 2,
  },
  qiblaBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(229, 57, 53, 0.35)',
  },
  qiblaEmoji: {
    fontSize: 20,
  },
  centerGuide: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  hintCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1FA8A0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#7CB342',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#F5F0E6',
  },
  footer: {
    width: '100%',
    marginTop: 24,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  headingHuge: {
    flexShrink: 0,
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -1,
    lineHeight: 52,
  },
  footerMeta: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingBottom: 4,
    gap: 4,
  },
  metaLine: {
    fontSize: 14,
    color: 'rgba(245, 240, 230, 0.85)',
    textAlign: 'right',
  },
});
