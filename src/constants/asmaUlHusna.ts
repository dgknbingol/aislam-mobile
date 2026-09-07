/** Esmaül Hüsna kataloğu — Word + Audacity WAV. */
export interface AsmaUlHusnaItem {
  id: number;
  mp: string;
  name: string;
  arabic: string;
  turkish: string;
  /** false ise ses yok; kart gösterilir */
  hasAudio: boolean;
}

export const ASMA_FIRST_AUDIO_MP = '000' as const;
export const ASMA_AUDIO_EXT = 'wav' as const;

export const ASMAUL_HUSNA: readonly AsmaUlHusnaItem[] = [
  {"id": 1, "mp": "111", "name": "Allah C.C.", "arabic": "اللّٰه", "turkish": "Eşi benzeri bulunmayan, bütün noksan sıfatlardan münezzeh tek ilah, her biri sonsuz bir hazine olan bütün isimlerini kuşatan özel ismi. İsimlerin sultanı.", "hasAudio": false},
  {"id": 2, "mp": "000", "name": "Er-Rahmân", "arabic": "الرَّحْمَٰن", "turkish": "Dünyada bütün mahlükata merhamet eden, şefkat gösteren, ihsan eden.", "hasAudio": true},
  {"id": 3, "mp": "001", "name": "Er-Rahîm", "arabic": "الرَّحِيم", "turkish": "Ahirette, müminlere sonsuz ikram, lütuf ve ihsanda bulunan.", "hasAudio": true},
  {"id": 4, "mp": "002", "name": "El-Melik", "arabic": "الْمَلِك", "turkish": "Mülkün, kainatın sahibi, mülk ve saltanatı devamlı olan.", "hasAudio": true},
  {"id": 5, "mp": "003", "name": "El-Kuddûs", "arabic": "الْقُدُّوس", "turkish": "Her noksanlıktan uzak ve her türlü takdıse layık olan.", "hasAudio": true},
  {"id": 6, "mp": "004", "name": "Es-Selâm", "arabic": "السَّلَام", "turkish": "Her türlü tehlikelerden selamete çıkaran.", "hasAudio": true},
  {"id": 7, "mp": "005", "name": "El-Mü'min", "arabic": "الْمُؤْمِن", "turkish": "Güven veren, emin kılan, koruyan.", "hasAudio": true},
  {"id": 8, "mp": "006", "name": "El-Müheymin", "arabic": "الْمُهَيْمِن", "turkish": "Her şeyi görüp gözeten.", "hasAudio": true},
  {"id": 9, "mp": "007", "name": "El-Azîz", "arabic": "الْعَزِيز", "turkish": "İzzet sahibi, her şeye galip olan.", "hasAudio": true},
  {"id": 10, "mp": "008", "name": "El-Cebbâr", "arabic": "الْجَبَّار", "turkish": "Azamet ve kudret sahibi. Dilediğini yapan ve yaptıran.", "hasAudio": true},
  {"id": 11, "mp": "009", "name": "El-Mütekebbir", "arabic": "الْمُتَكَبِّر", "turkish": "Büyüklükte eşi, benzeri olmayan.", "hasAudio": true},
  {"id": 12, "mp": "010", "name": "El-Hâlik", "arabic": "الْخَالِق", "turkish": "Yaratan, yoktan var eden.", "hasAudio": true},
  {"id": 13, "mp": "011", "name": "El-Bâri'", "arabic": "الْبَارِئ", "turkish": "Her şeyi kusursuz ve uyumlu yaratan.", "hasAudio": true},
  {"id": 14, "mp": "012", "name": "El-Musavvir", "arabic": "الْمُصَوِّر", "turkish": "Varlıklara şekil veren.", "hasAudio": true},
  {"id": 15, "mp": "013", "name": "El-Gaffâr", "arabic": "الْغَفَّار", "turkish": "Günahları örten ve çok mağfiret eden.", "hasAudio": true},
  {"id": 16, "mp": "014", "name": "El-Kahhâr", "arabic": "الْقَهَّار", "turkish": "Her şeye, her istediğini yapacak surette, galip ve hakim olan.", "hasAudio": true},
  {"id": 17, "mp": "015", "name": "El-Vehhâb", "arabic": "الْوَهَّاب", "turkish": "Karşılıksız hibeler veren, çok fazla ihsan eden.", "hasAudio": true},
  {"id": 18, "mp": "016", "name": "Er-Rezzâk", "arabic": "الرَّزَّاق", "turkish": "Bütün mahlükatın rızkını veren ve ihtiyacını karşılayan.", "hasAudio": true},
  {"id": 19, "mp": "017", "name": "El-Fettâh", "arabic": "الْفَتَّاح", "turkish": "Her türlü müşkülleri açan ve kolaylaştıran, darlıktan kurtaran.", "hasAudio": true},
  {"id": 20, "mp": "018", "name": "El-Alîm", "arabic": "الْعَلِيم", "turkish": "Gizli açık, geçmiş, gelecek, her şeyi en ince detaylarına kadar bilen.", "hasAudio": true},
  {"id": 21, "mp": "019", "name": "El-Kâbıd", "arabic": "الْقَابِض", "turkish": "Dilediğine darlık veren, sıkan, daraltan.", "hasAudio": true},
  {"id": 22, "mp": "020", "name": "El-Bâsıt", "arabic": "الْبَاسِط", "turkish": "Dilediğine bolluk veren, açan, genişleten.", "hasAudio": true},
  {"id": 23, "mp": "021", "name": "El-Hâfıd", "arabic": "الْخَافِض", "turkish": "Dereceleri alçaltan.", "hasAudio": true},
  {"id": 24, "mp": "022", "name": "Er-Râfi", "arabic": "الرَّافِع", "turkish": "Şeref verip yükselten.", "hasAudio": true},
  {"id": 25, "mp": "023", "name": "El-Mu'ız", "arabic": "الْمُعِزّ", "turkish": "Dilediğini aziz eden, izzet veren.", "hasAudio": true},
  {"id": 26, "mp": "024", "name": "El-Müzil", "arabic": "الْمُذِلّ", "turkish": "Dilediğini zillete düşüren.", "hasAudio": true},
  {"id": 27, "mp": "025", "name": "Es-Semi", "arabic": "السَّمِيع", "turkish": "Her şeyi en iyi işiten.", "hasAudio": true},
  {"id": 28, "mp": "026", "name": "El-Basîr", "arabic": "الْبَصِير", "turkish": "Gizli açık, her şeyi en iyi gören.", "hasAudio": true},
  {"id": 29, "mp": "027", "name": "El-Hakem", "arabic": "الْحَكَم", "turkish": "Mutlak hakim, hakkı batıldan ayıran. Hikmetle hükmeden.", "hasAudio": true},
  {"id": 30, "mp": "028", "name": "El-Adl", "arabic": "الْعَدْل", "turkish": "Mutlak adil, çok adaletli.", "hasAudio": true},
  {"id": 31, "mp": "029", "name": "El-Latîf", "arabic": "اللَّطِيف", "turkish": "Lütuf ve ihsan sahibi olan. Bütün incelikleri bilen.", "hasAudio": true},
  {"id": 32, "mp": "030", "name": "El-Habîr", "arabic": "الْخَبِير", "turkish": "Olmuş olacak her şeyden haberdar.", "hasAudio": true},
  {"id": 33, "mp": "031", "name": "El-Halîm", "arabic": "الْحَلِيم", "turkish": "Cezada, acele etmeyen, yumuşak davranan.", "hasAudio": true},
  {"id": 34, "mp": "032", "name": "El-Azîm", "arabic": "الْعَظِيم", "turkish": "Büyüklükte benzeri yok. Pek yüce.", "hasAudio": true},
  {"id": 35, "mp": "033", "name": "El-Gafûr", "arabic": "الْغَفُور", "turkish": "Affı, mağfireti bol.", "hasAudio": true},
  {"id": 36, "mp": "034", "name": "Eş-Şekûr", "arabic": "الشَّكُور", "turkish": "Az amele, çok sevap veren.", "hasAudio": true},
  {"id": 37, "mp": "035", "name": "El-Aliyy", "arabic": "الْعَلِيّ", "turkish": "Yüceler yücesi, çok yüce.", "hasAudio": true},
  {"id": 38, "mp": "036", "name": "El-Kebîr", "arabic": "الْكَبِير", "turkish": "Büyüklükte benzeri yok, pek büyük.", "hasAudio": true},
  {"id": 39, "mp": "037", "name": "El-Hafîz", "arabic": "الْحَفِيظ", "turkish": "Her şeyi koruyucu olan.", "hasAudio": true},
  {"id": 40, "mp": "038", "name": "El-Mukît", "arabic": "الْمُقِيت", "turkish": "El-Mukît", "hasAudio": true},
  {"id": 41, "mp": "039", "name": "El-Hasîb", "arabic": "الْحَسِيب", "turkish": "Kulların hesabını en iyi gören.", "hasAudio": true},
  {"id": 42, "mp": "040", "name": "El-Celîl", "arabic": "الْجَلِيل", "turkish": "Celal ve azamet sahibi olan.", "hasAudio": false},
  {"id": 43, "mp": "041", "name": "El-Kerîm", "arabic": "الْكَرِيم", "turkish": "Keremi, lütuf ve ihsanı bol, karşılıksız veren, çok ikram eden.", "hasAudio": true},
  {"id": 44, "mp": "042", "name": "Er-Rakîb", "arabic": "الرَّقِيب", "turkish": "Her varlığı, her işi her an görüp, gözeten, kontrolü altında tutan.", "hasAudio": true},
  {"id": 45, "mp": "043", "name": "El-Mucîb", "arabic": "الْمُجِيب", "turkish": "Duaları, istekleri kabul eden.", "hasAudio": true},
  {"id": 46, "mp": "044", "name": "El-Vâsi", "arabic": "الْوَاسِع", "turkish": "Rahmet, kudret ve ilmi ile her şeyi ihata eden.", "hasAudio": true},
  {"id": 47, "mp": "045", "name": "El-Hakîm", "arabic": "الْحَكِيم", "turkish": "Her işi hikmetli, her şeyi hikmetle yaratan.", "hasAudio": true},
  {"id": 48, "mp": "046", "name": "El-Vedûd", "arabic": "الْوَدُود", "turkish": "Kullarını en fazla seven, sevilmeye en layık olan.", "hasAudio": true},
  {"id": 49, "mp": "047", "name": "El-Mecîd", "arabic": "الْمَجِيد", "turkish": "Her türlü övgüye layık bulunan.", "hasAudio": true},
  {"id": 50, "mp": "048", "name": "El-Bâis", "arabic": "الْبَاعِث", "turkish": "Ölüleri dirilten.", "hasAudio": true},
  {"id": 51, "mp": "049", "name": "Eş-Şehîd", "arabic": "الشَّهِيد", "turkish": "Her zaman her yerde hazır ve nazır olan.", "hasAudio": true},
  {"id": 52, "mp": "050", "name": "El-Hakk", "arabic": "الْحَقّ", "turkish": "El-Hakk", "hasAudio": true},
  {"id": 53, "mp": "051", "name": "El-Vekîl", "arabic": "الْوَكِيل", "turkish": "Kendisine tevekkül edenlerin işlerini en iyi neticeye ulaştıran.", "hasAudio": true},
  {"id": 54, "mp": "052", "name": "El-Kaviyy", "arabic": "الْقَوِيّ", "turkish": "Kudreti en üstün ve hiç azalmaz.", "hasAudio": true},
  {"id": 55, "mp": "053", "name": "El-Metîn", "arabic": "الْمَتِين", "turkish": "Kuvvet ve kudret kaynağı, pek güçlü.", "hasAudio": true},
  {"id": 56, "mp": "054", "name": "El-Veliyy", "arabic": "الْوَلِيّ", "turkish": "İnananların dostu, onları sevip yardım eden.", "hasAudio": true},
  {"id": 57, "mp": "055", "name": "El-Hamîd", "arabic": "الْحَمِيد", "turkish": "Her türlü hamd ve senaya layık olan.", "hasAudio": true},
  {"id": 58, "mp": "056", "name": "El-Muhsî", "arabic": "الْمُحْصِي", "turkish": "Yarattığı ve yaratacağı bütün varlıkların sayısını bilen.", "hasAudio": true},
  {"id": 59, "mp": "057", "name": "El-Mübdi", "arabic": "الْمُبْدِئ", "turkish": "Maddesiz, örneksiz yaratan.", "hasAudio": true},
  {"id": 60, "mp": "058", "name": "El-Muîd", "arabic": "الْمُعِيد", "turkish": "Yarattıklarını yok edip, sonra tekrar diriltecek olan.", "hasAudio": true},
  {"id": 61, "mp": "059", "name": "El-Muhyî", "arabic": "الْمُحْيِي", "turkish": "İhya eden, dirilten, can veren.", "hasAudio": true},
  {"id": 62, "mp": "060", "name": "El-Mümît", "arabic": "الْمُمِيت", "turkish": "Her canlıya ölümü tattıran.", "hasAudio": true},
  {"id": 63, "mp": "061", "name": "El-Hayy", "arabic": "الْحَيّ", "turkish": "Ezeli ve ebedi hayat sahibi.", "hasAudio": true},
  {"id": 64, "mp": "062", "name": "El-Kayyûm", "arabic": "الْقَيُّوم", "turkish": "Varlıkları diri tutan, zatı ile kaim olan.", "hasAudio": true},
  {"id": 65, "mp": "063", "name": "El-Vâcid", "arabic": "الْوَاجِد", "turkish": "Kendisinden hiçbir şey gizli kalmayan, istediğini, istediği vakit bulan.", "hasAudio": true},
  {"id": 66, "mp": "064", "name": "El-Macîd", "arabic": "الْمَاجِد", "turkish": "Kadri ve şanı büyük, keremi, ihsanı bol olan.", "hasAudio": true},
  {"id": 67, "mp": "065", "name": "El-Vâhid", "arabic": "الْوَاحِد", "turkish": "Zat, sıfat ve fiillerinde benzeri ve ortağı olmayan, tek olan.", "hasAudio": true},
  {"id": 68, "mp": "066", "name": "Es-Samed", "arabic": "الصَّمَد", "turkish": "Hiçbir şeye ihtiyacı olmayan, herkesin muhtaç olduğu.", "hasAudio": true},
  {"id": 69, "mp": "067", "name": "El-Kâdir", "arabic": "الْقَادِر", "turkish": "Dilediğini dilediği gibi yaratmaya muktedir olan.", "hasAudio": true},
  {"id": 70, "mp": "068", "name": "El-Muktedir", "arabic": "الْمُقْتَدِر", "turkish": "Dilediği gibi tasarruf eden, her şeyi kolayca yaratan kudret sahibi.", "hasAudio": true},
  {"id": 71, "mp": "069", "name": "El-Mukaddim", "arabic": "الْمُقَدِّم", "turkish": "Dilediğini, öne alan, yükselten.", "hasAudio": true},
  {"id": 72, "mp": "070", "name": "El-Muahhir", "arabic": "الْمُؤَخِّر", "turkish": "Dilediğini sona alan, erteleyen, alçaltan.", "hasAudio": true},
  {"id": 73, "mp": "071", "name": "El-Evvel", "arabic": "الْأَوَّل", "turkish": "Ezeli olan, varlığının başlangıcı olmayan.", "hasAudio": true},
  {"id": 74, "mp": "072", "name": "El-Âhir", "arabic": "الْآخِر", "turkish": "Varlığının sonu olmayan.", "hasAudio": true},
  {"id": 75, "mp": "073", "name": "El-Zâhir", "arabic": "الظَّاهِر", "turkish": "Varlığı açık, aşikar olan, kesin delillerle bilinen.", "hasAudio": true},
  {"id": 76, "mp": "074", "name": "El-Bâtın", "arabic": "الْبَاطِن", "turkish": "Akılların idrak edemeyeceği, yüceliği gizli olan.", "hasAudio": true},
  {"id": 77, "mp": "075", "name": "El-Vâlî", "arabic": "الْوَالِي", "turkish": "Bütün kainatı idare eden.", "hasAudio": true},
  {"id": 78, "mp": "076", "name": "El-Müteâlî", "arabic": "الْمُتَعَالِي", "turkish": "Son derece yüce olan.", "hasAudio": true},
  {"id": 79, "mp": "077", "name": "El-Berr", "arabic": "الْبَرُّ", "turkish": "İyilik ve ihsanı bol, iyilik ve ihsan kaynağı.", "hasAudio": true},
  {"id": 80, "mp": "078", "name": "Et-Tevvâb", "arabic": "التَّوَّاب", "turkish": "Tevbeleri kabul edip, günahları bağışlayan.", "hasAudio": true},
  {"id": 81, "mp": "079", "name": "El-Müntekim", "arabic": "الْمُنْتَقِم", "turkish": "Zalimlerin cezasını veren, intikam alan.", "hasAudio": true},
  {"id": 82, "mp": "080", "name": "El-Afüvv", "arabic": "الْعَفُوّ", "turkish": "Affı çok olan, günahları affetmeyi seven.", "hasAudio": true},
  {"id": 83, "mp": "081", "name": "Er-Raûf", "arabic": "الرَّؤُوف", "turkish": "Çok merhametli, pek şefkatli.", "hasAudio": true},
  {"id": 84, "mp": "082", "name": "Mâlik-ül Mülk", "arabic": "مَالِكُ الْمُلْك", "turkish": "Mülkün, her varlığın sahibi.", "hasAudio": true},
  {"id": 85, "mp": "083", "name": "Zül-Celâli vel ikrâm", "arabic": "ذُو الْجَلَالِ وَالْإِكْرَام", "turkish": "Celal, azamet ve pek büyük ikram sahibi.", "hasAudio": true},
  {"id": 86, "mp": "084", "name": "El-Muksit", "arabic": "الْمُقْسِط", "turkish": "Her işi birbirine uygun yapan.", "hasAudio": true},
  {"id": 87, "mp": "085", "name": "El-Câmi", "arabic": "الْجَامِع", "turkish": "Mahşerde her mahlükatı bir araya toplayan.", "hasAudio": true},
  {"id": 88, "mp": "086", "name": "El-Ganiyy", "arabic": "الْغَنِيّ", "turkish": "Her türlü zenginlik sahibi, ihtiyacı olmayan.", "hasAudio": true},
  {"id": 89, "mp": "087", "name": "El-Mugnî", "arabic": "الْمُغْنِي", "turkish": "Müstağni kılan. ihtiyaç gideren, zengin eden.", "hasAudio": true},
  {"id": 90, "mp": "088", "name": "El-Mâni", "arabic": "الْمَانِع", "turkish": "Dilemediği şeye mani olan, engelleyen.", "hasAudio": true},
  {"id": 91, "mp": "089", "name": "Ed-Dârr", "arabic": "الضَّارّ", "turkish": "Elem, zarar verenleri yaratan.", "hasAudio": true},
  {"id": 92, "mp": "090", "name": "En-Nâfi", "arabic": "النَّافِع", "turkish": "Fayda veren şeyleri yaratan.", "hasAudio": true},
  {"id": 93, "mp": "091", "name": "En-Nûr", "arabic": "النُّور", "turkish": "Alemleri nurlandıran, dilediğine nur veren.", "hasAudio": true},
  {"id": 94, "mp": "092", "name": "El-Hâdî", "arabic": "الْهَادِي", "turkish": "Hidayet veren.", "hasAudio": true},
  {"id": 95, "mp": "093", "name": "El-Bedî", "arabic": "الْبَدِيع", "turkish": "Eşi ve benzeri olmayan güzellik sahibi, eşsiz yaratan.", "hasAudio": true},
  {"id": 96, "mp": "094", "name": "El-Bâkî", "arabic": "الْبَاقِي", "turkish": "Daimi, ölümsüz, ebedi olan.", "hasAudio": true},
  {"id": 97, "mp": "095", "name": "El-Vâris", "arabic": "الْوَارِث", "turkish": "Her şeyin asıl sahibi olan.", "hasAudio": true},
  {"id": 98, "mp": "096", "name": "Er-Reşîd", "arabic": "الرَّشِيد", "turkish": "İrşada muhtaç olmayan, doğru yolu gösteren.", "hasAudio": true},
  {"id": 99, "mp": "097", "name": "Es-Sabûr", "arabic": "الصَّبُور", "turkish": "Sabırlı olan, sabır veren. Ceza veya mükafat vermede acele etmeyen.", "hasAudio": true},
] as const;

export function getAsmaById(id: number): AsmaUlHusnaItem | undefined {
  return ASMAUL_HUSNA.find((item) => item.id === id);
}

/** Günlük sabit rastgele isim (aynı gün aynı kart). */
export function getAsmaOfDay(date = new Date()): {
  item: AsmaUlHusnaItem;
  catalogIndex: number;
} {
  const dayKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  let hash = 2166136261;
  for (let i = 0; i < dayKey.length; i += 1) {
    hash ^= dayKey.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const catalogIndex = Math.abs(hash) % ASMAUL_HUSNA.length;
  return { item: ASMAUL_HUSNA[catalogIndex], catalogIndex };
}

export function getAsmaFirstAudioIndex(): number {
  const index = ASMAUL_HUSNA.findIndex((item) => item.mp === ASMA_FIRST_AUDIO_MP && item.hasAudio);
  return index >= 0 ? index : ASMAUL_HUSNA.findIndex((item) => item.hasAudio);
}

export function hasAsmaAudio(item: AsmaUlHusnaItem): boolean {
  return item.hasAudio;
}
