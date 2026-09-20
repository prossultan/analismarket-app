/**
 * KOTAK MASUK — tab Kabar. Mockup `opendesign/mockups/kotak-masuk`.
 *
 * Satu daftar, empat jenis (pantauan · otomatis · sistem · promo), dikelompok
 * per hari. Ikon yang membedakan; lencana cuma untuk yang butuh. Baris
 * pantauan = satu ketukan ke chart pasar itu. Belum dibaca = titik emas +
 * judul tebal; yang sudah dibaca menipis, tidak menghilang.
 *
 * Isi lama tab ini (bacaan mesin + kalender) dibuang: bacaan ada di Pasar,
 * kalender punya layar sendiri. Tab ini sekarang cuma untuk kabar yang
 * benar-benar dikirim ke orangnya.
 */
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { gayaTema } from '../gaya/tema';
import { ambilKabarMasuk, tandaiKabarDibaca, type JenisKabar, type KabarMasuk } from '../data/saya';
import { setBelumDibaca } from '../data/kotakMasuk';
import { useSesi } from './Akun';
import { useSisaBilah, useTinggiKepala } from '../gaya/jarak';
import { Ikon, type NamaIkon } from '../komponen/Ikon';
import { Tekan } from '../komponen/Tekan';
import { Chip, Kosong, Lbl, PitaBasi, Rangka } from '../komponen/mockup';
import { W, H, R, TALANG, SENTUH } from '../gaya/token';

type Saring = 'semua' | JenisKabar;
const SARING: { k: Saring; t: string }[] = [
  { k: 'semua', t: 'Semua' }, { k: 'pantauan', t: 'Pantauan' }, { k: 'sistem', t: 'Sistem' }, { k: 'promo', t: 'Promo' },
];
const IKON: Record<JenisKabar, NamaIkon> = { pantauan: 'kabar', otomatis: 'plus', sistem: 'gir', promo: 'plus' };
const LENCANA: Partial<Record<JenisKabar, string>> = { otomatis: 'AM+', sistem: 'SISTEM', promo: 'PROMO' };

const ZONA = 'Asia/Jakarta';
function jam(iso: string): string {
  return new Date(iso).toLocaleTimeString('id-ID', { timeZone: ZONA, hour: '2-digit', minute: '2-digit' }).replace(':', '.');
}
function kunciHari(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' });
}
function labelHari(iso: string, sekarang: number): string {
  const k = kunciHari(iso);
  if (k === kunciHari(new Date(sekarang).toISOString())) return 'Hari ini';
  if (k === kunciHari(new Date(sekarang - 86_400_000).toISOString())) return 'Kemarin';
  return new Date(iso).toLocaleDateString('id-ID', { timeZone: ZONA, weekday: 'long', day: 'numeric', month: 'short' });
}

