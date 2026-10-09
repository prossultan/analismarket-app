/**
 * AKADEMI — tab sendiri sejak redesain Okt 2026 (keputusan pemilik 9 Okt),
 * menggantikan tab Lainnya. Tiga layar, satu muatan `/api/saya/akademi`
 * (disimpan semenit di akademi.ts — berpindah di antaranya tidak memuat ulang):
 *
 *   Akademi    kartu Lanjutkan + jalur 6 bab
 *   Bab        sepuluh video dengan keadaannya
 *   Pelajaran  pemutar · "Coba di chart" · istilah · berikutnya
 *
 * Yang DIPERTAHANKAN dari halaman Akademi di web, dan alasannya sama:
 *   - Bab yang belum tayang disebut "segera tayang", bukan dikunci — dua
 *     fakta berbeda, dan yang belum jadi lebih jujur disebut.
 *   - Judul bab terkunci tetap terbaca, tanpa buram.
 *   - Kemajuan "di perangkat ini"; tidak ada klaim sinkron akun.
 *   - Akses penuh tidak dijual di app (belum ada jalur beli). Build Play
 *     tidak menyebut harga di mana pun di layar ini.
 */
import { useCallback, useEffect, useState } from 'react';
import { gayaTema } from '../gaya/tema';
import { Image, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSisaBilah, useTinggiKepala } from '../gaya/jarak';
import { useMuat } from '../data/muat';
import {
  ambilAkademi, catatPosisi, catatTerakhir, cariVideo, keadaanVideo, mintaPutar, sesudah, urlSampul, useKemajuan,
  CONTOH_CHART, ISTILAH_VIDEO, type Akademi, type BabAkademi, type HasilPutar, type KeadaanVideo, type Kemajuan, type VideoAkademi,
} from '../data/akademi';
import { Latar } from '../komponen/Latar';
import { Cincin } from '../komponen/Cincin';
import { Ikon } from '../komponen/Ikon';
import { Tekan } from '../komponen/Tekan';
import { PemutarVideo } from '../komponen/PemutarVideo';
import { detikLanjut } from '../data/pemutar';
import { LilinMini } from '../komponen/LilinMini';
import { Blok, Chip, Kosong, Lbl, Menu, Mikro, PitaBasi, Rangka, Tombol } from '../komponen/mockup';
import { W, R, TALANG } from '../gaya/token';

const SANGKALAN = 'Materi edukasi, bukan nasihat investasi. Trading berisiko kehilangan modal.';
const dua = (n: number): string => String(n).padStart(2, '0');
const mss = (detik: number): string => `${String(Math.floor(detik / 60))}:${String(Math.round(detik % 60)).padStart(2, '0')}`;

function aksesTeks(a: Akademi): string {
  if (a.akses.penuh) return 'Akses kamu · Bab 1–6';
  if (a.akses.plus) return 'Akses kamu · Bab 1–3';
  return 'Akses kamu · Bab 1';
}
function lencanaTier(b: BabAkademi): { teks: string; gaya: 'gratis' | 'am' | 'penuh' } {
  return b.tier === 'gratis' ? { teks: 'Gratis', gaya: 'gratis' } : b.tier === 'plus' ? { teks: 'AM+', gaya: 'am' } : { teks: 'Akses penuh', gaya: 'penuh' };
}
/** Video yang paling masuk akal dilanjutkan: yang terakhir diputar (kalau belum selesai), selain itu yang tersedia pertama yang belum selesai. */
function targetLanjut(a: Akademi, k: Kemajuan): { v: VideoAkademi; bab: BabAkademi; lanjut: boolean } | null {
  if (k.terakhir !== null && !k.selesai.includes(k.terakhir.id)) {
    const x = cariVideo(a, k.terakhir.id);
    if (x !== null && x.v.terbuka && x.v.tersedia) return { ...x, lanjut: true };
  }
  for (const b of a.bab) for (const v of b.video) if (v.terbuka && v.tersedia && !k.selesai.includes(v.id)) return { v, bab: b, lanjut: false };
  return null;
}

