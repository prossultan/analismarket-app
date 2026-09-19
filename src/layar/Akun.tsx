/**
 * LAYAR AKUN — mockup 21 sampai 27, sekarang dengan DATA SUNGGUHAN.
 *
 * Jalurnya sudah ada di server sejak awal dan tidak butuh satu pun perubahan
 * bot: token sekali pakai dari bot ditukar jadi sesi, sesi membuka 15 rute
 * `/api/saya/*`. Yang dulu ditulis "terhalang identitas" sebenarnya cuma
 * kehilangan sisi app-nya.
 *
 * Yang TETAP jujur: tiap layar punya tiga keadaan — belum tersambung, sedang
 * memuat, dan terisi. Angka karangan tidak pernah menggantikan yang belum
 * diketahui; yang belum ada dicetak "—".
 */
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useHeaderHeight } from '@react-navigation/elements';
import { ambilBacaan, ambilPasar, syaratWajib, type Mesin, type Pasar } from '../data/api';
import {
  ambilKabarOtomatis, ambilKredit, ambilPantauan, ambilRingkas,
  matikanPantauan, setelJamKabar, setelKabarOtomatis, tambahPantauan,
  type DaftarPantauan, type JawabanSaya, type KabarOtomatis, type Kredit, type Ringkas,
} from '../data/saya';
import { bacaSesi, dengarSesi, hapusSesi, sambungkan, sesiSekarang, type Sesi } from '../data/sesi';
import { useMuat, type Hasil } from '../data/muat';
import { volumeRingkas } from '../data/tampil';
/* Harga diturunkan dari satu tempat — lihat `periksa-harga.mjs`. Layar ini
   sempat mengetiknya sendiri di TIGA baris, dan ketiganya salah. */
import { PAKET_PLUS, rupiah } from '../data/amplus';
import { useSisaBilah } from '../gaya/jarak';
import { Ikon } from '../komponen/Ikon';
import { LambangPasar } from '../komponen/LambangPasar';
import {
  BarIsi, BarisPakai, Blok, Butir, Chip, Langkah, Lbl, Menu, Mikro, Nil, PitaBasi, Radio, Rangka, Saklar, Tombol,
} from '../komponen/mockup';
import { W, H, R, SENTUH, TALANG } from '../gaya/token';

/** Nama bot — sama dengan `HANDLE` di renderer kartu. Teks, bukan tautan. */
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

/** Kait sesi — satu sumber, dan layar ikut berubah saat sesi datang atau mati. */
export function useSesi(): Sesi | null {
  const [s, set] = useState<Sesi | null>(() => sesiSekarang());
  useEffect(() => {
    void bacaSesi().then(set);
    return dengarSesi(set);
  }, []);
  return s;
}

/** Blok "belum tersambung" yang sama di tiap layar akun. Satu bentuk, satu kalimat. */
function PerluSesi({ apa, buka }: { apa: string; buka: () => void }) {
  return (
    <Blok emas rapat gaya={{ paddingHorizontal: 10 }}>
      <View style={[g.rata, { gap: 8 }]}>
        <View style={{ flex: 1 }}>
          <Text style={g.pilihJudul}>{apa} ada di akun Telegram-mu</Text>
          <Lbl polos>Sambungkan sekali, dan datanya muncul di sini.</Lbl>
        </View>
        <Chip teks="Sambungkan" emas onPress={buka} />
      </View>
    </Blok>
  );
}

/**
 * Muat satu rute `/api/saya/*` yang butuh sesi.
 *
 * Enam layar akun dulu menulis pola yang sama persis — `if (j.ok) setD(j.isi)`
 * — dan keenamnya membuang `kalimat` yang sudah susah payah dipisahkan
 * `saya.ts`. Akibatnya bukan galat: layarnya terisi "—" di setiap sel sambil
 * tetap berkata "Tersambung", dan tidak ada satu pun cara bagi pemegang HP
 * untuk tahu apakah ia memang belum punya apa-apa atau datanya tidak sampai.
 *
 * 401 BUKAN urusan di sini dan sengaja tidak ditangani ulang: `saya.ts`
 * menghapus sesinya, `umumkan(null)` membalik seluruh app ke "belum
 * tersambung", dan `PerluSesi` muncul sendiri di tiap layar ini.
 */
