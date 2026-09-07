import type { ReactElement } from 'react';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Line,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import type { PrayerBannerId } from './shared';

interface NextPrayerVectorIconProps {
  id: PrayerBannerId;
  size?: number;
}

const VIEW = 64;

function Crescent({ cx, cy, r, mask }: { cx: number; cy: number; r: number; mask: string }) {
  return (
    <>
      <Circle cx={cx} cy={cy} r={r} fill="#F5E6B8" />
      <Circle cx={cx + r * 0.45} cy={cy - r * 0.12} r={r * 0.82} fill={mask} />
    </>
  );
}

function StarDot({ cx, cy, r = 0.9, opacity = 0.9 }: { cx: number; cy: number; r?: number; opacity?: number }) {
  return <Circle cx={cx} cy={cy} r={r} fill="#FFF8E7" opacity={opacity} />;
}

function HorizonGlow({ y = 46 }: { y?: number }) {
  return (
    <>
      <Ellipse cx={32} cy={y + 2} rx={28} ry={5} fill="#FF9050" opacity={0.18} />
      <Line x1={6} y1={y} x2={58} y2={y} stroke="#FFD0A0" strokeWidth={1.2} opacity={0.55} />
    </>
  );
}

function SunRays({ cx, cy, length = 10, count = 8, color = '#FFE082' }: {
  cx: number; cy: number; length?: number; count?: number; color?: string;
}) {
  const rays = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const x1 = cx + Math.cos(angle) * 9;
    const y1 = cy + Math.sin(angle) * 9;
    const x2 = cx + Math.cos(angle) * (9 + length);
    const y2 = cy + Math.sin(angle) * (9 + length);
    rays.push(
      <Line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
        opacity={0.75}
      />,
    );
  }
  return <>{rays}</>;
}

function ImsakIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${VIEW} ${VIEW}`}>
      <Defs>
        <LinearGradient id="imsakBg" x1="10" y1="4" x2="54" y2="60">
          <Stop offset="0" stopColor="#0B1530" />
          <Stop offset="0.55" stopColor="#1E2858" />
          <Stop offset="1" stopColor="#5C3878" />
        </LinearGradient>
        <LinearGradient id="imsakHorizonGlow" x1="32" y1="40" x2="32" y2="58">
          <Stop offset="0" stopColor="#E87850" stopOpacity="0" />
          <Stop offset="1" stopColor="#E87850" stopOpacity="0.45" />
        </LinearGradient>
      </Defs>
      <Rect width={64} height={64} rx={32} fill="url(#imsakBg)" />
      <Rect x={0} y={38} width={64} height={26} fill="url(#imsakHorizonGlow)" />
      <StarDot cx={46} cy={14} r={0.7} opacity={0.5} />
      <StarDot cx={52} cy={22} r={0.5} opacity={0.4} />
      <Crescent cx={20} cy={20} r={7} mask="#1E2858" />
      <HorizonGlow y={47} />
    </Svg>
  );
}

function GunesIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${VIEW} ${VIEW}`}>
      <Defs>
        <LinearGradient id="gunesBg" x1="32" y1="0" x2="32" y2="64">
          <Stop offset="0" stopColor="#FFB830" />
          <Stop offset="0.45" stopColor="#FFD060" />
          <Stop offset="1" stopColor="#FFF0A8" />
        </LinearGradient>
        <RadialGradient id="gunesGlow" cx="32" cy="40" rx="20" ry="16">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.55" />
          <Stop offset="1" stopColor="#FFD060" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect width={64} height={64} rx={32} fill="url(#gunesBg)" />
      <Line x1={6} y1={44} x2={58} y2={44} stroke="#E89020" strokeWidth={1} opacity={0.35} />
      <Ellipse cx={32} cy={40} rx={20} ry={14} fill="url(#gunesGlow)" />
      <Path d="M 16 44 A 16 16 0 0 1 48 44 Z" fill="#FFF8DC" />
      <Circle cx={32} cy={38} r={10} fill="#FFE566" />
      <Circle cx={32} cy={38} r={7} fill="#FFF8B0" />
    </Svg>
  );
}

function OgleIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${VIEW} ${VIEW}`}>
      <Defs>
        <LinearGradient id="ogleBg" x1="32" y1="0" x2="32" y2="64">
          <Stop offset="0" stopColor="#1976D2" />
          <Stop offset="0.5" stopColor="#42A5F5" />
          <Stop offset="1" stopColor="#90CAF9" />
        </LinearGradient>
        <RadialGradient id="ogleSunGlow" cx="32" cy="18" rx="18" ry="18">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.9" />
          <Stop offset="0.45" stopColor="#FFE082" stopOpacity="0.6" />
          <Stop offset="1" stopColor="#42A5F5" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect width={64} height={64} rx={32} fill="url(#ogleBg)" />
      <Ellipse cx={14} cy={36} rx={10} ry={3} fill="#FFFFFF" opacity={0.2} />
      <Ellipse cx={50} cy={40} rx={8} ry={2.5} fill="#FFFFFF" opacity={0.15} />
      <Circle cx={32} cy={18} r={16} fill="url(#ogleSunGlow)" />
      <SunRays cx={32} cy={18} length={8} color="#FFFDE7" />
      <Circle cx={32} cy={18} r={7} fill="#FFEE58" />
      <Circle cx={32} cy={18} r={5} fill="#FFF9C4" />
    </Svg>
  );
}

function IkindiIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${VIEW} ${VIEW}`}>
      <Defs>
        <LinearGradient id="ikindiBg" x1="0" y1="0" x2="64" y2="64">
          <Stop offset="0" stopColor="#F0B040" />
          <Stop offset="0.5" stopColor="#E89038" />
          <Stop offset="1" stopColor="#C86828" />
        </LinearGradient>
        <RadialGradient id="ikindiSunGlow" cx="46" cy="24" rx="14" ry="14">
          <Stop offset="0" stopColor="#FFF0A0" />
          <Stop offset="1" stopColor="#E89038" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect width={64} height={64} rx={32} fill="url(#ikindiBg)" />
      <Line x1={8} y1={54} x2={58} y2={48} stroke="#8B4018" strokeWidth={1.2} opacity={0.25} />
      <Line x1={6} y1={50} x2={52} y2={44} stroke="#8B4018" strokeWidth={1} opacity={0.18} />
      <Line x1={10} y1={58} x2={60} y2={52} stroke="#8B4018" strokeWidth={1.4} opacity={0.2} />
      <Line x1={4} y1={46} x2={48} y2={40} stroke="#8B4018" strokeWidth={0.8} opacity={0.12} />
      <Circle cx={46} cy={24} r={13} fill="url(#ikindiSunGlow)" />
      <Circle cx={46} cy={24} r={7} fill="#FFD080" />
      <Circle cx={46} cy={24} r={5} fill="#FFE8A0" />
    </Svg>
  );
}

function AksamIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${VIEW} ${VIEW}`}>
      <Defs>
        <LinearGradient id="aksamBg" x1="32" y1="0" x2="32" y2="64">
          <Stop offset="0" stopColor="#6B1830" />
          <Stop offset="0.4" stopColor="#C03028" />
          <Stop offset="0.75" stopColor="#F06030" />
          <Stop offset="1" stopColor="#FF9040" />
        </LinearGradient>
        <RadialGradient id="aksamGlow" cx="32" cy="42" rx="22" ry="14">
          <Stop offset="0" stopColor="#FF8050" stopOpacity="0.7" />
          <Stop offset="1" stopColor="#C03028" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect width={64} height={64} rx={32} fill="url(#aksamBg)" />
      <Line x1={6} y1={44} x2={58} y2={44} stroke="#FFD0A0" strokeWidth={1} opacity={0.3} />
      <Ellipse cx={32} cy={42} rx={22} ry={12} fill="url(#aksamGlow)" />
      <Path d="M 14 44 A 18 18 0 0 0 50 44 Z" fill="#FF7040" />
      <Circle cx={32} cy={40} r={9} fill="#FF9050" />
      <Circle cx={32} cy={40} r={6} fill="#FFB080" />
    </Svg>
  );
}

function YatsiIcon({ size }: { size: number }) {
  const stars = [
    { cx: 14, cy: 12, r: 0.8, o: 0.85 },
    { cx: 24, cy: 8, r: 0.6, o: 0.65 },
    { cx: 44, cy: 10, r: 0.7, o: 0.75 },
    { cx: 52, cy: 18, r: 0.55, o: 0.6 },
    { cx: 38, cy: 22, r: 0.5, o: 0.5 },
    { cx: 18, cy: 28, r: 0.45, o: 0.45 },
  ];
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${VIEW} ${VIEW}`}>
      <Defs>
        <LinearGradient id="yatsiBg" x1="32" y1="0" x2="32" y2="64">
          <Stop offset="0" stopColor="#040C1A" />
          <Stop offset="0.5" stopColor="#0C1E38" />
          <Stop offset="1" stopColor="#1A3058" />
        </LinearGradient>
      </Defs>
      <Rect width={64} height={64} rx={32} fill="url(#yatsiBg)" />
      {stars.map((s) => (
        <StarDot key={`${s.cx}-${s.cy}`} cx={s.cx} cy={s.cy} r={s.r} opacity={s.o} />
      ))}
      <Crescent cx={42} cy={16} r={6.5} mask="#0C1E38" />
    </Svg>
  );
}

const ICONS: Record<PrayerBannerId, (props: { size: number }) => ReactElement> = {
  imsak: ImsakIcon,
  gunes: GunesIcon,
  ogle: OgleIcon,
  ikindi: IkindiIcon,
  aksam: AksamIcon,
  yatsi: YatsiIcon,
};

export default function NextPrayerVectorIcon({
  id,
  size = 56,
}: NextPrayerVectorIconProps) {
  const Icon = ICONS[id];
  return <Icon size={size} />;
}
