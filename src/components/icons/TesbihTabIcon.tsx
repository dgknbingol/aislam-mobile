import Svg, { Circle, Line, Path } from 'react-native-svg';

interface TesbihTabIconProps {
  size?: number;
  color?: string;
}

/** Alt menü: sade tesbih amblemi (halka + imame + püskül). */
export default function TesbihTabIcon({ size = 22, color = '#F5F0E6' }: TesbihTabIconProps) {
  const cx = 12;
  const cy = 9.5;
  const rx = 5.8;
  const ry = 6.6;
  const beadCount = 14;
  const beads = Array.from({ length: beadCount }, (_, i) => {
    const angle = -Math.PI / 2 + (i / beadCount) * Math.PI * 2;
    return {
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
    };
  });

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {beads.map((bead, index) => (
        <Circle
          key={index}
          cx={bead.x}
          cy={bead.y}
          r={1.25}
          stroke={color}
          strokeWidth={1.2}
          fill="none"
        />
      ))}
      <Circle cx={cx} cy={17.1} r={1.6} stroke={color} strokeWidth={1.25} fill="none" />
      <Line x1={cx} y1={18.7} x2={cx} y2={19.7} stroke={color} strokeWidth={1.15} />
      <Circle cx={cx} cy={20.7} r={1.05} stroke={color} strokeWidth={1.15} fill="none" />
      <Path
        d={`M ${cx - 2.4} 23.2 L ${cx} 21.5 L ${cx + 2.4} 23.2`}
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
