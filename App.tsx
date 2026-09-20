/**
 * Analis Market — app native.
 *
 * Tab bawah lima: Home · Pasar · Kabar · PLUS+ · Lainnya.
 *
 * PASAR DAN CHART SATU TUJUAN. Dulu keduanya dua tab yang memuat layar yang
 * sama; dua tab untuk satu layar berarti satu slot terbuang, dan slot itu
 * sekarang dipakai KABAR — satu-satunya layar yang isinya berubah tanpa
 * diminta, jadi satu-satunya yang butuh lencana.
 *
 * SAMBUTAN muncul sekali di pembukaan pertama (mockup 00 dan 0b), lalu
 * diingat di perangkat. Ia punya "lanjut tanpa masuk" — tanpa itu app ini
 * tembok buntu, karena jalur masuknya belum ada.
 *
 * Yang masih terhalang identitas Telegram dibangun dengan bentuk mockup-nya,
 * diisi keadaan jujurnya, dan semuanya menunjuk ke satu layar yang sama:
 * Sambungkan Telegram.
 */
import { useCallback, useEffect, useState } from 'react';
import { Platform, StatusBar, Text, View } from 'react-native';
import { NavigationContainer, DarkTheme, createNavigationContainerRef, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { initialWindowMetrics, SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { enableFreeze } from 'react-native-screens';
import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { KUNCI_CLERK } from './src/data/clerk-kunci';
import { bacaSesi, dengarSesi, pasangClerk, sudahSiapSesi } from './src/data/sesi';

/* Layar yang tidak terlihat dibekukan — tab lain tidak ikut merender saat
   harga berganti di tab yang terbuka. Salah satu sebab "kurang smooth" di HP. */
enableFreeze(true);

import { LayarAnalisis } from './src/layar/Analisis';
import { LayarBelajar } from './src/layar/Belajar';
import { LayarPengaturan } from './src/layar/Pengaturan';
import { LayarHome } from './src/layar/Home';
import { LayarProfil, LayarKabar } from './src/layar/Profil';
import { LayarKalender } from './src/layar/Kalender';
import { LayarAmPlus } from './src/layar/AmPlus';
import { LayarLainnya, type KunciMenu } from './src/layar/Lainnya';
import { LayarDokumen } from './src/layar/Dokumen';
import { LayarTentang } from './src/layar/Tentang';
import { LayarSambutan } from './src/layar/Sambutan';
import {
  useSesi,
  LayarSambung, LayarPantauan, LayarPantauanBaru, LayarKabarOtomatis, LayarCekBanyak, LayarBerlangganan,
} from './src/layar/Akun';
import { Ikon, type NamaIkon } from './src/komponen/Ikon';
import { Kaca } from './src/komponen/Kaca';
import { Merek } from './src/komponen/Merek';
import { AvatarKepala } from './src/komponen/AvatarKepala';
import { LinearGradient } from 'expo-linear-gradient';
import { JudulKepala } from './src/komponen/JudulKepala';
import { bacaSetelan, simpanSetelan, SETELAN_BAWAAN, type Setelan } from './src/data/simpan';
import { umurTerakhir } from './src/data/antrian';
import { W, H, TINGGI_BILAH, TEPI_BILAH, ANGKAT_BILAH } from './src/gaya/token';
import { TombolTab } from './src/komponen/TombolTab';
import konfigApp from './app.json';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { dengarKetukanKabar, segarkanPendaftaran } from './src/data/push';
import { daftarkanPerangkat } from './src/data/saya';
import * as SplashScreen from 'expo-splash-screen';

/**
 * SPLASH DITAHAN sampai gerbang sesi memutuskan. Tanpa ini splash hilang
 * begitu root mount — dan root pertama kali merender NULL, karena setelan
 * dibaca dari AsyncStorage dan Clerk boleh mengambil sampai 2,5 detik.
 * Hasilnya layar gelap kosong tanpa merek, tiap kali app dibuka dingin:
 * inilah "kurang smooth" yang dilihat pemilik di HP. Di web ini no-op.
 */
void SplashScreen.preventAutoHideAsync().catch(() => { /* web atau sudah tersembunyi */ });

/* SATU SUMBER VERSI: app.json. Sebelumnya diketik '0.3.0' di sini sementara
   app.json sudah 1.0.0 — layar Tentang dan Lainnya memperlihatkan versi yang
   tidak pernah dirilis. Angka yang dilihat orang harus angka yang dikirim ke
   toko. */
const VERSI: string = konfigApp.expo.version;

/**
 * Ketukan notifikasi datang dari LUAR pohon React — bisa bahkan sebelum
 * navigator terpasang. Ref ini satu-satunya cara memindahkan layar dari sana
 * tanpa menitipkan `navigation` ke variabel global yang basi.
 */
const navRef = createNavigationContainerRef();

/** "Jumat, 19 September" — tanggal hari ini, dalam bahasa produk. */
function tanggalPendek(): string {
  return new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
}

/** Rute tumpukan yang dibagi Lainnya, Kabar, dan PLUS+. */
export type DaftarTumpukan = {
  Lainnya: undefined;
  Kabar: undefined;
  AmPlus: undefined;
  Dokumen: { kunci: 'syarat' | 'privasi' };
  Belajar: undefined;
  Profil: undefined;
  Kalender: undefined;
  Pengaturan: undefined;
  Tentang: undefined;
  Sambung: undefined;
  Pantauan: undefined;
  PantauanBaru: undefined;
  KabarOtomatis: undefined;
  CekBanyak: undefined;
  Berlangganan: undefined;
};
type Nav = NativeStackNavigationProp<DaftarTumpukan>;

/** Kunci menu → nama layar. Kunci tak dikenal TIDAK membuka apa pun. */
const KE_LAYAR: Record<KunciMenu, keyof DaftarTumpukan> = {
  kalender: 'Kalender', belajar: 'Belajar', profil: 'Profil', pengaturan: 'Pengaturan',
  tentang: 'Tentang', pantauan: 'Pantauan', sambung: 'Sambung',
};

const Tumpukan = createNativeStackNavigator<DaftarTumpukan>();
const Tab = createBottomTabNavigator();

const TEMA: Theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: W.latar, card: W.latar, text: W.teksKuat, border: W.garis, primary: W.plus },
};

