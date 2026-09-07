import Svg, { Circle } from 'react-native-svg';

import { colors } from '../theme/colors';

interface TesbihProgressRingProps {
  size: number;
  strokeWidth: number;
  progress: number;
}

export default function TesbihProgressRing({
  size,
  strokeWidth,
  progress,
}: TesbihProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const dashOffset = circumference * (1 - clampedProgress);
  const center = size / 2;

  return (
    <Svg width={size} height={size} style={{ position: 'absolute' }}>
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke={colors.barBorder}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {clampedProgress > 0 ? (
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.gold}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${center}, ${center}`}
        />
      ) : null}
    </Svg>
  );
}
