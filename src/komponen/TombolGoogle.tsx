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
import { Tombol } from './mockup';

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
      <Tombol teks={sibuk ? 'Membuka Google…' : 'Masuk dengan Google'} jenis={jenis} mati={sibuk} onPress={() => { void masuk(); }} />
      {galat !== '' && <Tombol teks={galat} jenis="kedua" mati />}
    </>
  );
}