/** Kepala kaca — berlaku untuk tab maupun tumpukan. */
const OPSI_KEPALA = {
  headerTransparent: true,
  /* Kilau emas samar dari kiri atas — ambient, terasa lebih dulu daripada
     terlihat. Ini yang membedakan kaca 2026 dari panel gelap datar. */
  headerBackground: () => <Kaca tepi="bawah" gaya={{ flex: 1 }}>
      <LinearGradient pointerEvents="none" colors={['rgba(201,169,97,0.13)', 'rgba(201,169,97,0.0)']}
        start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, width: '55%', height: '100%' }} />
    </Kaca>,
  headerStyle: { backgroundColor: 'transparent' },
  headerTitleStyle: { color: W.teksKuat, fontSize: H.pasar, fontWeight: '600' as const },
  headerTintColor: W.plus,
  headerShadowVisible: false,
  headerBackTitle: '',
};
/**
 * Perpindahan layar di dalam tumpukan: geser dari kanan — bawaan iOS, dan di
 * Android bawaan native-stack nyaris tanpa gerak sehingga pemilik menyebutnya
 * "tidak ada animasi sama sekali". Hierarkinya nyata (Lainnya → Profil), jadi
 * geser adalah gerak yang jujur. Gestur geser-balik penuh layar di iOS ikut.
 */
const OPSI_TUMPUKAN = {
  ...OPSI_KEPALA,
  contentStyle: { backgroundColor: W.latar },
  animation: 'slide_from_right' as const,
  animationDuration: 320,
  gestureEnabled: true,
  fullScreenGestureEnabled: true,
};

type IsiTumpukan = { setelan: Setelan; simpan: (s: Setelan) => void };

