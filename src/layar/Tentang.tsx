/**
 * TENTANG — mockup 31.
 *
 * Sumber data disebut dengan nama dan jumlah pasarnya. Kalimat soal mesin
 * baru menyatakan SYARATNYA — bukan menjanjikan akan ada banyak.
 */
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ambilPasar } from '../data/api';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSisaBilah } from '../gaya/jarak';
import { Blok, Butir, Chip, Lbl, Menu, PitaBasi } from '../komponen/mockup';
import { W, H, TALANG } from '../gaya/token';

const LOGO = require('../../assets/merek-mark.png') as number;
const MESIN = ['snr', 'smc', 'ema200', 'ichimoku', 'fibonacci'];

export function LayarTentang({ versi }: { versi: string }) {
  const tinggiKepala = useHeaderHeight();
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
    <ScrollView style={g.akar} contentContainerStyle={{ flexGrow: 1, paddingTop: tinggiKepala + 9, paddingBottom: sisaBilah, paddingHorizontal: TALANG, gap: 7 }}>
      {sebab !== null && <PitaBasi kalimat={sebab} />}
      <Blok gaya={{ alignItems: 'center', paddingVertical: 15 }}>
        <Image source={LOGO} style={g.logo} accessibilityIgnoresInvertColors />
        <Text style={g.nama}>Analis<Text style={{ color: W.plus }}>Market</Text></Text>
        <Lbl polos gaya={{ marginTop: 3, fontVariant: ['tabular-nums'] }}>Versi {versi}</Lbl>
        <Text style={g.ket}>Analisa teknikal otomatis untuk 131 pasar. Bukan nasihat investasi, dan tidak menjanjikan hasil apa pun.</Text>
      </Blok>

      <Lbl>Sumber data</Lbl>
      <Menu>
        <Butir simbol="BTCUSDT" nama="Binance" ket={jumlahPasar === null ? '—' : `${String(jumlahPasar.binance)} pasar`} pertama />
        <Butir simbol="XAU/USD" nama="Twelve Data" ket={jumlahPasar === null ? '—' : `${String(jumlahPasar.twelve)} pasar`} />
      </Menu>

      <Lbl gaya={{ marginTop: 2 }}>Mesin analisa</Lbl>
      <Blok>
        <View style={g.chips}>{MESIN.map((m) => <Chip key={m} teks={m} lencana />)}</View>
        <Text style={g.ketKiri}>Tiap mesin punya syarat wajibnya sendiri. Mesin baru masuk hanya sesudah lolos pengukuran belah-periode — bukan karena kelihatan bagus di grafik.</Text>
      </Blok>

      <Blok gaya={{ flex: 1, justifyContent: 'center' }}>
        <Lbl>Cara kerjanya</Lbl>
        {[
          ['1.300 lilin dibaca tiap kali', 'Bukan cuma yang terlihat di layar — indikator butuh riwayat panjang supaya angkanya konvergen.'],
          ['Lima mesin, satu muatan', 'Semua mesin dibaca sekaligus dari satu panggilan; berpindah mesin tidak menagih apa pun.'],
          ['RR yang dicetak RR bersih', 'Spread dan slippage dipotong dulu. Angka 1:2 di kartu berarti 1:2 sesudah biaya.'],
          ['Angka ditahan kalau tidak jujur', 'Kalau imbalan tidak sepadan dengan risikonya di dalam gerak wajar pasar, Entry/SL/TP tidak dicetak.'],
        ].map(([j, k]) => (
          <View key={j} style={g.cara}>
            <Text style={g.caraJudul}>{j}</Text>
            <Text style={g.caraKet}>{k}</Text>
          </View>
        ))}
      </Blok>

      <Menu>
        {/* Teks, bukan tautan — app ini tidak memasang tautan keluar. */}
        <Butir ikon="kabar" nama="Bot Telegram" ket="@analismarketbot" ketMono pertama />
        <Butir ikon="lainnya" nama="Situs web" ket="analismarket.com" ketMono />
      </Menu>
    </ScrollView>
  );
}

const g = StyleSheet.create({
  akar: { flex: 1, backgroundColor: W.latar },
  logo: { width: 54, height: 54, borderRadius: 15, marginBottom: 9 },
  nama: { fontSize: 15, fontWeight: '600', color: W.teksKuat, letterSpacing: -0.3 },
  ket: { marginTop: 8, fontSize: H.alat, color: W.teksRedup, lineHeight: 15, textAlign: 'center', maxWidth: 260 },
  ketKiri: { marginTop: 6, fontSize: H.label, color: W.teksSamar, lineHeight: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  cara: { marginTop: 7 },
  caraJudul: { fontSize: H.nilai, fontWeight: '600', color: W.teksKuat },
  caraKet: { fontSize: H.alat, color: W.teksRedup, lineHeight: 14, marginTop: 1 },
});
