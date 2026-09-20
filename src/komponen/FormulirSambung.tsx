/**
 * FORMULIR SAMBUNGKAN TELEGRAM — satu formulir, dua rumah.
 *
 * Dipakai di layar Sambungkan (dalam app) DAN di layar masuk (di luar
 * navigator, sebelum ada sesi). Sejak app mewajibkan masuk, orang yang
 * belum punya sesi tidak bisa mencapai layar Sambungkan — jadi formulirnya
 * yang datang ke layar masuk, bukan sebaliknya.
 */
import { useCallback, useState } from 'react';
import { gayaTema } from '../gaya/tema';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { sambungkan } from '../data/sesi';
import { Blok, Chip, Langkah, Lbl, Mikro, Tombol } from './mockup';
import { TombolGoogle } from './TombolGoogle';
import { W, H, R, SENTUH } from '../gaya/token';

/** Nama bot — sama dengan `HANDLE` di renderer kartu. Teks, bukan tautan. */
export const BOT = 'analismarketbot';

export function FormulirSambung({ ringkas = false }: { ringkas?: boolean }) {
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

  return (
    <>
      {/* Penomoran SAH di sini: urutannya menentukan. Tanpa langkah 2 tautannya tidak pernah ada. */}
      <Blok rapat gaya={{ paddingHorizontal: 10 }}>
        <Langkah no={1} judul={`Buka @${BOT} di Telegram`} ket="Namanya bisa disalin dari blok di bawah." pertama />
        <Langkah no={2} judul="Tekan “🌐 Buka Akses Web”" ket="Bot membalas dengan tautannya, tercetak sebagai teks." />
        {/* Dulu langkah ini berbunyi "Tekan LAMA tombolnya → Salin tautan":
            satu-satunya cara mengambil tautan saat bot cuma mengirim tombol.
            Gerakan yang harus DIAJARKAN adalah gerakan yang sebagian orang
            tidak akan lakukan. Sejak bot mencetak tautannya di dalam blok
            kode, satu ketukan sudah menyalinnya. */}
        <Langkah no={3} judul="Ketuk tautannya sekali → tersalin" ket="Lalu tempel di kotak bawah. Jangan dibuka di peramban: sekali terbuka, tautannya habis." />
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
        <Mikro>Tautannya sekali pakai dan tidak kedaluwarsa. Kalau sudah terpakai, minta lagi ke bot.</Mikro>
      </Blok>

      <Blok>
        <Lbl>Atau masuk dengan akun web</Lbl>
        <View style={{ marginTop: 8 }}>
          <TombolGoogle />
        </View>
        <Mikro>Akun yang sama dengan analismarket.com. Pantauan dan kabar jalan di app lewat notifikasi HP; Telegram opsional, bisa ditautkan kapan saja.</Mikro>
      </Blok>

      {!ringkas && (
        <Blok emas gaya={{ alignItems: 'center', paddingVertical: 14 }}>
          <Lbl warna={W.plusTeks}>Nama bot di Telegram</Lbl>
          <Text selectable style={g.handle}>@{BOT}</Text>
          <Chip teks="Salin nama" emas onPress={() => { void Clipboard.setStringAsync(`@${BOT}`); }} />
        </Blok>
      )}
    </>
  );
}

const g = gayaTema((W) => StyleSheet.create({
  judulTengah: { marginTop: 8, fontSize: H.pasar, fontWeight: '600', color: W.teksKuat, textAlign: 'center', letterSpacing: -0.2 },
  ketTengah: { marginTop: 6, fontSize: H.alat, color: W.teksRedup, lineHeight: 15, textAlign: 'center', maxWidth: 260 },
  tempelKotak: {
    marginTop: 6, minHeight: SENTUH, paddingHorizontal: 10, borderRadius: R.besar,
    borderWidth: 1, borderColor: W.garis, backgroundColor: W.tinta(0.05), justifyContent: 'center',
  },
  tempelIsi: { color: W.teksKuat, fontSize: H.nilai, paddingVertical: 10 },
  galat: { marginTop: 8, fontSize: H.alat, color: W.turun, lineHeight: 15 },
  handle: { marginTop: 6, marginBottom: 8, fontSize: 22, fontWeight: '700', color: W.teksKuat, letterSpacing: -0.4 },
}));
