/**
 * HALAMAN 2 — CHART.
 *
 * WebView memuat `/chart-embed` di web: komponen chart yang sama dengan yang
 * dipakai ribuan kali di sana, lapisan SVG zona dan sumbu ikut apa adanya.
 *
 * SATU HARGA, BUKAN DUA.
 *
 * Versi pertama layar ini menarik harganya sendiri dari `/api/bacaan` dan
 * hasilnya terukur: bilah 4.351,04 sementara chip di dalam chart 4.350,47 —
 * dua angka untuk satu hal di satu layar, karena bilah menunggu tiga lapis
 * keterlambatan (harga berjalan bot sampai 28 detik, cache nginx 20 detik,
 * jeda tarik app 20 detik) sementara chart menerima tick langsung.
 *
 * Sekarang WebView MENGIRIMKAN harga hidupnya lewat `postMessage`, dan bilah
 * memakainya begitu datang. Alasan asli tetap dihormati: `/api/bacaan` tetap
 * mengisi detik-detik pertama, jadi bilah tidak pernah kosong menunggu chart.
 */
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { ASAL } from '../data/antrian';
import { ambilBacaan, syaratWajib, type Mesin, type Pasar } from '../data/api';
import { angka, ubah } from '../data/tampil';
import { W, H, J, R, ANGKA, SENTUH } from '../gaya/token';

/**
 * Disuntikkan ke dalam halaman embed. Ia membaca kait uji yang SUDAH ADA di
 * komponen chart web (`__chartUji.harga()`), jadi tidak ada satu baris pun
 * yang perlu ditambahkan di sisi web untuk ini.
 */
const SUNTIK = `
(function () {
  var akhir = null;
  setInterval(function () {
    try {
      var u = window.__chartUji;
      if (!u || typeof u.harga !== 'function') return;
      var h = u.harga();
      if (typeof h !== 'number' || !isFinite(h) || h <= 0 || h === akhir) return;
      akhir = h;
      window.ReactNativeWebView.postMessage(JSON.stringify({ harga: h }));
    } catch (e) { /* halaman belum siap */ }
  }, 1000);
})();
true;
`;

type Props = {
  pasar: Pasar;
  tf: string;
  gantiTf: (tf: string) => void;
  bukaBacaan: (mesin: string) => void;
};

