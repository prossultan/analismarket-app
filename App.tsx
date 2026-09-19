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
import { StatusBar, Text } from 'react-native';
import { NavigationContainer, DarkTheme, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

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
import { LayarSambutan, sudahDisambut } from './src/layar/Sambutan';
import {
  LayarSambung, LayarPantauan, LayarPantauanBaru, LayarKabarOtomatis, LayarKredit, LayarCekBanyak, LayarBerlangganan,
} from './src/layar/Akun';
import { Ikon, type NamaIkon } from './src/komponen/Ikon';
import { Kaca } from './src/komponen/Kaca';
import { Merek } from './src/komponen/Merek';
import { bacaSetelan, simpanSetelan, SETELAN_BAWAAN, type Setelan } from './src/data/simpan';
import { umurTerakhir } from './src/data/antrian';
import { W, H, TINGGI_BILAH } from './src/gaya/token';

const VERSI = '0.3.0';

/** "Jumat, 19 September" — tanggal hari ini, dalam bahasa produk. */
function tanggalPanjang(): string {
  return new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
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
  Kredit: undefined;
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
  headerBackground: () => <Kaca tepi="bawah" gaya={{ flex: 1 }} />,
  headerStyle: { backgroundColor: 'transparent' },
  headerTitleStyle: { color: W.teksKuat, fontSize: H.pasar, fontWeight: '600' as const },
  headerTintColor: W.plus,
  headerShadowVisible: false,
  headerBackTitle: '',
};
const OPSI_TUMPUKAN = { ...OPSI_KEPALA, contentStyle: { backgroundColor: W.latar } };

type IsiTumpukan = { setelan: Setelan; simpan: (s: Setelan) => void };

/** Layar-layar bersama yang bisa dibuka dari tumpukan mana pun. */
function LayarBersama({ setelan, simpan }: IsiTumpukan) {
  return (
    <>
      <Tumpukan.Screen name="Belajar" component={LayarBelajar} options={{ title: 'Belajar' }} />
      <Tumpukan.Screen name="Kalender" component={LayarKalender} options={{ title: 'Kalender berita' }} />
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
      <Tumpukan.Screen name="KabarOtomatis" options={{ title: 'Kabar otomatis' }}>
        {({ navigation }) => <LayarKabarOtomatis bukaSambung={() => { (navigation as Nav).navigate('Sambung'); }} />}
      </Tumpukan.Screen>
      <Tumpukan.Screen name="Kredit" options={{ title: 'Kredit & kuota' }}>
        {({ navigation }) => <LayarKredit bukaSambung={() => { (navigation as Nav).navigate('Sambung'); }} />}
      </Tumpukan.Screen>
      <Tumpukan.Screen name="CekBanyak" options={{ title: 'Cek banyak pasar' }}>
        {({ navigation }) => <LayarCekBanyak tf={setelan.tf} bukaSambung={() => { (navigation as Nav).navigate('Sambung'); }} />}
      </Tumpukan.Screen>
      <Tumpukan.Screen name="Berlangganan" component={LayarBerlangganan} options={{ title: 'Berlangganan' }} />
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
function ikonTab(nama: NamaIkon) {
  return ({ color }: { color: string }) => <Ikon nama={nama} warna={color} ukuran={20} />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={W.latar} />
      <Isi />
    </SafeAreaProvider>
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
  /** null = belum tahu (jangan berkedip), true = tampilkan sambutan. */
  const [sambutan, setSambutan] = useState<boolean | null>(null);

  useEffect(() => {
    void bacaSetelan().then(setSetelan);
    void sudahDisambut().then((sudah) => { setSambutan(!sudah); });
  }, []);

  const simpan = useCallback((s: Setelan): void => { setSetelan(s); void simpanSetelan(s); }, []);

  /* Menunggu KEDUANYA. Menahan satu layar kosong sepersekian detik jauh
     lebih murah daripada satu putaran permintaan yang dibuang. */
  if (sambutan === null || setelan === null) return null;
  if (sambutan) return <LayarSambutan selesai={() => { setSambutan(false); }} />;

  return (
    <NavigationContainer theme={TEMA}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          /**
           * `position: absolute` BUKAN pilihan gaya — ia syarat supaya kaca
           * terbaca: isi harus lewat di bawah bilah. Tingginya IKUT JARAK AMAN,
           * karena react-navigation berhenti menambahkannya untuk bilah
           * melayang; tanpa `bawah`, label "Home" terpotong separuh di HP
           * berponi — dan itu terlihat persis seperti desain yang memang begitu.
           */
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
            height: TINGGI_BILAH + bawah,
            paddingTop: 4,
            paddingBottom: bawah,
          },
          tabBarBackground: () => <Kaca tepi="atas" gaya={{ flex: 1 }} />,
          tabBarActiveTintColor: W.teksKuat,
          tabBarInactiveTintColor: W.teksSamar,
          tabBarLabelStyle: { fontSize: H.alat, fontWeight: '500' },
          tabBarItemStyle: { paddingVertical: 2 },
        }}
      >
        <Tab.Screen
          name="home"
          options={{
            title: 'Home', headerShown: true, ...OPSI_KEPALA,
            headerTitle: () => <Merek sub={tanggalPanjang()} />,
            headerTitleAlign: 'left' as const,
            tabBarIcon: ikonTab('rumah'),
          }}
        >
          {({ navigation }) => (
            <LayarHome
              setelan={setelan}
              bukaChart={(p) => { simpan({ ...setelan, pasar: p.simbol }); navigation.navigate('pasar'); }}
              bukaPasar={() => { setTandaPasar((n) => n + 1); navigation.navigate('pasar'); }}
            />
          )}
        </Tab.Screen>

        {/* Ketukan kedua saat tab ini SUDAH aktif membuka lembar pasar. */}
        <Tab.Screen
          name="pasar"
          options={{ title: 'Pasar', tabBarIcon: ikonTab('pasar') }}
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

        <Tab.Screen name="kabar" options={{ title: 'Kabar', tabBarIcon: ikonTab('kabar') }}>
          {() => <AlurKabar setelan={setelan} simpan={simpan} />}
        </Tab.Screen>

        {/* Satu-satunya emas di bilah ini, dan itu memang aturannya. */}
        <Tab.Screen
          name="amplus"
          options={{
            title: 'PLUS+',
            tabBarIcon: ({ focused }) => <Ikon nama="plus" warna={W.plus} ukuran={20} isi={focused ? W.plusRedup : undefined} />,
            /* Label diberi warna SENDIRI, bukan lewat tint: tint per-layar
               menular ke seluruh bilah saat layar ini aktif. */
            tabBarLabel: () => <Text style={{ fontSize: H.alat, fontWeight: '600', color: W.plus }}>PLUS+</Text>,
          }}
        >
          {() => <AlurPlus setelan={setelan} simpan={simpan} />}
        </Tab.Screen>

        <Tab.Screen name="lainnya" options={{ title: 'Lainnya', tabBarIcon: ikonTab('lainnya') }}>
          {() => <AlurLain setelan={setelan} simpan={simpan} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