function useAkun<T>(ambil: () => Promise<JawabanSaya<T>>, sesi: Sesi | null): {
  isi: T | null; sebab: string | null; ulangi: () => void;
} {
  const bungkus = useCallback(async (): Promise<Hasil<T | null>> => {
    if (sesi === null) return { ok: true, isi: null };
    return ambil();
    /* `ambil` sengaja di luar daftar: `useMuat` menyimpannya di ref, dan yang
       menentukan kapan memuat ulang adalah kuncinya. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesi]);
  const { keadaan, ulangi } = useMuat(bungkus, sesi === null ? 'kosong' : 'ada');
  return {
    isi: keadaan.fase === 'ada' ? keadaan.isi : null,
    sebab: keadaan.fase === 'gagal' ? keadaan.kalimat
      : keadaan.fase === 'ada' ? keadaan.basi : null,
    ulangi,
  };
}

const SATU_BULAN = PAKET_PLUS[0] as { kode: string; bulan: number; hargaRp: number };

/* ══ 21 · SAMBUNGKAN TELEGRAM ═══════════════════════════════════════════ */
export function LayarSambung() {
  const sesi = useSesi();
  const [teks, setTeks] = useState('');
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState('');

  const jalankan = useCallback(async (isi: string): Promise<void> => {
    setSibuk(true); setGalat('');
    const h = await sambungkan(isi);
    setSibuk(false);
    if (h.ok) { setTeks(''); return; }
    setGalat(h.kalimat);
  }, []);

  /* Tempel LANGSUNG menyambung: menempel lalu menekan tombol kedua adalah dua
     ketukan untuk satu maksud, dan maksudnya tidak pernah ambigu di sini. */
  const tempel = useCallback((): void => {
    void Clipboard.getStringAsync().then((isi) => {
      setTeks(isi);
      if (isi.trim() !== '') void jalankan(isi);
    });
  }, [jalankan]);

  if (sesi !== null) {
    return (
      <Wadah>
        <Blok gaya={{ alignItems: 'center', paddingVertical: 16 }}>
          <Ikon nama="profil" warna={W.naik} ukuran={28} />
          <Text style={g.judulTengah}>Sudah tersambung</Text>
          <Text style={g.ketTengah}>
            {sesi.akun.nama ?? 'Akun Telegram'} · {sesi.akun.langganan?.aktif === true ? 'AnalisMarket+' : 'Gratis'}
          </Text>
        </Blok>
        <Blok gaya={{ flex: 1 }}>
          <Lbl>Yang terbuka sekarang</Lbl>
          <View style={{ marginTop: 8, gap: 8 }}>
            {[
              ['Pantauan dan kabar otomatis', 'Dikabari saat syarat setup lolos, tanpa membuka app.'],
              ['Setelan bawaan ikut dari bot', 'Pasar, timeframe, dan mesin yang sama di Telegram, web, dan app.'],
              ['Kredit dan status AM+', 'Terbaca di Profil dan halaman Kredit.'],
            ].map(([j, k]) => (
              <View key={j} style={g.centangBaris}>
                <Text style={[g.centang, { color: W.naik }]}>✓</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[g.centangTeks, { color: W.teksKuat, fontWeight: '600' }]}>{j}</Text>
                  <Text style={g.centangTeks}>{k}</Text>
                </View>
              </View>
            ))}
          </View>
        </Blok>
        <Tombol teks="Putuskan sambungan" jenis="kedua" onPress={() => { void hapusSesi(); }} />
        <Mikro tengah>Sesi berlaku 12 jam, lalu perlu disambung ulang lewat bot.</Mikro>
      </Wadah>
    );
  }

  return (
    <Wadah>
      <Blok gaya={{ alignItems: 'center', paddingVertical: 14 }}>
        <Ikon nama="kabar" warna={W.plus} ukuran={28} />
        <Text style={g.judulTengah}>Tiga langkah, sekali saja</Text>
        <Text style={g.ketTengah}>Identitasmu datang dari bot Telegram. Tidak ada formulir, tidak ada kata sandi.</Text>
      </Blok>

      {/* Penomoran SAH di sini: urutannya menentukan. Tanpa langkah 2 tautannya tidak pernah ada. */}
      <Blok rapat gaya={{ paddingHorizontal: 10 }}>
        <Langkah no={1} judul={`Buka @${BOT} di Telegram`} ket="Namanya bisa disalin dari blok di bawah." pertama />
        <Langkah no={2} judul="Tekan “🌐 Buka akses web”" ket="Bot membalas dengan satu tombol tautan." />
        <Langkah no={3} judul="Tekan LAMA tombolnya → Salin tautan" ket="Jangan ditekan biasa: sekali terbuka di peramban, tautannya habis." />
      </Blok>

      <Blok>
        <Lbl>Tempel tautan dari bot</Lbl>
        <View style={g.tempelKotak}>
          <TextInput
            value={teks}
            onChangeText={setTeks}
            placeholder="https://analismarket.com/?masuk=…"
            placeholderTextColor={W.teksSamar}
            style={g.tempelIsi}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!sibuk}
            accessibilityLabel="Tautan dari bot"
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
          <View style={{ flex: 1 }}>
            <Tombol teks={sibuk ? 'Menyambungkan…' : 'Tempel & sambungkan'} mati={sibuk} onPress={tempel} />
          </View>
          {teks.trim() !== '' && !sibuk && (
            <Tombol teks="Sambungkan" jenis="kedua" onPress={() => { void jalankan(teks); }} />
          )}
        </View>
        {galat !== '' && <Text style={g.galat}>{galat}</Text>}
        <Mikro>Tautannya berlaku 10 menit dan sekali pakai. Kalau lewat, minta lagi ke bot.</Mikro>
      </Blok>

      <Blok emas gaya={{ alignItems: 'center', paddingVertical: 14 }}>
        <Lbl warna={W.plus}>Nama bot di Telegram</Lbl>
        <Text selectable style={g.handle}>@{BOT}</Text>
        <Chip teks="Salin nama" emas onPress={() => { void Clipboard.setStringAsync(`@${BOT}`); }} />
      </Blok>

      <View style={{ flex: 1 }} />
      <Mikro>App ini tidak memasang tautan keluar, jadi bot dibuka sendiri dari Telegram.</Mikro>
    </Wadah>
  );
}

/* ══ 22 · PANTAUAN ══════════════════════════════════════════════════════ */
export function LayarPantauan({ bukaSambung, bukaBaru, pasar, tf }: {
  bukaSambung: () => void; bukaBaru: () => void; pasar: string; tf: string;
}) {
  const sesi = useSesi();
  const [mesin, setMesin] = useState<Mesin[] | null>(null);
  const [ramai, setRamai] = useState<Pasar[]>([]);
  const [sibuk, setSibuk] = useState('');

  const { isi: punya, sebab, ulangi: muat } = useAkun(ambilPantauan, sesi);

  const [sebabPasar, setSebabPasar] = useState<string | null>(null);
  useEffect(() => {
    void ambilBacaan(pasar, tf).then((b) => {
      if (!b.ok) { setSebabPasar(b.kalimat); setMesin([]); return; }
      setMesin(b.isi.mesin);
    });
    void ambilPasar().then((j) => {
      if (!j.ok) { setSebabPasar(j.kalimat); return; }
      setSebabPasar(null);
      setRamai([...j.isi.pasar].filter((x) => x.simbol !== pasar)
        .sort((a, b) => b.volume24hUsd - a.volume24hUsd).slice(0, 8));
    });
  }, [pasar, tf]);

  const pasang = (p: string, t: string, kode: string | undefined): void => {
    const kunci = `${p}${t}${kode ?? ''}`;
    setSibuk(kunci);
    void tambahPantauan({ pair: p, tf: t, ...(kode === undefined ? {} : { strategi: kode }) })
      .then(() => { setSibuk(''); muat(); });
  };

  /**
   * SARINGAN DITURUNKAN DARI DATA, BUKAN DARI ANGAN-ANGAN.
   *
   * Baris ini dulu berbunyi "Aktif · Menunggu · Selesai" — tiga chip yang
   * tidak menyaring apa pun DAN menjanjikan dua keadaan yang tidak ada di
   * data: `pantauan[]` cuma punya `aktif: boolean`. Chip yang terlihat bisa
   * ditekan tapi diam membuat orang mengira app-nya rusak; chip yang
   * menjanjikan keadaan yang tidak ada membuatnya mencari sesuatu yang tidak
   * akan pernah ketemu.
   */
  const [saring, setSaring] = useState<'aktif' | 'mati'>('aktif');
  const semua = punya?.pantauan ?? [];
  const aktif = semua.filter((x) => x.aktif);
  const mati = semua.filter((x) => !x.aktif);
  const terlihat = saring === 'aktif' ? aktif : mati;

  return (
    <Wadah>
      {(sebab ?? sebabPasar) !== null && <PitaBasi kalimat={(sebab ?? sebabPasar) ?? ''} />}
      <View style={g.chips}>
        <Chip teks={`Aktif ${String(aktif.length)}`} on={saring === 'aktif'} onPress={() => { setSaring('aktif'); }} />
        <Chip teks={`Dimatikan ${String(mati.length)}`} on={saring === 'mati'} onPress={() => { setSaring('mati'); }} />
      </View>

      {sesi === null
        ? <PerluSesi apa="Pantauan" buka={bukaSambung} />
        : (
          <Blok rapat gaya={{ paddingHorizontal: 10 }}>
            <View style={g.rata}>
              <View><Text style={g.pilihJudul}>{aktif.length} pantauan aktif</Text>
                <Lbl polos>Batas {punya?.maks ?? '—'} · minimum {punya?.minPoin ?? '—'} poin untuk dikabari</Lbl></View>
              <Chip teks="+ Baru" onPress={bukaBaru} />
            </View>
          </Blok>
        )}

      {sesi !== null && terlihat.length > 0 && (
        <Blok>
          <Lbl>{saring === 'aktif' ? 'Sedang dipantau' : 'Sudah dimatikan'}</Lbl>
          {terlihat.map((w, i) => (
            <View key={w.id} style={[g.pantau, i > 0 && g.garis]}>
              <LambangPasar simbol={w.pair} ukuran={22} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={g.pilihJudul} numberOfLines={1}>
                  {w.pair} <Text style={{ color: W.teksRedup, fontWeight: '400' }}>{w.tf.toLowerCase()}</Text>
                  {w.strategiKode !== null && ` · ${w.strategiKode}`}
                </Text>
                <Lbl polos>Kabari saat syarat wajib lolos semua</Lbl>
              </View>
              {w.aktif && <Chip teks="matikan" onPress={() => { void matikanPantauan(w.id).then(muat); }} />}
            </View>
          ))}
        </Blok>
      )}

      {sesi !== null && punya !== null && terlihat.length === 0 && (
        <Blok rapat gaya={{ paddingHorizontal: 10 }}>
          <Lbl polos>{saring === 'aktif' ? 'Belum ada pantauan aktif.' : 'Belum ada pantauan yang dimatikan.'}</Lbl>
        </Blok>
      )}

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
          const sudah = aktif.some((x) => x.pair === pasar && x.tf.toLowerCase() === tf.toLowerCase() && x.strategiKode === m.mesin);
          const kunci = `${pasar}${tf}${m.mesin}`;
          return (
            <View key={m.mesin} style={[g.pantau, i > 0 && g.garis]}>
              <LambangPasar simbol={pasar} ukuran={22} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={g.pilihJudul} numberOfLines={1}>
                  {pasar} <Text style={{ color: W.teksRedup, fontWeight: '400' }}>{tf.toLowerCase()}</Text> · {m.mesin}
                </Text>
                <Lbl polos>{lolos} dari {w.length} syarat wajib lolos</Lbl>
              </View>
              {sesi === null
                ? <Chip teks={`${String(lolos)}/${String(w.length)}`} mono emas={setup} onPress={bukaSambung} />
                : sudah
                  ? <Chip teks="dipantau" on lencana />
                  : <Chip teks={sibuk === kunci ? '…' : '+ pantau'} onPress={() => { pasang(pasar, tf, m.mesin); }} />}
            </View>
          );
        })}

        {ramai.length > 0 && (
          <>
            <Lbl gaya={{ marginTop: 12 }}>Pasar lain yang ramai hari ini</Lbl>
            {ramai.map((x, i) => (
              <View key={x.simbol} style={[g.pantau, i > 0 && g.garis]}>
                <LambangPasar simbol={x.simbol} ukuran={22} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={g.pilihJudul} numberOfLines={1}>
                    {x.simbol} <Text style={{ color: W.teksRedup, fontWeight: '400' }}>{tf.toLowerCase()}</Text>
                  </Text>
                  <Lbl polos>{x.label} · vol {volumeRingkas(x.volume24hUsd)}</Lbl>
                </View>
                <Chip
                  teks={sibuk === `${x.simbol}${tf}` ? '…' : '+ pantau'}
                  onPress={() => { if (sesi === null) bukaSambung(); else pasang(x.simbol, tf, undefined); }}
                />
              </View>
            ))}
          </>
        )}
      </Blok>
    </Wadah>
  );
}

