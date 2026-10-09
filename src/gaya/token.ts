import { Platform } from 'react-native';

/**
 * CERMINAN TypeScript dari sistem desain.
 *
 * YANG KANONIS berkas CSS-nya:
 *   opendesign/design-systems/analismarket/tokens/colors_and_type.css
 *
 * React Native tidak membaca CSS, jadi nilainya ada dua kali. Kalau keduanya
 * berbeda, yang salah BERKAS INI — bukan yang CSS. Aturan lengkapnya (enam
 * butir, masing-masing lahir dari sesuatu yang pernah rusak) ada di
 * `SKILL.md` sebelah berkas itu.
 */

/** Semua warna bertema. Kuncinya SAMA di kedua tema — yang berbeda nilainya. */
export type Palet = {
  latar: string; latar900: string; kartu: string; kartuTerang: string; garis: string; garisSamar: string;
  teks: string; teksKuat: string; teksRedup: string; teksSamar: string;
  naik: string; turun: string; tanda: string;
  /** Emas sebagai ISIAN (ikon, lencana) — sama di kedua tema. */
  plus: string;
  /** Emas sebagai TEKS. Di latar terang #C9A961 cuma 1,9:1; ini yang lolos kontras. */
  plusTeks: string;
  /** Emas pucat untuk ANGKA BESAR (harga AM+): terang di gelap, pekat di terang. */
  plusTerang: string;
  plusRedup: string; chart: string; turunTepi: string; turunLatar: string; tirai: string;
  isiSamar: string; isiSamarKuat: string;
  /** Tombol utama (amber, sama dengan landing) dan teks di atasnya. */
  utama: string; utamaTerang: string; utamaTeks: string;
  /** Isian kaca untuk KARTU isi: tembus tipis, supaya cahaya latar ikut terasa. */
  kacaIsi: string; kacaTepi: string; kacaKilau: string;
  /** Tepi amber untuk kartu utama dan lencana AM+. */
  amberTepi: string; amberLatar: string;
  /** Cahaya amber di belakang layar (Latar.tsx): pusat → tepi. */
  cahaya: readonly [string, string, string];
  /** "Tinta" beralfa: putih di tema gelap, hampir-hitam di tema terang. Pengganti rgba(255,255,255,a). */
  tinta: (a: number) => string;
};

export const PALET_GELAP: Palet = {
  /** OBSIDIAN — palet landing live (Okt 2026), bukan coklat-hitam lama. */
  latar: '#080706',
  latar900: '#0E0C0A',
  /** permukaan kartu padat */
  kartu: '#14120F',
  kartuTerang: '#201C16',
  garis: '#2E2924',
  garisSamar: 'rgba(255,232,196,0.07)',

  teks: '#E4DED4',
  teksKuat: '#F4F1EB',
  teksRedup: '#BDB5A9',
  teksSamar: '#8C8479',

  naik: '#10B981',
  turun: '#F43F5E',
  tanda: '#FD9829',

  /**
   * AMBER = WARNA MEREK (redesain 9 Okt, pilihan pemilik: "amber seperti
   * landing"). Ia dipakai tombol utama (`utama`) dan chip saringan terpilih.
   * Identitas AnalisMarket+ TIDAK lagi dibawa warna saja: lencana "AM+",
   * `plusTeks`/`plusTerang`, dan kartu member yang membawanya. Saklar
   * banyak-pilih memakai `<Chip halus>` — bukan amber — supaya tidak
   * bersaing dengan tombol utama di layar yang sama.
   */
  plus: '#E5AD51',
  plusRedup: 'rgba(229,173,81,0.14)',

  /* ── Warna yang sebelumnya diketik mentah di layar ────────────────────
     Enam nilai tersebar di lima berkas. Yang tersebar akan menyimpang. */
  /** HANYA di balik kanvas chart — bukan latar halaman. */
  chart: '#0B0B0D',
  /** Tepi dan latar blok "yang belum lolos". */
  turunTepi: 'rgba(244,63,94,0.25)',
  turunLatar: 'rgba(244,63,94,0.08)',
  /** Tirai di belakang lapisan bacaan. Tipis, supaya kendali di baliknya
      tetap terbaca — keduanya masih hidup saat lapisan terbuka. */
  tirai: 'rgba(5,4,3,0.55)',
  /** Isian chip netral dan bar biaya kosong. */
  isiSamar: 'rgba(255,236,206,0.05)',
  isiSamarKuat: 'rgba(255,236,206,0.07)',
  plusTeks: '#E5AD51',
  plusTerang: '#F3D69C',
  utama: '#E5AD51',
  utamaTerang: '#F0BF6B',
  utamaTeks: '#1B1207',
  kacaIsi: 'rgba(255,236,206,0.045)',
  kacaTepi: 'rgba(255,232,196,0.09)',
  kacaKilau: 'rgba(255,236,206,0.17)',
  amberTepi: 'rgba(229,173,81,0.42)',
  amberLatar: 'rgba(229,173,81,0.09)',
  cahaya: ['#4C331B', '#2E2114', '#161009'],
  /* Putih HANGAT, bukan putih murni: di atas obsidian putih murni terbaca biru. */
  tinta: (a) => `rgba(255,244,228,${String(a)})`,
};

