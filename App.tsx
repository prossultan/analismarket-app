/**
 * Analis Market — app native.
 *
 * Tab bawah lima, dengan Pasar sebagai tumpukan: Pasar → Chart → Bacaan →
 * (Banding | Syarat | Zona). Tumpukan, bukan tab, karena keempat layar itu
 * SELALU tentang pasar dan timeframe yang sedang dibuka — kalau mereka jadi
 * tab, orang bisa berdiri di "Syarat" untuk pasar yang sudah ia tinggalkan.
 *
 * Yang belum ada di sini dan alasannya ada di layar Lainnya: pantauan, kabar
 * otomatis, dan setelan akun butuh identitas yang belum lepas dari Telegram.
 */
import { useCallback, useEffect, useState } from 'react';
import { StatusBar, Text } from 'react-native';
import { NavigationContainer, DarkTheme, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LayarPasar } from './src/layar/Pasar';
import { LayarChart } from './src/layar/Chart';
import { LayarBacaan } from './src/layar/Bacaan';
import { LayarBanding } from './src/layar/Banding';
import { LayarSyarat } from './src/layar/Syarat';
import { LayarZona } from './src/layar/Zona';
import { LayarBelajar } from './src/layar/Belajar';
import { LayarChartTerakhir } from './src/layar/ChartTerakhir';
import { LayarHome } from './src/layar/Home';
import { LayarProfil, LayarKabar } from './src/layar/Profil';
import { LayarKalender } from './src/layar/Kalender';
import { LayarAmPlus } from './src/layar/AmPlus';
import { Ikon, type NamaIkon } from './src/komponen/Ikon';
import { LayarLainnya } from './src/layar/Lainnya';
import { LayarDokumen } from './src/layar/Dokumen';
import { bacaSetelan, simpanSetelan, SETELAN_BAWAAN, type Setelan } from './src/data/simpan';
import type { Bacaan, Mesin, Pasar } from './src/data/api';
import { W, H } from './src/gaya/token';

const VERSI = '0.2.0';

export type DaftarPasarParam = {
  Pasar: undefined;
  Chart: { pasar: Pasar };
  Bacaan: { pasar: Pasar; tf: string; mesin: string };
  Banding: { bacaan: Bacaan; desimal: number };
  Syarat: { mesin: Mesin };
  Zona: { mesin: Mesin; desimal: number };
};
export type DaftarLainParam = {
  Lainnya: undefined;
  Dokumen: { kunci: 'syarat' | 'privasi' };
  Belajar: undefined;
  Profil: undefined;
  Kabar: undefined;
  Kalender: undefined;
  AmPlus: undefined;
};
export type DaftarHomeParam = { Home: undefined };

/** Kunci menu → nama layar. Satu peta, supaya Home dan Lainnya tidak menyimpang. */
const KE_LAYAR: Record<string, 'Profil' | 'Kabar' | 'Kalender' | 'Belajar' | 'AmPlus'> = {
  profil: 'Profil', kabar: 'Kabar', kalender: 'Kalender', belajar: 'Belajar', plus: 'AmPlus',
};

const TumpukanPasar = createNativeStackNavigator<DaftarPasarParam>();
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
  headerStyle: { backgroundColor: W.latar },
  headerTitleStyle: { color: W.teksKuat, fontSize: H.nama, fontWeight: '700' as const },
  headerTintColor: W.teksKuat,
  headerShadowVisible: false,
};
/** `contentStyle` cuma dikenal tumpukan; menempelkannya di tab cuma bikin peringatan. */
const OPSI_TUMPUKAN = { ...OPSI_KEPALA, contentStyle: { backgroundColor: W.latar } };

