import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { authenticateBiometric } from '../utils/biometric';
import { saveLocalStorage } from '../utils/storage'; // 1. Import storage

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Peringatan', 'Isi email dan password.');
      return;
    }

    // 2. Simpan status login & email sebelum pindah halaman
    await saveLocalStorage('isLoggedIn', 'true');
    await saveLocalStorage('userEmail', email);

    router.replace('/' as any); 
  };

  const handleBiometricAuth = async () => {
    const success = await authenticateBiometric();
    if (success) {
      // 3. Simpan juga status login jika lewat Biometric
      await saveLocalStorage('isLoggedIn', 'true');

      Alert.alert('Berhasil', 'Otentikasi Biometrik Sukses!', [
        { text: 'Lanjut', onPress: () => router.replace('/' as any) },
      ]);
    } else {
      Alert.alert('Gagal', 'Otentikasi biometrik dibatalkan atau tidak cocok.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Masuk ke InvenGo</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Masuk</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.biometricBtn} onPress={handleBiometricAuth}>
        <Text style={styles.biometricText}>🔒 Masuk dengan Biometric / PIN HP</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/register' as any)} style={{ marginTop: 20 }}>
        <Text style={styles.linkText}>Belum punya akun? Daftar sekarang</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#10B981' },
  input: { borderWidth: 1, borderColor: '#D1D5DB', padding: 12, borderRadius: 8, marginBottom: 15 },
  button: { backgroundColor: '#10B981', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  biometricBtn: { marginTop: 15, padding: 12, borderWidth: 1, borderColor: '#10B981', borderRadius: 8, alignItems: 'center' },
  biometricText: { color: '#10B981', fontWeight: '600' },
  linkText: { color: '#3B82F6', textAlign: 'center' },
});