export function LayarChart({ pasar, tf, gantiTf, bukaBacaan }: Props) {
  const [harga, setHarga] = useState<number | null>(null);
  /** Harga dari dalam chart menang; dari API cuma pengisi awal. */
  const dariChart = useRef(false);
  const [memuat, setMemuat] = useState(true);
  const [daftarMesin, setDaftarMesin] = useState<Mesin[]>([]);
  /**
   * Mesin yang sedang dilihat — state LAYAR, bukan setelan tersimpan.
   *
   * Sengaja tidak menulis ke `simpan.ts`: menengok mesin lain sebentar bukan
   * pernyataan "ini pilihanku sekarang", dan setelan yang berubah tiap kali
   * orang mengintip adalah setelan yang tidak pernah ia pilih.
   */
  const [mesin, setMesin] = useState('');

  const url = `${ASAL}/chart-embed?pair=${encodeURIComponent(pasar.simbol)}&tf=${encodeURIComponent(tf)}`
    + (mesin === '' ? '' : `&mesin=${encodeURIComponent(mesin)}`);

  useEffect(() => {
    dariChart.current = false;
    setHarga(null);
    setDaftarMesin([]);
    setMesin('');
    let batal = false;
    void ambilBacaan(pasar.simbol, tf).then((j) => {
      if (batal) return;
      if (!j.ok) return;
      setDaftarMesin(j.isi.mesin);
      if (!dariChart.current && j.isi.harga > 0) setHarga(j.isi.harga);
    });
    return () => { batal = true; };
  }, [pasar.simbol, tf]);

  /** Mesin yang sedang aktif: pilihan layar, atau yang pertama dari jawaban. */
  const aktif = mesin === '' ? (daftarMesin[0]?.mesin ?? '') : mesin;
  const u = pasar.ubah24hPersen;
  const warnaUbah = u === null ? W.teksSamar : u > 0 ? W.naik : u < 0 ? W.turun : W.teksSamar;

  const pesan = (e: WebViewMessageEvent): void => {
    try {
      const j = JSON.parse(e.nativeEvent.data) as { harga?: number };
      if (typeof j.harga === 'number' && j.harga > 0) { dariChart.current = true; setHarga(j.harga); }
    } catch { /* pesan yang tidak kami mengerti diabaikan, bukan menjatuhkan layar */ }
  };

  return (
    <View style={g.akar}>
      {/* BILAH ATAS — bentuk yang sama dengan web mobile: simbol, titik hidup,
          harga sebagai satu-satunya angka terbesar, lalu perubahan 24 jam. */}
      <View style={g.bilah}>
        <View style={g.bilahAtas}>
          <Text style={g.simbol} numberOfLines={1}>{pasar.simbol}</Text>
          <View style={[g.titik, { backgroundColor: dariChart.current ? W.naik : W.teksSamar }]} />
          <Text style={g.harga}>{angka(harga, pasar.desimal)}</Text>
          <Text style={[g.ubah, { color: warnaUbah }]}>{ubah(pasar.ubah24hPersen)}</Text>
        </View>
      </View>

      {/* TIMEFRAME — bergaris bawah, bukan chip berkotak. Deret angka yang
          dibaca sebagai deret, persis `.tfrow` di web. */}
      <View style={g.barisAlat}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={g.tfIsi}>
          {pasar.timeframes.map((t) => {
            const k = t.toLowerCase();
            const on = k === tf;
            return (
              <Pressable key={t} onPress={() => { gantiTf(k); setMemuat(true); }} style={[g.tf, on && g.tfOn]}>
                <Text style={[g.tfTeks, on && g.tfTeksOn]}>{k}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* TAB MESIN — dua baris: nama di atas, status di bawah. Yang aktif
          diberi titik dan garis bawah putih, sama dengan `.m-tab` di web.
          Emas tidak dipakai di sini; emas cuma untuk AnalisMarket+. */}
      {daftarMesin.length > 0 && (
        <View style={g.barisMesin}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {daftarMesin.map((x) => {
              const on = x.mesin === aktif;
              const wajib = syaratWajib(x);
              const lolos = wajib.filter((c) => c.lolos).length;
              return (
                <Pressable
                  key={x.mesin}
                  onPress={() => { setMesin(x.mesin); setMemuat(true); }}
                  style={[g.mesinTab, on && g.mesinTabOn]}
                >
                  <View style={g.mesinKepala}>
                    {on && <View style={g.mesinTitik} />}
                    <Text style={[g.mesinNama, on && g.mesinNamaOn]} numberOfLines={1}>
                      {x.mesin.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={g.mesinStatus} numberOfLines={1}>
                    {x.status.toLowerCase()} {lolos}/{wajib.length}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      <View style={g.wadah}>
        <WebView
          key={url}
          source={{ uri: url }}
          style={g.web}
          backgroundColor="#0B0B0D"
          onLoadStart={() => { setMemuat(true); }}
          onLoadEnd={() => { setMemuat(false); }}
          onMessage={pesan}
          injectedJavaScript={SUNTIK}
          /* Cubit dan geser milik chart, bukan WebView: kalau WebView ikut
             menzum, yang membesar gambar berikut hurufnya — bukan skalanya. */
          scalesPageToFit={false}
          setBuiltInZoomControls={false}
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          javaScriptEnabled
          domStorageEnabled
          /* Dikunci ke asal kita sendiri, bukan kartu liar apa pun. WebView yang
             boleh menavigasi ke mana saja adalah permukaan serang yang tidak
             kita butuhkan — halaman ini cuma perlu satu alamat. Soket bursa
             tetap jalan: `wss://` itu subresource, bukan navigasi. */
          originWhitelist={[ASAL]}
        />
        {memuat && (
          <View style={g.tunggu} pointerEvents="none"><ActivityIndicator color={W.teksRedup} /></View>
        )}
      </View>

      <Pressable onPress={() => { bukaBacaan(aktif); }} style={g.bacaTombol}>
        <Text style={g.bacaTeks}>Baca analisanya</Text>
      </Pressable>
    </View>
  );
}

const g = StyleSheet.create({
  akar: { flex: 1, backgroundColor: W.latar },
  bilah: { paddingHorizontal: 14, paddingVertical: J.x2 },
  bilahAtas: { flexDirection: 'row', alignItems: 'center', gap: J.x2 },
  simbol: { fontSize: H.pasar, fontWeight: '700', color: W.teksKuat, letterSpacing: 0.2 },
  titik: { width: 6, height: 6, borderRadius: R.bulat },
  /* Satu-satunya angka terbesar di layar ini — 19px, sama dengan web mobile. */
  harga: { fontSize: H.harga, fontWeight: '700', color: W.teksKuat, flex: 1, textAlign: 'right', ...ANGKA },
  ubah: { fontSize: H.label, ...ANGKA },

  /* Tinggi sasaran sentuh penuh, sama dengan `--sentuh: 44px`. */
  barisAlat: { height: SENTUH, borderTopWidth: 1, borderTopColor: W.garis, justifyContent: 'center' },
  tfIsi: { paddingHorizontal: 10, alignItems: 'center' },
  tf: { paddingHorizontal: 10, height: SENTUH, justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tfOn: { borderBottomColor: W.teksKuat },
  tfTeks: { fontSize: H.nilai, lineHeight: 16, color: W.teksRedup, letterSpacing: 0.6 },
  tfTeksOn: { color: W.teksKuat, fontWeight: '500' },

  barisMesin: { borderTopWidth: 1, borderTopColor: W.garis, borderBottomWidth: 1, borderBottomColor: W.garis },
  /* Tinggi TIDAK dipatok — dua baris teks yang tingginya ditebak akan
     terpotong. Padding yang menentukan, isinya yang mengukur. */
  mesinTab: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRightWidth: 1, borderRightColor: W.garis,
    borderBottomWidth: 2, borderBottomColor: 'transparent', minWidth: 96,
  },
  mesinTabOn: { borderBottomColor: W.teksKuat, backgroundColor: W.kartu },
  mesinKepala: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  mesinTitik: { width: 5, height: 5, borderRadius: R.bulat, backgroundColor: W.teksKuat },
  mesinNama: { fontSize: H.nilai, lineHeight: 16, color: W.teksRedup, letterSpacing: 0.4 },
  mesinNamaOn: { color: W.teksKuat, fontWeight: '500' },
  mesinStatus: {
    fontSize: H.label, lineHeight: 13, color: W.teksSamar,
    letterSpacing: 1.1, textTransform: 'uppercase', marginTop: 2,
  },

  wadah: { flex: 1, backgroundColor: '#0B0B0D' },
  web: { flex: 1, backgroundColor: '#0B0B0D' },
  tunggu: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  bacaTombol: {
    marginHorizontal: 14, marginVertical: J.x3, minHeight: SENTUH, justifyContent: 'center',
    borderRadius: R.besar, backgroundColor: W.kartuTerang, borderWidth: 1, borderColor: W.garis, alignItems: 'center',
  },
  bacaTeks: { fontSize: H.nilai, color: W.teksKuat, fontWeight: '500' },
});