/* ══ 23 · PANTAUAN BARU ═════════════════════════════════════════════════ */
export function LayarPantauanBaru({ pasar, tf, mesin, bukaSambung, selesai }: {
  pasar: string; tf: string; mesin: string; bukaSambung: () => void; selesai: () => void;
}) {
  const sesi = useSesi();
  const [pilihan, setPilihan] = useState(0);
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState('');

  const simpan = (): void => {
    if (sesi === null) { bukaSambung(); return; }
    setSibuk(true); setGalat('');
    void tambahPantauan({ pair: pasar, tf, ...(mesin === '' ? {} : { strategi: mesin }) }).then((j) => {
      setSibuk(false);
      if (j.ok) { selesai(); return; }
      setGalat(j.kalimat);
    });
  };

  return (
    <Wadah>
      <Lbl>Pasar &amp; timeframe</Lbl>
      <Menu>
        <Butir simbol={pasar} nama={pasar} ket="dari layar Pasar" pertama />
        <Butir ikon="kalender" nama="Timeframe" ket={tf.toLowerCase()} ketMono />
        <Butir ikon="analisis" nama="Mesin" ket={mesin === '' ? 'pertama' : mesin} ketMono />
      </Menu>
      <Mikro>Ganti pasar, timeframe, atau mesin di layar Pasar, lalu kembali ke sini.</Mikro>

      <Lbl gaya={{ marginTop: 2 }}>Kabari saya saat</Lbl>
      <Menu>
        {[
          ['Syarat wajib lolos semua', 'Kartunya berubah jadi SETUP'],
          ['Entry tersentuh', 'Harga mencapai level entry'],
          ['TP atau SL tersentuh', 'Posisi berjalan selesai'],
        ].map(([j, k], i) => (
          <View key={j} style={[g.pilih, i > 0 && g.garis]}>
            <Radio on={pilihan === i} />
            <View style={{ flex: 1 }}>
              <Text style={g.pilihJudul} onPress={() => { setPilihan(i); }}>{j}</Text>
              <Lbl polos>{k}</Lbl>
            </View>
          </View>
        ))}
      </Menu>
      {pilihan !== 0 && (
        <Mikro>Bot saat ini mengabari saat syarat lolos. Dua pemicu lain menyusul; pantauan tetap tersimpan.</Mikro>
      )}

      <View style={{ flex: 1 }} />
      {galat !== '' && <Text style={g.galat}>{galat}</Text>}
      <Tombol
        teks={sesi === null ? 'Sambungkan Telegram untuk menyimpan' : sibuk ? 'Menyimpan…' : 'Simpan pantauan'}
        mati={sibuk}
        onPress={sesi === null ? bukaSambung : simpan}
      />
    </Wadah>
  );
}

