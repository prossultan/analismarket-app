/**
 * TENTANG — mockup 31.
 *
 * Sumber data disebut dengan nama dan jumlah pasarnya. Kalimat soal mesin
 * baru menyatakan SYARATNYA — bukan menjanjikan akan ada banyak.
 */
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSisaBilah } from '../gaya/jarak';
import { Blok, Butir, Chip, Lbl, Menu } from '../komponen/mockup';
import { W, H, TALANG } from '../gaya/token';

const LOGO = require('../../assets/logo-am.png') as number;
const MESIN = ['snr', 'smc', 'ema200', 'ichimoku', 'fibonacci'];

export function LayarTentang({ versi, jumlahPasar }: { versi: string; jumlahPasar: { binance: number; twelve: number } | null }) {
  const tinggiKepala = useHeaderHeight();
  const sisaBilah = useSisaBilah();
  return (
    <ScrollView style={g.akar} contentContainerStyle={{ paddingTop: tinggiKepala + 9, paddingBottom: sisaBilah, paddingHorizontal: TALANG, gap: 7 }}>
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
        <View style={g.chips}>{MESIN.map((m) => <Chip key={m} teks={m} />)}</View>
        <Text style={g.ketKiri}>Tiap mesin punya syarat wajibnya sendiri. Mesin baru masuk hanya sesudah lolos pengukuran belah-periode — bukan karena kelihatan bagus di grafik.</Text>
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
});
