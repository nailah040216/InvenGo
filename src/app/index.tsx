import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Redirect, useRouter } from "expo-router";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { removeLocalStorage } from "../utils/storage";

const STORAGE_KEYS = {
  USER_EMAIL: "@invengo_user_email",
  USER_TOKEN: "@invengo_user_token",
  IS_LOGGED_IN: "@invengo_is_logged_in",
  THEME_MODE: "@invengo_theme_mode",
};

interface InventoryItem {
  id: string;
  sku: string;
  nama: string;
  kategori: string;
  stok: number;
  foto?: string | null;
}

export default function IndexScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();

  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState("home");
  const [userEmail, setUserEmail] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // State untuk pencarian, scanner, modal & data
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Sample data barang
  const [barangList, setBarangList] = useState<InventoryItem[]>([
    {
      id: "1",
      sku: "SKU-1001",
      nama: "Laptop Asus ROG",
      kategori: "Elektronik",
      stok: 8,
      foto: null,
    },
    {
      id: "2",
      sku: "SKU-1002",
      nama: "Proyektor Epson",
      kategori: "Elektronik",
      stok: 3,
      foto: null,
    },
    {
      id: "3",
      sku: "SKU-1003",
      nama: "Kabel HDMI 10m",
      kategori: "Aksesoris",
      stok: 15,
      foto: null,
    },
  ]);

  // Tema warna
  const theme = {
    bg: isDarkMode ? "#0F172A" : "#F8FAFC",
    cardBg: isDarkMode ? "#1E293B" : "#FFFFFF",
    headerBg: isDarkMode ? "#1E1B4B" : "#4F46E5",
    textPrimary: isDarkMode ? "#F8FAFC" : "#0F172A",
    textSecondary: isDarkMode ? "#94A3B8" : "#64748B",
    borderColor: isDarkMode ? "#334155" : "#E2E8F0",
    inputBg: isDarkMode ? "#334155" : "#EEF2FF",
  };

  // Toggle Dark/Light Mode
  const toggleTheme = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    await AsyncStorage.setItem(
      STORAGE_KEYS.THEME_MODE,
      newMode ? "dark" : "light",
    );
  };

  // Pengecekan Status Login dari Local Storage
  useEffect(() => {
    let isMounted = true;
    const checkAuthAndTheme = async () => {
      try {
        const loggedIn = await AsyncStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN);
        const savedEmail = await AsyncStorage.getItem(STORAGE_KEYS.USER_EMAIL);
        const savedTheme = await AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE);

        if (savedTheme === "dark") setIsDarkMode(true);

        if (loggedIn === "true") {
          if (isMounted) {
            setIsLoggedIn(true);
            if (savedEmail) setUserEmail(savedEmail);
          }
        } else {
          if (isMounted) setIsLoggedIn(false);
          router.replace("/login");
        }
      } catch (error) {
        if (isMounted) setIsLoggedIn(false);
        router.replace("/login");
      }
    };

    checkAuthAndTheme();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handler Aksi
  const fetchApiData = () => {
    setIsLoadingApi(true);
    setErrorMessage(null);
    setTimeout(() => {
      setIsLoadingApi(false);
    }, 1200);
  };

  const handleLogout = () => {
    Alert.alert("Konfirmasi Logout", "Apakah Anda yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Keluar",
        style: "destructive",
        onPress: async () => {
          await removeLocalStorage("isLoggedIn");
          setIsLoggedIn(false);
        },
      },
    ]);
  };

  const handleHeaderCamera = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert("Izin Ditolak", "Izin kamera diperlukan untuk fitur ini.");
        return;
      }
    }
    setIsScannerVisible(true);
  };

  const handleOpenScanner = async () => {
    setScanned(false);
    await handleHeaderCamera();
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    setIsScannerVisible(false);
    Alert.alert("QR Code Terdeteksi", `Hasil Scan: ${data}`);
  };

  // Filter pencarian
  const filteredBarang = barangList.filter(
    (item) =>
      item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kategori.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // 1. Tampilan Loading saat membaca Local Storage
  if (isLoggedIn === null) {
    return (
      <View
        style={[
          styles.loadingContainer,
          isDarkMode && { backgroundColor: "#0F172A" },
        ]}
      >
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  // 2. Pengalihan Otomatis jika status login adalah false
  if (!isLoggedIn) {
    return <Redirect href="/login" />;
  }

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
  ];

  // Menu Utama Aplikasi (Termasuk Fitur Penugasan Todo List Async)
  const mainMenus = [
    {
      id: "todo-list-async",
      route: "/todo",
      title: "Todo List Async (Tugas)",
      subtitle: "6 Fitur Wajib Week 9",
      description:
        "Tampilkan data API (GET), loading, tambah todo (POST), ubah status (PATCH), error handling & pull-to-refresh.",
      iconName: "checkbox-outline",
      tag: "Penugasan",
      accentColor: "#8B5CF6",
      badgeBg: "#F3E8FF",
    },
    {
      id: "daftar-barang",
      tabKey: "items",
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
      tabKey: "history",
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
      tabKey: "tracking",
      title: "Pelacakan & Laporan",
      subtitle: "Audit & Analitik",
      description:
        "Lacak posisi aset via barcode/QR, ringkasan stok opname bulanan, dan ekspor laporan.",
      iconName: "analytics-outline",
      tag: "Analitik",
      accentColor: "#10B981",
      badgeBg: "#D1FAE5",
    },
  ];

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.headerBg }]}>
      <ExpoStatusBar style="light" />

      {/* Header Utama */}
      <View
        style={[
          styles.headerBackground,
          {
            backgroundColor: theme.headerBg,
            paddingTop: Math.max(insets.top, 10),
          },
        ]}
      >
        <View style={styles.topNavbar}>
          <View style={styles.brandRow}>
            <View style={styles.headerLogoContainer}>
              <MaterialCommunityIcons
                name="cube-scan"
                size={26}
                color="#FFFFFF"
              />
            </View>
            <View>
              <Text style={styles.brandName}>InvenGo</Text>
              <Text style={styles.brandTagline}>
                {userEmail || "Inventory Master System"}
              </Text>
            </View>
          </View>

          <View style={styles.topActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleHeaderCamera}
              activeOpacity={0.7}
            >
              <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={toggleTheme}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isDarkMode ? "sunny" : "moon"}
                size={20}
                color="#FFD700"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.profileButton}
              activeOpacity={0.7}
              onPress={handleLogout}
            >
              <Feather name="log-out" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.heroContent}>
          <Text style={styles.heroGreeting}>
            Kelola Aset Lebih Cepat & Akurat 📦
          </Text>
          <Text style={styles.heroDescription}>
            Sistem terpadu manajemen inventaris untuk memonitor siklus aset,
            peminjaman, serta pelacakan kondisi secara real-time.
          </Text>

          <View style={styles.quickBar}>
            <View
              style={[
                styles.searchInputContainer,
                { backgroundColor: theme.inputBg },
              ]}
            >
              <Ionicons name="search" size={18} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.textPrimary }]}
                placeholder="Cari kode SKU, nama barang, kategori..."
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={handleOpenScanner}
              activeOpacity={0.7}
            >
              <Ionicons name="qr-code-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Konten Utama */}
      <ScrollView
        style={[styles.scrollContainer, { backgroundColor: theme.bg }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {isLoadingApi && (
          <View
            style={[
              styles.statusBanner,
              { backgroundColor: theme.cardBg, borderColor: theme.borderColor },
            ]}
          >
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text
              style={{ color: theme.textPrimary, marginLeft: 10, fontSize: 13 }}
            >
              Memuat data... Mohon tunggu sebentar.
            </Text>
          </View>
        )}

        {searchQuery.length > 0 ? (
          <View style={{ marginBottom: 20 }}>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.textPrimary, marginBottom: 12 },
              ]}
            >
              Hasil Pencarian ({filteredBarang.length})
            </Text>

            {filteredBarang.length === 0 ? (
              <View
                style={[
                  styles.emptyBox,
                  {
                    backgroundColor: theme.cardBg,
                    borderColor: theme.borderColor,
                  },
                ]}
              >
                <Text style={{ color: theme.textSecondary }}>
                  Barang atau SKU tidak ditemukan.
                </Text>
              </View>
            ) : (
              filteredBarang.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.searchCard,
                    {
                      backgroundColor: theme.cardBg,
                      borderColor: theme.borderColor,
                    },
                  ]}
                >
                  {item.foto && (
                    <Image
                      source={{ uri: item.foto }}
                      style={{
                        width: 45,
                        height: 45,
                        borderRadius: 8,
                        marginRight: 10,
                      }}
                    />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.searchCardTitle,
                        { color: theme.textPrimary },
                      ]}
                    >
                      {item.nama}
                    </Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                      {item.sku} | {item.kategori}
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: item.stok < 5 ? "#EF4444" : "#4F46E5",
                      fontWeight: "bold",
                    }}
                  >
                    {item.stok < 5
                      ? `Stok Menipis: ${item.stok}`
                      : `Stok: ${item.stok}`}
                  </Text>
                </View>
              ))
            )}
          </View>
        ) : null}

        {activeTab === "home" && searchQuery.length === 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Ringkasan Inventaris
              </Text>
              <Text
                style={[styles.sectionSubtitle, { color: theme.textSecondary }]}
              >
                Data Ringkasan System InvenGo
              </Text>
            </View>

            <View style={styles.statsGrid}>
              {stats.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.statCard,
                    {
                      backgroundColor: theme.cardBg,
                      borderColor: theme.borderColor,
                    },
                  ]}
                >
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
                  <Text
                    style={[styles.statValue, { color: theme.textPrimary }]}
                  >
                    {item.value}
                  </Text>
                  <Text
                    style={[styles.statTitle, { color: theme.textSecondary }]}
                  >
                    {item.title}
                  </Text>
                  <View
                    style={[
                      styles.statTrendRow,
                      { borderTopColor: theme.borderColor },
                    ]}
                  >
                    <Feather
                      name="info"
                      size={11}
                      color={theme.textSecondary}
                    />
                    <Text
                      style={[
                        styles.statTrendText,
                        { color: theme.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {item.trend}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Menu Utama
              </Text>
              <Text
                style={[styles.sectionSubtitle, { color: theme.textSecondary }]}
              >
                Navigasi fungsional InvenGo
              </Text>
            </View>

            <View style={styles.menuContainer}>
              {mainMenus.map((menu) => (
                <TouchableOpacity
                  key={menu.id}
                  style={[
                    styles.menuCard,
                    {
                      backgroundColor: theme.cardBg,
                      borderColor: theme.borderColor,
                    },
                  ]}
                  onPress={() => {
                    if (menu.route) {
                      router.push(menu.route as any);
                    } else if (menu.tabKey) {
                      setActiveTab(menu.tabKey);
                    }
                  }}
                  activeOpacity={0.7}
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
                      <Text
                        style={[styles.menuTitle, { color: theme.textPrimary }]}
                      >
                        {menu.title}
                      </Text>
                      <View
                        style={[
                          styles.tagBadge,
                          { backgroundColor: menu.badgeBg },
                        ]}
                      >
                        <Text
                          style={[styles.tagText, { color: menu.accentColor }]}
                        >
                          {menu.tag}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.menuSubtitle,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {menu.subtitle}
                    </Text>
                    <Text
                      style={[
                        styles.menuDescription,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {menu.description}
                    </Text>
                  </View>

                  <View style={styles.menuChevron}>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={theme.textSecondary}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {activeTab === "items" && searchQuery.length === 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Katalog Data Barang
              </Text>
              <Text
                style={[styles.sectionSubtitle, { color: theme.textSecondary }]}
              >
                Total {barangList.length} Barang Terdaftar
              </Text>
            </View>

            {barangList.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.searchCard,
                  {
                    backgroundColor: theme.cardBg,
                    borderColor: theme.borderColor,
                    marginBottom: 10,
                  },
                ]}
              >
                {item.foto && (
                  <Image
                    source={{ uri: item.foto }}
                    style={{
                      width: 45,
                      height: 45,
                      borderRadius: 8,
                      marginRight: 10,
                    }}
                  />
                )}
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.searchCardTitle,
                      { color: theme.textPrimary },
                    ]}
                  >
                    {item.nama}
                  </Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                    SKU: {item.sku} | Kategori: {item.kategori}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text
                    style={{
                      color: item.stok < 5 ? "#EF4444" : "#4F46E5",
                      fontWeight: "bold",
                    }}
                  >
                    {item.stok < 5
                      ? `Stok Menipis: ${item.stok}`
                      : `Stok: ${item.stok}`}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === "history" && searchQuery.length === 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Riwayat Aktivitas & Peminjaman
              </Text>
              <Text
                style={[styles.sectionSubtitle, { color: theme.textSecondary }]}
              >
                Log peminjaman dan mutasi aset
              </Text>
            </View>

            {[
              {
                id: "h1",
                user: "Rian",
                item: "Laptop Asus ROG",
                date: "Hari ini, 10:30",
                status: "Dipinjam",
                color: "#F59E0B",
              },
              {
                id: "h2",
                user: "Siti",
                item: "Proyektor Epson",
                date: "Kemarin, 14:15",
                status: "Dikembalikan",
                color: "#10B981",
              },
              {
                id: "h3",
                user: "Budi",
                item: "Kabel HDMI 10m",
                date: "20 Okt 2026",
                status: "Dikembalikan",
                color: "#10B981",
              },
            ].map((log) => (
              <View
                key={log.id}
                style={[
                  styles.searchCard,
                  {
                    backgroundColor: theme.cardBg,
                    borderColor: theme.borderColor,
                    marginBottom: 10,
                  },
                ]}
              >
                <Ionicons
                  name="time-outline"
                  size={24}
                  color={theme.textSecondary}
                  style={{ marginRight: 12 }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.searchCardTitle,
                      { color: theme.textPrimary },
                    ]}
                  >
                    {log.item}
                  </Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                    Peminjam: {log.user} ({log.date})
                  </Text>
                </View>
                <Text
                  style={{ color: log.color, fontWeight: "bold", fontSize: 12 }}
                >
                  {log.status}
                </Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === "tracking" && searchQuery.length === 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Pelacakan Posisi & Audit Aset
              </Text>
              <Text
                style={[styles.sectionSubtitle, { color: theme.textSecondary }]}
              >
                Monitoring lokasi fisik barang yang dipinjam & tersimpan
              </Text>
            </View>

            {[
              {
                id: "t1",
                sku: "SKU-1001",
                nama: "Laptop Asus ROG",
                lokasi: "Lab Komputer 3",
                status: "Dipinjam",
              },
              {
                id: "t2",
                sku: "SKU-1002",
                nama: "Proyektor Epson",
                lokasi: "Ruang Rapat Utama",
                status: "Dipinjam",
              },
              {
                id: "t3",
                sku: "SKU-1003",
                nama: "Kabel HDMI 10m",
                lokasi: "Gudang Utama - Rak A2",
                status: "Tersedia",
              },
            ].map((track) => (
              <View
                key={track.id}
                style={[
                  styles.searchCard,
                  {
                    backgroundColor: theme.cardBg,
                    borderColor: theme.borderColor,
                    marginBottom: 12,
                  },
                ]}
              >
                <Ionicons
                  name="location-outline"
                  size={24}
                  color={track.status === "Dipinjam" ? "#F59E0B" : "#10B981"}
                  style={{ marginRight: 12 }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.searchCardTitle,
                      { color: theme.textPrimary },
                    ]}
                  >
                    {track.nama}
                  </Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                    {track.sku} | 📍 Lokasi:{" "}
                    <Text
                      style={{ fontWeight: "bold", color: theme.textPrimary }}
                    >
                      {track.lokasi}
                    </Text>
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Navigation Tabs di Bagian Bawah */}
      <View
        style={[
          styles.bottomTabBar,
          { backgroundColor: theme.cardBg, borderTopColor: theme.borderColor },
        ]}
      >
        {[
          { key: "home", label: "Beranda", icon: "home-outline" },
          { key: "items", label: "Barang", icon: "cube-outline" },
          { key: "history", label: "Riwayat", icon: "time-outline" },
          { key: "tracking", label: "Lacak", icon: "location-outline" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon as any}
              size={22}
              color={activeTab === tab.key ? "#4F46E5" : theme.textSecondary}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color:
                    activeTab === tab.key ? "#4F46E5" : theme.textSecondary,
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* MODAL POP-UP ERROR / OFFLINE */}
      <Modal
        visible={!!errorMessage && !isLoadingApi}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.blurOverlay}>
          <View
            style={[
              styles.centeredErrorCard,
              { backgroundColor: theme.cardBg, borderColor: theme.borderColor },
            ]}
          >
            <Ionicons name="alert-circle-outline" size={44} color="#EF4444" />
            <Text
              style={[styles.centeredErrorTitle, { color: theme.textPrimary }]}
            >
              Gagal Mengambil Data
            </Text>
            <Text
              style={[styles.centeredErrorText, { color: theme.textSecondary }]}
            >
              {errorMessage}
            </Text>
            <View style={styles.modalErrorActions}>
              <TouchableOpacity
                style={styles.closeErrorBtn}
                onPress={() => setErrorMessage(null)}
              >
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontWeight: "600",
                    fontSize: 13,
                  }}
                >
                  Tutup
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.centeredRetryBtn}
                onPress={fetchApiData}
              >
                <Ionicons name="refresh-outline" size={16} color="#FFFFFF" />
                <Text style={styles.centeredRetryText}>Coba Lagi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Scanner QR Kamera */}
      <Modal visible={isScannerVisible} animationType="slide">
        <View style={styles.scannerContainer}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          />
          <View style={styles.scannerOverlay}>
            <View style={styles.scanFrame} />
            <Text style={styles.scanInstructions}>
              Arahkan kamera ke Kode QR Barang
            </Text>
            <TouchableOpacity
              style={styles.closeScannerBtn}
              onPress={() => setIsScannerVisible(false)}
            >
              <Text style={styles.closeScannerText}>Tutup Scanner</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Tambah Barang (+) */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.cardBg }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                Tambah Barang Baru
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerBackground: { paddingHorizontal: 16, paddingBottom: 20 },
  topNavbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  brandRow: { flexDirection: "row", alignItems: "center" },
  headerLogoContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  brandName: { color: "#FFFFFF", fontSize: 20, fontWeight: "bold" },
  brandTagline: { color: "rgba(255,255,255,0.8)", fontSize: 12 },
  topActions: { flexDirection: "row", alignItems: "center" },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  heroContent: { marginTop: 4 },
  heroGreeting: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },
  heroDescription: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  quickBar: { flexDirection: "row", alignItems: "center" },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    marginRight: 10,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 13 },
  scanButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -10,
  },
  scrollContent: { padding: 16, paddingBottom: 80 },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  emptyBox: {
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  searchCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  searchCardTitle: { fontSize: 14, fontWeight: "bold", marginBottom: 2 },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "bold" },
  sectionSubtitle: { fontSize: 12, marginTop: 2 },
  statsGrid: { flexDirection: "row", justifyContent: "space-between" },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
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
    fontSize: 10,
    fontWeight: "bold",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statValue: { fontSize: 18, fontWeight: "bold" },
  statTitle: { fontSize: 11, marginBottom: 8 },
  statTrendRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 6,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  statTrendText: { fontSize: 9, marginLeft: 4 },
  menuContainer: { marginTop: 8 },
  menuCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuContent: { flex: 1 },
  menuTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  menuTitle: { fontSize: 15, fontWeight: "bold" },
  tagBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  tagText: { fontSize: 10, fontWeight: "bold" },
  menuSubtitle: { fontSize: 12, fontWeight: "600", marginBottom: 4 },
  menuDescription: { fontSize: 11, lineHeight: 15 },
  menuChevron: { marginLeft: 8 },
  bottomTabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabItem: { alignItems: "center" },
  tabLabel: { fontSize: 10, marginTop: 4, fontWeight: "600" },
  blurOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  centeredErrorCard: {
    width: "100%",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  centeredErrorTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 6,
  },
  centeredErrorText: { fontSize: 13, textAlign: "center", marginBottom: 16 },
  modalErrorActions: { flexDirection: "row", alignItems: "center" },
  closeErrorBtn: { paddingHorizontal: 16, paddingVertical: 10, marginRight: 8 },
  centeredRetryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4F46E5",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  centeredRetryText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 13,
    marginLeft: 6,
  },
  scannerContainer: { flex: 1, backgroundColor: "#000000" },
  scannerOverlay: { flex: 1, justifyContent: "center", alignItems: "center" },
  scanFrame: {
    width: 220,
    height: 220,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    borderRadius: 16,
  },
  scanInstructions: { color: "#FFFFFF", marginTop: 20, fontSize: 14 },
  closeScannerBtn: {
    marginTop: 30,
    backgroundColor: "#EF4444",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  closeScannerText: { color: "#FFFFFF", fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
});
