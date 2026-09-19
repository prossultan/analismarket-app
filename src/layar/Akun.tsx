/**
 * LAYAR YANG TERHALANG IDENTITAS — mockup 21 sampai 27.
 *
 * Ketujuhnya menunggu SATU pekerjaan yang sama: identitas lepas dari
 * Telegram. Bentuknya dibangun sekarang supaya yang hilang terlihat persis,
 * tapi isinya jujur: yang butuh data akun dicetak sebagai keadaan belum
 * tersambung, bukan angka karangan. Satu-satunya yang benar-benar bekerja
 * hari ini adalah tombol yang membuka bot — dan itu memang langkah pertama.
 */
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSisaBilah } from '../gaya/jarak';
import { Ikon } from '../komponen/Ikon';
import { BarIsi, BarisPakai, Blok, Butir, Chip, Kosong, Langkah, Lbl, Menu, Mikro, Nil, Radio, Saklar, Tombol } from '../komponen/mockup';
import { W, H, R, TALANG } from '../gaya/token';

/**
 * Nama bot — sama dengan `HANDLE` di renderer kartu. Ditampilkan sebagai
 * TEKS, bukan tautan: app ini tidak memasang tautan keluar (penjaga
 * `periksa-teks.mjs`), jadi orang membuka Telegram dan mengetik namanya.
 */
const BOT = 'analismarketbot';

function Wadah({ children }: { children: React.ReactNode }) {
  const tinggiKepala = useHeaderHeight();
  const sisaBilah = useSisaBilah();
  return (
    <ScrollView style={g.akar} contentContainerStyle={{ paddingTop: tinggiKepala + 9, paddingBottom: sisaBilah, paddingHorizontal: TALANG, gap: 7 }}>
      {children}
    </ScrollView>
  );
}

/* ── 21 · SAMBUNGKAN TELEGRAM ──────────────────────────────────────────── */
export function LayarSambung() {
  return (
    <Wadah>
      <Blok gaya={{ alignItems: 'center', paddingVertical: 14 }}>
        <Ikon nama="kabar" warna={W.plus} ukuran={28} />
        <Text style={g.judulTengah}>Buka bot, tekan satu tombol</Text>
        <Text style={g.ketTengah}>Identitasmu datang dari bot Telegram. Tidak ada formulir, tidak ada kata sandi.</Text>
      </Blok>
      {/* Penomoran di sini SAH: urutannya menentukan. Tanpa langkah 2 tautannya tidak pernah ada. */}
      <Blok rapat gaya={{ paddingHorizontal: 10 }}>
        <Langkah no={1} judul={`Buka @${BOT}`} ket="Tombol di bawah membukanya langsung." pertama />
        <Langkah no={2} judul="Tekan “Sambungkan web & app”" ket="Bot mengirim satu tautan sekali pakai." />
        <Langkah no={3} judul="Tautannya membuka app ini" ket="Sesi tersimpan 12 jam, lalu diperbarui sendiri." />
      </Blok>
      <Blok>
        <Lbl>Yang terbuka sesudah tersambung</Lbl>
        <View style={{ marginTop: 6, gap: 5 }}>
          {['Pantauan dan kabar otomatis', 'Setelan bawaan ikut dari bot', 'Status AnalisMarket+ terbaca'].map((t) => (
            <View key={t} style={g.centangBaris}><Text style={g.centang}>✓</Text><Text style={g.centangTeks}>{t}</Text></View>
          ))}
        </View>
      </Blok>
      <Blok gaya={{ alignItems: 'center' }}>
        <Lbl>Nama bot di Telegram</Lbl>
        <Text selectable style={g.handle}>@{BOT}</Text>
        <Mikro tengah>Buka Telegram, cari nama itu. App ini tidak memasang tautan keluar.</Mikro>
      </Blok>
      <Mikro>
        Langkah 3 belum bisa diselesaikan app ini: tautan sekali pakai dari bot saat ini membuka
        versi web. Sampai app punya jalur masuknya sendiri, sambungan berhenti di langkah 2.
      </Mikro>
    </Wadah>
  );
}

