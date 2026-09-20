/**
 * TEKAN — umpan balik tekan untuk SEMUA yang bisa ditekan, satu pintu.
 *
 * Versi pertama: transisi CSS 0,97 / 120 ms — batas "nyaris tak terasa"
 * menurut skill. Pemilik mencobanya di HP: KAKU. Sekarang:
 *
 * - Jari menyentuh → turun ke 0,95 dalam 90 ms (seketika, tanpa pantulan).
 * - Jari lepas → BALIK DENGAN PEGAS yang sedikit melewati 1 lalu diam.
 *   Yang terasa "empuk" adalah pantulan baliknya; tanpa itu tekan cuma
 *   mengecil-membesar, dan itulah yang terasa kaku.
 * - Semuanya nilai bersama di UI thread: onPressIn cuma menulis satu angka,
 *   React tidak merender ulang apa pun.
 *
 * Gerak-dikurangi: skalanya dibuang, tinggal peredupan.
 */
import { type ReactNode } from 'react';
import { Pressable, type AccessibilityRole, type AccessibilityState, type GestureResponderEvent, type Insets, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { EASE_KELUAR, MS_TURUN, PEGAS_EMPUK, SKALA_TEKAN } from '../gaya/gerak';

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
  /** Skala tekan; bawaan 0,95. Baris selebar layar 0,975 supaya tidak "melompat". */
  skala?: number;
};

export function Tekan({
  children, onPress, onLongPress, disabled = false, gaya, gayaLuar, hitSlop,
  accessibilityRole = 'button', accessibilityState, accessibilityLabel, skala = SKALA_TEKAN,
}: Props) {
  const tenang = useReducedMotion();
  const s = useSharedValue(1);
  const redup = useSharedValue(1);

  const turun = (): void => {
    if (disabled) return;
    if (tenang) { redup.set(withTiming(0.72, { duration: MS_TURUN })); return; }
    s.set(withTiming(skala, { duration: MS_TURUN, easing: EASE_KELUAR }));
  };
  const naik = (): void => {
    if (tenang) { redup.set(withTiming(1, { duration: 160 })); return; }
    s.set(withSpring(1, { ...PEGAS_EMPUK, reduceMotion: ReduceMotion.System }));
  };

  const gerak = useAnimatedStyle(() => ({ transform: [{ scale: s.get() }], opacity: redup.get() }));

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      onPressIn={turun}
      onPressOut={naik}
      hitSlop={hitSlop}
      pressRetentionOffset={16}
      style={gayaLuar}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[gaya, gerak]}>{children}</Animated.View>
    </Pressable>
  );
}
