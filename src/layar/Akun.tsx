/**
 * LAYAR YANG TERHALANG IDENTITAS — mockup 21 sampai 27.
 *
 * Ketujuhnya menunggu SATU pekerjaan yang sama: identitas lepas dari
 * Telegram. Bentuknya dibangun sekarang supaya yang hilang terlihat persis,
 * tapi isinya jujur: yang butuh data akun dicetak sebagai keadaan belum
 * tersambung, bukan angka karangan. Satu-satunya yang benar-benar bekerja
 * hari ini adalah tombol yang membuka bot — dan itu memang langkah pertama.
 */
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ambilBacaan, ambilPasar, syaratWajib, type Mesin, type Pasar } from '../data/api';
import { volumeRingkas } from '../data/tampil';
import { LambangPasar } from '../komponen/LambangPasar';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSisaBilah } from '../gaya/jarak';
import { Ikon } from '../komponen/Ikon';
import { BarIsi, BarisPakai, Blok, Butir, Chip, Langkah, Lbl, Menu, Mikro, Nil, Radio, Rangka, Saklar, Tombol } from '../komponen/mockup';
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
    <ScrollView style={g.akar} contentContainerStyle={{ flexGrow: 1, paddingTop: tinggiKepala + 9, paddingBottom: sisaBilah, paddingHorizontal: TALANG, gap: 7 }}>
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
        <Langkah no={1} judul={`Buka @${BOT}`} ket="Cari namanya di Telegram — nama lengkapnya ada di bawah." pertama />
        <Langkah no={2} judul="Tekan “Sambungkan web & app”" ket="Bot mengirim satu tautan sekali pakai." />
        <Langkah no={3} judul="Tautannya membuka app ini" ket="Sesi tersimpan 12 jam, lalu diperbarui sendiri." />
      </Blok>
      {/* Blok nama bot LANGSUNG sesudah langkahnya — ia aksinya. Blok "yang
          terbuka" mengisi sisa tinggi di bawahnya, bukan spacer kosong. */}
      <Blok emas gaya={{ alignItems: 'center', paddingVertical: 16 }}>
        <Lbl warna={W.plus}>Nama bot di Telegram</Lbl>
        <Text selectable style={g.handle}>@{BOT}</Text>
        <Mikro tengah>Tekan lama untuk menyalin. Buka Telegram, tempel di pencarian.</Mikro>
        <Mikro tengah>App ini tidak memasang tautan keluar.</Mikro>
      </Blok>
      <Blok gaya={{ flex: 1, justifyContent: 'center' }}>
        <Lbl>Yang terbuka sesudah tersambung</Lbl>
        <View style={{ marginTop: 8, gap: 8 }}>
          {[
            ['Pantauan dan kabar otomatis', 'Dikabari saat syarat setup lolos, tanpa membuka app.'],
            ['Setelan bawaan ikut dari bot', 'Pasar, timeframe, dan mesin yang sama di Telegram, web, dan app.'],
            ['Status AnalisMarket+ terbaca', 'Kredit, kuota, dan sisa hari langganan tampil di Profil.'],
            ['Tiga pantauan pertama gratis', 'AM+ membuka sisanya dan kabar otomatisnya.'],
          ].map(([j, k]) => (
            <View key={j} style={g.centangBaris}>
              <Text style={g.centang}>✓</Text>
              <View style={{ flex: 1 }}>
                <Text style={[g.centangTeks, { color: W.teksKuat, fontWeight: '600' }]}>{j}</Text>
                <Text style={g.centangTeks}>{k}</Text>
              </View>
            </View>
          ))}
        </View>
      </Blok>
      <Mikro>
        Langkah 3 belum bisa diselesaikan app ini: tautan sekali pakai dari bot saat ini membuka
        versi web. Sampai app punya jalur masuknya sendiri, sambungan berhenti di langkah 2.
      </Mikro>
    </Wadah>
  );
}