/**
 * TEMA TERANG — palet sendiri, bukan pembalikan. Hangat seperti latar mockup
 * Play (krem gading), bukan putih klinis; teks hampir-hitam hangat #14120F.
 * Chart IKUT TERANG sejak 20 Sep: chart-embed menerima `?tema=terang` dan
 * `chart` di palet ini adalah latar kanvasnya, dipakai WebView sebelum
 * halaman selesai dimuat supaya tidak ada kilatan hitam.
 */
export const PALET_TERANG: Palet = {
  latar: '#F6F3EC',
  latar900: '#EFEBE3',
  kartu: '#FFFFFF',
  kartuTerang: '#FBF9F5',
  garis: '#E4DED3',
  garisSamar: 'rgba(20,18,15,0.06)',
  teks: '#3B3630',
  teksKuat: '#14120F',
  teksRedup: '#5F5850',
  teksSamar: '#7C7468',
  naik: '#0C8F6B',
  turun: '#D63A52',
  tanda: '#B8650A',
  plus: '#E5AD51',
  plusTeks: '#8A5A12',
  plusTerang: '#7A4E0E',
  plusRedup: 'rgba(229,173,81,0.18)',
  chart: '#F6F3EC',
  turunTepi: 'rgba(214,58,82,0.30)',
  turunLatar: 'rgba(214,58,82,0.08)',
  tirai: 'rgba(20,18,15,0.35)',
  isiSamar: 'rgba(20,18,15,0.04)',
  isiSamarKuat: 'rgba(20,18,15,0.06)',
  utama: '#E5AD51',
  utamaTerang: '#F0BF6B',
  utamaTeks: '#1B1207',
  kacaIsi: 'rgba(255,255,255,0.72)',
  kacaTepi: 'rgba(20,18,15,0.08)',
  kacaKilau: 'rgba(255,255,255,0.95)',
  amberTepi: 'rgba(184,124,28,0.40)',
  amberLatar: 'rgba(229,173,81,0.12)',
  cahaya: ['#F3DDB2', '#F6E9CF', '#F6F3EC'],
  tinta: (a) => `rgba(20,18,15,${String(a)})`,
};

let paletSekarang: Palet = PALET_GELAP;
let terang = false;
/** Dipanggil tema.ts; bukan untuk komponen. */
export function _pasangPalet(p: Palet): void { paletSekarang = p; terang = p === PALET_TERANG; }

/**
 * `W` HIDUP: tiap akses membaca palet yang sedang aktif. Aman dipakai
 * langsung di JSX (dibaca saat render). Di dalam `StyleSheet.create` TIDAK
 * aman — nilainya dibaca saat modul dimuat; pakai `gayaTema((W) => ...)`.
 */
export const W: Palet = new Proxy({} as Palet, {
  get: (_, k) => (paletSekarang as unknown as Record<string | symbol, unknown>)[k],
});