function AlurPasar({ setelan, simpan }: { setelan: Setelan; simpan: (s: Setelan) => void }) {
  return (
    <TumpukanPasar.Navigator screenOptions={OPSI_TUMPUKAN}>
      <TumpukanPasar.Screen name="Pasar" options={{ title: 'Pasar' }}>
        {({ navigation }) => (
          <LayarPasar terpilih={setelan.pasar} buka={(p) => { navigation.navigate('Chart', { pasar: p }); }} />
        )}
      </TumpukanPasar.Screen>

      <TumpukanPasar.Screen name="Chart" options={({ route }) => ({ title: route.params.pasar.simbol })}>
        {({ route, navigation }) => {
          const { pasar } = route.params;
          /* Timeframe tersimpan dipakai kalau pasar ini memang membacanya;
             kalau tidak, jatuh ke tfMinimum pasar itu — dan itu keputusan
             pasar, bukan tebakan app. */
          const punya = pasar.timeframes.map((t) => t.toLowerCase());
          const tfAwal = punya.includes(setelan.tf) ? setelan.tf : (punya[0] ?? 'h1');
          return (
            <LayarChart
              pasar={pasar}
              tf={tfAwal}
              gantiTf={(t) => { simpan({ ...setelan, pasar: pasar.simbol, tf: t }); }}
              bukaBacaan={(m) => { navigation.navigate('Bacaan', { pasar, tf: tfAwal, mesin: m }); }}
            />
          );
        }}
      </TumpukanPasar.Screen>

      <TumpukanPasar.Screen name="Bacaan" options={({ route }) => ({ title: `${route.params.pasar.simbol} ${route.params.tf.toUpperCase()}` })}>
        {({ route, navigation }) => {
          const { pasar, tf, mesin } = route.params;
          return (
            <LayarBacaan
              pasar={pasar}
              tf={tf}
              /* Mesin datang dari tab di layar Chart — pilihan SEKALI LIHAT,
                 bukan setelan. Menyimpannya berarti mengubah bawaan orang
                 setiap kali ia mengintip mesin lain. */
              mesinDipilih={mesin}
              pilihMesin={() => { /* pilihan mesin hidup di layar Chart */ }}
              bukaBanding={(b) => { navigation.navigate('Banding', { bacaan: b, desimal: pasar.desimal }); }}
              bukaSyarat={(m) => { navigation.navigate('Syarat', { mesin: m }); }}
              bukaZona={(m) => { navigation.navigate('Zona', { mesin: m, desimal: pasar.desimal }); }}
            />
          );
        }}
      </TumpukanPasar.Screen>

      <TumpukanPasar.Screen name="Banding" options={{ title: 'Banding mesin' }}>
        {({ route }) => <LayarBanding bacaan={route.params.bacaan} desimal={route.params.desimal} />}
      </TumpukanPasar.Screen>

      <TumpukanPasar.Screen name="Syarat" options={{ title: 'Syarat' }}>
        {({ route }) => <LayarSyarat m={route.params.mesin} />}
      </TumpukanPasar.Screen>

      <TumpukanPasar.Screen name="Zona" options={{ title: 'Zona & level' }}>
        {({ route }) => <LayarZona m={route.params.mesin} desimal={route.params.desimal} />}
      </TumpukanPasar.Screen>
    </TumpukanPasar.Navigator>
  );
}

function AlurLain({ setelan }: { setelan: Setelan }) {
  return (
    <TumpukanLain.Navigator screenOptions={OPSI_TUMPUKAN}>
      <TumpukanLain.Screen name="Lainnya" options={{ title: 'Lainnya' }}>
        {({ navigation }) => (
          <LayarLainnya
            setelan={setelan}
            versi={VERSI}
            bukaDokumen={(k) => { navigation.navigate('Dokumen', { kunci: k }); }}
            bukaMenu={(k) => { navigation.navigate(KE_LAYAR[k] ?? 'Belajar'); }}
          />
        )}
      </TumpukanLain.Screen>
      <TumpukanLain.Screen name="Belajar" component={LayarBelajar} options={{ title: 'Belajar' }} />
      <TumpukanLain.Screen name="Profil" component={LayarProfil} options={{ title: 'Profil' }} />
      <TumpukanLain.Screen name="Kabar" component={LayarKabar} options={{ title: 'Kabar' }} />
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
            tabBarStyle: { backgroundColor: W.latar, borderTopColor: W.garis, height: 58, paddingTop: 4 },
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
                bukaChart={() => { navigation.navigate('chart'); }}
                bukaPasar={() => { navigation.navigate('pasar'); }}
                bukaMenu={(k) => { navigation.navigate('lainnya', { screen: KE_LAYAR[k] ?? 'Belajar' }); }}
              />
            )}
          </Tab.Screen>

          <Tab.Screen name="pasar" options={{ title: 'Pasar', tabBarIcon: ikonTab('pasar') }}>
            {() => <AlurPasar setelan={setelan} simpan={simpan} />}
          </Tab.Screen>

          <Tab.Screen name="chart" options={{ title: 'Analisis', headerShown: true, ...OPSI_KEPALA, tabBarIcon: ikonTab('analisis') }}>
            {() => <LayarChartTerakhir setelan={setelan} simpan={simpan} />}
          </Tab.Screen>

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
            {() => <AlurLain setelan={setelan} />}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
