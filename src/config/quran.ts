export const QURAN_CONFIG = {
  apiBaseUrl: 'https://api.alquran.cloud/v1',
  cdnBaseUrl: 'https://cdn.islamic.network',
  arabicEdition: 'quran-uthmani',
  translationEdition: 'tr.diyanet',
  translationLabel: 'Diyanet',
  defaultReciter: 'ar.alafasy',
  audioBitrate: 128,
} as const;

export function getAyahAudioUrl(globalAyahNumber: number, reciter = QURAN_CONFIG.defaultReciter): string {
  const { cdnBaseUrl, audioBitrate } = QURAN_CONFIG;
  return `${cdnBaseUrl}/quran/audio/${audioBitrate}/${reciter}/${globalAyahNumber}.mp3`;
}
