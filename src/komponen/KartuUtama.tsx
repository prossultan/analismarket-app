/**
 * KARTU UTAMA HOME — "terakhir dibuka": pasar, timeframe, dan mesin dari
 * setelan, dengan bacaan ASLI dari `/api/bacaan`. Satu ketukan ke chart-nya,
 * satu ke lembar bacaannya.
 *
 * Bacaannya lewat antrean yang sama dengan tab Pasar (simpanan 20 detik):
 * Home yang dibuka sesudah tab Pasar tidak menagih permintaan kedua, dan tab
 * Pasar yang dibuka sesudah Home juga tidak.
 *
 * Gagal = kalimat sebabnya di kartu, bukan rangka yang berkedip selamanya.
 */
import { memo, useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gayaTema } from '../gaya/tema';
import { ambilBacaan, ambilPasar, syaratWajib, type Mesin } from '../data/api';
import { useMuat, type Hasil } from '../data/muat';
import { angka, biayaPersen } from '../data/tampil';
import { LambangPasar } from './LambangPasar';
import { Sparkline } from './Sparkline';
import { Rangka, Tombol } from './mockup';
import { W, R, ANGKA } from '../gaya/token';
import type { Bacaan } from '../data/api';

type Props = { pasar: string; tf: string; mesin: string; bukaPasar: () => void; bukaBacaan: () => void };

function pilihMesin(b: Bacaan, mesin: string): Mesin | null {
  return b.mesin.find((m) => m.mesin === mesin) ?? b.mesin.find((m) => m.status.toUpperCase() === 'SETUP') ?? b.mesin[0] ?? null;
}

export const KartuUtama = memo(function KartuUtama({ pasar, tf, mesin, bukaPasar, bukaBacaan }: Props) {
  const muat = useCallback((segarkan: boolean): Promise<Hasil<Bacaan>> => ambilBacaan(pasar, tf, segarkan), [pasar, tf]);
  const { keadaan } = useMuat(muat, `${pasar}:${tf}`);
  /* Desimal dan perubahan 24 jam dari daftar pasar — panggilan yang sudah
     dibuat tab Pasar, jadi biasanya gratis. Emas/forex tidak punya harga di
     daftar itu; perubahannya dihitung dari lilin yang sama dengan chart-nya. */
  const [info, setInfo] = useState<{ desimal: number; ubah: number | null } | null>(null);
  useEffect(() => {
    let hidup = true;
    void ambilPasar().then((j) => {
      if (!hidup || !j.ok) return;
      const p = j.isi.pasar.find((x) => x.simbol === pasar);
      if (p !== undefined) setInfo({ desimal: p.desimal, ubah: p.ubah24hPersen });
    });
    return () => { hidup = false; };
  }, [pasar]);
  const { width } = useWindowDimensions();
  const lebarGaris = width - 32 - 34;

  const b = keadaan.fase === 'ada' ? keadaan.isi : null;
  const m = b === null ? null : pilihMesin(b, mesin);
  const deret = b?.lilin.slice(-60).map((l) => l.tutup) ?? [];
  const ubah = info?.ubah ?? (deret.length > 24 ? (((deret[deret.length - 1] ?? 0) - (deret[deret.length - 25] ?? 1)) / (deret[deret.length - 25] ?? 1)) * 100 : null);
  const warna = ubah === null ? W.teksSamar : ubah >= 0 ? W.naik : W.turun;
  const desimal = info?.desimal ?? 2;
  const harga = b === null ? '' : angka(b.harga, desimal);
  const koma = harga.lastIndexOf(',');
  const wajib = m === null ? [] : syaratWajib(m);
  const lolos = wajib.filter((s) => s.lolos).length;
  const st = m?.status.toUpperCase() ?? '';
  const berangka = m !== null && m.entry !== undefined && m.sl !== undefined && m.tp !== undefined;

  return (
    <View style={g.kartu}>
      <LinearGradient pointerEvents="none" colors={['rgba(229,173,81,0.13)', 'rgba(229,173,81,0.03)', 'rgba(229,173,81,0.07)']} locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={g.baris1}>
        <LambangPasar simbol={pasar} ukuran={24} />
        <Text style={g.simbol} numberOfLines={1}>{pasar}</Text>
        <View style={g.chip}><Text style={g.chipTeks} numberOfLines={1}>{tf.toLowerCase()}{m !== null ? ` · ${m.mesin}` : ''}</Text></View>
        <View style={{ flex: 1 }} />
        <Text style={g.ket} numberOfLines={1}>TERAKHIR DIBUKA</Text>
      </View>

      {keadaan.fase === 'gagal' ? (
        <Text style={g.sebab}>{keadaan.kalimat}</Text>
      ) : b === null ? (
        <View style={{ gap: 10, marginTop: 14 }}><Rangka lebar="55%" tinggi={30} /><Rangka lebar="30%" tinggi={10} /><Rangka lebar="100%" tinggi={56} /></View>
      ) : (
        <>
          <Text style={g.harga}>{koma < 0 ? harga : harga.slice(0, koma)}<Text style={g.desimal}>{koma < 0 ? '' : harga.slice(koma)}</Text></Text>
          <Text style={[g.ubah, { color: warna }]}>
            {ubah === null ? '—' : `${ubah > 0 ? '+' : ubah < 0 ? '−' : ''}${Math.abs(ubah).toFixed(2).replace('.', ',')}%`}
            <Text style={g.ubahKet}>  24 jam</Text>
          </Text>
          <View style={{ marginTop: 6, marginHorizontal: -2 }}>
            <Sparkline data={deret} lebar={lebarGaris} tinggi={60} warna={warna} titikAkhir />
          </View>
          {m !== null && (
            <View style={g.keadaan}>
              <View style={[g.titik, st === 'SETUP' ? { backgroundColor: W.naik } : st === 'PANTAU' ? { backgroundColor: '#CDBFA6' } : null]} />
              <Text style={g.keadaanTeks} numberOfLines={1}>
                {st === 'SETUP' ? 'Setup' : st === 'PANTAU' ? 'Pantau' : 'Tidak dicetak'} · {lolos} dari {wajib.length} syarat
              </Text>
              <View style={{ flex: 1 }} />
              <Text style={g.keadaanKanan} numberOfLines={1}>
                {berangka ? `RR bersih ${m.rrBersih.toFixed(2).replace('.', ',')}${m.biayaPorsi !== null ? ` · biaya ${biayaPersen(m.biayaPorsi)}` : ''}` : m.keputusan.label}
              </Text>
            </View>
          )}
        </>
      )}
      <View style={g.tombol}>
        <View style={{ flex: 1 }}><Tombol teks="Buka chart  →" onPress={bukaPasar} /></View>
        <Tombol teks="Bacaan" jenis="kedua" onPress={bukaBacaan} />
      </View>
    </View>
  );
});