/** Layar-layar bersama yang bisa dibuka dari tumpukan mana pun. */
function LayarBersama({ setelan, simpan }: IsiTumpukan) {
  return (
    <>
      <Tumpukan.Screen name="Belajar" component={LayarBelajar} options={{ title: 'Belajar', headerTitle: () => <JudulKepala judul="Belajar" sub="16 istilah · cara baca kartu" /> }} />
      <Tumpukan.Screen name="Kalender" component={LayarKalender} options={{ title: 'Kalender berita', headerTitle: () => <JudulKepala judul="Kalender berita" sub="30 hari ke depan" /> }} />
      <Tumpukan.Screen name="Pengaturan" options={{ title: 'Pengaturan' }}>
        {() => <LayarPengaturan setelan={setelan} simpan={simpan} />}
      </Tumpukan.Screen>
      <Tumpukan.Screen name="Tentang" options={{ title: 'Tentang' }}>
        {() => <LayarTentang versi={VERSI} />}
      </Tumpukan.Screen>
      <Tumpukan.Screen name="Dokumen" options={({ route }) => ({ title: route.params.kunci === 'syarat' ? 'Syarat & Ketentuan' : 'Kebijakan Privasi' })}>
        {({ route }) => <LayarDokumen kunci={route.params.kunci} />}
      </Tumpukan.Screen>
      <Tumpukan.Screen name="Profil" options={{ title: 'Profil' }}>
        {({ navigation }) => (
          <LayarProfil setelan={setelan}
            bukaSambung={() => { (navigation as Nav).navigate('Sambung'); }}
            bukaPengaturan={() => { (navigation as Nav).navigate('Pengaturan'); }}
            bukaPantauan={() => { (navigation as Nav).navigate('Pantauan'); }}
            buka={(ke) => { (navigation as Nav).navigate(ke); }} />
        )}
      </Tumpukan.Screen>
      <Tumpukan.Screen name="Sambung" component={LayarSambung} options={{ title: 'Sambungkan Telegram' }} />
      <Tumpukan.Screen name="Pantauan" options={{ title: 'Pantauan' }}>
        {({ navigation }) => (
          <LayarPantauan pasar={setelan.pasar} tf={setelan.tf}
            bukaSambung={() => { (navigation as Nav).navigate('Sambung'); }}
            bukaBaru={() => { (navigation as Nav).navigate('PantauanBaru'); }} />
        )}
      </Tumpukan.Screen>
      <Tumpukan.Screen name="PantauanBaru" options={{ title: 'Pantauan baru' }}>
        {({ navigation }) => (
          <LayarPantauanBaru pasar={setelan.pasar} tf={setelan.tf} mesin={setelan.mesin}
            bukaSambung={() => { (navigation as Nav).navigate('Sambung'); }}
            selesai={() => { (navigation as Nav).navigate('Pantauan'); }} />
        )}
      </Tumpukan.Screen>
      <Tumpukan.Screen name="KabarOtomatis" options={{ title: 'Kabar otomatis', headerTitle: () => <JudulKepala judul="Kabar otomatis" sub="AnalisMarket+" /> }}>
        {({ navigation }) => <LayarKabarOtomatis bukaSambung={() => { (navigation as Nav).navigate('Sambung'); }} />}
      </Tumpukan.Screen>
      <Tumpukan.Screen name="CekBanyak" options={{ title: 'Cek banyak pasar', headerTitle: () => <JudulKepala judul="Cek banyak pasar" sub="AnalisMarket+" /> }}>
        {({ navigation }) => <LayarCekBanyak tf={setelan.tf} bukaSambung={() => { (navigation as Nav).navigate('Sambung'); }} />}
      </Tumpukan.Screen>
      <Tumpukan.Screen name="Berlangganan" component={LayarBerlangganan} options={{ title: 'Berlangganan', headerTitle: () => <JudulKepala judul="Berlangganan" sub="AnalisMarket+" /> }} />
    </>
  );
}

