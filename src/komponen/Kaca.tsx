/**
 * PERMUKAAN KACA — satu pintu untuk seluruh lapisan yang mengambang.
 *
 * Kenapa komponen, bukan `<BlurView>` langsung di tiap tempat: kaca butuh
 * EMPAT lapisan yang harus tetap sejajar — blur, warna, kilau dari atas, dan
 * garis rambut di tepinya. Yang disebar akan menyimpang.
 *
 * ANDROID TANPA BLUR, DAN ITU KEPUTUSAN KELANCARAN (Okt 2026).
 *
 * Sampai redesain kaca obsidian, Android memakai `dimezisBlurView`. Blur itu
 * DIHITUNG ULANG TIAP FRAME saat isi lewat di bawahnya — dan isi memang
 * selalu lewat di bawah kepala dan bilah tab, karena keduanya melayang. Di HP
 * menengah ke bawah itulah sebab gulir tersendat yang terasa sebagai "kurang
 * smooth". Padahal isiannya sudah 88–94% pekat (aturan 19 Sep: keterbacaan
 * tidak boleh bergantung pada blur), jadi yang dibayar tiap frame cuma
 * sisa 6–12% buram yang nyaris tak terlihat.
 *
 * Sekarang Android: isian pekat + kilau + rim — tiga View statis, nol kerja
 * per frame. iOS tetap blur: di sana blur murah dan selalu jalan.
 * `skrip/periksa-kaca.mjs` menjaga keduanya.
 *
 * KESALAHAN LAMA yang tetap dihindari di cabang iOS: `backgroundColor` DI
 * ATAS `BlurView` itu sendiri (di Android dulu dicat menutupi blur). Warna
 * selalu lapisan anak sendiri.
 */
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { KACA } from '../gaya/token';

type Props = {
  children?: React.ReactNode;
  /** `tipis` untuk bilah, `tebal` untuk lembar. Lihat catatan di token. */
  tebal?: boolean;
  /** Garis rambut di tepi ATAS (bilah tab, lembar) atau BAWAH (bilah nav). */
  tepi?: 'atas' | 'bawah' | 'tidak';
  gaya?: StyleProp<ViewStyle>;
};

/** Blur hanya di iOS. Di Android `experimentalBlurMethod` sengaja tidak pernah dipakai lagi. */
const PAKAI_BLUR = Platform.OS === 'ios';

export function Kaca({ children, tebal = false, tepi = 'tidak', gaya }: Props) {
  const t = tebal ? KACA.tebal : KACA.tipis;
  const gayaTepi = [
    gayaDasar,
    tepi === 'atas' && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: KACA.tepi },
    tepi === 'bawah' && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: KACA.tepi },
    gaya,
  ];
  const lapis = (
    <>
      {/* Lapis 2 — warna. Anak, bukan gaya BlurView. */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: t.warna }]} />
      {/* Lapis 3 — kilau hangat dari atas: yang membuat kaca terbaca sebagai
          kaca, bukan tirai gelap. Sangat tipis; ia terasa, tidak terlihat. */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255,236,206,0.085)', 'rgba(255,236,206,0.022)', 'rgba(255,236,206,0)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Lapis 4 — rim: terang di dalam tepi, gelap di sisi berlawanan. */}
      {tepi !== 'tidak' && (
        <>
          <View pointerEvents="none" style={[gayaRim, tepi === 'atas' ? { top: 0 } : { bottom: 0 }, { backgroundColor: KACA.rim }]} />
          <View pointerEvents="none" style={[gayaRim, tepi === 'atas' ? { bottom: 0 } : { top: 0 }, { backgroundColor: 'rgba(0,0,0,0.25)' }]} />
        </>
      )}
    </>
  );
  if (!PAKAI_BLUR) {
    return <View style={gayaTepi}>{lapis}{children}</View>;
  }
  return (
    <BlurView intensity={t.intensitas} tint="dark" style={gayaTepi}>
      {lapis}
      {children}
    </BlurView>
  );
}

const gayaDasar: ViewStyle = { backgroundColor: 'transparent', overflow: 'hidden' };

const gayaRim: ViewStyle = {
  position: 'absolute',
  left: 0,
  right: 0,
  height: StyleSheet.hairlineWidth,
};