function Lencana({ teks, gaya }: { teks: string; gaya: 'gratis' | 'am' | 'penuh' }) {
  return <View style={[g.lg, gaya === 'gratis' ? g.lgGratis : gaya === 'am' ? g.lgAm : g.lgPenuh]}><Text style={[g.lgTeks, gaya === 'gratis' ? { color: '#7FE0BC' } : gaya === 'am' ? { color: W.plusTeks } : { color: W.teksRedup }]}>{teks}</Text></View>;
}

/* ══ AKADEMI ═════════════════════════════════════════════════════════════ */
export function LayarAkademi({ bukaBab, bukaPelajaran, bukaIstilah }: {
  bukaBab: (n: number) => void; bukaPelajaran: (id: string) => void; bukaIstilah: () => void;
}) {
  const { top } = useSafeAreaInsets();
  const sisaBilah = useSisaBilah();
  const muat = useCallback((segarkan: boolean) => ambilAkademi(segarkan), []);
  const { keadaan, segarkan, menyegarkan, ulangi } = useMuat(muat, 'akademi');
  const k = useKemajuan();
  const a = keadaan.fase === 'ada' ? keadaan.isi : null;
  const basi = keadaan.fase === 'ada' ? keadaan.basi : null;
  const lanjut = a === null ? null : targetLanjut(a, k);
  const posisi = lanjut === null ? 0 : k.posisi[lanjut.v.id] ?? 0;
  const durasi = lanjut?.v.menit === null || lanjut === null ? 0 : (lanjut.v.menit ?? 0) * 60;

  return (
    <Latar>
      <ScrollView contentContainerStyle={{ paddingTop: top + 14, paddingBottom: sisaBilah + 8, paddingHorizontal: TALANG, gap: 12 }}
        refreshControl={<RefreshControl refreshing={menyegarkan} tintColor={W.teksRedup} onRefresh={segarkan} />}>
        <View style={g.kepala}>
          <View style={{ flex: 1 }}>
            <Text style={g.alis}>AKADEMI ANALISMARKET</Text>
            <Text style={g.judulBesar}>Belajar dari <Text style={{ color: W.plusTeks }}>nol.</Text></Text>
            <Text style={g.meta}>{a === null ? 'Jalur belajar analisa teknikal' : `${String(a.bab.length)} bab · ${String(a.jumlah.video)} pelajaran · ${String(a.jumlah.tersedia)} sudah tayang`}</Text>
          </View>
          <Tekan onPress={bukaIstilah} accessibilityLabel="Istilah" gaya={g.bulat}><Ikon nama="buku" warna={W.teksKuat} ukuran={20} /></Tekan>
        </View>

        {basi !== null && <PitaBasi kalimat={basi} />}

        {keadaan.fase === 'gagal' && (
          <Kosong ikon="akademi" judul="Akademi belum bisa dimuat" kalimat={keadaan.kalimat}
            aksi={keadaan.jenis === 'jaringan' || keadaan.jenis === 'lain' ? ulangi : undefined} />
        )}

        {keadaan.fase === 'memuat' && (
          <>
            <View style={[g.kartuLanjut, { height: 280, padding: 16, justifyContent: 'flex-end', gap: 8 }]}><Rangka lebar="40%" tinggi={10} /><Rangka lebar="75%" tinggi={16} /></View>
            {[0, 1, 2].map((i) => <View key={i} style={[g.bab, { height: 64 }]}><Rangka lebar={38} tinggi={38} gaya={{ borderRadius: 19 }} /><Rangka lebar="55%" tinggi={12} /></View>)}
          </>
        )}

        {a !== null && lanjut !== null && (
          <Tekan onPress={() => { bukaPelajaran(lanjut.v.id); }} skala={0.97} accessibilityLabel={`Putar ${lanjut.v.judul}`} gaya={g.kartuLanjut}>
            <View style={g.sampul}>
              {urlSampul(lanjut.v.sampul?.besar) !== null && <Image source={{ uri: urlSampul(lanjut.v.sampul?.besar) ?? '' }} style={StyleSheet.absoluteFill} resizeMode="cover" />}
              <View style={g.sampulGelap} />
              {posisi > 0 && durasi > 0 && <Text style={g.sisa}>sisa {mss(Math.max(0, durasi - posisi))}</Text>}
              <View style={g.putarBesar}><Ikon nama="putar" warna="#FFFFFF" isi="#FFFFFF" ukuran={22} /></View>
              {posisi > 0 && durasi > 0 && <View style={g.jejak}><View style={[g.jejakIsi, { width: `${String(Math.min(100, (posisi / durasi) * 100))}%` as `${number}%` }]} /></View>}
            </View>
            <View style={g.lanjutKet}>
              <Text style={g.alisKecil}>{lanjut.lanjut ? 'LANJUTKAN' : 'MULAI'} · VIDEO {dua(lanjut.v.no)} DARI {String(a.jumlah.video)}</Text>
              <Text style={g.lanjutJudul} numberOfLines={2}>{lanjut.v.judul}</Text>
              <Text style={g.lanjutBab}>Bab {lanjut.bab.n} · {lanjut.bab.nama}</Text>
            </View>
          </Tekan>
        )}

        {a !== null && (
          <>
            <View style={g.seksi}>
              <Text style={g.seksiJudul}>Jalur belajar</Text>
              <View style={g.akses}><Text style={g.aksesTeks}>{aksesTeks(a)}</Text></View>
            </View>
            <View style={g.jalur}>
              <View style={g.jalurGaris} />
              {a.bab.map((b) => {
                const tayang = b.video.filter((v) => v.tersedia).length;
                const selesai = b.video.filter((v) => k.selesai.includes(v.id)).length;
                const lg = lencanaTier(b);
                const ket = !b.terbuka
                  ? `${String(b.video.length)} video · terkunci`
                  : selesai > 0 ? `${String(selesai)} dari ${String(b.video.length)} selesai · ${String(tayang)} tayang`
                    : tayang > 0 ? `Terbuka · ${String(tayang)} tayang` : 'Terbuka · segera tayang';
                return (
                  <Tekan key={b.id} onPress={() => { bukaBab(b.n); }} skala={0.97} accessibilityLabel={`Bab ${String(b.n)}: ${b.nama}`}
                    gaya={[g.bab, !b.terbuka && { opacity: 0.84 }]}>
                    {!b.terbuka
                      ? <View style={g.simpul}><Ikon nama="gembok" warna={W.teksSamar} ukuran={16} /></View>
                      : selesai > 0
                        ? <View style={g.simpulCincin}><Cincin persen={(selesai / b.video.length) * 100} ukuran={38}><Text style={[g.simpulTeks, { color: W.plusTeks }]}>{b.n}</Text></Cincin></View>
                        : <View style={g.simpul}><Text style={g.simpulTeks}>{b.n}</Text></View>}
                    <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                      <Text style={[g.babJudul, !b.terbuka && { color: W.teksRedup }]} numberOfLines={1}>{b.nama}</Text>
                      <View style={g.babKet}><Lencana teks={lg.teks} gaya={lg.gaya} /><Text style={g.babKetTeks} numberOfLines={1}>{ket}</Text></View>
                      {selesai > 0 && b.terbuka && <Segmen bab={b} k={k} />}
                    </View>
                    <Text style={g.panah}>›</Text>
                  </Tekan>
                );
              })}
            </View>
            <Mikro>{SANGKALAN} Kemajuan tersimpan di perangkat ini.</Mikro>
          </>
        )}
      </ScrollView>
    </Latar>
  );
}

