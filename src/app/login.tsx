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

import { getLocalStorage, setLocalStorage } from "../utils/storage";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    // Jika email atau password kosong
    if (!email || !password) {
      Alert.alert("Login Gagal", "Email dan password wajib diisi.");
      return;
    }

    // Mengambil data akun yang sudah didaftarkan
    const registeredEmail = await getLocalStorage("registeredEmail");

    const registeredPassword = await getLocalStorage("registeredPassword");

    // Jika belum mempunyai akun
    if (!registeredEmail || !registeredPassword) {
      Alert.alert("Akun Belum Terdaftar", "Silakan daftar terlebih dahulu.");
      return;
    }

    // Mengecek email dan password
    if (email !== registeredEmail || password !== registeredPassword) {
      Alert.alert("Login Gagal", "Email atau password salah.");
      return;
    }

    // Menyimpan status bahwa pengguna sudah login
    await setLocalStorage("isLoggedIn", "true");

    // Menyimpan email pengguna
    await setLocalStorage("userEmail", email);

    // Masuk ke dashboard
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.logo}>InvenGo</Text>

        <Text style={styles.title}>Selamat Datang</Text>

        <Text style={styles.subtitle}>
          Silakan login untuk masuk ke sistem inventaris.
        </Text>

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

        {/* TOMBOL LOGIN */}
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>

        {/* MENU DAFTAR */}
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => router.push("/register")}
        >
          <Text style={styles.registerText}>Belum punya akun? Daftar</Text>
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
    marginBottom: 20,
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
    marginBottom: 24,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 6,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
    color: "#1E293B",
  },

  loginButton: {
    backgroundColor: "#4F46E5",
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  loginText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  registerButton: {
    marginTop: 18,
    alignItems: "center",
  },

  registerText: {
    color: "#4F46E5",
    fontSize: 14,
    fontWeight: "600",
  },
});