/* ── 22 · PANTAUAN (keadaan 15: belum ada) ─────────────────────────────── */
export function LayarPantauan({ bukaSambung }: { bukaSambung: () => void }) {
  const tinggiKepala = useHeaderHeight();
  const sisaBilah = useSisaBilah();
  return (
    <View style={[g.akar, { paddingTop: tinggiKepala + 9, paddingBottom: sisaBilah, paddingHorizontal: TALANG }]}>
      <View style={g.chips}><Chip teks="Aktif" on /><Chip teks="Menunggu" /><Chip teks="Selesai" /></View>
      <Kosong
        ikon="kabar"
        judul="Belum ada pantauan"
        kalimat="Pantauan mengabari kamu saat syarat setup sebuah mesin lolos — tanpa perlu membuka app. Ia hidup di akun Telegram-mu."
        aksi={bukaSambung}
        labelAksi="Sambungkan Telegram"
        catatan="Gratis sampai 3 pantauan"
      />
    </View>
  );
}

/* ── 23 · PANTAUAN BARU — bentuk formulirnya, dikunci sampai tersambung ── */
export function LayarPantauanBaru({ pasar, tf, mesin, bukaSambung }: { pasar: string; tf: string; mesin: string; bukaSambung: () => void }) {
  return (
    <Wadah>
      <Lbl>Pasar & timeframe</Lbl>
      <Menu>
        <Butir simbol={pasar} nama={pasar} ket="Ganti" pertama />
        <Butir ikon="kalender" nama="Timeframe" ket={tf.toLowerCase()} ketMono />
        <Butir ikon="analisis" nama="Mesin" ket={mesin === '' ? 'pertama' : mesin} ketMono />
      </Menu>
      <Lbl gaya={{ marginTop: 2 }}>Kabari saya saat</Lbl>
      <Menu>
        {[
          ['Syarat wajib lolos semua', 'Kartunya berubah jadi SETUP', true],
          ['Entry tersentuh', 'Harga mencapai level entry', false],
          ['TP atau SL tersentuh', 'Posisi berjalan selesai', false],
        ].map(([j, k, on], i) => (
          <View key={String(j)} style={[g.pilih, i > 0 && g.garis]}>
            <Radio on={Boolean(on)} />
            <View style={{ flex: 1 }}><Text style={g.pilihJudul}>{String(j)}</Text><Lbl polos>{String(k)}</Lbl></View>
          </View>
        ))}
      </Menu>
      <Blok>
        <View style={g.rata}><Lbl>Perkiraan kabar</Lbl><Nil>—</Nil></View>
        <Mikro>Dihitung dari 90 hari terakhir kombinasi ini — angka masa lalu, bukan janji. Baru bisa dihitung sesudah tersambung.</Mikro>
      </Blok>
      <Tombol teks="Sambungkan Telegram untuk menyimpan" onPress={bukaSambung} />
    </Wadah>
  );
}

/* ── 24 · KABAR OTOMATIS ───────────────────────────────────────────────── */
export function LayarKabarOtomatis({ bukaSambung }: { bukaSambung: () => void }) {
  return (
    <Wadah>
      <Blok>
        <View style={g.rata}>
          <View><Text style={g.pilihJudul}>Kabar otomatis</Text><Lbl polos>Pantauan berjalan tanpa membuka app</Lbl></View>
          <Saklar on={false} />
        </View>
      </Blok>
      <Lbl>Jam sunyi</Lbl>
      <Menu>
        <Butir ikon="kalender" nama="Mulai" ket="22.00" ketMono pertama />
        <Butir ikon="kalender" nama="Selesai" ket="06.00" ketMono />
      </Menu>
      <Mikro>Di dalam jam sunyi kabar TETAP dicatat, cuma tidak dibunyikan. Yang tertahan dikirim sekaligus saat jam sunyi selesai.</Mikro>
      <Lbl gaya={{ marginTop: 2 }}>Jenis yang dikirim</Lbl>
      <Menu>
        {['Setup lolos', 'Entry tersentuh', 'TP / SL tersentuh', 'Berita dampak tinggi'].map((n, i) => (
          <Butir key={n} ikon="kabar" nama={n} kanan={<Saklar on={i < 3} />} pertama={i === 0} />
        ))}
      </Menu>
      <Blok>
        <View style={g.rata}><Lbl>Terkirim 7 hari terakhir</Lbl><Nil>—</Nil></View>
        <View style={[g.rata, { marginTop: 5 }]}><Lbl>Tertahan jam sunyi</Lbl><Nil>—</Nil></View>
      </Blok>
      <Tombol teks="Sambungkan Telegram untuk mengaktifkan" onPress={bukaSambung} />
    </Wadah>
  );
}

