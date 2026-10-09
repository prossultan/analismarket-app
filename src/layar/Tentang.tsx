/**
 * TENTANG — mockup 31.
 *
 * Sumber data disebut dengan nama dan jumlah pasarnya. Kalimat soal mesin
 * baru menyatakan SYARATNYA — bukan menjanjikan akan ada banyak.
 */
import { useEffect, useState } from 'react';
import { gayaTema } from '../gaya/tema';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ambilPasar } from '../data/api';
import { useSisaBilah, useTinggiKepala } from '../gaya/jarak';
import { Blok, Butir, Chip, Lbl, Menu, PitaBasi } from '../komponen/mockup';
import { capBuild } from '../data/versi';
import { kalimatCakupan } from '../data/tampil';
import { W, R, TALANG, ANGKA } from '../gaya/token';
import { Latar } from '../komponen/Latar';
import { Ikon, type NamaIkon } from '../komponen/Ikon';

const LOGO = require('../../assets/merek-mark.png') as number;
const MESIN = ['snr', 'smc', 'ema200', 'ichimoku', 'fibonacci'];

export function LayarTentang({ versi }: { versi: string }) {
  const tinggiKepala = useTinggiKepala();
  const sisaBilah = useSisaBilah();
  /* Jumlah pasar per penyedia DIHITUNG dari daftar yang sudah ada di simpanan,
     bukan diketik — angka yang diketik akan basi pada hari pasar ke-132 masuk. */
  const [jumlahPasar, setJumlah] = useState<{ binance: number; twelve: number } | null>(null);
  const [sebab, setSebab] = useState<string | null>(null);
  useEffect(() => {
    void ambilPasar().then((j) => {
      if (!j.ok) { setSebab(j.kalimat); return; }
      setSebab(null);
      const twelve = j.isi.pasar.filter((x) => x.jenis !== 'kripto').length;
      setJumlah({ binance: j.isi.pasar.length - twelve, twelve });
    });
  }, []);
  return (
    <Latar>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: tinggiKepala + 10, paddingBottom: sisaBilah, paddingHorizontal: TALANG, gap: 8 }}>
        {sebab !== null && <PitaBasi kalimat={sebab} />}
        <View style={g.hero}>
          <View style={g.logoBingkai}><Image source={LOGO} style={g.logo} accessibilityIgnoresInvertColors /></View>
          <Text style={g.nama}>Analis<Text style={{ color: W.plusTeks }}>Market</Text></Text>
          <View style={g.cap}><Text style={g.capTeks}>{capBuild()}</Text></View>
          {/* Angka pasar dari daftar yang terbaca di atas, bukan diketik — "131"
              masih tercetak di sini saat daftarnya sudah 155 (3 Okt). */}
          <Text style={g.ket}>{kalimatCakupan(jumlahPasar === null ? null : jumlahPasar.binance + jumlahPasar.twelve)} Bukan nasihat investasi, dan tidak menjanjikan hasil apa pun.</Text>
        </View>

        <Lbl gaya={{ marginTop: 6 }}>Sumber data</Lbl>
        <Menu>
          <Butir simbol="BTCUSDT" nama="Binance" ket={jumlahPasar === null ? '—' : `${String(jumlahPasar.binance)} pasar`} pertama />
          <Butir simbol="XAU/USD" nama="Twelve Data" ket={jumlahPasar === null ? '—' : `${String(jumlahPasar.twelve)} pasar`} />
        </Menu>

        <Lbl gaya={{ marginTop: 6 }}>Mesin analisa</Lbl>
        <Blok>
          <View style={g.chips}>{MESIN.map((m) => <Chip key={m} teks={m} mono lencana />)}</View>
          <Text style={g.ketKiri}>Tiap mesin punya syarat wajibnya sendiri. Mesin baru masuk hanya sesudah lolos pengukuran belah-periode — bukan karena kelihatan bagus di grafik.</Text>
        </Blok>

        <Lbl gaya={{ marginTop: 6 }}>Cara kerjanya</Lbl>
        <Blok rapat>
          {CARA.map(([ikon, j, k], i) => (
            <View key={j} style={[g.cara, i > 0 && g.caraGaris]}>
              <View style={g.caraIkon}><Ikon nama={ikon} warna={W.plusTeks} ukuran={17} /></View>
              <View style={{ flex: 1 }}>
                <Text style={g.caraJudul}>{j}</Text>
                <Text style={g.caraKet}>{k}</Text>
              </View>
            </View>
          ))}
        </Blok>

        <Menu>
          {/* Teks, bukan tautan — app ini tidak memasang tautan keluar. */}
          <Butir ikon="kabar" nama="Bot Telegram" ket="@analismarketbot" ketMono pertama />
          <Butir ikon="lainnya" nama="Situs web" ket="analismarket.com" ketMono />
        </Menu>
      </ScrollView>
    </Latar>
  );
}

/** Empat fakta, bukan urutan — karena itu bukan `Langkah` (komponen itu cuma untuk alur yang urutannya menentukan). */
const CARA: ReadonlyArray<readonly [NamaIkon, string, string]> = [
  ['pasar', '1.300 lilin dibaca tiap kali', 'Bukan cuma yang terlihat di layar — indikator butuh riwayat panjang supaya angkanya konvergen.'],
  ['lapis', 'Lima mesin, satu muatan', 'Semua mesin dibaca sekaligus dari satu panggilan; berpindah mesin tidak menagih apa pun.'],
  ['target', 'RR yang dicetak RR bersih', 'Spread dan slippage dipotong dulu. Angka 1:2 di kartu berarti 1:2 sesudah biaya.'],
  ['perisai', 'Angka ditahan kalau tidak jujur', 'Kalau imbalan tidak sepadan dengan risikonya di dalam gerak wajar pasar, Entry/SL/TP tidak dicetak.'],
];

const g = gayaTema((W) => StyleSheet.create({
  hero: { alignItems: 'center', paddingTop: 14, paddingBottom: 10 },
  logoBingkai: {
    width: 76, height: 76, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    backgroundColor: W.amberLatar, borderWidth: 1, borderColor: W.amberTepi, borderTopColor: 'rgba(240,191,107,0.7)',
  },
  logo: { width: 52, height: 52, borderRadius: 14 },
  nama: { fontSize: 24, fontWeight: '700', color: W.teksKuat, letterSpacing: -0.6 },
  cap: { marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: R.bulat, backgroundColor: W.isiSamar, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: W.kacaTepi },
  capTeks: { fontSize: 11, color: W.teksRedup, ...ANGKA },
  ket: { marginTop: 12, fontSize: 13, color: W.teksRedup, lineHeight: 19, textAlign: 'center', maxWidth: 300 },
  ketKiri: { marginTop: 10, fontSize: 12.5, color: W.teksSamar, lineHeight: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cara: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 11, paddingHorizontal: 3 },
  caraGaris: { borderTopWidth: StyleSheet.hairlineWidth * 2, borderTopColor: W.garisSamar },
  caraIkon: {
    width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: W.amberLatar, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: 'rgba(229,173,81,0.20)',
  },
  caraJudul: { fontSize: 13.5, fontWeight: '600', color: W.teksKuat, lineHeight: 19 },
  caraKet: { fontSize: 12.5, color: W.teksRedup, lineHeight: 18, marginTop: 2 },
}));
