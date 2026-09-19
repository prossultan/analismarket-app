/**
 * Analis Market — app native.
 *
 * Tab bawah lima: Home · Pasar · Kabar · PLUS+ · Lainnya.
 *
 * PASAR DAN CHART SATU TUJUAN. Sampai 19 Sep keduanya dua tab — "pasar" yang
 * ketukannya dicegat, dan "analisis" yang memuat layar yang sama. Dua tab
 * untuk satu layar berarti satu slot terbuang, dan slot itu sekarang dipakai
 * KABAR: ia satu-satunya layar yang isinya berubah tanpa diminta, jadi
 * satu-satunya yang butuh lencana — dan lencana di dalam menu tidak terlihat.
 *
 * Yang belum ada di sini dan alasannya ada di layar Lainnya: pantauan, kabar
 * otomatis, dan setelan akun butuh identitas yang belum lepas dari Telegram.
 */
import { useCallback, useEffect, useState } from 'react';
import { Platform, StatusBar, Text } from 'react-native';
import { NavigationContainer, DarkTheme, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LayarAnalisis } from './src/layar/Analisis';
import { LayarBelajar } from './src/layar/Belajar';
import { LayarPengaturan } from './src/layar/Pengaturan';
import { LayarHome } from './src/layar/Home';
import { LayarProfil, LayarKabar } from './src/layar/Profil';
import { LayarKalender } from './src/layar/Kalender';
import { LayarAmPlus } from './src/layar/AmPlus';
import { Ikon, type NamaIkon } from './src/komponen/Ikon';
import { LayarLainnya } from './src/layar/Lainnya';
import { LayarDokumen } from './src/layar/Dokumen';
import { bacaSetelan, simpanSetelan, SETELAN_BAWAAN, type Setelan } from './src/data/simpan';
import { Kaca } from './src/komponen/Kaca';
import { W, H, KACA, TINGGI_BILAH } from './src/gaya/token';

const VERSI = '0.2.0';

export type DaftarLainParam = {
  Lainnya: undefined;
  Dokumen: { kunci: 'syarat' | 'privasi' };
  Belajar: undefined;
  Pengaturan: undefined;
  Profil: undefined;
  Kalender: undefined;
  AmPlus: undefined;
};
export type DaftarHomeParam = { Home: undefined };

/** Kunci menu → nama layar. Satu peta, supaya Home dan Lainnya tidak menyimpang. */
const KE_LAYAR: Record<string, 'Profil' | 'Kalender' | 'Belajar' | 'AmPlus' | 'Pengaturan'> = {
  profil: 'Profil', kalender: 'Kalender', belajar: 'Belajar', plus: 'AmPlus', pengaturan: 'Pengaturan',
};

const TumpukanLain = createNativeStackNavigator<DaftarLainParam>();
const Tab = createBottomTabNavigator();

/** Tema gelap yang memakai palet kita, bukan abu-abu bawaan react-navigation. */
const TEMA: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: W.latar,
    card: W.latar,
    text: W.teksKuat,
    border: W.garis,
    primary: W.teksKuat,
  },
};

/** Berlaku untuk kepala mana pun — tab maupun tumpukan. */
const OPSI_KEPALA = {
  /** Transparan supaya `headerBackground` yang berkaca itu terlihat. */
  headerTransparent: true,
  headerBackground: () => <Kaca tepi="bawah" gaya={{ flex: 1 }} />,
  headerStyle: { backgroundColor: 'transparent' },
  headerTitleStyle: { color: W.teksKuat, fontSize: H.nama, fontWeight: '700' as const },
  headerTintColor: W.teksKuat,
  headerShadowVisible: false,
};
/** `contentStyle` cuma dikenal tumpukan; menempelkannya di tab cuma bikin peringatan. */
const OPSI_TUMPUKAN = { ...OPSI_KEPALA, contentStyle: { backgroundColor: W.latar } };

function AlurLain({ setelan, simpan }: { setelan: Setelan; simpan: (s: Setelan) => void }) {
  return (
    <TumpukanLain.Navigator screenOptions={OPSI_TUMPUKAN}>
      <TumpukanLain.Screen name="Lainnya" options={{ title: 'Lainnya' }}>
        {({ navigation }) => (
          <LayarLainnya
            setelan={setelan}
            versi={VERSI}
            bukaDokumen={(k) => { navigation.navigate('Dokumen', { kunci: k }); }}
            /* Kunci tak dikenal TIDAK membuka apa pun. Sebelumnya ia jatuh
               ke 'Belajar', dan itu bentuk paling halus dari mengganti
               pilihan orang diam-diam: menunya terbuka, isinya salah, dan
               tidak ada satu pun tanda bahwa yang diminta bukan itu. */
            bukaMenu={(k) => { const ke = KE_LAYAR[k]; if (ke !== undefined) navigation.navigate(ke); }}
          />
        )}
      </TumpukanLain.Screen>
      <TumpukanLain.Screen name="Belajar" component={LayarBelajar} options={{ title: 'Belajar' }} />
      <TumpukanLain.Screen name="Pengaturan" options={{ title: 'Pengaturan' }}>
        {() => <LayarPengaturan setelan={setelan} simpan={simpan} />}
      </TumpukanLain.Screen>
      <TumpukanLain.Screen name="Profil" component={LayarProfil} options={{ title: 'Profil' }} />
      <TumpukanLain.Screen name="Kalender" component={LayarKalender} options={{ title: 'Kalender berita' }} />
      <TumpukanLain.Screen name="AmPlus" component={LayarAmPlus} options={{ title: 'AnalisMarket+' }} />
      <TumpukanLain.Screen name="Dokumen" options={({ route }) => ({ title: route.params.kunci === 'syarat' ? 'Syarat & Ketentuan' : 'Kebijakan Privasi' })}>
        {({ route }) => <LayarDokumen kunci={route.params.kunci} />}
      </TumpukanLain.Screen>
    </TumpukanLain.Navigator>
  );
}

