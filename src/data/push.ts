/**
 * NOTIFIKASI PUSH — izin, token, dan pendaftarannya ke server.
 *
 * TIDAK PERNAH DIMINTA SAAT APP PERTAMA DIBUKA, dan itu keputusan produk.
 * Dialog izin Android cuma bisa ditanyakan SEKALI: kalau ditolak, ia tidak
 * pernah muncul lagi dan satu-satunya jalan adalah Setelan sistem. Meminta
 * sebelum orang tahu kabar itu apa membuang satu-satunya kesempatan itu pada
 * orang yang belum punya alasan menjawab ya. Karena itu izin diminta dari
 * SAKLAR di Pengaturan — saat orangnya sendiri yang memintanya.
 *
 * TOKEN BUKAN RAHASIA, tapi ia identitas perangkat: siapa pun yang memegangnya
 * bisa mengirim notifikasi ke HP itu lewat Expo. Ia tidak pernah dicetak ke
 * log dan tidak pernah ditampilkan di layar.
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import konfigApp from '../../app.json';

const PROYEK = konfigApp.expo.extra.eas.projectId;

/**
 * SALURAN ANDROID wajib ada SEBELUM notifikasi pertama tiba. Android 8+
 * membuang notifikasi yang menyebut saluran yang belum terdaftar — tanpa
 * galat, tanpa jejak. Namanya `kabar`, sama dengan `channelId` yang dikirim
 * bot; dua nama yang berbeda menghasilkan kegagalan senyap yang sama.
 */
export async function siapkanSaluran(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('kabar', {
    name: 'Kabar pantauan',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    /* Getar TIDAK dinyalakan: izin VIBRATE sengaja diblokir di app.json, dan
       menyalakannya di sini akan menariknya kembali ke manifes. */
    vibrationPattern: undefined,
    lightColor: '#C9A961',
  });
}

export type HasilIzin = 'ok' | 'ditolak' | 'bukan-perangkat';

/**
 * Meminta izin kalau belum pernah dijawab. Menjawab apa adanya — termasuk
 * "ditolak", yang BUKAN galat: orang berhak bilang tidak, dan layar yang
 * memperlakukannya sebagai kegagalan akan menyuruhnya mencoba lagi ke dialog
 * yang tidak akan pernah muncul lagi.
 */
export async function mintaIzinPush(): Promise<HasilIzin> {
  if (!Device.isDevice) return 'bukan-perangkat';
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return 'ok';
  const minta = await Notifications.requestPermissionsAsync();
  return minta.status === 'granted' ? 'ok' : 'ditolak';
}

/**
 * Token Expo perangkat ini, atau `null` kalau tidak bisa didapat.
 *
 * Emulator dan web menjawab null tanpa melempar: push memang tidak ada di
 * sana, dan itu keadaan normal, bukan kerusakan yang perlu dilaporkan.
 */
export async function tokenPerangkat(): Promise<string | null> {
  if (!Device.isDevice) return null;
  try {
    const t = await Notifications.getExpoPushTokenAsync({ projectId: PROYEK });
    return t.data;
  } catch {
    return null;
  }
}

/**
 * Notifikasi yang tiba SAAT APP TERBUKA tetap ditampilkan.
 *
 * Bawaan Expo menelannya diam-diam, dengan alasan yang masuk akal untuk app
 * chat: layarnya sudah memperlihatkan isinya. Di sini tidak — orang bisa
 * sedang membaca BTCUSDT saat kabar XAU/USD tiba, dan menelannya berarti
 * kabar itu hilang untuk selamanya tanpa pernah terlihat.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Mendaftarkan ulang token saat app dibuka, kalau saklarnya memang nyala.
 *
 * Token Expo BISA BERUBAH — pemasangan ulang, pembersihan data, rotasi dari
 * sisi Google. Token lama yang tidak pernah diperbarui akan dijawab
 * `DeviceNotRegistered` dan dimatikan server, dan orangnya berhenti menerima
 * kabar tanpa satu pun tanda: saklarnya tetap terlihat nyala. Menjalankan
 * pendaftaran sekali tiap buka jauh lebih murah daripada menemukan itu.
 *
 * Diam kalau gagal — ini bukan tindakan yang diminta orangnya saat itu, jadi
 * tidak ada layar yang pantas menampilkan galatnya. Saklar di Pengaturan yang
 * berbicara saat orangnya sendiri yang menekannya.
 */
export async function segarkanPendaftaran(
  nyala: boolean,
  daftar: (token: string, platform: 'android' | 'ios') => Promise<{ ok: boolean }>,
): Promise<void> {
  if (!nyala || !Device.isDevice) return;
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;
  await siapkanSaluran();
  const t = await tokenPerangkat();
  if (t === null) return;
  await daftar(t, Platform.OS === 'ios' ? 'ios' : 'android');
}

/** Muatan yang dititipkan bot di tiap push kabar. */
export type TujuanKabar = { pair: string; tf: string; mesin?: string };

function bacaTujuan(data: unknown): TujuanKabar | null {
  if (typeof data !== 'object' || data === null) return null;
  const d = data as { pair?: unknown; tf?: unknown; mesin?: unknown };
  if (typeof d.pair !== 'string' || d.pair === '') return null;
  if (typeof d.tf !== 'string' || d.tf === '') return null;
  return { pair: d.pair, tf: d.tf, mesin: typeof d.mesin === 'string' ? d.mesin : undefined };
}

/**
 * KETUKAN NOTIFIKASI datang lewat DUA pintu, dan yang kedua mudah terlupa.
 *
 * `addNotificationResponseReceivedListener` cuma menangkap ketukan saat app
 * sudah hidup — di latar belakang atau di depan. Kalau app benar-benar MATI
 * dan ketukan itulah yang membangunkannya, peristiwanya sudah lewat sebelum
 * satu baris React pun berjalan; yang menyimpannya
 * `getLastNotificationResponseAsync`. Memasang yang pertama saja berarti
 * notifikasi bekerja saat diuji (app baru saja dibuka) dan tidak bekerja
 * dalam pemakaian nyata (app sudah lama tertutup) — kegagalan yang nyaris
 * mustahil ditemukan dari kode.
 *
 * Mengembalikan fungsi pelepas, supaya pemanggilnya tidak membocorkan
 * langganan tiap kali dipasang ulang.
 */
export function dengarKetukanKabar(buka: (t: TujuanKabar) => void): () => void {
  let sudahDingin = false;
  void Notifications.getLastNotificationResponseAsync().then((r) => {
    if (sudahDingin || r === null) return;
    const t = bacaTujuan(r.notification.request.content.data);
    if (t !== null) { sudahDingin = true; buka(t); }
  });
  const langganan = Notifications.addNotificationResponseReceivedListener((r) => {
    const t = bacaTujuan(r.notification.request.content.data);
    if (t !== null) buka(t);
  });
  return () => { langganan.remove(); };
}