/**
 * TANGGA HURUF MOBILE — disalin dari `.mobil` di `mobil.css`, bukan
 * diturunkan dari tangga desktop.
 *
 * Web punya DUA tangga: desktop (20/18/14/13/12/10) dan mobile
 * (19/15/13/12/10/9). App adalah permukaan mobile, jadi yang benar tangga
 * yang kedua. Memakai yang pertama membuat app terbaca satu tingkat lebih
 * besar daripada web di HP yang sama — dan "kurang lebih sama" adalah cara
 * paling halus membuat dua permukaan terasa bukan satu produk.
 */
export const H = {
  /** satu-satunya angka terbesar */
  harga: 21,
  /** kata status */
  status: 16,
  /** nama pasar */
  pasar: 14,
  /** entry, sl, tp, ATR, RR, timeframe, nama mesin */
  nilai: 13,
  /** toolbar */
  alat: 11.5,
  /** label soft, dan mikro */
  label: 10,
  /* Nama lama, dipertahankan supaya layar yang belum disamakan tidak pecah. */
  nama: 14,
  kontrol: 13,
} as const;
/* REDESAIN OKT 2026 menaikkan tangga satu tingkat (19/15/13/12/10/9 →
   21/16/14/13/11,5/10). Tangga lama disalin dari web MOBILE, tapi di HP
   Android label 9 px terbaca seperti catatan kaki — mockup polish-2026 yang
   disetujui pemilik memakai ukuran ini. */

/**
 * TINGGI KOMPONEN — diturunkan dari isinya, bukan angka bulat yang kebetulan
 * cukup di satu HP. Tinggi yang ditebak memotong huruf berekor, dan itu
 * tidak terlihat dari kode.
 */
export const SENTUH = 44;
export const TINGGI_BARIS = 52;
/** 6+6 padding + 16 lineHeight + 2 garis. */
export const TINGGI_CHIP = 30;
/** Tombol di baris kendali chart. */
export const TINGGI_KENDALI = 40;
/** Bilah navigasi bawah. */
/** Bilah tab PIL melayang (mockup home-2026/kisi): 64 tinggi, 12 dari tepi
    kiri/kanan, 10 di atas jarak aman. */
export const TINGGI_BILAH = 66;
export const TEPI_BILAH = 14;
export const ANGKAT_BILAH = 10;
/** Bar biaya. */
export const TINGGI_BAR = 6;

/**
 * TALANG TEPI LAYAR — satu angka untuk seluruh app.
 *
 * Terukur sebelum ditokenkan: angka 14 diketik mentah di 18 tempat. Talang
 * yang berbeda antar layar terbaca sebagai layar yang bergeser saat dipindah.
 */
/**
 * JARAK BAWAH yang WAJIB diberikan tiap layar bertab.
 *
 * Bilah tab MELAYANG (`position: absolute`) supaya isi lewat di bawahnya dan
 * kacanya punya bahan untuk dikaburkan. Harganya: baris terakhir tiap layar
 * berada di bawah bilah dan tidak bisa dijangkau — kecuali layarnya
 * menyisakan ruang sebesar ini di ujung gulirannya.
 *
 * Diketik sekali di sini, bukan di sepuluh layar. Yang tersebar akan
 * menyimpang, dan yang menyimpang menyembunyikan baris terakhir di satu
 * layar saja — persis jenis cacat yang tidak pernah dilaporkan sebagai bug.
 */
export const SISA_BILAH = TINGGI_BILAH + 8;

export const TALANG = 16;
/** Jarak antar chip dan antar tab. Terukur diketik mentah di 16 tempat. */
export const SELA_CHIP = 6;

/**
 * KACA — permukaan tembus pandang untuk lapisan yang MENGAMBANG.
 *
 * Aturannya satu kalimat: kaca itu chrome, bukan isi. Bilah navigasi, bilah
 * tab, dan lembar bawah tembus pandang; isi halaman duduk padat di atas
 * dasar. Kaca ditumpuk di atas kaca jadi bubur.
 *
 * Yang membuat kaca TERBACA bukan angka blur-nya melainkan apa yang ada di
 * baliknya. Karena itu `tabBarStyle` WAJIB `position: absolute` dan tiap
 * layar memberi jarak bawah sebesar `TINGGI_BILAH` — supaya isi benar-benar
 * lewat di bawah bilahnya. Tanpa itu yang disaring cuma latar kosong, dan
 * hasilnya terlihat persis seperti panel abu biasa.
 */
