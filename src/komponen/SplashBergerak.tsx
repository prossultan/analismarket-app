/**
 * SPLASH BERGERAK — jembatan dari splash native ke layar pertama.
 *
 * Dua versi, dipilih pemilik 9 Okt (mockup `opendesign/mockups/splash-2026`):
 *   A · KILAU — tiap buka app. Cahaya amber mekar di belakang logo, kilau
 *       menyapu searah sapuan kuas, lalu app tampil. ±0,7 dtk.
 *   C · GARIS HARGA JADI LOGO — sekali seumur pemasangan. Garis dari 40
 *       harga BTCUSDT h1 yang asli menjalar dari tepi layar dan berakhir
 *       tepat di pangkal sapuan kuas; nama dan tagline menyusul. ±2 dtk.
 *
 * TIGA ATURAN yang tidak boleh dilanggar versi mana pun:
 *
 * 1. FRAME PERTAMA = SPLASH NATIVE. Logo 75 dp di tengah, latar #080706
 *    (diukur dari splash-icon.png: cakram 384 px di kanvas 1024, imageWidth
 *    200). Splash native baru diturunkan sesudah frame ini benar-benar
 *    tergambar (`onTampil`), jadi tidak ada kedip di antaranya.
 * 2. TIDAK MENAMBAH WAKTU TUNGGU. Splash tetap tunduk pada gerbang sesi:
 *    siap lebih cepat → langsung ke tahap keluar sesudah intro minimum;
 *    siap lebih lambat → cahayanya bernapas pelan sampai siap.
 * 3. KURANGI GERAK = TANPA GERAK. Logo diam, lalu pudar 200 ms.
 *
 * Semua gerak hidup di UI thread: satu nilai waktu bersama (`t`) dijalankan
 * `withTiming` linier, dan tiap lapisan menurunkan transform/opacity-nya
 * sendiri dari `t` di worklet. JS boleh sibuk membaca sesi dan Clerk — dan
 * memang sedang sibuk persis saat splash ini tampil — tanpa satu frame pun
 * jatuh. Tanpa getar: VIBRATE diblokir di manifes.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing, useAnimatedProps, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming, type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Circle, Defs, Ellipse, LinearGradient as SvgGradien, Path, RadialGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { MARK } from './Merek';
import { GARIS_SPLASH } from '../data/garisSplash';

const LATAR = '#080706';
const AMBER = '#E5AD51';
/** Logo digambar 108 px lalu diskalakan — lebih tajam daripada 75 px yang diperbesar. */
const BASIS = 108;
const S_NATIVE = 75 / BASIS;
/** Sapuan kuas miring −27°; di bingkai yang diputar ia garis datar y=+9, x −18…+49 (basis 108). */
const SUDUT = (-27 * Math.PI) / 180;
const SAP_X0 = -18;
const SAP_Y = 9;
const ANGKAT = -34;

const INTRO_A = 680;
const INTRO_C = 2150;
const KELUAR_A = 280;
const KELUAR_C = 380;

const KURVA = Easing.bezierFn(0.23, 1, 0.32, 1);
const PINDAH = Easing.bezierFn(0.77, 0, 0.175, 1);

function seg(t: number, a: number, b: number, e: (x: number) => number): number {
  'worklet';
  return e(Math.min(1, Math.max(0, (t - a) / (b - a))));
}
function lin(x: number): number {
  'worklet';
  return x;
}

const PathBergerak = Animated.createAnimatedComponent(Path);
const LingkaranBergerak = Animated.createAnimatedComponent(Circle);

type Props = {
  /** Gerbang sesi sudah memutuskan — app boleh tampil. */
  siap: boolean;
  /** null = belum tahu (simpanan belum terbaca): tampilkan frame native, diam. */
  pertama: boolean | null;
  /** Frame pertama sudah tergambar — saatnya splash native diturunkan. */
  onTampil: () => void;
  /** Splash selesai keluar; boleh dilepas dari pohon. */
  selesai: () => void;
};

