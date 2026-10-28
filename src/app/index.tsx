import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";

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

interface DashboardStats {
  totalItems: number;
  borrowedItems: number;
  damagedItems: number;
}

export default function IndexScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState("home");
  const [userEmail, setUserEmail] = useState("");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [barangList, setBarangList] = useState<InventoryItem[]>([]);
  const [isLoadingApi, setIsLoadingApi] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statsData, setStatsData] = useState<DashboardStats>({
    totalItems: 0,
    borrowedItems: 86,
    damagedItems: 12,
  });

  // State Form Tambah Barang & Foto
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [namaBarangInput, setNamaBarangInput] = useState("");
  const [skuInput, setSkuInput] = useState("");
  const [kategoriInput, setKategoriInput] = useState("");
  const [stokInput, setStokInput] = useState("");
  const [fotoBarang, setFotoBarang] = useState<string | null>(null);

  // State Modal Scanner QR Kamera
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraStatus, requestCameraPermission] = ImagePicker.useCameraPermissions();

  const API_URL = "https://api.presidentku.id/programs";

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

  const fetchApiData = async () => {
    try {
      setIsLoadingApi(true);
      setErrorMessage(null);

      const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (response.ok) {
        const json = await response.json();
        const mappedItems: InventoryItem[] = json.map((item: any, index: number) => ({
          id: String(item.id || index + 1),
          sku: `SKU-${1000 + (item.id || index + 1)}`,
          nama: item.title ? item.title.substring(0, 30) : "Aset Inventaris",
          kategori: index % 2 === 0 ? "Elektronik" : "Fasilitas",
          stok: ((index * 7) % 25) + 1,
        }));

        setBarangList(mappedItems);
        setStatsData({
          totalItems: mappedItems.reduce((acc, curr) => acc + curr.stok, 1000),
          borrowedItems: 86,
          damagedItems: 12,
        });
      } else if (response.status >= 400 && response.status < 500) {
        throw new Error(`Data tidak ditemukan (Error ${response.status}).`);
      } else if (response.status >= 500) {
        throw new Error(`Terjadi kesalahan pada server (Error ${response.status}).`);
      } else {
        throw new Error(`Gagal memuat data (HTTP ${response.status}).`);
      }
    } catch (error: any) {
      if (error.message.includes("Network request failed")) {
        setErrorMessage("Tidak ada koneksi internet. Periksa koneksi Anda dan coba lagi.");
      } else {
        setErrorMessage(error.message || "Gagal mengambil data dari server.");
      }
      useMockFallback();
    } finally {
      setIsLoadingApi(false);
    }
  };

  const useMockFallback = () => {
    const fallbackData = [
      { id: "1", sku: "SKU-1001", nama: "Laptop Asus ROG", kategori: "Elektronik", stok: 5 },
      { id: "2", sku: "SKU-1002", nama: "Proyektor Epson", kategori: "Elektronik", stok: 3 },
      { id: "3", sku: "SKU-1003", nama: "Kabel HDMI 10m", kategori: "Aksesori", stok: 12 },
      { id: "4", sku: "SKU-1004", nama: "Kursi Kerja Ergonomis", kategori: "Fasilitas", stok: 8 },
    ];
    setBarangList(fallbackData);
    setStatsData({ totalItems: 1400, borrowedItems: 86, damagedItems: 12 });
  };

  useEffect(() => {
    if (isLoggedIn) fetchApiData();
  }, [isLoggedIn]);

  const toggleTheme = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, newMode ? "dark" : "light");
  };

  const processLogout = async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, "false");
    setIsLoggedIn(false);
    router.push("/login");
  };

  const handleKembaliNavigasi = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push("/login");
    }
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Apakah Anda yakin ingin keluar dari InvenGo?")) processLogout();
    } else {
      Alert.alert("Konfirmasi Logout", "Apakah Anda yakin ingin keluar?", [
        { text: "Batal", style: "cancel" },
        { text: "Keluar", style: "destructive", onPress: processLogout },
      ]);
    }
  };

  // === FUNGSI KAMERA DI HEADER ATAS ===
  const handleHeaderCamera = async () => {
    if (!cameraStatus?.granted) {
      const permissionResult = await requestCameraPermission();
      if (!permissionResult.granted) {
        const msg = "Aplikasi memerlukan izin akses kamera untuk mengambil foto aset.";
        Platform.OS === "web" ? alert(msg) : Alert.alert("Izin Kamera Ditolak", msg);
        return;
      }
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setFotoBarang(result.assets[0].uri);
      const successMsg = "Foto berhasil diambil dari kamera!";
      Platform.OS === "web" ? alert(successMsg) : Alert.alert("Sukses", successMsg);
    }
  };

  const handlePickImageFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      const msg = "Izin akses galeri foto diperlukan untuk memilih gambar barang.";
      Platform.OS === "web" ? alert(msg) : Alert.alert("Izin Ditolak", msg);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setFotoBarang(result.assets[0].uri);
    }
  };

  const handleOpenScanner = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        const msg = "Izin kamera diperlukan untuk fitur Pemindai QR.";
        Platform.OS === "web" ? alert(msg) : Alert.alert("Izin Ditolak", msg);
        return;
      }
    }
    setScanned(false);
    setIsScannerVisible(true);
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setIsScannerVisible(false);
    setSearchQuery(data);
    const msg = `Hasil Scan QR: "${data}". Data dimasukkan ke pencarian.`;
    Platform.OS === "web" ? alert(msg) : Alert.alert("Scan Berhasil", msg);
  };

  const handleSimpanBarang = () => {
    if (!namaBarangInput.trim() || !skuInput.trim() || !stokInput.trim()) {
      const msg = "Harap isi Nama Barang, SKU, dan Stok!";
      Platform.OS === "web" ? alert(msg) : Alert.alert("Peringatan", msg);
      return;
    }

    const newItem: InventoryItem = {
      id: String(Date.now()),
      sku: skuInput.toUpperCase(),
      nama: namaBarangInput,
      kategori: kategoriInput || "Umum",
      stok: parseInt(stokInput, 10) || 0,
      foto: fotoBarang,
    };

    setBarangList([newItem, ...barangList]);
    setIsModalVisible(false);

    setNamaBarangInput("");
    setSkuInput("");
    setKategoriInput("");
    setStokInput("");
    setFotoBarang(null);

    const successMsg = "Barang berhasil ditambahkan!";
    Platform.OS === "web" ? alert(successMsg) : Alert.alert("Sukses", successMsg);
  };

  const filteredBarang = barangList.filter(
    (item) =>
      item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kategori.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoggedIn === null) {
    return (
      <View style={[styles.loadingContainer, isDarkMode && { backgroundColor: "#0F172A" }]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  if (!isLoggedIn) return null;

  const theme = {
    bg: isDarkMode ? "#0F172A" : "#F8FAFC",
    headerBg: isDarkMode ? "#1E293B" : "#3730A3",
    cardBg: isDarkMode ? "#1E293B" : "#FFFFFF",
    textPrimary: isDarkMode ? "#F8FAFC" : "#0F172A",
    textSecondary: isDarkMode ? "#94A3B8" : "#64748B",
    borderColor: isDarkMode ? "#334155" : "#E2E8F0",
    inputBg: isDarkMode ? "#0F172A" : "#FFFFFF",
  };

  const stats = [
    {
      id: "1",
      title: "Total Barang",
      value: isLoadingApi ? "..." : statsData.totalItems.toLocaleString("id-ID"),
      unit: "Item",
      icon: "cube-outline",
      color: "#4F46E5",
      bgColor: isDarkMode ? "#312E81" : "#EEF2FF",
      trend: "+12 item baru",
    },
    {
      id: "2",
      title: "Dipinjam",
      value: String(statsData.borrowedItems),
      unit: "Aktif",
      icon: "sync-outline",
      color: "#F59E0B",
      bgColor: isDarkMode ? "#78350F" : "#FEF3C7",
      trend: "6 kembali hari ini",
    },
    {
      id: "3",
      title: "Rusak / Hilang",
      value: String(statsData.damagedItems),
      unit: "Kasus",
      icon: "alert-circle-outline",
      color: "#EF4444",
      bgColor: isDarkMode ? "#7F1D1D" : "#FEE2E2",
      trend: "2 pending audit",
    },
  ];

  const mainMenus = [
    {
      id: "daftar-barang",
      title: "Daftar Barang",
      subtitle: "Katalog & Stok Fisik",
      description: "Pantau ketersediaan barang, tambah aset baru, spesifikasi, dan manajemen kategori.",
      iconName: "archive-outline",
      tag: "Katalog",
      accentColor: "#4F46E5",
      badgeBg: isDarkMode ? "#312E81" : "#EEF2FF",
      tabKey: "items",
    },
    {
      id: "transaksi-peminjaman",
      title: "Transaksi Peminjaman",
      subtitle: "Sirkulasi & Peminjaman",
      description: "Catat formulir peminjaman, persetujuan staf, riwayat mutasi, dan tenggat pengembalian.",
      iconName: "swap-horizontal-outline",
      tag: "Sirkulasi",
      accentColor: "#0EA5E9",
      badgeBg: isDarkMode ? "#075985" : "#E0F2FE",
      tabKey: "history",
    },
    {
      id: "pelacakan-laporan",
      title: "Pelacakan & Laporan",
      subtitle: "Audit & Analitik",
      description: "Lacak posisi aset via barcode/QR, ringkasan stok opname bulanan, dan ekspor laporan.",
      iconName: "analytics-outline",
      tag: "Analitik",
      accentColor: "#10B981",
      badgeBg: isDarkMode ? "#065F46" : "#D1FAE5",
      tabKey: "tracking",
    },
  ];

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.headerBg }]}>
      <ExpoStatusBar style="light" />

      {/* Header Utama */}
      <View style={[styles.headerBackground, { backgroundColor: theme.headerBg, paddingTop: Math.max(insets.top, 10) }]}>
        <View style={styles.topNavbar}>
          <View style={styles.brandRow}>
            <View style={styles.headerLogoContainer}>
              <MaterialCommunityIcons name="cube-scan" size={26} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.brandName}>InvenGo</Text>
              <Text style={styles.brandTagline}>{userEmail || "Inventory Master System"}</Text>
            </View>
          </View>

          <View style={styles.topActions}>
            {/* TOMBOL KAMERA HEADER */}
            <TouchableOpacity style={styles.iconButton} onPress={handleHeaderCamera} activeOpacity={0.7}>
              <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton} onPress={toggleTheme} activeOpacity={0.7}>
              <Ionicons name={isDarkMode ? "sunny" : "moon"} size={20} color="#FFD700" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.profileButton} onPress={handleLogout} activeOpacity={0.7}>
              <Feather name="log-out" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.heroContent}>
          <Text style={styles.heroGreeting}>Kelola Aset Lebih Cepat & Akurat 📦</Text>
          <Text style={styles.heroDescription}>
            Sistem terpadu manajemen inventaris untuk memonitor siklus aset, peminjaman, serta pelacakan kondisi secara real-time.
          </Text>

          <View style={styles.quickBar}>
            <View style={[styles.searchInputContainer, { backgroundColor: theme.inputBg }]}>
              <Ionicons name="search" size={18} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.textPrimary }]}
                placeholder="Cari kode SKU, nama barang, kategori..."
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")} activeOpacity={0.7}>
                  <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={styles.scanButton} onPress={handleOpenScanner} activeOpacity={0.7}>
              <Ionicons name="qr-code-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Konten Utama */}
      <ScrollView style={[styles.scrollContainer, { backgroundColor: theme.bg }]} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {isLoadingApi && (
          <View style={[styles.statusBanner, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={{ color: theme.textPrimary, marginLeft: 10, fontSize: 13 }}>
              Memuat data... Mohon tunggu sebentar.
            </Text>
          </View>
        )}

        {searchQuery.length > 0 ? (
          <View style={{ marginBottom: 20 }}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginBottom: 12 }]}>
              Hasil Pencarian ({filteredBarang.length})
            </Text>

            {filteredBarang.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
                <Text style={{ color: theme.textSecondary }}>Barang atau SKU tidak ditemukan.</Text>
              </View>
            ) : (
              filteredBarang.map((item) => (
                <View key={item.id} style={[styles.searchCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
                  {item.foto && <Image source={{ uri: item.foto }} style={{ width: 45, height: 45, borderRadius: 8, marginRight: 10 }} />}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.searchCardTitle, { color: theme.textPrimary }]}>{item.nama}</Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                      {item.sku} | {item.kategori}
                    </Text>
                  </View>
                  <Text style={{ color: item.stok < 5 ? "#EF4444" : "#4F46E5", fontWeight: "bold" }}>
                    {item.stok < 5 ? `Stok Menipis: ${item.stok}` : `Stok: ${item.stok}`}
                  </Text>
                </View>
              ))
            )}
          </View>
        ) : null}

        {activeTab === "home" && searchQuery.length === 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Ringkasan Inventaris</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Data Ringkasan System InvenGo</Text>
            </View>

            <View style={styles.statsGrid}>
              {stats.map((item) => (
                <View key={item.id} style={[styles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
                  <View style={styles.statTopRow}>
                    <View style={[styles.statIconWrapper, { backgroundColor: item.bgColor }]}>
                      <Ionicons name={item.icon as any} size={22} color={item.color} />
                    </View>
                    <Text style={[styles.statUnit, { color: item.color, backgroundColor: item.bgColor }]}>{item.unit}</Text>
                  </View>
                  <Text style={[styles.statValue, { color: theme.textPrimary }]}>{item.value}</Text>
                  <Text style={[styles.statTitle, { color: theme.textSecondary }]}>{item.title}</Text>
                  <View style={[styles.statTrendRow, { borderTopColor: theme.borderColor }]}>
                    <Feather name="info" size={11} color={theme.textSecondary} />
                    <Text style={[styles.statTrendText, { color: theme.textSecondary }]} numberOfLines={1}>{item.trend}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Menu Utama</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Navigasi fungsional InvenGo</Text>
            </View>

            <View style={styles.menuContainer}>
              {mainMenus.map((menu) => (
                <TouchableOpacity key={menu.id} style={[styles.menuCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]} onPress={() => setActiveTab(menu.tabKey)} activeOpacity={0.7}>
                  <View style={[styles.menuIconContainer, { backgroundColor: menu.badgeBg }]}>
                    <Ionicons name={menu.iconName as any} size={28} color={menu.accentColor} />
                  </View>

                  <View style={styles.menuContent}>
                    <View style={styles.menuTitleRow}>
                      <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>{menu.title}</Text>
                      <View style={[styles.tagBadge, { backgroundColor: menu.badgeBg }]}>
                        <Text style={[styles.tagText, { color: menu.accentColor }]}>{menu.tag}</Text>
                      </View>
                    </View>
                    <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>{menu.subtitle}</Text>
                    <Text style={[styles.menuDescription, { color: theme.textSecondary }]}>{menu.description}</Text>
                  </View>

                  <View style={styles.menuChevron}>
                    <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {activeTab === "items" && searchQuery.length === 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Katalog Data Barang</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Total {barangList.length} Barang Terdaftar</Text>
            </View>

            {barangList.map((item) => (
              <View key={item.id} style={[styles.searchCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor, marginBottom: 10 }]}>
                {item.foto && <Image source={{ uri: item.foto }} style={{ width: 45, height: 45, borderRadius: 8, marginRight: 10 }} />}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.searchCardTitle, { color: theme.textPrimary }]}>{item.nama}</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                    SKU: {item.sku} | Kategori: {item.kategori}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ color: item.stok < 5 ? "#EF4444" : "#4F46E5", fontWeight: "bold" }}>
                    {item.stok < 5 ? `Stok Menipis: ${item.stok}` : `Stok: ${item.stok}`}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === "history" && searchQuery.length === 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Riwayat Aktivitas & Peminjaman</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Log peminjaman dan mutasi aset</Text>
            </View>

            {[
              { id: "h1", user: "Rian", item: "Laptop Asus ROG", date: "Hari ini, 10:30", status: "Dipinjam", color: "#F59E0B" },
              { id: "h2", user: "Siti", item: "Proyektor Epson", date: "Kemarin, 14:15", status: "Dikembalikan", color: "#10B981" },
              { id: "h3", user: "Budi", item: "Kabel HDMI 10m", date: "20 Okt 2026", status: "Dikembalikan", color: "#10B981" },
            ].map((log) => (
              <View key={log.id} style={[styles.searchCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor, marginBottom: 10 }]}>
                <Ionicons name="time-outline" size={24} color={theme.textSecondary} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.searchCardTitle, { color: theme.textPrimary }]}>{log.item}</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Peminjam: {log.user} ({log.date})</Text>
                </View>
                <Text style={{ color: log.color, fontWeight: "bold", fontSize: 12 }}>{log.status}</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === "settings" && searchQuery.length === 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Pengaturan Sistem</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Kelola akun dan preferensi aplikasi</Text>
            </View>

            <TouchableOpacity style={[styles.searchCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor, marginBottom: 10 }]} onPress={toggleTheme}>
              <Ionicons name={isDarkMode ? "sunny-outline" : "moon-outline"} size={22} color={theme.textPrimary} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.searchCardTitle, { color: theme.textPrimary }]}>Mode Tampilan</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{isDarkMode ? "Gelap (Dark)" : "Terang (Light)"}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.searchCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor, marginBottom: 10 }]} onPress={handleKembaliNavigasi}>
              <Ionicons name="arrow-back-outline" size={20} color={theme.textPrimary} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.searchCardTitle, { color: theme.textPrimary }]}>Kembali (Expo Router Back)</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Uji coba fungsi router.back()</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.searchCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor, marginBottom: 10 }]} onPress={handleLogout}>
              <Feather name="log-out" size={20} color="#EF4444" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.searchCardTitle, { color: "#EF4444" }]}>Keluar dari Akun</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{userEmail}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {activeTab === "tracking" && searchQuery.length === 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Pelacakan Posisi & Audit Aset</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Monitoring lokasi fisik barang yang dipinjam & tersimpan</Text>
            </View>

            {[
              { id: "t1", sku: "SKU-1001", nama: "Laptop Asus ROG", lokasi: "Lab Komputer 3", peminjam: "Ahmad", status: "Dipinjam" },
              { id: "t2", sku: "SKU-1002", nama: "Proyektor Epson", lokasi: "Ruang Rapat Utama", peminjam: "Budi", status: "Dipinjam" },
              { id: "t3", sku: "SKU-1003", nama: "Kabel HDMI 10m", lokasi: "Gudang Utama - Rak A2", peminjam: "-", status: "Tersedia" },
            ].map((track) => (
              <View key={track.id} style={[styles.searchCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor, marginBottom: 12 }]}>
                <Ionicons name="location-outline" size={24} color={track.status === "Dipinjam" ? "#F59E0B" : "#10B981"} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.searchCardTitle, { color: theme.textPrimary }]}>{track.nama}</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                    {track.sku} | 📍 Lokasi: <Text style={{ fontWeight: "bold", color: theme.textPrimary }}>{track.lokasi}</Text>
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* MODAL POP-UP ERROR / OFFLINE */}
      <Modal visible={!!errorMessage && !isLoadingApi} transparent={true} animationType="fade">
        <View style={styles.blurOverlay}>
          <View style={[styles.centeredErrorCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
            <Ionicons name="alert-circle-outline" size={44} color="#EF4444" />
            <Text style={[styles.centeredErrorTitle, { color: theme.textPrimary }]}>Gagal Mengambil Data</Text>
            <Text style={[styles.centeredErrorText, { color: theme.textSecondary }]}>{errorMessage}</Text>
            <View style={styles.modalErrorActions}>
              <TouchableOpacity style={styles.closeErrorBtn} onPress={() => setErrorMessage(null)}>
                <Text style={{ color: theme.textSecondary, fontWeight: "600", fontSize: 13 }}>Tutup</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.centeredRetryBtn} onPress={fetchApiData}>
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
          <CameraView style={StyleSheet.absoluteFill} facing="back" onBarcodeScanned={scanned ? undefined : handleBarCodeScanned} />
          <View style={styles.scannerOverlay}>
            <View style={styles.scanFrame} />
            <Text style={styles.scanInstructions}>Arahkan kamera ke Kode QR Barang</Text>
            <TouchableOpacity style={styles.closeScannerBtn} onPress={() => setIsScannerVisible(false)}>
              <Text style={styles.closeScannerText}>Tutup Scanner</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Tambah Barang (+) */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Tambah Barang Baru</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Form Input Foto */}
            <View style={{ marginBottom: 12, alignItems: "center" }}>
              {fotoBarang ? (
                <Image source={{ uri: fotoBarang }} style={styles.imagePreview} />
              ) : (
                <View style={[styles.imagePlaceholder, { borderColor: theme.borderColor }]}>
                  <Ionicons name="image-outline" size={32} color={theme.textSecondary} />
                  <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 4 }}>Belum ada foto</Text>
                </View>
              )}

              <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                <TouchableOpacity style={styles.uploadBtn} onPress={handlePickImageFromGallery}>
                  <Ionicons name="images-outline" size={16} color="#4F46E5" />
                  <Text style={styles.uploadBtnText}>Dari Galeri</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.uploadBtn} onPress={handleHeaderCamera}>
                  <Ionicons name="camera-outline" size={16} color="#4F46E5" />
                  <Text style={styles.uploadBtnText}>Ambil Foto</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TextInput
              style={[styles.modalInput, { color: theme.textPrimary, borderColor: theme.borderColor }]}
              placeholder="Nama Barang"
              placeholderTextColor={theme.textSecondary}
              value={namaBarangInput}
              onChangeText={setNamaBarangInput}
            />
            <TextInput
              style={[styles.modalInput, { color: theme.textPrimary, borderColor: theme.borderColor }]}
              placeholder="SKU (contoh: SKU-9999)"
              placeholderTextColor={theme.textSecondary}
              value={skuInput}
              onChangeText={setSkuInput}
            />
            <TextInput
              style={[styles.modalInput, { color: theme.textPrimary, borderColor: theme.borderColor }]}
              placeholder="Kategori (contoh: Elektronik)"
              placeholderTextColor={theme.textSecondary}
              value={kategoriInput}
              onChangeText={setKategoriInput}
            />
            <TextInput
              style={[styles.modalInput, { color: theme.textPrimary, borderColor: theme.borderColor }]}
              placeholder="Stok Barang"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              value={stokInput}
              onChangeText={setStokInput}
            />

            <TouchableOpacity style={styles.simpanBtn} onPress={handleSimpanBarang}>
              <Text style={{ color: "#FFFFFF", fontWeight: "bold" }}>Simpan Barang</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom Nav */}
      <View style={[styles.bottomNav, { backgroundColor: theme.cardBg, borderTopColor: theme.borderColor }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab("home")}>
          <Ionicons name="home-outline" size={20} color={activeTab === "home" ? "#4F46E5" : theme.textSecondary} />
          <Text style={[styles.navText, { color: activeTab === "home" ? "#4F46E5" : theme.textSecondary }]}>Beranda</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab("items")}>
          <Ionicons name="cube-outline" size={20} color={activeTab === "items" ? "#4F46E5" : theme.textSecondary} />
          <Text style={[styles.navText, { color: activeTab === "items" ? "#4F46E5" : theme.textSecondary }]}>Barang</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton} onPress={() => setIsModalVisible(true)}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab("history")}>
          <Ionicons name="time-outline" size={20} color={activeTab === "history" ? "#4F46E5" : theme.textSecondary} />
          <Text style={[styles.navText, { color: activeTab === "history" ? "#4F46E5" : theme.textSecondary }]}>Riwayat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab("settings")}>
          <Ionicons name="settings-outline" size={20} color={activeTab === "settings" ? "#4F46E5" : theme.textSecondary} />
          <Text style={[styles.navText, { color: activeTab === "settings" ? "#4F46E5" : theme.textSecondary }]}>Pengaturan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#3730A3" },
  headerBackground: { paddingHorizontal: 16, paddingBottom: 16 },
  topNavbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerLogoContainer: { backgroundColor: "rgba(255,255,255,0.2)", padding: 6, borderRadius: 10 },
  brandName: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },
  brandTagline: { color: "rgba(255,255,255,0.7)", fontSize: 11 },
  topActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconButton: { padding: 8, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 10 },
  profileButton: { padding: 8, backgroundColor: "rgba(239,68,68,0.15)", borderRadius: 10 },
  heroContent: { marginTop: 4 },
  heroGreeting: { color: "#FFFFFF", fontSize: 15, fontWeight: "bold" },
  heroDescription: { color: "rgba(255,255,255,0.8)", fontSize: 11, marginTop: 2, marginBottom: 10 },
  quickBar: { flexDirection: "row", gap: 8 },
  searchInputContainer: { flex: 1, flexDirection: "row", alignItems: "center", borderRadius: 10, paddingHorizontal: 10, height: 40 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 12 },
  scanButton: { backgroundColor: "#4F46E5", width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  scrollContainer: { flex: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  scrollContent: { padding: 16, paddingBottom: 90 },
  statusBanner: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 16 },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "bold" },
  sectionSubtitle: { fontSize: 11, marginTop: 1 },
  statsGrid: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1 },
  statTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statIconWrapper: { padding: 6, borderRadius: 8 },
  statUnit: { fontSize: 9, fontWeight: "bold", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  statValue: { fontSize: 16, fontWeight: "bold", marginTop: 8 },
  statTitle: { fontSize: 10, marginTop: 2 },
  statTrendRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8, paddingTop: 6, borderTopWidth: 1 },
  statTrendText: { fontSize: 9, },
  menuContainer: { gap: 10 },
  menuCard: { flexDirection: "row", padding: 12, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  menuIconContainer: { padding: 10, borderRadius: 10, marginRight: 12 },
  menuContent: { flex: 1 },
  menuTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  menuTitle: { fontSize: 13, fontWeight: "bold" },
  tagBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  tagText: { fontSize: 9, fontWeight: "bold" },
  menuSubtitle: { fontSize: 10, marginTop: 1 },
  menuDescription: { fontSize: 10, marginTop: 4 },
  menuChevron: { marginLeft: 6 },
  searchCard: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 10, borderWidth: 1 },
  searchCardTitle: { fontSize: 13, fontWeight: "bold" },
  emptyBox: { padding: 20, alignItems: "center", borderRadius: 10, borderWidth: 1 },
  blurOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 20 },
  centeredErrorCard: { width: "100%", padding: 20, borderRadius: 16, borderWidth: 1, alignItems: "center" },
  centeredErrorTitle: { fontSize: 16, fontWeight: "bold", marginTop: 10 },
  centeredErrorText: { fontSize: 12, textAlign: "center", marginTop: 6 },
  modalErrorActions: { flexDirection: "row", gap: 12, marginTop: 16 },
  closeErrorBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  centeredRetryBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#EF4444", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, gap: 6 },
  centeredRetryText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 12 },
  scannerContainer: { flex: 1, backgroundColor: "#000000" },
  scannerOverlay: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20, backgroundColor: "rgba(0,0,0,0.4)" },
  scanFrame: { width: 240, height: 240, borderWidth: 2, borderColor: "#4F46E5", borderRadius: 16 },
  scanInstructions: { color: "#FFFFFF", fontSize: 13, marginTop: 20, fontWeight: "500" },
  closeScannerBtn: { marginTop: 30, backgroundColor: "#EF4444", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  closeScannerText: { color: "#FFFFFF", fontWeight: "bold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 16, fontWeight: "bold" },
  modalInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, marginBottom: 10 },
  simpanBtn: { backgroundColor: "#4F46E5", paddingVertical: 12, borderRadius: 10, alignItems: "center", marginTop: 6 },
  imagePreview: { width: 80, height: 80, borderRadius: 12 },
  imagePlaceholder: { width: 80, height: 80, borderRadius: 12, borderWidth: 1.5, borderStyle: "dashed", justifyContent: "center", alignItems: "center" },
  uploadBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(79, 70, 229, 0.1)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
  uploadBtnText: { color: "#4F46E5", fontSize: 11, fontWeight: "600" },
  bottomNav: { position: "absolute", bottom: 0, left: 0, right: 0, height: 65, flexDirection: "row", justifyContent: "space-around", alignItems: "center", borderTopWidth: 1 },
  navItem: { alignItems: "center", flex: 1 },
  navText: { fontSize: 10, marginTop: 2 },
  addButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#4F46E5", justifyContent: "center", alignItems: "center", marginTop: -25, elevation: 4 },
});