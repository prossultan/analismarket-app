/**
 * LEMBAR BAWAH yang bisa ditarik untuk menutup — satu pintu untuk ketiganya
 * (bacaan, banding mesin, daftar pasar).
 *
 * Sebelumnya `Modal animationType="slide"`: masuk dan keluar dengan kurva
 * sistem yang tidak bisa disentuh, "tarik turun untuk menutup" cuma tulisan,
 * dan tirainya melompat dari 0 ke 1. Sekarang:
 *
 * - Posisinya NILAI BERSAMA di UI thread; React tidak merender satu frame pun
 *   selama jari bergerak.
 * - Menutup diputuskan dari KECEPATAN, bukan cuma jarak: jentikan pendek
 *   cukup. Menuntut 40% perjalanan membuat lembar terasa berat.
 * - Kecepatan jari DITERUSKAN ke pegas — tidak ada sambungan antara jari
 *   lepas dan animasi lanjut. Ini satu-satunya detail yang paling memisahkan
 *   "halus" dari "lumayan".
 * - Menarik ke ATAS melewati batas diberi hambatan karet, bukan berhenti keras.
 * - Tirai diturunkan dari nilai yang sama, jadi selalu sinkron dan gratis.
 *
 * Gestur cuma di KEPALA lembar (gagang + judul), bukan seluruh lembar:
 * isinya boleh berisi daftar yang bisa digulir, dan dua gestur vertikal di
 * tempat yang sama saling berebut.
 *
 * Gerak-dikurangi: `ReduceMotion.System` di tiap pegas — Reanimated membuat
 * lompatannya seketika, gesturnya tetap jalan.
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation, ReduceMotion, interpolate, useAnimatedStyle, useSharedValue, withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Kaca } from './Kaca';
import { PEGAS_LEMBAR, PEGAS_MASUK, PEGAS_TUTUP, karet, proyeksi } from '../gaya/gerak';
import { W } from '../gaya/token';

/** Sebelum tinggi terukur, lembar diparkir jauh di bawah layar. */
const JAUH = 1600;

type Props = {
  terbuka: boolean;
  onTutup: () => void;
  /** Gagang + judul: area yang bisa ditarik. */
  kepala: ReactNode;
  children: ReactNode;
  /** Gaya lembar (maxHeight, radius, padding). */
  gaya?: StyleProp<ViewStyle>;
  /** Gaya pembungkus luar — jarak dari tepi layar (mis. di atas bilah tab). */
  gayaLuar?: StyleProp<ViewStyle>;
  /** Tirai tipis membiarkan chart di baliknya terlihat. */
  tirai?: 'tipis' | 'tebal';
  labelTutup?: string;
};

export function Lembar({ terbuka, onTutup, kepala, children, gaya, gayaLuar, tirai = 'tebal', labelTutup = 'Tutup' }: Props) {
  const [tampil, setTampil] = useState(terbuka);
  const y = useSharedValue(JAUH);
  const tinggi = useSharedValue(JAUH);
  const mulai = useSharedValue(0);

  const tenang = { ...PEGAS_MASUK, reduceMotion: ReduceMotion.System };
  const sembunyi = useCallback(() => { setTampil(false); }, []);

  useEffect(() => {
    if (terbuka) {
      setTampil(true);
      /* Kalau tinggi sudah diketahui dari pembukaan sebelumnya, masuk sekarang;
         kalau belum, `onLayout` yang memulainya begitu terukur. */
      if (tinggi.get() < JAUH) {
        y.set(tinggi.get());
        y.set(withSpring(0, tenang));
      }
      return;
    }
    /* Sudah di luar layar karena ditarik: tidak perlu animasi kedua. */
    if (y.get() >= tinggi.get() - 1) { setTampil(false); return; }
    y.set(withSpring(tinggi.get(), { ...PEGAS_TUTUP, reduceMotion: ReduceMotion.System },
      (selesai) => { if (selesai === true) scheduleOnRN(sembunyi); }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terbuka]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    const pertama = tinggi.get() >= JAUH;
    tinggi.set(h);
    if (pertama) {
      y.set(h);
      y.set(withSpring(0, tenang));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pan = useMemo(() => Gesture.Pan()
    .activeOffsetY([-8, 8])
    .onStart(() => {
      /* Mulai dari nilai yang SEDANG terlihat, bukan dari 0 — menangkap lembar
         di tengah animasi tidak boleh membuatnya melompat. */
      mulai.set(y.get());
    })
    .onUpdate((e) => {
      const n = mulai.get() + e.translationY;
      y.set(n >= 0 ? n : karet(n, tinggi.get()));
    })
    .onEnd((e) => {
      const proyeksiAkhir = y.get() + proyeksi(e.velocityY);
      if (proyeksiAkhir > tinggi.get() * 0.4) {
        y.set(withSpring(tinggi.get(), { ...PEGAS_TUTUP, velocity: e.velocityY, reduceMotion: ReduceMotion.System },
          (selesai) => { if (selesai === true) scheduleOnRN(onTutup); }));
      } else {
        y.set(withSpring(0, { ...PEGAS_LEMBAR, velocity: e.velocityY, reduceMotion: ReduceMotion.System }));
      }
    }), [onTutup]);

  const gayaLembar = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }] }));
  const gayaTirai = useAnimatedStyle(() => ({
    opacity: interpolate(y.get(), [0, tinggi.get()], [1, 0], Extrapolation.CLAMP),
  }));

  if (!tampil) return null;
  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onTutup}>
      {/* Modal Android membuka jendela native baru; gestur butuh akarnya sendiri di dalamnya. */}
      <GestureHandlerRootView style={g.akar}>
        <Animated.View style={[StyleSheet.absoluteFill, tirai === 'tebal' ? g.tiraiTebal : g.tiraiTipis, gayaTirai]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onTutup} accessibilityLabel={labelTutup} accessibilityRole="button" />
        </Animated.View>
        <View style={[g.luar, gayaLuar]} pointerEvents="box-none">
          {/* `gaya` (maxHeight/height) dipasang di PEMBUNGKUS yang dianimasikan, bukan
              di Kaca: persentase tinggi butuh induk berbatas, dan pembungkus inilah
              yang bersandar ke `luar` (flex:1). Dipasang di Kaca, 88% dihitung dari
              tinggi tak terbatas dan lembarnya melebar ke atas layar. */}
          <Animated.View style={[g.bungkus, gaya, gayaLembar]} onLayout={onLayout}>
            <Kaca tebal tepi="atas" gaya={g.lembar}>
              <GestureDetector gesture={pan}>
                <View>{kepala}</View>
              </GestureDetector>
              {children}
            </Kaca>
          </Animated.View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const g = StyleSheet.create({
  akar: { flex: 1 },
  luar: { flex: 1, justifyContent: 'flex-end' },
  bungkus: { maxHeight: '100%' },
  tiraiTebal: { backgroundColor: W.tirai },
  tiraiTipis: { backgroundColor: 'rgba(0,0,0,0.28)' },
  lembar: { flexShrink: 1, borderTopLeftRadius: 18, borderTopRightRadius: 18, overflow: 'hidden', paddingTop: 6 },
});
