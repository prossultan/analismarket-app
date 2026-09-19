/**
 * PERMUKAAN KACA — satu pintu untuk seluruh lapisan yang mengambang.
 *
 * Kenapa komponen, bukan `<BlurView>` langsung di tiap tempat: kaca butuh
 * EMPAT lapisan yang harus tetap sejajar — blur, warna, kilau dari atas, dan
 * garis rambut di tepinya. Yang disebar akan menyimpang.
 *
 * DUA KESALAHAN ANDROID yang pernah membuat kaca ini terlihat seperti panel
 * abu biasa di HP pemilik (19 Sep), padahal di web terlihat benar:
 *
 * 1. `backgroundColor` DI ATAS `BlurView` ITU SENDIRI. Di iOS warnanya
 *    dicampur; di Android ia DICAT DI ATAS hasil blur, jadi apa pun yang
 *    diblur tertutup warna padat. Warna sekarang lapisan anak sendiri.
 * 2. Tanpa `experimentalBlurMethod` Android merender kotak polos tanpa
 *    peringatan. Dan dengan `dimezisBlurView`, blur dihitung ulang tiap
 *    frame saat isi lewat di bawahnya — `blurReductionFactor` yang menjaga
 *    scroll tetap halus; kilau dan rim yang menjaga kacanya tetap terbaca
 *    walau blurnya dikurangi.
 *
 * Angkanya dari mockup `opendesign/mockups/kaca`: `--buram: blur(26px)`,
 * `--kaca: rgba(26,24,21,.44)`, `--kaca-tepi: rgba(255,255,255,.16)`,
 * `--kaca-rim: inset 0 1px 0 rgba(255,255,255,.15), inset 0 -1px 0 rgba(0,0,0,.25)`.
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

const ANDROID = Platform.OS === 'android';

export function Kaca({ children, tebal = false, tepi = 'tidak', gaya }: Props) {
  const t = tebal ? KACA.tebal : KACA.tipis;
  return (
    <BlurView
      intensity={t.intensitas}
      tint="dark"
      experimentalBlurMethod={ANDROID ? 'dimezisBlurView' : undefined}
      blurReductionFactor={ANDROID ? 6 : undefined}
      style={[
        gayaDasar,
        tepi === 'atas' && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: KACA.tepi },
        tepi === 'bawah' && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: KACA.tepi },
        gaya,
      ]}
    >
      {/* Lapis 2 — warna. Anak, bukan gaya BlurView: lihat kesalahan #1. */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: t.warna }]} />
      {/* Lapis 3 — kilau dari atas: yang membuat kaca terlihat seperti kaca,
          bukan seperti tirai gelap. Sangat tipis; ia terasa, tidak terlihat. */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255,255,255,0.075)', 'rgba(255,255,255,0.02)', 'rgba(255,255,255,0)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Lapis 4 — rim: terang di dalam tepi, gelap di sisi berlawanan.
          Terpisah dari border supaya radius lembar tidak memotongnya. */}
      {tepi !== 'tidak' && (
        <>
          <View pointerEvents="none" style={[gayaRim, tepi === 'atas' ? { top: 0 } : { bottom: 0 }, { backgroundColor: KACA.rim }]} />
          <View pointerEvents="none" style={[gayaRim, tepi === 'atas' ? { bottom: 0 } : { top: 0 }, { backgroundColor: 'rgba(0,0,0,0.25)' }]} />
        </>
      )}
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
