import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { setLocalStorage } from "../utils/storage";

export default function Register() {
  const router = useRouter();

  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = async () => {
    // Cek apakah semua data sudah diisi
    if (!nama || !email || !password || !confirmPassword) {
      Alert.alert("Pendaftaran Gagal", "Semua data wajib diisi.");
      return;
    }

    // Cek password
    if (password !== confirmPassword) {
      Alert.alert(
        "Pendaftaran Gagal",
        "Password dan konfirmasi password tidak sama.",
      );
      return;
    }

    // Password minimal 6 karakter
    if (password.length < 6) {
      Alert.alert("Pendaftaran Gagal", "Password minimal 6 karakter.");
      return;
    }

    // Menyimpan data akun
    await setLocalStorage("registeredName", nama);

    await setLocalStorage("registeredEmail", email);

    await setLocalStorage("registeredPassword", password);

    // Setelah daftar, pengguna belum login
    await setLocalStorage("isLoggedIn", "false");

    Alert.alert(
      "Pendaftaran Berhasil",
      "Akun berhasil dibuat. Silakan login.",
      [
        {
          text: "OK",
          onPress: () => {
            router.replace("/login");
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.logo}>InvenGo</Text>

        <Text style={styles.title}>Buat Akun</Text>

        <Text style={styles.subtitle}>
          Daftarkan akun untuk menggunakan InvenGo.
        </Text>

        {/* NAMA */}
        <Text style={styles.label}>Nama</Text>

        <TextInput
          style={styles.input}
          placeholder="Masukkan nama"
          placeholderTextColor="#94A3B8"
          value={nama}
          onChangeText={setNama}
        />

        {/* EMAIL */}
        <Text style={styles.label}>Email</Text>

        <TextInput
          style={styles.input}
          placeholder="Masukkan email"
          placeholderTextColor="#94A3B8"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* PASSWORD */}
        <Text style={styles.label}>Password</Text>

        <TextInput
          style={styles.input}
          placeholder="Masukkan password"
          placeholderTextColor="#94A3B8"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* KONFIRMASI PASSWORD */}
        <Text style={styles.label}>Konfirmasi Password</Text>

        <TextInput
          style={styles.input}
          placeholder="Ulangi password"
          placeholderTextColor="#94A3B8"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        {/* TOMBOL DAFTAR */}
        <TouchableOpacity
          style={styles.registerButton}
          onPress={handleRegister}
        >
          <Text style={styles.registerText}>Daftar</Text>
        </TouchableOpacity>

        {/* KEMBALI KE LOGIN */}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.replace("/login")}
        >
          <Text style={styles.loginText}>Sudah punya akun? Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    padding: 24,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    elevation: 5,
  },

  logo: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#4F46E5",
    textAlign: "center",
    marginBottom: 15,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E293B",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 6,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
    color: "#1E293B",
  },

  registerButton: {
    backgroundColor: "#4F46E5",
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },

  registerText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  loginButton: {
    marginTop: 18,
    alignItems: "center",
  },

  loginText: {
    color: "#4F46E5",
    fontSize: 14,
    fontWeight: "600",
  },
});