/* ── 25 · KREDIT & KUOTA ───────────────────────────────────────────────── */
export function LayarKredit({ bukaSambung }: { bukaSambung: () => void }) {
  return (
    <Wadah>
      <Blok>
        <Lbl>Jatah harian pasar berkuota</Lbl>
        <View style={[g.baris, { marginTop: 6, alignItems: 'baseline' }]}>
          <Text style={g.besar}>—</Text><Text style={g.dari}>dari 800</Text>
        </View>
        <View style={{ marginTop: 8 }}><BarIsi porsi={0} /></View>
        <View style={[g.rata, { marginTop: 5 }]}><Lbl polos>Terpakai —</Lbl><Lbl polos>Pulih 07.00 WIB</Lbl></View>
      </Blok>
      <Blok>
        <Lbl>Yang TIDAK menagih kredit</Lbl>
        <Text style={g.ket}>Seluruh pasar Binance — 120 dari 131. Kuota cuma berlaku untuk emas dan forex, yang datanya dibeli per panggilan.</Text>
      </Blok>
      <Blok>
        <Lbl>Pemakaian hari ini</Lbl>
        <View style={{ marginTop: 4 }}>
          <BarisPakai kiri="Belum tersambung" kanan="—" pertama />
        </View>
      </Blok>
      <Tombol teks="Sambungkan Telegram untuk melihat kuota" onPress={bukaSambung} />
    </Wadah>
  );
}

/* ── 26 · CEK BANYAK PASAR ─────────────────────────────────────────────── */
export function LayarCekBanyak({ bukaSambung }: { bukaSambung: () => void }) {
  return (
    <Wadah>
      <Blok rapat gaya={{ flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,0.05)' }}>
        <Text style={{ color: W.teksSamar, fontSize: 12 }}>⌕</Text>
        <Text style={{ color: W.teksSamar, fontSize: H.alat }}>Tambah pasar…</Text>
      </Blok>
      <View style={[g.chips, { flexWrap: 'wrap' }]}>
        <Chip teks="BTCUSDT" on /><Chip teks="ETHUSDT" on /><Chip teks="SOLUSDT" on /><Chip teks="XAU/USD" on /><Chip teks="+ 4 lagi" />
      </View>
      <View style={g.baris}>
        <View style={{ flex: 1 }}><Lbl>Timeframe</Lbl><Nil gaya={{ marginTop: 2 }}>h1</Nil></View>
        <View style={{ flex: 1 }}><Lbl>Mesin</Lbl><Nil gaya={{ marginTop: 2 }}>semua 5</Nil></View>
        <View style={{ flex: 1 }}><Lbl>Kredit</Lbl><Nil gaya={{ marginTop: 2 }}>4</Nil></View>
      </View>
      <Blok>
        <Lbl>Hasil</Lbl>
        <Text style={g.ket}>Cek banyak pasar adalah fitur AnalisMarket+, dan AM+ terbaca dari akun Telegram-mu. Ongkos kreditnya dicetak sebelum dijalankan — ia tidak lebih murah daripada membuka satu-satu, cuma lebih cepat.</Text>
      </Blok>
      <Tombol teks="Sambungkan Telegram" onPress={bukaSambung} />
    </Wadah>
  );
}

/* ── 27 · BERLANGGANAN ─────────────────────────────────────────────────── */
export function LayarBerlangganan() {
  const sampai = new Date(Date.now() + 30 * 86_400_000).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <Wadah>
      <View style={g.kartuEmas}>
        <Text style={g.cap}>AnalisMarket+</Text>
        <Text style={g.harga}>Rp 99.000 <Text style={g.dari}>/ bulan</Text></Text>
        <Lbl polos gaya={{ marginTop: 3 }}>Ditagih tiap 30 hari · berhenti kapan saja</Lbl>
      </View>
      <Lbl>Cara bayar</Lbl>
      <Menu>
        <View style={g.pilih}><Radio on /><View style={{ flex: 1 }}><Text style={g.pilihJudul}>Lewat situs web</Text><Lbl polos>Buka analismarket.com di peramban</Lbl></View></View>
        <View style={[g.pilih, g.garis, { opacity: 0.45 }]}><Radio on={false} /><View style={{ flex: 1 }}><Text style={g.pilihJudul}>Pembelian dalam app</Text><Lbl polos>Belum tersedia</Lbl></View></View>
      </Menu>
      <Blok>
        <Lbl>Rincian</Lbl>
        <View style={{ marginTop: 4 }}>
          <BarisPakai kiri="AnalisMarket+ · 1 bulan" kanan="Rp 99.000" pertama />
          <BarisPakai kiri="PPN" kanan="Termasuk" />
          <BarisPakai kiri="Total" kanan="Rp 99.000" tebal />
        </View>
      </Blok>
      <Blok>
        <Lbl>Berlaku sampai</Lbl>
        <Nil besar gaya={{ marginTop: 3 }}>{sampai}</Nil>
        <Mikro>Berhenti sebelum tanggal itu berarti tetap aktif sampai habis, tanpa tagihan berikutnya.</Mikro>
      </Blok>
      {/* Satu-satunya tombol emas terisi di luar kartu AM+ — dan ini halaman AM+.
          MATI: app tidak menautkan ke web, dan pembelian dalam app belum ada. */}
      <Tombol teks="Berlangganan lewat web" jenis="emas" mati />
      <Mikro tengah>Buka analismarket.com di peramban. App ini tidak memasang tautan keluar.</Mikro>
    </Wadah>
  );
}

