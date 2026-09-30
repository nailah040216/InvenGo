import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';

export default function SetPinScreen() {
  const router = useRouter();
  const [pin, setPin] = useState('');

  const handleKeyPress = (num: string) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);

      // Otomatis verifikasi saat PIN sudah 6 digit
      if (newPin.length === 6) {
        Alert.alert('PIN Dibuat', 'PIN Keamanan Anda berhasil disimpan!', [
          { text: 'Masuk ke Dashboard', onPress: () => router.replace('/') },
        ]);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Atur 6-Digit PIN InvenGo</Text>

      {/* Indicator Titik PIN */}
      <View style={styles.dotsContainer}>
        {[...Array(6)].map((_, i) => (
          <View key={i} style={[styles.dot, pin.length > i && styles.dotFilled]} />
        ))}
      </View>

      {/* Numpad Keypad */}
      <View style={styles.numpad}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((item) => (
          <TouchableOpacity key={item} style={styles.numBtn} onPress={() => handleKeyPress(item)}>
            <Text style={styles.numText}>{item}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.numBtn} onPress={handleDelete}>
          <Text style={styles.numText}>⌫</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.numBtn} onPress={() => handleKeyPress('0')}>
          <Text style={styles.numText}>0</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 30, color: '#1F2937' },
  dotsContainer: { flexDirection: 'row', marginBottom: 40 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: '#9CA3AF', marginHorizontal: 8 },
  dotFilled: { backgroundColor: '#10B981', borderColor: '#10B981' },
  numpad: { flexDirection: 'row', flexWrap: 'wrap', width: 280, justifyContent: 'center' },
  numBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', margin: 10 },
  numText: { fontSize: 22, fontWeight: 'bold', color: '#1F2937' },
});