function AlurLain({ setelan, simpan }: IsiTumpukan) {
  return (
    <Tumpukan.Navigator screenOptions={OPSI_TUMPUKAN}>
      <Tumpukan.Screen name="Lainnya" options={{ title: 'Lainnya' }}>
        {({ navigation }) => (
          <LayarLainnya
            setelan={setelan}
            versi={VERSI}
            bukaDokumen={(k) => { (navigation as Nav).navigate('Dokumen', { kunci: k }); }}
            bukaMenu={(k) => { (navigation as Nav).navigate(KE_LAYAR[k] as never); }}
            umur={{ harga: umurTerakhir('/api/bacaan'), lilin: umurTerakhir('/api/bacaan'), kalender: umurTerakhir('/api/jadwal-berita') }}
          />
        )}
      </Tumpukan.Screen>
      {LayarBersama({ setelan, simpan })}
    </Tumpukan.Navigator>
  );
}

function AlurKabar({ setelan, simpan }: IsiTumpukan) {
  return (
    <Tumpukan.Navigator screenOptions={OPSI_TUMPUKAN}>
      <Tumpukan.Screen name="Kabar" options={{ title: 'Kabar' }}>
        {({ navigation }) => (
          <LayarKabar setelan={setelan}
            bukaPantauan={() => { (navigation as Nav).navigate('Pantauan'); }}
            bukaSambung={() => { (navigation as Nav).navigate('Sambung'); }}
            bukaChart={() => { navigation.getParent()?.navigate('pasar'); }} />
        )}
      </Tumpukan.Screen>
      {LayarBersama({ setelan, simpan })}
    </Tumpukan.Navigator>
  );
}

function AlurPlus({ setelan, simpan }: IsiTumpukan) {
  return (
    <Tumpukan.Navigator screenOptions={OPSI_TUMPUKAN}>
      <Tumpukan.Screen name="AmPlus" options={{ title: 'AnalisMarket+' }}>
        {({ navigation }) => <LayarAmPlus bukaLangganan={() => { (navigation as Nav).navigate('Berlangganan'); }} />}
      </Tumpukan.Screen>
      {LayarBersama({ setelan, simpan })}
    </Tumpukan.Navigator>
  );
}

/** Ikon tab — path SVG yang SAMA dengan web. Tab aktif PUTIH, bukan emas. */
/**
 * Ikon tab PERSIS mockup `kaca`: 19px, dan tab aktif punya garis 15×2 di
 * atasnya (`.tabbar div.on::after`). Garis itu yang membuat bilah terbaca
 * "modern": keadaan aktif ditandai bentuk, bukan cuma warna.
 */
function ikonTab(nama: NamaIkon) {
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <View style={{ alignItems: 'center', paddingTop: 6 }}>
      <View style={{ position: 'absolute', top: 0, width: 15, height: 2, borderRadius: 2, backgroundColor: focused ? W.teksKuat : 'transparent' }} />
      {/* Mockup: bintang PLUS+ SELALU terisi emas; ikon lain menebal saat aktif.
          Mengisi jalur terbuka (grafik Pasar) menghasilkan bidang aneh — dicoba
          dan terlihat di potret, jadi yang aktif ditebalkan, bukan diisi. */}
      <Ikon nama={nama} warna={color} ukuran={19} isi={nama === 'plus' ? W.plus : undefined} tebal={focused} />
    </View>
  );
}

/** Token Clerk disimpan di SecureStore (keystore/keychain), bukan AsyncStorage.
    Di web SecureStore tidak ada — Clerk memakai cookie peramban sendiri. */
const simpananToken = Platform.OS === 'web' ? undefined : {
  getToken: (k: string) => SecureStore.getItemAsync(k),
  saveToken: (k: string, v: string) => SecureStore.setItemAsync(k, v),
};

/**
 * JEMBATAN CLERK → SESI. Satu komponen tanpa tampilan yang meneruskan keadaan
 * Clerk ke `sesi.ts` tiap kali berubah, supaya layar cukup memakai
 * `useSesi()` dan tidak perlu tahu Clerk ada.
 */