export function SplashBergerak({ siap, pertama, onTampil, selesai }: Props) {
  const tenang = useReducedMotion();
  const { width: lebar, height: tinggi } = useWindowDimensions();
  const t = useSharedValue(0);
  const keluar = useSharedValue(0);
  const napas = useSharedValue(0);
  const [introSelesai, setIntroSelesai] = useState(false);
  const versiC = pertama === true;

  /* Intro mulai begitu versinya diketahui. */
  useEffect(() => {
    if (pertama === null) return;
    if (tenang) { setIntroSelesai(true); return; }
    const akhir = versiC ? INTRO_C : INTRO_A;
    t.set(withTiming(akhir, { duration: akhir, easing: Easing.linear }, (beres) => {
      if (beres === true) scheduleOnRN(setIntroSelesai, true);
    }));
  }, [pertama, tenang, versiC, t]);

  /* Menunggu gerbang: cahaya bernapas pelan, tanpa batas, sampai siap. */
  useEffect(() => {
    if (!introSelesai || siap || tenang) return;
    napas.set(withRepeat(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [introSelesai, siap, tenang, napas]);

  /* Keluar: hanya kalau intro sudah jalan DAN gerbang sudah memutuskan. */
  const sudahKeluar = useRef(false);
  useEffect(() => {
    if (!introSelesai || !siap || sudahKeluar.current) return;
    sudahKeluar.current = true;
    const lama = tenang ? 200 : versiC ? KELUAR_C : KELUAR_A;
    keluar.set(withTiming(1, { duration: lama, easing: KURVA }, (beres) => {
      if (beres === true) scheduleOnRN(selesai);
    }));
  }, [introSelesai, siap, tenang, versiC, keluar, selesai]);

  /* ── turunan gerak ─────────────────────────────────────────────── */
  const gayaAkar = useAnimatedStyle(() => ({ opacity: 1 - keluar.get() }));

  const gayaLogo = useAnimatedStyle(() => {
    const k = keluar.get();
    if (!versiC) {
      return { transform: [{ scale: S_NATIVE * (1 - 0.08 * k) }] };
    }
    const besar = seg(t.get(), 200, 500, PINDAH);
    return {
      transform: [
        { translateY: ANGKAT * besar - 10 * k },
        { scale: (S_NATIVE + (1 - S_NATIVE) * besar) * (1 - 0.04 * k) },
      ],
    };
  });

  const gayaCahaya = useAnimatedStyle(() => {
    const tt = t.get();
    const mekar = versiC ? seg(tt, 1260, 1700, KURVA) : seg(tt, 200, 520, KURVA);
    const bernapas = 0.78 + 0.22 * (1 - napas.get());
    const naik = versiC ? ANGKAT * seg(tt, 200, 500, PINDAH) : 0;
    return {
      opacity: mekar * bernapas * (1 - keluar.get()),
      transform: [{ translateY: naik }, { scale: 0.85 + 0.15 * mekar }],
    };
  });

  const gayaKilau = useAnimatedStyle(() => {
    const tt = t.get();
    const [a, b] = versiC ? [1230, 1560] : [300, 650];
    const x = -100 + 200 * seg(tt, a, b, PINDAH);
    const op = seg(tt, a, a + 60, lin) * (1 - seg(tt, b - 60, b, lin));
    return { opacity: op, transform: [{ translateX: x }] };
  });

  const gayaDenyut = useAnimatedStyle(() => {
    const kd = seg(t.get(), 1240, 1740, KURVA);
    return { opacity: t.get() < 1240 ? 0 : 0.7 * (1 - kd), transform: [{ scale: 1 + 0.45 * kd }] };
  });

  const KELILING = 2 * Math.PI * 62;
  const propCincin = useAnimatedProps(() => ({
    strokeDashoffset: KELILING * (1 - seg(t.get(), 1300, 1800, PINDAH)),
  }));

  const gayaTagline = useAnimatedStyle(() => {
    const k = seg(t.get(), 1750, 2000, KURVA);
    return { opacity: k * (1 - keluar.get()), transform: [{ translateY: 6 * (1 - k) }] };
  });

  /* ── garis harga (versi C) ─────────────────────────────────────── */
  const garis = useMemo(() => {
    const cx = lebar / 2;
    const cy = tinggi / 2 + ANGKAT;
    const px = cx + (SAP_X0 * Math.cos(SUDUT) - SAP_Y * Math.sin(SUDUT));
    const py = cy + (SAP_X0 * Math.sin(SUDUT) + SAP_Y * Math.cos(SUDUT));
    const vals = GARIS_SPLASH;
    const mn = Math.min(...vals);
    const mx = Math.max(...vals);
    const akhir = vals[vals.length - 1] ?? 0;
    const xs: number[] = []; const ys: number[] = [];
    vals.forEach((v, i) => {
      xs.push(-6 + (i / (vals.length - 1)) * (px + 6));
      ys.push(py - ((v - akhir) / ((mx - mn) || 1)) * 160);
    });
    const kum: number[] = [0];
    for (let i = 1; i < xs.length; i++) {
      kum.push((kum[i - 1] ?? 0) + Math.hypot((xs[i] ?? 0) - (xs[i - 1] ?? 0), (ys[i] ?? 0) - (ys[i - 1] ?? 0)));
    }
    const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${(ys[i] ?? 0).toFixed(1)}`).join(' ');
    return { d, xs, ys, kum, panjang: kum[kum.length - 1] ?? 1 };
  }, [lebar, tinggi]);

  const { xs, ys, kum, panjang } = garis;
  const propGaris = useAnimatedProps(() => {
    const tt = t.get();
    const tarik = seg(tt, 450, 1250, PINDAH);
    const pudar = 1 - seg(tt, 1450, 1850, lin);
    return { strokeDashoffset: panjang * (1 - tarik), strokeOpacity: tt < 450 ? 0 : pudar * (1 - keluar.get()) };
  });
  const propKepala = useAnimatedProps(() => {
    const tt = t.get();
    const jarak = panjang * seg(tt, 450, 1250, PINDAH);
    let i = 1;
    while (i < kum.length - 1 && (kum[i] ?? 0) < jarak) i += 1;
    const a = kum[i - 1] ?? 0; const b = kum[i] ?? 1;
    const f = b > a ? (jarak - a) / (b - a) : 0;
    const x = (xs[i - 1] ?? 0) + ((xs[i] ?? 0) - (xs[i - 1] ?? 0)) * f;
    const y = (ys[i - 1] ?? 0) + ((ys[i] ?? 0) - (ys[i - 1] ?? 0)) * f;
    return { cx: x, cy: y, opacity: tt > 450 && tt < 1270 ? 1 : 0 };
  });

  /* Splash native diturunkan sesudah LOGO-nya tergambar, bukan sesudah
     wadahnya — wadah tanpa logo adalah satu frame obsidian kosong. */
  const sudahTampil = useRef(false);
  const tampil = (): void => {
    if (sudahTampil.current) return;
    sudahTampil.current = true;
    onTampil();
  };
  useEffect(() => {
    const cadangan = setTimeout(tampil, 400);
    return () => { clearTimeout(cadangan); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, g.akar, gayaAkar]} pointerEvents={siap ? 'none' : 'auto'}
      accessible accessibilityLabel="AnalisMarket sedang dibuka">
      {versiC && !tenang && (
        <Svg style={StyleSheet.absoluteFill} width={lebar} height={tinggi}>
          <Defs>
            <SvgGradien id="splash-garis" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={AMBER} stopOpacity={0} />
              <Stop offset="0.55" stopColor={AMBER} stopOpacity={0.75} />
              <Stop offset="1" stopColor="#F6D392" stopOpacity={1} />
            </SvgGradien>
          </Defs>
          <PathBergerak d={garis.d} fill="none" stroke={AMBER} strokeOpacity={0.18} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={[panjang, panjang]} animatedProps={propGaris} />
          <PathBergerak d={garis.d} fill="none" stroke="url(#splash-garis)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={[panjang, panjang]} animatedProps={propGaris} />
          <LingkaranBergerak r={4} fill="#FFF3D6" animatedProps={propKepala} />
        </Svg>
      )}

      <View style={g.tengah} pointerEvents="none">
        <Animated.View style={[g.cahaya, gayaCahaya]}>
          <Svg width={520} height={520}>
            <Defs>
              <RadialGradient id="splash-cahaya" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor="#5A3C1E" stopOpacity={1} />
                <Stop offset="0.36" stopColor="#3A2915" stopOpacity={0.9} />
                <Stop offset="0.72" stopColor="#1C140B" stopOpacity={0.45} />
                <Stop offset="1" stopColor="#1C140B" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Ellipse cx={260} cy={260} rx={260} ry={260} fill="url(#splash-cahaya)" />
          </Svg>
        </Animated.View>

        <Animated.View style={[g.logo, gayaLogo]}>
          {versiC && !tenang && <Animated.View style={[g.denyut, gayaDenyut]} />}
          <Image source={MARK} style={g.mark} onLoadEnd={tampil} accessibilityIgnoresInvertColors />
          <View style={g.klip}>
            <View style={g.bingkaiSapuan}>
              <Animated.View style={[g.kilau, gayaKilau]}>
                <LinearGradient colors={['rgba(255,236,200,0)', 'rgba(255,226,170,0.6)', 'rgba(255,236,200,0)']}
                  start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
              </Animated.View>
            </View>
          </View>
          {versiC && !tenang && (
            <Svg style={g.cincin} width={140} height={140}>
              <LingkaranBergerak cx={70} cy={70} r={62} fill="none" stroke={AMBER} strokeWidth={1.4} strokeLinecap="round"
                strokeDasharray={[KELILING, KELILING]} transform="rotate(-90 70 70)" animatedProps={propCincin} />
            </Svg>
          )}
        </Animated.View>

        {versiC && !tenang && (
          <View style={g.merek}>
            <View style={g.baris}>
              {'AnalisMarket'.split('').map((h, i) => <Huruf key={`${h}${String(i)}`} h={h} i={i} t={t} keluar={keluar} emas={i >= 6} />)}
            </View>
            <Animated.Text style={[g.tagline, gayaTagline]}>Mesin membaca chart. Kamu yang memutuskan.</Animated.Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

/** Satu huruf nama — tiap huruf masuk 26 ms sesudah yang sebelumnya. */
function Huruf({ h, i, t, keluar, emas }: { h: string; i: number; t: SharedValue<number>; keluar: SharedValue<number>; emas: boolean }) {
  const gaya = useAnimatedStyle(() => {
    const a = 1450 + i * 26;
    const k = seg(t.get(), a, a + 260, KURVA);
    return { opacity: k * (1 - keluar.get()), transform: [{ translateY: 8 * (1 - k) - 12 * keluar.get() }] };
  });
  return <Animated.Text style={[g.huruf, emas && { color: AMBER }, gaya]}>{h}</Animated.Text>;
}

const g = StyleSheet.create({
  akar: { backgroundColor: LATAR, zIndex: 1000, elevation: 1000 },
  tengah: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  cahaya: { position: 'absolute', width: 520, height: 520 },
  logo: { width: BASIS, height: BASIS, alignItems: 'center', justifyContent: 'center' },
  mark: { position: 'absolute', width: BASIS, height: BASIS, borderRadius: BASIS / 2 },
  klip: { position: 'absolute', width: BASIS, height: BASIS, borderRadius: BASIS / 2, overflow: 'hidden' },
  bingkaiSapuan: { position: 'absolute', left: -BASIS / 2, top: -BASIS / 2, width: BASIS * 2, height: BASIS * 2, transform: [{ rotate: '-27deg' }] },
  kilau: { position: 'absolute', top: 0, left: BASIS - 14, width: 28, height: BASIS * 2 },
  denyut: { position: 'absolute', width: BASIS + 8, height: BASIS + 8, borderRadius: (BASIS + 8) / 2, borderWidth: 1.5, borderColor: AMBER },
  cincin: { position: 'absolute', left: (BASIS - 140) / 2, top: (BASIS - 140) / 2 },
  merek: { position: 'absolute', top: '50%', marginTop: 52, alignItems: 'center', left: 0, right: 0 },
  baris: { flexDirection: 'row' },
  huruf: { fontSize: 28, fontWeight: '700', color: '#F4F1EB', letterSpacing: -0.6 },
  tagline: { marginTop: 10, fontSize: 14, color: '#BDB5A9', textAlign: 'center' },
});
