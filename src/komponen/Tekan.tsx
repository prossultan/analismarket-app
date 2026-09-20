/**
 * TEKAN — umpan balik tekan untuk SEMUA yang bisa ditekan, satu pintu.
 *
 * Skala 0,97 dalam 120 ms lewat transisi CSS Reanimated: tidak ada nilai
 * bersama, tidak ada worklet, dan `setState`-nya cuma dua kali per tekanan,
 * bukan per frame. Untuk sesuatu yang disentuh puluhan kali sehari, ini
 * batas atas yang masih terasa "ada" tanpa pernah terasa "menunggu".
 *
 * Umpan baliknya di PRESS-IN, bukan di lepas: yang dirasakan orang sebagai
 * lambat adalah jeda antara jari menyentuh dan layar menjawab.
 *
 * Gerak-dikurangi (setelan sistem): skalanya dibuang, tinggal peredupan
 * — perubahan keadaan tetap terlihat, yang bergerak tidak ada.
 */
import { useState, type ReactNode } from 'react';
import { Pressable, type AccessibilityRole, type AccessibilityState, type GestureResponderEvent, type Insets, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { KURVA_KELUAR, MS, SKALA_TEKAN, type GayaGerak } from '../gaya/gerak';

type Props = {
  children: ReactNode;
  onPress?: ((e: GestureResponderEvent) => void) | undefined;
  onLongPress?: ((e: GestureResponderEvent) => void) | undefined;
  disabled?: boolean;
  /** Gaya kotak yang ikut mengecil — bukan gaya Pressable-nya. */
  gaya?: StyleProp<ViewStyle>;
  /** Gaya Pressable luar (flex, padding). Tidak ikut diskalakan. */
  gayaLuar?: StyleProp<ViewStyle>;
  hitSlop?: number | Insets;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  accessibilityLabel?: string;
  /** Skala tekan; bawaan 0,97. Kartu besar boleh 0,985 supaya tidak "melompat". */
  skala?: number;
};

export function Tekan({
  children, onPress, onLongPress, disabled = false, gaya, gayaLuar, hitSlop,
  accessibilityRole = 'button', accessibilityState, accessibilityLabel, skala = SKALA_TEKAN,
}: Props) {
  const [ditekan, setDitekan] = useState(false);
  const tenang = useReducedMotion();
  const aktif = ditekan && !disabled;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      onPressIn={() => { setDitekan(true); }}
      onPressOut={() => { setDitekan(false); }}
      hitSlop={hitSlop}
      pressRetentionOffset={16}
      style={gayaLuar}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View
        style={[
          g.kotak,
          gaya,
          tenang
            ? aktif && { opacity: 0.72 }
            : aktif && { transform: [{ scale: skala }] },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

const g = {
  kotak: {
    transform: [{ scale: 1 }],
    opacity: 1,
    transitionProperty: ['transform', 'opacity'],
    transitionDuration: MS.tekan,
    transitionTimingFunction: KURVA_KELUAR,
  } satisfies GayaGerak,
};