const IOS = Platform.OS === 'ios';

const KACA_GELAP = {
  /** Bilah: isi di baliknya harus tetap terbaca. */
  /* Intensitas dinaikkan (34 → 68): mockup memakai blur(26px), dan di
     expo-blur angka 34 setara ~10px — separuhnya. Di HP pemilik kaca tidak
     terlihat sama sekali; sebagian karena ini, sebagian karena warnanya
     dicat DI ATAS blur (lihat Kaca.tsx). */
  /* KEPEKATAN ANDROID BERBEDA, dan itu bukan selera.
     `expo-blur` di Android boleh GAGAL total tanpa satu pun galat — dan saat
     ia gagal, yang tersisa cuma warna ini. Pada 0,44 itu berarti 56% isi di
     baliknya tembus, dan di HP pemilik (19 Sep) judul "Profil" terbaca
     menimpa kartu akun, kalimat kaki tertimpa bilah tab, dan kartu AM+
     tembus lewat bilah. Keterbacaan tidak boleh bergantung pada fitur yang
     boleh gagal; blur di sini penyedap, bukan penopang.
     iOS tetap 0,44 — di sana blur-nya memang selalu ada, dan menaikkannya
     cuma membuat kacanya jadi tirai. */
  /* ANDROID TANPA BLUR SAMA SEKALI (Okt 2026) — lihat Kaca.tsx. Isiannya
     karena itu PEKAT: ia satu-satunya penopang keterbacaan di sana. */
  tipis: { intensitas: 64, warna: IOS ? 'rgba(30,25,18,0.46)' : 'rgba(24,20,15,0.93)' },
  /** Lembar: ia menutupi sesuatu, jadi lebih pekat. */
  tebal: { intensitas: 84, warna: IOS ? 'rgba(26,21,15,0.68)' : 'rgba(21,17,13,0.97)' },
  /** Garis rambut atas — kilau tepi yang membuat kaca punya ketebalan. */
  tepi: 'rgba(255,236,206,0.16)',
  rim: 'rgba(255,236,206,0.18)',
} as const;

/** Kaca tema terang: krem gading pekat, rim gelap tipis. Android tetap lebih pekat. */
const KACA_TERANG = {
  tipis: { intensitas: 68, warna: IOS ? 'rgba(246,243,236,0.62)' : 'rgba(246,243,236,0.92)' },
  tebal: { intensitas: 84, warna: IOS ? 'rgba(250,248,243,0.78)' : 'rgba(250,248,243,0.96)' },
  tepi: 'rgba(20,18,15,0.10)',
  rim: 'rgba(255,255,255,0.7)',
} as const;

export type Kaca = typeof KACA_GELAP;
/** HIDUP seperti `W`: dibaca saat render oleh Kaca.tsx. */
export const KACA: Kaca = new Proxy({} as Kaca, {
  get: (_, k) => ((terang ? KACA_TERANG : KACA_GELAP) as unknown as Record<string | symbol, unknown>)[k],
});

export const J = { x1: 4, x2: 8, x3: 12, x4: 18, x5: 26 } as const;
export const R = { kecil: 6, sedang: 10, besar: 14, kartu: 20, bulat: 999 } as const;

/**
 * Angka TIDAK BOLEH bergeser saat digitnya berubah. Dipasang di tiap harga,
 * level, dan RR — bukan di gaya dasar, supaya yang bukan angka tidak ikut.
 */
export const ANGKA = { fontVariant: ['tabular-nums' as const] };

/**
 * Label: 9px/400, huruf besar, jarak 0,12em — persis `.mobil .plan .lbl`.
 * Label tidak pernah lebih tebal daripada nilainya.
 */
export const gayaLabel = {
  fontSize: H.label,
  fontWeight: '400' as const,
  color: W.teksSamar,
  letterSpacing: 1.1,
  textTransform: 'uppercase' as const,
};

export const gayaNilai = {
  fontSize: H.nilai,
  fontWeight: '500' as const,
  color: W.teksKuat,
  ...ANGKA,
};

/** Ivory — satu-satunya isian tombol utama di web. Bukan putih murni. */
export const IVORY = '#EEECEA';
