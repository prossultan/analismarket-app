/**
 * MASUK DENGAN GOOGLE — lewat Clerk, instance yang SAMA dengan web.
 *
 * Alurnya: tombol → peramban sistem (bukan WebView) → Google → kembali ke app
 * lewat skema `analismarket://`. Clerk membuat sesi; `JembatanClerk` di
 * App.tsx yang mengubahnya jadi `Sesi` untuk seluruh layar.
 *
 * SYARAT DI DASHBOARD CLERK yang tidak bisa dipasang dari kode: skema
 * `analismarket://` harus ada di daftar putih Native Applications. Kalau
 * belum, Google-nya selesai di peramban tapi app tidak pernah dipanggil
 * kembali — dan itu terlihat persis seperti tombol yang tidak bekerja.
 */
import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { useSSO } from '@clerk/clerk-expo';
import Svg, { Path } from 'react-native-svg';
import { Tombol } from './mockup';

/** Huruf G empat warna — tanda yang dikenali orang sebagai "masuk dengan Google". */
function TandaGoogle() {
  return (
    <Svg width={18} height={18} viewBox="0 0 48 48">
      <Path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
      <Path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <Path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <Path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </Svg>
  );
}

/* Menutup tab peramban yang tertinggal sesudah kembali ke app. */
WebBrowser.maybeCompleteAuthSession();

export function TombolGoogle({ sesudah, jenis = 'kedua' }: { sesudah?: () => void; jenis?: 'utama' | 'kedua' | 'emas' }) {
  const { startSSOFlow } = useSSO();
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState('');

  const masuk = async (): Promise<void> => {
    setSibuk(true); setGalat('');
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl: makeRedirectUri({ scheme: 'analismarket', path: 'masuk' }),
      });
      if (createdSessionId !== undefined && createdSessionId !== null && setActive !== undefined) {
        await setActive({ session: createdSessionId });
        sesudah?.();
      } else {
        /* Google selesai tapi Clerk minta langkah lanjutan (mis. verifikasi).
           Di app ini tidak ada formulir untuk itu; arahkan ke web. */
        setGalat('Masuk belum selesai. Coba lagi, atau masuk lewat analismarket.com dulu.');
      }
    } catch (e) {
      const pesan = e instanceof Error ? e.message : '';
      setGalat(/cancel|dismiss/i.test(pesan) ? '' : 'Tidak bisa masuk dengan Google. Periksa sambungan, lalu coba lagi.');
    } finally {
      setSibuk(false);
    }
  };

  return (
    <>
      <Tombol teks={sibuk ? 'Membuka Google…' : 'Masuk dengan Google'} jenis={jenis} mati={sibuk} onPress={() => { void masuk(); }} ikon={<TandaGoogle />} />
      {galat !== '' && <Tombol teks={galat} jenis="kedua" mati />}
    </>
  );
}
