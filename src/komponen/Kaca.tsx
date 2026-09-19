/**
 * PERMUKAAN KACA — satu pintu untuk seluruh lapisan yang mengambang.
 *
 * Kenapa komponen, bukan `<BlurView>` langsung di tiap tempat: kaca butuh
 * TIGA lapisan yang harus tetap sejajar — blur, warna di atasnya, dan garis
 * rambut di tepinya. Yang disebar akan menyimpang, dan yang menyimpang
 * kelihatan seperti dua bahan berbeda di layar yang sama.
 *
 * Android memerlukan `experimentalBlurMethod`; tanpa itu `BlurView` di sana
 * merender kotak polos tanpa satu pun peringatan — bentuk kegagalan yang
 * paling mahal, karena ia terlihat seperti desain yang memang begitu.
 */
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { KACA } from '../gaya/token';

type Props = {
  children?: React.ReactNode;
  /** `tipis` untuk bilah, `tebal` untuk lembar. Lihat catatan di token. */
  tebal?: boolean;
  /** Garis rambut di tepi ATAS (bilah tab, lembar) atau BAWAH (bilah nav). */
  tepi?: 'atas' | 'bawah' | 'tidak';
  gaya?: StyleProp<ViewStyle>;
};

export function Kaca({ children, tebal = false, tepi = 'tidak', gaya }: Props) {
  const t = tebal ? KACA.tebal : KACA.tipis;
  return (
    <BlurView
      intensity={t.intensitas}
      tint="dark"
      experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
      style={[
        { backgroundColor: t.warna },
        tepi === 'atas' && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: KACA.tepi },
        tepi === 'bawah' && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: KACA.tepi },
        gaya,
      ]}
    >
      {/* Kilau tepi: garis rambut DI DALAM, yang memberi kaca ketebalan.
          Ia terpisah dari border supaya radius lembar tidak memotongnya. */}
      {tepi !== 'tidak' && (
        <View
          pointerEvents="none"
          style={[
            gayaRim,
            tepi === 'atas' ? { top: 0 } : { bottom: 0 },
          ]}
        />
      )}
      {children}
    </BlurView>
  );
}

const gayaRim: ViewStyle = {
  position: 'absolute',
  left: 0,
  right: 0,
  height: StyleSheet.hairlineWidth,
  backgroundColor: KACA.rim,
};
