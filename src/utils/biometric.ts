import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';

// 1. Cek apakah HP mendukung biometrik/PIN
export const checkBiometricHardware = async () => {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && isEnrolled;
};

// 2. Fungsi untuk memicu verifikasi Biometrik / PIN HP
export const authenticateBiometric = async (): Promise<boolean> => {
  try {
    const isAvailable = await checkBiometricHardware();
    if (!isAvailable) {
      Alert.alert('Perhatian', 'Biometrik atau keamanan PIN/Kunci Layar belum diatur di HP ini.');
      return false;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Otentikasi untuk membuka InvenGo',
      fallbackLabel: 'Gunakan PIN / Password HP',
      disableDeviceFallback: false,
    });

    return result.success;
  } catch (error) {
    console.error('Biometric Error:', error);
    return false;
  }
};