/**
 * Ikon tab — path SVG yang SAMA dengan `MenuBawah.tsx` di web.
 *
 * Tab aktif memakai PUTIH, bukan emas, dan itu bukan kerapian: PLUS+ duduk di
 * baris yang sama dan memang emas. Kalau tab aktif ikut emas, keduanya
 * berebut dan PLUS+ berhenti menonjol.
 */
function ikonTab(nama: NamaIkon) {
  return ({ color }: { color: string }) => <Ikon nama={nama} warna={color} ukuran={20} />;
}

export default function App() {
  const [setelan, setSetelan] = useState<Setelan>(SETELAN_BAWAAN);
  /** Naik tiap kali tab Pasar ditekan — angka, bukan boolean, supaya ketukan kedua tetap membuka. */
  const [tandaPasar, setTandaPasar] = useState(0);

  useEffect(() => { void bacaSetelan().then(setSetelan); }, []);

  const simpan = useCallback((s: Setelan): void => {
    setSetelan(s);
    void simpanSetelan(s);
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={W.latar} />
      <NavigationContainer theme={TEMA}>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            /**
             * `position: absolute` BUKAN pilihan gaya — ia syarat supaya
             * kacanya terbaca. Bilah yang ikut aliran mendorong isi ke
             * atasnya, jadi yang disaring blur cuma latar kosong dan
             * hasilnya terlihat persis seperti panel abu biasa. Melayang,
             * isi lewat di bawahnya, dan blur punya bahan.
             *
             * Konsekuensinya tiap layar WAJIB memberi jarak bawah
             * `TINGGI_BILAH`; tanpa itu baris terakhirnya tidak pernah
             * bisa dijangkau.
             */
            tabBarStyle: {
              position: 'absolute',
              backgroundColor: 'transparent',
              borderTopWidth: 0,
              elevation: 0,
              height: TINGGI_BILAH,
              paddingTop: 4,
            },
            tabBarBackground: () => <Kaca tepi="atas" gaya={{ flex: 1 }} />,
            tabBarActiveTintColor: W.teksKuat,
            tabBarInactiveTintColor: W.teksSamar,
            tabBarLabelStyle: { fontSize: H.alat, fontWeight: '500' },
            tabBarItemStyle: { paddingVertical: 2 },
          }}
        >
          <Tab.Screen name="home" options={{ title: 'Home', headerShown: true, ...OPSI_KEPALA, tabBarIcon: ikonTab('rumah') }}>
            {({ navigation }) => (
              <LayarHome
                setelan={setelan}
                bukaChart={() => { navigation.navigate('pasar'); }}
                bukaPasar={() => { setTandaPasar((n) => n + 1); navigation.navigate('pasar'); }}
                bukaMenu={(k) => { navigation.navigate('lainnya', { screen: KE_LAYAR[k] ?? 'Belajar' }); }}
              />
            )}
          </Tab.Screen>

          {/* PASAR DAN CHART SATU TUJUAN.
              Dulu dua tab: "pasar" yang ketukannya dicegat, dan "analisis"
              yang memuat layar yang SAMA. Dua tab untuk satu layar berarti
              satu slot terbuang — dan di 390px slot adalah barang langka.

              Ketukan kedua saat tab ini SUDAH aktif membuka lembar pasar,
              meniru web: memilih pasar dan membacanya satu gerakan, bukan
              dua tujuan yang saling melempar. Ketukan dari tab lain cuma
              berpindah, tidak membuka lembar — orang yang datang dari Kabar
              ingin melihat chart-nya, bukan disodori daftar. */}
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

          {/* KABAR PINDAH DARI DALAM MENU KE BILAH INI.
              Ia satu-satunya layar yang isinya berubah tanpa diminta, jadi
              satu-satunya yang butuh lencana — dan lencana yang bersembunyi
              di dalam Lainnya tidak memberi tahu siapa pun.

              Catatan jujur: isinya masih terkunci sampai identitas lepas
              dari Telegram. Memindahkannya ke bilah ini membuat ketergantungan
              itu LEBIH terlihat, bukan lebih ringan — dan itu disengaja. */}
          <Tab.Screen
            name="kabar"
            component={LayarKabar}
            options={{ title: 'Kabar', headerShown: true, ...OPSI_KEPALA, tabBarIcon: ikonTab('kabar') }}
          />

          {/* Satu-satunya emas di bilah ini, dan itu memang aturannya. */}
          <Tab.Screen
            name="amplus"
            component={LayarAmPlus}
            options={{
              title: 'PLUS+', headerShown: true, ...OPSI_KEPALA,
              tabBarIcon: ({ focused }) => <Ikon nama="plus" warna={W.plus} ukuran={20} isi={focused ? W.plusRedup : undefined} />,
              tabBarActiveTintColor: W.plus,
              tabBarInactiveTintColor: W.plus,
              tabBarLabelStyle: { fontSize: H.alat, fontWeight: '600' },
            }}
          />

          <Tab.Screen name="lainnya" options={{ title: 'Lainnya', tabBarIcon: ikonTab('lainnya') }}>
            {() => <AlurLain setelan={setelan} simpan={simpan} />}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