export function LayarKabar({ bukaPasarDi }: { bukaPasarDi: (pair: string, tf: string) => void }) {
  const sesi = useSesi();
  const tinggiKepala = useTinggiKepala();
  const sisaBilah = useSisaBilah();
  const [saring, setSaring] = useState<Saring>('semua');
  const [daftar, setDaftar] = useState<KabarMasuk[] | null>(null);
  const [sebab, setSebab] = useState<string | null>(null);
  const [habis, setHabis] = useState(false);
  const [memuatLagi, setMemuatLagi] = useState(false);

  const muat = useCallback(async () => {
    if (sesi === null) { setDaftar([]); return; }
    const j = await ambilKabarMasuk(null);
    if (!j.ok) { setSebab(j.kalimat); setDaftar((d) => d ?? []); return; }
    setSebab(null); setDaftar(j.isi.kabar); setHabis(j.isi.kabar.length < 40);
    setBelumDibaca(j.isi.belumDibaca);
  }, [sesi]);
  useEffect(() => { void muat(); }, [muat]);

  async function lanjut(): Promise<void> {
    if (memuatLagi || habis || daftar === null || daftar.length === 0) return;
    setMemuatLagi(true);
    const terakhir = daftar[daftar.length - 1]?.id ?? null;
    const j = await ambilKabarMasuk(terakhir);
    if (j.ok) { setDaftar((d) => [...(d ?? []), ...j.isi.kabar]); setHabis(j.isi.kabar.length < 40); } else setSebab(j.kalimat);
    setMemuatLagi(false);
  }
  function diGulir(e: NativeSyntheticEvent<NativeScrollEvent>): void {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 200) void lanjut();
  }

  async function buka(k: KabarMasuk): Promise<void> {
    if (!k.dibaca) {
      /* Optimistis: titiknya hilang sekarang, server menyusul. */
      setDaftar((d) => (d ?? []).map((x) => (x.id === k.id ? { ...x, dibaca: true } : x)));
      const j = await tandaiKabarDibaca(k.id);
      if (j.ok) setBelumDibaca(j.isi.belumDibaca); else setSebab(j.kalimat);
    }
    if (k.data?.pair !== undefined && k.data.pair !== '' && k.data.tf !== undefined) bukaPasarDi(k.data.pair, k.data.tf);
  }
  async function semuaDibaca(): Promise<void> {
    setDaftar((d) => (d ?? []).map((x) => ({ ...x, dibaca: true })));
    const j = await tandaiKabarDibaca('semua');
    if (j.ok) setBelumDibaca(j.isi.belumDibaca); else setSebab(j.kalimat);
  }

  const tampil = (daftar ?? []).filter((k) => saring === 'semua' || k.jenis === saring);
  const adaBelum = (daftar ?? []).some((k) => !k.dibaca);
  const sekarang = Date.now();
  const kelompok: { label: string; isi: KabarMasuk[] }[] = [];
  for (const k of tampil) {
    const label = labelHari(k.dibuat, sekarang);
    const akhir = kelompok[kelompok.length - 1];
    if (akhir !== undefined && akhir.label === label) akhir.isi.push(k); else kelompok.push({ label, isi: [k] });
  }

  return (
    <ScrollView style={g.akar} contentContainerStyle={{ flexGrow: 1, paddingTop: tinggiKepala + 9, paddingBottom: sisaBilah, paddingHorizontal: TALANG, gap: 7 }}
      onScroll={diGulir} scrollEventThrottle={200}>
      {sebab !== null && <PitaBasi kalimat={sebab} />}
      <View style={g.atas}>
        <View style={g.chips}>
          {SARING.map((s) => <Chip key={s.k} teks={s.t} on={saring === s.k} onPress={() => { setSaring(s.k); }} />)}
        </View>
        {adaBelum && <View style={{ alignItems: 'flex-end' }}><Chip teks="Tandai semua dibaca" emas onPress={() => { void semuaDibaca(); }} /></View>}
      </View>

      {daftar === null && (
        <View style={g.kartu}>{[0, 1, 2].map((i) => (
          <View key={i} style={[g.baris, i > 0 && g.garisAtas]}><Rangka lebar={34} tinggi={34} gaya={{ borderRadius: 10 }} /><View style={{ flex: 1, gap: 6 }}><Rangka lebar="65%" tinggi={12} /><Rangka lebar="90%" tinggi={10} /></View></View>
        ))}</View>
      )}

      {daftar !== null && tampil.length === 0 && (
        <Kosong ikon="kabar" judul={saring === 'semua' ? 'Belum ada kabar' : 'Tidak ada di saringan ini'}
          kalimat={saring === 'semua' ? 'Kabar pantauan, ringkasan AM+, dan pesan dari kami akan muncul di sini.' : 'Coba saringan lain.'} />
      )}

      {kelompok.map((kel) => (
        <View key={kel.label}>
          <Lbl>{kel.label}</Lbl>
          <View style={[g.kartu, { marginTop: 6 }]}>
            {kel.isi.map((k, i) => {
              const bisaBuka = k.data?.pair !== undefined && k.data.pair !== '';
              const emas = k.jenis === 'otomatis' || k.jenis === 'promo';
              return (
                <Tekan key={k.id} onPress={() => { void buka(k); }} skala={0.975} gaya={[g.baris, i > 0 && g.garisAtas]}
                  accessibilityLabel={`${k.judul}${k.dibaca ? '' : ', belum dibaca'}`}>
                  <View style={[g.ik, emas && g.ikEmas]}>
                    <Ikon nama={IKON[k.jenis]} warna={emas ? W.plusTeks : k.jenis === 'sistem' ? W.teksRedup : W.teksKuat} ukuran={16} isi={k.jenis === 'otomatis' ? W.plus : undefined} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[g.judul, k.dibaca && g.judulDibaca]} numberOfLines={1}>
                      {k.judul}{LENCANA[k.jenis] !== undefined && <Text style={[g.lencana, emas ? g.lencanaEmas : g.lencanaSistem]}>{'  '}{LENCANA[k.jenis]}</Text>}
                    </Text>
                    <Text style={g.isi} numberOfLines={2}>{k.isi}</Text>
                    <Text style={g.waktu}>{jam(k.dibuat)}</Text>
                  </View>
                  <View style={g.kanan}>
                    {!k.dibaca && <View style={g.titik} />}
                    {bisaBuka && <Text style={g.chevron}>›</Text>}
                  </View>
                </Tekan>
              );
            })}
          </View>
        </View>
      ))}
      {memuatLagi && <Lbl polos>Memuat…</Lbl>}
    </ScrollView>
  );
}

const g = gayaTema((W) => StyleSheet.create({
  akar: { flex: 1, backgroundColor: W.latar },
  atas: { gap: 8 },
  chips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  kartu: { backgroundColor: W.kartu, borderWidth: 1, borderColor: W.garis, borderRadius: R.kartu + 2, overflow: 'hidden' },
  baris: { flexDirection: 'row', gap: 11, padding: 12, alignItems: 'flex-start', minHeight: SENTUH + 14 },
  garisAtas: { borderTopWidth: 1, borderTopColor: W.garisSamar },
  ik: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: W.tinta(0.06) },
  ikEmas: { backgroundColor: W.plusRedup },
  judul: { fontSize: H.pasar, fontWeight: '600', color: W.teksKuat },
  judulDibaca: { fontWeight: '500', color: W.teks },
  lencana: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  lencanaEmas: { color: W.plusTeks },
  lencanaSistem: { color: W.teksSamar },
  isi: { fontSize: H.nilai, color: W.teksRedup, marginTop: 2, lineHeight: 17 },
  waktu: { fontSize: H.label, color: W.teksSamar, marginTop: 5, fontVariant: ['tabular-nums'] },
  kanan: { alignItems: 'flex-end', gap: 6, paddingTop: 2 },
  titik: { width: 8, height: 8, borderRadius: 4, backgroundColor: W.plus },
  chevron: { fontSize: 18, color: W.teksSamar, lineHeight: 18 },
}));
