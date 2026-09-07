export type ReligiousDayCategory = 'kandil' | 'bayram' | 'arefe' | 'ramazan' | 'ozel';

export type ReligiousDay = {
  id: string;
  title: string;
  /** ISO date YYYY-MM-DD */
  date: string;
  hijriLabel: string;
  weekday: string;
  category: ReligiousDayCategory;
};

/** Diyanet 2026 dini günler takvimi (Hicri 1447–1448). */
export const RELIGIOUS_DAYS_2026: ReligiousDay[] = [
  {
    id: 'mirac-2026',
    title: 'Miraç Kandili',
    date: '2026-01-15',
    hijriLabel: '26 Recep 1447',
    weekday: 'Perşembe',
    category: 'kandil',
  },
  {
    id: 'berat-2026',
    title: 'Berat Kandili',
    date: '2026-02-02',
    hijriLabel: '14 Şaban 1447',
    weekday: 'Pazartesi',
    category: 'kandil',
  },
  {
    id: 'ramazan-start-2026',
    title: "Ramazan'ın İlk Günü",
    date: '2026-02-19',
    hijriLabel: '1 Ramazan 1447',
    weekday: 'Perşembe',
    category: 'ramazan',
  },
  {
    id: 'kadir-2026',
    title: 'Kadir Gecesi',
    date: '2026-03-16',
    hijriLabel: '26 Ramazan 1447',
    weekday: 'Pazartesi',
    category: 'kandil',
  },
  {
    id: 'ramazan-arefe-2026',
    title: 'Ramazan Bayramı Arefe',
    date: '2026-03-19',
    hijriLabel: '29 Ramazan 1447',
    weekday: 'Perşembe',
    category: 'arefe',
  },
  {
    id: 'ramazan-bayram-1-2026',
    title: 'Ramazan Bayramı (1. Gün)',
    date: '2026-03-20',
    hijriLabel: '1 Şevval 1447',
    weekday: 'Cuma',
    category: 'bayram',
  },
  {
    id: 'ramazan-bayram-2-2026',
    title: 'Ramazan Bayramı (2. Gün)',
    date: '2026-03-21',
    hijriLabel: '2 Şevval 1447',
    weekday: 'Cumartesi',
    category: 'bayram',
  },
  {
    id: 'ramazan-bayram-3-2026',
    title: 'Ramazan Bayramı (3. Gün)',
    date: '2026-03-22',
    hijriLabel: '3 Şevval 1447',
    weekday: 'Pazar',
    category: 'bayram',
  },
  {
    id: 'kurban-arefe-2026',
    title: 'Kurban Bayramı Arefe',
    date: '2026-05-26',
    hijriLabel: '9 Zilhicce 1447',
    weekday: 'Salı',
    category: 'arefe',
  },
  {
    id: 'kurban-bayram-1-2026',
    title: 'Kurban Bayramı (1. Gün)',
    date: '2026-05-27',
    hijriLabel: '10 Zilhicce 1447',
    weekday: 'Çarşamba',
    category: 'bayram',
  },
  {
    id: 'kurban-bayram-2-2026',
    title: 'Kurban Bayramı (2. Gün)',
    date: '2026-05-28',
    hijriLabel: '11 Zilhicce 1447',
    weekday: 'Perşembe',
    category: 'bayram',
  },
  {
    id: 'kurban-bayram-3-2026',
    title: 'Kurban Bayramı (3. Gün)',
    date: '2026-05-29',
    hijriLabel: '12 Zilhicce 1447',
    weekday: 'Cuma',
    category: 'bayram',
  },
  {
    id: 'kurban-bayram-4-2026',
    title: 'Kurban Bayramı (4. Gün)',
    date: '2026-05-30',
    hijriLabel: '13 Zilhicce 1447',
    weekday: 'Cumartesi',
    category: 'bayram',
  },
  {
    id: 'hicri-yilbasi-2026',
    title: 'Hicri Yılbaşı',
    date: '2026-06-16',
    hijriLabel: '1 Muharrem 1448',
    weekday: 'Salı',
    category: 'ozel',
  },
  {
    id: 'asure-2026',
    title: 'Aşure Günü',
    date: '2026-06-25',
    hijriLabel: '10 Muharrem 1448',
    weekday: 'Perşembe',
    category: 'ozel',
  },
  {
    id: 'mevlid-2026',
    title: 'Mevlid Kandili',
    date: '2026-08-24',
    hijriLabel: '11 Rebiülevvel 1448',
    weekday: 'Pazartesi',
    category: 'kandil',
  },
  {
    id: 'regaib-2026',
    title: 'Regaib Kandili',
    date: '2026-12-10',
    hijriLabel: '1 Recep 1448',
    weekday: 'Perşembe',
    category: 'kandil',
  },
  {
    id: 'uc-aylar-2026',
    title: 'Üç Ayların Başlangıcı',
    date: '2026-12-10',
    hijriLabel: '1 Recep 1448',
    weekday: 'Perşembe',
    category: 'ozel',
  },
];

const MONTH_LABELS = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
] as const;

export type ReligiousDayMonthSection = {
  monthKey: string;
  monthLabel: string;
  year: number;
  items: ReligiousDay[];
};

export function groupReligiousDaysByMonth(days: ReligiousDay[]): ReligiousDayMonthSection[] {
  const map = new Map<string, ReligiousDayMonthSection>();

  for (const day of days) {
    const [yearStr, monthStr] = day.date.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const monthKey = `${year}-${monthStr}`;
    const monthLabel = MONTH_LABELS[month - 1] ?? monthStr;

    const existing = map.get(monthKey);
    if (existing) {
      existing.items.push(day);
      continue;
    }

    map.set(monthKey, {
      monthKey,
      monthLabel,
      year,
      items: [day],
    });
  }

  return Array.from(map.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
}

export function formatReligiousDayDate(date: string): { day: string; monthWeekday: string } {
  const [yearStr, monthStr, dayStr] = date.split('-');
  const month = Number(monthStr);
  const monthLabel = MONTH_LABELS[month - 1] ?? monthStr;
  const parsed = new Date(Number(yearStr), month - 1, Number(dayStr));
  const weekday = parsed.toLocaleDateString('tr-TR', { weekday: 'long' });
  const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);

  return {
    day: dayStr,
    monthWeekday: `${monthLabel} ${capitalizedWeekday}`,
  };
}

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseLocalDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function getDaysUntilReligiousDay(day: ReligiousDay, fromDate = new Date()): number {
  const target = parseLocalDate(day.date);
  const today = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function formatReligiousDayCountdown(day: ReligiousDay, fromDate = new Date()): string {
  const diff = getDaysUntilReligiousDay(day, fromDate);
  if (diff === 0) return 'Bugün';
  if (diff === 1) return 'Yarın';
  if (diff > 1) return `${diff} gün kaldı`;
  if (diff === -1) return 'Dün geçti';
  return `${Math.abs(diff)} gün önce geçti`;
}

export function getNextReligiousDay(days: ReligiousDay[], fromDate = new Date()): ReligiousDay | null {
  const todayKey = toLocalDateKey(fromDate);
  return days.find((day) => day.date >= todayKey) ?? null;
}

export function isReligiousDayToday(day: ReligiousDay, fromDate = new Date()): boolean {
  return day.date === toLocalDateKey(fromDate);
}

export function isReligiousDayPast(day: ReligiousDay, fromDate = new Date()): boolean {
  return day.date < toLocalDateKey(fromDate);
}