/* ══ 24 · KABAR OTOMATIS ════════════════════════════════════════════════ */
export function LayarKabarOtomatis({ bukaSambung }: { bukaSambung: () => void }) {
  const sesi = useSesi();
  const { isi: d, sebab, ulangi: muat } = useAkun(ambilKabarOtomatis, sesi);
  const [sibuk, setSibuk] = useState('');

  return (
    <Wadah>
      {sebab !== null && <PitaBasi kalimat={sebab} />}
      {sesi === null && <PerluSesi apa="Kabar otomatis" buka={bukaSambung} />}

      <Blok>
        <View style={g.rata}>
          <View style={{ flex: 1 }}>
            <Text style={g.pilihJudul}>Kabar otomatis</Text>
            <Lbl polos>{d === null ? 'Pantauan berjalan tanpa membuka app' : d.plus ? 'Aktif lewat AnalisMarket+' : 'Butuh AnalisMarket+'}</Lbl>
          </View>
          {/* BUKAN SAKLAR.
              Dulu di sini ada saklar yang tidak tersambung ke apa pun, dan ia
              berbohong dua kali: ia tidak melakukan apa-apa saat ditekan, DAN
              ia menggambarkan status langganan sebagai sesuatu yang bisa
              dinyalakan dari layar ini. Server pun tidak punya "nyalakan
              semua" — yang ada cuma `{ semua: false }`. Jadi statusnya
              dicetak sebagai lencana, dan mematikan semua jadi tindakan yang
              disebut namanya. */}
          {d !== null && d.dipilih.length > 0
            ? <Chip teks="Matikan semua" onPress={() => { void setelKabarOtomatis({ semua: false }).then(muat); }} />
            : <Chip teks={d?.plus === true ? 'AM+ aktif' : 'Butuh AM+'} emas={d?.plus === true} lencana />}
        </View>
      </Blok>

      <Lbl>Jam sunyi</Lbl>
      <Menu>
        <Butir ikon="kalender" nama="Mulai" ket={d?.jam === null || d === null ? '—' : `${String(d.jam.mulai)}.00`} ketMono pertama />
        <Butir ikon="kalender" nama="Selesai" ket={d?.jam === null || d === null ? '—' : `${String(d.jam.selesai)}.00`} ketMono />
      </Menu>
      {d !== null && d.pilihanJam.length > 0 && (
        <View style={[g.chips, { flexWrap: 'wrap' }]}>
          {d.pilihanJam.map((h) => (
            <Chip key={h} teks={`${String(h)}.00`} mono on={d.jam?.mulai === h}
              onPress={() => { void setelJamKabar(h, d.jam?.selesai ?? 6).then(muat); }} />
          ))}
        </View>
      )}
      <Mikro>Di dalam jam sunyi kabar TETAP dicatat, cuma tidak dibunyikan. Yang tertahan dikirim sekaligus saat jam sunyi selesai.</Mikro>

      <Lbl gaya={{ marginTop: 2 }}>Timeframe yang dipantau otomatis</Lbl>
      {d === null ? (
        <Blok><Rangka lebar="60%" tinggi={10} /><Rangka lebar="45%" tinggi={10} gaya={{ marginTop: 8 }} /></Blok>
      ) : (
        <Menu>
          {/* SATU BARIS PER PASANGAN (timeframe, mesin) — bukan per timeframe.
              Yang disimpan server memang pasangan, dan `setelKabarOtomatis`
              menuntut ketiganya. Satu saklar per timeframe memaksa app
              memilihkan mesinnya sendiri, dan memilihkan diam-diam persis
              yang dilarang: orang yang memasang snr bisa berakhir dikabari
              oleh mesin lain tanpa pernah diberi tahu. */}
          {d.tfTersedia.flatMap((t) => t.mesin.map((m) => ({ tf: t.tf, ...m })))
            .map((x, i) => {
              const nyala = d.dipilih.some((y) => y.tf === x.tf && y.mesin === x.kode);
              const kunci = `${x.tf}:${x.kode}`;
              return (
                <Butir key={kunci} ikon="analisis" nama={`${x.tf.toLowerCase()} · ${x.kode}`}
                  ket={x.nama} pertama={i === 0}
                  kanan={(
                    <Saklar on={nyala}
                      /* Tanpa AM+ `ganti` sengaja TIDAK diberikan: `Saklar`
                         men-disable dirinya sendiri, jadi saklarnya tidak
                         bisa ditekan alih-alih ditekan lalu ditolak server. */
                      ganti={d.plus ? () => {
                        if (sibuk !== '') return;
                        setSibuk(kunci);
                        void setelKabarOtomatis({ tf: x.tf, mesin: x.kode, aktif: !nyala })
                          .then(() => { setSibuk(''); muat(); });
                      } : undefined} />
                  )} />
              );
            })}
        </Menu>
      )}

      <View style={{ flex: 1 }} />
      {sesi === null && <Tombol teks="Sambungkan Telegram untuk mengaktifkan" onPress={bukaSambung} />}
    </Wadah>
  );
}