function JembatanClerk() {
  const { isLoaded, isSignedIn, getToken, signOut } = useAuth();
  const { user } = useUser();
  /* GAGAL-TERBUKA UNTUK GERBANG. Kalau Clerk tidak kunjung siap — offline,
     skrip diblokir, origin ditolak — app TIDAK boleh menggantung di layar
     kosong menunggunya. Sesudah 2,5 detik gerbang diberi tahu "Clerk: tidak
     ada", dan pelanggan Telegram tetap masuk seperti biasa. Begitu Clerk
     akhirnya siap, keadaannya menyusul lewat efek di bawah. */
  useEffect(() => {
    if (isLoaded) return undefined;
    const t = setTimeout(() => { pasangClerk(null); }, 2500);
    return () => { clearTimeout(t); };
  }, [isLoaded]);
  useEffect(() => {
    if (!isLoaded) return;
    pasangClerk({
      getToken: async () => (await getToken()) ?? null,
      signOut: async () => { await signOut(); },
      akun: isSignedIn && user !== null && user !== undefined
        ? {
          akunId: 0,
          email: user.primaryEmailAddress?.emailAddress ?? null,
          nama: user.fullName ?? user.firstName ?? user.primaryEmailAddress?.emailAddress ?? null,
          telegramTersambung: false,
          langganan: 'gratis',
        }
        : null,
    });
  }, [isLoaded, isSignedIn, user?.id, getToken, signOut]);
  return null;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <ClerkProvider publishableKey={KUNCI_CLERK} tokenCache={simpananToken}>
      {/* Tanpa initialMetrics, render pertama membaca inset 0 dan kalimat kaki tertelan bilah tab. */}
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <StatusBar barStyle="light-content" backgroundColor={W.latar} />
        <JembatanClerk />
        <Isi />
      </SafeAreaProvider>
    </ClerkProvider>
    </GestureHandlerRootView>
  );
}

