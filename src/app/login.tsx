import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const STORAGE_KEYS = {
  USER_EMAIL: "@invengo_user_email",
  USER_PASSWORD: "@invengo_user_password",
  IS_LOGGED_IN: "@invengo_is_logged_in",
  THEME_MODE: "@invengo_theme_mode",
};

export default function LoginScreen() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE);
      if (savedTheme === "dark") setIsDarkMode(true);
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, newMode ? "dark" : "light");
  };

  const showAlert = (title: string, msg: string, onPressOk?: () => void) => {
    if (Platform.OS === "web") {
      alert(`${title}: ${msg}`);
      if (onPressOk) onPressOk();
    } else {
      Alert.alert(title, msg, [{ text: "OK", onPress: onPressOk }]);
    }
  };

  const handleRegister = async () => {
    if (!email.trim() || !password.trim()) {
      return showAlert("Peringatan", "Harap isi Email dan Password!");
    }
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_EMAIL, email.trim());
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PASSWORD, password);

      showAlert("Registrasi Berhasil", "Akun berhasil dibuat. Silakan login!", () => {
        setPassword("");
        setIsRegister(false);
      });
    } catch (e) {
      showAlert("Error", "Gagal menyimpan data pendaftaran.");
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      return showAlert("Peringatan", "Harap isi Email dan Password!");
    }
    try {
      const savedEmail = await AsyncStorage.getItem(STORAGE_KEYS.USER_EMAIL);
      const savedPassword = await AsyncStorage.getItem(STORAGE_KEYS.USER_PASSWORD);

      if (email.trim() === savedEmail && password === savedPassword) {
        await AsyncStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, "true");
        router.replace("/");
      } else {
        showAlert("Gagal Login", "Email atau Password tidak cocok / Akun belum terdaftar!");
      }
    } catch (e) {
      showAlert("Error", "Gagal memproses login.");
    }
  };

  const theme = {
    bg: isDarkMode ? "#0F172A" : "#F8FAFC",
    cardBg: isDarkMode ? "#1E293B" : "#FFFFFF",
    headerBg: isDarkMode ? "#1E293B" : "#1E293B",
    textPrimary: isDarkMode ? "#F8FAFC" : "#0F172A",
    textSecondary: isDarkMode ? "#94A3B8" : "#334155",
    borderColor: isDarkMode ? "#334155" : "#E2E8F0",
    inputBg: isDarkMode ? "#0F172A" : "#FFFFFF",
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <Text style={styles.headerTitle}>InvenGo</Text>
        <TouchableOpacity onPress={toggleTheme}>
          <Ionicons name={isDarkMode ? "sunny" : "moon"} size={22} color="#FFD700" />
        </TouchableOpacity>
      </View>

      <View style={styles.authWrapper}>
        <View style={[styles.authCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
          <Text style={[styles.authTitle, { color: theme.textPrimary }]}>
            {isRegister ? "Daftar Akun InvenGo" : "Masuk ke InvenGo"}
          </Text>

          <Text style={[styles.label, { color: theme.textSecondary }]}>Email</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.textPrimary }]}
            placeholder="Masukkan Email"
            placeholderTextColor="#94A3B8"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={[styles.label, { color: theme.textSecondary }]}>Password</Text>
          <View style={[styles.passwordContainer, { backgroundColor: theme.inputBg, borderColor: theme.borderColor }]}>
            <TextInput
              style={[styles.passwordInput, { color: theme.textPrimary }]}
              placeholder="Masukkan Password"
              placeholderTextColor="#94A3B8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? "eye" : "eye-off"} size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {isRegister ? (
            <>
              <TouchableOpacity style={styles.primaryButton} onPress={handleRegister}>
                <Text style={styles.buttonText}>Daftar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsRegister(false)} style={styles.switchAuthBtn}>
                <Text style={styles.switchAuthText}>Sudah punya akun? Login di sini</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
                <Text style={styles.buttonText}>Masuk</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsRegister(true)} style={styles.switchAuthBtn}>
                <Text style={styles.switchAuthText}>Belum punya akun? Register di sini</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: Platform.OS === "web" ? 16 : 40, paddingBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#FFFFFF" },
  authWrapper: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  authCard: { width: "100%", maxWidth: 400, padding: 24, borderRadius: 12, borderWidth: 1 },
  authTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 16 },
  passwordContainer: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 8, marginBottom: 20 },
  passwordInput: { flex: 1, padding: 12, fontSize: 15 },
  eyeIcon: { paddingHorizontal: 12, paddingVertical: 10 },
  primaryButton: { backgroundColor: "#4F46E5", paddingVertical: 14, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
  switchAuthBtn: { marginTop: 16, alignItems: "center", paddingVertical: 6 },
  switchAuthText: { color: "#4F46E5", fontSize: 14, fontWeight: "600" },
});