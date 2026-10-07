import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

// Helper Storage
const STORAGE_KEYS = {
  IS_LOGGED_IN: "IS_LOGGED_IN",
  USER_EMAIL: "USER_EMAIL",
  USER_PASSWORD: "USER_PASSWORD",
};

export default function App() {
  const [activeTab, setActiveTab] = useState("home");

  // State Autentikasi
  const [authState, setAuthState] = useState<"loading" | "register" | "login" | "authenticated">("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Cek Status Auth saat Aplikasi Pertama Kali Dibuka
  useEffect(() => {
    checkInitialAuth();
  }, []);

  const checkInitialAuth = async () => {
    try {
      // Ambil status login dari Local Storage
      const isLoggedIn = await AsyncStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN);
      // Ambil data akun dari Secure Storage
      const savedEmail = await SecureStore.getItemAsync(STORAGE_KEYS.USER_EMAIL);

      if (isLoggedIn === "true" && savedEmail) {
        setAuthState("authenticated");
      } else if (savedEmail) {
        setAuthState("login");
      } else {
        setAuthState("register");
      }
    } catch (e) {
      setAuthState("register");
    }
  };

  // Process Register
  const handleRegister = async () => {
    if (!email.trim() || !password.trim()) {
      return Alert.alert("Peringatan", "Harap isi Email dan Password!");
    }

    try {
      // Simpan credential secara aman di Secure Storage
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_EMAIL, email.trim());
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_PASSWORD, password);

      Alert.alert("Registrasi Berhasil", "Akun berhasil dibuat. Silakan login!", [
        {
          text: "OK",
          onPress: () => {
            setPassword("");
            setAuthState("login");
          },
        },
      ]);
    } catch (e) {
      Alert.alert("Error", "Gagal menyimpan data pendaftaran.");
    }
  };

  // Process Login
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      return Alert.alert("Peringatan", "Harap isi Email dan Password!");
    }

    try {
      const savedEmail = await SecureStore.getItemAsync(STORAGE_KEYS.USER_EMAIL);
      const savedPassword = await SecureStore.getItemAsync(STORAGE_KEYS.USER_PASSWORD);

      if (email.trim() === savedEmail && password === savedPassword) {
        // Simpan status login di Local Storage
        await AsyncStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, "true");
        setAuthState("authenticated");
      } else {
        Alert.alert("Gagal Login", "Email atau Password tidak cocok!");
      }
    } catch (e) {
      Alert.alert("Error", "Gagal memproses login.");
    }
  };

  // Process Logout
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.IS_LOGGED_IN);
      setAuthState("login");
    } catch (e) {
      Alert.alert("Error", "Gagal logout.");
    }
  };

  // Data Statistik Ringkas
  const stats = [
    {
      id: "1",
      title: "Total Barang",
      value: "1,428",
      unit: "Item",
      icon: "cube-outline",
      color: "#4F46E5",
      bgColor: "#EEF2FF",
      trend: "+12 item baru",
    },
    {
      id: "2",
      title: "Dipinjam",
      value: "86",
      unit: "Aktif",
      icon: "sync-outline",
      color: "#F59E0B",
      bgColor: "#FEF3C7",
      trend: "6 kembali hari ini",
    },
    {
      id: "3",
      title: "Rusak / Hilang",
      value: "12",
      unit: "Kasus",
      icon: "alert-circle-outline",
      color: "#EF4444",
      bgColor: "#FEE2E2",
      trend: "2 pending audit",
    },
  ] as const;

  // 3 Menu Utama Aplikasi
  const mainMenus = [
    {
      id: "daftar-barang",
      title: "Daftar Barang",
      subtitle: "Katalog & Stok Fisik",
      description:
        "Pantau ketersediaan barang, tambah aset baru, spesifikasi, dan manajemen kategori.",
      iconName: "archive-outline",
      tag: "Katalog",
      accentColor: "#4F46E5",
      badgeBg: "#EEF2FF",
    },
    {
      id: "transaksi-peminjaman",
      title: "Transaksi Peminjaman",
      subtitle: "Sirkulasi & Peminjaman",
      description:
        "Catat formulir peminjaman, persetujuan staf, riwayat mutasi, dan tenggat pengembalian.",
      iconName: "swap-horizontal-outline",
      tag: "Sirkulasi",
      accentColor: "#0EA5E9",
      badgeBg: "#E0F2FE",
    },
    {
      id: "pelacakan-laporan",
      title: "Pelacakan & Laporan",
      subtitle: "Audit & Analitik",
      description:
        "Lacak posisi aset via barcode/QR, ringkasan stok opname bulanan, dan ekspor laporan.",
      iconName: "analytics-outline",
      tag: "Analitik",
      accentColor: "#10B981",
      badgeBg: "#D1FAE5",
    },
  ] as const;

  const handleMenuPress = (menuTitle: string) => {
    Alert.alert("Navigasi Menu", "Membuka halaman " + menuTitle);
  };

  const handleActionPress = (actionName: string) => {
    if (actionName === "Profil Akun") {
      Alert.alert("Akun Pengguna", "Pilih aksi untuk sesi akun kamu", [
        { text: "Batal", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: handleLogout },
      ]);
      return;
    }
    Alert.alert("Aksi Cepat", "Menjalankan aksi: " + actionName);
  };

  // --- RENDERING FORM REGISTER / LOGIN ---
  if (authState === "loading") {
    return (
      <View style={[styles.safeArea, { justifyContent: "center", alignItems: "center" }]}>
        <ExpoStatusBar style="light" />
        <Text style={{ color: "#FFF", fontWeight: "600" }}>Memuat InvenGo...</Text>
      </View>
    );
  }

  if (authState === "register" || authState === "login") {
    const isRegister = authState === "register";
    return (
      <SafeAreaView style={styles.authContainer}>
        <ExpoStatusBar style="dark" />
        <View style={styles.authCard}>
          <View style={styles.authLogoWrapper}>
            <MaterialCommunityIcons name="cube-scan" size={36} color="#4F46E5" />
          </View>
          <Text style={styles.authTitle}>
            {isRegister ? "Registrasi Akun" : "Selamat Datang"}
          </Text>
          <Text style={styles.authSubtitle}>
            {isRegister
              ? "Buat akun baru untuk mengakses InvenGo"
              : "Masukkan email dan password terdaftar"}
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="nama@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={styles.primaryAuthButton}
            activeOpacity={0.8}
            onPress={isRegister ? handleRegister : handleLogin}
          >
            <Text style={styles.primaryAuthButtonText}>
              {isRegister ? "Daftar Sekarang" : "Masuk"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchAuthButton}
            onPress={() => setAuthState(isRegister ? "login" : "register")}
          >
            <Text style={styles.switchAuthText}>
              {isRegister
                ? "Sudah punya akun? Login di sini"
                : "Belum punya akun? Register di sini"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- RENDERING TAMPILAN UTAMA ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="light" />
      <View style={styles.headerBackground}>
        {/* Top Navbar */}
        <View style={styles.topNavbar}>
          <View style={styles.brandRow}>
            <View style={styles.headerLogoContainer}>
              <MaterialCommunityIcons
                name="cube-scan"
                size={28}
                color="#FFFFFF"
              />
            </View>
            <View>
              <Text style={styles.brandName}>InvenGo</Text>
              <Text style={styles.brandTagline}>Inventory Master System</Text>
            </View>
          </View>

          <View style={styles.topActions}>
            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.7}
              onPress={() => handleActionPress("Notifikasi")}
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color="#FFFFFF"
              />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.profileButton}
              activeOpacity={0.7}
              onPress={() => handleActionPress("Profil Akun")}
            >
              <Feather name="user" size={18} color="#3730A3" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Section / Deskripsi Singkat */}
        <View style={styles.heroContent}>
          <Text style={styles.heroGreeting}>
            Kelola Aset Lebih Cepat & Akurat 📦
          </Text>
          <Text style={styles.heroDescription}>
            Sistem terpadu manajemen inventaris untuk memonitor siklus aset,
            peminjaman, serta pelacakan kondisi secara real-time.
          </Text>

          {/* Quick Search & Scan Bar */}
          <View style={styles.quickBar}>
            <TouchableOpacity
              style={styles.searchFakeInput}
              activeOpacity={0.8}
              onPress={() => handleActionPress("Pencarian Barang")}
            >
              <Ionicons name="search" size={18} color="#64748B" />
              <Text style={styles.searchPlaceholder}>
                Cari kode SKU, nama barang...
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.scanButton}
              activeOpacity={0.8}
              onPress={() => handleActionPress("Scan QR/Barcode")}
            >
              <Ionicons name="qr-code-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Konten Scrollable */}
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Section 1: Statistik Ringkas */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Ringkasan Inventaris</Text>
            <Text style={styles.sectionSubtitle}>Update data per hari ini</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleActionPress("Segarkan Data")}
          >
            <Text style={styles.linkText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          {stats.map((item) => (
            <View key={item.id} style={styles.statCard}>
              <View style={styles.statTopRow}>
                <View
                  style={[
                    styles.statIconWrapper,
                    { backgroundColor: item.bgColor },
                  ]}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={22}
                    color={item.color}
                  />
                </View>
                <Text
                  style={[
                    styles.statUnit,
                    { color: item.color, backgroundColor: item.bgColor },
                  ]}
                >
                  {item.unit}
                </Text>
              </View>

              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statTitle}>{item.title}</Text>

              <View style={styles.statTrendRow}>
                <Feather name={"info" as any} size={11} color="#64748B" />
                <Text style={styles.statTrendText} numberOfLines={1}>
                  {item.trend}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Section 2: Tiga Menu Utama */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <View>
            <Text style={styles.sectionTitle}>Menu Utama</Text>
            <Text style={styles.sectionSubtitle}>
              Navigasi fungsional InvenGo
            </Text>
          </View>
        </View>

        <View style={styles.menuContainer}>
          {mainMenus.map((menu) => (
            <TouchableOpacity
              key={menu.id}
              style={styles.menuCard}
              activeOpacity={0.75}
              onPress={() => handleMenuPress(menu.title)}
            >
              <View
                style={[
                  styles.menuIconContainer,
                  { backgroundColor: menu.badgeBg },
                ]}
              >
                <Ionicons
                  name={menu.iconName as any}
                  size={28}
                  color={menu.accentColor}
                />
              </View>

              <View style={styles.menuContent}>
                <View style={styles.menuTitleRow}>
                  <Text style={styles.menuTitle}>{menu.title}</Text>
                  <View
                    style={[styles.tagBadge, { backgroundColor: menu.badgeBg }]}
                  >
                    <Text style={[styles.tagText, { color: menu.accentColor }]}>
                      {menu.tag}
                    </Text>
                  </View>
                </View>
                <Text style={styles.menuSubtitle}>{menu.subtitle}</Text>
                <Text style={styles.menuDescription}>{menu.description}</Text>
              </View>

              <View style={styles.menuChevron}>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Banner Stok Opname / Audit */}
        <View style={styles.auditBanner}>
          <View style={styles.auditTextCol}>
            <View style={styles.auditHeaderRow}>
              <Ionicons name="shield-checkmark" size={18} color="#059669" />
              <Text style={styles.auditTag}>Jadwal Audit Berkala</Text>
            </View>
            <Text style={styles.auditTitle}>Stok Opname Q3 Segera Dimulai</Text>
            <Text style={styles.auditDesc}>
              Pastikan verifikasi fisik barang telah disinkronkan sebelum
              tanggal 30 bulan ini.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.auditButton}
            activeOpacity={0.8}
            onPress={() => handleActionPress("Detail Audit")}
          >
            <Text style={styles.auditButtonText}>Lihat</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab("home")}
        >
          <Ionicons
            name={activeTab === "home" ? "home" : "home-outline"}
            size={22}
            color={activeTab === "home" ? "#4F46E5" : "#94A3B8"}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === "home" && styles.navLabelActive,
            ]}
          >
            Beranda
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab("items")}
        >
          <Ionicons
            name={activeTab === "items" ? "cube" : "cube-outline"}
            size={22}
            color={activeTab === "items" ? "#4F46E5" : "#94A3B8"}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === "items" && styles.navLabelActive,
            ]}
          >
            Barang
          </Text>
        </TouchableOpacity>

        {/* Center Floating Action Button (FAB) */}
        <TouchableOpacity
          style={styles.centerFab}
          activeOpacity={0.85}
          onPress={() => handleActionPress("Tambah Barang Baru")}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab("history")}
        >
          <Ionicons
            name={activeTab === "history" ? "time" : "time-outline"}
            size={22}
            color={activeTab === "history" ? "#4F46E5" : "#94A3B8"}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === "history" && styles.navLabelActive,
            ]}
          >
            Riwayat
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab("settings")}
        >
          <Ionicons
            name={activeTab === "settings" ? "settings" : "settings-outline"}
            size={22}
            color={activeTab === "settings" ? "#4F46E5" : "#94A3B8"}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === "settings" && styles.navLabelActive,
            ]}
          >
            Pengaturan
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#3730A3",
  },
  // PERBAIKAN TAMPILAN KEBAWAH:
  headerBackground: {
    backgroundColor: "#3730A3",
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight : 10, // Dikurangi agar header lebih ke atas
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  topNavbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerLogoContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  brandName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: 11,
    color: "#C7D2FE",
    fontWeight: "500",
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#3730A3",
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  heroContent: {
    marginTop: 2,
  },
  heroGreeting: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  heroDescription: {
    fontSize: 12,
    color: "#E0E7FF",
    lineHeight: 17,
    marginBottom: 12,
  },
  quickBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchFakeInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchPlaceholder: {
    fontSize: 12,
    color: "#94A3B8",
  },
  scanButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  sectionSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  linkText: {
    fontSize: 12,
    color: "#4F46E5",
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    elevation: 2,
  },
  statTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  statUnit: {
    fontSize: 9,
    fontWeight: "700",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  statTitle: {
    fontSize: 10,
    color: "#475569",
    fontWeight: "600",
    marginTop: 2,
    marginBottom: 6,
  },
  statTrendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: "#F8FAFC",
    paddingTop: 4,
  },
  statTrendText: {
    fontSize: 9,
    color: "#64748B",
    flex: 1,
  },
  menuContainer: {
    gap: 10,
  },
  menuCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 2,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  tagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 9,
    fontWeight: "700",
  },
  menuSubtitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 2,
  },
  menuDescription: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 15,
  },
  menuChevron: {
    marginLeft: 6,
  },
  auditBanner: {
    marginTop: 18,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  auditTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  auditHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  auditTag: {
    fontSize: 10,
    fontWeight: "700",
    color: "#065F46",
    textTransform: "uppercase",
  },
  auditTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#064E3B",
    marginBottom: 2,
  },
  auditDesc: {
    fontSize: 11,
    color: "#047857",
    lineHeight: 15,
  },
  auditButton: {
    backgroundColor: "#059669",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  auditButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  bottomNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    height: 60,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  navLabel: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 2,
    fontWeight: "500",
  },
  navLabelActive: {
    color: "#4F46E5",
    fontWeight: "700",
  },
  centerFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    marginTop: -24,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    elevation: 6,
  },

  // STYLES HALAMAN AUTHENTICATION (REGISTER / LOGIN)
  authContainer: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  authCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    elevation: 4,
  },
  authLogoWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 4,
  },
  authSubtitle: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  primaryAuthButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },
  primaryAuthButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  switchAuthButton: {
    marginTop: 16,
    alignItems: "center",
  },
  switchAuthText: {
    color: "#4F46E5",
    fontSize: 12,
    fontWeight: "600",
  },
});