/* ══ 25 · KREDIT & KUOTA ════════════════════════════════════════════════ */
export function LayarKredit({ bukaSambung }: { bukaSambung: () => void }) {
  const sesi = useSesi();
  const { isi: d, sebab } = useAkun(ambilKredit, sesi);

  return (
    <Wadah>
      {sebab !== null && <PitaBasi kalimat={sebab} />}
      {sesi === null && <PerluSesi apa="Kredit dan kuota" buka={bukaSambung} />}

      <Blok>
        <Lbl>Poin tersisa</Lbl>
        <View style={[g.baris, { marginTop: 6, alignItems: 'baseline' }]}>
          <Text style={g.besar}>{d === null ? '—' : String(d.poin)}</Text>
          <Text style={g.dari}>{d === null ? '' : `· ${String(d.poinPerAnalisa)} poin per analisa berkuota`}</Text>
        </View>
        {d !== null && (
          <>
            <View style={{ marginTop: 8 }}><BarIsi porsi={Math.min(1, d.poin / Math.max(1, d.minPoinNotifikasi * 10))} /></View>
            <View style={[g.rata, { marginTop: 5 }]}>
              <Lbl polos>Minimum {d.minPoinNotifikasi} poin supaya pantauan berbunyi</Lbl>
            </View>
          </>
        )}
      </Blok>

      <Blok>
        <Lbl>Yang TIDAK menagih poin</Lbl>
        <Text style={g.ket}>Seluruh pasar Binance. Poin cuma ditagih untuk emas dan forex, yang datanya dibeli per panggilan.</Text>
      </Blok>

      <Blok gaya={{ flex: 1 }}>
        <Lbl>Riwayat 30 terakhir</Lbl>
        {d === null && [0, 1, 2].map((i) => (
          <View key={i} style={{ paddingVertical: 9 }}><Rangka lebar="70%" tinggi={10} /></View>
        ))}
        {d !== null && d.riwayat.length === 0 && (
          <Text style={g.ket}>Belum ada pemakaian poin.</Text>
        )}
        {d?.riwayat.slice(0, 12).map((r, i) => (
          <BarisPakai key={`${r.pada}${String(i)}`} kiri={r.sebab} kanan={`${r.delta > 0 ? '+' : ''}${String(r.delta)}`} pertama={i === 0} />
        ))}
      </Blok>

      {d?.topupDiBot === true && <Mikro>Tambah poin lewat bot Telegram. App ini tidak memproses pembayaran.</Mikro>}
      {sesi === null && <Tombol teks="Sambungkan Telegram untuk melihat poin" onPress={bukaSambung} />}
    </Wadah>
  );
}