const g = gayaTema((W) => StyleSheet.create({
  kartu: {
    borderRadius: 26, padding: 16, overflow: 'hidden', backgroundColor: W.kartu,
    borderWidth: 1, borderColor: W.amberTepi, borderTopColor: 'rgba(240,191,107,0.7)',
  },
  baris1: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  simbol: { fontSize: 15, fontWeight: '600', color: W.teksKuat },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: W.isiSamarKuat, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: W.kacaTepi, maxWidth: 130 },
  chipTeks: { fontSize: 11.5, fontWeight: '600', color: W.teksRedup },
  ket: { fontSize: 9.5, letterSpacing: 1.6, color: W.teksSamar },
  harga: { fontSize: 38, fontWeight: '600', color: W.teksKuat, letterSpacing: -1.2, marginTop: 12, ...ANGKA },
  desimal: { fontSize: 24, color: W.teksRedup, letterSpacing: -0.5 },
  ubah: { fontSize: 13, fontWeight: '700', marginTop: 4, ...ANGKA },
  ubahKet: { fontWeight: '500', color: W.teksSamar },
  sebab: { fontSize: 13, color: W.teksRedup, lineHeight: 19, marginTop: 14, marginBottom: 6 },
  keadaan: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  titik: { width: 8, height: 8, borderRadius: 4, backgroundColor: W.teksSamar },
  keadaanTeks: { fontSize: 13, fontWeight: '600', color: W.teksKuat, flexShrink: 1 },
  keadaanKanan: { fontSize: 12, color: W.teksSamar, flexShrink: 1, ...ANGKA },
  tombol: { flexDirection: 'row', gap: 8, marginTop: 14 },
}));