function Isi() {
  const { bottom: bawah } = useSafeAreaInsets();
  /**
   * `null` = BELUM DIBACA dari HP, bukan "tidak ada".
   *
   * Sebelumnya ia dimulai dari SETELAN_BAWAAN, dan layar sempat memuat
   * dengan pasar bawaan sebelum pilihan tersimpan datang dari AsyncStorage.
   * Terukur dari render sungguhan 19 Sep: dua putaran penuh tiap app dibuka
   * dingin — `/api/bacaan?pasar=BTCUSDT` pada 1,9 dtk lalu
   * `/api/bacaan?pasar=SOLUSDT` pada 4,3 dtk. Permintaan pertama itu tidak
   * pernah dilihat siapa pun, dan ia menagih jatah laju yang dikunci alamat
   * IP dan dibagi banyak orang lewat CGNAT.
   */
  const [setelan, setSetelan] = useState<Setelan | null>(null);
  const [tandaPasar, setTandaPasar] = useState(0);
  /**
   * GERBANG TANPA TAMU. App tampil hanya kalau ada sesi; selebihnya layar
   * masuk. Dan ia baru MEMUTUSKAN sesudah simpanan sesi dan Clerk sama-sama
   * terbaca — memutuskan lebih awal membuat pelanggan melihat layar masuk
   * sekejap tiap kali membuka app.
   */
  const sesi = useSesi();
  const [siapSesi, setSiapSesi] = useState(sudahSiapSesi());
  useEffect(() => {
    void bacaSesi();
    return dengarSesi(() => { setSiapSesi(sudahSiapSesi()); });
  }, []);

  useEffect(() => {
    void bacaSetelan().then(setSetelan);
  }, []);

  /* Token push bisa berubah tanpa pemberitahuan; didaftarkan ulang tiap app
     dibuka, tapi hanya sesudah ADA sesi — server menggantung perangkat pada
     akun, jadi mendaftar sebelum masuk cuma menghasilkan 401. */
  useEffect(() => {
    if (setelan === null || sesi === null) return;
    void segarkanPendaftaran(setelan.pushNyala, daftarkanPerangkat);
  }, [setelan, sesi]);


  const simpan = useCallback((s: Setelan): void => { setSetelan(s); void simpanSetelan(s); }, []);

  /**
   * KETUKAN NOTIFIKASI → CHART pasar yang dikabarkan.
   *
   * Pasar dan timeframe disimpan dulu lewat `simpan`, karena layar chart
   * membaca keduanya dari setelan — bukan dari parameter rute. Menavigasi
   * tanpa menyimpan akan membuka chart di pasar yang SEBELUMNYA dibuka, dan
   * orang membaca kabar XAU sambil melihat kandil BTC.
   *
   * `isReady` dijaga: di buka dingin, ketukan sampai lebih dulu daripada
   * navigator siap, dan `navigate` pada ref yang belum terpasang diam-diam
   * tidak melakukan apa-apa.
   */
  useEffect(() => {
    if (setelan === null || sesi === null) return undefined;
    return dengarKetukanKabar((t) => {
      simpan({ ...setelan, pasar: t.pair, tf: t.tf.toLowerCase() });
      const pergi = (): void => { if (navRef.isReady()) navRef.navigate('pasar' as never); };
      pergi();
      /* Buka dingin: navigator bisa belum terpasang di tik ini. Satu
         percobaan ulang pendek jauh lebih murah daripada ketukan yang
         mendarat di Home tanpa sepatah kata. */
      const t2 = setTimeout(pergi, 600);
      return () => { clearTimeout(t2); };
    });
  }, [setelan, sesi, simpan]);

  /* Splash turun tepat saat gerbang terbuka — dan paling lambat 6 detik,
     supaya kegagalan membaca simpanan tidak mengurung orang di balik logo. */
  const siap = setelan !== null && siapSesi;
  useEffect(() => {
    if (siap) { void SplashScreen.hideAsync().catch(() => {}); return undefined; }
    const t = setTimeout(() => { void SplashScreen.hideAsync().catch(() => {}); }, 6000);
    return () => { clearTimeout(t); };
  }, [siap]);

  /* Menunggu KEDUANYA. Menahan splash sepersekian detik jauh lebih murah
     daripada satu putaran permintaan yang dibuang. */
  if (!siap) return null;
  if (sesi === null) return <LayarSambutan />;

  return (
    <NavigationContainer theme={TEMA} ref={navRef}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          /* Pindah tab: `shift` — isi bergeser beberapa piksel ke arah tab yang
             ditekan sambil memudar. BUKAN slide penuh: tab itu setara, dan
             geser penuh menyiratkan kedalaman yang tidak ada. Cukup untuk
             terasa dijawab, tidak cukup untuk terasa seperti perjalanan. */
          animation: 'shift',
          /* 'shift' bawaan cuma beberapa piksel — pemilik tidak merasakannya.
             Interpolator sendiri: layar baru memudar masuk sambil naik 16 px
             dan tumbuh dari 0,97. Tetap BUKAN slide penuh: tab itu setara. */
          sceneStyleInterpolator: ({ current }) => ({
            sceneStyle: {
              opacity: current.progress.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 1, 0] }),
              transform: [
                { translateY: current.progress.interpolate({ inputRange: [-1, 0, 1], outputRange: [16, 0, 16] }) },
                { scale: current.progress.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.97, 1, 0.97] }) },
              ],
            },
          }),
          transitionSpec: { animation: 'timing', config: { duration: 240 } },
          /**
           * `position: absolute` BUKAN pilihan gaya — ia syarat supaya kaca
           * terbaca: isi harus lewat di bawah bilah. Tingginya IKUT JARAK AMAN,
           * karena react-navigation berhenti menambahkannya untuk bilah
           * melayang; tanpa `bawah`, label "Home" terpotong separuh di HP
           * berponi — dan itu terlihat persis seperti desain yang memang begitu.
           */
          tabBarStyle: {
            position: 'absolute',
            left: TEPI_BILAH, right: TEPI_BILAH, bottom: bawah + ANGKAT_BILAH,
            height: TINGGI_BILAH, borderRadius: TINGGI_BILAH / 2, overflow: 'hidden',
            backgroundColor: 'transparent', borderTopWidth: 0, elevation: 0,
            paddingTop: 0, paddingBottom: 0,
          },
          tabBarBackground: () => <Kaca tepi="atas" gaya={{ flex: 1, borderRadius: TINGGI_BILAH / 2 }} />,
          tabBarShowLabel: false,
          tabBarActiveTintColor: W.teksKuat,
          tabBarInactiveTintColor: W.teksSamar,
          tabBarItemStyle: { paddingVertical: 0 },
        }}
      >
        <Tab.Screen
          name="home"
          options={({ navigation }) => ({
            title: 'Home', headerShown: true, ...OPSI_KEPALA,
            headerTitle: () => <Merek sub={`${tanggalPendek()} · 131 pasar hidup`} />,
            headerTitleAlign: 'left' as const,
            headerRight: () => <AvatarKepala onPress={() => { navigation.navigate('lainnya', { screen: 'Profil' }); }} />,
            tabBarButton: (p) => <TombolTab ikon="rumah" label="Home" nama="home" aktif={p.accessibilityState?.selected === true} onPress={p.onPress} onLongPress={p.onLongPress} />,
          })}
        >
          {({ navigation }) => (
            <LayarHome
              setelan={setelan}
              bukaPasar={() => { navigation.navigate('pasar'); }}
              buka={(ke) => { navigation.navigate('lainnya', { screen: ke }); }}
              bukaTab={(t) => { navigation.navigate(t); }}
              bukaPasarDi={(simbol) => { simpan({ ...setelan, pasar: simbol }); navigation.navigate('pasar'); }}
            />
          )}
        </Tab.Screen>

        {/* Ketukan kedua saat tab ini SUDAH aktif membuka lembar pasar. */}
        <Tab.Screen
          name="pasar"
          options={{ title: 'Pasar', tabBarButton: (p) => <TombolTab ikon="pasar" label="Pasar" nama="pasar" aktif={p.accessibilityState?.selected === true} onPress={p.onPress} onLongPress={p.onLongPress} /> }}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              if (!navigation.isFocused()) return;
              e.preventDefault();
              setTandaPasar((n) => n + 1);
            },
          })}
        >
          {() => <LayarAnalisis setelan={setelan} simpan={simpan} bukaPasarTanda={tandaPasar} />}
        </Tab.Screen>

        <Tab.Screen name="kabar" options={{ title: 'Kabar', tabBarButton: (p) => <TombolTab ikon="kabar" label="Kabar" nama="kabar" aktif={p.accessibilityState?.selected === true} onPress={p.onPress} onLongPress={p.onLongPress} /> }}>
          {() => <AlurKabar setelan={setelan} simpan={simpan} />}
        </Tab.Screen>

        {/* Satu-satunya emas di bilah ini, dan itu memang aturannya. */}
        <Tab.Screen
          name="amplus"
          options={{
            title: 'PLUS+',
            /* Mockup: bintang TERISI emas di semua keadaan, dan tab aktif
               dapat garis 15×2 yang sama dengan tab lain. */
            tabBarButton: (p) => <TombolTab ikon="plus" label="PLUS+" nama="amplus" emas aktif={p.accessibilityState?.selected === true} onPress={p.onPress} onLongPress={p.onLongPress} />,
          }}
        >
          {() => <AlurPlus setelan={setelan} simpan={simpan} />}
        </Tab.Screen>

        <Tab.Screen name="lainnya" options={{ title: 'Lainnya', tabBarButton: (p) => <TombolTab ikon="lainnya" label="Lainnya" nama="lainnya" aktif={p.accessibilityState?.selected === true} onPress={p.onPress} onLongPress={p.onLongPress} /> }}>
          {() => <AlurLain setelan={setelan} simpan={simpan} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