const g = StyleSheet.create({
  akar: { flex: 1, backgroundColor: W.latar },
  baris: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  rata: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  chips: { flexDirection: 'row', gap: 4 },
  garis: { borderTopWidth: 1, borderTopColor: W.garisSamar },
  judulTengah: { marginTop: 8, fontSize: H.pasar, fontWeight: '600', color: W.teksKuat, textAlign: 'center', letterSpacing: -0.2 },
  ketTengah: { marginTop: 6, fontSize: H.alat, color: W.teksRedup, lineHeight: 15, textAlign: 'center', maxWidth: 250 },
  centangBaris: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  centang: { color: W.plus, fontSize: 9, marginTop: 2 },
  centangTeks: { flex: 1, fontSize: H.alat, color: W.teksRedup, lineHeight: 14 },
  pilih: { flexDirection: 'row', gap: 9, alignItems: 'flex-start', paddingHorizontal: 11, paddingVertical: 9 },
  pilihJudul: { fontSize: H.nilai, fontWeight: '500', color: W.teksKuat },
  ket: { marginTop: 5, fontSize: H.alat, color: W.teksRedup, lineHeight: 15 },
  besar: { fontSize: H.harga, fontWeight: '700', color: W.teksKuat, fontVariant: ['tabular-nums'] },
  dari: { fontSize: H.alat, color: W.teksRedup, fontWeight: '400' },
  kartuEmas: { borderRadius: R.kartu, padding: 13, borderWidth: 1, borderColor: 'rgba(201,169,97,0.38)', backgroundColor: 'rgba(201,169,97,0.10)' },
  handle: { marginTop: 4, fontSize: H.pasar, fontWeight: '600', color: W.teksKuat, fontVariant: ['tabular-nums'] },
  cap: { fontSize: H.label, letterSpacing: 1.4, textTransform: 'uppercase', color: W.plus, fontWeight: '600' },
  harga: { fontSize: 19, fontWeight: '700', color: '#E3CE97', marginTop: 5, letterSpacing: -0.3, fontVariant: ['tabular-nums'] },
});