/* ══ 26 · CEK BANYAK PASAR ══════════════════════════════════════════════ */
export function LayarCekBanyak({ bukaSambung, tf }: { bukaSambung: () => void; tf: string }) {
  const sesi = useSesi();
  const [pilih, setPilih] = useState<string[]>([]);
  const [daftar, setDaftar] = useState<Pasar[]>([]);

  const [sebabPasar, setSebabPasar] = useState<string | null>(null);
  useEffect(() => {
    void ambilPasar().then((j) => {
      if (!j.ok) { setSebabPasar(j.kalimat); return; }
      setSebabPasar(null);
      const urut = [...j.isi.pasar].sort((a, b) => b.volume24hUsd - a.volume24hUsd);
      setDaftar(urut.slice(0, 12));
      setPilih(urut.slice(0, 4).map((x) => x.simbol));
    });
  }, []);
  const { isi: ringkasCek, sebab } = useAkun(ambilRingkas, sesi);
  const plus: boolean | null = ringkasCek === null ? null : ringkasCek.langganan === 'plus';

  const alih = (s: string): void => {
    setPilih((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
  };

  return (
    <Wadah>
      {(sebab ?? sebabPasar) !== null && <PitaBasi kalimat={(sebab ?? sebabPasar) ?? ''} />}
      {sesi === null && <PerluSesi apa="Cek banyak pasar" buka={bukaSambung} />}
      {sesi !== null && plus === false && (
        <Blok emas rapat gaya={{ paddingHorizontal: 10 }}>
          <Text style={g.pilihJudul}>Cek banyak pasar bagian dari AnalisMarket+</Text>
          <Lbl polos>Akunmu sekarang paket gratis. Langganan dibeli lewat bot.</Lbl>
        </Blok>
      )}

      <Blok>
        <View style={g.rata}>
          <Lbl>Pasar dipilih</Lbl><Nil>{String(pilih.length)}</Nil>
        </View>
        <View style={[g.chips, { flexWrap: 'wrap', marginTop: 6 }]}>
          {daftar.map((x) => (
            <Chip key={x.simbol} teks={x.simbol.replace('USDT', '')} on={pilih.includes(x.simbol)}
              onPress={() => { alih(x.simbol); }} />
          ))}
        </View>
      </Blok>

      <View style={g.baris}>
        <View style={{ flex: 1 }}><Lbl>Timeframe</Lbl><Nil gaya={{ marginTop: 2 }}>{tf.toLowerCase()}</Nil></View>
        <View style={{ flex: 1 }}><Lbl>Mesin</Lbl><Nil gaya={{ marginTop: 2 }}>semua 5</Nil></View>
        <View style={{ flex: 1 }}><Lbl>Poin</Lbl><Nil gaya={{ marginTop: 2 }}>{String(pilih.length)}</Nil></View>
      </View>

      <Blok gaya={{ flex: 1 }}>
        <Lbl>Hasil</Lbl>
        <Text style={g.ket}>
          Menjalankan {pilih.length} pasar sekaligus menagih {pilih.length} poin — sama dengan membukanya
          satu per satu. Yang dihemat waktunya, bukan kuotanya.
        </Text>
      </Blok>

      <Tombol
        teks={sesi === null ? 'Sambungkan Telegram' : plus === false ? 'Butuh AnalisMarket+' : 'Jalankan di bot'}
        mati={plus === false}
        onPress={sesi === null ? bukaSambung : undefined}
      />
      <Mikro tengah>Hasilnya dikirim bot ke Telegram — di situ kartunya bisa dibagikan langsung.</Mikro>
    </Wadah>
  );
}

/* ══ 27 · BERLANGGANAN ══════════════════════════════════════════════════ */
export function LayarBerlangganan() {
  const sesi = useSesi();
  const { isi: r, sebab } = useAkun(ambilRingkas, sesi);

  const aktif = r?.langganan === 'plus';
  const sampai = r !== null && aktif
    ? new Date(Date.now() + r.sisaHariPlus * 86_400_000).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <Wadah>
      {sebab !== null && <PitaBasi kalimat={sebab} />}
      <View style={g.kartuEmas}>
        <Text style={g.cap}>AnalisMarket+</Text>
        <Text style={g.harga}>{rupiah(SATU_BULAN.hargaRp)} <Text style={g.dari}>/ {String(SATU_BULAN.bulan * 30)} hari</Text></Text>
        <Lbl polos gaya={{ marginTop: 3 }}>Ditagih tiap 30 hari · berhenti kapan saja</Lbl>
      </View>

      <Blok>
        <Lbl>Keadaan akunmu</Lbl>
        <View style={[g.rata, { marginTop: 5 }]}>
          <Text style={g.pilihJudul}>{r === null ? '—' : aktif ? 'AnalisMarket+ aktif' : 'Paket gratis'}</Text>
          {r !== null && aktif && <Chip teks={`${String(r.sisaHariPlus)} hari lagi`} emas mono lencana />}
        </View>
        {sampai !== null && <Lbl polos>Berlaku sampai {sampai}</Lbl>}
        {r !== null && !aktif && r.plusBerakhirPada !== null && (
          <Lbl polos>Langgananmu berakhir {new Date(r.plusBerakhirPada * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}.</Lbl>
        )}
      </Blok>

      <Lbl>Cara bayar</Lbl>
      <Menu>
        <View style={g.pilih}><Radio on /><View style={{ flex: 1 }}>
          <Text style={g.pilihJudul}>Lewat bot Telegram</Text><Lbl polos>Satu-satunya jalur yang aktif</Lbl></View></View>
        <View style={[g.pilih, g.garis, { opacity: 0.45 }]}><Radio on={false} /><View style={{ flex: 1 }}>
          <Text style={g.pilihJudul}>Pembelian dalam app</Text><Lbl polos>Belum tersedia</Lbl></View></View>
      </Menu>

      <Blok gaya={{ flex: 1 }}>
        <Lbl>Rincian</Lbl>
        <View style={{ marginTop: 4 }}>
          <BarisPakai kiri={`AnalisMarket+ · ${String(SATU_BULAN.bulan)} bulan`} kanan={rupiah(SATU_BULAN.hargaRp)} pertama />
          <BarisPakai kiri="PPN" kanan="Termasuk" />
          <BarisPakai kiri="Total" kanan={rupiah(SATU_BULAN.hargaRp)} tebal />
        </View>
        <Mikro>Berhenti sebelum tanggal berakhir berarti tetap aktif sampai habis, tanpa tagihan berikutnya.</Mikro>
      </Blok>

      {/* Emas terisi — dan ini memang halaman AM+. Mati: pembayaran di bot. */}
      <Tombol teks="Berlangganan lewat bot Telegram" jenis="emas" mati />
      <Mikro tengah>Kirim /plus ke @{BOT}. App ini tidak memproses pembayaran.</Mikro>
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
  ketTengah: { marginTop: 6, fontSize: H.alat, color: W.teksRedup, lineHeight: 15, textAlign: 'center', maxWidth: 260 },
  centangBaris: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  centang: { color: W.plus, fontSize: 9, marginTop: 2 },
  centangTeks: { flex: 1, fontSize: H.alat, color: W.teksRedup, lineHeight: 14 },
  pilih: { flexDirection: 'row', gap: 9, alignItems: 'flex-start', paddingHorizontal: 11, paddingVertical: 9 },
  pilihJudul: { fontSize: H.nilai, fontWeight: '500', color: W.teksKuat },
  pantau: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 8 },
  ket: { marginTop: 5, fontSize: H.alat, color: W.teksRedup, lineHeight: 15 },
  besar: { fontSize: H.harga, fontWeight: '700', color: W.teksKuat, fontVariant: ['tabular-nums'] },
  dari: { fontSize: H.alat, color: W.teksRedup, fontWeight: '400' },
  kartuEmas: { borderRadius: R.kartu, padding: 13, borderWidth: 1, borderColor: 'rgba(201,169,97,0.38)', backgroundColor: 'rgba(201,169,97,0.10)' },
  cap: { fontSize: H.label, letterSpacing: 1.4, textTransform: 'uppercase', color: W.plus, fontWeight: '600' },
  harga: { fontSize: 19, fontWeight: '700', color: '#E3CE97', marginTop: 5, letterSpacing: -0.3, fontVariant: ['tabular-nums'] },
  handle: { marginTop: 6, marginBottom: 8, fontSize: 22, fontWeight: '700', color: W.teksKuat, letterSpacing: -0.4 },
  tempelKotak: {
    marginTop: 6, minHeight: SENTUH, paddingHorizontal: 10, borderRadius: R.besar,
    borderWidth: 1, borderColor: W.garis, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center',
  },
  tempelIsi: { color: W.teksKuat, fontSize: H.nilai, paddingVertical: 10 },
  galat: { marginTop: 8, fontSize: H.alat, color: W.turun, lineHeight: 15 },
});