/* ── 22 · PANTAUAN (keadaan 15: belum ada) ─────────────────────────────── */
export function LayarPantauan({ bukaSambung, bukaBaru, pasar, tf }: {
  bukaSambung: () => void; bukaBaru: () => void; pasar: string; tf: string;
}) {
  /* Yang BISA ditampilkan tanpa akun: lima mesin pasar bawaan, dengan status
     sekarang — persis bentuk baris pantauan, dan tiap baris bisa dijadikan
     pantauan lewat formulirnya. Layar kosong yang cuma bilang "belum ada"
     tidak menjawab "lalu saya pasang apa". */
  const [mesin, setMesin] = useState<Mesin[] | null>(null);
  const [ramai, setRamai] = useState<Pasar[]>([]);
  useEffect(() => {
    void ambilBacaan(pasar, tf).then((b) => { setMesin(b.ok ? b.isi.mesin : []); });
    /* Pasar lain yang ramai — kandidat pantauan berikutnya, dari daftar yang sudah ada di simpanan. */
    void ambilPasar().then((j) => {
      if (!j.ok) return;
      setRamai([...j.isi.pasar].filter((x) => x.simbol !== pasar).sort((a, b) => b.volume24hUsd - a.volume24hUsd).slice(0, 8));
    });
  }, [pasar, tf]);
  return (
    <Wadah>
      <View style={g.chips}><Chip teks="Aktif" on /><Chip teks="Menunggu" /><Chip teks="Selesai" /></View>
      <Blok emas rapat gaya={{ paddingHorizontal: 10 }}>
        <View style={[g.rata, { gap: 8 }]}>
          <View style={{ flex: 1 }}>
            <Text style={g.pilihJudul}>Belum ada pantauan aktif</Text>
            <Lbl polos>Pantauan hidup di akun Telegram-mu. Tiga pertama gratis.</Lbl>
          </View>
          <Chip teks="Sambungkan" emas onPress={bukaSambung} />
        </View>
      </Blok>
      <Blok gaya={{ flex: 1 }}>
        <View style={g.rata}>
          <Lbl>Bisa dipantau sekarang · {pasar} {tf.toLowerCase()}</Lbl>
          <Chip teks="+ Baru" onPress={bukaBaru} />
        </View>
        {mesin === null && [0, 1, 2].map((i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 10 }}>
            <Rangka lebar={22} tinggi={22} gaya={{ borderRadius: 11 }} /><Rangka lebar="55%" tinggi={10} />
          </View>
        ))}
        {mesin?.map((m, i) => {
          const w = syaratWajib(m); const lolos = w.filter((c) => c.lolos).length;
          const setup = m.status.toUpperCase() === 'SETUP';
          return (
            <View key={m.mesin} style={[g.pantau, i > 0 && g.garis]}>
              <LambangPasar simbol={pasar} ukuran={22} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={g.pilihJudul} numberOfLines={1}>{pasar} <Text style={{ color: W.teksRedup, fontWeight: '400' }}>{tf.toLowerCase()}</Text> · {m.mesin}</Text>
                <Lbl polos>Kabari saat syarat wajib lolos semua</Lbl>
              </View>
              <Chip teks={`${String(lolos)}/${String(w.length)}`} mono emas={setup} onPress={bukaBaru} />
            </View>
          );
        })}
        <Mikro>Menekan baris membuka formulir pantauan. Menyimpannya butuh sambungan Telegram.</Mikro>
        {ramai.length > 0 && (
          <>
            <Lbl gaya={{ marginTop: 12 }}>Pasar lain yang ramai hari ini</Lbl>
            {ramai.map((x, i) => (
              <View key={x.simbol} style={[g.pantau, i > 0 && g.garis]}>
                <LambangPasar simbol={x.simbol} ukuran={22} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={g.pilihJudul} numberOfLines={1}>{x.simbol} <Text style={{ color: W.teksRedup, fontWeight: '400' }}>{tf.toLowerCase()}</Text></Text>
                  <Lbl polos>{x.label} · vol {volumeRingkas(x.volume24hUsd)}</Lbl>
                </View>
                <Chip teks="+ pantau" onPress={bukaBaru} />
              </View>
            ))}
          </>
        )}
      </Blok>
    </Wadah>
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
  pantau: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 8 },
  pilihJudul: { fontSize: H.nilai, fontWeight: '500', color: W.teksKuat },
  ket: { marginTop: 5, fontSize: H.alat, color: W.teksRedup, lineHeight: 15 },
  besar: { fontSize: H.harga, fontWeight: '700', color: W.teksKuat, fontVariant: ['tabular-nums'] },
  dari: { fontSize: H.alat, color: W.teksRedup, fontWeight: '400' },
  kartuEmas: { borderRadius: R.kartu, padding: 13, borderWidth: 1, borderColor: 'rgba(201,169,97,0.38)', backgroundColor: 'rgba(201,169,97,0.10)' },
  handle: { marginTop: 6, marginBottom: 6, fontSize: 22, fontWeight: '700', color: W.teksKuat, letterSpacing: -0.4, fontVariant: ['tabular-nums'] },
  cap: { fontSize: H.label, letterSpacing: 1.4, textTransform: 'uppercase', color: W.plus, fontWeight: '600' },
  harga: { fontSize: 19, fontWeight: '700', color: '#E3CE97', marginTop: 5, letterSpacing: -0.3, fontVariant: ['tabular-nums'] },
});