function Segmen({ bab, k }: { bab: BabAkademi; k: Kemajuan }) {
  return (
    <View style={g.segmen}>
      {bab.video.map((v) => {
        const kv = keadaanVideo(v, k);
        return <View key={v.id} style={[g.seg, kv === 'selesai' && g.segSelesai, kv === 'sedang' && g.segSedang, kv === 'segera' && g.segSegera]} />;
      })}
    </View>
  );
}

/* ══ BAB ═════════════════════════════════════════════════════════════════ */
export function LayarBab({ n, bukaPelajaran }: { n: number; bukaPelajaran: (id: string) => void }) {
  const tinggiKepala = useTinggiKepala();
  const sisaBilah = useSisaBilah();
  const muat = useCallback((segarkan: boolean) => ambilAkademi(segarkan), []);
  const { keadaan, ulangi } = useMuat(muat, 'akademi');
  const k = useKemajuan();
  const a = keadaan.fase === 'ada' ? keadaan.isi : null;
  const basi = keadaan.fase === 'ada' ? keadaan.basi : null;
  const b = a?.bab.find((x) => x.n === n) ?? null;

  return (
    <Latar kuat="redup">
      <ScrollView contentContainerStyle={{ paddingTop: tinggiKepala + 10, paddingBottom: sisaBilah + 8, paddingHorizontal: TALANG, gap: 12 }}>
        {basi !== null && <PitaBasi kalimat={basi} />}
        {keadaan.fase === 'gagal' && <Kosong ikon="akademi" judul="Bab ini belum bisa dimuat" kalimat={keadaan.kalimat} aksi={keadaan.jenis === 'jaringan' ? ulangi : undefined} />}
        {keadaan.fase === 'memuat' && [0, 1, 2, 3].map((i) => <View key={i} style={[g.vid, { height: 64 }]}><Rangka lebar={84} tinggi={47} /><Rangka lebar="50%" tinggi={12} /></View>)}
        {b !== null && (() => {
          const tayang = b.video.filter((v) => v.tersedia).length;
          const selesai = b.video.filter((v) => k.selesai.includes(v.id)).length;
          const lg = lencanaTier(b);
          return (
            <>
              <Blok emas={b.tier !== 'gratis'} gaya={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <Cincin persen={(selesai / b.video.length) * 100} ukuran={56} tebal={4}>
                  <Text style={[g.simpulTeks, { color: W.plusTeks, fontSize: 14 }]}>{String(Math.round((selesai / b.video.length) * 100))}%</Text>
                </Cincin>
                <View style={{ flex: 1, gap: 4 }}>
                  <Lencana teks={lg.teks} gaya={lg.gaya} />
                  <Text style={g.babBesar}>{b.nama}</Text>
                  <Text style={g.babRingkas}>{b.ringkas}</Text>
                </View>
              </Blok>
              <Lbl>{String(b.video.length)} video · {String(tayang)} tayang · {String(selesai)} selesai</Lbl>
              <Menu>
                {b.video.map((v, i) => <BarisVideo key={v.id} v={v} kv={keadaanVideo(v, k)} posisi={k.posisi[v.id] ?? 0} pertama={i === 0} onPress={() => { bukaPelajaran(v.id); }} />)}
              </Menu>
              {!b.terbuka && <Mikro>{b.tier === 'plus' ? 'Bab ini terbuka dengan AnalisMarket+ atau Akses penuh.' : 'Bab ini terbuka dengan Akses penuh — belum bisa dibeli di app.'}</Mikro>}
              <Mikro>{SANGKALAN}</Mikro>
            </>
          );
        })()}
      </ScrollView>
    </Latar>
  );
}

function BarisVideo({ v, kv, posisi, pertama, onPress }: { v: VideoAkademi; kv: KeadaanVideo; posisi: number; pertama: boolean; onPress: () => void }) {
  const durasi = (v.menit ?? 0) * 60;
  const ket = kv === 'selesai' ? 'Selesai'
    : kv === 'sedang' ? (durasi > 0 && posisi > 0 ? `Sedang ditonton · sisa ${mss(Math.max(0, durasi - posisi))}` : 'Sedang ditonton')
      : kv === 'segera' ? 'Segera'
        : kv === 'terkunci' ? 'Terkunci'
          : `Tersedia · ${v.menit === null ? '—' : String(Math.round(v.menit))} mnt`;
  const sampul = urlSampul(v.sampul?.kecil);
  return (
    <Tekan onPress={onPress} skala={0.98} accessibilityLabel={`Video ${dua(v.no)}: ${v.judul}`} gaya={[g.vid, !pertama && g.garisAtas]}>
      <View style={g.vidThumb}>
        {sampul !== null && <Image source={{ uri: sampul }} style={StyleSheet.absoluteFill} resizeMode="cover" />}
        {kv === 'selesai' && <View style={[g.vidLapis, { backgroundColor: 'rgba(16,185,129,0.45)' }]}><Ikon nama="centang" warna="#fff" ukuran={16} /></View>}
        {(kv === 'segera' || kv === 'terkunci') && <View style={g.vidLapis}><Ikon nama={kv === 'segera' ? 'jam' : 'gembok'} warna="#fff" ukuran={15} /></View>}
        {kv === 'sedang' && durasi > 0 && <View style={[g.vidBar, { width: `${String(Math.min(100, (posisi / durasi) * 100))}%` as `${number}%` }]} />}
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text style={[g.vidJudul, (kv === 'segera' || kv === 'terkunci') && { color: W.teksRedup }]} numberOfLines={2}>{dua(v.no)} · {v.judul}</Text>
        <Text style={[g.vidKet, kv === 'selesai' && { color: W.naik }, kv === 'sedang' && { color: W.plusTeks }]}>{ket}</Text>
      </View>
    </Tekan>
  );
}

/* ══ PELAJARAN ═══════════════════════════════════════════════════════════ */
export function LayarPelajaran({ id, gantiJudul, bukaPelajaran, bukaIstilah, bukaPlus, cobaDiChart }: {
  id: string; gantiJudul: (judul: string) => void; bukaPelajaran: (id: string) => void; bukaIstilah: () => void;
  bukaPlus: () => void; cobaDiChart: (pasar: string, tf: string, mesin?: string) => void;
}) {
  const tinggiKepala = useTinggiKepala();
  const sisaBilah = useSisaBilah();
  const muat = useCallback((segarkan: boolean) => ambilAkademi(segarkan), []);
  const { keadaan, ulangi } = useMuat(muat, 'akademi');
  const k = useKemajuan();
  /* Jawaban /putar DITANDAI id videonya: pindah pelajaran (Berikutnya) atau
     jawaban yang tiba sesudah orangnya pindah tidak pernah memutar video
     lain di bawah judul yang baru. */
  const [jawab, setJawab] = useState<{ id: string; h: HasilPutar } | null>(null);
  /* Pindah pelajaran MEMBUANG jawabannya, bukan cuma menyembunyikannya: URL
     Bunny bertanda tangan berumur 2 jam, dan kembali ke pelajaran yang sama
     (A → B → A) tidak boleh memasang URL lama. Pemutar baru = /putar baru. */
  const [idJawab, setIdJawab] = useState(id);
  if (idJawab !== id) { setIdJawab(id); setJawab(null); }
  const putar = jawab?.id === id ? jawab.h : null;
  const [sibuk, setSibuk] = useState(false);
  const a = keadaan.fase === 'ada' ? keadaan.isi : null;
  const basi = keadaan.fase === 'ada' ? keadaan.basi : null;
  const x = a === null ? null : cariVideo(a, id);
  const lanjut = a === null ? null : sesudah(a, id);

  useEffect(() => {
    if (a === null || x === null) return;
    gantiJudul(`Bab ${String(x.bab.n)} · ${dua(x.v.no)}/${String(a.jumlah.video)}`);
  }, [a, x, gantiJudul]);
  const mulaiPutar = (): void => {
    if (x === null || sibuk) return;
    catatTerakhir(x.v, x.bab.n);
    setSibuk(true);
    const vid = x.v.id;
    void mintaPutar(vid).then((h) => { setSibuk(false); setJawab({ id: vid, h }); });
  };

  const contoh = CONTOH_CHART[id];
  const istilah = ISTILAH_VIDEO[id] ?? [];

  return (
    <Latar kuat="redup">
      <ScrollView contentContainerStyle={{ paddingTop: tinggiKepala + 8, paddingBottom: sisaBilah + 8, paddingHorizontal: TALANG, gap: 12 }}>
        {basi !== null && <PitaBasi kalimat={basi} />}
        {keadaan.fase === 'gagal' && <Kosong ikon="akademi" judul="Pelajaran belum bisa dimuat" kalimat={keadaan.kalimat} aksi={keadaan.jenis === 'jaringan' ? ulangi : undefined} />}
        {keadaan.fase === 'memuat' && <View style={[g.pemutar, { justifyContent: 'center', alignItems: 'center' }]}><Rangka lebar="40%" tinggi={12} /></View>}
        {a !== null && x === null && <Kosong ikon="akademi" judul="Video tidak ditemukan" kalimat="Video ini tidak ada di kurikulum yang terbaru." />}

        {x !== null && (
          <>
            <View style={g.pemutar}>
              {putar?.keadaan === 'ada' ? (
                <PemutarVideo key={`${x.v.id}:${putar.url}`} url={putar.url} jenis={putar.jenis} judul={x.v.judul}
                  mulai={detikLanjut(k.posisi[x.v.id], k.selesai.includes(x.v.id))}
                  onWaktu={(t, d) => { catatPosisi(x.v.id, t, d); }}
                  onGalat={() => { setJawab({ id: x.v.id, h: { keadaan: 'galat', kalimat: 'Video terputus. Ketuk putar lagi untuk melanjutkan dari detik yang sama.' } }); }} />
              ) : (
                <>
                  {urlSampul(x.v.sampul?.besar) !== null && <Image source={{ uri: urlSampul(x.v.sampul?.besar) ?? '' }} style={StyleSheet.absoluteFill} resizeMode="cover" />}
                  <View style={g.sampulGelap} />
                  {!x.v.terbuka || putar?.keadaan === 'terkunci' ? (
                    <PanelKunci tier={putar?.keadaan === 'terkunci' ? putar.perlu : x.bab.tier === 'plus' ? 'plus' : 'penuh'} bab={x.bab.n} bukaPlus={bukaPlus} />
                  ) : !x.v.tersedia || putar?.keadaan === 'segera' ? (
                    <View style={g.panel}><Ikon nama="jam" warna={W.plus} ukuran={24} /><Text style={g.panelJudul}>Video ini sedang diproduksi</Text><Text style={g.panelKet}>Judulnya sudah ada di kurikulum; videonya menyusul.</Text></View>
                  ) : (
                    <Tekan onPress={mulaiPutar} accessibilityLabel="Putar video" gaya={g.putarBesar}>
                      <Ikon nama={sibuk ? 'jam' : 'putar'} warna="#FFFFFF" isi={sibuk ? undefined : '#FFFFFF'} ukuran={24} />
                    </Tekan>
                  )}
                  {(putar?.keadaan === 'galat' || putar?.keadaan === 'tidak-ada') && (
                    <Text style={g.galatPutar}>{putar.keadaan === 'galat' ? putar.kalimat : 'Video ini tidak ada lagi di kurikulum.'}</Text>
                  )}
                </>
              )}
            </View>

            <View style={{ gap: 6 }}>
              <Text style={g.alisKecil}>VIDEO {dua(x.v.no)} DARI {String(a?.jumlah.video ?? 0)} · BAB {x.bab.n}</Text>
              <Text style={g.pelajaranJudul}>{x.v.judul}</Text>
              {x.v.ringkas !== '' && <Text style={g.pelajaranRingkas}>{x.v.ringkas}</Text>}
            </View>

            {contoh !== undefined && (
              <View style={g.coba}>
                <View style={g.cobaKepala}>
                  <View style={g.ikonKotak}><Ikon nama="pasar" warna={W.plus} ukuran={18} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={g.cobaJudul}>Coba di chart</Text>
                    <Text style={g.cobaKet}>{contoh.bedah === true ? `Lilin terakhir ${contoh.pasar}, dibedah` : `${contoh.pasar} ${contoh.tf}${contoh.mesin !== undefined ? ` · mesin ${contoh.mesin}` : ''}, harga sekarang`}</Text>
                  </View>
                  <Chip teks={contoh.tf} mono lencana />
                </View>
                <LilinMini pasar={contoh.pasar} tf={contoh.tf} bedah={contoh.bedah === true} />
                <Tombol teks={`Buka ${contoh.pasar} ${contoh.tf} di Pasar`} onPress={() => { cobaDiChart(contoh.pasar, contoh.tf, contoh.mesin); }} />
              </View>
            )}

            {istilah.length > 0 && (
              <View style={{ gap: 8 }}>
                <Lbl>Istilah di pelajaran ini</Lbl>
                <View style={g.chips}>{istilah.map((t) => <Chip key={t} teks={t} onPress={bukaIstilah} />)}</View>
              </View>
            )}

            {lanjut !== null && (
              <Tekan onPress={() => { bukaPelajaran(lanjut.v.id); }} skala={0.98} accessibilityLabel={`Berikutnya: ${lanjut.v.judul}`} gaya={g.berikut}>
                <View style={g.vidThumb}>
                  {urlSampul(lanjut.v.sampul?.kecil) !== null && <Image source={{ uri: urlSampul(lanjut.v.sampul?.kecil) ?? '' }} style={StyleSheet.absoluteFill} resizeMode="cover" />}
                  {!lanjut.v.terbuka && <View style={g.vidLapis}><Ikon nama="gembok" warna="#fff" ukuran={15} /></View>}
                </View>
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <Text style={g.alisKecil}>BERIKUTNYA · {dua(lanjut.v.no)}{lanjut.bab.n !== x.bab.n ? ` · BAB ${String(lanjut.bab.n)}` : ''}</Text>
                  <Text style={g.vidJudul} numberOfLines={1}>{lanjut.v.judul}</Text>
                  <Text style={g.vidKet}>{!lanjut.v.terbuka ? 'Terkunci' : !lanjut.v.tersedia ? 'Segera' : `${lanjut.v.menit === null ? '—' : String(Math.round(lanjut.v.menit))} mnt`}</Text>
                </View>
                <Text style={g.panah}>›</Text>
              </Tekan>
            )}
            <Mikro>{SANGKALAN}</Mikro>
          </>
        )}
      </ScrollView>
    </Latar>
  );
}

function PanelKunci({ tier, bab, bukaPlus }: { tier: 'plus' | 'penuh'; bab: number; bukaPlus: () => void }) {
  return (
    <View style={g.panel}>
      <Ikon nama="gembok" warna={W.plus} ukuran={24} />
      <Text style={g.panelJudul}>Video ini bagian Bab {bab}</Text>
      <Text style={g.panelKet}>{tier === 'plus' ? 'Terbuka dengan AnalisMarket+ atau Akses penuh.' : 'Terbuka dengan Akses penuh — belum bisa dibeli di app.'}</Text>
      {tier === 'plus' && <View style={{ marginTop: 8 }}><Chip teks="Lihat AnalisMarket+" emas onPress={bukaPlus} /></View>}
    </View>
  );
}

const g = gayaTema((W) => StyleSheet.create({
  kepala: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 2 },
  alis: { fontSize: 10.5, letterSpacing: 2, color: W.plusTeks, fontWeight: '600' },
  alisKecil: { fontSize: 10, letterSpacing: 1.6, color: W.plusTeks, fontWeight: '600' },
  judulBesar: { fontSize: 30, fontWeight: '600', color: W.teksKuat, letterSpacing: -0.8, marginTop: 6 },
  meta: { fontSize: 12.5, color: W.teksRedup, marginTop: 6 },
  bulat: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: W.kacaIsi, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: W.kacaTepi, borderTopColor: W.kacaKilau },

  kartuLanjut: { borderRadius: 24, overflow: 'hidden', backgroundColor: W.kartu, borderWidth: 1, borderColor: W.amberTepi, borderTopColor: 'rgba(240,191,107,0.65)' },
  sampul: { height: 200, backgroundColor: '#000' },
  sampulGelap: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(8,7,6,0.28)' },
  sisa: { position: 'absolute', right: 12, top: 12, fontSize: 11, fontWeight: '700', color: '#fff', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
  putarBesar: { position: 'absolute', right: 16, bottom: 24, width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(20,16,11,0.55)', borderWidth: 1, borderColor: 'rgba(255,236,206,0.32)' },
  jejak: { position: 'absolute', left: 12, right: 12, bottom: 12, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.22)', overflow: 'hidden' },
  jejakIsi: { height: 4, borderRadius: 2, backgroundColor: W.plus },
  lanjutKet: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, gap: 4 },
  lanjutJudul: { fontSize: 17, fontWeight: '600', color: W.teksKuat, letterSpacing: -0.3 },
  lanjutBab: { fontSize: 12, color: W.teksSamar },

  seksi: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  seksiJudul: { fontSize: 15, fontWeight: '600', color: W.teksKuat },
  akses: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: W.amberTepi },
  aksesTeks: { fontSize: 11, fontWeight: '600', color: W.plusTeks },

  jalur: { gap: 8 },
  jalurGaris: { position: 'absolute', left: 33, top: 26, bottom: 26, width: 1.5, backgroundColor: 'rgba(229,173,81,0.30)' },
  bab: {
    flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, paddingVertical: 10, paddingRight: 12, paddingLeft: 14, minHeight: 64,
    backgroundColor: W.kacaIsi, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: W.kacaTepi, borderTopColor: W.kacaKilau,
  },
  simpul: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: W.latar900, borderWidth: 1.5, borderColor: 'rgba(229,173,81,0.35)' },
  simpulCincin: { width: 38, height: 38, borderRadius: 19, backgroundColor: W.latar900 },
  simpulTeks: { fontSize: 14, fontWeight: '700', color: W.teksRedup },
  babJudul: { fontSize: 14, fontWeight: '600', color: W.teksKuat, letterSpacing: -0.1 },
  babKet: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  babKetTeks: { fontSize: 11.5, color: W.teksSamar, flexShrink: 1 },
  panah: { fontSize: 20, color: W.teksSamar, marginTop: -2 },
  lg: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, alignSelf: 'flex-start' },
  lgGratis: { backgroundColor: 'rgba(16,185,129,0.12)' },
  lgAm: { backgroundColor: W.amberLatar },
  lgPenuh: { backgroundColor: W.tinta(0.08) },
  lgTeks: { fontSize: 9.5, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  segmen: { flexDirection: 'row', gap: 3, marginTop: 3 },
  seg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: W.tinta(0.18) },
  segSelesai: { backgroundColor: W.plus },
  segSedang: { backgroundColor: 'rgba(229,173,81,0.55)' },
  segSegera: { backgroundColor: 'transparent', borderWidth: 1, borderColor: W.tinta(0.16) },

  babBesar: { fontSize: 16, fontWeight: '600', color: W.teksKuat },
  babRingkas: { fontSize: 12.5, color: W.teksRedup, lineHeight: 18 },
  vid: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 8, paddingLeft: 8, paddingRight: 12, minHeight: 64 },
  garisAtas: { borderTopWidth: StyleSheet.hairlineWidth * 2, borderTopColor: W.garisSamar },
  vidThumb: { width: 84, height: 47, borderRadius: 9, overflow: 'hidden', backgroundColor: '#000', borderWidth: StyleSheet.hairlineWidth * 2, borderColor: W.tinta(0.08) },
  vidLapis: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(8,7,6,0.55)' },
  vidBar: { position: 'absolute', left: 0, bottom: 0, height: 3, backgroundColor: W.plus },
  vidJudul: { fontSize: 12.5, fontWeight: '600', color: W.teksKuat, lineHeight: 17 },
  vidKet: { fontSize: 11, color: W.teksSamar },

  pemutar: { height: 206, borderRadius: 20, overflow: 'hidden', backgroundColor: '#000', borderWidth: StyleSheet.hairlineWidth * 2, borderColor: W.tinta(0.12) },
  panel: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 6, backgroundColor: 'rgba(8,7,6,0.6)' },
  panelJudul: { fontSize: 15, fontWeight: '600', color: '#F4F1EB', textAlign: 'center' },
  panelKet: { fontSize: 12.5, color: '#BDB5A9', textAlign: 'center', lineHeight: 18 },
  galatPutar: { position: 'absolute', left: 12, right: 12, bottom: 10, fontSize: 12, color: '#F3E2C0', textAlign: 'center' },
  pelajaranJudul: { fontSize: 22, fontWeight: '600', color: W.teksKuat, letterSpacing: -0.5, lineHeight: 27 },
  pelajaranRingkas: { fontSize: 13, color: W.teksRedup, lineHeight: 20 },

  coba: {
    borderRadius: R.kartu, padding: 14, gap: 10,
    backgroundColor: W.amberLatar, borderWidth: 1, borderColor: W.amberTepi, borderTopColor: 'rgba(240,191,107,0.62)',
  },
  cobaKepala: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ikonKotak: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: W.amberLatar, borderWidth: 1, borderColor: 'rgba(229,173,81,0.25)' },
  cobaJudul: { fontSize: 14, fontWeight: '600', color: W.teksKuat },
  cobaKet: { fontSize: 11.5, color: W.teksSamar, marginTop: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  berikut: {
    flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 18, padding: 9, paddingRight: 12,
    backgroundColor: W.kacaIsi, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: W.kacaTepi, borderTopColor: W.kacaKilau,
  },
}));
